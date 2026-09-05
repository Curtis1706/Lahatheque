"use client";

import React, { useState, useRef } from "react";
import { Modal } from "@/components/ui/modal";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2, X } from "lucide-react";
import { importContactsFile } from "@/lib/services/contacts";
import { ImportContactsResult } from "@/lib/types/contacts";

interface ImportContactsModalProps {
  open: boolean;
  onClose: () => void;
  onImportSuccess: (result: ImportContactsResult) => void;
}

export function ImportContactsModal({
  open,
  onClose,
  onImportSuccess,
}: ImportContactsModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportContactsResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setFile(null);
    setError(null);
    setResult(null);
    setLoading(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateAndSelectFile = (selectedFile: File) => {
    setError(null);
    setResult(null);
    const name = selectedFile.name.toLowerCase();
    const isValidExt = name.endsWith(".csv") || name.endsWith(".xlsx") || name.endsWith(".xls");
    if (!isValidExt) {
      setError("Format de fichier non supporté. Veuillez sélectionner un fichier .csv, .xlsx ou .xls.");
      return;
    }
    if (selectedFile.size > 20 * 1024 * 1024) {
      setError("Le fichier dépasse la taille maximale autorisée (20 Mo).");
      return;
    }
    setFile(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSelectFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSelectFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const res = await importContactsFile(file);
      setResult(res);
      onImportSuccess(res);
    } catch (err: any) {
      setError(err.message || "Échec lors du traitement du fichier d'import.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Importer des Contacts en Masse"
      description="Intégrez un carnet d'adresses depuis un tableur CSV ou Microsoft Excel (.xlsx / .xls)."
      maxWidth={540}
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-foreground-muted hover:text-foreground hover:bg-background-secondary rounded-xl transition-colors"
          >
            {result ? "Fermer" : "Annuler"}
          </button>
          {!result && (
            <button
              type="button"
              onClick={handleUpload}
              disabled={!file || loading}
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-navy hover:bg-navy-hover rounded-xl shadow-sm transition-all focus:ring-2 focus:ring-navy focus:outline-none disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Analyse et import en cours...</span>
                </>
              ) : (
                <>
                  <Upload className="size-4" />
                  <span>Lancer l'importation</span>
                </>
              )}
            </button>
          )}
        </div>
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="p-3 text-xs font-medium text-red-600 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl flex items-start gap-2">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {result ? (
          <div className="p-5 text-center space-y-3 bg-background-secondary/50 rounded-2xl border border-border">
            <div className="size-12 rounded-full bg-green-100 dark:bg-green-950/40 text-green-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="size-6" />
            </div>
            <h3 className="font-serif font-bold text-navy dark:text-white text-base">
              Importation terminée avec succès
            </h3>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-background border border-border text-center">
                <span className="block text-2xl font-bold text-navy dark:text-white">
                  {result.imported_count}
                </span>
                <span className="text-xs text-foreground-muted">Contacts importés</span>
              </div>
              <div className="p-3 rounded-xl bg-background border border-border text-center">
                <span className="block text-2xl font-bold text-foreground-muted">
                  {result.duplicates_skipped}
                </span>
                <span className="text-xs text-foreground-muted">Doublons ignorés</span>
              </div>
            </div>
            <p className="text-xs text-foreground-muted">
              Total analysé : {result.total_analyzed} ligne(s).
            </p>
          </div>
        ) : (
          <>
            {/* Zone de glisser-déposer */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
                dragActive
                  ? "border-navy bg-navy/5"
                  : file
                  ? "border-gold bg-gold/5"
                  : "border-border bg-background-secondary/30 hover:border-gold hover:bg-background-secondary/60"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                onChange={handleFileChange}
                className="hidden"
              />

              {file ? (
                <div className="flex items-center gap-3 w-full p-2">
                  <div className="size-10 rounded-xl bg-gold/15 text-gold flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="text-xs font-semibold text-navy dark:text-white truncate">
                      {file.name}
                    </p>
                    <p className="text-[11px] text-foreground-muted">
                      {(file.size / 1024).toFixed(1)} Ko
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="p-1 rounded-lg hover:bg-border text-foreground-muted"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="size-10 rounded-xl bg-navy/10 text-navy flex items-center justify-center">
                    <Upload className="size-5" />
                  </div>
                  <p className="text-xs font-semibold text-navy dark:text-white">
                    Glissez votre fichier ici, ou cliquez pour parcourir
                  </p>
                  <p className="text-[11px] text-foreground-muted">
                    Formats acceptés : CSV (.csv) ou Excel (.xlsx, .xls) • Max 20 Mo
                  </p>
                </>
              )}
            </div>

            {/* Aide et structure attendue */}
            <div className="p-3.5 rounded-xl bg-background-secondary/60 border border-border text-xs space-y-2">
              <span className="font-semibold text-navy dark:text-white block">
                Structure des colonnes détectées automatiquement :
              </span>
              <ul className="list-disc pl-4 space-y-1 text-foreground-muted">
                <li>
                  <strong className="text-foreground">Prénom</strong> et{" "}
                  <strong className="text-foreground">Nom</strong> (ou une colonne "Nom complet").
                </li>
                <li>
                  <strong className="text-foreground">Email</strong> (adresse valide obligatoire pour chaque contact).
                </li>
                <li>
                  Optionnels : <em>Téléphone</em>, <em>Organisation</em>, <em>Fonction</em>, <em>Catégorie</em>, <em>Notes</em>.
                </li>
                <li>
                  Les adresses e-mail déjà existantes sont automatiquement reconnues et ignorées pour éviter les doublons.
                </li>
              </ul>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

export default ImportContactsModal;
