"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PackageCheck, PlusCircle, ArrowLeft, Eye, Download, AlertTriangle, FileText, XCircle } from "lucide-react";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { CancelOrderModal } from "@/components/features/wholesaler/cancel-order-modal";
import { getWholesalerOrders, requestOrderCancellation } from "@/lib/services/wholesaler";
import type { WholesalerOrder } from "@/lib/types/wholesaler";
import { toast } from "sonner";

export default function WholesalerOrdersListPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<WholesalerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelOrder, setCancelOrder] = useState<WholesalerOrder | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await getWholesalerOrders();
      setOrders(data);
    } catch (err: unknown) {
      console.error("Erreur de chargement des commandes", err);
      setLoadError(
        err instanceof Error ? err.message : "Impossible de charger vos commandes pour le moment."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleConfirmCancel = async (orderId: string, reason: string) => {
    const success = await requestOrderCancellation(orderId, reason);
    if (success) {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, status: "cancelled", cancel_requested: true, cancel_reason: reason } : o
        )
      );
      toast.success("La demande d'annulation de la commande a été enregistrée avec succès.");
    } else {
      toast.error("Impossible d'annuler cette commande.");
    }
  };

  const columns: DataTableColumn<WholesalerOrder>[] = [
    {
      key: "reference",
      header: "Référence Commande",
      cell: (row) => (
        <Link href={`/wholesaler/orders/${row.id}`} className="hover:text-navy transition-colors">
          <div className="flex items-center gap-1.5">
            <p className="font-mono font-bold text-xs text-navy leading-snug">{row.reference}</p>
            {/* 
              ─── INDICATEUR COMMANDE À CRÉDIT GROSSISTE ─────────────────────────
              Décommenter ci-dessous pour afficher le badge crédit sur la liste :
              {row.is_credit_purchase && (
                <span className="px-1.5 py-0.5 rounded-md bg-gold/15 text-gold text-[9px] font-bold">
                  Dépôt Crédit
                </span>
              )}
            */}
          </div>
          <p className="text-[10px] text-foreground-muted">
            Déposée le {new Date(row.created_at).toLocaleDateString("fr-FR")}
          </p>
        </Link>
      ),
    },
    {
      key: "items",
      header: "Titres & Volumes",
      cell: (row) => (
        <div className="text-xs">
          <span className="font-bold text-navy">{row.items.length} titre(s)</span>
          <p className="text-[10px] text-foreground-muted">
            {row.total_digital_licenses} licences num. • {row.total_print_copies} ex. papier
          </p>
        </div>
      ),
    },
    {
      key: "total_amount",
      header: "Montant Total",
      cell: (row) => (
        <span className="font-mono font-bold text-gold text-xs">
          {row.total_amount.toLocaleString("fr-FR")} {row.currency}
        </span>
      ),
    },
    {
      key: "status",
      header: "Statut",
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "actions" as keyof WholesalerOrder,
      header: "",
      cell: (row) => (
        <div className="flex items-center justify-end gap-2">
          <Link
            href={`/wholesaler/orders/${row.id}`}
            className="px-3 py-1.5 rounded-xl bg-navy text-white text-[10px] font-bold hover:bg-navy-hover transition-colors whitespace-nowrap min-h-[36px] inline-flex items-center gap-1"
          >
            <Eye className="w-3.5 h-3.5 text-gold" />
            Détail &amp; Timeline
          </Link>

          {row.status !== "delivered" && row.status !== "cancelled" && (
            <button
              type="button"
              onClick={() => setCancelOrder(row)}
              className="p-2 rounded-xl bg-background-secondary border border-rose-500/30 hover:bg-rose-500/10 transition-colors text-rose-600 min-h-[36px] inline-flex items-center cursor-pointer"
              title="Demander l'annulation"
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/wholesaler" className="hover:text-navy">Vue d&apos;ensemble</Link>
        <span>/</span>
        <span className="text-navy font-semibold">Commandes Groupées</span>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/wholesaler" className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Vue d&apos;ensemble
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
            <PackageCheck className="w-4 h-4 text-gold" />
            Historique &amp; Suivi des Achats en Gros
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Commandes Groupées B2B
          </h1>
          <p className="text-xs text-foreground-muted mt-1">
            Consultez le statut de vos commandes groupées, téléchargez vos factures proforma et suivez la livraison des cartons.
          </p>
        </div>

        <Link
          href="/wholesaler/catalog"
          className="px-4 py-2.5 rounded-xl bg-navy text-white font-bold text-xs hover:bg-navy-hover transition-colors inline-flex items-center gap-2 shadow-xs min-h-[44px]"
        >
          <PlusCircle className="w-4 h-4 text-gold" />
          Nouvelle Commande Groupée
        </Link>
      </div>

      {/* Table ou Erreur */}
      {loadError ? (
        <div className="p-8 text-center rounded-3xl bg-error/5 border border-error/20 space-y-4">
          <div className="w-12 h-12 rounded-full bg-error/10 text-error flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-serif font-bold text-navy text-base">
              Erreur de chargement des commandes
            </h3>
            <p className="text-xs text-foreground-muted max-w-md mx-auto">
              {loadError || "Une erreur est survenue lors du chargement de vos commandes. Veuillez réessayer."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => loadData()}
            className="px-5 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-dark transition-all inline-flex items-center gap-2 min-h-[40px]"
          >
            <span>Réessayer</span>
          </button>
        </div>
      ) : (
        <DataTable
          data={orders}
          columns={columns}
          rowKey="id"
          loading={loading}
          emptyMessage="Aucune commande groupée passée pour le moment."
          onRowClick={(row) => { router.push(`/wholesaler/orders/${row.id}`); }}
          pageSize={10}
        />
      )}

      {/* Modale d'annulation */}
      <CancelOrderModal
        orderId={cancelOrder?.id || null}
        orderReference={cancelOrder?.reference}
        isOpen={cancelOrder !== null}
        onClose={() => setCancelOrder(null)}
        onConfirmCancel={handleConfirmCancel}
      />
    </div>
  );
}
