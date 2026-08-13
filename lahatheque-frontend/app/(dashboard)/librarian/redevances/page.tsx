"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { DollarSign, ArrowLeft, Percent, Download, FileText, CheckCircle2, ShieldCheck, Lock } from "lucide-react";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { getUniversityRoyaltyPayments, getUniversityKpis } from "@/lib/services/librarian";
import type { UniversityRoyaltyPayment, UniversityKpis } from "@/lib/types/librarian";

export default function UniversityRedevancesPage() {
  const [payments, setPayments] = useState<UniversityRoyaltyPayment[]>([]);
  const [kpis, setKpis] = useState<UniversityKpis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [pData, kData] = await Promise.all([
        getUniversityRoyaltyPayments(),
        getUniversityKpis(),
      ]);
      setPayments(pData);
      setKpis(kData);
      setLoading(false);
    }
    loadData();
  }, []);

  const columns: DataTableColumn<UniversityRoyaltyPayment>[] = [
    {
      key: "period",
      header: "Période du Relevé",
      cell: (row) => (
        <div>
          <p className="font-serif font-bold text-xs text-navy leading-snug">{row.period}</p>
          <p className="text-[10px] text-foreground-muted font-mono">Réf Relevé: {row.id}</p>
        </div>
      ),
    },
    {
      key: "total_sales_generated",
      header: "Revenus Ventes Brutes",
      cell: (row) => (
        <span className="font-mono text-xs text-foreground font-semibold">
          {row.total_sales_generated.toLocaleString("fr-FR")} XOF
        </span>
      ),
    },
    {
      key: "royalty_rate_percentage",
      header: "Taux Fixe",
      cell: (row) => (
        <span className="font-mono font-bold text-gold text-xs px-2 py-0.5 rounded bg-gold/15 border border-gold/30">
          15 % fixe
        </span>
      ),
    },
    {
      key: "royalty_amount_due",
      header: "Redevance Dûe (15%)",
      cell: (row) => (
        <span className="font-mono font-bold text-navy text-xs">
          {row.royalty_amount_due.toLocaleString("fr-FR")} XOF
        </span>
      ),
    },
    {
      key: "paid_amount",
      header: "Montant Versé",
      cell: (row) => (
        <span className="font-mono font-bold text-emerald-600 text-xs">
          {row.paid_amount.toLocaleString("fr-FR")} XOF
        </span>
      ),
    },
    {
      key: "remaining_balance",
      header: "Solde Restant",
      cell: (row) => (
        <span
          className={`font-mono font-bold text-xs ${
            row.remaining_balance > 0 ? "text-amber-600" : "text-foreground-muted"
          }`}
        >
          {row.remaining_balance.toLocaleString("fr-FR")} XOF
        </span>
      ),
    },
    {
      key: "receipt_url" as keyof UniversityRoyaltyPayment,
      header: "",
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
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-8 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/librarian" className="hover:text-navy">Vue d&apos;ensemble</Link>
        <span>/</span>
        <span className="text-navy font-semibold">Redevances 15% &amp; Relevés</span>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/librarian" className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Vue d&apos;ensemble
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
            <Percent className="w-4 h-4 text-gold" />
            Redevance Institutionnelle Fixe à 15% (Section 10.2)
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Redevances Dues &amp; Relevés de Rétribution
          </h1>
          <p className="text-xs text-foreground-muted mt-1">
            Calcul automatique à 15% des revenus générés par vos ouvrages rattachés et suivi du solde restant dû par LAHA Éditions.
          </p>
        </div>
      </div>

      {/* Carte Taux Fixe 15% (Section 10.2 Cahier v3.2) */}
      <div className="p-6 rounded-3xl bg-navy text-white border border-navy-hover shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/20 text-gold text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            Taux de Redevance Universitaire Fixe
          </div>
          <h3 className="font-serif font-bold text-lg text-white">Convention Institutionnelle LAHAThèque</h3>
          <p className="text-xs text-white/80 max-w-xl leading-relaxed">
            Chaque université partenaire perçoit automatiquement 15 % du total des ventes et abonnements générés par ses ouvrages rattachés.
          </p>
        </div>

        <div className="bg-navy-dark p-4 rounded-2xl border border-gold/30 flex items-center gap-4 shrink-0">
          <div>
            <span className="text-[10px] text-white/60 font-bold uppercase block">Taux Institutionnel Fixe</span>
            <span className="font-bold text-gold text-3xl font-mono">15 %</span>
            <span className="text-[9px] text-white/50 flex items-center gap-1 mt-0.5">
              <Lock className="w-3 h-3 text-gold" /> (Fixe &amp; Non modifiable — Section 10.2)
            </span>
          </div>
        </div>
      </div>

      {/* Cartes de Synthèse Financière */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-background border border-border space-y-2 shadow-xs">
          <span className="text-xs font-bold text-navy uppercase tracking-wider block">Ventes Brutes Générées</span>
          <p className="font-bold text-2xl text-navy font-mono">
            {(kpis?.totalRevenue || 51950000).toLocaleString("fr-FR")} XOF
          </p>
          <p className="text-[11px] text-foreground-muted">Total parutions rattachées UAC</p>
        </div>

        <div className="p-5 rounded-3xl bg-background border border-border space-y-2 shadow-xs">
          <span className="text-xs font-bold text-navy uppercase tracking-wider block">Redevance Dues (15%)</span>
          <p className="font-bold text-2xl text-gold font-mono">
            {(kpis?.pendingRoyalties || 7792500).toLocaleString("fr-FR")} XOF
          </p>
          <p className="text-[11px] text-foreground-muted">Cumul rétribution 15%</p>
        </div>

        <div className="p-5 rounded-3xl bg-background border border-border space-y-2 shadow-xs">
          <span className="text-xs font-bold text-navy uppercase tracking-wider block">Solde Restant Dû</span>
          <p className="font-bold text-2xl text-amber-600 font-mono">
            {(kpis?.remainingBalance || 2042500).toLocaleString("fr-FR")} XOF
          </p>
          <p className="text-[11px] text-foreground-muted">En cours de règlement trimestriel</p>
        </div>
      </div>

      {/* Tableau des Relevés */}
      <div className="space-y-4">
        <h3 className="font-serif font-bold text-navy text-base">
          Historique des Relevés Trimestriels de Redevance ({payments.length})
        </h3>

        <DataTable
          data={payments}
          columns={columns}
          rowKey="id"
          loading={loading}
          emptyMessage="Aucun relevé disponible."
          pageSize={10}
        />
      </div>
    </div>
  );
}
