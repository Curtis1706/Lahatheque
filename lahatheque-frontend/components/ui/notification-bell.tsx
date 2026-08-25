"use client";

import React, { useEffect, useRef, useState } from "react";
import { Bell, Check, ExternalLink } from "lucide-react";
import Link from "next/link";
import {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  type AppNotification,
} from "@/lib/services/notifications";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    async function poll() {
      const count = await getUnreadCount();
      if (mounted) setUnread(count);
    }
    poll();
    const interval = setInterval(poll, 60000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleOpen() {
    const nextState = !open;
    setOpen(nextState);
    if (nextState) {
      setLoading(true);
      const data = await getNotifications();
      setItems(data.slice(0, 8));
      setLoading(false);
    }
  }

  async function handleItemClick(n: AppNotification) {
    if (!n.is_read) {
      await markNotificationRead(n.id);
      setUnread((c) => Math.max(0, c - 1));
      setItems((prev) => prev.map((i) => (i.id === n.id ? { ...i, is_read: true } : i)));
    }
    setOpen(false);
  }

  async function handleMarkAll() {
    await markAllNotificationsRead();
    setUnread(0);
    setItems((prev) => prev.map((i) => ({ ...i, is_read: true })));
  }

  return (
    <div ref={ref} className="fixed top-3 right-3 z-40 sm:top-4 sm:right-4">
      <button
        type="button"
        onClick={handleOpen}
        className="relative w-10 h-10 rounded-full bg-navy text-white flex items-center justify-center shadow-lg hover:bg-navy-hover transition-all cursor-pointer border border-navy-hover focus:outline-none"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4 text-gold" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-error text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 max-w-[92vw] bg-background border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between px-4 py-3 bg-background-secondary border-b border-border">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold font-serif text-navy">Notifications</span>
              {unread > 0 && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-gold/20 text-navy">
                  {unread} non lue{unread > 1 ? "s" : ""}
                </span>
              )}
            </div>
            {unread > 0 && (
              <button
                type="button"
                onClick={handleMarkAll}
                className="text-[11px] text-navy font-bold flex items-center gap-1 hover:text-gold transition-colors cursor-pointer"
              >
                <Check className="w-3 h-3" />
                Tout marquer lu
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-border">
            {loading ? (
              <p className="p-6 text-center text-xs text-foreground-muted">Chargement des notifications...</p>
            ) : items.length === 0 ? (
              <p className="p-6 text-center text-xs text-foreground-muted">Aucune notification pour le moment.</p>
            ) : (
              items.map((n) => (
                <Link
                  key={n.id}
                  href={n.action_url || "/notifications"}
                  onClick={() => handleItemClick(n)}
                  className={`block px-4 py-3 hover:bg-background-secondary transition-colors ${
                    !n.is_read ? "bg-gold/10" : ""
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {!n.is_read ? (
                      <span className="w-2 h-2 rounded-full bg-gold mt-1.5 shrink-0" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-transparent mt-1.5 shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-navy truncate">
                        {n.title}
                      </p>
                      <p className="text-[11px] text-foreground-muted line-clamp-2 mt-0.5 leading-snug">
                        {n.message}
                      </p>
                      <span className="text-[9px] text-foreground-muted font-mono mt-1 block">
                        {new Date(n.created_at).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>

          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            className="block text-center py-2.5 text-xs font-bold text-navy bg-background-secondary hover:bg-navy hover:text-white transition-colors border-t border-border"
          >
            Voir toutes les notifications
          </Link>
        </div>
      )}
    </div>
  );
}
