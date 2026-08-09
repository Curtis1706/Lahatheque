"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ChevronDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ActivityDataPoint {
  day: string;
  value: number;
}

export interface ActivityChartCardProps {
  title?: string;
  totalValue: string;
  data: ActivityDataPoint[];
  className?: string;
  dropdownOptions?: string[];
}

/**
 * Composant 21st.dev (par ravikatiyar162) fixe sans aucun débordement de barres.
 */
export const ActivityChartCard = ({
  title = "Activité d'étude",
  totalValue,
  data,
  className,
  dropdownOptions = ["Hebdomadaire", "Mensuel", "Semestriel"],
}: ActivityChartCardProps) => {
  const [selectedRange, setSelectedRange] = React.useState(
    dropdownOptions[0] || ""
  );
  const [dropdownOpen, setDropdownOpen] = React.useState(false);

  const maxValue = React.useMemo(() => {
    return data.reduce((max, item) => (item.value > max ? item.value : max), 0);
  }, [data]);

  const chartVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const barVariants = {
    hidden: { scaleY: 0, opacity: 0, transformOrigin: "bottom" },
    visible: {
      scaleY: 1,
      opacity: 1,
      transformOrigin: "bottom",
      transition: {
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1],
      },
    },
  };

  return (
    <div
      className={cn("w-full bg-background border border-border rounded-2xl p-5 space-y-3 shadow-xs relative overflow-hidden flex flex-col justify-between h-full", className)}
      aria-labelledby="activity-card-title"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 z-10">
        <h3 id="activity-card-title" className="font-serif text-base font-bold text-navy truncate">
          {title}
        </h3>

        <div className="relative shrink-0">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-background-secondary border border-border text-[11px] font-semibold text-foreground-muted hover:text-navy transition-colors min-h-[32px]"
          >
            {selectedRange}
            <ChevronDown className="h-3 w-3" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-1 w-32 bg-background border border-border rounded-xl shadow-md z-40 py-1 overflow-hidden">
              {dropdownOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    setSelectedRange(option);
                    setDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs font-medium hover:bg-background-secondary text-foreground transition-colors"
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3 pt-1">
        {/* Total Value */}
        <div className="flex flex-col shrink-0">
          <p className="text-3xl font-serif font-bold tracking-tight text-navy">
            {totalValue}
          </p>
          <div className="flex items-center gap-1 text-[11px] text-foreground-muted">
            <TrendingUp className="h-3 w-3 text-gold shrink-0" />
            <span>+12% assiduité</span>
          </div>
        </div>

        {/* Bar Chart Container (Fixé avec overflow-hidden) */}
        <motion.div
          key={selectedRange}
          className="flex h-16 w-full items-end justify-between gap-1 overflow-hidden"
          variants={chartVariants}
          initial="hidden"
          animate="visible"
          aria-label="Activity chart"
        >
          {data.map((item, index) => (
            <div
              key={index}
              className="flex h-full w-full flex-col items-center justify-end gap-1 overflow-hidden"
              role="presentation"
            >
              <div className="w-full bg-background-secondary rounded-t-md h-full flex items-end overflow-hidden border-x border-t border-border">
                <motion.div
                  className="w-full rounded-t-sm bg-navy hover:bg-gold transition-colors"
                  style={{
                    height: `${maxValue > 0 ? Math.min(100, (item.value / maxValue) * 100) : 0}%`,
                  }}
                  variants={barVariants}
                  aria-label={`${item.day}: ${item.value} heures`}
                />
              </div>
              <span className="text-[9px] font-medium text-foreground-muted">
                {item.day}
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default ActivityChartCard;
