"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

type Tone = "default" | "gold" | "blue" | "emerald" | "purple";
type Size = "sm" | "md" | "lg";
type Trend = "up" | "down" | "flat";

export type KpiMetricCardProps = {
  /** Label de la métrique */
  label: string;
  /** Valeur principale affichée */
  value: string | number;
  /** Évolution ou pourcentage */
  delta?: number | string;
  /** Indicateur de tendance visuel */
  trend?: Trend;
  /** Sous-titre explicatif */
  caption?: string;
  /** Icône d'illustration */
  icon?: React.ReactNode;
  /** Ton sémantique */
  tone?: Tone;
  /** Taille de la carte */
  size?: Size;
  className?: string;
};

const toneStyles: Record<
  Tone,
  { card: string; value: string; iconBg: string }
> = {
  default: {
    card: "bg-background-secondary border-border hover:border-border-hover",
    value: "text-navy",
    iconBg: "bg-navy/10 text-navy",
  },
  gold: {
    card: "bg-background-secondary border-border hover:border-gold/40",
    value: "text-navy",
    iconBg: "bg-gold/15 text-gold",
  },
  blue: {
    card: "bg-background-secondary border-border hover:border-blue-500/40",
    value: "text-navy",
    iconBg: "bg-blue-500/10 text-blue-600",
  },
  emerald: {
    card: "bg-background-secondary border-border hover:border-emerald-500/40",
    value: "text-navy",
    iconBg: "bg-emerald-500/10 text-emerald-600",
  },
  purple: {
    card: "bg-background-secondary border-border hover:border-purple-500/40",
    value: "text-navy",
    iconBg: "bg-purple-500/10 text-purple-600",
  },
};

export const KpiMetricCard: React.FC<KpiMetricCardProps> = ({
  label,
  value,
  delta,
  trend,
  caption,
  icon,
  tone = "default",
  className,
}) => {
  const styles = toneStyles[tone];

  return (
    <div
      className={cn(
        "p-4 rounded-2xl border transition-all duration-200 space-y-2 shadow-sm",
        styles.card,
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-foreground-secondary font-medium truncate">
          {label}
        </span>
        {icon && (
          <div
            className={cn(
              "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-transform",
              styles.iconBg
            )}
          >
            {icon}
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <div className={cn("text-2xl font-bold font-mono tracking-tight", styles.value)}>
          {value}
        </div>

        {delta && (
          <div
            className={cn(
              "inline-flex items-center gap-1 text-[11px] font-semibold font-mono px-1.5 py-0.5 rounded-md",
              trend === "up"
                ? "text-emerald-600 bg-emerald-500/10"
                : trend === "down"
                ? "text-rose-600 bg-rose-500/10"
                : "text-foreground-muted bg-background"
            )}
          >
            {trend === "up" && <TrendingUp className="w-3 h-3" />}
            {trend === "down" && <TrendingDown className="w-3 h-3" />}
            {trend === "flat" && <Minus className="w-3 h-3" />}
            <span>{delta}</span>
          </div>
        )}
      </div>

      {caption && (
        <p className="text-[11px] text-foreground-muted truncate">
          {caption}
        </p>
      )}
    </div>
  );
};

export default KpiMetricCard;
