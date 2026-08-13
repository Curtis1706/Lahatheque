"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Truck, PackageCheck } from "lucide-react";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { DeliverOrderModal } from "@/components/features/manager/deliver-order-modal";
import { getOrdersByStatus, markAsDelivered } from "@/lib/services/manager";
import type { ManagerOrder } from "@/lib/types/manager";

export default function DeliveryInTransitPage() {
  const [orders, setOrders] = useState<ManagerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [deliverTarget, setDeliverTarget] = useState<ManagerOrder | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await getOrdersByStatus("shipped");
      setOrders(data);
      setLoading(false);
    }
    loadData();
  }, []);

  const handleDeliver = async () => {
    if (!deliverTarget) return;
    await markAsDelivered(deliverTarget.id);
    setOrders((prev) => prev.filter((o) => o.id !== deliverTarget.id));
    setDeliverTarget(null);
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
      key: "carrier",
      header: "Transporteur",
      hideOnMobile: true,
      cell: (row) => <span className="text-xs text-foreground">{row.carrier || "—"}</span>,
    },
    {
      key: "tracking_number",
      header: "N° Suivi",
      cell: (row) => (
        <span className="text-xs text-foreground font-mono">{row.tracking_number || "—"}</span>
      ),
    },
    {
      key: "shipped_at",
      header: "Expédiée le",
      hideOnMobile: true,
      cell: (row) => (
        <span className="text-xs text-foreground-muted font-mono">
          {row.shipped_at ? new Date(row.shipped_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }) : "—"}
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
          onClick={() => setDeliverTarget(row)}
          className="px-3 py-1.5 rounded-xl bg-success text-white text-[10px] font-bold hover:opacity-90 transition-colors flex items-center gap-1.5 whitespace-nowrap min-h-[36px]"
          title="Marquer comme livrée"
        >
          <PackageCheck className="w-3.5 h-3.5" />
          Livrée
        </button>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/manager" className="hover:text-navy">Vue d&apos;ensemble</Link>
        <span>/</span>
        <span className="text-navy font-semibold">Livraison — En transit</span>
      </div>

      <div className="border-b border-border pb-6">
        <Link href="/manager" className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          Vue d&apos;ensemble
        </Link>
        <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
          <Truck className="w-4 h-4 text-gold" />
          Livraison
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
          En Cours de Livraison
        </h1>
        <p className="text-xs text-foreground-muted mt-1">
          Commandes expédiées avec transporteur et numéro de suivi associés.
        </p>
      </div>

      {/* Navigation onglets */}
      <div className="flex items-center gap-2 border-b border-border pb-3 overflow-x-auto">
        {[
          { label: "À expédier", href: "/manager/delivery", active: false },
          { label: "En transit", href: "/manager/delivery/in-transit", active: true },
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

      <DataTable
        data={orders}
        columns={columns}
        rowKey="id"
        loading={loading}
        emptyMessage="Aucune commande en cours de livraison."
        onRowClick={(row) => { window.location.href = `/manager/delivery/${row.id}`; }}
        pageSize={10}
      />

      {deliverTarget && (
        <DeliverOrderModal
          order={deliverTarget}
          isOpen={!!deliverTarget}
          onClose={() => setDeliverTarget(null)}
          onConfirm={handleDeliver}
        />
      )}
    </div>
  );
}
