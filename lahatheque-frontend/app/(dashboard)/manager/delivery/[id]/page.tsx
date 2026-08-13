"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Package, Mail, MapPin, User } from "lucide-react";
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
      <div className="p-4 sm:p-6 md:p-8 w-full max-w-4xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-background-secondary rounded-xl" />
        <div className="h-64 bg-background-secondary rounded-2xl" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-4 sm:p-6 md:p-8 w-full max-w-4xl mx-auto text-center space-y-4">
        <Package className="w-12 h-12 text-foreground-muted mx-auto" />
        <h2 className="font-serif font-bold text-navy text-xl">Commande introuvable</h2>
        <Link href="/manager/delivery" className="text-xs text-gold font-bold hover:underline">
          Retour aux livraisons
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/manager" className="hover:text-navy">Vue d&apos;ensemble</Link>
        <span>/</span>
        <Link href="/manager/delivery" className="hover:text-navy">Livraison</Link>
        <span>/</span>
        <span className="text-navy font-semibold">{order.id}</span>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-6">
        <Link href="/manager/delivery" className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-2">
          <ArrowLeft className="w-3.5 h-3.5" />
          Retour aux livraisons
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="font-serif text-xl sm:text-2xl font-bold text-navy">{order.id}</h1>
            <p className="text-xs text-foreground-muted mt-1">
              Passée le {new Date(order.order_date).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
            </p>
          </div>
          <StatusBadge status={order.status} />
        </div>
      </div>

      {/* Stepper de statut */}
      <div className="p-5 rounded-2xl bg-background-secondary border border-border">
        <h3 className="text-sm font-semibold text-navy mb-4">Suivi de la commande</h3>
        <OrderStatusStepper
          orderStatus={order.status}
          orderDate={order.order_date}
          shippedAt={order.shipped_at}
          deliveredAt={order.delivered_at}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Informations client */}
        <div className="p-5 rounded-2xl bg-background-secondary border border-border space-y-3">
          <h3 className="text-sm font-semibold text-navy flex items-center gap-2">
            <User className="w-4 h-4 text-gold" />
            Destinataire
          </h3>
          <div className="space-y-2 text-xs">
            <p className="text-foreground font-semibold">{order.customer_name}</p>
            <p className="text-foreground-muted flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" /> {order.customer_email}
            </p>
            <p className="text-foreground-muted flex items-start gap-1.5">
              <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              {order.shipping_address}, {order.city} — {order.country}
            </p>
          </div>
        </div>

        {/* Transporteur & Suivi */}
        <div className="p-5 rounded-2xl bg-background-secondary border border-border space-y-3">
          <h3 className="text-sm font-semibold text-navy flex items-center gap-2">
            <Package className="w-4 h-4 text-gold" />
            Expédition
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-foreground-muted">Transporteur</span>
              <span className="font-semibold text-foreground">{order.carrier || "Non attribué"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-foreground-muted">N° de suivi</span>
              <span className="font-mono font-semibold text-foreground">{order.tracking_number || "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-foreground-muted">Entrepôt</span>
              <span className="text-foreground">{order.warehouse}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Articles */}
      <div className="p-5 rounded-2xl bg-background-secondary border border-border space-y-3">
        <h3 className="text-sm font-semibold text-navy">
          Articles commandés ({order.items.length})
        </h3>
        <div className="divide-y divide-border">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between py-3 text-xs">
              <div>
                <p className="font-semibold text-foreground">{item.book_title}</p>
                <p className="text-[10px] text-foreground-muted font-mono">{item.isbn}</p>
              </div>
              <span className="font-mono font-bold text-navy">×{item.quantity}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Notifications envoyées */}
      <div className="p-5 rounded-2xl bg-background-secondary border border-border space-y-3">
        <h3 className="text-sm font-semibold text-navy flex items-center gap-2">
          <Mail className="w-4 h-4 text-gold" />
          Notifications envoyées
        </h3>
        {order.notifications.length === 0 ? (
          <p className="text-xs text-foreground-muted">Aucune notification envoyée pour le moment.</p>
        ) : (
          <div className="divide-y divide-border">
            {order.notifications.map((notif) => (
              <div key={notif.id} className="flex items-center justify-between py-2 text-xs">
                <div className="flex items-center gap-2">
                  <StatusBadge status={notif.type === "shipment" ? "shipped" : "delivered"} />
                  <span className="text-foreground-muted">{notif.recipient_email}</span>
                </div>
                <span className="text-foreground-muted font-mono">
                  {new Date(notif.sent_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
