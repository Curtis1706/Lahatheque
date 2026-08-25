"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  X,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  id?: string;
  value: string; // Format "YYYY-MM-DD"
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  minDate?: string;
  maxDate?: string;
  presets?: { label: string; offsetYears?: number; offsetMonths?: number; today?: boolean }[];
}

const MONTHS_FR = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

const DAYS_SHORT_FR = ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"];

export function DatePicker({
  id,
  value,
  onChange,
  placeholder = "Sélectionner une date...",
  disabled = false,
  required = false,
  className,
  minDate,
  maxDate,
  presets = [
    { label: "Aujourd'hui", today: true },
    { label: "+1 an", offsetYears: 1 },
    { label: "+3 ans", offsetYears: 3 },
    { label: "+5 ans", offsetYears: 5 },
  ],
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialisation de la vue sur la date actuelle ou sélectionnée
  const initialDate = value ? new Date(value) : new Date();
  const [viewYear, setViewYear] = useState(initialDate.getFullYear() || new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth() || new Date().getMonth());

  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      }
    }
  }, [value]);

  // Fermeture au clic extérieur
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fermeture à la touche Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Format d'affichage en français lisible
  const formatDisplay = (val: string) => {
    if (!val) return "";
    const d = new Date(val);
    if (isNaN(d.getTime())) return val;
    return d.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  // Navigation calendrier
  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  // Calcul des jours du mois
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Premier jour de la semaine (0 = Lundi, 6 = Dimanche)
  const getFirstDayOfMonth = (year: number, month: number) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const daysInPrevMonth = getDaysInMonth(viewYear, viewMonth - 1);

  const handleSelectDay = (day: number) => {
    const monthStr = String(viewMonth + 1).padStart(2, "0");
    const dayStr = String(day).padStart(2, "0");
    const dateStr = `${viewYear}-${monthStr}-${dayStr}`;
    onChange(dateStr);
    setIsOpen(false);
  };

  const handleApplyPreset = (preset: { today?: boolean; offsetYears?: number; offsetMonths?: number }) => {
    const now = new Date();
    if (preset.today) {
      const formatted = now.toISOString().slice(0, 10);
      onChange(formatted);
      setViewYear(now.getFullYear());
      setViewMonth(now.getMonth());
    } else if (preset.offsetYears) {
      const target = new Date(now);
      target.setFullYear(target.getFullYear() + preset.offsetYears);
      const formatted = target.toISOString().slice(0, 10);
      onChange(formatted);
      setViewYear(target.getFullYear());
      setViewMonth(target.getMonth());
    }
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange("");
    setIsOpen(false);
  };

  // Vérification de sélection
  const isSelectedDate = (day: number) => {
    if (!value) return false;
    const d = new Date(value);
    return (
      d.getFullYear() === viewYear &&
      d.getMonth() === viewMonth &&
      d.getDate() === day
    );
  };

  const isTodayDate = (day: number) => {
    const now = new Date();
    return (
      now.getFullYear() === viewYear &&
      now.getMonth() === viewMonth &&
      now.getDate() === day
    );
  };

  // Années pour le sélecteur rapide (-10 à +20)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 30 }, (_, i) => currentYear - 5 + i);

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      {/* Input Trigger */}
      <div
        id={id}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          "w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl flex items-center justify-between gap-2 cursor-pointer transition-all min-h-[44px]",
          isOpen ? "border-gold ring-1 ring-gold/20" : "hover:border-navy-hover",
          disabled && "opacity-50 cursor-not-allowed",
          !value && "text-foreground-muted"
        )}
      >
        <div className="flex items-center gap-2.5 truncate flex-1 min-w-0">
          <CalendarIcon className="w-4 h-4 text-gold shrink-0" />
          {value ? (
            <span className="font-semibold text-navy truncate font-sans">
              {formatDisplay(value)}
            </span>
          ) : (
            <span className="font-normal text-foreground-muted">{placeholder}</span>
          )}
        </div>

        {value && !disabled && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }}
            className="p-1 text-foreground-muted hover:text-error transition-colors rounded"
            title="Effacer la date"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Popover Calendrier */}
      {isOpen && (
        <div className="absolute z-50 mt-1.5 w-72 sm:w-80 rounded-2xl bg-background border border-border shadow-2xl overflow-hidden p-4 space-y-4 animate-in fade-in-0 zoom-in-95 duration-100">
          {/* Header Mois & Année avec Sélecteur */}
          <div className="flex items-center justify-between gap-2 border-b border-border pb-3">
            <div className="flex items-center gap-1.5">
              {/* Select Mois */}
              <select
                value={viewMonth}
                onChange={(e) => setViewMonth(parseInt(e.target.value))}
                className="text-xs font-bold text-navy bg-background-secondary px-2 py-1 rounded-lg border border-border focus:outline-none focus:border-gold cursor-pointer"
              >
                {MONTHS_FR.map((m, idx) => (
                  <option key={m} value={idx}>
                    {m}
                  </option>
                ))}
              </select>

              {/* Select Année */}
              <select
                value={viewYear}
                onChange={(e) => setViewYear(parseInt(e.target.value))}
                className="text-xs font-bold text-navy bg-background-secondary px-2 py-1 rounded-lg border border-border focus:outline-none focus:border-gold cursor-pointer"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Flèches Précédent / Suivant */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1 rounded-lg hover:bg-background-secondary text-foreground-muted hover:text-navy transition-colors"
                title="Mois précédent"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1 rounded-lg hover:bg-background-secondary text-foreground-muted hover:text-navy transition-colors"
                title="Mois suivant"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* En-têtes Jours */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-foreground-muted uppercase tracking-wider">
            {DAYS_SHORT_FR.map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Grille des Jours */}
          <div className="grid grid-cols-7 gap-1 text-xs">
            {/* Jours du mois précédent */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div
                key={`prev-${i}`}
                className="h-8 flex items-center justify-center text-foreground-muted/30 text-[11px]"
              >
                {daysInPrevMonth - firstDay + i + 1}
              </div>
            ))}

            {/* Jours du mois en cours */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const selected = isSelectedDate(day);
              const today = isTodayDate(day);

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={cn(
                    "h-8 rounded-xl flex items-center justify-center text-xs font-semibold transition-all relative",
                    selected
                      ? "bg-navy text-gold font-bold shadow-xs border border-gold/30"
                      : "hover:bg-gold/15 text-navy",
                    today && !selected && "font-bold text-gold underline underline-offset-4"
                  )}
                >
                  {day}
                  {today && !selected && (
                    <span className="w-1 h-1 rounded-full bg-gold absolute bottom-1" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Raccourcis / Presets */}
          {presets && presets.length > 0 && (
            <div className="pt-3 border-t border-border flex items-center justify-between gap-1 flex-wrap">
              <div className="flex items-center gap-1 flex-wrap">
                {presets.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => handleApplyPreset(p)}
                    className="px-2 py-1 rounded-md bg-background-secondary hover:bg-gold/15 text-[10px] font-bold text-navy transition-colors border border-border"
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleClear}
                className="text-[10px] font-bold text-foreground-muted hover:text-error transition-colors px-1"
              >
                Effacer
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
