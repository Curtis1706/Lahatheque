"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, PackageCheck, Search } from "lucide-react";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { getOrdersByStatus } from "@/lib/services/manager";
import type { ManagerOrder } from "@/lib/types/manager";

export default function DeliveryDeliveredPage() {
  const [orders, setOrders] = useState<ManagerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await getOrdersByStatus("delivered");
      setOrders(data);
      setLoading(false);
    }
    loadData();
  }, []);

  const filtered = orders.filter((o) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      o.id.toLowerCase().includes(q) ||
      o.customer_name.toLowerCase().includes(q) ||
      (o.carrier || "").toLowerCase().includes(q)
    );
  });

  const columns: DataTableColumn<ManagerOrder>[] = [
    {
      key: "id",
      header: "N° Commande",
      cell: (row) => (
        <Link href={`/manager/delivery/${row.id}`} className="font-mono font-bold text-xs text-navy hover:underline">
          {row.id}
        </Link>
      ),
    },
    {
      key: "customer_name",
      header: "Client",
      cell: (row) => (
        <div>
          <p className="font-semibold text-xs text-foreground">{row.customer_name}</p>
          <p className="text-[10px] text-foreground-muted">{row.city}, {row.country}</p>
        </div>
      ),
    },
    {
      key: "carrier",
      header: "Transporteur",
      hideOnMobile: true,
      cell: (row) => <span className="text-xs text-foreground">{row.carrier || "—"}</span>,
    },
    {
      key: "delivered_at",
      header: "Livrée le",
      cell: (row) => (
        <span className="text-xs text-foreground font-mono">
          {row.delivered_at
            ? new Date(row.delivered_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })
            : "—"}
        </span>
      ),
    },
    {
      key: "items",
      header: "Articles",
      hideOnMobile: true,
      cell: (row) => (
        <span className="text-xs text-foreground-muted">
          {row.items.reduce((s, i) => s + i.quantity, 0)} exemplaire{row.items.reduce((s, i) => s + i.quantity, 0) > 1 ? "s" : ""}
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
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/manager" className="hover:text-navy">Vue d&apos;ensemble</Link>
        <span>/</span>
        <span className="text-navy font-semibold">Livraison — Livrées</span>
      </div>

      <div className="border-b border-border pb-6">
        <Link href="/manager" className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          Vue d&apos;ensemble
        </Link>
        <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
          <PackageCheck className="w-4 h-4 text-gold" />
          Livraison
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
          Commandes Livrées
        </h1>
        <p className="text-xs text-foreground-muted mt-1">
          Historique des commandes livrées avec dates de livraison effectives.
        </p>
      </div>

      {/* Navigation onglets */}
      <div className="flex items-center gap-2 border-b border-border pb-3 overflow-x-auto">
        {[
          { label: "À expédier", href: "/manager/delivery", active: false },
          { label: "En transit", href: "/manager/delivery/in-transit", active: false },
          { label: "Livrées", href: "/manager/delivery/delivered", active: true },
        ].map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              tab.active
                ? "bg-navy text-white"
                : "text-foreground-muted hover:text-navy hover:bg-background-secondary"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Recherche */}
      <div className="bg-background border border-border p-4 rounded-2xl shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-foreground-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par N° commande, client ou transporteur..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-foreground placeholder:text-foreground-muted min-h-[40px]"
          />
        </div>
      </div>

      <DataTable
        data={filtered}
        columns={columns}
        rowKey="id"
        loading={loading}
        emptyMessage="Aucune commande livrée trouvée."
        onRowClick={(row) => { window.location.href = `/manager/delivery/${row.id}`; }}
        pageSize={10}
      />
    </div>
  );
}
