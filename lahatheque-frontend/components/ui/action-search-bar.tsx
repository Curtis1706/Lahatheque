"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Search, 
  X, 
  GraduationCap, 
  Building2, 
  BookOpen, 
  ArrowRight, 
  Loader2,
  User
} from "lucide-react";
import { searchBooks } from "@/lib/services/catalog";
import { Book } from "@/lib/types/catalog";

export interface ActionItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  description?: string;
  category: "discipline" | "book" | "institution";
  value: string;
  book?: Book;
}

interface ActionSearchBarProps {
  initialValue?: string;
  onSearch: (query: string) => void;
  onSelectAction: (category: string, value: string) => void;
  placeholder?: string;
}

export function ActionSearchBar({ 
  initialValue = "",
  onSearch, 
  onSelectAction,
  placeholder = "Rechercher par titre, auteur, ISBN, discipline ou établissement..."
}: ActionSearchBarProps) {
  const [query, setQuery] = useState(initialValue);
  const [isFocused, setIsFocused] = useState(false);
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync initialValue when changed
  useEffect(() => {
    if (initialValue !== undefined && initialValue !== query) {
      setQuery(initialValue);
    }
  }, [initialValue]);

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const defaultActions: ActionItem[] = [
    {
      id: "disc-1",
      label: "Droit & Sciences Politiques",
      icon: <GraduationCap className="w-4 h-4 text-gold" />,
      description: "Discipline",
      category: "discipline",
      value: "Droit"
    },
    {
      id: "disc-2",
      label: "Sciences Économiques & Gestion",
      icon: <GraduationCap className="w-4 h-4 text-gold" />,
      description: "Discipline",
      category: "discipline",
      value: "Économie"
    },
    {
      id: "disc-3",
      label: "Médecine & Santé Publique",
      icon: <GraduationCap className="w-4 h-4 text-gold" />,
      description: "Discipline",
      category: "discipline",
      value: "Médecine"
    },
    {
      id: "inst-1",
      label: "Université d'Abomey-Calavi (UAC)",
      icon: <Building2 className="w-4 h-4 text-gold" />,
      description: "Établissement",
      category: "institution",
      value: "UAC"
    },
    {
      id: "inst-2",
      label: "Université de Parakou (UP)",
      icon: <Building2 className="w-4 h-4 text-gold" />,
      description: "Établissement",
      category: "institution",
      value: "UP"
    }
  ];

  // Debounced search for suggestions
  useEffect(() => {
    if (!query.trim()) {
      setActions(defaultActions);
      setLoading(false);
      return;
    }

    let isMounted = true;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const books = await searchBooks({ q: query.trim() });
        if (!isMounted) return;

        const filteredDefault = defaultActions.filter(action =>
          action.label.toLowerCase().includes(query.toLowerCase())
        );

        const bookActions: ActionItem[] = books.slice(0, 6).map((book) => {
          const authorNames = book.authors_details
            ? book.authors_details.map((a) => `${a.first_name || ""} ${a.last_name || ""}`.trim()).filter(Boolean).join(", ")
            : "Auteur";

          return {
            id: `book-${book.id}`,
            label: book.title,
            icon: <BookOpen className="w-4 h-4 text-gold" />,
            description: authorNames || book.discipline_detail?.name || "Consulter l'ouvrage",
            category: "book",
            value: book.id,
            book
          };
        });

        setActions([...filteredDefault, ...bookActions]);
      } catch (err) {
        console.error("Erreur suggestions:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }, 250);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [query]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    onSearch(val);
  };

  const handleClear = () => {
    setQuery("");
    onSearch("");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      setIsFocused(false);
      onSearch(query);
    } else if (e.key === "Escape") {
      setIsFocused(false);
    }
  };

  return (
    <div ref={containerRef} className="w-full relative">
      <div className="relative flex items-center">
        <Search className="absolute left-4 w-4 h-4 sm:w-5 sm:h-5 text-foreground-muted pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-11 sm:pl-12 pr-14 py-3 sm:py-3.5 rounded-2xl border border-border bg-background-secondary text-foreground placeholder:text-foreground-muted/70 focus:outline-none focus:border-navy focus:ring-2 focus:ring-gold/30 transition-all shadow-sm text-xs sm:text-sm font-sans"
        />

        <div className="absolute right-2 flex items-center gap-1">
          {query.length > 0 && (
            <button 
              type="button"
              onClick={handleClear}
              className="w-7 h-7 rounded-full text-foreground-muted hover:text-navy hover:bg-background flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Effacer la recherche"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setIsFocused(false);
              onSearch(query);
            }}
            className="w-8 h-8 rounded-xl bg-navy hover:bg-navy-hover text-white flex items-center justify-center transition-colors shadow-xs cursor-pointer"
            aria-label="Rechercher"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-gold" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Dropdown de suggestions interactif */}
      {isFocused && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150 max-h-80 flex flex-col">
          <div className="px-4 py-2 border-b border-border bg-background-secondary flex justify-between items-center text-xs text-foreground-muted">
            <span className="text-[10px] font-bold uppercase tracking-wider text-navy font-sans">
              {query.trim() ? "Suggestions en direct" : "Recherches populaires"}
            </span>
            {loading && (
              <span className="text-[10px] text-gold font-bold flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Recherche...
              </span>
            )}
          </div>

          <div className="overflow-y-auto divide-y divide-border/50 p-1">
            {actions.length > 0 ? (
              actions.map((action) => (
                <div
                  key={action.id}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    if (action.category === "book") {
                      window.location.href = `/catalog/${action.value}`;
                    } else {
                      onSelectAction(action.category, action.value);
                      setIsFocused(false);
                    }
                  }}
                  className="px-3 py-2.5 rounded-xl flex items-center justify-between hover:bg-background-secondary cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-gold/10 text-gold flex items-center justify-center shrink-0">
                      {action.icon}
                    </div>
                    <div className="truncate">
                      <p className="text-xs sm:text-sm font-serif font-bold text-navy group-hover:text-gold transition-colors truncate">
                        {action.label}
                      </p>
                      {action.description && (
                        <p className="text-[11px] text-foreground-muted truncate">
                          {action.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px] text-gold font-semibold shrink-0 pl-2">
                    <span className="hidden sm:inline">
                      {action.category === "book" ? "Ouvrage" : action.description}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-navy group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-foreground-muted">
                Aucune suggestion trouvée pour « {query} »
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
export default ActionSearchBar;
