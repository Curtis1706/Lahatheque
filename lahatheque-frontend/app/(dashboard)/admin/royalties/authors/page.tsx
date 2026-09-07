"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  CreditCard, 
  AlertCircle, 
  Clock, 
  Smartphone,
  Check,
  X,
  Eye,
  RefreshCw,
  BookOpen,
  User,
  Calendar,
  Percent,
  TrendingUp,
  Receipt,
  FileText
} from "lucide-react";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { 
  getAdminRoyalties, 
  processRoyaltyPayout, 
  triggerRoyaltyCalculation 
} from "@/lib/services/admin";
import { 
  getPayoutRequests, 
  decideAdminPayout, 
  type PayoutRequestItem 
} from "@/lib/services/author";
import { AdminRoyalty } from "@/lib/types/admin";
import { StatusBadge } from "@/components/ui/status-badge";
import { toast } from "sonner";

function formatPeriod(period?: string): string {
  if (!period) return "-";
  const parts = period.split("-");
  if (parts.length >= 2) {
    const year = parts[0];
    const month = parts[1];
    const monthNames = [
      "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
      "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
    ];
    const idx = parseInt(month, 10) - 1;
    if (idx >= 0 && idx < 12) {
      return `${monthNames[idx]} ${year}`;
    }
  }
  return period;
}

