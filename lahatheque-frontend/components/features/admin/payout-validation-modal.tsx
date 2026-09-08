"use client";

import React, { useState } from "react";
import { AdminPayoutRequest } from "@/lib/types/admin";
import { validatePayoutRequest } from "@/lib/services/admin";
import { X, CheckCircle2, UploadCloud, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface PayoutValidationModalProps {
  payout: AdminPayoutRequest;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function PayoutValidationModal({
  payout,
  isOpen,
  onClose,
  onSuccess,
}: PayoutValidationModalProps) {
  const [transactionRef, setTransactionRef] = useState<string>("");
  const [payoutDate, setPayoutDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [adminNotes, setAdminNotes] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transactionRef.trim()) {
      setError("La référence de transaction ou de virement est obligatoire.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const res = await validatePayoutRequest(payout.id, {
        transaction_reference: transactionRef.trim(),
        payout_date: payoutDate,
        receipt_file: receiptFile,
        admin_notes: adminNotes.trim() || undefined,
      });

      if (res.success) {
        toast.success(res.message || "Versement validé avec succès.");
        onSuccess();
        onClose();
      } else {
        setError(res.error || "Erreur lors de la validation du versement.");
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
              <CheckCircle2 className="w-5 h-5 text-gold" />
            </span>
            <div>
              <h3 className="font-playfair font-bold text-base sm:text-lg text-navy">
                Valider le Versement
              </h3>
              <p className="text-xs text-foreground-muted">
                Confirmation d&apos;exécution du décaissement
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
            <span className="text-foreground-muted">Motif :</span>
            <span className="font-medium text-foreground line-clamp-1">
              {payout.purpose_label}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-foreground-muted">Coordonnées :</span>
            <span className="font-mono text-foreground font-medium">
              {payout.payment_details_preview}
            </span>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-border/50">
            <span className="font-medium text-foreground-muted">Montant net à décaisser :</span>
            <span className="font-mono font-bold text-base text-navy">
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
              Référence de Transaction / N° Bordereau <span className="text-gold">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Ex: MOMO-BJ-20260908-8491 ou VIR-BOA-9921"
              value={transactionRef}
              onChange={(e) => setTransactionRef(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-gold/40 text-xs font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block font-medium text-foreground">
              Date d&apos;exécution du paiement
            </label>
            <input
              type="date"
              value={payoutDate}
              onChange={(e) => setPayoutDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-gold/40 text-xs font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block font-medium text-foreground">
              Bordereau / Reçu de Paiement (facultatif - PDF ou Image)
            </label>
            <div className="relative">
              <input
                type="file"
                accept=".pdf,image/png,image/jpeg,image/webp"
                onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-foreground-muted file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-navy/5 file:text-navy hover:file:bg-navy/10 cursor-pointer"
              />
            </div>
            {receiptFile && (
              <p className="text-[11px] text-foreground-muted flex items-center gap-1 mt-1">
                <UploadCloud className="w-3 h-3 text-gold" />
                Fichier sélectionné : {receiptFile.name} ({(receiptFile.size / 1024).toFixed(0)} Ko)
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block font-medium text-foreground">
              Notes internes / Commentaire (facultatif)
            </label>
            <textarea
              rows={2}
              placeholder="Observations financières..."
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
                  Validation en cours...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-gold" />
                  Confirmer le Versement
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
