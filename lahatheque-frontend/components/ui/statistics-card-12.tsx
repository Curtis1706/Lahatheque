import * as React from "react";
import { LucideIcon } from "lucide-react";

interface CardItem {
  icon: LucideIcon;
  value: string | number;
  label: string;
  infoText: string;
  badgeType: "success" | "warning" | "neutral";
}

interface StatisticsCard12Props {
  cards: CardItem[];
}

export function StatisticsCard12({ cards }: StatisticsCard12Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full">
      {cards.map((card, i) => {
        const Icon = card.icon;
        
        let badgeStyle = "bg-background-secondary text-foreground-muted border-border/40";
        if (card.badgeType === "success") {
          badgeStyle = "bg-success/10 text-success border-success/20";
        } else if (card.badgeType === "warning") {
          badgeStyle = "bg-warning/10 text-warning border-warning/20";
        }

        return (
          <div key={i} className="bg-background border border-border p-6 rounded-2xl flex flex-col items-start gap-4 shadow-sm hover:border-gold/30 transition-all duration-200">
            {/* Icon */}
            <div className="rounded-xl flex items-center justify-center w-12 h-12 border border-border bg-background-secondary text-navy">
              <Icon className="w-6 h-6" />
            </div>

            {/* Value & Label */}
            <div className="space-y-1">
              <div className="text-2xl font-bold text-navy leading-none">{card.value}</div>
              <div className="text-xs sm:text-sm text-foreground-muted font-medium">{card.label}</div>
            </div>

            {/* Badge Info */}
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${badgeStyle}`}>
              {card.infoText}
            </span>
          </div>
        );
      })}
    </div>
  );
}
