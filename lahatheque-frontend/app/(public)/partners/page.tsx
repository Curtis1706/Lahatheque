"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Building2, 
  ShieldCheck, 
  Users, 
  ArrowRight, 
  CheckCircle2, 
  BarChart3, 
  KeyRound, 
  GraduationCap,
  Sparkles,
  School,
  Landmark,
  Layers,
  Send,
  BookOpen,
  Truck,
  TrendingUp,
  FileCheck2,
  Percent,
  Phone,
  Mail
} from "lucide-react";
import { PartnerLogoMarquee } from "@/components/ui/partner-logo-marquee";
import { PhoneInput } from "@/components/ui/phone-input";

type PartnerType = "university" | "publisher" | "distributor";

const PARTNER_PROFILES = [
  {
    id: "university" as PartnerType,
    label: "Universités & Facultés",
    icon: School,
    badge: "Enseignement Supérieur",
    title: "La bibliothèque numérique de référence pour vos campus",
    description: "Offrez à vos étudiants et enseignants-chercheurs un accès simultané et illimité à des milliers d'ouvrages académiques africains, validés par des comités scientifiques et conformes au système LMD.",
    stats: [
      { value: "+160", label: "Établissements Partenaires" },
      { value: "+120 000", label: "Étudiants Connectés" },
      { value: "100%", label: "Sécurité DRM Tatouée" },
      { value: "24/7", label: "Disponibilité Numérique" }
    ],
    features: [
      {
        icon: Users,
        title: "Accès Simultané Illimité",
        description: "Finies les ruptures d'ouvrages à la bibliothèque. Des milliers d'étudiants consultent simultanément le même manuel sur web et mobile."
      },
      {
        icon: KeyRound,
        title: "Connexion IP & Délégation SSO",
        description: "Intégration transparente avec les ENT universitaires, réseaux campus et adresses académiques institutionnelles."
      },
      {
        icon: BarChart3,
        title: "Tableau de Bord Décisionnel",
        description: "Statistiques d'utilisation en temps réel par filière, faculté et manuel pour mesurer précisément l'impact pédagogique."
      },
      {
        icon: GraduationCap,
        title: "Valorisation de la Recherche",
        description: "Publication et diffusion des thèses, actes de colloques et manuels des professeurs de votre établissement."
      }
    ]
  },
  {
    id: "publisher" as PartnerType,
    label: "Éditeurs & Maisons d'Édition",
    icon: BookOpen,
    badge: "Distribution & DRM",
    title: "Monétisez et sécurisez vos catalogues à l'échelle panafricaine",
    description: "Associez votre maison d'édition à la première plateforme de diffusion numérique d'Afrique francophone. Protégez vos ouvrages du piratage et percevez des redevances transparentes.",
    stats: [
      { value: "+45", label: "Maisons d'Édition Partenaires" },
      { value: "0 Piratage", label: "Chiffrement & Tatouage Dynamique" },
      { value: "Semestriel", label: "Paiement des Redevances" },
      { value: "6 Pays", label: "Marchés Actifs Directs" }
    ],
    features: [
      {
        icon: ShieldCheck,
        title: "Protection DRM de Pointe",
        description: "Tatouage dynamique avec nom et IP du lecteur, blocage des captures d'écran, streaming sécurisé et restriction multi-postes."
      },
      {
        icon: TrendingUp,
        title: "Revenus & Redevances Réguliers",
        description: "Rémunération transparente sur les ventes unitaires numériques et la répartition des abonnements et bouquets institutionnels."
      },
      {
        icon: Layers,
        title: "Distribution Hybride Papier / Numérique",
        description: "Mise en avant de vos tirages papier en librairie partenaire et déclinaisons numériques / audio sur nos applications."
      },
      {
        icon: FileCheck2,
        title: "Contrats & Dépôts Conformes",
        description: "Gestion contractuelle rigoureuse conforme aux traités OAPI, OHADA et au droit d'auteur international."
      }
    ]
  },
  {
    id: "distributor" as PartnerType,
    label: "Diffuseurs & Librairies",
    icon: Truck,
    badge: "Réseau Logistique & Papier",
    title: "Approvisionnement en gros et packs d'ouvrages papier à tarifs préférentiels",
    description: "Rejoignez le réseau de diffusion officiel LAHA. Bénéficiez de remises de gros attractives, de packs thématiques semestriels et d'un approvisionnement rapide dans toute l'Afrique.",
    stats: [
      { value: "Jusqu'à -35%", label: "Remises Distributeur & Volume" },
      { value: "48h / 72h", label: "Réassort Logistique Régional" },
      { value: "+500", label: "Titres Scolaires & Supérieurs" }
    ],
    features: [
      {
        icon: Percent,
        title: "Remises de Gros Dégressives",
        description: "Marges commerciales avantageuses sur les volumes commandés pour les librairies, grossistes et associations d'étudiants."
      },
      {
        icon: Truck,
        title: "Logistique & Réassort Rapide",
        description: "Réseau logistique optimisé pour un approvisionnement continu sans rupture dans tout le réseau partenaire."
      },
      {
        icon: Layers,
        title: "Packs Étudiants Prêts à la Vente",
        description: "Lots thématiques par faculté (Droit, Gestion, Médecine) conditionnés pour les rentrées universitaires avec réductions clés en main."
      },
      {
        icon: BarChart3,
        title: "Commandes & Facturation Dédiée",
        description: "Espace en ligne pour suivre vos bons de commande, bordereaux de livraison et délais de paiement négociés."
      }
    ]
  }
];

