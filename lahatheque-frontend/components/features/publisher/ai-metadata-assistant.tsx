"use client";

import React, { useState } from "react";
import { Sparkles, Bot, Check, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { extractBookMetadataWithAi } from "@/lib/services/publisher";
import type { PublisherAiMetadataSuggestion } from "@/lib/types/publisher";

interface AiMetadataAssistantProps {
  currentTitle: string;
  filename?: string;
  onApplySuggestions: (suggestions: PublisherAiMetadataSuggestion) => void;
  className?: string;
}

export function AiMetadataAssistant({
  currentTitle,
  filename,
  onApplySuggestions,
  className = "",
}: AiMetadataAssistantProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [suggestion, setSuggestion] = useState<PublisherAiMetadataSuggestion | null>(null);

  const handleAnalyze = async () => {
    if (!currentTitle && !filename) {
      toast.info("Veuillez d'abord renseigner le titre ou téléverser le fichier d'ouvrage.");
      return;
    }

    setAnalyzing(true);
    try {
      const res = await extractBookMetadataWithAi({ title: currentTitle, filename });
      setSuggestion(res);
      toast.success("Suggestions de métadonnées générées par l'IA.");
    } catch {
      toast.error("Échec de l'analyse IA. Veuillez vérifier vos entrées.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleApply = () => {
    if (!suggestion) return;
    onApplySuggestions(suggestion);
    toast.success("Métadonnées IA appliquées au formulaire.");
  };

  return (
    <div className={`p-5 rounded-3xl bg-gold/5 border border-gold/30 space-y-4 shadow-xs ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gold/20 text-gold border border-gold/40">
            <Sparkles className="w-5 h-5 text-gold" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-serif font-bold text-navy text-sm">Assistant IA Édition Académique</h4>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gold/20 text-gold uppercase tracking-wider">
                Section 5.3 &amp; 4.1.C
              </span>
            </div>
            <p className="text-xs text-foreground-muted">
              Classification automatique, génération de résumé, détection de langue et descripteurs
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAnalyze}
          disabled={analyzing}
          className="px-4 py-2 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors flex items-center justify-center gap-2 shrink-0 shadow-xs min-h-[40px] disabled:opacity-50"
        >
          {analyzing ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Analyse du manuscrit...</span>
            </>
          ) : (
            <>
              <Bot className="w-4 h-4 text-gold" />
              <span>Analyser et Suggérer par IA</span>
            </>
          )}
        </button>
      </div>

      {suggestion && (
        <div className="p-4 rounded-2xl bg-background border border-gold/30 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-navy flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-600" />
              Suggestions générées (Indice de confiance : {Math.round(suggestion.confidence_score * 100)}%)
            </span>
            <button
              type="button"
              onClick={handleApply}
              className="text-xs font-bold text-gold hover:underline flex items-center gap-1"
            >
              <span>Appliquer au formulaire</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-2.5 rounded-xl bg-background-secondary border border-border">
              <span className="text-[10px] text-foreground-muted uppercase font-bold block">Discipline Détectée</span>
              <span className="font-semibold text-navy">{suggestion.discipline}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-background-secondary border border-border">
              <span className="text-[10px] text-foreground-muted uppercase font-bold block">Langue &amp; Territoire</span>
              <span className="font-semibold text-navy">
                {suggestion.language.toUpperCase()} • {suggestion.country}
              </span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-background-secondary border border-border text-xs space-y-1">
            <span className="text-[10px] text-foreground-muted uppercase font-bold block">Résumé Suggéré</span>
            <p className="text-foreground italic leading-relaxed">{suggestion.summary}</p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-bold text-foreground-muted mr-1">Mots-clés suggérés :</span>
            {suggestion.suggested_keywords.map((kw, i) => (
              <span
                key={i}
                className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-gold/10 text-navy border border-gold/20"
              >
                #{kw}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
