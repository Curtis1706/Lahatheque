"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  DollarSign,
  ArrowLeft,
  Building2,
  Download,
  FileText,
  CheckCircle2,
  ShieldCheck,
  Lock,
  Send,
  Clock,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { InlineLoader } from "@/components/ui/page-loader";
import {
  getPublisherRoyaltyPayments,
  getPublisherKpis,
  requestRoyaltyPayout,
} from "@/lib/services/publisher";
import type { PublisherRoyaltyPayment, PublisherKpis } from "@/lib/types/publisher";

export default function PublisherRoyaltiesPage() {
  const [payments, setPayments] = useState<PublisherRoyaltyPayment[]>([]);
  const [kpis, setKpis] = useState<PublisherKpis | null>(null);
  const [loading, setLoading] = useState(true);
  const [requestingPayout, setRequestingPayout] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [pData, kData] = await Promise.all([
          getPublisherRoyaltyPayments(),
          getPublisherKpis(),
        ]);
        setPayments(pData);
        setKpis(kData);
      } catch {
        toast.error("Erreur lors du chargement des redevances.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleRequestPayout = async () => {
    const amount = kpis?.pendingRoyalties || 0;
    if (amount < 50000) {
      toast.info("Le montant minimum pour une demande de virement est de 50 000 XOF.");
      return;
    }

    setRequestingPayout(true);
    try {
      await requestRoyaltyPayout(amount);
      toast.success(`Demande de virement de ${amount.toLocaleString("fr-FR")} XOF transmise à la comptabilité.`);
      const updatedPayments = await getPublisherRoyaltyPayments();
      setPayments(updatedPayments);
    } catch {
      toast.error("Échec de la demande de virement.");
    } finally {
      setRequestingPayout(false);
    }
  };

  const columns: DataTableColumn<PublisherRoyaltyPayment>[] = [
    {
      key: "period",
      header: "Période & Intitulé",
      cell: (row) => (
        <div>
          <p className="font-serif font-bold text-xs text-navy leading-snug">{row.period}</p>
          <p className="text-[10px] text-foreground-muted font-mono">
            Réf : {row.reference || row.id}
          </p>
        </div>
      ),
    },
    {
      key: "amount",
      header: "Montant Net",
      cell: (row) => (
        <span className="font-mono font-bold text-gold text-xs">
          {(row.net_royalty_amount || row.amount).toLocaleString("fr-FR")} {row.currency}
        </span>
      ),
    },
    {
      key: "payment_date",
      header: "Date de Règlement",
      cell: (row) => (
        <span className="font-mono text-xs text-foreground-muted">
          {row.payment_date || row.paid_at
            ? new Date(row.payment_date || row.paid_at!).toLocaleDateString("fr-FR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })
            : "En attente"}
        </span>
      ),
    },
    {
      key: "payment_method",
      header: "Mode de Règlement",
      hideOnMobile: true,
      cell: (row) => (
        <span className="text-xs font-semibold text-navy">
          {row.payment_method || "Virement Bancaire (IBAN)"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Statut",
      cell: (row) => (
        <span
          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full ${
            row.status === "paid"
              ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/30"
              : "bg-amber-500/10 text-amber-600 border border-amber-500/30"
          }`}
        >
          {row.status === "paid" ? (
            <>
              <CheckCircle2 className="w-3 h-3" /> Règlement Effectué
            </>
          ) : (
            <>
              <InlineLoader size={12} /> En Traitement
            </>
          )}
        </span>
      ),
    },
    {
      key: "actions" as keyof PublisherRoyaltyPayment,
      header: "Bordereau",
      cell: (row) => (
        <button
          type="button"
          onClick={() => {
            toast.success(`Téléchargement du bordereau ${row.reference || row.id}...`);
          }}
          className="p-2 rounded-xl bg-background-secondary border border-border hover:border-gold text-navy transition-colors inline-flex items-center gap-1 text-xs font-semibold"
          title="Télécharger le bordereau certifié PDF"
        >
          <Download className="w-3.5 h-3.5 text-gold" />
          <span className="hidden sm:inline">PDF</span>
        </button>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/publisher"
            className="inline-flex items-center gap-1.5 text-xs text-navy font-bold hover:text-gold transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Vue d&apos;ensemble
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
            <DollarSign className="w-4 h-4 text-gold" />
            Revenus &amp; Redevances (Section 5 &amp; 10.3)
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Redevances Dues &amp; Règlements
          </h1>
          <p className="text-xs sm:text-sm text-foreground-muted mt-1">
            Suivi automatique du chiffre d&apos;affaires généré et des versements selon votre convention de mandat.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRequestPayout}
          disabled={requestingPayout || (kpis?.pendingRoyalties || 0) < 50000}
          className="px-5 py-2.5 rounded-xl bg-gold text-navy font-bold text-xs hover:bg-gold-light transition-all flex items-center gap-2 shadow-xs min-h-[44px] shrink-0 disabled:opacity-50"
        >
          {requestingPayout ? (
            <>
              <InlineLoader size={16} />
              <span>Demande en cours...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Demander un Virement</span>
            </>
          )}
        </button>
      </div>

      {/* Carte Contrat de Partenariat & Taux Convenu */}
      <div className="p-6 rounded-3xl bg-navy text-white border border-navy-hover shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/20 text-gold text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            Convention de Mandat Partenaire Officiel
          </div>
          <h3 className="font-serif font-bold text-lg text-white">
            Éditeur Partenaire Certifié • Réf: CTR-PUB-2025-08
          </h3>
          <p className="text-xs text-white/80 max-w-xl leading-relaxed">
            Le calcul des redevances s&apos;effectue en temps réel sur les ventes unitaires et les quotes-parts d&apos;abonnements.
          </p>
        </div>

        <div className="bg-navy-dark p-4 rounded-2xl border border-gold/30 flex items-center gap-4 shrink-0">
          <div>
            <span className="text-[10px] text-white/60 font-bold uppercase block">Taux Contractuel Convenu</span>
            <span className="font-bold text-gold text-2xl font-mono">{kpis?.contractualRoyaltyRate || 22}%</span>
            <span className="text-[9px] text-white/50 flex items-center gap-1 mt-0.5">
              <Lock className="w-3 h-3 text-gold" /> (Lecture seule — Stipulé au contrat)
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
          <p className="text-[11px] text-foreground-muted">Cumul des ventes de votre catalogue sur la plateforme</p>
        </div>

        <div className="p-5 rounded-3xl bg-background border border-border space-y-2 shadow-xs">
          <span className="text-xs font-bold text-navy uppercase tracking-wider block">Solde de Redevances à Percevoir</span>
          <p className="font-bold text-2xl text-gold font-mono">
            {(kpis?.pendingRoyalties || 1254000).toLocaleString("fr-FR")} XOF
          </p>
          <p className="text-[11px] text-foreground-muted">Montant éligible au virement (Seuil minimum : 50 000 XOF)</p>
        </div>
      </div>

      {/* Historique des règlements */}
      <div className="space-y-4">
        <h3 className="font-serif font-bold text-navy text-base">
          Historique des Règlements &amp; Bordereaux Fiscaux ({payments.length})
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
