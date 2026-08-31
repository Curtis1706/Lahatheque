"use client";

import * as React from "react";
import { Phone } from "lucide-react";
import { CountryFlag } from "@/components/ui/country-flag";
import { getCountries, AFRICAN_COUNTRIES_PRESET, type CountryItem } from "@/lib/services/countries";

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

export function PhoneInput({ value, onChange, className = "", disabled = false }: PhoneInputProps) {
  const [countriesList, setCountriesList] = React.useState<Array<{ code: string; name: string; phoneCode: string }>>(
    AFRICAN_COUNTRIES_PRESET.map((c) => ({ code: c.code, name: c.name, phoneCode: c.phone_code }))
  );
  const [selectedCountry, setSelectedCountry] = React.useState(countriesList[0]);
  const [localNumber, setLocalNumber] = React.useState("");

  // Charger les pays actifs du backend s'ils existent
  React.useEffect(() => {
    async function loadActiveCountries() {
      try {
        const data = await getCountries(true);
        if (data && data.length > 0) {
          const formatted = data.map((c) => ({
            code: c.code,
            name: c.name,
            phoneCode: c.phone_code || "+229",
          }));
          setCountriesList(formatted);
          if (!value) {
            setSelectedCountry(formatted[0]);
            onChange(formatted[0].phoneCode);
          }
        }
      } catch {
        // Fallback silently
      }
    }
    loadActiveCountries();
  }, []);

  React.useEffect(() => {
    if (value) {
      const countryMatch = countriesList.find((c) => value.startsWith(c.phoneCode));
      if (countryMatch) {
        setSelectedCountry(countryMatch);
        setLocalNumber(value.replace(countryMatch.phoneCode, "").trim());
      } else {
        setLocalNumber(value);
      }
    } else if (countriesList.length > 0) {
      onChange(countriesList[0].phoneCode);
    }
  }, [value, countriesList]);

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const country = countriesList.find((c) => c.code === e.target.value);
    if (country) {
      setSelectedCountry(country);
      onChange(`${country.phoneCode} ${localNumber.trim()}`.trim());
    }
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const num = e.target.value.replace(/[^\d\s]/g, "");
    setLocalNumber(num);
    onChange(`${selectedCountry.phoneCode} ${num}`.trim());
  };

  return (
    <div
      className={`flex items-center gap-2 w-full bg-background border border-border rounded-xl px-3 py-1 focus-within:ring-2 focus-within:ring-navy transition-all ${className}`}
    >
      {/* Drapeau & Sélecteur pays */}
      <div className="flex items-center gap-1.5 border-r border-border pr-2 shrink-0">
        <CountryFlag code={selectedCountry.code} title={selectedCountry.name} className="w-5 h-3.5 rounded-xs" />
        <select
          value={selectedCountry.code}
          onChange={handleCountryChange}
          disabled={disabled}
          className="bg-transparent text-xs font-bold text-navy focus:outline-none cursor-pointer pr-1 py-1.5"
          aria-label="Indicatif téléphonique"
        >
          {countriesList.map((c) => (
            <option key={c.code} value={c.code} className="bg-background text-navy">
              {c.code} ({c.phoneCode})
            </option>
          ))}
        </select>
      </div>

      {/* Phone input field */}
      <input
        type="tel"
        value={localNumber}
        onChange={handleNumberChange}
        disabled={disabled}
        placeholder="01 23 45 67"
        className="w-full bg-transparent text-xs sm:text-sm text-foreground focus:outline-none py-2"
        required
      />
    </div>
  );
}

export default PhoneInput;
