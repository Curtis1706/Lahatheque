"use client";

import React, { useState } from "react";
import { PackageCheck, Truck, CheckCircle2, ShoppingBag } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import type { ClientBookAccess } from "@/lib/types/student";

interface PaperOrderModalProps {
  book: ClientBookAccess | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmOrder: (bookId: string, bookTitle: string, price: number, address: string) => Promise<void>;
}

export function PaperOrderModal({
  book,
  isOpen,
  onClose,
  onConfirmOrder,
}: PaperOrderModalProps) {
  const [shippingAddress, setShippingAddress] = useState("Quartier Zogbo, Cotonou, Bénin");
  const [submitting, setSubmitting] = useState(false);

  if (!book) return null;

  const paperPrice = book.paper_price || 15000;

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shippingAddress.trim()) return;

    setSubmitting(true);
    try {
      await onConfirmOrder(book.id, book.title, paperPrice, shippingAddress);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-navy font-serif font-bold text-base">
          <PackageCheck className="w-5 h-5 text-gold" />
          Commande d&apos;Exemplaire Papier Physique
        </div>
      }
      maxWidth={520}
    >
      <form onSubmit={handleConfirm} className="space-y-4 pt-2 text-xs">
        <div className="p-4 rounded-2xl bg-background-secondary border border-border space-y-2">
          <div className="flex justify-between font-bold text-navy">
            <span>Ouvrage sélectionné :</span>
            <span className="font-serif truncate max-w-[240px] text-right">{book.title}</span>
          </div>
          <div className="flex justify-between font-bold text-navy">
            <span>Prix Exemplaire Papier :</span>
            <span className="font-mono text-gold">{paperPrice.toLocaleString("fr-FR")} XOF</span>
          </div>
          <div className="flex justify-between text-[11px] text-foreground-muted border-t border-border pt-2">
            <span>Frais d&apos;expédition :</span>
            <span>Inclus (Livraison Standard)</span>
          </div>
        </div>

        <div>
          <label htmlFor="shipping-addr" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
            Adresse de Livraison Complète *
          </label>
          <textarea
            id="shipping-addr"
            required
            rows={3}
            value={shippingAddress}
            onChange={(e) => setShippingAddress(e.target.value)}
            placeholder="Nom du destinataire, Rue, Quartier, Ville, Pays, Téléphone"
            className="w-full p-3 text-xs bg-background border border-border rounded-xl font-semibold text-navy focus:outline-none focus:border-gold resize-none"
          />
        </div>

        <div className="p-3.5 rounded-2xl bg-gold/10 border border-gold/30 text-navy space-y-1">
          <p className="font-bold flex items-center gap-1.5">
            <Truck className="w-4 h-4 text-gold" />
            Expédition par le Gestionnaire de Stock :
          </p>
          <p className="text-[11px] text-foreground-muted">
            Votre commande sera traitée dans les 24-48h avec génération d&apos;un numéro de suivi d&apos;expédition.
          </p>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-foreground-muted hover:text-navy"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors inline-flex items-center gap-2 min-h-[44px] shadow-xs disabled:opacity-50"
          >
            {submitting ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <ShoppingBag className="w-4 h-4 text-gold" />
                Valider la Commande ({paperPrice.toLocaleString("fr-FR")} XOF)
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
