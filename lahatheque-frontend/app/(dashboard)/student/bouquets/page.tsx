"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Layers,
  BookOpen,
  Check,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Clock,
  RefreshCw,
  Library,
} from "lucide-react";
import {
  getClientBouquets,
  subscribeToClientBouquet,
  ClientBouquet,
} from "@/lib/services/bouquets";
import { toast } from "sonner";
import { BouquetBooksModal } from "@/components/features/bouquets/bouquet-books-modal";

export default function StudentBouquetsPage() {
  const [bouquets, setBouquets] = useState<ClientBouquet[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriods, setSelectedPeriods] = useState<Record<string, "monthly" | "annual">>({});
  const [subscribingId, setSubscribingId] = useState<string | null>(null);
  const [selectedBouquetDetails, setSelectedBouquetDetails] = useState<ClientBouquet | null>(null);

  const loadBouquets = async () => {
    try {
      setLoading(true);
      const data = await getClientBouquets();
      setBouquets(data);
      // Période par défaut : annuelle
      const initialPeriods: Record<string, "monthly" | "annual"> = {};
      data.forEach((b) => {
        initialPeriods[b.id] = "annual";
      });
      setSelectedPeriods(initialPeriods);
    } catch {
      toast.error("Impossible de charger les bouquets documentaires.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBouquets();
  }, []);

  const handlePeriodChange = (bouquetId: string, period: "monthly" | "annual") => {
    setSelectedPeriods((prev) => ({ ...prev, [bouquetId]: period }));
  };

  const handleSubscribe = async (bouquet: ClientBouquet) => {
    const period = selectedPeriods[bouquet.id] || "annual";
    setSubscribingId(bouquet.id);
    try {
      const res = await subscribeToClientBouquet(bouquet.id, period);
      if (res.success) {
        if (res.checkout_url) {
          toast.info("Redirection vers la passerelle de paiement sécurisée Moneroo...");
          window.location.href = res.checkout_url;
        } else {
          toast.success("Abonnement enregistré avec succès !");
          await loadBouquets();
        }
      } else {
        toast.error(res.error || "Erreur lors de la souscription.");
      }
    } catch (err: any) {
      toast.error(err.message || "Erreur réseau lors de la souscription.");
    } finally {
      setSubscribingId(null);
    }
  };

  const formatPrice = (amount: number, currency: string = "XOF") => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: currency === "XOF" ? "XOF" : "EUR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full max-w-7xl mx-auto space-y-8 pb-16 font-poppins animate-in fade-in duration-300">
      {/* ── En-tête ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/30 flex items-center justify-center text-gold shrink-0">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-playfair text-2xl sm:text-3xl font-bold text-navy">
                Bouquets Documentaires
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Accédez en illimité à des collections complètes d'ouvrages académiques dans votre bibliothèque.
              </p>
            </div>
          </div>
        </div>

        <Link
          href="/student/books?tab=bouquets"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-card hover:bg-background-secondary text-foreground text-xs sm:text-sm font-medium transition-colors"
        >
          <Library className="h-4 w-4 text-gold" />
          <span>Mes Bouquets en cours</span>
        </Link>
      </div>

      {/* ── État Chargement ── */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-center">
          <RefreshCw className="h-8 w-8 text-gold animate-spin mb-3" />
          <p className="text-sm text-muted-foreground">Chargement des bouquets disponibles...</p>
        </div>
      ) : bouquets.length === 0 ? (
        <div className="p-12 text-center bg-card border border-border rounded-2xl max-w-md mx-auto">
          <Layers className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <h2 className="font-playfair font-bold text-navy text-lg mb-1">Aucun bouquet disponible</h2>
          <p className="text-xs text-muted-foreground mb-4">
            De nouveaux bouquets thématiques seront ouverts prochainement.
          </p>
          <Link
            href="/student/books"
            className="text-xs font-semibold text-gold hover:underline"
          >
            Retour à ma bibliothèque
          </Link>
        </div>
      ) : (
        /* ── Grille des Bouquets ── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bouquets.map((bouquet) => {
            const currentPeriod = selectedPeriods[bouquet.id] || "annual";
            const isMonthly = currentPeriod === "monthly";
            const price = isMonthly
              ? (bouquet.monthly_price ?? Math.round(bouquet.annual_price / 10))
              : bouquet.annual_price;

            const isSubscribed = bouquet.is_subscribed;
            const isPendingThis = subscribingId === bouquet.id;

            return (
              <div
                key={bouquet.id}
                className="bg-card border border-border hover:border-gold/40 rounded-2xl p-6 flex flex-col justify-between transition-all duration-200 shadow-sm relative overflow-hidden"
              >
                {/* Badge Statut */}
                {isSubscribed && (
                  <div className="absolute top-4 right-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    <span>Abonné</span>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Titre & Discipline */}
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-gold bg-gold/10 px-2.5 py-0.5 rounded-full">
                      {bouquet.discipline || "Toutes disciplines"}
                    </span>
                    <h3 className="font-playfair font-bold text-navy text-lg sm:text-xl mt-2 line-clamp-2">
                      {bouquet.title}
                    </h3>
                  </div>

                  {/* Description */}
                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                    {bouquet.description || "Accès intégral et illimité à l'ensemble des titres académiques de cette collection."}
                  </p>

                  {/* Métadonnées */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t border-border">
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="h-4 w-4 text-gold" />
                      <span>{bouquet.books_count} ouvrages inclus</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-gold" />
                      <span>Liseuse sécurisée</span>
                    </div>
                  </div>

                  {/* Sélecteur de formule Bi-périodique */}
                  <div className="p-3 bg-background-secondary rounded-xl border border-border space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      <span>Formule d'accès</span>
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handlePeriodChange(bouquet.id, "monthly")}
                        className={`py-1.5 px-3 rounded-lg text-xs font-medium transition-all ${
                          isMonthly
                            ? "bg-navy text-primary-foreground shadow-sm"
                            : "bg-card text-muted-foreground hover:text-foreground border border-border"
                        }`}
                      >
                        Mensuel (30j)
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePeriodChange(bouquet.id, "annual")}
                        className={`py-1.5 px-3 rounded-lg text-xs font-medium transition-all ${
                          !isMonthly
                            ? "bg-navy text-primary-foreground shadow-sm"
                            : "bg-card text-muted-foreground hover:text-foreground border border-border"
                        }`}
                      >
                        Annuel (365j)
                      </button>
                    </div>
                  </div>
                </div>

                {/* Prix & Action */}
                <div className="pt-6 border-t border-border mt-6 space-y-4">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-2xl font-bold font-playfair text-navy">
                        {formatPrice(price, bouquet.currency)}
                      </span>
                      <span className="text-xs text-muted-foreground ml-1">
                        / {isMonthly ? "mois" : "an"}
                      </span>
                    </div>

                    {isSubscribed && bouquet.end_date && (
                      <span className="text-xs text-gold font-medium">
                        Valide jusqu'au {bouquet.end_date}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedBouquetDetails(bouquet)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-background border border-border hover:border-gold hover:text-navy text-navy text-xs font-bold transition-colors min-h-[42px] cursor-pointer"
                  >
                    <BookOpen className="w-4 h-4 text-gold" />
                    <span>Consulter les Ouvrages ({bouquet.books_count})</span>
                  </button>

                  <button
                    type="button"
                    disabled={isPendingThis}
                    onClick={() => handleSubscribe(bouquet)}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-navy hover:bg-navy-hover text-primary-foreground text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {isPendingThis ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin text-gold" />
                        <span>Initialisation du paiement...</span>
                      </>
                    ) : isSubscribed ? (
                      <>
                        <span>Renouveler pour {isMonthly ? "30 jours" : "1 an"}</span>
                        <ArrowRight className="h-4 w-4 text-gold" />
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 text-gold" />
                        <span>Souscrire ({isMonthly ? "Mensuel" : "Annuel"})</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modale d'inspection des livres du bouquet */}
      <BouquetBooksModal
        bouquet={selectedBouquetDetails as any}
        isOpen={!!selectedBouquetDetails}
        onClose={() => setSelectedBouquetDetails(null)}
        onSubscribe={async (id, period) => {
          if (selectedBouquetDetails) {
            await handleSubscribe(selectedBouquetDetails);
          }
        }}
      />
    </div>
  );
}
