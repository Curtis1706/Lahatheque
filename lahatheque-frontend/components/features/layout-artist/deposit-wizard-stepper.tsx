"use client";

import React from "react";
import { motion } from "framer-motion";
import { Check, UploadCloud, FileText, Layers, Headphones } from "lucide-react";
import { cn } from "@/lib/utils";

export interface WizardStep {
  id: number;
  title: string;
  description: string;
  icon: React.ElementType;
}

export const DEPOSIT_STEPS: WizardStep[] = [
  {
    id: 1,
    title: "Fichiers & Couverture",
    description: "PDF/EPUB & Visuel",
    icon: UploadCloud,
  },
  {
    id: 2,
    title: "Métadonnées & Langue",
    description: "Titre & Détection IA",
    icon: FileText,
  },
  {
    id: 3,
    title: "Classification",
    description: "Discipline & Faculté",
    icon: Layers,
  },
  {
    id: 4,
    title: "Version Audio & DRM",
    description: "Protection automatique",
    icon: Headphones,
  },
];

interface DepositWizardStepperProps {
  currentStep: number;
  onStepClick?: (stepId: number) => void;
  className?: string;
}

export function DepositWizardStepper({
  currentStep,
  onStepClick,
  className,
}: DepositWizardStepperProps) {
  return (
    <div className={cn("w-full py-4", className)}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {DEPOSIT_STEPS.map((step) => {
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          const StepIcon = step.icon;

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => onStepClick && isCompleted && onStepClick(step.id)}
              disabled={!isCompleted && !isCurrent}
              className={cn(
                "p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between gap-2 min-h-[90px]",
                isCurrent
                  ? "bg-navy text-white border-navy shadow-md ring-2 ring-gold/40"
                  : isCompleted
                  ? "bg-background-secondary border-gold/40 text-foreground cursor-pointer hover:border-gold"
                  : "bg-background-secondary/50 border-border text-foreground-muted cursor-not-allowed opacity-60"
              )}
            >
              <div className="flex items-center justify-between w-full">
                <div
                  className={cn(
                    "w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold font-mono transition-colors",
                    isCurrent
                      ? "bg-gold text-navy"
                      : isCompleted
                      ? "bg-success text-white"
                      : "bg-navy-light text-navy"
                  )}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : step.id}
                </div>

                <StepIcon
                  className={cn(
                    "w-4 h-4",
                    isCurrent ? "text-gold" : isCompleted ? "text-success" : "text-foreground-muted"
                  )}
                />
              </div>

              <div>
                <p
                  className={cn(
                    "font-serif font-bold text-xs truncate",
                    isCurrent ? "text-white" : "text-navy"
                  )}
                >
                  {step.title}
                </p>
                <p
                  className={cn(
                    "text-[10px] truncate mt-0.5",
                    isCurrent ? "text-navy-light" : "text-foreground-muted"
                  )}
                >
                  {step.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
