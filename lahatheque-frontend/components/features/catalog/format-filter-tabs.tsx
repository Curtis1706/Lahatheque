"use client";

import React from "react";
import { BookOpen, Headphones, Laptop, BookCheck, Layers } from "lucide-react";

export type CatalogFormatValue = "" | "all" | "digital" | "audio" | "paper";

export interface FormatOption {
  value: string;
  label: string;
  shortLabel?: string;
  icon: React.ElementType;
}

export const CATALOG_FORMAT_OPTIONS: FormatOption[] = [
  {
    value: "all",
    label: "Tous les formats",
    shortLabel: "Tous",
    icon: Layers,
  },
  {
    value: "digital",
    label: "Livre numérique",
    shortLabel: "Numérique",
    icon: Laptop,
  },
  {
    value: "audio",
    label: "Livre audio",
    shortLabel: "Audio",
    icon: Headphones,
  },
  {
    value: "paper",
    label: "Livre papier",
    shortLabel: "Papier",
    icon: BookCheck,
  },
];

interface FormatFilterTabsProps {
  value: string;
  onChange: (value: string) => void;
  size?: "sm" | "md";
  className?: string;
  counts?: Partial<Record<string, number>>;
  /** Indique si la valeur vide "" représente 'Tous les formats' au lieu de "all" */
  emptyValueAsAll?: boolean;
}

/**
 * Composant de sélection d'onglets de formats (Tous, Numérique, Audio, Papier)
 * Conforme à la charte LAHAThèque (zéro couleur en dur, zéro emoji, responsive mobile-first).
 */
export function FormatFilterTabs({
  value,
  onChange,
  size = "md",
  className = "",
  counts,
  emptyValueAsAll = false,
}: FormatFilterTabsProps) {
  // Normaliser la valeur active
  const activeValue = !value || value === "all" ? (emptyValueAsAll ? "" : "all") : value;

  const handleSelect = (optValue: string) => {
    if (optValue === "all" && emptyValueAsAll) {
      onChange("");
    } else {
      onChange(optValue);
    }
  };

  const isSmall = size === "sm";

  return (
    <div
      role="radiogroup"
      aria-label="Filtrer par format d'ouvrage"
      className={`inline-flex items-center gap-1 p-1 rounded-2xl bg-background-secondary border border-border overflow-x-auto max-w-full scrollbar-none shadow-2xs ${className}`}
    >
      {CATALOG_FORMAT_OPTIONS.map((opt) => {
        const Icon = opt.icon;
        const isSelected =
          (opt.value === "all" && (!value || value === "all" || value === "")) ||
          value === opt.value;

        const count = counts?.[opt.value];

        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => handleSelect(opt.value)}
            className={`flex items-center gap-1.5 whitespace-nowrap rounded-xl transition-all duration-200 cursor-pointer font-sans select-none shrink-0 ${
              isSmall
                ? "px-2.5 py-1.5 text-xs min-h-[36px]"
                : "px-3.5 py-2 text-xs sm:text-sm min-h-[42px]"
            } ${
              isSelected
                ? "bg-navy text-white font-bold shadow-xs"
                : "text-foreground-muted hover:text-navy hover:bg-background"
            }`}
          >
            <Icon
              className={`shrink-0 transition-colors ${
                isSmall ? "w-3.5 h-3.5" : "w-4 h-4"
              } ${isSelected ? (opt.value === "audio" ? "text-gold" : "text-gold") : "text-foreground-muted"}`}
            />
            <span className="hidden sm:inline">{opt.label}</span>
            <span className="sm:hidden">{opt.shortLabel || opt.label}</span>

            {typeof count === "number" && (
              <span
                className={`ml-1 text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                  isSelected
                    ? "bg-gold text-navy"
                    : "bg-border/60 text-foreground-muted"
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
