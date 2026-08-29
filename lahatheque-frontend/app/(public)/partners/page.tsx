"use client";

import React from "react";
import Link from "next/link";
import { 
  Building2, 
  ShieldCheck, 
  Users, 
  BookOpen, 
  ArrowRight, 
  CheckCircle2, 
  BarChart3, 
  KeyRound, 
  Globe, 
  GraduationCap,
  Sparkles,
  FileSpreadsheet,
  Headphones
} from "lucide-react";

const partnerInstitutions = [
  {
    name: "Université d'Abomey-Calavi (UAC)",
    country: "Bénin (BJ)",
    students: "+45 000 étudiants affiliés",
    domains: "Droit, Économie, Sciences Médicales, Agronomie",
    status: "Partenaire Certifié"
  },
  {
    name: "Université Félix Houphouët-Boigny (UFHB)",
    country: "Côte d'Ivoire (CI)",
    students: "+55 000 étudiants affiliés",
    domains: "Sciences de Gestion, Droit Privé, Sciences Humaines",
    status: "Partenaire Certifié"
  },
  {
    name: "Université Cheikh Anta Diop (UCAD)",
    country: "Sénégal (SN)",
    students: "+60 000 étudiants affiliés",
    domains: "Sciences Politiques, Économie du Développement, Médecine",
    status: "Partenaire Certifié"
  },
  {
    name: "Université de Lomé (UL)",
    country: "Togo (TG)",
    students: "+30 000 étudiants affiliés",
    domains: "Gestion SYSCOHADA, Droit des Affaires, Technologies",
    status: "Partenaire Certifié"
  }
];

const partnerBenefits = [
  {
    icon: Users,
    title: "Accès Simultané Illimité",
    description: "Vos étudiants accèdent aux ouvrages et manuels recommandés 24h/24, sans file d'attente ni quota d'exemplaires papier."
  },
  {
    icon: KeyRound,
    title: "Authentification Simplifiée & SSO",
    description: "Connexion sécurisée via les adresses institutionnelles ou plages IP du campus pour une expérience fluide sans friction."
  },
  {
    icon: BarChart3,
    title: "Tableau de Bord Bibliothécaire",
    description: "Suivez en temps réel les volumes de consultation, les disciplines les plus actives et le retour sur investissement documentaire."
  },
  {
    icon: GraduationCap,
    title: "Valorisation des Publications Internes",
    description: "Intégrez les thèses, mémoires d'excellence et revues de vos facultés dans le réseau panafricain LAHAThèque."
  }
];

