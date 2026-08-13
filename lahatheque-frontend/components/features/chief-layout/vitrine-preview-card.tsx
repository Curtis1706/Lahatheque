"use client";

import React from "react";
import { Book } from "@/components/ui/book";
import { Sparkles, Eye, ShieldCheck, Tag } from "lucide-react";
import type { LayoutDeposit } from "@/lib/types/layout-artist";

interface VitrinePreviewCardProps {
  deposit: LayoutDeposit;
  className?: string;
}

export function VitrinePreviewCard({ deposit, className }: VitrinePreviewCardProps) {
  const displayPrice = deposit.admin_price || deposit.default_price;

  return (
    <div className={`p-6 rounded-3xl bg-navy text-white border border-navy-hover shadow-lg space-y-5 ${className}`}>
      {/* Badge En-tête */}
      <div className="flex items-center justify-between pb-3 border-b border-navy-hover">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/20 text-gold text-xs font-bold uppercase tracking-wider">
          <Eye className="w-3.5 h-3.5" />
          Aperçu Fiche Vitrine Publique
        </div>
        <span className="text-[10px] text-white/70 font-mono">
          Format : {deposit.files.format}
        </span>
      </div>

      {/* Carte Vitrine 3D */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
        {/* Couverture 3D Book */}
        <div className="shrink-0">
          {deposit.files.cover_url ? (
            <div className="w-32 h-44 rounded-2xl overflow-hidden border-2 border-gold/40 shadow-md bg-navy-dark shrink-0">
              <img
                src={deposit.files.cover_url}
                alt={deposit.metadata.title}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <Book
              title={deposit.metadata.title}
              width={140}
              variant="stripe"
            />
          )}
        </div>

        {/* Détails publics */}
        <div className="space-y-3 flex-1 min-w-0">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-white text-[11px] font-medium border border-white/20">
            <Tag className="w-3 h-3 text-gold" />
            {deposit.classification.discipline}
          </div>

          <h3 className="font-serif font-bold text-lg sm:text-xl text-white leading-snug">
            {deposit.metadata.title}
          </h3>

          <p className="text-xs text-white/80">
            Auteurs : <span className="text-gold font-semibold">{deposit.metadata.authors.join(", ")}</span>
          </p>

          <p className="text-xs text-navy-light line-clamp-3 italic">
            &ldquo;{deposit.metadata.summary}&rdquo;
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-navy-hover text-xs">
            <div>
              <span className="text-white/60 text-[10px] uppercase font-bold tracking-wider block">Prix public</span>
              <span className="font-bold text-gold text-lg font-mono">
                {displayPrice.toLocaleString("fr-FR")} FCFA
              </span>
              {!deposit.admin_price && (
                <span className="text-[9px] text-white/50 block">(Prix par défaut)</span>
              )}
            </div>

            <div className="text-right">
              <span className="text-white/60 text-[10px] uppercase font-bold tracking-wider block">Établissement</span>
              <span className="text-white font-medium truncate max-w-[180px] block">
                {deposit.classification.university}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
