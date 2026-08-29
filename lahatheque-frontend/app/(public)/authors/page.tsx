"use client";

import React from "react";
import Link from "next/link";
import { 
  PenTool, 
  ShieldCheck, 
  DollarSign, 
  Globe, 
  ArrowRight, 
  BookOpen, 
  CheckCircle2, 
  Users, 
  Sparkles,
  FileCheck,
  Building2,
  Clock
} from "lucide-react";
import { Book as Book3D } from "@/components/ui/book";

const featuredAuthors = [
  {
    name: "Pr. M. N'DIA",
    role: "Professeur Titulaire de Droit Privé",
    institution: "Partenaire Académique Bénin",
    speciality: "Droit des obligations & Droit commercial OHADA",
    bookTitle: "Droit des obligations",
    bookCoverColor: "var(--navy)",
    bookCoverTextColor: "var(--gold)",
    bookId: "book-001"
  },
  {
    name: "Dr. K. YAO",
    role: "Maître de Conférences en Économie",
    institution: "Partenaire Académique Côte d'Ivoire",
    speciality: "Macroéconomie & Politiques Monétaires UEMOA",
    bookTitle: "Économie monétaire",
    bookCoverColor: "var(--background-secondary)",
    bookCoverTextColor: "var(--navy)",
    bookId: "book-002"
  },
  {
    name: "Pr. E. TRAORÉ",
    role: "Directeur de Recherche en Gestion",
    institution: "Partenaire Académique Sénégal",
    speciality: "Comptabilité Approfondie & Normes SYSCOHADA",
    bookTitle: "Comptabilité approfondie",
    bookCoverColor: "var(--navy)",
    bookCoverTextColor: "var(--gold)",
    bookId: "book-003"
  },
  {
    name: "Pr. A. DIALLO",
    role: "Doyen Honoraire de Faculté de Droit",
    institution: "Partenaire Académique Guinée",
    speciality: "Droit Constitutionnel & Institutions Comparées",
    bookTitle: "Droit constitutionnel",
    bookCoverColor: "var(--background-secondary)",
    bookCoverTextColor: "var(--navy)",
    bookId: "book-004"
  }
];

const publicationSteps = [
  {
    step: "01",
    title: "Soumission du Manuscrit",
    desc: "Déposez votre projet d'ouvrage en PDF via notre formulaire dédié. Notre équipe vérifie la conformité académique sous 48h."
  },
  {
    step: "02",
    title: "Évaluation Scientifique",
    desc: "Votre texte est examiné en double aveugle par des pairs spécialistes de votre discipline pour garantir l'excellence."
  },
  {
    step: "03",
    title: "Mise en Page & Contrat",
    desc: "Nos maquettistes préparent l'édition numérique et imprimée. Un contrat clair formalise vos taux de redevance."
  },
  {
    step: "04",
    title: "Distribution & Redevances",
    desc: "Votre ouvrage est diffusé auprès des institutions partenaires. Suivez vos ventes et versements en temps réel sur votre dashboard."
  }
];

