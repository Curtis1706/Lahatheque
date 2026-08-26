"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, Eye, ShoppingBag, User } from "lucide-react";
import { getStudentCatalog, type BookAPI } from "@/lib/services/student";
import { BookSampleModal } from "@/components/features/student/book-sample-modal";
import { AuthorCatalogOrderModal } from "@/components/features/author/author-catalog-order-modal";
import { PageLoader } from "@/components/ui/page-loader";

export default function AuthorBookDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [book, setBook] = useState<BookAPI | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSample, setShowSample] = useState(false);
  const [showOrder, setShowOrder] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const catalog = await getStudentCatalog();
        const found = catalog.books.find((b) => b.id === id) || null;
        setBook(found);
      } catch {
        setBook(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const authorName = book?.authors?.map((a) => a.full_name).join(", ") || "Auteur académique";

  if (loading) {
    return <PageLoader label="Chargement de l'ouvrage" />;
  }

  if (!book) {
    return (
      <div className="p-8 text-center space-y-3">
        <p className="text-sm text-foreground-muted">Ouvrage introuvable.</p>
        <Link href="/author/catalog" className="text-xs font-bold text-gold hover:underline">
          Retour au catalogue
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full max-w-6xl mx-auto space-y-8 pb-16 animate-in fade-in duration-300">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <Link href="/author/catalog" className="flex items-center gap-2 text-xs font-semibold text-foreground-muted hover:text-navy transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Retour au catalogue
        </Link>
        <span className="font-serif text-sm font-bold text-navy tracking-wide">LAHAThèque</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-10">
        <div className="space-y-3">
          <button
            onClick={() => setShowSample(true)}
            className="block w-full aspect-[3/4] rounded-2xl overflow-hidden border border-border shadow-lg group relative"
          >
            {book.cover_url ? (
              <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            ) : (
              <div className="w-full h-full bg-navy/10 flex items-center justify-center">
                <BookOpen className="w-12 h-12 text-navy/30" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
              <span className="opacity-0 group-hover:opacity-100 text-white text-[11px] font-bold uppercase tracking-wider transition-opacity">
                Cliquer pour l&apos;aperçu
              </span>
            </div>
          </button>
          <p className="text-center text-[10px] uppercase tracking-wider text-foreground-muted">
            Cliquer pour l&apos;aperçu
          </p>
        </div>

        <div className="space-y-6">
          <div>
            <p className="text-[11px] font-bold text-gold uppercase tracking-wider">
              {book.discipline_name || "Académique"}
            </p>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy leading-tight mt-1">
              {book.title}
            </h1>
            <p className="text-sm text-foreground-muted mt-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> par {authorName}
            </p>
          </div>

          {book.summary && (
            <p className="text-sm text-foreground leading-relaxed">{book.summary}</p>
          )}

          <div className="grid grid-cols-2 gap-x-8 gap-y-3 py-5 border-y border-border text-xs">
            <div>
              <p className="text-foreground-muted uppercase text-[10px] font-bold tracking-wider">Éditeur</p>
              <p className="text-navy font-semibold mt-0.5">{book.publisher_name || "LAHA Éditions"}</p>
            </div>
            <div>
              <p className="text-foreground-muted uppercase text-[10px] font-bold tracking-wider">Format</p>
              <p className="text-navy font-semibold mt-0.5">{book.format_type?.toUpperCase()} — {book.page_count || "—"} pages</p>
            </div>
            <div>
              <p className="text-foreground-muted uppercase text-[10px] font-bold tracking-wider">Date de publication</p>
              <p className="text-navy font-semibold mt-0.5">{book.publication_date || "—"}</p>
            </div>
            <div>
              <p className="text-foreground-muted uppercase text-[10px] font-bold tracking-wider">Langue</p>
              <p className="text-navy font-semibold mt-0.5">{book.language || "Français"}</p>
            </div>
            <div>
              <p className="text-foreground-muted uppercase text-[10px] font-bold tracking-wider">ISBN</p>
              <p className="text-navy font-mono font-semibold mt-0.5">{book.isbn || "—"}</p>
            </div>
            <div>
              <p className="text-foreground-muted uppercase text-[10px] font-bold tracking-wider">Université</p>
              <p className="text-navy font-semibold mt-0.5">{book.institution_name || "Toutes universités"}</p>
            </div>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div>
                <p className="text-[10px] uppercase font-bold text-foreground-muted">Numérique</p>
                <p className="font-mono font-bold text-navy text-lg">
                  {(book.price_digital ?? 0).toLocaleString("fr-FR")} FCFA
                </p>
              </div>
              {book.is_paper_available && (
                <div>
                  <p className="text-[10px] uppercase font-bold text-foreground-muted">Papier</p>
                  <p className="font-mono font-bold text-gold text-lg">
                    {(book.price_paper ?? 0).toLocaleString("fr-FR")} FCFA
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSample(true)}
                className="px-4 py-2.5 rounded-xl border border-border bg-background-secondary text-navy text-xs font-semibold hover:border-gold/40 transition-colors flex items-center gap-1.5"
              >
                <Eye className="w-4 h-4 text-gold" /> Extrait gratuit
              </button>
              <button
                onClick={() => setShowOrder(true)}
                className="px-5 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-dark transition-colors flex items-center gap-1.5"
              >
                <ShoppingBag className="w-4 h-4 text-gold" /> Commander
              </button>
            </div>
          </div>
        </div>
      </div>

      {showSample && (
        <BookSampleModal
          book={
            book
              ? {
                  ...book,
                  author: authorName,
                }
              : null
          }
          isOpen={showSample}
          onClose={() => setShowSample(false)}
        />
      )}
      {showOrder && (
        <AuthorCatalogOrderModal
          book={book}
          onClose={() => setShowOrder(false)}
          onOpenSample={() => {
            setShowOrder(false);
            setShowSample(true);
          }}
          onOrderSuccess={() => {
            // Rafraîchissement éventuel
          }}
        />
      )}
    </div>
  );
}
