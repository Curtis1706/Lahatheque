"use client";

import React, { useState, useRef, useEffect } from "react";
import { Languages, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReaderLanguageSelectorProps {
  availableLanguages: string[];
  currentLanguage: string;
  onLanguageChange: (language: string) => void;
  disabled?: boolean;
  className?: string;
}

const LANGUAGE_LABELS: Record<string, { label: string; full: string }> = {
  fr: { label: "FR", full: "Français" },
  en: { label: "EN", full: "English" },
  es: { label: "ES", full: "Español" },
  de: { label: "DE", full: "Deutsch" },
  pt: { label: "PT", full: "Português" },
  ar: { label: "AR", full: "العربية" },
};

export function ReaderLanguageSelector({
  availableLanguages,
  currentLanguage,
  onLanguageChange,
  disabled = false,
  className,
}: ReaderLanguageSelectorProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const safeCurrent = (currentLanguage || "fr").toLowerCase();
  const currentMeta = LANGUAGE_LABELS[safeCurrent] || {
    label: safeCurrent.toUpperCase(),
    full: safeCurrent.toUpperCase(),
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  if (!availableLanguages || availableLanguages.length <= 1) {
    return null;
  }

  return (
    <div className={cn("relative inline-block text-xs", className)} ref={dropdownRef}>
      {/* Bouton de déclenchement */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-bold transition-all min-h-[36px]",
          "bg-background hover:bg-background-secondary border-border hover:border-gold/60 text-navy",
          "focus:outline-none focus:ring-2 focus:ring-gold/30",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        title="Changer la langue du document"
        aria-label="Sélectionner la langue de lecture"
        aria-expanded={open}
      >
        <Languages className="w-4 h-4 text-gold shrink-0" />
        <span className="font-mono text-[11px] text-gold">{currentMeta.label}</span>
        <span className="hidden sm:inline font-sans text-xs">{currentMeta.full}</span>
        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 text-foreground-muted transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      {/* Menu Déroulant */}
      {open && (
        <div
          className={cn(
            "absolute right-0 mt-1.5 w-48 rounded-2xl overflow-hidden z-50",
            "bg-background border border-border shadow-lg backdrop-blur-md",
            "animate-in fade-in-50 zoom-in-95 duration-150 p-1 space-y-0.5"
          )}
          role="listbox"
        >
          <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-foreground-muted border-b border-border mb-1">
            Traductions disponibles
          </div>

          {availableLanguages.map((langCode) => {
            const code = langCode.toLowerCase();
            const meta = LANGUAGE_LABELS[code] || {
              label: code.toUpperCase(),
              full: code.toUpperCase(),
            };
            const isSelected = safeCurrent === code;

            return (
              <button
                key={code}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  if (!isSelected) {
                    onLanguageChange(code);
                  }
                  setOpen(false);
                }}
                className={cn(
                  "flex items-center justify-between w-full px-2.5 py-2 rounded-xl text-left transition-colors cursor-pointer",
                  isSelected
                    ? "bg-navy text-white font-bold"
                    : "text-navy hover:bg-background-secondary font-medium"
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={cn(
                      "font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-md",
                      isSelected
                        ? "bg-gold text-navy"
                        : "bg-navy/5 text-gold border border-gold/30"
                    )}
                  >
                    {meta.label}
                  </span>
                  <span className="truncate text-xs">{meta.full}</span>
                </div>

                {isSelected && <Check className="w-3.5 h-3.5 text-gold shrink-0 ml-2" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
