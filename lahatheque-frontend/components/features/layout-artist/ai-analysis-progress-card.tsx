"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  Cpu, 
  FileSearch, 
  BookOpen, 
  CheckCircle2, 
  ScanLine, 
  Loader2,
  FileCode
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AIAnalysisProgressCardProps {
  fileName?: string;
  className?: string;
}

const AI_STEPS = [
  {
    icon: FileSearch,
    title: "Extraction du document",
    desc: "Lecture des pages de garde, sommaire et 4e de couverture via PyMuPDF...",
    tag: "PyMuPDF",
  },
  {
    icon: Cpu,
    title: "Analyse sémantique IA",
    desc: "Interrogation du modèle OpenAI gpt-4o-mini pour l'analyse littéraire...",
    tag: "OpenAI gpt-4o-mini",
  },
  {
    icon: BookOpen,
    title: "Classification & Indice Dewey",
    desc: "Détection du genre, public cible et attribution de la cote Dewey...",
    tag: "Dewey & Facultés",
  },
  {
    icon: FileCode,
    title: "Notice ONIX 3.0 & Résumé",
    desc: "Génération automatique de la notice normalisée et des mots-clés...",
    tag: "ONIX 3.0",
  },
];

export function AIAnalysisProgressCard({ fileName, className }: AIAnalysisProgressCardProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState(15);

  useEffect(() => {
    // Rotation des étapes d'analyse toutes les 1.8s
    const stepInterval = setInterval(() => {
      setCurrentStepIndex((prev) => (prev + 1) % AI_STEPS.length);
    }, 1800);

    // Progression fluide simulée jusqu'à 92% pendant l'attente
    const progressInterval = setInterval(() => {
      setProgress((prev) => (prev < 90 ? prev + Math.floor(Math.random() * 8 + 3) : prev));
    }, 500);

    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
    };
  }, []);

  const activeStep = AI_STEPS[currentStepIndex];
  const StepIcon = activeStep.icon;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl bg-navy border border-navy-hover p-5 sm:p-6 text-white shadow-xl space-y-4",
        className
      )}
    >
      {/* Laser Scanning Effect */}
      <motion.div
        className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-gold/15 to-transparent h-24 w-full"
        animate={{ y: ["-100%", "300%"] }}
        transition={{
          repeat: Infinity,
          duration: 2.8,
          ease: "easeInOut",
        }}
      />

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-3">
          <div className="relative p-2.5 rounded-2xl bg-gold/20 text-gold shrink-0 border border-gold/30">
            <Sparkles className="w-5 h-5 animate-pulse" />
            <motion.div
              className="absolute -inset-1 rounded-2xl border border-gold/40"
              animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ repeat: Infinity, duration: 2 }}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif font-bold text-sm sm:text-base text-gold tracking-tight">
                Analyse Intelligente en Cours
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-gold/20 text-gold text-[10px] font-mono font-semibold flex items-center gap-1 border border-gold/30">
                <Loader2 className="w-2.5 h-2.5 animate-spin" />
                {progress}%
              </span>
            </div>
            <p className="text-xs text-navy-light mt-0.5 line-clamp-1">
              Fichier en cours d&apos;examen : <span className="font-medium text-white">{fileName || "Document"}</span>
            </p>
          </div>
        </div>

        {/* Step Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-navy-dark border border-navy-hover text-[11px] text-navy-light shrink-0">
          <ScanLine className="w-3.5 h-3.5 text-gold" />
          <span>Extraction &amp; Normalisation ONIX</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-navy-dark rounded-full h-2 overflow-hidden border border-navy-hover p-0.5 relative z-10">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-gold-dark via-gold to-gold-light"
          initial={{ width: "10%" }}
          animate={{ width: `${progress}%` }}
          transition={{ ease: "easeOut", duration: 0.4 }}
        />
      </div>

      {/* Dynamic Step Display */}
      <div className="relative z-10 p-4 rounded-2xl bg-navy-dark/90 border border-navy-hover">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStepIndex}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="flex items-start sm:items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-navy text-gold shrink-0 border border-navy-hover">
                <StepIcon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-white flex items-center gap-2">
                  <span>{activeStep.title}</span>
                  <span className="text-[10px] text-foreground-muted font-normal">
                    (Étape {currentStepIndex + 1}/{AI_STEPS.length})
                  </span>
                </p>
                <p className="text-[11px] text-navy-light mt-0.5">
                  {activeStep.desc}
                </p>
              </div>
            </div>

            <span className="hidden md:inline-block px-2.5 py-1 rounded-lg bg-navy text-gold text-[10px] font-mono font-medium shrink-0 border border-navy-hover">
              {activeStep.tag}
            </span>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 4 Pipeline Step Indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 relative z-10">
        {AI_STEPS.map((step, idx) => {
          const isDone = idx < currentStepIndex;
          const isCurrent = idx === currentStepIndex;
          return (
            <div
              key={idx}
              className={cn(
                "flex items-center gap-1.5 p-2 rounded-xl text-[10px] transition-all border",
                isCurrent
                  ? "bg-gold/15 border-gold/40 text-gold font-bold"
                  : isDone
                  ? "bg-navy-dark/60 border-navy-hover text-navy-light"
                  : "bg-navy-dark/30 border-navy-hover/50 text-foreground-muted opacity-60"
              )}
            >
              {isDone ? (
                <CheckCircle2 className="w-3 h-3 text-gold shrink-0" />
              ) : isCurrent ? (
                <Loader2 className="w-3 h-3 text-gold animate-spin shrink-0" />
              ) : (
                <span className="w-3 h-3 rounded-full border border-current opacity-40 shrink-0 inline-block text-[8px] leading-3 text-center">
                  {idx + 1}
                </span>
              )}
              <span className="truncate">{step.title}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
