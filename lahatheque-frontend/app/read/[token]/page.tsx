"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Headphones,
  CheckCircle2,
  LogOut,
  Sparkles,
  ShieldCheck,
  Play,
  Pause,
  Sun,
  Moon,
  Maximize,
  Minimize,
  BookOpen,
  Edit3,
  Bookmark,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { PageLoader } from "@/components/ui/page-loader";

// Core viewer & plugins
import {
  Viewer,
  Worker as PdfWorker,
  Plugin,
  PluginRenderPageLayer,
  SpecialZoomLevel,
  ScrollMode,
  ViewMode,
} from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import { pageNavigationPlugin } from "@react-pdf-viewer/page-navigation";
import {
  highlightPlugin,
  RenderHighlightTargetProps,
  RenderHighlightsProps,
} from "@react-pdf-viewer/highlight";

import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";
import "@react-pdf-viewer/highlight/lib/styles/index.css";

import { FlipBookReader } from "@/components/library/FlipBook";
import { ReaderSecurity } from "@/components/features/reader/ReaderSecurity";
import {
  hostedReaderApi,
  HostedReaderSessionData,
} from "@/lib/services/hosted-reader";
import {
  getDrmGlobalSettings,
  DrmGlobalSettings,
} from "@/lib/services/protection";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// French localization for PDF Viewer
const fr_FR_Locale = {
  attachment: { clickToDownload: "Appuyez pour télécharger", noAttachment: "Pas d'attachement" },
  bookmark: { noBookmark: "Pas de signet" },
  core: {
    askingPassword: { requirePasswordToOpen: "Exiger un mot de passe", submit: "Soumettre" },
    wrongPassword: { submit: "Soumettre", tryAgain: "Mauvais mot de passe." },
    pageLabel: "Page {{pageIndex}}",
  },
  defaultLayout: { attachment: "Pièces jointes", bookmark: "Signet", thumbnail: "Miniatures" },
  download: { download: "Télécharger" },
  find: {
    find: "Rechercher",
    findNext: "Suivant",
    findPrevious: "Précédent",
    matchDiacritics: "Diacritiques",
    matchWord: "Mots entiers",
    previousMatch: "Précédent",
  },
  open: { openFile: "Ouvrir" },
  print: { print: "Imprimer" },
  rotate: { rotateClockwise: "Rotation horaire", rotateCounterclockwise: "Rotation antihoraire" },
  search: { search: "Rechercher", searchDocument: "Rechercher..." },
  viewMode: { singlePage: "Une page", dualPage: "Deux pages" },
  zoom: { actualSize: "Taille réelle", fitToPage: "Ajuster", fitToWidth: "Pleine largeur", zoomIn: "Zoom +", zoomOut: "Zoom -" },
};

