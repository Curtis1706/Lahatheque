"use client";

import React, { useState, useEffect } from "react";
import { Search, Send, GraduationCap, Building2, FileText, ArrowRight, Loader2 } from "lucide-react";

export interface ActionItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  description?: string;
  category: "discipline" | "book" | "institution";
  value: string;
}

interface ActionSearchBarProps {
  onSearch: (query: string) => void;
  onSelectAction: (category: string, value: string) => void;
}

export function ActionSearchBar({ onSearch, onSelectAction }: ActionSearchBarProps) {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(false);

  const defaultActions: ActionItem[] = [
    {
      id: "act-1",
      label: "Droit & Sciences Politiques",
      icon: <GraduationCap className="w-4 h-4 text-gold" />,
      description: "Filtrer par discipline",
      category: "discipline",
      value: "Droit & Sciences Politiques"
    },
    {
      id: "act-2",
      label: "Économie & Gestion",
      icon: <GraduationCap className="w-4 h-4 text-gold" />,
      description: "Filtrer par discipline",
      category: "discipline",
      value: "Économie & Gestion"
    },
    {
      id: "act-3",
      label: "Université d'Abomey-Calavi (UAC)",
      icon: <Building2 className="w-4 h-4 text-gold" />,
      description: "Filtrer par établissement",
      category: "institution",
      value: "UAC"
    },
  ];

  useEffect(() => {
    if (!query.trim()) {
      setActions(defaultActions);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/bff/catalog/books/?q=${encodeURIComponent(query.trim())}`, {
          credentials: "include",
          cache: "no-store",
        });

        const filteredDefault = defaultActions.filter(action =>
          action.label.toLowerCase().includes(query.toLowerCase())
        );

        if (!res.ok) {
          setActions(filteredDefault);
          setLoading(false);
          return;
        }

        const json = await res.json();
        const booksList = Array.isArray(json) ? json : (json.results || []);

        const bookActions: ActionItem[] = booksList.slice(0, 5).map((book: { id: string; title: string; publisher_name?: string; discipline_detail?: { name?: string }; authors_details?: { first_name?: string; last_name?: string }[] }, idx: number) => {
          const authorNames = Array.isArray(book.authors_details)
            ? book.authors_details.map((a) => `${a.first_name || ""} ${a.last_name || ""}`.trim()).filter(Boolean).join(", ")
            : "";

          return {
            id: `book-${book.id || idx}`,
            label: book.title,
            icon: <FileText className="w-4 h-4 text-gold/80" />,
            description: authorNames || book.publisher_name || book.discipline_detail?.name || "Consulter la fiche",
            category: "book" as const,
            value: book.id,
          };
        });

        setActions([...filteredDefault, ...bookActions]);
      } catch (err) {
        console.error("Erreur de recherche d'actions:", err);
        const filteredDefault = defaultActions.filter(action =>
          action.label.toLowerCase().includes(query.toLowerCase())
        );
        setActions(filteredDefault);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    onSearch(val);
  };

  return (
    <div className="w-full max-w-2xl relative">
      <div className="relative flex items-center">
        <Search className="absolute left-4 w-5 h-5 text-foreground-muted pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 250)}
          placeholder="Rechercher par titre, auteur, établissement (Action Search Bar)..."
          className="w-full pl-12 pr-10 py-3.5 rounded-xl border border-border bg-background-secondary text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-navy transition-all shadow-sm text-sm sm:text-base"
        />
        {loading ? (
          <Loader2 className="absolute right-4 w-4 h-4 text-gold animate-spin" />
        ) : query.length > 0 ? (
          <button 
            onClick={() => { setQuery(""); onSearch(""); }}
            className="absolute right-4 text-foreground-muted hover:text-navy cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        ) : null}
      </div>

      {/* Dropdown de suggestions interactif Raycast */}
      {isFocused && actions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="p-2 border-b border-border bg-background-secondary flex justify-between items-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted px-2">Suggestions et Filtres rapides</span>
            {loading && <span className="text-[10px] text-gold font-bold animate-pulse px-2">Recherche en cours...</span>}
          </div>
          <ul className="max-h-60 overflow-y-auto divide-y divide-border/40">
            {actions.map(action => (
              <li
                key={action.id}
                onMouseDown={() => {
                  if (action.category === "book") {
                    window.location.href = `/catalog/${action.value}`;
                  } else {
                    onSelectAction(action.category, action.value);
                  }
                  setIsFocused(false);
                }}
                className="px-4 py-2.5 flex items-center justify-between hover:bg-background-secondary cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  {action.icon}
                  <span className="text-xs sm:text-sm font-semibold text-navy line-clamp-1">{action.label}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-foreground-muted font-medium">
                  <span>{action.description}</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
