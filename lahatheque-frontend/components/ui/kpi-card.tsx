"use client";

import * as React from "react";
import { useMemo, useRef, useEffect } from "react";
import { motion, animate, useMotionValue, useTransform } from "framer-motion";
import { ArrowUpRight, ArrowDownRight, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Utilitaire SVG (inspiré de ravikatiyar162/stats-widget — 21st.dev #4157) ─
function generateSmoothPath(
  points: number[],
  width: number,
  height: number
): string {
  if (!points || points.length < 2) return `M 0 ${height}`;
  const xStep = width / (points.length - 1);
  const coords = points.map((p, i) => [
    i * xStep,
    height - (p / 100) * (height * 0.8) - height * 0.1,
  ]);
  let path = `M ${coords[0][0]} ${coords[0][1]}`;
  for (let i = 0; i < coords.length - 1; i++) {
    const [x1, y1] = coords[i];
    const [x2, y2] = coords[i + 1];
    const midX = (x1 + x2) / 2;
    path += ` C ${midX},${y1} ${midX},${y2} ${x2},${y2}`;
  }
  return path;
}

// ─── Types ────────────────────────────────────────────────────────────────────
export interface KpiCardProps {
  /** Titre affiché sous la valeur */
  label: string;
  /** Valeur numérique principale (count-up animé) */
  value: number;
  /** Formater la valeur affichée, ex: (v) => v + " F CFA" */
  formatValue?: (v: number) => string;
  /** Icône Lucide */
  icon: LucideIcon;
  /** Variation en % vs période précédente (positif = hausse, négatif = baisse) */
  trend?: number;
  /** Libellé de la période de comparaison, défaut: "mois dernier" */
  trendPeriod?: string;
  /** Points de données pour le mini sparkline (valeurs entre 0 et 100) */
  sparkline?: number[];
  className?: string;
}

// ─── KpiCard ─────────────────────────────────────────────────────────────────
export function KpiCard({
  label,
  value,
  formatValue,
  icon: Icon,
  trend,
  trendPeriod = "mois dernier",
  sparkline,
  className,
}: KpiCardProps) {
  const isPositive = trend === undefined ? true : trend >= 0;

  // Count-up Framer Motion (inspiré de ravikatiyar162/card-10 — 21st.dev #7461)
  const motionValue = useMotionValue(0);
  const displayValue = useTransform(motionValue, (latest) => {
    const rounded = Math.round(latest);
    return formatValue
      ? formatValue(rounded)
      : rounded.toLocaleString("fr-FR");
  });

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration: 1.6,
      ease: "easeOut",
    });
    return controls.stop;
  }, [value, motionValue]);

  // Mini sparkline SVG animé
  const svgW = 120;
  const svgH = 48;
  const linePathRef = useRef<SVGPathElement>(null);
  const areaPathRef = useRef<SVGPathElement>(null);

  const linePath = useMemo(
    () => (sparkline ? generateSmoothPath(sparkline, svgW, svgH) : ""),
    [sparkline]
  );
  const areaPath = useMemo(
    () => (linePath ? `${linePath} L ${svgW} ${svgH} L 0 ${svgH} Z` : ""),
    [linePath]
  );

  useEffect(() => {
    const path = linePathRef.current;
    const area = areaPathRef.current;
    if (!path || !area || !linePath) return;
    const length = path.getTotalLength();
    path.style.transition = "none";
    path.style.strokeDasharray = `${length} ${length}`;
    path.style.strokeDashoffset = `${length}`;
    area.style.transition = "none";
    area.style.opacity = "0";
    path.getBoundingClientRect();
    path.style.transition =
      "stroke-dashoffset 0.9s ease-in-out, stroke 0.4s ease";
    path.style.strokeDashoffset = "0";
    area.style.transition = "opacity 0.9s ease-in-out 0.2s, fill 0.4s ease";
    area.style.opacity = "1";
  }, [linePath]);

  const gradIdPos = `kpi-grad-pos-${label.replace(/\s+/g, "-")}`;
  const gradIdNeg = `kpi-grad-neg-${label.replace(/\s+/g, "-")}`;
  const ariaLabel = `${label}: ${value}${
    trend !== undefined
      ? `. Variation de ${trend > 0 ? "+" : ""}${trend}% par rapport au ${trendPeriod}.`
      : ""
  }`;

  return (
    <div
      role="region"
      aria-label={ariaLabel}
      className={cn(
        "bg-background border border-border rounded-2xl p-5 flex flex-col gap-3",
        "shadow-sm hover:border-gold/40 hover:shadow-md transition-all duration-200",
        className
      )}
    >
      {/* En-tête : icône + mini sparkline */}
      <div className="flex items-start justify-between gap-2">
        <div className="w-10 h-10 rounded-xl bg-background-secondary border border-border flex items-center justify-center text-navy flex-shrink-0">
          <Icon className="w-5 h-5" aria-hidden="true" />
        </div>

        {sparkline && sparkline.length >= 2 && (
          <svg
            viewBox={`0 0 ${svgW} ${svgH}`}
            className="w-24 h-10 flex-shrink-0"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id={gradIdPos} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--success)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--success)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id={gradIdNeg} x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="var(--destructive)"
                  stopOpacity={0.35}
                />
                <stop
                  offset="100%"
                  stopColor="var(--destructive)"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <path
              ref={areaPathRef}
              d={areaPath}
              fill={`url(#${isPositive ? gradIdPos : gradIdNeg})`}
            />
            <path
              ref={linePathRef}
              d={linePath}
              fill="none"
              stroke={isPositive ? "var(--success)" : "var(--destructive)"}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>

      {/* Valeur count-up animée */}
      <motion.p className="text-3xl font-bold text-navy leading-none tabular-nums">
        {displayValue}
      </motion.p>

      {/* Label + badge trend */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-xs sm:text-sm text-foreground-muted font-medium">
          {label}
        </span>

        {trend !== undefined && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold border",
              isPositive
                ? "bg-success/10 text-success border-success/20"
                : "bg-destructive/10 text-destructive border-destructive/20"
            )}
            title={`${isPositive ? "+" : ""}${trend}% par rapport au ${trendPeriod}`}
          >
            {isPositive ? (
              <ArrowUpRight className="w-3 h-3" aria-hidden="true" />
            ) : (
              <ArrowDownRight className="w-3 h-3" aria-hidden="true" />
            )}
            {isPositive ? "+" : ""}
            {trend}%
          </span>
        )}
      </div>
    </div>
  );
}

// ─── KpiGrid : grille responsive de KPI cards ─────────────────────────────────
export interface KpiGridProps {
  cards: KpiCardProps[];
  cols?: 2 | 3 | 4;
  className?: string;
}

export function KpiGrid({ cards, cols = 4, className }: KpiGridProps) {
  const colClass =
    cols === 2
      ? "sm:grid-cols-2"
      : cols === 3
      ? "sm:grid-cols-2 lg:grid-cols-3"
      : "sm:grid-cols-2 lg:grid-cols-4";

  return (
    <div className={cn(`grid grid-cols-1 ${colClass} gap-4`, className)}>
      {cards.map((card, i) => (
        <KpiCard key={`${card.label}-${i}`} {...card} />
      ))}
    </div>
  );
}
