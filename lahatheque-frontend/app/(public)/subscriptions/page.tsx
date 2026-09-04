"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Building2, 
  Check, 
  Sparkles, 
  BookOpen, 
  ArrowRight, 
  Package, 
  Truck, 
  GraduationCap,
  Percent,
  Calendar,
  Zap,
  Clock
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

const PAPER_DISCOUNT_TIERS = [
  {
    id: "pack-5-livres",
    badge: "Pack Cursus (5 Livres)",
    discount: "-15%",
    title: "Pack 5 Livres au Choix",
    subtitle: "Sélectionnez 5 ouvrages papier de votre choix dans tout le catalogue",
    booksCount: "5 ouvrages papier",
    ruleDescription: "Remise immédiate de -15% appliquée automatiquement dès 5 livres papier achetés.",
    highlights: [
      "Choix 100% libre parmi toutes les disciplines du catalogue",
      "Équipement complet pour tout un semestre ou cycle d'études",
      "Accès numérique PDF DRM offert (3 mois)",
      "Livraison express sur votre campus ou point relais"
    ],
    ctaText: "Composer mon Pack 5 Livres",
    ctaLink: "/catalog?format=papier",
    popular: false,
    isInstitutional: false
  },
  {
    id: "pack-10-livres",
    badge: "Formule la plus populaire",
    popular: true,
    discount: "-20%",
    title: "Pack 10 Livres au Choix",
    subtitle: "Composez votre sélection de 10 ouvrages papier de votre choix",
    booksCount: "10 ouvrages papier",
    ruleDescription: "Remise immédiate de -20% sur la totalité de votre sélection de 10 manuels.",
    highlights: [
      "Panachage libre de matières, semestres et niveaux académiques",
      "Accès numérique illimité offert (6 mois)",
      "Livraison prioritaire offerte à domicile ou sur campus",
      "Idéal pour couvrir une année complète ou étudier en binôme"
    ],
    ctaText: "Composer mon Pack 10 Livres",
    ctaLink: "/catalog?format=papier",
    isInstitutional: false
  },
  {
    id: "pack-20-livres",
    badge: "Pack Groupe & Excellence",
    discount: "-30%",
    title: "Pack 20 Livres & Plus",
    subtitle: "Sélectionnez 20 manuels papier ou plus pour un groupe ou une section",
    booksCount: "20+ ouvrages papier",
    ruleDescription: "Remise maximale de -30% appliquée sur l'ensemble des tomes commandés.",
    highlights: [
      "Sélection libre sans restriction de filière ni d'éditeur",
      "Pass Annuel Numérique complet inclus (valeur 15.000 FCFA)",
      "Livraison suivie sécurisée garantie sous 48h",
      "Tarif préférentiel pour groupes d'études et classes préparatoires"
    ],
    ctaText: "Composer mon Pack 20 Livres",
    ctaLink: "/catalog?format=papier",
    popular: false,
    isInstitutional: false
  },
  {
    id: "pack-institution",
    badge: "Amphi, Institution & Librairie",
    isInstitutional: true,
    discount: "Jusqu'à -40%",
    title: "Commandes de Promotion (50+)",
    subtitle: "À partir de 50 exemplaires pour promotions entières, universités et librairies",
    booksCount: "50+ exemplaires papier",
    ruleDescription: "Tarification grossiste spéciale et dégressive selon le volume global de commande.",
    highlights: [
      "Remise spéciale promotion & amphi jusqu'à -40%",
      "Livraison groupée directe en faculté ou amphi sous 48-72h",
      "Facturation pro & bon de commande administratif",
      "Accompagnement logistique dédié par un chargé de compte"
    ],
    ctaText: "Demander un Devis Groupé",
    ctaLink: "/partners",
    popular: false
  }
];

