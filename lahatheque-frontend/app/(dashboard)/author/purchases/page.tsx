"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingBag, ArrowLeft, Download, Play, BookOpen } from "lucide-react";
import { BookCover3D } from "@/components/ui/book-cover-3d";
import { getClientLibraryBooks, getClientOrders } from "@/lib/services/student";
import type { ClientBookAccess, ClientOrder } from "@/lib/types/student";

export default function AuthorPurchasesPage() {
  const [books, setBooks] = useState<ClientBookAccess[]>([]);
  const [orders, setOrders] = useState<ClientOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [bData, oData] = await Promise.all([
        getClientLibraryBooks("all"),
        getClientOrders(),
      ]);
      setBooks(bData);
      setOrders(oData);
      setLoading(false);
    }
    loadData();
  }, []);

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-8 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/author" className="hover:text-navy">Vue d&apos;ensemble</Link>
        <span>/</span>
        <span className="text-navy font-semibold">Mes Achats (Lecteur)</span>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/author" className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Vue d&apos;ensemble
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
            <ShoppingBag className="w-4 h-4 text-gold" />
            Espace Consommateur / Client (Section 4.1 Cahier v3.2)
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Mes Achats &amp; Bibliothèque Personnelle
          </h1>
          <p className="text-xs text-foreground-muted mt-1">
            Retrouvez les ouvrages d&apos;autres auteurs achetés sur la plateforme pour votre propre lecture.
          </p>
        </div>
      </div>

      {/* Livres Achetés */}
      <div className="space-y-4">
        <h3 className="font-serif font-bold text-navy text-base flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-gold" />
          Livres dans Ma Bibliothèque Client ({books.length})
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {books.map((book) => (
            <div
              key={book.id}
              className="p-4 rounded-3xl bg-background border border-border space-y-3 flex flex-col justify-between shadow-xs"
            >
              <div className="space-y-3">
                <div className="w-full flex justify-center py-2 bg-navy/5 rounded-2xl border border-border relative">
                  <BookCover3D
                    title={book.title}
                    authors={book.author}
                    discipline={book.discipline}
                    coverUrl={book.cover_url}
                    size="md"
                  />
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded bg-gold/20 text-gold text-[10px] font-mono font-bold">
                    Acheté
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-foreground-muted uppercase tracking-wider block">{book.discipline}</span>
                  <h3 className="font-serif font-bold text-navy text-sm line-clamp-2 mt-0.5">{book.title}</h3>
                  <p className="text-xs text-foreground-muted truncate">Par {book.author}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-border">
                <Link
                  href={`/catalog/reader/${book.id}`}
                  className="w-full py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors flex items-center justify-center gap-2 min-h-[40px] shadow-xs"
                >
                  <Play className="w-3.5 h-3.5 text-gold fill-gold" />
                  Lire le livre
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
