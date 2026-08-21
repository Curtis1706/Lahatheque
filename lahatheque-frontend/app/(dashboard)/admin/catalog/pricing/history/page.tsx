"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, History } from "lucide-react";

export default function AdminPricingHistoryPage() {
  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <Link
          href="/admin/catalog/pricing"
          className="inline-flex items-center gap-1 text-xs font-medium text-gold hover:text-gold-dark mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Retour à la Tarification
        </Link>
        <div className="pb-4 border-b border-border">
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-navy">
            Historique des Modifications de Prix
          </h1>
          <p className="text-xs sm:text-sm text-foreground-muted mt-0.5">
            Journal d'audit des ajustements tarifaires effectués sur le catalogue d'ouvrages.
          </p>
        </div>
      </div>

      <div className="p-8 rounded-2xl bg-background-secondary border border-border text-center space-y-3">
        <History className="w-10 h-10 text-gold mx-auto" />
        <h2 className="text-sm font-bold text-foreground">
          Fonctionnalité en cours de construction
        </h2>
        <p className="text-xs text-foreground-muted max-w-md mx-auto">
          La traçabilité détaillée des changements de prix sera disponible après l'implémentation du modèle d'historique dédié côté backend.
        </p>
        <div className="pt-2">
          <Link
            href="/admin/catalog/pricing"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-navy text-white text-xs font-semibold hover:bg-navy-hover transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-gold" />
            Retour à la gestion des tarifs
          </Link>
        </div>
      </div>
    </div>
  );
}
