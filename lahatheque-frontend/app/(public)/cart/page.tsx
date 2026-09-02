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
  ArrowLeft,
  Truck,
  CheckCircle2
} from "lucide-react";
import { useCart } from "@/context/cart-context";
import { formatEur } from "@/components/cart/cart-drawer";

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, totalAmount, totalCount } = useCart();

  const hasPaperItem = items.some((i) => i.format === "paper");

  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] bg-background text-foreground py-16 px-4 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 rounded-full bg-navy/5 text-navy flex items-center justify-center mb-6">
          <ShoppingBag className="w-10 h-10 text-gold" />
        </div>
        <span className="text-[11px] font-bold uppercase tracking-widest text-gold mb-1 font-mono">
          Panier LAHA
        </span>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy mb-3">Votre panier est vide</h1>
        <p className="text-xs sm:text-sm text-foreground-muted max-w-md mb-8">
          Vous n'avez ajouté aucun ouvrage ou manuel à votre panier pour le moment.
        </p>
        <Link
          href="/catalog"
          className="inline-flex items-center gap-2 bg-navy hover:bg-navy-dark text-white font-bold text-xs sm:text-sm px-6 py-3.5 rounded-xl shadow-md transition-all cursor-pointer"
        >
          <BookOpen className="w-4 h-4 text-gold" />
          Explorer le catalogue
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* En-tête Page Panier */}
        <div className="space-y-1.5 border-b border-border pb-6">
          <span className="text-[11px] font-bold uppercase tracking-widest text-gold font-mono block">
            Panier LAHA
          </span>
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
            <h1 className="font-serif text-2xl sm:text-4xl font-bold text-navy">
              Votre panier
            </h1>
            <button
              type="button"
              onClick={clearCart}
              className="text-xs text-red-500 hover:text-red-700 hover:underline flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Vider le panier
            </button>
          </div>
          <p className="text-xs sm:text-sm text-foreground-secondary pt-1">
            Vérifiez les livres ajoutés avant de passer au paiement. Les informations de livraison seront demandées uniquement si le panier contient un livre broché.
          </p>
        </div>

        {/* Grille Principale (Articles + Résumé) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          
          {/* Liste des articles (Colonne Gauche) */}
          <div className="lg:col-span-8 space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-background-secondary rounded-2xl border border-border p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 transition-all hover:border-border/80 shadow-xs"
              >
                {/* Couverture */}
                <div className="w-18 h-24 rounded-xl bg-background border border-border shrink-0 overflow-hidden shadow-xs flex items-center justify-center">
                  {item.cover ? (
                    <img
                      src={item.cover}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-navy/10 text-navy font-bold text-[10px] font-mono">
                      {item.format === "digital" ? "E-BOOK" : "PAPIER"}
                    </div>
                  )}
                </div>

                {/* Détails du Titre & Badges */}
                <div className="flex-1 space-y-1 min-w-0">
                  <h3 className="font-serif font-bold text-navy text-sm sm:text-base line-clamp-2">
                    {item.title}
                  </h3>
                  
                  <p className="text-xs text-foreground-muted">
                    {item.country || "Bénin"} • {item.category || "Scolaires"} •{" "}
                    <span className="font-semibold text-navy">
                      {item.format === "digital" ? "Livre numérique" : "Livre broché"}
                    </span>
                  </p>

                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-700 hover:underline pt-1.5 cursor-pointer font-medium"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Retirer</span>
                  </button>
                </div>

                {/* Quantités et Prix */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-border">
                  <div className="flex items-center border border-border rounded-xl bg-background p-1">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, -1)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-foreground hover:bg-background-secondary transition-colors cursor-pointer"
                      aria-label="Diminuer la quantité"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center text-xs font-bold font-mono text-navy">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, 1)}
                      disabled={item.format === "paper" && item.maxStockPaper != null && item.quantity >= item.maxStockPaper}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-foreground hover:bg-background-secondary transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      aria-label="Augmenter la quantité"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-bold font-mono text-navy">
                      {(item.price * item.quantity).toLocaleString("fr-FR")} F CFA
                    </div>
                    <div className="text-[11px] text-foreground-muted font-mono">
                      ≈ {formatEur(item.price * item.quantity)} €
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div className="pt-2 flex items-center justify-between">
              <Link
                href="/catalog"
                className="inline-flex items-center gap-2 text-xs font-bold text-navy hover:text-gold transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Continuer mes achats
              </Link>
            </div>
          </div>

          {/* Sommaire de Commande (Colonne Droite) */}
          <div className="lg:col-span-4">
            <div className="bg-background-secondary rounded-2xl border border-border p-6 space-y-6 shadow-xs sticky top-24">
              <h2 className="font-serif font-bold text-lg text-navy border-b border-border pb-3">
                Résumé
              </h2>

              <div className="space-y-3.5 text-xs">
                <div className="flex items-baseline justify-between text-foreground">
                  <span>Sous-total</span>
                  <div className="text-right">
                    <span className="font-bold font-mono text-navy text-sm">
                      {totalAmount.toLocaleString("fr-FR")} F CFA
                    </span>
                    <div className="text-[10px] text-foreground-muted font-mono">
                      ≈ {formatEur(totalAmount)} €
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-foreground border-t border-border/60 pt-3">
                  <span>Livraison</span>
                  <span className="font-semibold text-foreground-secondary">
                    Calculée au paiement
                  </span>
                </div>

                <div className="border-t border-border pt-3.5 flex items-baseline justify-between text-sm font-bold text-navy">
                  <span>Total</span>
                  <div className="text-right">
                    <span className="text-base font-bold font-mono text-navy">
                      {totalAmount.toLocaleString("fr-FR")} F CFA
                    </span>
                    <div className="text-[11px] text-foreground-muted font-mono font-normal">
                      ≈ {formatEur(totalAmount)} €
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-foreground-muted italic pt-1">
                  Adresse de livraison demandée à l'étape du paiement.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <Link
                  href="/checkout"
                  className="w-full py-3.5 rounded-xl bg-navy hover:bg-navy-dark text-white font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer text-center"
                >
                  Passer au paiement
                  <ArrowRight className="w-4 h-4 text-gold" />
                </Link>

                <Link
                  href="/catalog"
                  className="w-full py-3 rounded-xl border border-navy text-navy hover:bg-navy/5 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer text-center"
                >
                  Continuer mes achats
                </Link>
              </div>

              <div className="pt-3 border-t border-border space-y-2 text-[11px] text-foreground-muted">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-gold shrink-0" />
                  <span>Paiement 100% sécurisé via Mobile Money (MTN, Moov, Orange, Wave) ou Carte Bancaire.</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Bannière d'Information / Newsletter */}
        <div className="rounded-3xl bg-gold/10 border border-gold/30 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 mt-8">
          <div className="space-y-1 text-center md:text-left">
            <h3 className="font-serif text-lg font-bold text-navy">
              Restez informé-e
            </h3>
            <p className="text-xs text-foreground-secondary">
              Recevez les nouvelles parutions universitaires et scolaires directement dans votre boîte mail.
            </p>
          </div>

          <form className="flex w-full md:w-auto items-center gap-2" onSubmit={(e) => e.preventDefault()}>
            <input
              type="email"
              placeholder="Votre adresse e-mail"
              className="px-4 py-2.5 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-gold w-full sm:w-64"
            />
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gold hover:bg-gold-hover text-navy font-bold text-xs transition-colors shrink-0 shadow-xs cursor-pointer"
            >
              S'abonner
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
