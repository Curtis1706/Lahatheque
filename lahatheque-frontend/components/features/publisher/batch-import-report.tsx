"use client";

import React from "react";
import { CheckCircle2, AlertTriangle, FileCode, UploadCloud, XCircle } from "lucide-react";
import type { BatchImportReport } from "@/lib/types/publisher";
import { InlineLoader } from "@/components/ui/page-loader";

interface BatchImportReportViewProps {
  report: BatchImportReport;
  className?: string;
}

export function BatchImportReportView({ report, className }: BatchImportReportViewProps) {
  const successPercentage = Math.round(
    (report.success_count / (report.total_records || 1)) * 100
  );

  return (
    <div className={`p-6 rounded-3xl bg-background border border-border space-y-6 shadow-xs ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-navy-light text-navy border border-navy/20">
            <FileCode className="w-5 h-5 text-gold" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-xs text-navy">{report.file_name}</span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-gold/15 text-gold uppercase">
                Format {report.format.replace("_", " ").toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-foreground-muted">Rapport d&apos;importation en lot • {new Date(report.created_at).toLocaleString("fr-FR")}</p>
          </div>
        </div>

        <div className="shrink-0">
          {report.status === "completed" && (
            <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 text-xs font-bold inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> 100% Réussi
            </span>
          )}
          {report.status === "completed_with_errors" && (
            <span className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/30 text-xs font-bold inline-flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" /> Importation partielle ({report.error_count} erreur(s))
            </span>
          )}
          {report.status === "processing" && (
            <span className="px-3 py-1.5 rounded-xl bg-navy/10 text-navy border border-navy/20 text-xs font-bold inline-flex items-center gap-1.5 animate-pulse">
              <InlineLoader size={14} /> Traitement asynchrone...
            </span>
          )}
        </div>
      </div>

      {/* Barre de Progression 21st.dev UploadThing Progress id: 19997 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-navy">Progression d&apos;Intégration du Catalogue</span>
          <span className="font-mono text-gold">{successPercentage}% ({report.success_count} / {report.total_records} notices)</span>
        </div>
        <div className="w-full h-3 bg-background-secondary rounded-full overflow-hidden border border-border p-0.5">
          <div
            className="h-full bg-gold rounded-full transition-all duration-500"
            style={{ width: `${successPercentage}%` }}
          />
        </div>
        <p className="text-[11px] text-foreground-muted italic">
          Note : Les notices valides ont été intégrées dans le pipeline. Seules les notices invalides ci-dessous ont été isolées.
        </p>
      </div>

      {/* Tableau d'isolation des erreurs */}
      {report.errors && report.errors.length > 0 && (
        <div className="space-y-3 pt-2">
          <h4 className="font-serif font-bold text-xs text-navy uppercase tracking-wider flex items-center gap-2">
            <XCircle className="w-4 h-4 text-rose-500" />
            Notices Invalides Isolées ({report.errors.length})
          </h4>

          <div className="space-y-2">
            {report.errors.map((err, idx) => (
              <div key={idx} className="p-3.5 rounded-2xl bg-rose-500/5 border border-rose-500/20 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="font-mono font-bold text-rose-600 block text-[11px]">
                    Ligne {err.line_number} • {err.isbn_or_title}
                  </span>
                  <p className="text-foreground-muted text-[11px] mt-0.5">{err.error_message}</p>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-600 border border-rose-500/30 shrink-0 self-start sm:self-center">
                  Bloqué jusqu&apos;à correction
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
