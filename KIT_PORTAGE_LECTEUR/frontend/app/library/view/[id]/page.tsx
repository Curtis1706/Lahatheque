"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeft, Moon, Sun, Loader2,
  Save, Bookmark, Trash2, LayoutGrid, X, CheckCircle2,
  Volume2, VolumeX, Play, Pause, SkipBack, SkipForward, Music, Headphones, StopCircle, Mic2
} from "lucide-react"

import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"

// Core viewer
import { Viewer, Worker as PdfWorker, ThemeContext, Position, Tooltip, ViewMode, SpecialZoomLevel, ScrollMode } from '@react-pdf-viewer/core'
// Plugins
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout'
import { pageNavigationPlugin } from '@react-pdf-viewer/page-navigation'
import { highlightPlugin, RenderHighlightTargetProps, RenderHighlightsProps } from '@react-pdf-viewer/highlight'

// Import styles
import '@react-pdf-viewer/core/lib/styles/index.css'
import '@react-pdf-viewer/default-layout/lib/styles/index.css'
import '@react-pdf-viewer/highlight/lib/styles/index.css'

import { FlipBookReader, Annotation as FlipBookAnnotation } from "@/components/library/FlipBook"
import { FlipBookQuiz } from "@/components/library/FlipBookQuiz"


// Official Localization object for French from @react-pdf-viewer/locales
const fr_FR_Locale = {
  attachment: {
    clickToDownload: "Appuyez pour télécharger",
    noAttachment: "Pas d’attachement"
  },
  bookmark: {
    noBookmark: "Pas de signet"
  },
  core: {
    askingPassword: {
      requirePasswordToOpen: "Exiger un mot de passe pour ouvrir",
      submit: "Soumettre"
    },
    wrongPassword: {
      submit: "Soumettre",
      tryAgain: "Mauvais mot de passe. Veuillez réessayer."
    },
    pageLabel: "Page {{pageIndex}}"
  },
  defaultLayout: {
    attachment: "Pièces jointes",
    bookmark: "Signet",
    thumbnail: "Miniatures"
  },
  download: {
    download: "Télécharger"
  },
  drop: {
    dragDropFile: "Tirer et déposer le document de PDF ici"
  },
  fullScreen: {
    enterFullScreen: "Plein écran",
    exitFullScreen: "Sortir du mode de plein écran"
  },
  localeSwitcher: {
    switchLocale: "Changer le lieu"
  },
  open: {
    openFile: "Ouvrir le fichier"
  },
  pageNavigation: {
    enterPageNumber: "Entrer le numéro de page",
    goToFirstPage: "Première page",
    goToLastPage: "Dernière page",
    goToNextPage: "Page suivante",
    goToPreviousPage: "Page précédente"
  },
  print: {
    cancel: "Annuler",
    preparingDocument: "Être en train de préparer le document ...",
    print: "Imprimer"
  },
  properties: {
    author: "Auteur",
    close: "Fermer",
    creationDate: "Date de création",
    creator: "Créateur",
    fileName: "Nom de fichier",
    fileSize: "Taille du fichier",
    keywords: "Mots-clés",
    modificationDate: "Date de modification",
    pageCount: "Nombre de page",
    pdfProducer: "Créer un fichier pdf",
    pdfVersion: "Version PDF",
    showProperties: "Afficher les propriétés",
    subject: "Sujet",
    title: "Titre"
  },
  rotate: {
    rotateBackward: "Tourner en arrière",
    rotateForward: "Tourner en avant"
  },
  scrollMode: {
    horizontalScrolling: "Défilement horizontal",
    verticalScrolling: "Défilement vertical",
    wrappedScrolling: "Défilement de nombreuses pages"
  },
  search: {
    close: "Fermer",
    enterToSearch: "Appuyez Enter pour rechercher",
    matchCase: "Distinguer la minuscule et majuscule",
    nextMatch: "Résultat suivant",
    previousMatch: "Résultat précédent",
    search: "Rechercher",
    wholeWords: "Mots entiers"
  },
  selectionMode: {
    handTool: "À la main",
    textSelectionTool: "Outil de sélection de texte"
  },
  theme: {
    switchDarkTheme: "Passer au mode sombre",
    switchLightTheme: "Passer au mode clair"
  },
  thumbnail: {
    thumbnailLabel: "Miniature de la page {{pageIndex}}"
  },
  toolbar: {
    moreActions: "Autres actions"
  },
  zoom: {
    actualSize: "Taille actuelle",
    pageFit: "Adapter à la page",
    pageWidth: "Largeur de page",
    zoomDocument: "Agrandir le document",
    zoomIn: "Agrandir",
    zoomOut: "Rapetisser"
  },
  highlight: {
    highlight: 'Surligner',
    underline: 'Souligner',
    squiggly: 'Surligner (vagues)',
    strikeout: 'Barrer',
    note: 'Note'
  }
}

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { libraryApi, SERVER_ROOT_URL, http } from "@/lib/api"
import { askExpertQuestion } from "@/lib/api-student-qa"
import { cn } from "@/lib/utils"
import { HelpCircle, MessageCircle, Send } from "lucide-react"
import { useAudioPlayer } from "./hooks/useAudioPlayer"
import { useTextToSpeech } from "./hooks/useTextToSpeech"
import { useAnnotations } from "./hooks/useAnnotations"
import { usePdfReaderSecurity } from "./hooks/usePdfReaderSecurity"

const PDF_RANGE_CHUNK_SIZE = 256 * 1024