export default function PartnersPublicPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      
      {/* Hero Section */}
      <section className="relative pt-12 pb-16 md:pt-20 md:pb-24 bg-background-secondary border-b border-border overflow-hidden px-6 md:px-12">
        <div className="max-w-[1920px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 text-navy border border-gold/20 text-xs font-bold uppercase tracking-wider">
              <Building2 className="w-3.5 h-3.5 text-gold" />
              Partenariat &amp; Institutions
            </div>
            
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-6xl text-navy font-bold leading-[1.15]">
              La bibliothèque numérique de référence pour vos facultés et étudiants.
            </h1>
            
            <p className="text-base sm:text-lg text-foreground-muted max-w-2xl mx-auto lg:mx-0 leading-relaxed font-sans">
              Équipez vos institutions, universités et centres de recherche d'une infrastructure documentaire moderne, sécurisée et 100% adaptée aux programmes académiques africains.
            </p>

            <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4 pt-4">
              <Link
                href="/contact"
                className="bg-gold hover:bg-gold-dark text-white px-8 py-3.5 rounded font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-md"
              >
                Demander une convention partenaire
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/subscriptions"
                className="bg-background border border-border hover:border-gold text-foreground hover:text-navy px-8 py-3.5 rounded font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2"
              >
                Découvrir les bouquets institutionnels
              </Link>
            </div>
          </div>

          {/* Stats Box */}
          <div className="lg:col-span-5 bg-background p-8 rounded-3xl border border-border shadow-lg space-y-6">
            <div className="space-y-2 border-b border-border pb-4">
              <span className="text-xs font-bold text-gold uppercase tracking-wider">Impact Académique</span>
              <h3 className="font-serif text-xl font-bold text-navy">Le réseau LAHAThèque en chiffres</h3>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <span className="block text-3xl font-serif font-bold text-navy">+160</span>
                <span className="text-xs text-foreground-muted">Établissements partenaires</span>
              </div>
              <div>
                <span className="block text-3xl font-serif font-bold text-gold">+120 000</span>
                <span className="text-xs text-foreground-muted">Étudiants connectés</span>
              </div>
              <div>
                <span className="block text-3xl font-serif font-bold text-navy">+10 000</span>
                <span className="text-xs text-foreground-muted">Ouvrages académiques</span>
              </div>
              <div>
                <span className="block text-3xl font-serif font-bold text-gold">100%</span>
                <span className="text-xs text-foreground-muted">Sécurisé &amp; Tatoué DRM</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-background-secondary border border-border text-xs text-foreground-muted flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-gold shrink-0" />
              <span>Conforme aux exigences d'accréditation et aux maquettes LMD.</span>
            </div>
          </div>

        </div>
      </section>

      {/* Solutions pour les Partenaires */}
      <section className="py-20 px-6 md:px-12 max-w-[1920px] mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-bold text-gold uppercase tracking-widest">
            Services Institutionnels
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-navy">
            Une solution pensée pour les exigences universitaires
          </h2>
          <p className="text-sm text-foreground-muted leading-relaxed">
            Conçue pour simplifier la gestion documentaire des doyens, directeurs académiques et conservateurs de bibliothèques.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {partnerBenefits.map((b, idx) => {
            const Icon = b.icon;
            return (
              <div 
                key={idx}
                className="bg-background-secondary p-8 rounded-2xl border border-border space-y-4 hover:border-gold transition-all duration-300 shadow-sm hover:shadow-md"
              >
                <div className="w-12 h-12 rounded-xl bg-gold/10 text-gold flex items-center justify-center">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-serif font-bold text-navy text-lg">{b.title}</h3>
                <p className="text-xs text-foreground-muted leading-relaxed">{b.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Établissements Partenaires à l'Honneur */}
      <section className="py-20 px-6 md:px-12 bg-background-secondary border-y border-border">
        <div className="max-w-[1920px] mx-auto">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold text-gold uppercase tracking-widest">
              Réseau Institutionnel
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-navy">
              Ils font confiance à LAHAThèque
            </h2>
            <p className="text-sm text-foreground-muted">
              Découvrez quelques-uns des établissements d'enseignement supérieur partenaires de notre plateforme.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {partnerInstitutions.map((inst, idx) => (
              <div 
                key={idx}
                className="bg-background p-6 rounded-2xl border border-border space-y-4 shadow-sm flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gold bg-gold/10 px-2 py-0.5 rounded">
                      {inst.country}
                    </span>
                    <span className="text-[10px] text-foreground-muted font-medium">
                      {inst.status}
                    </span>
                  </div>
                  <h3 className="font-serif font-bold text-navy text-base pt-1">{inst.name}</h3>
                  <p className="text-xs font-semibold text-navy">{inst.students}</p>
                  <p className="text-xs text-foreground-muted leading-relaxed pt-1">
                    Filières : {inst.domains}
                  </p>
                </div>

                <div className="pt-4 border-t border-border flex items-center justify-between text-xs text-gold font-medium">
                  <span>Accès illimité actif</span>
                  <CheckCircle2 className="w-4 h-4 text-gold" />
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* CTA Final Convention */}
      <section className="py-20 px-6 md:px-12 max-w-4xl mx-auto text-center space-y-8">
        <div className="w-14 h-14 rounded-full bg-gold/10 text-gold flex items-center justify-center mx-auto">
          <Building2 className="w-7 h-7" />
        </div>
        
        <div className="space-y-3">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-navy">
            Rejoignez le réseau des institutions partenaires
          </h2>
          <p className="text-sm sm:text-base text-foreground-muted max-w-xl mx-auto leading-relaxed">
            Prenez rendez-vous avec notre direction des partenariats pour établir une convention sur mesure adaptée à la taille de vos effectifs.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-4 pt-2">
          <Link
            href="/contact"
            className="bg-gold hover:bg-gold-dark text-white px-8 py-4 rounded font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-md"
          >
            Prendre contact avec notre équipe
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/catalog"
            className="bg-background border border-border hover:border-gold text-foreground hover:text-navy px-8 py-4 rounded font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2"
          >
            Consulter les ouvrages disponibles
          </Link>
        </div>
      </section>

    </div>
  );
}
