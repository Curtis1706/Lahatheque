"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, History, Tag } from "lucide-react";

const PRICE_HISTORY_LOGS = [
  {
    id: "log-p1",
    bookTitle: "Droit Constitutionnel Béninois et Droit Comparé",
    oldPriceDigital: 5000,
    newPriceDigital: 6500,
    oldPricePaper: 8500,
    newPricePaper: 9500,
    changedBy: "Admin Principal (admin.principal@laha.bj)",
    reason: "Mise à jour annuelle grille édition augmentée",
    date: "2024-02-15 11:30",
  },
  {
    id: "log-p2",
    bookTitle: "Précis d'Économie Agricole Africaine",
    oldPriceDigital: 5000,
    newPriceDigital: 4000,
    oldPricePaper: 7500,
    newPricePaper: 6500,
    changedBy: "Claire Houessou (Éditeur)",
    reason: "Offre facultés deuxième semestre",
    date: "2024-01-10 09:15",
  },
];

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

      <div className="space-y-3">
        {PRICE_HISTORY_LOGS.map((log) => (
          <div key={log.id} className="p-4 rounded-xl bg-background-secondary border border-border space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="font-semibold text-xs text-foreground">{log.bookTitle}</h3>
              <span className="font-mono text-[11px] text-foreground-muted">{log.date}</span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-mono pt-1">
              <div>
                <span className="text-foreground-muted">Numérique: </span>
                <span className="line-through text-error mr-1">{log.oldPriceDigital.toLocaleString()} FCFA</span>
                <span className="font-bold text-success">{log.newPriceDigital.toLocaleString()} FCFA</span>
              </div>
              <div>
                <span className="text-foreground-muted">Papier: </span>
                <span className="line-through text-error mr-1">{log.oldPricePaper.toLocaleString()} FCFA</span>
                <span className="font-bold text-success">{log.newPricePaper.toLocaleString()} FCFA</span>
              </div>
            </div>

            <div className="pt-2 text-[11px] text-foreground-muted border-t border-border flex justify-between">
              <span>Modifié par: <strong className="text-foreground">{log.changedBy}</strong></span>
              <span>Motif: <em>{log.reason}</em></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
