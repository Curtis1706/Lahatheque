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
          Suivi du Circuit Éditorial en 2 Étapes
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
              ? "bg-success/10 border-success/30 text-success"
              : isRejected
              ? "bg-error/10 border-error/30 text-error"
              : isCorrectionRequested
              ? "bg-warning/10 border-warning/30 text-warning"
              : "bg-navy/5 border-navy/20 text-navy"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider">
              Étape 1 — Évaluation Éditoriale
            </span>
            {isStage1Done ? (
              <CheckCircle2 className="w-4 h-4 text-success" />
            ) : (
              <Clock className="w-4 h-4 text-warning" />
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
              ? "bg-success/10 border-success/30 text-success"
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
              ? "Prise en charge par le Maquettiste (mise en forme, métadonnées, DRM & Tatouage Numérique)."
              : "En attente de validation de l'Étape 1."}
          </p>
        </div>
      </div>

      {/* Note de Suivi si présente */}
      {submission.review_notes && (
        <div className="p-4 rounded-2xl bg-gold/10 border border-gold/30 text-xs text-navy space-y-1">
          <span className="font-bold flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
            <AlertCircle className="w-3.5 h-3.5 text-gold" />
            Remarques du Comité Éditorial :
          </span>
          <p className="italic text-foreground-muted leading-relaxed">« {submission.review_notes} »</p>
        </div>
      )}
    </div>
  );
}
