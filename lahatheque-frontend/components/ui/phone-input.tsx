"use client";

import * as React from "react";
import { Phone } from "lucide-react";

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

const countries = [
  { code: "BJ", name: "Bénin", phoneCode: "+229" },
  { code: "CI", name: "Côte d'Ivoire", phoneCode: "+225" },
  { code: "SN", name: "Sénégal", phoneCode: "+221" },
  { code: "TG", name: "Togo", phoneCode: "+228" },
  { code: "NE", name: "Niger", phoneCode: "+227" },
  { code: "CD", name: "RDC", phoneCode: "+243" },
  { code: "ML", name: "Mali", phoneCode: "+223" },
  { code: "BF", name: "Burkina Faso", phoneCode: "+226" },
  { code: "CM", name: "Cameroun", phoneCode: "+237" },
  { code: "GA", name: "Gabon", phoneCode: "+241" },
  { code: "GN", name: "Guinée", phoneCode: "+224" },
  { code: "CG", name: "Congo", phoneCode: "+242" },
  { code: "TD", name: "Tchad", phoneCode: "+235" },
  { code: "FR", name: "France", phoneCode: "+33" },
  { code: "CA", name: "Canada", phoneCode: "+1" },
  { code: "US", name: "États-Unis", phoneCode: "+1" },
];

export function PhoneInput({ value, onChange, className = "", disabled = false }: PhoneInputProps) {
  const [selectedCountry, setSelectedCountry] = React.useState(countries[0]);
  const [localNumber, setLocalNumber] = React.useState("");

  React.useEffect(() => {
    if (value) {
      // Trouver le pays correspondant à partir de l'indicatif
      const countryMatch = countries.find(c => value.startsWith(c.phoneCode));
      if (countryMatch) {
        setSelectedCountry(countryMatch);
        setLocalNumber(value.replace(countryMatch.phoneCode, "").trim());
      } else {
        setLocalNumber(value);
      }
    } else {
      onChange(countries[0].phoneCode);
    }
  }, [value]);

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const country = countries.find(c => c.code === e.target.value);
    if (country) {
      setSelectedCountry(country);
      onChange(`${country.phoneCode} ${localNumber.trim()}`.trim());
    }
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const num = e.target.value.replace(/[^\d\s]/g, ""); // Autoriser chiffres et espaces
    setLocalNumber(num);
    onChange(`${selectedCountry.phoneCode} ${num}`.trim());
  };

  return (
    <div className={`flex items-center gap-2 w-full bg-background border border-border rounded-xl px-3 py-1 focus-within:ring-2 focus-within:ring-navy transition-all ${className}`}>
      {/* Icon Phone */}
      <Phone className="w-4 h-4 text-foreground-muted shrink-0" />

      {/* Select country drop code */}
      <div className="flex items-center border-r border-border pr-2 shrink-0">
        <select
          value={selectedCountry.code}
          onChange={handleCountryChange}
          disabled={disabled}
          className="bg-transparent text-xs font-bold text-navy focus:outline-none cursor-pointer pr-1 py-1.5"
          aria-label="Indicatif téléphonique"
        >
          {countries.map((c) => (
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
