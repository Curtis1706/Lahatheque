"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { CheckCircle2, Send, AlertTriangle, X } from "lucide-react";
import { InlineLoader } from "@/components/ui/page-loader";
import { toast } from "sonner";
import type { CourrierOfficiel } from "@/lib/types/courrier";
import { validateCourrier, cancelCourrier, sendCourrierEmail } from "@/lib/services/courrier";

// ─── Modale de Validation Définitive (Valider) ──────────────────────────────

interface ValidateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  courrier: CourrierOfficiel | null;
  onSuccess: (updated: CourrierOfficiel) => void;
}

export function ValidateCourrierDialog({
  isOpen,
  onClose,
  courrier,
  onSuccess,
}: ValidateDialogProps) {
  const [loading, setLoading] = useState(false);

  if (!courrier) return null;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const res = await validateCourrier(courrier.id);
      if (res.success && res.data) {
        toast.success("Le courrier a été validé et le PDF officiel a été scellé définitivement.");
        onSuccess(res.data);
        onClose();
      } else {
        toast.error(res.error || "Impossible de valider le courrier.");
      }
    } catch {
      toast.error("Erreur de connexion lors de la validation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gold/15 text-gold border border-gold/30">
            <CheckCircle2 className="w-5 h-5 text-gold" />
          </div>
          <div>
            <span className="font-serif font-bold text-base text-navy block">
              Valider et Sceller le Courrier
            </span>
            <span className="text-xs text-foreground-muted font-mono block mt-0.5">
              Réf : {courrier.reference}
            </span>
          </div>
        </div>
      }
      maxWidth={520}
    >
      <div className="space-y-4">
        <div className="space-y-2 text-xs text-foreground-muted font-sans leading-relaxed">
          <p>
            Vous êtes sur le point de valider officiellement le courrier destiné à{" "}
            <strong className="text-navy">{courrier.recipient_name}</strong> (Montant :{" "}
            <strong className="text-gold font-mono">{courrier.amount.toLocaleString("fr-FR")} {courrier.currency}</strong>).
          </p>
          <div className="p-3 rounded-xl bg-navy/5 border border-navy/15 text-navy space-y-1">
            <p className="font-bold">Conséquences de la validation :</p>
            <ul className="list-disc list-inside space-y-0.5 text-[11px]">
              <li>Le texte du courrier et l&apos;objet sont irrévocablement figés.</li>
              <li>Le document PDF final certifié est scellé sur le gabarit officiel.</li>
              <li>L&apos;action d&apos;expédition par e-mail devient disponible.</li>
            </ul>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-xl border border-border bg-background text-navy text-xs font-bold hover:bg-background-secondary transition-colors"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors inline-flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
          >
            {loading ? <InlineLoader size={16} /> : <CheckCircle2 className="w-4 h-4 text-gold" />}
            <span>{loading ? "Validation en cours..." : "Confirmer la validation"}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Modale d'Expédition d'E-mail (Envoyer) ──────────────────────────────────

interface SendEmailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  courrier: CourrierOfficiel | null;
  onSuccess: (updated: CourrierOfficiel) => void;
}

export function SendCourrierEmailDialog({
  isOpen,
  onClose,
  courrier,
  onSuccess,
}: SendEmailDialogProps) {
  const [loading, setLoading] = useState(false);

  if (!courrier) return null;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const res = await sendCourrierEmail(courrier.id);
      if (res.success && res.data) {
        toast.success(`Courrier expédié avec succès à ${courrier.recipient_email}.`);
        onSuccess(res.data);
        onClose();
      } else {
        toast.error(res.error || "Impossible d'expédier l'e-mail.");
      }
    } catch {
      toast.error("Erreur de connexion lors de l'envoi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-navy text-white shadow-xs">
            <Send className="w-5 h-5 text-gold" />
          </div>
          <div>
            <span className="font-serif font-bold text-base text-navy block">
              Expédier le Courrier Officiel
            </span>
            <span className="text-xs text-foreground-muted font-mono block mt-0.5">
              Réf : {courrier.reference}
            </span>
          </div>
        </div>
      }
      maxWidth={520}
    >
      <div className="space-y-4">
        <div className="space-y-3 text-xs text-foreground-muted font-sans leading-relaxed">
          <p>
            Le courrier officiel et son PDF certifié scellé vont être transmis immédiatement à l&apos;adresse suivante :
          </p>
          <div className="p-3 rounded-xl bg-background-secondary border border-border">
            <p className="font-bold text-navy text-xs">{courrier.recipient_name}</p>
            <p className="font-mono text-gold text-xs mt-0.5">{courrier.recipient_email}</p>
            <p className="text-[11px] text-foreground-muted mt-1">Objet : {courrier.subject}</p>
          </div>
          <p className="text-[11px] text-navy/80">
            Le corps du message reprendra l&apos;intégralité du texte rédigé et le PDF officiel sera joint au courriel.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-xl border border-border bg-background text-navy text-xs font-bold hover:bg-background-secondary transition-colors"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors inline-flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
          >
            {loading ? <InlineLoader size={16} /> : <Send className="w-4 h-4 text-gold" />}
            <span>{loading ? "Expédition en cours..." : "Confirmer l'envoi"}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Modale d'Annulation Simple (Annuler) ────────────────────────────────────

interface CancelDialogProps {
  isOpen: boolean;
  onClose: () => void;
  courrier: CourrierOfficiel | null;
  onSuccess: (updated: CourrierOfficiel) => void;
}

export function CancelCourrierDialog({
  isOpen,
  onClose,
  courrier,
  onSuccess,
}: CancelDialogProps) {
  const [loading, setLoading] = useState(false);

  if (!courrier) return null;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const res = await cancelCourrier(courrier.id);
      if (res.success && res.data) {
        toast.success("Le courrier a été annulé avec succès.");
        onSuccess(res.data);
        onClose();
      } else {
        toast.error(res.error || "Impossible d'annuler le courrier.");
      }
    } catch {
      toast.error("Erreur de connexion lors de l'annulation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-red-500/10 text-red-600 border border-red-500/20">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <span className="font-serif font-bold text-base text-navy block">
              Confirmer l&apos;annulation
            </span>
            <span className="text-xs text-foreground-muted font-mono block mt-0.5">
              Réf : {courrier.reference}
            </span>
          </div>
        </div>
      }
      maxWidth={520}
    >
      <div className="space-y-4">
        <div className="space-y-2 text-xs text-foreground-muted font-sans leading-relaxed">
          <p>
            Êtes-vous sûr de vouloir annuler ce courrier officiel destiné à{" "}
            <strong className="text-navy">{courrier.recipient_name}</strong> ?
          </p>
          <p className="text-[11px] text-red-600/90 font-medium">
            Le document sera neutralisé et ne pourra plus être validé ni expédié. Il demeurera conservé dans la table d&apos;historique à des fins de traçabilité juridique.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-xl border border-border bg-background text-navy text-xs font-bold hover:bg-background-secondary transition-colors"
          >
            Conserver le courrier
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors inline-flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
          >
            {loading ? <InlineLoader size={16} /> : <AlertTriangle className="w-4 h-4" />}
            <span>{loading ? "Annulation..." : "Confirmer l'annulation"}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
