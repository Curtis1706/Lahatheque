"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, ChevronDown, Check, Building2, Plus, X } from "lucide-react";
import { getCreatorOptions, CreatorOption } from "@/lib/services/creators";

interface PublisherComboboxProps {
  value: string;
  onChange: (publisherName: string, publisherId?: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function PublisherCombobox({
  value,
  onChange,
  disabled = false,
  placeholder = "Sélectionner ou saisir une maison d'édition...",
  className = "",
}: PublisherComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [publishersList, setPublishersList] = useState<CreatorOption[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Charger les éditeurs partenaires depuis la base de données
  useEffect(() => {
    let isMounted = true;
    async function loadPublishers() {
      setLoading(true);
      try {
        const res = await getCreatorOptions();
        if (isMounted && res.publishers) {
          setPublishersList(res.publishers);
        }
      } catch (err) {
        console.error("Erreur chargement des éditeurs:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadPublishers();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fermer le dropdown en cliquant à l'extérieur
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filtrer les éditeurs en fonction de la recherche
  const filteredPublishers = publishersList.filter((p) => {
    const term = search.toLowerCase().trim();
    if (!term) return true;
    return (
      p.name.toLowerCase().includes(term) ||
      (p.company_name && p.company_name.toLowerCase().includes(term))
    );
  });

  const isExactMatch = publishersList.some(
    (p) =>
      p.name.toLowerCase() === search.toLowerCase().trim() ||
      (p.company_name && p.company_name.toLowerCase() === search.toLowerCase().trim())
  );

  const handleSelectPartner = (p: CreatorOption) => {
    onChange(p.name || p.company_name || "", p.id);
    setSearch("");
    setIsOpen(false);
  };

  const handleUseCustomThirdParty = (customName: string) => {
    const trimmed = customName.trim();
    if (trimmed) {
      onChange(trimmed, undefined);
      setSearch("");
      setIsOpen(false);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("", undefined);
    setSearch("");
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Bouton d'affichage du sélecteur */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full min-h-[44px] px-3.5 py-2 rounded-xl border transition-all flex items-center justify-between gap-2 cursor-pointer ${
          disabled
            ? "bg-background-secondary/50 border-border text-foreground-muted cursor-not-allowed"
            : isOpen
            ? "border-gold ring-1 ring-gold/30 bg-background"
            : "border-border bg-background hover:border-gold/60"
        }`}
      >
        <div className="flex items-center gap-2 overflow-hidden flex-1">
          <Building2 className="w-4 h-4 text-gold shrink-0" />
          {value ? (
            <span className="text-xs font-semibold text-navy truncate">
              {value}
            </span>
          ) : (
            <span className="text-xs text-foreground-muted truncate">
              {placeholder}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-md text-foreground-muted hover:text-navy hover:bg-background-secondary transition-colors"
              title="Effacer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown
            className={`w-4 h-4 text-foreground-muted transition-transform duration-200 ${
              isOpen ? "rotate-180 text-gold" : ""
            }`}
          />
        </div>
      </div>

      {/* Menu déroulant avec recherche & saisie libre */}
      {isOpen && !disabled && (
        <div className="absolute z-50 mt-1.5 w-full rounded-2xl border border-border bg-background shadow-xl p-2 space-y-2 max-h-80 overflow-hidden flex flex-col animate-in fade-in-0 zoom-in-95 duration-150">
          {/* Barre de recherche et saisie */}
          <div className="relative shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher ou saisir un éditeur tiers..."
              className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-background-secondary border border-border focus:border-gold focus:outline-none text-navy font-medium placeholder:text-foreground-muted"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (filteredPublishers.length > 0 && !search.trim()) {
                    handleSelectPartner(filteredPublishers[0]);
                  } else if (search.trim()) {
                    handleUseCustomThirdParty(search);
                  }
                }
              }}
            />
          </div>

          {/* Option de saisie personnalisée (Éditeur Tiers libre) */}
          {search.trim() && !isExactMatch && (
            <div className="shrink-0 pt-1 border-b border-border pb-1.5">
              <button
                type="button"
                onClick={() => handleUseCustomThirdParty(search)}
                className="w-full text-left px-3 py-2 rounded-xl text-xs bg-gold/10 hover:bg-gold/20 text-navy font-medium flex items-center justify-between gap-2 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2 truncate">
                  <Plus className="w-3.5 h-3.5 text-gold shrink-0" />
                  <span className="truncate">
                    Utiliser comme éditeur tiers : <strong className="text-gold font-bold">« {search.trim()} »</strong>
                  </span>
                </div>
                <span className="text-[10px] uppercase font-bold text-gold tracking-wider shrink-0">
                  Tiers
                </span>
              </button>
            </div>
          )}

          {/* Liste des éditeurs partenaires en base */}
          <div className="overflow-y-auto max-h-52 space-y-1 pr-1">
            <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-foreground-muted">
              Éditeurs enregistrés en base
            </div>

            {loading ? (
              <div className="p-4 text-center text-xs text-foreground-muted">
                Chargement des éditeurs...
              </div>
            ) : filteredPublishers.length > 0 ? (
              filteredPublishers.map((p) => {
                const isSelected = value.toLowerCase() === p.name.toLowerCase();
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectPartner(p)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-navy text-white font-bold"
                        : "hover:bg-background-secondary text-navy font-medium"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Building2 className={`w-3.5 h-3.5 shrink-0 ${isSelected ? "text-gold" : "text-foreground-muted"}`} />
                      <span className="truncate">{p.name}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                          isSelected
                            ? "bg-white/20 text-white"
                            : "bg-background-secondary text-gold border border-border"
                        }`}
                      >
                        {p.role_label || "Partenaire"}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-gold shrink-0" />}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="p-3 text-center text-xs text-foreground-muted">
                Aucun éditeur en base ne correspond à votre recherche.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
