"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  Headphones,
  CheckCircle2,
  LogOut,
  Sparkles,
  ShieldCheck,
  Play,
  Pause,
} from "lucide-react";
import { toast } from "sonner";

// Core viewer & plugins
import {
  Viewer,
  Worker as PdfWorker,
} from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import { pageNavigationPlugin } from "@react-pdf-viewer/page-navigation";
import { highlightPlugin } from "@react-pdf-viewer/highlight";

import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";
import "@react-pdf-viewer/highlight/lib/styles/index.css";

import { FlipBookReader } from "@/components/library/FlipBook";
import { FlipBookQuiz } from "@/components/library/FlipBookQuiz";
import { ReaderSecurity } from "@/components/features/reader/ReaderSecurity";
import {
  hostedReaderApi,
  HostedReaderSessionData,
} from "@/lib/services/hosted-reader";

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [immersionMode, setImmersionMode] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [showQuiz, setShowQuiz] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  // Audio Player State
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [showAudioBar, setShowAudioBar] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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
          if (data.last_page > 0) {
            setCurrentPage(data.last_page);
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

  // Synchronisation périodique de progression
  const handlePageChange = useCallback(
    (newPage: number) => {
      setCurrentPage(newPage);
      if (session) {
        hostedReaderApi.syncProgress({
          token,
          current_page: newPage,
          reading_time_seconds: 10,
        });

        // Déclenchement automatique du quiz sur la dernière page
        if (
          session.quiz?.enabled &&
          session.quiz?.show_on_last_page &&
          newPage >= session.book.total_pages &&
          !session.quiz_completed &&
          !showQuiz
        ) {
          setTimeout(() => {
            setShowQuiz(true);
            toast.info("Quiz disponible", {
              description: "Vous avez atteint la fin du document. Validez vos connaissances !",
            });
          }, 800);
        }
      }
    },
    [session, token, showQuiz]
  );

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
    }, 600);
  }, [session, router]);

  // Plugins pour le mode normal @react-pdf-viewer
  const defaultLayoutPluginInstance = defaultLayoutPlugin({
    sidebarTabs: (defaultTabs) => defaultTabs,
    renderToolbar: (Toolbar) => (
      <Toolbar>
        {(slots) => {
          const { CurrentPageInput, NumberOfPages, ShowSearchPopover, Zoom, ZoomIn, ZoomOut } = slots;
          return (
            <div className="flex items-center justify-between w-full px-3 py-1.5 bg-navy-dark text-white border-b border-border">
              <div className="flex items-center gap-2">
                <ShowSearchPopover />
              </div>
              <div className="flex items-center gap-2 text-sm font-medium">
                <CurrentPageInput /> / <NumberOfPages />
              </div>
              <div className="flex items-center gap-2">
                <ZoomOut />
                <Zoom />
                <ZoomIn />
              </div>
            </div>
          );
        }}
      </Toolbar>
    ),
  });

  const pageNavigationPluginInstance = pageNavigationPlugin();
  const highlightPluginInstance = highlightPlugin();

  // Thème personnalisé dynamique
  const customThemeVars = useMemo(() => {
    if (!session?.theme) return {};
    const t = session.theme;
    return {
      "--partner-primary": t.primary_color || "#1B2A4E",
      "--partner-accent": t.accent_color || "#D4A017",
      "--partner-bg": t.background_color || "#0F1A33",
      "--partner-text": t.text_color || "#FFFFFF",
      "--partner-border": t.border_color || "#2E3F66",
    } as React.CSSProperties;
  }, [session]);

  // Rendu de l'écran de chargement
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-navy-dark text-white p-6">
        <Loader2 className="w-12 h-12 text-gold animate-spin mb-4" />
        <h2 className="text-xl font-bold">Initialisation de votre session sécurisée...</h2>
        <p className="text-sm text-foreground-secondary mt-1">
          Chiffrement des clés et chargement du document en flux continu
        </p>
      </div>
    );
  }

  // Rendu de l'écran d'erreur
  if (error || !session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-navy-dark text-white p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mb-4">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Accès Non Autorisé ou Session Expirée</h2>
        <p className="text-sm text-foreground-secondary max-w-md mb-6">
          {error || "Le lien de lecture que vous avez utilisé est invalide ou a expiré. Veuillez relancer la lecture depuis votre plateforme d'origine."}
        </p>
        <button
          onClick={() => window.history.back()}
          className="px-6 py-2.5 rounded-lg bg-gold text-navy-dark font-bold hover:brightness-110 transition-all"
        >
          Retourner à l'application
        </button>
      </div>
    );
  }

  const brandName = session.theme.brand_name || session.partner_name || "LAHAThèque";

  return (
    <div
      style={customThemeVars}
      className="relative w-full h-screen overflow-hidden flex flex-col bg-[var(--partner-bg,#0F1A33)] text-[var(--partner-text,#FFFFFF)]"
    >
      {/* 🛡️ Couche de sécurité DRM & Filigrane Nominatif */}
      <ReaderSecurity
        allowPrint={false}
        allowCopy={false}
        watermarkMode="partner"
        watermarkPosition="diagonal"
        watermarkOpacity={0.18}
        watermarkUser={{
          displayName: session.user.name,
          email: session.user.email,
          ip: session.user.ip,
        }}
      />

      {/* 🔝 Barre d'en-tête Partenaire Personnalisée */}
      <header className="h-14 px-4 flex items-center justify-between border-b border-[var(--partner-border,#2E3F66)] bg-[var(--partner-primary,#1B2A4E)] z-30 shrink-0 shadow-md">
        {/* Gauche : Logo Partenaire & Marque */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleExit}
            disabled={isExiting}
            title={`Quitter et retourner vers ${session.return_url}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/20 text-xs font-semibold transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Quitter</span>
          </button>

          <div className="h-5 w-px bg-white/20 mx-1 hidden sm:block" />

          {session.theme.brand_logo_url ? (
            <img
              src={session.theme.brand_logo_url}
              alt={brandName}
              className="h-7 max-w-[120px] object-contain rounded"
            />
          ) : (
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--partner-accent,#D4A017)] animate-pulse" />
              <span className="font-bold text-sm tracking-wide">{brandName}</span>
            </div>
          )}
        </div>

        {/* Centre : Titre du Document */}
        <div className="hidden md:flex flex-col items-center text-center max-w-[40%] truncate">
          <span className="text-sm font-semibold truncate text-white">{session.book.title}</span>
          <span className="text-[11px] text-white/60 truncate">{session.book.author}</span>
        </div>

        {/* Droite : Outils, Switcher Bimodal & Quiz */}
        <div className="flex items-center gap-2">
          {/* Lecteur Audio narratif si présent */}
          {session.book.has_audio && (
            <button
              onClick={() => setShowAudioBar(!showAudioBar)}
              title="Narration Audio"
              className={`p-2 rounded-md transition-all ${
                showAudioBar
                  ? "bg-[var(--partner-accent,#D4A017)] text-navy-dark font-bold"
                  : "bg-white/10 hover:bg-white/20 text-white"
              }`}
            >
              <Headphones className="w-4 h-4" />
            </button>
          )}

          {/* Bouton Quiz */}
          {session.quiz?.enabled && (
            <button
              onClick={() => setShowQuiz(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                session.quiz_completed
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  : "bg-[var(--partner-accent,#D4A017)] text-navy-dark hover:brightness-110 shadow-sm"
              }`}
            >
              {session.quiz_completed ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Quiz : {session.quiz_score}%</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Quiz</span>
                </>
              )}
            </button>
          )}

          {/* Commutateur Bimodal (3D Immersion vs Normal) */}
          <div className="flex items-center bg-black/30 p-0.5 rounded-lg border border-white/10">
            <button
              onClick={() => setImmersionMode(true)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                immersionMode
                  ? "bg-[var(--partner-accent,#D4A017)] text-navy-dark font-bold shadow"
                  : "text-white/70 hover:text-white"
              }`}
            >
              3D Immersion
            </button>
            <button
              onClick={() => setImmersionMode(false)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                !immersionMode
                  ? "bg-[var(--partner-accent,#D4A017)] text-navy-dark font-bold shadow"
                  : "text-white/70 hover:text-white"
              }`}
            >
              Normal
            </button>
          </div>
        </div>
      </header>

      {/* 🎧 Mini-Lecteur Audio Flottant */}
      <AnimatePresence>
        {showAudioBar && session.book.audio_url && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="h-12 bg-navy-dark border-b border-border px-6 flex items-center justify-between text-xs z-20"
          >
            <div className="flex items-center gap-3">
              <audio
                ref={audioRef}
                src={session.book.audio_url}
                onTimeUpdate={() => {
                  if (audioRef.current) {
                    setAudioProgress(
                      (audioRef.current.currentTime / (audioRef.current.duration || 1)) * 100
                    );
                  }
                }}
                onEnded={() => setIsPlayingAudio(false)}
              />
              <button
                onClick={() => {
                  if (!audioRef.current) return;
                  if (isPlayingAudio) {
                    audioRef.current.pause();
                    setIsPlayingAudio(false);
                  } else {
                    audioRef.current.play();
                    setIsPlayingAudio(true);
                  }
                }}
                className="p-2 rounded-full bg-gold text-navy-dark font-bold hover:scale-105 transition-all"
              >
                {isPlayingAudio ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              </button>
              <span className="font-semibold text-white/90">Narration Audio — {session.book.title}</span>
            </div>

            <div className="w-1/3 bg-white/10 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-gold h-full transition-all duration-200"
                style={{ width: `${audioProgress}%` }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 📖 Zone de Lecture Principale */}
      <main className="flex-1 relative w-full h-full overflow-hidden">
        {immersionMode ? (
          /* Mode Immersion 3D FlipBook */
          <FlipBookReader
            bookId={session.book.id}
            authorName={session.book.author}
            fileUrl={session.book.file_url || "/api/pdf?file=PromptBreeder_Original_Paper-2309.16797v1.pdf"}
            initialPage={currentPage}
            watermarkMode="partner"
            watermarkPosition="diagonal"
            watermarkOpacity={0.18}
            watermarkUser={{
              displayName: session.user.name,
              email: session.user.email,
              ip: session.user.ip,
            }}
            onPageChange={handlePageChange}
            onClose={handleExit}
          />
        ) : (
          /* Mode Normal Vertical avec @react-pdf-viewer */
          <div className="w-full h-full overflow-y-auto bg-navy-dark">
            <PdfWorker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
              <div className="h-full">
                <Viewer
                  fileUrl={session.book.file_url || "/api/pdf?file=PromptBreeder_Original_Paper-2309.16797v1.pdf"}
                  plugins={[defaultLayoutPluginInstance, pageNavigationPluginInstance, highlightPluginInstance]}
                  localization={fr_FR_Locale}
                  theme="dark"
                  onPageChange={(e) => handlePageChange(e.currentPage + 1)}
                  initialPage={currentPage - 1}
                />
              </div>
            </PdfWorker>
          </div>
        )}
      </main>

      {/* ❓ Modale Interactive de Quiz */}
      <AnimatePresence>
        {showQuiz && (
          <FlipBookQuiz
            bookId={session.book.id}
            onClose={() => setShowQuiz(false)}
            onComplete={(result: { score: number; is_validated: boolean; passing_score: number }) => {
              setSession((prev) =>
                prev
                  ? {
                      ...prev,
                      quiz_completed: true,
                      quiz_score: result.score,
                    }
                  : null
              );

              toast.success("Quiz complété !", {
                description: `Score obtenu : ${result.score}% — ${
                  result.is_validated ? "Félicitations, validé !" : "Seuil non atteint."
                }`,
              });
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
