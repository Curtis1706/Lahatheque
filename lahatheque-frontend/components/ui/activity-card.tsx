"use client";

import { Activity, ArrowUpRight, Plus, Target, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export interface Metric {
  label: string;
  value: string;
  trend: number;
  unit?: string;
}

export interface Goal {
  id: string;
  title: string;
  isCompleted: boolean;
}

interface ActivityCardProps {
  category?: string;
  title?: string;
  metrics?: Metric[];
  dailyGoals?: Goal[];
  onAddGoal?: () => void;
  onToggleGoal?: (goalId: string) => void;
  onViewDetails?: () => void;
  className?: string;
}

export function ActivityCard({
  category = "Objectifs d'Étude",
  title = "Progression du Jour",
  metrics = [
    { label: "Manuels", value: "4", trend: 100, unit: "lus" },
    { label: "Temps", value: "3.5", trend: 75, unit: "hrs" },
    { label: "Notes", value: "12", trend: 90, unit: "prises" },
  ],
  dailyGoals = [
    { id: "1", title: "Chapitre 4 Droit Constitutionnel", isCompleted: true },
    { id: "2", title: "Synthese Macroeconomie UCAD", isCompleted: false },
    { id: "3", title: "Revision Cybersecurite ISO 27001", isCompleted: true },
  ],
  onAddGoal,
  onToggleGoal,
  onViewDetails,
  className
}: ActivityCardProps) {
  const [isHovering, setIsHovering] = useState<string | null>(null);

  return (
    <div
      className={cn(
        "relative h-full rounded-2xl p-5 sm:p-6 bg-background border border-border hover:border-gold/60 transition-all duration-300 shadow-xs flex flex-col justify-between",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-xl bg-navy/5 text-navy border border-border">
          <Activity className="w-5 h-5 text-gold" />
        </div>
        <div>
          <h3 className="text-base sm:text-lg font-serif font-bold text-navy">
            {title}
          </h3>
          <p className="text-xs text-foreground-muted">
            {category}
          </p>
        </div>
      </div>

      {/* Metrics Rings */}
      <div className="grid grid-cols-3 gap-3 my-2">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="relative flex flex-col items-center"
            onMouseEnter={() => setIsHovering(metric.label)}
            onMouseLeave={() => setIsHovering(null)}
          >
            <div className="relative w-16 h-16 sm:w-20 sm:h-20">
              <div className="absolute inset-0 rounded-full border-4 border-background-secondary" />
              <div
                className={cn(
                  "absolute inset-0 rounded-full border-4 border-navy transition-all duration-500",
                  isHovering === metric.label && "scale-105 border-gold"
                )}
                style={{
                  clipPath: `polygon(0 0, 100% 0, 100% ${metric.trend}%, 0 ${metric.trend}%)`,
                }}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-sm sm:text-base font-bold font-serif text-navy">
                  {metric.value}
                </span>
                <span className="text-[10px] text-foreground-muted">
                  {metric.unit}
                </span>
              </div>
            </div>
            <span className="mt-2 text-xs font-semibold text-navy truncate max-w-full">
              {metric.label}
            </span>
            <span className="text-[10px] text-foreground-muted">
              {metric.trend}%
            </span>
          </div>
        ))}
      </div>

      {/* Goals Section */}
      <div className="mt-4 space-y-4 pt-3 border-t border-border">
        <div className="flex items-center justify-between">
          <h4 className="flex items-center gap-1.5 text-xs font-bold text-navy">
            <Target className="w-4 h-4 text-gold shrink-0" />
            Objectifs de révisions
          </h4>
          {onAddGoal && (
            <button
              type="button"
              onClick={onAddGoal}
              className="p-1 rounded-lg hover:bg-background-secondary text-foreground-muted hover:text-navy transition-colors"
              title="Ajouter un objectif d'étude"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="space-y-2">
          {dailyGoals.map((goal) => (
            <button
              key={goal.id}
              onClick={() => onToggleGoal?.(goal.id)}
              className={cn(
                "w-full flex items-center gap-2.5 p-2.5 rounded-xl text-xs",
                "bg-background-secondary border border-border hover:border-gold/50",
                "transition-all text-left"
              )}
            >
              <CheckCircle2
                className={cn(
                  "w-4 h-4 shrink-0",
                  goal.isCompleted
                    ? "text-gold"
                    : "text-foreground-muted"
                )}
              />
              <span
                className={cn(
                  "truncate",
                  goal.isCompleted
                    ? "text-foreground-muted line-through"
                    : "text-navy font-medium"
                )}
              >
                {goal.title}
              </span>
            </button>
          ))}
        </div>

        {onViewDetails && (
          <div className="pt-2">
            <button
              onClick={onViewDetails}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-navy hover:text-gold transition-colors"
            >
              Voir le journal d&apos;étude détaillé
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ActivityCard;
