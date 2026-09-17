"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
  Calendar,
  Layers,
  FileText,
} from "lucide-react";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { DebtReminderConfigModal } from "@/components/features/legal/debt-reminder-config-modal";
import { CreateDebtForm } from "@/components/features/legal/create-debt-form";
import { SendAuthorStatementModal } from "@/components/features/legal/send-author-statement-modal";
import { SendDebtReminderModal } from "@/components/features/legal/send-debt-reminder-modal";
import {
  getAuthorEmailReports,
  getClientDebts,
  getDebtReminderConfig,
  updateDebtReminderConfig,
  sendBatchAuthorStatements,
} from "@/lib/services/legal";
import { prepareCourrier, prepareBatchCourriers } from "@/lib/services/courrier";
import type {
  AuthorEmailReport,
  ClientDebt,
  DebtReminderConfig,
  PeriodType,
} from "@/lib/types/legal";
import { toast } from "sonner";
import { InlineLoader } from "@/components/ui/page-loader";

const MONTH_NAMES = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];

const QUARTER_NAMES = [
  { value: 1, label: "T1 (Janvier - Mars)" },
  { value: 2, label: "T2 (Avril - Juin)" },
  { value: 3, label: "T3 (Juillet - Septembre)" },
  { value: 4, label: "T4 (Octobre - Décembre)" },
];

