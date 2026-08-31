"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Search, 
  X, 
  BookOpen, 
  GraduationCap, 
  ArrowRight, 
  Loader2, 
  User
} from "lucide-react";
import { searchBooks } from "@/lib/services/catalog";
import { Book } from "@/lib/types/catalog";

interface HeaderSearchBarProps {
  className?: string;
  placeholder?: string;
  onSelectResult?: () => void;
}

export function HeaderSearchBar({ 
  className = "", 
  placeholder = "Rechercher un ouvrage, auteur, discipline...",
  onSelectResult
}: HeaderSearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce input (250ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 250);
    return () => clearTimeout(handler);
  }, [query]);

  // Execute search when debouncedQuery changes
  useEffect(() => {
    if (!debouncedQuery) {
      setResults([]);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    searchBooks({ q: debouncedQuery })
      .then((data) => {
        if (isMounted) {
          setResults(data);
          setLoading(false);
          setSelectedIndex(-1);
        }
      })
      .catch((err) => {
        console.error("Search error:", err);
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [debouncedQuery]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleClear = () => {
    setQuery("");
    setDebouncedQuery("");
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setIsOpen(false);
    if (onSelectResult) onSelectResult();
    router.push(`/catalog?q=${encodeURIComponent(query.trim())}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > -1 ? prev - 1 : -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && results[selectedIndex]) {
        const selected = results[selectedIndex];
        setIsOpen(false);
        if (onSelectResult) onSelectResult();
        router.push(`/catalog/${selected.id}`);
      } else {
        handleSubmit();
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const quickSuggestions = [
    "Droit OHADA",
    "Comptabilité SYSCOHADA",
    "Santé publique",
    "Mathématiques",
    "Économie"
  ];

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Input Form */}
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => {
            if (query.trim()) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full h-10 pl-4 pr-16 rounded-full border border-border bg-background-secondary text-foreground text-xs sm:text-sm focus:outline-none focus:border-navy focus:ring-2 focus:ring-gold/30 transition-all shadow-xs"
        />

        <div className="absolute right-1 flex items-center gap-1">
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="w-7 h-7 rounded-full text-foreground-muted hover:text-foreground hover:bg-background flex items-center justify-center transition-colors"
              aria-label="Effacer la recherche"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="submit"
            className="w-8 h-8 rounded-full bg-navy hover:bg-navy-hover text-white flex items-center justify-center transition-colors shadow-xs"
            aria-label="Lancer la recherche"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-gold" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </button>
        </div>
      </form>

      {/* Instant Dropdown Preview Panel */}
      {isOpen && query.trim().length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-2xl shadow-2xl z-50 overflow-hidden max-h-[80vh] sm:max-h-[520px] flex flex-col animate-in fade-in duration-150">
          
          {/* Header du Popover avec état de recherche */}
          <div className="px-4 py-2.5 bg-background-secondary border-b border-border flex items-center justify-between text-xs text-foreground-muted">
            <span className="flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-gold" />
              {loading ? "Recherche en cours..." : (
                <>
                  <strong>{results.length}</strong> résultat{results.length > 1 ? "s" : ""} trouvé{results.length > 1 ? "s" : ""}
                </>
              )}
            </span>
            <span className="text-[10px] hidden sm:inline-block">
              Appuyez sur <kbd className="px-1.5 py-0.5 rounded bg-background border border-border font-mono text-[9px]">Entrée</kbd> pour valider
            </span>
          </div>

          {/* Liste des résultats / Suggestions */}
          <div className="overflow-y-auto divide-y divide-border p-2 space-y-1">
            {loading ? (
              <div className="p-6 text-center space-y-2">
                <Loader2 className="w-6 h-6 animate-spin text-gold mx-auto" />
                <p className="text-xs text-foreground-muted">Recherche dans le catalogue LAHAThèque...</p>
              </div>
            ) : results.length > 0 ? (
              <>
                {results.slice(0, 5).map((book, idx) => {
                  const author = book.authors_details?.[0]
                    ? `${book.authors_details[0].first_name} ${book.authors_details[0].last_name}`
                    : "Auteur certifié";
                  const isSelected = selectedIndex === idx;

                  return (
                    <Link
                      key={book.id}
                      href={`/catalog/${book.id}`}
                      onClick={() => {
                        setIsOpen(false);
                        if (onSelectResult) onSelectResult();
                      }}
                      className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${
                        isSelected 
                          ? "bg-gold/15 border border-gold/30" 
                          : "hover:bg-background-secondary border border-transparent"
                      }`}
                    >
                      {/* Vignette couverture */}
                      <div 
                        className="w-9 h-12 rounded-md shrink-0 flex items-center justify-center text-center p-1 text-[8px] font-serif font-bold shadow-xs border border-border"
                        style={{
                          backgroundColor: book.cover_color || "var(--navy)",
                          color: book.cover_text_color || "var(--gold)"
                        }}
                      >
                        <BookOpen className="w-4 h-4 opacity-80" />
                      </div>

                      {/* Infos Ouvrage */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-serif font-bold text-navy text-xs sm:text-sm truncate">
                          {book.title}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-foreground-muted mt-0.5">
                          <span className="flex items-center gap-1 truncate">
                            <User className="w-3 h-3 text-gold shrink-0" />
                            {author}
                          </span>
                          {book.discipline_detail?.name && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1 truncate text-gold font-medium">
                                <GraduationCap className="w-3 h-3 shrink-0" />
                                {book.discipline_detail.name}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Prix / Badge */}
                      <div className="shrink-0 text-right">
                        {book.price ? (
                          <span className="text-xs font-bold text-navy">
                            {book.price.toLocaleString("fr-FR")} {book.currency || "FCFA"}
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold/10 text-gold font-bold border border-gold/20">
                            Inclus abonnement
                          </span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </>
            ) : (
              <div className="p-6 text-center space-y-4">
                <div className="w-10 h-10 rounded-full bg-gold/10 text-gold flex items-center justify-center mx-auto">
                  <Search className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <p className="font-serif font-bold text-navy text-sm">
                    Aucun résultat pour « {query} »
                  </p>
                  <p className="text-xs text-foreground-muted">
                    Essayez d'autres mots-clés, un nom d'auteur ou parcourez nos disciplines populaires.
                  </p>
                </div>

                {/* Suggestions populaires */}
                <div className="pt-2">
                  <span className="text-[10px] font-bold uppercase text-gold block mb-2">Suggestions populaires</span>
                  <div className="flex flex-wrap gap-1.5 justify-center">
                    {quickSuggestions.map((sug, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setQuery(sug);
                          inputRef.current?.focus();
                        }}
                        className="px-2.5 py-1 rounded-lg bg-background-secondary hover:bg-navy hover:text-white text-navy text-[11px] font-medium transition-colors border border-border"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Footer: Voir tous les résultats */}
          {query.trim() && (
            <div className="p-2.5 bg-background-secondary border-t border-border">
              <button
                type="button"
                onClick={() => handleSubmit()}
                className="w-full py-2 px-4 rounded-xl bg-navy hover:bg-navy-hover text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-xs group"
              >
                <span>Voir tous les résultats pour « {query} »</span>
                <ArrowRight className="w-4 h-4 text-gold group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
export default HeaderSearchBar;
