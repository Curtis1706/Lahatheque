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
  FileCode
} from "lucide-react";
import { cn } from "@/lib/utils";
import { InlineLoader } from "@/components/ui/page-loader";

interface AIAnalysisProgressCardProps {
  fileName?: string;
  className?: string;
}

const AI_STEPS = [
  {
    icon: FileSearch,
    title: "1. Réception et sécurisation du fichier",
    desc: "Vérification de l'intégrité du document et préparation de la lecture...",
    tag: "Préparation",
    minProgress: 10,
    maxProgress: 30,
  },
  {
    icon: ScanLine,
    title: "2. Lecture des 15 premières pages & sommaire",
    desc: "Examen des pages de titre, mentions légales, table des matières et 4e de couverture...",
    tag: "Lecture approfondie",
    minProgress: 30,
    maxProgress: 60,
  },
  {
    icon: Cpu,
    title: "3. Détection du titre, des auteurs & de la discipline",
    desc: "Analyse sémantique pour identifier le domaine, la discipline et la faculté de rattachement...",
    tag: "Analyse documentaire",
    minProgress: 60,
    maxProgress: 85,
  },
  {
    icon: FileCode,
    title: "4. Rédaction du résumé & notice bibliographique",
    desc: "Génération de la notice d'échange ONIX 3.0, attribution de la cote Dewey et mots-clés...",
    tag: "Classification & Notice",
    minProgress: 85,
    maxProgress: 98,
  },
];

export function AIAnalysisProgressCard({ fileName, className }: AIAnalysisProgressCardProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState(12);

  useEffect(() => {
    const startTime = Date.now();

    // Progression continue calée sur le temps moyen d'analyse (environ 6 à 12s)
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      
      if (elapsed < 1.5) {
        setCurrentStepIndex(0);
        setProgress(Math.min(28, Math.floor(12 + elapsed * 10)));
      } else if (elapsed < 4.0) {
        setCurrentStepIndex(1);
        setProgress(Math.min(58, Math.floor(28 + (elapsed - 1.5) * 12)));
      } else if (elapsed < 8.0) {
        setCurrentStepIndex(2);
        setProgress(Math.min(84, Math.floor(58 + (elapsed - 4.0) * 7)));
      } else {
        setCurrentStepIndex(3);
        setProgress((prev) => (prev < 97 ? Math.min(97, prev + 1) : 97));
      }
    }, 300);

    return () => clearInterval(interval);
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
                <InlineLoader size={10} />
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
                <div className="shrink-0 text-gold flex items-center">
                  <InlineLoader size={12} />
                </div>
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
