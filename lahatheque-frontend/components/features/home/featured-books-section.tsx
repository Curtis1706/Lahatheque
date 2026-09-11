"use client";

import Link from "next/link";
import { 
  ArrowRight,
  ShoppingCart,
  Heart,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { Book as Book3D } from "@/components/ui/book";
import { useCart } from "@/context/cart-context";
import { Book as CatalogBook } from "@/lib/types/catalog";

interface FeaturedBooksSectionProps {
  books: CatalogBook[];
}

export function FeaturedBooksSection({ books }: FeaturedBooksSectionProps) {
  const { addItem } = useCart();
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const mobileCarouselRef = useRef<HTMLDivElement>(null);

  const scrollMobileCarousel = (direction: "left" | "right") => {
    if (!mobileCarouselRef.current) return;
    const scrollOffset = 260;
    mobileCarouselRef.current.scrollBy({
      left: direction === "left" ? -scrollOffset : scrollOffset,
      behavior: "smooth",
    });
  };

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
        price: ((book as any).price_digital !== undefined && (book as any).price_digital !== null)
          ? Number((book as any).price_digital)
          : (book.price ? Number(book.price) : 2500),
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
    <section className="py-16 max-w-7xl mx-auto px-6 md:px-10 lg:px-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
        <div>
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-navy">Nouveautés</h2>
          <p className="text-xs sm:text-sm text-foreground-muted mt-1">
            Les dernières parutions académiques et ouvrages universitaires certifiés
          </p>
        </div>
        <div className="flex items-center justify-between w-full sm:w-auto gap-4">
          {/* Flèches de défilement horizontal sur mobile */}
          <div className="flex sm:hidden items-center gap-2">
            <button
              type="button"
              onClick={() => scrollMobileCarousel("left")}
              aria-label="Faire défiler vers la gauche"
              className="w-9 h-9 rounded-full border border-border bg-background flex items-center justify-center text-navy active:scale-95 shadow-xs cursor-pointer hover:border-gold hover:text-gold transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollMobileCarousel("right")}
              aria-label="Faire défiler vers la droite"
              className="w-9 h-9 rounded-full border border-border bg-background flex items-center justify-center text-navy active:scale-95 shadow-xs cursor-pointer hover:border-gold hover:text-gold transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <Link href="/catalog" className="text-sm font-medium text-foreground-muted hover:text-navy flex items-center gap-1 group transition-colors shrink-0">
            Voir tous les livres 
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>

      {/* Mobile — Livres alignés horizontalement avec défilement fluide et flèches */}
      <div
        ref={mobileCarouselRef}
        className="flex flex-row gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-4 pt-1 -mx-6 px-6 sm:hidden"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {books.map((book) => {
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
              key={`mobile-${book.id}`}
              className="w-[200px] shrink-0 snap-start group bg-background border border-border rounded-xl p-3 flex flex-col justify-between shadow-xs hover:border-gold/50 transition-all duration-300"
            >
              <div className="relative mb-3 bg-background-secondary rounded-lg flex items-center justify-center h-[160px] overflow-visible">
                <button
                  type="button"
                  onClick={(e) => toggleFavorite(e, book.id)}
                  className={`absolute top-2 right-2 w-7 h-7 rounded-full bg-background border border-border flex items-center justify-center transition-colors z-20 shadow-xs cursor-pointer ${
                    isFav ? "text-error border-error/40 bg-error/5" : "text-foreground-muted"
                  }`}
                  title={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
                  aria-label="Ajouter aux favoris"
                >
                  <Heart className={`w-3 h-3 ${isFav ? "fill-current" : ""}`} />
                </button>

                <Link
                  href={`/catalog/${bookSlug}`}
                  className="flex items-center justify-center w-full h-full"
                >
                  <Book3D
                    title={book.title}
                    author={authorName}
                    coverUrl={book.cover_url || book.cover_image}
                    variant="lahatheque"
                    color={book.cover_color || "var(--navy)"}
                    textColor={book.cover_text_color || "var(--gold-light)"}
                    width={{ sm: 100, md: 105, lg: 110, xl: 110 }}
                    textured
                  />
                </Link>
              </div>

              <div className="mt-auto space-y-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="inline-block bg-navy-light text-navy text-[9px] font-semibold px-2 py-0.5 rounded-xs truncate max-w-[120px]">
                    {categoryName}
                  </span>
                  <span className="inline-block bg-gold/10 text-gold border border-gold/30 text-[9px] font-bold px-1.5 py-0.5 rounded-xs">
                    {langBadge}
                  </span>
                </div>

                <h3 className="font-serif font-bold text-xs sm:text-sm text-navy line-clamp-2 leading-snug">
                  <Link
                    href={`/catalog/${bookSlug}`}
                    className="hover:text-gold transition-colors"
                  >
                    {book.title}
                  </Link>
                </h3>

                <p className="text-[11px] text-foreground-muted line-clamp-1">
                  {authorName}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-border mt-1">
                  <span className="text-xs font-bold font-mono text-navy">
                    {(((book as any).price_digital !== undefined && (book as any).price_digital !== null)
                      ? Number((book as any).price_digital)
                      : (book.price ? Number(book.price) : 2500)
                    ).toLocaleString("fr-FR")} FCFA
                  </span>
                  <button
                    type="button"
                    onClick={(e) => handleAddToCart(e, book)}
                    className="w-8 h-8 rounded bg-background-secondary text-gold flex items-center justify-center shadow-xs cursor-pointer hover:bg-gold hover:text-white transition-colors"
                    title="Ajouter au panier (Licence numérique)"
                    aria-label={`Ajouter ${book.title} au panier`}
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* sm+ — grille portrait */}
      <div className="hidden sm:grid sm:grid-cols-2 md:grid-cols-3 gap-6">
        {books.map((book) => {
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
              className="group bg-background border border-border rounded-lg p-4 [@media(hover:hover)]:hover:shadow-[0_8px_30px_rgba(27,42,78,0.06)] [@media(hover:hover)]:hover:border-gold/50 transition-all duration-300 flex flex-col justify-between"
            >
              <div className="relative mb-4 bg-background-secondary rounded-lg flex items-center justify-center h-[200px] overflow-visible">
                <button
                  type="button"
                  onClick={(e) => toggleFavorite(e, book.id)}
                  className={`absolute top-2 right-2 w-9 h-9 rounded-full bg-background border border-border flex items-center justify-center transition-colors z-20 shadow-xs cursor-pointer ${
                    isFav ? "text-error border-error/40 bg-error/5" : "text-foreground-muted"
                  }`}
                  title={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
                  aria-label="Ajouter aux favoris"
                >
                  <Heart className={`w-4 h-4 ${isFav ? "fill-current" : ""}`} />
                </button>

                <Link
                  href={`/catalog/${bookSlug}`}
                  className="flex items-center justify-center w-full h-full"
                >
                  <Book3D
                    title={book.title}
                    author={authorName}
                    coverUrl={book.cover_url || book.cover_image}
                    variant="lahatheque"
                    color={book.cover_color || "var(--navy)"}
                    textColor={book.cover_text_color || "var(--gold-light)"}
                    width={{ sm: 130, md: 140, lg: 150, xl: 150 }}
                    textured
                  />
                </Link>
              </div>

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
                    {(((book as any).price_digital !== undefined && (book as any).price_digital !== null)
                      ? Number((book as any).price_digital)
                      : (book.price ? Number(book.price) : 2500)
                    ).toLocaleString("fr-FR")} FCFA
                  </span>
                  <button
                    type="button"
                    onClick={(e) => handleAddToCart(e, book)}
                    className="w-9 h-9 rounded bg-background-secondary text-gold transition-all duration-200 flex items-center justify-center shadow-xs cursor-pointer shrink-0"
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
    </section>
  );
}
