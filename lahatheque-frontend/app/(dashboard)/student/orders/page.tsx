"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { PackageCheck, ArrowLeft, Download, ShoppingBag, Truck, CheckCircle2, Clock } from "lucide-react";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { getClientOrders } from "@/lib/services/student";
import type { ClientOrder } from "@/lib/types/student";

export default function StudentOrdersPage() {
  const [orders, setOrders] = useState<ClientOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await getClientOrders();
      setOrders(data);
      setLoading(false);
    }
    loadData();
  }, []);

  const columns: DataTableColumn<ClientOrder>[] = [
    {
      key: "reference",
      header: "Référence",
      cell: (row) => (
        <div>
          <p className="font-mono font-bold text-xs text-navy leading-snug">{row.reference}</p>
          <p className="text-[10px] text-foreground-muted">Passée le {row.date}</p>
        </div>
      ),
    },
    {
      key: "book_title",
      header: "Article / Format",
      cell: (row) => (
        <div>
          <p className="font-serif font-bold text-xs text-navy leading-snug">{row.book_title}</p>
          <span className="text-[10px] font-mono text-gold font-semibold uppercase">{row.format}</span>
        </div>
      ),
    },
    {
      key: "total_price",
      header: "Montant Payé",
      cell: (row) => (
        <span className="font-mono font-bold text-gold text-xs">
          {row.total_price.toLocaleString("fr-FR")} XOF
        </span>
      ),
    },
    {
      key: "status",
      header: "Statut & Suivi Expédition",
      cell: (row) => (
        <div className="space-y-1">
          <StatusBadge status={row.status} />
          {row.tracking_number && (
            <span className="text-[10px] font-mono text-foreground-muted block">Tracking: {row.tracking_number}</span>
          )}
        </div>
      ),
    },
    {
      key: "invoice_url" as keyof ClientOrder,
      header: "Facture",
      cell: (row) => (
        <a
          href={row.invoice_url}
          target="_blank"
          rel="noreferrer"
          className="px-3 py-1.5 rounded-xl bg-navy text-white text-[10px] font-bold hover:bg-navy-hover transition-colors whitespace-nowrap min-h-[36px] inline-flex items-center gap-1"
        >
          <Download className="w-3.5 h-3.5 text-gold" />
          Facture PDF
        </a>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/student" className="hover:text-navy">Mon Espace</Link>
        <span>/</span>
        <span className="text-navy font-semibold">Achats &amp; Commandes Papier</span>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/student" className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Mon Espace
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
            <PackageCheck className="w-4 h-4 text-gold" />
            Historique des Achats &amp; Livraisons Papier (Section 3.4)
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Achats &amp; Commandes Papier
          </h1>
          <p className="text-xs text-foreground-muted mt-1">
            Consultez vos achats unitaires numériques, vos commandes d&apos;exemplaires papier physiques et leurs numéros de suivi d&apos;expédition.
          </p>
        </div>
      </div>

      {/* Table des Commandes */}
      <div className="space-y-4">
        <h3 className="font-serif font-bold text-navy text-base">
          Historique des Achats ({orders.length})
        </h3>

        <DataTable
          data={orders}
          columns={columns}
          rowKey="id"
          loading={loading}
          emptyMessage="Aucun achat ni commande papier enregistrés pour le moment."
          pageSize={10}
        />
      </div>
    </div>
  );
}
