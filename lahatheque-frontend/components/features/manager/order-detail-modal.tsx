"use client";

import React from "react";
import {
  X,
  Package,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  CreditCard,
  Truck,
  BookOpen,
  CheckCircle2,
  Printer,
  ExternalLink,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import type { ManagerOrder } from "@/lib/types/manager";

interface OrderDetailModalProps {
  order: ManagerOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onShip?: (order: ManagerOrder) => void;
  onDeliver?: (order: ManagerOrder) => void;
}

export function OrderDetailModal({
  order,
  isOpen,
  onClose,
  onShip,
  onDeliver,
}: OrderDetailModalProps) {
  if (!isOpen || !order) return null;

  const totalQuantity = order.items.reduce((s, i) => s + (i.quantity || 1), 0);
  const totalAmount =
    order.total_amount ||
    order.items.reduce(
      (s, i) => s + (i.total_price || (i.unit_price || 0) * (i.quantity || 1)),
      0
    );

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-in fade-in duration-200"
    >
      <div
        className="w-full max-w-3xl bg-background rounded-3xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-navy text-white flex items-center justify-between border-b border-navy-hover shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gold/20 text-gold">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-serif font-bold text-base sm:text-lg text-white">
                  Détail de la Commande
                </h2>
                <span className="font-mono text-xs text-gold font-bold">
                  #{order.id.slice(0, 13)}
                </span>
              </div>
              <p className="text-xs text-navy-light mt-0.5">
                Passée le{" "}
                {new Date(order.order_date).toLocaleDateString("fr-FR", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <StatusBadge status={order.status} />
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors ml-2 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Grille Informations Client & Logistique */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Destinataire */}
            <div className="p-4 rounded-2xl bg-background-secondary border border-border space-y-3">
              <div className="flex items-center gap-2 border-b border-border pb-2">
                <User className="w-4 h-4 text-gold" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-navy">
                  Informations Client
                </h3>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-foreground-muted block text-[10px]">Nom complet</span>
                  <p className="font-bold text-foreground">{order.customer_name}</p>
                </div>

                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-foreground-muted shrink-0" />
                  <span className="text-foreground truncate">{order.customer_email}</span>
                </div>

                {order.customer_phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-gold shrink-0" />
                    <span className="font-mono font-bold text-navy">{order.customer_phone}</span>
                  </div>
                )}

                <div className="flex items-start gap-2 pt-1 border-t border-border">
                  <MapPin className="w-3.5 h-3.5 text-gold mt-0.5 shrink-0" />
                  <div>
                    <span className="text-foreground-muted block text-[10px]">Adresse de livraison</span>
                    <p className="text-foreground font-medium leading-tight">
                      {order.shipping_address || "Non spécifiée"}
                    </p>
                    <p className="text-foreground-muted text-[11px]">
                      {order.city} — {order.country}
                    </p>
                  </div>
                </div>

                {order.date_livraison_souhaitee && (
                  <div className="flex items-center gap-2 pt-1 border-t border-border text-[11px] text-navy font-medium">
                    <Calendar className="w-3.5 h-3.5 text-gold shrink-0" />
                    <span>
                      Date souhaitée : {new Date(order.date_livraison_souhaitee).toLocaleDateString("fr-FR")}
                      {order.plage_horaire_debut && ` (${order.plage_horaire_debut} - ${order.plage_horaire_fin})`}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Expédition & Logistique */}
            <div className="p-4 rounded-2xl bg-background-secondary border border-border space-y-3">
              <div className="flex items-center gap-2 border-b border-border pb-2">
                <Truck className="w-4 h-4 text-gold" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-navy">
                  Expédition &amp; Règlement
                </h3>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-foreground-muted text-[10px]">Statut Envoi</span>
                  <StatusBadge status={order.status} />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-foreground-muted text-[10px]">Transporteur</span>
                  <span className="font-semibold text-navy">
                    {order.carrier || "En attente d'affectation"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-foreground-muted text-[10px]">N° Suivi</span>
                  <span className="font-mono font-bold text-foreground">
                    {order.tracking_number || "—"}
                  </span>
                </div>

                <div className="pt-2 border-t border-border flex items-center justify-between">
                  <span className="text-foreground-muted text-[10px]">Règlement</span>
                  <span className="text-xs font-bold text-success flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {order.statut_paiement === "paid" ? "Payé" : "En attente"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-foreground-muted text-[10px]">Mode de paiement</span>
                  <span className="font-semibold text-navy uppercase text-[10px] px-2 py-0.5 rounded bg-background border border-border">
                    {order.mode_paiement || "Mobile Money"}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-foreground-muted text-[10px]">Montant Total TTC</span>
                  <span className="font-mono font-bold text-sm text-navy">
                    {totalAmount.toLocaleString("fr-FR")} XOF
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Liste complète des articles commandés */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h3 className="font-serif font-bold text-sm text-navy flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-gold" />
                Articles Physiques Commandés ({totalQuantity} exemplaire{totalQuantity > 1 ? "s" : ""})
              </h3>
              <span className="text-xs font-bold text-foreground-muted">
                {order.items.length} référence{order.items.length > 1 ? "s" : ""}
              </span>
            </div>

            {order.items.length === 0 ? (
              <div className="p-6 rounded-2xl bg-background-secondary border border-border text-center text-xs text-foreground-muted">
                Aucun article physique associé à cette livraison.
              </div>
            ) : (
              <div className="divide-y divide-border border border-border rounded-2xl overflow-hidden bg-background">
                {order.items.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="p-4 flex items-center justify-between gap-4 hover:bg-background-secondary/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Vignette couverture */}
                      <div className="w-12 h-16 rounded-lg bg-navy/5 border border-border overflow-hidden shrink-0 relative shadow-2xs">
                        {item.cover_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.cover_url}
                            alt={item.book_title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-foreground-muted text-[9px]">
                            <BookOpen className="w-4 h-4 text-gold" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <h4 className="font-serif font-bold text-xs sm:text-sm text-navy line-clamp-1">
                          {item.book_title}
                        </h4>
                        <p className="text-[10px] text-foreground-muted font-mono mt-0.5">
                          ISBN : {item.isbn || "—"}
                        </p>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-gold/15 text-navy">
                          Format Papier Physique
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold text-navy font-mono">
                        {(item.total_price || (item.unit_price || 0) * (item.quantity || 1)).toLocaleString("fr-FR")} XOF
                      </div>
                      <div className="text-[10px] text-foreground-muted font-mono">
                        {item.quantity || 1} ex. × {(item.unit_price || 0).toLocaleString("fr-FR")} XOF
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-background-secondary border-t border-border flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2.5 rounded-xl border border-border bg-background text-navy text-xs font-bold hover:border-gold transition-colors flex items-center gap-1.5 min-h-[40px] cursor-pointer"
          >
            <Printer className="w-4 h-4 text-navy" />
            Imprimer Bon
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-border text-navy text-xs font-bold hover:bg-background transition-colors min-h-[40px] cursor-pointer"
            >
              Fermer
            </button>

            {order.status === "to_ship" && onShip && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onShip(order);
                }}
                className="px-5 py-2.5 rounded-xl bg-navy hover:bg-navy-hover text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 min-h-[40px] cursor-pointer"
              >
                <Truck className="w-4 h-4 text-gold" />
                Expédier la Commande
              </button>
            )}

            {order.status === "shipped" && onDeliver && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onDeliver(order);
                }}
                className="px-5 py-2.5 rounded-xl bg-success hover:opacity-90 text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 min-h-[40px] cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-white" />
                Marquer comme Livrée
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
