"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Tag, History, Save, Plus } from "lucide-react";
import { toast } from "sonner";

export default function AdminPricingPage() {
  const [defaultDigitalPrice, setDefaultDigitalPrice] = useState(5000);
  const [defaultPaperPrice, setDefaultPaperPrice] = useState(7500);

  const [overrides, setOverrides] = useState([
    {
      id: "ov-1",
      bookTitle: "Droit Constitutionnel Béninois et Droit Comparé",
      isbn: "978-2-84254-001-2",
      digitalPrice: 6500,
      paperPrice: 9500,
      reason: "Ouvrage de référence universitaire grand format",
    },
    {
      id: "ov-2",
      bookTitle: "Précis d'Économie Agricole Africaine",
      isbn: "978-2-84254-002-9",
      digitalPrice: 4000,
      paperPrice: 6500,
      reason: "Promotion annuelle partenariats facultés",
    },
  ]);

  const handleSaveDefaults = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Grille de prix par défaut mise à jour avec succès !");
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/admin/catalog"
          className="inline-flex items-center gap-1 text-xs font-medium text-gold hover:text-gold-dark mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Retour au catalogue
        </Link>
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold font-serif text-navy">
              Politique Tarifaire des Ouvrages
            </h1>
            <p className="text-xs sm:text-sm text-foreground-muted mt-0.5">
              Définir les tarifs généraux par défaut et gérer les dérogations de prix spécifiques par livre.
            </p>
          </div>
          <Link
            href="/admin/catalog/pricing/history"
            className="px-3 py-2 rounded-xl bg-background-secondary border border-border text-foreground font-semibold text-xs hover:border-gold transition-colors flex items-center gap-1.5"
          >
            <History className="w-3.5 h-3.5 text-navy" />
            Historique des Prix
          </Link>
        </div>
      </div>

      {/* Grille par défaut */}
      <form onSubmit={handleSaveDefaults} className="p-5 sm:p-6 rounded-2xl bg-background-secondary border border-border space-y-4">
        <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Tag className="w-4 h-4 text-gold" />
          Tarifs Généraux par Défaut (Catalogue Unitaire)
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="text-xs font-medium text-foreground">Prix Numérique par Défaut (FCFA)</label>
            <input
              type="number"
              value={defaultDigitalPrice}
              onChange={(e) => setDefaultDigitalPrice(Number(e.target.value))}
              className="w-full mt-1 p-2.5 text-xs rounded-xl bg-background border border-border font-mono font-bold text-foreground focus:border-gold focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground">Prix Livre Papier par Défaut (FCFA)</label>
            <input
              type="number"
              value={defaultPaperPrice}
              onChange={(e) => setDefaultPaperPrice(Number(e.target.value))}
              className="w-full mt-1 p-2.5 text-xs rounded-xl bg-background border border-border font-mono font-bold text-foreground focus:border-gold focus:outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-navy text-white text-xs font-semibold hover:bg-navy-hover transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Save className="w-3.5 h-3.5" /> Enregistrer la Grille Générale
          </button>
        </div>
      </form>

      {/* Tarifs Dérogatoires */}
      <div className="p-5 sm:p-6 rounded-2xl bg-background-secondary border border-border space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-foreground">Prix Dérogatoires par Ouvrage ({overrides.length})</h2>
        </div>

        <div className="space-y-3">
          {overrides.map((ov) => (
            <div key={ov.id} className="p-4 rounded-xl bg-background border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-xs text-foreground">{ov.bookTitle}</p>
                <p className="text-[11px] font-mono text-foreground-muted">ISBN: {ov.isbn} • Note: {ov.reason}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0 font-mono text-xs">
                <span className="px-2.5 py-1 rounded-lg bg-navy/10 text-navy font-bold">
                  Num: {ov.digitalPrice.toLocaleString("fr-FR")} FCFA
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-gold/15 text-gold-dark font-bold">
                  Papier: {ov.paperPrice.toLocaleString("fr-FR")} FCFA
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
