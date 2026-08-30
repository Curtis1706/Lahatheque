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
  Package,
  Percent,
  Truck,
  Tag,
  Layers,
  GraduationCap
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

const PAPER_PACKS = [
  {
    id: "pack-droit",
    badge: "Pack Licence Droit",
    discount: "-20%",
    title: "Pack Fondamentaux Droit OHADA",
    subtitle: "3 Manuels de référence indispensables pour L1 / L2 / L3",
    books: [
      "Droit des obligations : Régime général & contrats",
      "Droit constitutionnel & institutions politiques",
      "Droit des affaires : Sociétés commerciales OHADA"
    ],
    originalPrice: 43500,
    packPrice: 34800,
    features: [
      "3 Tomes papier neufs reliés grand format",
      "Accès numérique PDF DRM offert (3 mois)",
      "Livraison express sur votre campus universitaire",
      "Fiches synthèses d'arrêts de jurisprudence incluses"
    ]
  },
  {
    id: "pack-eco",
    badge: "Pack Le Plus Populaire",
    popular: true,
    discount: "-25%",
    title: "Pack Économie & SYSCOHADA",
    subtitle: "3 Ouvrages majeurs pour les filières FASEG & Écoles de Commerce",
    books: [
      "Économie monétaire & politiques UEMOA",
      "Comptabilité approfondie SYSCOHADA révisé",
      "Management stratégique des organisations"
    ],
    originalPrice: 43500,
    packPrice: 32600,
    features: [
      "3 Manuels papier conformes au référentiel LMD",
      "Accès numérique illimité offert (6 mois)",
      "Livraison offerte à domicile ou point relais",
      "Cahier d'exercices et cas pratiques corrigés"
    ]
  },
  {
    id: "pack-master",
    badge: "Pack Excellence",
    discount: "-30%",
    title: "Pack Master & Recherche Scientifique",
    subtitle: "4 Traités d'approfondissement et méthodologie de thèse",
    books: [
      "Droit des affaires & procédures collectives",
      "Finance d'entreprise & marchés internationaux",
      "Économie monétaire approfondie",
      "Guide de rédaction et soutenance de mémoire/thèse"
    ],
    originalPrice: 61500,
    packPrice: 43000,
    features: [
      "4 Volumes d'excellence reliure rigide",
      "Pass Annuel Numérique Recherche inclus (valeur 15.000 FCFA)",
      "Livraison suivie sécurisée garantie sous 48h",
      "Assistance méthodologique et annales d'examens"
    ]
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
            Choisissez la formule qui correspond à votre rythme d'études : abonnements numériques illimités ou packs de livres papier avec réductions exclusives.
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
              className={`py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer min-h-[44px] flex items-center justify-center gap-2 ${
                activeType === "paper"
                  ? "bg-navy text-white shadow-md"
                  : "text-foreground-muted hover:text-navy"
              }`}
            >
              <Package className={`w-4 h-4 ${activeType === "paper" ? "text-gold" : "text-foreground-muted"}`} />
              Packs Livres Papier
              <span className="bg-gold text-navy text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                -30%
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

        {/* Section 1 : Abonnements Numériques */}
        {activeType === "digital" && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {loading ? (
              <PageLoader label="Chargement des offres d'abonnement" />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-2">
                
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
                    className="w-full py-3.5 rounded-xl bg-navy hover:bg-navy-hover text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 text-center shadow min-h-[44px]"
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
                    className="w-full py-3.5 rounded-xl bg-gold hover:bg-gold-hover text-navy font-bold text-xs transition-colors flex items-center justify-center gap-2 text-center shadow-md min-h-[44px]"
                  >
                    Choisir l'offre 6 Mois
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                {/* Bouquet Partenaire */}
                <div className="bg-background border-2 border-border rounded-3xl p-6 space-y-6 flex flex-col justify-between transition-all">
                  <div className="space-y-4">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-navy bg-navy/10 px-2.5 py-1 rounded-md border border-navy/20">
                        Établissement Partenaire
                      </span>
                      <h3 className="font-serif text-xl font-bold text-navy mt-3">Bouquet Partenaire</h3>
                      <p className="text-xs text-foreground-muted">Pour les institutions et bibliothèques partenaires</p>
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

        {/* Section 2 : Packs Livres Papier avec Réductions */}
        {activeType === "paper" && (
          <div className="space-y-10 animate-in fade-in duration-300">
            
            {/* Grille des Packs Papier */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-2">
              {PAPER_PACKS.map((pack) => (
                <div
                  key={pack.id}
                  className={`bg-background rounded-3xl p-6 sm:p-7 space-y-6 flex flex-col justify-between transition-all relative ${
                    pack.popular
                      ? "border-2 border-gold shadow-lg ring-1 ring-gold/30"
                      : "border-2 border-border hover:border-gold hover:shadow-md"
                  }`}
                >
                  {/* Badge Réduction & Popularité */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] uppercase font-bold text-navy bg-gold/20 px-2.5 py-1 rounded-md border border-gold/30">
                      {pack.badge}
                    </span>
                    <span className="bg-rose-500 text-white font-extrabold text-xs px-2.5 py-0.5 rounded-full shadow-sm">
                      {pack.discount}
                    </span>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="font-serif text-xl font-bold text-navy">
                        {pack.title}
                      </h3>
                      <p className="text-xs text-foreground-muted mt-1 leading-relaxed">
                        {pack.subtitle}
                      </p>
                    </div>

                    {/* Liste des Livres Inclus */}
                    <div className="bg-background-secondary p-3.5 rounded-xl border border-border space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gold block">
                        Ouvrages inclus dans ce pack :
                      </span>
                      <ul className="space-y-1 text-xs text-foreground/80 font-medium">
                        {pack.books.map((b, bIdx) => (
                          <li key={bIdx} className="flex items-start gap-1.5">
                            <span className="text-gold font-bold">•</span>
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Prix avec réduction */}
                    <div className="pt-2 border-t border-border">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-foreground-muted line-through font-semibold">
                          {pack.originalPrice.toLocaleString("fr-FR")} FCFA
                        </span>
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                          Économisez {(pack.originalPrice - pack.packPrice).toLocaleString("fr-FR")} FCFA
                        </span>
                      </div>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="font-serif text-3xl font-bold text-navy">
                          {pack.packPrice.toLocaleString("fr-FR")}
                        </span>
                        <span className="text-xs font-bold text-gold-dark">FCFA le pack</span>
                      </div>
                    </div>

                    {/* Avantages */}
                    <ul className="space-y-2 text-xs text-foreground/90 pt-2 border-t border-border">
                      {pack.features.map((f, fIdx) => (
                        <li key={fIdx} className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-success shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Link
                    href="/cart"
                    className={`w-full py-3.5 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2 text-center shadow min-h-[44px] ${
                      pack.popular
                        ? "bg-gold hover:bg-gold-hover text-navy shadow-md"
                        : "bg-navy hover:bg-navy-hover text-white"
                    }`}
                  >
                    <Package className="w-4 h-4" />
                    Commander ce Pack Papier
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ))}
            </div>

            {/* Bannière Commandes Groupées Amphi & Délégués */}
            <div className="bg-navy text-white rounded-3xl p-8 sm:p-10 border border-gold/30 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-3 max-w-2xl">
                <div className="inline-flex items-center gap-2 text-gold text-xs font-bold uppercase tracking-wider">
                  <GraduationCap className="w-4 h-4" />
                  Délégués d'Amphi &amp; Associations Étudiantes
                </div>
                <h3 className="font-serif text-2xl font-bold">
                  Commandes Groupées de Promotion — Jusqu'à -35% de Réduction
                </h3>
                <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
                  Vous souhaitez commander des packs papier pour l'ensemble de votre promotion ou classe préparatoire ? Bénéficiez d'une remise grossiste spéciale et de la livraison groupée offerte directement à votre faculté.
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
