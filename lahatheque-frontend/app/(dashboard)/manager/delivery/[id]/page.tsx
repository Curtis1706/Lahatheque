"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Package,
  Mail,
  MapPin,
  User,
  Phone,
  Calendar,
  Clock,
  Truck,
  BookOpen,
  CheckCircle2,
  Printer,
  ShoppingBag,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { OrderStatusStepper } from "@/components/features/manager/order-status-stepper";
import { getOrderDetail } from "@/lib/services/manager";
import type { ManagerOrder } from "@/lib/types/manager";

export default function DeliveryDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [order, setOrder] = useState<ManagerOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await getOrderDetail(id);
      setOrder(data);
      setLoading(false);
    }
    loadData();
  }, [id]);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 md:p-8 w-full max-w-5xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-background-secondary rounded-xl" />
        <div className="h-64 bg-background-secondary rounded-2xl" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-4 sm:p-6 md:p-8 w-full max-w-5xl mx-auto text-center space-y-4">
        <Package className="w-12 h-12 text-foreground-muted mx-auto" />
        <h2 className="font-serif font-bold text-navy text-xl">Commande introuvable</h2>
        <Link href="/manager/delivery" className="text-xs text-gold font-bold hover:underline">
          Retour à la gestion des commandes
        </Link>
      </div>
    );
  }

  const totalQuantity = order.items.reduce((s, i) => s + (i.quantity || 1), 0);
  const totalAmount =
    order.total_amount ||
    order.items.reduce(
      (s, i) => s + (i.total_price || (i.unit_price || 0) * (i.quantity || 1)),
      0
    );

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/manager" className="hover:text-navy">Vue d&apos;ensemble</Link>
        <span>/</span>
        <Link href="/manager/delivery" className="hover:text-navy">Gestion des commandes</Link>
        <span>/</span>
        <span className="text-navy font-semibold">{order.id}</span>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/manager/delivery" className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-2">
            <ArrowLeft className="w-3.5 h-3.5" />
            Retour à la gestion des commandes
          </Link>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-serif text-xl sm:text-2xl font-bold text-navy">
              Commande #{order.id}
            </h1>
            <StatusBadge status={order.status} />
          </div>
          <p className="text-xs text-foreground-muted mt-1">
            Passée le {new Date(order.order_date).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="px-4 py-2.5 rounded-xl border border-border bg-background text-navy text-xs font-bold hover:border-gold transition-colors flex items-center gap-2 shadow-xs shrink-0 self-start sm:self-auto cursor-pointer"
        >
          <Printer className="w-4 h-4 text-navy" />
          Imprimer Bon de Préparation
        </button>
      </div>

      {/* Stepper de statut */}
      <div className="p-6 rounded-3xl bg-background-secondary border border-border">
        <h3 className="text-sm font-semibold text-navy mb-4">Progression de la livraison</h3>
        <OrderStatusStepper
          orderStatus={order.status}
          orderDate={order.order_date}
          shippedAt={order.shipped_at}
          deliveredAt={order.delivered_at}
        />
      </div>

      {/* Grille Destinataire & Expédition */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Destinataire */}
        <div className="p-6 rounded-3xl bg-background border border-border space-y-4 shadow-xs">
          <h3 className="text-sm font-bold font-serif text-navy flex items-center gap-2 border-b border-border pb-3">
            <User className="w-4 h-4 text-gold" />
            Destinataire &amp; Adresse
          </h3>
          <div className="space-y-3 text-xs">
            <div>
              <span className="text-foreground-muted text-[10px] block">Client</span>
              <p className="text-foreground font-bold text-sm">{order.customer_name}</p>
            </div>

            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-foreground-muted shrink-0" />
              <span className="text-foreground">{order.customer_email}</span>
            </div>

            {order.customer_phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gold shrink-0" />
                <span className="font-mono font-bold text-navy">{order.customer_phone}</span>
              </div>
            )}

            <div className="flex items-start gap-2 pt-2 border-t border-border">
              <MapPin className="w-4 h-4 text-gold mt-0.5 shrink-0" />
              <div>
                <span className="text-foreground-muted text-[10px] block">Lieu de livraison</span>
                <p className="text-foreground font-medium">{order.shipping_address || "Non spécifiée"}</p>
                <p className="text-foreground-muted text-[11px]">{order.city} — {order.country}</p>
              </div>
            </div>

            {order.date_livraison_souhaitee && (
              <div className="flex items-center gap-2 pt-2 border-t border-border text-[11px] text-navy font-medium">
                <Calendar className="w-4 h-4 text-gold shrink-0" />
                <span>
                  Date souhaitée : {new Date(order.date_livraison_souhaitee).toLocaleDateString("fr-FR")}
                  {order.plage_horaire_debut && ` (${order.plage_horaire_debut} - ${order.plage_horaire_fin})`}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Expédition & Paiement */}
        <div className="p-6 rounded-3xl bg-background border border-border space-y-4 shadow-xs">
          <h3 className="text-sm font-bold font-serif text-navy flex items-center gap-2 border-b border-border pb-3">
            <Truck className="w-4 h-4 text-gold" />
            Expédition &amp; Facturation
          </h3>
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-foreground-muted">Transporteur</span>
              <span className="font-semibold text-foreground">{order.carrier || "En attente d'affectation"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-foreground-muted">N° de suivi</span>
              <span className="font-mono font-bold text-navy">{order.tracking_number || "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-foreground-muted">Entrepôt source</span>
              <span className="text-foreground font-medium">{order.warehouse || "Entrepôt Principal LAHA Cotonou"}</span>
            </div>

            <div className="pt-3 border-t border-border flex items-center justify-between">
              <span className="text-foreground-muted">Statut Paiement</span>
              <span className="text-xs font-bold text-success flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {order.statut_paiement === "paid" ? "Règlement Validé" : "En attente"}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-foreground-muted">Mode de règlement</span>
              <span className="font-semibold text-navy uppercase text-[10px] px-2 py-0.5 rounded bg-background-secondary border border-border">
                {order.mode_paiement || "Mobile Money"}
              </span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border">
              <span className="text-foreground-muted font-bold">Total Facturé TTC</span>
              <span className="font-mono font-bold text-base text-navy">
                {totalAmount.toLocaleString("fr-FR")} XOF
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des articles */}
      <div className="p-6 rounded-3xl bg-background border border-border space-y-4 shadow-xs">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h3 className="font-serif font-bold text-base text-navy flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-gold" />
            Articles Physiques Commandés ({totalQuantity} exemplaire{totalQuantity > 1 ? "s" : ""})
          </h3>
          <span className="text-xs text-foreground-muted font-bold">
            {order.items.length} titre{order.items.length > 1 ? "s" : ""}
          </span>
        </div>

        <div className="divide-y divide-border">
          {order.items.map((item, idx) => (
            <div key={item.id || idx} className="py-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-14 h-20 rounded-xl bg-navy/5 border border-border overflow-hidden shrink-0 relative shadow-2xs">
                  {item.cover_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.cover_url}
                      alt={item.book_title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-foreground-muted">
                      <BookOpen className="w-5 h-5 text-gold" />
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <h4 className="font-serif font-bold text-sm text-navy line-clamp-2">
                    {item.book_title}
                  </h4>
                  <p className="text-xs text-foreground-muted font-mono mt-0.5">
                    ISBN : {item.isbn || "—"}
                  </p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-gold/15 text-navy">
                    Format Papier Physique
                  </span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <p className="text-sm font-bold font-mono text-navy">
                  {(item.total_price || (item.unit_price || 0) * (item.quantity || 1)).toLocaleString("fr-FR")} XOF
                </p>
                <p className="text-xs text-foreground-muted font-mono">
                  {item.quantity || 1} ex. × {(item.unit_price || 0).toLocaleString("fr-FR")} XOF
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
