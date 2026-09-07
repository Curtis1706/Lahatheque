"use client";

import React, { useState, useEffect } from "react";
import { Search, Book, Check, X, Building2, Sparkles, AlertCircle } from "lucide-react";
import { getEligibleBooksForAttachment } from "@/lib/services/audio";

interface EligibleBookItem {
  id: string;
  title: string;
  isbn?: string;
  author: string;
  category: string;
  country: string;
  cover_url?: string;
  price_xof: number;
  has_audio_version: boolean;
}

interface BookAttachmentSelectorProps {
  onSelectBook: (book: EligibleBookItem | null) => void;
  selectedBook: EligibleBookItem | null;
}

export function BookAttachmentSelector({ onSelectBook, selectedBook }: BookAttachmentSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [books, setBooks] = useState<EligibleBookItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchBooks = async () => {
      setLoading(true);
      try {
        const results = await getEligibleBooksForAttachment(searchQuery);
        if (active) {
          setBooks(results);
        }
      } catch (err) {
        console.error("Erreur recherche livres pour rattachement:", err);
      } finally {
        if (active) setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchBooks();
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-navy flex items-center gap-2">
          <Book className="w-4 h-4 text-gold" />
          Rattacher à un ouvrage existant du catalogue
        </label>
        {selectedBook && (
          <button
            type="button"
            onClick={() => onSelectBook(null)}
            className="text-xs text-foreground-muted hover:text-red-500 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            Détacher
          </button>
        )}
      </div>

      {selectedBook ? (
        <div className="p-4 rounded-2xl bg-gold/10 border-2 border-gold/40 flex items-start gap-4 shadow-xs">
          <div className="w-16 h-22 rounded-lg bg-background-secondary border border-border overflow-hidden shrink-0 shadow-sm flex items-center justify-center">
            {selectedBook.cover_url ? (
              <img
                src={selectedBook.cover_url}
                alt={selectedBook.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <Book className="w-6 h-6 text-navy" />
            )}
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-gold/20 text-navy text-[10px] font-bold uppercase tracking-wider">
              <Check className="w-3 h-3 text-navy" />
              Ouvrage rattaché
            </div>
            <h4 className="font-serif font-bold text-sm text-navy truncate">
              {selectedBook.title}
            </h4>
            <p className="text-xs text-foreground-muted truncate">
              Par {selectedBook.author} • {selectedBook.category} • {selectedBook.country}
            </p>
            <p className="text-[11px] text-foreground-muted font-mono">
              Couverture et métadonnées verrouillées depuis cet ouvrage
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground-muted" />
            <input
              type="text"
              placeholder="Rechercher par titre, auteur ou ISBN..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-navy placeholder:text-foreground-muted/60"
            />
          </div>

          {isOpen && (
            <div className="border border-border rounded-2xl bg-background max-h-60 overflow-y-auto divide-y divide-border/60 shadow-lg z-20">
              {loading ? (
                <div className="p-4 text-center text-xs text-foreground-muted flex items-center justify-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-gold animate-spin" />
                  Chargement des ouvrages...
                </div>
              ) : books.length === 0 ? (
                <div className="p-4 text-center text-xs text-foreground-muted">
                  Aucun ouvrage trouvé. Vous pouvez créer un livre audio autonome ci-dessous.
                </div>
              ) : (
                books.map((b) => (
                  <button
                    type="button"
                    key={b.id}
                    onClick={() => {
                      onSelectBook(b);
                      setIsOpen(false);
                    }}
                    className="w-full p-3 text-left hover:bg-background-secondary flex items-center gap-3 transition-colors cursor-pointer"
                  >
                    <div className="w-10 h-14 rounded bg-background-secondary border border-border overflow-hidden shrink-0 flex items-center justify-center">
                      {b.cover_url ? (
                        <img src={b.cover_url} alt={b.title} className="w-full h-full object-cover" />
                      ) : (
                        <Book className="w-4 h-4 text-gold" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-serif font-bold text-xs sm:text-sm text-navy truncate">
                        {b.title}
                      </div>
                      <div className="text-[11px] text-foreground-muted truncate">
                        {b.author} • {b.category}
                      </div>
                    </div>
                    {b.has_audio_version && (
                      <span className="text-[10px] font-bold text-gold uppercase px-2 py-0.5 rounded bg-gold/10 shrink-0">
                        Audio déjà existant
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
