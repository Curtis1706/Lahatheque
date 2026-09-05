"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  FileText, 
  ShieldCheck, 
  CheckCircle2,
  FileCode,
  AlignLeft,
  Maximize2,
  Minimize2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Viewer, Worker as PdfWorker, SpecialZoomLevel } from "@react-pdf-viewer/core";
import { defaultLayoutPlugin } from "@react-pdf-viewer/default-layout";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";
import { PageLoader } from "@/components/ui/page-loader";

interface ContractPdfViewerProps {
  contractId?: string;
  streamUrl?: string;
  fileUrl: string;
  fileName: string;
  fileSize?: number;
  title: string;
  reference: string;
  extractedText?: string;
  className?: string;
  isGrandEcran?: boolean;
  onToggleGrandEcran?: () => void;
}

export function ContractPdfViewer({
  contractId,
  streamUrl,
  fileUrl,
  fileName,
  fileSize,
  title,
  reference,
  extractedText,
  className,
  isGrandEcran: controlledGrandEcran,
  onToggleGrandEcran,
}: ContractPdfViewerProps) {
  const [localGrandEcran, setLocalGrandEcran] = useState(false);
  const isGrandEcran = controlledGrandEcran ?? localGrandEcran;

  const handleToggleGrandEcran = () => {
    if (onToggleGrandEcran) {
      onToggleGrandEcran();
    } else {
      setLocalGrandEcran((prev) => !prev);
    }
  };

  const [viewMode, setViewMode] = useState<"preview" | "summary">("preview");
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(true);

  const isDocx = fileName.toLowerCase().endsWith(".docx") || fileName.toLowerCase().endsWith(".doc");

  const targetPdfUrl = React.useMemo(() => {
    if (streamUrl) return streamUrl;
    if (contractId) return `/api/bff/rights/legal/contracts/${contractId}/stream`;
    if (!fileUrl) return "";
    if (fileUrl.startsWith("http") || fileUrl.startsWith("/")) return fileUrl;
    return `/uploads/${fileUrl}`;
  }, [contractId, streamUrl, fileUrl]);

  useEffect(() => {
    let isCancelled = false;
    setLoadingPdf(true);
    fetch(targetPdfUrl, {
      headers: { Accept: "application/pdf" },
      credentials: "include",
    })
      .then(async (res) => {
        if (res.ok) {
          const blob = await res.blob();
          if (!isCancelled) {
            setBlobUrl(URL.createObjectURL(blob));
          }
        } else if (fileUrl && fileUrl !== targetPdfUrl) {
          // Fallback sur le fichier direct si le stream échoue
          const fallbackRes = await fetch(fileUrl.startsWith("http") || fileUrl.startsWith("/") ? fileUrl : `/uploads/${fileUrl}`);
          if (fallbackRes.ok && !isCancelled) {
            const fallbackBlob = await fallbackRes.blob();
            setBlobUrl(URL.createObjectURL(fallbackBlob));
          }
        }
      })
      .catch((err) => console.warn("[ContractPdfViewer] Erreur chargement stream DRM:", err))
      .finally(() => {
        if (!isCancelled) setLoadingPdf(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [targetPdfUrl, fileUrl]);

  useEffect(() => {
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [blobUrl]);

  // Écoute de la touche Échap pour quitter le mode Grand Écran
  useEffect(() => {
    if (!isGrandEcran) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleToggleGrandEcran();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isGrandEcran]);

  // Verrouillage du scroll en arrière-plan quand le mode Grand Écran est actif
  useEffect(() => {
    if (isGrandEcran) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isGrandEcran]);

  const defaultLayoutPluginInstance = useMemo(
    () =>
      defaultLayoutPlugin({
        toolbarPlugin: {
          searchPlugin: {
            keyword: "",
          },
        },
        sidebarTabs: () => [], // Pleine largeur dédiée à la lecture directe du contrat
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
              } = props;
              return (
                <div className="rpv-contract-toolbar flex items-center justify-between w-full px-3 py-2 bg-background-secondary border-b border-border text-navy text-xs flex-wrap gap-2">
                  <div className="flex items-center gap-1">
                    <ShowSearchPopover />
                    <Rotate />
                  </div>

                  <div className="flex items-center gap-1.5">
                    <GoToPreviousPage />
                    <div className="w-12 text-center">
                      <CurrentPageInput />
                    </div>
                    <span className="text-foreground-muted text-[11px] font-semibold">sur</span>
                    <NumberOfPages />
                    <GoToNextPage />
                  </div>

                  <div className="flex items-center gap-1">
                    <ZoomOut />
                    <Zoom />
                    <ZoomIn />
                    <div className="w-px h-4 bg-border mx-1" />
                    <EnterFullScreen />
                  </div>
                </div>
              );
            }}
          </Toolbar>
        ),
      }),
    []
  );

  const formatSize = (bytes?: number) => {
    if (!bytes) return "";
    if (bytes > 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
    return `${Math.round(bytes / 1024)} Ko`;
  };

  const renderViewerContent = (isFull: boolean) => {
    if (viewMode === "preview" && !isDocx) {
      return (
        <div className={cn(
          "relative bg-background-secondary w-full flex flex-col border border-border overflow-hidden rpv-contract-viewer",
          isFull ? "flex-1 h-full rounded-none border-0" : "rounded-2xl h-[820px] md:h-[880px] shadow-xs"
        )}>
          {loadingPdf ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-gold">
              <PageLoader label="Chargement du document contractuel..." />
            </div>
          ) : blobUrl ? (
            <div className="w-full h-full overflow-hidden">
              <PdfWorker workerUrl="/pdf.worker.min.js">
                <Viewer
                  fileUrl={blobUrl}
                  plugins={[defaultLayoutPluginInstance]}
                  defaultScale={SpecialZoomLevel.PageWidth}
                />
              </PdfWorker>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-foreground-muted text-xs p-6 space-y-2">
              <FileText className="w-8 h-8 text-gold/50" />
              <p>Impossible de charger le flux du document contractuel.</p>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className={cn(
        "bg-background w-full p-6 sm:p-8 border border-border overflow-y-auto space-y-4",
        isFull ? "flex-1 h-full rounded-none border-0" : "rounded-2xl h-[820px] md:h-[880px]"
      )}>
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <span className="text-[10px] font-mono font-bold text-gold uppercase">{reference}</span>
            <h4 className="font-serif font-bold text-navy text-base">{title}</h4>
          </div>
          <span className="text-[10px] font-bold text-success uppercase tracking-wider bg-success/10 px-2.5 py-1 rounded-full border border-success/20 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-success" /> Document Actif
          </span>
        </div>

        {extractedText ? (
          <div className="text-foreground text-xs sm:text-sm font-sans leading-relaxed whitespace-pre-wrap space-y-2">
            {extractedText}
          </div>
        ) : (
          <div className="py-16 text-center space-y-3">
            <FileText className="w-10 h-10 text-gold/40 mx-auto" />
            <p className="text-sm font-semibold text-navy">Contenu textuel du contrat</p>
            <p className="text-xs text-foreground-muted max-w-md mx-auto">
              {isDocx
                ? "Fichier Word DOCX archivé dans le coffre juridique LAHAThèque."
                : "Contrat juridique signé et archivé dans la base certifiée LAHAThèque."}
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mode Grand Écran Plein Format (100vw x 100vh) */}
      {isGrandEcran && (
        <div className="fixed inset-0 z-50 bg-background flex flex-col animate-in fade-in duration-150">
          {/* Top bar Grand Écran */}
          <div className="px-4 sm:px-6 py-3 bg-navy text-white flex items-center justify-between gap-4 border-b border-navy-hover shrink-0 shadow-md">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-xl bg-gold/20 text-gold shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-gold">{reference}</span>
                  <span className="text-[10px] uppercase font-bold text-white/70">• Mode Grand Écran</span>
                </div>
                <h2 className="font-serif font-bold text-sm sm:text-base text-white truncate">{title}</h2>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {extractedText && !isDocx && (
                <div className="flex items-center bg-navy-dark p-1 rounded-xl border border-navy-hover text-xs">
                  <button
                    type="button"
                    onClick={() => setViewMode("preview")}
                    className={cn(
                      "px-3 py-1.5 rounded-lg font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1.5",
                      viewMode === "preview" ? "bg-gold text-navy font-bold shadow-xs" : "text-white/70 hover:text-white"
                    )}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("summary")}
                    className={cn(
                      "px-3 py-1.5 rounded-lg font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1.5",
                      viewMode === "summary" ? "bg-gold text-navy font-bold shadow-xs" : "text-white/70 hover:text-white"
                    )}
                  >
                    <AlignLeft className="w-3.5 h-3.5" />
                    <span>Texte &amp; Clauses</span>
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={handleToggleGrandEcran}
                className="px-3.5 py-2 rounded-xl bg-gold hover:bg-gold-light text-navy font-bold text-xs transition-all flex items-center gap-2 shadow-xs cursor-pointer"
                title="Quitter le mode grand écran (Touche Échap)"
              >
                <Minimize2 className="w-4 h-4" />
                <span className="hidden sm:inline">Quitter le Grand Écran</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-navy/15 text-navy font-bold">Échap</span>
              </button>
            </div>
          </div>

          {/* Corps du Viewer pleine page */}
          <div className="flex-1 w-full h-full overflow-hidden">
            {renderViewerContent(true)}
          </div>
        </div>
      )}

      {/* Cadre In-Page Pleine Largeur */}
      <div className={cn("p-4 sm:p-5 rounded-3xl bg-background border border-border shadow-xs space-y-4", className)}>
        {/* Barre d'en-tête du document */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-navy-light text-navy shrink-0">
              {isDocx ? (
                <FileCode className="w-5 h-5 text-gold" />
              ) : (
                <FileText className="w-5 h-5 text-gold" />
              )}
            </div>
            <div className="min-w-0">
              <p className="font-serif font-bold text-xs sm:text-sm text-navy truncate">{title}</p>
              <div className="flex items-center gap-2 text-[10px] text-foreground-muted font-mono flex-wrap">
                <span>{reference}</span>
                <span>•</span>
                <span className="truncate">{fileName}</span>
                {fileSize ? <span>({formatSize(fileSize)})</span> : null}
                <span className={cn(
                  "px-1.5 py-0.5 rounded font-bold uppercase text-[9px]",
                  isDocx ? "bg-info/10 text-info" : "bg-gold/10 text-gold"
                )}>
                  {isDocx ? "Format DOCX" : "Format PDF Numérisé"}
                </span>
              </div>
            </div>
          </div>

          {/* Actions : Bascule texte et bouton Grand Écran */}
          <div className="flex items-center gap-2 flex-wrap">
            {extractedText && !isDocx && (
              <div className="flex items-center bg-background-secondary p-1 rounded-xl border border-border text-xs">
                <button
                  type="button"
                  onClick={() => setViewMode("preview")}
                  className={cn(
                    "px-3 py-1.5 rounded-lg font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1.5",
                    viewMode === "preview" ? "bg-navy text-white shadow-xs" : "text-foreground-muted hover:text-navy"
                  )}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("summary")}
                  className={cn(
                    "px-3 py-1.5 rounded-lg font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1.5",
                    viewMode === "summary" ? "bg-navy text-white shadow-xs" : "text-foreground-muted hover:text-navy"
                  )}
                >
                  <AlignLeft className="w-3.5 h-3.5" />
                  <span>Texte</span>
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={handleToggleGrandEcran}
              className="px-3.5 py-2 rounded-xl bg-gold/15 hover:bg-gold/25 text-navy font-bold text-xs transition-colors border border-gold/40 flex items-center gap-2 cursor-pointer shadow-2xs"
              title="Agrandir le document sur tout l'écran"
            >
              <Maximize2 className="w-3.5 h-3.5 text-gold" />
              <span>Mode Grand Écran</span>
            </button>
          </div>
        </div>

        {/* Cadre de Lecture Directe In-Page */}
        {renderViewerContent(false)}

        {/* Footer Sécurité & Archivage */}
        <div className="flex items-center justify-between pt-2 text-xs border-t border-border">
          <span className="text-foreground-muted flex items-center gap-1.5 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-success" />
            Filigrane dynamique DRM &amp; Sécurité anti-capture activés
          </span>
          <span className="text-[10px] text-foreground-muted font-mono hidden sm:inline">
            Stockage permanent certifié LAHAThèque
          </span>
        </div>

        {/* Styles pour adapter la barre d'outils aux tokens de design LAHAThèque */}
        <style jsx global>{`
          .rpv-contract-toolbar .rpv-core__button {
            color: var(--navy) !important;
            background: transparent !important;
            border-radius: 8px !important;
            padding: 6px !important;
            transition: background-color 150ms, color 150ms !important;
          }
          .rpv-contract-toolbar .rpv-core__button:hover {
            color: var(--gold) !important;
            background-color: var(--navy-light) !important;
          }
          .rpv-contract-toolbar .rpv-core__textbox {
            background-color: var(--background) !important;
            border: 1px solid var(--border) !important;
            color: var(--navy) !important;
            border-radius: 8px !important;
            text-align: center !important;
            font-weight: 600 !important;
            font-size: 11px !important;
            padding: 3px 6px !important;
          }
          .rpv-contract-toolbar .rpv-core__popover-body {
            background-color: var(--background) !important;
            border: 1px solid var(--border) !important;
            color: var(--foreground) !important;
            border-radius: 12px !important;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1) !important;
          }
          .rpv-contract-viewer .rpv-core__inner-pages {
            background-color: var(--background-secondary) !important;
          }
        `}</style>
      </div>
    </>
  );
}
