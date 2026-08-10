"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  getAuthorSubmissions, 
  getAuthorBooks, 
  getAuthorStats 
} from "@/lib/services/author";
import { AuthorSubmission, AuthorBook, AuthorStats } from "@/lib/types/author";
import { 
  PenTool, 
  BookOpen, 
  DollarSign, 
  Plus, 
  ArrowUpRight, 
  Clock, 
  AlertTriangle,
  FileCheck,
  Building2,
  TrendingUp,
  Download
} from "lucide-react";
import { AuthorKpiCharts } from "@/components/features/author/author-kpi-charts";
import { BookCover } from "@/components/features/student/book-cover";
import { BookCard } from "@/components/features/student/book-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState, EmptyIcon, EmptyTitle, EmptyDescription } from "@/components/ui/empty-state";
import { StudentBookAccess } from "@/lib/types/student";

export default function AuthorDashboardPage() {
  const [books, setBooks] = useState<AuthorBook[]>([]);
  const [submissions, setSubmissions] = useState<AuthorSubmission[]>([]);
  const [stats, setStats] = useState<AuthorStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAuthorData() {
      try {
        setLoading(true);
        const [booksData, submissionsData, statsData] = await Promise.all([
          getAuthorBooks(),
          getAuthorSubmissions(),
          getAuthorStats()
        ]);
        setBooks(booksData);
        setSubmissions(submissionsData);
        setStats(statsData);
      } catch (err) {
        console.error("Erreur de chargement des données auteur", err);
      } finally {
        setLoading(false);
      }
    }
    loadAuthorData();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background text-foreground py-6 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-8 max-w-7xl mx-auto w-full min-w-0"
    >
      {/* 1. KPIS EN PREMIER (Data Visualizations 21st.dev) */}
      {!loading && stats ? (
        <AuthorKpiCharts stats={stats} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="bg-background border border-border p-5 rounded-2xl animate-pulse space-y-3 h-40" />
          ))}
        </div>
      )}

      {/* 2. EN-TÊTE DU DASHBOARD AUTEUR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gold">
            <PenTool className="w-4 h-4" />
            <span>Espace Auteur Écrivain • LAHA Éditions</span>
          </div>
          <h1 className="font-serif text-2xl lg:text-3xl font-bold text-navy">
            Tableau de Bord de l&apos;Auteur
          </h1>
          <p className="text-xs sm:text-sm text-foreground-muted max-w-2xl">
            Suivez les ventes de vos ouvrages publiés, vos droits et redevances acquis, et déposez vos nouveaux manuscrits pour étude.
          </p>
        </div>

        <Link
          href="/author/submissions/new"
          className="px-4 py-2.5 rounded-xl bg-navy text-white text-xs font-semibold hover:bg-navy-hover transition-colors inline-flex items-center gap-2 self-start md:self-auto shrink-0 min-h-[44px]"
        >
          <Plus className="w-4 h-4 text-gold" />
          Déposer un nouveau manuscrit
        </Link>
      </div>

      {/* 3. SECTION APERÇU DES DÉPÔTS EN COURS DE VALIDATION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif font-bold text-navy text-xl flex items-center gap-2">
            <PenTool className="w-5 h-5 text-gold" />
            Dépôts de Manuscrits en Cours ({submissions.length})
          </h2>
          <Link href="/author/submissions" className="text-xs text-navy font-bold hover:underline flex items-center gap-1">
            Voir tous mes dépôts
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
            <div className="bg-background-secondary h-36 rounded-2xl border border-border" />
            <div className="bg-background-secondary h-36 rounded-2xl border border-border" />
          </div>
        ) : submissions.length === 0 ? (
          <EmptyState>
            <EmptyIcon icon={PenTool} />
            <EmptyTitle>Aucun dépôt de manuscrit</EmptyTitle>
            <EmptyDescription>Déposez votre première œuvre ou projet de livre pour étude par le comité d&apos;édition.</EmptyDescription>
          </EmptyState>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {submissions.map((sub) => (
              <div key={sub.id} className="bg-background border border-border p-5 rounded-2xl space-y-3 shadow-xs flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <StatusBadge status={sub.status} />
                    <span className="text-[10px] text-foreground-muted font-medium">
                      {sub.version_type}
                    </span>
                  </div>
                  <h3 className="font-serif font-bold text-navy text-base leading-snug line-clamp-2">
                    {sub.title}
                  </h3>
                  {sub.summary && (
                    <p className="text-xs text-foreground-muted line-clamp-2">
                      {sub.summary}
                    </p>
                  )}
                </div>

                {sub.status === "changes_requested" && sub.feedback_history && sub.feedback_history.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-warning/10 border border-warning/30 text-warning text-xs space-y-1">
                    <div className="flex items-center gap-1 font-bold">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>Correction demandée</span>
                    </div>
                    <p className="text-[11px] line-clamp-2 italic">
                      &ldquo;{sub.feedback_history[0].message}&rdquo;
                    </p>
                  </div>
                )}

                <div className="pt-3 border-t border-border flex items-center justify-between text-[11px] text-foreground-muted">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-gold shrink-0" />
                    Déposé le {new Date(sub.submitted_at).toLocaleDateString("fr-FR")}
                  </span>
                  <Link href={`/author/submissions/${sub.id}`} className="text-navy font-bold hover:underline">
                    Détails →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. SECTION VUE SYNTHÉTIQUE DES LIVRES PUBLIÉS & VENTES */}
      <div className="pt-6 border-t border-border space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif font-bold text-navy text-xl flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-gold" />
            Mes Ouvrages Publiés & Statistiques de Ventes ({books.length})
          </h2>
          <Link href="/author/books" className="text-xs text-navy font-bold hover:underline flex items-center gap-1">
            Consulter tous mes livres
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
            <div className="bg-background-secondary h-48 rounded-2xl border border-border" />
          </div>
        ) : books.length === 0 ? (
          <EmptyState>
            <EmptyIcon icon={BookOpen} />
            <EmptyTitle>Aucun livre actuellement publié</EmptyTitle>
            <EmptyDescription>Dès que vos manuscrits seront validés et publiés par LAHA Éditions, leurs statistiques de vente apparaîtront ici.</EmptyDescription>
          </EmptyState>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {books.map((b) => {
              const bookAccess: StudentBookAccess = {
                id: b.id,
                title: b.title,
                author: b.author,
                discipline: b.discipline,
                institution: b.institution,
                format: b.format,
                cover_bg: b.cover_bg,
                cover_color: b.cover_color,
                progress_percent: 100,
                isbn: b.isbn,
                edition_year: b.edition_year,
                page_count: 380,
                is_favorite: false
              };

              return (
                <div key={b.id} className="bg-background border border-border p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center gap-5 shadow-xs">
                  <BookCover book={bookAccess} size="md" />

                  <div className="space-y-3 min-w-0 flex-1 w-full">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gold bg-navy/5 px-2 py-0.5 rounded border border-gold/30">
                        {b.discipline}
                      </span>
                      <h3 className="font-serif font-bold text-navy text-lg leading-snug line-clamp-2">
                        {b.title}
                      </h3>
                      <p className="text-xs text-foreground-muted font-medium">Édition {b.edition_year} • ISBN : {b.isbn}</p>
                    </div>

                    {/* Statistiques clés de l'ouvrage en lecture seule */}
                    <div className="grid grid-cols-3 gap-2 bg-background-secondary p-3 rounded-xl border border-border text-center">
                      <div>
                        <span className="text-[10px] text-foreground-muted block uppercase font-semibold">Ventes</span>
                        <strong className="font-serif text-navy text-sm font-bold">{b.sales_count} ex.</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-foreground-muted block uppercase font-semibold">Lectures</span>
                        <strong className="font-serif text-navy text-sm font-bold">{b.downloads_count}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-foreground-muted block uppercase font-semibold">Droits</span>
                        <strong className="font-serif text-gold text-sm font-bold">{(b.total_revenue * 0.1).toLocaleString("fr-FR")} F</strong>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-foreground-muted">Publié le {b.publication_date}</span>
                      <Link href={`/author/books/${b.id}`} className="text-xs text-navy font-bold hover:underline inline-flex items-center gap-1">
                        Fiche détaillée
                        <ArrowUpRight className="w-3.5 h-3.5 text-gold" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
