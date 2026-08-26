"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  ShoppingCart,
  Eye,
  Plus,
  Minus,
  ArrowLeft,
  ShieldCheck,
  Filter,
  Search,
  CheckCircle2,
  Package,
  Layers,
  Sparkles,
} from "lucide-react";
import { BookCover3D } from "@/components/ui/book-cover-3d";
import { WholesaleCartDrawer } from "@/components/features/wholesaler/wholesale-cart-drawer";
import { BookPreviewModal } from "@/components/features/wholesaler/book-preview-modal";
import { getDisciplines, type DisciplineItem } from "@/lib/services/classification";
import { getWholesalerBooks } from "@/lib/services/wholesaler";
import type { WholesalerBookItem, WholesalerCartItem } from "@/lib/types/wholesaler";
import { toast } from "sonner";

export default function WholesalerCatalogPage() {
  const router = useRouter();
  const [books, setBooks] = useState<WholesalerBookItem[]>([]);
  const [disciplines, setDisciplines] = useState<DisciplineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [disciplineFilter, setDisciplineFilter] = useState("all");

  // Panier grossiste state
  const [cart, setCart] = useState<WholesalerCartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

  // Modale aperçu d'extrait
  const [previewBook, setPreviewBook] = useState<WholesalerBookItem | null>(null);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [booksData, disciplinesData] = await Promise.all([
        getWholesalerBooks(),
        getDisciplines(),
      ]);
      setBooks(booksData);
      setDisciplines(disciplinesData);
    } catch (err: unknown) {
      console.error("Erreur de chargement du catalogue grossiste", err);
      setLoadError(
        err instanceof Error ? err.message : "Impossible de charger le catalogue grossiste pour le moment."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredBooks = useMemo(() => {
    return books.filter((b) => {
      if (disciplineFilter !== "all" && b.discipline !== disciplineFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = b.title.toLowerCase().includes(q);
        const matchIsbn =
          b.isbn_digital.toLowerCase().includes(q) ||
          (b.isbn_print ? b.isbn_print.toLowerCase().includes(q) : false);
        const matchAuthor = b.authors.some((a) => a.toLowerCase().includes(q));
        if (!matchTitle && !matchIsbn && !matchAuthor) return false;
      }
      return true;
    });
  }, [books, searchQuery, disciplineFilter]);

  const handleAddToCart = (book: WholesalerBookItem) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.book_id === book.id);
      if (existing) {
        toast.info(`"${book.title}" est déjà dans votre panier.`);
        return prev;
      }
      toast.success(`"${book.title}" ajouté au panier (1 licence num. + 10 ex. papier).`);
      return [
        ...prev,
        {
          book_id: book.id,
          book,
          digital_licenses_qty: 1,
          print_copies_qty: 10,
        },
      ];
    });
    setCartOpen(true);
  };

  const handleUpdateQty = (bookId: string, type: "digital" | "print", qty: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.book_id === bookId) {
          return {
            ...item,
            [type === "digital" ? "digital_licenses_qty" : "print_copies_qty"]: qty,
          };
        }
        return item;
      })
    );
  };

  const handleRemoveItem = (bookId: string) => {
    setCart((prev) => prev.filter((item) => item.book_id !== bookId));
    toast.info("Titre retiré du panier groupé.");
  };

  const totalCartCount = cart.length;

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/wholesaler" className="hover:text-navy">Vue d&apos;ensemble</Link>
        <span>/</span>
        <span className="text-navy font-semibold">Catalogue &amp; Achat Gros</span>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/wholesaler" className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Vue d&apos;ensemble
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
            <BookOpen className="w-4 h-4 text-gold" />
            Catalogue B2B &amp; Tarifs Librairies Partenaires
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Catalogue Achat en Gros &amp; Réassort
          </h1>
          <p className="text-xs text-foreground-muted mt-1">
            Commandez vos lots mixtes (licences numériques pour étudiants + cartons de livres papier) avec remises volume automatiques.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCartOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors flex items-center gap-2 shadow-xs relative self-start sm:self-center min-h-[44px] cursor-pointer"
        >
          <ShoppingCart className="w-4 h-4 text-gold" />
          <span>Panier Commande Groupée</span>
          {totalCartCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-gold text-navy font-mono font-bold text-[10px]">
              {totalCartCount}
            </span>
          )}
        </button>
      </div>

      {/* Filtres & Recherche */}
      <div className="p-4 rounded-2xl bg-background border border-border flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-foreground-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par titre, ISBN ou auteur..."
            className="w-full pl-9 pr-3.5 py-2 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy min-h-[40px]"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setDisciplineFilter("all")}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold whitespace-nowrap transition-colors border cursor-pointer ${
              disciplineFilter === "all"
                ? "bg-navy text-white border-navy"
                : "bg-background-secondary text-foreground-muted border-border hover:text-navy"
            }`}
          >
            Toutes disciplines ({books.length})
          </button>
          {disciplines.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setDisciplineFilter(d.name)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold whitespace-nowrap transition-colors border cursor-pointer ${
                disciplineFilter === d.name
                  ? "bg-navy text-white border-navy"
                  : "bg-background-secondary text-foreground-muted border-border hover:text-navy"
              }`}
            >
              {d.name}
            </button>
          ))}
        </div>
      </div>

      {/* Erreur, Skeleton Loading ou Grille */}
      {loadError ? (
        <div className="p-8 text-center rounded-3xl bg-error/5 border border-error/20 space-y-4">
          <div className="w-12 h-12 rounded-full bg-error/10 text-error flex items-center justify-center mx-auto">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-serif font-bold text-navy text-base">
              Erreur de chargement du catalogue grossiste
            </h3>
            <p className="text-xs text-foreground-muted max-w-md mx-auto">
              {loadError}
            </p>
          </div>
          <button
            type="button"
            onClick={() => loadData()}
            className="px-5 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-dark transition-all inline-flex items-center gap-2 min-h-[40px] cursor-pointer"
          >
            <span>Réessayer</span>
          </button>
        </div>
      ) : loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="p-4 rounded-3xl bg-background border border-border space-y-4 animate-pulse shadow-xs"
            >
              <div className="w-full h-48 bg-background-secondary rounded-2xl" />
              <div className="h-4 bg-background-secondary rounded w-3/4" />
              <div className="h-3 bg-background-secondary rounded w-1/2" />
              <div className="h-16 bg-background-secondary rounded-xl" />
              <div className="h-10 bg-background-secondary rounded-xl" />
            </div>
          ))}
        </div>
      ) : filteredBooks.length === 0 ? (
        <div className="p-12 rounded-3xl bg-background border border-border text-center space-y-3">
          <BookOpen className="w-12 h-12 text-gold mx-auto opacity-40" />
          <h3 className="font-serif font-bold text-navy text-base">Aucun ouvrage trouvé</h3>
          <p className="text-xs text-foreground-muted">
            Modifiez vos critères de recherche ou réinitialisez les filtres par discipline.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setDisciplineFilter("all");
            }}
            className="px-4 py-2 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors cursor-pointer"
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredBooks.map((book) => {
            const isInCart = cart.some((item) => item.book_id === book.id);

            return (
              <div
                key={book.id}
                className="p-5 rounded-3xl bg-background border border-border space-y-4 shadow-xs hover:border-gold/60 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Visuel Couverture Réelle ou 3D */}
                  <div className="relative rounded-2xl overflow-hidden bg-background-secondary border border-border aspect-[3/4] flex items-center justify-center group shadow-xs">
                    {book.cover_url && book.cover_url !== "/placeholder-cover.jpg" ? (
                      <img
                        src={book.cover_url}
                        alt={book.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="p-4 text-center space-y-2">
                        <BookOpen className="w-10 h-10 text-navy/40 mx-auto" />
                        <span className="text-[10px] font-bold text-navy uppercase block line-clamp-2">
                          {book.title}
                        </span>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setPreviewBook(book)}
                      className="absolute inset-0 bg-navy/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs gap-1.5 backdrop-blur-xs cursor-pointer"
                    >
                      <Eye className="w-4 h-4 text-gold" />
                      Consulter Extrait
                    </button>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-gold bg-gold/10 border border-gold/20 px-2 py-0.5 rounded-md inline-block mb-1">
                      {book.discipline}
                    </span>
                    <h3 className="font-serif font-bold text-xs text-navy leading-snug line-clamp-2">
                      {book.title}
                    </h3>
                    <p className="text-[11px] text-foreground-muted truncate mt-0.5">
                      {book.authors.join(", ")}
                    </p>
                    <p className="text-[10px] text-foreground-muted font-mono">
                      ISBN: {book.isbn_digital}
                    </p>
                  </div>

                  {/* Tarifs de gros & Remises */}
                  <div className="p-3 rounded-2xl bg-background-secondary border border-border space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-foreground-muted font-bold">
                        Licence Numérique (-{book.digital_discount_pct ?? 25}%) :
                      </span>
                      <span className="font-mono font-bold text-navy">
                        {book.digital_wholesale_price.toLocaleString("fr-FR")} XOF
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-foreground-muted font-bold">
                        Exemplaire Papier (-{book.paper_discount_pct ?? 32}%) :
                      </span>
                      <span className="font-mono font-bold text-navy">
                        {book.print_wholesale_price.toLocaleString("fr-FR")} XOF
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setPreviewBook(book)}
                    className="w-full py-2 rounded-xl bg-background-secondary border border-border text-navy text-xs font-bold hover:border-gold transition-colors flex items-center justify-center gap-1.5 cursor-pointer min-h-[40px]"
                  >
                    <Eye className="w-3.5 h-3.5 text-gold" />
                    Voir Extrait &amp; Fiche
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAddToCart(book)}
                    className={`w-full py-2.5 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer min-h-[44px] ${
                      isInCart
                        ? "bg-emerald-600 text-white"
                        : "bg-navy text-white hover:bg-navy-hover"
                    }`}
                  >
                    <ShoppingCart className="w-3.5 h-3.5 text-gold" />
                    {isInCart ? "Dans le Panier Groupé" : "Ajouter à la Commande"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Drawer du Panier 21st.dev Shopping Cart (id: 5797) */}
      <WholesaleCartDrawer
        items={cart}
        onUpdateQty={handleUpdateQty}
        onRemoveItem={handleRemoveItem}
        onCheckout={() => {
          router.push("/wholesaler/orders/new");
        }}
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
      />

      {/* Modale d'Extrait & Aperçu */}
      <BookPreviewModal
        book={previewBook}
        isOpen={previewBook !== null}
        onClose={() => setPreviewBook(null)}
        onAddToCart={handleAddToCart}
      />
    </div>
  );
}
