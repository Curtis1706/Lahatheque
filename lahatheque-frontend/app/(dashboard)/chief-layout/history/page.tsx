"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { History, Search, ArrowLeft, User } from "lucide-react";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { getValidationHistory } from "@/lib/services/layout-artist";
import type { LayoutDeposit } from "@/lib/types/layout-artist";

export default function ChefValidationHistoryPage() {
  const [deposits, setDeposits] = useState<LayoutDeposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await getValidationHistory();
      setDeposits(data);
      setLoading(false);
    }
    loadData();
  }, []);

  const filteredDeposits = deposits.filter((d) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      d.metadata.title.toLowerCase().includes(q) ||
      d.maquettiste_name.toLowerCase().includes(q)
    );
  });

  const columns: DataTableColumn<LayoutDeposit>[] = [
    {
      key: "metadata.title",
      header: "Ouvrage",
      cell: (row) => (
        <div>
          <p className="font-bold text-xs text-navy truncate max-w-[220px]">{row.metadata.title}</p>
          <p className="text-[10px] text-foreground-muted">{row.metadata.authors.join(", ")}</p>
        </div>
      ),
    },
    {
      key: "maquettiste_name",
      header: "Maquettiste",
      cell: (row) => (
        <span className="text-xs text-foreground font-semibold flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-gold" />
          {row.maquettiste_name}
        </span>
      ),
    },
    {
      key: "validated_at",
      header: "Date de Décision",
      cell: (row) => (
        <span className="text-xs text-foreground-muted font-mono">
          {row.validated_at
            ? new Date(row.validated_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })
            : new Date(row.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
        </span>
      ),
    },
    {
      key: "chef_comment",
      header: "Commentaire / Note",
      hideOnMobile: true,
      cell: (row) => (
        <span className="text-xs text-foreground-muted truncate max-w-[200px] block">
          {row.chef_comment || "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Décision",
      cell: (row) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/chief-layout" className="hover:text-navy">Vue d&apos;ensemble</Link>
        <span>/</span>
        <span className="text-navy font-semibold">Historique des Validations</span>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-6">
        <Link href="/chief-layout" className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          Vue d&apos;ensemble
        </Link>
        <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
          <History className="w-4 h-4 text-gold" />
          Chef Maquettiste
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
          Historique des Validations &amp; Révisions
        </h1>
        <p className="text-xs text-foreground-muted mt-1">
          Registre des décisions antérieures (ouvrages validés et publiés ou renvoyés en correction).
        </p>
      </div>

      {/* Recherche */}
      <div className="bg-background border border-border p-4 rounded-2xl shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-foreground-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par titre ou nom de maquettiste..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-foreground placeholder:text-foreground-muted min-h-[40px]"
          />
        </div>
      </div>

      {/* Table */}
      <DataTable
        data={filteredDeposits}
        columns={columns}
        rowKey="id"
        loading={loading}
        emptyMessage="Aucun historique de validation."
        pageSize={10}
      />
    </div>
  );
}
