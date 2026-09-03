"use client";

import React, { useState } from "react";
import { FileSpreadsheet, Download, Calendar, Filter, Share2, FileText, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { generateOfficialPdf, generateCsvExport } from "@/lib/services/export-service";

export default function AdminReportsPage() {
  const [reportType, setReportType] = useState("sales_global");
  const [period, setPeriod] = useState("current_month");
  const [isExporting, setIsExporting] = useState(false);

  const reportTitles: Record<string, string> = {
    sales_global: "Synthèse Globale des Ventes & Transactions",
    royalties_authors: "Ventilation des Redevances Auteurs",
    royalties_publishers: "Bilan des Reversements Éditeurs Tiers",
    institutional_usage: "Rapport d'Accès Universités (COUNTER 5)",
    catalog_audit: "Inventaire Complet du Catalogue & DRM",
  };

  const periodLabels: Record<string, string> = {
    current_month: "Mois en cours (2026)",
    last_30_days: "30 derniers jours",
    last_90_days: "90 derniers jours",
  };

  const handleTriggerExport = async (format: "pdf" | "excel" | "csv") => {
    setIsExporting(true);
    try {
      if (format === "pdf") {
        // Génération du rapport officiel PDF
        await generateOfficialPdf({
          docType: "RAPPORT_FINANCIER",
          docNumber: `REP-${Date.now().toString().slice(-6)}`,
          date: new Date().toLocaleDateString("fr-FR"),
          period: periodLabels[period] || period,
          recipient: {
            name: "Direction Générale & Contrôle de Gestion",
            roleOrTitle: "Administration Centrale LAHAThèque",
            emailOrPhone: "direction@lahatheque.bj",
            addressOrCampus: "Cotonou, République du Bénin",
          },
          summaryCards: [
            { label: "Volume Ventes", value: "14 850 000 FCFA" },
            { label: "Transactions", value: "1 248 ventes" },
            { label: "Redevances", value: "4 455 000 FCFA" },
            { label: "Taux Succès", value: "99.4 %" },
          ],
          tableHeaders: ["Réf.", "Intitulé / Domaine", "Volume", "Montant Brut", "Redevance", "Statut"],
          tableRows: [
            ["VNT-001", "Manuels de Droit & Sciences Politiques", "420 ex.", "4 200 000 FCFA", "1 260 000 FCFA", "Clôturé"],
            ["VNT-002", "Médecine & Santé Tropicale", "280 ex.", "3 640 000 FCFA", "1 092 000 FCFA", "Clôturé"],
            ["VNT-003", "Sciences Économiques & Gestion", "310 ex.", "3 100 000 FCFA", "930 000 FCFA", "Clôturé"],
            ["VNT-004", "Génie Logiciel & Informatique", "190 ex.", "2 470 000 FCFA", "741 000 FCFA", "Clôturé"],
            ["VNT-005", "Bouquets Universitaires UAC / UNA", "45 abonn.", "1 440 000 FCFA", "432 000 FCFA", "En cours"],
          ],
          totalAmount: "14 850 000 FCFA",
          totalNotes: `Rapport généré automatiquement pour le domaine : ${reportTitles[reportType] || reportType}. Conforme aux normes d'audit SYSCOHADA.`,
          filename: `rapport_lahatheque_${reportType}_${new Date().toISOString().slice(0, 10)}.pdf`,
        });
        toast.success("Rapport PDF officiel généré avec succès !");
      } else {
        // Génération CSV / Excel avec BOM UTF-8
        const sampleData = [
          { Reference: "VNT-001", Domaine: "Droit & Sciences Politiques", Exemplaires: 420, Montant_Brut_FCFA: 4200000, Redevance_FCFA: 1260000, Statut: "Cloture" },
          { Reference: "VNT-002", Domaine: "Medecine & Sante Tropicale", Exemplaires: 280, Montant_Brut_FCFA: 3640000, Redevance_FCFA: 1092000, Statut: "Cloture" },
          { Reference: "VNT-003", Domaine: "Sciences Economiques & Gestion", Exemplaires: 310, Montant_Brut_FCFA: 3100000, Redevance_FCFA: 930000, Statut: "Cloture" },
          { Reference: "VNT-004", Domaine: "Genie Logiciel & Informatique", Exemplaires: 190, Montant_Brut_FCFA: 2470000, Redevance_FCFA: 741000, Statut: "Cloture" },
          { Reference: "VNT-005", Domaine: "Bouquets Universitaires UAC / UNA", Exemplaires: 45, Montant_Brut_FCFA: 1440000, Redevance_FCFA: 432000, Statut: "En_cours" },
        ];
        generateCsvExport(sampleData, `rapport_lahatheque_${reportType}_${new Date().toISOString().slice(0, 10)}`);
        toast.success(`Rapport ${format.toUpperCase()} généré avec succès (format UTF-8 BOM pour Excel) !`);
      }
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
            <span>{isExporting ? "Génération..." : "Exporter en CSV"}</span>
          </button>

          <button
            onClick={() => handleTriggerExport("pdf")}
            disabled={isExporting}
            title="Télécharger le rapport officiel au format PDF"
            className="px-4 py-2 rounded-xl bg-gold/15 border border-gold/40 text-navy font-bold text-xs flex items-center gap-1.5 hover:bg-gold/25 transition-colors cursor-pointer min-h-[44px]"
          >
            <FileText className="w-4 h-4 text-gold" />
            <span>Exporter en PDF</span>
          </button>

          <button
            onClick={() => handleTriggerExport("excel")}
            disabled={isExporting}
            title="Exporter pour Microsoft Excel"
            className="px-4 py-2 rounded-xl bg-background-secondary border border-border text-navy text-xs font-semibold flex items-center gap-1.5 hover:bg-background transition-colors cursor-pointer min-h-[44px]"
          >
            <FileSpreadsheet className="w-4 h-4 text-gold" />
            <span>Exporter en Excel</span>
          </button>
        </div>
      </div>
    </div>
  );
}