export default function AdminAuthorRoyaltiesPage() {
  const [data, setData] = useState<AdminRoyalty[]>([]);
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  
  // Modale de Décision (Demandes de retrait explicites MoMo / Banque)
  const [decisionModal, setDecisionModal] = useState<{
    open: boolean;
    type: "approve" | "reject";
    payout: PayoutRequestItem | null;
  }>({ open: false, type: "approve", payout: null });
  
  const [txRef, setTxRef] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  // Modale de Détails d'une Ligne de Redevance Ouvrage
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedRoyalty, setSelectedRoyalty] = useState<AdminRoyalty | null>(null);

  // Modale de Règlement Direct d'une Ligne de Redevance
  const [settleModalOpen, setSettleModalOpen] = useState(false);
  const [settlingRoyalty, setSettlingRoyalty] = useState<AdminRoyalty | null>(null);
  const [settleTxRef, setSettleTxRef] = useState("");
  const [settleNotes, setSettleNotes] = useState("");
  const [settling, setSettling] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [royalties, reqs] = await Promise.all([
        getAdminRoyalties(),
        getPayoutRequests(),
      ]);

      // Consolidation des lignes de redevances acquises par les auteurs (par ouvrage et période)
      const authorRoyalties = royalties.filter(
        (i) => i.beneficiary_type === "author" && (i.id.startsWith("payout-line-") || Boolean(i.book_title))
      );
      setData(authorRoyalties);

      // Demandes de retrait explicites
      if (reqs && reqs.length > 0) {
        setPayoutRequests(reqs);
      } else {
        const directReqs: PayoutRequestItem[] = royalties
          .filter(
            (i) =>
              !i.id.startsWith("payout-line-") &&
              !i.id.startsWith("univ-") &&
              !i.id.startsWith("pub-") &&
              i.beneficiary_type === "author"
          )
          .map((r) => ({
            id: r.id,
            author_name: r.beneficiary_name,
            author_email: r.beneficiary_email,
            amount: r.payout_amount,
            payment_method: r.payment_method || "momo",
            account_details: r.account_details || "",
            status: (r.status === "processed" || r.status === "approved" || r.status === "rejected" ? r.status : "pending") as any,
            transaction_reference: r.transaction_reference,
            admin_notes: r.admin_notes,
            created_at: r.created_at || new Date().toISOString(),
          }));
        setPayoutRequests(directReqs);
      }
    } catch (err) {
      console.error("Erreur chargement redevances auteurs:", err);
      toast.error("Erreur lors de la récupération des redevances auteurs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleTriggerRecalc = async () => {
    setRecalculating(true);
    try {
      const res = await triggerRoyaltyCalculation();
      if (res.success) {
        toast.success(res.message || "Calcul des redevances exécuté avec succès.");
        await loadAll();
      } else {
        toast.error(res.error || "Erreur lors du recalcul des redevances.");
      }
    } catch {
      toast.error("Impossible de joindre le serveur pour le calcul.");
    } finally {
      setRecalculating(false);
    }
  };

  const handleOpenDecision = (payout: PayoutRequestItem, type: "approve" | "reject") => {
    setTxRef(type === "approve" ? `TX-MOMO-${Date.now().toString().slice(-6)}` : "");
    setAdminNotes(type === "reject" ? "Coordonnées bancaires ou Mobile Money non valides." : "Virement validé par la direction financière.");
    setDecisionModal({ open: true, type, payout });
  };

  const handleSubmitDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!decisionModal.payout) return;

    setProcessing(true);
    const ok = await decideAdminPayout(
      decisionModal.payout.id,
      decisionModal.type,
      adminNotes,
      txRef
    );
    setProcessing(false);

    if (ok) {
      toast.success(
        decisionModal.type === "approve"
          ? "La demande de retrait a été validée et marquée comme traitée."
          : "La demande de retrait a été rejetée."
      );
      setDecisionModal({ open: false, type: "approve", payout: null });
      loadAll();
    } else {
      toast.error("Une erreur est survenue lors de l'enregistrement de la décision.");
    }
  };

  const handleOpenDetail = (royalty: AdminRoyalty) => {
    setSelectedRoyalty(royalty);
    setDetailModalOpen(true);
  };

  const handleOpenSettle = (royalty: AdminRoyalty) => {
    setSettlingRoyalty(royalty);
    setSettleTxRef(`VIR-AUTEUR-${Date.now().toString().slice(-6)}`);
    setSettleNotes("Règlement des droits d'auteur acquitté.");
    setSettleModalOpen(true);
  };

  const handleSubmitSettle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settlingRoyalty) return;

    setSettling(true);
    try {
      const res = await processRoyaltyPayout(settlingRoyalty.id, "approve", {
        transaction_reference: settleTxRef,
        admin_notes: settleNotes,
      });
      if (res.success) {
        toast.success(res.message || "Redevance auteur marquée comme réglée avec succès.");
        setSettleModalOpen(false);
        setSettlingRoyalty(null);
        if (detailModalOpen && selectedRoyalty?.id === settlingRoyalty.id) {
          setDetailModalOpen(false);
          setSelectedRoyalty(null);
        }
        await loadAll();
      } else {
        toast.error(res.error || "Erreur lors du règlement de la redevance.");
      }
    } catch {
      toast.error("Erreur de communication avec le serveur.");
    } finally {
      setSettling(false);
    }
  };

  // KPIs
  const totalAcquiredAmount = data.reduce((sum, item) => sum + (item.payout_amount || 0), 0);
  const totalPendingAmount = data
    .filter((item) => item.status === "pending")
    .reduce((sum, item) => sum + (item.payout_amount || 0), 0);
  const totalSettledAmount = data
    .filter((item) => item.status === "processed" || item.status === "settled" || item.status === "approved")
    .reduce((sum, item) => sum + (item.payout_amount || 0), 0);
  const uniqueBooksCount = new Set(data.map((item) => item.book_title).filter(Boolean)).size;

  const payoutColumns: DataTableColumn<PayoutRequestItem>[] = [
    {
      key: "author_name",
      header: "Auteur Demandeur",
      cell: (row) => (
        <div>
          <p className="font-bold text-xs text-navy">{row.author_name || "Auteur"}</p>
          {row.author_email && (
            <p className="text-[10px] text-foreground-muted font-mono">{row.author_email}</p>
          )}
        </div>
      ),
    },
    {
      key: "created_at",
      header: "Date Demande",
      cell: (row) => (
        <div>
          <p className="font-mono text-xs text-navy font-bold">{row.created_at.slice(0, 10)}</p>
          <span className="text-[10px] text-foreground-muted font-mono">ID: {row.id.slice(0, 8)}</span>
        </div>
      ),
    },
    {
      key: "amount",
      header: "Montant",
      cell: (row) => (
        <span className="font-mono text-xs font-bold text-gold">
          {row.amount.toLocaleString("fr-FR")} XOF
        </span>
      ),
    },
    {
      key: "payment_method",
      header: "Canal & Coordonnées",
      cell: (row) => (
        <div className="space-y-0.5">
          <span className="font-bold text-xs text-navy uppercase">{row.payment_method}</span>
          <p className="text-[10px] text-foreground-muted font-mono">{row.account_details}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Statut",
      cell: (row) => {
        const mapping: Record<string, { label: string; cls: string }> = {
          pending: { label: "En attente", cls: "bg-warning/10 text-warning border-warning/30" },
          processed: { label: "Traité", cls: "bg-success/10 text-success border-success/30" },
          approved: { label: "Approuvé", cls: "bg-success/10 text-success border-success/30" },
          rejected: { label: "Rejeté", cls: "bg-error/10 text-error border-error/30" },
        };
        const current = mapping[row.status] || { label: row.status, cls: "bg-navy/10 text-navy" };
        return (
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${current.cls}`}>
            {current.label}
          </span>
        );
      },
    },
    {
      key: "id",
      header: "Actions",
      cell: (row) => {
        if (row.status === "pending") {
          return (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleOpenDecision(row, "approve")}
                className="px-2.5 py-1.5 rounded-lg bg-success text-white text-[10px] font-bold hover:bg-success/90 transition-colors flex items-center gap-1 cursor-pointer min-h-[36px]"
              >
                <Check className="w-3.5 h-3.5" />
                Valider
              </button>
              <button
                type="button"
                onClick={() => handleOpenDecision(row, "reject")}
                className="px-2.5 py-1.5 rounded-lg bg-error text-white text-[10px] font-bold hover:bg-error/90 transition-colors flex items-center gap-1 cursor-pointer min-h-[36px]"
              >
                <X className="w-3.5 h-3.5" />
                Rejeter
              </button>
            </div>
          );
        }
        return (
          <span className="text-[10px] text-foreground-muted font-mono">
            {row.transaction_reference || "Traité"}
          </span>
        );
      },
    },
  ];

  const royaltyColumns: DataTableColumn<AdminRoyalty>[] = [
    {
      key: "beneficiary_name",
      header: "Auteur Bénéficiaire",
      cell: (row) => (
        <div className="space-y-0.5">
          <p className="font-bold text-xs text-navy">{row.beneficiary_name}</p>
          {row.beneficiary_email && (
            <p className="text-[10px] text-foreground-muted font-mono">{row.beneficiary_email}</p>
          )}
        </div>
      ),
    },
    {
      key: "book_title",
      header: "Ouvrage & Période",
      cell: (row) => (
        <div className="space-y-0.5">
          <p className="font-serif font-bold text-xs text-navy line-clamp-1">{row.book_title || "Ouvrage"}</p>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3 h-3 text-foreground-muted shrink-0" />
            <span className="text-[10px] text-foreground-muted font-mono">
              {formatPeriod(row.period_month)}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "total_reads",
      header: "Ventes & CA Brut",
      hideOnMobile: true,
      cell: (row) => (
        <div className="space-y-0.5">
          <span className="font-mono text-xs font-bold text-navy">
            {row.total_reads || 0} ex.
          </span>
          <p className="text-[10px] text-foreground-muted font-mono">
            {(row.total_revenue || 0).toLocaleString("fr-FR")} XOF
          </p>
        </div>
      ),
    },
    {
      key: "author_rate_percent",
      header: "Taux Auteur",
      hideOnMobile: true,
      cell: (row) => (
        <span className="font-mono text-xs font-bold text-navy bg-navy/5 px-2 py-0.5 rounded-md border border-navy/10">
          {row.author_rate_percent ?? 10}%
        </span>
      ),
    },
    {
      key: "payout_amount",
      header: "Droits Acquis",
      cell: (row) => (
        <span className="font-mono text-xs font-bold text-gold">
          {row.payout_amount.toLocaleString("fr-FR")} XOF
        </span>
      ),
    },
    {
      key: "status",
      header: "Statut",
      cell: (row) => (
        <StatusBadge status={row.status === "processed" ? "settled" : row.status} />
      ),
    },
    {
      key: "id",
      header: "Actions",
      cell: (row) => (
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => handleOpenDetail(row)}
            className="px-2.5 py-1.5 rounded-lg border border-border bg-background hover:bg-background-secondary text-navy text-[11px] font-bold transition-colors flex items-center gap-1 cursor-pointer min-h-[36px]"
            title="Consulter le détail du calcul"
          >
            <Eye className="w-3.5 h-3.5 text-navy" />
            Détails
          </button>
          {row.status === "pending" && (
            <button
              type="button"
              onClick={() => handleOpenSettle(row)}
              className="px-2.5 py-1.5 rounded-lg bg-navy text-white text-[11px] font-bold hover:bg-navy-hover transition-colors flex items-center gap-1 cursor-pointer min-h-[36px]"
              title="Marquer comme réglé"
            >
              <Check className="w-3.5 h-3.5" />
              Régler
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div>
        <Link
          href="/admin/royalties"
          className="inline-flex items-center gap-1 text-xs font-bold text-navy hover:underline mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Retour aux Redevances
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold font-serif text-navy">
              Gestion des Droits d&apos;Auteur &amp; Demandes de Retrait
            </h1>
            <p className="text-xs sm:text-sm text-foreground-muted mt-0.5">
              Consolidation globale des redevances acquises par livre et validation des demandes de versement Mobile Money/Banque.
            </p>
          </div>
          <button
            type="button"
            onClick={handleTriggerRecalc}
            disabled={recalculating || loading}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors shadow-xs disabled:opacity-50 cursor-pointer min-h-[44px]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${recalculating ? "animate-spin" : ""}`} />
            {recalculating ? "Calcul en cours..." : "Recalculer les Redevances"}
          </button>
        </div>
      </div>

      {/* Cartes KPIs Consolidation Droits Auteurs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-background border border-border shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground-muted">Total Droits Acquis</span>
            <Receipt className="w-4 h-4 text-gold" />
          </div>
          <p className="text-xl font-bold font-mono text-gold">
            {totalAcquiredAmount.toLocaleString("fr-FR")} XOF
          </p>
          <p className="text-[11px] text-foreground-muted">
            Cumul calculé sur tous les ouvrages
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-background border border-border shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground-muted">En Attente de Règlement</span>
            <Clock className="w-4 h-4 text-warning" />
          </div>
          <p className="text-xl font-bold font-mono text-warning">
            {totalPendingAmount.toLocaleString("fr-FR")} XOF
          </p>
          <p className="text-[11px] text-foreground-muted">
            Droits acquis non encore virés
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-background border border-border shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground-muted">Droits Déjà Versés</span>
            <CheckCircle2 className="w-4 h-4 text-success" />
          </div>
          <p className="text-xl font-bold font-mono text-success">
            {totalSettledAmount.toLocaleString("fr-FR")} XOF
          </p>
          <p className="text-[11px] text-foreground-muted">
            Virements acquittés avec justificatif
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-background border border-border shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground-muted">Ouvrages Générateurs</span>
            <BookOpen className="w-4 h-4 text-navy" />
          </div>
          <p className="text-xl font-bold font-mono text-navy">
            {uniqueBooksCount}
          </p>
          <p className="text-[11px] text-foreground-muted">
            Livres ayant généré des droits
          </p>
        </div>
      </div>

      {/* Section 1 : Demandes de Retrait en Attente de Validation */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-gold" />
            <h2 className="font-serif font-bold text-navy text-base">
              Demandes de Versement Auteurs ({payoutRequests.length})
            </h2>
          </div>
          <span className="text-xs font-bold text-warning bg-warning/10 px-3 py-1 rounded-full border border-warning/20">
            {payoutRequests.filter((r) => r.status === "pending").length} en attente
          </span>
        </div>

        <div className="rounded-3xl bg-background border border-border shadow-xs overflow-hidden">
          <DataTable
            data={payoutRequests}
            columns={payoutColumns}
            rowKey="id"
            loading={loading}
            emptyState={
              <div className="p-8 text-center text-xs text-foreground-muted">
                Aucune demande de retrait enregistrée pour le moment.
              </div>
            }
          />
        </div>
      </div>

      {/* Section 2 : Consolidation Globale des Droits Auteurs par Ouvrage */}
      <div className="space-y-4 pt-4 border-t border-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="font-serif font-bold text-navy text-base">
              Consolidation des Droits Acquis par Ouvrage
            </h2>
            <p className="text-xs text-foreground-muted">
              Redevances effectives calculées selon les contrats d&apos;édition et le barème légal.
            </p>
          </div>
          <span className="text-xs font-bold text-navy bg-navy/5 px-3 py-1 rounded-full border border-navy/10 self-start sm:self-auto">
            {data.length} ligne{data.length > 1 ? "s" : ""} de calcul
          </span>
        </div>

        <div className="rounded-3xl bg-background border border-border shadow-xs overflow-hidden">
          <DataTable
            data={data}
            columns={royaltyColumns}
            rowKey="id"
            loading={loading}
            emptyState={
              <div className="p-10 text-center space-y-3">
                <FileText className="w-8 h-8 text-foreground-muted mx-auto" />
                <p className="text-xs font-bold text-navy">
                  Aucune ligne de redevance auteur calculée pour le moment.
                </p>
                <p className="text-xs text-foreground-muted max-w-md mx-auto">
                  Cliquez sur &quot;Recalculer les Redevances&quot; ci-dessus pour agréger les ventes récentes et consolider les droits acquis.
                </p>
                <button
                  type="button"
                  onClick={handleTriggerRecalc}
                  disabled={recalculating}
                  className="px-4 py-2 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors min-h-[44px] cursor-pointer"
                >
                  {recalculating ? "Calcul..." : "Lancer le calcul maintenant"}
                </button>
              </div>
            }
          />
        </div>
      </div>

      {/* Modale de Détails d'une Ligne de Redevance */}
      {detailModalOpen && selectedRoyalty && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-background border border-border rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2.5">
                <Receipt className="w-5 h-5 text-gold" />
                <div>
                  <h3 className="font-serif font-bold text-navy text-base">
                    Détails de la Redevance Auteur
                  </h3>
                  <p className="text-[11px] text-foreground-muted">
                    Récapitulatif contractuel et décomposition comptable
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setDetailModalOpen(false);
                  setSelectedRoyalty(null);
                }}
                className="p-1.5 rounded-lg text-foreground-muted hover:text-navy cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-background-secondary border border-border space-y-2.5">
                <div className="flex justify-between items-start pb-2 border-b border-border">
                  <span className="text-foreground-muted">Ouvrage :</span>
                  <strong className="text-navy font-serif text-right max-w-[65%]">
                    {selectedRoyalty.book_title || "Non spécifié"}
                  </strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-foreground-muted">Auteur Bénéficiaire :</span>
                  <strong className="text-navy">{selectedRoyalty.beneficiary_name}</strong>
                </div>
                {selectedRoyalty.beneficiary_email && (
                  <div className="flex justify-between items-center">
                    <span className="text-foreground-muted">Email Auteur :</span>
                    <span className="font-mono text-navy">{selectedRoyalty.beneficiary_email}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-foreground-muted">Période d&apos;activité :</span>
                  <span className="font-mono font-bold text-navy">
                    {formatPeriod(selectedRoyalty.period_month)}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-background-secondary border border-border space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-foreground-muted">Ventes &amp; Consultations :</span>
                  <span className="font-mono font-bold text-navy">
                    {selectedRoyalty.total_reads || 0} exemplaires
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-foreground-muted">Chiffre d&apos;Affaires Brut (HT) :</span>
                  <span className="font-mono font-bold text-navy">
                    {(selectedRoyalty.total_revenue || 0).toLocaleString("fr-FR")} XOF
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-foreground-muted">Taux Contractuel Appliqué :</span>
                  <span className="font-mono font-bold text-gold">
                    {selectedRoyalty.author_rate_percent ?? 10}%
                  </span>
                </div>
                <div className="pt-2 border-t border-border flex justify-between items-center">
                  <span className="font-bold text-navy">Redevance Nette Acquise :</span>
                  <strong className="font-mono text-base font-bold text-gold">
                    {selectedRoyalty.payout_amount.toLocaleString("fr-FR")} XOF
                  </strong>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-background">
                <span className="text-foreground-muted">Statut comptable :</span>
                <StatusBadge status={selectedRoyalty.status === "processed" ? "settled" : selectedRoyalty.status} />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => {
                  setDetailModalOpen(false);
                  setSelectedRoyalty(null);
                }}
                className="px-4 py-2.5 rounded-xl border border-border text-foreground hover:bg-background-secondary min-h-[44px] cursor-pointer"
              >
                Fermer
              </button>
              {selectedRoyalty.status === "pending" && (
                <button
                  type="button"
                  onClick={() => {
                    handleOpenSettle(selectedRoyalty);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-navy text-white font-bold hover:bg-navy-hover min-h-[44px] shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Régler cette Redevance
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modale de Règlement Direct d'une Redevance Auteur */}
      {settleModalOpen && settlingRoyalty && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-background border border-border rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-success" />
                <h3 className="font-serif font-bold text-navy text-base">
                  Régler la Redevance Auteur
                </h3>
              </div>
              <button
                onClick={() => {
                  setSettleModalOpen(false);
                  setSettlingRoyalty(null);
                }}
                className="p-1.5 rounded-lg text-foreground-muted hover:text-navy cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-background-secondary border border-border space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-foreground-muted">Auteur :</span>
                <strong className="text-navy">{settlingRoyalty.beneficiary_name}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground-muted">Ouvrage :</span>
                <span className="font-serif text-navy font-bold">{settlingRoyalty.book_title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground-muted">Montant à régler :</span>
                <strong className="font-mono text-gold font-bold">
                  {settlingRoyalty.payout_amount.toLocaleString("fr-FR")} XOF
                </strong>
              </div>
            </div>

            <form onSubmit={handleSubmitSettle} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-navy mb-1.5">
                  Référence de Transaction Bancaire / Mobile Money
                </label>
                <input
                  type="text"
                  value={settleTxRef}
                  onChange={(e) => setSettleTxRef(e.target.value)}
                  placeholder="Ex: VIR-MOMO-293810"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground font-mono focus:ring-2 focus:ring-navy min-h-[44px]"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-navy mb-1.5">
                  Notes Internes &amp; Justificatif
                </label>
                <textarea
                  rows={3}
                  value={settleNotes}
                  onChange={(e) => setSettleNotes(e.target.value)}
                  className="w-full p-3 rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-navy"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => {
                    setSettleModalOpen(false);
                    setSettlingRoyalty(null);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-border text-foreground hover:bg-background-secondary min-h-[44px] cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={settling}
                  className="px-5 py-2.5 rounded-xl bg-success text-white font-bold hover:bg-success/90 min-h-[44px] shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {settling ? "Traitement..." : "Confirmer le Règlement"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modale de Validation / Rejet Retrait Explicite (Demandes Mobile Money / Banque) */}
      {decisionModal.open && decisionModal.payout && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-background border border-border rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                {decisionModal.type === "approve" ? (
                  <CheckCircle2 className="w-5 h-5 text-success" />
                ) : (
                  <XCircle className="w-5 h-5 text-error" />
                )}
                <h3 className="font-serif font-bold text-navy text-base">
                  {decisionModal.type === "approve" ? "Valider le Retrait" : "Rejeter le Retrait"}
                </h3>
              </div>
              <button
                onClick={() => setDecisionModal({ open: false, type: "approve", payout: null })}
                className="p-1.5 rounded-lg text-foreground-muted hover:text-navy cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-background-secondary border border-border space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-foreground-muted">Auteur :</span>
                <strong className="text-navy">{decisionModal.payout.author_name || "Auteur"}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground-muted">Montant :</span>
                <strong className="font-mono text-gold font-bold">
                  {decisionModal.payout.amount.toLocaleString("fr-FR")} XOF
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground-muted">Canal :</span>
                <strong className="text-navy uppercase font-bold">
                  {decisionModal.payout.payment_method}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground-muted">Compte :</span>
                <span className="font-mono text-navy font-bold">
                  {decisionModal.payout.account_details}
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmitDecision} className="space-y-4 text-xs">
              {decisionModal.type === "approve" ? (
                <div>
                  <label className="block font-bold text-navy mb-1.5">
                    Référence de Transaction Bancaire / Mobile Money
                  </label>
                  <input
                    type="text"
                    value={txRef}
                    onChange={(e) => setTxRef(e.target.value)}
                    placeholder="Ex: TX-MOMO-948291"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground font-mono focus:ring-2 focus:ring-navy min-h-[44px]"
                    required
                  />
                </div>
              ) : null}

              <div>
                <label className="block font-bold text-navy mb-1.5">
                  {decisionModal.type === "approve" ? "Notes Internes" : "Motif du Rejet"}
                </label>
                <textarea
                  rows={3}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full p-3 rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-navy"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setDecisionModal({ open: false, type: "approve", payout: null })}
                  className="px-4 py-2.5 rounded-xl border border-border text-foreground hover:bg-background-secondary min-h-[44px] cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className={`px-5 py-2.5 rounded-xl text-white font-bold min-h-[44px] shadow-sm disabled:opacity-50 cursor-pointer ${
                    decisionModal.type === "approve"
                      ? "bg-success hover:bg-success/90"
                      : "bg-error hover:bg-error/90"
                  }`}
                >
                  {processing ? "Traitement..." : decisionModal.type === "approve" ? "Confirmer le Virement" : "Confirmer le Rejet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
