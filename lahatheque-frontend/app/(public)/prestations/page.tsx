"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Printer, 
  ShieldCheck, 
  FileSearch, 
  Layers, 
  Globe2, 
  Truck, 
  Headphones, 
  FileCheck2, 
  Palette, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  Building2, 
  Send,
  HelpCircle,
  Award,
  PhoneCall,
  FileText
} from "lucide-react";

interface Prestation {
  id: string;
  title: string;
  category: "Édition & Graphisme" | "Technologie & Sécurité" | "Diffusion & Logistique";
  tagline: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  features: string[];
  target: string;
  delai: string;
}

const PRESTATIONS: Prestation[] = [
  {
    id: "impression",
    title: "Impression des ouvrages",
    category: "Édition & Graphisme",
    tagline: "Qualité d'impression industrielle de haut niveau",
    description: "Tirages offset et numériques haute définition pour manuels scolaires, traités académiques, romans et thèses. Reliures souples, cartonnées ou brochées avec finitions de prestige (vernis sélectif, dorure, pelliculage mat/brillant).",
    icon: Printer,
    features: [
      "Impression grand volume et micro-tirages à la demande",
      "Papiers bouffants, couchés et offset certifiés écologiques",
      "Contrôle qualité colorimétrique prépresse et BAT rigoureux",
      "Conditionnement sous film sécurisé et étiquetage palettes"
    ],
    target: "Auteurs indépendants, Éditeurs partenaires, Universités",
    delai: "5 à 10 jours ouvrés"
  },
  {
    id: "securisation",
    title: "Sécurisation des contenus éditoriaux",
    category: "Technologie & Sécurité",
    tagline: "Protection DRM de pointe et traçabilité anti-piratage",
    description: "Système de protection inviolable combinant DRM dynamique Readium LCP, filigranes invisibles stéganographiques incrustés à la volée et restriction fine des droits (impression, copie d'extraits, téléchargement).",
    icon: ShieldCheck,
    features: [
      "Filigrane nominatif et invisible propre à chaque session de lecture",
      "Compatibilité avec les liseuses sécurisées et le lecteur Web officiel",
      "Protection contre la capture d'écran et l'extraction par injection",
      "Journalisation forensique et audit de consultation en temps réel"
    ],
    target: "Éditeurs, Chercheurs, Institutions & Ministères",
    delai: "Instantané / Intégration continue"
  },
  {
    id: "comite-lecture",
    title: "Analyse par un comité de lecture",
    category: "Édition & Graphisme",
    tagline: "Évaluation scientifique et littéraire rigoureuse par des pairs",
    description: "Revue critique approfondie en double aveugle par un collège d'universitaires, professeurs et experts sectoriels. Remise d'un rapport d'expertise détaillé avec recommandations d'amélioration éditoriale et validation scientifique.",
    icon: FileSearch,
    features: [
      "Évaluation de la pertinence pédagogique, juridique et scientifique",
      "Vérification de la cohérence bibliographique et méthodologique",
      "Rapport argumenté d'acceptation, révision ou orientation",
      "Attestation officielle de validation pour les comités académiques"
    ],
    target: "Enseignants-chercheurs, Doctorants, Auteurs d'essais",
    delai: "15 à 21 jours ouvrés"
  },
  {
    id: "montage-editorial",
    title: "Montage éditorial des ouvrages",
    category: "Édition & Graphisme",
    tagline: "Mise en page PAO d'excellence et structuration de métadonnées",
    description: "Prise en charge complète du manuscrit brut : calibrage typographique, composition PAO sous InDesign, harmonisation des notes de bas de page, indexation thématique et génération de notices bibliographiques normalisées ONIX 3.0.",
    icon: Layers,
    features: [
      "Gabarits sur-mesure conformes aux chartes universitaires et LMD",
      "Génération automatique d'index, tables des matières et sigles",
      "Production des fichiers ePub 3 interactifs et PDF certifiés PDF/X-1a",
      "Génération et attribution des ISBN officiels et code-barres EAN"
    ],
    target: "Maisons d'édition, Facultés, Auteurs de manuels",
    delai: "7 à 14 jours ouvrés"
  },
  {
    id: "diffusion",
    title: "Diffusion à l'échelle internationale",
    category: "Diffusion & Logistique",
    tagline: "Rayonnement commercial et institutionnel à travers le continent",
    description: "Intégration directe aux catalogues numériques des bibliothèques universitaires partenaires, librairies physiques et plateformes documentaires en Afrique subsaharienne, en Europe et dans les réseaux francophones mondiaux.",
    icon: Globe2,
    features: [
      "Référencement auprès des 4 universités publiques béninoises et réseaux régionaux",
      "Promotion ciblée auprès des facultés, bibliothécaires et cercles de recherche",
      "Campagnes de visibilité sur les portails documentaires et salons du livre",
      "Reporting mensuel des consultations, lectures et flux de revenus"
    ],
    target: "Éditeurs, Auteurs confirmés, Organismes de recherche",
    delai: "Déploiement permanent"
  },
  {
    id: "distribution",
    title: "Distribution à l'échelle internationale",
    category: "Diffusion & Logistique",
    tagline: "Chaîne logistique intégrée et réapprovisionnement physique",
    description: "Gestion des flux physiques d'ouvrages : stockage dans nos entrepôts centraux (Cotonou, Lomé, Libreville, Kinshasa), préparation de commandes, expéditions transfrontalières sécurisées et distribution auprès des grossistes partenaires.",
    icon: Truck,
    features: [
      "Entrepôts sécurisés climatisés dédiés à la conservation des livres",
      "Gestion automatisée des stocks et alertes de réapprovisionnement",
      "Acheminement routier et fret aérien optimisé en zone CEDEAO et CEMAC",
      "Facturation unifiée, suivi des bordereaux de livraison et encaissement"
    ],
    target: "Grossistes, Libraires, Institutions publiques et privées",
    delai: "48h à 72h selon la zone géographique"
  },
  {
    id: "livre-audio",
    title: "Production de livres audio",
    category: "Édition & Graphisme",
    tagline: "Enregistrement sonore studio et accessibilité enrichie",
    description: "Transformation de vos textes en œuvres sonores immersives : casting de comédiens voix-off professionnels multilingues (Français, Anglais, langues nationales), enregistrement studio haute fidélité, sound design et diffusion sécurisée.",
    icon: Headphones,
    features: [
      "Voix narratives professionnelles adaptées au ton de l'ouvrage",
      "Mastering sonore respectant les normes audio broadcast (EBU R128)",
      "Découpage par chapitres avec métadonnées audio synchronisées",
      "Streaming protégé contre l'aspiration et téléchargement hors-ligne sécurisé"
    ],
    target: "Auteurs jeunesse, Éditeurs de littérature, Vulgarisateurs",
    delai: "10 à 20 jours ouvrés"
  },
  {
    id: "anti-plagiat",
    title: "Logiciel anti-plagiat & Intégrité",
    category: "Technologie & Sécurité",
    tagline: "Détection sémantique avancée et certification d'authenticité",
    description: "Analyse algorithmique de pointe pour détecter les similitudes textuelles, paraphrases générées par intelligence artificielle et emprunts non cités à travers des milliards de pages web, thèses et revues académiques mondiales.",
    icon: FileCheck2,
    features: [
      "Scan croisé sur les bases de données universitaires et le web ouvert",
      "Rapport interactif avec pourcentage de similarité et sources surlignées",
      "Détection des fragments rédigés par modèles d'IA générative",
      "Certificat d'intégrité académique téléchargeable et infalsifiable"
    ],
    target: "Rectorats, Commissions de thèse, Comités éditoriaux",
    delai: "Analyse en moins de 3 minutes"
  },
  {
    id: "illustrations",
    title: "Réalisation d'illustrations & Couvertures",
    category: "Édition & Graphisme",
    tagline: "Création artistique sur-mesure à forte valeur esthétique",
    description: "Conception graphique complète : couvertures percutantes de livres, planches de bandes dessinées, illustrations jeunesse, schémas techniques didactiques et modélisations 3D fidèles à l'identité culturelle et au prestige de votre ouvrage.",
    icon: Palette,
    features: [
      "Direction artistique personnalisée et respect des canons de votre genre",
      "Illustrations vectorielles haute résolution prêtes pour l'impression",
      "Design de couverture avant, dos et 4ème de couverture avec code-barres",
      "Cession totale des droits d'exploitation patrimoniaux"
    ],
    target: "Auteurs de romans, Éditeurs jeunesse, Pédagogues",
    delai: "5 à 12 jours ouvrés"
  }
];

