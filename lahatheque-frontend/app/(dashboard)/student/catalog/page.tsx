"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Search, Filter, BookOpen, Eye, ArrowLeft, Sparkles } from "lucide-react";
import { BookSampleModal } from "@/components/features/student/book-sample-modal";
import { getClientLibraryBooks } from "@/lib/services/student";
import type { ClientBookAccess } from "@/lib/types/student";

export default function StudentCatalogPage() {
  const [books, setBooks] = useState<ClientBookAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFormat, setSelectedFormat] = useState("all");
  const [sampleBook, setSampleBook] = useState<ClientBookAccess | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await getClientLibraryBooks();
      setBooks(data);
      setLoading(false);
    }
    loadData();
  }, []);

  const filteredBooks = useMemo(() => {
    return books.filter((b) => {
      if (selectedFormat !== "all" && b.format !== selectedFormat) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = b.title.toLowerCase().includes(q);
        const matchAuthor = b.author.toLowerCase().includes(q);
        const matchDisc = b.discipline.toLowerCase().includes(q);
        if (!matchTitle && !matchAuthor && !matchDisc) return false;
      }
      return true;
    });
  }, [books, searchQuery, selectedFormat]);

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/student" className="hover:text-navy">Mon Espace</Link>
        <span>/</span>
        <span className="text-navy font-semibold">Catalogue &amp; Découverte</span>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/student" className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Mon Espace
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
            <Search className="w-4 h-4 text-gold" />
            Découverte du Fonds Documentaire LAHAThèque
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Catalogue Général &amp; Extraits Gratuits
          </h1>
          <p className="text-xs text-foreground-muted mt-1">
            Explorez les ouvrages disponibles, lisez des extraits gratuits en 1 clic sans friction et choisissez votre mode d&apos;accès.
          </p>
        </div>
      </div>

      {/* Moteur de Recherche & Filtres */}
      <div className="p-4 rounded-2xl bg-background border border-border flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="relative w-full sm:w-96">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par titre, auteur, discipline..."
            className="w-full pl-9 pr-3.5 py-2 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-semibold min-h-[40px]"
          />
          <Search className="w-4 h-4 text-foreground-muted absolute left-3 top-3" />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {[
            { id: "all", label: "Tous les formats" },
            { id: "EPUB", label: "Livres EPUB" },
            { id: "PDF", label: "Documents PDF" },
            { id: "Audio", label: "Livres Audio" },
          ].map((fmt) => (
            <button
              key={fmt.id}
              type="button"
              onClick={() => setSelectedFormat(fmt.id)}
              className={`px-3.5 py-2 rounded-xl text-[11px] font-bold whitespace-nowrap transition-colors border ${
                selectedFormat === fmt.id
                  ? "bg-navy text-white border-navy"
                  : "bg-background-secondary text-foreground-muted border-border hover:text-navy"
              }`}
            >
              {fmt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grille de Cartes d'Ouvrages du Catalogue */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {filteredBooks.map((book) => (
          <div
            key={book.id}
            className="p-4 rounded-3xl bg-background border border-border hover:border-gold transition-all space-y-3 flex flex-col justify-between shadow-xs group"
          >
            <div className="space-y-3">
              <div className="w-full h-48 rounded-2xl bg-navy overflow-hidden border border-border relative">
                {book.cover_url ? (
                  <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white font-serif font-bold text-xl">
                    {book.title.slice(0, 1)}
                  </div>
                )}
                <span className="absolute top-2 right-2 px-2.5 py-0.5 rounded-full bg-navy/80 text-gold text-[10px] font-mono font-bold">
                  {book.format}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-foreground-muted uppercase tracking-wider block">{book.discipline}</span>
                <h3 className="font-serif font-bold text-navy text-sm line-clamp-2 mt-0.5">{book.title}</h3>
                <p className="text-xs text-foreground-muted truncate">Par {book.author}</p>
              </div>
            </div>

            <div className="space-y-2 pt-3 border-t border-border">
              <div className="flex items-baseline justify-between text-xs">
                <span className="text-foreground-muted">Prix numérique :</span>
                <span className="font-mono font-bold text-navy">
                  {(book.price_digital || 0) > 0 ? `${(book.price_digital || 0).toLocaleString("fr-FR")} XOF` : "Accès Libre"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setSampleBook(book)}
                  className="px-2 py-2 rounded-xl bg-gold/15 text-navy text-[11px] font-bold hover:bg-gold transition-colors inline-flex items-center justify-center gap-1 min-h-[38px]"
                >
                  <Eye className="w-3.5 h-3.5 text-gold group-hover:text-navy" />
                  Extrait Gratuit
                </button>
                <Link
                  href={`/student/catalog/${book.id}`}
                  className="px-2 py-2 rounded-xl bg-navy text-white text-[11px] font-bold hover:bg-navy-hover transition-colors inline-flex items-center justify-center gap-1 min-h-[38px]"
                >
                  <BookOpen className="w-3.5 h-3.5 text-gold" />
                  Fiche
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modale d'extrait gratuit lisible sans friction */}
      <BookSampleModal
        book={sampleBook}
        isOpen={sampleBook !== null}
        onClose={() => setSampleBook(null)}
      />
    </div>
  );
}
