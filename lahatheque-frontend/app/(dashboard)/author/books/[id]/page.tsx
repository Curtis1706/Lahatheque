"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getAuthorBooks } from "@/lib/services/author";
import { AuthorBook } from "@/lib/types/author";
import { 
  ArrowLeft, 
  BookOpen, 
  Globe2, 
  PieChart, 
  TrendingUp, 
  Lock, 
  Download, 
  DollarSign, 
  Building2, 
  CheckCircle2 
} from "lucide-react";
import { BookCover } from "@/components/features/student/book-cover";
import { StudentBookAccess } from "@/lib/types/student";

export default function AuthorBookDetailPage() {
  const params = useParams();
  const [book, setBook] = useState<AuthorBook | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBook() {
      try {
        setLoading(true);
        const books = await getAuthorBooks();
        const found = books.find((b) => b.id === params.id) || books[0];
        setBook(found);
      } catch (err) {
        console.error("Erreur de chargement du détail du livre", err);
      } finally {
        setLoading(false);
      }
    }
    loadBook();
  }, [params.id]);

  if (loading || !book) {
    return (
      <div className="p-8 max-w-5xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-background-secondary rounded-lg" />
        <div className="h-64 bg-background-secondary rounded-2xl border border-border" />
      </div>
    );
  }

  const dummyBookAccess: StudentBookAccess = {
    id: book.id,
    title: book.title,
    author: book.author,
    discipline: book.discipline,
    institution: book.institution,
    format: book.format,
    cover_bg: book.cover_bg,
    cover_color: book.cover_color,
    progress_percent: 100,
    isbn: book.isbn,
    edition_year: book.edition_year,
    page_count: 380,
    is_favorite: false
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-6xl mx-auto w-full min-w-0">
      {/* Header */}
      <div className="space-y-1 border-b border-border pb-4">
        <Link href="/author/books" className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-2">
          <ArrowLeft className="w-3.5 h-3.5" />
          Retour à la liste de mes livres
        </Link>
        <h1 className="font-serif text-2xl lg:text-3xl font-bold text-navy">
          Détail & Statistiques de l&apos;Ouvrage
        </h1>
      </div>

      {/* Fiche Principale du Livre (Couverture 3D + Métadonnées en Lecture Seule) */}
      <div className="bg-background border border-border p-6 rounded-3xl shadow-xs flex flex-col md:flex-row gap-6 items-start">
        <BookCover book={dummyBookAccess} size="lg" />

        <div className="space-y-4 flex-1">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-gold bg-navy/5 px-2.5 py-0.5 rounded border border-gold/30">
              {book.discipline}
            </span>
            <h2 className="font-serif font-bold text-navy text-2xl leading-tight pt-1">
              {book.title}
            </h2>
            <p className="text-sm text-foreground-muted font-medium">Par {book.author}</p>
          </div>

          {/* Grille de métadonnées en lecture seule (Section 3.2.1) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-background-secondary p-4 rounded-2xl border border-border text-xs">
            <div>
              <span className="text-[10px] text-foreground-muted block uppercase font-semibold">ISBN</span>
              <strong className="text-navy font-mono">{book.isbn}</strong>
            </div>
            <div>
              <span className="text-[10px] text-foreground-muted block uppercase font-semibold">Édition</span>
              <strong className="text-navy">{book.edition_year}</strong>
            </div>
            <div>
              <span className="text-[10px] text-foreground-muted block uppercase font-semibold">Établissement</span>
              <strong className="text-navy">{book.institution}</strong>
            </div>
            <div>
              <span className="text-[10px] text-foreground-muted block uppercase font-semibold">Statut</span>
              <span className="text-success font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Publié
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-2">
            <div className="bg-navy-dark text-white p-4 rounded-2xl border border-navy-hover">
              <span className="text-[11px] text-white/70 block uppercase font-bold">Ventes Cumulées</span>
              <p className="font-serif text-2xl font-bold text-gold">{book.sales_count} ex.</p>
            </div>

            <div className="bg-background-secondary p-4 rounded-2xl border border-border">
              <span className="text-[11px] text-foreground-muted block uppercase font-bold">Lectures / Période</span>
              <p className="font-serif text-2xl font-bold text-navy">{book.downloads_count}</p>
            </div>

            <div className="bg-background-secondary p-4 rounded-2xl border border-border">
              <span className="text-[11px] text-foreground-muted block uppercase font-bold">Droits Générés</span>
              <p className="font-serif text-2xl font-bold text-navy">{(book.total_revenue * 0.1).toLocaleString("fr-FR")} F</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sections d'Analyses : Format & Répartition Géographique (Section 3.2.1) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Répartition par Format */}
        <div className="bg-background border border-border p-6 rounded-3xl space-y-4 shadow-xs">
          <h3 className="font-serif font-bold text-navy text-lg flex items-center gap-2">
            <PieChart className="w-5 h-5 text-gold" />
            Répartition des Ventes par Format
          </h3>

          <div className="space-y-3 pt-2">
            {book.sales_by_format.map((fmt, idx) => (
              <div key={idx} className="space-y-1 text-xs">
                <div className="flex justify-between font-semibold">
                  <span className="text-navy">{fmt.format}</span>
                  <span className="text-foreground-muted">{fmt.percentage}%</span>
                </div>
                <div className="w-full bg-background-secondary h-2.5 rounded-full overflow-hidden border border-border">
                  <div
                    className={idx === 0 ? "bg-navy h-full rounded-full" : "bg-gold h-full rounded-full"}
                    style={{ width: `${fmt.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Répartition Géographique par Pays */}
        <div className="bg-background border border-border p-6 rounded-3xl space-y-4 shadow-xs">
          <h3 className="font-serif font-bold text-navy text-lg flex items-center gap-2">
            <Globe2 className="w-5 h-5 text-gold" />
            Répartition Géographique (Multi-Pays)
          </h3>

          <div className="space-y-3 pt-2 text-xs">
            {book.sales_by_country.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-background-secondary border border-border">
                <div className="flex items-center gap-2 font-semibold text-navy">
                  <Globe2 className="w-4 h-4 text-gold" />
                  <span>{item.country}</span>
                </div>
                <strong className="font-serif text-navy font-bold">{item.sales} ventes</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
