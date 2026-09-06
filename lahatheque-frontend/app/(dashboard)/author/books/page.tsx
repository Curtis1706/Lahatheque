"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  BookOpen, 
  ArrowLeft, 
  Eye, 
  Download, 
  DollarSign, 
  ChevronRight, 
  BarChart3, 
  ShoppingBag, 
  ArrowRight,
  Headphones,
} from "lucide-react";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { BookCover3D } from "@/components/ui/book-cover-3d";
import { getAuthorPublishedBooks } from "@/lib/services/author";
import { useAudioPlayer } from "@/components/features/audio/audio-player-context";
import type { AuthorPublishedBook } from "@/lib/types/author";

export default function AuthorBooksPage() {
  const { playBook } = useAudioPlayer();
  const [books, setBooks] = useState<AuthorPublishedBook[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await getAuthorPublishedBooks();
      setBooks(data);
      setLoading(false);
    }
    loadData();
  }, []);

  const columns: DataTableColumn<AuthorPublishedBook>[] = [
    {
      key: "title",
      header: "Titre de l'Ouvrage Publié",
      cell: (row) => (
        <div className="flex items-center gap-3 py-1">
          <BookCover3D
            title={row.title}
            coverUrl={row.cover_url}
            size="xs"
          />
          <div className="min-w-0">
            <p className="font-serif font-bold text-xs text-navy leading-snug">{row.title}</p>
            <p className="text-[10px] text-foreground-muted font-mono mt-0.5">Publié le {row.published_at}</p>
          </div>
        </div>
      ),
    },
    {
      key: "sales_count",
      header: "Ventes Totales",
      cell: (row) => (
        <span className="font-mono font-bold text-xs text-navy">
          {row.sales_count.toLocaleString("fr-FR")} exemplaires
        </span>
      ),
    },
    {
      key: "stock_remaining" as keyof AuthorPublishedBook,
      header: "Stock Restant",
      cell: (row) => (
        <div>
          <span className="font-mono font-bold text-xs text-navy">
            {(row.stock_remaining ?? 0).toLocaleString("fr-FR")} ex.
          </span>
          <p className="text-[10px] text-foreground-muted">disponibles</p>
        </div>
      ),
    },
    {
      key: "stock_initial" as keyof AuthorPublishedBook,
      header: "Stock Initial",
      hideOnMobile: true,
      cell: (row) => (
        <div>
          <span className="font-mono font-bold text-xs text-foreground-muted">
            {(row.stock_initial ?? 0).toLocaleString("fr-FR")} ex.
          </span>
          <p className="text-[10px] text-foreground-muted">tirage total</p>
        </div>
      ),
    },
    {
      key: "downloads_count",
      header: "Lectures Sécurisées",
      hideOnMobile: true,
      cell: (row) => (
        <span className="font-mono font-bold text-xs text-navy">
          {row.downloads_count.toLocaleString("fr-FR")} lectures
        </span>
      ),
    },
    {
      key: "total_revenue_generated",
      header: "Chiffre d'Affaires Net",
      cell: (row) => (
        <span className="font-mono font-bold text-foreground text-xs">
          {row.total_revenue_generated.toLocaleString("fr-FR")} XOF
        </span>
      ),
    },
    {
      key: "author_royalty_share_amount",
      header: "Part Rétribuée Auteur (15%)",
      cell: (row) => (
        <span className="font-mono font-bold text-gold text-xs">
          {row.author_royalty_share_amount.toLocaleString("fr-FR")} XOF
        </span>
      ),
    },
    {
      key: "id",
      header: "",
      cell: (row) => (
        <div className="flex items-center gap-1.5 justify-end">
          <button
            type="button"
            onClick={() => playBook(row.id)}
            className="px-2.5 py-1.5 rounded-xl bg-gold/15 text-navy border border-gold/30 hover:bg-gold/25 text-[10px] font-bold transition-colors inline-flex items-center gap-1 min-h-[36px] cursor-pointer"
            title="Écouter la version audio de votre ouvrage (Accès auteur)"
          >
            <Headphones className="w-3.5 h-3.5 text-gold" />
            <span>Écouter</span>
          </button>

          <Link
            href={`/author/catalog`}
            className="px-2.5 py-1.5 rounded-xl bg-gold/15 text-navy border border-gold/30 hover:bg-gold/25 text-[10px] font-bold transition-colors inline-flex items-center gap-1 min-h-[36px]"
            title="Commander cet ouvrage avec votre remise auteur (-40% papier)"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-gold" />
            <span>Commander (-40%)</span>
          </Link>
          <Link
            href={`/author/books/${row.id}`}
            className="px-3 py-1.5 rounded-xl bg-navy text-white text-[10px] font-bold hover:bg-navy-hover transition-colors inline-flex items-center gap-1 min-h-[36px]"
          >
            <BarChart3 className="w-3.5 h-3.5 text-gold" />
            Détail
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/author" className="hover:text-navy">Vue d&apos;ensemble</Link>
        <span>/</span>
        <span className="text-navy font-semibold">Mes Livres Publiés</span>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/author" className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Vue d&apos;ensemble
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
            <BookOpen className="w-4 h-4 text-gold" />
            Catalogue Commercial Auteur (Règle Stricte : Publiés Uniquement)
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Mes Livres Publiés
          </h1>
          <p className="text-xs text-foreground-muted mt-1">
            Suivi des ventes, des lectures en streaming sécurisé et des revenus générés pour chacun de vos ouvrages actuellement au catalogue.
          </p>
        </div>
      </div>

      {/* Bannière Remise Auteur */}
      <div className="p-4 rounded-2xl bg-gold/10 border border-gold/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gold text-navy">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-xs text-navy">
              Tarif Préférentiel Auteur : -40% sur vos exemplaires papier &amp; -25% en numérique
            </p>
            <p className="text-[11px] text-foreground-muted">
              Commandez des tirages personnels pour vos dédicaces, conférences ou pour votre entourage.
            </p>
          </div>
        </div>
        <Link
          href="/author/catalog"
          className="px-4 py-2 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors inline-flex items-center gap-1.5 shrink-0 shadow-xs min-h-[40px]"
        >
          <span>Commander mes livres (-40%)</span>
          <ArrowRight className="w-3.5 h-3.5 text-gold" />
        </Link>
      </div>

      {/* Note d'explication de la règle de séparation avec "Mes Dépôts" */}
      <div className="p-4 rounded-2xl bg-navy/5 border border-navy/20 text-xs text-navy space-y-1">
        <p className="font-bold flex items-center gap-1.5">
          <BookOpen className="w-4 h-4 text-gold" />
          Séparation Stricte &ldquo;Mes Livres&rdquo; vs &ldquo;Mes Dépôts&rdquo; :
        </p>
        <p className="text-foreground-muted leading-relaxed">
          Cette page répertorie **exclusivement vos ouvrages publiés** générant des ventes. Tous les manuscrits en étude éditoriale ou en cours de préparation catalogue restent gérés dans la rubrique <Link href="/author/submissions" className="font-bold text-navy underline">Mes Dépôts</Link>.
        </p>
      </div>

      {/* Tableau des Livres Publiés */}
      <div className="space-y-4">
        <h3 className="font-serif font-bold text-navy text-base">
          Ouvrages Publiés au Catalogue ({books.length})
        </h3>

        <DataTable
          data={books}
          columns={columns}
          rowKey="id"
          loading={loading}
          emptyMessage="Aucun livre publié pour le moment."
          pageSize={10}
        />
      </div>
    </div>
  );
}
