"use client";

import React from "react";
import Link from "next/link";
import { BookOpenCheck, ArrowLeft, Layers, Sparkles } from "lucide-react";
import { ManuscriptPrepList } from "@/components/features/manuscripts/manuscript-prep-list";

export default function ChiefLayoutManuscriptSubmissionsPage() {
  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/chief-layout" className="hover:text-navy transition-colors">
          Direction Maquette
        </Link>
        <span>/</span>
        <span className="text-navy font-semibold">Manuscrits à Préparer</span>
      </div>

      {/* En-tête */}
      <div className="border-b border-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/chief-layout"
            className="inline-flex items-center gap-1.5 text-xs text-navy font-bold hover:underline mb-2"
          >
            <ArrowLeft className="size-3.5" />
            Retour à la Direction Maquette
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
            <Sparkles className="size-4 text-gold" />
            Étape 2 — Préparation Catalogue &amp; Transmission Juriste
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Manuscrits d&apos;Auteurs à Préparer
          </h1>
          <p className="text-xs text-foreground-muted mt-1 max-w-3xl leading-relaxed">
            Consultez les manuscrits validés par le comité de lecture. Renseignez la discipline
            académique, fixez le tarif numérique et papier, puis générez l&apos;ouvrage réel directement
            acheminé vers la file du Juriste avec le statut{" "}
            <span className="font-mono font-bold">pending_legal_approval</span>.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/chief-layout/manuscripts"
            className="px-4 py-2.5 rounded-xl border border-border bg-background hover:bg-background-secondary text-navy font-bold text-xs transition-colors inline-flex items-center gap-2 min-h-[44px]"
          >
            <BookOpenCheck className="size-4 text-gold" />
            Étude Éditoriale (Étape 1)
          </Link>
        </div>
      </div>

      {/* Liste des manuscrits à préparer */}
      <ManuscriptPrepList role="chief_layout" />
    </div>
  );
}
