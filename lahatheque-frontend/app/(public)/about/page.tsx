"use client";

import Link from "next/link";
import { 
  BookOpen, 
  GraduationCap, 
  Sparkles, 
  Book, 
  Sun, 
  ArrowRight, 
  ShieldCheck, 
  Globe, 
  Award, 
  Users, 
  Mail 
} from "lucide-react";
import { SavoirAfriqueSection } from "@/components/features/about/savoir-afrique-section";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground py-6 sm:py-8 lg:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 lg:space-y-16">
        
        {/* 1. HERO BANNER PRINCIPALE (Image + Navy Fade) */}
        <section className="relative rounded-3xl overflow-hidden shadow-xl bg-navy border border-navy-hover">
          
          {/* Photo de fond sur la droite */}
          <div className="absolute inset-0 z-0 flex justify-end">
            <div className="w-full lg:w-3/5 h-full relative">
              <img
                src="/about-hero-section.jpg"
                alt="À propos de LAHAThèque - La connaissance sans frontières"
                className="w-full h-full object-cover object-center opacity-20 sm:opacity-30 lg:opacity-100 transition-opacity duration-300"
              />
              {/* Dégradé de fondu de gauche (Navy vers transparent) pour Desktop */}
              <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/90 to-transparent hidden lg:block" />
              {/* Overlay mobile sombre et protecteur avec dégradé vertical */}
              <div className="absolute inset-0 bg-gradient-to-b from-navy-dark/95 via-navy/90 to-navy-dark/95 lg:hidden" />
            </div>
          </div>

          {/* Badges de confiance flottants en haut à droite */}
          <div className="absolute top-6 right-6 z-20 hidden md:flex flex-col gap-2.5">
            <div className="flex items-center gap-2 bg-navy-dark border border-navy-hover px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-lg">
              <GraduationCap className="w-4 h-4 text-gold" />
              <span>Excellence académique</span>
            </div>
            <div className="flex items-center gap-2 bg-navy-dark border border-navy-hover px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-lg">
              <Globe className="w-4 h-4 text-gold" />
              <span>Rayonnement panafricain</span>
            </div>
          </div>

          {/* Contenu Textuel du Hero (Gauche) */}
          <div className="relative z-10 max-w-2xl p-6 sm:p-10 lg:p-14 space-y-5 sm:space-y-6 text-white">
            
            <div className="text-xs font-bold uppercase tracking-widest text-gold">
              Qui sommes-nous ?
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-white">
              La connaissance sans <span className="text-gold">frontières.</span>
            </h1>

            <p className="font-sans text-xs sm:text-sm md:text-base text-white/85 leading-relaxed max-w-xl">
              Une bibliothèque universitaire et académique moderne pensée pour l'Afrique et ouverte sur le monde, où chaque ouvrage transforme des vies et élève les esprits.
            </p>

            {/* Checklist 4 points avec icônes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="flex items-center gap-2.5 text-xs text-white/90">
                <BookOpen className="w-4 h-4 text-gold shrink-0" />
                <span>Fonds universitaire certifié</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-white/90">
                <Award className="w-4 h-4 text-gold shrink-0" />
                <span>Comités scientifiques reconnus</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-white/90">
                <ShieldCheck className="w-4 h-4 text-gold shrink-0" />
                <span>Protection et valorisation DRM</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-white/90">
                <Users className="w-4 h-4 text-gold shrink-0" />
                <span>Égalité d'accès aux ressources</span>
              </div>
            </div>

            {/* CTA Boutons */}
            <div className="pt-3 flex flex-wrap gap-4">
              <Link
                href="/catalog"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gold hover:bg-gold-light text-navy font-sans font-bold text-xs sm:text-sm shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer group"
              >
                <span>Explorer le catalogue</span>
                <ArrowRight className="w-4 h-4 text-navy group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/authors"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-navy-hover hover:bg-navy-dark text-white font-sans font-bold text-xs sm:text-sm border border-navy-hover transition-all duration-200 cursor-pointer"
              >
                <span>Espace Auteurs</span>
              </Link>
            </div>

          </div>

        </section>

        {/* 2. STORYTELLING SECTION (Notre Défi & Vision - Épuré et fluide) */}
        <section className="py-6 sm:py-10">
          <div className="max-w-4xl mx-auto space-y-10">
            
            {/* En-tête */}
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-widest text-gold">
                Le défi de l'accès au savoir
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-navy">
                Pourquoi nous avons créé LAHAThèque
              </h2>
            </div>

            {/* Contenu narratif */}
            <div className="space-y-6 text-foreground/90 font-sans text-sm sm:text-base leading-relaxed">
              <p>
                Dans de nombreuses régions d'Afrique, des millions d'étudiants, de chercheurs, d'enseignants et de passionnés de savoir partagent le même combat silencieux : accéder aux ouvrages dont ils ont besoin pour apprendre, réussir et transmettre.
              </p>
              <p>
                Pendant longtemps, trouver un manuel universitaire, une revue scientifique ou un ouvrage spécialisé relevait du parcours du combattant. Les bibliothèques physiques étaient sous-dotées, les importations trop onéreuses, et les délais souvent incompatibles avec l'urgence académique.
              </p>
              
              <div className="my-8 bg-background-secondary p-6 sm:p-8 rounded-2xl border border-border">
                <p className="font-serif text-base sm:text-lg text-navy font-bold leading-relaxed">
                  LAHAThèque est bien plus qu'un diffuseur d'ouvrages numériques. C'est une passerelle entre le savoir et celles et ceux qui en ont besoin : une bibliothèque moderne pensée pour l'Afrique et connectée au monde.
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="font-serif text-xl font-bold text-navy">
                  Notre Vision
                </h3>
                <p>
                  Bâtir la première plateforme universitaire panafricaine capable de rendre accessibles des dizaines de milliers d'ouvrages scientifiques, juridiques, économiques et techniques, tout en protégeant les droits patrimoniaux et moraux des auteurs et éditeurs.
                </p>
              </div>

              <div className="space-y-4 pt-4">
                <h3 className="font-serif text-xl font-bold text-navy">
                  Notre Mission
                </h3>
                <p>
                  Chaque livre diffusé sur LAHAThèque porte une mission : former, inspirer et préparer les bâtisseurs de demain :
                </p>

                <div className="flex flex-wrap gap-2.5 pt-2">
                  {[
                    "Futurs juristes et magistrats",
                    "Médecins et professionnels de santé",
                    "Ingénieurs et bâtisseurs",
                    "Enseignants et chercheurs",
                    "Économistes et décideurs",
                    "Entrepreneurs innovants"
                  ].map((val, idx) => (
                    <span 
                      key={idx} 
                      className="px-4 py-2 bg-navy text-white rounded-xl text-xs font-bold tracking-wide shadow-xs"
                    >
                      {val}
                    </span>
                  ))}
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* 3. SCÈNE ANIMÉE SAVOIR AFRIQUE (Option B : remplace la section des disciplines) */}
        <SavoirAfriqueSection />

        {/* 4. NOTRE ENGAGEMENT POUR L'AVENIR */}
        <section className="bg-navy text-white rounded-3xl p-8 sm:p-12 lg:p-16 border border-navy-hover shadow-xl">
          <div className="max-w-4xl mx-auto text-center space-y-10">
            
            <div className="space-y-4">
              <span className="text-xs font-bold text-gold uppercase tracking-widest">
                Notre engagement
              </span>
              <p className="font-serif text-xl sm:text-2xl md:text-3xl font-bold leading-relaxed max-w-2xl mx-auto text-white">
                "Faire de la lecture numérique un levier d'égalité, d'excellence et de développement pour toute l'Afrique."
              </p>
            </div>
            
            <p className="text-xs sm:text-sm text-white/80 leading-relaxed max-w-2xl mx-auto">
              Grâce à nos technologies de protection et notre modèle équitable, nous unissons auteurs, universités, éditeurs et lecteurs pour diffuser le savoir au-delà des contraintes géographiques.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
              <div className="flex flex-col items-center gap-3 bg-navy-dark border border-navy-hover p-6 rounded-2xl shadow-sm">
                <Sparkles className="w-8 h-8 text-gold" />
                <h4 className="font-serif font-bold text-sm text-white">Diffuser les vocations</h4>
                <p className="text-[11px] text-white/70">Inspirer la prochaine génération de leaders africains.</p>
              </div>
              <div className="flex flex-col items-center gap-3 bg-navy-dark border border-navy-hover p-6 rounded-2xl shadow-sm">
                <Book className="w-8 h-8 text-gold" />
                <h4 className="font-serif font-bold text-sm text-white">Diffuser les savoirs</h4>
                <p className="text-[11px] text-white/70">Valoriser la recherche et l'édition universitaire.</p>
              </div>
              <div className="flex flex-col items-center gap-3 bg-navy-dark border border-navy-hover p-6 rounded-2xl shadow-sm">
                <Sun className="w-8 h-8 text-gold" />
                <h4 className="font-serif font-bold text-sm text-white">Diffuser l'avenir</h4>
                <p className="text-[11px] text-white/70">Connecter les universités aux standards mondiaux.</p>
              </div>
            </div>

          </div>
        </section>

        {/* 5. BANDEAU NEWSLETTER */}
        <section className="bg-background-secondary rounded-2xl border border-border py-8 px-6 sm:px-10">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3 text-center sm:text-left">
              <Mail className="w-6 h-6 text-gold shrink-0 hidden sm:block" />
              <div>
                <h3 className="font-serif text-lg font-bold text-navy">
                  Restez informé·e
                </h3>
                <p className="text-xs text-foreground-muted">
                  Recevez les actualités académiques et les nouvelles parutions.
                </p>
              </div>
            </div>
            <form onSubmit={(e) => e.preventDefault()} className="flex w-full sm:w-auto gap-2">
              <input 
                type="email" 
                placeholder="Votre adresse e-mail" 
                className="px-4 py-2.5 rounded-xl border border-border bg-background text-xs sm:text-sm focus:ring-2 focus:ring-navy focus:outline-none w-full sm:w-64" 
              />
              <button 
                type="submit" 
                className="px-6 py-2.5 rounded-xl bg-gold hover:bg-gold-light text-navy font-sans font-bold text-xs sm:text-sm transition-colors whitespace-nowrap cursor-pointer shadow-sm"
              >
                S'abonner
              </button>
            </form>
          </div>
        </section>

      </div>
    </div>
  );
}
