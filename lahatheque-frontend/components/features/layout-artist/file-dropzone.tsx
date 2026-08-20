"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, FileText, Image as ImageIcon, CheckCircle, X, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface FileDropzoneProps {
  label: string;
  acceptTypes: string[]; // ex: [".pdf", ".epub"] ou ["image/*"]
  maxSizeMB?: number;
  onFileSelect: (file: File) => void;
  onFileRemove?: () => void;
  selectedFileName?: string;
  selectedFileSize?: number;
  previewUrl?: string;
  className?: string;
}

export function FileDropzone({
  label,
  acceptTypes,
  maxSizeMB = 800,
  onFileSelect,
  onFileRemove,
  selectedFileName,
  selectedFileSize,
  previewUrl,
  className,
}: FileDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isImage = acceptTypes.some((t) => t.includes("image"));

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    // Vérification taille
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`Le fichier dépasse la taille maximale autorisée de ${maxSizeMB} Mo.`);
      return;
    }

    setError(null);
    onFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(1)} Mo`;
    return `${(bytes / 1024).toFixed(0)} Ko`;
  };

  return (
    <div className={cn("space-y-2", className)}>
      <label className="block text-xs font-bold text-navy uppercase tracking-wider">{label}</label>

      {selectedFileName ? (
        <div className="p-4 rounded-2xl bg-background-secondary border border-border flex items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3 min-w-0">
            {previewUrl && isImage ? (
              <img
                src={previewUrl}
                alt="Aperçu couverture"
                className="w-12 h-16 object-cover rounded-xl border border-border shadow-xs shrink-0"
              />
            ) : (
              <div className="p-3 rounded-xl bg-navy-light text-navy shrink-0">
                {isImage ? <ImageIcon className="w-5 h-5 text-gold" /> : <FileText className="w-5 h-5 text-gold" />}
              </div>
            )}
            <div className="min-w-0">
              <p className="font-semibold text-xs text-navy truncate">{selectedFileName}</p>
              <p className="text-[10px] text-foreground-muted">
                {formatFileSize(selectedFileSize)} • <span className="text-success font-medium">Prêt à téléverser ✓</span>
              </p>
            </div>
          </div>

          {onFileRemove && (
            <button
              type="button"
              onClick={onFileRemove}
              className="p-2 rounded-xl border border-border bg-background hover:bg-error/10 hover:text-error hover:border-error/30 transition-colors text-foreground-muted shrink-0"
              title="Supprimer ou remplacer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "p-6 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-3 min-h-[140px]",
            isDragOver
              ? "border-gold bg-gold/5 scale-[1.01]"
              : "border-border bg-background-secondary hover:border-gold/50"
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptTypes.join(",")}
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />

          <div className="p-3 rounded-full bg-navy-light text-navy">
            <UploadCloud className="w-6 h-6 text-gold" />
          </div>

          <div className="space-y-1">
            <p className="text-xs font-semibold text-navy">
              Glissez-déposez votre fichier ici, ou <span className="text-gold underline">parcourez</span>
            </p>
            <p className="text-[10px] text-foreground-muted">
              Formats acceptés : {acceptTypes.join(", ")} (max {maxSizeMB} Mo)
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-1.5 text-error text-[11px] font-medium">
          <AlertCircle className="w-3.5 h-3.5" />
          {error}
        </div>
      )}
    </div>
  );
}
