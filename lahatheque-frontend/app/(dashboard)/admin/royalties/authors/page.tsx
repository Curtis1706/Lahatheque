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
  Building2, 
  Smartphone,
  Check,
  X
} from "lucide-react";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { getAdminRoyalties } from "@/lib/services/admin";
import { getPayoutRequests, decideAdminPayout, type PayoutRequestItem } from "@/lib/services/author";
import { AdminRoyalty } from "@/lib/types/admin";
import { StatusBadge } from "@/components/ui/status-badge";
import { toast } from "sonner";

export default function AdminAuthorRoyaltiesPage() {
  const [data, setData] = useState<AdminRoyalty[]>([]);
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modale de Décision
  const [decisionModal, setDecisionModal] = useState<{
    open: boolean;
    type: "approve" | "reject";
    payout: PayoutRequestItem | null;
  }>({ open: false, type: "approve", payout: null });
  
  const [txRef, setTxRef] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    const [royalties, reqs] = await Promise.all([
      getAdminRoyalties(),
      getPayoutRequests(),
    ]);
    setData(royalties.filter((i) => i.beneficiary_type === "author"));
    setPayoutRequests(reqs);
    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

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

  const payoutColumns: DataTableColumn<PayoutRequestItem>[] = [
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
                className="px-2.5 py-1.5 rounded-lg bg-success text-white text-[10px] font-bold hover:bg-success/90 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Check className="w-3 h-3" />
                Valider
              </button>
              <button
                type="button"
                onClick={() => handleOpenDecision(row, "reject")}
                className="px-2.5 py-1.5 rounded-lg bg-error text-white text-[10px] font-bold hover:bg-error/90 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3 h-3" />
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
        <div>
          <p className="font-bold text-xs text-navy">{row.beneficiary_name}</p>
          <p className="text-[11px] text-foreground-muted">{row.book_title}</p>
        </div>
      ),
    },
    {
      key: "payout_amount",
      header: "Droits d'Auteur Acquis",
      cell: (row) => (
        <span className="font-mono text-xs font-bold text-gold">
          {row.payout_amount.toLocaleString("fr-FR")} XOF
        </span>
      ),
    },
    {
      key: "status",
      header: "Statut",
      cell: (row) => <StatusBadge status={row.status} />,
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
        <div className="pb-4 border-b border-border">
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-navy">
            Gestion des Droits d&apos;Auteur &amp; Demandes de Retrait
          </h1>
          <p className="text-xs sm:text-sm text-foreground-muted mt-0.5">
            Validation des demandes de versement Mobile Money/Banque et consolidation globale des droits acquis.
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
                Aucune demande de retrait enregistrée.
              </div>
            }
          />
        </div>
      </div>

      {/* Section 2 : Consolidation Globale des Droits Auteurs */}
      <div className="space-y-4 pt-4 border-t border-border">
        <h2 className="font-serif font-bold text-navy text-base">
          Consolidation des Droits Acquis par Ouvrage
        </h2>
        <div className="rounded-3xl bg-background border border-border shadow-xs overflow-hidden">
          <DataTable
            data={data}
            columns={royaltyColumns}
            rowKey="id"
            loading={loading}
          />
        </div>
      </div>

      {/* Modale de Validation / Rejet Admin */}
      {decisionModal.open && decisionModal.payout && (
        <div className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-sm flex items-center justify-center p-4">
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
                className="p-1.5 rounded-lg text-foreground-muted hover:text-navy cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-background-secondary border border-border space-y-1.5 text-xs">
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
