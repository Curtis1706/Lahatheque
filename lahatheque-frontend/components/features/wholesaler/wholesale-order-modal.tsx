"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Package,
  BookOpen,
  Truck,
  CheckCircle2,
  Building2,
  Phone,
  MapPin,
  ShieldCheck,
  Coins,
  FileCheck,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { createWholesalerOrder } from "@/lib/services/wholesaler";
import type { WholesalerBookItem } from "@/lib/types/wholesaler";
import { InlineLoader } from "@/components/ui/page-loader";

interface WholesaleOrderModalProps {
  book: WholesalerBookItem | null;
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess?: () => void;
}

export function WholesaleOrderModal({
  book,
  isOpen,
  onClose,
  onOrderSuccess,
}: WholesaleOrderModalProps) {
  const router = useRouter();

  const [format, setFormat] = useState<"paper" | "digital">("paper");
  const [paperQty, setPaperQty] = useState<number>(10);
  const [deliveryAddress, setDeliveryAddress] = useState("Zone Industrielle, Entrepôt Central, Cotonou");
  const [contactPhone, setContactPhone] = useState("+229 97 00 00 00");
  const [paymentMode, setPaymentMode] = useState<"deferred" | "immediate">("deferred");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !book) return null;

  const unitPaperPrice = book.print_wholesale_price;
  const unitDigitalPrice = book.digital_wholesale_price;
  const unitPrice = format === "paper" ? unitPaperPrice : unitDigitalPrice;
  const qty = format === "paper" ? paperQty : 1;
  const totalAmount = unitPrice * qty;

  const quickQuantities = [5, 10, 25, 50, 100];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (format === "paper" && (!deliveryAddress.trim() || !contactPhone.trim())) {
      toast.error("Veuillez renseigner l'adresse de livraison et le numéro de contact.");
      return;
    }
    if (format === "paper" && paperQty <= 0) {
      toast.error("Veuillez indiquer une quantité d'exemplaires papier valide.");
      return;
    }

    setSubmitting(true);
    try {
      const cartItem = {
        book_id: book.id,
        book,
        digital_licenses_qty: format === "digital" ? 1 : 0,
        print_copies_qty: format === "paper" ? paperQty : 0,
      };

      const order = await createWholesalerOrder(
        [cartItem],
        deliveryAddress.trim(),
        contactPhone.trim()
      );

      toast.success(`Commande ${order.reference || order.id} enregistrée avec succès !`);
      onClose();
      if (onOrderSuccess) onOrderSuccess();
      router.push(`/wholesaler/orders/${order.id}`);
    } catch (err: unknown) {
      console.error("Erreur commande grossiste :", err);
      toast.error(err instanceof Error ? err.message : "Erreur lors de la validation de la commande.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl bg-background rounded-3xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 bg-navy text-white flex items-center justify-between border-b border-navy-hover">
          <div className="flex items-center gap-3 min-w-0">
            <div className="size-10 rounded-2xl bg-gold/20 flex items-center justify-center text-gold shrink-0">
              <Package className="size-5" />
            </div>
            <div className="min-w-0">
              <h2 className="font-serif font-bold text-base text-white truncate">
                Commande Grossiste Directe
              </h2>
              <p className="text-xs text-white/70 truncate">
                Tarification B2B négociée • Facturation entreprise
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="size-8 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-navy-hover/50 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
          {/* Récapitulatif Titre */}
          <div className="p-3.5 rounded-2xl bg-background-secondary border border-border flex items-center gap-3">
            {book.cover_url ? (
              <img
                src={book.cover_url}
                alt={book.title}
                className="w-12 h-16 object-cover rounded-lg border border-border shrink-0 shadow-xs"
              />
            ) : (
              <div className="w-12 h-16 rounded-lg bg-navy/10 border border-border flex items-center justify-center shrink-0">
                <BookOpen className="size-6 text-gold" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="font-serif font-bold text-navy text-sm line-clamp-1 leading-snug">
                {book.title}
              </h3>
              <p className="text-foreground-muted text-[11px] truncate">
                Auteur(s) : {book.authors.join(", ")}
              </p>
              <p className="text-[10px] text-foreground-muted font-mono mt-0.5">
                ISBN : {book.isbn_digital} • {book.publisher_name}
              </p>
            </div>
          </div>

          {/* Sélecteur de format clair */}
          <div className="space-y-2">
            <label className="block text-[11px] font-bold text-navy uppercase tracking-wider">
              1. Choisissez le format commandé
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* Option Papier */}
              <button
                type="button"
                onClick={() => setFormat("paper")}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[90px] ${
                  format === "paper"
                    ? "bg-gold/10 border-gold shadow-xs"
                    : "bg-background-secondary border-border hover:border-gold/50"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold text-navy text-xs flex items-center gap-1.5">
                    <Truck className="size-3.5 text-gold" />
                    Exemplaires Papier
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gold/20 text-gold font-bold font-mono">
                    -{book.paper_discount_pct ?? 32}%
                  </span>
                </div>
                <div>
                  <p className="font-mono font-bold text-navy text-sm">
                    {book.print_wholesale_price.toLocaleString("fr-FR")} XOF
                  </p>
                  <p className="text-[10px] text-foreground-muted">par exemplaire physique</p>
                </div>
              </button>

              {/* Option Numérique */}
              <button
                type="button"
                onClick={() => setFormat("digital")}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[90px] ${
                  format === "digital"
                    ? "bg-gold/10 border-gold shadow-xs"
                    : "bg-background-secondary border-border hover:border-gold/50"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold text-navy text-xs flex items-center gap-1.5">
                    <BookOpen className="size-3.5 text-gold" />
                    Licence Numérique
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gold/20 text-gold font-bold font-mono">
                    -{book.digital_discount_pct ?? 25}%
                  </span>
                </div>
                <div>
                  <p className="font-mono font-bold text-navy text-sm">
                    {book.digital_wholesale_price.toLocaleString("fr-FR")} XOF
                  </p>
                  <p className="text-[10px] text-foreground-muted">1 licence d&apos;accès direct</p>
                </div>
              </button>
            </div>
          </div>

          {/* Quantité (uniquement si papier) */}
          {format === "paper" ? (
            <div className="space-y-2.5 p-4 rounded-2xl bg-background-secondary border border-border">
              <label className="block text-[11px] font-bold text-navy uppercase tracking-wider">
                2. Quantité d&apos;exemplaires papier
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {quickQuantities.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setPaperQty(q)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                      paperQty === q
                        ? "bg-navy text-white border-navy"
                        : "bg-background text-navy border-border hover:border-gold"
                    }`}
                  >
                    {q} ex.
                  </button>
                ))}
                <div className="flex items-center gap-2 ml-auto">
                  <span className="text-foreground-muted text-[11px]">Autre :</span>
                  <input
                    type="number"
                    min="1"
                    value={paperQty}
                    onChange={(e) => setPaperQty(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 px-2.5 py-1 rounded-xl bg-background border border-border font-mono font-bold text-navy text-xs text-center focus:outline-none focus:border-gold"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-background-secondary border border-border flex items-center justify-between text-xs">
              <span className="text-foreground-muted">Volume de licence :</span>
              <span className="font-semibold text-navy">1 unité d&apos;accès liseuse</span>
            </div>
          )}

          {/* Coordonnées de livraison si papier */}
          {format === "paper" && (
            <div className="space-y-3 p-4 rounded-2xl bg-background-secondary border border-border">
              <label className="block text-[11px] font-bold text-navy uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="size-3.5 text-gold" />
                3. Livraison &amp; Réception de la commande
              </label>

              <div className="space-y-2">
                <div>
                  <label className="block text-[10px] text-foreground-muted font-bold mb-1">
                    Adresse de l&apos;entrepôt / Librairie de destination :
                  </label>
                  <input
                    type="text"
                    required
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Ex: Entrepôt Principal, Cotonou..."
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border text-navy text-xs focus:outline-none focus:border-gold font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-foreground-muted font-bold mb-1">
                    Numéro de téléphone du responsable logistique :
                  </label>
                  <input
                    type="tel"
                    required
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="Ex: +229 97 00 00 00"
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border text-navy text-xs focus:outline-none focus:border-gold font-medium"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Modalité de règlement B2B */}
          <div className="space-y-2">
            <label className="block text-[11px] font-bold text-navy uppercase tracking-wider">
              {format === "paper" ? "4. Modalité de règlement" : "2. Modalité de règlement"}
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMode("deferred")}
                className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                  paymentMode === "deferred"
                    ? "bg-gold/10 border-gold text-navy font-bold"
                    : "bg-background-secondary border-border text-foreground-muted hover:border-gold/50"
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs">
                  <FileCheck className="size-3.5 text-gold" />
                  <span>Facturation B2B (30j)</span>
                </div>
                <p className="text-[10px] font-normal text-foreground-muted mt-0.5">
                  Sur compte partenaire grossiste
                </p>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode("immediate")}
                className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                  paymentMode === "immediate"
                    ? "bg-gold/10 border-gold text-navy font-bold"
                    : "bg-background-secondary border-border text-foreground-muted hover:border-gold/50"
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs">
                  <Coins className="size-3.5 text-gold" />
                  <span>Paiement Comptant</span>
                </div>
                <p className="text-[10px] font-normal text-foreground-muted mt-0.5">
                  Mobile Money / Virement direct
                </p>
              </button>
            </div>
          </div>

          {/* Récapitulatif financier */}
          <div className="p-4 rounded-2xl bg-navy text-white space-y-2">
            <div className="flex justify-between text-xs text-white/80">
              <span>{format === "paper" ? `Exemplaires papier (${qty} ex.)` : "Licence numérique (1 unité)"} :</span>
              <span className="font-mono font-bold text-white">
                {totalAmount.toLocaleString("fr-FR")} XOF
              </span>
            </div>
            <div className="flex justify-between items-center text-sm font-bold pt-2 border-t border-navy-hover">
              <span className="text-gold">Total Net à Payer :</span>
              <span className="font-mono text-gold text-base">
                {totalAmount.toLocaleString("fr-FR")} XOF
              </span>
            </div>
          </div>

          {/* Action Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-4 rounded-2xl bg-gold text-navy font-bold text-xs hover:bg-gold-light transition-colors flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50 min-h-[46px]"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <InlineLoader size={16} />
                <span>Transmission de la commande...</span>
              </span>
            ) : (
              <>
                <CheckCircle2 className="size-4" />
                <span>Valider la Commande ({totalAmount.toLocaleString("fr-FR")} XOF)</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
