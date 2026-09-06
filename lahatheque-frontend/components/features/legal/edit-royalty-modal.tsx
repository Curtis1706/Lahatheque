"use client";

import React, { useState, useEffect } from "react";
import { Percent, X, AlertCircle, Save, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { BookRoyalty } from "@/lib/types/legal";
import { InlineLoader } from "@/components/ui/page-loader";

interface EditRoyaltyModalProps {
  royalty: BookRoyalty;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newRate: number, applyRetroactively: boolean, universityRate?: number | null) => Promise<void>;
}

export function EditRoyaltyModal({
  royalty,
  isOpen,
  onClose,
  onConfirm,
}: EditRoyaltyModalProps) {
  const [rate, setRate] = useState(royalty.current_rate);
  const [universityRate, setUniversityRate] = useState<string>(
    royalty.university_share_percent !== undefined && royalty.university_share_percent !== null
      ? String(royalty.university_share_percent)
      : ""
  );
  const [applyRetroactively, setApplyRetroactively] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setRate(royalty.current_rate);
    setUniversityRate(
      royalty.university_share_percent !== undefined && royalty.university_share_percent !== null
        ? String(royalty.university_share_percent)
        : ""
    );
  }, [royalty]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const uRate = universityRate.trim() !== "" ? parseFloat(universityRate) : null;
      await onConfirm(rate, applyRetroactively, uRate);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 overflow-hidden"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="bg-background border border-border rounded-3xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[min(90dvh,680px)]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* En-tête fixe */}
          <div className="flex items-center justify-between p-5 sm:p-6 pb-4 border-b border-border/50 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-gold/10 text-gold border border-gold/20">
                <Percent className="w-5 h-5 text-gold" />
              </div>
              <div>
                <h2 className="font-serif font-bold text-navy text-base">Modifier le taux de droits</h2>
                <p className="text-xs text-foreground-muted truncate max-w-[240px]">{royalty.title}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-background-secondary transition-colors text-foreground-muted min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
              aria-label="Fermer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Formulaire avec corps scrollable et pied d'actions fixe */}
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
            {/* Corps scrollable */}
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-5 sm:p-6 space-y-4">
              {/* Taux actuel vs nouveau taux */}
              <div>
                <label htmlFor="royalty-rate" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
                  Nouveau pourcentage de droits d&apos;auteur (%) *
                </label>
                <div className="relative">
                  <input
                    id="royalty-rate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={rate}
                    onChange={(e) => setRate(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 text-sm font-mono font-bold rounded-xl border border-border bg-background-secondary focus:outline-none focus:border-gold text-navy pr-8 min-h-[44px]"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono font-bold text-gold">%</span>
                </div>
              </div>

              {/* Champ conditionnel Taux Université si rattaché à une institution */}
              {royalty.institution && (
                <div>
                  <label className="text-[11px] font-bold text-navy uppercase tracking-wider block mb-1">
                    Taux Université pour ce livre (optionnel)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step="0.5"
                    value={universityRate}
                    onChange={(e) => setUniversityRate(e.target.value)}
                    placeholder={`Par défaut : ${royalty.institution.royalty_rate}% (taux général de l'établissement)`}
                    className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-background-secondary text-navy focus:outline-none focus:border-gold min-h-[40px]"
                  />
                  <p className="text-[10px] text-foreground-muted mt-1">
                    Laissez vide pour utiliser le taux général de {royalty.institution.name} ({royalty.institution.royalty_rate}%).
                  </p>
                </div>
              )}

              {/* Case à cocher Rétroactivité (Validation Client LAHA) */}
              <div className="p-3.5 rounded-2xl bg-gold/5 border border-gold/20 space-y-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applyRetroactively}
                    onChange={(e) => setApplyRetroactively(e.target.checked)}
                    className="mt-0.5 rounded border-border text-gold focus:ring-gold"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-navy block">Appliquer rétroactivement aux ventes antérieures</span>
                    <span className="text-[11px] text-foreground-muted">
                      Si cochée, le nouveau taux recalculera les droits dus sur toutes les ventes passées non encore clôturées.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Actions / Pied de modale fixe */}
            <div className="p-4 sm:p-6 border-t border-border bg-background-secondary/30 shrink-0 flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-xl border border-border text-xs font-semibold text-foreground-muted hover:text-navy transition-colors min-h-[44px] cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors flex items-center justify-center gap-2 disabled:opacity-50 min-h-[44px] shadow-xs cursor-pointer"
              >
                {loading ? (
                  <InlineLoader size={16} />
                ) : (
                  <>
                    <Save className="w-4 h-4 text-gold" />
                    Enregistrer le taux
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
