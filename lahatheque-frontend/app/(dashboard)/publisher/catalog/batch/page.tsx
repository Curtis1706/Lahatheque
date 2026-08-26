"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { UploadCloud, ArrowLeft, FileCode, CheckCircle2, AlertTriangle, ShieldCheck, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { FileDropzone } from "@/components/features/layout-artist/file-dropzone";
import { BatchImportReportView } from "@/components/features/publisher/batch-import-report";
import { getBatchImportReports, uploadBatchCatalogue } from "@/lib/services/publisher";
import type { BatchImportReport } from "@/lib/types/publisher";
import { PageLoader, InlineLoader } from "@/components/ui/page-loader";

export default function PublisherBatchImportPage() {
  const [reports, setReports] = useState<BatchImportReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importFormat, setImportFormat] = useState<"onix_3" | "csv" | "json" | "zip">("onix_3");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const data = await getBatchImportReports();
        setReports(data);
      } catch {
        toast.error("Impossible de récupérer l'historique des imports.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleStartImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.info("Veuillez sélectionner un fichier avant de lancer l'importation.");
      return;
    }

    setUploading(true);
    try {
      const newReport = await uploadBatchCatalogue(selectedFile, importFormat);
      setReports((prev) => [newReport, ...prev]);
      toast.success("Lot ONIX 3.0 transmis avec succès ! Traitement asynchrone démarré.");
      setSelectedFile(null);
    } catch {
      toast.error("Erreur lors de l'envoi du lot de catalogue.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 sm:space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/publisher/catalog" className="inline-flex items-center gap-1.5 text-xs text-navy font-bold hover:text-gold transition-colors mb-2">
            <ArrowLeft className="w-4 h-4" />
            Retour au Catalogue
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
            <UploadCloud className="w-4 h-4 text-gold" />
            Importation en Masse
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Dépôt en Lot (ONIX 3.0 / CSV / JSON / ZIP)
          </h1>
          <p className="text-xs sm:text-sm text-foreground-muted mt-1">
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
            <label htmlFor="import-format" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1.5">
              Standard / Format du Fichier <span className="text-rose-500">*</span>
            </label>
            <select
              id="import-format"
              value={importFormat}
              onChange={(e) => setImportFormat(e.target.value as any)}
              className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl text-navy font-semibold min-h-[44px]"
            >
              <option value="onix_3">Standard ONIX 3.0 (XML EDItEUR)</option>
              <option value="zip">Package ZIP Multifichiers (.zip)</option>
              <option value="csv">Tableau CSV Délimité (.csv)</option>
              <option value="json">JSON API Payload (.json)</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1.5">
              Téléverser le Fichier de Catalogue (Max 500 Mo / 1000 notices) <span className="text-rose-500">*</span>
            </label>
            <FileDropzone
              label="Sélectionner le flux ONIX 3.0 / ZIP / CSV"
              acceptTypes={[".xml", ".zip", ".csv", ".json"]}
              selectedFileName={selectedFile?.name}
              selectedFileSize={selectedFile?.size}
              onFileSelect={(file) => {
                setSelectedFile(file);
                toast.success(`Fichier ${file.name} sélectionné.`);
              }}
              onFileRemove={() => setSelectedFile(null)}
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border">
          <span className="text-xs text-foreground-muted">
            {selectedFile ? (
              <span className="text-navy font-semibold">Fichier sélectionné : {selectedFile.name}</span>
            ) : (
              "Aucun fichier sélectionné"
            )}
          </span>
          <button
            type="submit"
            disabled={!selectedFile || uploading}
            className="px-6 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors flex items-center gap-2 min-h-[44px] shadow-xs disabled:opacity-50"
          >
            {uploading ? (
              <>
                <InlineLoader size={16} />
                <span>Analyse syntaxique en cours...</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4 text-gold" />
                <span>Lancer l&apos;Analyse &amp; l&apos;Importation</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Rapports d'importation précédents */}
      <div className="space-y-4">
        <h3 className="font-serif font-bold text-navy text-base">Historique des Lots et Rapports de Conformité</h3>
        {loading ? (
          <PageLoader label="Chargement des rapports" />
        ) : reports.length === 0 ? (
          <div className="p-8 rounded-3xl bg-background border border-border text-center text-xs text-foreground-muted">
            Aucun import de catalogue enregistré.
          </div>
        ) : (
          reports.map((rep) => (
            <BatchImportReportView key={rep.batch_id} report={rep} />
          ))
        )}
      </div>
    </div>
  );
}
