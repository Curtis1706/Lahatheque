"use client";

import React, { useState } from "react";
import {
  CreditCard,
  Smartphone,
  Building2,
  X,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { requestRoyaltyPayout } from "@/lib/services/publisher";
import { InlineLoader } from "@/components/ui/page-loader";

export interface PublisherPayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  maxAmount: number;
  onSuccess?: () => void;
}

export function PublisherPayoutModal({
  isOpen,
  onClose,
  maxAmount,
  onSuccess,
}: PublisherPayoutModalProps) {
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("bank");
  const [accountDetails, setAccountDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const minThreshold = 50000;
  const isEligible = maxAmount >= minThreshold;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(amount);

    if (!amountNum || isNaN(amountNum) || amountNum <= 0) {
      toast.error("Veuillez saisir un montant numérique valide.");
      return;
    }
    if (amountNum < minThreshold) {
      toast.error(
        `Le montant minimum de versement pour un éditeur partenaire est de ${minThreshold.toLocaleString("fr-FR")} XOF.`
      );
      return;
    }
    if (amountNum > maxAmount) {
      toast.error(
        `Le montant demandé ne peut excéder votre solde retirable disponible (${maxAmount.toLocaleString("fr-FR")} XOF).`
      );
      return;
    }
    if (!accountDetails.trim()) {
      toast.error(
        "Veuillez renseigner les coordonnées bancaires (IBAN/RIB) ou le numéro Mobile Money du compte entreprise."
      );
      return;
    }

    const methodLabels: Record<string, string> = {
      bank: "Virement Bancaire (UEMOA)",
      momo: "MTN Mobile Money Pro",
      moov: "Moov Money Flooz Pro",
    };
    const methodName = methodLabels[paymentMethod] || "Virement Bancaire";

    setSubmitting(true);
    try {
      const ok = await requestRoyaltyPayout(amountNum, methodName, accountDetails.trim());
      if (ok) {
        toast.success(
          `Demande de virement de ${amountNum.toLocaleString("fr-FR")} XOF transmise au service comptabilité. Traitement sous 48h ouvrées.`
        );
        onSuccess?.();
        onClose();
        setAmount("");
        setAccountDetails("");
      } else {
        toast.error("Échec de la transmission de la demande de virement.");
      }
    } catch {
      toast.error("Une erreur est survenue lors de l'enregistrement de la demande.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4 overflow-hidden">
      <div className="bg-background border border-border rounded-3xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col max-h-[min(90dvh,720px)] animate-in fade-in zoom-in-95 duration-200">
        {/* Header fixe */}
        <div className="flex items-center justify-between p-5 sm:p-6 pb-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gold/20 text-gold">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-navy text-base">
                Demande de Virement Éditeur
              </h3>
              <p className="text-[11px] text-foreground-muted">
                Règlement comptable sous 48h ouvrées
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-background-secondary text-foreground-muted hover:text-navy cursor-pointer transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulaire avec corps scrollable et footer fixe */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Corps scrollable */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-5 sm:p-6 space-y-4 text-xs">
            {/* Seuil minimum réglementaire */}
            <div className="p-3 rounded-2xl bg-navy-light border border-navy-hover/20 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-gold shrink-0 mt-0.5" />
              <div className="text-[11px] text-navy leading-relaxed">
                <p className="font-bold">Seuil minimum contractuel : 50 000 XOF</p>
                <p className="text-foreground-muted mt-0.5">
                  Les virements vers les maisons d&apos;édition partenaires sont liquidés à partir d&apos;un montant minimum cumulé de 50 000 XOF.
                </p>
              </div>
            </div>

            <div>
              <label className="block font-bold text-navy mb-1.5">
                Montant du Virement (XOF) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={minThreshold}
                  max={Math.max(0, maxAmount)}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={`Min: 50 000 • Max: ${maxAmount.toLocaleString("fr-FR")} XOF`}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground font-mono focus:ring-2 focus:ring-navy min-h-[44px]"
                  required
                />
                {isEligible && (
                  <button
                    type="button"
                    onClick={() => setAmount(String(Math.floor(maxAmount)))}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gold hover:underline cursor-pointer"
                  >
                    Tout verser
                  </button>
                )}
              </div>

              {!isEligible && (
                <p className="text-[11px] text-warning mt-1.5 font-medium">
                  Votre solde disponible retirable est actuellement de {maxAmount.toLocaleString("fr-FR")} XOF, inférieur au seuil minimal de 50 000 XOF.
                </p>
              )}
            </div>

            <div>
              <label className="block font-bold text-navy mb-1.5">
                Canal de Règlement de l&apos;Éditeur *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { id: "bank", label: "Virement Bancaire", icon: Building2 },
                  { id: "momo", label: "MTN MoMo Pro", icon: Smartphone },
                  { id: "moov", label: "Moov Flooz Pro", icon: Smartphone },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id)}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer min-h-[44px] ${
                      paymentMethod === m.id
                        ? "border-gold bg-gold/10 font-bold text-navy shadow-2xs"
                        : "border-border bg-background text-foreground hover:bg-background-secondary"
                    }`}
                  >
                    <m.icon className="w-3.5 h-3.5 text-gold shrink-0" />
                    <span className="truncate text-[11px]">{m.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-bold text-navy mb-1.5">
                {paymentMethod === "bank"
                  ? "Coordonnées Bancaires (IBAN / RIB UEMOA / Banque) *"
                  : "Numéro de Compte Professionnel Marchand *"}
              </label>
              <input
                type="text"
                value={accountDetails}
                onChange={(e) => setAccountDetails(e.target.value)}
                placeholder={
                  paymentMethod === "bank"
                    ? "BJ061 01001 001234567890 12 (BOA Bénin)"
                    : "+229 97 00 00 00 (Compte Marchand)"
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground font-mono focus:ring-2 focus:ring-navy min-h-[44px]"
                required
              />
              <p className="text-[10px] text-foreground-muted mt-1">
                Le compte bénéficiaire doit correspondre à la raison sociale déclarée au contrat.
              </p>
            </div>
          </div>

          {/* Footer fixe */}
          <div className="p-4 sm:p-6 border-t border-border bg-background-secondary/30 shrink-0 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-border text-foreground hover:bg-background-secondary min-h-[44px] cursor-pointer transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting || !isEligible}
              className="px-5 py-2.5 rounded-xl bg-gold text-navy font-bold hover:bg-gold-light transition-colors min-h-[44px] shadow-xs disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              {submitting ? (
                <>
                  <InlineLoader size={16} />
                  <span>Traitement...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirmer la Demande</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
