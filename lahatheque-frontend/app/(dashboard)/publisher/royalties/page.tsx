"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { DollarSign, ArrowLeft, Building2, Download, FileText, CheckCircle2, ShieldCheck, Lock } from "lucide-react";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { getPublisherRoyaltyPayments, getPublisherKpis } from "@/lib/services/publisher";
import type { PublisherRoyaltyPayment, PublisherKpis } from "@/lib/types/publisher";

export default function PublisherRoyaltiesPage() {
  const [payments, setPayments] = useState<PublisherRoyaltyPayment[]>([]);
  const [kpis, setKpis] = useState<PublisherKpis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [pData, kData] = await Promise.all([
        getPublisherRoyaltyPayments(),
        getPublisherKpis(),
      ]);
      setPayments(pData);
      setKpis(kData);
      setLoading(false);
    }
    loadData();
  }, []);

  const columns: DataTableColumn<PublisherRoyaltyPayment>[] = [
    {
      key: "period",
      header: "Période & Intitulé",
      cell: (row) => (
        <div>
          <p className="font-serif font-bold text-xs text-navy leading-snug">{row.period}</p>
          <p className="text-[10px] text-foreground-muted font-mono">Paiement Réf: {row.id}</p>
        </div>
      ),
    },
    {
      key: "amount",
      header: "Montant Versé",
      cell: (row) => (
        <span className="font-mono font-bold text-gold text-xs">
          {row.amount.toLocaleString("fr-FR")} {row.currency}
        </span>
      ),
    },
    {
      key: "payment_date",
      header: "Date de Règlement",
      cell: (row) => (
        <span className="font-mono text-xs text-foreground-muted">
          {new Date(row.payment_date).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
        </span>
      ),
    },
    {
      key: "payment_method",
      header: "Mode de Règlement",
      hideOnMobile: true,
      cell: (row) => <span className="text-xs font-semibold text-navy">{row.payment_method}</span>,
    },
    {
      key: "status",
      header: "Statut",
      cell: (row) => (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/30">
          <CheckCircle2 className="w-3 h-3" /> Règlement Effectué
        </span>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-8 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/publisher" className="hover:text-navy">Vue d&apos;ensemble</Link>
        <span>/</span>
        <span className="text-navy font-semibold">Redevances &amp; Contrat</span>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/publisher" className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Vue d&apos;ensemble
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
            <DollarSign className="w-4 h-4 text-gold" />
            Revenus &amp; Redevances (Section 10.3)
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Redevances Dues &amp; Paiements Reçus
          </h1>
          <p className="text-xs text-foreground-muted mt-1">
            Suivi automatique du chiffre d&apos;affaires et des versements effectués par LAHA Éditions selon votre contrat de partenariat.
          </p>
        </div>
      </div>

      {/* Carte Contrat de Partenariat & Taux Convenu (Section 4.3) */}
      <div className="p-6 rounded-3xl bg-navy text-white border border-navy-hover shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/20 text-gold text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            Contrat de Partenariat Partenaire Officiel
          </div>
          <h3 className="font-serif font-bold text-lg text-white">Éditions Hachette Afrique — Réf: CTR-PUB-2025-08</h3>
          <p className="text-xs text-white/80 max-w-xl leading-relaxed">
            Le calcul et le versement des redevances sont effectués automatiquement selon le taux fixe stipulé dans la convention d&apos;édition signée avec LAHA Éditions.
          </p>
        </div>

        <div className="bg-navy-dark p-4 rounded-2xl border border-gold/30 flex items-center gap-4 shrink-0">
          <div>
            <span className="text-[10px] text-white/60 font-bold uppercase block">Taux Contractuel Convenu</span>
            <span className="font-bold text-gold text-2xl font-mono">{kpis?.contractualRoyaltyRate || 22}%</span>
            <span className="text-[9px] text-white/50 flex items-center gap-1 mt-0.5">
              <Lock className="w-3 h-3 text-gold" /> (Lecture seule — Défini par contrat)
            </span>
          </div>
        </div>
      </div>

      {/* Cartes de Synthèse Financière */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-3xl bg-background border border-border space-y-2 shadow-xs">
          <span className="text-xs font-bold text-navy uppercase tracking-wider block">Chiffre d&apos;Affaires Net Généré</span>
          <p className="font-bold text-2xl text-navy font-mono">
            {(kpis?.totalRevenue || 5700000).toLocaleString("fr-FR")} XOF
          </p>
          <p className="text-[11px] text-foreground-muted">Calculé sur l&apos;ensemble du catalogue déposé</p>
        </div>

        <div className="p-5 rounded-3xl bg-background border border-border space-y-2 shadow-xs">
          <span className="text-xs font-bold text-navy uppercase tracking-wider block">Redevance Dues En Cours</span>
          <p className="font-bold text-2xl text-gold font-mono">
            {(kpis?.pendingRoyalties || 1254000).toLocaleString("fr-FR")} XOF
          </p>
          <p className="text-[11px] text-foreground-muted">Solde restant à régler pour la période en cours</p>
        </div>
      </div>

      {/* Historique des paiements reçus */}
      <div className="space-y-4">
        <h3 className="font-serif font-bold text-navy text-base">
          Historique des Règlements Effectués ({payments.length})
        </h3>

        <DataTable
          data={payments}
          columns={columns}
          rowKey="id"
          loading={loading}
          emptyMessage="Aucun paiement précédent enregistré."
        />
      </div>
    </div>
  );
}
