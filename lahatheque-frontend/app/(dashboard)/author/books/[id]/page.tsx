"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { BookOpen, ArrowLeft, BarChart3, Globe, Layers, DollarSign, Download } from "lucide-react";
import { getAuthorPublishedBookDetails } from "@/lib/services/author";
import type { AuthorPublishedBook } from "@/lib/types/author";

export default function AuthorBookDetailPage() {
  const params = useParams();
  const bookId = (params?.id as string) || "pub-book-01";

  const [book, setBook] = useState<AuthorPublishedBook | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await getAuthorPublishedBookDetails(bookId);
      setBook(data);
      setLoading(false);
    }
    loadData();
  }, [bookId]);

  if (loading || !book) {
    return (
      <div className="p-8 text-center space-y-4">
        <span className="w-8 h-8 border-2 border-navy border-t-gold rounded-full animate-spin inline-block" />
        <p className="text-xs text-foreground-muted font-mono">Chargement du détail de l&apos;ouvrage...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-8 max-w-6xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/author" className="hover:text-navy">Vue d&apos;ensemble</Link>
        <span>/</span>
        <Link href="/author/books" className="hover:text-navy">Mes Livres</Link>
        <span>/</span>
        <span className="text-navy font-semibold">{book.title}</span>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/author/books" className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Retour à Mes Livres Publiés
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
            <BarChart3 className="w-4 h-4 text-gold" />
            Statistiques Détaillées de l&apos;Ouvrage
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            {book.title}
          </h1>
          <p className="text-xs text-foreground-muted mt-1">
            Répartition des ventes par format (numérique, papier, audio) et répartition géographique multi-pays.
          </p>
        </div>
      </div>

      {/* Cartes de Synthèse de l'Ouvrage */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-background border border-border space-y-1 shadow-xs">
          <span className="text-[10px] text-foreground-muted uppercase font-bold block">Ventes Cumulées</span>
          <p className="font-mono font-bold text-xl text-navy">{book.sales_count.toLocaleString("fr-FR")}</p>
        </div>
        <div className="p-5 rounded-3xl bg-background border border-border space-y-1 shadow-xs">
          <span className="text-[10px] text-foreground-muted uppercase font-bold block">Téléchargements (DRM)</span>
          <p className="font-mono font-bold text-xl text-navy">{book.downloads_count.toLocaleString("fr-FR")}</p>
        </div>
        <div className="p-5 rounded-3xl bg-background border border-border space-y-1 shadow-xs">
          <span className="text-[10px] text-foreground-muted uppercase font-bold block">Revenus Générés</span>
          <p className="font-mono font-bold text-xl text-navy">{book.total_revenue_generated.toLocaleString("fr-FR")} XOF</p>
        </div>
        <div className="p-5 rounded-3xl bg-background border border-border space-y-1 shadow-xs">
          <span className="text-[10px] text-foreground-muted uppercase font-bold block">Part Rétribuée Auteur</span>
          <p className="font-mono font-bold text-xl text-gold">{book.author_royalty_share_amount.toLocaleString("fr-FR")} XOF</p>
        </div>
      </div>

      {/* Répartition par Format & Répartition Géographique */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Répartition par Format (Numérique, Papier, Audio) */}
        <div className="p-6 rounded-3xl bg-background border border-border space-y-4 shadow-xs">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Layers className="w-5 h-5 text-gold" />
            <h3 className="font-serif font-bold text-navy text-base">Répartition des Ventes par Format</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-background-secondary border border-border">
              <span className="font-bold text-navy">Format Numérique (EPUB / PDF) :</span>
              <span className="font-mono font-bold text-gold">{book.format_breakdown.digital} ventes</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-2xl bg-background-secondary border border-border">
              <span className="font-bold text-navy">Format Papier Physique :</span>
              <span className="font-mono font-bold text-gold">{book.format_breakdown.paper} ventes</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-2xl bg-background-secondary border border-border">
              <span className="font-bold text-navy">Format Livre Audio Streaming :</span>
              <span className="font-mono font-bold text-gold">{book.format_breakdown.audio} ventes</span>
            </div>
          </div>
        </div>

        {/* Répartition Géographique par Pays */}
        <div className="p-6 rounded-3xl bg-background border border-border space-y-4 shadow-xs">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Globe className="w-5 h-5 text-gold" />
            <h3 className="font-serif font-bold text-navy text-base">Répartition Géographique par Pays</h3>
          </div>

          <div className="space-y-3 text-xs">
            {book.country_breakdown.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-background-secondary border border-border">
                <span className="font-bold text-navy flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-gold inline-block" />
                  {item.country}
                </span>
                <span className="font-mono font-bold text-navy">{item.sales} ventes</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
