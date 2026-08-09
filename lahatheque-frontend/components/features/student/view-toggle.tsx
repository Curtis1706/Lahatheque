"use client";

import React from "react";
import { LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";

export type ViewMode = "grid" | "list";

interface ViewToggleProps {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
  className?: string;
}

export function ViewToggle({ mode, onChange, className }: ViewToggleProps) {
  return (
    <div className={cn("inline-flex items-center p-1 rounded-xl bg-background-secondary border border-border gap-1", className)}>
      <button
        onClick={() => onChange("grid")}
        title="Vue Grille (Couvertures 3D)"
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all min-h-[36px]",
          mode === "grid"
            ? "bg-navy text-white shadow-xs"
            : "text-foreground-muted hover:text-navy"
        )}
      >
        <LayoutGrid className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Grille</span>
      </button>

      <button
        onClick={() => onChange("list")}
        title="Vue Liste Compacte"
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all min-h-[36px]",
          mode === "list"
            ? "bg-navy text-white shadow-xs"
            : "text-foreground-muted hover:text-navy"
        )}
      >
        <List className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Liste</span>
      </button>
    </div>
  );
}