export default function HostedReaderPage() {
  const params = useParams();
  const router = useRouter();
  const token = (params?.token as string) || "";

  const [session, setSession] = useState<HostedReaderSessionData | null>(null);
  const [drmSettings, setDrmSettings] = useState<DrmGlobalSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [immersionMode, setImmersionMode] = useState(true);
  const [isNightMode, setIsNightMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(28);
  const [isExiting, setIsExiting] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Annotations & Notes State
  const [notes, setNotes] = useState<any[]>([]);

  // Audio / TTS State
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isTtsActive, setIsTtsActive] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [showAudioBar, setShowAudioBar] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Chargement des DRM globaux LAHAThèque
  useEffect(() => {
    getDrmGlobalSettings()
      .then((settings) => setDrmSettings(settings))
      .catch((err) => console.warn("Impossible de charger les DRM globaux:", err));
  }, []);

  // Initialisation de la session via le token
  useEffect(() => {
    if (!token) {
      setError("Jeton de session manquant dans l'URL.");
      setLoading(false);
      return;
    }

    let isMounted = true;
    hostedReaderApi
      .validateSessionToken(token)
      .then((data) => {
        if (isMounted) {
          setSession(data);
          if (data.book.total_pages) {
            setTotalPages(data.book.total_pages);
          }
          if (data.last_page > 0) {
            setCurrentPage(data.last_page);
          }
          if (data.theme?.reader_mode === "vertical") {
            setImmersionMode(false);
          }
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || "Session de lecture invalide ou expirée.");
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  // Chargement ultra-sécurisé du PDF en mémoire (Blob URL) pour éliminer les erreurs 204 et blocages IDM
  const [rawPdfData, setRawPdfData] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    let isCancelled = false;

    // Le flux protégé exige le token de session en en-tête X-Reader-Token —
    // jamais de lien direct vers le fichier brut.
    const targetUrl = "/api/bff/reader/sessions/stream/";
    if (!token) return;

    const loadBlob = async () => {
      try {
        const streamRes = await fetch(targetUrl, {
          headers: {
            Accept: "application/pdf",
            "X-Reader-Token": token,
          },
          credentials: "include",
        });
        if (streamRes.ok) {
          const blob = await streamRes.blob();
          if (blob && blob.size > 100 && !isCancelled) {
            const blobUrl = URL.createObjectURL(blob);
            setRawPdfData(blobUrl);
          }
        }
      } catch (err) {
        console.warn("[HostedReader] Erreur lors du chargement du flux PDF:", err);
      }
    };

    loadBlob();

    return () => {
      isCancelled = true;
    };
  }, [session]);

  // Synchronisation au chargement du nombre de pages
  const handleDocumentLoad = useCallback(
    (pages: number) => {
      setTotalPages(pages);
      if (token && pages > 0) {
        hostedReaderApi.syncProgress({
          token,
          current_page: currentPage,
          total_pages: pages,
          reading_time_seconds: 0,
        });
      }
    },
    [token, currentPage]
  );

  // Battement périodique de mesure du temps réel de lecture (toutes les 30s si onglet visible)
  useEffect(() => {
    if (!token || !session) return;
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        hostedReaderApi.syncProgress({
          token,
          current_page: currentPage,
          total_pages: totalPages,
          reading_time_seconds: 30,
        });
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [token, session, currentPage, totalPages]);

  // Synchronisation de progression au changement de page
  const handlePageChange = useCallback(
    (newPage: number) => {
      setCurrentPage(newPage);
      if (session) {
        hostedReaderApi.syncProgress({
          token,
          current_page: newPage,
          total_pages: totalPages,
          reading_time_seconds: 5,
        });
      }
    },
    [session, token, totalPages]
  );

  // Bascule Plein écran
  const toggleFullscreen = () => {
    if (typeof document === "undefined") return;
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Synthèse vocale Web Speech API
  const handleToggleTts = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      toast.error("La synthèse vocale n'est pas supportée par votre navigateur.");
      return;
    }

    if (isTtsActive) {
      window.speechSynthesis.cancel();
      setIsTtsActive(false);
      toast.info("Lecture vocale arrêtée.");
    } else {
      const docTitle = session?.book.title || "Document";
      const utterance = new SpeechSynthesisUtterance(
        `Lecture du document : ${docTitle}. Page ${currentPage}.`
      );
      utterance.lang = "fr-FR";
      utterance.rate = 1.0;
      utterance.onend = () => setIsTtsActive(false);
      utterance.onerror = () => setIsTtsActive(false);
      window.speechSynthesis.speak(utterance);
      setIsTtsActive(true);
      toast.success("Lecture vocale démarrée.");
    }
  }, [isTtsActive, session, currentPage]);

  // Redirection de sortie vers return_url
  const handleExit = useCallback(() => {
    if (!session) return;
    setIsExiting(true);
    toast.success("Progression enregistrée", {
      description: "Redirection vers votre application d'origine...",
    });
    setTimeout(() => {
      if (session.return_url.startsWith("http")) {
        window.location.href = session.return_url;
      } else {
        router.push(session.return_url);
      }
    }, 500);
  }, [session, router]);

  // Nom de marque épuré
  const cleanBrandName = useMemo(() => {
    if (!session) return "LAHAThèque";
    const raw = session.theme.brand_name || session.partner_name || "LAHAThèque";
    return (
      raw
        .replace(/\(Partenaire Test BYOD VIP\)/gi, "")
        .replace(/PARTENAIRE VIP/gi, "")
        .replace(/Partenaire VIP/gi, "")
        .replace(/Test VIP/gi, "")
        .trim() || "LAHALEX"
    );
  }, [session]);

  // Calcul dynamique de la position et de l'opacité (partenaire ou DRM global LAHAThèque)
  const effectiveWatermarkPosition = useMemo<"diagonal" | "header" | "footer">(() => {
    if (session?.theme?.watermark_position) {
      return session.theme.watermark_position;
    }
    if (drmSettings?.watermark_position) {
      return drmSettings.watermark_position as "diagonal" | "header" | "footer";
    }
    return "diagonal";
  }, [session, drmSettings]);

  const effectiveWatermarkOpacity = useMemo<number>(() => {
    if (session?.theme?.watermark_opacity != null) {
      return session.theme.watermark_opacity;
    }
    if (drmSettings?.watermark_opacity != null) {
      return drmSettings.watermark_opacity;
    }
    return 0.18;
  }, [session, drmSettings]);

  // Gestion des Annotations en Mode Normal
  const handleAddHighlight = (props: RenderHighlightTargetProps, comment: string) => {
    const newNote = {
      id: `note-${Date.now()}`,
      content: comment,
      highlightAreas: props.highlightAreas,
      quote: props.selectedText,
      pageIndex: props.highlightAreas?.[0]?.pageIndex ?? 0,
      createdAt: new Date().toISOString(),
    };
    setNotes((prev) => [...prev, newNote]);
    toast.success(comment ? "Note enregistrée !" : "Texte surligné !");
  };

  const handleDeleteNote = (noteId: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
    toast.success("Annotation supprimée.");
  };

  const renderHighlightTarget = (props: RenderHighlightTargetProps) => (
    <div
      style={{
        background: "var(--partner-primary, #770D28)",
        borderRadius: "8px",
        padding: "6px 10px",
        position: "absolute",
        left: `${props.selectionRegion.left}%`,
        top: `${props.selectionRegion.top + props.selectionRegion.height}%`,
        zIndex: 1000,
        transform: "translateY(10px)",
        boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
      }}
    >
      <Button
        size="sm"
        onClick={() => {
          const note = prompt("Ajouter une note à ce surlignage (facultatif) :");
          props.toggle();
          handleAddHighlight(props, note || "");
        }}
        className="bg-[var(--partner-accent,#B4AB6B)] text-black hover:brightness-110 font-bold text-[10px] uppercase h-7 px-2.5 rounded-md flex items-center gap-1.5 cursor-pointer"
      >
        <Bookmark size={11} fill="currentColor" /> Surligner
      </Button>
    </div>
  );

  const renderHighlights = (props: RenderHighlightsProps) => (
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
                    background: "rgba(180, 171, 107, 0.45)", // Accent Gold Doré
                    pointerEvents: "none",
                  },
                  props.getCssProperties(area, props.rotation)
                )}
              />
            ))}
        </div>
      ))}
    </div>
  );

  const highlightPluginInstance = highlightPlugin({
    renderHighlightTarget,
    renderHighlights,
  });

  const { jumpToHighlightArea } = highlightPluginInstance;

  // Volet latéral d'annotations personnalisé
  const NotesSidebar = () => (
    <div className="flex flex-col h-full bg-[var(--partner-primary,#770D28)] text-white">
      <div className="p-5 border-b border-white/10">
        <h3 className="text-[var(--partner-accent,#B4AB6B)] text-[11px] font-black uppercase tracking-[0.2em] font-serif">
          Mes Annotations
        </h3>
        <p className="text-[10px] text-white/50 mt-1 uppercase font-mono font-bold">
          {notes.length} élément{notes.length > 1 ? "s" : ""} enregistré{notes.length > 1 ? "s" : ""}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {notes.length === 0 ? (
          <div className="h-44 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-white/10 rounded-2xl">
            <Bookmark size={24} className="text-white/20 mb-2" />
            <p className="text-[11px] text-white/40 font-bold uppercase font-serif">
              Aucune annotation
            </p>
            <p className="text-[10px] text-white/30 mt-1">
              Sélectionnez du texte sur le document pour surligner ou ajouter une note.
            </p>
          </div>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className="group bg-black/20 border border-white/10 rounded-xl p-3.5 hover:border-[var(--partner-accent,#B4AB6B)]/50 transition-all cursor-pointer relative"
              onClick={() => {
                if (note.highlightAreas && note.highlightAreas.length > 0) {
                  jumpToHighlightArea(note.highlightAreas[0]);
                }
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <Badge className="bg-[var(--partner-accent,#B4AB6B)]/20 text-[var(--partner-accent,#B4AB6B)] border-none text-[9px] font-black uppercase px-2 py-0.5 rounded">
                  Page {(note.highlightAreas?.[0]?.pageIndex || note.pageIndex || 0) + 1}
                </Badge>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteNote(note.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 hover:text-red-300 rounded transition-all text-white/40 cursor-pointer"
                  title="Supprimer cette annotation"
                >
                  <Trash2 size={12} />
                </button>
              </div>

              {note.quote && (
                <div className="relative mb-2">
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[var(--partner-accent,#B4AB6B)] rounded-full" />
                  <p className="text-[11px] text-white/70 italic pl-3 line-clamp-3 leading-relaxed">
                    "{note.quote}"
                  </p>
                </div>
              )}

              {note.content && (
                <p className="text-xs text-white font-medium leading-relaxed bg-white/5 p-2 rounded-lg border border-white/10">
                  {note.content}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );

  // Configuration des onglets latéraux (Miniatures, Signets, Pièces Jointes, et Annotations !)
  const defaultLayoutPluginInstance = defaultLayoutPlugin({
    sidebarTabs: (defaultTabs) => [
      defaultTabs[0], // Miniatures (Page Thumbnails)
      defaultTabs[1], // Table des matières (Document Outline / Bookmarks)
      defaultTabs[2], // Pièces jointes (Attachments)
      {
        content: <NotesSidebar />,
        icon: <Edit3 size={17} />,
        title: "Mes Annotations",
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
            SwitchSelectionMode,
          } = props;
          return (
            <div
              className="rpv-toolbar flex items-center justify-between w-full px-3 py-1 bg-[var(--partner-primary,#770D28)] text-white border-b border-white/10"
              style={{ gap: "4px" }}
            >
              {/* Gauche : Recherche & Rotation */}
              <div className="flex items-center gap-1">
                <ShowSearchPopover />
                <Rotate />
                <SwitchSelectionMode />
              </div>

              {/* Centre : Pagination */}
              <div className="flex items-center gap-1.5 text-xs font-mono font-semibold">
                <GoToPreviousPage />
                <div className="w-12">
                  <CurrentPageInput />
                </div>
                <span className="text-white/60">/</span>
                <NumberOfPages />
                <GoToNextPage />
              </div>

              {/* Droite : Zoom & Plein Écran (Zéro Download / Print / Open) */}
              <div className="flex items-center gap-1">
                <ZoomOut />
                <Zoom />
                <ZoomIn />
                <div className="h-4 w-px bg-white/20 mx-1" />
                <EnterFullScreen />
              </div>
            </div>
          );
        }}
      </Toolbar>
    ),
  });

  const pageNavigationPluginInstance = pageNavigationPlugin();

  // Thème personnalisé dynamique
  const customThemeVars = useMemo(() => {
    const t = session?.theme || {};
    return {
      "--partner-primary": t.primary_color || "#770D28",
      "--partner-accent": t.accent_color || "#B4AB6B",
      "--partner-bg": isNightMode ? "#0F1A33" : t.background_color || "#FAFAFA",
      "--partner-text": isNightMode ? "#FFFFFF" : t.text_color || "#1A1A1A",
      "--partner-border": t.border_color || "#E5E7EB",
    } as React.CSSProperties;
  }, [session, isNightMode]);

  // Rendu de l'écran de chargement
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--partner-primary,#770D28)] text-white p-6">
        <PageLoader label="Initialisation de votre session sécurisée" />
      </div>
    );
  }

  // Rendu de l'écran d'erreur
  if (error || !session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0F1A33] text-white p-6 text-center">
        <div className="w-14 h-14 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 mb-4">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold font-serif mb-2">Session de Lecture Expirée ou Invalide</h2>
        <p className="text-xs text-white/70 max-w-md mb-6">
          {error || "Ce lien de lecture a expiré. Veuillez relancer la consultation depuis votre plateforme."}
        </p>
        <button
          onClick={() => window.history.back()}
          className="px-5 py-2 rounded-xl bg-gold text-navy font-bold text-xs hover:brightness-110 transition-all cursor-pointer shadow-sm"
        >
          Retourner à l'application
        </button>
      </div>
    );
  }

  return (
    <div
      style={customThemeVars}
      className="relative w-full h-screen overflow-hidden flex flex-col bg-[var(--partner-bg,#FAFAFA)] text-[var(--partner-text,#1A1A1A)]"
    >
      {/* 🛡️ Couche de sécurité DRM & Filigrane Nominatif */}
      <ReaderSecurity
        allowPrint={session.permissions?.allow_tts ?? false}
        allowCopy={false}
        watermarkMode="partner"
        watermarkPosition={effectiveWatermarkPosition}
        watermarkOpacity={effectiveWatermarkOpacity}
        watermarkUser={{
          displayName: session.user.name,
          email: session.user.email,
          ip: session.user.ip,
        }}
      />

      {/* 🔝 Barre d'en-tête Partenaire Unifiée & Élégante */}
      <header className="h-14 px-3 sm:px-6 flex items-center justify-between border-b border-black/10 bg-[var(--partner-primary,#770D28)] text-white z-30 shrink-0 shadow-md">
        {/* Gauche : Bouton Quitter + Logo/Marque */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={handleExit}
            disabled={isExiting}
            title={`Quitter et retourner vers ${session.return_url}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/20 hover:bg-black/35 text-xs font-semibold transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Quitter</span>
          </button>

          <div className="h-4 w-px bg-white/20 hidden sm:block" />

          {session.theme.brand_logo_url ? (
            <img
              src={session.theme.brand_logo_url}
              alt={cleanBrandName}
              className="h-7 max-w-[120px] object-contain rounded"
            />
          ) : (
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm sm:text-base tracking-wide font-serif text-white">
                {cleanBrandName}
              </span>
            </div>
          )}
        </div>

        {/* Centre : Titre du Document & Pagination */}
        <div className="hidden md:flex flex-col items-center text-center max-w-[40%] truncate px-2">
          <span className="text-xs sm:text-sm font-bold truncate text-white">
            {session.book.title}
          </span>
          <span className="text-[11px] text-white/70 font-mono truncate">
            {session.book.author} • Page {currentPage} sur {totalPages}
          </span>
        </div>

        {/* Droite : Outils, Switchers Bimodal & TTS */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Bouton Synthèse Vocale (TTS) */}
          <button
            onClick={handleToggleTts}
            title="Lecture à voix haute (TTS)"
            className={`p-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              isTtsActive
                ? "bg-[var(--partner-accent,#B4AB6B)] text-black font-bold shadow-sm"
                : "bg-black/20 hover:bg-black/35 text-white"
            }`}
          >
            <Headphones className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">{isTtsActive ? "Arrêter" : "Vocale"}</span>
          </button>

          {/* Bouton Mode Nuit / Jour */}
          <button
            onClick={() => setIsNightMode(!isNightMode)}
            title={isNightMode ? "Passer en mode jour" : "Passer en mode sombre"}
            className="p-2 rounded-lg bg-black/20 hover:bg-black/35 text-white text-xs transition-all cursor-pointer"
          >
            {isNightMode ? <Sun className="w-3.5 h-3.5 text-amber-300" /> : <Moon className="w-3.5 h-3.5" />}
          </button>

          {/* Bouton Plein Écran */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? "Quitter le plein écran" : "Plein écran"}
            className="p-2 rounded-lg bg-black/20 hover:bg-black/35 text-white text-xs transition-all cursor-pointer hidden sm:inline-flex"
          >
            {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
          </button>



          {/* Commutateur Bimodal (3D Immersion vs Normal) */}
          <div className="flex items-center bg-black/30 p-0.5 rounded-lg border border-white/10">
            <button
              onClick={() => setImmersionMode(true)}
              className={`px-2.5 py-1 rounded-md text-[11px] sm:text-xs font-semibold transition-all cursor-pointer ${
                immersionMode
                  ? "bg-[var(--partner-accent,#B4AB6B)] text-black font-bold shadow-sm"
                  : "text-white/70 hover:text-white"
              }`}
            >
              3D Immersion
            </button>
            <button
              onClick={() => setImmersionMode(false)}
              className={`px-2.5 py-1 rounded-md text-[11px] sm:text-xs font-semibold transition-all cursor-pointer ${
                !immersionMode
                  ? "bg-[var(--partner-accent,#B4AB6B)] text-black font-bold shadow-sm"
                  : "text-white/70 hover:text-white"
              }`}
            >
              Normal
            </button>
          </div>
        </div>
      </header>

      {/* 📖 Zone de Lecture Principale */}
      <main className="flex-1 relative w-full h-full overflow-hidden bg-[var(--partner-bg,#FAFAFA)]">
        {!rawPdfData ? (
          <div className="w-full h-full flex flex-col items-center justify-center">
            <PageLoader label="Chargement du document sécurisé" />
          </div>
        ) : immersionMode ? (
          /* Mode Immersion 3D FlipBook Complet */
          <FlipBookReader
            bookId={session.book.id}
            authorName={session.book.author}
            fileUrl={rawPdfData}
            initialPage={currentPage}
            hideInternalHeader={true}
            watermarkMode="partner"
            watermarkPosition={effectiveWatermarkPosition}
            watermarkOpacity={effectiveWatermarkOpacity}
            watermarkLahaText={
              session.theme?.watermark_text ||
              (session.user.name ? `${cleanBrandName} • ${session.user.name}` : cleanBrandName)
            }
            watermarkLahaSubtext={
              session.user.ip ? `IP: ${session.user.ip} • Document Protégé & Traçable` : session.user.email
            }
            watermarkUser={{
              displayName: session.user.name,
              email: session.user.email,
              ip: session.user.ip,
            }}
            onDocumentLoad={handleDocumentLoad}
            onPageChange={handlePageChange}
            onClose={handleExit}
          />
        ) : (
          /* Mode Normal Vertical avec @react-pdf-viewer (Boîte à outils complète + 4 onglets latéraux) */
          <div className="w-full h-full overflow-y-auto bg-[var(--partner-bg,#FAFAFA)]">
            <PdfWorker workerUrl="/pdf.worker.min.js">
              <div className="h-full">
                <Viewer
                  fileUrl={rawPdfData}
                  plugins={[
                    defaultLayoutPluginInstance,
                    pageNavigationPluginInstance,
                    highlightPluginInstance,
                  ]}
                  localization={fr_FR_Locale}
                  theme={isNightMode ? "dark" : "light"}
                  onDocumentLoad={(e) => handleDocumentLoad(e.doc.numPages)}
                  onPageChange={(e) => handlePageChange(e.currentPage + 1)}
                  initialPage={currentPage - 1}
                  viewMode={ViewMode.SinglePage}
                  defaultScale={SpecialZoomLevel.PageFit}
                  scrollMode={ScrollMode.Vertical}
                />
              </div>
            </PdfWorker>
          </div>
        )}
      </main>



      {/* Styles Globaux pour le Thème Partenaire et Mode Nuit */}
      <style jsx global>{`
        @media print {
          body { display: none !important; }
          .rpv-core__viewer { display: none !important; }
        }
        .rpv-core__canvas-layer canvas {
          ${isNightMode ? 'filter: invert(0.9) hue-rotate(180deg) brightness(0.8) contrast(1.2) !important;' : ''}
        }
        .rpv-core__viewer {
          background-color: var(--partner-bg, #FAFAFA) !important;
        }
        .rpv-core__inner-pages {
          padding: 1.5rem 0 !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
        }
        .rpv-core__page-layer {
          margin-bottom: 2rem !important;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12) !important;
          border-radius: 4px !important;
        }
        .rpv-default-layout__toolbar {
          background-color: var(--partner-primary, #770D28) !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
        }
        .rpv-default-layout__toolbar button {
          color: #FFFFFF !important;
        }
        .rpv-default-layout__sidebar {
          background-color: var(--partner-primary, #770D28) !important;
          border-right: 1px solid rgba(255, 255, 255, 0.1) !important;
        }
        .rpv-default-layout__sidebar-headers {
          background-color: var(--partner-primary, #770D28) !important;
        }
        .rpv-default-layout__sidebar-headers button {
          color: #FFFFFF !important;
        }
        .rpv-default-layout__sidebar-headers button[aria-selected="true"] {
          color: var(--partner-accent, #B4AB6B) !important;
          border-bottom: 2px solid var(--partner-accent, #B4AB6B) !important;
        }
      `}</style>
    </div>
  );
}
