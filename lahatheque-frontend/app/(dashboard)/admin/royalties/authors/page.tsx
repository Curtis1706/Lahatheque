"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { getAdminRoyalties } from "@/lib/services/admin";
import { AdminRoyalty } from "@/lib/types/admin";
import { StatusBadge } from "@/components/ui/status-badge";

export default function AdminAuthorRoyaltiesPage() {
  const [data, setData] = useState<AdminRoyalty[]>([]);

  useEffect(() => {
    getAdminRoyalties().then((items) =>
      setData(items.filter((i) => i.beneficiary_type === "author"))
    );
  }, []);

  const columns: DataTableColumn<AdminRoyalty>[] = [
    {
      key: "beneficiary_name",
      header: "Auteur Bénéficiaire",
      cell: (row) => (
        <div>
          <p className="font-semibold text-xs text-foreground">{row.beneficiary_name}</p>
          <p className="text-[11px] text-foreground-muted">{row.book_title}</p>
        </div>
      ),
    },
    {
      key: "payout_amount",
      header: "Droits d'Auteur Acquis",
      cell: (row) => (
        <span className="font-mono text-xs font-bold text-gold-dark">
          {row.payout_amount.toLocaleString("fr-FR")} FCFA
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
    <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <Link
          href="/admin/royalties"
          className="inline-flex items-center gap-1 text-xs font-medium text-gold hover:text-gold-dark mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Retour aux Redevances
        </Link>
        <div className="pb-4 border-b border-border">
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-navy">
            Droits d'Auteur (Vue Globale)
          </h1>
          <p className="text-xs sm:text-sm text-foreground-muted mt-0.5">
            Consolidation globale des droits acquis par l'ensemble des auteurs d'ouvrages.
          </p>
        </div>
      </div>

      <DataTable data={data} columns={columns} rowKey="id" />
    </div>
  );
}
