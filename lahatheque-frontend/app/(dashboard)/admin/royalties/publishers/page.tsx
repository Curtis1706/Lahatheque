"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  DollarSign,
  Building2,
  CreditCard,
  Edit3,
  X,
} from "lucide-react";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Modal } from "@/components/ui/modal";
import {
  getAdminRoyalties,
  processRoyaltyPayout,
} from "@/lib/services/admin";
import { AdminRoyalty } from "@/lib/types/admin";
import { toast } from "sonner";

export default function AdminPublisherRoyaltiesPage() {
  const [data, setData] = useState<AdminRoyalty[]>([]);
  const [loading, setLoading] = useState(true);

  // Modale de validation / rejet de versement éditeur
  const [payoutToProcess, setPayoutToProcess] = useState<AdminRoyalty | null>(null);
  const [payoutAction, setPayoutAction] = useState<"approve" | "reject">("approve");
  const [txRef, setTxRef] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const items = await getAdminRoyalties("publisher");
      setData(items);
    } catch {
      toast.error("Erreur de chargement des redevances éditeurs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenProcess = (item: AdminRoyalty, action: "approve" | "reject") => {
    setPayoutToProcess(item);
    setPayoutAction(action);
    setTxRef(action === "approve" ? `VIR-PUB-${Date.now().toString().slice(-6)}` : "");
    setAdminNotes(action === "reject" ? "Relevé incomplet." : "Versement validé.");
  };

  const handleSubmitProcess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payoutToProcess) return;
    setProcessing(true);
    try {
      const res = await processRoyaltyPayout(payoutToProcess.id, payoutAction, {
        transaction_reference: txRef,
        admin_notes: adminNotes,
      });
      if (res.success) {
        toast.success(res.message || "Versement éditeur traité.");
        setData((prev) =>
          prev.map((r) =>
            r.id === payoutToProcess.id
              ? {
                  ...r,
                  status: payoutAction === "approve" ? "settled" : "on_hold",
                  transaction_reference: txRef,
                }
              : r
          )
        );
        setPayoutToProcess(null);
      } else {
        toast.error(res.error || "Erreur de traitement.");
      }
    } catch {
      toast.error("Erreur serveur.");
    } finally {
      setProcessing(false);
    }
  };

  const totalDues = data.reduce((acc, r) => acc + r.payout_amount, 0);
  const settledDues = data
    .filter((r) => r.status === "settled")
    .reduce((acc, r) => acc + r.payout_amount, 0);

  const columns: DataTableColumn<AdminRoyalty>[] = [
    {
      key: "beneficiary_name",
      header: "Maison d'Édition & Contact",
      cell: (row) => (
        <div>
          <p className="font-semibold text-xs text-foreground">{row.beneficiary_name}</p>
          <p className="text-[11px] text-foreground-muted">{row.beneficiary_email || "contact@partenaire.bj"}</p>
        </div>
      ),
    },
    {
      key: "book_title",
      header: "Ouvrage / Titre",
      cell: (row) => (
        <span className="text-xs text-foreground font-medium truncate max-w-[200px] block">
          {row.book_title || "Ventes globales éditeur"}
        </span>
      ),
    },
    {
      key: "publisher_rate_percent",
      header: "Taux Contractuel",
      cell: (row) => (
        <span className="text-xs font-mono font-bold text-navy px-2 py-0.5 rounded-md bg-navy-light">
          {row.publisher_rate_percent || 22.0}%
        </span>
      ),
    },
    {
      key: "payout_amount",
      header: "Redevance Calculée",
      cell: (row) => (
        <span className="font-mono text-xs font-bold text-navy">
          {row.payout_amount.toLocaleString("fr-FR")} XOF
        </span>
      ),
    },
    {
      key: "status",
      header: "Statut",
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "actions",
      header: "Action",
      className: "text-right",
      cell: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          {row.status !== "settled" ? (
            <>
              <button
                onClick={() => handleOpenProcess(row, "approve")}
                className="px-2.5 py-1 rounded-lg bg-navy text-white text-xs font-semibold hover:bg-navy-hover transition-colors flex items-center gap-1"
                title="Valider le virement"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-gold" /> Valider
              </button>
              <button
                onClick={() => handleOpenProcess(row, "reject")}
                className="px-2.5 py-1 rounded-lg bg-error/10 text-error text-xs font-semibold hover:bg-error/20 transition-colors"
                title="Rejeter"
              >
                Rejeter
              </button>
            </>
          ) : (
            <span className="text-[11px] font-mono text-success font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Réglé
            </span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <Link
          href="/admin/royalties"
          className="inline-flex items-center gap-1 text-xs font-medium text-gold hover:text-gold-dark mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Retour au Hub Redevances
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold font-serif text-navy">
              Redevances des Maisons d'Édition Partenaires
            </h1>
            <p className="text-xs sm:text-sm text-foreground-muted mt-0.5">
              Suivi des reversements aux maisons d'édition partenaires selon les taux négociés par mandat d'édition.
            </p>
          </div>
        </div>
      </div>

      {/* Cartes de Synthèse */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-background-secondary border border-border space-y-1 shadow-xs">
          <p className="text-xs font-medium text-foreground-muted">Total Redevances Éditeurs Générées</p>
          <p className="text-xl font-bold text-navy font-mono">
            {totalDues.toLocaleString("fr-FR")} XOF
          </p>
        </div>
        <div className="p-4 rounded-2xl bg-background-secondary border border-border space-y-1 shadow-xs">
          <p className="text-xs font-medium text-foreground-muted">Versements Réglés & Clôturés</p>
          <p className="text-xl font-bold text-success font-mono">
            {settledDues.toLocaleString("fr-FR")} XOF
          </p>
        </div>
      </div>

      <DataTable
        data={data}
        columns={columns}
        rowKey="id"
        loading={loading}
        emptyMessage="Aucune redevance éditeur enregistrée."
      />

      {/* Modale de Traitement */}
      {payoutToProcess && (
        <Modal
          open={!!payoutToProcess}
          onClose={() => setPayoutToProcess(null)}
          title={
            payoutAction === "approve"
              ? `Valider le versement de ${payoutToProcess.payout_amount.toLocaleString("fr-FR")} XOF`
              : `Rejeter la demande de ${payoutToProcess.beneficiary_name}`
          }
        >
          <form onSubmit={handleSubmitProcess} className="space-y-4 pt-2">
            <div className="p-3 rounded-xl bg-background-secondary border border-border space-y-1 text-xs">
              <p><strong className="text-foreground">Éditeur :</strong> {payoutToProcess.beneficiary_name}</p>
              <p><strong className="text-foreground">Coordonnées :</strong> {payoutToProcess.account_details || "Compte BOA Bénin"}</p>
            </div>

            {payoutAction === "approve" && (
              <div>
                <label className="text-xs font-semibold text-foreground">
                  Référence de Transaction Bancaire / Mobile Money
                </label>
                <input
                  type="text"
                  value={txRef}
                  onChange={(e) => setTxRef(e.target.value)}
                  className="w-full mt-1.5 p-2.5 text-xs font-mono rounded-xl bg-background border border-border text-foreground focus:border-gold focus:outline-none"
                  required
                />
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-foreground">
                Notes & Remarques
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
                className="w-full mt-1.5 p-2.5 text-xs rounded-xl bg-background border border-border text-foreground focus:border-gold focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setPayoutToProcess(null)}
                className="px-4 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-background-secondary text-foreground"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={processing}
                className={`px-4 py-2 rounded-xl text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm ${
                  payoutAction === "approve" ? "bg-navy hover:bg-navy-hover" : "bg-error hover:bg-error-hover"
                }`}
              >
                {payoutAction === "approve" ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-gold" />
                    {processing ? "Validation..." : "Valider le Virement"}
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4" />
                    {processing ? "Rejet..." : "Confirmer le Rejet"}
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
