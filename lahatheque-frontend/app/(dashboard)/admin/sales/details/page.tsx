"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Globe, ShoppingCart, Layers } from "lucide-react";

const COUNTRY_SALES = [
  { country: "Bénin (BJ)", code: "BJ", salesCount: 840, totalRevenue: 16800000 },
  { country: "Côte d'Ivoire (CI)", code: "CI", salesCount: 310, totalRevenue: 6200000 },
  { country: "Sénégal (SN)", code: "SN", salesCount: 180, totalRevenue: 3600000 },
  { country: "Niger (NE)", code: "NE", salesCount: 90, totalRevenue: 1850000 },
];

export default function AdminSalesDetailsPage() {
  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <Link
          href="/admin/sales"
          className="inline-flex items-center gap-1 text-xs font-medium text-gold hover:text-gold-dark mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Retour aux Ventes
        </Link>
        <div className="pb-4 border-b border-border">
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-navy">
            Détail des Ventes par Pays & Format
          </h1>
          <p className="text-xs sm:text-sm text-foreground-muted mt-0.5">
            Ventilation géographique et répartition par canal de distribution.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {COUNTRY_SALES.map((item) => (
          <div key={item.code} className="p-5 rounded-2xl bg-background-secondary border border-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-foreground flex items-center gap-2">
                <Globe className="w-4 h-4 text-gold" />
                {item.country}
              </span>
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-background border border-border">
                {item.code}
              </span>
            </div>
            <div className="pt-2 flex justify-between items-baseline font-mono text-xs">
              <span className="text-foreground-muted">{item.salesCount} transactions</span>
              <span className="font-bold text-navy text-sm">{item.totalRevenue.toLocaleString("fr-FR")} FCFA</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
