"use client";

import React from "react";
import Link from "next/link";
import { BookOpenCheck, ArrowLeft, ShieldCheck, Sparkles } from "lucide-react";
import { ManuscriptPrepList } from "@/components/features/manuscripts/manuscript-prep-list";

export default function AdminManuscriptSubmissionsPage() {
  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/admin" className="hover:text-navy transition-colors">
          Vue d&apos;ensemble
        </Link>
        <span>/</span>
        <span className="text-navy font-semibold">Manuscrits à Préparer</span>
      </div>

      {/* En-tête */}
      <div className="border-b border-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-xs text-navy font-bold hover:underline mb-2"
          >
            <ArrowLeft className="size-3.5" />
            Retour au Dashboard Admin
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
            <Sparkles className="size-4 text-gold" />
            Préparation Catalogue &amp; Transmission Juriste
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Manuscrits d&apos;Auteurs à Préparer
          </h1>
          <p className="text-xs text-foreground-muted mt-1 max-w-3xl leading-relaxed">
            Consultez les manuscrits validés lors de l&apos;étude éditoriale (Étape 1). Renseignez la
            discipline, fixez le prix numérique et papier, puis convertissez le manuscrit en un ouvrage
            réel transmis au Juriste pour contractualisation et publication vitrine.
          </p>
        </div>
      </div>

      {/* Liste des manuscrits à préparer */}
      <ManuscriptPrepList role="admin" />
    </div>
  );
}
