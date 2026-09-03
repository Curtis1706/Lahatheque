"use client";

import React, { useMemo } from "react";
import { GraduationCap, X, Check } from "lucide-react";
import { SearchableSelect, type SearchableOption } from "@/components/ui/searchable-select";
import { useDisciplines } from "@/lib/hooks/use-disciplines";
import { DisciplineItem } from "@/lib/services/classification";

export interface DisciplineComboboxProps {
  id?: string;
  // Mode simple
  value?: string;
  onChange?: (value: string) => void;

  // Mode multi-sélection (plusieurs catégories)
  multiple?: boolean;
  values?: string[];
  onValuesChange?: (values: string[]) => void;
  maxSelections?: number;

  disciplines?: DisciplineItem[] | string[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  includeAllOption?: boolean;
  allOptionLabel?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  icon?: React.ReactNode;
}

export function DisciplineCombobox({
  id,
  value = "",
  onChange,
  multiple = false,
  values = [],
  onValuesChange,
  maxSelections = 5,
  disciplines: customDisciplines,
  placeholder = "Sélectionner une discipline...",
  searchPlaceholder = "Rechercher parmi les disciplines...",
  emptyMessage = "Aucune discipline trouvée.",
  includeAllOption = false,
  allOptionLabel,
  disabled = false,
  required = false,
  className,
  icon = <GraduationCap className="w-3.5 h-3.5 text-gold shrink-0" />,
}: DisciplineComboboxProps) {
  const { disciplines: hookDisciplines } = useDisciplines();

  // Si des disciplines sont passées manuellement, les utiliser, sinon utiliser celles du hook BD
  const rawList = customDisciplines && customDisciplines.length > 0 ? customDisciplines : hookDisciplines;

  const options: SearchableOption[] = useMemo(() => {
    const list: SearchableOption[] = [];

    if (!multiple && includeAllOption) {
      const label = allOptionLabel || `Toutes les disciplines (${rawList.length})`;
      list.push({
        value: "",
        label,
        badge: "TOUT",
      });
    }

    rawList.forEach((item) => {
      const name = typeof item === "string" ? item : item.name;
      const dewey = typeof item === "string" ? undefined : item.code_dewey;
      const isAlreadySelected = multiple && values.includes(name);

      list.push({
        value: name,
        label: name,
        subtitle: dewey ? `Dewey ${dewey}` : undefined,
        badge: isAlreadySelected ? "Sélectionné" : undefined,
      });
    });

    return list;
  }, [rawList, includeAllOption, allOptionLabel, multiple, values]);

  // Gestion du mode multiple
  const handleSelectOption = (selectedValue: string) => {
    if (!selectedValue) return;

    if (multiple && onValuesChange) {
      if (values.includes(selectedValue)) {
        // Déjà sélectionné : le retirer (toggle)
        onValuesChange(values.filter((v) => v !== selectedValue));
      } else {
        // Ajouter si limite non atteinte
        if (values.length < maxSelections) {
          onValuesChange([...values, selectedValue]);
        }
      }
    } else if (onChange) {
      onChange(selectedValue);
    }
  };

  const handleRemoveValue = (valueToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled || !onValuesChange) return;
    onValuesChange(values.filter((v) => v !== valueToRemove));
  };

  if (multiple) {
    return (
      <div className={`space-y-2.5 ${className || ""}`}>
        {/* Liste des badges des catégories sélectionnées */}
        {values.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl bg-background-secondary border border-border">
            {values.map((val, idx) => (
              <span
                key={val}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-navy/10 border border-gold/40 text-xs font-semibold text-navy transition-all"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-gold" />
                <span className="truncate max-w-[220px]">{val}</span>
                {idx === 0 && (
                  <span className="text-[9px] font-bold uppercase tracking-wider text-gold px-1 rounded bg-gold/15">
                    Principale
                  </span>
                )}
                {!disabled && (
                  <button
                    type="button"
                    onClick={(e) => handleRemoveValue(val, e)}
                    className="text-navy hover:text-red-500 transition-colors p-0.5 rounded cursor-pointer"
                    title={`Retirer la catégorie ${val}`}
                    aria-label={`Retirer ${val}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </span>
            ))}
            <span className="text-[11px] text-foreground-muted ml-auto px-1 font-medium">
              {values.length} / {maxSelections} catégorie{values.length > 1 ? "s" : ""}
            </span>
          </div>
        )}

        {/* Combobox de recherche et ajout */}
        <SearchableSelect
          id={id}
          options={options}
          value=""
          onChange={handleSelectOption}
          placeholder={
            values.length >= maxSelections
              ? `Limite de ${maxSelections} catégories atteinte`
              : values.length === 0
              ? placeholder
              : "Ajouter une autre catégorie..."
          }
          searchPlaceholder={searchPlaceholder}
          emptyMessage={emptyMessage}
          disabled={disabled || values.length >= maxSelections}
          required={required && values.length === 0}
          icon={icon}
        />
      </div>
    );
  }

  // Mode simple
  return (
    <SearchableSelect
      id={id}
      options={options}
      value={value}
      onChange={onChange || (() => {})}
      placeholder={placeholder}
      searchPlaceholder={searchPlaceholder}
      emptyMessage={emptyMessage}
      disabled={disabled}
      required={required}
      className={className}
      icon={icon}
    />
  );
}
