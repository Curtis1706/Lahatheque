"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, Filter, X, Cpu } from "lucide-react";
import { cn } from "@/lib/utils";

interface ContractSearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  partyTypeFilter: string;
  onPartyTypeChange: (partyType: string) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
  indexingFilter?: string;
  onIndexingFilterChange?: (status: string) => void;
  className?: string;
}

export function ContractSearchBar({
  searchQuery,
  onSearchChange,
  partyTypeFilter,
  onPartyTypeChange,
  statusFilter,
  onStatusChange,
  indexingFilter = "all",
  onIndexingFilterChange,
  className,
}: ContractSearchBarProps) {
  const [internalValue, setInternalValue] = useState(searchQuery);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Synchronisation avec la prop entrante si elle change de l'extérieur
  useEffect(() => {
    setInternalValue(searchQuery);
  }, [searchQuery]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInternalValue(val);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      onSearchChange(val);
    }, 300);
  };

  const handleClear = () => {
    setInternalValue("");
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    onSearchChange("");
  };

  return (
    <div className={cn("p-4 rounded-2xl bg-background border border-border space-y-3 shadow-xs", className)}>
      {/* Barre de Recherche Principale avec Débouncing 300ms */}
      <div className="relative">
        <Search className="w-4 h-4 text-foreground-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={internalValue}
          onChange={handleInputChange}
          placeholder="Recherche documentaire full-text (mots-clés, clauses PDF, acronymes UNSTIM, numéros CTR...)"
          className="w-full pl-10 pr-10 py-2.5 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-foreground placeholder:text-foreground-muted min-h-[44px]"
        />
        {internalValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-foreground-muted hover:text-navy cursor-pointer"
            title="Effacer la recherche"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Catégories & Filtres rapides (Pill categories) */}
      <div className="flex items-center gap-2 pt-2 border-t border-border overflow-x-auto pb-1">
        <span className="text-[10px] font-bold text-foreground-muted uppercase tracking-wider shrink-0 flex items-center gap-1">
          <Filter className="w-3 h-3 text-gold" />
          Partie :
        </span>

        {[
          { id: "all", label: "Toutes" },
          { id: "author", label: "Auteurs" },
          { id: "university", label: "Universités" },
          { id: "publisher", label: "Éditeurs Tiers" },
        ].map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => onPartyTypeChange(cat.id)}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold whitespace-nowrap transition-colors border ${
              partyTypeFilter === cat.id
                ? "bg-navy text-white border-navy"
                : "bg-background-secondary text-foreground-muted border-border hover:text-navy"
            }`}
          >
            {cat.label}
          </button>
        ))}

        <div className="h-4 w-px bg-border my-auto mx-1 shrink-0" />

        <span className="text-[10px] font-bold text-foreground-muted uppercase tracking-wider shrink-0">
          Statut :
        </span>

        {[
          { id: "all", label: "Tous" },
          { id: "active", label: "Actifs" },
          { id: "pending_signature", label: "En attente" },
          { id: "expired", label: "Expirés" },
        ].map((st) => (
          <button
            key={st.id}
            type="button"
            onClick={() => onStatusChange(st.id)}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold whitespace-nowrap transition-colors border ${
              statusFilter === st.id
                ? "bg-gold text-navy font-bold border-gold"
                : "bg-background-secondary text-foreground-muted border-border hover:text-navy"
            }`}
          >
            {st.label}
          </button>
        ))}

        {onIndexingFilterChange && (
          <>
            <div className="h-4 w-px bg-border my-auto mx-1 shrink-0" />
            <span className="text-[10px] font-bold text-foreground-muted uppercase tracking-wider shrink-0 flex items-center gap-1">
              <Cpu className="w-3 h-3 text-gold" />
              Indexation :
            </span>

            {[
              { id: "all", label: "Tous" },
              { id: "indexed", label: "Indexés OCR" },
              { id: "processing", label: "Analyse en cours" },
              { id: "failed", label: "À réindexer" },
            ].map((idxSt) => (
              <button
                key={idxSt.id}
                type="button"
                onClick={() => onIndexingFilterChange(idxSt.id)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold whitespace-nowrap transition-colors border ${
                  indexingFilter === idxSt.id
                    ? "bg-navy text-gold font-bold border-navy"
                    : "bg-background-secondary text-foreground-muted border-border hover:text-navy"
                }`}
              >
                {idxSt.label}
              </button>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
