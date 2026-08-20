"use client";

import React, { useState, useRef } from "react";
import { 
  Upload, 
  FileText, 
  X, 
  CheckCircle2, 
  AlertCircle,
  FileCheck
} from "lucide-react";

export interface AuthorFileDropzoneProps {
  accept?: string;
  maxSizeMB?: number;
  onFileSelected: (file: File) => void;
  selectedFile?: File | null;
  onRemoveFile?: () => void;
  isLoading?: boolean;
  className?: string;
}

export function AuthorFileDropzone({
  accept = ".pdf,.epub,.docx,.doc",
  maxSizeMB = 800,
  onFileSelected,
  selectedFile,
  onRemoveFile,
  isLoading = false,
  className = "",
}: AuthorFileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndSelect = (file: File) => {
    setError(null);
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`Le fichier dépasse la taille maximale autorisée de ${maxSizeMB} Mo.`);
      return;
    }
    onFileSelected(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSelect(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative flex min-h-[160px] sm:min-h-[190px] flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all cursor-pointer ${
          isDragging
            ? "border-gold bg-gold/10 scale-[0.99]"
            : "border-border hover:border-gold/60 bg-background-secondary"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={(e) => {
            if (e.target.files?.[0]) {
              validateAndSelect(e.target.files[0]);
            }
          }}
          className="sr-only"
        />

        {selectedFile ? (
          <div className="flex flex-col items-center gap-2 animate-in fade-in duration-200">
            <div className="w-12 h-12 rounded-2xl bg-gold/20 text-gold flex items-center justify-center">
              <FileCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-xs text-navy font-serif">{selectedFile.name}</p>
              <p className="text-[11px] text-foreground-muted font-mono">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} Mo • Fichier prêt
              </p>
            </div>
            {onRemoveFile && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveFile();
                  if (inputRef.current) inputRef.current.value = "";
                }}
                className="mt-1 px-3 py-1 rounded-xl bg-error/10 text-error hover:bg-error/20 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                Remplacer le fichier
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-navy/10 text-navy flex items-center justify-center">
              <Upload className="w-6 h-6 text-gold" />
            </div>
            <div className="space-y-0.5">
              <p className="font-serif font-bold text-xs text-navy">
                Cliquez pour choisir un fichier ou glissez-déposez ici
              </p>
              <p className="text-[11px] text-foreground-muted">
                Formats acceptés : PDF, EPUB, Word DOCX (Taille max : {maxSizeMB} Mo)
              </p>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center gap-2">
            <span className="w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-bold text-navy">Analyse du manuscrit par l&apos;IA en cours...</p>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-1.5 text-error text-xs font-bold p-2.5 rounded-xl bg-error/10 border border-error/20">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
