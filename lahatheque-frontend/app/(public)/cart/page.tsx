"use client";

import Link from "next/link";
import Image from "next/image";
import { 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  ArrowRight, 
  BookOpen, 
  ShieldCheck, 
  ArrowLeft 
} from "lucide-react";
import { useCart } from "@/context/cart-context";

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, totalAmount, totalCount } = useCart();

  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] bg-background text-foreground py-16 px-4 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 rounded-full bg-navy/5 text-navy flex items-center justify-center mb-6">
          <ShoppingBag className="w-10 h-10 text-gold" />
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy mb-3">Votre panier est vide</h1>
        <p className="text-sm text-foreground-muted max-w-md mb-8">
          Vous n'avez ajouté aucun ouvrage ou abonnement à votre panier pour le moment.
        </p>
        <Link
          href="/catalog"
          className="inline-flex items-center gap-2 bg-navy hover:bg-navy-hover text-white font-bold text-sm px-6 py-3.5 rounded-xl shadow-md transition-all cursor-pointer"
        >
          <BookOpen className="w-4 h-4 text-gold" />
          Explorer le catalogue
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* En-tête */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
              <ShoppingBag className="w-4 h-4 text-gold" />
              Panier d'achat ({totalCount} {totalCount > 1 ? "articles" : "article"})
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
              Vos ouvrages & abonnements
            </h1>
          </div>
          <button
            type="button"
            onClick={clearCart}
            className="text-xs text-error hover:underline flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Vider le panier
          </button>
        </div>

        {/* Grille principale */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Liste des articles */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-background border border-border rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 transition-all hover:border-border/80 shadow-sm"
              >
                {/* Couverture */}
                <div className="w-16 h-22 relative bg-navy/5 rounded-xl overflow-hidden shrink-0 border border-border">
                  {item.cover ? (
                    <Image
                      src={item.cover}
                      alt={item.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-navy/40 font-bold text-xs">
                      PDF
                    </div>
                  )}
                </div>

                {/* Détails */}
                <div className="flex-1 space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${
                      item.format === "digital" 
                        ? "bg-navy/10 text-navy border border-navy/20" 
                        : "bg-gold/10 text-navy border border-gold/30"
                    }`}>
                      {item.format === "digital" ? "Numérique (PDF/EPUB)" : "Livre Papier"}
                    </span>
                  </div>
                  <h3 className="font-serif font-bold text-navy text-sm sm:text-base line-clamp-1">
                    {item.title}
                  </h3>
                  <p className="text-xs text-foreground-muted">{item.author}</p>
                  <p className="text-xs font-bold text-navy sm:hidden">
                    {(item.price * item.quantity).toLocaleString("fr-FR")} FCFA
                  </p>
                </div>

                {/* Quantités et Prix */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-border">
                  <div className="flex items-center border border-border rounded-xl bg-background-secondary p-1">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, -1)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-navy hover:bg-background transition-colors cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center text-xs font-bold text-navy">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, 1)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-navy hover:bg-background transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="hidden sm:block text-right">
                    <p className="text-sm font-bold text-navy">
                      {(item.price * item.quantity).toLocaleString("fr-FR")} FCFA
                    </p>
                    {item.quantity > 1 && (
                      <p className="text-[10px] text-foreground-muted">
                        {item.price.toLocaleString("fr-FR")} FCFA / unité
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="p-1.5 text-foreground-muted hover:text-error transition-colors cursor-pointer"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            <Link
              href="/catalog"
              className="inline-flex items-center gap-2 text-xs font-bold text-navy hover:text-navy-hover pt-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Continuer vos achats dans le catalogue
            </Link>
          </div>

          {/* Sommaire de Commande */}
          <div className="bg-background border border-border rounded-2xl p-6 space-y-6 h-fit shadow-sm">
            <h2 className="font-serif font-bold text-lg text-navy border-b border-border pb-3">
              Résumé de la commande
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between text-foreground">
                <span>Sous-total ({totalCount} {totalCount > 1 ? "articles" : "article"})</span>
                <span className="font-semibold">{totalAmount.toLocaleString("fr-FR")} FCFA</span>
              </div>
              <div className="flex justify-between text-foreground">
                <span>Frais de livraison papier</span>
                <span className="font-semibold text-success">Offerts (Afrique de l'Ouest)</span>
              </div>
              <div className="border-t border-border pt-3 flex justify-between text-sm font-bold text-navy">
                <span>Total à régler</span>
                <span className="text-base text-gold-dark">{totalAmount.toLocaleString("fr-FR")} FCFA</span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <Link
                href="/checkout"
                className="w-full py-4 rounded-xl bg-gold hover:bg-gold-hover text-navy font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer text-center"
              >
                Passer la commande
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="pt-4 border-t border-border space-y-2 text-[11px] text-foreground-muted">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-success shrink-0" />
                <span>Paiement sécurisé via Mobile Money (MTN, Moov, Orange) ou Carte Bancaire.</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
