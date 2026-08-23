"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { X, ShoppingBag, BookOpen, Truck, Eye, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { createOrder } from "@/lib/services/commerce-orders";
import type { BookAPI } from "@/lib/services/student";

type Format = "digital" | "paper";

export function UnifiedBookOrderModal({
  book,
  onClose,
  onOpenSample,
  onDigitalPurchaseSuccess,
}: {
  book: BookAPI;
  onClose: () => void;
  onOpenSample?: () => void;
  onDigitalPurchaseSuccess?: () => void;
}) {
  const router = useRouter();
  const paperAvailable = Boolean(book.is_paper_available) && (book.price_paper ?? 0) > 0;

  const [format, setFormat] = useState<Format>("digital");
  const [quantity, setQuantity] = useState(1);
  const [shippingAddress, setShippingAddress] = useState("");
  const [modePaiement, setModePaiement] = useState<"mobile_money" | "virement" | "especes" | "carte">("mobile_money");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const unitPrice = format === "digital" ? (book.price_digital ?? 0) : (book.price_paper ?? 0);
  const shippingFee = format === "paper" ? 2500 : 0;
  const total = unitPrice * quantity + shippingFee;

  const authorsDisplay =
    book.authors && Array.isArray(book.authors) && book.authors.length > 0
      ? book.authors.map((a: any) => a.full_name || `${a.first_name || ""} ${a.last_name || ""}`.trim()).join(", ")
      : (book as any).author || "Auteur LAHA";

  async function handleSubmit() {
    if (format === "paper" && !shippingAddress.trim()) {
      toast.error("Veuillez renseigner votre adresse de livraison.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await createOrder({
        items: [{ ouvrage_id: book.id, format_type: format, quantity }],
        type_commande: "personnel",
        mode_paiement: modePaiement,
        shipping_address: format === "paper" ? shippingAddress : undefined,
        city: "Cotonou",
        country: "BJ",
      });

      if (result.payment_url) {
        window.location.href = result.payment_url;
        return;
      }

      if (format === "digital") {
        setSuccess(true);
        onDigitalPurchaseSuccess?.();
      } else {
        toast.success(`Commande papier enregistrée (${quantity} exemplaire${quantity > 1 ? "s" : ""}).`);
        onClose();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur lors de la commande.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-dark/70 backdrop-blur-xs p-4">
        <div className="bg-background border border-border rounded-3xl shadow-xl w-full max-w-sm p-6 text-center space-y-4">
          <CheckCircle2 className="w-12 h-12 text-success mx-auto" />
          <h3 className="font-serif text-lg font-bold text-navy">Achat confirmé !</h3>
          <p className="text-xs text-foreground-muted">
            « {book.title} » est maintenant disponible dans votre bibliothèque.
          </p>
          <div className="flex flex-col gap-2 pt-2">
            <button
              type="button"
              onClick={() => router.push(`/catalog/reader/${book.id}`)}
              className="w-full px-4 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors min-h-[40px] cursor-pointer"
            >
              Ouvrir la liseuse maintenant
            </button>
            <button
              type="button"
              onClick={() => router.push("/student/books")}
              className="w-full px-4 py-2.5 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-background-secondary transition-colors min-h-[40px] cursor-pointer"
            >
              Aller à Ma Bibliothèque
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-navy-dark/70 backdrop-blur-xs p-4">
      <div className="bg-background border border-border rounded-3xl shadow-xl w-full max-w-lg p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-serif text-lg font-bold text-navy line-clamp-2">{book.title}</h2>
            <p className="text-xs text-foreground-muted truncate">
              {authorsDisplay}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-background-secondary text-foreground-muted hover:text-navy transition-colors shrink-0"
            title="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {onOpenSample && (
          <button
            type="button"
            onClick={onOpenSample}
            className="text-[11px] text-gold font-semibold flex items-center gap-1.5 hover:underline cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            Feuilleter l&apos;extrait gratuit avant d&apos;acheter
          </button>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setFormat("digital")}
            className={`p-4 rounded-2xl border text-left space-y-1 transition-all cursor-pointer ${
              format === "digital" ? "border-gold bg-gold/10" : "border-border bg-background-secondary"
            }`}
          >
            <span className="text-xs font-bold text-navy flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-gold" />
              Numérique
            </span>
            <span className="block text-sm font-mono font-bold text-gold">
              {(book.price_digital ?? 0).toLocaleString("fr-FR")} XOF
            </span>
            <p className="text-[10px] text-foreground-muted">Accès immédiat dans votre bibliothèque.</p>
          </button>

          <button
            type="button"
            onClick={() => paperAvailable && setFormat("paper")}
            disabled={!paperAvailable}
            className={`p-4 rounded-2xl border text-left space-y-1 transition-all relative ${
              !paperAvailable
                ? "border-border bg-background-secondary opacity-50 cursor-not-allowed"
                : format === "paper"
                ? "border-gold bg-gold/10 cursor-pointer"
                : "border-border bg-background-secondary cursor-pointer"
            }`}
          >
            <span className="text-xs font-bold text-navy flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-navy" />
              Papier
            </span>
            {paperAvailable ? (
              <>
                <span className="block text-sm font-mono font-bold text-navy">
                  {(book.price_paper ?? 0).toLocaleString("fr-FR")} XOF
                </span>
                <p className="text-[10px] text-foreground-muted">Livraison sous 24-48h.</p>
              </>
            ) : (
              <span className="text-[10px] font-semibold text-foreground-muted block pt-1">
                Non disponible en version papier
              </span>
            )}
          </button>
        </div>

        {format === "paper" && (
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-background-secondary border border-border">
            <label className="text-[11px] font-bold text-navy uppercase tracking-wider flex-1">
              Quantité
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-8 h-8 rounded-lg border border-border bg-background flex items-center justify-center text-navy font-bold hover:bg-background-secondary transition-colors cursor-pointer"
              >
                -
              </button>
              <span className="w-8 text-center font-mono font-bold text-sm text-navy">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="w-8 h-8 rounded-lg border border-border bg-background flex items-center justify-center text-navy font-bold hover:bg-background-secondary transition-colors cursor-pointer"
              >
                +
              </button>
            </div>
          </div>
        )}

        {format === "paper" && (
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-navy uppercase tracking-wider">
              Adresse de livraison complète
            </label>
            <textarea
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              rows={2}
              placeholder="Quartier, rue, repère, ville, téléphone..."
              className="w-full px-3.5 py-2.5 text-xs border border-border rounded-2xl bg-background-secondary text-foreground focus:outline-none focus:border-navy resize-none"
            />
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-navy uppercase tracking-wider">
            Mode de règlement
          </label>
          <select
            value={modePaiement}
            onChange={(e) => setModePaiement(e.target.value as any)}
            className="w-full px-3.5 py-2.5 text-xs border border-border rounded-2xl bg-background-secondary text-foreground font-medium focus:outline-none focus:border-navy min-h-[40px]"
          >
            <option value="mobile_money">Mobile Money (MTN / Moov / Orange / Wave)</option>
            <option value="virement">Virement bancaire</option>
            <option value="especes">Espèces à la livraison</option>
            <option value="carte">Carte bancaire</option>
          </select>
        </div>

        <div className="p-3.5 rounded-2xl bg-navy/5 border border-navy/20 space-y-1 text-right">
          {format === "paper" && (
            <p className="text-[11px] text-foreground-muted">
              Frais de livraison : {shippingFee.toLocaleString("fr-FR")} XOF
            </p>
          )}
          <p className="text-sm font-bold text-gold">Total : {total.toLocaleString("fr-FR")} XOF</p>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full px-4 py-3 rounded-2xl bg-navy text-white text-xs font-bold hover:bg-navy-hover disabled:opacity-50 transition-colors flex items-center justify-center gap-2 min-h-[44px] shadow-sm cursor-pointer"
        >
          {submitting ? (
            <Loader2 className="w-4 h-4 animate-spin text-gold" />
          ) : (
            <ShoppingBag className="w-4 h-4 text-gold" />
          )}
          {format === "digital" ? "Acheter maintenant" : "Confirmer la commande"}
        </button>
      </div>
    </div>
  );
}
