"use client";

import * as React from "react";
import { useState, useMemo, useId, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  ArrowRight,
  Clock,
  ChevronDown,
  X,
  Layers,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface SalesChannel {
  name: string;
  amount: number;
  change: string;
  isPositive: boolean;
}

export interface TimeSlotFilter {
  id?: string;
  label: string;
  startHour: number; // 0 à 23
  endHour: number;   // 0 à 23
}

export const TIME_SLOT_PRESETS: TimeSlotFilter[] = [
  { id: "all", label: "Journée entière (00h - 24h)", startHour: 0, endHour: 23 },
  { id: "morning", label: "Matinée (06h - 12h)", startHour: 6, endHour: 12 },
  { id: "lunch", label: "Midi & Déjeuner (12h - 14h)", startHour: 12, endHour: 14 },
  { id: "afternoon", label: "Après-midi (14h - 18h)", startHour: 14, endHour: 18 },
  { id: "evening", label: "Soirée (18h - 22h)", startHour: 18, endHour: 22 },
  { id: "night", label: "Nuit (22h - 06h)", startHour: 22, endHour: 6 },
];

export type Period = "1d" | "1w" | "1m" | "3m" | "1y";

export interface TotalSalesChartProps {
  title?: string;
  subtitle?: string;
  totalAmountText?: string;
  growthBadgeText?: string;
  channels?: SalesChannel[];
  curvePoints?: number[];
  timelineData?: { label: string; value: number }[];
  className?: string;
  onReportClick?: () => void;
  unit?: string;
  // Support des plages horaires
  showTimeSlotPicker?: boolean;
  timeSlotFilter?: TimeSlotFilter | null;
  onTimeSlotChange?: (filter: TimeSlotFilter | null) => void;
  period?: Period;
  onPeriodChange?: (period: Period) => void;
}

interface PointData {
  label: string;
  value: number;
}

function formatCompactXof(num: number): string {
  if (num >= 1_000_000) {
    const val = (num / 1_000_000).toFixed(1).replace(".0", "");
    return `${val}M`;
  }
  if (num >= 1_000) {
    const val = (num / 1_000).toFixed(0);
    return `${val}k`;
  }
  return num.toString();
}

function getPeriodDataset(
  period: Period,
  timeSlot: TimeSlotFilter | null,
  timelineData?: { label: string; value: number }[],
  curvePoints?: number[],
  baseTotal: number = 138500
): PointData[] {
  // Si timelineData réelle fournie et non vide
  if (timelineData && timelineData.length >= 2) {
    return timelineData;
  }

  // Si une plage horaire spécifique est sélectionnée
  if (timeSlot && timeSlot.id !== "all") {
    const { startHour, endHour } = timeSlot;
    const hours: number[] = [];
    if (startHour <= endHour) {
      for (let h = startHour; h <= endHour; h++) {
        hours.push(h);
      }
    } else {
      // Cas traversant minuit (ex: 22h -> 06h)
      for (let h = startHour; h <= 23; h++) hours.push(h);
      for (let h = 0; h <= endHour; h++) hours.push(h);
    }

    const factor = baseTotal > 0 ? baseTotal : 138500;
    const count = hours.length;

    return hours.map((h, idx) => {
      const progress = (idx + 1) / count;
      const val = Math.round(factor * (0.15 + 0.85 * Math.pow(progress, 1.2)));
      return {
        label: `${String(h).padStart(2, "0")}h`,
        value: val,
      };
    });
  }

  // Si curvePoints fournis
  if (curvePoints && curvePoints.length >= 2) {
    const defaultLabels = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sept", "Oct", "Nov", "Déc"];
    return curvePoints.map((v, i) => ({
      label: defaultLabels[i % defaultLabels.length] || `P${i + 1}`,
      value: v,
    }));
  }

  // Datasets réalistes par défaut
  const factor = baseTotal > 0 ? baseTotal : 138500;

  switch (period) {
    case "1d":
      return [
        { label: "00h", value: Math.round(factor * 0.04) },
        { label: "04h", value: Math.round(factor * 0.06) },
        { label: "08h", value: Math.round(factor * 0.15) },
        { label: "11h", value: Math.round(factor * 0.32) },
        { label: "14h", value: Math.round(factor * 0.55) },
        { label: "17h", value: Math.round(factor * 0.78) },
        { label: "20h", value: Math.round(factor * 0.92) },
        { label: "23h", value: factor },
      ];
    case "1w":
      return [
        { label: "Lun", value: Math.round(factor * 0.35) },
        { label: "Mar", value: Math.round(factor * 0.48) },
        { label: "Mer", value: Math.round(factor * 0.56) },
        { label: "Jeu", value: Math.round(factor * 0.68) },
        { label: "Ven", value: Math.round(factor * 0.82) },
        { label: "Sam", value: Math.round(factor * 0.94) },
        { label: "Dim", value: factor },
      ];
    case "1m":
      return [
        { label: "Sem 1", value: Math.round(factor * 0.22) },
        { label: "Sem 2", value: Math.round(factor * 0.45) },
        { label: "Sem 3", value: Math.round(factor * 0.68) },
        { label: "Sem 4", value: Math.round(factor * 0.88) },
        { label: "Clôture", value: factor },
      ];
    case "3m":
      return [
        { label: "Mois -2", value: Math.round(factor * 0.5) },
        { label: "Mi-Trim.", value: Math.round(factor * 0.75) },
        { label: "Mois -1", value: Math.round(factor * 0.88) },
        { label: "En cours", value: factor },
      ];
    case "1y":
      return [
        { label: "Mars", value: Math.round(factor * 0.15) },
        { label: "Avril", value: Math.round(factor * 0.28) },
        { label: "Mai", value: Math.round(factor * 0.42) },
        { label: "Juin", value: Math.round(factor * 0.58) },
        { label: "Juillet", value: Math.round(factor * 0.76) },
        { label: "Août", value: Math.round(factor * 0.89) },
        { label: "Sept", value: factor },
      ];
  }
}

export function TotalSalesChart({
  title = "Progression des Ventes & Revenus",
  subtitle = "Pilotage chronologique du chiffre d'affaires et ventilation par canal de vente",
  totalAmountText = "138 500 FCFA",
  growthBadgeText = "+14.5%",
  channels = [
    { name: "Ventes numériques unitaires", amount: 12400000, change: "+18.2%", isPositive: true },
    { name: "Bouquets Universités (B2B)", amount: 9800000, change: "+12.0%", isPositive: true },
    { name: "Abonnements Lecteur & Pass", amount: 4250000, change: "+8.5%", isPositive: true },
    { name: "Livres physiques (papier)", amount: 2000000, change: "-3.1%", isPositive: false },
  ],
  curvePoints,
  timelineData,
  className,
  onReportClick,
  unit = "FCFA",
  showTimeSlotPicker = true,
  timeSlotFilter,
  onTimeSlotChange,
  period,
  onPeriodChange,
}: TotalSalesChartProps) {
  const [internalPeriod, setInternalPeriod] = useState<Period>("1m");
  const selectedPeriod = period || internalPeriod;

  // Gestion de la plage horaire interne / contrôlée
  const [internalTimeSlot, setInternalTimeSlot] = useState<TimeSlotFilter | null>(null);
  const activeTimeSlot = timeSlotFilter !== undefined ? timeSlotFilter : internalTimeSlot;

  // Menu déroulant Plage Horaire
  const [isTimeSlotOpen, setIsTimeSlotOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Valeurs personnalisées de début et fin
  const [customStartHour, setCustomStartHour] = useState<number>(8);
  const [customEndHour, setCustomEndHour] = useState<number>(18);

  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const chartId = useId();

  // Fermeture du popover au clic extérieur
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsTimeSlotOpen(false);
      }
    }
    if (isTimeSlotOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isTimeSlotOpen]);

  // Fermeture du popover avec Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isTimeSlotOpen) {
        setIsTimeSlotOpen(false);
      }
    }
    if (isTimeSlotOpen) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isTimeSlotOpen]);

  const handlePeriodSelect = (p: Period) => {
    if (onPeriodChange) {
      onPeriodChange(p);
    } else {
      setInternalPeriod(p);
    }
    setHoveredIndex(null);
  };

  const handleSelectTimeSlot = (slot: TimeSlotFilter) => {
    if (slot.id === "all") {
      if (onTimeSlotChange) onTimeSlotChange(null);
      else setInternalTimeSlot(null);
    } else {
      if (onTimeSlotChange) onTimeSlotChange(slot);
      else setInternalTimeSlot(slot);
    }
    setIsTimeSlotOpen(false);
    setHoveredIndex(null);
  };

  const handleApplyCustomSlot = () => {
    const label = `${String(customStartHour).padStart(2, "0")}h00 - ${String(customEndHour).padStart(2, "0")}h00`;
    const slot: TimeSlotFilter = {
      id: "custom",
      label,
      startHour: customStartHour,
      endHour: customEndHour,
    };
    if (onTimeSlotChange) onTimeSlotChange(slot);
    else setInternalTimeSlot(slot);
    setIsTimeSlotOpen(false);
    setHoveredIndex(null);
  };

  const handleClearTimeSlot = () => {
    if (onTimeSlotChange) onTimeSlotChange(null);
    else setInternalTimeSlot(null);
    setHoveredIndex(null);
  };

  const isCustomSlotActive = activeTimeSlot && activeTimeSlot.id !== "all";

  // Extraction du montant numérique de base depuis totalAmountText
  const numericBaseTotal = useMemo(() => {
    const cleanStr = (totalAmountText || "").replace(/[^0-9]/g, "");
    return parseInt(cleanStr, 10) || 138500;
  }, [totalAmountText]);

  // Points de données calculés pour la période et la plage horaire choisies
  const dataset = useMemo(() => {
    return getPeriodDataset(selectedPeriod, activeTimeSlot, timelineData, curvePoints, numericBaseTotal);
  }, [selectedPeriod, activeTimeSlot, timelineData, curvePoints, numericBaseTotal]);

  // Dimensions géométriques du graphique vectoriel SVG
  const svgWidth = 800;
  const svgHeight = 250;
  const padLeft = 60;
  const padRight = 30;
  const padTop = 25;
  const padBottom = 40;
  const chartWidth = svgWidth - padLeft - padRight;
  const chartHeight = svgHeight - padTop - padBottom;

  // Calcul du plafond Y propre et arrondi
  const maxVal = useMemo(() => {
    const rawMax = Math.max(...dataset.map((d) => d.value), 1000);
    if (rawMax <= 10000) return Math.ceil(rawMax / 2000) * 2000 || 10000;
    if (rawMax <= 50000) return Math.ceil(rawMax / 10000) * 10000 || 50000;
    if (rawMax <= 200000) return Math.ceil(rawMax / 25000) * 25000 || 200000;
    if (rawMax <= 1000000) return Math.ceil(rawMax / 100000) * 100000 || 1000000;
    return Math.ceil(rawMax / 500000) * 500000;
  }, [dataset]);

  // Coordonnées absolues dans le SVG
  const pointsCoords = useMemo(() => {
    if (dataset.length === 0) return [];
    const count = dataset.length;
    return dataset.map((d, i) => {
      const x = padLeft + (i / Math.max(count - 1, 1)) * chartWidth;
      const ratio = Math.min(Math.max(d.value / maxVal, 0), 1);
      const y = padTop + (1 - ratio) * chartHeight;
      return { x, y, value: d.value, label: d.label };
    });
  }, [dataset, maxVal, chartWidth, chartHeight, padLeft, padTop]);

  // Tracé de la courbe lissée Bézier (Spline)
  const splinePath = useMemo(() => {
    if (pointsCoords.length < 2) return "";
    let path = `M ${pointsCoords[0].x} ${pointsCoords[0].y}`;
    for (let i = 0; i < pointsCoords.length - 1; i++) {
      const p1 = pointsCoords[i];
      const p2 = pointsCoords[i + 1];
      const midX = (p1.x + p2.x) / 2;
      path += ` C ${midX} ${p1.y}, ${midX} ${p2.y}, ${p2.x} ${p2.y}`;
    }
    return path;
  }, [pointsCoords]);

  // Tracé de la zone sous la courbe (Area gradient)
  const areaPath = useMemo(() => {
    if (!splinePath || pointsCoords.length < 2) return "";
    const first = pointsCoords[0];
    const last = pointsCoords[pointsCoords.length - 1];
    const bottomY = padTop + chartHeight;
    return `${splinePath} L ${last.x} ${bottomY} L ${first.x} ${bottomY} Z`;
  }, [splinePath, pointsCoords, padTop, chartHeight]);

  // Lignes de grille horizontales
  const gridLines = useMemo(() => {
    const steps = [1, 0.66, 0.33, 0];
    return steps.map((ratio) => {
      const y = padTop + (1 - ratio) * chartHeight;
      const val = Math.round(maxVal * ratio);
      return { y, val };
    });
  }, [maxVal, padTop, chartHeight]);

  // Total cumulé des canaux pour barres de proportion
  const totalChannelsSum = useMemo(() => {
    const sum = channels.reduce((acc, c) => acc + c.amount, 0);
    return sum > 0 ? sum : numericBaseTotal;
  }, [channels, numericBaseTotal]);

  const periods: { label: string; value: Period }[] = [
    { label: "1J", value: "1d" },
    { label: "1S", value: "1w" },
    { label: "1M", value: "1m" },
    { label: "3M", value: "3m" },
    { label: "1A", value: "1y" },
  ];

  const activePoint = hoveredIndex !== null ? pointsCoords[hoveredIndex] : null;

  return (
    <div
      className={cn(
        "p-5 sm:p-6 rounded-3xl bg-background-secondary border border-border flex flex-col gap-6 shadow-xs relative overflow-visible",
        className
      )}
    >
      {/* En-tête : Titre & Sélecteurs de Période & Plages Horaires */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base sm:text-lg font-bold font-serif text-navy">
              {title}
            </h3>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Direct
            </span>
          </div>
          <p className="text-xs text-foreground-muted mt-0.5">{subtitle}</p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Sélecteur de période stylisé : 1J, 1S, 1M, 3M, 1A */}
          <div className="inline-flex items-center rounded-xl bg-background border border-border p-1 gap-1 shadow-2xs">
            {periods.map((p) => {
              const isActive = selectedPeriod === p.value;
              return (
                <button
                  key={p.value}
                  onClick={() => handlePeriodSelect(p.value)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all text-center cursor-pointer min-w-[38px] min-h-[36px]",
                    isActive
                      ? "bg-navy text-white shadow-xs font-bold"
                      : "text-foreground-muted hover:text-navy hover:bg-background-secondary"
                  )}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* Bouton Popover Plages Horaires */}
          {showTimeSlotPicker && (
            <div className="relative" ref={popoverRef}>
              <button
                type="button"
                onClick={() => setIsTimeSlotOpen(!isTimeSlotOpen)}
                className={cn(
                  "px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all flex items-center gap-1.5 min-h-[44px] cursor-pointer shadow-2xs",
                  isCustomSlotActive
                    ? "bg-navy text-white border-navy font-bold ring-2 ring-gold/40"
                    : "bg-background border-border text-foreground-muted hover:text-navy hover:bg-background-secondary"
                )}
                title="Choisir une plage horaire"
              >
                <Clock className="w-4 h-4 text-gold shrink-0" />
                <span className="hidden sm:inline font-sans">
                  {isCustomSlotActive ? activeTimeSlot.label : "Plage Horaire"}
                </span>
                <span className="sm:hidden font-sans">
                  {isCustomSlotActive ? activeTimeSlot.label : "Heures"}
                </span>
                <ChevronDown
                  className={cn(
                    "w-3 h-3 text-gold transition-transform shrink-0",
                    isTimeSlotOpen && "rotate-180"
                  )}
                />
              </button>

              {/* Menu Popover Flottant */}
              <AnimatePresence>
                {isTimeSlotOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 z-50 w-80 sm:w-96 rounded-2xl bg-background border border-border shadow-2xl p-4 space-y-4"
                  >
                    {/* Header Popover */}
                    <div className="flex items-center justify-between border-b border-border pb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-gold/10 text-gold border border-gold/20">
                          <Clock className="w-4 h-4 text-gold" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-navy">Sélection de Plage Horaire</p>
                          <p className="text-[11px] text-foreground-muted">Filtrer les volumes par créneau</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsTimeSlotOpen(false)}
                        className="p-1.5 rounded-lg hover:bg-background-secondary text-foreground-muted hover:text-navy transition-colors"
                        aria-label="Fermer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Créneaux Prédéfinis */}
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-bold text-navy uppercase tracking-wider">
                        Créneaux Prédéfinis
                      </label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {TIME_SLOT_PRESETS.map((preset) => {
                          const isSelected =
                            (preset.id === "all" && !isCustomSlotActive) ||
                            (activeTimeSlot?.id === preset.id);

                          return (
                            <button
                              key={preset.id}
                              type="button"
                              onClick={() => handleSelectTimeSlot(preset)}
                              className={cn(
                                "text-left p-2 rounded-xl border text-xs font-semibold transition-all flex items-center justify-between min-h-[40px] cursor-pointer",
                                isSelected
                                  ? "bg-navy text-white border-navy font-bold shadow-2xs"
                                  : "bg-background-secondary border-border text-foreground-muted hover:text-navy hover:bg-background-secondary/80"
                              )}
                            >
                              <span className="truncate text-[11px]">{preset.label}</span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-gold shrink-0 ml-1" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Créneau Personnalisé */}
                    <div className="space-y-2 pt-2 border-t border-border">
                      <label className="block text-[11px] font-bold text-navy uppercase tracking-wider">
                        Créneau Personnalisé (Heure début / fin)
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[10px] text-foreground-muted block mb-1">De :</span>
                          <select
                            value={customStartHour}
                            onChange={(e) => setCustomStartHour(parseInt(e.target.value))}
                            className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-border bg-background-secondary text-navy focus:outline-none focus:border-gold min-h-[38px]"
                          >
                            {Array.from({ length: 24 }, (_, i) => (
                              <option key={i} value={i}>
                                {String(i).padStart(2, "0")}h00
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <span className="text-[10px] text-foreground-muted block mb-1">À :</span>
                          <select
                            value={customEndHour}
                            onChange={(e) => setCustomEndHour(parseInt(e.target.value))}
                            className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-border bg-background-secondary text-navy focus:outline-none focus:border-gold min-h-[38px]"
                          >
                            {Array.from({ length: 24 }, (_, i) => (
                              <option key={i} value={i}>
                                {String(i).padStart(2, "0")}h00
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleApplyCustomSlot}
                          className="flex-1 px-3 py-2 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors shadow-xs min-h-[40px] cursor-pointer"
                        >
                          Appliquer ce créneau
                        </button>
                        {isCustomSlotActive && (
                          <button
                            type="button"
                            onClick={handleClearTimeSlot}
                            className="px-3 py-2 rounded-xl border border-border text-xs font-semibold text-foreground-muted hover:text-navy min-h-[40px] cursor-pointer"
                          >
                            Effacer
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {onReportClick && (
            <button
              onClick={onReportClick}
              className="text-xs font-semibold text-gold hover:text-gold/80 flex items-center gap-1 transition-colors cursor-pointer min-h-[44px]"
            >
              <span>Rapport complet</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Montant Principal, Évolution & Badge de Plage Horaire Active */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-baseline gap-3">
          <span className="text-2xl sm:text-3xl lg:text-4xl font-bold font-serif text-navy tracking-tight">
            {totalAmountText}
          </span>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 border border-emerald-500/25 shadow-2xs">
            <TrendingUp className="w-3.5 h-3.5 mr-1" />
            {growthBadgeText}
          </span>
          <span className="text-xs text-foreground-muted hidden sm:inline">
            cumul consolidé sur la période
          </span>
        </div>

        {/* Badge indicateur de créneau horaire actif */}
        {isCustomSlotActive && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gold/15 text-navy border border-gold/30 text-xs font-semibold w-fit animate-in fade-in-0 duration-150">
            <Clock className="w-3.5 h-3.5 text-gold shrink-0" />
            <span>
              Plage horaire active : <strong>{activeTimeSlot.label}</strong>
            </span>
            <button
              type="button"
              onClick={handleClearTimeSlot}
              className="p-0.5 rounded-md hover:bg-gold/20 text-foreground-muted hover:text-navy transition-colors cursor-pointer ml-1"
              title="Réinitialiser à la journée entière"
              aria-label="Réinitialiser la plage horaire"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Zone Graphique SVG avec Grille, Courbe et Infobulle */}
      <div className="relative w-full h-[230px] sm:h-[260px] select-none">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            {/* Dégradé de la surface sous la courbe */}
            <linearGradient id={`areaGrad-${chartId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.32" />
              <stop offset="50%" stopColor="var(--gold)" stopOpacity="0.12" />
              <stop offset="100%" stopColor="var(--gold)" stopOpacity="0.0" />
            </linearGradient>

            {/* Dégradé du trait doré */}
            <linearGradient id={`strokeGrad-${chartId}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--gold)" />
              <stop offset="100%" stopColor="var(--gold)" />
            </linearGradient>

            {/* Filtre d'ombre douce sous la courbe */}
            <filter id={`glow-${chartId}`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="var(--gold)" floodOpacity="0.25" />
            </filter>
          </defs>

          {/* Lignes de repère horizontales et graduations d'ordonnées */}
          {gridLines.map((line, idx) => (
            <g key={idx}>
              <line
                x1={padLeft}
                y1={line.y}
                x2={svgWidth - padRight}
                y2={line.y}
                stroke="var(--border)"
                strokeDasharray="4 4"
                strokeWidth="1"
                strokeOpacity="0.8"
              />
              <text
                x={padLeft - 10}
                y={line.y + 3.5}
                textAnchor="end"
                className="text-[10px] font-mono fill-foreground-muted"
              >
                {formatCompactXof(line.val)} {idx === 0 ? "F" : ""}
              </text>
            </g>
          ))}

          {/* Remplissage de surface sous la courbe */}
          {areaPath && (
            <motion.path
              d={areaPath}
              fill={`url(#areaGrad-${chartId})`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
            />
          )}

          {/* Trait principal de la courbe */}
          {splinePath && (
            <motion.path
              d={splinePath}
              fill="none"
              stroke={`url(#strokeGrad-${chartId})`}
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter={`url(#glow-${chartId})`}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          )}

          {/* Ligne verticale interactive de survol */}
          {activePoint && (
            <line
              x1={activePoint.x}
              y1={padTop}
              x2={activePoint.x}
              y2={padTop + chartHeight}
              stroke="var(--gold)"
              strokeDasharray="3 3"
              strokeWidth="1.5"
              strokeOpacity="0.8"
            />
          )}

          {/* Points de données interactifs et zones tactiles */}
          {pointsCoords.map((pt, i) => {
            const isHovered = hoveredIndex === i;
            return (
              <g
                key={i}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Zone de contact tactile élargie invisible */}
                <rect
                  x={pt.x - 20}
                  y={padTop}
                  width="40"
                  height={chartHeight + padBottom}
                  fill="transparent"
                />

                {/* Halo pulsant si survolé */}
                {isHovered && (
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="10"
                    fill="var(--gold)"
                    fillOpacity="0.25"
                    className="animate-ping"
                  />
                )}

                {/* Cercle du point */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 6.5 : 4}
                  fill="var(--background)"
                  stroke="var(--gold)"
                  strokeWidth={isHovered ? 3 : 2}
                  className="transition-all duration-150"
                />

                {/* Libellé d'axe X sous le point */}
                <text
                  x={pt.x}
                  y={padTop + chartHeight + 20}
                  textAnchor="middle"
                  className={cn(
                    "text-[10px] sm:text-[11px] font-sans transition-colors",
                    isHovered
                      ? "fill-navy font-bold"
                      : "fill-foreground-muted font-medium"
                  )}
                >
                  {pt.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Infobulle interactive flottante */}
        {activePoint && (
          <div
            className="absolute pointer-events-none z-20 bg-navy text-white px-3.5 py-2 rounded-xl shadow-xl border border-gold/40 text-xs flex flex-col gap-0.5 transform -translate-x-1/2 -translate-y-full transition-all duration-75"
            style={{
              left: `${(activePoint.x / svgWidth) * 100}%`,
              top: `${(activePoint.y / svgHeight) * 100 - 4}%`,
            }}
          >
            <div className="flex items-center justify-between gap-3 text-[10px] text-white/70">
              <span className="font-semibold">{activePoint.label}</span>
              <span className="text-gold font-medium">Revenu</span>
            </div>
            <p className="font-mono font-bold text-gold text-sm">
              {activePoint.value.toLocaleString("fr-FR")} {unit}
            </p>
          </div>
        )}
      </div>

      {/* Grille des Canaux de Revenus */}
      <div className="pt-4 border-t border-border space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-foreground-muted">
          <span className="flex items-center gap-1.5 text-navy font-bold">
            <Layers className="w-3.5 h-3.5 text-gold" />
            Ventilation des Revenus par Canal
          </span>
          <span className="text-[11px]">Part du total commercialisé</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {channels.map((ch, idx) => {
            const share =
              totalChannelsSum > 0
                ? Math.round((ch.amount / totalChannelsSum) * 100)
                : 0;

            return (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-background border border-border flex flex-col justify-between gap-2.5 hover:border-gold/50 transition-all shadow-2xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-foreground line-clamp-1">
                      {ch.name}
                    </span>
                    <p className="font-mono font-bold text-navy text-sm sm:text-base">
                      {ch.amount.toLocaleString("fr-FR")}{" "}
                      <span className="text-[11px] font-sans font-normal text-gold">
                        {unit}
                      </span>
                    </p>
                  </div>

                  <span
                    className={cn(
                      "inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0",
                      ch.isPositive
                        ? "bg-emerald-500/15 text-emerald-600 border border-emerald-500/20"
                        : "bg-rose-500/15 text-rose-600 border border-rose-500/20"
                    )}
                  >
                    {ch.isPositive ? "+" : ""}
                    {ch.change}
                  </span>
                </div>

                {/* Barre de progression proportionnelle */}
                <div className="space-y-1">
                  <div className="w-full h-1.5 rounded-full bg-border overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gold transition-all duration-500"
                      style={{ width: `${Math.min(Math.max(share, 5), 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-foreground-muted font-mono">
                    <span>Part</span>
                    <span className="font-semibold text-navy">{share}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
