"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, ChevronDown, Check, GraduationCap, Plus, X, Wand2 } from "lucide-react";

export interface UniversityOption {
  id?: string;
  name: string;
  code?: string;
  country?: string;
  isPartner?: boolean;
}

const DEFAULT_UNIVERSITIES: UniversityOption[] = [
  {
    name: "Non affilié (Grand Public / Fiction / Scolaire)",
    code: "NONE",
    isPartner: false,
  },
  {
    name: "Université d'Abomey-Calavi (UAC - Bénin)",
    code: "UAC",
    country: "Bénin",
    isPartner: true,
  },
  {
    name: "Université de Parakou (UP - Bénin)",
    code: "UP",
    country: "Bénin",
    isPartner: true,
  },
  {
    name: "Université Nationale d'Agriculture (UNA - Bénin)",
    code: "UNA",
    country: "Bénin",
    isPartner: true,
  },
  {
    name: "Université Nationale des Sciences, Technologies, Ingénierie et Mathématiques (UNSTIM - Bénin)",
    code: "UNSTIM",
    country: "Bénin",
    isPartner: true,
  },
];

interface UniversityComboboxProps {
  value: string;
  onChange: (universityName: string, universityId?: string) => void;
  aiSuggestion?: string | null;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function UniversityCombobox({
  value,
  onChange,
  aiSuggestion,
  disabled = false,
  placeholder = "Sélectionner ou saisir une université...",
  className = "",
}: UniversityComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [universitiesList, setUniversitiesList] = useState<UniversityOption[]>(DEFAULT_UNIVERSITIES);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Charger les universités partenaires depuis la base de données (si endpoint disponible)
  useEffect(() => {
    let isMounted = true;
    async function loadInstitutions() {
      try {
        const res = await fetch("/api/bff/partners/institutions/", {
          credentials: "include",
          cache: "no-store",
        });
        if (res.ok) {
          const json = await res.json();
          const items = Array.isArray(json) ? json : json.data || json.results || [];
          if (isMounted && items.length > 0) {
            const fetchedList: UniversityOption[] = [
              DEFAULT_UNIVERSITIES[0], // Non affilié
            ];
            const seen = new Set<string>();
            seen.add(DEFAULT_UNIVERSITIES[0].name.toLowerCase());

            items.forEach((item: any) => {
              const uName = item.name ? `${item.name} (${item.code || item.short_name || "Bénin"})` : item.name;
              if (uName && !seen.has(uName.toLowerCase())) {
                seen.add(uName.toLowerCase());
                fetchedList.push({
                  id: item.id,
                  name: uName,
                  code: item.code || item.short_name,
                  country: item.country || "Bénin",
                  isPartner: true,
                });
              }
            });

            // Compléter avec les 4 universités par défaut si manquantes
            DEFAULT_UNIVERSITIES.slice(1).forEach((defU) => {
              if (!seen.has(defU.name.toLowerCase())) {
                seen.add(defU.name.toLowerCase());
                fetchedList.push(defU);
              }
            });

            setUniversitiesList(fetchedList);
          }
        }
      } catch {
        // Garder DEFAULT_UNIVERSITIES en cas de réseau indisponible
      }
    }
    loadInstitutions();
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

  // Filtrer les universités selon la recherche
  const filteredUniversities = universitiesList.filter((u) => {
    const term = search.toLowerCase().trim();
    if (!term) return true;
    return (
      u.name.toLowerCase().includes(term) ||
      (u.code && u.code.toLowerCase().includes(term)) ||
      (u.country && u.country.toLowerCase().includes(term))
    );
  });

  const isExactMatch = universitiesList.some(
    (u) =>
      u.name.toLowerCase() === search.toLowerCase().trim() ||
      (u.code && u.code.toLowerCase() === search.toLowerCase().trim())
  );

  const handleSelectUniversity = (u: UniversityOption) => {
    onChange(u.name, u.id);
    setSearch("");
    setIsOpen(false);
  };

  const handleUseCustomUniversity = (customName: string) => {
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
          <GraduationCap className="w-4 h-4 text-gold shrink-0" />
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
        <div className="absolute z-50 mt-1.5 left-0 min-w-[320px] sm:min-w-[380px] max-w-[95vw] rounded-2xl border border-border bg-background shadow-2xl p-2.5 space-y-2.5 max-h-80 overflow-hidden flex flex-col animate-in fade-in-0 zoom-in-95 duration-150">
          {/* Barre de recherche et saisie */}
          <div className="relative shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher ou saisir une université..."
              className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-background-secondary border border-border focus:border-gold focus:outline-none text-navy font-medium placeholder:text-foreground-muted min-h-[38px]"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (filteredUniversities.length > 0 && !search.trim()) {
                    handleSelectUniversity(filteredUniversities[0]);
                  } else if (search.trim()) {
                    handleUseCustomUniversity(search);
                  }
                }
              }}
            />
          </div>

