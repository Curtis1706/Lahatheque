"use client";

import React from "react";
import { Sparkles, Edit3 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ClassificationSource } from "@/lib/types/layout-artist";

interface AISuggestionBadgeProps {
  source: ClassificationSource;
  className?: string;
}

export function AISuggestionBadge({ source, className }: AISuggestionBadgeProps) {
  if (source === "ai_suggested") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gold/10 text-gold border border-gold/30 text-[10px] font-bold tracking-wide uppercase shadow-xs",
          className
        )}
        title="Cette information a été détectée et suggérée par l'IA. Vous pouvez la modifier si nécessaire."
      >
        <Sparkles className="w-3 h-3 text-gold" />
        Suggéré par l&apos;IA
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-navy/10 text-navy border border-navy/20 text-[10px] font-bold tracking-wide uppercase shadow-xs",
        className
      )}
      title="Cette information a été saisie ou modifiée manuellement par le maquettiste."
    >
      <Edit3 className="w-3 h-3 text-navy" />
      Saisie manuelle
    </span>
  );
}
