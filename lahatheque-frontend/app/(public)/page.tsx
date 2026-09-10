import Link from "next/link";
import Image from "next/image";
import { 
  GraduationCap, 
  ShieldCheck, 
  Truck, 
  Headphones, 
  ArrowRight,
  BookOpen,
  CheckCircle,
  Building2
} from "lucide-react";
import { CountingNumber } from "@/components/ui/counting-number";
import { PanafricanPresenceSection } from "@/components/features/home/panafrican-presence-section";
import { WhyChooseSection } from "@/components/features/home/why-choose-section";
import { PartnerLogoMarquee } from "@/components/ui/partner-logo-marquee";
import { SavoirAfriqueSection } from "@/components/features/about/savoir-afrique-section";
import { FeaturedBooksSection } from "@/components/features/home/featured-books-section";
import { searchCatalogBooks } from "@/lib/services/catalog";
import { Book as CatalogBook } from "@/lib/types/catalog";

// Revalidation côté serveur (ISR) toutes les 60s pour affichage instantané dans le HTML
export const revalidate = 60;

export default async function HomePage() {
  let books: CatalogBook[] = [];

  try {
    // 1. Recherche prioritaire des ouvrages réels bilingues (FR et EN)
    const res = await searchCatalogBooks({
      language: "bilingual",
      ordering: "-created_at",
      page_size: 6,
    });

    books = res?.results || [];

    // 2. Si moins de 6 ouvrages bilingues stricts, compléter avec les derniers ouvrages réels
    if (books.length < 6) {
      const fallbackRes = await searchCatalogBooks({
        ordering: "-created_at",
        page_size: 6,
      });
      const allItems = fallbackRes?.results || [];
      const existingIds = new Set(books.map((b) => b.id));
      for (const item of allItems) {
        if (!existingIds.has(item.id)) {
          books.push(item);
          existingIds.add(item.id);
          if (books.length >= 6) break;
        }
      }
    }
  } catch (err) {
    console.error("[HomePage SSR] Erreur chargement livres:", err);
  }

  return (
    <div className="w-full">
      
      {/* Hero Section */}
      <section className="relative bg-background overflow-hidden py-8 sm:py-12 lg:py-16 xl:py-20">
        <div className="w-full max-w-[1920px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8 items-center lg:items-end">

          <div className="z-10 text-center lg:text-left lg:col-span-5 px-6 sm:px-10 lg:pl-12 xl:pl-16 2xl:pl-24 lg:pr-4 pb-4 sm:pb-6 lg:pb-10 xl:pb-16">
            <p className="text-[11px] sm:text-xs md:text-sm font-bold text-gold uppercase tracking-widest mb-3 sm:mb-4 font-sans">
              LA CONNAISSANCE À PORTÉE DE MAIN
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl xl:text-6xl text-navy font-bold leading-[1.12] mb-4 sm:mb-5">
              Accédez au savoir.<br />
              <span className="text-gold">Transformez demain.</span>
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-foreground-muted mb-6 max-w-xl mx-auto lg:mx-0 font-sans leading-relaxed">
              Lahathèque est votre bibliothèque universitaire en ligne. Des milliers d&apos;ouvrages, de ressources et d&apos;auteurs africains à portée de clic.
            </p>

            <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-3">
              <Link
                href="/submit"
                className="bg-gold hover:bg-gold-dark text-white px-6 py-3 rounded font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 group shadow-sm"
              >
                Déposer un ouvrage
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/catalog?categories=all"
                className="bg-transparent border border-border hover:border-gold text-foreground px-6 py-3 rounded font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 group"
              >
                Explorer les catégories
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          <div className="relative z-0 flex items-end justify-center lg:justify-end w-full lg:col-span-7 pr-0 mr-0">
            <div className="relative w-full flex items-end justify-center lg:justify-end">
              <Image
                src="/hero-section.jpg"
                alt="Bibliothèque numérique LAHAThèque — Livres et savoir académique"
                width={1600}
                height={1000}
                priority
                className="w-full h-auto max-h-[220px] sm:max-h-[340px] md:max-h-[460px] lg:max-h-[520px] xl:max-h-[620px] 2xl:max-h-[720px] object-contain object-bottom lg:object-right-bottom block"
              />
            </div>
          </div>

        </div>
      </section>

      {/* Réassurance Section */}
      <section className="border-y border-border bg-background py-8 px-6 md:px-10 lg:px-12">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 divide-y md:divide-y-0 md:divide-x divide-border">
          
          <div className="flex items-start gap-4 pt-4 md:pt-0 md:px-4 first:pl-0">
            <div className="w-10 h-10 rounded-full bg-background border border-border/80 flex items-center justify-center shrink-0 shadow-sm">
              <GraduationCap className="w-5 h-5 text-navy" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-navy mb-1">Contenus universitaires</h3>
              <p className="text-xs text-foreground-muted">Des ouvrages validés par des experts</p>
            </div>
          </div>

          <div className="flex items-start gap-4 pt-4 md:pt-0 md:px-4">
            <div className="w-10 h-10 rounded-full bg-background border border-border/80 flex items-center justify-center shrink-0 shadow-sm">
              <ShieldCheck className="w-5 h-5 text-navy" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-navy mb-1">Paiement sécurisé</h3>
              <p className="text-xs text-foreground-muted">Mobile Money, carte et autres moyens</p>
            </div>
          </div>

          <div className="flex items-start gap-4 pt-4 md:pt-0 md:px-4">
            <div className="w-10 h-10 rounded-full bg-background border border-border/80 flex items-center justify-center shrink-0 shadow-sm">
              <Truck className="w-5 h-5 text-navy" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-navy mb-1">Livraison rapide</h3>
              <p className="text-xs text-foreground-muted">Partout en Afrique et à l'international</p>
            </div>
          </div>

          <div className="flex items-start gap-4 pt-4 md:pt-0 md:px-4">
            <div className="w-10 h-10 rounded-full bg-background border border-border/80 flex items-center justify-center shrink-0 shadow-sm">
              <Headphones className="w-5 h-5 text-navy" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-navy mb-1">Support dédié</h3>
              <p className="text-xs text-foreground-muted">Une équipe à votre écoute 7j/7</p>
            </div>
          </div>

        </div>
      </section>

      {/* Nouveautés Réelles Déjà Chargées (Server-Side) */}
      <FeaturedBooksSection books={books} />

      {/* Bandeau Chiffres Clés */}
      <section className="bg-navy py-10 sm:py-12 px-6 md:px-10 text-white text-center">
        <div className="max-w-7xl mx-auto mb-6 sm:mb-8">
          <h2 className="font-serif text-xl sm:text-2xl md:text-3xl font-bold mb-2">Spécialiste du contenu éducatif</h2>
          <p className="text-xs sm:text-sm text-white/80 font-sans">Le plus grand catalogue d&apos;ouvrages universitaires africains</p>
        </div>
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
          <div>
            <span className="block text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif text-gold font-bold mb-1.5 tracking-tight">
              +<CountingNumber target={20000} />
            </span>
            <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-white/70">Ouvrages disponibles</span>
          </div>
          <div>
            <span className="block text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif text-gold font-bold mb-1.5 tracking-tight">
              +<CountingNumber target={47000} />
            </span>
            <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-white/70">Étudiants inscrits</span>
          </div>
          <div>
            <span className="block text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif text-gold font-bold mb-1.5 tracking-tight">
              +<CountingNumber target={64} />
            </span>
            <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-white/70">Partenaires institutionnels</span>
          </div>
          <div>
            <span className="block text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif text-gold font-bold mb-1.5 tracking-tight">
              +<CountingNumber target={73} />
            </span>
            <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-white/70">Éditeurs africains</span>
          </div>
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
              Notre mission est de démocratiser l'accès au savoir en Afrique en proposant une plateforme innovante regroupant les meilleures ressources académiques du continent.
            </p>
            <p className="text-sm text-foreground-muted mb-8 leading-relaxed">
              Nous travaillons main dans la main avec nos partenaires institutionnels, les auteurs et les éditeurs pour bâtir le plus grand catalogue de contenu éducatif d'Afrique francophone.
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

      {/* Notre Vision */}
      <SavoirAfriqueSection />

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
                  <span>Lecteur interactif intégré sécurisé</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                  <span>Abonnements à tarifs préférentiels</span>
                </li>
              </ul>
            </div>

            {/* Partenaires */}
            <div className="bg-background border border-border p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded bg-gold/10 text-gold flex items-center justify-center mb-6">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl font-bold text-navy mb-4">Institutions &amp; Partenaires</h3>
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

      {/* Défilement des Logos Partenaires */}
      <PartnerLogoMarquee />

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
      <section className="py-12 sm:py-16 px-6 md:px-10 bg-navy text-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
          <div className="text-center md:text-left">
            <h3 className="font-serif text-xl font-bold mb-2">Restez informé</h3>
            <p className="text-sm text-white/70">Recevez nos dernières nouveautés et actualités directement dans votre boîte mail.</p>
          </div>
          <form className="flex flex-col sm:flex-row w-full md:w-auto gap-2" onSubmit={(e) => e.preventDefault()}>
            <input
              className="w-full sm:w-72 md:w-80 h-12 px-4 rounded bg-navy-hover border border-border text-white placeholder:text-white/50 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold text-sm"
              placeholder="Votre adresse email"
              type="email"
              required
            />
            <button
              className="h-12 px-6 rounded bg-gold text-white font-bold text-sm [@media(hover:hover)]:hover:bg-gold-dark transition-colors whitespace-nowrap"
              type="submit"
            >
              S&apos;abonner
            </button>
          </form>
        </div>
      </section>

    </div>
  );
}
