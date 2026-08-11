"use client";

import React, { useState, useId } from "react";
import { cn } from "@/lib/utils";

export type MetricAccent = "emerald" | "rose" | "gold" | "navy" | "neutral";
export type ChartView = "curve" | "bar";

export interface SeriesPoint {
  value: number;
  date: string;
}

export interface MetricSeries {
  name: string;
  data: SeriesPoint[];
  accent?: MetricAccent;
}

export interface ChartSeries {
  name: string;
  data: SeriesPoint[];
  color: string;
}

export const ACCENTS: Record<MetricAccent, { stroke: string; text: string; bg: string }> = {
  emerald: { stroke: "#10b981", text: "#059669", bg: "bg-emerald-500/10 border-emerald-500/30" },
  rose: { stroke: "#f43f5e", text: "#e11d48", bg: "bg-rose-500/10 border-rose-500/30" },
  gold: { stroke: "var(--gold)", text: "var(--gold-dark)", bg: "bg-gold/15 border-gold/30" },
  navy: { stroke: "var(--navy)", text: "var(--navy)", bg: "bg-navy/10 border-navy/20" },
  neutral: { stroke: "var(--foreground-muted)", text: "var(--foreground-muted)", bg: "bg-background-secondary border-border" },
};

export const SERIES_COLORS = ["var(--navy)", "var(--gold)", "#10b981", "#3b82f6", "#f59e0b"];

export function formatCompact(num: number): string {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1) + "k";
  return num.toString();
}

interface MetricChartProps {
  series: ChartSeries[];
  view: ChartView;
  defaultIndex?: number;
  valueFormatter?: (n: number) => string;
  dateFormatter?: (d: string) => string;
}

export function MetricChart({
  series,
  view,
  defaultIndex = 0,
  valueFormatter = (n) => n.toLocaleString("fr-FR"),
  dateFormatter = (d) => d,
}: MetricChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const chartId = useId();

  const primaryData = series[0]?.data || [];
  if (primaryData.length === 0) return null;

  const activeIdx = hoverIndex ?? defaultIndex;
  const values = primaryData.map((d) => d.value);
  const maxVal = Math.max(...values, 1);
  const minVal = Math.min(...values, 0);
  const range = maxVal - minVal || 1;

  const width = 300;
  const height = 180;

  // Points SVG pour la vue courbe (curve)
  const pointsCoords = primaryData.map((d, idx) => {
    const x = (idx / (primaryData.length - 1)) * width;
    const y = height - ((d.value - minVal) / range) * (height * 0.7) - height * 0.15;
    return { x, y, value: d.value, date: d.date };
  });

  const pathD = pointsCoords.reduce((acc, pt, i) => {
    if (i === 0) return `M ${pt.x} ${pt.y}`;
    const prev = pointsCoords[i - 1];
    const midX = (prev.x + pt.x) / 2;
    return `${acc} C ${midX},${prev.y} ${midX},${pt.y} ${pt.x},${pt.y}`;
  }, "");

  const areaD = `${pathD} L ${width} ${height} L 0 ${height} Z`;

  return (
    <div className="relative w-full h-full flex items-end p-2 overflow-hidden">
      {view === "curve" ? (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id={`grad-${chartId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={series[0]?.color || "var(--navy)"} stopOpacity="0.2" />
              <stop offset="100%" stopColor={series[0]?.color || "var(--navy)"} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaD} fill={`url(#grad-${chartId})`} />
          <path d={pathD} fill="none" stroke={series[0]?.color || "var(--navy)"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        /* Vue Histogramme (Bar) */
        <div className="w-full h-full flex items-end gap-1 px-2 pt-6">
          {primaryData.map((d, idx) => {
            const barH = ((d.value - minVal) / range) * 80 + 10;
            const isHovered = activeIdx === idx;
            return (
              <div
                key={idx}
                onMouseEnter={() => setHoverIndex(idx)}
                onMouseLeave={() => setHoverIndex(null)}
                className="flex-1 flex flex-col justify-end h-full group/bar cursor-pointer"
              >
                <div
                  style={{ height: `${barH}%`, backgroundColor: series[0]?.color || "var(--navy)" }}
                  className={cn(
                    "w-full rounded-t-sm transition-all duration-200",
                    isHovered ? "opacity-100 scale-y-105" : "opacity-60 hover:opacity-90"
                  )}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
