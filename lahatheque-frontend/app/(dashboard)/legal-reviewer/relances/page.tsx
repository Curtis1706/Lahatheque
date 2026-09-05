"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  BellRing,
  Mail,
  ArrowLeft,
  AlertTriangle,
  Settings,
  CheckCircle2,
  Send,
  ShieldCheck,
  PlusCircle,
} from "lucide-react";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { DebtReminderConfigModal } from "@/components/features/legal/debt-reminder-config-modal";
import { CreateDebtForm } from "@/components/features/legal/create-debt-form";
import {
  getAuthorEmailReports,
  getClientDebts,
  remindClientDebt,
  sendAuthorRoyaltyReport,
  getDebtReminderConfig,
  updateDebtReminderConfig,
} from "@/lib/services/legal";
import type { AuthorEmailReport, ClientDebt, DebtReminderConfig } from "@/lib/types/legal";
import { toast } from "sonner";

export default function LegalRelancesPage() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const initialTab: "authors" | "debts" | "create_debt" =
    tabParam === "create_debt" ? "create_debt" : (tabParam === "debts" ? "debts" : "authors");
  const [activeTab, setActiveTab] = useState<"authors" | "debts" | "create_debt">(initialTab);

  const [authorReports, setAuthorReports] = useState<AuthorEmailReport[]>([]);
  const [debts, setDebts] = useState<ClientDebt[]>([]);
  const [reminderConfig, setReminderConfig] = useState<DebtReminderConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [remindingId, setRemindingId] = useState<string | null>(null);
  const [sendingAuthorId, setSendingAuthorId] = useState<string | null>(null);

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

  const handleRemindDebt = async (debtId: string, clientName?: string) => {
    setRemindingId(debtId);
    try {
      const success = await remindClientDebt(debtId, clientName);
      if (success) {
        setDebts((prev) =>
          prev.map((d) => (d.id === debtId ? { ...d, status: "reminded", reminder_count: d.reminder_count + 1 } : d))
        );
        toast.success("E-mail de relance automatique envoyé avec succès au client !");
      } else {
        toast.error("Échec de l'envoi de la relance.");
      }
    } catch {
      toast.error("Erreur lors de l'envoi de la relance.");
    } finally {
      setRemindingId(null);
    }
  };

  const handleSendAuthorReport = async (authorId?: string) => {
    if (!authorId) return;
    setSendingAuthorId(authorId);
    try {
      const success = await sendAuthorRoyaltyReport(authorId);
      if (success) {
        toast.success("Relevé de redevances transmis avec succès à l'auteur !");
        const refreshed = await getAuthorEmailReports();
        setAuthorReports(refreshed);
      } else {
        toast.error("Échec de l'envoi du relevé.");
      }
    } catch {
      toast.error("Erreur lors de l'envoi du relevé.");
    } finally {
      setSendingAuthorId(null);
    }
  };

  const handleUpdateConfig = async (newConfig: DebtReminderConfig) => {
    const success = await updateDebtReminderConfig(newConfig);
    if (success) {
      setReminderConfig(newConfig);
      toast.success("La configuration des relances automatiques d'impayés a été enregistrée avec succès !");
    } else {
      toast.error("Erreur lors de l'enregistrement de la configuration.");
    }
  };

  const authorColumns: DataTableColumn<AuthorEmailReport>[] = [
    {
      key: "name",
      header: "Auteur Destinataire",
      cell: (row) => (
        <div>
          <p className="font-bold text-xs text-navy">{row.name || "Auteur Inconnu"}</p>
          <p className="text-[10px] text-foreground-muted font-mono">{row.email || "—"}</p>
        </div>
      ),
    },
    {
      key: "total_sales_count",
      header: "Volume Ventes",
      cell: (row) => <span className="font-mono font-bold text-xs text-navy">{row.total_sales_count || 0} exemplaires</span>,
    },
    {
      key: "total_royalties_paid",
      header: "Redevances Versées",
      cell: (row) => (
        <span className="font-mono font-bold text-gold text-xs">
          {(row.total_royalties_paid || 0).toLocaleString("fr-FR")} {row.currency || "XOF"}
        </span>
      ),
    },
    {
      key: "last_report_date",
      header: "Dernier Relevé",
      cell: (row) => (
        <span className="font-mono text-xs text-foreground-muted">
          {row.last_report_date
            ? new Date(row.last_report_date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })
            : "Aucun envoi précédent"}
        </span>
      ),
    },
    {
      key: "actions" as keyof AuthorEmailReport,
      header: "Action",
      cell: (row) => (
        <button
          type="button"
          disabled={sendingAuthorId === row.author_id}
          onClick={() => handleSendAuthorReport(row.author_id)}
          className="px-3 py-1.5 rounded-xl bg-navy text-white text-[10px] font-bold hover:bg-navy-hover transition-colors whitespace-nowrap min-h-[36px] inline-flex items-center gap-1 disabled:opacity-50 cursor-pointer"
          title="Transmettre le relevé de ventes et redevances par e-mail"
        >
          <Mail className="w-3.5 h-3.5 text-gold" />
          {sendingAuthorId === row.author_id ? "Envoi..." : "Envoyer Relevé"}
        </button>
      ),
    },
  ];

  const debtColumns: DataTableColumn<ClientDebt>[] = [
    {
      key: "client_name",
      header: "Client en Impayé",
      cell: (row) => (
        <div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="font-bold text-xs text-navy">{row.client_name}</p>
            {row.source === "wholesale_credit" ? (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-navy/10 text-navy border border-navy/20">
                Grossiste
              </span>
            ) : row.source === "author_credit" ? (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-gold/15 text-gold border border-gold/30">
                Auteur
              </span>
            ) : null}
          </div>
          <p className="text-[10px] text-foreground-muted font-mono">{row.client_email || "—"}</p>
        </div>
      ),
    },
    {
      key: "amount",
      header: "Montant Dû",
      cell: (row) => (
        <span className="font-mono font-bold text-rose-600 text-xs">
          {(row.total_debt_amount || row.amount || 0).toLocaleString("fr-FR")} {row.currency}
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
      header: "Action",
      cell: (row) => (
        <button
          type="button"
          disabled={remindingId === row.id}
          onClick={() => handleRemindDebt(row.id, row.client_name)}
          className="px-3 py-1.5 rounded-xl bg-navy text-white text-[10px] font-bold hover:bg-navy-hover transition-colors whitespace-nowrap min-h-[36px] inline-flex items-center gap-1 disabled:opacity-50 cursor-pointer"
        >
          <Send className="w-3.5 h-3.5 text-gold" />
          {remindingId === row.id ? "Envoi..." : "Déclencher Relance"}
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

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTab("create_debt")}
            className="inline-flex items-center justify-center gap-2 bg-gold hover:bg-gold-hover text-navy text-xs font-bold px-4 py-2.5 rounded-xl transition-colors shadow-xs min-h-[44px] cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-navy" />
            Ajouter une Dette
          </button>
          {reminderConfig && (
            <button
              type="button"
              onClick={() => setIsConfigOpen(true)}
              className="inline-flex items-center justify-center gap-2 bg-navy hover:bg-navy-hover text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-xs min-h-[44px] cursor-pointer"
            >
              <Settings className="w-4 h-4 text-gold" />
              Configurer Règles d&apos;Impayés
            </button>
          )}
        </div>
      </div>

      {/* Onglets Auteurs vs Dettes Clients vs Ajouter une Dette */}
      <div className="flex items-center gap-2 border-b border-border overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("authors")}
          className={`pb-3 px-4 text-xs font-bold transition-colors border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
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
          className={`pb-3 px-4 text-xs font-bold transition-colors border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === "debts"
              ? "border-gold text-navy font-serif text-sm"
              : "border-transparent text-foreground-muted hover:text-navy"
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-rose-500" />
          Relances Dettes Clients ({debts.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("create_debt")}
          className={`pb-3 px-4 text-xs font-bold transition-colors border-b-2 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
            activeTab === "create_debt"
              ? "border-gold text-navy font-serif text-sm"
              : "border-transparent text-foreground-muted hover:text-navy"
          }`}
        >
          <PlusCircle className="w-4 h-4 text-gold" />
          Ajouter une Dette
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
              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveTab("create_debt")}
                  className="text-xs font-bold text-navy hover:text-navy-hover flex items-center gap-1 cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-gold" />
                  Déclarer un impayé
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => setIsConfigOpen(true)}
                  className="text-xs font-bold text-gold hover:underline cursor-pointer"
                >
                  Modifier les règles
                </button>
              </div>
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

      {/* Tab 3: Ajouter une Dette */}
      {activeTab === "create_debt" && (
        <CreateDebtForm
          reminderConfig={reminderConfig}
          onCancel={() => setActiveTab("debts")}
          onSuccess={(newDebt) => {
            setDebts((prev) => [newDebt, ...prev]);
            setActiveTab("debts");
          }}
        />
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
