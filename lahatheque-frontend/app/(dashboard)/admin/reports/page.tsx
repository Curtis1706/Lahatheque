"use client";

import React, { useState } from "react";
import { FileSpreadsheet, Download, Calendar, Filter, Share2, FileText, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminReportsPage() {
  const [reportType, setReportType] = useState("sales_global");
  const [period, setPeriod] = useState("current_month");
  const [isExporting, setIsExporting] = useState(false);

  const handleTriggerExport = async (format: "pdf" | "excel" | "csv") => {
    if (format !== "csv") {
      toast.error(`L'export ${format.toUpperCase()} n'est pas encore disponible — seul le format CSV est pris en charge pour le moment.`);
      return;
    }
    setIsExporting(true);
    try {
      const res = await fetch(
        `/api/bff/admin/reports/export?type=${reportType}&period=${period}&format=csv`
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Échec de la génération du rapport.");
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lahatheque_${reportType}_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Rapport CSV généré et téléchargé avec succès !");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur lors de l'export.";
      toast.error(msg);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-border">
        <h1 className="text-xl sm:text-2xl font-bold font-serif text-navy">
          Reporting & Exports Analytiques
        </h1>
        <p className="text-xs sm:text-sm text-foreground-muted mt-0.5">
          Générer et exporter les états financiers, bilans de ventes et statistiques d'utilisation institutionnelles.
        </p>
      </div>

      {/* Formulaire de Génération */}
      <div className="p-6 rounded-2xl bg-background-secondary border border-border space-y-5">
        <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-gold" />
          Configuration du Bilan & Exportation
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-foreground">Type de Bilan / Domaine</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full mt-1 p-2.5 text-xs rounded-xl bg-background border border-border font-medium text-foreground focus:border-gold focus:outline-none"
            >
              <option value="sales_global">Synthèse globale des Ventes (B2C & B2B)</option>
              <option value="royalties_authors">Ventilation des Redevances Auteurs</option>
              <option value="royalties_publishers">Bilan des Reversements Éditeurs Tiers</option>
              <option value="institutional_usage">Rapport d'Accès Universités (COUNTER 5)</option>
              <option value="catalog_audit">Inventaire complet du Catalogue & DRM</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-foreground">Période concernée</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full mt-1 p-2.5 text-xs rounded-xl bg-background border border-border font-medium text-foreground focus:border-gold focus:outline-none"
            >
              <option value="current_month">Mois en cours (2026)</option>
              <option value="last_30_days">30 derniers jours</option>
              <option value="last_90_days">90 derniers jours</option>
            </select>
          </div>
        </div>

        {/* Buttons d'export */}
        <div className="pt-4 border-t border-border flex flex-wrap items-center gap-3 justify-end">
          <span className="text-xs text-foreground-muted mr-auto">Format d'exportation :</span>
          
          <button
            onClick={() => handleTriggerExport("csv")}
            disabled={isExporting}
            className="px-4 py-2 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer min-h-[44px]"
          >
            <Download className="w-4 h-4 text-gold" />
            <span>{isExporting ? "Génération..." : "Exporter en CSV (Données réelles)"}</span>
          </button>

          <button
            onClick={() => handleTriggerExport("pdf")}
            disabled={true}
            title="Format PDF bientôt disponible"
            className="px-4 py-2 rounded-xl bg-background-secondary border border-border text-foreground-muted text-xs font-semibold flex items-center gap-1.5 opacity-60 cursor-not-allowed min-h-[44px]"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>PDF (Bientôt disponible)</span>
          </button>

          <button
            onClick={() => handleTriggerExport("excel")}
            disabled={true}
            title="Format Excel (.xlsx) bientôt disponible"
            className="px-4 py-2 rounded-xl bg-background-secondary border border-border text-foreground-muted text-xs font-semibold flex items-center gap-1.5 opacity-60 cursor-not-allowed min-h-[44px]"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel (Bientôt disponible)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
