"use client";

import React from "react";
import { Info } from "lucide-react";

interface DemoDataBannerProps {
  message?: string;
  className?: string;
}

export function DemoDataBanner({
  message = "Mode démonstration : Affichage d'un jeu de données représentatif (serveur local ou données initiales).",
  className = "",
}: DemoDataBannerProps) {
  return (
    <div
      role="status"
      className={`flex items-center gap-3 px-4 py-3 rounded-xl bg-gold/10 border border-gold/30 text-navy text-xs sm:text-sm font-medium ${className}`}
    >
      <div className="shrink-0 size-6 rounded-lg bg-gold/20 flex items-center justify-center text-gold">
        <Info className="size-4" />
      </div>
      <div className="flex-1 min-w-0">
        <span className="font-bold text-navy mr-1.5 uppercase text-[11px] tracking-wider py-0.5 px-1.5 rounded bg-gold/20">
          Démonstration
        </span>
        <span className="text-foreground-muted">{message}</span>
      </div>
    </div>
  );
}

export default DemoDataBanner;