export default function LegalRelancesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const initialTab: "authors" | "debts" | "create_debt" =
    tabParam === "create_debt" ? "create_debt" : (tabParam === "debts" ? "debts" : "authors");
  const [activeTab, setActiveTab] = useState<"authors" | "debts" | "create_debt">(initialTab);

  const [authorReports, setAuthorReports] = useState<AuthorEmailReport[]>([]);
  const [debts, setDebts] = useState<ClientDebt[]>([]);
  const [reminderConfig, setReminderConfig] = useState<DebtReminderConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [preparingId, setPreparingId] = useState<string | null>(null);

  // Filtres de périodicité pour les relevés d'auteurs
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const currentQuarter = Math.ceil(currentMonth / 3);

  const [periodType, setPeriodType] = useState<PeriodType>("monthly");
  const [periodYear, setPeriodYear] = useState<number>(currentYear);
  const [periodMonth, setPeriodMonth] = useState<number>(currentMonth);
  const [periodQuarter, setPeriodQuarter] = useState<number>(currentQuarter);

  // Modales
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [selectedAuthorForStatement, setSelectedAuthorForStatement] = useState<AuthorEmailReport | null>(null);
  const [isAuthorStatementModalOpen, setIsAuthorStatementModalOpen] = useState(false);
  const [selectedDebtForReminder, setSelectedDebtForReminder] = useState<ClientDebt | null>(null);
  const [isDebtReminderModalOpen, setIsDebtReminderModalOpen] = useState(false);

  // Envoi groupé
  const [isBatchSending, setIsBatchSending] = useState(false);

  const loadAuthorData = useCallback(async () => {
    try {
      const rData = await getAuthorEmailReports({
        period_type: periodType,
        year: periodYear,
        month: periodType === "monthly" ? periodMonth : undefined,
        quarter: periodType === "quarterly" ? periodQuarter : undefined,
      });
      setAuthorReports(rData);
    } catch {
      toast.error("Impossible d'actualiser les données des auteurs.");
    }
  }, [periodType, periodYear, periodMonth, periodQuarter]);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    const [rData, dData, cData] = await Promise.all([
      getAuthorEmailReports({
        period_type: periodType,
        year: periodYear,
        month: periodType === "monthly" ? periodMonth : undefined,
        quarter: periodType === "quarterly" ? periodQuarter : undefined,
      }),
      getClientDebts(),
      getDebtReminderConfig(),
    ]);
    setAuthorReports(rData);
    setDebts(dData);
    setReminderConfig(cData);
    setLoading(false);
  }, [periodType, periodYear, periodMonth, periodQuarter]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const handleOpenAuthorModal = (author: AuthorEmailReport) => {
    setSelectedAuthorForStatement(author);
    setIsAuthorStatementModalOpen(true);
  };

  const handleOpenDebtModal = (debt: ClientDebt) => {
    setSelectedDebtForReminder(debt);
    setIsDebtReminderModalOpen(true);
  };

  const handlePrepareAuthorCourrier = async (author: AuthorEmailReport) => {
    const authorId = author.author_id || author.report_id;
    if (!authorId) {
      toast.error("Identifiant de l'auteur introuvable.");
      return;
    }
    setPreparingId(authorId);
    try {
      const res = await prepareCourrier({
        category: "royalty_author",
        recipient_type: "author",
        recipient_id: authorId,
        period_type: periodType,
        year: periodYear,
        month: periodType === "monthly" ? periodMonth : undefined,
        quarter: periodType === "quarterly" ? periodQuarter : undefined,
      });
      if (res.success && res.data) {
        toast.success("Brouillon de courrier officiel préparé avec succès.");
        router.push("/legal-reviewer/courriers");
      } else {
        toast.error(res.error || "Impossible de préparer le courrier de l'auteur.");
      }
    } catch {
      toast.error("Erreur lors de la préparation du courrier.");
    } finally {
      setPreparingId(null);
    }
  };

  const handlePrepareDebtCourrier = async (debt: ClientDebt) => {
    setPreparingId(debt.id);
    try {
      const res = await prepareCourrier({
        category: "debt_reminder",
        recipient_type: "client",
        recipient_id: debt.id,
      });
      if (res.success && res.data) {
        toast.success("Brouillon de courrier de relance préparé avec succès.");
        router.push("/legal-reviewer/courriers");
      } else {
        toast.error(res.error || "Impossible de préparer le courrier de relance.");
      }
    } catch {
      toast.error("Erreur lors de la préparation du courrier de relance.");
    } finally {
      setPreparingId(null);
    }
  };

  const handlePrepareBatchCourriers = async () => {
    setIsBatchSending(true);
    try {
      const res = await prepareBatchCourriers({
        category: "royalty_author",
        period_type: periodType,
        year: periodYear,
        month: periodType === "monthly" ? periodMonth : undefined,
        quarter: periodType === "quarterly" ? periodQuarter : undefined,
      });
      if (res.success && res.data) {
        toast.success(`${res.data.prepared_count} courriers officiels préparés pour la période.`);
        router.push("/legal-reviewer/courriers");
      } else {
        toast.error(res.error || "Échec de la préparation groupée des courriers.");
      }
    } catch {
      toast.error("Erreur réseau lors de la préparation groupée.");
    } finally {
      setIsBatchSending(false);
    }
  };

  const handleSendBatchAuthorStatements = async () => {
    const periodLabel = periodType === "monthly"
      ? `${MONTH_NAMES[periodMonth - 1]} ${periodYear}`
      : `T${periodQuarter} ${periodYear}`;

    const confirmMsg = `Confirmez-vous l'expédition des bordereaux officiels signés à tous les auteurs éligibles pour la période : ${periodLabel} ?`;
    if (!window.confirm(confirmMsg)) return;

    setIsBatchSending(true);
    try {
      const res = await sendBatchAuthorStatements({
        period_type: periodType,
        year: periodYear,
        month: periodType === "monthly" ? periodMonth : undefined,
        quarter: periodType === "quarterly" ? periodQuarter : undefined,
        include_pdf: true,
      });

      if (res.success) {
        toast.success(res.message || `Expédition groupée terminée : ${res.sent_count || 0} bordereau(x) envoyé(s).`);
        await loadAuthorData();
      } else {
        toast.error(res.error || "Échec de l'expédition groupée des bordereaux.");
      }
    } catch {
      toast.error("Erreur réseau lors de l'expédition groupée.");
    } finally {
      setIsBatchSending(false);
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
          <p className="font-bold text-xs text-navy">{row.name || row.author_name || "Auteur Inconnu"}</p>
          <p className="text-[10px] text-foreground-muted font-mono">{row.email || row.author_email || "—"}</p>
        </div>
      ),
    },
    {
      key: "total_sales_count",
      header: "Volume Ventes (Période)",
      cell: (row) => (
        <span className="font-mono font-bold text-xs text-navy">
          {row.total_sales_count || 0} exemplaires
        </span>
      ),
    },
    {
      key: "total_royalties_paid",
      header: "Droits Calculés (Période)",
      cell: (row) => (
        <span className="font-mono font-bold text-gold text-xs">
          {(row.total_royalties_paid || 0).toLocaleString("fr-FR")} FCFA
        </span>
      ),
    },
    {
      key: "last_report_date",
      header: "Dernier Relevé Expédié",
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
          onClick={() => handlePrepareAuthorCourrier(row)}
          disabled={preparingId === (row.author_id || row.report_id)}
          className="px-3 py-1.5 rounded-xl bg-navy text-white text-[10px] font-bold hover:bg-navy-hover transition-colors whitespace-nowrap min-h-[36px] inline-flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
          title="Préparer le courrier officiel de droits d'auteur sur papier à en-tête LAHA"
        >
          {preparingId === (row.author_id || row.report_id) ? (
            <InlineLoader size={16} />
          ) : (
            <FileText className="w-3.5 h-3.5 text-gold" />
          )}
          Préparer le courrier
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
          onClick={() => handlePrepareDebtCourrier(row)}
          disabled={preparingId === row.id}
          className="px-3 py-1.5 rounded-xl bg-navy text-white text-[10px] font-bold hover:bg-navy-hover transition-colors whitespace-nowrap min-h-[36px] inline-flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
          title="Préparer le courrier officiel de relance sur papier à en-tête LAHA"
        >
          {preparingId === row.id ? (
            <InlineLoader size={16} />
          ) : (
            <FileText className="w-3.5 h-3.5 text-gold" />
          )}
          Préparer le courrier
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
            Communications Officielles &amp; Droits d&apos;Auteur
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Relances d&apos;Impayés &amp; Bordereaux de Droits
          </h1>
          <p className="text-xs text-foreground-muted mt-1">
            Expédition certifiée des relevés de droits d&apos;auteur (mensuels ou trimestriels) et procédures de relance de créances via le mail pro officiel.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <Link
            href="/legal-reviewer/courriers"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors shadow-xs min-h-[44px]"
          >
            <FileText className="w-4 h-4 text-gold" />
            <span>Voir les courriers officiels</span>
          </Link>
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
        <div className="space-y-4">
          {/* Barre de filtrage par période & Déclenchement groupé */}
          <div className="p-4 rounded-2xl bg-background-secondary border border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-navy">
                <Calendar className="w-4 h-4 text-gold" />
                <span>Période :</span>
              </div>

              <div className="inline-flex rounded-xl border border-border bg-background p-0.5">
                <button
                  type="button"
                  onClick={() => setPeriodType("monthly")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors min-h-[36px] ${
                    periodType === "monthly"
                      ? "bg-navy text-white font-bold"
                      : "text-foreground-muted hover:text-navy"
                  }`}
                >
                  Mensuelle
                </button>
                <button
                  type="button"
                  onClick={() => setPeriodType("quarterly")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors min-h-[36px] ${
                    periodType === "quarterly"
                      ? "bg-navy text-white font-bold"
                      : "text-foreground-muted hover:text-navy"
                  }`}
                >
                  Trimestrielle
                </button>
              </div>

              <select
                value={periodYear}
                onChange={(e) => setPeriodYear(parseInt(e.target.value))}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-border bg-background text-navy focus:outline-none focus:border-gold min-h-[36px]"
              >
                {[currentYear, currentYear - 1, currentYear - 2].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>

              {periodType === "monthly" ? (
                <select
                  value={periodMonth}
                  onChange={(e) => setPeriodMonth(parseInt(e.target.value))}
                  className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-border bg-background text-navy focus:outline-none focus:border-gold min-h-[36px]"
                >
                  {MONTH_NAMES.map((name, idx) => (
                    <option key={name} value={idx + 1}>{name}</option>
                  ))}
                </select>
              ) : (
                <select
                  value={periodQuarter}
                  onChange={(e) => setPeriodQuarter(parseInt(e.target.value))}
                  className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-border bg-background text-navy focus:outline-none focus:border-gold min-h-[36px]"
                >
                  {QUARTER_NAMES.map((q) => (
                    <option key={q.value} value={q.value}>{q.label}</option>
                  ))}
                </select>
              )}
            </div>

            <button
              type="button"
              disabled={isBatchSending || authorReports.length === 0}
              onClick={handlePrepareBatchCourriers}
              className="inline-flex items-center justify-center gap-2 bg-navy hover:bg-navy-hover text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors shadow-xs min-h-[44px] cursor-pointer disabled:opacity-50"
              title="Préparer les courriers officiels pour tous les auteurs de la période"
            >
              {isBatchSending ? (
                <InlineLoader size={16} />
              ) : (
                <>
                  <Layers className="w-4 h-4 text-gold" />
                  Préparer les courriers de la période ({authorReports.length})
                </>
              )}
            </button>
          </div>

          <DataTable
            data={authorReports}
            columns={authorColumns}
            rowKey="author_id"
            loading={loading}
            emptyMessage="Aucun auteur avec des ventes sur cette période."
          />
        </div>
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

      {/* Modale d'expédition de relevé de droits d'auteur */}
      <SendAuthorStatementModal
        isOpen={isAuthorStatementModalOpen}
        onClose={() => {
          setIsAuthorStatementModalOpen(false);
          setSelectedAuthorForStatement(null);
        }}
        onSuccess={loadAuthorData}
        author={selectedAuthorForStatement}
        defaultPeriodType={periodType}
        defaultYear={periodYear}
        defaultMonth={periodMonth}
        defaultQuarter={periodQuarter}
      />

      {/* Modale d'expédition de relance de dette client */}
      <SendDebtReminderModal
        isOpen={isDebtReminderModalOpen}
        onClose={() => {
          setIsDebtReminderModalOpen(false);
          setSelectedDebtForReminder(null);
        }}
        onSuccess={async () => {
          const refreshed = await getClientDebts();
          setDebts(refreshed);
        }}
        debt={selectedDebtForReminder}
      />

      {/* Modale de configuration des règles de relance automatique */}
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
