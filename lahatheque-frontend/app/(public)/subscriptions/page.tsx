"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Building2, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  BookOpen, 
  ArrowRight, 
  Award,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { PageLoader } from "@/components/ui/page-loader";

interface SubscriptionPlan {
  id: number | string;
  name: string;
  plan_type: string;
  price_amount: string | number;
  duration_days: number;
  max_concurrent_users: number;
}

export default function SubscriptionsPage() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [hasInstAccess, setHasInstAccess] = useState(false);
  const [instName, setInstName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPlans() {
      try {
        const res = await fetch("/api/bff/commerce/subscriptions/plans/", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setPlans(data.plans || []);
          setHasInstAccess(!!data.has_active_institutional_access);
          setInstName(data.institution_name || null);
        }
      } catch (err) {
        console.error("Erreur chargement abonnements", err);
      } finally {
        setLoading(false);
      }
    }
    fetchPlans();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-10">
        
        {/* En-tête de page */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 text-navy border border-gold/30 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-gold" />
            Accès Illimité au Savoir
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-navy">
            Formules d'Abonnement LAHAThèque
          </h1>
          <p className="text-sm text-foreground-muted leading-relaxed">
            Accédez en lecture intégrale et illimitée aux milliers d'ouvrages universitaires, manuels de référence et livres audio.
          </p>
        </div>

        {/* Banner Accès Institutionnel (Correction 3.1) */}
        {hasInstAccess && (
          <div className="bg-navy text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-gold/40 relative overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-gold/10 rounded-full blur-2xl pointer-events-none" />
            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-gold text-xs font-bold uppercase tracking-widest">
                  <Building2 className="w-4 h-4" />
                  Accès Institutionnel Débloqué
                </div>
                <h2 className="font-serif text-xl sm:text-2xl font-bold">
                  Abonnement offert par {instName || "votre Université"}
                </h2>
                <p className="text-xs text-white/80 max-w-xl">
                  Votre affiliation étudiant a été validée. Vous bénéficiez d'un accès automatique à l'ensemble du bouquet documentaire académique souscrit par votre établissement sans aucuns frais individuels.
                </p>
              </div>
              <Link
                href="/catalog"
                className="px-6 py-3.5 rounded-xl bg-gold hover:bg-gold-hover text-navy font-bold text-xs sm:text-sm shrink-0 shadow-md transition-all flex items-center gap-2"
              >
                <BookOpen className="w-4 h-4" />
                Accéder au Catalogue Offert
              </Link>
            </div>
          </div>
        )}

        {/* Liste des Offres Indivudelles */}
        {loading ? (
          <PageLoader label="Chargement des offres d'abonnement" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-4">
            
            {/* Formule Étudiant Individuelle */}
            <div className="bg-background border-2 border-border hover:border-gold rounded-3xl p-6 space-y-6 flex flex-col justify-between transition-all hover:shadow-lg relative">
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-navy bg-navy/10 px-2.5 py-1 rounded-md border border-navy/20">
                    Étudiant Individuel
                  </span>
                  <h3 className="font-serif text-xl font-bold text-navy mt-3">Pass Annuel Recherche</h3>
                  <p className="text-xs text-foreground-muted">Pour étudiants et chercheurs indépendants</p>
                </div>

                <div className="flex items-baseline gap-1 pt-2">
                  <span className="font-serif text-3xl font-bold text-navy">15.000</span>
                  <span className="text-xs font-bold text-gold-dark">FCFA / an</span>
                </div>

                <ul className="space-y-2.5 text-xs text-foreground/90 pt-2 border-t border-border">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-success shrink-0" />
                    <span>Lecture illimitée sur PDF/EPUB</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-success shrink-0" />
                    <span>Surlignage et prise de notes illimités</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-success shrink-0" />
                    <span>Écoute des Livres Audio incluses</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-success shrink-0" />
                    <span>Accès 1 écran simultané</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/cart"
                className="w-full py-3.5 rounded-xl bg-navy hover:bg-navy-hover text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 text-center shadow"
              >
                Souscrire le Pass Annuel
                <ArrowRight className="w-4 h-4 text-gold" />
              </Link>
            </div>

            {/* Formule Semestrielle */}
            <div className="bg-background border-2 border-gold rounded-3xl p-6 space-y-6 flex flex-col justify-between transition-all shadow-md relative">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gold text-navy font-bold text-[10px] uppercase tracking-wider px-3.5 py-1 rounded-full shadow">
                Formule la plus populaire
              </div>

              <div className="space-y-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-navy bg-gold/20 px-2.5 py-1 rounded-md border border-gold/30">
                    Pass Semestre
                  </span>
                  <h3 className="font-serif text-xl font-bold text-navy mt-3">Pass Examen 6 Mois</h3>
                  <p className="text-xs text-foreground-muted">Idéal pour la préparation des révisions</p>
                </div>

                <div className="flex items-baseline gap-1 pt-2">
                  <span className="font-serif text-3xl font-bold text-navy">9.000</span>
                  <span className="text-xs font-bold text-gold-dark">FCFA / 6 mois</span>
                </div>

                <ul className="space-y-2.5 text-xs text-foreground/90 pt-2 border-t border-border">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-success shrink-0" />
                    <span>Accès intégral au catalogue pendant 6 mois</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-success shrink-0" />
                    <span>Persistance des annotations et extraits</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-success shrink-0" />
                    <span>Streaming Audio HLS sans coupure</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/cart"
                className="w-full py-3.5 rounded-xl bg-gold hover:bg-gold-hover text-navy font-bold text-xs transition-colors flex items-center justify-center gap-2 text-center shadow-md"
              >
                Choisir l'offre 6 Mois
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Bouquet Institutionnel */}
            <div className="bg-background border-2 border-border rounded-3xl p-6 space-y-6 flex flex-col justify-between transition-all">
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-navy bg-navy/10 px-2.5 py-1 rounded-md border border-navy/20">
                    Université / Faculté
                  </span>
                  <h3 className="font-serif text-xl font-bold text-navy mt-3">Bouquet Université</h3>
                  <p className="text-xs text-foreground-muted">Pour les bibliothèques et facultés</p>
                </div>

                <div className="flex items-baseline gap-1 pt-2">
                  <span className="font-serif text-2xl font-bold text-navy">Sur Devis</span>
                  <span className="text-xs font-bold text-foreground-muted">/ institution</span>
                </div>

                <ul className="space-y-2.5 text-xs text-foreground/90 pt-2 border-t border-border">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-success shrink-0" />
                    <span>Accès tous étudiants illimité</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-success shrink-0" />
                    <span>Statistiques d'utilisation bibliothécaire</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-success shrink-0" />
                    <span>Validation des affiliations étudiants</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/contact"
                className="w-full py-3.5 rounded-xl bg-background border border-border hover:bg-background-secondary text-navy font-bold text-xs transition-colors flex items-center justify-center gap-2 text-center"
              >
                Contacter le service institutionnel
              </Link>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
