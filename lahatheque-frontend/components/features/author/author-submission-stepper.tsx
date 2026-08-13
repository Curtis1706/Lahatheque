"use client";

import React from "react";
import { CheckCircle2, Clock, FileText, Sparkles, BookOpen, AlertCircle, ArrowRight } from "lucide-react";
import type { AuthorSubmission } from "@/lib/types/author";

interface AuthorSubmissionStepperProps {
  submission: AuthorSubmission;
  className?: string;
}

export function AuthorSubmissionStepper({ submission, className }: AuthorSubmissionStepperProps) {
  const isStage1Done = [
    "accepted",
    "catalog_preparation",
    "validation_pending",
    "published",
  ].includes(submission.status);

  const isRejected = submission.status === "rejected";
  const isCorrectionRequested = submission.status === "correction_requested";
  const isPublished = submission.status === "published";

  return (
    <div className={`p-6 rounded-3xl bg-background border border-border space-y-6 shadow-xs ${className}`}>
      <div className="flex items-center justify-between border-b border-border pb-3">
        <h3 className="font-serif font-bold text-navy text-sm uppercase tracking-wider">
          Suivi des 2 Étapes du Dépôt (Section 4.1 Cahier v3.2)
        </h3>
        <span className="text-[10px] text-foreground-muted font-mono uppercase font-bold">
          {submission.version_type}
        </span>
      </div>

      {/* Stepper Visuel 2 Étapes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Étape 1 : Étude Éditoriale (Auteur → LAHA) */}
        <div
          className={`p-4 rounded-2xl border transition-all space-y-2 ${
            isStage1Done
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-900"
              : isRejected
              ? "bg-rose-500/10 border-rose-500/30 text-rose-900"
              : isCorrectionRequested
              ? "bg-amber-500/10 border-amber-500/30 text-amber-900"
              : "bg-navy/5 border-navy/20 text-navy"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">
              Étape 1 — Évaluation Éditoriale
            </span>
            {isStage1Done ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <Clock className="w-4 h-4 text-amber-600" />
            )}
          </div>
          <h4 className="font-serif font-bold text-sm">Examen par l&apos;Équipe LAHA Éditions</h4>
          <p className="text-[11px] opacity-80 leading-relaxed">
            {isStage1Done
              ? "Manuscrit accepté ! Transmis au Maquettiste pour préparation du catalogue."
              : isRejected
              ? "Dépôt non retenu après évaluation éditoriale."
              : isCorrectionRequested
              ? "Des corrections de fond sont demandées avant ré-examen."
              : "Manuscrit en cours d'étude par le comité de lecture."}
          </p>
        </div>

        {/* Étape 2 : Préparation Catalogue (Maquettiste → Chef Maquettiste → Publication) */}
        <div
          className={`p-4 rounded-2xl border transition-all space-y-2 ${
            isPublished
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-900"
              : isStage1Done
              ? "bg-navy/5 border-navy/20 text-navy"
              : "bg-background-secondary border-border text-foreground-muted opacity-60"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">
              Étape 2 — Préparation Catalogue
            </span>
            {isPublished ? (
              <Sparkles className="w-4 h-4 text-gold" />
            ) : (
              <BookOpen className="w-4 h-4 text-foreground-muted" />
            )}
          </div>
          <h4 className="font-serif font-bold text-sm">Mise en Forme &amp; Validation Finale</h4>
          <p className="text-[11px] opacity-80 leading-relaxed">
            {isPublished
              ? "Ouvrage publié ! Disponible à la vente et visible dans Mes Livres."
              : isStage1Done
              ? "Prise en charge par le Maquettiste (mise en forme, métadonnées, DRM LCP)."
              : "En attente de validation de l'Étape 1."}
          </p>
        </div>
      </div>

      {/* Commentaires ou Notes de l'Équipe Éditoriale */}
      {submission.review_notes && (
        <div className="p-4 rounded-2xl bg-background-secondary border border-border space-y-1 text-xs">
          <span className="font-bold text-navy block flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-gold" />
            Commentaires de l&apos;Équipe Éditoriale :
          </span>
          <p className="text-foreground-muted leading-relaxed italic">{submission.review_notes}</p>
        </div>
      )}
    </div>
  );
}
