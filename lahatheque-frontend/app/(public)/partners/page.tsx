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
  Send
} from "lucide-react";

const INSTITUTIONS_LIST = [
  {
    name: "Université d'Abomey-Calavi (UAC)",
    country: "Bénin",
    tag: "UAC",
    faculties: "FADESP, FASEG, FSS, FAST",
    students: "+45 000 étudiants",
    description: "Convention globale pour les facultés de droit, sciences économiques et sciences de la santé."
  },
  {
    name: "Université Félix Houphouët-Boigny (UFHB)",
    country: "Côte d'Ivoire",
    tag: "UFHB",
    faculties: "Sciences Éco, Droit, Médecine, SHS",
    students: "+55 000 étudiants",
    description: "Accès simultané sur les campus de Cocody avec intégration aux portails documentaires."
  },
  {
    name: "Université Cheikh Anta Diop (UCAD)",
    country: "Sénégal",
    tag: "UCAD",
    faculties: "FSJP, FASEG, FMPO, ESP",
    students: "+60 000 étudiants",
    description: "Bouquets spécialisés en droit OHADA, politiques publiques et sciences médicales."
  },
  {
    name: "Université de Lomé (UL)",
    country: "Togo",
    tag: "UL",
    faculties: "FDD, FASEG, FDS, FSS",
    students: "+30 000 étudiants",
    description: "Déploiement complet des manuels de référence SYSCOHADA et droit des affaires."
  },
  {
    name: "Université Abdou Moumouni (UAM)",
    country: "Niger",
    tag: "UAM",
    faculties: "FSEJ, FAST, FSS",
    students: "+25 000 étudiants",
    description: "Accès numérique sécurisé aux cours magistraux et thèses de doctorat."
  },
  {
    name: "Université Gamal Abdel Nasser (UGANC)",
    country: "Guinée",
    tag: "UGANC",
    faculties: "Médecine, Droit, Sciences Éco",
    students: "+20 000 étudiants",
    description: "Programme d'enrichissement documentaire pour les cycles Licence et Master LMD."
  }
];

const BENTO_FEATURES = [
  {
    icon: Users,
    title: "Accès Simultané Illimité",
    description: "Finies les ruptures de stock à la bibliothèque universitaire. Tous vos étudiants consultent le même manuel simultanément, sur ordinateur, tablette et smartphone.",
    badge: "Disponibilité 24/7"
  },
  {
    icon: KeyRound,
    title: "Connexion IP & SSO Sécurisée",
    description: "Authentification transparente via les réseaux de vos campus ou par délégation d'annuaire (OAuth2 / SAML / adresses email institutionnelles).",
    badge: "Intégration Facile"
  },
  {
    icon: BarChart3,
    title: "Tableau de Bord Bibliothécaire",
    description: "Statistiques d'utilisation en temps réel par faculté, filière et ouvrage pour mesurer précisément l'impact pédagogique et la fréquentation.",
    badge: "Analytique Avancée"
  },
  {
    icon: GraduationCap,
    title: "Valorisation de la Recherche Interne",
    description: "Intégrez les thèses, actes de colloques et revues scientifiques de vos propres enseignants dans notre réseau panafricain.",
    badge: "Rayonnement Africain"
  }
];

