"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, ShoppingCart, Eye, Plus, Minus, ArrowLeft, ShieldCheck, Filter } from "lucide-react";
import { WholesaleCartDrawer } from "@/components/features/wholesaler/wholesale-cart-drawer";
import { BookPreviewModal } from "@/components/features/wholesaler/book-preview-modal";
import { getWholesalerBooks } from "@/lib/services/wholesaler";
import type { WholesalerBookItem, WholesalerCartItem } from "@/lib/types/wholesaler";

export default function WholesalerCatalogPage() {
  const router = useRouter();
  const [books, setBooks] = useState<WholesalerBookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [disciplineFilter, setDisciplineFilter] = useState("all");

  // Panier grossiste state
  const [cart, setCart] = useState<WholesalerCartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

  // Modale aperçu d'extrait
  const [previewBook, setPreviewBook] = useState<WholesalerBookItem | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await getWholesalerBooks();
      setBooks(data);
      setLoading(false);
    }
    loadData();
  }, []);

  const filteredBooks = useMemo(() => {
    return books.filter((b) => {
      if (disciplineFilter !== "all" && b.discipline !== disciplineFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = b.title.toLowerCase().includes(q);
        const matchIsbn = b.isbn_digital.toLowerCase().includes(q);
        const matchAuthor = b.authors.some((a) => a.toLowerCase().includes(q));
        if (!matchTitle && !matchIsbn && !matchAuthor) return false;
      }
      return true;
    });
  }, [books, searchQuery, disciplineFilter]);

  const handleAddToCart = (book: WholesalerBookItem) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.book_id === book.id);
      if (existing) return prev;
      return [
        ...prev,
        {
          book_id: book.id,
          book,
          digital_licenses_qty: 20,
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
  };

  const totalCartCount = cart.length;

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 max-w-7xl mx-auto">
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
            Tarifs Grossistes Réservés &amp; Achat de Licences Multiples
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Catalogue Achat en Gros
          </h1>
          <p className="text-xs text-foreground-muted mt-1">
            Sélectionnez les titres, consultez les métadonnées et extraits, puis constituez votre commande groupée.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCartOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors flex items-center gap-2 shadow-xs relative self-start sm:self-center min-h-[44px]"
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
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher par titre, ISBN ou auteur..."
          className="w-full sm:w-80 px-3.5 py-2 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy min-h-[40px]"
        />

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {[
            { id: "all", label: "Toutes disciplines" },
            { id: "Droit Public & Administration", label: "Droit Public" },
            { id: "Sciences Économiques", label: "Économie" },
            { id: "Médecine & Santé", label: "Médecine" },
            { id: "Agronomie & Environnement", label: "Agronomie" },
          ].map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setDisciplineFilter(d.id)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold whitespace-nowrap transition-colors border ${
                disciplineFilter === d.id
                  ? "bg-navy text-white border-navy"
                  : "bg-background-secondary text-foreground-muted border-border hover:text-navy"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grille des Ouvrages Grossiste */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredBooks.map((book) => {
          const isInCart = cart.some((item) => item.book_id === book.id);

          return (
            <div
              key={book.id}
              className="p-4 rounded-3xl bg-background border border-border space-y-4 shadow-xs hover:border-gold transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="relative group">
                  <img
                    src={book.cover_url}
                    alt={book.title}
                    className="w-full aspect-[3/4] object-cover rounded-2xl border border-border shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setPreviewBook(book)}
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center text-white font-bold text-xs gap-1.5 backdrop-blur-xs"
                  >
                    <Eye className="w-4 h-4 text-gold" />
                    Consulter Extrait
                  </button>
                </div>

                <div>
                  <span className="text-[10px] font-semibold text-navy bg-navy-light px-2 py-0.5 rounded-md inline-block mb-1">
                    {book.discipline}
                  </span>
                  <h3 className="font-serif font-bold text-xs text-navy leading-snug line-clamp-2">{book.title}</h3>
                  <p className="text-[11px] text-foreground-muted truncate mt-0.5">{book.authors.join(", ")}</p>
                  <p className="text-[10px] text-foreground-muted font-mono">ISBN: {book.isbn_digital}</p>
                </div>

                {/* Tarifs de gros */}
                <div className="p-3 rounded-2xl bg-background-secondary border border-border space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-foreground-muted font-bold">Licence Numérique :</span>
                    <span className="font-mono font-bold text-navy">{book.digital_wholesale_price.toLocaleString("fr-FR")} XOF</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-foreground-muted font-bold">Exemplaire Papier :</span>
                    <span className="font-mono font-bold text-navy">{book.print_wholesale_price.toLocaleString("fr-FR")} XOF</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-border/60">
                    <span className="text-[9px] text-foreground-muted">Prix public indicatif :</span>
                    <span className="font-mono text-[10px] text-foreground-muted line-through">{book.public_price.toLocaleString("fr-FR")} XOF</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPreviewBook(book)}
                  className="w-full py-2 rounded-xl bg-background-secondary border border-border text-navy text-xs font-bold hover:border-gold transition-colors flex items-center justify-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5 text-gold" />
                  Voir Extrait &amp; Fiche
                </button>

                <button
                  type="button"
                  onClick={() => handleAddToCart(book)}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs ${
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
