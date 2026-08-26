"use client";

import React, { useState } from "react";
import { AlertTriangle, Send } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { InlineLoader } from "@/components/ui/page-loader";

interface CancelOrderModalProps {
  orderId: string | null;
  orderReference?: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirmCancel: (orderId: string, reason: string) => Promise<void>;
}

export function CancelOrderModal({
  orderId,
  orderReference,
  isOpen,
  onClose,
  onConfirmCancel,
}: CancelOrderModalProps) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!orderId) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    setSubmitting(true);
    try {
      await onConfirmCancel(orderId, reason.trim());
      setReason("");
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-rose-600 font-serif font-bold text-base">
          <AlertTriangle className="w-5 h-5" />
          Demande d&apos;Annulation de Commande Groupée
        </div>
      }
      maxWidth={480}
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <p className="text-xs text-foreground-muted leading-relaxed">
          Vous êtes sur le point de demander l&apos;annulation de la commande groupée{" "}
          <span className="font-bold text-navy font-mono">{orderReference || orderId}</span>.
        </p>

        <div>
          <label htmlFor="cancel-reason" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
            Motif de la Demande d&apos;Annulation *
          </label>
          <textarea
            id="cancel-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="ex. Erreur de saisie de volume, révision du budget annuel..."
            className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl text-navy focus:outline-none focus:border-gold min-h-[90px]"
            required
          />
        </div>

        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
          <span>Cette action annulera la commande si elle n&apos;est pas encore expédiée/livrée.</span>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-foreground-muted hover:text-navy"
          >
            Fermer sans annuler
          </button>
          <button
            type="submit"
            disabled={submitting || !reason.trim()}
            className="px-5 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors inline-flex items-center gap-2 min-h-[40px] disabled:opacity-50"
          >
            {submitting ? (
              <InlineLoader size={16} />
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                Confirmer l&apos;Annulation
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
