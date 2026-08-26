"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  FileText, 
  ShieldCheck, 
  BookOpen,
  Sparkles,
  CheckCircle2,
  FileCode,
  Maximize2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Viewer, Worker as PdfWorker, SpecialZoomLevel } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";
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
}

export function ContractPdfViewer({
  contractId,
  streamUrl,
  fileUrl,
  fileName,
  fileSize,
  title,
  reference,
  className,
}: ContractPdfViewerProps) {
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

  const readerUrl = `/catalog/reader/lesson_pdf?${contractId ? `contract_id=${contractId}&` : ""}file=${encodeURIComponent(fileUrl || "")}&title=${encodeURIComponent(title)}`;

  const formatSize = (bytes?: number) => {
    if (!bytes) return "";
    if (bytes > 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
    return `${Math.round(bytes / 1024)} Ko`;
  };

  return (
    <div className={cn("p-5 rounded-3xl bg-background border border-border shadow-md space-y-4", className)}>
      {/* Barre d'outils */}
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
            <p className="font-serif font-bold text-xs text-navy truncate">{title}</p>
            <div className="flex items-center gap-2 text-[10px] text-foreground-muted font-mono flex-wrap">
              <span>{reference}</span>
              <span>•</span>
              <span className="truncate">{fileName}</span>
              {fileSize ? <span>({formatSize(fileSize)})</span> : null}
              <span className={cn(
                "px-1.5 py-0.2 rounded font-bold uppercase",
                isDocx ? "bg-info/10 text-info" : "bg-gold/10 text-gold"
              )}>
                {isDocx ? "Format DOCX (Converti)" : "Format PDF Numérisé"}
              </span>
            </div>
          </div>
        </div>

        {/* Actions mode & Liseuse LAHAThèque Complète */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-background-secondary p-1 rounded-xl border border-border text-xs">
            <button
              type="button"
              onClick={() => setViewMode("preview")}
              className={cn(
                "px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer",
                viewMode === "preview" ? "bg-navy text-white shadow-xs" : "text-foreground-muted hover:text-navy"
              )}
            >
              Aperçu Direct
            </button>
            <button
              type="button"
              onClick={() => setViewMode("summary")}
              className={cn(
                "px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer",
                viewMode === "summary" ? "bg-navy text-white shadow-xs" : "text-foreground-muted hover:text-navy"
              )}
            >
              Notice Légale
            </button>
          </div>

          <Link
            href={readerUrl}
            target="_blank"
            className="px-3 py-1.5 rounded-xl bg-gold text-navy font-bold text-xs hover:bg-gold-light transition-all inline-flex items-center gap-1.5 shadow-xs cursor-pointer min-h-[36px]"
            title="Ouvrir dans la liseuse LAHAThèque officielle (Mode FlipBook 3D & Défilement continu)"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Ouvrir dans la Liseuse</span>
            <Maximize2 className="w-3 h-3 opacity-70" />
          </Link>
        </div>
      </div>

      {/* Cadre de Visualisation Intégré — Anti-Interception IDM */}
      <div className="relative bg-navy-dark rounded-2xl min-h-[440px] max-h-[520px] w-full flex flex-col items-center justify-center text-center p-3 border border-navy-hover overflow-hidden">
        {viewMode === "preview" && !isDocx ? (
          loadingPdf ? (
            <div className="flex flex-col items-center justify-center gap-3 text-gold">
              <PageLoader label="Chargement sécurisé du document" />
            </div>
          ) : blobUrl ? (
            <div className="w-full h-[440px] rounded-xl overflow-hidden bg-white shadow-inner">
              <PdfWorker workerUrl="/pdf.worker.min.js">
                <Viewer fileUrl={blobUrl} defaultScale={SpecialZoomLevel.PageFit} />
              </PdfWorker>
            </div>
          ) : (
            <div className="text-white/70 text-xs">Impossible de charger le document.</div>
          )
        ) : (
          <div className="bg-background p-8 rounded-2xl shadow-2xl max-w-md w-full text-left space-y-4 border border-border text-foreground">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="text-[10px] font-mono font-bold text-gold uppercase">{reference}</span>
              <span className="text-[9px] font-bold text-success uppercase tracking-wider bg-success/10 px-2 py-0.5 rounded-md">
                Document Actif &amp; Protégé
              </span>
            </div>

            <div className="space-y-2">
              <h4 className="font-serif font-bold text-navy text-sm leading-snug">{title}</h4>
              <p className="text-[11px] text-foreground-muted">
                {isDocx
                  ? "Fichier Word DOCX converti pour la liseuse LAHAThèque et indexé dans le moteur de recherche légal."
                  : "Contrat juridique signé et archivé dans la base documentaire certifiée LAHAThèque."}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-background-secondary border border-border text-xs space-y-3">
              <div className="flex items-center gap-2 text-navy font-bold">
                <Sparkles className="w-4 h-4 text-gold shrink-0" />
                <span>Disponible dans la liseuse LAHAThèque</span>
              </div>
              <p className="text-[11px] text-foreground-muted leading-relaxed">
                Profitez des 2 modes de lecture officiels : <strong>FlipBook 3D</strong> (tourne-page réaliste) et <strong>Défilement Continu</strong> avec annotations, surlignage et sécurité DRM.
              </p>
              <Link
                href={readerUrl}
                target="_blank"
                className="w-full py-2 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer min-h-[38px]"
                title="Lancer la lecture dans la liseuse officielle"
              >
                <BookOpen className="w-3.5 h-3.5 text-gold" />
                Lancer la lecture complète
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between pt-2 text-xs border-t border-border">
        <span className="text-foreground-muted flex items-center gap-1.5 text-[11px]">
          <ShieldCheck className="w-3.5 h-3.5 text-success" />
          Filigrane dynamique DRM &amp; Sécurité anti-capture activés
        </span>
      </div>
    </div>
  );
}
