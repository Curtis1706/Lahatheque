"use client";

import { useId, useMemo, useState } from "react";
import { ArrowDown, ArrowRight, ArrowUp } from "lucide-react";
import {
  ACCENTS,
  formatCompact,
  MetricChart,
  SERIES_COLORS,
  type ChartSeries,
  type ChartView,
  type MetricAccent,
  type MetricSeries,
  type SeriesPoint,
} from "./metric-chart";
import { PeriodSelect, ViewToggle, type PeriodOption } from "./metric-controls";

export type { SeriesPoint, MetricSeries, MetricAccent, ChartView, PeriodOption };

export type CardSize = "sm" | "md" | "lg";

export interface ProgressMetricCardProps {
  title: string;
  total?: string | number;
  delta?: string;
  deltaLabel?: string;
  percent?: string;
  trend?: "up" | "down";
  unit?: string;
  period?: string;
  periodOptions?: PeriodOption[];
  onPeriodChange?: (option: PeriodOption) => void;
  defaultView?: ChartView;
  accent?: MetricAccent;
  /** Série unique. À fournir, OU `series`. */
  data?: SeriesPoint[];
  /** Plusieurs séries nommées. Prioritaire sur `data`. */
  series?: MetricSeries[];
  defaultIndex?: number;
  size?: CardSize;
  /** Affiche les stats secondaires (peak / low / avg) dans le footer. */
  showStats?: boolean;
  valueFormatter?: (value: number) => string;
  dateFormatter?: (date: string) => string;
  loading?: boolean;
  className?: string;
}

const DEFAULT_PERIODS: PeriodOption[] = [
  { label: "7 derniers jours", points: 4 },
  { label: "14 derniers jours", points: 7 },
  { label: "30 derniers jours" },
];

const REGION_W = 38; // %
const NEUTRAL_PCT = 0.5;

const SIZES: Record<
  CardSize,
  { minH: string; pad: string; footer: string; title: string; headline: string }
> = {
  sm: { minH: "min-h-[220px]", pad: "p-4", footer: "px-4 py-2.5", title: "text-xs font-bold uppercase tracking-wider text-navy", headline: "text-2xl sm:text-3xl font-bold font-serif text-navy" },
  md: { minH: "min-h-[260px]", pad: "p-5", footer: "px-5 py-3", title: "text-sm font-bold text-navy", headline: "text-3xl sm:text-4xl font-bold font-serif text-navy" },
  lg: { minH: "min-h-[320px]", pad: "p-6", footer: "px-6 py-3.5", title: "text-base font-bold text-navy", headline: "text-4xl sm:text-5xl font-bold font-serif text-navy" },
};

const sliceWindow = (points: SeriesPoint[], n?: number) =>
  n && n < points.length ? points.slice(-n) : points;

