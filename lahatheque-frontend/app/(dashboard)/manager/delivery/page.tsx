"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Package, Truck, Filter } from "lucide-react";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { ShipOrderModal } from "@/components/features/manager/ship-order-modal";
import { getOrdersByStatus, markAsShipped } from "@/lib/services/manager";
import type { ManagerOrder } from "@/lib/types/manager";

export default function DeliveryToShipPage() {
  const [orders, setOrders] = useState<ManagerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [shipTarget, setShipTarget] = useState<ManagerOrder | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await getOrdersByStatus("to_ship");
      setOrders(data);
      setLoading(false);
    }
    loadData();
  }, []);

  const handleShip = async (carrier: string, trackingNumber: string) => {
    if (!shipTarget) return;
    await markAsShipped(shipTarget.id, carrier, trackingNumber);
    setOrders((prev) => prev.filter((o) => o.id !== shipTarget.id));
    setShipTarget(null);
  };

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
      key: "items",
      header: "Articles",
      hideOnMobile: true,
      cell: (row) => (
        <span className="text-xs text-foreground-muted">
          {row.items.length} article{row.items.length > 1 ? "s" : ""} ({row.items.reduce((s, i) => s + i.quantity, 0)} ex.)
        </span>
      ),
    },
    {
      key: "order_date",
      header: "Passée le",
      hideOnMobile: true,
      cell: (row) => (
        <span className="text-xs text-foreground-muted font-mono">
          {new Date(row.order_date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
        </span>
      ),
    },
    {
      key: "status",
      header: "Statut",
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "actions" as keyof ManagerOrder,
      header: "",
      cell: (row) => (
        <button
          onClick={() => setShipTarget(row)}
          className="px-3 py-1.5 rounded-xl bg-navy text-white text-[10px] font-bold hover:bg-navy-hover transition-colors flex items-center gap-1.5 whitespace-nowrap min-h-[36px]"
          title="Marquer comme expédiée"
        >
          <Truck className="w-3.5 h-3.5" />
          Expédier
        </button>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/manager" className="hover:text-navy">Vue d&apos;ensemble</Link>
        <span>/</span>
        <span className="text-navy font-semibold">Livraison — À expédier</span>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-6">
        <Link href="/manager" className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          Vue d&apos;ensemble
        </Link>
        <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
          <Package className="w-4 h-4 text-gold" />
          Livraison
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
          Commandes à Expédier
        </h1>
        <p className="text-xs text-foreground-muted mt-1">
          Commandes papier validées en attente d&apos;expédition. Associez un transporteur et un numéro de suivi pour chaque envoi.
        </p>
      </div>

      {/* Navigation entre onglets */}
      <div className="flex items-center gap-2 border-b border-border pb-3 overflow-x-auto">
        {[
          { label: "À expédier", href: "/manager/delivery", active: true },
          { label: "En transit", href: "/manager/delivery/in-transit", active: false },
          { label: "Livrées", href: "/manager/delivery/delivered", active: false },
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

      {/* Table */}
      <DataTable
        data={orders}
        columns={columns}
        rowKey="id"
        loading={loading}
        emptyMessage="Aucune commande en attente d'expédition."
        onRowClick={(row) => { window.location.href = `/manager/delivery/${row.id}`; }}
        pageSize={10}
      />

      {/* Modale d'expédition */}
      {shipTarget && (
        <ShipOrderModal
          order={shipTarget}
          isOpen={!!shipTarget}
          onClose={() => setShipTarget(null)}
          onConfirm={handleShip}
        />
      )}
    </div>
  );
}
