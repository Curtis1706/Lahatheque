"use client";

import * as React from "react";
import { useMemo, useRef, useEffect } from "react";
import { motion, animate, useMotionValue, useTransform } from "framer-motion";
import { ArrowUpRight, ArrowDownRight, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

function generateSmoothPath(
  points: number[],
  width: number,
  height: number
): string {
  if (!points || points.length < 2) return `M 0 ${height}`;
  const xStep = width / (points.length - 1);
  const coords = points.map((p, i) => [
    i * xStep,
    height - (p / 100) * (height * 0.7) - height * 0.15,
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

export type KpiTheme = "gold" | "navy" | "emerald" | "blue" | "amber" | "rose";

export interface KpiCardProps {
  label: string;
  value: number;
  formatValue?: (v: number) => string;
  icon: LucideIcon;
  trend?: number;
  trendPeriod?: string;
  sparkline?: number[];
  theme?: KpiTheme;
  subtext?: string;
  className?: string;
}

const themeStyles: Record<
  KpiTheme,
  {
    iconBg: string;
    iconColor: string;
    lineColor: string;
  }
> = {
  gold: {
    iconBg: "bg-gold/15 text-gold border-gold/30",
    iconColor: "text-gold",
    lineColor: "var(--gold)",
  },
  navy: {
    iconBg: "bg-navy/10 text-navy border-navy/20",
    iconColor: "text-navy",
    lineColor: "var(--navy)",
  },
  emerald: {
    iconBg: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
    iconColor: "text-emerald-600",
    lineColor: "#10b981",
  },
  blue: {
    iconBg: "bg-blue-500/15 text-blue-600 border-blue-500/30",
    iconColor: "text-blue-600",
    lineColor: "#3b82f6",
  },
  amber: {
    iconBg: "bg-amber-500/15 text-amber-600 border-amber-500/30",
    iconColor: "text-amber-600",
    lineColor: "#f59e0b",
  },
  rose: {
    iconBg: "bg-rose-500/15 text-rose-600 border-rose-500/30",
    iconColor: "text-rose-600",
    lineColor: "#f43f5e",
  },
};

export function KpiCard({
  label,
  value,
  formatValue,
  icon: Icon,
  trend,
  trendPeriod = "ce mois",
  sparkline,
  theme = "navy",
  subtext,
  className,
}: KpiCardProps) {
  const isPositive = trend === undefined ? true : trend >= 0;
  const activeTheme = themeStyles[theme] || themeStyles.navy;

  const motionValue = useMotionValue(0);
  const displayValue = useTransform(motionValue, (latest) => {
    const rounded = Math.round(latest);
    return formatValue
      ? formatValue(rounded)
      : rounded.toLocaleString("fr-FR");
  });

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration: 1.4,
      ease: "easeOut",
    });
    return controls.stop;
  }, [value, motionValue]);

  const svgW = 120;
  const svgH = 40;
  const linePathRef = useRef<SVGPathElement>(null);

  const linePath = useMemo(
    () => (sparkline && sparkline.length >= 2 ? generateSmoothPath(sparkline, svgW, svgH) : ""),
    [sparkline]
  );

  return (
    <div
      className={cn(
        "rounded-2xl bg-background-secondary border border-border p-5 flex flex-col justify-between gap-4 transition-colors hover:border-gold/50",
        className
      )}
    >
      {/* Top section: Icon & Sparkline */}
      <div className="flex items-start justify-between gap-3">
        <div
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center border shrink-0",
            activeTheme.iconBg
          )}
        >
          <Icon className="w-5 h-5" />
        </div>

        {/* Clean Line Sparkline without heavy dark gradients */}
        {linePath && (
          <div className="relative w-24 h-10 shrink-0">
            <svg
              viewBox={`0 0 ${svgW} ${svgH}`}
              className="w-full h-full"
              preserveAspectRatio="none"
            >
              <path
                ref={linePathRef}
                d={linePath}
                fill="none"
                stroke={activeTheme.lineColor}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Main Content: Value & Label */}
      <div className="space-y-1">
        <div className="flex items-baseline justify-between gap-2 flex-wrap">
          <motion.p className="text-2xl sm:text-3xl font-bold font-serif text-navy tracking-tight tabular-nums">
            {displayValue}
          </motion.p>

          {trend !== undefined && (
            <span
              className={cn(
                "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border shrink-0",
                isPositive
                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                  : "bg-rose-500/10 text-rose-600 border-rose-500/30"
              )}
            >
              {isPositive ? (
                <ArrowUpRight className="w-3.5 h-3.5" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5" />
              )}
              {isPositive ? "+" : ""}
              {trend}%
            </span>
          )}
        </div>

        <p className="text-xs sm:text-sm font-semibold text-foreground">
          {label}
        </p>

        {subtext && (
          <p className="text-[11px] font-medium text-foreground-muted">
            {subtext}
          </p>
        )}
      </div>
    </div>
  );
}

export interface KpiGridProps {
  cards: KpiCardProps[];
  cols?: 2 | 3 | 4;
  className?: string;
}

export function KpiGrid({ cards, cols = 3, className }: KpiGridProps) {
  const colClass =
    cols === 2
      ? "sm:grid-cols-2"
      : cols === 3
      ? "sm:grid-cols-2 lg:grid-cols-3"
      : "sm:grid-cols-2 lg:grid-cols-4";

  return (
    <div className={cn(`grid grid-cols-1 ${colClass} gap-4 sm:gap-6`, className)}>
      {cards.map((card, i) => (
        <KpiCard key={`${card.label}-${i}`} {...card} />
      ))}
    </div>
  );
}
