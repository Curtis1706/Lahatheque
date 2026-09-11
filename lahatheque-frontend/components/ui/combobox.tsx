"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { Search, ChevronDown, Check, X } from "lucide-react";

export interface ComboboxOption {
  value: string;
  label: string;
  sublabel?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface ComboboxProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: ComboboxOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  className?: string;
  allowClear?: boolean;
}

export function Combobox({
  id,
  value,
  onChange,
  options,
  placeholder = "Sélectionner une option...",
  searchPlaceholder = "Rechercher...",
  emptyText = "Aucun résultat trouvé.",
  disabled = false,
  className = "",
  allowClear = true,
}: ComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Trouver l'option sélectionnée
  const selectedOption = useMemo(() => {
    return options.find((opt) => opt.value === value) || null;
  }, [options, value]);

  // Filtrage des options selon la recherche
  const filteredOptions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        (opt.sublabel && opt.sublabel.toLowerCase().includes(q))
    );
  }, [options, search]);

  // Ajustement de l'index surligné quand la liste filtrée change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredOptions]);

  // Focus sur le champ de recherche à l'ouverture
  useEffect(() => {
    if (isOpen) {
      setSearch("");
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Fermeture au clic extérieur
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fermeture à la touche Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Gestion de la navigation clavier
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredOptions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredOptions.length - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredOptions[highlightedIndex]) {
        handleSelect(filteredOptions[highlightedIndex].value);
      }
    }
  };

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(options[0]?.value || "");
    setIsOpen(false);
  };

  const SelectedIcon = selectedOption?.icon;

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* ── Déclencheur (Trigger) ── */}
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full px-3.5 py-2.5 rounded-xl text-xs text-left bg-background border border-border flex items-center justify-between gap-2 transition-all min-h-[44px] cursor-pointer ${
          disabled
            ? "opacity-50 cursor-not-allowed bg-background-secondary"
            : "hover:border-gold/50 focus:border-gold focus:outline-none"
        } ${isOpen ? "border-gold ring-1 ring-gold/30" : ""}`}
      >
        <div className="flex items-center gap-2 truncate flex-1">
          {SelectedIcon && (
            <SelectedIcon className="w-3.5 h-3.5 text-gold shrink-0" />
          )}
          <span
            className={`truncate ${
              selectedOption ? "text-foreground font-medium" : "text-foreground-muted"
            }`}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {allowClear && selectedOption && selectedOption.value !== "all" && selectedOption.value !== "" && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => e.key === "Enter" && handleClear(e as any)}
              className="p-1 rounded-md text-foreground-muted hover:text-navy hover:bg-background-secondary transition-colors"
              title="Effacer la sélection"
            >
              <X className="w-3 h-3" />
            </span>
          )}
          <ChevronDown
            className={`w-3.5 h-3.5 text-foreground-muted transition-transform duration-200 ${
              isOpen ? "rotate-180 text-gold" : ""
            }`}
          />
        </div>
      </button>

      {/* ── Menu déroulant Popover ── */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 rounded-2xl bg-background border border-border shadow-xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
          {/* Champ de recherche interne */}
          <div className="p-2 border-b border-border bg-background-secondary/50">
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder={searchPlaceholder}
                className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-background border border-border text-foreground placeholder:text-foreground-muted focus:border-gold focus:outline-none min-h-[38px]"
              />
              <Search className="w-3.5 h-3.5 text-foreground-muted absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Liste des options */}
          <ul
            ref={listRef}
            role="listbox"
            className="max-h-60 overflow-y-auto p-1.5 divide-y divide-border/20 text-xs focus:outline-none"
          >
            {filteredOptions.length === 0 ? (
              <li className="py-6 px-3 text-center text-foreground-muted text-xs">
                {emptyText}
              </li>
            ) : (
              filteredOptions.map((opt, index) => {
                const isSelected = opt.value === value;
                const isHighlighted = index === highlightedIndex;
                const IconComponent = opt.icon;

                return (
                  <li
                    key={opt.value || index}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(opt.value)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`px-3 py-2.5 rounded-xl cursor-pointer flex items-center justify-between gap-2 transition-colors min-h-[40px] ${
                      isSelected
                        ? "bg-gold/10 text-navy font-semibold"
                        : isHighlighted
                        ? "bg-background-secondary text-foreground"
                        : "text-foreground hover:bg-background-secondary"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate flex-1">
                      {IconComponent && (
                        <IconComponent
                          className={`w-3.5 h-3.5 shrink-0 ${
                            isSelected ? "text-gold" : "text-foreground-muted"
                          }`}
                        />
                      )}
                      <div className="truncate">
                        <div className="truncate">{opt.label}</div>
                        {opt.sublabel && (
                          <div className="text-[10px] text-foreground-muted truncate">
                            {opt.sublabel}
                          </div>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-gold shrink-0" />
                    )}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
