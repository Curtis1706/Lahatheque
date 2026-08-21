"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Globe } from "lucide-react";
import { getAdminSalesByCountry } from "@/lib/services/admin";
import { CountrySales } from "@/lib/types/admin";

export default function AdminSalesDetailsPage() {
  const [salesByCountry, setSalesByCountry] = useState<CountrySales[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await getAdminSalesByCountry();
        setSalesByCountry(data);
      } catch (err) {
        console.error("Erreur de chargement des ventes par pays", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

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

      {loading ? (
        <div className="p-8 text-center text-xs text-foreground-muted animate-pulse">
          Chargement des données de vente par pays...
        </div>
      ) : salesByCountry.length === 0 ? (
        <div className="p-8 rounded-2xl bg-background-secondary border border-border text-center space-y-2">
          <Globe className="w-8 h-8 text-foreground-muted mx-auto" />
          <p className="text-xs font-medium text-foreground-muted">
            Aucune vente enregistrée par pays pour le moment.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {salesByCountry.map((item) => (
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
      )}
    </div>
  );
}
