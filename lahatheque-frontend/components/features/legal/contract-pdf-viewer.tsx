"use client";

import React, { useState } from "react";
import { FileText, Download, ZoomIn, ZoomOut, RotateCw, ExternalLink, ShieldCheck, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

interface ContractPdfViewerProps {
  fileUrl: string;
  fileName: string;
  fileSize?: number;
  title: string;
  reference: string;
  className?: string;
}

export function ContractPdfViewer({
  fileUrl,
  fileName,
  fileSize,
  title,
  reference,
  className,
}: ContractPdfViewerProps) {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 50));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  const formatSize = (bytes?: number) => {
    if (!bytes) return "";
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  };

  return (
    <div className={cn("p-5 rounded-3xl bg-background border border-border shadow-md space-y-4", className)}>
      {/* Barre d'outils (Toolbar 21st.dev PDF Viewer extend-hq id: 15406) */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 rounded-xl bg-navy-light text-navy shrink-0">
            <FileText className="w-5 h-5 text-gold" />
          </div>
          <div className="min-w-0">
            <p className="font-serif font-bold text-xs text-navy truncate">{title}</p>
            <p className="text-[10px] text-foreground-muted font-mono">{reference} • {fileName} ({formatSize(fileSize)})</p>
          </div>
        </div>

        {/* Contrôles de zoom et rotation */}
        <div className="flex items-center gap-2 bg-background-secondary p-1.5 rounded-xl border border-border">
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-1.5 rounded-lg hover:bg-background transition-colors text-foreground-muted"
            title="Zoom arrière"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-mono font-bold text-navy px-1">{zoom}%</span>
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-1.5 rounded-lg hover:bg-background transition-colors text-foreground-muted"
            title="Zoom avant"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <div className="h-4 w-px bg-border my-auto" />
          <button
            type="button"
            onClick={handleRotate}
            className="p-1.5 rounded-lg hover:bg-background transition-colors text-foreground-muted"
            title="Pivoter de 90°"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Zone de prévisualisation du document */}
      <div className="relative bg-navy-dark/95 rounded-2xl p-6 min-h-[380px] flex flex-col items-center justify-center text-center space-y-4 border border-navy-hover overflow-hidden">
        <div
          style={{ transform: `scale(${zoom / 100}) rotate(${rotation}deg)` }}
          className="transition-transform duration-200 bg-background p-8 rounded-xl shadow-2xl max-w-lg w-full text-left space-y-4 border border-border text-foreground"
        >
          <div className="flex items-center justify-between border-b border-border pb-3">
            <span className="text-[10px] font-mono font-bold text-gold uppercase">{reference}</span>
            <span className="text-[9px] font-bold text-success uppercase tracking-wider bg-success/10 px-2 py-0.5 rounded-md">
              Document Archivé Perpétuel
            </span>
          </div>

          <div className="space-y-2">
            <h4 className="font-serif font-bold text-navy text-sm leading-snug">{title}</h4>
            <p className="text-[11px] text-foreground-muted">
              Document officiel enregistré et indexé dans la base légale LAHAThèque.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-background-secondary border border-border text-[11px] text-foreground-muted space-y-1">
            <p className="font-semibold text-navy">Extrait indexé :</p>
            <p className="italic leading-relaxed">
              &ldquo;...Conformément aux stipulations du contrat d&apos;édition, la cession des droits d&apos;exploitation s&apos;étend à toute la durée de la propriété littéraire...&rdquo;
            </p>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between pt-2 text-xs">
        <span className="text-foreground-muted flex items-center gap-1 text-[11px]">
          <ShieldCheck className="w-3.5 h-3.5 text-success" />
          Stockage sécurisé &amp; Archivage légal permanent
        </span>

        <a
          href={fileUrl}
          download={fileName}
          className="px-3.5 py-2 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors inline-flex items-center gap-1.5 shadow-xs min-h-[36px]"
        >
          <Download className="w-3.5 h-3.5 text-gold" />
          Télécharger le Contrat
        </a>
      </div>
    </div>
  );
}
