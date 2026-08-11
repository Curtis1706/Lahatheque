"use client";

import React from "react";
import { LineChart, BarChart2, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChartView } from "./metric-chart";

export interface PeriodOption {
  label: string;
  points?: number;
}

interface ViewToggleProps {
  value: ChartView;
  onChange: (view: ChartView) => void;
}

export function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <div className="inline-flex items-center p-0.5 rounded-lg bg-background-secondary border border-border">
      <button
        type="button"
        onClick={() => onChange("curve")}
        className={cn(
          "p-1 rounded-md text-xs transition-colors",
          value === "curve" ? "bg-navy text-white shadow-xs" : "text-foreground-muted hover:text-foreground"
        )}
        title="Vue Courbe de Tendance"
      >
        <LineChart className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onClick={() => onChange("bar")}
        className={cn(
          "p-1 rounded-md text-xs transition-colors",
          value === "bar" ? "bg-navy text-white shadow-xs" : "text-foreground-muted hover:text-foreground"
        )}
        title="Vue Histogramme"
      >
        <BarChart2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

interface PeriodSelectProps {
  value: string;
  options: PeriodOption[];
  onChange: (option: PeriodOption) => void;
  accentText?: string;
}

export function PeriodSelect({ value, options, onChange, accentText }: PeriodSelectProps) {
  return (
    <div className="relative inline-block">
      <select
        value={value}
        onChange={(e) => {
          const opt = options.find((o) => o.label === e.target.value);
          if (opt) onChange(opt);
        }}
        className="appearance-none bg-background-secondary border border-border rounded-lg pl-2.5 pr-7 py-1 text-[11px] font-semibold text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-navy"
      >
        {options.map((opt) => (
          <option key={opt.label} value={opt.label}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-foreground-muted" />
    </div>
  );
}
