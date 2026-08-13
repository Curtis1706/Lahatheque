"use client";

import React, { useState } from "react";
import { Sparkles, CheckCircle2, ShieldCheck, Send } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import type { UniversityBundle } from "@/lib/types/librarian";

interface SubscribeBundleModalProps {
  bundle: UniversityBundle | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmSubscribe: (bundleId: string) => Promise<void>;
}

export function SubscribeBundleModal({
  bundle,
  isOpen,
  onClose,
  onConfirmSubscribe,
}: SubscribeBundleModalProps) {
  const [submitting, setSubmitting] = useState(false);

  if (!bundle) return null;

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await onConfirmSubscribe(bundle.id);
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
        <div className="flex items-center gap-2 text-navy font-serif font-bold text-base">
          <Sparkles className="w-5 h-5 text-gold" />
          Confirmation de Souscription au Bouquet
        </div>
      }
      maxWidth={500}
    >
      <div className="space-y-4 pt-2 text-xs">
        <p className="text-foreground-muted leading-relaxed">
          Vous êtes sur le point d&apos;abonner votre établissement au bouquet documentaire{" "}
          <span className="font-bold text-navy">{bundle.title}</span>.
        </p>

        <div className="p-4 rounded-2xl bg-background-secondary border border-border space-y-2">
          <div className="flex justify-between font-bold text-navy">
            <span>Nombre d&apos;Ouvrages Inclus :</span>
            <span className="font-mono text-gold">{bundle.book_count} titres</span>
          </div>
          <div className="flex justify-between font-bold text-navy">
            <span>Tarif d&apos;Abonnement Institutionnel :</span>
            <span className="font-mono text-gold">{bundle.subscription_price.toLocaleString("fr-FR")} XOF / an</span>
          </div>
          <div className="flex justify-between text-[11px] text-foreground-muted border-t border-border pt-2">
            <span>Durée du Pass :</span>
            <span>12 mois à compter de la validation</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-gold/10 border border-gold/30 text-navy space-y-1">
          <p className="font-bold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-gold" />
            Accès Enseignants &amp; Étudiants :
          </p>
          <p className="text-[11px] text-foreground-muted">
            Les enseignants et étudiants rattachés consomment librement via leur compte client connecté à cet abonnement.
          </p>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-foreground-muted hover:text-navy"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            className="px-5 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors inline-flex items-center gap-2 shadow-xs min-h-[44px] disabled:opacity-50"
          >
            {submitting ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-gold" />
                Valider la Souscription
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
