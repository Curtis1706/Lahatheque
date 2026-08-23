"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Truck, PackageCheck, Eye, BookOpen } from "lucide-react";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { DeliverOrderModal } from "@/components/features/manager/deliver-order-modal";
import { OrderDetailModal } from "@/components/features/manager/order-detail-modal";
import { getOrdersByStatus, markAsDelivered } from "@/lib/services/manager";
import type { ManagerOrder } from "@/lib/types/manager";

export default function DeliveryInTransitPage() {
  const [orders, setOrders] = useState<ManagerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [deliverTarget, setDeliverTarget] = useState<ManagerOrder | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<ManagerOrder | null>(null);

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
        <button
          type="button"
          onClick={() => setSelectedOrder(row)}
          className="font-mono font-bold text-xs text-navy hover:underline text-left cursor-pointer"
        >
          {row.id}
        </button>
      ),
    },
    {
      key: "customer_name",
      header: "Client",
      cell: (row) => (
        <div>
          <p className="font-semibold text-xs text-foreground">{row.customer_name}</p>
          <p className="text-[10px] text-foreground-muted">
            {row.city || "—"}, {row.country || "BJ"}
            {row.customer_phone ? ` • ${row.customer_phone}` : ""}
          </p>
        </div>
      ),
    },
    {
      key: "items",
      header: "Articles Commandés",
      cell: (row) => {
        const totalEx = row.items.reduce((s, i) => s + (i.quantity || 1), 0);
        const firstItem = row.items[0];

        if (!firstItem) {
          return <span className="text-xs text-foreground-muted">Aucun article</span>;
        }

        return (
          <div className="flex items-center gap-2.5 max-w-xs">
            <div className="w-9 h-12 rounded bg-navy/5 border border-border overflow-hidden shrink-0 relative shadow-2xs">
              {firstItem.cover_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={firstItem.cover_url}
                  alt={firstItem.book_title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-foreground-muted">
                  <BookOpen className="w-3.5 h-3.5 text-gold" />
                </div>
              )}
            </div>

            <div className="min-w-0">
              <p className="text-xs font-bold text-navy truncate">
                {firstItem.book_title}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold bg-gold/15 text-navy">
                  {totalEx} ex.
                </span>
                {row.items.length > 1 && (
                  <span className="text-[10px] text-foreground-muted">
                    +{row.items.length - 1} autre{row.items.length > 2 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: "carrier",
      header: "Transporteur & Suivi",
      hideOnMobile: true,
      cell: (row) => (
        <div>
          <span className="text-xs font-semibold text-foreground">{row.carrier || "—"}</span>
          <p className="text-[10px] font-mono text-foreground-muted">{row.tracking_number || "Sans N° suivi"}</p>
        </div>
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
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedOrder(row);
            }}
            className="p-2 rounded-xl bg-background border border-border text-navy hover:border-gold hover:text-gold transition-colors flex items-center justify-center min-h-[36px] min-w-[36px] cursor-pointer"
            title="Voir les détails complets de la commande"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setDeliverTarget(row);
            }}
            className="px-3 py-1.5 rounded-xl bg-success text-white text-[10px] font-bold hover:opacity-90 transition-colors flex items-center gap-1.5 whitespace-nowrap min-h-[36px] cursor-pointer shadow-xs"
            title="Marquer comme livrée"
          >
            <PackageCheck className="w-3.5 h-3.5 text-white" />
            Livrée
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/manager" className="hover:text-navy">Vue d&apos;ensemble</Link>
        <span>/</span>
        <span className="text-navy font-semibold">Gestion des commandes — En transit</span>
      </div>

      <div className="border-b border-border pb-6">
        <Link href="/manager" className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          Vue d&apos;ensemble
        </Link>
        <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
          <Truck className="w-4 h-4 text-gold" />
          Gestion des commandes
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
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              tab.active
                ? "bg-navy text-white shadow-xs"
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
        onRowClick={(row) => setSelectedOrder(row)}
      />

      {deliverTarget && (
        <DeliverOrderModal
          order={deliverTarget}
          isOpen={Boolean(deliverTarget)}
          onClose={() => setDeliverTarget(null)}
          onConfirm={handleDeliver}
        />
      )}

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          isOpen={Boolean(selectedOrder)}
          onClose={() => setSelectedOrder(null)}
          onDeliver={(ord) => setDeliverTarget(ord)}
        />
      )}
    </div>
  );
}
