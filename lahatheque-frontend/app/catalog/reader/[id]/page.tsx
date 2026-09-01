"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeft, Moon, Sun,
  Save, Bookmark, Trash2, LayoutGrid, X, CheckCircle2,
  Volume2, VolumeX, Play, Pause, SkipBack, SkipForward, Music, Headphones, StopCircle, Mic2,
  Edit3
} from "lucide-react"

import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import { PageLoader, InlineLoader } from "@/components/ui/page-loader"

// Core viewer
import { Viewer, Worker as PdfWorker, ThemeContext, Position, Tooltip, ViewMode, SpecialZoomLevel, ScrollMode, Plugin, PluginRenderPageLayer } from '@react-pdf-viewer/core'

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
import { ReaderSecurity } from "@/components/features/reader/ReaderSecurity"


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
import { libraryApi, SERVER_ROOT_URL } from "@/lib/services/library"
import { askExpertQuestion } from "@/lib/api-student-qa"
import { cn } from "@/lib/utils"
import { HelpCircle, MessageCircle, Send } from "lucide-react"
import { useAudioPlayer } from "./hooks/useAudioPlayer"
import { useTextToSpeech } from "./hooks/useTextToSpeech"
import { useAnnotations } from "./hooks/useAnnotations"
import { usePdfReaderSecurity } from "./hooks/usePdfReaderSecurity"
import { getDrmGlobalSettings } from "@/lib/services/protection"

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
        className="absolute inset-0 bg-black/80"
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
                {isSubmitting ? <InlineLoader size={16} /> : <Send size={16} className="mr-2" />}
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
  const [rawPdfData, setRawPdfData] = useState<string | null>(null)
  const [isPdfLoading, setIsPdfLoading] = useState(false)
  const [pdfLoadError, setPdfLoadError] = useState<string | null>(null)
  const [drmSettings, setDrmSettings] = useState<any>(null)

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
  const [isSampleMode, setIsSampleMode] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsSampleMode(new URLSearchParams(window.location.search).get('mode') === 'sample')
    }
  }, [])

  const [isSaving, setIsSaving] = useState(false)
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.SinglePage)
  const [isImmersionMode, setIsImmersionMode] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  const isAudioOnly = book ? (!book.file && !!book.audio_file) : false
  const isOfficeDoc = book?.file?.match(/\.(docx|doc|pptx|ppt|xlsx|xls)$/i)
  const effectiveImmersionMode = (isMobile || isAudioOnly || isOfficeDoc) ? false : isImmersionMode

  const [hasQuiz, setHasQuiz] = useState(false)
  const [isQuizValidated, setIsQuizValidated] = useState(false)
  const [isQuizOverlayOpen, setIsQuizOverlayOpen] = useState(false)
  const [showSampleEndOverlay, setShowSampleEndOverlay] = useState(false)

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
    <div className="flex flex-col h-full bg-navy-dark text-white">
      <div className="p-6 border-b border-navy-hover">
        <h3 className="text-gold text-[10px] font-black uppercase tracking-[0.2em]">Mes Annotations</h3>
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
      defaultTabs[0], // Miniatures (Page Thumbnails)
      defaultTabs[1], // Table des matières (Document Outline)
      defaultTabs[2], // Pièces jointes (Attachments)
      {
        content: <NotesSidebar />,
        icon: <Edit3 size={18} />,
        title: 'Mes Annotations',
      },
    ],
    renderToolbar: (Toolbar: any) => (
      <Toolbar>
        {(props: any) => {
          const {
            CurrentPageInput,
            EnterFullScreen,
            GoToNextPage,
            GoToPreviousPage,
            NumberOfPages,
            ShowSearchPopover,
            Zoom,
            ZoomIn,
            ZoomOut,
            Rotate,
            SwitchTheme,
          } = props;
          return (
            <div className="rpv-toolbar" style={{ alignItems: 'center', display: 'flex', width: '100%', padding: '0 8px', gap: '4px' }}>
              <div style={{ padding: '0px 2px' }}><ShowSearchPopover /></div>
              <div style={{ padding: '0px 2px' }}><Rotate /></div>
              <div className="rpv-toolbar__divider" style={{ borderRight: '1px solid #2E3F66', height: '20px', margin: '0 4px' }} />
              <div style={{ padding: '0px 2px' }}><GoToPreviousPage /></div>
              <div style={{ padding: '0px 2px', width: '3.5rem' }}><CurrentPageInput /></div>
              <div style={{ padding: '0px 4px', fontSize: '12px', fontWeight: 600, color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>sur</span>
                <NumberOfPages>
                  {(numProps: any) => (
                    <span style={{ color: '#D4A017', fontWeight: 700 }}>
                      {numProps?.numberOfPages || totalPages || 1}
                    </span>
                  )}
                </NumberOfPages>
              </div>
              <div style={{ padding: '0px 2px' }}><GoToNextPage /></div>
              <div className="rpv-toolbar__divider" style={{ borderRight: '1px solid #2E3F66', height: '20px', margin: '0 4px' }} />
              <div style={{ padding: '0px 2px' }}><ZoomOut /></div>
              <div style={{ padding: '0px 2px' }}><Zoom /></div>
              <div style={{ padding: '0px 2px' }}><ZoomIn /></div>
              <div className="rpv-toolbar__divider" style={{ borderRight: '1px solid #2E3F66', height: '20px', margin: '0 4px' }} />
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
        className="bg-navy border border-gold/30 p-1.5 rounded-xl shadow-2xl flex items-center gap-1 animate-in fade-in zoom-in duration-200"
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
          const contractId = sParams.get('contract_id') || ''
          let file = sParams.get('file') || ''
          const title = sParams.get('title') || 'Support de cours'
          const lessonId = sParams.get('lesson_id') || ''
          
          if (contractId) {
            file = `/api/bff/rights/legal/contracts/${contractId}/stream`
          } else if (file && !file.startsWith('http') && !file.startsWith('/')) {
            file = `/uploads/${file}`
          }
          
          const fakeBook = {
            id: contractId || 'lesson_pdf',
            title,
            file,
            progress: { last_page: 0 }
          }
          setBook(fakeBook)

          // Chargement de la configuration DRM globale
          try {
            const drmConfig = await getDrmGlobalSettings()
            if (drmConfig) setDrmSettings(drmConfig)
          } catch (e) {
            console.warn('[Reader] Erreur récupération drm settings:', e)
          }
          
          if (file) {
            try {
              const streamRes = await fetch(file, {
                headers: { Accept: 'application/pdf' },
                credentials: 'include',
              });
              if (streamRes.ok) {
                const blob = await streamRes.blob();
                const blobUrl = URL.createObjectURL(blob);
                setRawPdfData(blobUrl);
              } else {
                setRawPdfData(file);
              }
            } catch {
              setRawPdfData(file);
            }
          } else {
            setRawPdfData(null);
          }
          setIsLoading(false);
          return;
        }

        const isSampleMode = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('mode') === 'sample';

        const data = await libraryApi.getBook(id as string).catch(() => ({
          id: id as string,
          title: "Extrait Gratuit",
          format_type: "pdf" as const,
          file: "",
          progress: { last_page: 0 },
        }));
        setBook(data as any)
        if (data && 'progress' in data && data.progress && !isSampleMode) {
          setCurrentPage(data.progress.last_page || 0)
        }

        // --- CHARGEMENT SÉCURISÉ EN MÉMOIRE (BLOB URL) ---
        // Empêche les extensions comme Internet Download Manager (IDM) d'intercepter la requête
        // et garantit un affichage instantané dans le lecteur normal sans erreur 204
        const targetStreamUrl = isSampleMode
          ? `/api/bff/catalog/books/${id}/sample/`
          : ((data && data.file) ? data.file : (id === 'lesson_pdf' ? '' : `/api/bff/catalog/books/${id}/stream/`));

        if (targetStreamUrl) {
          try {
            const streamRes = await fetch(targetStreamUrl, {
              headers: { Accept: 'application/pdf' },
              credentials: 'include',
            });
            if (streamRes.ok) {
              const blob = await streamRes.blob();
              const blobUrl = URL.createObjectURL(blob);
              setRawPdfData(blobUrl);
            } else {
              setPdfLoadError(
                streamRes.status === 403
                  ? "Vous n'avez pas accès à cet ouvrage. Achetez-le ou vérifiez votre abonnement."
                  : (isSampleMode
                      ? "Impossible de charger l'extrait gratuit pour cet ouvrage."
                      : "Ce document est introuvable ou n'a pas encore été mis en ligne.")
              );
            }
          } catch {
            setPdfLoadError("Impossible de contacter le serveur de documents. Vérifiez votre connexion et réessayez.");
          }
        }

        // Check for Quiz (uniquement en lecture intégrale, jamais pour un extrait)
        if (!isSampleMode) {
          const quizRes = await libraryApi.getQuizzes(id as string)
          if (quizRes && quizRes.questions.length > 0) {
            setHasQuiz(true)
          }
        }

      } catch (err) {
        console.warn("API indisponible, chargement du document de démonstration R2:", err)
        const demoBook = {
          id: id as string,
          title: "Droit Constitutionnel des États d'Afrique Francophone",
          file: "https://raw.githubusercontent.com/mozilla/pdf.js/ba2edeae/web/compressed.tracemonkey-pbf.pdf",
          format_type: "pdf",
          progress: { last_page: 0 }
        }
        setBook(demoBook)

        try {
          const streamRes = await fetch(demoBook.file)
          if (streamRes.ok) {
            const blob = await streamRes.blob()
            setRawPdfData(URL.createObjectURL(blob))
          } else {
            setRawPdfData(demoBook.file)
          }
        } catch {
          setRawPdfData(demoBook.file)
        }
      }
    }

    const loadAll = async () => {
      setIsLoading(true);
      try {
        const [, drm] = await Promise.all([
          fetchBook(),
          getDrmGlobalSettings().catch(() => null),
        ]);
        if (drm) {
          setDrmSettings(drm);
        }
      } finally {
        setIsLoading(false);
      }
    };
    loadAll();
  }, [id, router])




  // Sync progress with backend
  const syncProgress = useCallback(async (page: number, customTotal?: number) => {
    try {
      const effectiveTotal = customTotal && customTotal > 0 ? customTotal : (totalPages > 0 ? totalPages : (book?.page_count || 1));
      const targetPage = Math.max(1, page + 1);

      if (id === 'lesson_pdf') {
        const sParams = new URLSearchParams(window.location.search);
        const bookId = sParams.get('book_id');
        const lessonId = sParams.get('lesson_id');

        if (bookId && effectiveTotal > 0) {
          await libraryApi.syncProgress(bookId, targetPage, effectiveTotal, 15);
        }
        if (lessonId && effectiveTotal > 0) {
          const pos = targetPage;
          const pct = Math.min(100, Math.round((pos / effectiveTotal) * 100));
          const completed = pct >= 90;
          await fetch(`/api/bff/content/lessons/${lessonId}/progress/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              last_position: pos,
              progress: pct,
              completed,
            }),
          });
        }
        return;
      }

      if (id && !String(id).startsWith('sample-') && !isSampleMode) {
        await libraryApi.syncProgress(id as string, targetPage, effectiveTotal, 15);
      }
    } catch (err) {
      console.error("Erreur sync progression", err);
    }
  }, [id, totalPages, book, isSampleMode]);

  // Handle page change from viewer
  const handlePageChange = (e: { currentPage: number }) => {
    setCurrentPage(e.currentPage);
    syncProgress(e.currentPage, totalPages);
  };

  // Handle document load to get total pages
  const handleDocumentLoad = (e: { doc: any }) => {
    const num = e.doc?.numPages || 1;
    setTotalPages(num);
    syncProgress(currentPage, num);
  };

  // Periodic sync (every 15 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      if (currentPage >= 0 && id && !isSampleMode) {
        syncProgress(currentPage, totalPages);
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [currentPage, totalPages, id, isSampleMode, syncProgress]);

  // Sync on unmount or before leaving page
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (currentPage >= 0 && id && !isSampleMode) {
        syncProgress(currentPage, totalPages);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (currentPage >= 0 && id && !isSampleMode) {
        syncProgress(currentPage, totalPages);
      }
    };
  }, [currentPage, totalPages, id, isSampleMode, syncProgress]);

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
      <div className="h-screen bg-background flex flex-col items-center justify-center">
        <PageLoader label={isPdfLoading ? 'Chargement sécurisé du document' : 'Préparation de votre salle de lecture'} />
      </div>
    )
  }

  if (pdfLoadError) {
    return (
      <div className="h-screen flex flex-col select-none bg-navy-dark text-white">
        <header className="px-4 md:px-8 flex items-center justify-between border-b border-navy-hover relative z-[100] bg-navy h-auto py-3 md:h-20 md:py-0 text-white">
          <div className="flex items-center gap-3 md:gap-6 flex-1 min-w-0">
            <Button
              onClick={() => router.back()}
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-lg inline-flex items-center justify-center p-0 text-gold bg-navy-dark hover:bg-navy border border-navy-hover cursor-pointer shrink-0 transition-colors"
            >
              <ArrowLeft size={18} />
            </Button>
            <div className="space-y-0.5 min-w-0">
              <h1 className="font-bold uppercase tracking-tight truncate font-serif text-gold text-base">
                {book?.title || "Ouvrage"}
              </h1>
            </div>
          </div>
        </header>
        <main className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
          <p className="text-white text-sm font-semibold max-w-md">{pdfLoadError}</p>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => router.back()}
              variant="outline"
              className="border-navy-hover bg-navy text-white text-xs font-semibold"
            >
              Retour au catalogue
            </Button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-xl bg-gold text-navy text-xs font-bold hover:bg-gold-hover transition-colors"
            >
              Réessayer
            </button>
          </div>
        </main>
      </div>
    )
  }

  const hasAudio = !!book.audio_file;

  if (effectiveImmersionMode && (book.file || rawPdfData)) {
    const parsedDrmOpacity = drmSettings?.watermark_opacity != null ? parseFloat(String(drmSettings.watermark_opacity)) : 0.20;
    const safeDrmOpacity = !isNaN(parsedDrmOpacity) ? parsedDrmOpacity : 0.20;
    const currentPosition = drmSettings?.watermark_position || "diagonal";
    const streamPdfUrl = rawPdfData || (id === 'lesson_pdf' ? book.file : isSampleMode ? `/api/bff/catalog/books/${id}/sample/` : `/api/bff/catalog/books/${id}/stream/`);

    return (
      <>
        <ReaderSecurity
          allowPrint={drmSettings?.allow_print ?? false}
          allowCopy={drmSettings?.allow_copy ?? false}
          watermarkMode="laha"
          watermarkPosition={currentPosition}
          watermarkOpacity={safeDrmOpacity}
          watermarkLahaText={drmSettings?.watermark_laha_template}
          watermarkLahaSubtext={drmSettings?.watermark_laha_subtext}
        />
        <FlipBookReader
          key={`${id}_${currentPosition}_${safeDrmOpacity}_${drmSettings?.watermark_laha_template || ""}`}
          fileUrl={streamPdfUrl}
          bookId={id as string}
          initialPage={currentPage}
          isMobile={isMobile}
          isSample={isSampleMode}
          hideQuiz={isSampleMode}
          onDocumentLoad={(num) => {
            setTotalPages(num);
            syncProgress(currentPage, num);
          }}
          onLastPageReached={() => {
            if (isSampleMode) {
              setShowSampleEndOverlay(true);
            } else {
              syncProgress(totalPages - 1, totalPages);
            }
          }}
          onPageChange={(page) => {
            setCurrentPage(page);
            syncProgress(page, totalPages);
          }}
          onClose={() => {
            syncProgress(currentPage, totalPages);
            setIsImmersionMode(false);
          }}
          authorName={book?.author_name || "Auteur LAHA"}
          watermarkMode="laha"
          watermarkPosition={currentPosition}
          watermarkOpacity={safeDrmOpacity}
          watermarkLahaText={drmSettings?.watermark_laha_template}
          watermarkLahaSubtext={drmSettings?.watermark_laha_subtext}
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
          isTtsActive={isTtsActive}
          isTtsPaused={isTtsPaused}
          isFetchingTtsText={isFetchingTtsText}
          onToggleTts={handleTtsToggle}
          onPauseResumeTts={pauseResumeTts}
          onStopTts={stopTts}
          ttsRate={ttsRate}
          onToggleTtsRate={() => setTtsRate(ttsRate === 2 ? 0.75 : ttsRate + 0.25)}
        />

        {showSampleEndOverlay && (
          <div className="fixed inset-0 z-[10000] bg-navy-dark/90 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-navy border border-gold/40 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center text-white space-y-4 shadow-2xl">
              <h3 className="font-serif font-bold text-xl text-white">Fin de l&apos;extrait gratuit</h3>
              <p className="text-xs text-white/80 leading-relaxed">
                Pour continuer la lecture de « <strong className="text-gold">{book.title}</strong> », achetez l&apos;ouvrage ou activez votre bouquet universitaire.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  onClick={() => router.push(`/student/catalog/${id}`)}
                  className="flex-1 py-3 rounded-xl bg-gold text-navy font-bold text-xs hover:bg-gold-hover cursor-pointer"
                >
                  Acheter cet ouvrage
                </Button>
                <Button
                  onClick={() => setShowSampleEndOverlay(false)}
                  variant="ghost"
                  className="text-white/70 hover:text-white text-xs cursor-pointer"
                >
                  Revoir l&apos;extrait
                </Button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }


  return (
    <div
      onContextMenu={(e) => e.preventDefault()}
      className="h-screen flex flex-col transition-colors duration-500 select-none bg-navy-dark text-white"
    >
      {/* Top Bar - Responsive Header */}
      <header className="px-4 md:px-8 flex items-center justify-between border-b border-navy-hover relative z-[100] bg-navy transition-all h-auto py-3 md:h-20 md:py-0 text-white">
        <div className="flex items-center gap-3 md:gap-6 flex-1 min-w-0">
          <Button
            onClick={() => {
              syncProgress(currentPage);
              router.back();
            }}
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-lg inline-flex items-center justify-center p-0 text-gold bg-navy-dark hover:bg-navy border border-navy-hover cursor-pointer shrink-0 transition-colors"
          >
            <ArrowLeft size={18} />
          </Button>
          <div className="space-y-0.5 min-w-0">
            <h1 className={cn(
              "font-bold uppercase tracking-tight truncate font-serif text-gold",
              isMobile ? "text-xs" : "text-base"
            )}>
              {book.title}
            </h1>
            <div className="flex items-center gap-2">
              <Badge className="border border-navy-hover bg-navy-dark text-gold text-[9px] font-bold uppercase px-1.5 py-0.2 rounded shrink-0">
                {book.category === 'audio' ? "Livre-Audio" :
                  book.category === 'fiche' ? "Analyse" :
                    book.category === 'summary' ? "Résumé" : "Manuel"}
              </Badge>
              {book.file && (
                <span className="text-[10px] font-mono text-white/60 shrink-0">
                  Page {currentPage + 1} / {totalPages}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            onClick={() => setIsNightMode(!isNightMode)}
            variant="outline"
            className="inline-flex flex-row items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-navy-hover h-9 px-3 text-xs font-semibold bg-navy-dark text-gold hover:bg-navy cursor-pointer min-h-[36px]"
          >
            {isNightMode ? <Sun size={15} /> : <Moon size={15} />}
            <span className="hidden md:inline">{isNightMode ? "Jour" : "Nuit"}</span>
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
            className="inline-flex flex-row items-center justify-center gap-1.5 whitespace-nowrap bg-gold text-navy font-bold text-xs h-9 px-3.5 rounded-lg hover:bg-gold-hover transition-colors shrink-0 cursor-pointer min-h-[36px]"
          >
            {isSaving ? <InlineLoader size={14} /> : <Save size={15} />}
            <span className="hidden sm:inline">Sauvegarder</span>
          </Button>

          {/* 🔊 Lire à voix haute (TTS) */}
          {book.file && !book.file.match(/\.(docx|doc|pptx|ppt|xlsx|xls)$/i) && (
            <Button
              onClick={handleTtsToggle}
              disabled={isFetchingTtsText}
              variant="outline"
              className={cn(
                "inline-flex flex-row items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-navy-hover h-9 px-3 text-xs font-semibold bg-navy-dark text-gold hover:bg-navy cursor-pointer min-h-[36px]",
                isTtsActive && "border-gold bg-gold text-navy font-bold"
              )}
            >
              {isFetchingTtsText
                ? <InlineLoader size={14} />
                : <Headphones size={15} />
              }
              <span className="hidden md:inline">
                {isTtsActive ? 'Arrêter' : 'Lecture Vocale'}
              </span>
            </Button>
          )}

          {!isMobile && !book.file?.match(/\.(docx|doc|pptx|ppt|xlsx|xls)$/i) && (
            <Button
              onClick={() => setIsImmersionMode(true)}
              variant="outline"
              className="inline-flex flex-row items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-navy-hover bg-gold text-navy font-bold hover:bg-gold-hover h-9 px-3.5 text-xs transition-colors cursor-pointer min-h-[36px]"
            >
              <LayoutGrid size={15} />
              <span className="hidden md:inline">Mode Immersion 3D</span>
            </Button>
          )}

          {hasQuiz && isStudent && (
            <Button
              onClick={() => setIsQuizOverlayOpen(true)}
              variant="outline"
              className={cn(
                "inline-flex flex-row items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border h-9 px-3.5 text-xs font-bold transition-colors cursor-pointer min-h-[36px]",
                isQuizValidated
                  ? "border-success text-success bg-success/10"
                  : "border-gold text-navy bg-gold hover:bg-gold-hover"
              )}
            >
              <CheckCircle2 size={15} />
              <span className="hidden lg:inline">{isQuizValidated ? "Validée" : "Quiz"}</span>
            </Button>
          )}
        </div>
      </header>

      {/* Reader Area */}
      <main
        onWheel={handleWheel}
        className={cn(
          "laha-reader-zone flex-1 relative overflow-hidden bg-navy-dark",
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
              <div className="h-full w-full bg-navy-dark flex items-center justify-center">
                <iframe 
                  src={officeUrl} 
                  className="w-full h-full border-none"
                  title="Document Office"
                  onError={(e) => console.error("Erreur de chargement de l'iframe Office", e)}
                />
              </div>
            );
          }

          const streamPdfUrl = rawPdfData || (id === 'lesson_pdf' ? book.file : `/api/bff/catalog/books/${id}/stream/`);

          const parsedDrmOpacity = drmSettings?.watermark_opacity != null ? parseFloat(String(drmSettings.watermark_opacity)) : 0.20;
          const safeDrmOpacity = !isNaN(parsedDrmOpacity) ? parsedDrmOpacity : 0.20;
          const currentPosition = drmSettings?.watermark_position || "diagonal";

          return (
            <>
              <ReaderSecurity
                allowPrint={drmSettings?.allow_print ?? false}
                allowCopy={drmSettings?.allow_copy ?? false}
                watermarkMode="laha"
                watermarkPosition={currentPosition}
                watermarkOpacity={safeDrmOpacity}
                watermarkLahaText={drmSettings?.watermark_laha_template}
                watermarkLahaSubtext={drmSettings?.watermark_laha_subtext}
              />
              <PdfWorker workerUrl="/pdf.worker.min.js">

                  <div className="h-full bg-navy-dark">
                    <Viewer
                      fileUrl={streamPdfUrl}
                      plugins={[
                        defaultLayoutPluginInstance,
                        highlightPluginInstance,
                      ]}
                      theme={isNightMode ? 'dark' : 'light'}
                      localization={(fr_FR_Locale as any)}
                      initialPage={currentPage}
                      onPageChange={handlePageChange}
                      onDocumentLoad={handleDocumentLoad}
                      viewMode={ViewMode.SinglePage}
                      defaultScale={SpecialZoomLevel.PageFit}
                      scrollMode={ScrollMode.Vertical}
                      transformGetDocumentParams={transformPdfGetDocumentParams}
                      setRenderRange={setViewerRenderRange}
                    />
                  </div>
                </PdfWorker>
            </>
          );
        })()}



          {isAudioOnly && (
            <div className="h-full flex flex-col items-center justify-center p-10 space-y-12">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full max-w-sm aspect-[2/3] rounded-2xl overflow-hidden shadow-xl border border-navy-hover relative"
              >
                <img
                  src={book.cover_image || book.thumbnail_url}
                  alt={book.title}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=600&h=900&auto=format&fit=crop"; }}
                />
                <div className="absolute inset-0 bg-navy/80 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
                  <Button
                    onClick={toggleAudio}
                    className="w-20 h-20 rounded-full bg-gold text-navy hover:scale-105 transition-transform shadow-lg"
                  >
                    {isAudioPlaying ? <Pause size={40} fill="currentColor" /> : <Play size={40} fill="currentColor" className="ml-1" />}
                  </Button>
                </div>
              </motion.div>

              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold uppercase font-serif text-gold">{book.title}</h2>
                <p className="text-white/60 font-medium text-xs tracking-wider">{book.author_name || "Auteur Laha"}</p>
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
            background-color: #0F1A33 !important;
          }
          .rpv-core__inner-pages {
            padding: 1.5rem 0 !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
          }
          .rpv-core__page-layer {
            margin-bottom: 2rem !important;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4) !important;
            border-radius: 4px !important;
          }
          /* Toolbar and Reader Theme - Clean & Sober */
          .rpv-default-layout__toolbar {
            background-color: #1B2A4E !important;
            border-bottom: 1px solid #2E3F66 !important;
            color: #E2E8F0 !important;
          }
          .rpv-core__button,
          .rpv-core__icon,
          .rpv-default-layout__toolbar button,
          .rpv-default-layout__sidebar-header,
          .rpv-default-layout__sidebar-headers button {
            color: #CBD5E1 !important;
            background: transparent !important;
            border-radius: 6px !important;
          }
          .rpv-core__button:hover,
          .rpv-default-layout__toolbar button:hover,
          .rpv-default-layout__sidebar-header:hover,
          .rpv-default-layout__sidebar-header--selected,
          .rpv-default-layout__sidebar-headers button:hover {
            color: #D4A017 !important;
            background-color: #0F1A33 !important;
          }
          .rpv-core__textbox {
            background-color: #0F1A33 !important;
            border: 1px solid #2E3F66 !important;
            color: #FFFFFF !important;
            border-radius: 6px !important;
            text-align: center !important;
            font-weight: bold !important;
          }
          .rpv-default-layout__sidebar {
            background-color: #1B2A4E !important;
            border-right: 1px solid #2E3F66 !important;
            color: #E2E8F0 !important;
          }
          .rpv-default-layout__sidebar-headers {
            background-color: #0F1A33 !important;
            border-bottom: 1px solid #2E3F66 !important;
          }
          .rpv-default-layout__sidebar-header {
            color: #94A3B8 !important;
          }
          .rpv-default-layout__sidebar-header--selected {
            color: #D4A017 !important;
            border-bottom: 2px solid #D4A017 !important;
          }
          .rpv-core__popover-body {
            background-color: #1B2A4E !important;
            border: 1px solid #2E3F66 !important;
            color: #FFFFFF !important;
            border-radius: 8px !important;
          }
          .rpv-core__menu {
            background-color: #1B2A4E !important;
            color: #FFFFFF !important;
          }
          .rpv-core__menu-item {
            color: #E2E8F0 !important;
          }
          .rpv-core__menu-item:hover {
            background-color: #0F1A33 !important;
            color: #D4A017 !important;
          }
          .rpv-core__text-layer {
            user-select: text !important;
          }
        `}</style>
      </main>

      {/* ── Mode Normal Floating Widgets (Compact & Refined) ── */}
      {/* Left: Floating Progression Badge */}
      <div className="fixed bottom-6 left-12 z-40 bg-navy border border-navy-hover rounded-xl shadow-lg px-3.5 py-2 text-white flex items-center gap-3 select-none">
        <Bookmark size={16} className="text-gold" />
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-gold font-mono font-bold text-xs">
              Page {currentPage + 1} / {totalPages}
            </span>
            <span className="text-white/60 text-[10px] font-mono">
              ({totalPages > 0 ? Math.round(((currentPage + 1) / totalPages) * 100) : 0}%)
            </span>
          </div>
          {totalPages > 0 && (
            <div className="h-1 w-20 bg-navy-dark rounded-full overflow-hidden border border-navy-hover">
              <div
                className="h-full bg-gold transition-all duration-300"
                style={{ width: `${((currentPage + 1) / totalPages) * 100}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Right: Floating Audio Player (if available) */}
      {hasAudio && (
        <div className="fixed bottom-6 right-6 z-40 bg-navy border border-navy-hover rounded-xl shadow-lg px-3.5 py-2 text-white flex items-center gap-3 select-none">
          <button
            type="button"
            onClick={toggleAudio}
            className="h-8 w-8 rounded-lg bg-gold text-navy hover:bg-gold-hover flex items-center justify-center cursor-pointer shrink-0"
          >
            {isAudioPlaying ? <Pause size={15} /> : <Play size={15} className="ml-0.5" />}
          </button>
          <div className="space-y-0.5">
            <p className="text-[10px] font-mono font-bold text-gold uppercase tracking-wider">Narration</p>
            <div
              className="h-1 w-24 md:w-32 bg-navy-dark rounded-full overflow-hidden border border-navy-hover cursor-pointer"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect()
                const x = e.clientX - rect.left
                const percentage = Math.max(0, Math.min(1, x / rect.width))
                handleSeek(percentage)
              }}
            >
              <div
                className="h-full bg-gold transition-all duration-300"
                style={{ width: `${audioDuration > 0 ? (audioProgress / audioDuration) * 100 : 0}%` }}
              />
            </div>
          </div>
          <button
            type="button"
            onClick={togglePlaybackRate}
            className="text-[10px] font-mono font-bold text-gold px-1.5 py-0.5 rounded bg-navy-dark hover:bg-navy border border-navy-hover cursor-pointer"
          >
            {playbackRate}x
          </button>
          <button
            type="button"
            onClick={toggleMute}
            className="text-white/60 hover:text-white cursor-pointer"
          >
            {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>
        </div>
      )}

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
        {isQuizOverlayOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10001] bg-navy-dark"
          >
            <FlipBookQuiz
              bookId={id as string}
              onClose={() => setIsQuizOverlayOpen(false)}
              onComplete={(res: any) => {
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
