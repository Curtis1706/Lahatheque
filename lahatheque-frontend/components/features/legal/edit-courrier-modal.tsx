"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { FileText, Save, X, AlertCircle } from "lucide-react";
import { InlineLoader } from "@/components/ui/page-loader";
import { toast } from "sonner";
import type { CourrierOfficiel } from "@/lib/types/courrier";
import { updateCourrier } from "@/lib/services/courrier";

interface EditCourrierModalProps {
  isOpen: boolean;
  onClose: () => void;
  courrier: CourrierOfficiel | null;
  onUpdated: (updated: CourrierOfficiel) => void;
}

export function EditCourrierModal({
  isOpen,
  onClose,
  courrier,
  onUpdated,
}: EditCourrierModalProps) {
  const [subject, setSubject] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (courrier) {
      setSubject(courrier.subject || "");
      setBodyText(courrier.body_text || "");
    }
  }, [courrier]);

  if (!courrier) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) {
      toast.error("Veuillez renseigner l'objet du courrier.");
      return;
    }
    if (!bodyText.trim()) {
      toast.error("Le corps du courrier ne peut pas être vide.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await updateCourrier(courrier.id, {
        subject: subject.trim(),
        body_text: bodyText.trim(),
      });

      if (res.success && res.data) {
        toast.success("Brouillon de courrier mis à jour avec succès.");
        onUpdated(res.data);
        onClose();
      } else {
        toast.error(res.error || "Impossible d'enregistrer les modifications.");
      }
    } catch {
      toast.error("Erreur de connexion lors de la mise à jour.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-navy/10 text-navy border border-navy/20">
            <FileText className="w-5 h-5 text-gold" />
          </div>
          <div>
            <span className="font-serif font-bold text-lg text-navy block">
              Corriger le Courrier Officiel
            </span>
            <span className="text-xs text-foreground-muted font-sans font-normal mt-0.5 block">
              Réf : <span className="font-mono font-bold text-navy">{courrier.reference}</span> • Statut :{" "}
              <span className="font-bold text-gold">{courrier.status_label}</span>
            </span>
          </div>
        </div>
      }
      maxWidth={680}
    >
      <div className="space-y-4">
        {/* Métadonnées de référence en lecture seule */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-background-secondary border border-border text-xs font-sans">
          <div>
            <span className="text-foreground-muted block text-[11px] uppercase tracking-wider font-semibold">
              Destinataire officiel
            </span>
            <p className="font-bold text-navy mt-0.5">{courrier.recipient_name}</p>
            <p className="text-foreground-muted font-mono text-[11px]">{courrier.recipient_email || "Email non renseigné"}</p>
          </div>
          <div>
            <span className="text-foreground-muted block text-[11px] uppercase tracking-wider font-semibold">
              Montant concerné &amp; Période
            </span>
            <p className="font-mono font-bold text-gold mt-0.5">
              {courrier.amount.toLocaleString("fr-FR")} {courrier.currency}
            </p>
            <p className="text-foreground-muted text-[11px]">{courrier.period || "Période standard"}</p>
          </div>
        </div>

        {/* Avertissement de sécurité */}
        <div className="flex items-center gap-2 p-3 rounded-lg bg-navy/5 border border-navy/15 text-xs text-navy font-sans">
          <AlertCircle className="w-4 h-4 text-gold shrink-0" />
          <span>
            Les modifications apportées s&apos;appliquent exclusivement à ce courrier et apparaîtront instantanément sur le PDF prévisualisé.
          </span>
        </div>

        {/* Formulaire d'édition de l'objet et du corps */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-navy mb-1.5 font-sans">
              Objet officiel du courrier <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs font-sans focus:outline-none focus:border-gold transition-colors"
              placeholder="Ex : Bordereau officiel des droits d'auteur et relevé de ventes..."
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-navy mb-1.5 font-sans">
              Corps du message rédigé <span className="text-red-500">*</span>
            </label>
            <textarea
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              required
              rows={12}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:border-gold transition-colors leading-relaxed font-mono"
              placeholder="Rédigez ou ajustez le corps du courrier..."
            />
          </div>

          {/* Actions du formulaire */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl border border-border bg-background text-navy text-xs font-bold hover:bg-background-secondary transition-colors font-sans"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors inline-flex items-center gap-2 font-sans cursor-pointer shadow-xs disabled:opacity-50"
            >
              {isSaving ? <InlineLoader size={16} /> : <Save className="w-4 h-4 text-gold" />}
              <span>{isSaving ? "Enregistrement..." : "Enregistrer les modifications"}</span>
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
