"use client";

import React, { useState } from "react";
import { Sparkles, Users, Check, AlertTriangle } from "lucide-react";
import type { CoAuthorSplit } from "@/lib/types/legal";

interface RightsSplitterSliderProps {
  authors: string[];
  initialSplits?: CoAuthorSplit[];
  onChange?: (splits: CoAuthorSplit[]) => void;
  className?: string;
}

export function RightsSplitterSlider({
  authors,
  initialSplits,
  onChange,
  className,
}: RightsSplitterSliderProps) {
  // Par défaut : répartition équitable si pas d'initialSplits
  const defaultPercent = Math.floor(100 / (authors.length || 1));
  const [splits, setSplits] = useState<CoAuthorSplit[]>(() => {
    if (initialSplits && initialSplits.length > 0) return initialSplits;
    return authors.map((a, idx) => ({
      author_name: a,
      percentage: idx === 0 ? 100 - defaultPercent * (authors.length - 1) : defaultPercent,
    }));
  });

  const handleSliderChange = (index: number, newPercentage: number) => {
    if (splits.length === 1) return; // 100% pour l'auteur unique

    const oldVal = splits[index].percentage;
    const diff = newPercentage - oldVal;

    // Répartir le différentiel sur l'autre (ou les autres) co-auteur(s)
    const otherCount = splits.length - 1;
    const shareToAdjust = diff / otherCount;

    const newSplits = splits.map((s, idx) => {
      if (idx === index) return { ...s, percentage: newPercentage };
      const adjusted = Math.max(0, Math.min(100, Math.round(s.percentage - shareToAdjust)));
      return { ...s, percentage: adjusted };
    });

    // Ajustement de somme pour garantir un total strict de 100%
    const total = newSplits.reduce((acc, curr) => acc + curr.percentage, 0);
    if (total !== 100 && newSplits.length > 1) {
      const targetIdx = index === 0 ? 1 : 0;
      newSplits[targetIdx].percentage += 100 - total;
    }

    setSplits(newSplits);
    if (onChange) onChange(newSplits);
  };

  const totalPercentage = splits.reduce((acc, curr) => acc + curr.percentage, 0);

  return (
    <div className={`p-5 rounded-3xl bg-background-secondary border border-border space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-gold" />
          <h4 className="font-serif font-bold text-xs text-navy uppercase tracking-wider">
            Répartition Graphique des Droits (Total : {totalPercentage}%)
          </h4>
        </div>
        {Math.abs(totalPercentage - 100) < 0.01 ? (
          <span className="text-[10px] font-bold text-success flex items-center gap-1">
            <Check className="w-3 h-3" /> Équilibre garanti (100%)
          </span>
        ) : (
          <span className="text-[10px] font-bold text-error flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Déséquilibré ({totalPercentage}% au lieu de 100%)
          </span>
        )}
      </div>

      <div className="space-y-4">
        {splits.map((split, idx) => (
          <div key={split.author_name} className="space-y-2 bg-background p-3.5 rounded-2xl border border-border">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-navy">{split.author_name}</span>
              <span className="font-mono font-bold text-gold text-sm">{split.percentage}%</span>
            </div>

            {/* Slider 21st.dev Range avec barre dorée */}
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={split.percentage}
              onChange={(e) => handleSliderChange(idx, parseInt(e.target.value) || 0)}
              className="w-full h-2 bg-background-secondary rounded-lg appearance-none cursor-pointer accent-gold border border-border"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
