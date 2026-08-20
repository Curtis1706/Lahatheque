"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { BellRing, Mail, ArrowLeft, AlertTriangle, Settings, CheckCircle2, Send, ShieldCheck } from "lucide-react";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { DebtReminderConfigModal } from "@/components/features/legal/debt-reminder-config-modal";
import {
  getAuthorEmailReports,
  getClientDebts,
  remindClientDebt,
  getDebtReminderConfig,
  updateDebtReminderConfig,
} from "@/lib/services/legal";
import type { AuthorEmailReport, ClientDebt, DebtReminderConfig } from "@/lib/types/legal";

export default function LegalRelancesPage() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "debts" ? "debts" : "authors";
  const [activeTab, setActiveTab] = useState<"authors" | "debts">(initialTab);

  const [authorReports, setAuthorReports] = useState<AuthorEmailReport[]>([]);
  const [debts, setDebts] = useState<ClientDebt[]>([]);
  const [reminderConfig, setReminderConfig] = useState<DebtReminderConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [remindingId, setRemindingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [rData, dData, cData] = await Promise.all([
        getAuthorEmailReports(),
        getClientDebts(),
        getDebtReminderConfig(),
      ]);
      setAuthorReports(rData);
      setDebts(dData);
      setReminderConfig(cData);
      setLoading(false);
    }
    loadData();
  }, []);

  const handleRemindDebt = async (debtId: string) => {
    setRemindingId(debtId);
    try {
      const success = await remindClientDebt(debtId);
      if (success) {
        setDebts((prev) =>
          prev.map((d) => (d.id === debtId ? { ...d, status: "reminded", reminder_count: d.reminder_count + 1 } : d))
        );
        alert("E-mail de relance automatique envoyé avec succès au client !");
      }
    } finally {
      setRemindingId(null);
    }
  };

  const handleUpdateConfig = async (newConfig: DebtReminderConfig) => {
    const success = await updateDebtReminderConfig(newConfig);
    if (success) {
      setReminderConfig(newConfig);
      alert("La configuration des relances automatiques d'impayés a été enregistrée avec succès !");
    }
  };

  const authorColumns: DataTableColumn<AuthorEmailReport>[] = [
    {
      key: "name",
      header: "Auteur Destinataire",
      cell: (row) => (
        <div>
          <p className="font-bold text-xs text-navy">{row.name}</p>
          <p className="text-[10px] text-foreground-muted font-mono">{row.email}</p>
        </div>
      ),
    },
    {
      key: "total_sales_count",
      header: "Volume Ventes",
      cell: (row) => <span className="font-mono font-bold text-xs text-navy">{row.total_sales_count} exemplaires</span>,
    },
    {
      key: "total_royalties_paid",
      header: "Redevances Versées",
      cell: (row) => (
        <span className="font-mono font-bold text-gold text-xs">
          {(row.total_royalties_paid || row.total_revenue_reported || 0).toLocaleString("fr-FR")} XOF
        </span>
      ),
    },
    {
      key: "next_report_date",
      header: "Prochain Envoi Automatique",
      cell: (row) => (
        <span className="font-mono text-xs text-foreground-muted">
          {row.next_report_date
            ? new Date(row.next_report_date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })
            : (row.sent_at || "Programmée")}
        </span>
      ),
    },
    {
      key: "status",
      header: "Statut",
      cell: (row) => (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/30">
          <CheckCircle2 className="w-3 h-3" />
          Planifié / Automatique
        </span>
      ),
    },
  ];

  const debtColumns: DataTableColumn<ClientDebt>[] = [
    {
      key: "client_name",
      header: "Client en Impayé",
      cell: (row) => (
        <div>
          <p className="font-bold text-xs text-navy">{row.client_name}</p>
          <p className="text-[10px] text-foreground-muted font-mono">{row.client_email}</p>
        </div>
      ),
    },
    {
      key: "amount",
      header: "Montant Dû",
      cell: (row) => (
        <span className="font-mono font-bold text-rose-600 text-xs">
          {(row.amount || row.total_debt_amount || 0).toLocaleString("fr-FR")} {row.currency}
        </span>
      ),
    },
    {
      key: "days_overdue",
      header: "Ancienneté",
      cell: (row) => (
        <span className="font-mono font-bold text-xs text-amber-600 px-2 py-0.5 rounded-md bg-amber-500/10">
          +{row.days_overdue} jours
        </span>
      ),
    },
    {
      key: "reminder_count",
      header: "Relances Envoyées",
      cell: (row) => (
        <span className="font-mono font-bold text-xs text-navy">
          {row.reminder_count} relance(s)
        </span>
      ),
    },
    {
      key: "actions" as keyof ClientDebt,
      header: "",
      cell: (row) => (
        <button
          type="button"
          disabled={remindingId === row.id}
          onClick={() => handleRemindDebt(row.id)}
          className="px-3 py-1.5 rounded-xl bg-navy text-white text-[10px] font-bold hover:bg-navy-hover transition-colors whitespace-nowrap min-h-[36px] inline-flex items-center gap-1 disabled:opacity-50"
        >
          <Send className="w-3.5 h-3.5 text-gold" />
          Déclencher Relance
        </button>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/legal-reviewer" className="hover:text-navy">Vue d&apos;ensemble</Link>
        <span>/</span>
        <span className="text-navy font-semibold">Relances &amp; Communication</span>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/legal-reviewer" className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Vue d&apos;ensemble
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
            <BellRing className="w-4 h-4 text-gold" />
            Communications Automatiques
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Relances Automatiques &amp; Rapports Auteurs
          </h1>
          <p className="text-xs text-foreground-muted mt-1">
            Envoi automatique des rapports de ventes aux auteurs et gestion des relances pour factures impayées.
          </p>
        </div>

        {reminderConfig && (
          <button
            type="button"
            onClick={() => setIsConfigOpen(true)}
            className="inline-flex items-center justify-center gap-2 bg-navy hover:bg-navy-hover text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-xs min-h-[44px]"
          >
            <Settings className="w-4 h-4 text-gold" />
            Configurer Règles d&apos;Impayés
          </button>
        )}
      </div>

      {/* Onglets Auteurs vs Dettes Clients */}
      <div className="flex items-center gap-2 border-b border-border">
        <button
          type="button"
          onClick={() => setActiveTab("authors")}
          className={`pb-3 px-4 text-xs font-bold transition-colors border-b-2 flex items-center gap-1.5 ${
            activeTab === "authors"
              ? "border-gold text-navy font-serif text-sm"
              : "border-transparent text-foreground-muted hover:text-navy"
          }`}
        >
          <Mail className="w-4 h-4 text-gold" />
          Rapports &amp; Paiements Auteurs ({authorReports.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("debts")}
          className={`pb-3 px-4 text-xs font-bold transition-colors border-b-2 flex items-center gap-1.5 ${
            activeTab === "debts"
              ? "border-gold text-navy font-serif text-sm"
              : "border-transparent text-foreground-muted hover:text-navy"
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-rose-500" />
          Relances Dettes Clients ({debts.length})
        </button>
      </div>

      {/* Tab 1: Auteurs */}
      {activeTab === "authors" && (
        <DataTable
          data={authorReports}
          columns={authorColumns}
          rowKey="author_id"
          loading={loading}
          emptyMessage="Aucun rapport auteur programmé."
        />
      )}

      {/* Tab 2: Dettes Clients */}
      {activeTab === "debts" && (
        <div className="space-y-4">
          {reminderConfig && (
            <div className="p-4 rounded-2xl bg-background-secondary border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-foreground-muted">
                <ShieldCheck className="w-4 h-4 text-gold shrink-0" />
                <span>
                  Seuil min : <strong className="text-navy">{(reminderConfig.min_amount_threshold || 5000).toLocaleString("fr-FR")} FCFA</strong> • Première relance après <strong className="text-navy">{reminderConfig.days_before_first_reminder || 7} jours</strong> • Max : <strong className="text-navy">{reminderConfig.max_reminders_count || 3} relances</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsConfigOpen(true)}
                className="text-xs font-bold text-gold hover:underline text-left sm:text-right shrink-0"
              >
                Modifier les règles
              </button>
            </div>
          )}

          <DataTable
            data={debts}
            columns={debtColumns}
            rowKey="id"
            loading={loading}
            emptyMessage="Aucune dette ou impayé en cours."
          />
        </div>
      )}

      {/* Modale 21st.dev de configuration des règles de relance */}
      {reminderConfig && (
        <DebtReminderConfigModal
          currentConfig={reminderConfig}
          isOpen={isConfigOpen}
          onClose={() => setIsConfigOpen(false)}
          onConfirm={handleUpdateConfig}
        />
      )}
    </div>
  );
}
