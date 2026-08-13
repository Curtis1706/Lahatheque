"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { DollarSign, ArrowLeft, Download, ShieldCheck, Sparkles, FileText } from "lucide-react";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { getAuthorRoyaltyPayments } from "@/lib/services/author";
import type { AuthorRoyaltyPayment } from "@/lib/types/author";

export default function AuthorRoyaltiesPage() {
  const [payments, setPayments] = useState<AuthorRoyaltyPayment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await getAuthorRoyaltyPayments();
      setPayments(data);
      setLoading(false);
    }
    loadData();
  }, []);

  const totalPaid = payments
    .filter((p) => p.status === "paid")
    .reduce((acc, p) => acc + p.author_earned_amount, 0);

  const totalPending = payments
    .filter((p) => p.status === "pending")
    .reduce((acc, p) => acc + p.author_earned_amount, 0);

  const columns: DataTableColumn<AuthorRoyaltyPayment>[] = [
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
        <a
          href={row.receipt_url}
          target="_blank"
          rel="noreferrer"
          className="px-3 py-1.5 rounded-xl bg-navy text-white text-[10px] font-bold hover:bg-navy-hover transition-colors whitespace-nowrap min-h-[36px] inline-flex items-center gap-1"
        >
          <Download className="w-3.5 h-3.5 text-gold" />
          Relevé PDF
        </a>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 max-w-7xl mx-auto">
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
          <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
            <DollarSign className="w-4 h-4 text-gold" />
            Suivi Autonome des Droits d&apos;Auteur (Section 12 Cahier v3.2)
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Droits d&apos;Auteur &amp; Paiements Rétribués
          </h1>
          <p className="text-xs text-foreground-muted mt-1">
            Consultez le cumul de vos droits d&apos;auteur rétribués, vos versements effectués et téléchargez vos relevés officiels.
          </p>
        </div>
      </div>

      {/* Règle d'Étanchéité des Droits en Co-Auteur */}
      <div className="p-4 rounded-2xl bg-gold/10 border border-gold/30 text-xs text-navy space-y-1">
        <p className="font-bold flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-gold" />
          Règle d&apos;Étanchéité des Droits Individuels :
        </p>
        <p className="text-foreground-muted leading-relaxed">
          Pour les ouvrages écrits en co-paternité, ce tableau de bord affiche **strictement votre part propre de droits** d&apos;auteur rétribués selon les pourcentages enregistrés au contrat. Les montants des co-auteurs ne sont pas exposés.
        </p>
      </div>

      {/* Cartes Kpi de Solde */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-6 rounded-3xl bg-navy text-white border border-navy-hover shadow-xs space-y-1">
          <span className="text-[10px] text-gold uppercase font-bold tracking-wider block">Total Versé (Rétribution Perçue)</span>
          <p className="font-mono font-bold text-2xl text-white">{totalPaid.toLocaleString("fr-FR")} XOF</p>
        </div>

        <div className="p-6 rounded-3xl bg-background border border-border shadow-xs space-y-1">
          <span className="text-[10px] text-foreground-muted uppercase font-bold tracking-wider block">Prochain Versement (En cours Q3)</span>
          <p className="font-mono font-bold text-2xl text-gold">{totalPending.toLocaleString("fr-FR")} XOF</p>
        </div>
      </div>

      {/* Tableau des Versements */}
      <div className="space-y-4">
        <h3 className="font-serif font-bold text-navy text-base">
          Historique des Relevés de Droits &amp; Versements ({payments.length})
        </h3>

        <DataTable
          data={payments}
          columns={columns}
          rowKey="id"
          loading={loading}
          emptyMessage="Aucun versement de droits enregistré pour le moment."
          pageSize={10}
        />
      </div>
    </div>
  );
}