export default function SubscriptionsPage() {
  const { user } = useAuth();
  const [activeType, setActiveType] = useState<"digital" | "paper">("digital");
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
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* En-tête de page */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 text-navy border border-gold/30 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-gold" />
            Accès Illimité &amp; Tarifs Réduits
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-navy">
            Nos Offres &amp; Formules LAHAThèque
          </h1>
          <p className="text-sm sm:text-base text-foreground-muted leading-relaxed">
            Choisissez la formule qui correspond à votre rythme d'études : abonnements numériques (mensuel ou annuel à tarif réduit) ou remises par volume de livres papier achetés.
          </p>
        </div>

        {/* Sélecteur Numérique vs Packs Papier */}
        <div className="max-w-md mx-auto">
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-background-secondary rounded-2xl border border-border">
            <button
              onClick={() => setActiveType("digital")}
              className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer min-h-[44px] flex items-center justify-center gap-2 ${
                activeType === "digital"
                  ? "bg-navy text-white shadow-md"
                  : "text-foreground-muted hover:text-navy"
              }`}
            >
              <BookOpen className={`w-4 h-4 ${activeType === "digital" ? "text-gold" : "text-foreground-muted"}`} />
              Abonnements Numériques
            </button>

            <button
              onClick={() => setActiveType("paper")}
              className={`py-3 px-3.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer min-h-[44px] flex items-center justify-center gap-1.5 ${
                activeType === "paper"
                  ? "bg-navy text-white shadow-md"
                  : "text-foreground-muted hover:text-navy"
              }`}
            >
              <Package className={`w-4 h-4 ${activeType === "paper" ? "text-gold" : "text-foreground-muted"}`} />
              <span>Livres Papier</span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                activeType === "paper"
                  ? "bg-gold/20 text-gold-light border-gold/40"
                  : "bg-background border-border text-foreground-muted"
              }`}>
                Bientôt disponible
              </span>
            </button>
          </div>
        </div>

        {/* Banner Accès Institutionnel si débloqué */}
        {hasInstAccess && (
          <div className="bg-navy text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-gold/40 relative overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-gold/10 rounded-full blur-2xl pointer-events-none" />
            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-gold text-xs font-bold uppercase tracking-widest">
                  <Building2 className="w-4 h-4" />
                  Accès Partenaire Débloqué
                </div>
                <h2 className="font-serif text-xl sm:text-2xl font-bold">
                  Abonnement offert par {instName || "votre établissement partenaire"}
                </h2>
                <p className="text-xs text-white/80 max-w-xl">
                  Votre affiliation a été validée. Vous bénéficiez d'un accès automatique à l'ensemble du bouquet documentaire académique souscrit par votre établissement partenaire sans aucuns frais individuels.
                </p>
              </div>
              <Link
                href="/catalog"
                className="px-6 py-3.5 rounded-xl bg-gold hover:bg-gold-hover text-navy font-bold text-xs sm:text-sm shrink-0 shadow-md transition-all flex items-center gap-2 min-h-[44px]"
              >
                <BookOpen className="w-4 h-4" />
                Accéder au Catalogue Offert
              </Link>
            </div>
          </div>
        )}

        {/* Section 1 : Abonnements Numériques (Mensuel vs Annuel avec Réduction) */}
        {activeType === "digital" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {loading ? (
              <PageLoader label="Chargement des offres d'abonnement" />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-2">
                
                {/* 1. Formule Mensuelle */}
                <div className="bg-background border-2 border-border hover:border-navy rounded-3xl p-6 space-y-6 flex flex-col justify-between transition-all hover:shadow-lg relative">
                  <div className="space-y-4">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-navy bg-navy/10 px-2.5 py-1 rounded-md border border-navy/20">
                        Abonnement Mensuel
                      </span>
                      <h3 className="font-serif text-xl font-bold text-navy mt-3">Pass Mensuel</h3>
                      <p className="text-xs text-foreground-muted">Sans engagement — Idéal pour révisions ciblées et examens</p>
                    </div>

                    <div className="flex items-baseline gap-1 pt-2">
                      <span className="font-serif text-3xl font-bold text-navy">2.000</span>
                      <span className="text-xs font-bold text-gold-dark">FCFA / mois</span>
                    </div>

                    <ul className="space-y-2.5 text-xs text-foreground/90 pt-2 border-t border-border">
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-success shrink-0" />
                        <span>Accès intégral à tout le catalogue PDF/EPUB</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-success shrink-0" />
                        <span>Surlignage et prise de notes illimités</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-success shrink-0" />
                        <span>Écoute des Livres Audio en streaming</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-success shrink-0" />
                        <span>Accès 1 écran simultané</span>
                      </li>
                    </ul>
                  </div>

                  <Link
                    href="/cart"
                    className="w-full py-3.5 rounded-xl bg-navy hover:bg-navy-hover text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 text-center shadow min-h-[44px]"
                  >
                    Choisir le Pass Mensuel
                    <ArrowRight className="w-4 h-4 text-gold" />
                  </Link>
                </div>

                {/* 2. Formule Annuelle (Avec Réduction Importante) */}
                <div className="bg-background border-2 border-gold rounded-3xl p-6 space-y-6 flex flex-col justify-between transition-all shadow-md relative ring-1 ring-gold/40">
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gold text-navy font-bold text-[10px] uppercase tracking-wider px-3.5 py-1 rounded-full shadow flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-navy" />
                    Formule la plus populaire — Économisez 38%
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold text-navy bg-gold/20 px-2.5 py-1 rounded-md border border-gold/30">
                          Pass Annuel Cursus
                        </span>
                        <span className="text-[10px] font-bold text-white bg-navy px-2 py-0.5 rounded-full">
                          -38% Réduction
                        </span>
                      </div>
                      <h3 className="font-serif text-xl font-bold text-navy mt-3">Pass Annuel Recherche</h3>
                      <p className="text-xs text-foreground-muted">La formule complète pour toute votre année académique</p>
                    </div>

                    <div className="space-y-1 pt-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-foreground-muted line-through font-semibold">
                          24.000 FCFA
                        </span>
                        <span className="text-[10px] font-bold text-navy bg-gold/20 px-2 py-0.5 rounded">
                          Économisez 9.000 FCFA (soit 4 mois offerts)
                        </span>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="font-serif text-3xl font-bold text-navy">15.000</span>
                        <span className="text-xs font-bold text-gold-dark">FCFA / an</span>
                        <span className="text-[11px] text-foreground-muted font-medium ml-1">
                          (~1.250 F/mois)
                        </span>
                      </div>
                    </div>

                    <ul className="space-y-2.5 text-xs text-foreground/90 pt-2 border-t border-border">
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-success shrink-0" />
                        <span>Accès illimité à tout le catalogue pendant 12 mois</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-success shrink-0" />
                        <span>Persistance permanente de vos notes et extraits</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-success shrink-0" />
                        <span>Streaming Audio HLS sans interruption</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-success shrink-0" />
                        <span>Support prioritaire et nouveautés en avant-première</span>
                      </li>
                    </ul>
                  </div>

                  <Link
                    href="/cart"
                    className="w-full py-3.5 rounded-xl bg-gold hover:bg-gold-hover text-navy font-bold text-xs transition-colors flex items-center justify-center gap-2 text-center shadow-md min-h-[44px]"
                  >
                    Souscrire le Pass Annuel (-38%)
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                {/* 3. Bouquet Partenaire & Établissement */}
                <div className="bg-background border-2 border-border rounded-3xl p-6 space-y-6 flex flex-col justify-between transition-all">
                  <div className="space-y-4">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-navy bg-navy/10 px-2.5 py-1 rounded-md border border-navy/20">
                        Établissement Partenaire
                      </span>
                      <h3 className="font-serif text-xl font-bold text-navy mt-3">Bouquet Institution</h3>
                      <p className="text-xs text-foreground-muted">Pour universités, facultés et bibliothèques</p>
                    </div>

                    <div className="flex items-baseline gap-1 pt-2">
                      <span className="font-serif text-2xl font-bold text-navy">Sur Devis</span>
                      <span className="text-xs font-bold text-foreground-muted">/ institution</span>
                    </div>

                    <ul className="space-y-2.5 text-xs text-foreground/90 pt-2 border-t border-border">
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-success shrink-0" />
                        <span>Accès tous étudiants et enseignants illimité</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-success shrink-0" />
                        <span>Statistiques d'utilisation bibliothécaire</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-success shrink-0" />
                        <span>Validation automatique des affiliations étudiants</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-success shrink-0" />
                        <span>Intégration API &amp; authentification institutionnelle</span>
                      </li>
                    </ul>
                  </div>

                  <Link
                    href="/partners"
                    className="w-full py-3.5 rounded-xl bg-background border border-border hover:bg-background-secondary text-navy font-bold text-xs transition-colors flex items-center justify-center gap-2 text-center min-h-[44px]"
                  >
                    Contacter le service partenaire
                  </Link>
                </div>

              </div>
            )}
          </div>
        )}

        {/* Section 2 : Remises Dégressives par Nombre de Livres Papier Achetés (Grisée / Bientôt disponible) */}
        {activeType === "paper" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            
            {/* Bannière d'avertissement Bientôt Disponible */}
            <div className="bg-background-secondary border border-border rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 max-w-3xl mx-auto text-center sm:text-left">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-navy/10 text-navy shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-navy">Offre bientôt disponible</h3>
                  <p className="text-xs text-foreground-muted mt-0.5">
                    Les commandes groupées et les remises sur les livres papier physiques ouvriront très prochainement sur LAHAThèque.
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-navy/10 text-navy border border-navy/20 text-xs font-bold shrink-0">
                En préparation
              </span>
            </div>

            {/* Grille des 4 Formules Dégressives (Grisées et désactivées) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto pt-2">
              {PAPER_DISCOUNT_TIERS.map((tier) => (
                <div
                  key={tier.id}
                  className="bg-background/80 opacity-70 border-2 border-border rounded-3xl p-6 space-y-6 flex flex-col justify-between transition-all relative select-none"
                >
                  {/* Badge & Taux de Réduction */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] uppercase font-bold px-2.5 py-1 rounded-md border text-foreground-muted bg-background-secondary border-border">
                      {tier.badge}
                    </span>
                    <span className="text-foreground-muted font-bold text-xs px-2.5 py-0.5 rounded-full bg-background-secondary border border-border">
                      {tier.discount}
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="font-serif text-xl sm:text-2xl font-bold text-foreground/80">
                        {tier.title}
                      </h3>
                      <p className="text-xs text-foreground-muted mt-1 leading-relaxed">
                        {tier.subtitle}
                      </p>
                    </div>

                    {/* Bloc Règle de Remise */}
                    <div className="bg-background-secondary/60 p-3.5 rounded-xl border border-border space-y-1">
                      <div className="flex items-center gap-1.5 text-foreground-muted font-bold text-xs">
                        <Percent className="w-3.5 h-3.5" />
                        <span className="uppercase tracking-wider text-[10px]">
                          Avantage Volume ({tier.booksCount})
                        </span>
                      </div>
                      <p className="text-xs text-foreground-muted font-medium leading-relaxed">
                        {tier.ruleDescription}
                      </p>
                    </div>

                    {/* Avantages & Garanties */}
                    <ul className="space-y-2 text-xs text-foreground-muted pt-2 border-t border-border">
                      {tier.highlights.map((h, hIdx) => (
                        <li key={hIdx} className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-foreground-muted shrink-0 mt-0.5" />
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    disabled
                    aria-disabled="true"
                    className="w-full py-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 text-center min-h-[44px] bg-background-secondary border border-border text-foreground-muted cursor-not-allowed"
                  >
                    <Clock className="w-4 h-4" />
                    <span>Bientôt disponible</span>
                  </button>
                </div>
              ))}
            </div>

            {/* Bannière Commandes Groupées Amphi & Délégués */}
            <div className="bg-navy text-white rounded-3xl p-8 sm:p-10 border border-gold/30 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6 opacity-85">
              <div className="space-y-3 max-w-2xl">
                <div className="inline-flex items-center gap-2 text-gold text-xs font-bold uppercase tracking-wider">
                  <GraduationCap className="w-4 h-4" />
                  Délégués d'Amphi &amp; Associations Étudiantes
                </div>
                <h3 className="font-serif text-2xl font-bold">
                  Commandes Groupées de Promotion — Jusqu'à -40% de Réduction
                </h3>
                <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
                  Vous souhaitez équiper l'ensemble de votre promotion ou classe préparatoire ? Regroupez vos commandes et bénéficiez d'une remise grossiste spéciale avec livraison groupée offerte directement à votre faculté.
                </p>
              </div>

              <Link
                href="/partners"
                className="px-6 py-3.5 rounded-xl bg-gold hover:bg-gold-hover text-navy font-bold text-xs sm:text-sm shrink-0 shadow-md transition-all flex items-center gap-2 min-h-[44px]"
              >
                <Truck className="w-4 h-4" />
                Demander un tarif promotion groupée
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
