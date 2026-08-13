"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { ArrowLeft, PackageCheck, Download, FileText, AlertTriangle, ShieldCheck, XCircle } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { OrderTimeline } from "@/components/features/wholesaler/order-timeline";
import { CancelOrderModal } from "@/components/features/wholesaler/cancel-order-modal";
import { getWholesalerOrderDetail, requestOrderCancellation } from "@/lib/services/wholesaler";
import type { WholesalerOrder } from "@/lib/types/wholesaler";

export default function WholesalerOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [order, setOrder] = useState<WholesalerOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await getWholesalerOrderDetail(resolvedParams.id);
      setOrder(data);
      setLoading(false);
    }
    loadData();
  }, [resolvedParams.id]);

  const handleConfirmCancel = async (orderId: string, reason: string) => {
    const success = await requestOrderCancellation(orderId, reason);
    if (success) {
      setOrder((prev) =>
        prev ? { ...prev, status: "cancelled", cancel_requested: true, cancel_reason: reason } : prev
      );
      alert("La demande d'annulation de la commande a été enregistrée.");
    }
  };

  if (loading) {
    return (
      <div className="p-8 space-y-4 max-w-4xl mx-auto animate-pulse">
        <div className="h-8 bg-background-secondary rounded w-1/3" />
        <div className="h-64 bg-background-secondary rounded-3xl" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-8 text-center space-y-4 max-w-md mx-auto">
        <h2 className="font-serif font-bold text-navy text-lg">Commande introuvable</h2>
        <Link href="/wholesaler/orders" className="text-xs font-bold text-gold hover:underline block">
          Retour aux Commandes
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 max-w-6xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/wholesaler" className="hover:text-navy">Vue d&apos;ensemble</Link>
        <span>/</span>
        <Link href="/wholesaler/orders" className="hover:text-navy">Commandes</Link>
        <span>/</span>
        <span className="text-navy font-semibold">{order.reference}</span>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/wholesaler/orders" className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-2">
            <ArrowLeft className="w-3.5 h-3.5" />
            Retour à la Liste des Commandes
          </Link>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-xs text-gold">{order.reference}</span>
            <StatusBadge status={order.status} />
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy mt-1 leading-snug">
            Commande Groupée — {order.company_name}
          </h1>
          <p className="text-xs text-foreground-muted mt-1">
            Déposée le {new Date(order.created_at).toLocaleString("fr-FR")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {order.invoice_url && (
            <a
              href={order.invoice_url}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors inline-flex items-center gap-2 shadow-xs min-h-[44px]"
            >
              <Download className="w-4 h-4 text-gold" />
              Télécharger Facture PDF
            </a>
          )}

          {order.status !== "delivered" && order.status !== "cancelled" && (
            <button
              type="button"
              onClick={() => setCancelModalOpen(true)}
              className="px-3.5 py-2.5 rounded-xl bg-background-secondary border border-rose-500/30 text-rose-600 text-xs font-bold hover:bg-rose-500/10 transition-colors inline-flex items-center gap-2 min-h-[44px]"
            >
              <XCircle className="w-4 h-4" />
              Demander l&apos;Annulation
            </button>
          )}
        </div>
      </div>

      {/* Timeline de Suivi 21st.dev Order History (id: 7710) */}
      <OrderTimeline status={order.status} timeline={order.timeline} />

      {/* Rejet / Motif d'annulation */}
      {order.cancel_reason && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-700 space-y-1">
          <p className="font-bold flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            Motif d&apos;Annulation de la Commande :
          </p>
          <p className="italic">&ldquo;{order.cancel_reason}&rdquo;</p>
        </div>
      )}

      {/* Tableau Facture / Articles 21st.dev Invoice History Table (id: 22187) */}
      <div className="p-6 rounded-3xl bg-background border border-border space-y-4 shadow-xs text-xs">
        <h3 className="font-serif font-bold text-navy text-sm uppercase tracking-wider border-b border-border pb-2">
          Détail des Articles &amp; Répartition Financière
        </h3>

        <div className="space-y-3">
          {order.items.map((item, idx) => (
            <div key={idx} className="p-4 rounded-2xl bg-background-secondary border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="font-serif font-bold text-navy text-xs">{item.title}</p>
                <p className="text-[10px] text-foreground-muted font-mono">ISBN: {item.isbn}</p>
                <p className="text-[10px] text-foreground-muted">Auteurs: {item.authors.join(", ")}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-right">
                <div>
                  <span className="text-[10px] text-foreground-muted block font-bold">Licences Numériques</span>
                  <span className="font-mono font-bold text-navy">{item.digital_licenses_qty} x {item.digital_unit_price.toLocaleString("fr-FR")} XOF</span>
                </div>
                <div>
                  <span className="text-[10px] text-foreground-muted block font-bold">Exemplaires Papier</span>
                  <span className="font-mono font-bold text-navy">{item.print_copies_qty} x {item.print_unit_price.toLocaleString("fr-FR")} XOF</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Total */}
        <div className="p-4 rounded-2xl bg-navy/5 border border-navy/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <span className="font-bold text-navy block">Adresse de Livraison :</span>
            <span className="text-foreground-muted">{order.delivery_address} (Contact : {order.contact_phone})</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-foreground-muted uppercase font-bold block">Montant Total Réglé / Dû</span>
            <span className="font-mono font-bold text-gold text-lg">{order.total_amount.toLocaleString("fr-FR")} {order.currency}</span>
          </div>
        </div>
      </div>

      {/* Modale d'annulation */}
      <CancelOrderModal
        orderId={order.id}
        orderReference={order.reference}
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onConfirmCancel={handleConfirmCancel}
      />
    </div>
  );
}
