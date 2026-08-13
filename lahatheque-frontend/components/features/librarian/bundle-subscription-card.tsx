"use client";

import React from "react";
import { Sparkles, CheckCircle2, ShieldCheck, ArrowRight, BookOpen, Clock } from "lucide-react";
import type { UniversityBundle } from "@/lib/types/librarian";

interface BundleSubscriptionCardProps {
  bundle: UniversityBundle;
  onSubscribe?: (bundle: UniversityBundle) => void;
  className?: string;
}

export function BundleSubscriptionCard({
  bundle,
  onSubscribe,
  className,
}: BundleSubscriptionCardProps) {
  const isSubscriber = bundle.status === "active";

  return (
    <div
      className={`p-6 rounded-3xl bg-background border transition-all space-y-5 shadow-xs flex flex-col justify-between ${
        isSubscriber ? "border-gold shadow-md" : "border-border hover:border-gold"
      } ${className}`}
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="p-2.5 rounded-2xl bg-gold/15 text-gold border border-gold/30">
            <Sparkles className="w-5 h-5 text-gold" />
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              isSubscriber
                ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/30"
                : "bg-navy-light text-navy"
            }`}
          >
            {isSubscriber ? "Bouquet Actif" : "Disponible à la souscription"}
          </span>
        </div>

        <div>
          <h3 className="font-serif font-bold text-navy text-lg leading-snug">{bundle.title}</h3>
          <p className="text-xs text-foreground-muted mt-1 leading-relaxed">{bundle.description}</p>
        </div>

        <div className="p-3 rounded-2xl bg-background-secondary border border-border flex items-center justify-between text-xs font-bold text-navy">
          <span className="flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-gold" />
            {bundle.book_count} ouvrages inclus
          </span>
          <span className="capitalize text-foreground-muted">{bundle.target_audience}</span>
        </div>

        {/* Part d'utilisation & redevance propre (Confidentialité inter-établissements) */}
        {isSubscriber && (
          <div className="p-3.5 rounded-2xl bg-navy/5 border border-navy/20 space-y-1 text-xs">
            <div className="flex items-center justify-between text-navy font-bold">
              <span>Part d&apos;Utilisation Propre :</span>
              <span className="font-mono text-gold">{bundle.university_usage_share_percentage}%</span>
            </div>
            <div className="flex items-center justify-between text-foreground-muted text-[11px]">
              <span>Redevance Propre Rétribuée :</span>
              <span className="font-mono font-bold text-navy">{bundle.university_royalty_amount.toLocaleString("fr-FR")} XOF</span>
            </div>
            <p className="text-[10px] text-foreground-muted italic pt-1 border-t border-navy/10">
              Note : Seule la part propre de votre université est affichée (confidentialité inter-établissements).
            </p>
          </div>
        )}
      </div>

      <div className="space-y-3 pt-3 border-t border-border">
        <div className="flex items-baseline justify-between">
          <span className="text-xs font-bold text-foreground-muted uppercase">Tarif Annuel</span>
          <div className="text-right">
            <span className="font-serif font-bold text-gold text-xl font-mono">
              {bundle.subscription_price.toLocaleString("fr-FR")} XOF
            </span>
            <span className="text-[10px] text-foreground-muted block">/ an (Accès Institutionnel)</span>
          </div>
        </div>

        {onSubscribe && !isSubscriber && (
          <button
            type="button"
            onClick={() => onSubscribe(bundle)}
            className="w-full py-3 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors flex items-center justify-center gap-2 shadow-xs min-h-[44px]"
          >
            <span>Souscrire à ce Bouquet</span>
            <ArrowRight className="w-4 h-4 text-gold" />
          </button>
        )}
      </div>
    </div>
  );
}
