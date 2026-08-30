"use client";

import React, { useEffect, useState } from "react";
import { 
  UploadCloud, 
  ShieldCheck, 
  FileCheck2, 
  Send, 
  CheckCircle2, 
  Loader2 
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface DepositSubmissionModalProps {
  isOpen: boolean;
  fileName?: string;
  fileSizeMb?: number;
  status: "idle" | "uploading" | "processing" | "registering" | "success" | "error";
  errorMessage?: string;
  realProgress?: number;
}

const STEPS = [
  {
    id: "prep",
    title: "Chiffrement et vérification de l'épreuve",
    description: "Contrôle d'intégrité et préparation du conteneur sécurisé",
    icon: ShieldCheck,
  },
  {
    id: "upload",
    title: "Téléversement direct vers Cloudflare R2",
    description: "Transfert sécurisé haute vitesse sans passer par le serveur Web",
    icon: UploadCloud,
  },
  {
    id: "onix",
    title: "Génération de la notice ONIX 3.0",
    description: "Structuration des métadonnées et de la classification Dewey",
    icon: FileCheck2,
  },
  {
    id: "notify",
    title: "Transmission au Chef Maquettiste",
    description: "Inscription au registre des épreuves à valider",
    icon: Send,
  },
];

export function DepositSubmissionModal({
  isOpen,
  fileName,
  fileSizeMb,
  status,
  errorMessage,
  realProgress,
}: DepositSubmissionModalProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState(10);

  useEffect(() => {
    if (!isOpen) {
      setCurrentStepIndex(0);
      setProgress(10);
      return;
    }

    if (realProgress !== undefined && realProgress > 0) {
      setCurrentStepIndex(1);
      // Échelle 0-100% de l'upload mappée sur 15% à 75% du flux global
      const mapped = Math.min(75, Math.max(15, Math.round(realProgress * 0.75)));
      setProgress(mapped);
      return;
    }

    let interval: NodeJS.Timeout;

    if (status === "uploading") {
      setCurrentStepIndex(1);
      interval = setInterval(() => {
        setProgress((prev) => (prev < 65 ? prev + Math.floor(Math.random() * 8) + 3 : prev));
      }, 400);
    } else if (status === "processing") {
      setCurrentStepIndex(2);
      setProgress(85);
    } else if (status === "registering") {
      setCurrentStepIndex(3);
      setProgress(95);
    } else if (status === "success") {
      setCurrentStepIndex(4);
      setProgress(100);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOpen, status, realProgress]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-md animate-in fade-in duration-200">
      {/* Top Global Animated Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1.5 bg-background-secondary z-50 overflow-hidden">
        <div
          className="h-full bg-gold transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Modal Box */}
      <div className="relative w-full max-w-lg bg-background border border-border rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gold/15 text-gold mb-1">
            {status === "success" ? (
              <CheckCircle2 className="w-6 h-6 text-green-600 animate-in zoom-in-75 duration-200" />
            ) : (
              <UploadCloud className="w-6 h-6 animate-pulse" />
            )}
          </div>

          <h2 className="font-serif text-xl sm:text-2xl font-bold text-navy">
            {status === "success"
              ? "Maquette transmise avec succès !"
              : "Transmission de la Maquette en cours"}
          </h2>

          <p className="text-xs text-foreground-muted max-w-sm mx-auto">
            {status === "success"
              ? "Le Chef Maquettiste a été notifié pour vérification et validation."
              : `Veuillez patienter pendant l'envoi sécurisé de ${fileName ? `« ${fileName} »` : "votre fichier"} ${fileSizeMb ? `(${fileSizeMb.toFixed(1)} Mo)` : ""}.`}
          </p>
        </div>

        {/* Progress Bar & Percentage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-navy">
            <span>Progression globale</span>
            <span className="font-mono text-gold">{progress}%</span>
          </div>
          <div className="w-full h-2.5 bg-background-secondary rounded-full overflow-hidden p-0.5 border border-border">
            <div
              className="h-full bg-gold rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Steps List */}
        <div className="space-y-3 pt-2">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isCompleted = currentStepIndex > idx || status === "success";
            const isCurrent = currentStepIndex === idx && status !== "success";

            return (
              <div
                key={step.id}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-2xl border transition-all duration-200",
                  isCurrent && "bg-gold/10 border-gold/40 shadow-xs",
                  isCompleted && "bg-background-secondary/50 border-border text-foreground",
                  !isCurrent && !isCompleted && "opacity-40 border-transparent"
                )}
              >
                <div
                  className={cn(
                    "p-2 rounded-xl shrink-0 mt-0.5 transition-colors",
                    isCompleted && "bg-green-500/10 text-green-600",
                    isCurrent && "bg-gold text-navy",
                    !isCurrent && !isCompleted && "bg-background-secondary text-foreground-muted"
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : isCurrent ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={cn(
                        "text-xs font-semibold truncate",
                        isCurrent ? "text-navy font-bold" : "text-foreground"
                      )}
                    >
                      {step.title}
                    </p>
                    {isCompleted && (
                      <span className="text-[10px] font-bold text-green-600 bg-green-500/10 px-2 py-0.5 rounded-md shrink-0">
                        Terminé
                      </span>
                    )}
                    {isCurrent && (
                      <span className="text-[10px] font-bold text-navy bg-gold px-2 py-0.5 rounded-md shrink-0">
                        En cours...
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-foreground-muted mt-0.5 truncate">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Error message if any */}
        {errorMessage && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-2xl text-xs text-red-600 text-center font-medium">
            {errorMessage}
          </div>
        )}

        {/* Informative Security Footer */}
        <div className="pt-2 text-center">
          <p className="text-[10px] text-foreground-muted flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-gold" />
            Transfert protégé par chiffrement de bout en bout • LAHAThèque Cloud
          </p>
        </div>
      </div>
    </div>
  );
}
