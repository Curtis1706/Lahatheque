"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  CreditCard, 
  ArrowLeft, 
  Download, 
  FileText, 
  CheckCircle2, 
  Clock, 
  History,
  AlertCircle
} from "lucide-react";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { AuthorPayoutModal } from "@/components/features/author/author-payout-modal";
import { 
  getAuthorRoyaltyPayments, 
  getPayoutRequests,
  type PayoutRequestItem
} from "@/lib/services/author";
import type { AuthorRoyaltyPayment } from "@/lib/types/author";
import { toast } from "sonner";
import { generateOfficialPdf } from "@/lib/services/export-service";

export default function AuthorRoyaltiesPage() {
  const [activeTab, setActiveTab] = useState<"statements" | "requests">("statements");
  const [payments, setPayments] = useState<AuthorRoyaltyPayment[]>([]);
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [payoutModalOpen, setPayoutModalOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const [stmts, reqs] = await Promise.all([
      getAuthorRoyaltyPayments(),
      getPayoutRequests(),
    ]);
    setPayments(stmts);
    setPayoutRequests(reqs);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalPaid = payments
    .filter((p) => p.status === "paid")
    .reduce((acc, p) => acc + p.author_earned_amount, 0);

  const totalPending = payments
    .filter((p) => p.status === "pending")
    .reduce((acc, p) => acc + p.author_earned_amount, 0);

  const statementColumns: DataTableColumn<AuthorRoyaltyPayment>[] = [
    {
      key: "period",
      header: "Période Concernée",
      cell: (row) => (
        <div>
          <p className="font-serif font-bold text-xs text-navy leading-snug">{row.period}</p>
          <span className="text-[10px] text-foreground-muted font-mono">Date versement : {row.payment_date}</span>
        </div>
      ),
    },
    {
      key: "total_sales_count",
      header: "Ventes Période",
      cell: (row) => (
        <span className="font-mono text-xs font-bold text-navy">
          {row.total_sales_count.toLocaleString("fr-FR")} ventes
        </span>
      ),
    },
    {
      key: "gross_revenue",
      header: "Revenus Générés",
      cell: (row) => (
        <span className="font-mono text-xs text-foreground-muted">
          {row.gross_revenue.toLocaleString("fr-FR")} XOF
        </span>
      ),
    },
    {
      key: "author_earned_amount",
      header: "Part Propre Auteur (15%)",
      cell: (row) => (
        <span className="font-mono font-bold text-gold text-xs">
          {row.author_earned_amount.toLocaleString("fr-FR")} XOF
        </span>
      ),
    },
    {
      key: "status",
      header: "Statut",
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "receipt_url",
      header: "Relevé",
      cell: (row) => (
        <button
          type="button"
          onClick={async () => {
            try {
              await generateOfficialPdf({
                docType: "BORDEREAU_REDEVANCES",
                docNumber: `REL-AUTEUR-${row.id.slice(0, 8).toUpperCase()}`,
                date: row.payment_date || new Date().toLocaleDateString("fr-FR"),
                period: row.period,
                recipient: {
                  name: "Auteur / Créateur d'Ouvrage",
                  roleOrTitle: "Titulaire de Droits d'Auteur LAHAThèque",
                  addressOrCampus: "Compte Auteur Agréé",
                  emailOrPhone: "auteur@lahatheque.bj",
                },
                summaryCards: [
                  { label: "Période Décomptée", value: row.period },
                  { label: "Ventes Période", value: `${row.total_sales_count.toLocaleString("fr-FR")} exemplaires` },
                  { label: "Quote-part Auteur", value: "15 % (Droits)" },
                  { label: "Statut Règlement", value: row.status.toUpperCase() },
                ],
                tableHeaders: ["Période", "Volume Ventes", "Revenus Bruts (HT)", "Quote-part Auteur (15%)", "Statut"],
                tableRows: [
                  [
                    row.period,
                    `${row.total_sales_count.toLocaleString("fr-FR")} ex.`,
                    `${row.gross_revenue.toLocaleString("fr-FR")} XOF`,
                    `${row.author_earned_amount.toLocaleString("fr-FR")} XOF`,
                    row.status === "paid" ? "Payé" : "En cours",
                  ],
                ],
                totalAmount: `${row.author_earned_amount.toLocaleString("fr-FR")} XOF`,
                totalNotes: "Bordereau de redevances et droits d'auteur certifié par LAHAThèque Éditions & Numérique S.A. Conforme au barème officiel de rétribution.",
                filename: `releve_droits_auteur_${row.period.replace(/\s+/g, "_")}.pdf`,
              });
              toast.success("Bordereau officiel de redevances PDF téléchargé !");
            } catch {
              toast.error("Erreur lors de la génération du relevé PDF.");
            }
          }}
          className="px-3 py-1.5 rounded-xl bg-navy text-white text-[10px] font-bold hover:bg-navy-hover transition-colors whitespace-nowrap min-h-[36px] inline-flex items-center gap-1 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-gold" />
          Relevé PDF
        </button>
      ),
    },
  ];

  const requestColumns: DataTableColumn<PayoutRequestItem>[] = [
    {
      key: "created_at",
      header: "Date de la Demande",
      cell: (row) => (
        <div>
          <p className="font-mono text-xs text-navy font-bold">{row.created_at.slice(0, 10)}</p>
          <span className="text-[10px] text-foreground-muted font-mono">Réf: {row.id.slice(0, 8)}</span>
        </div>
      ),
    },
    {
      key: "amount",
      header: "Montant Demandé",
      cell: (row) => (
        <span className="font-mono font-bold text-gold text-xs">
          {row.amount.toLocaleString("fr-FR")} XOF
        </span>
      ),
    },
    {
      key: "payment_method",
      header: "Mode de Règlement",
      cell: (row) => (
        <div>
          <span className="font-bold text-xs text-navy uppercase">{row.payment_method}</span>
          <p className="text-[10px] text-foreground-muted font-mono truncate max-w-[150px]">{row.account_details}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Statut Traitement",
      cell: (row) => {
        const mapping: Record<string, { label: string; cls: string }> = {
          pending: { label: "En attente", cls: "bg-warning/10 text-warning border-warning/30" },
          processed: { label: "Traité / Viré", cls: "bg-success/10 text-success border-success/30" },
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
      key: "transaction_reference",
      header: "Référence Transaction / Note",
      cell: (row) => (
        <div className="space-y-0.5">
          {row.transaction_reference && (
            <p className="font-mono text-[10px] text-navy font-bold">{row.transaction_reference}</p>
          )}
          {row.admin_notes && (
            <p className="text-[10px] text-foreground-muted italic">{row.admin_notes}</p>
          )}
          {!row.transaction_reference && !row.admin_notes && (
            <span className="text-[10px] text-foreground-muted font-mono">-</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/author" className="hover:text-navy">Vue d&apos;ensemble</Link>
        <span>/</span>
        <span className="text-navy font-semibold">Droits &amp; Paiements</span>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/author" className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Vue d&apos;ensemble
          </Link>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Relevés de Redevances &amp; Droits d&apos;Auteur
          </h1>
          <p className="text-xs text-foreground-muted mt-0.5">
            Suivi des ventes, ventilation des quotes-parts et gestion des demandes de versement direct.
          </p>
        </div>

        <button
          onClick={() => setPayoutModalOpen(true)}
          className="px-5 py-2.5 rounded-xl bg-gold text-navy font-bold text-xs hover:bg-gold-light transition-all flex items-center gap-2 shadow-sm min-h-[44px] cursor-pointer"
        >
          <CreditCard className="w-4 h-4" />
          Demander un Versement
        </button>
      </div>

      {/* 2 Cartes de Synthèse Financière */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-3xl bg-background-secondary border border-border space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground-muted uppercase tracking-wider">
              Solde en Attente de Versement
            </span>
            <Clock className="w-4 h-4 text-gold" />
          </div>
          <p className="font-mono text-2xl sm:text-3xl font-bold text-navy">
            {totalPending.toLocaleString("fr-FR")} XOF
          </p>
          <p className="text-[11px] text-foreground-muted">
            Prochain règlement automatique programmé le 05 du mois
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-background-secondary border border-border space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground-muted uppercase tracking-wider">
              Total Rétribué à ce Jour
            </span>
            <CheckCircle2 className="w-4 h-4 text-success" />
          </div>
          <p className="font-mono text-2xl sm:text-3xl font-bold text-success">
            {totalPaid.toLocaleString("fr-FR")} XOF
          </p>
          <p className="text-[11px] text-foreground-muted">
            Relevés certifiés et justifiés par les ventes de la plateforme
          </p>
        </div>
      </div>

      {/* Onglets Relevés Périodiques vs Demandes de Retrait */}
      <div className="flex items-center gap-2 border-b border-border">
        <button
          type="button"
          onClick={() => setActiveTab("statements")}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === "statements"
              ? "border-gold text-navy font-bold"
              : "border-transparent text-foreground-muted hover:text-navy"
          }`}
        >
          <FileText className="w-4 h-4 text-gold" />
          Relevés Périodiques ({payments.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("requests")}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === "requests"
              ? "border-gold text-navy font-bold"
              : "border-transparent text-foreground-muted hover:text-navy"
          }`}
        >
          <History className="w-4 h-4 text-gold" />
          Demandes de Retrait &amp; Virement ({payoutRequests.length})
        </button>
      </div>

      {/* Contenu de l'onglet actif */}
      {activeTab === "statements" ? (
        <div className="rounded-3xl bg-background border border-border shadow-xs overflow-hidden">
          <DataTable
            rowKey="id"
            columns={statementColumns}
            data={payments}
            loading={loading}
            emptyState={
              <div className="p-12 text-center space-y-2">
                <FileText className="w-8 h-8 text-foreground-muted mx-auto" />
                <p className="text-sm font-bold text-navy">Aucun relevé disponible</p>
                <p className="text-xs text-foreground-muted">
                  Vos relevés de droits d&apos;auteur apparaîtront dès la première période de publication.
                </p>
              </div>
            }
          />
        </div>
      ) : (
        <div className="rounded-3xl bg-background border border-border shadow-xs overflow-hidden">
          <DataTable
            rowKey="id"
            columns={requestColumns}
            data={payoutRequests}
            loading={loading}
            emptyState={
              <div className="p-12 text-center space-y-2">
                <History className="w-8 h-8 text-foreground-muted mx-auto" />
                <p className="text-sm font-bold text-navy">Aucune demande de retrait émise</p>
                <p className="text-xs text-foreground-muted">
                  Cliquez sur &ldquo;Demander un Versement&rdquo; pour initier un retrait vers votre compte MoMo ou Banque.
                </p>
              </div>
            }
          />
        </div>
      )}

      {/* 21st.dev Component AuthorPayoutModal */}
      <AuthorPayoutModal
        isOpen={payoutModalOpen}
        onClose={() => setPayoutModalOpen(false)}
        maxAmount={totalPending}
        onSuccess={loadData}
      />
    </div>
  );
}