          {/* Suggestion IA rapide si disponible */}
          {aiSuggestion && aiSuggestion.trim() && (
            <div className="shrink-0 p-2 rounded-xl bg-gold/10 border border-gold/30 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <Wand2 className="w-3.5 h-3.5 text-gold shrink-0" />
                <span className="text-[11px] text-navy font-medium truncate">
                  Détecté par IA : <strong className="text-gold font-bold">{aiSuggestion}</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleUseCustomUniversity(aiSuggestion)}
                className="px-2 py-1 rounded-lg bg-gold text-navy text-[10px] font-bold shrink-0 hover:bg-gold-light transition-colors cursor-pointer"
              >
                Appliquer
              </button>
            </div>
          )}

          {/* Option de saisie personnalisée (Autre établissement libre) */}
          {search.trim() && !isExactMatch && (
            <div className="shrink-0 pt-1 border-b border-border pb-1.5">
              <button
                type="button"
                onClick={() => handleUseCustomUniversity(search)}
                className="w-full text-left px-3 py-2 rounded-xl text-xs bg-gold/10 hover:bg-gold/20 text-navy font-medium flex items-center justify-between gap-2 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2 truncate">
                  <Plus className="w-3.5 h-3.5 text-gold shrink-0" />
                  <span className="truncate">
                    Saisir comme établissement : <strong className="text-gold font-bold">« {search.trim()} »</strong>
                  </span>
                </div>
                <span className="text-[10px] uppercase font-bold text-gold tracking-wider shrink-0">
                  Libre
                </span>
              </button>
            </div>
          )}

          {/* Liste des universités */}
          <div className="overflow-y-auto max-h-52 space-y-1 pr-1">
            <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-foreground-muted">
              Universités conventionnées &amp; Affiliations
            </div>

            {filteredUniversities.map((u) => {
              const isSelected = value.toLowerCase().trim() === u.name.toLowerCase().trim();
              return (
                <button
                  key={u.name}
                  type="button"
                  onClick={() => handleSelectUniversity(u)}
                  className={`w-full text-left p-2.5 rounded-xl text-xs flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-navy text-white shadow-xs"
                      : "hover:bg-background-secondary text-navy"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div
                      className={`p-2 rounded-lg shrink-0 ${
                        isSelected ? "bg-gold/20 text-gold" : "bg-navy/5 text-navy"
                      }`}
                    >
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`font-serif font-bold text-xs truncate ${isSelected ? "text-white" : "text-navy"}`}>
                        {u.name}
                      </p>
                      {u.country && (
                        <p className={`text-[10px] truncate mt-0.5 ${isSelected ? "text-white/70" : "text-foreground-muted"}`}>
                          Campus {u.country}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        isSelected
                          ? "bg-gold text-navy font-bold"
                          : u.isPartner
                          ? "bg-navy-light text-navy border border-navy-hover/20"
                          : "bg-background-secondary text-foreground-muted border border-border"
                      }`}
                    >
                      {u.isPartner ? "Partenaire Officiel" : "Général"}
                    </span>
                    {isSelected && <Check className="w-4 h-4 text-gold shrink-0" />}
                  </div>
                </button>
              );
            })}

            {filteredUniversities.length === 0 && (
              <div className="p-3 text-center text-xs text-foreground-muted space-y-2">
                <p>Aucun établissement trouvé pour « {search} ».</p>
                <button
                  type="button"
                  onClick={() => handleUseCustomUniversity(search)}
                  className="px-3 py-1.5 rounded-xl bg-gold text-navy font-bold text-xs hover:bg-gold-light transition-colors"
                >
                  Utiliser « {search} »
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