export default function PartnersPublicPage() {
  const [formSent, setFormSent] = useState(false);
  const [institutionName, setInstitutionName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [studentCount, setStudentCount] = useState("1000-5000");

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
            Partenariat Institutionnel &amp; Universitaire
          </div>
          
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-navy leading-tight">
            La bibliothèque numérique de référence pour vos facultés et étudiants
          </h1>
          
          <p className="text-sm sm:text-base text-foreground-muted leading-relaxed">
            Offrez à vos apprenants et enseignants un accès sécurisé et illimité à des milliers d'ouvrages académiques africains, validés par des pairs et conformes aux maquettes LMD.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <a
              href="#convention-form"
              className="bg-gold hover:bg-gold-dark text-white px-7 py-3.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 flex items-center gap-2 shadow-md"
            >
              Demander une convention partenaire
              <ArrowRight className="w-4 h-4" />
            </a>
            <Link
              href="/catalog"
              className="bg-background-secondary border border-border hover:border-gold text-navy px-7 py-3.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200"
            >
              Explorer les ressources disponibles
            </Link>
          </div>
        </div>

        {/* Chiffres Clés Bento */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
          <div className="bg-background-secondary p-6 rounded-2xl border border-border text-center space-y-1 shadow-sm">
            <span className="font-serif text-3xl sm:text-4xl font-bold text-navy block">+160</span>
            <span className="text-xs text-foreground-muted font-medium">Établissements Partenaires</span>
          </div>
          <div className="bg-background-secondary p-6 rounded-2xl border border-border text-center space-y-1 shadow-sm">
            <span className="font-serif text-3xl sm:text-4xl font-bold text-gold block">+120 000</span>
            <span className="text-xs text-foreground-muted font-medium">Étudiants &amp; Chercheurs</span>
          </div>
          <div className="bg-background-secondary p-6 rounded-2xl border border-border text-center space-y-1 shadow-sm">
            <span className="font-serif text-3xl sm:text-4xl font-bold text-navy block">+10 000</span>
            <span className="text-xs text-foreground-muted font-medium">Manuels &amp; Publications</span>
          </div>
          <div className="bg-background-secondary p-6 rounded-2xl border border-border text-center space-y-1 shadow-sm">
            <span className="font-serif text-3xl sm:text-4xl font-bold text-gold block">100%</span>
            <span className="text-xs text-foreground-muted font-medium">Sécurité DRM Tatouée</span>
          </div>
        </div>

        {/* Bento Grid des Solutions pour Établissements */}
        <div className="space-y-6 max-w-6xl mx-auto">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-widest text-gold">
              Services &amp; Avantages
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
              Une infrastructure pensée pour les exigences universitaires
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {BENTO_FEATURES.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div 
                  key={idx}
                  className="bg-background-secondary p-8 rounded-3xl border border-border space-y-4 hover:border-gold transition-all duration-300 shadow-sm hover:shadow-md flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-gold/10 text-gold flex items-center justify-center">
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-navy bg-background px-3 py-1 rounded-full border border-border">
                        {feat.badge}
                      </span>
                    </div>

                    <h3 className="font-serif font-bold text-navy text-xl">
                      {feat.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-foreground-muted leading-relaxed">
                      {feat.description}
                    </p>
                  </div>

                  <div className="pt-2 flex items-center gap-2 text-xs font-semibold text-gold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Inclus dans la convention partenaire</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Grille des Établissements Partenaires */}
        <div className="space-y-8 max-w-6xl mx-auto">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-widest text-gold">
              Réseau Institutionnel
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
              Ils font confiance à LAHAThèque
            </h2>
            <p className="text-xs sm:text-sm text-foreground-muted">
              Découvrez quelques-uns des établissements partenaires déployant notre catalogue.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {INSTITUTIONS_LIST.map((inst, i) => (
              <div 
                key={i}
                className="bg-background-secondary p-6 rounded-3xl border border-border space-y-4 shadow-sm hover:border-gold transition-all duration-300 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-navy bg-gold/10 px-2.5 py-0.5 rounded-md border border-gold/20">
                      {inst.tag}
                    </span>
                    <span className="text-xs font-semibold text-foreground-muted">
                      {inst.country}
                    </span>
                  </div>

                  <h3 className="font-serif font-bold text-navy text-base leading-snug">
                    {inst.name}
                  </h3>

                  <p className="text-xs text-foreground-muted leading-relaxed">
                    {inst.description}
                  </p>
                </div>

                <div className="space-y-2 pt-4 border-t border-border text-xs">
                  <div className="flex items-center justify-between text-foreground-muted">
                    <span>Facultés affiliées :</span>
                    <span className="font-semibold text-navy">{inst.faculties}</span>
                  </div>
                  <div className="flex items-center justify-between text-foreground-muted">
                    <span>Effectif :</span>
                    <span className="font-bold text-gold">{inst.students}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Formulaire Convention Partenaire Bento */}
        <div id="convention-form" className="bg-background-secondary rounded-3xl border border-border p-8 sm:p-12 max-w-5xl mx-auto shadow-md">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-5 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-gold/10 text-gold flex items-center justify-center">
                <Landmark className="w-6 h-6" />
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
                Demandez une convention pour votre établissement
              </h2>
              <p className="text-xs sm:text-sm text-foreground-muted leading-relaxed">
                Remplissez ce formulaire pour recevoir une proposition tarifaire dégressive et planifier une démonstration technique avec notre équipe des partenariats.
              </p>
              <div className="space-y-2 pt-2 text-xs text-foreground-muted">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-gold shrink-0" />
                  <span>Devis sur mesure selon vos effectifs</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-gold shrink-0" />
                  <span>Période d'essai institutionnelle offerte (30 jours)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-gold shrink-0" />
                  <span>Accompagnement et formation de vos bibliothécaires</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 bg-background p-6 sm:p-8 rounded-2xl border border-border shadow-sm">
              {formSent ? (
                <div className="text-center py-8 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-gold/10 text-gold flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h3 className="font-serif font-bold text-navy text-lg">Demande transmise avec succès</h3>
                  <p className="text-xs text-foreground-muted max-w-sm mx-auto">
                    Notre direction des partenariats examinera votre demande et prendra contact avec vous sous 24h ouvrées.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleConventionSubmit} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-navy block mb-1.5">
                      Nom de l'établissement *
                    </label>
                    <input
                      type="text"
                      required
                      value={institutionName}
                      onChange={(e) => setInstitutionName(e.target.value)}
                      placeholder="Ex: Université de Cocody, Faculté de Droit..."
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-xs sm:text-sm focus:outline-none focus:border-navy focus:ring-2 focus:ring-gold/30"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-navy block mb-1.5">
                        Nom &amp; Titre du contact *
                      </label>
                      <input
                        type="text"
                        required
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="Ex: Doyen Dr. M. Diallo"
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
                        placeholder="doyen@institution.edu"
                        className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-xs sm:text-sm focus:outline-none focus:border-navy focus:ring-2 focus:ring-gold/30"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-navy block mb-1.5">
                      Estimation des effectifs étudiants
                    </label>
                    <select
                      value={studentCount}
                      onChange={(e) => setStudentCount(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-xs sm:text-sm focus:outline-none focus:border-navy focus:ring-2 focus:ring-gold/30"
                    >
                      <option value="moins-1000">Moins de 1 000 étudiants</option>
                      <option value="1000-5000">1 000 à 5 000 étudiants</option>
                      <option value="5000-20000">5 000 à 20 000 étudiants</option>
                      <option value="plus-20000">Plus de 20 000 étudiants</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 px-4 rounded-xl bg-navy hover:bg-navy-hover text-white text-xs sm:text-sm font-bold shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer pt-3"
                  >
                    <Send className="w-4 h-4 text-gold" />
                    Envoyer ma demande de convention
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
