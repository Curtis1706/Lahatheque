"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  DollarSign,
  ArrowLeft,
  FileSpreadsheet,
  Download,
  Building2,
  CheckCircle2,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { UniversityRoyaltyCard } from "@/components/features/university/university-royalty-card";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import {
  getUniversityRoyalties,
  requestUniversityRoyaltyWithdrawal,
} from "@/lib/services/university";
import type { UniversityRoyaltyStatementData } from "@/lib/types/university";

export default function UniversityRoyaltiesPage() {
  const [data, setData] = useState<{
    available_balance: number;
    total_paid: number;
    contractual_rate: number;
    currency: string;
    min_withdrawal_threshold: number;
    statements: UniversityRoyaltyStatementData[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const res = await getUniversityRoyalties();
      setData(res);
      setLoading(false);
    }
    loadData();
  }, []);

  const handleWithdraw = async (amount: number) => {
    const ok = await requestUniversityRoyaltyWithdrawal(amount);
    if (ok) {
      setData((prev) =>
        prev
          ? {
              ...prev,
              available_balance: Math.max(0, prev.available_balance - amount),
              total_paid: prev.total_paid + amount,
            }
          : prev
      );
    }
    return ok;
  };

  const columns: DataTableColumn<UniversityRoyaltyStatementData>[] = [
    {
      key: "reference",
      header: "Bordereau & Période",
      cell: (row) => (
        <div>
          <span className="font-mono text-xs font-bold text-navy">{row.reference}</span>
          <p className="text-[11px] text-foreground-muted">{row.period}</p>
        </div>
      ),
    },
    {
      key: "total_sales_catalog",
      header: "Chiffre d'Affaires Catalogue",
      hideOnMobile: true,
      cell: (row) => (
        <span className="font-mono text-xs text-foreground font-semibold">
          {row.total_sales_catalog.toLocaleString("fr-FR")} {row.currency}
        </span>
      ),
    },
    {
      key: "royalty_rate",
      header: "Taux",
      hideOnMobile: true,
      cell: (row) => (
        <span className="font-bold text-xs text-navy bg-navy-light px-2 py-0.5 rounded-md">
          {row.royalty_rate}%
        </span>
      ),
    },
    {
      key: "net_royalty_amount",
      header: "Redevance Nette (15%)",
      cell: (row) => (
        <span className="font-mono text-xs font-bold text-navy">
          {row.net_royalty_amount.toLocaleString("fr-FR")} {row.currency}
        </span>
      ),
    },
    {
      key: "status",
      header: "Statut Règlement",
      cell: (row) => {
        if (row.status === "paid") {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3 h-3" />
              Versé sur Compte
            </span>
          );
        }
        if (row.status === "pending") {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
              <Clock className="w-3 h-3" />
              En cours de virement
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-navy-light text-navy border border-navy-hover/20">
            <DollarSign className="w-3 h-3 text-gold" />
            Disponible pour virement
          </span>
        );
      },
    },
    {
      key: "pdf_statement_url" as keyof UniversityRoyaltyStatementData,
      header: "",
      cell: (row) => (
        <div className="flex items-center justify-end">
          {row.pdf_statement_url ? (
            <a
              href={row.pdf_statement_url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1.5 rounded-xl bg-background-secondary border border-border hover:border-gold text-navy text-[11px] font-bold inline-flex items-center gap-1 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-gold" />
              <span>Relevé PDF</span>
            </a>
          ) : (
            <span className="text-[11px] text-foreground-muted italic">
              Relevé PDF non encore disponible
            </span>
          )}
        </div>
      ),
    },
  ];

  if (loading || !data) {
    return (
      <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 max-w-7xl mx-auto animate-pulse">
        <div className="h-8 bg-background-secondary rounded-xl w-1/3" />
        <div className="h-48 bg-background-secondary rounded-3xl" />
        <div className="h-64 bg-background-secondary rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-8 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/university" className="hover:text-navy">Vue d&apos;ensemble</Link>
        <span>/</span>
        <span className="text-navy font-semibold">Redevances Universitaires</span>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/university" className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Vue d&apos;ensemble
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
            <DollarSign className="w-4 h-4 text-gold" />
            Rémunération Institutionnelle (Section 4.1.6 &amp; 7)
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Redevances de l&apos;Établissement (15% HT)
          </h1>
          <p className="text-xs text-foreground-muted mt-1">
            Suivi des droits reversés à l&apos;université sur les ventes et consultations d&apos;ouvrages de votre catalogue affilié.
          </p>
        </div>
      </div>

      {/* Carte Financière 15% 21st.dev */}
      <UniversityRoyaltyCard
        availableBalance={data.available_balance}
        totalPaid={data.total_paid}
        contractualRate={data.contractual_rate}
        currency={data.currency}
        minThreshold={data.min_withdrawal_threshold}
        onWithdraw={handleWithdraw}
      />

      {/* Tableau des bordereaux */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider">
            <FileSpreadsheet className="w-4 h-4 text-gold" />
            Historique des Bordereaux Trimestriels de Redevance
          </div>
        </div>

        <DataTable
          data={data.statements}
          columns={columns}
          rowKey="id"
          loading={loading}
          emptyMessage="Aucun bordereau de redevance pour le moment."
          pageSize={10}
        />
      </div>
    </div>
  );
}
