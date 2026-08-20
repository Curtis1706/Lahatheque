"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, ShieldCheck, Eye, Download, Tag, DollarSign, Lock, Edit3 } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { ValidationStepTracker } from "@/components/features/publisher/validation-step-tracker";
import { getPublisherBookDetail } from "@/lib/services/publisher";
import type { PublisherBook } from "@/lib/types/publisher";

export default function PublisherBookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [book, setBook] = useState<PublisherBook | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await getPublisherBookDetail(resolvedParams.id);
      setBook(data);
      setLoading(false);
    }
    loadData();
  }, [resolvedParams.id]);

  if (loading) {
    return (
      <div className="p-8 space-y-4 max-w-4xl mx-auto animate-pulse">
        <div className="h-8 bg-background-secondary rounded w-1/3" />
        <div className="h-64 bg-background-secondary rounded-3xl" />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="p-8 text-center space-y-4 max-w-md mx-auto">
        <h2 className="font-serif font-bold text-navy text-lg">Ouvrage introuvable</h2>
        <p className="text-xs text-foreground-muted">L&apos;ouvrage demandé n&apos;existe pas dans votre catalogue.</p>
        <Link href="/publisher/catalog" className="text-xs font-bold text-gold hover:underline block">
          Retour au Catalogue
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 max-w-6xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/publisher" className="hover:text-navy">Vue d&apos;ensemble</Link>
        <span>/</span>
        <Link href="/publisher/catalog" className="hover:text-navy">Catalogue</Link>
        <span>/</span>
        <span className="text-navy font-semibold">{book.isbn_digital}</span>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/publisher/catalog" className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-2">
            <ArrowLeft className="w-3.5 h-3.5" />
            Retour au Catalogue
          </Link>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-xs text-gold">ISBN : {book.isbn_digital}</span>
            <StatusBadge status={book.status} />
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy mt-1 leading-snug">
            {book.title}
          </h1>
          <p className="text-xs text-foreground-muted mt-1">
            Auteurs : <span className="font-bold text-navy">{book.authors.join(", ")}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/catalog/reader/${book.id}`}
            className="px-3.5 py-2.5 rounded-xl bg-gold text-navy text-xs font-bold hover:bg-gold-light transition-all inline-flex items-center gap-2 shadow-xs min-h-[44px]"
          >
            <BookOpen className="w-4 h-4" />
            Prévisualiser dans la Liseuse
          </Link>
          <Link
            href={`/publisher/catalog/${book.id}/protection`}
            className="px-3.5 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors inline-flex items-center gap-2 shadow-xs min-h-[44px]"
          >
            <ShieldCheck className="w-4 h-4 text-gold" />
            Protection DRM / LCP
          </Link>
        </div>
      </div>

      {/* Tracker du Flux de Validation 5 Étapes 21st.dev */}
      <ValidationStepTracker
        currentStep={book.validation_step}
        status={book.status}
        editorialComment={book.editorial_comment}
      />

      {/* Métadonnées en 6 Blocs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Couverture & Stats */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-4 rounded-3xl bg-background border border-border space-y-4 shadow-xs">
            {book.cover_url ? (
              <img
                src={book.cover_url}
                alt={book.title}
                className="w-full aspect-[3/4] object-cover rounded-2xl border border-border shadow-md"
              />
            ) : (
              <div className="w-full aspect-[3/4] bg-navy-dark rounded-2xl flex items-center justify-center text-gold font-serif font-bold">
                Sans Couverture
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 text-center text-xs pt-2 border-t border-border">
              <div className="p-2 bg-background-secondary rounded-xl">
                <span className="text-foreground-muted text-[10px] uppercase font-bold block">Consultations</span>
                <span className="font-mono font-bold text-navy text-sm">{book.consultations_count}</span>
              </div>
              <div className="p-2 bg-background-secondary rounded-xl">
                <span className="text-foreground-muted text-[10px] uppercase font-bold block">Téléchargements</span>
                <span className="font-mono font-bold text-navy text-sm">{book.downloads_count}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Blocs de Métadonnées */}
        <div className="lg:col-span-8 space-y-6">
          <div className="p-6 rounded-3xl bg-background border border-border space-y-4 shadow-xs text-xs">
            <h3 className="font-serif font-bold text-navy text-sm uppercase tracking-wider border-b border-border pb-2">
              Fiche Synthétique de l&apos;Œuvre
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-foreground-muted text-[10px] uppercase font-bold block">Discipline</span>
                <span className="font-bold text-navy">{book.discipline}</span>
              </div>

              <div>
                <span className="text-foreground-muted text-[10px] uppercase font-bold block">Prix Unitaire</span>
                <span className="font-mono font-bold text-gold text-sm">{book.price.toLocaleString("fr-FR")} {book.currency}</span>
              </div>

              <div>
                <span className="text-foreground-muted text-[10px] uppercase font-bold block">Public Cible</span>
                <span className="font-semibold text-navy capitalize">{book.target_audience}</span>
              </div>

              <div>
                <span className="text-foreground-muted text-[10px] uppercase font-bold block">Licence</span>
                <span className="font-semibold text-navy">{book.licence_type === "tous_droits_reserves" ? "Tous Droits Réservés" : "Creative Commons"}</span>
              </div>

              <div className="sm:col-span-2">
                <span className="text-foreground-muted text-[10px] uppercase font-bold block mb-1">Résumé / 4ème de Couverture</span>
                <p className="p-3 rounded-2xl bg-background-secondary border border-border text-foreground leading-relaxed italic">
                  &ldquo;{book.summary}&rdquo;
                </p>
              </div>

              {/* Taux contractuel en lecture seule */}
              <div className="sm:col-span-2 p-3.5 rounded-2xl bg-navy/5 border border-navy/20 flex items-center justify-between">
                <div>
                  <span className="font-bold text-navy block text-xs">Taux de Redevance Contractuel Convenu</span>
                  <span className="text-[10px] text-foreground-muted">Réf Contrat : {book.contract_reference}</span>
                </div>
                <span className="font-mono font-bold text-gold text-sm px-3 py-1 bg-background rounded-xl border border-border">
                  {book.contractual_royalty_rate}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
