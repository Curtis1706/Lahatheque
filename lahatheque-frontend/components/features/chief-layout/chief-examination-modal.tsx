"use client";

import React, { useState } from "react";
import { CheckCircle2, AlertCircle, X, ShieldCheck, User, Sparkles, FileText, Send, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { StatusBadge } from "@/components/ui/status-badge";
import { AISuggestionBadge } from "@/components/features/layout-artist/ai-suggestion-badge";
import type { LayoutDeposit } from "@/lib/types/layout-artist";

interface ChiefExaminationModalProps {
  deposit: LayoutDeposit | null;
  isOpen: boolean;
  onClose: () => void;
  onValidate: (id: string) => Promise<void>;
  onReject: (id: string, reason: string) => Promise<void>;
}

export function ChiefExaminationModal({
  deposit,
  isOpen,
  onClose,
  onValidate,
  onReject,
}: ChiefExaminationModalProps) {
  const [mode, setMode] = useState<"view" | "reject">("view");
  const [rejectReason, setRejectReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !deposit) return null;

  const handleValidate = async () => {
    setLoading(true);
    try {
      await onValidate(deposit.id);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectReason.trim()) {
      setError("Veuillez obligatoirement indiquer le motif du refus et les corrections à effectuer.");
      return;
    }
    setLoading(true);
    try {
      await onReject(deposit.id, rejectReason.trim());
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleResetAndClose = () => {
    setMode("view");
    setRejectReason("");
    setError(null);
    onClose();
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-navy-dark/70 backdrop-blur-sm p-4 overflow-y-auto"
        onClick={handleResetAndClose}
        role="dialog"
        aria-modal="true"
        aria-label={`Examen du dépôt : ${deposit.metadata.title}`}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="bg-background border border-border rounded-3xl shadow-2xl w-full max-w-2xl p-6 space-y-6 my-8 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Modale */}
          <div className="flex items-start justify-between border-b border-border pb-4">
            <div className="space-y-1 pr-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gold bg-gold/10 px-2.5 py-0.5 rounded-full border border-gold/20 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Examen du Chef Maquettiste
                </span>
                <StatusBadge status={deposit.status} />
              </div>
              <h2 className="font-serif font-bold text-navy text-xl sm:text-2xl leading-tight">
                {deposit.metadata.title}
              </h2>
              <p className="text-xs text-foreground-muted flex items-center gap-1.5 pt-0.5">
                <User className="w-3.5 h-3.5 text-gold" />
                Soumis par <span className="font-semibold text-foreground">{deposit.maquettiste_name}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={handleResetAndClose}
              className="p-2 rounded-xl hover:bg-background-secondary text-foreground-muted hover:text-navy transition-colors shrink-0"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mode 1 : Visualisation de l'examen */}
          {mode === "view" && (
            <div className="space-y-5">
              {/* Carte Couverture + Métadonnées */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-background-secondary p-4 rounded-2xl border border-border">
                {deposit.files.cover_url ? (
                  <div className="relative aspect-[3/4] rounded-xl overflow-hidden shadow-sm border border-border bg-background">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={deposit.files.cover_url}
                      alt={deposit.metadata.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="aspect-[3/4] rounded-xl bg-navy/10 flex flex-col items-center justify-center p-3 text-center border border-border">
                    <FileText className="w-8 h-8 text-navy/40 mb-1" />
                    <span className="text-[10px] text-foreground-muted">Sans couverture</span>
                  </div>
                )}

                <div className="sm:col-span-2 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-foreground-muted">Discipline :</span>
                    <span className="font-bold text-navy">{deposit.classification.discipline}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-foreground-muted">Auteur(s) :</span>
                    <span className="font-semibold text-foreground">{deposit.metadata.authors.join(", ")}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-foreground-muted">Établissement :</span>
                    <span className="text-foreground text-right">{deposit.classification.university}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-foreground-muted">Langue :</span>
                    <span className="font-medium text-foreground">{deposit.metadata.language}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-foreground-muted">Format épreuve :</span>
                    <span className="font-mono font-bold text-gold">{deposit.files.format}</span>
                  </div>
                  {deposit.metadata.isbn && (
                    <div className="flex items-center justify-between">
                      <span className="text-foreground-muted">Code ISBN :</span>
                      <span className="font-mono text-foreground">{deposit.metadata.isbn}</span>
                    </div>
                  )}
                  <div className="pt-1 border-t border-border flex items-center justify-between">
                    <span className="text-[11px] text-foreground-muted">Classification IA :</span>
                    <AISuggestionBadge source={deposit.classification.source} />
                  </div>
                </div>
              </div>

              {/* Résumé éditorial */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-navy uppercase tracking-wider">Résumé de l&apos;ouvrage</h4>
                <p className="text-xs text-foreground bg-background p-3.5 rounded-2xl border border-border leading-relaxed">
                  {deposit.metadata.summary || "Aucun résumé renseigné."}
                </p>
              </div>

              {/* DRM & Filigrane */}
              <div className="p-3.5 rounded-2xl bg-background-secondary border border-border flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-gold" />
                  <span className="font-semibold text-navy">Sécurité &amp; Filigrane Numérique DRM</span>
                </div>
                <StatusBadge status="approved" leftLabel="Filigrane &amp; DRM Actifs" />
              </div>

              {/* Actions de Décision */}
              <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMode("reject")}
                  className="w-full sm:flex-1 py-3 px-4 rounded-2xl border border-error/30 bg-error/10 text-error text-xs font-bold hover:bg-error/20 transition-colors flex items-center justify-center gap-2 min-h-[44px]"
                >
                  <AlertCircle className="w-4 h-4" />
                  Refuser / Demander correction
                </button>

                <button
                  type="button"
                  onClick={handleValidate}
                  disabled={loading}
                  className="w-full sm:flex-1 py-3 px-6 rounded-2xl bg-success text-white text-xs font-bold hover:opacity-90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 min-h-[44px] shadow-sm"
                >
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Valider &amp; Publier sur la Vitrine
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Mode 2 : Formulation obligatoire du motif de refus */}
          {mode === "reject" && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-error/10 border border-error/20 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-error shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-error uppercase tracking-wider">
                    Motif du Refus &amp; Corrections à effectuer
                  </h4>
                  <p className="text-xs text-foreground-muted">
                    Expliquez au maquettiste <span className="font-semibold text-foreground">{deposit.maquettiste_name}</span> les éléments précis à corriger (alignement, typographie, épreuve manquante, résumé...) avant nouvelle soumission.
                  </p>
                </div>
              </div>

              <div>
                <label htmlFor="refusal-reason" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
                  Instructions détaillées de correction *
                </label>
                <textarea
                  id="refusal-reason"
                  rows={5}
                  value={rejectReason}
                  onChange={(e) => {
                    setRejectReason(e.target.value);
                    setError(null);
                  }}
                  placeholder="Ex: Le chapitre 2 comporte des erreurs de mise en page sur les marges. Veuillez également ajouter la version EPUB lisible et corriger le nom de l'auteur..."
                  className={`w-full p-3.5 text-xs rounded-2xl border ${
                    error ? "border-error focus:border-error" : "border-border focus:border-gold"
                  } bg-background text-foreground focus:outline-none resize-none`}
                  autoFocus
                />
                {error && <p className="text-[11px] text-error font-medium mt-1">{error}</p>}
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setMode("view")}
                  className="px-4 py-2.5 rounded-xl border border-border text-xs font-semibold text-foreground-muted hover:text-navy min-h-[44px]"
                >
                  Retour à l&apos;examen
                </button>

                <button
                  type="button"
                  onClick={handleConfirmReject}
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl bg-error text-white text-xs font-bold hover:bg-error-hover transition-colors flex items-center gap-2 disabled:opacity-50 min-h-[44px] shadow-sm"
                >
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Confirmer le Refus &amp; Transmettre au Maquettiste
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
