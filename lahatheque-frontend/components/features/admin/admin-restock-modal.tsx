"use client";

import React, { useState } from "react";
import { PackagePlus, X, Warehouse, CheckCircle2, AlertTriangle, Layers } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { InlineLoader } from "@/components/ui/page-loader";
import { createRestock } from "@/lib/services/manager";
import { toast } from "sonner";

interface AdminRestockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  item: {
    stockId?: string;
    bookId: string;
    bookTitle: string;
    isbn?: string;
    warehouseName?: string;
    warehouseCode?: string;
    currentQuantity?: number;
    alertThreshold?: number;
  } | null;
}

export function AdminRestockModal({
  isOpen,
  onClose,
  onSuccess,
  item,
}: AdminRestockModalProps) {
  const defaultRef = `TIRAGE-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const [quantity, setQuantity] = useState<string>("100");
  const [reference, setReference] = useState<string>(defaultRef);
  const [notes, setNotes] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const qtyNum = parseFloat(quantity);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      setError("Veuillez saisir une quantité strictement positive.");
      return;
    }

    try {
      setSubmitting(true);
      await createRestock({
        stock_id: item.stockId,
        ouvrage_id: item.bookId,
        quantite: qtyNum,
        reference_document: reference.trim() || defaultRef,
      });

      toast.success(
        `Ordre de réassort de ${qtyNum} exemplaires validé pour « ${item.bookTitle} » !`
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || "Erreur lors de l'enregistrement du réapprovisionnement.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 overflow-hidden"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label="Ordonner un réapprovisionnement"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="bg-background border border-border rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[min(90dvh,680px)]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 sm:p-6 pb-4 border-b border-border/50 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-navy/10 border border-navy/20 text-navy">
                <PackagePlus className="w-5 h-5 text-gold" />
              </div>
              <div>
                <h2 className="font-serif font-bold text-navy text-base sm:text-lg">
                  Ordre de Réapprovisionnement
                </h2>
                <p className="text-xs text-foreground-muted">
                  Tirage imprimerie ou transfert de stock vers le hub
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-background-secondary transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer text-foreground-muted hover:text-navy"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Corps de formulaire */}
          <form onSubmit={handleSubmit} className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs">
            {/* Récapitulatif ouvrage & entrepôt */}
            <div className="bg-background-secondary p-4 rounded-xl border border-border space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold text-gold uppercase tracking-wider block">
                    Ouvrage Cible
                  </span>
                  <p className="font-semibold text-sm text-navy mt-0.5 leading-snug">
                    {item.bookTitle}
                  </p>
                </div>
                {item.isbn && (
                  <span className="text-[10px] font-mono text-foreground-muted bg-background px-2 py-0.5 rounded border border-border shrink-0">
                    {item.isbn}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4 pt-2 border-t border-border/60 text-xs text-foreground-muted flex-wrap">
                <span className="flex items-center gap-1">
                  <Warehouse className="w-3.5 h-3.5 text-gold shrink-0" />
                  <strong className="text-navy font-medium">
                    {item.warehouseName || item.warehouseCode || "Entrepôt Principal"}
                  </strong>
                </span>
                {item.currentQuantity !== undefined && (
                  <span className="flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-foreground-muted shrink-0" />
                    Stock actuel :{" "}
                    <strong className={item.currentQuantity === 0 ? "text-error font-bold" : "text-navy"}>
                      {item.currentQuantity} ex.
                    </strong>
                  </span>
                )}
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-error/10 border border-error/20 text-error text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Saisie Quantité */}
            <div>
              <label htmlFor="restock-quantity" className="block text-xs font-semibold text-navy mb-1">
                Quantité d&apos;exemplaires à réapprovisionner *
              </label>
              <div className="relative">
                <input
                  id="restock-quantity"
                  type="number"
                  step="any"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Ex: 50, 100, 500"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:border-gold text-foreground font-mono text-sm"
                  autoFocus
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-foreground-muted pointer-events-none">
                  exemplaires
                </span>
              </div>
              <p className="text-[10px] text-foreground-muted mt-1">
                Valeur libre (aucune quantité minimale imposée).
              </p>
            </div>

            {/* Référence document */}
            <div>
              <label htmlFor="restock-ref" className="block text-xs font-semibold text-navy mb-1">
                Référence bon de tirage / commande fournisseur
              </label>
              <input
                id="restock-ref"
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Ex: TIRAGE-2026-0042, FACT-IMP-889"
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:border-gold text-foreground font-mono text-xs"
              />
            </div>

            {/* Notes / Instructions */}
            <div>
              <label htmlFor="restock-notes" className="block text-xs font-semibold text-navy mb-1">
                Consignes administratives / Remarques (optionnel)
              </label>
              <textarea
                id="restock-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Réception prévue vendredi chez l'imprimeur, priorité aux commandes en souffrance..."
                rows={3}
                className="w-full px-3.5 py-2 rounded-xl border border-border bg-background focus:outline-none focus:border-gold text-foreground text-xs resize-none placeholder:text-foreground-muted"
              />
            </div>

            {/* Notification automatique vitrine */}
            <div className="p-3 rounded-xl bg-success/5 border border-success/20 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
              <p className="text-[11px] text-foreground leading-relaxed">
                Ce réassort mettra à jour l&apos;inventaire physique en direct et activera automatiquement la disponibilité papier sur le catalogue public s&apos;il était précédemment désactivé.
              </p>
            </div>

            {/* Footer boutons */}
            <div className="pt-3 border-t border-border flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2.5 rounded-xl border border-border text-xs font-semibold text-foreground-muted hover:text-navy hover:border-navy transition-colors min-h-[44px] cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy/90 transition-colors flex items-center gap-2 min-h-[44px] cursor-pointer shadow-xs"
              >
                {submitting ? (
                  <InlineLoader size={16} />
                ) : (
                  <>
                    <PackagePlus className="w-4 h-4 text-gold" />
                    Valider le Réapprovisionnement
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
