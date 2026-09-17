"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Layers,
  ArrowLeft,
  Search,
  CheckCircle2,
  Sparkles,
  HelpCircle,
} from "lucide-react";
import { BouquetCard } from "@/components/features/university/bouquet-card";
import { ProgressMetricCard } from "@/components/ui/progress-metric-card";
import {
  getUniversityBouquets,
  subscribeUniversityBouquet,
} from "@/lib/services/university";
import type { UniversityBouquet } from "@/lib/types/university";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";


export default function UniversityBouquetsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [bouquets, setBouquets] = useState<UniversityBouquet[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "available" | "active">("all");

  // T016 : Redirection de sécurité — les universités partenaires n'ont pas accès aux bouquets
  useEffect(() => {
    const instType =
      (user as any)?.institution_detail?.institution_type ||
      (user as any)?.university_profile?.institution_type;
    if (instType === "partner") {
      console.info("[UNIV ACCESS GUARD]", new Date().toISOString(), "- Partner redirected from /bouquets to /university/royalties");
      toast.info("En tant qu'université partenaire, votre espace est dédié au suivi des droits et redevances.");
      router.replace("/university/royalties");
    }
  }, [user, router]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getUniversityBouquets();
      setBouquets(
        (data || []).filter(
          (b) => (b.bouquet_type as string) !== "general" && !b.title.toLowerCase().includes("général") && !b.title.toLowerCase().includes("general")
        )
      );
    } catch {
      // Erreur gérée au niveau service
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubscribe = async (offeringOrBouquetId: string, period: "monthly" | "annual" = "annual") => {
    console.info("[UNIV BOUQUET SUBSCRIBE]", new Date().toISOString(), {
      bouquetId: offeringOrBouquetId,
      period,
      institution: (user as any)?.institution_detail?.code || (user as any)?.institution_detail?.name || "client",
    });

    try {
      const res = await subscribeUniversityBouquet(offeringOrBouquetId, period);
      if (res.success) {
        if (res.checkout_url) {
          toast.info("Redirection vers la passerelle de paiement sécurisée...");
          console.info("[UNIV BOUQUET SUBSCRIBE]", new Date().toISOString(), `Redirecting to Moneroo: ${res.checkout_url}`);
          window.location.href = res.checkout_url;
          return true;
        }
        toast.success("Souscription enregistrée avec succès.");
        await loadData();
        return true;
      } else {
        toast.error(res.error || "Échec de l'initialisation de la souscription.");
        console.error("[UNIV BOUQUET SUBSCRIBE ERROR]", new Date().toISOString(), res.error);
        return false;
      }
    } catch (err: any) {
      console.error("[UNIV BOUQUET SUBSCRIBE ERROR]", new Date().toISOString(), err);
      toast.error("Une erreur réseau est survenue lors de la souscription.");
      return false;
    }
  };

  const matchesSearch = (b: UniversityBouquet) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchTitle = b.title?.toLowerCase().includes(q);
    const matchFac = b.faculty_code?.toLowerCase().includes(q);
    const matchDisc = b.discipline?.toLowerCase().includes(q);
    return matchTitle || matchFac || matchDisc;
  };

  const availableBouquets = useMemo(() => {
    return bouquets
      .filter((b) => !b.is_subscribed && b.status !== "active")
      .filter(matchesSearch);
  }, [bouquets, searchQuery]);

  const activeBouquets = useMemo(() => {
    return bouquets
      .filter((b) => b.is_subscribed || b.status === "active")
      .filter(matchesSearch);
  }, [bouquets, searchQuery]);

  const showAvailable = filterType === "all" || filterType === "available";
  const showActive = filterType === "all" || filterType === "active";

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-8 max-w-7xl mx-auto">
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

      {/* 4 KPI Cards Consolidées du Catalogue Bouquets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ProgressMetricCard
          title="Bouquets Souscrits"
          total={`${activeBouquets.length} Packs`}
          percent={activeBouquets.length > 0 ? `+${activeBouquets.length}` : "0"}
          trend={activeBouquets.length > 0 ? "up" : "down"}
          accent="gold"
          delta="Actifs"
          deltaLabel="sur le campus"
        />

        <ProgressMetricCard
          title="Ouvrages Débloqués"
          total={`${activeBouquets.reduce((acc, b) => acc + (b.books_count || 0), 0)} Volumes`}
          percent="Numérique"
          trend="up"
          accent="navy"
          delta="Accès campus"
          deltaLabel="pour vos étudiants"
        />

        <ProgressMetricCard
          title="Bouquets Disponibles"
          total={`${availableBouquets.length} Packs`}
          percent="En catalogue"
          trend="up"
          accent="emerald"
          delta="À souscrire"
          deltaLabel="par faculté ou filière"
        />

        <ProgressMetricCard
          title="Format d'Accès"
          total="100 %"
          percent="Sécurisé"
          trend="up"
          accent="gold"
          delta="Liseuse numérique"
          deltaLabel="et extraits gratuits"
        />
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
            { id: "available", label: `Disponibles (${availableBouquets.length})` },
            { id: "active", label: `Souscriptions actives (${activeBouquets.length})` },
          ].map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() => setFilterType(st.id as any)}
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

      {loading ? (
        <div className="space-y-6 animate-pulse">
          <div className="h-6 bg-background-secondary rounded w-48" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-64 bg-background-secondary rounded-3xl" />
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-10">
          {/* Section 1 : Bouquets Disponibles */}
          {showAvailable && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-gold" />
                  <h2 className="font-serif text-lg sm:text-xl font-bold text-navy">
                    Bouquets Disponibles à la Souscription
                  </h2>
                </div>
                <span className="text-xs text-foreground-muted font-medium">
                  {availableBouquets.length} offre(s)
                </span>
              </div>

              {availableBouquets.length === 0 ? (
                <div className="p-8 text-center rounded-3xl bg-background border border-dashed border-border space-y-2">
                  <HelpCircle className="w-8 h-8 text-foreground-muted mx-auto" />
                  <p className="text-xs text-foreground-muted">
                    {searchQuery.trim()
                      ? "Aucun bouquet disponible ne correspond à votre recherche."
                      : "Aucun bouquet disponible pour le moment — contactez LAHA Éditions."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {availableBouquets.map((bq) => (
                    <BouquetCard
                      key={bq.id}
                      bouquet={bq}
                      onSubscribe={handleSubscribe}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Section 2 : Mes Souscriptions Actives */}
          {showActive && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <h2 className="font-serif text-lg sm:text-xl font-bold text-navy">
                    Mes Souscriptions Actives
                  </h2>
                </div>
                <span className="text-xs text-foreground-muted font-medium">
                  {activeBouquets.length} souscription(s)
                </span>
              </div>

              {activeBouquets.length === 0 ? (
                <div className="p-8 text-center rounded-3xl bg-background border border-dashed border-border space-y-2">
                  <Layers className="w-8 h-8 text-foreground-muted mx-auto" />
                  <p className="text-xs text-foreground-muted">
                    {searchQuery.trim()
                      ? "Aucune souscription active ne correspond à votre recherche."
                      : "Aucune souscription active pour le moment."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {activeBouquets.map((bq) => (
                    <BouquetCard
                      key={bq.id}
                      bouquet={bq}
                      onSubscribe={handleSubscribe}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
