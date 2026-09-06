"use client";

import React, { useState } from "react";
import { PackageCheck, X, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { ManagerOrder } from "@/lib/types/manager";
import { InlineLoader } from "@/components/ui/page-loader";

interface DeliverOrderModalProps {
  order: ManagerOrder;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function DeliverOrderModal({ order, isOpen, onClose, onConfirm }: DeliverOrderModalProps) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
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
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 overflow-hidden"
        onClick={onClose}
        onKeyDown={handleKeyDown}
        role="dialog"
        aria-modal="true"
        aria-label="Confirmer la livraison"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="bg-background border border-border rounded-2xl shadow-lg w-full max-w-md overflow-hidden flex flex-col max-h-[min(90dvh,640px)]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header fixe */}
          <div className="flex items-center justify-between p-5 sm:p-6 pb-4 border-b border-border/50 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-success/10">
                <PackageCheck className="w-5 h-5 text-success" />
              </div>
              <div>
                <h2 className="font-serif font-bold text-navy text-base">Confirmer la livraison</h2>
                <p className="text-xs text-foreground-muted">Commande {order.id}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-background-secondary transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
              title="Fermer"
            >
              <X className="w-4 h-4 text-foreground-muted" />
            </button>
          </div>

          {/* Corps scrollable */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-5 sm:p-6 space-y-4 text-xs">
            {/* Avertissement */}
            <div className="bg-gold/5 border border-gold/20 rounded-xl p-3 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-gold shrink-0 mt-0.5" />
              <p className="text-[11px] text-foreground">
                Cette action marque la commande comme livrée et envoie une notification de livraison au client. 
                Cette opération est irréversible sans motif tracé.
              </p>
            </div>

            {/* Résumé */}
            <div className="bg-background-secondary p-3.5 rounded-xl border border-border text-xs space-y-1">
              <p className="text-foreground-muted">Destinataire : <span className="font-semibold text-foreground">{order.customer_name}</span></p>
              <p className="text-foreground-muted">Transporteur : <span className="text-foreground">{order.carrier || "—"}</span></p>
              <p className="text-foreground-muted">N° de suivi : <span className="font-mono text-foreground">{order.tracking_number || "—"}</span></p>
              <p className="text-foreground-muted">{order.items.length} article{order.items.length > 1 ? "s" : ""}</p>
            </div>
          </div>

          {/* Actions / Footer fixe */}
          <div className="p-4 sm:p-6 border-t border-border bg-background-secondary/30 shrink-0 flex items-center gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-border text-xs font-semibold text-foreground-muted hover:text-navy hover:border-navy transition-colors min-h-[44px] cursor-pointer"
            >
              Annuler
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl bg-success text-white text-xs font-bold hover:opacity-90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 min-h-[44px] cursor-pointer shadow-xs"
            >
              {loading ? (
                <InlineLoader size={16} />
              ) : (
                <>
                  <PackageCheck className="w-4 h-4" />
                  Confirmer la livraison
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
