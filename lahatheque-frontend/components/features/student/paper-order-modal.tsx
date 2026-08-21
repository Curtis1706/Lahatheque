"use client";

import React, { useState } from "react";
import { PackageCheck, Truck, ShoppingBag, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import type { ClientBookAccess } from "@/lib/types/student";
import { BookCover } from "./book-cover";

interface PaperOrderModalProps {
  book: (Partial<ClientBookAccess> & { id: string; title: string; author?: string; price_paper?: number; paper_price?: number }) | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmOrder: (bookId: string, bookTitle: string, price: number, address: string, quantity: number) => Promise<void>;
}

export function PaperOrderModal({
  book,
  isOpen,
  onClose,
  onConfirmOrder,
}: PaperOrderModalProps) {
  const [shippingAddress, setShippingAddress] = useState("Campus Universitaire d'Abomey-Calavi, Résidence Hassan II, Chambre B-14, Cotonou, Bénin");
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  if (!book) return null;

  const unitPrice = book.price_paper || book.paper_price || 15000;
  const shippingFee = 2500;
  const totalPrice = unitPrice * quantity + shippingFee;
  const authorName = book.author || "Auteur académique";

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shippingAddress.trim()) {
      toast.error("Veuillez renseigner votre adresse de livraison complète.");
      return;
    }

    setSubmitting(true);
    try {
      await onConfirmOrder(book.id, book.title, unitPrice, shippingAddress, quantity);
      toast.success(`Commande de ${quantity} exemplaire(s) enregistrée avec succès !`);
      onClose();
    } catch {
      toast.error("Une erreur est survenue lors de l'enregistrement de votre commande.");
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
      maxWidth={560}
    >
      <form onSubmit={handleConfirm} className="space-y-4 pt-2 text-xs">
        {/* Book Preview Header */}
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-background-secondary border border-border">
          <BookCover book={book} size="sm" />
          <div className="min-w-0 space-y-1">
            <h3 className="font-serif font-bold text-navy text-sm line-clamp-2">{book.title}</h3>
            <p className="text-xs text-foreground-muted truncate">Par {authorName}</p>
            <p className="text-xs font-mono font-bold text-gold">
              Prix unitaire : {unitPrice.toLocaleString("fr-FR")} XOF
            </p>
          </div>
        </div>

        {/* Quantité & Calcul du montant */}
        <div className="p-4 rounded-2xl bg-background-secondary border border-border space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="qty-input" className="font-bold text-navy">Quantité d&apos;exemplaires :</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-7 h-7 rounded-lg border border-border bg-background text-navy font-bold hover:bg-navy/5 flex items-center justify-center"
              >
                -
              </button>
              <span id="qty-input" className="font-mono font-bold text-navy w-6 text-center">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                className="w-7 h-7 rounded-lg border border-border bg-background text-navy font-bold hover:bg-navy/5 flex items-center justify-center"
              >
                +
              </button>
            </div>
          </div>

          <div className="flex justify-between text-foreground-muted pt-1 border-t border-border">
            <span>Sous-total ({quantity} ex.) :</span>
            <span className="font-mono">{(unitPrice * quantity).toLocaleString("fr-FR")} XOF</span>
          </div>
          <div className="flex justify-between text-foreground-muted">
            <span>Frais d&apos;expédition &amp; Logistique :</span>
            <span className="font-mono">{shippingFee.toLocaleString("fr-FR")} XOF</span>
          </div>
          <div className="flex justify-between text-sm font-bold text-navy pt-2 border-t border-border">
            <span>Total TTC à régler :</span>
            <span className="font-mono text-gold">{totalPrice.toLocaleString("fr-FR")} XOF</span>
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
            placeholder="Nom du destinataire, Département/Faculté ou Rue, Ville, Pays, Téléphone"
            className="w-full p-3 text-xs bg-background border border-border rounded-xl font-semibold text-navy focus:outline-none focus:border-gold resize-none"
          />
        </div>

        <div className="p-3.5 rounded-2xl bg-gold/10 border border-gold/30 text-navy space-y-1">
          <p className="font-bold flex items-center gap-1.5">
            <Truck className="w-4 h-4 text-gold" />
            Expédition par le Gestionnaire de Stock :
          </p>
          <p className="text-[11px] text-foreground-muted">
            Votre colis sera préparé dans les 24-48h avec génération d&apos;un numéro de suivi DHL / Colis Express.
          </p>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-foreground-muted hover:text-navy min-h-[40px]"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 rounded-xl bg-gold text-navy text-xs font-bold hover:bg-gold-light transition-all flex items-center gap-2 shadow-xs min-h-[40px] disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ShoppingBag className="w-4 h-4" />
            )}
            {submitting ? "Validation..." : "Valider la Commande"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
