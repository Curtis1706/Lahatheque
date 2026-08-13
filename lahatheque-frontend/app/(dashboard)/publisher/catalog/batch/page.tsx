"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { UploadCloud, ArrowLeft, FileCode, CheckCircle2, AlertTriangle, ShieldCheck, RefreshCw } from "lucide-react";
import { FileDropzone } from "@/components/features/layout-artist/file-dropzone";
import { BatchImportReportView } from "@/components/features/publisher/batch-import-report";
import { getBatchImportReports, startBatchImport } from "@/lib/services/publisher";
import type { BatchImportReport } from "@/lib/types/publisher";

export default function PublisherBatchImportPage() {
  const [reports, setReports] = useState<BatchImportReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importFormat, setImportFormat] = useState<"onix_3" | "csv" | "json" | "zip">("onix_3");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await getBatchImportReports();
      setReports(data);
      setLoading(false);
    }
    loadData();
  }, []);

  const handleStartImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    try {
      const newReport = await startBatchImport(selectedFile.name, importFormat);
      setReports((prev) => [newReport, ...prev]);
      alert("Le fichier de catalogue en lot a été transmis ! Traitement asynchrone démarré.");
      setSelectedFile(null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-8 max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/publisher" className="hover:text-navy">Vue d&apos;ensemble</Link>
        <span>/</span>
        <Link href="/publisher/catalog" className="hover:text-navy">Catalogue</Link>
        <span>/</span>
        <span className="text-navy font-semibold">Dépôt en Lot ONIX 3.0</span>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/publisher/catalog" className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Retour au Catalogue
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
            <UploadCloud className="w-4 h-4 text-gold" />
            Importation en Masse
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Dépôt en Lot (ONIX 3.0 / CSV / JSON / ZIP)
          </h1>
          <p className="text-xs text-foreground-muted mt-1">
            Importation automatisée de masse des notices bibliographiques et téléversement associé des fichiers.
          </p>
        </div>
      </div>

      {/* Zone de Téléversement */}
      <form onSubmit={handleStartImport} className="p-6 rounded-3xl bg-background border border-border shadow-xs space-y-5">
        <h3 className="font-serif font-bold text-navy text-sm uppercase tracking-wider flex items-center gap-2">
          <FileCode className="w-4 h-4 text-gold" />
          1. Sélectionner le Fichier d&apos;Importation en Masse
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="import-format" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">Standard / Format du Fichier *</label>
            <select
              id="import-format"
              value={importFormat}
              onChange={(e) => setImportFormat(e.target.value as any)}
              className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl text-navy font-semibold min-h-[44px]"
            >
              <option value="onix_3">Standard ONIX 3.0 (XML)</option>
              <option value="zip">Package ZIP Multifichiers (.zip)</option>
              <option value="csv">Tableau CSV (.csv)</option>
              <option value="json">JSON API Payload (.json)</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <FileDropzone
              acceptTypes={[".xml", ".zip", ".csv", ".json"]}
              label="Téléverser le Fichier de Catalogue (Max 500 Mo / 1000 notices) *"
              onFileSelect={(f) => setSelectedFile(f)}
              onFileRemove={() => setSelectedFile(null)}
              selectedFileName={selectedFile?.name}
              selectedFileSize={selectedFile?.size}
            />
          </div>
        </div>

        {/* Note sur la règle client */}
        <div className="p-3.5 rounded-2xl bg-gold/5 border border-gold/20 text-xs text-foreground-muted space-y-1">
          <p className="font-bold text-navy flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-gold" />
            Règle de traitement des erreurs partielles :
          </p>
          <p>
            En cas d&apos;erreur sur certaines notices, seules les notices invalides sont isolées avec un rapport détaillé. Les notices valides sont intégrées normalement dans le pipeline.
          </p>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={uploading || !selectedFile}
            className="px-6 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors inline-flex items-center gap-2 min-h-[44px] shadow-xs disabled:opacity-50"
          >
            {uploading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <UploadCloud className="w-4 h-4 text-gold" />
                Lancer l&apos;Importation Asynchrone
              </>
            )}
          </button>
        </div>
      </form>

      {/* Rapports d'importation antérieurs 21st.dev */}
      <div className="space-y-4">
        <h3 className="font-serif font-bold text-navy text-base">
          Historique des Rapports d&apos;Importation en Lot ({reports.length})
        </h3>

        {reports.map((report) => (
          <BatchImportReportView key={report.batch_id} report={report} />
        ))}
      </div>
    </div>
  );
}
