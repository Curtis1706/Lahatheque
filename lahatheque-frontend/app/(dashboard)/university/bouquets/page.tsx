"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Layers,
  ArrowLeft,
  Search,
  Filter,
  CheckCircle2,
  Download,
  Building2,
  Sparkles,
} from "lucide-react";
import { BouquetCard } from "@/components/features/university/bouquet-card";
import {
  getUniversityBouquets,
  subscribeUniversityBouquet,
} from "@/lib/services/university";
import type { UniversityBouquet } from "@/lib/types/university";

export default function UniversityBouquetsPage() {
  const [bouquets, setBouquets] = useState<UniversityBouquet[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await getUniversityBouquets();
      setBouquets(data);
      setLoading(false);
    }
    loadData();
  }, []);

  const handleSubscribe = async (bouquetId: string) => {
    const ok = await subscribeUniversityBouquet(bouquetId);
    if (ok) {
      setBouquets((prev) =>
        prev.map((b) =>
          b.id === bouquetId
            ? { ...b, status: "active", start_date: "2026-01-01", end_date: "2026-12-31" }
            : b
        )
      );
    }
    return ok;
  };

  const filteredBouquets = useMemo(() => {
    return bouquets.filter((b) => {
      if (filterType === "active" && b.status !== "active") return false;
      if (filterType === "available" && b.status !== "available") return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = b.title.toLowerCase().includes(q);
        const matchFac = b.faculty_code?.toLowerCase().includes(q);
        const matchDisc = b.discipline?.toLowerCase().includes(q);
        if (!matchTitle && !matchFac && !matchDisc) return false;
      }
      return true;
    });
  }, [bouquets, searchQuery, filterType]);

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/university" className="hover:text-navy">Vue d&apos;ensemble</Link>
        <span>/</span>
        <span className="text-navy font-semibold">Bouquets Documentaires</span>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/university" className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Vue d&apos;ensemble
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
            <Layers className="w-4 h-4 text-gold" />
            Packs &amp; Abonnements Institutionnels (Section 4.1.6 &amp; 4.1.C)
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Bouquets Documentaires Campus
          </h1>
          <p className="text-xs text-foreground-muted mt-1">
            Souscrivez aux packs de livres numériques pour vos facultés et exportez les catalogues officiels en Word (.doc).
          </p>
        </div>
      </div>

      {/* Filtres & Recherche */}
      <div className="p-4 rounded-2xl bg-background border border-border flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-foreground-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par titre, faculté ou discipline..."
            className="w-full pl-9 pr-3.5 py-2 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy min-h-[40px]"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {[
            { id: "all", label: "Tous les bouquets" },
            { id: "active", label: "Souscriptions actives" },
            { id: "available", label: "Disponibles à l'abonnement" },
          ].map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() => setFilterType(st.id)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold whitespace-nowrap transition-colors border ${
                filterType === st.id
                  ? "bg-navy text-white border-navy"
                  : "bg-background-secondary text-foreground-muted border-border hover:text-navy"
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grille de Bouquets */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-64 bg-background-secondary rounded-3xl" />
          ))}
        </div>
      ) : filteredBouquets.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-background border border-dashed border-border space-y-3">
          <Layers className="w-10 h-10 text-foreground-muted mx-auto" />
          <h3 className="font-serif font-bold text-navy text-base">
            Aucun bouquet ne correspond à votre recherche
          </h3>
          <p className="text-xs text-foreground-muted max-w-sm mx-auto">
            Modifiez vos filtres de recherche ou consultez l&apos;intégralité du catalogue universitaire.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredBouquets.map((bq) => (
            <BouquetCard
              key={bq.id}
              bouquet={bq}
              onSubscribe={handleSubscribe}
            />
          ))}
        </div>
      )}
    </div>
  );
}
