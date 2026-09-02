"use client";

import React, { useEffect } from "react";
import { X, Printer, BookOpen, MapPin, ShoppingBag, ShieldCheck, Download } from "lucide-react";
import { StudentOrder } from "@/lib/types/student-orders";

interface OrderDetailModalProps {
  order: StudentOrder | null;
  isOpen: boolean;
  onClose: () => void;
}

export function OrderDetailModal({ order, isOpen, onClose }: OrderDetailModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !order) return null;

  const totalNumber = typeof order.total_amount === "string" ? parseFloat(order.total_amount) : order.total_amount;
  const subtotal = totalNumber / 1.18; // Simulating 18% VAT included
  const vat = totalNumber - subtotal;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-dark/70 animate-in fade-in duration-200">
      <div className="bg-background border border-border w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-border bg-background-secondary flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-navy text-gold rounded-xl border border-navy-hover">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-navy">Reçu de Commande #{order.id.substring(0, 12)}</h2>
              <p className="text-xs text-foreground-muted">
                Émis le {new Date(order.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-foreground-muted hover:text-navy hover:bg-background rounded-full transition-colors"
            aria-label="Fermer la modale"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
          
          {/* Status & Payment badge */}
          <div className="flex items-center justify-between bg-navy/5 border border-navy/10 p-4 rounded-2xl">
            <div>
              <span className="text-[10px] uppercase font-bold text-foreground-muted block">Mode de Règlement</span>
              <span className="font-bold text-navy text-sm">Paiement Mobile Money / Carte SSL</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-foreground-muted block">Statut Règlement</span>
              <span className={`inline-block px-2.5 py-1 rounded-full font-bold text-[10px] uppercase border ${
                order.statut_paiement === 'paid' 
                  ? 'bg-success/10 text-success border-success/30' 
                  : 'bg-gold/10 text-gold-dark border-gold/30'
              }`}>
                {order.statut_paiement === 'paid' ? 'Paiement Validé' : order.statut_paiement}
              </span>
            </div>
          </div>

          {/* Lignes d'articles */}
          <div className="space-y-3">
            <h3 className="font-bold text-navy uppercase tracking-wider text-[11px]">Détail des Ouvrages Commandés</h3>
            <div className="border border-border rounded-2xl overflow-hidden divide-y divide-border">
              {order.lignes?.map((item) => (
                <div key={item.id} className="p-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <BookOpen className="w-4 h-4 text-navy shrink-0" />
                    <div className="min-w-0">
                      <p className="font-bold text-navy truncate">{item.ouvrage_title}</p>
                      <p className="text-[10px] text-foreground-muted">
                        Format: {item.format_type === 'digital' ? 'Numérique (Consultation immédiate)' : 'Livre Papier de référence'} (x{item.quantity})
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-navy shrink-0">
                    {(typeof item.unit_price === 'string' ? parseFloat(item.unit_price) : item.unit_price).toLocaleString("fr-FR")} FCFA
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Adresse si livraison physique */}
          {order.livraison && (
            <div className="space-y-2">
              <h3 className="font-bold text-navy uppercase tracking-wider text-[11px]">Coordonnées de Livraison Physique</h3>
              <div className="bg-background-secondary p-3.5 rounded-2xl border border-border flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-navy shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-navy">{order.livraison.shipping_address}</p>
                  <p className="text-foreground-muted text-[11px]">{order.livraison.city}, {order.livraison.country}</p>
                </div>
              </div>
            </div>
          )}

          {/* Totaux & Taxes */}
          <div className="border-t border-border pt-4 space-y-2">
            <div className="flex justify-between text-foreground-muted">
              <span>Sous-total HT</span>
              <span>{Math.round(subtotal).toLocaleString("fr-FR")} FCFA</span>
            </div>
            <div className="flex justify-between text-foreground-muted">
              <span>TVA (18% incluse)</span>
              <span>{Math.round(vat).toLocaleString("fr-FR")} FCFA</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-navy pt-2 border-t border-border">
              <span>Montant Total TTC</span>
              <span className="text-gold-dark font-serif text-base">{totalNumber.toLocaleString("fr-FR")} FCFA</span>
            </div>
          </div>

        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 border-t border-border bg-background-secondary flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-[11px] text-foreground-muted">
            <ShieldCheck className="w-4 h-4 text-success shrink-0" />
            Document officiel LAHA Éditions
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-4 py-2.5 rounded-xl border border-border hover:bg-background text-navy font-bold flex items-center gap-2 transition-colors"
            >
              <Printer className="w-4 h-4" />
              Imprimer
            </button>
            <button
              onClick={() => alert("Téléchargement du reçu PDF officiel en cours...")}
              className="px-4 py-2.5 rounded-xl bg-navy hover:bg-navy-hover text-white font-bold flex items-center gap-2 transition-colors shadow"
            >
              <Download className="w-4 h-4 text-gold" />
              Télécharger Reçu
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