export function ProgressMetricCard({
  title,
  total,
  delta,
  deltaLabel = "ce mois",
  percent,
  trend,
  unit,
  period = "30 derniers jours",
  periodOptions,
  onPeriodChange,
  defaultView = "bar",
  accent,
  data,
  series,
  defaultIndex,
  size = "sm",
  showStats = true,
  valueFormatter,
  dateFormatter,
  loading = false,
  className = "",
}: ProgressMetricCardProps) {
  const gridId = `grid-${useId().replace(/:/g, "")}`;
  const sz = SIZES[size];
  const shell = `relative flex ${sz.minH} w-full flex-col overflow-hidden rounded-2xl border border-border bg-background-secondary transition-colors hover:border-gold/50 ${className}`;

  const periods = periodOptions ?? DEFAULT_PERIODS;
  const [selectedLabel, setSelectedLabel] = useState(period);
  const [view, setView] = useState<ChartView>(defaultView);

  const baseSeries: MetricSeries[] = useMemo(
    () => (series?.length ? series : [{ name: title, data: data ?? [], accent }]),
    [series, data, title, accent]
  );

  const selectedOption =
    periods.find((p) => p.label === selectedLabel) ?? periods[periods.length - 1];

  const visibleSeries = useMemo(
    () => baseSeries.map((s) => ({ ...s, data: sliceWindow(s.data, selectedOption?.points) })),
    [baseSeries, selectedOption]
  );

  const primary = visibleSeries[0];
  const isMulti = visibleSeries.length > 1;
  const hasData = (primary?.data.length ?? 0) >= 2;

  const stats = useMemo(() => {
    const vals = primary?.data.map((d) => d.value) ?? [];
    const sum = vals.reduce((a, b) => a + b, 0);
    const first = vals[0] ?? 0;
    const last = vals[vals.length - 1] ?? 0;
    const prev = vals[vals.length - 2] ?? first;
    const net = last - first;
    return {
      sum,
      net,
      pct: first ? (net / first) * 100 : 0,
      step: last - prev,
      peak: vals.length ? Math.max(...vals) : 0,
      low: vals.length ? Math.min(...vals) : 0,
      avg: vals.length ? sum / vals.length : 0,
    };
  }, [primary]);

  const resolvedTrend: "up" | "down" | "flat" =
    trend ?? (Math.abs(stats.pct) < NEUTRAL_PCT ? "flat" : stats.net >= 0 ? "up" : "down");
  const resolvedAccent: MetricAccent =
    accent ?? (resolvedTrend === "up" ? "emerald" : resolvedTrend === "down" ? "rose" : "neutral");
  const color = ACCENTS[resolvedAccent];
  const TrendIcon =
    resolvedTrend === "flat" ? ArrowRight : resolvedTrend === "down" ? ArrowDown : ArrowUp;

  const fmtCompact = valueFormatter ?? formatCompact;
  const fmtFull = valueFormatter ?? ((n: number) => n.toLocaleString("fr-FR") + (unit ? ` ${unit}` : ""));
  const fmtDate = dateFormatter ?? ((d: string) => d);
  const sign = (n: number) => (n >= 0 ? "+" : "−") + fmtCompact(Math.abs(n));

  const displayTotal = total ?? fmtCompact(stats.sum);
  const displayDelta = delta ?? sign(stats.step);
  const displayPercent = percent ?? `${Math.abs(stats.pct).toFixed(1)}%`;

  const chartSeries: ChartSeries[] = visibleSeries.map((s, i) => ({
    name: s.name,
    data: s.data,
    color: s.accent
      ? ACCENTS[s.accent].stroke
      : isMulti
        ? SERIES_COLORS[i % SERIES_COLORS.length]
        : color.stroke,
  }));

  const lastIndex = (primary?.data.length ?? 1) - 1;
  const fallback = Math.min(defaultIndex ?? lastIndex, lastIndex);

  const handlePeriodChange = (option: PeriodOption) => {
    setSelectedLabel(option.label);
    onPeriodChange?.(option);
  };

  if (loading) {
    return (
      <div className={shell} aria-busy="true">
        <div className={`flex flex-1 flex-col ${sz.pad}`}>
          <div className="flex items-center justify-between">
            <div className="h-5 w-32 animate-pulse rounded bg-border" />
            <div className="h-5 w-24 animate-pulse rounded bg-border" />
          </div>
          <div className="mt-6 h-14 w-48 animate-pulse rounded-lg bg-border" />
        </div>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className={shell}>
        <div className={`flex flex-1 flex-col ${sz.pad}`}>
          <h3 className={`${sz.title}`}>{title}</h3>
          <div className="flex flex-1 flex-col items-center justify-center gap-1 py-6 text-center">
            <p className="text-xs font-semibold text-foreground-muted">Données en cours de synchronisation</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={shell}>
      {/* Zone du graphique en arrière-plan (vue bâtonnets par défaut) */}
      <div className="absolute inset-y-0 right-0 z-0" style={{ width: `${REGION_W}%` }}>
        <MetricChart
          series={chartSeries}
          view={view}
          defaultIndex={fallback}
          valueFormatter={fmtFull}
          dateFormatter={fmtDate}
        />
      </div>

      {/* Contenu principal */}
      <div className="relative z-10 flex flex-1 flex-col p-4 sm:p-5 justify-between pointer-events-none">
        <div className="flex items-center justify-between gap-1.5 pointer-events-auto flex-wrap sm:flex-nowrap">
          <div className="flex items-center gap-1.5 min-w-0">
            <h3 className={`${sz.title} truncate`}>{title}</h3>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold shrink-0">
            <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-full border bg-background text-[11px]" style={{ color: color.text }}>
              <TrendIcon className="w-3 h-3" />
              {displayPercent}
            </span>
            <div className="hidden xl:block">
              <PeriodSelect
                value={selectedLabel}
                options={periods}
                onChange={handlePeriodChange}
                accentText={color.text}
              />
            </div>
          </div>
        </div>

        <div className="mt-4 font-serif font-bold text-2xl sm:text-3xl text-navy tracking-tight tabular-nums">
          {displayTotal}
        </div>

        {/* Footer info compact */}
        <div className="pt-2 mt-2 border-t border-border/50 flex items-center justify-between text-xs text-foreground-muted">
          <div>
            <span className="font-semibold text-foreground">{displayDelta}</span>{" "}
            <span>{deltaLabel}</span>
          </div>
          {showStats && (
            <div className="flex items-center gap-2 text-[11px] font-mono">
              <span>Peak: <strong className="text-foreground">{fmtCompact(stats.peak)}</strong></span>
              <span>·</span>
              <span>Avg: <strong className="text-foreground">{fmtCompact(Math.round(stats.avg))}</strong></span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProgressMetricCard;
