"use client";

import Link from "next/link";
import { 
  GraduationCap, 
  ShieldCheck, 
  Truck, 
  Headphones, 
  ArrowRight,
  ShoppingCart,
  Heart,
  Globe,
  Building2,
  BookOpen,
  CheckCircle
} from "lucide-react";
import HeroCarousel from "@/components/ui/hero-carousel";
import { Book } from "@/components/ui/book";
import { CountingNumber } from "@/components/ui/counting-number";
import { PanafricanPresenceSection } from "@/components/features/home/panafrican-presence-section";
import { WhyChooseSection } from "@/components/features/home/why-choose-section";

const bestSellers = [
  {
    id: 1,
    title: "Droit des obligations",
    author: "Pr. M. N'DIA",
    category: "Droit",
    price: "15 000 FCFA",
    color: "var(--navy)",
    textColor: "#FFFFFF",
    tag: "Droit"
  },
  {
    id: 2,
    title: "Économie monétaire",
    author: "Dr. K. YAO",
    category: "Économie",
    price: "13 000 FCFA",
    color: "var(--background-secondary)",
    textColor: "var(--navy)",
    tag: "Économie"
  },
  {
    id: 3,
    title: "Comptabilité approfondie",
    author: "Pr. E. TRAORÉ",
    category: "Gestion",
    price: "14 500 FCFA",
    color: "var(--navy-hover)",
    textColor: "#FFFFFF",
    tag: "Gestion"
  },
  {
    id: 4,
    title: "Droit constitutionnel",
    author: "Pr. A. DIALLO",
    category: "Droit",
    price: "11 500 FCFA",
    color: "var(--background)",
    textColor: "var(--navy)",
    tag: "Droit"
  },
  {
    id: 5,
    title: "Management stratégique",
    author: "Dr. S. DIABY",
    category: "Gestion",
    price: "16 000 FCFA",
    color: "var(--navy-dark)",
    textColor: "var(--gold-light)",
    tag: "Management"
  },
  {
    id: 6,
    title: "Finance d'entreprise",
    author: "Pr. J. KOUADIO",
    category: "Finance",
    price: "13 500 FCFA",
    color: "var(--background-secondary)",
    textColor: "var(--gold-dark)",
    tag: "Finance"
  }
];

