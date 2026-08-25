"use client";

import React, { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SearchableOption {
  value: string;
  label: string;
  subtitle?: string;
  badge?: string;
  icon?: React.ReactNode;
}

interface SearchableSelectProps {
  id?: string;
  options: SearchableOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  icon?: React.ReactNode;
}

export function SearchableSelect({
  id,
  options,
  value,
  onChange,
  placeholder = "Sélectionner une option...",
  searchPlaceholder = "Rechercher...",
  emptyMessage = "Aucun résultat trouvé.",
  disabled = false,
  required = false,
  className,
  icon,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = options.filter((opt) => {
    const term = search.toLowerCase().trim();
    if (!term) return true;
    const matchLabel = opt.label.toLowerCase().includes(term);
    const matchSubtitle = opt.subtitle?.toLowerCase().includes(term);
    const matchBadge = opt.badge?.toLowerCase().includes(term);
    return matchLabel || matchSubtitle || matchBadge;
  });

  // Fermeture au clic extérieur
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus sur l'input de recherche à l'ouverture
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearch("");
    }
  }, [isOpen]);

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

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      {/* Trigger Button */}
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl text-left flex items-center justify-between gap-2 transition-all min-h-[44px]",
          isOpen ? "border-gold ring-1 ring-gold/20" : "hover:border-navy-hover",
          disabled && "opacity-50 cursor-not-allowed",
          !selectedOption && "text-foreground-muted"
        )}
      >
        <div className="flex items-center gap-2 truncate flex-1 min-w-0">
          {icon && <span className="text-gold shrink-0">{icon}</span>}
          {selectedOption ? (
            <div className="flex flex-col truncate text-left">
              <span className="font-semibold text-navy truncate">{selectedOption.label}</span>
              {selectedOption.subtitle && (
                <span className="text-[10px] text-foreground-muted truncate font-mono">
                  {selectedOption.subtitle}
                </span>
              )}
            </div>
          ) : (
            <span className="font-normal text-foreground-muted">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {selectedOption?.badge && (
            <span className="text-[9px] font-bold font-mono uppercase bg-navy/10 text-navy px-1.5 py-0.5 rounded border border-navy/20">
              {selectedOption.badge}
            </span>
          )}
          <ChevronDown
            className={cn(
              "w-4 h-4 text-foreground-muted transition-transform duration-200",
              isOpen && "transform rotate-180 text-gold"
            )}
          />
        </div>
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1.5 w-full rounded-2xl bg-background border border-border shadow-xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-100">
          {/* Search Input Bar */}
          <div className="p-2 border-b border-border bg-background-secondary/50">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-foreground-muted absolute left-3 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-8 pr-7 py-1.5 text-xs bg-background border border-border rounded-xl focus:outline-none focus:border-gold text-navy placeholder:text-foreground-muted/70"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 text-foreground-muted hover:text-navy p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto p-1.5 space-y-0.5 focus:outline-none">
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-xs text-foreground-muted">
                {emptyMessage}
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={cn(
                      "w-full px-3 py-2 text-xs rounded-xl flex items-center justify-between gap-2 text-left transition-colors",
                      isSelected
                        ? "bg-gold/15 text-navy font-bold"
                        : "hover:bg-background-secondary text-foreground hover:text-navy"
                    )}
                  >
                    <div className="flex flex-col truncate min-w-0">
                      <span className="truncate">{opt.label}</span>
                      {opt.subtitle && (
                        <span className="text-[10px] text-foreground-muted truncate font-mono">
                          {opt.subtitle}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {opt.badge && (
                        <span className="text-[9px] font-mono font-bold uppercase bg-background px-1.5 py-0.5 rounded border border-border text-foreground-muted">
                          {opt.badge}
                        </span>
                      )}
                      {isSelected && <Check className="w-3.5 h-3.5 text-gold shrink-0" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
