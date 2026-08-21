"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SalesChannel {
  name: string;
  amount: number;
  change: string;
  isPositive: boolean;
}

export interface TotalSalesChartProps {
  title?: string;
  totalAmountText?: string;
  growthBadgeText?: string;
  channels?: SalesChannel[];
  curvePoints?: number[];
  className?: string;
  onReportClick?: () => void;
}

type Period = "1d" | "1w" | "1m" | "3m" | "1y";

function generatePoints(period: Period, customPoints?: number[]): number[] {
  if (customPoints && customPoints.length >= 2) {
    const max = Math.max(...customPoints, 1);
    return customPoints.map((v) => Math.round((v / max) * 100));
  }
  const seeds: Record<Period, number[]> = {
    "1d": [35, 42, 38, 55, 62, 58, 70, 75, 82, 80, 95, 88],
    "1w": [45, 52, 60, 58, 72, 85, 92],
    "1m": [30, 38, 42, 50, 48, 62, 70, 68, 80, 85, 82, 94],
    "3m": [25, 35, 45, 40, 55, 65, 60, 75, 80, 88, 92, 98],
    "1y": [20, 30, 40, 50, 60, 55, 70, 80, 85, 90, 94, 100],
  };
  return seeds[period];
}

function generateSmoothPath(points: number[], width: number, height: number): string {
  if (!points || points.length < 2) return `M 0 ${height}`;
  const xStep = width / (points.length - 1);
  const coords = points.map((p, i) => [
    i * xStep,
    height - (p / 100) * (height * 0.75) - height * 0.1,
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

export function TotalSalesChart({
  title = "Progression des Ventes & Revenus",
  totalAmountText = "28.450.000 FCFA",
  growthBadgeText = "+14.5%",
  channels = [
    { name: "Ventes numériques unitaires", amount: 12400000, change: "+18.2%", isPositive: true },
    { name: "Bouquets Universités (B2B)", amount: 9800000, change: "+12.0%", isPositive: true },
    { name: "Abonnements Lecteur & Pass", amount: 4250000, change: "+8.5%", isPositive: true },
    { name: "Livres physiques (papier)", amount: 2000000, change: "-3.1%", isPositive: false },
  ],
  curvePoints,
  className,
  onReportClick,
}: TotalSalesChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>("1m");
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  const points = useMemo(() => generatePoints(selectedPeriod, curvePoints), [selectedPeriod, curvePoints]);
  const width = 360;
  const height = 140;

  const svgPath = useMemo(() => generateSmoothPath(points, width, height), [points]);
  const areaPath = useMemo(() => {
    if (!svgPath) return "";
    return `${svgPath} L ${width} ${height} L 0 ${height} Z`;
  }, [svgPath]);

  const periods: { label: string; value: Period }[] = [
    { label: "1J", value: "1d" },
    { label: "1S", value: "1w" },
    { label: "1M", value: "1m" },
    { label: "3M", value: "3m" },
    { label: "1A", value: "1y" },
  ];

  return (
    <div className={cn("p-5 rounded-2xl bg-background-secondary border border-border flex flex-col gap-4 shadow-sm", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {onReportClick && (
          <button
            onClick={onReportClick}
            className="text-xs font-medium text-gold hover:text-gold-dark flex items-center gap-1 transition-colors"
          >
            Rapport complet <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Main Value & Trend */}
      <div className="flex items-baseline justify-between">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{totalAmountText}</span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-success/15 text-success">
            <TrendingUp className="w-3 h-3 mr-1" />
            {growthBadgeText}
          </span>
        </div>
      </div>

      {/* Period Selector Toggle */}
      <div className="flex w-full rounded-xl bg-background border border-border p-1 gap-1">
        {periods.map((p) => {
          const isActive = selectedPeriod === p.value;
          return (
            <button
              key={p.value}
              onClick={() => setSelectedPeriod(p.value)}
              className={cn(
                "flex-1 py-1 text-xs font-medium rounded-lg transition-all text-center",
                isActive
                  ? "bg-navy text-white shadow-xs font-semibold"
                  : "text-foreground-muted hover:text-foreground hover:bg-background-secondary"
              )}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {/* Sparkline Interactive Curve */}
      <div className="relative w-full h-[140px] pt-2">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          <motion.path
            d={svgPath}
            fill="none"
            stroke="var(--gold)"
            strokeWidth="3"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />

          {/* Points interactivity */}
          {points.map((p, i) => {
            const xStep = width / (points.length - 1);
            const cx = i * xStep;
            const cy = height - (p / 100) * (height * 0.75) - height * 0.1;
            const isHovered = hoveredPointIndex === i;

            return (
              <g key={i} onMouseEnter={() => setHoveredPointIndex(i)} onMouseLeave={() => setHoveredPointIndex(null)}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 6 : 4}
                  fill="var(--background)"
                  stroke="var(--gold)"
                  strokeWidth={isHovered ? 3 : 2}
                  className="cursor-pointer transition-all"
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Channels Breakdown */}
      <div className="pt-2 border-t border-border flex flex-col gap-2.5">
        {channels.map((ch, idx) => (
          <div key={idx} className="flex items-center justify-between text-xs">
            <span className="text-foreground-muted font-medium truncate max-w-[200px]">{ch.name}</span>
            <div className="flex items-center gap-2 font-mono">
              <span className="font-semibold text-foreground">
                {ch.amount.toLocaleString("fr-FR")} FCFA
              </span>
              <span
                className={cn(
                  "inline-flex items-center font-medium px-1.5 py-0.5 rounded-xs",
                  ch.isPositive ? "bg-success/15 text-success" : "bg-error/15 text-error"
                )}
              >
                {ch.isPositive ? "+" : ""}{ch.change}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
