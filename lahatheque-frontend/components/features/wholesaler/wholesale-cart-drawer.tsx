"use client";

import React from "react";
import { ShoppingCart, Trash2, Plus, Minus, BookOpen, FileCheck, ArrowRight, ShieldCheck } from "lucide-react";
import type { WholesalerCartItem } from "@/lib/types/wholesaler";

interface WholesaleCartDrawerProps {
  items: WholesalerCartItem[];
  onUpdateQty: (bookId: string, type: "digital" | "print", qty: number) => void;
  onRemoveItem: (bookId: string) => void;
  onCheckout: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export function WholesaleCartDrawer({
  items,
  onUpdateQty,
  onRemoveItem,
  onCheckout,
  isOpen,
  onClose,
}: WholesaleCartDrawerProps) {
  if (!isOpen) return null;

  const totalDigitalSubtotal = items.reduce(
    (acc, item) => acc + item.digital_licenses_qty * item.book.digital_wholesale_price,
    0
  );
  const totalPrintSubtotal = items.reduce(
    (acc, item) => acc + item.print_copies_qty * item.book.print_wholesale_price,
    0
  );
  const totalAmount = totalDigitalSubtotal + totalPrintSubtotal;
  const totalDigitalCount = items.reduce((acc, item) => acc + item.digital_licenses_qty, 0);
  const totalPrintCount = items.reduce((acc, item) => acc + item.print_copies_qty, 0);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-background h-full shadow-2xl flex flex-col justify-between border-l border-border animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-5 border-b border-border flex items-center justify-between bg-navy text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gold/20 text-gold">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base">Panier Commande Groupée</h3>
              <p className="text-xs text-navy-light">{items.length} titre(s) sélectionné(s)</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/70 hover:text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-white/20"
          >
            Fermer
          </button>
        </div>

        {/* Content Items */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-12 space-y-3 text-foreground-muted">
              <ShoppingCart className="w-12 h-12 text-gold mx-auto opacity-50" />
              <p className="font-serif font-bold text-navy text-sm">Votre panier d&apos;achat en gros est vide</p>
              <p className="text-xs">Parcourez le catalogue grossiste pour sélectionner des titres.</p>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.book_id}
                className="p-4 rounded-2xl bg-background-secondary border border-border space-y-3 shadow-xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={item.book.cover_url}
                      alt={item.book.title}
                      className="w-12 h-16 object-cover rounded-lg border border-border shrink-0 shadow-xs"
                    />
                    <div>
                      <p className="font-serif font-bold text-xs text-navy leading-snug">{item.book.title}</p>
                      <p className="text-[10px] text-foreground-muted font-mono">{item.book.isbn_digital}</p>
                      <span className="text-[10px] font-bold text-gold">{item.book.publisher_name}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveItem(item.book_id)}
                    className="text-foreground-muted hover:text-rose-600 p-1 transition-colors"
                    title="Supprimer du panier"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Sélecteurs 21st.dev Quantity Stepper (id: 20055) */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60 text-xs">
                  {/* Licences Numériques */}
                  <div className="p-2.5 rounded-xl bg-background border border-border space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-navy block">Licences Numériques</span>
                    <span className="font-mono text-[10px] text-gold block font-bold">
                      {item.book.digital_wholesale_price.toLocaleString("fr-FR")} XOF / u
                    </span>
                    <div className="flex items-center justify-between bg-background-secondary rounded-lg border border-border p-1">
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateQty(
                            item.book_id,
                            "digital",
                            Math.max(0, item.digital_licenses_qty - 5)
                          )
                        }
                        className="p-1 hover:bg-border rounded text-navy"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-mono font-bold text-xs text-navy">{item.digital_licenses_qty}</span>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateQty(
                            item.book_id,
                            "digital",
                            item.digital_licenses_qty + 5
                          )
                        }
                        className="p-1 hover:bg-border rounded text-navy"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Exemplaires Papier */}
                  <div className="p-2.5 rounded-xl bg-background border border-border space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-navy block">Exemplaires Papier</span>
                    <span className="font-mono text-[10px] text-gold block font-bold">
                      {item.book.print_wholesale_price.toLocaleString("fr-FR")} XOF / u
                    </span>
                    <div className="flex items-center justify-between bg-background-secondary rounded-lg border border-border p-1">
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateQty(
                            item.book_id,
                            "print",
                            Math.max(0, item.print_copies_qty - 5)
                          )
                        }
                        className="p-1 hover:bg-border rounded text-navy"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-mono font-bold text-xs text-navy">{item.print_copies_qty}</span>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateQty(
                            item.book_id,
                            "print",
                            item.print_copies_qty + 5
                          )
                        }
                        className="p-1 hover:bg-border rounded text-navy"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer & Checkout */}
        {items.length > 0 && (
          <div className="p-5 border-t border-border bg-background space-y-3">
            <div className="space-y-1.5 text-xs border-b border-border pb-3">
              <div className="flex items-center justify-between text-foreground-muted">
                <span>Licences Numériques ({totalDigitalCount}) :</span>
                <span className="font-mono font-bold text-navy">{totalDigitalSubtotal.toLocaleString("fr-FR")} XOF</span>
              </div>
              <div className="flex items-center justify-between text-foreground-muted">
                <span>Exemplaires Papier ({totalPrintCount}) :</span>
                <span className="font-mono font-bold text-navy">{totalPrintSubtotal.toLocaleString("fr-FR")} XOF</span>
              </div>
              <div className="flex items-center justify-between text-sm font-bold pt-1">
                <span className="text-navy">Total Commande Groupée :</span>
                <span className="font-mono text-gold text-base">{totalAmount.toLocaleString("fr-FR")} XOF</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                onCheckout();
              }}
              className="w-full py-3 rounded-xl bg-navy text-white font-bold text-xs hover:bg-navy-hover transition-colors flex items-center justify-center gap-2 shadow-xs min-h-[44px]"
            >
              <span>Valider la Commande Groupée</span>
              <ArrowRight className="w-4 h-4 text-gold" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
