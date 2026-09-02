"use client";

import React, { useState } from "react";
import { 
  CreditCard, 
  Smartphone, 
  Building2, 
  X, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight
} from "lucide-react";
import { toast } from "sonner";
import { requestAuthorPayout } from "@/lib/services/author";
import { InlineLoader } from "@/components/ui/page-loader";

export interface AuthorPayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  maxAmount: number;
  onSuccess?: () => void;
}

export function AuthorPayoutModal({
  isOpen,
  onClose,
  maxAmount,
  onSuccess,
}: AuthorPayoutModalProps) {
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("momo");
  const [accountDetails, setAccountDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(amount);

    if (!amountNum || amountNum <= 0) {
      toast.error("Veuillez saisir un montant valide.");
      return;
    }
    if (amountNum > maxAmount) {
      toast.error(`Le montant demandé ne peut excéder votre solde en attente (${maxAmount.toLocaleString("fr-FR")} XOF).`);
      return;
    }
    if (!accountDetails.trim()) {
      toast.error("Veuillez renseigner votre numéro Mobile Money ou votre IBAN bancaire.");
      return;
    }

    setSubmitting(true);
    const ok = await requestAuthorPayout(amountNum, paymentMethod, accountDetails);
    setSubmitting(false);

    if (ok) {
      toast.success("Votre demande de versement a été enregistrée avec succès. Traitement sous 48h.");
      onSuccess?.();
      onClose();
      setAmount("");
      setAccountDetails("");
    } else {
      toast.error("Une erreur est survenue lors de l'enregistrement de la demande.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-background border border-border rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gold/20 text-gold">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-navy text-base">Demande de Versement Direct</h3>
              <p className="text-[11px] text-foreground-muted">Règlement sous 48h ouvrées</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-background-secondary text-foreground-muted hover:text-navy cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-navy mb-1.5">
              Montant à verser (XOF) *
            </label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={`Max: ${maxAmount.toLocaleString("fr-FR")} XOF`}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground font-mono focus:ring-2 focus:ring-navy min-h-[44px]"
                required
              />
              <button
                type="button"
                onClick={() => setAmount(String(maxAmount))}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gold hover:underline cursor-pointer"
              >
                Tout verser
              </button>
            </div>
          </div>

          <div>
            <label className="block font-bold text-navy mb-1.5">
              Canal de Paiement
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "momo", label: "MTN MoMo", icon: Smartphone },
                { id: "moov", label: "Moov Money", icon: Smartphone },
                { id: "orange", label: "Orange / Wave", icon: Smartphone },
                { id: "bank", label: "Virement Bancaire", icon: Building2 },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentMethod(m.id)}
                  className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                    paymentMethod === m.id
                      ? "border-gold bg-gold/10 font-bold text-navy shadow-2xs"
                      : "border-border bg-background text-foreground hover:bg-background-secondary"
                  }`}
                >
                  <m.icon className="w-3.5 h-3.5 text-gold shrink-0" />
                  <span className="truncate">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-bold text-navy mb-1.5">
              {paymentMethod === "bank" ? "Numéro IBAN / RIB National UEMOA" : "Numéro de Téléphone Bénéficiaire"}
            </label>
            <input
              type="text"
              value={accountDetails}
              onChange={(e) => setAccountDetails(e.target.value)}
              placeholder={paymentMethod === "bank" ? "BJ061 01001 001234567890 12" : "+229 97 00 00 00"}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground font-mono focus:ring-2 focus:ring-navy min-h-[44px]"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-border text-foreground hover:bg-background-secondary min-h-[44px] cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-gold text-navy font-bold hover:bg-gold-light transition-colors min-h-[44px] shadow-sm disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              {submitting ? (
                <InlineLoader size={16} />
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  Confirmer le versement
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
