"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { BellRing, ArrowLeft, Sparkles, TrendingUp, BookOpen, ShoppingCart, CheckCircle2 } from "lucide-react";
import { getWholesalerNotifications, markNotificationAsRead } from "@/lib/services/wholesaler";
import type { WholesalerNotification } from "@/lib/types/wholesaler";

export default function WholesalerNotificationsPage() {
  const [notifications, setNotifications] = useState<WholesalerNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await getWholesalerNotifications();
      setNotifications(data);
      setLoading(false);
    }
    loadData();
  }, []);

  const handleMarkRead = async (id: string) => {
    const success = await markNotificationAsRead(id);
    if (success) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    }
  };

  const nouveautes = notifications.filter((n) => n.type === "nouveaute");
  const meilleuresVentes = notifications.filter((n) => n.type === "meilleure_vente");

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-8 max-w-6xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/wholesaler" className="hover:text-navy">Vue d&apos;ensemble</Link>
        <span>/</span>
        <span className="text-navy font-semibold">Nouveautés &amp; Meilleures Ventes</span>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/wholesaler" className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Vue d&apos;ensemble
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
            <BellRing className="w-4 h-4 text-gold" />
            Alertes Automatiques du Catalogue (Section 4.1)
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Nouveautés &amp; Meilleures Ventes
          </h1>
          <p className="text-xs text-foreground-muted mt-1">
            Restez informé des nouvelles parutions et des succès d&apos;édition pour orienter vos choix d&apos;achat en gros.
          </p>
        </div>
      </div>

      {/* Section 1: Nouveautés Recentes */}
      <div className="space-y-4">
        <h3 className="font-serif font-bold text-navy text-base flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-gold" />
          Nouvelles Parutions en Catalogue ({nouveautes.length})
        </h3>

        <div className="space-y-3">
          {nouveautes.map((n) => (
            <div
              key={n.id}
              className={`p-5 rounded-3xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs ${
                n.is_read ? "bg-background border-border" : "bg-gold/5 border-gold/40"
              }`}
            >
              <div className="flex items-center gap-4">
                <img
                  src={n.cover_url}
                  alt={n.book_title}
                  className="w-12 h-16 object-cover rounded-xl border border-border shrink-0 shadow-xs"
                />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-navy">{n.title}</span>
                    {!n.is_read && (
                      <span className="px-2 py-0.5 rounded-full bg-gold text-navy text-[9px] font-bold">
                        Nouveau !
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-foreground-muted">{n.description}</p>
                  <p className="text-[10px] font-mono text-gold font-bold">
                    Tarif Grossiste : {n.wholesale_price.toLocaleString("fr-FR")} XOF / u
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                {!n.is_read && (
                  <button
                    type="button"
                    onClick={() => handleMarkRead(n.id)}
                    className="p-2 rounded-xl bg-background-secondary border border-border hover:border-gold transition-colors text-foreground-muted text-xs font-bold"
                    title="Marquer comme lu"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                )}
                <Link
                  href="/wholesaler/catalog"
                  className="px-4 py-2 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors inline-flex items-center gap-1.5 shadow-xs min-h-[38px]"
                >
                  <ShoppingCart className="w-3.5 h-3.5 text-gold" />
                  Commander en Gros
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: Meilleures Ventes */}
      <div className="space-y-4 pt-4 border-t border-border">
        <h3 className="font-serif font-bold text-navy text-base flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-600" />
          Meilleures Ventes du Catalogue ({meilleuresVentes.length})
        </h3>

        <div className="space-y-3">
          {meilleuresVentes.map((n) => (
            <div
              key={n.id}
              className="p-5 rounded-3xl bg-background border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
            >
              <div className="flex items-center gap-4">
                <img
                  src={n.cover_url}
                  alt={n.book_title}
                  className="w-12 h-16 object-cover rounded-xl border border-border shrink-0 shadow-xs"
                />
                <div className="space-y-1">
                  <span className="font-bold text-xs text-navy block">{n.title}</span>
                  <p className="text-xs text-foreground-muted">{n.description}</p>
                  <p className="text-[10px] font-mono text-gold font-bold">
                    Tarif Grossiste : {n.wholesale_price.toLocaleString("fr-FR")} XOF / u
                  </p>
                </div>
              </div>

              <Link
                href="/wholesaler/catalog"
                className="px-4 py-2 rounded-xl bg-gold text-navy text-xs font-bold hover:bg-gold-light transition-colors inline-flex items-center gap-1.5 shadow-xs min-h-[38px] shrink-0 self-start sm:self-center"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                Commander en Gros
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