// --- Modal Question Rapide ---
function AskExpertModal({ book, isOpen, onClose, onSuccess }: { book: any, isOpen: boolean, onClose: () => void, onSuccess: () => void }) {
  const [subject, setSubject] = useState(`Question sur : ${book.title}`)
  const [body, setBody] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!body.trim()) return
    setIsSubmitting(true)
    try {
      await askExpertQuestion(book.author_id, subject, body, book.id)
      toast.success("Votre question a été envoyée à l'expert !")
      onSuccess()
      onClose()
    } catch (err: any) {
      toast.error(err.message || "Erreur d'envoi")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="relative bg-popover border border-border text-foreground rounded-[2.5rem] p-8 md:p-10 w-full max-w-xl shadow-2xl"
      >
        <div className="space-y-6">
          {/* <header>
            <p className="text-[10px] uppercase font-black tracking-widest text-laha-gold mb-2 italic">Interaction Directe</p>
            <h2 className="text-2xl font-black italic uppercase tracking-tighter">Poser une question à l'auteur</h2>
          </header> */}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[9px] uppercase font-black text-muted-foreground/50 px-1">Sujet</label>
              <input
                value={subject} onChange={e => setSubject(e.target.value)}
                className="w-full h-12 bg-muted/30 border border-border rounded-xl px-4 text-sm outline-none focus:border-laha-gold/40 transition-all font-bold text-foreground"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] uppercase font-black text-muted-foreground/50 px-1">Votre question</label>
              <textarea
                rows={4} value={body} onChange={e => setBody(e.target.value)}
                placeholder="Décrivez votre problème ou demandez une précision..."
                className="w-full bg-muted/30 border border-border rounded-2xl p-4 text-sm outline-none focus:border-laha-gold/40 transition-all resize-none italic text-foreground placeholder:text-muted-foreground/35"
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="button" onClick={onClose} variant="ghost" className="flex-1 h-12 text-muted-foreground hover:bg-muted uppercase text-[10px] font-black tracking-widest">Annuler</Button>
              <Button type="submit" disabled={isSubmitting || !body.trim()} className="flex-1 h-12 bg-laha-gold text-laha-black hover:bg-laha-gold-warm uppercase text-[10px] font-black tracking-widest shadow-xl shadow-laha-gold/10">
                {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : <Send size={16} className="mr-2" />}
                Envoyer
              </Button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  )
}

