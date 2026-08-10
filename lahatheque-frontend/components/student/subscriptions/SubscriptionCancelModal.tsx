"use client";

import React, { useEffect } from "react";
import { AlertTriangle, X, ShieldAlert, CheckCircle2 } from "lucide-react";

interface SubscriptionCancelModalProps {
  subscriptionName: string;
  expiresAt: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirmCancel: () => void;
  isSubmitting?: boolean;
}

export function SubscriptionCancelModal({
  subscriptionName,
  expiresAt,
  isOpen,
  onClose,
  onConfirmCancel,
  isSubmitting = false
}: SubscriptionCancelModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-dark/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-background border border-border w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b border-border bg-background-secondary flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-error/10 text-error rounded-xl border border-error/20">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-base font-bold text-navy">Gestion de l'abonnement</h2>
              <p className="text-[11px] text-foreground-muted">Confirmation de résiliation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-foreground-muted hover:text-navy hover:bg-background rounded-full transition-colors"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs text-foreground/90">
          <p className="font-semibold text-navy leading-relaxed">
            Êtes-vous sûr de vouloir désactiver le renouvellement automatique pour <span className="text-navy font-bold">{subscriptionName}</span> ?
          </p>

          <div className="bg-gold/10 border border-gold/30 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 font-bold text-navy">
              <ShieldAlert className="w-4 h-4 text-gold-dark shrink-0" />
              Ce qui va se passer :
            </div>
            <ul className="space-y-1.5 text-foreground-muted text-[11px] pl-6 list-disc">
              <li>
                Vos accès de lecture intégrale resteront **totalement actifs** jusqu'au{" "}
                <span className="font-bold text-navy">
                  {new Date(expiresAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                </span>.
              </li>
              <li>Aucun prélèvement supplémentaire ne sera effectué à l'échéance.</li>
              <li>Vous pourrez réactiver l'offre à tout moment depuis votre tableau de bord.</li>
            </ul>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border bg-background-secondary flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl border border-border hover:bg-background text-navy font-bold text-xs transition-colors"
          >
            Conserver mon abonnement
          </button>
          <button
            onClick={onConfirmCancel}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl bg-error hover:bg-error/90 text-white font-bold text-xs transition-colors flex items-center gap-2 shadow"
          >
            {isSubmitting ? "Traitement..." : "Confirmer la désactivation"}
          </button>
        </div>

      </div>
    </div>
  );
}
