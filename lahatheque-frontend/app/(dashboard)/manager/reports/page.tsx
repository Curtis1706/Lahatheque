"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileBarChart, Download, FileSpreadsheet, FileText, Calendar } from "lucide-react";

type ReportType = "stock" | "delivery";

interface ReportConfig {
  id: string;
  title: string;
  description: string;
  type: ReportType;
  icon: React.ElementType;
}

const reports: ReportConfig[] = [
  {
    id: "stock-quantities",
    title: "Quantités par entrepôt",
    description: "Stock actuel de chaque ouvrage papier, par entrepôt et par pays.",
    type: "stock",
    icon: FileSpreadsheet,
  },
  {
    id: "stock-movements",
    title: "Mouvements de stock",
    description: "Journal des réassorts, sorties et retours sur la période sélectionnée.",
    type: "stock",
    icon: FileSpreadsheet,
  },
  {
    id: "stock-alerts",
    title: "Ouvrages en alerte",
    description: "Liste des ouvrages en rupture ou en seuil bas avec délais d'alerte.",
    type: "stock",
    icon: FileSpreadsheet,
  },
  {
    id: "delivery-by-status",
    title: "Commandes par statut",
    description: "Répartition des commandes (à expédier, en transit, livrées) sur la période.",
    type: "delivery",
    icon: FileText,
  },
  {
    id: "delivery-by-carrier",
    title: "Commandes par transporteur",
    description: "Volume de commandes par transporteur avec délais moyens.",
    type: "delivery",
    icon: FileText,
  },
  {
    id: "delivery-delays",
    title: "Délais moyens d'expédition et de livraison",
    description: "Temps moyen entre commande → expédition et expédition → livraison.",
    type: "delivery",
    icon: FileText,
  },
];

export default function ManagerReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [generating, setGenerating] = useState<string | null>(null);

  const handleExport = async (reportId: string, format: "excel" | "pdf") => {
    setGenerating(`${reportId}-${format}`);
    // Simuler un temps de génération
    await new Promise((res) => setTimeout(res, 1500));
    setGenerating(null);
    // En production : appel API réel + téléchargement du fichier
  };

  const stockReports = reports.filter((r) => r.type === "stock");
  const deliveryReports = reports.filter((r) => r.type === "delivery");

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/manager" className="hover:text-navy">Vue d&apos;ensemble</Link>
        <span>/</span>
        <span className="text-navy font-semibold">Rapports &amp; Export</span>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-6">
        <Link href="/manager" className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          Vue d&apos;ensemble
        </Link>
        <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
          <FileBarChart className="w-4 h-4 text-gold" />
          Reporting
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
          Rapports &amp; Export
        </h1>
        <p className="text-xs text-foreground-muted mt-1">
          Exportez les données de stock et de livraison aux formats Excel et PDF. Aucune donnée financière n&apos;est incluse.
        </p>
      </div>

      {/* Sélection de la période */}
      <div className="bg-background-secondary border border-border rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gold" />
          <span className="text-xs font-semibold text-navy">Période :</span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto">
          {[
            { id: "week", label: "7 derniers jours" },
            { id: "month", label: "30 derniers jours" },
            { id: "quarter", label: "3 derniers mois" },
            { id: "year", label: "12 derniers mois" },
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedPeriod(p.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors border ${
                selectedPeriod === p.id
                  ? "bg-navy text-white border-navy"
                  : "bg-background text-foreground-muted border-border hover:text-navy"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Rapports de Stock */}
      <div className="space-y-4">
        <h2 className="text-base font-bold font-serif text-navy">Rapports de Stock</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {stockReports.map((report) => (
            <div
              key={report.id}
              className="p-5 rounded-2xl bg-background-secondary border border-border space-y-3 shadow-xs hover:border-gold/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-navy-light">
                  <report.icon className="w-4 h-4 text-gold" />
                </div>
                <h3 className="text-sm font-semibold text-navy">{report.title}</h3>
              </div>
              <p className="text-xs text-foreground-muted">{report.description}</p>
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => handleExport(report.id, "excel")}
                  disabled={generating === `${report.id}-excel`}
                  className="flex-1 px-3 py-2 rounded-xl border border-border bg-background text-xs font-semibold text-navy hover:border-gold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40 min-h-[40px]"
                >
                  {generating === `${report.id}-excel` ? (
                    <span className="w-3.5 h-3.5 border-2 border-navy/30 border-t-navy rounded-full animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  Excel
                </button>
                <button
                  onClick={() => handleExport(report.id, "pdf")}
                  disabled={generating === `${report.id}-pdf`}
                  className="flex-1 px-3 py-2 rounded-xl border border-border bg-background text-xs font-semibold text-navy hover:border-gold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40 min-h-[40px]"
                >
                  {generating === `${report.id}-pdf` ? (
                    <span className="w-3.5 h-3.5 border-2 border-navy/30 border-t-navy rounded-full animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  PDF
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rapports de Livraison */}
      <div className="space-y-4">
        <h2 className="text-base font-bold font-serif text-navy">Rapports de Livraison</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {deliveryReports.map((report) => (
            <div
              key={report.id}
              className="p-5 rounded-2xl bg-background-secondary border border-border space-y-3 shadow-xs hover:border-gold/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-navy-light">
                  <report.icon className="w-4 h-4 text-gold" />
                </div>
                <h3 className="text-sm font-semibold text-navy">{report.title}</h3>
              </div>
              <p className="text-xs text-foreground-muted">{report.description}</p>
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => handleExport(report.id, "excel")}
                  disabled={generating === `${report.id}-excel`}
                  className="flex-1 px-3 py-2 rounded-xl border border-border bg-background text-xs font-semibold text-navy hover:border-gold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40 min-h-[40px]"
                >
                  {generating === `${report.id}-excel` ? (
                    <span className="w-3.5 h-3.5 border-2 border-navy/30 border-t-navy rounded-full animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  Excel
                </button>
                <button
                  onClick={() => handleExport(report.id, "pdf")}
                  disabled={generating === `${report.id}-pdf`}
                  className="flex-1 px-3 py-2 rounded-xl border border-border bg-background text-xs font-semibold text-navy hover:border-gold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40 min-h-[40px]"
                >
                  {generating === `${report.id}-pdf` ? (
                    <span className="w-3.5 h-3.5 border-2 border-navy/30 border-t-navy rounded-full animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  PDF
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="bg-background-secondary border border-border rounded-2xl p-4 text-xs text-foreground-muted">
        <p>
          Les rapports ne contiennent aucune donnée financière (prix, revenus) ni donnée personnelle au-delà 
          du nom et de l&apos;adresse nécessaires à la livraison.
        </p>
      </div>
    </div>
  );
}
