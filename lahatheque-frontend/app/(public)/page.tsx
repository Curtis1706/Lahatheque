"use client";

import Link from "next/link";
import Image from "next/image";
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
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Book as Book3D } from "@/components/ui/book";
import { CountingNumber } from "@/components/ui/counting-number";
import { PanafricanPresenceSection } from "@/components/features/home/panafrican-presence-section";
import { WhyChooseSection } from "@/components/features/home/why-choose-section";
import { PartnerLogoMarquee } from "@/components/ui/partner-logo-marquee";
import { SavoirAfriqueSection } from "@/components/features/about/savoir-afrique-section";
import { useCart } from "@/context/cart-context";
import { searchCatalogBooks } from "@/lib/services/catalog";
import { Book as CatalogBook } from "@/lib/types/catalog";

export default function HomePage() {
  const { addItem } = useCart();
  const [newBooks, setNewBooks] = useState<CatalogBook[]>([]);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let isMounted = true;
    async function loadNewBooks() {
      setLoadingBooks(true);
      try {
        // Priorité aux ouvrages réels publiés disponibles en français
        const frRes = await searchCatalogBooks({
          language: "fr",
          ordering: "-created_at",
          page_size: 6,
        });

        let items = frRes?.results || [];

        // Complétion automatique avec les autres nouveautés publiées si moins de 6
        if (items.length < 6) {
          const allRes = await searchCatalogBooks({
            ordering: "-created_at",
            page_size: 12,
          });
          const existingIds = new Set(items.map((b) => b.id));
          for (const book of allRes?.results || []) {
            if (!existingIds.has(book.id)) {
              items.push(book);
              existingIds.add(book.id);
              if (items.length >= 6) break;
            }
          }
        }

        if (isMounted) {
          setNewBooks(items.slice(0, 6));
        }
      } catch (err) {
        console.error("Erreur chargement nouveautes catalogue:", err);
      } finally {
        if (isMounted) setLoadingBooks(false);
      }
    }
    loadNewBooks();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleAddToCart = (e: React.MouseEvent, book: CatalogBook) => {
    e.preventDefault();
    e.stopPropagation();

    const authorName =
      book.authors_details && book.authors_details.length > 0
        ? book.authors_details.map((a) => `${a.first_name} ${a.last_name}`).join(", ")
        : "Auteur certifié";

    const selectedLang =
      book.available_languages && book.available_languages.includes("fr")
        ? "fr"
        : book.language || "fr";

    addItem(
      {
        bookId: book.id,
        title: book.title,
        author: authorName,
        cover: book.cover_url || book.cover_image,
        format: "digital",
        price: book.price ? Number(book.price) : 2500,
        quantity: 1,
        selectedLanguage: selectedLang,
      },
      true
    );

    toast.success(`« ${book.title} » ajouté au panier`);
  };

  const toggleFavorite = (e: React.MouseEvent, bookId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorites((prev) => {
      const next = !prev[bookId];
      if (next) {
        toast.success("Ouvrage ajouté à vos favoris");
      } else {
        toast.info("Ouvrage retiré de vos favoris");
      }
      return { ...prev, [bookId]: next };
    });
  };
  return (
    <div className="w-full">
      
      {/* Hero Section Full Width */}
      <section className="relative pt-4 pb-0 sm:pt-6 md:pt-8 lg:pt-6 xl:pt-10 overflow-hidden bg-background w-full">
        <div className="w-full max-w-[1920px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center lg:items-end">
          
          <div className="z-10 text-center lg:text-left lg:col-span-5 px-6 sm:px-10 lg:pl-12 xl:pl-16 2xl:pl-24 lg:pr-4 pb-6 lg:pb-10 xl:pb-16">
            <p className="text-[11px] sm:text-xs md:text-sm font-bold text-gold uppercase tracking-widest mb-3 sm:mb-4 font-sans">
              LA CONNAISSANCE À PORTÉE DE MAIN
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl xl:text-6xl text-navy font-bold leading-[1.12] mb-4 sm:mb-5">
              Accédez au savoir.<br />
              <span className="text-gold">Transformez demain.</span>
            </h1>
            <p className="text-xs sm:text-sm md:text-base text-foreground-muted mb-6 max-w-xl mx-auto lg:mx-0 font-sans leading-relaxed">
              Lahathèque est votre bibliothèque universitaire en ligne. Des milliers d'ouvrages, de ressources et d'auteurs africains à portée de clic.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-3.5">
              <Link 
                href="/submit" 
                className="bg-gold hover:bg-gold-dark text-white px-7 py-3 rounded font-medium text-xs sm:text-sm transition-all duration-200 flex items-center justify-center gap-2 group shadow-sm"
              >
                Déposer un ouvrage 
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link 
                href="/catalog?categories=all" 
                className="bg-transparent border border-border hover:border-gold text-foreground px-7 py-3 rounded font-medium text-xs sm:text-sm transition-all duration-200 flex items-center justify-center gap-2 group"
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
                className="w-full h-auto max-h-[380px] sm:max-h-[440px] md:max-h-[500px] lg:max-h-[520px] xl:max-h-[620px] 2xl:max-h-[720px] object-contain object-bottom lg:object-right-bottom block"
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

      {/* Nouveautés Réelles */}
      <section className="py-16 px-6 md:px-10 lg:px-12 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-end mb-8 gap-4">
          <div>
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-navy">Nouveautés</h2>
            <p className="text-xs sm:text-sm text-foreground-muted mt-1">
              Les dernières parutions académiques et ouvrages universitaires certifiés
            </p>
          </div>
          <Link href="/catalog" className="text-sm font-medium text-foreground-muted hover:text-navy flex items-center gap-1 group transition-colors shrink-0">
            Voir tous les livres 
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {loadingBooks ? (
          /* Squelette de chargement aux proportions exactes */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div 
                key={n} 
                className="animate-pulse bg-background border border-border rounded-lg p-4 flex flex-col justify-between space-y-4"
              >
                <div className="relative mb-2 bg-background-secondary rounded flex items-center justify-center p-4 aspect-[2/3]">
                  <div className="w-20 h-28 bg-border/60 rounded-md" />
                </div>
                <div className="space-y-2 mt-auto">
                  <div className="h-3 bg-border/60 rounded w-1/3" />
                  <div className="h-4 bg-border/60 rounded w-full" />
                  <div className="h-3 bg-border/60 rounded w-1/2" />
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <div className="h-4 bg-border/60 rounded w-14" />
                    <div className="w-8 h-8 bg-border/60 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : newBooks.length === 0 ? (
          <div className="text-center py-12 px-4 bg-background-secondary rounded-xl border border-border">
            <BookOpen className="w-10 h-10 text-gold mx-auto mb-3 opacity-80" />
            <h3 className="font-serif font-bold text-navy text-base mb-1">Catalogue en cours de synchronisation</h3>
            <p className="text-xs text-foreground-muted max-w-sm mx-auto mb-4">
              Les ouvrages universitaires publiés sont disponibles dans la section catalogue complet.
            </p>
            <Link
              href="/catalog"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gold hover:bg-gold-dark text-white text-xs font-bold transition-colors"
            >
              <span>Accéder au catalogue</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
            {newBooks.map((book) => {
              const bookSlug = book.slug || book.id;
              const authorName =
                book.authors_details && book.authors_details.length > 0
                  ? book.authors_details.map((a) => `${a.first_name} ${a.last_name}`).join(", ")
                  : "Auteur certifié";

              const categoryName =
                book.discipline_detail?.name || book.publisher_name || "Université";

              const isMultilingual =
                book.available_languages && book.available_languages.length > 1;

              const langBadge = isMultilingual
                ? "FR • EN"
                : (book.language ? book.language.toUpperCase() : "FR");

              const isFav = Boolean(favorites[book.id]);

              return (
                <article 
                  key={book.id} 
                  className="group bg-background border border-border rounded-lg p-4 hover:shadow-[0_8px_30px_rgba(27,42,78,0.06)] hover:border-gold/50 transition-all duration-300 flex flex-col justify-between"
                >
                  {/* Zone Couverture Cliquable vers /catalog/[slug_or_id] */}
                  <div className="relative mb-4 flex-grow bg-background-secondary rounded flex items-center justify-center p-3 aspect-[2/3] overflow-visible">
                    <button 
                      type="button"
                      onClick={(e) => toggleFavorite(e, book.id)}
                      className={`absolute top-2 right-2 w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center transition-colors z-10 shadow-xs cursor-pointer ${
                        isFav ? "text-error border-error/40 bg-error/5" : "text-foreground-muted hover:text-error"
                      }`}
                      title={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
                      aria-label="Ajouter aux favoris"
                    >
                      <Heart className={`w-4 h-4 ${isFav ? "fill-current" : ""}`} />
                    </button>
                    
                    <Link 
                      href={`/catalog/${bookSlug}`} 
                      className="transition-transform group-hover:scale-105 duration-300 flex items-center justify-center w-full h-full"
                    >
                      {book.cover_url || book.cover_image ? (
                        <div className="relative w-[120px] aspect-[2/3] rounded-r-md rounded-l-xs overflow-hidden shadow-md border-l-3 border-black/25 border-r border-t border-b border-border/70 group-hover:shadow-xl transition-shadow duration-300">
                          <img
                            src={book.cover_url || book.cover_image}
                            alt={book.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      ) : (
                        <Book3D 
                          title={book.title} 
                          author={authorName}
                          variant="lahatheque" 
                          color={book.cover_color || "var(--navy)"} 
                          textColor={book.cover_text_color || "var(--gold-light)"} 
                          width={{ sm: 110, md: 120, lg: 125, xl: 115 }}
                          textured
                        />
                      )}
                    </Link>
                  </div>

                  {/* Informations Livre */}
                  <div className="mt-auto">
                    <div className="flex items-center gap-1.5 flex-wrap mb-2">
                      <span className="inline-block bg-navy-light text-navy text-[9px] font-semibold px-2 py-0.5 rounded-xs truncate max-w-[110px]">
                        {categoryName}
                      </span>
                      <span className="inline-block bg-gold/10 text-gold border border-gold/30 text-[9px] font-bold px-1.5 py-0.5 rounded-xs">
                        {langBadge}
                      </span>
                    </div>

                    <h3 className="font-serif font-bold text-sm text-navy mb-1 line-clamp-2 leading-snug">
                      <Link 
                        href={`/catalog/${bookSlug}`}
                        className="group-hover:text-gold transition-colors"
                      >
                        {book.title}
                      </Link>
                    </h3>

                    <p className="text-xs text-foreground-muted mb-3 line-clamp-1">
                      {authorName}
                    </p>

                    <div className="flex items-center justify-between mt-2 pt-3 border-t border-border">
                      <span className="text-xs sm:text-sm font-bold font-mono text-navy">
                        {(book.price ? Number(book.price) : 2500).toLocaleString("fr-FR")} FCFA
                      </span>
                      <button 
                        type="button"
                        onClick={(e) => handleAddToCart(e, book)}
                        className="w-8 h-8 rounded bg-background-secondary hover:bg-gold hover:text-white text-gold transition-all duration-200 flex items-center justify-center shadow-xs cursor-pointer shrink-0"
                        title="Ajouter au panier (Licence numérique)"
                        aria-label={`Ajouter ${book.title} au panier`}
                      >
                        <ShoppingCart className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Bandeau Chiffres Clés */}
      <section className="bg-navy py-12 px-6 md:px-10 text-white text-center">
        <div className="max-w-7xl mx-auto mb-8">
          <h2 className="font-serif text-2xl md:text-3xl font-bold mb-2">Spécialiste du contenu éducatif</h2>
          <p className="text-sm text-white/80 font-sans">Le plus grand catalogue d'ouvrages universitaires africains</p>
        </div>
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <span className="block text-4xl md:text-5xl lg:text-6xl font-serif text-gold font-bold mb-2 tracking-tight">
              +<CountingNumber target={20000} />
            </span>
            <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-white/70">Ouvrages disponibles</span>
          </div>
          <div>
            <span className="block text-4xl md:text-5xl lg:text-6xl font-serif text-gold font-bold mb-2 tracking-tight">
              +<CountingNumber target={47000} />
            </span>
            <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-white/70">Étudiants inscrits</span>
          </div>
          <div>
            <span className="block text-4xl md:text-5xl lg:text-6xl font-serif text-gold font-bold mb-2 tracking-tight">
              +<CountingNumber target={64} />
            </span>
            <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-white/70">Partenaires institutionnels</span>
          </div>
          <div>
            <span className="block text-4xl md:text-5xl lg:text-6xl font-serif text-gold font-bold mb-2 tracking-tight">
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