export default function AuthorsPublicPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      
      {/* Hero Section */}
      <section className="relative pt-12 pb-16 md:pt-20 md:pb-24 bg-background-secondary border-b border-border overflow-hidden px-6 md:px-12">
        <div className="max-w-[1920px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 text-navy border border-gold/20 text-xs font-bold uppercase tracking-wider">
              <PenTool className="w-3.5 h-3.5 text-gold" />
              Espace Auteurs &amp; Chercheurs
            </div>
            
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-6xl text-navy font-bold leading-[1.15]">
              Publiez vos travaux.<br />
              <span className="text-gold">Rayonnez en Afrique et dans le monde.</span>
            </h1>
            
            <p className="text-base sm:text-lg text-foreground-muted max-w-2xl mx-auto lg:mx-0 leading-relaxed font-sans">
              Rejoignez la première communauté d'enseignants-chercheurs, professeurs et experts qui font confiance aux Éditions LAHA et à LAHAThèque pour publier, protéger et valoriser leurs ouvrages universitaires.
            </p>

            <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4 pt-4">
              <Link
                href="/submit"
                className="bg-gold hover:bg-gold-dark text-white px-8 py-3.5 rounded font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-md"
              >
                Déposer un manuscrit
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/login"
                className="bg-background border border-border hover:border-gold text-foreground hover:text-navy px-8 py-3.5 rounded font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2"
              >
                Accéder à mon espace auteur
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5 grid grid-cols-2 gap-4">
            <div className="bg-background p-6 rounded-2xl border border-border shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-lg bg-gold/10 text-gold flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-navy text-base">Protection DRM</h3>
              <p className="text-xs text-foreground-muted leading-relaxed">
                Tatouage numérique dynamique nominatif contre le piratage et l'extraction.
              </p>
            </div>

            <div className="bg-background p-6 rounded-2xl border border-border shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-lg bg-gold/10 text-gold flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-navy text-base">Redevances Claires</h3>
              <p className="text-xs text-foreground-muted leading-relaxed">
                Suivi transparent des consultations, ventes unitaires et abonnements.
              </p>
            </div>

            <div className="bg-background p-6 rounded-2xl border border-border shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-lg bg-gold/10 text-gold flex items-center justify-center">
                <Globe className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-navy text-base">Réseau Panafricain</h3>
              <p className="text-xs text-foreground-muted leading-relaxed">
                Diffusion dans plus de 160 institutions et bibliothèques partenaires.
              </p>
            </div>

            <div className="bg-background p-6 rounded-2xl border border-border shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-lg bg-gold/10 text-gold flex items-center justify-center">
                <FileCheck className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-navy text-base">Comité Scientifique</h3>
              <p className="text-xs text-foreground-muted leading-relaxed">
                Validation rigoureuse par des professeurs émérites de votre domaine.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* Auteurs à l'honneur */}
      <section className="py-20 px-6 md:px-12 max-w-[1920px] mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-bold text-gold uppercase tracking-widest">
            Excellence &amp; Savoir
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-navy">
            Nos auteurs et chercheurs partenaires
          </h2>
          <p className="text-sm text-foreground-muted leading-relaxed">
            Découvrez quelques-unes des figures académiques majeures qui enrichissent le catalogue LAHAThèque de leurs traités et manuels de référence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {featuredAuthors.map((author, index) => (
            <div 
              key={index}
              className="bg-background-secondary rounded-2xl border border-border p-6 flex flex-col justify-between space-y-6 hover:border-gold transition-all duration-300 shadow-sm hover:shadow-md"
            >
              <div className="flex justify-center py-2">
                <Book3D 
                  title={author.bookTitle}
                  author={author.name}
                  variant="lahatheque"
                  color={author.bookCoverColor}
                  textColor={author.bookCoverTextColor}
                  width={{ sm: 110, md: 120, lg: 120, xl: 120 }}
                  textured
                />
              </div>

              <div className="space-y-2 border-t border-border pt-4">
                <h3 className="font-serif font-bold text-navy text-lg">{author.name}</h3>
                <p className="text-xs font-semibold text-gold">{author.role}</p>
                <p className="text-[11px] text-foreground-muted flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-gold shrink-0" />
                  {author.institution}
                </p>
                <p className="text-xs text-foreground-muted/90 pt-2 leading-relaxed">
                  {author.speciality}
                </p>
              </div>

              <Link
                href={`/catalog/${author.bookId}`}
                className="w-full py-2.5 rounded-lg bg-navy hover:bg-navy-hover text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                Découvrir l'ouvrage
                <ArrowRight className="w-3.5 h-3.5 text-gold" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Processus de publication */}
      <section className="py-20 px-6 md:px-12 bg-background-secondary border-y border-border">
        <div className="max-w-[1920px] mx-auto">
          
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold text-gold uppercase tracking-widest">
              Processus Éditorial
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-navy">
              Comment publier votre livre sur LAHAThèque ?
            </h2>
            <p className="text-sm text-foreground-muted">
              Un parcours transparent et rigoureux, de la soumission à la distribution internationale.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {publicationSteps.map((s, idx) => (
              <div key={idx} className="bg-background rounded-2xl border border-border p-6 space-y-4 shadow-sm relative">
                <span className="text-2xl font-serif font-bold text-gold/60">{s.step}</span>
                <h3 className="font-serif font-bold text-navy text-lg">{s.title}</h3>
                <p className="text-xs text-foreground-muted leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 px-6 md:px-12 max-w-4xl mx-auto text-center space-y-8">
        <div className="w-14 h-14 rounded-full bg-gold/10 text-gold flex items-center justify-center mx-auto">
          <Sparkles className="w-7 h-7" />
        </div>
        
        <div className="space-y-3">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-navy">
            Prêt à faire éditer votre manuscrit ?
          </h2>
          <p className="text-sm sm:text-base text-foreground-muted max-w-xl mx-auto leading-relaxed">
            Transmettez-nous votre projet. Notre comité de lecture vous répondra avec un avis éditorial sous 15 jours ouvrés.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-4 pt-2">
          <Link
            href="/submit"
            className="bg-gold hover:bg-gold-dark text-white px-8 py-4 rounded font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-md"
          >
            Déposer mon manuscrit en ligne
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/contact"
            className="bg-background border border-border hover:border-gold text-foreground hover:text-navy px-8 py-4 rounded font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2"
          >
            Poser une question à l'équipe éditoriale
          </Link>
        </div>
      </section>

    </div>
  );
}
