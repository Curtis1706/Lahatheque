"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, BookOpen } from "lucide-react";
import { useCart } from "@/context/cart-context";

// Taux de conversion officiel XOF -> EUR (1 EUR = 655.957 FCFA)
export function formatEur(fcfa: number): string {
  const eur = fcfa / 655.957;
  return eur.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function CartDrawer() {
  const { items, isDrawerOpen, closeDrawer, removeItem, updateQuantity, totalAmount, totalCount } = useCart();

  // Bloquer le scroll d'arrière-plan quand le tiroir est ouvert
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isDrawerOpen]);

  // Fermer avec la touche Échap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isDrawerOpen) {
        closeDrawer();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDrawerOpen, closeDrawer]);

  return (
    <AnimatePresence>
      {isDrawerOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* Overlay avec flou d'arrière-plan */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeDrawer}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs cursor-pointer"
            aria-hidden="true"
          />

          {/* Panneau Latéral (Drawer) */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            className="relative w-full max-w-md bg-background h-full shadow-2xl border-l border-border flex flex-col z-10 overflow-hidden"
          >
            {/* En-tête du Panneau */}
            <div className="px-6 py-5 border-b border-border flex items-center justify-between bg-background">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-gold block">
                  Ajouté au panier
                </span>
                <h2 className="font-serif text-lg sm:text-xl font-bold text-navy">
                  Votre panier
                </h2>
              </div>
              <button
                type="button"
                onClick={closeDrawer}
                className="p-2 rounded-xl text-foreground-muted hover:text-foreground hover:bg-background-secondary transition-colors cursor-pointer"
                aria-label="Fermer le panier"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenu / Liste des Articles */}
            <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-border/60">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12 text-foreground-muted space-y-4">
                  <div className="w-16 h-16 rounded-full bg-navy/5 flex items-center justify-center text-navy">
                    <ShoppingBag className="w-8 h-8 text-gold" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-serif font-bold text-base text-navy">Votre panier est vide</p>
                    <p className="text-xs text-foreground-muted max-w-xs">
                      Parcourez le catalogue pour découvrir nos manuels numériques et ouvrages brochés.
                    </p>
                  </div>
                  <Link
                    href="/catalog"
                    onClick={closeDrawer}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-navy text-white text-xs font-semibold hover:bg-navy-dark transition-all shadow-sm"
                  >
                    <BookOpen className="w-4 h-4 text-gold" />
                    Explorer le catalogue
                  </Link>
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex items-start gap-4 group">
                    {/* Miniature Couverture */}
                    <div className="w-16 h-22 relative rounded-lg bg-background-secondary border border-border shrink-0 overflow-hidden shadow-xs">
                      {item.cover ? (
                        <Image
                          src={item.cover}
                          alt={item.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-navy/10 text-navy font-bold text-[10px] font-mono">
                          {item.format === "digital" ? "E-BOOK" : "PAPIER"}
                        </div>
                      )}
                    </div>

                    {/* Informations Titre & Badges */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-serif font-bold text-xs sm:text-sm text-navy line-clamp-2 leading-snug">
                          {item.title}
                        </h4>
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="text-foreground-muted hover:text-red-500 p-1 transition-colors cursor-pointer shrink-0"
                          title="Retirer l'article"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Sous-titre Catégorie / Pays / Format */}
                      <p className="text-[11px] text-foreground-muted truncate">
                        {item.country || "Bénin"} • {item.category || "Scolaires"} •{" "}
                        <span className="font-semibold text-navy">
                          {item.format === "digital" ? "Livre numérique" : "Livre broché"}
                        </span>
                      </p>

                      {/* Sélecteur de Quantité & Prix */}
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center border border-border rounded-lg bg-background-secondary p-0.5">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, -1)}
                            className="w-6 h-6 rounded flex items-center justify-center text-foreground hover:bg-background transition-colors cursor-pointer"
                            aria-label="Diminuer la quantité"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center text-xs font-bold font-mono text-navy">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, 1)}
                            disabled={item.format === "paper" && item.maxStockPaper != null && item.quantity >= item.maxStockPaper}
                            className="w-6 h-6 rounded flex items-center justify-center text-foreground hover:bg-background transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            aria-label="Augmenter la quantité"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="text-right">
                          <div className="font-bold text-xs font-mono text-navy">
                            {(item.price * item.quantity).toLocaleString("fr-FR")} F CFA
                          </div>
                          <div className="text-[10px] text-foreground-muted font-mono">
                            ≈ {formatEur(item.price * item.quantity)} €
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pied du Panneau (Total & CTA) */}
            {items.length > 0 && (
              <div className="p-6 border-t border-border bg-background-secondary/60 space-y-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs font-bold text-foreground">
                    {totalCount} {totalCount > 1 ? "articles" : "article"}
                  </span>
                  <div className="text-right">
                    <div className="font-mono text-base font-bold text-navy">
                      {totalAmount.toLocaleString("fr-FR")} F CFA
                    </div>
                    <div className="text-xs text-foreground-muted font-mono">
                      ≈ {formatEur(totalAmount)} €
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Link
                    href="/cart"
                    onClick={closeDrawer}
                    className="w-full py-3 rounded-xl border border-navy text-navy hover:bg-navy hover:text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer text-center"
                  >
                    Voir le panier
                  </Link>

                  <Link
                    href="/checkout"
                    onClick={closeDrawer}
                    className="w-full py-3.5 rounded-xl bg-navy hover:bg-navy-dark text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer text-center"
                  >
                    Commander maintenant
                    <ArrowRight className="w-4 h-4 text-gold" />
                  </Link>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
