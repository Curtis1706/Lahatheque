"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Sparkles,
  TrendingUp,
  BookOpen,
  ShoppingCart,
  Search,
  Filter,
  Eye,
  Award,
  Layers,
  Percent,
  Package,
} from "lucide-react";
import { BookCover3D } from "@/components/ui/book-cover-3d";
import { getWholesalerTrendingData } from "@/lib/services/wholesaler";
import type { WholesaleTrendBook, WholesalerBookItem } from "@/lib/types/wholesaler";
import { WholesaleOrderModal } from "@/components/features/wholesaler/wholesale-order-modal";
import { BookPreviewModal } from "@/components/features/wholesaler/book-preview-modal";
import { PageLoader } from "@/components/ui/page-loader";

export default function WholesalerNotificationsPage() {
  const [newReleases, setNewReleases] = useState<WholesaleTrendBook[]>([]);
  const [bestSellers, setBestSellers] = useState<WholesaleTrendBook[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<"all" | "new" | "bestsellers">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDiscipline, setSelectedDiscipline] = useState("all");

  // Modales
  const [previewBook, setPreviewBook] = useState<WholesalerBookItem | null>(null);
  const [orderBook, setOrderBook] = useState<WholesalerBookItem | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const data = await getWholesalerTrendingData();
        setNewReleases(data.new_releases || []);
        setBestSellers(data.best_sellers || []);
      } catch (err) {
        console.error("Erreur de chargement des tendances grossiste :", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Liste unique des disciplines
  const disciplines = useMemo(() => {
    const set = new Set<string>();
    newReleases.forEach((b) => b.discipline && set.add(b.discipline));
    bestSellers.forEach((b) => b.discipline && set.add(b.discipline));
    return Array.from(set);
  }, [newReleases, bestSellers]);

  // Filtrage
  const filterBooks = (books: WholesaleTrendBook[]) => {
    return books.filter((b) => {
      const matchSearch =
        searchQuery.trim() === "" ||
        b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.authors.some((a) => a.toLowerCase().includes(searchQuery.toLowerCase())) ||
        b.isbn.toLowerCase().includes(searchQuery.toLowerCase());

      const matchDiscipline =
        selectedDiscipline === "all" || b.discipline === selectedDiscipline;

      return matchSearch && matchDiscipline;
    });
  };

  const filteredNewReleases = useMemo(() => filterBooks(newReleases), [newReleases, searchQuery, selectedDiscipline]);
  const filteredBestSellers = useMemo(() => filterBooks(bestSellers), [bestSellers, searchQuery, selectedDiscipline]);

  // Helper pour convertir un WholesaleTrendBook en WholesalerBookItem
  const toBookItem = (b: WholesaleTrendBook): WholesalerBookItem => ({
    id: b.id,
    title: b.title,
    authors: b.authors,
    cover_url: b.cover_url,
    isbn_digital: b.isbn,
    isbn_print: b.isbn ? `${b.isbn}-P` : undefined,
    discipline: b.discipline,
    publisher_name: "LAHA Éditions",
    digital_wholesale_price: b.digital_wholesale_price,
    print_wholesale_price: b.print_wholesale_price,
    digital_discount_pct: b.digital_discount_percent,
    paper_discount_pct: b.print_discount_percent,
    public_price: b.public_paper_price || b.public_digital_price,
    min_quantity: 1,
    stock_available_print: b.is_paper_available ? 50 : 0,
    is_paper_available: b.is_paper_available,
    summary: b.summary,
  });

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-8 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/wholesaler" className="hover:text-navy transition-colors">Vue d&apos;ensemble</Link>
        <span>/</span>
        <span className="text-navy font-semibold">Nouveautés &amp; Meilleures Ventes</span>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <Link
            href="/wholesaler"
            className="inline-flex items-center gap-1.5 text-xs text-navy font-bold hover:underline mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Retour à la vue d&apos;ensemble
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4 text-gold" />
            Tendances Commerciales &amp; Nouvelles Parutions
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Nouveautés &amp; Meilleures Ventes
          </h1>
          <p className="text-xs sm:text-sm text-foreground-muted mt-1 max-w-2xl">
            Explorez les dernières parutions enrichies et les succès d&apos;édition du catalogue pour optimiser vos réapprovisionnements aux tarifs préférentiels grossiste.
          </p>
        </div>

        {/* Badges Synthèse */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="px-4 py-2.5 rounded-2xl bg-gold/10 border border-gold/30 flex items-center gap-2.5">
            <Percent className="w-4 h-4 text-gold" />
            <div>
              <span className="block text-[10px] uppercase font-bold text-navy">Tarifs Grossiste</span>
              <span className="text-xs font-bold text-gold font-mono">-25% Num. / -30% Papier</span>
            </div>
          </div>
          <div className="px-4 py-2.5 rounded-2xl bg-background-secondary border border-border flex items-center gap-2.5">
            <Package className="w-4 h-4 text-navy" />
            <div>
              <span className="block text-[10px] uppercase font-bold text-foreground-muted">Ouvrages Référencés</span>
              <span className="text-xs font-bold text-navy font-mono">{newReleases.length + bestSellers.length} titres</span>
            </div>
          </div>
        </div>
      </div>

      {/* Barre d'outils : Onglets, Recherche et Filtre */}
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Onglets de sélection */}
          <div className="flex items-center gap-1.5 p-1 bg-background-secondary rounded-2xl border border-border overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeTab === "all"
                  ? "bg-navy text-white shadow-xs"
                  : "text-foreground-muted hover:text-navy"
              }`}
            >
              Vue Complète
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("new")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                activeTab === "new"
                  ? "bg-navy text-white shadow-xs"
                  : "text-foreground-muted hover:text-navy"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-gold" />
              Nouvelles Parutions ({filteredNewReleases.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("bestsellers")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                activeTab === "bestsellers"
                  ? "bg-navy text-white shadow-xs"
                  : "text-foreground-muted hover:text-navy"
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              Meilleures Ventes ({filteredBestSellers.length})
            </button>
          </div>

          {/* Recherche & Filtre Discipline */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-foreground-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher titre, auteur..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-background border border-border focus:border-gold focus:outline-hidden transition-colors"
              />
            </div>

            <div className="relative w-full sm:w-56">
              <Filter className="w-3.5 h-3.5 text-foreground-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                value={selectedDiscipline}
                onChange={(e) => setSelectedDiscipline(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-background border border-border focus:border-gold focus:outline-hidden transition-colors cursor-pointer appearance-none"
              >
                <option value="all">Toutes les disciplines</option>
                {disciplines.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <PageLoader label="Chargement des tendances du catalogue..." />
      ) : (
        <div className="space-y-10">
          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* SECTION 1 : NOUVELLES PARUTIONS                                    */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          {(activeTab === "all" || activeTab === "new") && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h2 className="font-serif font-bold text-navy text-lg sm:text-xl flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-gold" />
                  Nouvelles Parutions en Catalogue
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-gold/15 text-gold">
                    {filteredNewReleases.length}
                  </span>
                </h2>
              </div>

              {filteredNewReleases.length === 0 ? (
                <div className="p-8 rounded-3xl bg-background-secondary border border-border text-center">
                  <BookOpen className="w-8 h-8 text-foreground-muted mx-auto mb-2 opacity-50" />
                  <p className="text-xs text-foreground-muted">
                    Aucune nouvelle parution ne correspond à vos critères de recherche.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                  {filteredNewReleases.map((b) => {
                    const bookItem = toBookItem(b);
                    return (
                      <div
                        key={b.id}
                        className="group p-4 sm:p-5 rounded-3xl bg-background border border-border hover:border-gold/50 transition-all duration-200 flex flex-col justify-between gap-4 shadow-xs"
                      >
                        <div className="space-y-3">
                          {/* En-tête de carte avec Couverture 3D & Infos */}
                          <div className="flex gap-3.5">
                            <BookCover3D
                              title={b.title}
                              authors={b.authors}
                              discipline={b.discipline}
                              coverUrl={b.cover_url}
                              size="xs"
                              interactive={false}
                            />

                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="px-2 py-0.5 rounded-md bg-gold/20 text-gold text-[10px] font-bold tracking-wide">
                                  Nouveau
                                </span>
                                {b.is_paper_available && (
                                  <span className="px-1.5 py-0.5 rounded-md bg-background-secondary text-foreground-muted text-[9px] font-medium border border-border">
                                    Papier dispo
                                  </span>
                                )}
                              </div>
                              <h3 className="font-serif font-bold text-sm text-navy line-clamp-2 leading-tight">
                                {b.title}
                              </h3>
                              <p className="text-xs text-foreground-muted truncate">
                                {b.authors.join(", ")}
                              </p>
                              <div className="flex items-center gap-1.5 text-[11px] text-foreground-muted pt-0.5">
                                <Layers className="w-3 h-3 text-gold" />
                                <span className="truncate">{b.discipline}</span>
                              </div>
                            </div>
                          </div>

                          {/* Résumé court */}
                          {b.summary && (
                            <p className="text-xs text-foreground-muted line-clamp-2 italic bg-background-secondary/50 p-2 rounded-xl">
                              &ldquo;{b.summary}&rdquo;
                            </p>
                          )}

                          {/* Tarification Grossiste B2B */}
                          <div className="p-3 rounded-2xl bg-background-secondary border border-border/80 space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-foreground-muted">Tarif Gros Papier :</span>
                              <div className="text-right">
                                {b.is_paper_available ? (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] text-foreground-muted line-through">
                                      {b.public_paper_price.toLocaleString("fr-FR")} XOF
                                    </span>
                                    <span className="font-mono font-bold text-navy">
                                      {b.print_wholesale_price.toLocaleString("fr-FR")} XOF
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-[11px] text-foreground-muted italic">Non disponible</span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-xs pt-1 border-t border-border/50">
                              <span className="text-foreground-muted">Licence Numérique :</span>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-foreground-muted line-through">
                                  {b.public_digital_price.toLocaleString("fr-FR")} XOF
                                </span>
                                <span className="font-mono font-bold text-gold">
                                  {b.digital_wholesale_price.toLocaleString("fr-FR")} XOF
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Boutons d'Action */}
                        <div className="flex items-center gap-2 pt-2 border-t border-border">
                          <button
                            type="button"
                            onClick={() => setPreviewBook(bookItem)}
                            className="flex-1 py-2 px-2.5 rounded-xl bg-background-secondary border border-border hover:border-gold text-foreground-muted hover:text-navy text-xs font-bold transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Aperçu
                          </button>

                          <button
                            type="button"
                            onClick={() => setOrderBook(bookItem)}
                            className="flex-1 py-2 px-2.5 rounded-xl bg-navy text-white hover:bg-navy-hover text-xs font-bold transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <ShoppingCart className="w-3.5 h-3.5 text-gold" />
                            Commander
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════════ */}
          {/* SECTION 2 : MEILLEURES VENTES DU CATALOGUE                          */}
          {/* ═══════════════════════════════════════════════════════════════════ */}
          {(activeTab === "all" || activeTab === "bestsellers") && (
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h2 className="font-serif font-bold text-navy text-lg sm:text-xl flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  Meilleures Ventes &amp; Succès d&apos;Édition
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700">
                    Top {filteredBestSellers.length}
                  </span>
                </h2>
              </div>

              {filteredBestSellers.length === 0 ? (
                <div className="p-8 rounded-3xl bg-background-secondary border border-border text-center">
                  <TrendingUp className="w-8 h-8 text-foreground-muted mx-auto mb-2 opacity-50" />
                  <p className="text-xs text-foreground-muted">
                    Aucun succès d&apos;édition ne correspond à vos critères de recherche.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                  {filteredBestSellers.map((b) => {
                    const bookItem = toBookItem(b);
                    const rank = b.rank || 1;
                    const isTop1 = rank === 1;
                    const isTop3 = rank <= 3;

                    return (
                      <div
                        key={b.id}
                        className={`group p-4 sm:p-5 rounded-3xl bg-background border transition-all duration-200 flex flex-col justify-between gap-4 shadow-xs ${
                          isTop1
                            ? "border-gold/60 bg-gold/5"
                            : "border-border hover:border-gold/50"
                        }`}
                      >
                        <div className="space-y-3">
                          {/* En-tête avec badge classement */}
                          <div className="flex gap-3.5">
                            <div className="relative shrink-0">
                              <BookCover3D
                                title={b.title}
                                authors={b.authors}
                                discipline={b.discipline}
                                coverUrl={b.cover_url}
                                size="xs"
                                interactive={false}
                              />
                              <span
                                className={`absolute -top-2 -left-2 size-6 rounded-full flex items-center justify-center font-mono font-bold text-xs shadow-xs border ${
                                  isTop1
                                    ? "bg-gold text-navy border-gold"
                                    : isTop3
                                    ? "bg-navy text-gold border-gold/40"
                                    : "bg-background-secondary text-foreground-muted border-border"
                                }`}
                              >
                                #{rank}
                              </span>
                            </div>

                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                {isTop1 && (
                                  <span className="px-2 py-0.5 rounded-md bg-gold text-navy text-[10px] font-bold flex items-center gap-1">
                                    <Award className="w-3 h-3" />
                                    N°1 des Ventes
                                  </span>
                                )}
                                {b.total_sold !== undefined && b.total_sold > 0 && (
                                  <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 text-[10px] font-bold font-mono">
                                    {b.total_sold} vendus
                                  </span>
                                )}
                              </div>
                              <h3 className="font-serif font-bold text-sm text-navy line-clamp-2 leading-tight">
                                {b.title}
                              </h3>
                              <p className="text-xs text-foreground-muted truncate">
                                {b.authors.join(", ")}
                              </p>
                              <div className="flex items-center gap-1.5 text-[11px] text-foreground-muted pt-0.5">
                                <Layers className="w-3 h-3 text-gold" />
                                <span className="truncate">{b.discipline}</span>
                              </div>
                            </div>
                          </div>

                          {/* Tarification Grossiste B2B */}
                          <div className="p-3 rounded-2xl bg-background-secondary border border-border/80 space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-foreground-muted">Tarif Gros Papier :</span>
                              <div className="text-right">
                                {b.is_paper_available ? (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] text-foreground-muted line-through">
                                      {b.public_paper_price.toLocaleString("fr-FR")} XOF
                                    </span>
                                    <span className="font-mono font-bold text-navy">
                                      {b.print_wholesale_price.toLocaleString("fr-FR")} XOF
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-[11px] text-foreground-muted italic">Non disponible</span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-xs pt-1 border-t border-border/50">
                              <span className="text-foreground-muted">Licence Numérique :</span>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] text-foreground-muted line-through">
                                  {b.public_digital_price.toLocaleString("fr-FR")} XOF
                                </span>
                                <span className="font-mono font-bold text-gold">
                                  {b.digital_wholesale_price.toLocaleString("fr-FR")} XOF
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Boutons d'Action */}
                        <div className="flex items-center gap-2 pt-2 border-t border-border">
                          <button
                            type="button"
                            onClick={() => setPreviewBook(bookItem)}
                            className="flex-1 py-2 px-2.5 rounded-xl bg-background-secondary border border-border hover:border-gold text-foreground-muted hover:text-navy text-xs font-bold transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Aperçu
                          </button>

                          <button
                            type="button"
                            onClick={() => setOrderBook(bookItem)}
                            className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-xs ${
                              isTop1
                                ? "bg-gold text-navy hover:bg-gold-light"
                                : "bg-navy text-white hover:bg-navy-hover"
                            }`}
                          >
                            <ShoppingCart className={`w-3.5 h-3.5 ${isTop1 ? "text-navy" : "text-gold"}`} />
                            Commander
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modale d'Aperçu de Livre */}
      <BookPreviewModal
        book={previewBook}
        isOpen={Boolean(previewBook)}
        onClose={() => setPreviewBook(null)}
        onOrder={(b) => {
          setPreviewBook(null);
          setOrderBook(b);
        }}
      />

      {/* Modale de Commande Groupée Directe */}
      <WholesaleOrderModal
        book={orderBook}
        isOpen={Boolean(orderBook)}
        onClose={() => setOrderBook(null)}
      />
    </div>
  );
}
