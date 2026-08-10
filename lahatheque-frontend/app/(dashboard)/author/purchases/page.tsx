"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getAuthorPurchases, getAuthorStats } from "@/lib/services/author";
import { AuthorPurchase, AuthorStats } from "@/lib/types/author";
import { 
  ShoppingBag, 
  ArrowLeft, 
  BookOpen, 
  Clock, 
  ArrowUpRight,
  Receipt
} from "lucide-react";
import { AuthorKpiCharts } from "@/components/features/author/author-kpi-charts";
import { BookCover } from "@/components/features/student/book-cover";
import { EmptyState, EmptyIcon, EmptyTitle, EmptyDescription } from "@/components/ui/empty-state";
import { StudentBookAccess } from "@/lib/types/student";

export default function AuthorPurchasesPage() {
  const [purchases, setPurchases] = useState<AuthorPurchase[]>([]);
  const [stats, setStats] = useState<AuthorStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPurchases() {
      try {
        setLoading(true);
        const [purchasesData, statsData] = await Promise.all([
          getAuthorPurchases(),
          getAuthorStats()
        ]);
        setPurchases(purchasesData);
        setStats(statsData);
      } catch (err) {
        console.error("Erreur de chargement des achats auteur", err);
      } finally {
        setLoading(false);
      }
    }
    loadPurchases();
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto w-full min-w-0">
      {/* 1. VISUALISATIONS DE DONNÉES ET KPIS 21st.dev EN PREMIER */}
      {!loading && stats ? (
        <AuthorKpiCharts stats={stats} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="bg-background border border-border p-5 rounded-2xl animate-pulse space-y-3 h-40" />
          ))}
        </div>
      )}

      {/* 2. EN-TÊTE DE PAGE */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-1">
          <Link href="/author" className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Retour au tableau de bord
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gold">
            <ShoppingBag className="w-4 h-4" />
            <span>Bibliothèque Personnelle Client</span>
          </div>
          <h1 className="font-serif text-2xl lg:text-3xl font-bold text-navy">
            Mes Achats & Commandes de Livres
          </h1>
          <p className="text-xs sm:text-sm text-foreground-muted max-w-2xl">
            Accédez à votre bibliothèque personnelle d&apos;ouvrages achetés sur la plateforme en tant que client et consultez votre historique de commandes.
          </p>
        </div>

        <Link
          href="/catalog"
          className="px-4 py-2.5 rounded-xl bg-navy text-white text-xs font-semibold hover:bg-navy-hover transition-colors inline-flex items-center gap-2 self-start md:self-auto shrink-0 min-h-[44px]"
        >
          <BookOpen className="w-4 h-4 text-gold" />
          Explorer le Catalogue
        </Link>
      </div>

      {/* 3. LISTE DES LIVRES ACHETÉS */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
          <div className="bg-background-secondary h-44 rounded-2xl border border-border" />
          <div className="bg-background-secondary h-44 rounded-2xl border border-border" />
        </div>
      ) : purchases.length === 0 ? (
        <EmptyState>
          <EmptyIcon icon={ShoppingBag} />
          <EmptyTitle>Aucun achat effectué</EmptyTitle>
          <EmptyDescription>Vous n&apos;avez encore acheté aucun livre sur le catalogue LAHAThèque.</EmptyDescription>
        </EmptyState>
      ) : (
        <div className="space-y-6">
          <h2 className="font-serif font-bold text-navy text-xl flex items-center gap-2">
            <Receipt className="w-5 h-5 text-gold" />
            Commandes Effectuées ({purchases.length})
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {purchases.map((p) => {
              const dummyBook: StudentBookAccess = {
                id: p.id,
                title: p.book_title,
                author: p.author,
                discipline: "Sciences Universitaires",
                institution: "UAC",
                format: p.format === "Papier" ? "PDF" : p.format,
                cover_bg: p.cover_bg,
                cover_color: p.cover_color,
                progress_percent: 100,
                isbn: "978-2-84299-PUR",
                edition_year: 2024,
                page_count: 310,
                is_favorite: false
              };

              return (
                <div key={p.id} className="bg-background border border-border p-5 rounded-3xl flex items-start gap-4 shadow-xs">
                  <BookCover book={dummyBook} size="md" />

                  <div className="space-y-2.5 min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-gold uppercase tracking-wider bg-navy/5 px-2 py-0.5 rounded border border-gold/20">
                        {p.order_number}
                      </span>
                      <span className="text-xs font-bold text-navy">
                        {p.price.toLocaleString("fr-FR")} {p.currency}
                      </span>
                    </div>

                    <h3 className="font-serif font-bold text-navy text-base leading-snug line-clamp-2">
                      {p.book_title}
                    </h3>
                    <p className="text-xs text-foreground-muted font-medium">Par {p.author}</p>

                    <div className="pt-2 border-t border-border flex items-center justify-between text-[11px] text-foreground-muted">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-gold" />
                        Acheté le {p.purchase_date}
                      </span>

                      <Link
                        href={`/catalog/reader/${p.id}`}
                        className="text-navy font-bold hover:underline inline-flex items-center gap-1"
                      >
                        Lire en ligne
                        <ArrowUpRight className="w-3.5 h-3.5 text-gold" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
