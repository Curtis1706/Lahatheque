"use client";

import { useState, useRef } from "react";
import { Upload, File, X, AlertCircle } from "lucide-react";

interface DropzoneProps {
  onFileSelect: (file: File) => void;
  acceptTypes?: string[];
  maxSizeMB?: number;
}

export function Dropzone({ onFileSelect, acceptTypes = [".pdf", ".epub"], maxSizeMB = 800 }: DropzoneProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateFile = (file: File): boolean => {
    setError("");
    const fileExtension = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    
    if (!acceptTypes.includes(fileExtension)) {
      setError(`Format de fichier non supporté. Formats acceptés : ${acceptTypes.join(", ")}`);
      return false;
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`Le fichier est trop volumineux. Taille maximum autorisée : ${maxSizeMB} Mo.`);
      return false;
    }

    return true;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        onFileSelect(file);
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        onFileSelect(file);
      }
    }
  };

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="w-full space-y-3">
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative w-full border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-200 ${
          dragActive 
            ? "border-navy bg-navy-light/10" 
            : selectedFile 
              ? "border-success bg-success/5" 
              : "border-border bg-background-secondary hover:border-gold hover:bg-background-secondary/60"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={acceptTypes.join(",")}
          onChange={handleFileInputChange}
        />

        {selectedFile ? (
          <>
            <div className="w-12 h-12 rounded-xl bg-success/10 text-success flex items-center justify-center border border-success/20">
              <File className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <p className="font-semibold text-navy text-sm max-w-[280px] truncate">{selectedFile.name}</p>
              <p className="text-[10px] text-foreground-muted">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} Mo
              </p>
            </div>
            <button
              type="button"
              onClick={clearFile}
              className="absolute top-3.5 right-3.5 p-1.5 rounded-full hover:bg-border/40 text-foreground-muted hover:text-navy transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </>
        ) : (
          <>
            <div className="w-12 h-12 rounded-xl bg-navy-light text-navy flex items-center justify-center border border-border">
              <Upload className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <p className="font-bold text-navy text-sm">Glissez-déposez votre manuscrit</p>
              <p className="text-xs text-foreground-muted">ou cliquez pour parcourir vos fichiers</p>
            </div>
            <p className="text-[10px] text-foreground-muted uppercase tracking-wider font-bold">
              PDF, EPUB (Max. {maxSizeMB} Mo)
            </p>
          </>
        )}
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-error/10 border border-error/20 text-error text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
