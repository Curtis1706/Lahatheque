"use client";

import { CountryManager } from "@/components/features/catalog/country-manager";

export default function AdminCountriesPage() {
  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto pb-16">
      <CountryManager />
    </div>
  );
}
