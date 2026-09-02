"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  ShieldCheck, 
  Award, 
  AlertTriangle,
  Star,
  ChevronRight,
  Loader2
} from "lucide-react";
import { Book } from "@/lib/types/catalog";
import { getBookById, searchBooks } from "@/lib/services/catalog";
import { BookActionButtons } from "@/components/catalog/book-action-buttons";
import { Book as Book3D } from "@/components/ui/book";
import { formatEur } from "@/components/cart/cart-drawer";

export default function BookDetailPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);

  const [book, setBook] = useState<Book | null>(null);
  const [relatedBooks, setRelatedBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;

    async function loadData() {
      setLoading(true);
      try {
        const fetchedBook = await getBookById(id);
        if (!isMounted) return;
        setBook(fetchedBook);

        if (fetchedBook) {
          const disciplineId = fetchedBook.discipline_detail?.id?.toString();
          const allBooks = await searchBooks({ discipline: disciplineId });
          if (isMounted) {
            setRelatedBooks(allBooks.filter((b) => b.id !== fetchedBook.id).slice(0, 4));
          }
        }
      } catch (err) {
        console.error("Erreur chargement livre :", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[70vh] bg-background text-foreground flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-gold animate-spin" />
        <p className="text-xs sm:text-sm text-foreground-muted font-sans">
          Chargement de l'ouvrage en cours...
        </p>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-background text-foreground py-20 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-500/10 text-red-600 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h1 className="font-serif text-2xl font-bold text-navy">Ouvrage introuvable</h1>
        <p className="text-sm text-foreground-muted max-w-sm">
          Le document demandé n'existe pas ou n'est plus disponible dans notre catalogue.
        </p>
        <Link
          href="/catalog"
          className="inline-flex items-center gap-2 bg-navy hover:bg-navy-dark text-white text-xs font-bold px-6 py-3 rounded-xl shadow cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour au catalogue
        </Link>
      </div>
    );
  }

  const authorsString = book.authors_details && book.authors_details.length > 0
    ? book.authors_details.map((a) => `${a.first_name} ${a.last_name}`).join(", ")
    : "Auteur LAHA";

  const formatsAvailableText = 
    (book.is_paper_available !== false && book.is_digital_available !== false)
      ? "Livre broché & Numérique"
      : book.is_paper_available !== false
      ? "Livre broché"
      : "Livre numérique";

  return (
    <div className="min-h-screen bg-background text-foreground py-6 sm:py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* 1. Fil d'Ariane (Breadcrumbs) */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-foreground-muted overflow-x-auto whitespace-nowrap py-1">
          <Link href="/" className="hover:text-gold transition-colors">
            Accueil
          </Link>
          <ChevronRight className="w-3.5 h-3.5 opacity-50 shrink-0" />
          <Link href="/catalog" className="hover:text-gold transition-colors">
            Catalogue
          </Link>
          <ChevronRight className="w-3.5 h-3.5 opacity-50 shrink-0" />
          <Link 
            href={`/catalog?discipline=${book.discipline_detail?.id}`}
            className="hover:text-gold transition-colors"
          >
            {book.discipline_detail?.name || "Général"}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 opacity-50 shrink-0" />
          <span className="text-navy font-semibold truncate max-w-xs sm:max-w-md">
            {book.title}
          </span>
        </nav>

        {/* 2. Carte Principale de la Fiche Ouvrage */}
        <div className="bg-background-secondary rounded-3xl border border-border overflow-hidden p-6 sm:p-8 lg:p-10 grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 shadow-xs">
          
          {/* Couverture / Aperçu Visuel 3D (Colonne Gauche) */}
          <div className="md:col-span-5 flex flex-col items-center justify-start space-y-5">
            <div className="relative group p-4 sm:p-6 bg-background rounded-2xl border border-border/80 shadow-xs flex items-center justify-center w-full max-w-[320px]">
              {book.cover_url || book.cover_image ? (
                <div className="relative w-[190px] sm:w-[220px] aspect-[2/3] rounded-r-xl rounded-l-xs overflow-hidden shadow-2xl border-l-4 border-black/30 border-r border-t border-b border-border/80 transition-transform duration-300 group-hover:scale-102">
                  <img
                    src={book.cover_url || book.cover_image}
                    alt={book.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center py-2">
                  <Book3D 
                    title={book.title}
                    author={authorsString}
                    variant="lahatheque"
                    color={book.cover_color || "var(--navy)"}
                    textColor={book.cover_text_color || "var(--gold)"}
                    width={{ sm: 180, md: 200, lg: 220, xl: 220 }}
                    textured
                  />
                </div>
              )}
            </div>

            {/* Badges de Confiance & Garantie */}
            <div className="flex items-center justify-center gap-4 text-foreground-muted text-xs pt-1">
              <span className="flex items-center gap-1.5 font-medium">
                <ShieldCheck className="w-4 h-4 text-gold" />
                Certifié LAHA
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <Award className="w-4 h-4 text-gold" />
                Garantie Éditeur
              </span>
            </div>
          </div>

          {/* Métadonnées & Zone d'Achat (Colonne Droite) */}
          <div className="md:col-span-7 space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              
              {/* Catégorie & Pays */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-widest text-gold font-mono">
                  {book.discipline_detail?.name || "SCOLAIRES"} • {book.country ? book.country.toUpperCase() : "BÉNIN"}
                </span>
              </div>

              {/* Titre Principal */}
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-navy leading-tight">
                  {book.title}
                </h1>
                {book.subtitle && (
                  <p className="text-sm font-medium text-foreground-muted italic mt-1">
                    {book.subtitle}
                  </p>
                )}
              </div>

              {/* Auteur & Éditeur */}
              <p className="text-xs sm:text-sm text-foreground">
                Auteur : <strong className="text-navy">{authorsString}</strong> — <span className="text-foreground-secondary">{book.publisher_name || "LAHA Éditions"}</span>
              </p>

              {/* Badges de Caractéristiques */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-background text-navy border border-border text-[11px] font-semibold">
                  Catégorie : <strong className="ml-1 text-navy">{book.discipline_detail?.name || "Général"}</strong>
                </span>

                <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-background text-navy border border-border text-[11px] font-semibold">
                  Pays : <strong className="ml-1 text-navy">{book.country || "Bénin"}</strong>
                </span>

                <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-background text-navy border border-border text-[11px] font-semibold">
                  Niveau : <strong className="ml-1 text-navy">{book.level || "Tous niveaux"}</strong>
                </span>

                <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-background text-navy border border-border text-[11px] font-semibold">
                  Formats : <strong className="ml-1 text-navy">{formatsAvailableText}</strong>
                </span>
              </div>

              {/* Étoiles & Note */}
              <div className="flex items-center gap-2 pt-1">
                <div className="flex items-center text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-500 text-amber-500" />
                  ))}
                </div>
                <span className="text-xs font-semibold text-foreground-secondary font-mono">
                  {book.rating || 4.8} sur 5
                </span>
              </div>
            </div>

            {/* Sélecteur de Formats & Boutons d'Action (Panier & Checkout) */}
            <BookActionButtons book={book} />

          </div>
        </div>

        {/* 3. Description & Présentation Détaillée */}
        <div className="bg-background rounded-3xl border border-border p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="border-b border-border pb-4">
            <h2 className="font-serif text-lg sm:text-xl font-bold text-navy">
              Description de l'ouvrage
            </h2>
          </div>

          <div className="prose max-w-none text-xs sm:text-sm text-foreground/90 leading-relaxed space-y-4">
            <p>{book.summary || "Aucune description détaillée n'a été fournie pour cet ouvrage."}</p>
          </div>

          {/* Table des Spécifications Techniques */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-border text-xs">
            <div>
              <span className="text-foreground-muted block text-[11px] font-semibold uppercase tracking-wider font-mono">ISBN</span>
              <span className="font-mono text-navy font-bold">{book.isbn || "Non renseigné"}</span>
            </div>

            <div>
              <span className="text-foreground-muted block text-[11px] font-semibold uppercase tracking-wider font-mono">Éditeur</span>
              <span className="font-semibold text-navy">{book.publisher_name || "LAHA Éditions"}</span>
            </div>

            <div>
              <span className="text-foreground-muted block text-[11px] font-semibold uppercase tracking-wider font-mono">Année d'édition</span>
              <span className="font-semibold text-navy font-mono">{book.publication_year || 2026}</span>
            </div>

            <div>
              <span className="text-foreground-muted block text-[11px] font-semibold uppercase tracking-wider font-mono">Pagination</span>
              <span className="font-semibold text-navy font-mono">{book.total_pages || (book as any).page_count || 120} pages</span>
            </div>
          </div>
        </div>

        {/* 4. Section "Vous aimerez aussi" (Livres Recommandés) */}
        {relatedBooks.length > 0 && (
          <div className="space-y-6 pt-4">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-navy">
                Vous aimerez aussi
              </h2>
              <Link
                href={`/catalog?discipline=${book.discipline_detail?.id}`}
                className="text-xs font-semibold text-gold hover:text-navy transition-colors flex items-center gap-1"
              >
                Voir toute la sélection
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {relatedBooks.map((item) => (
                <Link
                  key={item.id}
                  href={`/catalog/${item.id}`}
                  className="group bg-background-secondary rounded-2xl border border-border p-4 flex flex-col justify-between hover:border-gold/50 hover:shadow-md transition-all"
                >
                  <div className="flex flex-col items-center space-y-3 text-center">
                    <div className="relative w-28 sm:w-32 aspect-[2/3] rounded-r-md rounded-l-xs overflow-hidden shadow-md border-l-2 border-black/30 border-border group-hover:scale-103 transition-transform">
                      {item.cover_url || item.cover_image ? (
                        <img
                          src={item.cover_url || item.cover_image}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-navy text-gold flex items-center justify-center font-serif text-[10px] p-2 text-center">
                          {item.title}
                        </div>
                      )}
                    </div>

                    <div className="space-y-1 w-full">
                      <h4 className="font-serif font-bold text-xs sm:text-sm text-navy line-clamp-2 leading-snug group-hover:text-gold transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-foreground-muted truncate">
                        {item.authors_details?.[0] ? `${item.authors_details[0].first_name} ${item.authors_details[0].last_name}` : "Auteur LAHA"}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border/60 text-center">
                    <div className="font-bold text-xs font-mono text-navy">
                      {(item.price || 2500).toLocaleString("fr-FR")} F CFA
                    </div>
                    <div className="text-[10px] text-foreground-muted font-mono">
                      ≈ {formatEur(item.price || 2500)} €
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 5. Bannière d'Information / Newsletter */}
        <div className="rounded-3xl bg-gold/10 border border-gold/30 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <h3 className="font-serif text-lg font-bold text-navy">
              Restez informé-e
            </h3>
            <p className="text-xs text-foreground-secondary">
              Recevez les nouvelles parutions universitaires et scolaires directement dans votre boîte mail.
            </p>
          </div>

          <form className="flex w-full md:w-auto items-center gap-2" onSubmit={(e) => e.preventDefault()}>
            <input
              type="email"
              placeholder="Votre adresse e-mail"
              className="px-4 py-2.5 rounded-xl border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-gold w-full sm:w-64"
            />
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gold hover:bg-gold-hover text-navy font-bold text-xs transition-colors shrink-0 shadow-xs cursor-pointer"
            >
              S'abonner
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
