"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { BookOpen, ArrowLeft, BarChart3, Globe, Layers, DollarSign, Download, ShoppingBag, ArrowRight, Headphones } from "lucide-react";
import { getAuthorPublishedBookDetails } from "@/lib/services/author";
import type { AuthorPublishedBook } from "@/lib/types/author";
import { PageLoader } from "@/components/ui/page-loader";
import { useAudioPlayer } from "@/components/features/audio/audio-player-context";

export default function AuthorBookDetailPage() {
  const params = useParams();
  const { playBook } = useAudioPlayer();
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
    return <PageLoader label="Chargement du détail de l'ouvrage" />;
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

        <div className="flex items-center gap-2">
          {((book as any).has_audio_version || (book as any).has_audio || (book.format_breakdown?.audio ?? 0) > 0) && (
            <button
              type="button"
              onClick={() => playBook(book.id)}
              className="px-3.5 py-2.5 rounded-xl bg-gold/15 text-navy border border-gold/30 hover:bg-gold/25 text-xs font-bold transition-all inline-flex items-center gap-2 shadow-xs shrink-0 min-h-[44px] cursor-pointer"
              title="Écouter la version audio de votre ouvrage"
            >
              <Headphones className="w-4 h-4 text-gold" />
              <span>Écouter l&apos;audio</span>
            </button>
          )}
          <Link
            href="/author/catalog"
            className="px-4 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors inline-flex items-center gap-2 shadow-xs shrink-0 min-h-[44px]"
          >
            <ShoppingBag className="w-4 h-4 text-gold" />
            <span>Commander cet ouvrage (-40%)</span>
          </Link>
        </div>
      </div>

      {/* Bannière Remise Auteur pour cet ouvrage */}
      <div className="p-4 rounded-2xl bg-gold/10 border border-gold/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gold text-navy shrink-0">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-xs text-navy">
              Tarif Préférentiel Auteur : -40% sur vos exemplaires papier &amp; -25% en numérique
            </p>
            <p className="text-[11px] text-foreground-muted">
              Disponible immédiatement pour vos événements, dédicaces, cours ou tirages personnels.
            </p>
          </div>
        </div>
        <Link
          href="/author/catalog"
          className="px-4 py-2 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors inline-flex items-center gap-1.5 shrink-0 shadow-xs min-h-[40px]"
        >
          <span>Commander (-40%)</span>
          <ArrowRight className="w-3.5 h-3.5 text-gold" />
        </Link>
      </div>

      {/* Cartes de Synthèse de l'Ouvrage incluant Stock Restant et Stock Initial */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="p-4 rounded-3xl bg-background border border-border space-y-1 shadow-xs">
          <span className="text-[10px] text-foreground-muted uppercase font-bold block">Ventes Totales</span>
          <p className="font-mono font-bold text-lg text-navy">{book.sales_count.toLocaleString("fr-FR")} ex.</p>
        </div>
        <div className="p-4 rounded-3xl bg-navy-light border border-navy-hover/20 space-y-1 shadow-xs">
          <span className="text-[10px] text-navy uppercase font-bold block">Stock Restant</span>
          <p className="font-mono font-bold text-lg text-navy">{(book.stock_remaining ?? 0).toLocaleString("fr-FR")} ex.</p>
        </div>
        <div className="p-4 rounded-3xl bg-background border border-border space-y-1 shadow-xs">
          <span className="text-[10px] text-foreground-muted uppercase font-bold block">Stock Initial</span>
          <p className="font-mono font-bold text-lg text-foreground-muted">{(book.stock_initial ?? 0).toLocaleString("fr-FR")} ex.</p>
        </div>
        <div className="p-4 rounded-3xl bg-background border border-border space-y-1 shadow-xs">
          <span className="text-[10px] text-foreground-muted uppercase font-bold block">Lectures Sécurisées</span>
          <p className="font-mono font-bold text-lg text-navy">{book.downloads_count.toLocaleString("fr-FR")} lectures</p>
        </div>
        <div className="p-4 rounded-3xl bg-background border border-border space-y-1 shadow-xs">
          <span className="text-[10px] text-foreground-muted uppercase font-bold block">Revenus Générés</span>
          <p className="font-mono font-bold text-lg text-navy">{book.total_revenue_generated.toLocaleString("fr-FR")} XOF</p>
        </div>
        <div className="p-4 rounded-3xl bg-background border border-border space-y-1 shadow-xs">
          <span className="text-[10px] text-foreground-muted uppercase font-bold block">Part Auteur</span>
          <p className="font-mono font-bold text-lg text-gold">{book.author_royalty_share_amount.toLocaleString("fr-FR")} XOF</p>
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