export default function DocumentReaderPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user, activeRole } = useAuth()
  const isStudent = user?.role === 'student' || activeRole === 'student'

  const [book, setBook] = useState<any>(null)
  const [rawPdfData, setRawPdfData] = useState<ArrayBuffer | string | null>(null)
  const [isPdfLoading, setIsPdfLoading] = useState(false)

  const {
    isAudioPlaying,
    audioProgress,
    audioDuration,
    isMuted,
    playbackRate,
    toggleAudio,
    handleSeek,
    toggleMute,
    togglePlaybackRate
  } = useAudioPlayer(book?.audio_file)





  const transformPdfGetDocumentParams = useCallback((options: any) => ({
    ...options,
    disableStream: true,
    disableAutoFetch: true,
    rangeChunkSize: PDF_RANGE_CHUNK_SIZE,
  }), [])

  const setViewerRenderRange = useCallback((range: { startPage: number; numPages: number }) => {
    const maxStart = Math.max(range.numPages - 4, 0)
    const startPage = Math.max(0, Math.min(range.startPage - 1, maxStart))
    return {
      startPage,
      endPage: Math.min(range.numPages - 1, startPage + 3),
    }
  }, [])

  const [isLoading, setIsLoading] = useState(true)
  const [isNightMode, setIsNightMode] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  const [isSaving, setIsSaving] = useState(false)
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.DualPageWithCover)
  const [isImmersionMode, setIsImmersionMode] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  const isAudioOnly = book ? (!book.file && !!book.audio_file) : false
  const isOfficeDoc = book?.file?.match(/\.(docx|doc|pptx|ppt|xlsx|xls)$/i)
  const effectiveImmersionMode = (isMobile || isAudioOnly || isOfficeDoc) ? false : isImmersionMode

  const [hasQuiz, setHasQuiz] = useState(false)
  const [isQuizValidated, setIsQuizValidated] = useState(false)
  const [isQuizOverlayOpen, setIsQuizOverlayOpen] = useState(false)

  const {
    isTtsActive,
    isTtsPaused,
    isFetchingTtsText,
    showVoicePicker,
    ttsVoice,
    categorizedVoices,
    setShowVoicePicker,
    selectVoice,
    toggleTts: handleTtsToggle,
    pauseResumeTts,
    stopTts,
    setTtsRate,
    setTtsPitch,
    ttsRate,
    ttsPitch
  } = useTextToSpeech({
    book,
    currentPage,
    rawPdfData,
    effectiveImmersionMode,
    viewMode
  })

  const { notes, setNotes, fetchAnnotations, handleDeleteAnnotation, handleHighlight } = useAnnotations(id as string)

  usePdfReaderSecurity()

  // Robust mobile detection with orientation change support (Centralized truth)
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    window.addEventListener('orientationchange', () => setTimeout(check, 100))
    return () => {
      window.removeEventListener('resize', check)
      window.removeEventListener('orientationchange', () => check)
    }
  }, [])


  const pageNavigationPluginInstance = pageNavigationPlugin()
  const { jumpToPage } = pageNavigationPluginInstance

  const highlightPluginInstance = highlightPlugin({
    renderHighlightTarget,
    renderHighlights,
  })

  const { jumpToHighlightArea } = highlightPluginInstance



  // Sidebar component for annotations
  const NotesSidebar = () => (
    <div className="flex flex-col h-full bg-[#0f1115] text-white">
      <div className="p-6 border-b border-white/5">
        <h3 className="text-laha-gold text-[10px] font-black uppercase tracking-[0.2em]">Mes Annotations</h3>
        <p className="text-[10px] text-white/30 mt-1 uppercase font-bold">{notes.length} éléments trouvés</p>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {notes.length === 0 ? (
          <div className="h-40 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-white/5 rounded-2xl">
            <Bookmark size={24} className="text-white/10 mb-2" />
            <p className="text-[10px] text-white/20 font-bold uppercase">Aucune annotation</p>
          </div>
        ) : (
          [...notes].sort((a, b) => (a.highlightArea?.pageIndex || 0) - (b.highlightArea?.pageIndex || 0)).map((note) => (
            <div
              key={note.id}
              className="group bg-white/[0.03] border border-white/10 rounded-2xl p-4 hover:border-laha-gold/30 hover:bg-white/[0.05] transition-all cursor-pointer relative"
              onClick={() => {
                if (note.highlightAreas && note.highlightAreas.length > 0) {
                  jumpToHighlightArea(note.highlightAreas[0])
                }
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <Badge className="bg-laha-gold/10 text-laha-gold border-none text-[9px] font-black uppercase px-2 py-0.5 rounded-md">
                  Page {(note.highlightAreas?.[0]?.pageIndex || 0) + 1}
                </Badge>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteAnnotation(note.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 hover:text-red-500 rounded-lg transition-all text-white/20"
                >
                  <Trash2 size={12} />
                </button>
              </div>
              {note.quote && (
                <div className="relative mb-3">
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-laha-gold/30 rounded-full" />
                  <p className="text-[11px] text-white/60 italic pl-3 line-clamp-3 leading-relaxed">
                    "{note.quote}"
                  </p>
                </div>
              )}
              {note.content && (
                <p className="text-xs text-white font-medium leading-relaxed bg-white/5 p-2.5 rounded-xl border border-white/5">
                  {note.content}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )

  // Initialization of plugins
  const defaultLayoutPluginInstance = defaultLayoutPlugin({
    toolbarPlugin: {
      searchPlugin: {
        keyword: '',
      },
    },
    sidebarTabs: (defaultTabs) => [
      defaultTabs[0], // Thumbnails
      defaultTabs[1], // Bookmarks
      {
        content: <NotesSidebar />,
        icon: <Bookmark size={20} />,
        title: 'Mes Annotations',
      },
      defaultTabs[2], // Attachments
    ],
    renderToolbar: (Toolbar: any) => (
      <Toolbar>
        {(props: any) => {
          const {
            CurrentPageInput,
            Download,
            EnterFullScreen,
            GoToNextPage,
            GoToPreviousPage,
            NumberOfPages,
            Print,
            ShowSearchPopover,
            Zoom,
            ZoomIn,
            ZoomOut,
            Rotate,
            SwitchTheme,
            SwitchSelectionMode,
            ShowProperties
          } = props;
          return (
            <div className="rpv-toolbar" style={{ alignItems: 'center', display: 'flex', width: '100%', padding: '0 4px' }}>
              <div style={{ padding: '0px 2px' }}><ShowSearchPopover /></div>
              <div style={{ padding: '0px 2px' }}><Rotate /></div>
              <div className="rpv-toolbar__divider" style={{ borderRight: '1px solid rgba(0, 0, 0, 0.1)', height: '24px', margin: '0 8px' }} />
              <div style={{ padding: '0px 2px' }}><GoToPreviousPage /></div>
              <div style={{ padding: '0px 2px', width: '4rem' }}><CurrentPageInput /></div>
              <div style={{ padding: '0px 2px', color: '#666', fontSize: '13px' }}>sur <NumberOfPages /></div>
              <div style={{ padding: '0px 2px' }}><GoToNextPage /></div>
              <div className="rpv-toolbar__divider" style={{ borderRight: '1px solid rgba(0, 0, 0, 0.1)', height: '24px', margin: '0 8px' }} />
              <div style={{ padding: '0px 2px' }}><ZoomOut /></div>
              <div style={{ padding: '0px 2px' }}><Zoom /></div>
              <div style={{ padding: '0px 2px' }}><ZoomIn /></div>
              <div className="rpv-toolbar__divider" style={{ borderRight: '1px solid rgba(0, 0, 0, 0.1)', height: '24px', margin: '0 8px' }} />
              <div style={{ padding: '0px 2px' }}><SwitchTheme /></div>
              <div style={{ padding: '0px 2px' }}><EnterFullScreen /></div>
            </div>
          );
        }}
      </Toolbar>
    ),
  })

  // Highlight Plugin Setup Functions (Moved out to be used in highlightPluginInstance)
  function renderHighlightTarget(props: RenderHighlightTargetProps) {
    return (
      <div
        className="bg-laha-black/95 border border-laha-gold/30 p-1.5 rounded-xl shadow-2xl flex items-center gap-1 backdrop-blur-xl animate-in fade-in zoom-in duration-200"
        style={{
          position: 'absolute',
          left: `${props.selectionRegion.left}%`,
          top: `${props.selectionRegion.top + props.selectionRegion.height}%`,
          zIndex: 1000,
          transform: 'translateY(10px)',
        }}
      >
        <Button
          size="sm"
          onClick={() => {
            const note = prompt("Ajouter une note à ce surlignage (facultatif) :");
            props.toggle()
            handleHighlight(props, note || "", id as string)
          }}
          className="bg-laha-gold text-laha-black hover:bg-yellow-400 font-bold text-[10px] uppercase h-8 px-3 rounded-lg flex items-center gap-2"
        >
          <Bookmark size={12} fill="currentColor" /> Surligner
        </Button>
      </div>
    )
  }

  function renderHighlights(props: RenderHighlightsProps) {
    return (
      <div>
        {notes.map((note) => (
          <div key={note.id}>
            {(note.highlightAreas || [])
              .filter((area: any) => area.pageIndex === props.pageIndex)
              .map((area: any, idx: number) => (
                <div
                  key={idx}
                  style={Object.assign(
                    {},
                    {
                      background: 'rgba(255, 215, 0, 0.4)', // Or Laha
                      pointerEvents: 'none',
                    },
                    props.getCssProperties(area, props.rotation)
                  )}
                />
              ))}
          </div>
        ))}
      </div>
    )
  }
  useEffect(() => {
    const fetchBook = async () => {
      try {
        if (id === 'lesson_pdf') {
          const sParams = new URLSearchParams(window.location.search)
          const file = sParams.get('file') || ''
          const title = sParams.get('title') || 'Support de cours'
          const lessonId = sParams.get('lesson_id') || ''
          
          const fakeBook = {
            id: 'lesson_pdf',
            title,
            file,
            progress: { last_page: 0 }
          }
          setBook(fakeBook)
          
          if (file) {
            setIsPdfLoading(true)
            const proxyUrl = `${SERVER_ROOT_URL}api/documents/proxy/?path=${encodeURIComponent(file)}`
            setRawPdfData(proxyUrl)
            setIsPdfLoading(false)
          } else {
            setRawPdfData(new ArrayBuffer(0))
          }
          setIsLoading(false)
          return
        }

        const data = await libraryApi.getBook(id as string)
        setBook(data)
        if (data.progress) {
          setCurrentPage(data.progress.last_page || 0)
        }

        // --- SECURE PDF LOAD via fetch → Blob URL (blocks IDM & download managers) ---
        if (data.file) {
          try {
            setIsPdfLoading(true)
            const proxyUrl = `${SERVER_ROOT_URL}api/documents/proxy/?path=${encodeURIComponent(data.file)}`
            // Instead of downloading the full 21MB PDF into memory, pass the proxy URL directly.
            // The proxy returns application/x-pdf-viewer which bypasses IDM, and PDF.js will use 
            // Range requests to load pages instantly on-demand.
            setRawPdfData(proxyUrl)
          } catch (pdfErr) {
            console.error('Erreur chargement PDF sécurisé:', pdfErr)
            setRawPdfData(new ArrayBuffer(0))
          } finally {
            setIsPdfLoading(false)
          }
        } else {
          setRawPdfData(new ArrayBuffer(0))
        }

        // Check for Quiz
        const quizRes = await libraryApi.quizzes.getForBook(id as string)
        if (quizRes.results && quizRes.results.length > 0) {
          setHasQuiz(true)
          const attempts = await libraryApi.quizzes.getAttempts(quizRes.results[0].id)
          setIsQuizValidated(attempts.results?.some((a: any) => a.is_validated))
        }

      } catch (err) {

        toast.error("Impossible de charger le document")
        router.back()
      } finally {
        setIsLoading(false)
      }
    }
    fetchBook()
  }, [id, router])

  // Sync progress with backend
  const syncProgress = useCallback(async (page: number) => {
    try {
      if (id === 'lesson_pdf') {
        const sParams = new URLSearchParams(window.location.search)
        const bookId = sParams.get('book_id')
        const lessonId = sParams.get('lesson_id')

        // Sync ReadingProgress if we have a book_id (for PDF supports and fiches de synthèse)
        if (bookId && totalPages > 0) {
          await libraryApi.syncProgress(bookId, page + 1, totalPages)
        }
        // Also sync lesson progress if we have a lesson_id (for lesson PDFs)
        if (lessonId && totalPages > 0) {
          const pos = page + 1
          const pct = (pos / totalPages) * 100
          const completed = pct >= 90
          await http.post(`/api/bff/content/lessons/${lessonId}/progress/`, {
            last_position: pos,
            progress: pct,
            completed,
          })
        }
        return
      }
      await libraryApi.syncProgress(id as string, page + 1, totalPages)
    } catch (err) {
      console.error("Erreur sync progression", err)
    }
  }, [id, totalPages])







  // Handle page change from viewer
  const handlePageChange = (e: { currentPage: number }) => {
    setCurrentPage(e.currentPage)
  }

  // Handle document load to get total pages
  const handleDocumentLoad = (e: { doc: any }) => {
    setTotalPages(e.doc.numPages)
  }

  // Periodic sync (every 30 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      if (currentPage >= 0) syncProgress(currentPage)
    }, 30000)
    return () => clearInterval(interval)
  }, [currentPage, syncProgress])

  // Mouse wheel navigation for Page mode
  const [isWheelLocked, setIsWheelLocked] = useState(false)
  const handleWheel = (e: React.WheelEvent) => {
    if (isWheelLocked) return

    if (e.deltaY > 50) { // Scroll down -> Next
      if (currentPage < totalPages - 1) {
        setIsWheelLocked(true)
        // Navigation logic handled by triggering the viewer's next or updating state is complex via core, 
        // but react-pdf-viewer has jumpToPage. We can keep it simple by letting the scroll happen if we use plugins 
        // or just clicking the hidden buttons if needed.
        // BUT, react-pdf-viewer usually handles keyboard. Custom wheel is better.
        const nextPage = viewMode === ViewMode.SinglePage ? currentPage + 1 : currentPage + 2
        if (nextPage < totalPages) jumpToPage(nextPage)
        setTimeout(() => setIsWheelLocked(false), 500)
      }
    } else if (e.deltaY < -50) { // Scroll up -> Previous
      if (currentPage > 0) {
        setIsWheelLocked(true)
        const prevPage = viewMode === ViewMode.SinglePage ? currentPage - 1 : currentPage - 2
        jumpToPage(Math.max(0, prevPage))
        setTimeout(() => setIsWheelLocked(false), 500)
      }
    }
  }

  if (isLoading || !book || isPdfLoading) {
    return (
      <div className="h-screen bg-[#080c12] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="animate-spin text-laha-gold" size={48} />
        <p className="text-white/40 font-black uppercase tracking-widest text-xs">
          {isPdfLoading ? 'Chargement sécurisé du document...' : 'Préparation de votre salle de lecture...'}
        </p>
      </div>
    )
  }

  const hasAudio = !!book.audio_file

  return (
    <div
      onContextMenu={(e) => e.preventDefault()}
      className={cn(
        "h-screen flex flex-col transition-colors duration-500 select-none",
        isNightMode ? "bg-[#050505] theme-dark" : "bg-gray-100 theme-light"
      )}>
      {/* Top Bar - Responsive Header */}
      <header className={cn(
        "px-4 md:px-8 flex items-center justify-between border-b relative z-[100] backdrop-blur-xl transition-all",
        "h-auto py-3 md:h-20 md:py-0",
        isNightMode ? "bg-black/90 border-white/10" : "bg-white/95 border-gray-200 shadow-sm"
      )}>
        <div className="flex items-center gap-3 md:gap-6 flex-1 min-w-0">
          <Button
            onClick={() => {
              syncProgress(currentPage)
              router.back()
            }}
            variant="ghost"
            size="icon"
            className={cn(
              "h-10 w-10 md:h-12 md:w-12 rounded-2xl transition-all shrink-0",
              isNightMode ? "text-white/40 hover:text-laha-gold hover:bg-white/5" : "text-gray-400 hover:text-black hover:bg-black/5"
            )}
          >
            <ArrowLeft size={isMobile ? 20 : 24} />
          </Button>
          <div className="space-y-0.5 md:space-y-1 min-w-0">
            <h1 className={cn(
              "font-black uppercase tracking-tighter truncate",
              isMobile ? "text-base" : "text-xl",
              isNightMode ? "text-white" : "text-black"
            )}>
              {book.title}
            </h1>
            <div className="flex items-center gap-2 md:gap-3">
              <Badge className={cn(
                "border-none text-[8px] md:text-[10px] font-black uppercase px-1.5 py-0.5 rounded-lg shrink-0",
                book.category === 'audio' ? "bg-purple-500 text-white" :
                  book.category === 'fiche' ? "bg-blue-500 text-white" :
                    book.category === 'summary' ? "bg-emerald-500 text-white" :
                      "bg-laha-gold text-laha-black"
              )}>
                {book.category === 'audio' ? "Livre-Audio" :
                  book.category === 'fiche' ? "Analyse" :
                    book.category === 'summary' ? "Résumé" : "Manuel"}
              </Badge>
              {book.file && (
                <span className={cn(
                  "text-[10px] md:text-xs font-bold uppercase tracking-widest shrink-0",
                  isNightMode ? "text-white/30" : "text-gray-400"
                )}>
                  Page {currentPage + 1} / {totalPages}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4 shrink-0">
        {/*   {book.author_id && !isMobile && isStudent && (
            <Button
              onClick={() => setIsQuestionModalOpen(true)}
              variant="outline"
              className={cn(
                "rounded-2xl border h-10 md:h-12 px-4 md:px-6 gap-3 text-[10px] font-black uppercase tracking-widest transition-all shadow-xl group",
                isNightMode ? "bg-[#d4a017]/10 border-[#d4a017]/30 text-[#d4a017] hover:bg-[#d4a017]/20" : "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
              )}
            >
              <HelpCircle size={18} className="group-hover:rotate-12 transition-transform" />
              <span className="hidden lg:inline">Poser une question</span>
            </Button>
          )} */}

          <Button
            onClick={() => setIsNightMode(!isNightMode)}
            variant="outline"
            className={cn(
              "rounded-2xl border-none h-10 md:h-12 px-3 md:px-5 gap-3 text-xs font-black uppercase tracking-widest transition-all shadow-sm",
              isNightMode ? "bg-white/5 text-laha-gold hover:bg-white/10" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            )}
          >
            {isNightMode ? <Sun size={18} /> : <Moon size={18} />}
            <span className="hidden md:inline">{isNightMode ? "Mode Jour" : "Mode Nuit"}</span>
          </Button>

          <Button
            onClick={() => {
              setIsSaving(true)
              syncProgress(currentPage).then(() => {
                setIsSaving(false)
                toast.success("Progression sauvegardée")
              })
            }}
            disabled={isSaving}
            className="bg-laha-gold text-laha-black font-black uppercase text-[10px] md:text-xs tracking-widest h-10 md:h-12 px-4 md:px-8 rounded-2xl shadow-xl shadow-laha-gold/20 hover:scale-105 transition-transform active:scale-95 shrink-0"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={isMobile ? 16 : 18} />}
            <span className="ml-2 hidden sm:inline">Sauvegarder</span>
          </Button>

          {/* 🔊 Lire à voix haute (TTS) - visible si le livre a un fichier PDF (exclut Word/Excel) */}
          {book.file && !book.file.match(/\.(docx|doc|pptx|ppt|xlsx|xls)$/i) && (
            <Button
              onClick={handleTtsToggle}
              disabled={isFetchingTtsText}
              variant="outline"
              className={cn(
                "rounded-2xl border-2 h-10 md:h-12 px-3 md:px-5 gap-2 text-[10px] font-black uppercase tracking-widest transition-all",
                isTtsActive
                  ? "border-blue-500 text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 animate-pulse"
                  : isNightMode
                    ? "border-white/20 text-white/60 bg-white/5 hover:bg-white/10 hover:border-white/40"
                    : "border-gray-300 text-gray-600 bg-gray-50 hover:bg-gray-100"
              )}
            >
              {isFetchingTtsText
                ? <Loader2 size={18} className="animate-spin" />
                : <Headphones size={18} />
              }
              <span className="hidden md:inline">
                {isTtsActive ? 'Arrêter' : 'Lire à voix haute'}
              </span>
            </Button>
          )}

          {!isMobile && !book.file?.match(/\.(docx|doc|pptx|ppt|xlsx|xls)$/i) && (
            <Button
              onClick={() => setIsImmersionMode(true)}
              variant="outline"
              className={cn(
                "rounded-2xl border-2 h-12 px-6 gap-3 text-xs font-black uppercase tracking-widest transition-all",
                isNightMode ? "border-laha-gold/50 text-laha-gold bg-laha-gold/10 hover:bg-laha-gold/20" : "border-laha-gold text-laha-gold bg-laha-gold/5 hover:bg-laha-gold/10"
              )}
            >
              <LayoutGrid size={18} />
              <span className="hidden md:inline">Mode Immersion</span>
            </Button>
          )}

          {hasQuiz && isStudent && (
            <Button
              onClick={() => setIsQuizOverlayOpen(true)}
              variant="outline"
              className={cn(
                "rounded-2xl border-2 h-10 md:h-12 px-4 md:px-6 gap-3 text-[10px] font-black uppercase tracking-widest transition-all",
                isQuizValidated
                  ? "border-emerald-500/50 text-emerald-500 bg-emerald-500/10"
                  : "border-laha-gold text-laha-black bg-laha-gold hover:bg-yellow-400"
              )}
            >
              <CheckCircle2 size={18} />
              <span className="hidden lg:inline">{isQuizValidated ? "Lecture Validée" : "Valider ma lecture"}</span>
            </Button>
          )}
        </div>

      </header>

      {/* Instruction Banner - User Guide */}
      <div className={cn(
        "py-2 px-4 md:px-6 border-b text-[9px] md:text-[10px] font-bold text-center uppercase tracking-[0.2em] relative z-50",
        isNightMode ? "bg-laha-gold/5 text-laha-gold/50 border-white/5" : "bg-laha-gold/10 text-laha-gold border-laha-gold/10"
      )}>
        {isMobile && isImmersionMode ? (
          <span className="text-laha-gold font-black italic">Mode immersion disponible sur tablette et desktop</span>
        ) : (
          <div className="flex items-center justify-center flex-wrap gap-2">
            <span className="hidden xs:inline">Mode Immersion</span>
            <span className="hidden xs:inline opacity-30">·</span>
            <span className="hidden sm:inline">Outils :</span>
            <span className="flex items-center gap-1.5"><span className="text-laha-gold font-black">H</span> Surligner</span>
            <span className="opacity-30">·</span>
            <span className="flex items-center gap-1.5"><span className="text-laha-gold font-black">U</span> Souligner</span>
            <span className="opacity-30">·</span>
            <span className="flex items-center gap-1.5"><span className="text-laha-gold font-black">N</span> Annoter</span>
            <span className="hidden xs:inline opacity-30">·</span>
            <span className="hidden xs:flex items-center gap-1.5"><span className="text-laha-gold font-black">R</span> Lecture</span>
          </div>
        )}
      </div>

      {/* Reader Area */}
      <main
        onWheel={handleWheel}
        className={cn(
          "laha-reader-zone flex-1 relative overflow-hidden",
          isNightMode && "reader-night-mode"
        )}
      >
        {(() => {
          if (!book.file) return null;

          const isOfficeDoc = book.file.match(/\.(docx|doc|pptx|ppt|xlsx|xls)$/i);
          if (isOfficeDoc) {
            const absoluteFileUrl = book.file.startsWith('http') 
              ? book.file 
              : `${SERVER_ROOT_URL.replace(/\/$/, '')}${book.file}`;
            
            // L'URL doit être accessible publiquement pour que Microsoft Office Web Viewer fonctionne
            const officeUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(absoluteFileUrl)}`;
            
            return (
              <div className="h-full w-full bg-white flex items-center justify-center">
                <iframe 
                  src={officeUrl} 
                  className="w-full h-full border-none"
                  title="Document Office"
                  onError={(e) => console.error("Erreur de chargement de l'iframe Office", e)}
                />
              </div>
            );
          }

          return (
            <PdfWorker workerUrl="/pdf.worker.min.js">
              {!effectiveImmersionMode && rawPdfData && (
                <div className="h-full">
                  <Viewer
                    fileUrl={typeof rawPdfData === 'string' ? rawPdfData : new Uint8Array(rawPdfData.slice(0))}
                    plugins={[
                      defaultLayoutPluginInstance,
                      highlightPluginInstance,
                      pageNavigationPluginInstance
                    ]}
                    theme={isNightMode ? 'dark' : 'light'}
                    localization={(fr_FR_Locale as any)}
                    initialPage={currentPage}
                    onPageChange={handlePageChange}
                    onDocumentLoad={handleDocumentLoad}
                    viewMode={isMobile ? ViewMode.SinglePage : viewMode}
                    defaultScale={SpecialZoomLevel.PageFit}
                    scrollMode={ScrollMode.Page}
                    transformGetDocumentParams={transformPdfGetDocumentParams}
                    setRenderRange={setViewerRenderRange}
                  />
                </div>
              )}
            </PdfWorker>
          );
        })()}

          {isAudioOnly && (
            <div className="h-full flex flex-col items-center justify-center p-10 space-y-12">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full max-w-sm aspect-[2/3] rounded-[3rem] overflow-hidden shadow-2xl border-4 border-laha-gold/20 relative"
              >
                <img
                  src={book.cover_image || book.thumbnail_url}
                  alt={book.title}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=600&h=900&auto=format&fit=crop"; }}
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm opacity-0 hover:opacity-100 transition-opacity duration-500">
                  <Button
                    onClick={toggleAudio}
                    className="w-24 h-24 rounded-full bg-laha-gold text-black hover:scale-110 transition-transform shadow-2xl"
                  >
                    {isAudioPlaying ? <Pause size={48} fill="currentColor" /> : <Play size={48} fill="currentColor" className="ml-2" />}
                  </Button>
                </div>
              </motion.div>

              <div className="text-center space-y-2">
                <h2 className="text-3xl font-black uppercase italic tracking-tighter text-foreground">{book.title}</h2>
                <p className="text-laha-gold font-black uppercase text-xs tracking-widest italic">{book.author_name || "Auteur Laha"}</p>
              </div>
            </div>
          )}

        {/* Custom CSS for Security and Night Mode */}
        <style jsx global>{`
          @media print {
            body { display: none !important; }
            .rpv-core__viewer { display: none !important; }
          }
          .rpv-core__canvas-layer canvas {
            ${isNightMode ? 'filter: invert(0.9) hue-rotate(180deg) brightness(0.8) contrast(1.2) !important;' : ''}
          }
          .rpv-core__viewer {
            background-color: ${isNightMode ? '#050505' : '#f3f4f6'} !important;
          }
          .rpv-core__inner-pages {
            background-color: ${isNightMode ? '#050505' : '#f3f4f6'} !important;
          }
          /* Allow selection only for highlight plugin areas if needed, but here we block copy event globally */
          .rpv-core__text-layer {
            user-select: text !important;
          }
        `}</style>
      </main>

      {/* Floating Audio Player & Progress Tracker */}
      <div className={cn(
        "fixed z-[1001] transition-all duration-500 flex flex-col gap-4 pointer-events-auto",
        isMobile
          ? "bottom-[calc(2rem+env(safe-area-inset-bottom))] right-4 items-end"
          : "bottom-10 right-10 items-end"
      )}>
        {hasAudio && (
          <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className={cn(
              "bg-[#0f1115] border border-white/10 rounded-[2rem] shadow-2xl flex items-center gap-4 ring-1 ring-white/5 p-3 overflow-hidden",
              !isMobile && "min-w-[300px]"
            )}
          >
            <Button
              onClick={toggleAudio}
              className="h-12 w-12 rounded-2xl bg-laha-gold text-laha-black hover:scale-105 transition-transform shrink-0"
            >
              {isAudioPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
            </Button>

            {!isMobile && (
              <div className="flex-1 space-y-2 pr-4">
                <div className="flex items-center justify-between">
                  <p className="text-[9px] font-black uppercase text-laha-gold tracking-widest italic">Image et Description</p>
                  <p className="text-[9px] font-bold text-white/30">
                    {Math.floor(audioProgress / 60)}:{(audioProgress % 60).toFixed(0).padStart(2, '0')} / {Math.floor(audioDuration / 60)}:{(audioDuration % 60).toFixed(0).padStart(2, '0')}
                  </p>
                </div>
                <div
                  className="h-2 w-full bg-white/5 rounded-full overflow-hidden cursor-pointer group/bar relative"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect()
                    const x = e.clientX - rect.left
                    const percentage = Math.max(0, Math.min(1, x / rect.width))
                    handleSeek(percentage)
                  }}
                >
                  <div
                    className="h-full bg-laha-gold shadow-[0_0_8px_rgba(212,160,23,0.3)] transition-all duration-300"
                    style={{ width: `${(audioProgress / audioDuration) * 100}%` }}
                  />
                </div>
              </div>
            )}

            <Button
              onClick={toggleMute}
              variant="ghost"
              className="h-10 w-10 rounded-xl text-white/40 hover:text-white"
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </Button>
            <Button
              onClick={togglePlaybackRate}
              variant="ghost"
              className="h-10 px-2 rounded-xl text-laha-gold text-[10px] font-black hover:bg-white/5"
            >
              {playbackRate}x
            </Button>
          </motion.div>
        )}

        {/* 🔊 Floating TTS Player Bar (like Edge Read Aloud) */}
        <AnimatePresence>
          {isTtsActive && (
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              className="relative"
            >
              {/* Voice Picker Panel (appears above the bar) */}
              <AnimatePresence>
                {showVoicePicker && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.97 }}
                    className={cn(
                      "absolute w-[300px] max-h-[420px] overflow-y-auto bg-[#0b1018] border border-blue-500/20 rounded-[1.75rem] shadow-2xl shadow-blue-900/30 p-4 space-y-4 z-50",
                      isMobile ? "right-0 bottom-full mb-3 origin-bottom-right" : "right-full mr-4 bottom-0 origin-bottom-right"
                    )}
                  >
                    <div className="flex items-center justify-between px-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-blue-400">Sélecteur de voix</p>
                      <button onClick={() => setShowVoicePicker(false)} className="text-white/30 hover:text-white transition-colors">
                        <X size={14} />
                      </button>
                    </div>

                    {/* FR voices */}
                    {categorizedVoices.fr.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-[9px] font-black uppercase text-white/20 tracking-widest px-1">🇫🇷 Français</p>
                        <div className="grid grid-cols-1 gap-1">
                          {categorizedVoices.fr.map(voice => (
                            <button
                              key={voice.voiceURI}
                              onClick={() => selectVoice(voice)}
                              className={cn(
                                "w-full text-left px-3 py-2 rounded-xl text-[11px] font-semibold flex items-center justify-between gap-2 transition-all",
                                ttsVoice?.voiceURI === voice.voiceURI
                                  ? "bg-blue-500/25 border border-blue-500/40 text-blue-300"
                                  : "bg-white/5 border border-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                              )}
                            >
                            <span className="truncate">{voice.name}</span>
                              <span className="shrink-0 text-[10px] opacity-70">{categorizedVoices.tagVoice(voice)}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* EN voices */}
                    {categorizedVoices.en.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-[9px] font-black uppercase text-white/20 tracking-widest px-1">🇬🇧 English</p>
                        <div className="grid grid-cols-1 gap-1">
                          {categorizedVoices.en.map(voice => (
                            <button
                              key={voice.voiceURI}
                              onClick={() => selectVoice(voice)}
                              className={cn(
                                "w-full text-left px-3 py-2 rounded-xl text-[11px] font-semibold flex items-center justify-between gap-2 transition-all",
                                ttsVoice?.voiceURI === voice.voiceURI
                                  ? "bg-blue-500/25 border border-blue-500/40 text-blue-300"
                                  : "bg-white/5 border border-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                              )}
                            >
                              <span className="truncate">{voice.name}</span>
                              <span className="shrink-0 text-[10px] opacity-70">{categorizedVoices.tagVoice(voice)}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Other voices */}
                    {categorizedVoices.others.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-[9px] font-black uppercase text-white/20 tracking-widest px-1">🌐 Autres langues</p>
                        <div className="grid grid-cols-1 gap-1">
                          {categorizedVoices.others.map(voice => (
                            <button
                              key={voice.voiceURI}
                              onClick={() => selectVoice(voice)}
                              className={cn(
                                "w-full text-left px-3 py-2 rounded-xl text-[11px] font-semibold flex items-center justify-between gap-2 transition-all",
                                ttsVoice?.voiceURI === voice.voiceURI
                                  ? "bg-blue-500/25 border border-blue-500/40 text-blue-300"
                                  : "bg-white/5 border border-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                              )}
                            >
                              <span className="truncate">{voice.name.replace(/Microsoft |Google /, '')}</span>
                              <span className="shrink-0 text-[9px] text-white/30">{voice.lang}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {(categorizedVoices.fr.length + categorizedVoices.en.length + categorizedVoices.others.length) === 0 && (
                      <p className="text-center text-white/30 text-[11px] italic py-4">Aucune voix disponible sur cet appareil.</p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Main TTS bar */}
              <motion.div
                className={cn(
                  "bg-[#0d1117] border border-blue-500/30 rounded-[2rem] shadow-2xl shadow-blue-500/10 flex gap-3 ring-1 ring-blue-500/20",
                  isMobile ? "flex-row items-center p-3" : "flex-col items-center p-3 w-16"
                )}
              >
                {/* Blue animated indicator */}
                <div className="relative shrink-0">
                  <div className="h-10 w-10 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                    <Headphones size={18} className="text-blue-400" />
                  </div>
                  <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-blue-500 animate-ping" />
                  <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-blue-500" />
                </div>

                {/* Texte masqué sur desktop pour garder le format vertical fin */}
                {isMobile && (
                  <div className="flex-1 space-y-0.5 min-w-0">
                    <p className="text-[9px] font-black uppercase text-blue-400 tracking-widest">Lecture vocale</p>
                    <p className="text-[10px] text-white/50 font-semibold truncate">
                      {ttsVoice ? ttsVoice.name : 'Nova (OpenAI)'}
                    </p>
                  </div>
                )}

                {/* Voice picker toggle */}
                <Button
                  onClick={() => setShowVoicePicker(v => !v)}
                  variant="ghost"
                  title="Changer de voix"
                  className={cn(
                    "h-10 w-10 rounded-xl transition-all",
                    showVoicePicker
                      ? "bg-blue-500/30 text-blue-300 border border-blue-500/40"
                      : "text-blue-400/60 hover:text-blue-400 hover:bg-blue-500/10"
                  )}
                >
                  <Mic2 size={16} />
                </Button>

                {/* Pause / Resume */}
                <Button
                  onClick={pauseResumeTts}
                  className="h-10 w-10 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-400 hover:bg-blue-500/30"
                  variant="ghost"
                >
                  {isTtsPaused ? <Play size={18} className="ml-0.5" fill="currentColor" /> : <Pause size={18} fill="currentColor" />}
                </Button>

                {/* Pitch */}
                <Button
                  onClick={() => {
                    const pitches = [0.5, 0.75, 1, 1.25, 1.5, 2]
                    const nextPitch = pitches[(pitches.indexOf(ttsPitch) + 1) % pitches.length]
                    setTtsPitch(nextPitch)
                  }}
                  variant="ghost"
                  title="Tonalité de la voix"
                  className="h-10 w-10 p-0 flex flex-col items-center justify-center rounded-xl text-blue-400 hover:bg-blue-500/10"
                >
                  <Music size={12} className="mb-0.5" />
                  <span className="text-[8px] font-black leading-none">{ttsPitch}x</span>
                </Button>

                {/* Speed */}
                <Button
                  onClick={() => {
                    const rates = [0.75, 1, 1.25, 1.5, 2]
                    const nextRate = rates[(rates.indexOf(ttsRate) + 1) % rates.length]
                    setTtsRate(nextRate)
                  }}
                  variant="ghost"
                  className="h-10 w-10 p-0 flex items-center justify-center rounded-xl text-blue-400 text-[10px] font-black hover:bg-blue-500/10"
                >
                  {ttsRate}x
                </Button>

                {/* Stop */}
                <Button
                  onClick={() => { stopTts(); setShowVoicePicker(false) }}
                  variant="ghost"
                  className="h-10 w-10 rounded-xl text-red-400/70 hover:text-red-400 hover:bg-red-500/10"
                >
                  <StopCircle size={18} />
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {book.file && !effectiveImmersionMode && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className={cn(
              "bg-[#0f1115] border border-white/10 rounded-[2rem] shadow-2xl flex items-center gap-4 ring-1 ring-white/5",
              isMobile ? "p-3 pr-5" : "p-5"
            )}
          >
            <div className={cn(
              "rounded-2xl bg-laha-gold flex items-center justify-center text-laha-black shrink-0",
              isMobile ? "h-10 w-10" : "h-12 w-12"
            )}>
              <Bookmark size={isMobile ? 20 : 24} />
            </div>
            <div className="space-y-0.5">
              <p className="text-[9px] font-black uppercase text-white/40 tracking-[0.2em] leading-none">Progression</p>
              <p className="text-xs md:text-sm font-black text-white">Page {currentPage + 1}</p>
            </div>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {isQuestionModalOpen && isStudent && (
          <AskExpertModal
            book={book}
            isOpen={isQuestionModalOpen}
            onClose={() => setIsQuestionModalOpen(false)}
            onSuccess={() => toast.info("Discussion démarrée.")}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {effectiveImmersionMode && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="fixed inset-0 z-[1000]"
          >
            <FlipBookReader
              fileUrl={rawPdfData ? (typeof rawPdfData === 'string' ? rawPdfData : new Uint8Array(rawPdfData.slice(0))) : new Uint8Array(0)}
              bookId={id as string}
              initialPage={currentPage}
              isMobile={isMobile}
              initialAnnotations={(notes as any[]).filter(n => n.rect).map((n: any): FlipBookAnnotation => ({
                id: n.id,
                page: n.page ?? 0,
                type: n.type ?? 'highlight',
                rect: n.rect,
                color: n.color ?? 'rgba(255,215,0,0.45)',
                content: n.content,
              }))}
              onPageChange={(p) => {
                setCurrentPage(p)
              }}
              onClose={() => setIsImmersionMode(false)}
              onAskQuestion={isStudent ? () => setIsQuestionModalOpen(true) : undefined}
              authorName={book.author_name}
              // Audio Props
              hasAudio={hasAudio}
              isAudioPlaying={isAudioPlaying}
              onToggleAudio={toggleAudio}
              onToggleMute={toggleMute}
              isMuted={isMuted}
              playbackRate={playbackRate}
              onTogglePlaybackRate={togglePlaybackRate}
              audioProgress={audioProgress}
              audioDuration={audioDuration}
              onSeek={handleSeek}
              // TTS (Read Aloud) Props
              isTtsActive={isTtsActive}
              isTtsPaused={isTtsPaused}
              isFetchingTtsText={isFetchingTtsText}
              onToggleTts={handleTtsToggle}
              onPauseResumeTts={pauseResumeTts}
              onStopTts={stopTts}
              ttsRate={ttsRate}
              onToggleTtsRate={() => {
                const rates = [0.75, 1, 1.25, 1.5, 2]
                const nextRate = rates[(rates.indexOf(ttsRate) + 1) % rates.length]
                setTtsRate(nextRate)
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isQuizOverlayOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10001] bg-[#0B0F19]/95 backdrop-blur-3xl"
          >
            <FlipBookQuiz
              bookId={id as string}
              onClose={() => setIsQuizOverlayOpen(false)}
              onComplete={(res) => {
                if (res.is_validated) {
                  setIsQuizValidated(true)
                  // Si le quiz est validé, on force la progression à 100%
                  if (totalPages > 0) {
                    setCurrentPage(totalPages - 1)
                    syncProgress(totalPages - 1)
                  }
                }
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>


  )
}
