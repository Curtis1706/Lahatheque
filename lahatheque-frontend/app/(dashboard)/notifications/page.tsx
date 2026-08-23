"use client";

import React, { useEffect, useState } from "react";
import { Bell, Check, ArrowLeft, ExternalLink, CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type AppNotification,
} from "@/lib/services/notifications";

export default function NotificationsPage() {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await getNotifications();
      setItems(data);
      setLoading(false);
    }
    load();
  }, []);

  async function handleClick(n: AppNotification) {
    if (!n.is_read) {
      await markNotificationRead(n.id);
      setItems((prev) => prev.map((i) => (i.id === n.id ? { ...i, is_read: true } : i)));
    }
  }

  async function handleMarkAll() {
    await markAllNotificationsRead();
    setItems((prev) => prev.map((i) => ({ ...i, is_read: true })));
  }

  const unreadCount = items.filter((i) => !i.is_read).length;

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 md:p-8 space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2.5 rounded-xl border border-border bg-background hover:bg-background-secondary text-navy transition-colors flex items-center justify-center min-h-[40px] min-w-[40px]"
            title="Retour à l'accueil"
          >
            <ArrowLeft className="w-4 h-4 text-navy" />
          </Link>
          <div>
            <h1 className="font-serif text-xl sm:text-2xl font-bold text-navy flex items-center gap-2">
              <Bell className="w-5 h-5 text-gold" />
              Centre de Notifications
            </h1>
            <p className="text-xs text-foreground-muted mt-0.5">
              {unreadCount > 0
                ? `${unreadCount} notification${unreadCount > 1 ? "s" : ""} non lue${unreadCount > 1 ? "s" : ""}`
                : "Toutes vos notifications sont à jour"}
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAll}
            className="text-xs font-bold text-navy border border-border bg-background hover:border-gold hover:text-gold rounded-xl px-3.5 py-2.5 transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer min-h-[40px]"
          >
            <Check className="w-3.5 h-3.5" />
            Tout marquer lu
          </button>
        )}
      </div>

      {/* Liste des notifications */}
      <div className="bg-background border border-border rounded-3xl divide-y divide-border overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-8 text-center space-y-2">
            <Clock className="w-6 h-6 text-gold animate-spin mx-auto" />
            <p className="text-xs text-foreground-muted">Chargement des notifications...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Bell className="w-10 h-10 text-foreground-muted mx-auto" />
            <h3 className="font-serif font-bold text-navy text-base">Aucune notification</h3>
            <p className="text-xs text-foreground-muted max-w-sm mx-auto">
              Vous n&apos;avez aucune notification pour le moment. Vos alertes système, commandes et dépôts apparaîtront ici.
            </p>
          </div>
        ) : (
          items.map((n) => (
            <Link
              key={n.id}
              href={n.action_url || "#"}
              onClick={() => handleClick(n)}
              className={`block p-4 sm:p-5 hover:bg-background-secondary transition-colors ${
                !n.is_read ? "bg-gold/5" : ""
              }`}
            >
              <div className="flex items-start gap-3">
                {!n.is_read ? (
                  <span className="w-2.5 h-2.5 rounded-full bg-gold mt-1.5 shrink-0 shadow-xs" />
                ) : (
                  <span className="w-2.5 h-2.5 rounded-full bg-transparent mt-1.5 shrink-0" />
                )}

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs sm:text-sm font-bold text-navy truncate">
                      {n.title}
                    </p>
                    <span className="text-[10px] text-foreground-muted font-mono shrink-0">
                      {new Date(n.created_at).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <p className="text-xs text-foreground-muted leading-relaxed">
                    {n.message}
                  </p>

                  {n.action_url && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-navy hover:text-gold pt-1">
                      Accéder à la ressource <ExternalLink className="w-3 h-3" />
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