export default function HomePage() {
  return (
    <div className="w-full">
      
      {/* Hero Section */}
      <section className="relative pt-12 pb-24 overflow-hidden bg-gradient-to-b from-background-secondary to-background px-6 md:px-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          <div className="z-10 text-center lg:text-left">
            <p className="text-sm font-bold text-gold uppercase tracking-widest mb-4">
              LA CONNAISSANCE À PORTÉE DE MAIN
            </p>
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-navy font-bold leading-tight mb-6">
              Accédez au savoir.<br />
              <span className="text-gold">Transformez demain.</span>
            </h1>
            <p className="text-base md:text-lg text-foreground-muted mb-8 max-w-lg mx-auto lg:mx-0">
              Lahathèque est votre bibliothèque universitaire en ligne. Des milliers d'ouvrages, de ressources et d'auteurs africains à portée de clic.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4">
              <Link 
                href="/catalog" 
                className="bg-gold hover:bg-gold-dark text-white px-8 py-3.5 rounded font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 group shadow-md"
              >
                Découvrir les livres 
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link 
                href="/catalog?categories=all" 
                className="bg-transparent border border-border hover:border-navy text-navy px-8 py-3.5 rounded font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 group"
              >
                Explorer les catégories 
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          <div className="relative z-0 flex justify-center lg:justify-end">
            <HeroCarousel />
          </div>

        </div>
      </section>

      {/* Réassurance Section */}
      <section className="border-y border-border bg-background-secondary py-8 px-6 md:px-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 divide-y md:divide-y-0 md:divide-x divide-border">
          
          <div className="flex items-start gap-4 pt-4 md:pt-0 md:px-4 first:pl-0">
            <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center shrink-0 shadow-sm">
              <GraduationCap className="w-5 h-5 text-navy" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-navy mb-1">Contenus universitaires</h3>
              <p className="text-xs text-foreground-muted">Des ouvrages validés par des experts</p>
            </div>
          </div>

          <div className="flex items-start gap-4 pt-4 md:pt-0 md:px-4">
            <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center shrink-0 shadow-sm">
              <ShieldCheck className="w-5 h-5 text-navy" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-navy mb-1">Paiement sécurisé</h3>
              <p className="text-xs text-foreground-muted">Mobile Money, carte et autres moyens</p>
            </div>
          </div>

          <div className="flex items-start gap-4 pt-4 md:pt-0 md:px-4">
            <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center shrink-0 shadow-sm">
              <Truck className="w-5 h-5 text-navy" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-navy mb-1">Livraison rapide</h3>
              <p className="text-xs text-foreground-muted">Partout en Afrique et à l'international</p>
            </div>
          </div>

          <div className="flex items-start gap-4 pt-4 md:pt-0 md:px-4">
            <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center shrink-0 shadow-sm">
              <Headphones className="w-5 h-5 text-navy" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-navy mb-1">Support dédié</h3>
              <p className="text-xs text-foreground-muted">Une équipe à votre écoute 7j/7</p>
            </div>
          </div>

        </div>
      </section>

      {/* Bandeau Chiffres Clés */}
      <section className="bg-navy py-12 px-6 md:px-10 text-white text-center">
        <div className="max-w-7xl mx-auto mb-8">
          <h2 className="font-serif text-2xl md:text-3xl font-bold mb-2">Spécialiste du contenu éducatif</h2>
          <p className="text-sm text-white/80">Le plus grand catalogue d'ouvrages universitaires africains</p>
        </div>
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <span className="block text-4xl md:text-5xl lg:text-6xl font-serif text-gold font-bold mb-2 tracking-tight">
              +<CountingNumber target={5000} />
            </span>
            <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-white/70">Ouvrages disponibles</span>
          </div>
          <div>
            <span className="block text-4xl md:text-5xl lg:text-6xl font-serif text-gold font-bold mb-2 tracking-tight">
              +<CountingNumber target={1200} />
            </span>
            <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-white/70">Étudiants inscrits</span>
          </div>
          <div>
            <span className="block text-4xl md:text-5xl lg:text-6xl font-serif text-gold font-bold mb-2 tracking-tight">
              +<CountingNumber target={180} />
            </span>
            <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-white/70">Universités partenaires</span>
          </div>
          <div>
            <span className="block text-4xl md:text-5xl lg:text-6xl font-serif text-gold font-bold mb-2 tracking-tight">
              +<CountingNumber target={80} />
            </span>
            <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-white/70">Éditeurs africains</span>
          </div>
        </div>
      </section>

      {/* Meilleures Ventes */}
      <section className="py-16 px-6 md:px-10 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-end mb-8 gap-4">
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-navy">Meilleures ventes</h2>
          <Link href="/catalog" className="text-sm font-bold text-foreground-muted hover:text-navy flex items-center gap-1 group transition-colors">
            Voir tous les livres 
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          {bestSellers.map((book) => (
            <div 
              key={book.id} 
              className="group bg-background border border-border rounded-lg p-4 hover:shadow-[0_8px_30px_rgba(27,42,78,0.06)] transition-all duration-300 flex flex-col justify-between"
            >
              {/* 3D book cover */}
              <div className="relative mb-4 flex-grow bg-background-secondary rounded flex items-center justify-center p-4 aspect-[2/3] overflow-visible">
                <button className="absolute top-2 right-2 w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center text-foreground-muted hover:text-error transition-colors z-10 shadow-sm">
                  <Heart className="w-4 h-4" />
                </button>
                
                <Book 
                  title={book.title} 
                  variant="stripe" 
                  color={book.color} 
                  textColor={book.textColor} 
                  width={{ sm: 120, md: 130, lg: 135, xl: 125 }}
                  textured
                />
              </div>

              <div className="mt-auto">
                <span className="inline-block bg-navy-light text-navy text-[9px] font-semibold px-2 py-0.5 rounded-sm mb-2">
                  {book.tag}
                </span>
                <h3 className="font-bold text-sm text-navy mb-1 line-clamp-2">
                  {book.title}
                </h3>
                <p className="text-xs text-foreground-muted mb-3">
                  {book.author}
                </p>
                <div className="flex items-center justify-between mt-2 pt-3 border-t border-border">
                  <span className="text-sm font-bold text-navy">{book.price}</span>
                  <button className="w-8 h-8 rounded bg-background-secondary hover:bg-gold hover:text-white text-gold transition-all duration-200 flex items-center justify-center shadow-sm">
                    <ShoppingCart className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Mission / À Propos */}
      <section className="py-20 px-6 md:px-10 bg-background-secondary border-t border-border">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-navy mb-6">
              La première bibliothèque numérique pour les auteurs africains
            </h2>
            <p className="text-base text-foreground-muted mb-6 leading-relaxed">
              Notre mission est de démocratiser l'accès au savoir en Afrique en proposant une plateforme innovante regroupant les meilleures ressources universitaires du continent.
            </p>
            <p className="text-sm text-foreground-muted mb-8 leading-relaxed">
              Nous travaillons main dans la main avec les universités, les auteurs et les éditeurs pour bâtir le plus grand catalogue de contenu éducatif d'Afrique francophone.
            </p>
            <Link 
              href="/about" 
              className="inline-block border border-navy hover:bg-navy hover:text-white text-navy px-8 py-3 rounded font-bold text-sm transition-all duration-200"
            >
              En savoir plus sur nous
            </Link>
          </div>
          
          <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-background border border-border shadow-md">
            {/* Elegant academic illustration or simulated preview */}
            <div className="absolute inset-0 bg-gradient-to-br from-navy/5 to-gold/5 flex items-center justify-center p-8">
              <div className="text-center">
                <BookOpen className="w-16 h-16 text-gold mx-auto mb-4 opacity-80" />
                <span className="font-serif text-lg font-bold text-navy">Éditer &amp; Diffuser</span>
                <p className="text-xs text-foreground-muted mt-2 max-w-xs mx-auto">
                  Soutenir la visibilité de la recherche académique africaine à l'échelle internationale.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Audiences */}
      <section className="py-20 px-6 md:px-10 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-serif text-3xl font-bold text-navy">Une solution pour tous les acteurs de l'éducation</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Étudiants */}
            <div className="bg-background border border-border p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded bg-gold/10 text-gold flex items-center justify-center mb-6">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl font-bold text-navy mb-4">Étudiants &amp; Chercheurs</h3>
              <ul className="space-y-3 text-sm text-foreground-muted">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                  <span>Accès illimité à des milliers de ressources</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                  <span>Consultation hors-ligne sur mobile</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                  <span>Abonnements à tarifs préférentiels</span>
                </li>
              </ul>
            </div>

            {/* Universités */}
            <div className="bg-background border border-border p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded bg-gold/10 text-gold flex items-center justify-center mb-6">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl font-bold text-navy mb-4">Universités &amp; Écoles</h3>
              <ul className="space-y-3 text-sm text-foreground-muted">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                  <span>Bibliothèque virtuelle clé en main</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                  <span>Valorisation des publications des enseignants</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                  <span>Suivi des statistiques de consultation</span>
                </li>
              </ul>
            </div>

            {/* Éditeurs */}
            <div className="bg-background border border-border p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded bg-gold/10 text-gold flex items-center justify-center mb-6">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl font-bold text-navy mb-4">Auteurs &amp; Éditeurs</h3>
              <ul className="space-y-3 text-sm text-foreground-muted">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                  <span>Nouveau canal de distribution numérique</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                  <span>Protection anti-piratage des œuvres (DRM)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                  <span>Rémunération transparente et régulière</span>
                </li>
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* Catégories / Bouquets */}
      <section className="py-20 px-6 md:px-10 bg-background-secondary border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-end mb-12 gap-4">
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-navy">Explorez par domaines</h2>
            <Link href="/catalog" className="text-sm font-bold text-foreground-muted hover:text-navy flex items-center gap-1 group transition-colors">
              Toutes les catégories 
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Link href="/catalog?cat=droit" className="group relative h-40 rounded-lg overflow-hidden bg-navy flex items-center justify-center shadow-sm">
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors z-10" />
              <span className="relative z-20 font-serif text-lg font-bold text-white">Droit</span>
            </Link>
            
            <Link href="/catalog?cat=economie" className="group relative h-40 rounded-lg overflow-hidden bg-[#8b6f36] flex items-center justify-center shadow-sm">
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors z-10" />
              <span className="relative z-20 font-serif text-lg font-bold text-white">Économie</span>
            </Link>

            <Link href="/catalog?cat=archi" className="group relative h-40 rounded-lg overflow-hidden bg-[#4a5a7b] flex items-center justify-center shadow-sm">
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors z-10" />
              <span className="relative z-20 font-serif text-lg font-bold text-white">Architecture</span>
            </Link>

            <Link href="/catalog?cat=lettres" className="group relative h-40 rounded-lg overflow-hidden bg-[#c4a96e] flex items-center justify-center shadow-sm">
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors z-10" />
              <span className="relative z-20 font-serif text-lg font-bold text-white">Arts &amp; Lettres</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Présence Panafricaine avec Globe 3D Cobe */}
      <PanafricanPresenceSection />

      {/* Pourquoi choisir Lahathèque (Composant animé) */}
      <WhyChooseSection />

      {/* CTA Final */}
      <section className="py-20 px-6 md:px-10 bg-gradient-to-b from-background-secondary to-background border-t border-border">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-navy mb-6">Rejoignez Lahathèque</h2>
          <p className="text-base text-foreground-muted mb-10">
            Ne laissez pas le savoir attendre. Accédez dès aujourd'hui à la plus grande bibliothèque numérique universitaire d'Afrique.
          </p>
          <Link 
            href="/register" 
            className="inline-block bg-gold hover:bg-gold-dark text-white px-10 py-4 rounded-lg font-bold text-base transition-colors shadow-md hover:shadow-lg"
          >
            Rejoindre maintenant
          </Link>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 px-6 md:px-10 bg-navy text-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h3 className="font-serif text-xl font-bold mb-2">Restez informé</h3>
            <p className="text-sm text-white/70">Recevez nos dernières nouveautés et actualités directement dans votre boîte mail.</p>
          </div>
          <form className="flex w-full md:w-auto gap-2" onSubmit={(e) => e.preventDefault()}>
            <input 
              className="w-full md:w-80 h-12 px-4 rounded bg-navy-hover border border-border text-white placeholder:text-white/50 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold text-sm" 
              placeholder="Votre adresse email" 
              type="email"
              required
            />
            <button 
              className="h-12 px-6 rounded bg-gold text-white font-bold text-sm hover:bg-gold-dark transition-colors whitespace-nowrap" 
              type="submit"
            >
              S'abonner
            </button>
          </form>
        </div>
      </section>

    </div>
  );
}
