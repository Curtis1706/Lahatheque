"use client";

import React from "react";
import { Search, Filter, Tag, Calendar, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface ContractSearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  partyTypeFilter: string;
  onPartyTypeChange: (partyType: string) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
  className?: string;
}

export function ContractSearchBar({
  searchQuery,
  onSearchChange,
  partyTypeFilter,
  onPartyTypeChange,
  statusFilter,
  onStatusChange,
  className,
}: ContractSearchBarProps) {
  return (
    <div className={cn("p-4 rounded-2xl bg-background border border-border space-y-3 shadow-xs", className)}>
      {/* Barre de Recherche Principal avec Icône */}
      <div className="relative">
        <Search className="w-4 h-4 text-foreground-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Recherche documentaire full-text (mots-clés, référence, nom d'auteur, université, clause...)"
          className="w-full pl-10 pr-4 py-2.5 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-foreground placeholder:text-foreground-muted min-h-[44px]"
        />
      </div>

      {/* Catégories & Filtres rapides (Pill categories 21st.dev) */}
      <div className="flex items-center gap-2 pt-2 border-t border-border overflow-x-auto">
        <span className="text-[10px] font-bold text-foreground-muted uppercase tracking-wider shrink-0 flex items-center gap-1">
          <Filter className="w-3 h-3 text-gold" />
          Partie contractante :
        </span>

        {[
          { id: "all", label: "Toutes les parties" },
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
          { id: "pending_signature", label: "En attente signature" },
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
      </div>
    </div>
  );
}