export default function PartnersPublicPage() {
  const [activeTab, setActiveTab] = useState<PartnerType>("university");
  const [formSent, setFormSent] = useState(false);
  const [partnerType, setPartnerType] = useState<string>("university");
  const [orgName, setOrgName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [country, setCountry] = useState("BJ");
  const [message, setMessage] = useState("");

  const currentProfile = PARTNER_PROFILES.find((p) => p.id === activeTab) || PARTNER_PROFILES[0];

  const handleConventionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSent(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 space-y-16">
        
        {/* Hero Section Centré */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/10 text-navy border border-gold/20 text-xs font-bold uppercase tracking-wider">
            <Building2 className="w-3.5 h-3.5 text-gold" />
            Espaces Partenariats Stratégiques
          </div>
          
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-navy leading-tight">
            Bâtissons ensemble l'écosystème du livre et du savoir en Afrique
          </h1>
          
          <p className="text-sm sm:text-base text-foreground-muted leading-relaxed">
            Que vous représentiez une université, une maison d'édition indépendante ou un réseau de librairies/diffuseurs, LAHAThèque conçoit des solutions sur mesure.
          </p>
        </div>

        {/* Sélecteur de Profil Partenaire (3 Onglets) */}
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-1.5 bg-background-secondary rounded-2xl border border-border">
            {PARTNER_PROFILES.map((prof) => {
              const Icon = prof.icon;
              const isActive = activeTab === prof.id;
              return (
                <button
                  key={prof.id}
                  onClick={() => {
                    setActiveTab(prof.id);
                    setPartnerType(prof.id);
                  }}
                  className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer min-h-[44px] ${
                    isActive
                      ? "bg-navy text-white shadow-md"
                      : "text-foreground-muted hover:text-navy hover:bg-background"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-gold" : "text-foreground-muted"}`} />
                  <span>{prof.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Contenu Dynamique selon l'onglet actif */}
        <div className="space-y-12 animate-in fade-in duration-300">
          
          {/* Bannière Présentation Profil */}
          <div className="bg-background-secondary rounded-3xl border border-border p-8 sm:p-10 space-y-6 max-w-5xl mx-auto shadow-sm">
            <div className="space-y-3">
              <span className="text-[10px] uppercase font-bold text-gold bg-gold/10 px-3 py-1 rounded-full border border-gold/20">
                {currentProfile.badge}
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
                {currentProfile.title}
              </h2>
              <p className="text-xs sm:text-sm text-foreground-muted leading-relaxed max-w-3xl">
                {currentProfile.description}
              </p>
            </div>

            {/* Statistiques Profil */}
            <div className={`grid grid-cols-2 ${currentProfile.stats.length === 3 ? "md:grid-cols-3" : "md:grid-cols-4"} gap-4 pt-4 border-t border-border`}>
              {currentProfile.stats.map((st, sIdx) => (
                <div key={sIdx} className="bg-background p-4 rounded-2xl border border-border text-center space-y-1">
                  <span className="font-serif text-2xl sm:text-3xl font-bold text-navy block">{st.value}</span>
                  <span className="text-[11px] text-foreground-muted font-medium">{st.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Grille des Solutions Bento pour le profil */}
          <div className="space-y-6 max-w-6xl mx-auto">
            <div className="text-center space-y-2 max-w-2xl mx-auto">
              <span className="text-xs font-bold uppercase tracking-widest text-gold">
                Avantages &amp; Dispositifs
              </span>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-navy">
                Ce que nous mettons en place pour vous
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {currentProfile.features.map((feat, idx) => {
                const Icon = feat.icon;
                return (
                  <div 
                    key={idx}
                    className="bg-background-secondary p-6 sm:p-8 rounded-3xl border border-border space-y-4 hover:border-gold transition-all duration-300 shadow-sm flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-gold/10 text-gold flex items-center justify-center">
                        <Icon className="w-6 h-6" />
                      </div>
                      <h4 className="font-serif font-bold text-navy text-lg">
                        {feat.title}
                      </h4>
                      <p className="text-xs sm:text-sm text-foreground-muted leading-relaxed">
                        {feat.description}
                      </p>
                    </div>
                    <div className="pt-2 flex items-center gap-2 text-xs font-semibold text-gold">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Inclus dans le partenariat</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Défilement des Logos Universités & Institutions Partenaires */}
        <PartnerLogoMarquee 
          title="Universités et Établissements Partenaires"
          subtitle="Ils intègrent les ressources documentaires LAHAThèque au cœur de leurs cursus universitaires"
          showSectionHeader={true}
          className="rounded-3xl border border-border"
        />

        {/* Formulaire Convention & Prise de Contact Universel */}
        <div id="convention-form" className="bg-background-secondary rounded-3xl border border-border p-8 sm:p-12 max-w-5xl mx-auto shadow-md">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-5 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-gold/10 text-gold flex items-center justify-center">
                <Landmark className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
                Initier une collaboration ou demander un devis
              </h3>
              <p className="text-xs sm:text-sm text-foreground-muted leading-relaxed">
                Remplissez ce formulaire pour entrer en contact avec notre direction des partenariats et recevoir une proposition adaptée à vos volumes et exigences.
              </p>
              
              <div className="space-y-2.5 pt-2 text-xs text-foreground-muted">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-gold shrink-0" />
                  <span>Réponse garantie sous 24 à 48 heures ouvrées</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-gold shrink-0" />
                  <span>Démonstration technique et échantillonnage offerts</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-gold shrink-0" />
                  <span>Accompagnement commercial et logistique personnalisé</span>
                </div>
              </div>

              <div className="pt-4 border-t border-border space-y-2 text-xs text-foreground-muted">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gold shrink-0" />
                  <span>lahaeditions1@gmail.com</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gold shrink-0" />
                  <span>+229 01 97 89 82 42 / +228 90 54 20 44</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 bg-background p-6 sm:p-8 rounded-2xl border border-border shadow-sm">
              {formSent ? (
                <div className="text-center py-8 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-gold/10 text-gold flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="font-serif font-bold text-navy text-lg">Demande de partenariat transmise</h3>
                  <p className="text-xs text-foreground-muted max-w-sm mx-auto">
                    Notre équipe des partenariats et relations institutionnelles prendra contact avec vous dans les plus brefs délais.
                  </p>
                  <button
                    onClick={() => setFormSent(false)}
                    className="px-5 py-2 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors"
                  >
                    Envoyer une autre demande
                  </button>
                </div>
              ) : (
                <form onSubmit={handleConventionSubmit} className="space-y-4">
                  
                  {/* Type de Partenariat */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-navy block mb-1.5">
                      Type de Partenariat *
                    </label>
                    <select
                      value={partnerType}
                      onChange={(e) => setPartnerType(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-xs sm:text-sm focus:outline-none focus:border-navy focus:ring-2 focus:ring-gold/30"
                    >
                      <option value="university">Université / Faculté / Grande École</option>
                      <option value="publisher">Éditeur / Maison d'Édition</option>
                      <option value="distributor">Diffuseur / Librairie / Grossiste Papier</option>
                      <option value="institution">Ministère / Institution Publique</option>
                    </select>
                  </div>

                  {/* Nom de l'organisation */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-navy block mb-1.5">
                      Nom de l'organisation ou de l'entreprise *
                    </label>
                    <input
                      type="text"
                      required
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      placeholder="Ex: Université de Cocody, Librairie Clarté, Éditions..."
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-xs sm:text-sm focus:outline-none focus:border-navy focus:ring-2 focus:ring-gold/30"
                    />
                  </div>

                  {/* Nom & Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-navy block mb-1.5">
                        Nom &amp; Fonction du contact *
                      </label>
                      <input
                        type="text"
                        required
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="Ex: Dr. Diallo, Responsable des achats..."
                        className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-xs sm:text-sm focus:outline-none focus:border-navy focus:ring-2 focus:ring-gold/30"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-navy block mb-1.5">
                        Email professionnel *
                      </label>
                      <input
                        type="email"
                        required
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="contact@organisation.com"
                        className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-xs sm:text-sm focus:outline-none focus:border-navy focus:ring-2 focus:ring-gold/30"
                      />
                    </div>
                  </div>

                  {/* Téléphone & Pays */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-navy block mb-1.5">
                        Téléphone / WhatsApp *
                      </label>
                      <PhoneInput
                        value={contactPhone}
                        onChange={setContactPhone}
                        className="bg-background min-h-[44px]"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-navy block mb-1.5">
                        Pays *
                      </label>
                      <select
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-xs sm:text-sm focus:outline-none focus:border-navy focus:ring-2 focus:ring-gold/30"
                      >
                        <option value="BJ">Bénin</option>
                        <option value="CI">Côte d'Ivoire</option>
                        <option value="SN">Sénégal</option>
                        <option value="TG">Togo</option>
                        <option value="GN">Guinée</option>
                        <option value="GA">Gabon</option>
                        <option value="CD">RDC (Congo)</option>
                        <option value="OTHER">Autre pays</option>
                      </select>
                    </div>
                  </div>

                  {/* Message / Besoins */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-navy block mb-1.5">
                      Détails de votre besoin ou projet
                    </label>
                    <textarea
                      rows={3}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Précisez votre besoin (nombre d'étudiants, titres recherchés, commande de packs papier, distribution...)"
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-xs sm:text-sm focus:outline-none focus:border-navy focus:ring-2 focus:ring-gold/30 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 px-4 rounded-xl bg-navy hover:bg-navy-hover text-white text-xs sm:text-sm font-bold shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer pt-3 min-h-[44px]"
                  >
                    <Send className="w-4 h-4 text-gold" />
                    Transmettre ma demande de partenariat
                  </button>
                </form>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
