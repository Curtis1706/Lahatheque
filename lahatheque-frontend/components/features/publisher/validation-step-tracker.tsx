"use client";

import React from "react";
import { CheckCircle2, Clock, AlertTriangle, ShieldCheck, FileText, Send, Globe } from "lucide-react";
import type { ValidationStep, PublisherBookStatus } from "@/lib/types/publisher";

interface ValidationStepTrackerProps {
  currentStep: ValidationStep;
  status: PublisherBookStatus;
  editorialComment?: string;
  className?: string;
}

const steps: { id: ValidationStep; label: string; desc: string; icon: any }[] = [
  { id: "step_1_deposited", label: "1. Dépôt Effectué", desc: "Notice & Fichier transmis", icon: FileText },
  { id: "step_2_auto_check", label: "2. Contrôle Automatique", desc: "Format, virus, complétude", icon: ShieldCheck },
  { id: "step_3_editorial_review", label: "3. Examen Éditorial", desc: "Équipe LAHA Éditions", icon: Clock },
  { id: "step_4_notification", label: "4. Notification", desc: "Approbation / Correction", icon: Send },
  { id: "step_5_published", label: "5. Publication Vitrine", desc: "Mise en ligne publique", icon: Globe },
];

export function ValidationStepTracker({
  currentStep,
  status,
  editorialComment,
  className,
}: ValidationStepTrackerProps) {
  const getStepIndex = (step: ValidationStep) => steps.findIndex((s) => s.id === step);
  const currentIdx = getStepIndex(currentStep);

  return (
    <div className={`p-6 rounded-3xl bg-background border border-border space-y-6 shadow-xs ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <h3 className="font-serif font-bold text-navy text-base">Suivi du Flux de Validation (5 Étapes)</h3>
          <p className="text-xs text-foreground-muted">Conforme au protocole de vérification de la plateforme</p>
        </div>

        {status === "revision_requested" && (
          <span className="px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-600 border border-rose-500/30 text-xs font-bold inline-flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" /> Correction Demandée
          </span>
        )}
      </div>

      {/* Steps horizontal (Stepper 21st.dev dhileepkumargm id: 7821) */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
        {steps.map((step, idx) => {
          const isPassed = idx < currentIdx || status === "published";
          const isCurrent = idx === currentIdx && status !== "published";
          const isBlocked = status === "revision_requested" && idx === currentIdx;

          return (
            <div
              key={step.id}
              className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between space-y-2 ${
                isPassed
                  ? "bg-emerald-500/5 border-emerald-500/30 text-emerald-700"
                  : isCurrent
                  ? "bg-navy/5 border-gold text-navy shadow-xs"
                  : isBlocked
                  ? "bg-rose-500/5 border-rose-500/30 text-rose-700"
                  : "bg-background-secondary border-border text-foreground-muted opacity-60"
              }`}
            >
              <div className="flex items-center justify-between">
                <step.icon
                  className={`w-4 h-4 ${
                    isPassed
                      ? "text-emerald-600"
                      : isCurrent
                      ? "text-gold"
                      : isBlocked
                      ? "text-rose-600"
                      : "text-foreground-muted"
                  }`}
                />
                {isPassed && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
              </div>

              <div>
                <p className="font-bold text-xs leading-snug">{step.label}</p>
                <p className="text-[10px] opacity-80 mt-0.5">{step.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Zone de commentaire éditorial si correction demandée */}
      {editorialComment && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-1">
          <p className="font-bold text-navy flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-gold" />
            Remarque de l&apos;Équipe Éditoriale LAHA Éditions :
          </p>
          <p className="text-foreground italic leading-relaxed">&ldquo;{editorialComment}&rdquo;</p>
        </div>
      )}
    </div>
  );
}
