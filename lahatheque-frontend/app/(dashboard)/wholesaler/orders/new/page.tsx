"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ShoppingCart, CheckCircle2, ShieldCheck, Building2, MapPin, Phone, Send } from "lucide-react";
import { createWholesalerOrder } from "@/lib/services/wholesaler";
import { mockWholesalerBooks } from "@/lib/mock/wholesaler";

export default function NewWholesalerOrderPage() {
  const router = useRouter();
  const [deliveryAddress, setDeliveryAddress] = useState("Avenue Steinmetz, Carré 122, Cotonou, Bénin");
  const [contactPhone, setContactPhone] = useState("+229 97 00 11 22");
  const [submitting, setSubmitting] = useState(false);

  // Exemple d'articles du panier à valider
  const cartItems = [
    {
      book_id: mockWholesalerBooks[0].id,
      book: mockWholesalerBooks[0],
      digital_licenses_qty: 50,
      print_copies_qty: 30,
    },
    {
      book_id: mockWholesalerBooks[1].id,
      book: mockWholesalerBooks[1],
      digital_licenses_qty: 50,
      print_copies_qty: 20,
    },
  ];

  const totalDigitalSubtotal = cartItems.reduce(
    (acc, ci) => acc + ci.digital_licenses_qty * ci.book.digital_wholesale_price,
    0
  );
  const totalPrintSubtotal = cartItems.reduce(
    (acc, ci) => acc + ci.print_copies_qty * ci.book.print_wholesale_price,
    0
  );
  const totalAmount = totalDigitalSubtotal + totalPrintSubtotal;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliveryAddress || !contactPhone) return;

    setSubmitting(true);
    try {
      const newOrder = await createWholesalerOrder(cartItems, deliveryAddress, contactPhone);
      alert(`Commande groupée ${newOrder.reference} transmise avec succès ! Elle entre en validation administrateur.`);
      router.push(`/wholesaler/orders/${newOrder.id}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/wholesaler" className="hover:text-navy">Vue d&apos;ensemble</Link>
        <span>/</span>
        <Link href="/wholesaler/orders" className="hover:text-navy">Commandes</Link>
        <span>/</span>
        <span className="text-navy font-semibold">Nouvelle Commande</span>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-4">
        <Link href="/wholesaler/catalog" className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-2">
          <ArrowLeft className="w-3.5 h-3.5" />
          Retour au Catalogue Grossiste
        </Link>
        <h1 className="font-serif text-2xl font-bold text-navy">
          Validation &amp; Soumission de Commande Groupée
        </h1>
        <p className="text-xs text-foreground-muted mt-1">
          Vérifiez le récapitulatif de votre panier d&apos;achat en gros (licences numériques + papier) et vos coordonnées de livraison.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Récapitulatif du Panier */}
        <div className="p-6 rounded-3xl bg-background border border-border space-y-4 shadow-xs">
          <h3 className="font-serif font-bold text-navy text-sm uppercase tracking-wider flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-gold" />
            Récapitulatif des Articles Sélectionnés
          </h3>

          <div className="space-y-3">
            {cartItems.map((ci) => (
              <div key={ci.book_id} className="p-4 rounded-2xl bg-background-secondary border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <img
                    src={ci.book.cover_url}
                    alt={ci.book.title}
                    className="w-10 h-14 object-cover rounded-lg border border-border shrink-0"
                  />
                  <div>
                    <p className="font-serif font-bold text-navy">{ci.book.title}</p>
                    <p className="text-[10px] text-foreground-muted font-mono">{ci.book.isbn_digital}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-right">
                  <div>
                    <span className="text-[10px] text-foreground-muted block font-bold">Licences Numériques</span>
                    <span className="font-mono font-bold text-navy">{ci.digital_licenses_qty} x {ci.book.digital_wholesale_price.toLocaleString("fr-FR")} XOF</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-foreground-muted block font-bold">Exemplaires Papier</span>
                    <span className="font-mono font-bold text-navy">{ci.print_copies_qty} x {ci.book.print_wholesale_price.toLocaleString("fr-FR")} XOF</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-2xl bg-navy/5 border border-navy/20 space-y-1.5 text-xs text-navy">
            <div className="flex justify-between">
              <span>Sous-total Licences Numériques :</span>
              <span className="font-mono font-bold">{totalDigitalSubtotal.toLocaleString("fr-FR")} XOF</span>
            </div>
            <div className="flex justify-between">
              <span>Sous-total Exemplaires Papier :</span>
              <span className="font-mono font-bold">{totalPrintSubtotal.toLocaleString("fr-FR")} XOF</span>
            </div>
            <div className="flex justify-between text-sm font-bold pt-2 border-t border-navy/20">
              <span className="text-navy">Total Général Commande Groupée :</span>
              <span className="font-mono text-gold text-base">{totalAmount.toLocaleString("fr-FR")} XOF</span>
            </div>
          </div>
        </div>

        {/* Coordonnées de Livraison & Facturation */}
        <div className="p-6 rounded-3xl bg-background border border-border space-y-4 shadow-xs">
          <h3 className="font-serif font-bold text-navy text-sm uppercase tracking-wider flex items-center gap-2">
            <Building2 className="w-4 h-4 text-gold" />
            Coordonnées de Livraison &amp; Facturation Entreprise
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="sm:col-span-2">
              <label htmlFor="deliv-addr" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">Adresse de Livraison Physique (pour les exemplaires papier) *</label>
              <input
                id="deliv-addr"
                type="text"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl text-navy font-semibold focus:outline-none focus:border-gold min-h-[44px]"
                required
              />
            </div>

            <div>
              <label htmlFor="contact-tel" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">Téléphone Direct Responsable Achats *</label>
              <input
                id="contact-tel"
                type="text"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl font-mono text-navy font-bold focus:outline-none focus:border-gold min-h-[44px]"
                required
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors flex items-center justify-center gap-2 min-h-[44px] shadow-xs disabled:opacity-50"
            >
              {submitting ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4 text-gold" />
                  Soumettre la Commande Groupée
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
