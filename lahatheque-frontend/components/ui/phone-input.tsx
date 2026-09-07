"use client";

/**
 * Composant officiel de saisie téléphonique LAHAThèque (PhoneInput).
 * - Synchronisation dynamique des pays actifs sur la plateforme via getCountries(true).
 * - Repli résilient sur AFRICAN_COUNTRIES_PRESET si réseau indisponible.
 * - Détection et extraction automatique des indicatifs internationaux au pré-remplissage et au collage.
 * - Conforme aux tokens sémantiques, zone tactile minimale de 44px et zéro émoji.
 */

import * as React from "react";
import { CountryFlag } from "@/components/ui/country-flag";
import { getCountries, AFRICAN_COUNTRIES_PRESET } from "@/lib/services/countries";

export interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  name?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
}

export function PhoneInput({
  value,
  onChange,
  id,
  name,
  placeholder = "01 23 45 67",
  className = "",
  disabled = false,
  required = false,
}: PhoneInputProps) {
  const [countriesList, setCountriesList] = React.useState<
    Array<{ code: string; name: string; phoneCode: string }>
  >(
    AFRICAN_COUNTRIES_PRESET.map((c) => ({
      code: c.code,
      name: c.name,
      phoneCode: c.phone_code,
    }))
  );
  const [selectedCountry, setSelectedCountry] = React.useState(countriesList[0]);
  const [localNumber, setLocalNumber] = React.useState("");

  // Charger les pays actifs du backend s'ils existent
  React.useEffect(() => {
    let isMounted = true;

    async function loadActiveCountries() {
      try {
        const data = await getCountries(true);
        if (isMounted && data && data.length > 0) {
          const formatted = data.map((c) => ({
            code: c.code,
            name: c.name,
            phoneCode: c.phone_code || "+229",
          }));
          setCountriesList(formatted);
        }
      } catch {
        // Fallback silencieux sur AFRICAN_COUNTRIES_PRESET
      }
    }

    loadActiveCountries();
    return () => {
      isMounted = false;
    };
  }, []);

  // Détection automatique de l'indicatif au montage ou lors d'une modification de value externe
  React.useEffect(() => {
    if (!value) {
      setLocalNumber("");
      return;
    }

    const cleanVal = value.trim();
    // Trier par longueur décroissante d'indicatif pour éviter les préfixes partiels (+229 vs +22)
    const sorted = [...countriesList].sort(
      (a, b) => b.phoneCode.length - a.phoneCode.length
    );
    const countryMatch = sorted.find((c) => cleanVal.startsWith(c.phoneCode));

    if (countryMatch) {
      setSelectedCountry(countryMatch);
      setLocalNumber(cleanVal.slice(countryMatch.phoneCode.length).trim());
    } else {
      setLocalNumber(cleanVal);
    }
  }, [value, countriesList]);

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const country = countriesList.find((c) => c.code === e.target.value);
    if (country) {
      setSelectedCountry(country);
      const combined = localNumber.trim()
        ? `${country.phoneCode} ${localNumber.trim()}`
        : country.phoneCode;
      onChange(combined.trim());
    }
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const trimmed = raw.trim();

    // Détection si l'utilisateur a collé un numéro complet avec indicatif international
    const sorted = [...countriesList].sort(
      (a, b) => b.phoneCode.length - a.phoneCode.length
    );
    const pastedMatch = sorted.find((c) => trimmed.startsWith(c.phoneCode));

    if (pastedMatch) {
      setSelectedCountry(pastedMatch);
      const num = trimmed
        .slice(pastedMatch.phoneCode.length)
        .replace(/[^\d\s]/g, "")
        .trim();
      setLocalNumber(num);
      onChange(`${pastedMatch.phoneCode} ${num}`.trim());
      return;
    }

    const num = raw.replace(/[^\d\s]/g, "");
    setLocalNumber(num);
    const combined = num.trim()
      ? `${selectedCountry.phoneCode} ${num.trim()}`
      : selectedCountry.phoneCode;
    onChange(combined.trim());
  };

  return (
    <div
      className={`flex items-center gap-2 w-full bg-background border border-border rounded-xl px-3 py-1 focus-within:ring-2 focus-within:ring-navy focus-within:border-transparent transition-all min-h-[44px] ${
        disabled ? "opacity-60 cursor-not-allowed bg-background-secondary" : ""
      } ${className}`}
    >
      {/* Drapeau & Sélecteur pays */}
      <div className="flex items-center gap-1.5 border-r border-border pr-2 shrink-0">
        <CountryFlag
          code={selectedCountry.code}
          title={selectedCountry.name}
          className="w-5 h-3.5 rounded-xs shrink-0"
        />
        <select
          value={selectedCountry.code}
          onChange={handleCountryChange}
          disabled={disabled}
          className="bg-transparent text-xs font-bold text-navy dark:text-gold focus:outline-none cursor-pointer pr-1 py-1.5"
          aria-label="Indicatif téléphonique"
        >
          {countriesList.map((c) => (
            <option
              key={c.code}
              value={c.code}
              className="bg-background text-foreground"
            >
              {c.code} ({c.phoneCode})
            </option>
          ))}
        </select>
      </div>

      {/* Champ de saisie du numéro national */}
      <input
        id={id}
        name={name}
        type="tel"
        value={localNumber}
        onChange={handleNumberChange}
        disabled={disabled}
        required={required}
        placeholder={placeholder}
        className="w-full bg-transparent text-xs sm:text-sm text-foreground focus:outline-none py-2 placeholder:text-foreground-muted"
      />
    </div>
  );
}

export default PhoneInput;
