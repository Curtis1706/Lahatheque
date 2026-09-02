"use client";

import React, { useState } from "react";
import { AlertCircle, X, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { LayoutDeposit } from "@/lib/types/layout-artist";
import { InlineLoader } from "@/components/ui/page-loader";

interface RevisionModalProps {
  deposit: LayoutDeposit;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (comment: string) => Promise<void>;
}

export function RevisionModal({ deposit, isOpen, onClose, onConfirm }: RevisionModalProps) {
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!comment.trim()) {
      setError("Veuillez saisir un commentaire expliquant les corrections demandées au maquettiste.");
      return;
    }
    setLoading(true);
    try {
      await onConfirm(comment.trim());
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
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        onClick={onClose}
        onKeyDown={handleKeyDown}
        role="dialog"
        aria-modal="true"
        aria-label="Demander une correction au maquettiste"
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
                <AlertCircle className="w-5 h-5 text-gold" />
              </div>
              <div>
                <h2 className="font-serif font-bold text-navy text-base">Demande de correction</h2>
                <p className="text-xs text-foreground-muted">À destination de {deposit.maquettiste_name}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-background-secondary transition-colors text-foreground-muted"
              title="Fermer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Résumé Dépôt */}
          <div className="bg-background-secondary p-3.5 rounded-2xl border border-border text-xs space-y-1">
            <p className="font-bold text-navy truncate">{deposit.metadata.title}</p>
            <p className="text-foreground-muted">
              Discipline : <span className="text-foreground">{deposit.classification.discipline}</span>
            </p>
          </div>

          {/* Commentaire obligatoire */}
          <div>
            <label htmlFor="chef-comment" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
              Instructions &amp; Corrections requises *
            </label>
            <textarea
              id="chef-comment"
              value={comment}
              onChange={(e) => {
                setComment(e.target.value);
                setError(null);
              }}
              placeholder="Ex: Corriger l'alignement de la couverture, vérifier l'orthographe du résumé et fournir le fichier EPUB..."
              rows={4}
              className={`w-full px-3.5 py-2.5 text-xs rounded-2xl border ${
                error ? "border-error" : "border-border"
              } bg-background focus:outline-none focus:border-gold text-foreground placeholder:text-foreground-muted resize-none`}
              autoFocus
            />
            {error && <p className="text-[10px] text-error font-medium mt-1">{error}</p>}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-border text-xs font-semibold text-foreground-muted hover:text-navy hover:border-navy transition-colors min-h-[44px]"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl bg-gold text-navy text-xs font-bold hover:bg-gold-light transition-colors flex items-center justify-center gap-2 disabled:opacity-50 min-h-[44px] shadow-xs"
            >
              {loading ? (
                <InlineLoader size={16} />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Envoyer la demande
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
