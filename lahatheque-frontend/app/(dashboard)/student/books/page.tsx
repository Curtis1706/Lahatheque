"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Headphones, Play, ArrowLeft, ShieldCheck, Search, Filter } from "lucide-react";
import { AudiobookPlayerCard } from "@/components/features/student/audiobook-player-card";
import { getClientLibraryBooks } from "@/lib/services/student";
import type { ClientBookAccess } from "@/lib/types/student";

export default function StudentBooksPage() {
  const [books, setBooks] = useState<ClientBookAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [accessFilter, setAccessFilter] = useState("all");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await getClientLibraryBooks(accessFilter);
      setBooks(data);
      setLoading(false);
    }
    loadData();
  }, [accessFilter]);

  const audioBook = books.find((b) => b.format === "Audio") || books[0];

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/student" className="hover:text-navy">Mon Espace</Link>
        <span>/</span>
        <span className="text-navy font-semibold">Ma Bibliothèque</span>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/student" className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Mon Espace
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
            <BookOpen className="w-4 h-4 text-gold" />
            Fonds Personnel de Lecture (Section 3.3)
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Ma Bibliothèque Personnelle
          </h1>
          <p className="text-xs text-foreground-muted mt-1">
            Tous les livres numériques et audios souscrits, achetés à l&apos;unité ou débloqués par votre établissement.
          </p>
        </div>
      </div>

      {/* Lecteur Audio Intégré 21st.dev Podcast Player / Audiobook Card */}
      {audioBook && (
        <div className="space-y-2">
          <h3 className="font-serif font-bold text-navy text-sm uppercase tracking-wider">
            Lecteur Audio Intégré &amp; Reprise d&apos;Écoute
          </h3>
          <AudiobookPlayerCard book={audioBook} />
        </div>
      )}

      {/* Filtres par Mode d'Accès */}
      <div className="p-4 rounded-2xl bg-background border border-border flex items-center justify-between gap-3 shadow-xs overflow-x-auto">
        <div className="flex items-center gap-2">
          {[
            { id: "all", label: "Tous mes livres" },
            { id: "purchased", label: "Achetés à l'unité" },
            { id: "subscription", label: "Abonnement individuel" },
            { id: "institution_bundle", label: "Bouquet institutionnel" },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setAccessFilter(f.id)}
              className={`px-3.5 py-2 rounded-xl text-[11px] font-bold whitespace-nowrap transition-colors border ${
                accessFilter === f.id
                  ? "bg-navy text-white border-navy"
                  : "bg-background-secondary text-foreground-muted border-border hover:text-navy"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grille de Livres en Bibliothèque */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {books.map((book) => (
          <div
            key={book.id}
            className="p-4 rounded-3xl bg-background border border-border space-y-3 flex flex-col justify-between shadow-xs"
          >
            <div className="space-y-3">
              <div className="w-full h-44 rounded-2xl bg-navy overflow-hidden border border-border relative">
                {book.cover_url ? (
                  <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white font-serif font-bold text-xl">
                    {book.title.slice(0, 1)}
                  </div>
                )}
                <span className="absolute top-2 right-2 px-2 py-0.5 rounded bg-gold/20 text-gold text-[10px] font-mono font-bold">
                  {book.access_type === "purchased"
                    ? "Acheté"
                    : book.access_type === "institution_bundle"
                    ? "Bouquet UAC"
                    : "Abonnement"}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold text-foreground-muted uppercase tracking-wider block">{book.discipline}</span>
                <h3 className="font-serif font-bold text-navy text-sm line-clamp-2 mt-0.5">{book.title}</h3>
                <p className="text-xs text-foreground-muted truncate">Par {book.author}</p>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-border">
              <div className="flex items-center justify-between text-[11px] font-mono text-foreground-muted">
                <span>Progression :</span>
                <span className="font-bold text-navy">{book.progress_percent}%</span>
              </div>

              <Link
                href={`/catalog/reader/${book.id}`}
                className="w-full py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors flex items-center justify-center gap-2 min-h-[40px] shadow-xs"
              >
                <Play className="w-3.5 h-3.5 text-gold fill-gold" />
                Lire / Ouvrir le livre
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
