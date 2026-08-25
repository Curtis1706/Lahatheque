"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { 
  BookOpen, 
  Search, 
  Filter, 
  PlusCircle, 
  ArrowLeft, 
  Edit3, 
  FileText, 
  Calendar,
  AlertCircle,
  X,
  Layers,
  GraduationCap
} from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { AISuggestionBadge } from "@/components/features/layout-artist/ai-suggestion-badge";
import { BookCover3D } from "@/components/ui/book-cover-3d";
import { getMyDeposits } from "@/lib/services/layout-artist";
import type { LayoutDeposit, DepositFilterStatus } from "@/lib/types/layout-artist";

export default function MaquettisteDepositsPage() {
  const searchParams = useSearchParams();
  const initialStatus = (searchParams.get("status") as DepositFilterStatus) || "all";

  const [deposits, setDeposits] = useState<LayoutDeposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<DepositFilterStatus>(initialStatus);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const data = await getMyDeposits();
        setDeposits(data);
      } catch (err) {
        console.error("Erreur lors du chargement des dépôts :", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const counts = useMemo(() => {
    return {
      all: deposits.length,
      draft: deposits.filter((d) => d.status === "draft").length,
      pending_validation: deposits.filter((d) => d.status === "pending_validation").length,
      revision_requested: deposits.filter((d) => d.status === "revision_requested").length,
      published: deposits.filter((d) => d.status === "published").length,
    };
  }, [deposits]);

  const filteredDeposits = useMemo(() => {
    return deposits.filter((dep) => {
      if (statusFilter !== "all" && dep.status !== statusFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = dep.metadata.title?.toLowerCase().includes(q);
        const matchAuthor = dep.metadata.authors?.some((a) => a.toLowerCase().includes(q));
        const matchDiscipline = dep.classification.discipline?.toLowerCase().includes(q);
        const matchIsbn = dep.metadata.isbn?.toLowerCase().includes(q);
        if (!matchTitle && !matchAuthor && !matchDiscipline && !matchIsbn) return false;
      }
      return true;
    });
  }, [deposits, searchQuery, statusFilter]);

  const filterTabs = [
    { id: "all" as DepositFilterStatus, label: "Tous", count: counts.all },
    { id: "draft" as DepositFilterStatus, label: "Brouillons", count: counts.draft },
    { id: "pending_validation" as DepositFilterStatus, label: "En attente", count: counts.pending_validation },
    { id: "revision_requested" as DepositFilterStatus, label: "Corrections demandées", count: counts.revision_requested },
    { id: "published" as DepositFilterStatus, label: "Publiés", count: counts.published },
  ];

  return (
    <div className="p-3.5 sm:p-6 md:p-8 w-full space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <Link href="/layout-artist" className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Vue d&apos;ensemble
          </Link>
          <div className="flex items-center gap-2 text-[11px] font-bold text-navy uppercase tracking-wider mb-0.5">
            <BookOpen className="w-3.5 h-3.5 text-gold" />
            Espace Maquettiste
          </div>
          <h1 className="font-serif text-xl sm:text-2xl md:text-3xl font-bold text-navy">
            Mes Dépôts Personnels
          </h1>
          <p className="text-xs text-foreground-muted mt-0.5">
            Historique complet des épreuves et ouvrages que vous avez déposés pour publication.
          </p>
        </div>

        <Link
          href="/layout-artist/deposits/new"
          className="inline-flex items-center justify-center gap-2 bg-navy hover:bg-navy-hover text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-xs min-h-[44px] shrink-0 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4 text-gold" />
          Nouveau Dépôt
        </Link>
      </div>

      {/* Barre de Recherche et Filtres */}
      <div className="bg-background border border-border p-3.5 sm:p-4 rounded-2xl space-y-3 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-foreground-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Rechercher par titre, auteur, discipline ou ISBN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-foreground placeholder:text-foreground-muted min-h-[42px]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-foreground-muted hover:text-navy cursor-pointer"
              title="Effacer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filtres par statut (scroll horizontal fluide sur mobile) */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-border overflow-x-auto no-scrollbar pb-1">
          <span className="text-[10px] font-bold text-foreground-muted uppercase tracking-wider shrink-0 flex items-center gap-1 pr-1">
            <Filter className="w-3 h-3 text-gold" />
            Statut :
          </span>
          {filterTabs.map((st) => {
            const isActive = statusFilter === st.id;
            return (
              <button
                key={st.id}
                onClick={() => setStatusFilter(st.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors border flex items-center gap-1.5 min-h-[36px] cursor-pointer ${
                  isActive
                    ? "bg-navy text-white border-navy shadow-xs"
                    : "bg-background-secondary text-foreground-muted border-border hover:text-navy hover:bg-background"
                }`}
              >
                <span>{st.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                    isActive ? "bg-gold text-navy" : "bg-border text-foreground-muted"
                  }`}
                >
                  {st.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* CONTENU PRINCIPAL : MOBILE CARDS (< lg) & DESKTOP TABLE (lg+) */}
      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-background-secondary border border-border rounded-2xl" />
          ))}
        </div>
      ) : filteredDeposits.length === 0 ? (
        /* État Vide */
        <div className="p-8 sm:p-12 text-center bg-background border border-border rounded-2xl space-y-3">
          <BookOpen className="w-10 h-10 text-foreground-muted mx-auto" />
          <h3 className="font-serif font-bold text-navy text-base">
            {searchQuery || statusFilter !== "all"
              ? "Aucun dépôt ne correspond à vos critères"
              : "Aucun dépôt enregistré"}
          </h3>
          <p className="text-xs text-foreground-muted max-w-md mx-auto">
            {searchQuery || statusFilter !== "all"
              ? "Essayez de modifier votre terme de recherche ou de réinitialiser le filtre de statut."
              : "Vous n'avez pas encore soumis de maquette. Cliquez sur « Nouveau Dépôt » pour commencer."}
          </p>
          {(searchQuery || statusFilter !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
              }}
              className="text-xs text-gold font-bold hover:underline cursor-pointer pt-1"
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>
      ) : (
        <>
          {/* ── 1. VUE MOBILE-FIRST : CARTES EMPILÉES (< lg) ── */}
          <div className="lg:hidden space-y-3">
            {filteredDeposits.map((row) => {
                  const canEdit = row.status === "revision_requested" || row.status === "draft";
              return (
                <div
                  key={row.id}
                  className="p-4 rounded-2xl bg-background border border-border shadow-xs space-y-3.5 transition-all hover:border-gold/30"
                >
                  {/* Ligne Haute : Couverture 3D + Titre + Auteur + Discipline */}
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 pt-0.5">
                      <BookCover3D
                        title={row.metadata.title}
                        authors={row.metadata.authors}
                        discipline={row.classification.discipline}
                        coverUrl={row.files.cover_url}
                        size="xs"
                      />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <Link
                        href={`/layout-artist/deposits/${row.id}`}
                        className="font-bold text-xs sm:text-sm text-navy hover:text-gold transition-colors line-clamp-2 leading-snug"
                      >
                        {row.metadata.title}
                      </Link>
                      {row.metadata.subtitle && (
                        <p className="text-[11px] text-foreground-muted italic line-clamp-1">
                          {row.metadata.subtitle}
                        </p>
                      )}
                      <p className="text-[11px] text-foreground font-medium truncate">
                        {row.metadata.authors.join(", ") || "Auteur non renseigné"}
                        <span className="text-foreground-muted"> • {row.metadata.publication_year}</span>
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-background-secondary border border-border text-navy">
                          {row.classification.discipline || "Général"}
                        </span>
                        <span className="text-[10px] text-foreground-muted font-mono">
                          {row.files.format || "PDF"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Message d'alerte si correction demandée */}
                  {row.status === "revision_requested" && row.chef_comment && (
                    <div className="p-2.5 rounded-xl bg-error/5 border border-error/20 flex items-start gap-2 text-[11px]">
                      <AlertCircle className="w-3.5 h-3.5 text-error shrink-0 mt-0.5" />
                      <p className="text-foreground italic line-clamp-2">
                        &ldquo;{row.chef_comment}&rdquo;
                      </p>
                    </div>
                  )}

                  {/* Ligne Milieu : Statut & Date de dépôt */}
                  <div className="flex items-center justify-between pt-1 border-t border-border/70 text-xs">
                    <div className="flex items-center gap-1.5 text-foreground-muted text-[11px]">
                      <Calendar className="w-3.5 h-3.5 text-gold" />
                      <span>{new Date(row.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}</span>
                    </div>
                    <StatusBadge status={row.status} />
                  </div>

                  {/* Ligne Basse : Barre d'Actions (Cibles tactiles >= 44px) */}
                  <div className={`grid ${canEdit ? "grid-cols-3" : "grid-cols-2"} gap-2 pt-1 border-t border-border/70`}>
                    {/* 1. Lire dans la Liseuse */}
                    <Link
                      href={`/catalog/reader/${row.id}`}
                      target="_blank"
                      className="px-2.5 py-2.5 rounded-xl bg-navy hover:bg-navy-hover text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-2xs min-h-[44px] cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-gold" />
                      <span>Lire</span>
                    </Link>

                    {/* 2. Modifier / Corriger */}
                    {canEdit && (
                      <Link
                        href={`/layout-artist/deposits/${row.id}`}
                        className="px-2.5 py-2.5 rounded-xl border border-gold/40 bg-gold/10 hover:bg-gold hover:text-navy text-gold text-xs font-bold flex items-center justify-center gap-1.5 transition-colors min-h-[44px] cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>{row.status === "revision_requested" ? "Corriger" : "Modifier"}</span>
                      </Link>
                    )}

                    {/* 3. Détails */}
                    <Link
                      href={`/layout-artist/deposits/${row.id}`}
                      className="px-2.5 py-2.5 rounded-xl border border-border bg-background-secondary hover:bg-background text-navy text-xs font-bold flex items-center justify-center gap-1.5 transition-colors min-h-[44px] cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-gold" />
                      <span>Détails</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── 2. VUE DESKTOP : TABLE COMPACTE & ÉLÉGANTE (lg+) ── */}
          <div className="hidden lg:block bg-background border border-border rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-background-secondary border-b border-border text-navy font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Ouvrage &amp; Couverture</th>
                  <th className="py-3.5 px-4">Discipline</th>
                  <th className="py-3.5 px-4">Langue</th>
                  <th className="py-3.5 px-4">Déposé le</th>
                  <th className="py-3.5 px-4">Statut</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredDeposits.map((row) => {
                      const canEdit = row.status === "revision_requested" || row.status === "draft";
                  return (
                    <tr key={row.id} className="hover:bg-background-secondary/40 transition-colors">
                      {/* Ouvrage & Couverture */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <BookCover3D
                            title={row.metadata.title}
                            authors={row.metadata.authors}
                            discipline={row.classification.discipline}
                            coverUrl={row.files.cover_url}
                            size="xs"
                          />
                          <div className="min-w-0 max-w-[260px]">
                            <Link
                              href={`/layout-artist/deposits/${row.id}`}
                              className="font-bold text-xs text-navy hover:text-gold transition-colors truncate block"
                            >
                              {row.metadata.title}
                            </Link>
                            <p className="text-[11px] text-foreground-muted font-mono mt-0.5 truncate">
                              {row.metadata.authors.join(", ") || "Auteur"} • {row.metadata.publication_year}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Discipline */}
                      <td className="py-3 px-4">
                        <span className="font-semibold text-foreground">{row.classification.discipline || "Non classifié"}</span>
                      </td>

                      {/* Langue */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 whitespace-nowrap">
                          <span className="font-medium text-foreground">{row.metadata.language}</span>
                          <AISuggestionBadge source={row.metadata.language_source} />
                        </div>
                      </td>

                      {/* Déposé le */}
                      <td className="py-3 px-4 font-mono text-foreground-muted whitespace-nowrap">
                        {new Date(row.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>

                      {/* Statut */}
                      <td className="py-3 px-4">
                        <StatusBadge status={row.status} />
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center gap-1.5 justify-end">
                          {/* 1. Lire dans la Liseuse */}
                          <Link
                            href={`/catalog/reader/${row.id}`}
                            target="_blank"
                            className="p-2 rounded-xl border border-border bg-background hover:bg-navy hover:text-white text-navy transition-colors inline-flex items-center justify-center min-h-[36px] min-w-[36px] cursor-pointer"
                            title="Lire dans la Liseuse LAHAThèque"
                          >
                            <BookOpen className="w-3.5 h-3.5 text-gold" />
                          </Link>

                          {/* 2. Modifier / Corriger */}
                          {canEdit && (
                            <Link
                              href={`/layout-artist/deposits/${row.id}`}
                              className="p-2 rounded-xl border border-gold/40 bg-gold/10 hover:bg-gold hover:text-navy text-gold transition-colors inline-flex items-center justify-center min-h-[36px] min-w-[36px] cursor-pointer"
                              title={row.status === "revision_requested" ? "Corriger l'épreuve demandée" : "Modifier l'ouvrage"}
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </Link>
                          )}

                          {/* 3. Détails */}
                          <Link
                            href={`/layout-artist/deposits/${row.id}`}
                            className="p-2 rounded-xl border border-border bg-background-secondary hover:bg-navy hover:text-white text-foreground-muted transition-colors inline-flex items-center justify-center min-h-[36px] min-w-[36px] cursor-pointer"
                            title="Consulter les détails du dépôt"
                          >
                            <FileText className="w-3.5 h-3.5 text-navy" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
