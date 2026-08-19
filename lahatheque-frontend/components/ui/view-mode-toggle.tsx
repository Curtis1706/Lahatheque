"use client";

import React from "react";
import { LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";

export type ViewMode = "grid" | "list";

export interface ViewModeToggleProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
  className?: string;
}

export const ViewModeToggle: React.FC<ViewModeToggleProps> = ({
  value,
  onChange,
  className,
}) => {
  return (
    <div
      role="group"
      aria-label="Mode d'affichage"
      className={cn(
        "flex items-center gap-1 p-1 bg-background rounded-xl border border-border shrink-0 shadow-xs",
        className
      )}
    >
      <button
        type="button"
        onClick={() => onChange("grid")}
        aria-pressed={value === "grid"}
        aria-label="Affichage en grille"
        className={cn(
          "px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer",
          value === "grid"
            ? "bg-navy text-white shadow-sm font-bold"
            : "text-foreground-secondary hover:text-foreground hover:bg-background-secondary"
        )}
      >
        <LayoutGrid className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Grille</span>
      </button>

      <button
        type="button"
        onClick={() => onChange("list")}
        aria-pressed={value === "list"}
        aria-label="Affichage en liste"
        className={cn(
          "px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer",
          value === "list"
            ? "bg-navy text-white shadow-sm font-bold"
            : "text-foreground-secondary hover:text-foreground hover:bg-background-secondary"
        )}
      >
        <List className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Liste</span>
      </button>
    </div>
  );
};

export default ViewModeToggle;
