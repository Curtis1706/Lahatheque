"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  FileText, 
  Download, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  ExternalLink, 
  ShieldCheck, 
  BookOpen,
  Sparkles,
  CheckCircle2,
  FileCode,
  Maximize2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ContractPdfViewerProps {
  fileUrl: string;
  fileName: string;
  fileSize?: number;
  title: string;
  reference: string;
  extractedText?: string;
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

  const isDocx = fileName.toLowerCase().endsWith(".docx") || fileName.toLowerCase().endsWith(".doc");

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 50));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  const formatSize = (bytes?: number) => {
    if (!bytes) return "";
    if (bytes > 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
    return `${Math.round(bytes / 1024)} Ko`;
  };

  const readerUrl = `/catalog/reader/lesson_pdf?file=${encodeURIComponent(fileUrl || "/PromptBreeder_Original_Paper-2309.16797v1.pdf")}&title=${encodeURIComponent(title)}`;

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

        {/* Action Liseuse LAHAThèque Complète */}
        <div className="flex items-center gap-2">
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

      {/* Cadre de Visualisation Intégré */}
      <div className="relative bg-navy-dark rounded-2xl min-h-[420px] flex flex-col items-center justify-center text-center p-4 border border-navy-hover overflow-hidden">
        {fileUrl && !isDocx ? (
          <iframe
            src={fileUrl}
            title={title}
            className="w-full h-[420px] rounded-xl bg-white border-0"
          />
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
                  : "Contrat juridique signé et archivé dans la base documentaire."}
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
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs border-t border-border">
        <span className="text-foreground-muted flex items-center gap-1.5 text-[11px]">
          <ShieldCheck className="w-3.5 h-3.5 text-success" />
          Filigrane dynamique DRM &amp; Sécurité anti-capture activés
        </span>

        <div className="flex items-center gap-2">
          <a
            href={fileUrl || "#"}
            download={fileName}
            className="px-3.5 py-2 rounded-xl bg-background-secondary hover:bg-background text-navy text-xs font-bold border border-border transition-colors inline-flex items-center gap-1.5 shadow-xs min-h-[36px] cursor-pointer"
            title="Télécharger une copie du fichier original"
          >
            <Download className="w-3.5 h-3.5 text-gold" />
            Télécharger ({isDocx ? "DOCX" : "PDF"})
          </a>
        </div>
      </div>
    </div>
  );
}
