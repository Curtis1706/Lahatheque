"use client";

import React, { useState } from "react";
import { ArrowUpCircle, X, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { StockAlert } from "@/lib/types/manager";
import { InlineLoader } from "@/components/ui/page-loader";

interface EscalateModalProps {
  alert: StockAlert;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (impactDescription: string) => Promise<void>;
}

export function EscalateModal({ alert, isOpen, onClose, onConfirm }: EscalateModalProps) {
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!description.trim()) {
      setError("Veuillez décrire l'impact de cette rupture sur la vitrine");
      return;
    }
    setLoading(true);
    try {
      await onConfirm(description.trim());
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-navy-dark/60 backdrop-blur-sm p-4"
        onClick={onClose}
        onKeyDown={handleKeyDown}
        role="dialog"
        aria-modal="true"
        aria-label="Signaler la rupture à l'administrateur"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="bg-background border border-border rounded-2xl shadow-lg w-full max-w-md p-6 space-y-5"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-error/10">
                <ArrowUpCircle className="w-5 h-5 text-error" />
              </div>
              <div>
                <h2 className="font-serif font-bold text-navy text-base">Signaler à l&apos;Admin</h2>
                <p className="text-xs text-foreground-muted">Rupture de stock impactant la vitrine</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-background-secondary transition-colors"
              title="Fermer"
            >
              <X className="w-4 h-4 text-foreground-muted" />
            </button>
          </div>

          {/* Ouvrage concerné */}
          <div className="bg-background-secondary p-3 rounded-xl border border-border text-xs space-y-1">
            <p className="font-semibold text-navy">{alert.book_title}</p>
            <p className="text-foreground-muted">ISBN : <span className="font-mono text-foreground">{alert.isbn}</span></p>
            <p className="text-foreground-muted">Entrepôt : <span className="text-foreground">{alert.warehouse}</span></p>
            <p className="text-foreground-muted">Quantité : <span className="font-bold text-error">{alert.quantity} exemplaire{alert.quantity !== 1 ? "s" : ""}</span></p>
          </div>

          {/* Description de l'impact */}
          <div>
            <label htmlFor="impact-description" className="block text-xs font-semibold text-navy mb-1">
              Impact sur la vitrine *
            </label>
            <textarea
              id="impact-description"
              value={description}
              onChange={(e) => { setDescription(e.target.value); setError(null); }}
              placeholder="Ex: Ouvrage indisponible pour la rentrée universitaire FSS, forte demande prévue..."
              rows={3}
              className={`w-full px-3 py-2 text-xs rounded-xl border ${error ? "border-error" : "border-border"} bg-background focus:outline-none focus:border-gold text-foreground placeholder:text-foreground-muted resize-none`}
              autoFocus
            />
            {error && <p className="text-[10px] text-error mt-0.5">{error}</p>}
          </div>

          {/* Info */}
          <div className="bg-gold/5 border border-gold/20 rounded-xl p-3 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-gold shrink-0 mt-0.5" />
            <p className="text-[11px] text-foreground">
              L&apos;administrateur recevra une notification et pourra désactiver l&apos;ouvrage de la vitrine publique si nécessaire. 
              Vous ne pouvez pas retirer un ouvrage vous-même.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-border text-xs font-semibold text-foreground-muted hover:text-navy hover:border-navy transition-colors min-h-[44px]"
            >
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl bg-error text-white text-xs font-bold hover:opacity-90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 min-h-[44px]"
            >
              {loading ? (
                <InlineLoader size={16} />
              ) : (
                <>
                  <ArrowUpCircle className="w-4 h-4" />
                  Signaler la rupture
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
