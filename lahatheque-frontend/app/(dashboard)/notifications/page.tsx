"use client";

import React, { useEffect, useState } from "react";
import {
  Bell,
  Check,
  ArrowLeft,
  ExternalLink,
  Clock,
  FileText,
  Sparkles,
  Layers,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
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
  const [filter, setFilter] = useState<"all" | "unread" | "contracts" | "royalties" | "pre_editions">("all");

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

  const filteredItems = items.filter((n) => {
    if (filter === "unread") return !n.is_read;
    if (filter === "contracts") return n.action_url?.includes("/contracts") || n.title.toLowerCase().includes("contrat");
    if (filter === "royalties") return n.action_url?.includes("/royalties") || n.action_url?.includes("/relances") || n.title.toLowerCase().includes("redevance") || n.title.toLowerCase().includes("impay");
    if (filter === "pre_editions") return n.action_url?.includes("/pre-editions") || n.title.toLowerCase().includes("pré-édition") || n.title.toLowerCase().includes("pre-edition");
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 md:p-8 space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div className="flex items-center gap-3">
          <Link
            href="/legal-reviewer"
            className="p-2.5 rounded-xl border border-border bg-background hover:bg-background-secondary text-navy transition-colors flex items-center justify-center min-h-[44px] min-w-[44px]"
            title="Retour au tableau de bord"
          >
            <ArrowLeft className="w-4 h-4 text-navy" />
          </Link>
          <div>
            <h1 className="font-serif text-xl sm:text-2xl font-bold text-navy flex items-center gap-2">
              <Bell className="w-5 h-5 text-gold" />
              Centre de Notifications & Alertes
            </h1>
            <p className="text-xs text-foreground-muted mt-0.5">
              {unreadCount > 0
                ? `${unreadCount} alerte${unreadCount > 1 ? "s" : ""} non lue${unreadCount > 1 ? "s" : ""} nécessitant votre attention`
                : "Toutes vos notifications sont à jour"}
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAll}
            className="self-start sm:self-auto text-xs font-bold text-navy border border-border bg-background hover:border-gold hover:text-gold rounded-xl px-4 py-2.5 transition-colors flex items-center gap-2 shadow-xs cursor-pointer min-h-[44px]"
          >
            <Check className="w-4 h-4 text-gold" />
            Tout marquer lu
          </button>
        )}
      </div>

      {/* Filtres de catégories */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors min-h-[40px] cursor-pointer ${
            filter === "all"
              ? "bg-navy text-white shadow-xs"
              : "bg-background-secondary text-foreground-muted hover:text-navy border border-border"
          }`}
        >
          Toutes ({items.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter("unread")}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors min-h-[40px] cursor-pointer ${
            filter === "unread"
              ? "bg-navy text-white shadow-xs"
              : "bg-background-secondary text-foreground-muted hover:text-navy border border-border"
          }`}
        >
          Non lues ({unreadCount})
        </button>
        <button
          type="button"
          onClick={() => setFilter("contracts")}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors min-h-[40px] flex items-center gap-1.5 cursor-pointer ${
            filter === "contracts"
              ? "bg-navy text-white shadow-xs"
              : "bg-background-secondary text-foreground-muted hover:text-navy border border-border"
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-gold" />
          Contrats
        </button>
        <button
          type="button"
          onClick={() => setFilter("royalties")}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors min-h-[40px] flex items-center gap-1.5 cursor-pointer ${
            filter === "royalties"
              ? "bg-navy text-white shadow-xs"
              : "bg-background-secondary text-foreground-muted hover:text-navy border border-border"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-gold" />
          Droits & Recouvrement
        </button>
        <button
          type="button"
          onClick={() => setFilter("pre_editions")}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors min-h-[40px] flex items-center gap-1.5 cursor-pointer ${
            filter === "pre_editions"
              ? "bg-navy text-white shadow-xs"
              : "bg-background-secondary text-foreground-muted hover:text-navy border border-border"
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-gold" />
          Pré-éditions
        </button>
      </div>

      {/* Liste des notifications */}
      <div className="bg-background border border-border rounded-3xl divide-y divide-border overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-10 text-center space-y-2">
            <Clock className="w-6 h-6 text-gold animate-spin mx-auto" />
            <p className="text-xs text-foreground-muted font-medium">Chargement des notifications en temps réel...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-gold mx-auto" />
            <h3 className="font-serif font-bold text-navy text-base">Aucune notification dans cette vue</h3>
            <p className="text-xs text-foreground-muted max-w-sm mx-auto">
              Vous êtes parfaitement à jour. Toutes les alertes juridiques, relances et échéances apparaîtront ici.
            </p>
          </div>
        ) : (
          filteredItems.map((n) => (
            <Link
              key={n.id}
              href={n.action_url || "#"}
              onClick={() => handleClick(n)}
              className={`block p-4 sm:p-5 hover:bg-background-secondary transition-colors ${
                !n.is_read ? "bg-gold/10" : ""
              }`}
            >
              <div className="flex items-start gap-3.5">
                {!n.is_read ? (
                  <span className="w-2.5 h-2.5 rounded-full bg-gold mt-1.5 shrink-0 shadow-xs" />
                ) : (
                  <span className="w-2.5 h-2.5 rounded-full bg-transparent mt-1.5 shrink-0" />
                )}

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <p className="text-xs sm:text-sm font-bold text-navy truncate">
                      {n.title}
                    </p>
                    <span className="text-[10px] text-foreground-muted font-mono shrink-0">
                      {new Date(n.created_at).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <p className="text-xs text-foreground leading-relaxed">
                    {n.message}
                  </p>

                  {n.action_url && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-navy hover:text-gold pt-1.5 transition-colors">
                      Traiter le dossier <ExternalLink className="w-3.5 h-3.5 text-gold" />
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

