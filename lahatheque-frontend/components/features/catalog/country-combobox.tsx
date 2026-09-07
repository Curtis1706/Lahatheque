"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Globe, Check, Search, ChevronDown, X } from "lucide-react";
import { SUPPORTED_COUNTRIES, matchCountry } from "@/lib/constants/classification";

export interface CountryItem {
  code: string;
  name: string;
}

interface CountryComboboxProps {
  value: string;
  onChange: (countryName: string, countryCode?: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function CountryCombobox({
  value,
  onChange,
  disabled = false,
  placeholder = "Sélectionner un pays...",
  className = "",
}: CountryComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [countriesList, setCountriesList] = useState<CountryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Charger les pays depuis la base de données
  useEffect(() => {
    let isMounted = true;
    async function loadCountries() {
      setLoading(true);
      try {
        const res = await fetch("/api/bff/catalog/countries/?active_only=true", {
          credentials: "include",
        });
        if (res.ok) {
          const json = await res.json();
          const list = json.results || json.data || (Array.isArray(json) ? json : []);
          if (isMounted && list.length > 0) {
            setCountriesList(
              list.map((c: any) => ({
                code: c.code || c.iso_code || "",
                name: c.name || c.label || "",
              }))
            );
            return;
          }
        }
      } catch (err) {
        console.warn("Erreur chargement des pays en base, fallback sur référentiel:", err);
      } finally {
        if (isMounted) setLoading(false);
      }

      // Fallback sur le référentiel complet de pays
      if (isMounted) {
        setCountriesList(
          SUPPORTED_COUNTRIES.map((c) => ({
            code: c.code,
            name: c.label.replace(/\s*\([A-Z]{2}\)$/, ""),
          }))
        );
      }
    }

    loadCountries();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fermer au clic extérieur
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Trouver le pays sélectionné
  const selectedCountry = useMemo(() => {
    if (!value) return null;
    const norm = value.toLowerCase().trim();
    return (
      countriesList.find(
        (c) => c.name.toLowerCase() === norm || c.code.toLowerCase() === norm
      ) || null
    );
  }, [value, countriesList]);

  // Filtrer les pays selon la recherche
  const filteredCountries = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return countriesList;
    return countriesList.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.code.toLowerCase().includes(term)
    );
  }, [search, countriesList]);

  const handleSelectCountry = (country: CountryItem) => {
    onChange(country.name, country.code);
    setSearch("");
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Bouton Trigger */}
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
          <Globe className="w-4 h-4 text-gold shrink-0" />
          {selectedCountry ? (
            <div className="flex items-center gap-2 truncate">
              <span className="text-xs font-semibold text-navy truncate">
                {selectedCountry.name}
              </span>
              <span className="text-[10px] font-mono font-bold text-foreground-muted px-1.5 py-0.5 rounded bg-background-secondary border border-border">
                {selectedCountry.code}
              </span>
            </div>
          ) : value ? (
            <span className="text-xs font-semibold text-navy truncate">{value}</span>
          ) : (
            <span className="text-xs text-foreground-muted truncate">
              {placeholder}
            </span>
          )}
        </div>

        <ChevronDown
          className={`w-4 h-4 text-foreground-muted transition-transform duration-200 shrink-0 ${
            isOpen ? "rotate-180 text-gold" : ""
          }`}
        />
      </div>

      {/* Popover Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute z-50 mt-1.5 w-full rounded-2xl border border-border bg-background shadow-xl p-2 space-y-2 max-h-80 overflow-hidden flex flex-col animate-in fade-in-0 zoom-in-95 duration-150">
          {/* Recherche */}
          <div className="relative shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un pays..."
              className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-background-secondary border border-border focus:border-gold focus:outline-none text-navy font-medium placeholder:text-foreground-muted"
              autoFocus
            />
          </div>

          {/* Liste des pays */}
          <div className="overflow-y-auto max-h-52 space-y-1 pr-1">
            {loading && countriesList.length === 0 ? (
              <div className="p-4 text-center text-xs text-foreground-muted">
                Chargement des pays...
              </div>
            ) : filteredCountries.length > 0 ? (
              filteredCountries.map((c) => {
                const isSelected =
                  selectedCountry?.code === c.code ||
                  value.toLowerCase() === c.name.toLowerCase();
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => handleSelectCountry(c)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-navy text-white font-bold"
                        : "hover:bg-background-secondary text-navy font-medium"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="truncate">{c.name}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                          isSelected
                            ? "bg-white/20 text-white"
                            : "bg-background-secondary text-foreground-muted border border-border"
                        }`}
                      >
                        {c.code}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-gold shrink-0" />}
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="p-3 text-center text-xs text-foreground-muted">
                Aucun pays ne correspond à votre recherche.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
