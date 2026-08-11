"use client";

import React, { useState } from "react";
import { FileSpreadsheet, Download, Calendar, Filter, Share2, FileText, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function AdminReportsPage() {
  const [reportType, setReportType] = useState("sales_global");
  const [period, setPeriod] = useState("current_month");
  const [isExporting, setIsExporting] = useState(false);

  const handleTriggerExport = (format: "pdf" | "excel" | "csv") => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      toast.success(`Rapport (${format.toUpperCase()}) généré et téléchargé avec succès !`);
    }, 600);
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
              <option value="current_month">Mois en cours (Mars 2024)</option>
              <option value="previous_month">Mois précédent (Février 2024)</option>
              <option value="q1_2024">Premier Trimestre 2024</option>
              <option value="year_2023">Année Complète 2023</option>
            </select>
          </div>
        </div>

        {/* Buttons d'export (Inspiré de 21st.dev #23636 Share Menu with Export Submenu) */}
        <div className="pt-4 border-t border-border flex flex-wrap items-center gap-3 justify-end">
          <span className="text-xs text-foreground-muted mr-auto">Format d'exportation :</span>
          <button
            onClick={() => handleTriggerExport("pdf")}
            disabled={isExporting}
            className="px-4 py-2 rounded-xl bg-navy text-white text-xs font-semibold hover:bg-navy-hover transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            <FileText className="w-3.5 h-3.5 text-gold" />
            Exporter en PDF
          </button>

          <button
            onClick={() => handleTriggerExport("excel")}
            disabled={isExporting}
            className="px-4 py-2 rounded-xl bg-success text-white text-xs font-semibold hover:bg-success/90 transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Exporter en Excel (.xlsx)
          </button>

          <button
            onClick={() => handleTriggerExport("csv")}
            disabled={isExporting}
            className="px-4 py-2 rounded-xl bg-background border border-border text-foreground text-xs font-semibold hover:border-gold transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-foreground-muted" />
            CSV (données brutes)
          </button>
        </div>
      </div>
    </div>
  );
}
