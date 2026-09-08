"use client";

import React, { useState } from "react";
import { AdminPayoutRequest } from "@/lib/types/admin";
import { rejectPayoutRequest } from "@/lib/services/admin";
import { X, AlertTriangle, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface PayoutRejectionModalProps {
  payout: AdminPayoutRequest;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function PayoutRejectionModal({
  payout,
  isOpen,
  onClose,
  onSuccess,
}: PayoutRejectionModalProps) {
  const [reason, setReason] = useState<string>("");
  const [adminNotes, setAdminNotes] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || reason.trim().length < 3) {
      setError("Veuillez indiquer un motif précis de refus pour notifier l'ayant-droit.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const res = await rejectPayoutRequest(
        payout.id,
        reason.trim(),
        adminNotes.trim() || undefined
      );

      if (res.success) {
        toast.success(res.message || "Demande de versement rejetée.");
        onSuccess();
        onClose();
      } else {
        setError(res.error || "Erreur lors du rejet du versement.");
      }
    } catch {
      setError("Une erreur inattendue est survenue.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl border border-border bg-background p-5 sm:p-6 shadow-xl space-y-5 text-foreground font-poppins"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-navy/10 text-navy">
              <AlertTriangle className="w-5 h-5 text-navy" />
            </span>
            <div>
              <h3 className="font-playfair font-bold text-base sm:text-lg text-navy">
                Rejeter la Demande de Versement
              </h3>
              <p className="text-xs text-foreground-muted">
                Notification officielle à l&apos;ayant-droit
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-foreground-muted hover:text-foreground hover:bg-background-secondary transition-colors cursor-pointer"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Détails du versement */}
        <div className="p-3.5 rounded-xl bg-background-secondary/60 border border-border space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-foreground-muted">Bénéficiaire :</span>
            <span className="font-semibold text-foreground">
              {payout.beneficiary_name}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-foreground-muted">Motif de la demande :</span>
            <span className="font-medium text-foreground line-clamp-1">
              {payout.purpose_label}
            </span>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-border/50">
            <span className="font-medium text-foreground-muted">Montant concerné :</span>
            <span className="font-mono font-bold text-sm text-foreground">
              {payout.net_payout_amount.toLocaleString("fr-FR")} FCFA
            </span>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-navy-light text-navy text-xs flex items-center gap-2 border border-navy/20">
            <AlertCircle className="w-4 h-4 text-navy shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="block font-medium text-foreground">
              Motif du refus (sera communiqué à l&apos;ayant-droit) <span className="text-gold">*</span>
            </label>
            <textarea
              required
              rows={3}
              placeholder="Ex: Coordonnées bancaires non conformes, justificatif RIB manquant, réconciliation de redevances en cours..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-gold/40 text-xs resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block font-medium text-foreground">
              Notes internes / Audit financier (facultatif)
            </label>
            <textarea
              rows={2}
              placeholder="Notes pour l'équipe financière..."
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-gold/40 text-xs resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl border border-border hover:bg-background-secondary text-foreground text-xs font-medium transition-colors cursor-pointer min-h-[40px]"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-navy text-white text-xs font-semibold hover:bg-navy-hover transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50 min-h-[40px]"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Traitement en cours...
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-gold" />
                  Confirmer le Rejet
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
