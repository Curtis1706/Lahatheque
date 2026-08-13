"use client";

import React, { useState } from "react";
import { Percent, X, AlertCircle, Save, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { BookRoyalty } from "@/lib/types/legal";

interface EditRoyaltyModalProps {
  royalty: BookRoyalty;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newRate: number, applyRetroactively: boolean) => Promise<void>;
}

export function EditRoyaltyModal({
  royalty,
  isOpen,
  onClose,
  onConfirm,
}: EditRoyaltyModalProps) {
  const [rate, setRate] = useState(royalty.current_rate);
  const [applyRetroactively, setApplyRetroactively] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onConfirm(rate, applyRetroactively);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-navy-dark/60 backdrop-blur-sm p-4"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="bg-background border border-border rounded-3xl shadow-xl w-full max-w-md p-6 space-y-5"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between">
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
              className="p-2 rounded-xl hover:bg-background-secondary transition-colors text-foreground-muted"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-xl border border-border text-xs font-semibold text-foreground-muted hover:text-navy transition-colors min-h-[44px]"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors flex items-center justify-center gap-2 disabled:opacity-50 min-h-[44px] shadow-xs"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
