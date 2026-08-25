"use client";

import React, { useState, useEffect, useRef, forwardRef, useMemo, useCallback } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { 
  Loader2, ChevronLeft, ChevronRight, X, Check,
  Play, Pause, Volume2, VolumeX, Headphones,
  ZoomIn, ZoomOut, Maximize, Minimize
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { libraryApi } from '@/lib/services/library';
import { cn } from '@/lib/utils';

// Subcomponents & Hooks
import { Annotation, AnnotationRect } from './flipbook/types';
import { useAnnotationEngine } from './flipbook/hooks/useAnnotationEngine';
import { FloatingDock } from './flipbook/FloatingDock';
import { SelectionLayer } from './flipbook/SelectionLayer';
import { AnnotationLayer } from './flipbook/AnnotationLayer';
import { AnnotationSidebar } from './flipbook/AnnotationSidebar';
import { FlipBookQuiz } from './FlipBookQuiz';

const PAGE_RENDER_WINDOW = 4;

const getPageRenderWindow = (pageIndex: number, totalPages: number) => {
  const maxStart = Math.max(totalPages - PAGE_RENDER_WINDOW, 0);
  const start = Math.max(0, Math.min(pageIndex - 1, maxStart));
  const end = Math.min(totalPages - 1, start + PAGE_RENDER_WINDOW - 1);
  return { start, end };
};

/** Mode "laha" : filigrane institutionnel doré discret.
 * Mode "partner" : filigrane nominatif légal (nom, email, IP). */
export type WatermarkMode = "laha" | "partner";

interface FlipBookProps {
  fileUrl: string | Uint8Array;
  bookId: string;
  initialPage?: number;
  isMobile?: boolean;
  onPageChange?: (page: number) => void;
  onClose?: () => void;
  initialAnnotations?: Annotation[];
  onAskQuestion?: () => void;
  authorName?: string;
  /** Mode du filigrane gravé sur chaque canvas. Défaut: "laha" */
  watermarkMode?: WatermarkMode;
  /** Texte principal du filigrane LAHAThèque personnalisable */
  watermarkLahaText?: string;
  /** Sous-texte du filigrane LAHAThèque personnalisable */
  watermarkLahaSubtext?: string;
  /** Position du filigrane sur le canvas : diagonal, header, footer. Défaut: diagonal */
  watermarkPosition?: "diagonal" | "header" | "footer";
  /** Opacité du filigrane entre 0.05 et 0.50. Défaut: 0.20 */
  watermarkOpacity?: number;
  /** Données nominatives pour le mode "partner" */
  watermarkUser?: {
    displayName?: string;
    email?: string;
    ip?: string;
  };


  // Audio support
  hasAudio?: boolean;
  isAudioPlaying?: boolean;
  onToggleAudio?: () => void;
  onToggleMute?: () => void;
  isMuted?: boolean;
  playbackRate?: number;
  onTogglePlaybackRate?: () => void;
  audioProgress?: number;
  audioDuration?: number;
  onSeek?: (percentage: number) => void;
  // TTS support
  isTtsActive?: boolean;
  isTtsPaused?: boolean;
  isFetchingTtsText?: boolean;
  onToggleTts?: () => void;
  onPauseResumeTts?: () => void;
  onStopTts?: () => void;
  ttsRate?: number;
  ttsPitch?: number;
  onToggleTtsRate?: () => void;
  onDocumentLoad?: (numPages: number) => void;
  hideInternalHeader?: boolean;
}


// ─── Page Component (display only) ───────────────────────────
interface PageProps {
  children: React.ReactNode;
  pageNumber: number;
  annotations: Annotation[];
  activeTool: any;
  activeColor: any;
  onDelete: (id: string) => void;
  onAnnotationCreate: (ann: any) => void;
  onNoteCreate: (rect: any) => void;
  watermarkPosition?: "diagonal" | "header" | "footer";
  watermarkOpacity?: number;
  watermarkLahaText?: string;
  watermarkLahaSubtext?: string;
  watermarkMode?: WatermarkMode;
  watermarkUser?: {
    displayName?: string;
    email?: string;
    ip?: string;
  };
  showWatermarkOverlay?: boolean;
}

const Page = forwardRef<HTMLDivElement, PageProps>((props, ref) => {
  const {
    children,
    pageNumber,
    annotations,
    activeTool,
    activeColor,
    onDelete,
    onAnnotationCreate,
    onNoteCreate,
    watermarkPosition = "diagonal",
    watermarkOpacity = 0.20,
    watermarkLahaText,
    watermarkLahaSubtext,
    watermarkMode = "laha",
    watermarkUser,
    showWatermarkOverlay = false,
  } = props;

  const pageAnnotations = useMemo(
    () => annotations.filter(a => a.page === pageNumber - 1),
    [annotations, pageNumber]
  );

  const parsedOp = watermarkOpacity != null ? parseFloat(String(watermarkOpacity)) : 0.20;
  const safeOpacity = !isNaN(parsedOp) ? parsedOp : 0.20;

  const positionStyles: React.CSSProperties = {
    pointerEvents: "none",
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 15,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    userSelect: "none",
    opacity: safeOpacity,
    padding: "0 24px",
  };

  if (watermarkPosition === "header") {
    positionStyles.top = "20px";
  } else if (watermarkPosition === "footer") {
    positionStyles.bottom = "24px";
  } else {
    // diagonal exacte (aspect ratio standard livre 1:1.414 -> angle ~54.7°)
    positionStyles.left = "50%";
    positionStyles.top = "50%";
    positionStyles.right = "auto";
    positionStyles.width = "75%";
    positionStyles.maxWidth = "75%";
    positionStyles.transform = "translate(-50%, -50%) rotate(-54.7deg)";
    positionStyles.whiteSpace = "nowrap";
  }

  return (

    <div className="bg-background shadow-md overflow-hidden relative select-none border border-border" ref={ref}>



      <div className="h-full w-full relative">
        {/* Layer 1 — Page Image */}
        {children}

        {/* Layer 2 — Calque Filigrane Réactif (Désactivé si le PDF est déjà filigrané par le backend) */}
        {showWatermarkOverlay && (
          <div style={positionStyles} aria-hidden="true">
            {watermarkMode === "laha" ? (
              <>
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "#B08D42",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    textAlign: "center",
                    lineHeight: 1.3,
                    textShadow: "0 0 1px rgba(0,0,0,0.1)",
                  }}
                >
                  {watermarkLahaText || "LAHAThèque • Document Certifié & Protégé"}
                </div>
                {watermarkLahaSubtext && (
                  <div
                    style={{
                      fontSize: "9px",
                      fontWeight: 600,
                      color: "rgba(176, 141, 66, 0.85)",
                      fontFamily: "monospace",
                      letterSpacing: "0.04em",
                      marginTop: "4px",
                      textAlign: "center",
                    }}
                  >
                    {watermarkLahaSubtext}
                  </div>
                )}
              </>
            ) : (
              <>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 800,
                    color: "#B4AB6B",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    textAlign: "center",
                    lineHeight: 1.3,
                    textShadow: "0 0 1px rgba(0,0,0,0.1)",
                  }}
                >
                  {watermarkLahaText || (watermarkUser?.displayName ? `LAHALEX • ${watermarkUser.displayName}` : "Document Juridique Sécurisé")}
                </div>
                <div
                  style={{
                    fontSize: "10px",
                    fontWeight: 600,
                    color: "rgba(180, 171, 107, 0.9)",
                    fontFamily: "monospace",
                    letterSpacing: "0.04em",
                    marginTop: "3px",
                    textAlign: "center",
                  }}
                >
                  {watermarkUser?.email || watermarkUser?.ip
                    ? `IP: ${watermarkUser?.ip || "127.0.0.1"} • ${watermarkUser?.email || ""}`
                    : "Licence Partenaire • Reproduction Interdite"}
                </div>
              </>
            )}
          </div>
        )}

        {/* Layer 3 — Annotations */}
        <AnnotationLayer
          annotations={pageAnnotations}
          activeTool={activeTool}
          onDelete={onDelete}
        />

        {/* Layer 4 — Selection */}
        <SelectionLayer 
          activeTool={activeTool}
          activeColor={activeColor}
          pageIdx={pageNumber - 1}
          onAnnotationCreate={onAnnotationCreate}
          onNoteCreate={onNoteCreate}
        />

        {/* Page number */}
        <div className="absolute bottom-2 left-0 right-0 text-center text-[10px] text-foreground-muted font-mono pointer-events-none z-30">
          — {pageNumber} —
        </div>
      </div>
    </div>
  );
});
Page.displayName = 'Page';


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
  watermarkMode = 'laha',
  watermarkPosition = 'diagonal',
  watermarkOpacity = 0.20,
  watermarkLahaText,
  watermarkLahaSubtext,
  watermarkUser,
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
  ttsPitch = 1,
  onDocumentLoad,
  hideInternalHeader = false,
}) => {
  const [numPages, setNumPages]     = useState<number>(0);

  const [pages, setPages]           = useState<string[]>([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [pageInput, setPageInput] = useState<string>('');

  const toggleFullscreen = () => {
    if (typeof document === 'undefined') return;
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Quiz States
  const [showQuiz, setShowQuiz] = useState(false);
  const [hasQuiz, setHasQuiz] = useState(false);
  const [isQuizValidated, setIsQuizValidated] = useState(false);

  const pdfInstance       = useRef<any>(null);
  const renderingIndices  = useRef<Set<number>>(new Set());
  const bookRef           = useRef<any>(null);
  const [dimensions, setDimensions] = useState({ width: 450, height: 636 });

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
  } = useAnnotationEngine(bookId, initialAnnotations);

  // ── Responsive dimensions ──
  useEffect(() => {
    const update = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      
      if (vw < 768) {
        const w = vw - 32;
        setDimensions({ width: w, height: Math.min(vh * 0.7, w * 1.414) });
      } else if (vw < 1100) {
        const h = Math.min(vh * 0.85, 800);
        const w = Math.min((vw - 80) / 2, h / 1.414);
        setDimensions({ width: w, height: w * 1.414 });
      } else {
        const height = Math.min(vh * 0.85, 900);
        setDimensions({ width: height / 1.414, height });
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);








  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 's')) {
        e.preventDefault();
        return;
      }

      if (e.key === 'ArrowLeft' && !showNoteModal)  bookRef.current?.pageFlip().flipPrev();
      if (e.key === 'ArrowRight' && !showNoteModal) bookRef.current?.pageFlip().flipNext();
      if (e.key === 'Escape') {
        if (showNoteModal) setShowNoteModal(false);
        else onClose?.();
      }
      if (showNoteModal) return;
      if (e.key === 'h') setActiveTool('highlight');
      if (e.key === 'u') setActiveTool('underline');
      if (e.key === 'n') setActiveTool('note');
      if (e.key === 'e') setActiveTool('erase');
      if (e.key === 'r') setActiveTool('read');
    };

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('copy', handleCopy);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('copy', handleCopy);
    };
  }, [onClose, showNoteModal, setActiveTool]);

  const initialPageRef = useRef(initialPage ?? 0);
  const onDocumentLoadRef = useRef(onDocumentLoad);
  onDocumentLoadRef.current = onDocumentLoad;

  // ── PDF loading (Only on mount or when bookId/fileUrl change) ──
  useEffect(() => {
    if (!fileUrl || (fileUrl instanceof Uint8Array && fileUrl.length === 0)) return;
    let isCancelled = false;

    const loadPdf = async () => {
      setIsLoading(true);
      try {
        const pdfjs = await import('pdfjs-dist/legacy/build/pdf.js' as any);
        pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

        let pdfSource: any;
        if (typeof fileUrl === 'string') {
          const origin = typeof window !== 'undefined' ? window.location.origin : '';
          const absoluteUrl = (fileUrl.startsWith('http') || fileUrl.startsWith('blob:'))
            ? fileUrl
            : `${origin}${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`;
          try {
            const res = await fetch(absoluteUrl, { headers: { Accept: 'application/pdf' } });
            if (res.ok) {
              const contentType = res.headers.get('content-type') || '';
              if (!contentType.includes('json') && !contentType.includes('html')) {
                const buffer = await res.arrayBuffer();
                const bytes = new Uint8Array(buffer);
                // Vérification basique du header PDF (%PDF-)
                if (bytes.length > 4 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
                  pdfSource = { data: bytes };
                } else {
                  pdfSource = absoluteUrl;
                }
              } else {
                pdfSource = absoluteUrl;
              }
            } else {
              pdfSource = absoluteUrl;
            }
          } catch {
            pdfSource = absoluteUrl;
          }
        } else if (typeof fileUrl === 'object' && fileUrl !== null) {
          pdfSource = { data: fileUrl };
        } else {
          pdfSource = fileUrl;
        }

        const loadingTask = pdfjs.getDocument(pdfSource);
        const pdf = await loadingTask.promise;
        if (isCancelled) return;

        pdfInstance.current = pdf;
        const total = pdf.numPages;
        setNumPages(total);
        setPages(new Array(total).fill(''));
        onDocumentLoadRef.current?.(total);

        const renderPage = async (idx: number): Promise<string> => {
          const page     = await pdf.getPage(idx + 1);
          const viewport = page.getViewport({ scale: 1.5 });
          const canvas   = document.createElement('canvas');
          const ctx      = canvas.getContext('2d', { willReadFrequently: true });
          if (!ctx) return '';
          canvas.height = viewport.height;
          canvas.width  = viewport.width;
          await page.render({ canvasContext: ctx, viewport }).promise;
          return new Promise<string>(res => canvas.toBlob(b => res(b ? URL.createObjectURL(b) : ''), 'image/jpeg', 0.9));
        };



        const initialWindow = getPageRenderWindow(initialPageRef.current, total);
        for (let i = initialWindow.start; i <= initialWindow.end; i++) {
          if (isCancelled) return;
          const url = await renderPage(i);
          setPages(prev => { const next = [...prev]; next[i] = url; return next; });
        }
        if (!isCancelled) setIsLoading(false);

        try {
          const quizData = await libraryApi.getQuizzes(bookId);
          if (quizData && quizData.questions.length > 0) {
            setHasQuiz(true);
            if (initialPageRef.current >= total - 1) {
              setShowQuiz(true);
            }
          }
        } catch (err) {
          console.error("[FlipBook] Quiz check error:", err);
        }
      } catch (err) {
        console.error('[FlipBook] PDF load error:', err);
        if (!isCancelled) setIsLoading(false);
      }
    };
    loadPdf();

    return () => {
      isCancelled = true;
    };
  }, [fileUrl, bookId]);

  // ── Lazy load nearby pages ──
  useEffect(() => {
    if (!numPages || pages.length === 0 || !pdfInstance.current) return;
    const load = async () => {
      const { start, end } = getPageRenderWindow(currentPage, numPages);
      for (let i = start; i <= end; i++) {
        if (pages[i] || renderingIndices.current.has(i)) continue;
        try {
          renderingIndices.current.add(i);
          const page     = await pdfInstance.current.getPage(i + 1);
          const viewport = page.getViewport({ scale: 1.5 });
          const canvas   = document.createElement('canvas');
          const ctx      = canvas.getContext('2d', { willReadFrequently: true });
          if (ctx) {
            canvas.height = viewport.height;
            canvas.width  = viewport.width;
            await page.render({ canvasContext: ctx, viewport }).promise;

            const url = await new Promise<string>(res => canvas.toBlob(b => res(b ? URL.createObjectURL(b) : ''), 'image/jpeg', 0.9));
            setPages(prev => { if (prev[i]) return prev; const next = [...prev]; next[i] = url; return next; });

          }
        } finally {
          renderingIndices.current.delete(i);
        }
      }
    };
    load();
  }, [currentPage, numPages, pages, bookId]);


  const onFlip = (e: any) => {
    setCurrentPage(e.data);
    onPageChange?.(e.data);
  };

  const notePopoverCssCoords = useMemo(() => {
    if (!pendingNoteRect) return { left: '50%', top: '50%' };
    const xBase = pendingNoteRect.pageIdx === currentPage ? pendingNoteRect.x / 2 : 50 + pendingNoteRect.x / 2;
    return {
      left: `calc(min(max(10px, ${xBase}%), calc(100% - 330px)))`,
      top: `calc(min(max(10px, ${pendingNoteRect.y}%), calc(100% - 220px)))`
    };
  }, [pendingNoteRect, currentPage]);

  if (isLoading || dimensions.width === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-screen bg-[var(--partner-bg,#0F1A33)] space-y-4">
        <Loader2 className="w-12 h-12 text-[var(--partner-accent,#B4AB6B)] animate-spin" />
        <p className="text-[var(--partner-accent,#B4AB6B)] font-bold uppercase tracking-widest text-xs font-mono">
          Préparation du livre 3D...
        </p>
      </div>
    );
  }

  return (
    <div 
      onContextMenu={(e) => e.preventDefault()}
      className="laha-reader-zone relative w-full h-screen min-h-screen flex flex-col overflow-hidden select-none bg-[var(--partner-bg,#0F1A33)] text-[var(--partner-text,#FFFFFF)]"
    >
      {/* ── Top Header ─────────────────────────────────── */}
      {!hideInternalHeader && (
        <header className="w-full bg-navy border-b border-navy-hover px-4 md:px-8 py-2.5 flex items-center justify-between text-white shrink-0 z-50">
          <div className="flex items-center gap-3 min-w-0">
            <span className="font-bold text-gold text-sm md:text-base tracking-tight font-serif truncate">
              LAHAThèque • Immersion 3D
            </span>

          {/* Direct Page Jump Input */}
          <div className="flex items-center gap-1.5 bg-navy-dark border border-navy-hover rounded-lg px-2.5 py-1 text-xs">
            <span className="text-white/60 text-[10px] uppercase font-mono hidden sm:inline">Page</span>
            <input
              type="number"
              min={1}
              max={numPages}
              value={pageInput !== '' ? pageInput : currentPage + 1}
              onChange={(e) => setPageInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const p = parseInt(pageInput, 10);
                  if (!isNaN(p) && p >= 1 && p <= numPages) {
                    bookRef.current?.pageFlip().turnToPage(p - 1);
                  }
                  setPageInput('');
                }
              }}
              onBlur={() => {
                const p = parseInt(pageInput, 10);
                if (!isNaN(p) && p >= 1 && p <= numPages) {
                  bookRef.current?.pageFlip().turnToPage(p - 1);
                }
                setPageInput('');
              }}
              className="w-10 bg-navy border border-navy-hover rounded text-center text-gold font-bold font-mono text-xs focus:outline-none focus:border-gold"
            />
            <span className="text-white/60 text-xs font-mono">/ {numPages}</span>
          </div>

          <button 
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            className="flex items-center gap-1.5 bg-navy-dark hover:bg-navy border border-navy-hover px-2.5 py-1 rounded-md text-xs text-gold font-mono transition-colors cursor-pointer shrink-0"
          >
            <span>{annotations.length} annot.</span>
            <ChevronRight size={12} />
          </button>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Zoom Controls */}
          <div className="hidden sm:flex items-center gap-1 bg-navy-dark border border-navy-hover rounded-lg p-0.5 text-white">
            <button
              type="button"
              onClick={() => setZoomScale(z => Math.max(+(z - 0.15).toFixed(2), 0.6))}
              title="Zoom arrière"
              className="h-7 w-7 rounded flex items-center justify-center text-white/70 hover:text-gold hover:bg-navy cursor-pointer transition-colors"
            >
              <ZoomOut size={14} />
            </button>
            <button
              type="button"
              onClick={() => setZoomScale(1)}
              title="Réinitialiser zoom"
              className="px-1.5 text-[10px] font-mono font-bold text-gold hover:underline cursor-pointer"
            >
              {Math.round(zoomScale * 100)}%
            </button>
            <button
              type="button"
              onClick={() => setZoomScale(z => Math.min(+(z + 0.15).toFixed(2), 2.0))}
              title="Zoom avant"
              className="h-7 w-7 rounded flex items-center justify-center text-white/70 hover:text-gold hover:bg-navy cursor-pointer transition-colors"
            >
              <ZoomIn size={14} />
            </button>
          </div>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Quitter plein écran" : "Plein écran"}
            className="h-9 w-9 rounded-lg bg-navy-dark hover:bg-navy border border-navy-hover text-white/80 hover:text-gold flex items-center justify-center cursor-pointer transition-colors"
          >
            {isFullscreen ? <Minimize size={15} /> : <Maximize size={15} />}
          </button>

          {/* TTS Read Aloud */}
          {onToggleTts && (
            <button
              type="button"
              onClick={onToggleTts}
              disabled={isFetchingTtsText}
              className={cn(
                "inline-flex flex-row items-center justify-center gap-1.5 whitespace-nowrap h-9 px-3 rounded-lg text-xs font-semibold min-h-[36px] cursor-pointer transition-colors",
                isTtsActive
                  ? "bg-gold text-navy font-bold border border-gold"
                  : "bg-navy-dark text-gold hover:bg-navy border border-navy-hover"
              )}
            >
              {isFetchingTtsText ? <Loader2 size={14} className="animate-spin text-gold" /> : <Headphones size={14} />}
              <span className="hidden md:inline">{isTtsActive ? 'Arrêter TTS' : 'Lecture Vocale'}</span>
            </button>
          )}

          {/* Quiz Button */}
          {hasQuiz && currentPage >= numPages - 1 && !isQuizValidated && !showQuiz && (
            <button 
              type="button"
              onClick={() => setShowQuiz(true)}
              className="inline-flex flex-row items-center justify-center gap-1.5 whitespace-nowrap h-9 px-3.5 rounded-lg bg-gold hover:bg-gold-hover text-navy text-xs font-bold transition-all cursor-pointer min-h-[36px]"
            >
              <Check size={14} strokeWidth={3} />
              <span>Quiz</span>
            </button>
          )}

          {/* Audio Narrator */}
          {hasAudio && (
            <div className="flex items-center gap-1.5 bg-navy-dark border border-navy-hover rounded-lg p-1">
              <button 
                type="button"
                onClick={onToggleAudio}
                className="h-7 w-7 rounded-md bg-gold text-navy hover:bg-gold-hover flex items-center justify-center cursor-pointer min-h-[28px] min-w-[28px]"
              >
                {isAudioPlaying ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
              </button>
              <button 
                type="button"
                onClick={onToggleMute}
                className="h-7 w-7 rounded-md bg-navy text-gold hover:bg-navy-dark flex items-center justify-center cursor-pointer min-h-[28px] min-w-[28px]"
              >
                {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </button>
            </div>
          )}

          {/* Quit Immersion */}
          <button
            type="button"
            onClick={onClose}
            className="inline-flex flex-row items-center justify-center gap-1.5 whitespace-nowrap h-9 px-3.5 rounded-lg bg-navy-dark hover:bg-navy border border-navy-hover text-gold text-xs font-bold transition-colors cursor-pointer min-h-[36px]"
          >
            <X size={14} />
            <span className="hidden md:inline">Mode Normal</span>
          </button>
        </div>
      </header>
      )}

      {/* ── FlipBook Main Canvas (Centered Vertically & Horizontally) ── */}
      <main className="flex-1 w-full h-full flex items-center justify-center relative p-4 md:p-6 overflow-hidden">
        <div 
          className="relative flex items-center justify-center group"
          style={{ transform: `scale(${zoomScale})`, transition: 'transform 0.2s cubic-bezier(0.25, 1, 0.5, 1)' }}
        >
        
        {/* Navigation Overlays */}
        {activeTool === 'read' && (
          <>
            <div className="absolute inset-y-0 left-0 w-1/4 z-[400] cursor-pointer" onClick={() => bookRef.current?.pageFlip().flipPrev()} />
            <div className="absolute inset-y-0 right-0 w-1/4 z-[400] cursor-pointer" onClick={() => bookRef.current?.pageFlip().flipNext()} />
          </>
        )}

        <button
          type="button"
          onClick={() => bookRef.current?.pageFlip().flipPrev()}
          disabled={currentPage === 0}
          className={cn(
            "absolute z-[600] p-3 rounded-full bg-navy border border-gold/30 text-gold transition-all duration-300 shadow-xl cursor-pointer min-h-[44px] min-w-[44px]",
            "hover:bg-navy hover:scale-110 active:scale-95 disabled:opacity-0 disabled:pointer-events-none",
            isMobile 
              ? "fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] left-4 opacity-100" 
              : "opacity-0 group-hover:opacity-100 -left-20"
          )}
        >
          <ChevronLeft size={isMobile ? 20 : 28} />
        </button>

        <div className="relative shadow-2xl rounded-2xl overflow-hidden border border-navy-hover">

          <HTMLFlipBook
            key={`${bookId}_${watermarkPosition}_${watermarkOpacity}_${watermarkLahaText}_${dimensions.width}`}
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
                  setPendingNoteRect(rect);
                  setShowNoteModal(true);
                }}
                watermarkPosition={watermarkPosition}
                watermarkOpacity={watermarkOpacity}
                watermarkLahaText={watermarkLahaText}
                watermarkLahaSubtext={watermarkLahaSubtext}
                watermarkMode={watermarkMode}
                watermarkUser={watermarkUser}
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
                  <div className="w-full h-full flex flex-col items-center justify-center bg-background space-y-2">
                    <Loader2 className="w-6 h-6 text-gold animate-spin" />
                  </div>
                )}
              </Page>
            ))}
          </HTMLFlipBook>
          
          {/* Contextual Note Popover */}
          <AnimatePresence>
            {showNoteModal && pendingNoteRect && (
              <div className="absolute inset-0 z-[600] pointer-events-none">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: 10 }}
                  style={notePopoverCssCoords}
                  className="absolute pointer-events-auto bg-navy/95 border border-gold/30 rounded-2xl p-5 w-80 shadow-2xl text-white"
                >
                  <p className="text-[10px] font-black uppercase tracking-widest text-gold mb-1 flex items-center gap-2">
                    Nouvelle note de lecture
                  </p>
                  <p className="text-[9px] text-navy-light italic mb-3">Attachée à cette zone de la page {pendingNoteRect.pageIdx + 1}</p>
                  <textarea
                    autoFocus
                    rows={4}
                    value={noteText}
                    onChange={e => setNoteText(e.target.value)}
                    className="w-full bg-background/10 border border-navy-hover rounded-xl p-3 text-xs text-white outline-none focus:border-gold focus:bg-background/20 resize-none transition-all placeholder:text-white/30 italic"
                    placeholder="Saisissez votre note de lecture..."
                  />
                  <div className="flex gap-2 mt-4">
                    <button
                      type="button"
                      onClick={() => { setShowNoteModal(false); setPendingNoteRect(null); setNoteText(''); }}
                      className="flex-1 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest text-navy-light hover:text-white hover:bg-navy-dark transition-colors cursor-pointer min-h-[36px]"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (noteText.trim()) {
                          handleAnnotationCreate({
                            page:    pendingNoteRect.pageIdx,
                            type:    'note',
                            rect:    { x: pendingNoteRect.x, y: pendingNoteRect.y, w: pendingNoteRect.w, h: pendingNoteRect.h },
                            color:   'rgba(212,175,55,0.45)',
                            content: noteText.trim(),
                          });
                        }
                        setShowNoteModal(false);
                        setPendingNoteRect(null);
                        setNoteText('');
                      }}
                      disabled={!noteText.trim()}
                      className="flex-1 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest bg-gold text-navy disabled:opacity-40 hover:bg-gold-hover transition-all flex items-center justify-center gap-1 cursor-pointer min-h-[36px]"
                    >
                      <Check size={14} /> Enregistrer
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>

        <button
          type="button"
          onClick={() => bookRef.current?.pageFlip().flipNext()}
          disabled={currentPage >= pages.length - 1}
          className={cn(
            "absolute z-[600] p-3 rounded-full bg-navy border border-gold/30 text-gold transition-all duration-300 shadow-xl cursor-pointer min-h-[44px] min-w-[44px]",
            "hover:bg-navy hover:scale-110 active:scale-95 disabled:opacity-0 disabled:pointer-events-none",
            isMobile 
              ? "fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] right-4 opacity-100" 
              : "opacity-0 group-hover:opacity-100 -right-20"
          )}
        >
          <ChevronRight size={isMobile ? 20 : 28} />
        </button>
        </div>
      </main>

      {/* ── Progress Bar ──────────────────────────────── */}
      <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-navy-dark pointer-events-none z-[100]">
        <motion.div
          className="h-full bg-gold shadow-md"
          initial={{ width: 0 }}
          animate={{ width: `${((currentPage + 1) / numPages) * 100}%` }}
          transition={{ type: 'spring', stiffness: 40 }}
        />
      </div>

      {/* ── Floating Dock ─────────────────── */}
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
          bookRef.current?.pageFlip().turnToPage(pageIdx);
          setIsSidebarOpen(false);
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
            className="absolute inset-0 z-[1000] bg-navy-dark p-4 sm:p-8"
          >
            <FlipBookQuiz 
              bookId={bookId} 
              onClose={() => setShowQuiz(false)}
              onComplete={(res) => {
                if (res.is_validated) setIsQuizValidated(true);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
      
    </div>
  );
}

export type { Annotation } from './flipbook/types';
