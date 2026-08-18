"use client"

import React, { useState, useEffect, useRef, forwardRef, useMemo } from 'react'
import HTMLFlipBook from 'react-pageflip'
// pdfjs-dist is loaded dynamically to avoid SSR "Unexpected token 'export'" error
import { 
  Loader2, ChevronLeft, ChevronRight, X, Check, HelpCircle,
  Play, Pause, Volume2, VolumeX, Music, Headphones, StopCircle
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { libraryApi } from '@/lib/api'
import { cn } from '@/lib/utils'

// Subcomponents & Hooks
import { Annotation, AnnotationRect } from './flipbook/types'
import { useAnnotationEngine } from './flipbook/hooks/useAnnotationEngine'
import { FloatingDock } from './flipbook/FloatingDock'
import { SelectionLayer } from './flipbook/SelectionLayer'
import { AnnotationLayer } from './flipbook/AnnotationLayer'
import { AnnotationSidebar } from './flipbook/AnnotationSidebar'
import { FlipBookQuiz } from './FlipBookQuiz'


// Worker is configured dynamically at load time

const PAGE_RENDER_WINDOW = 4
const PDF_RANGE_CHUNK_SIZE = 256 * 1024

const getPageRenderWindow = (pageIndex: number, totalPages: number) => {
  const maxStart = Math.max(totalPages - PAGE_RENDER_WINDOW, 0)
  const start = Math.max(0, Math.min(pageIndex - 1, maxStart))
  const end = Math.min(totalPages - 1, start + PAGE_RENDER_WINDOW - 1)
  return { start, end }
}

interface FlipBookProps {
  fileUrl: string | Uint8Array
  bookId: string
  initialPage?: number
  isMobile?: boolean
  onPageChange?: (page: number) => void
  onClose?: () => void
  initialAnnotations?: Annotation[]
  onAskQuestion?: () => void
  authorName?: string
  // Audio support
  hasAudio?: boolean
  isAudioPlaying?: boolean
  onToggleAudio?: () => void
  onToggleMute?: () => void
  isMuted?: boolean
  playbackRate?: number
  onTogglePlaybackRate?: () => void
  audioProgress?: number
  audioDuration?: number
  onSeek?: (percentage: number) => void
  // TTS (Read Aloud) support
  isTtsActive?: boolean
  isTtsPaused?: boolean
  isFetchingTtsText?: boolean
  onToggleTts?: () => void
  onPauseResumeTts?: () => void
  onStopTts?: () => void
  ttsRate?: number
  onToggleTtsRate?: () => void
  onDocumentLoad?: (numPages: number) => void
}

// ─── Page Component (display only) ───────────────────────────
interface PageProps {
  children: React.ReactNode
  pageNumber: number
  annotations: Annotation[]
  activeTool: any
  activeColor: any
  onDelete: (id: string) => void
  onAnnotationCreate: (ann: any) => void
  onNoteCreate: (rect: any) => void
}

const Page = forwardRef<HTMLDivElement, PageProps>((props, ref) => {
  const { children, pageNumber, annotations, activeTool, activeColor, onDelete, onAnnotationCreate, onNoteCreate } = props

  const pageAnnotations = useMemo(
    () => annotations.filter(a => a.page === pageNumber - 1),
    [annotations, pageNumber]
  )

  return (
    <div className="bg-white shadow-[0_0_10px_rgba(0,0,0,0.1)] overflow-hidden relative select-none" ref={ref}>
      <div className="h-full w-full relative">
        {/* Layer 1 — Page Image */}
        {children}

        {/* Layer 2 — Annotations */}
        <AnnotationLayer
          annotations={pageAnnotations}
          activeTool={activeTool}
          onDelete={onDelete}
        />

        {/* Layer 3 — Selection (Per-page for perfect 1:1 coordinates) */}
        <SelectionLayer 
          activeTool={activeTool}
          activeColor={activeColor}
          pageIdx={pageNumber - 1}
          onAnnotationCreate={onAnnotationCreate}
          onNoteCreate={onNoteCreate}
        />

        {/* Page number */}
        <div className="absolute bottom-2 left-0 right-0 text-center text-[9px] text-gray-400 font-mono pointer-events-none z-30">
          — {pageNumber} —
        </div>
      </div>
    </div>
  )
})
Page.displayName = 'Page'

// ─── Main FlipBookReader Component ───────────────────────────

export const FlipBookReader: React.FC<FlipBookProps> = ({
  fileUrl,
  bookId,
  initialPage = 0,
  isMobile = false,
  onPageChange,
  onClose,
  initialAnnotations = [],
  onAskQuestion,
  authorName,
  hasAudio = false,
  isAudioPlaying = false,
  onToggleAudio,
  onToggleMute,
  isMuted = false,
  playbackRate = 1,
  onTogglePlaybackRate,
  audioProgress = 0,
  audioDuration = 0,
  onSeek,
  isTtsActive = false,
  isTtsPaused = false,
  isFetchingTtsText = false,
  onToggleTts,
  onPauseResumeTts,
  onStopTts,
  ttsRate = 1,
  onToggleTtsRate,
  onDocumentLoad,
}) => {
  const [numPages, setNumPages]     = useState<number>(0)
  const [pages, setPages]           = useState<string[]>([])
  const [isLoading, setIsLoading]   = useState(true)
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // Quiz States
  const [showQuiz, setShowQuiz] = useState(false)
  const [hasQuiz, setHasQuiz] = useState(false)
  const [isQuizValidated, setIsQuizValidated] = useState(false)


  const pdfInstance       = useRef<any>(null)
  const renderingIndices  = useRef<Set<number>>(new Set())
  const bookRef           = useRef<any>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  // Engine Hook
  const {
    annotations,
    activeTool, setActiveTool,
    activeColor, setActiveColor,
    handleAnnotationCreate,
    handleAnnotationDelete,
    showNoteModal, setShowNoteModal,
    noteText, setNoteText,
    pendingNoteRect, setPendingNoteRect
  } = useAnnotationEngine(bookId, initialAnnotations)

  // ── Responsive dimensions ──
  useEffect(() => {
    const update = () => {
      const vw = window.innerWidth
      const vh = window.innerHeight
      
      if (vw < 768) {
        // Mobile (Single Page)
        const w = vw - 32 // 16px padding
        setDimensions({ width: w, height: Math.min(vh * 0.7, w * 1.414) })
      } else if (vw < 1100) {
        // Tablet & Small Laptops (Double Page)
        const h = Math.min(vh * 0.85, 800)
        const w = Math.min((vw - 80) / 2, h / 1.414)
        setDimensions({ width: w, height: w * 1.414 })
      } else {
        // Desktop (Fixed Premium size)
        const height = Math.min(vh * 0.85, 900)
        setDimensions({ width: height / 1.414, height })
      }
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Security: Disable Print & Save
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault()
        return
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        return
      }

      if (e.key === 'ArrowLeft' && showNoteModal === false)  bookRef.current?.pageFlip().flipPrev()
      if (e.key === 'ArrowRight' && showNoteModal === false) bookRef.current?.pageFlip().flipNext()
      if (e.key === 'Escape') {
        if (showNoteModal) setShowNoteModal(false)
        else onClose?.()
      }
      if (showNoteModal) return // Don't trigger tools while typing
      if (e.key === 'h') setActiveTool('highlight')
      if (e.key === 'u') setActiveTool('underline')
      if (e.key === 'n') setActiveTool('note')
      if (e.key === 'e') setActiveTool('erase')
      if (e.key === 'r') setActiveTool('read')
    }

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault()
    };

    window.addEventListener('keydown', handleKeyDown)
    document.addEventListener('copy', handleCopy)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('copy', handleCopy)
    }
  }, [onClose, showNoteModal, setActiveTool])

  // ── PDF loading ──
  useEffect(() => {
    if (!fileUrl || (fileUrl instanceof Uint8Array && fileUrl.length === 0)) return
    const loadPdf = async () => {
      setIsLoading(true)
      try {
        // Dynamic import to avoid SSR "Unexpected token 'export'" error from pdfjs
        const pdfjs = await import('pdfjs-dist/legacy/build/pdf.js' as any)
        pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'

        let pdfSource: any
        if (typeof fileUrl === 'string') {
          // Pass URL directly to PDF.js to enable HTTP Range requests (instant loading)
          // PDF.js uses XMLHttpRequest internally. The backend proxy sets application/x-pdf-viewer
          // which prevents IDM from intercepting it, while keeping performance optimal.
          pdfSource = { 
            url: fileUrl, 
            withCredentials: true,
            httpHeaders: { 'X-Requested-With': 'XMLHttpRequest' }
          }
        } else {
          pdfSource = { data: fileUrl }
        }

        const loadingTask = pdfjs.getDocument(pdfSource)
        const pdf = await loadingTask.promise
        pdfInstance.current = pdf
        const total = pdf.numPages
        setNumPages(total)
        setPages(new Array(total).fill(''))
        onDocumentLoad?.(total)

        const renderPage = async (idx: number): Promise<string> => {
          const page     = await pdf.getPage(idx + 1)
          const viewport = page.getViewport({ scale: 1.5 })
          const canvas   = document.createElement('canvas')
          const ctx      = canvas.getContext('2d', { willReadFrequently: true })
          if (!ctx) return ''
          canvas.height = viewport.height
          canvas.width  = viewport.width
          await page.render({ canvasContext: ctx, viewport }).promise
          return new Promise<string>(res => canvas.toBlob(b => res(b ? URL.createObjectURL(b) : ''), 'image/jpeg', 0.9))
        }

        const initialWindow = getPageRenderWindow(initialPage, total)
        for (let i = initialWindow.start; i <= initialWindow.end; i++) {
          const url = await renderPage(i)
          setPages(prev => { const next = [...prev]; next[i] = url; return next })
        }
        setIsLoading(false)

        // Check if quiz exists and if we should show it immediately (Persistence)
        try {
          const quizData = await libraryApi.quizzes.getForBook(bookId)
          if (quizData.results && quizData.results.length > 0) {
            setHasQuiz(true)
            
            // Check if already validated
            const attempts = await libraryApi.quizzes.getAttempts(quizData.results[0].id)
            const validated = attempts.results?.some((a: any) => a.is_validated)
            setIsQuizValidated(validated)

            // Persistence logic: if book finished and not validated -> show quiz
            if (initialPage >= total - 1 && !validated) {
              setShowQuiz(true)
            }
          }
        } catch (err) {
          console.error("[FlipBook] Quiz check error:", err)
        }
      } catch (err) {
        console.error('[FlipBook] PDF load error:', err)
        setIsLoading(false)
      }
    }
    loadPdf()
  }, [fileUrl])

  // ── Lazy load nearby pages ──
  useEffect(() => {
    if (!numPages || pages.length === 0 || !pdfInstance.current) return
    const load = async () => {
      const { start, end } = getPageRenderWindow(currentPage, numPages)
      for (let i = start; i <= end; i++) {
        if (pages[i] || renderingIndices.current.has(i)) continue
        try {
          renderingIndices.current.add(i)
          const page     = await pdfInstance.current.getPage(i + 1)
          const viewport = page.getViewport({ scale: 1.5 })
          const canvas   = document.createElement('canvas')
          const ctx      = canvas.getContext('2d', { willReadFrequently: true })
          if (ctx) {
            canvas.height = viewport.height
            canvas.width  = viewport.width
            await page.render({ canvasContext: ctx, viewport }).promise
            const url = await new Promise<string>(res => canvas.toBlob(b => res(b ? URL.createObjectURL(b) : ''), 'image/jpeg', 0.9))
            setPages(prev => { if (prev[i]) return prev; const next = [...prev]; next[i] = url; return next })
          }
        } finally {
          renderingIndices.current.delete(i)
        }
      }
    }
    load()
  }, [currentPage, numPages])

  const onFlip = (e: any) => {
    setCurrentPage(e.data)
    onPageChange?.(e.data)
  }

  // Calculate Popover bounds for CSS clamp
  const notePopoverCssCoords = useMemo(() => {
    if (!pendingNoteRect) return { left: '50%', top: '50%' }
    const xBase = pendingNoteRect.pageIdx === currentPage ? pendingNoteRect.x / 2 : 50 + pendingNoteRect.x / 2
    return {
      left: `calc(min(max(10px, ${xBase}%), calc(100% - 330px)))`,
      top: `calc(min(max(10px, ${pendingNoteRect.y}%), calc(100% - 220px)))`
    }
  }, [pendingNoteRect, currentPage])

  if (isLoading || dimensions.width === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#0B0F19]/90 backdrop-blur-xl space-y-4">
        <Loader2 className="w-12 h-12 text-laha-gold animate-spin" />
        <p className="text-white/40 font-black uppercase tracking-widest text-[10px]">
          Préparation de l'espace de travail...
        </p>
      </div>
    )
  }

  return (
    <div 
      onContextMenu={(e) => e.preventDefault()}
      className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden animate-in fade-in duration-700 select-none"
    >
      <style jsx global>{`
        @media print {
          body { display: none !important; }
        }
      `}</style>
      
      {/* ── Premium Ambient Background ─────────────── */}
      <div className="absolute inset-0 bg-[#0B0F19]/90 backdrop-blur-[40px] pointer-events-none z-0" />
      <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-laha-gold/10 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-[#4A9CE6]/10 rounded-full blur-[140px] pointer-events-none z-0" />
      
      {/* ── Top Header (Responsive) ─────────────────────────────────── */}
      <div className={cn(
        "absolute top-0 left-0 right-0 flex justify-between items-start pointer-events-none z-[100]",
        isMobile ? "px-4 py-3" : "px-8 py-5"
      )}>
        <div className="space-y-1">
          <p className="text-laha-gold text-[8px] md:text-[9px] font-black uppercase tracking-[0.3em] flex items-center gap-2">
            <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-laha-gold animate-pulse" /> 
            <span className="hidden xs:inline">Espace de travail</span>
          </p>
          <div className="flex items-center gap-2 md:gap-3">
            <h3 className="text-white/70 text-[10px] md:text-xs font-bold uppercase tracking-widest bg-white/5 px-2 py-1 rounded-md border border-white/10">
              Page {currentPage + 1} / {numPages}
            </h3>
            <span className="h-1 w-1 rounded-full bg-white/20" />
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="flex items-center gap-2 group pointer-events-auto hover:bg-white/5 px-2 py-1 rounded-md transition-colors"
            >
              <p className="text-white/30 group-hover:text-laha-gold text-[8px] md:text-[9px] font-bold uppercase tracking-widest transition-colors">
                {annotations.length} <span className="hidden sm:inline">annotation{annotations.length !== 1 ? 's' : ''}</span>
              </p>
              <div className="text-white/20 group-hover:text-laha-gold transition-colors">
                <ChevronRight size={isMobile ? 10 : 12} />
              </div>
            </button>
          </div>
        </div>

        <Button
          onClick={onClose}
          variant="ghost"
          className="pointer-events-auto h-9 md:h-10 px-3 md:px-5 rounded-full bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-transform hover:scale-105"
        >
          <X size={14} className="md:mr-2" /> <span className="hidden md:inline">Quitter l'immersion</span>
        </Button>

        {hasQuiz && currentPage >= numPages - 1 && !isQuizValidated && !showQuiz && (
          <Button 
            onClick={() => setShowQuiz(true)}
            className="pointer-events-auto h-9 md:h-10 px-4 md:px-8 rounded-full bg-laha-gold text-black hover:bg-yellow-400 text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-laha-gold/20 hover:scale-105 active:scale-95 flex items-center gap-2 ml-3 animate-in zoom-in duration-500"
          >
            <Check size={14} strokeWidth={3} />
            <span>Valider ma lecture</span>
          </Button>
        )}

       {/*  {onAskQuestion && !isMobile && (
          <Button 
            onClick={onAskQuestion}
            className="pointer-events-auto h-9 md:h-10 px-4 md:px-6 rounded-full bg-laha-gold text-black hover:bg-yellow-400 text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-laha-gold/20 hover:scale-105 active:scale-95 flex items-center gap-2 ml-3"
          >
            <HelpCircle size={14} />
            <span>Poser une question</span>
          </Button>
        )} */}

        {hasAudio && (
          <div className="pointer-events-auto flex items-center gap-2 ml-3">
             <Button 
                onClick={onToggleAudio}
                className={cn(
                  "h-9 md:h-10 w-9 md:w-10 rounded-full p-0 transition-all shadow-xl flex items-center justify-center",
                  isAudioPlaying ? "bg-emerald-500 text-white animate-pulse" : "bg-laha-gold text-black"
                )}
             >
                {isAudioPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
             </Button>
             <Button 
                onClick={onToggleMute}
                variant="ghost"
                className="h-9 md:h-10 w-9 md:w-10 rounded-full p-0 bg-white/5 border border-white/10 text-white/40 hover:text-white"
             >
                {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
             </Button>
             <Button 
                onClick={onTogglePlaybackRate}
                variant="ghost"
                className="h-9 md:h-10 px-2 rounded-full bg-white/5 border border-white/10 text-laha-gold text-[9px] font-black hover:bg-white/10"
             >
                {playbackRate}x
             </Button>
             {!isMobile && (
               <div className="flex flex-col ml-2">
                 <p className="text-[8px] font-black uppercase text-laha-gold tracking-widest leading-none">Livre-Audio</p>
                 <p className="text-[7px] text-white/40 mt-1">
                   {Math.floor(audioProgress / 60)}:{(audioProgress % 60).toFixed(0).padStart(2, '0')} / {Math.floor(audioDuration / 60)}:{(audioDuration % 60).toFixed(0).padStart(2, '0')}
                 </p>
               </div>
             )}
          </div>
        )}

        {/* 🎧 TTS Read Aloud Button */}
        {onToggleTts && (
          <div className="pointer-events-auto flex items-center gap-2 ml-3">
            <Button
              onClick={onToggleTts}
              disabled={isFetchingTtsText}
              className={cn(
                "h-9 md:h-10 rounded-full px-3 md:px-4 text-[9px] font-black uppercase tracking-widest transition-all shadow-xl flex items-center gap-2",
                isTtsActive
                  ? "bg-blue-500/20 border border-blue-500/40 text-blue-400 hover:bg-blue-500/30 animate-pulse"
                  : "bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10"
              )}
              variant="ghost"
            >
              {isFetchingTtsText
                ? <Loader2 size={14} className="animate-spin" />
                : <Headphones size={14} />
              }
              <span className="hidden md:inline">
                {isTtsActive ? 'Arrêter la lecture' : 'Lire à voix haute'}
              </span>
            </Button>
          </div>
        )}
      </div>


      {/* Persistent Audio Progress Bar for Immersion */}
      {hasAudio && (
        <div 
          className="fixed top-20 left-0 right-0 h-1 bg-white/5 z-[101] cursor-pointer group/immersion-bar pointer-events-auto"
          onClick={(e) => {
            if (!onSeek) return
            const rect = e.currentTarget.getBoundingClientRect()
            const x = e.clientX - rect.left
            onSeek(x / rect.width)
          }}
        >
          <div 
            className="h-full bg-laha-gold shadow-[0_0_8px_rgba(212,160,23,0.3)] transition-all duration-300"
            style={{ width: `${(audioProgress / audioDuration) * 100}%` }}
          />
        </div>
      )}

      {/* ── FlipBook Container ───────────────────────────────────── */}
      <div className="relative flex items-center justify-center group mt-8">
        
        {/* Navigation Overlays (invisible clickable areas for turning pages when in read mode) */}
        {activeTool === 'read' && (
          <>
            <div className="absolute inset-y-0 left-0 w-1/4 z-[400] cursor-pointer" onClick={() => bookRef.current?.pageFlip().flipPrev()} />
            <div className="absolute inset-y-0 right-0 w-1/4 z-[400] cursor-pointer" onClick={() => bookRef.current?.pageFlip().flipNext()} />
          </>
        )}

        <button
          onClick={() => bookRef.current?.pageFlip().flipPrev()}
          disabled={currentPage === 0}
          className={cn(
            "absolute z-[600] p-3 md:p-4 rounded-xl md:rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-white/50 transition-all duration-300",
            "hover:bg-white/10 hover:text-white hover:scale-110 active:scale-95 disabled:opacity-0 disabled:pointer-events-none",
            isMobile 
              ? "fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] left-4 opacity-100 shadow-xl" 
              : "opacity-0 group-hover:opacity-100 shadow-2xl -left-20"
          )}
        >
          <ChevronLeft size={isMobile ? 20 : 28} />
        </button>

        <div className="relative shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] rounded-xl overflow-hidden border border-white/10">

          <HTMLFlipBook
            width={dimensions.width}
            height={dimensions.height}
            size="fixed"
            minWidth={315}
            maxWidth={1000}
            minHeight={400}
            maxHeight={1533}
            maxShadowOpacity={0.6}
            showCover={true}
            mobileScrollSupport={true}
            onFlip={onFlip}
            className="laha-flipbook"
            ref={bookRef}
            style={{ backgroundColor: 'transparent' }}
            startPage={initialPage}
            drawShadow={!isMobile}
            flippingTime={isMobile ? 400 : 700}
            usePortrait={isMobile}
            startZIndex={0}
            autoSize={true}
            clickEventForward={false}
            useMouseEvents={false}
            swipeDistance={isMobile ? 30 : 0}
            showPageCorners={false}
            disableFlipByClick={true}
          >
            {pages.map((pageSrc, i) => (
              <Page
                key={i}
                pageNumber={i + 1}
                annotations={annotations}
                activeTool={activeTool}
                activeColor={activeColor}
                onDelete={handleAnnotationDelete}
                onAnnotationCreate={handleAnnotationCreate}
                onNoteCreate={(rect) => {
                  setPendingNoteRect(rect)
                  setShowNoteModal(true)
                }}
              >
                {pageSrc ? (
                  <img
                    src={pageSrc}
                    alt={`Page ${i + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    draggable={false}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50/5 space-y-2">
                    <Loader2 className="w-6 h-6 text-laha-gold/30 animate-spin" />
                  </div>
                )}
              </Page>
            ))}
          </HTMLFlipBook>
          
          {/* ── Contextual Note Popover ── */}
          <AnimatePresence>
            {showNoteModal && pendingNoteRect && (
              <div className="absolute inset-0 z-[600] pointer-events-none">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: 10 }}
                  style={notePopoverCssCoords}
                  className="absolute pointer-events-auto bg-[#0f1115]/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-5 w-80 shadow-[0_30px_60px_rgba(0,0,0,0.6)]"
                >
                  <p className="text-[10px] font-black uppercase tracking-widest text-laha-gold mb-1 flex items-center gap-2">
                    Nouvelle note
                  </p>
                  <p className="text-[9px] text-white/30 italic mb-4">Cette note sera attachée à cette zone.</p>
                  <textarea
                    autoFocus
                    rows={4}
                    value={noteText}
                    onChange={e => setNoteText(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-laha-gold/40 focus:bg-white/10 resize-none transition-all placeholder:text-white/20 italic"
                    placeholder="Saisissez votre pensée ici..."
                  />
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => { setShowNoteModal(false); setPendingNoteRect(null); setNoteText('') }}
                      className="flex-1 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={() => {
                        if (noteText.trim()) {
                          handleAnnotationCreate({
                            page:    pendingNoteRect.pageIdx,
                            type:    'note',
                            rect:    { x: pendingNoteRect.x, y: pendingNoteRect.y, w: pendingNoteRect.w, h: pendingNoteRect.h },
                            color:   '#F3C900',
                            content: noteText.trim(),
                          })
                        }
                        setShowNoteModal(false)
                        setPendingNoteRect(null)
                        setNoteText('')
                      }}
                      disabled={!noteText.trim()}
                      className="flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest bg-laha-gold text-black disabled:opacity-40 hover:bg-yellow-400 hover:shadow-[0_0_15px_rgba(243,201,0,0.4)] transition-all flex items-center justify-center gap-1"
                    >
                      <Check size={14} /> Garder
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>

        <button
          onClick={() => bookRef.current?.pageFlip().flipNext()}
          disabled={currentPage >= pages.length - 1}
          className={cn(
            "absolute z-[600] p-3 md:p-4 rounded-xl md:rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-white/50 transition-all duration-300",
            "hover:bg-white/10 hover:text-white hover:scale-110 active:scale-95 disabled:opacity-0 disabled:pointer-events-none",
            isMobile 
              ? "fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] right-4 opacity-100 shadow-xl" 
              : "opacity-0 group-hover:opacity-100 shadow-2xl -right-20"
          )}
        >
          <ChevronRight size={isMobile ? 20 : 28} />
        </button>
      </div>

      {/* ── Progress Bar ──────────────────────────────── */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5 pointer-events-none z-[100]">
        <motion.div
          className="h-full bg-laha-gold shadow-[0_0_8px_rgba(212,160,23,0.3)]"
          initial={{ width: 0 }}
          animate={{ width: `${((currentPage + 1) / numPages) * 100}%` }}
          transition={{ type: 'spring', stiffness: 40 }}
        />
      </div>

      {/* ── Apple-Style Floating Dock ─────────────────── */}
      <FloatingDock
        activeTool={activeTool}
        setActiveTool={setActiveTool}
        activeColor={activeColor}
        setActiveColor={setActiveColor}
        isMobile={isMobile}
      />

      {/* ── Annotation Sidebar ─────────────────────────── */}
      <AnnotationSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        annotations={annotations}
        onNavigate={(pageIdx) => {
          bookRef.current?.pageFlip().turnToPage(pageIdx)
          setIsSidebarOpen(false)
        }}
        onDelete={handleAnnotationDelete}
      />

      {/* ── Quiz Overlay ─────────────────────────── */}
      <AnimatePresence>
        {showQuiz && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[1000] bg-[#0B0F19]/95 backdrop-blur-3xl"
          >
            <FlipBookQuiz 
              bookId={bookId} 
              onClose={() => setShowQuiz(false)}
              onComplete={(res) => {
                if (res.is_validated) setIsQuizValidated(true)
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
      
    </div>
  )
}

export type { Annotation } from './flipbook/types'