export default function PrestationsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = [
    { key: "all", label: "Toutes les prestations" },
    { key: "Édition & Graphisme", label: "Édition & Graphisme" },
    { key: "Technologie & Sécurité", label: "Technologie & Sécurité" },
    { key: "Diffusion & Logistique", label: "Diffusion & Logistique" },
  ];

  const filteredPrestations = selectedCategory === "all" 
    ? PRESTATIONS 
    : PRESTATIONS.filter(p => p.category === selectedCategory);

  return (
    <div className="min-h-screen bg-background text-foreground">
      
      {/* 1. Hero Section */}
      <section className="relative bg-background-secondary border-b border-border py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
          backgroundImage: "radial-gradient(var(--navy) 1px, transparent 1px)",
          backgroundSize: "20px 20px"
        }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 text-center space-y-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gold/10 text-navy border border-gold/20 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-gold" />
            Solutions Clé en Main &amp; Ingénierie Éditoriale
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-navy max-w-4xl mx-auto leading-tight tracking-tight">
            Nos Prestations Éditoriales &amp; Technologiques
          </h1>

          <p className="font-sans text-sm sm:text-base md:text-lg text-foreground-muted max-w-2xl mx-auto leading-relaxed">
            De la relecture scientifique à la distribution transfrontalière, LAHAThèque met son expertise au service des auteurs, éditeurs et universités pour sublimer, protéger et diffuser le savoir africain.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-navy hover:bg-navy-hover text-white font-sans font-bold text-sm shadow-md transition-all duration-200"
            >
              <PhoneCall className="w-4 h-4 text-gold" />
              Demander un accompagnement sur-mesure
            </Link>
            <Link
              href="/catalog"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl border border-border bg-background hover:bg-background-secondary text-navy font-sans font-semibold text-sm transition-all duration-200"
            >
              <FileText className="w-4 h-4 text-gold" />
              Explorer nos publications de référence
            </Link>
          </div>
        </div>
      </section>

      {/* 2. Filtres par Catégorie */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 pt-12 pb-6">
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 border-b border-border pb-6">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-sans font-medium transition-all cursor-pointer ${
                selectedCategory === cat.key
                  ? "bg-navy text-white font-bold shadow-sm"
                  : "bg-background-secondary text-foreground-muted hover:text-navy border border-border"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </section>

      {/* 3. Grille des 9 Prestations */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          {filteredPrestations.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="flex flex-col justify-between bg-background border border-border hover:border-gold/40 rounded-2xl p-6 sm:p-7 shadow-sm hover:shadow-md transition-all duration-200 group"
              >
                <div className="space-y-4">
                  
                  {/* Badge & Icon Header */}
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-navy/5 text-navy flex items-center justify-center group-hover:bg-gold/10 group-hover:text-navy transition-colors">
                      <Icon className="w-6 h-6 text-gold" />
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gold px-2.5 py-1 rounded-full bg-gold/10 border border-gold/20">
                      {item.category}
                    </span>
                  </div>

                  {/* Title & Tagline */}
                  <div>
                    <h3 className="font-serif text-xl font-bold text-navy leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-xs font-medium text-gold-dark mt-1">
                      {item.tagline}
                    </p>
                  </div>

                  {/* Description */}
                  <p className="text-xs sm:text-sm text-foreground-muted leading-relaxed">
                    {item.description}
                  </p>

                  {/* Key Features */}
                  <div className="space-y-2 pt-2 border-t border-border/60">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-navy">
                      Points forts :
                    </p>
                    <ul className="space-y-1.5">
                      {item.features.map((feat, fIdx) => (
                        <li key={fIdx} className="text-xs text-foreground-muted flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-gold shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Footer Info & Action */}
                <div className="pt-6 mt-6 border-t border-border space-y-4">
                  <div className="flex items-center justify-between text-[11px] text-foreground-muted">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-gold" />
                      <strong className="text-navy">Cible :</strong> {item.target.split(",")[0]}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-gold" />
                      {item.delai}
                    </span>
                  </div>

                  <Link
                    href={`/contact?need=${encodeURIComponent(item.title)}`}
                    className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-background-secondary hover:bg-navy hover:text-white text-navy font-sans font-bold text-xs sm:text-sm border border-border hover:border-navy transition-all duration-200 group/btn"
                  >
                    <span>Demander un devis pour ce service</span>
                    <ArrowRight className="w-4 h-4 text-gold group-hover/btn:translate-x-0.5 transition-transform" />
                  </Link>
                </div>

              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Section Processus & Engagement Qualité */}
      <section className="bg-background-secondary border-t border-border py-16 lg:py-20 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 space-y-12">
          
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-navy">
              Notre Démarche d'Excellence
            </h2>
            <p className="text-sm text-foreground-muted">
              Un accompagnement structuré, rigoureux et transparent pour chaque projet éditorial.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            <div className="bg-background p-6 rounded-2xl border border-border text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-gold/10 text-navy font-serif font-bold text-base flex items-center justify-center mx-auto border border-gold/30">
                1
              </div>
              <h3 className="font-serif font-bold text-navy text-base">Diagnostic &amp; Cadrage</h3>
              <p className="text-xs text-foreground-muted leading-relaxed">
                Étude de vos besoins, évaluation du manuscrit et proposition technique et financière personnalisée.
              </p>
            </div>

            <div className="bg-background p-6 rounded-2xl border border-border text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-gold/10 text-navy font-serif font-bold text-base flex items-center justify-center mx-auto border border-gold/30">
                2
              </div>
              <h3 className="font-serif font-bold text-navy text-base">Production &amp; Révision</h3>
              <p className="text-xs text-foreground-muted leading-relaxed">
                Mise en page PAO, enrichissement graphique, relecture éditoriale et validation des épreuves (BAT).
              </p>
            </div>

            <div className="bg-background p-6 rounded-2xl border border-border text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-gold/10 text-navy font-serif font-bold text-base flex items-center justify-center mx-auto border border-gold/30">
                3
              </div>
              <h3 className="font-serif font-bold text-navy text-base">Sécurisation &amp; Tirage</h3>
              <p className="text-xs text-foreground-muted leading-relaxed">
                Intégration du DRM Readium LCP, filigranage dynamique et impression offset/numérique certifiée.
              </p>
            </div>

            <div className="bg-background p-6 rounded-2xl border border-border text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-gold/10 text-navy font-serif font-bold text-base flex items-center justify-center mx-auto border border-gold/30">
                4
              </div>
              <h3 className="font-serif font-bold text-navy text-base">Diffusion &amp; Reporting</h3>
              <p className="text-xs text-foreground-muted leading-relaxed">
                Mise en ligne sur les réseaux universitaires, distribution physique et suivi transparent des redevances.
              </p>
            </div>

          </div>

          {/* CTA Box */}
          <div className="bg-navy text-white rounded-3xl p-8 sm:p-12 text-center space-y-6 max-w-4xl mx-auto shadow-xl">
            <div className="space-y-2">
              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white">
                Un projet éditorial ou académique à concrétiser ?
              </h3>
              <p className="text-white/80 text-sm max-w-xl mx-auto">
                Nos conseillers éditoriaux et ingénieurs documentaires vous répondent sous 24h ouvrées avec une solution adaptée.
              </p>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gold hover:bg-gold-hover text-navy font-sans font-bold text-sm transition-colors shadow-md"
              >
                <Send className="w-4 h-4" />
                Demander un devis gratuit
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-sans font-medium text-sm transition-colors"
              >
                <HelpCircle className="w-4 h-4 text-gold" />
                Prendre rendez-vous avec un conseiller
              </Link>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}
