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
  { code: "BJ", name: "Bénin", flag: "🇧🇯", phoneCode: "+229" },
  { code: "SN", name: "Sénégal", flag: "🇸🇳", phoneCode: "+221" },
  { code: "TG", name: "Togo", flag: "🇹🇬", phoneCode: "+228" },
  { code: "CI", name: "Côte d'Ivoire", flag: "🇨🇮", phoneCode: "+225" },
  { code: "NE", name: "Niger", flag: "🇳🇪", phoneCode: "+227" },
  { code: "CD", name: "RDC", flag: "🇨🇩", phoneCode: "+243" },
];

export function PhoneInput({ value, onChange, className, disabled = false }: PhoneInputProps) {
  const [selectedCountry, setSelectedCountry] = React.useState(countries[0]);
  const [localNumber, setLocalNumber] = React.useState("");

  React.useEffect(() => {
    if (value) {
      // Tenter de trouver le pays à partir de l'indicatif
      const countryMatch = countries.find(c => value.startsWith(c.phoneCode));
      if (countryMatch) {
        setSelectedCountry(countryMatch);
        setLocalNumber(value.replace(countryMatch.phoneCode, "").trim());
      } else {
        setLocalNumber(value);
      }
    } else {
      // Par défaut, injecter l'indicatif du premier pays
      onChange(countries[0].phoneCode);
    }
  }, [value]);

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const country = countries.find(c => c.code === e.target.value);
    if (country) {
      setSelectedCountry(country);
      onChange(`${country.phoneCode} ${localNumber.trim()}`);
    }
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const num = e.target.value.replace(/[^\d]/g, ""); // N'autoriser que les chiffres
    setLocalNumber(num);
    onChange(`${selectedCountry.phoneCode} ${num}`);
  };

  return (
    <div className="flex items-center gap-2 w-full bg-background-secondary border border-border rounded-xl px-3 py-1 focus-within:ring-2 focus-within:ring-navy transition-all">
      {/* Icon Phone */}
      <Phone className="w-4 h-4 text-foreground-muted shrink-0" />

      {/* Select country drop code */}
      <div className="flex items-center border-r border-border pr-2 shrink-0">
        <select
          value={selectedCountry.code}
          onChange={handleCountryChange}
          disabled={disabled}
          className="bg-transparent text-xs font-bold text-navy focus:outline-none cursor-pointer pr-1 py-1.5"
        >
          {countries.map((c) => (
            <option key={c.code} value={c.code} className="bg-background text-navy">
              {c.flag} {c.phoneCode}
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
        placeholder="97 00 00 00"
        className="w-full bg-transparent text-xs sm:text-sm text-foreground focus:outline-none py-2"
      />
    </div>
  );
}
