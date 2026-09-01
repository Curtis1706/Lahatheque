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
  Search,
  Package,
  LayoutGrid,
  List,
  FileText,
  Book,
  Filter,
  ChevronDown,
  X,
} from "lucide-react";
import { BookCover3D } from "@/components/ui/book-cover-3d";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { WholesaleCartDrawer } from "@/components/features/wholesaler/wholesale-cart-drawer";
import { BookPreviewModal } from "@/components/features/wholesaler/book-preview-modal";
import { WholesaleOrderModal } from "@/components/features/wholesaler/wholesale-order-modal";
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
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Panier grossiste state
  const [cart, setCart] = useState<WholesalerCartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

  // Modale aperçu d'extrait & modale de commande directe
  const [previewBook, setPreviewBook] = useState<WholesalerBookItem | null>(null);
  const [orderBook, setOrderBook] = useState<WholesalerBookItem | null>(null);

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

  // Colonnes DataTable (Aérées, visuelles et élégantes)
  const columns: DataTableColumn<WholesalerBookItem>[] = [
    {
      key: "title",
      header: "Ouvrage & Référence",
      className: "min-w-[340px]",
      cell: (row) => (
        <div className="flex items-center gap-3.5 py-1">
          <BookCover3D
            title={row.title}
            authors={row.authors}
            discipline={row.discipline}
            coverUrl={row.cover_url}
            size="xs"
            interactive={false}
          />
          <div className="min-w-0 space-y-0.5">
            <h4 className="font-serif font-bold text-xs text-navy leading-snug line-clamp-2" title={row.title}>
              {row.title}
            </h4>
            <p className="text-[11px] text-foreground-muted truncate">
              {row.authors.join(", ")}
            </p>
            <p className="text-[10px] text-foreground-muted font-mono">
              ISBN : {row.isbn_digital}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "discipline",
      header: "Discipline",
      className: "min-w-[170px]",
      cell: (row) => (
        <span className="text-[10px] font-bold text-gold bg-gold/10 border border-gold/20 px-2.5 py-1 rounded-lg inline-block">
          {row.discipline}
        </span>
      ),
    },
    {
      key: "digital_wholesale_price",
      header: "Licence Numérique (-25%)",
      className: "min-w-[160px]",
      cell: (row) => (
        <div className="space-y-0.5">
          <div className="font-mono font-bold text-xs text-navy">
            {row.digital_wholesale_price.toLocaleString("fr-FR")} XOF
          </div>
          <div className="text-[10px] text-foreground-muted line-through font-mono">
            Public : {(row.public_price || Math.round(row.digital_wholesale_price / 0.75)).toLocaleString("fr-FR")} XOF
          </div>
        </div>
      ),
    },
    {
      key: "print_wholesale_price",
      header: "Exemplaire Papier (-32%)",
      className: "min-w-[160px]",
      cell: (row) => (
        <div className="space-y-0.5">
          <div className="font-mono font-bold text-xs text-navy">
            {row.print_wholesale_price.toLocaleString("fr-FR")} XOF
          </div>
          <div className="text-[10px] text-foreground-muted line-through font-mono">
            Public : {(row.public_price || Math.round(row.print_wholesale_price / 0.68)).toLocaleString("fr-FR")} XOF
          </div>
        </div>
      ),
    },
    {
      key: "id",
      header: "Actions",
      className: "min-w-[240px] text-right",
      cell: (row) => (
        <div className="flex items-center justify-end gap-2 flex-nowrap">
          <button
            type="button"
            onClick={() => setPreviewBook(row)}
            className="px-3 py-1.5 rounded-xl bg-background-secondary border border-border text-navy hover:border-gold text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0 min-h-[38px]"
            title="Consulter l'extrait"
          >
            <Eye className="w-3.5 h-3.5 text-gold" />
            <span>Extrait</span>
          </button>
          <button
            type="button"
            onClick={() => setOrderBook(row)}
            className="px-3.5 py-1.5 rounded-xl bg-gold text-navy hover:bg-gold-light text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs shrink-0 min-h-[38px]"
          >
            <Package className="w-3.5 h-3.5" />
            <span>Commander</span>
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/wholesaler" className="hover:text-navy transition-colors">Vue d&apos;ensemble</Link>
        <span>/</span>
        <span className="text-navy font-semibold">Catalogue & Achat Gros</span>
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
            Catalogue B2B & Tarifs Librairies Partenaires
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Catalogue Achat en Gros & Réassort
          </h1>
          <p className="text-xs text-foreground-muted mt-1">
            Commandez vos lots mixtes (licences numériques pour étudiants + cartons de livres papier) avec remises volume automatiques.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCartOpen(true)}
          className="px-4 py-2.5 rounded-2xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors flex items-center gap-2 shadow-xs relative self-start sm:self-center min-h-[44px] cursor-pointer"
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

      {/* Barre de Recherche, Filtre Discipline & Sélecteur Grille / Tableau */}
      <div className="p-4 rounded-3xl bg-background border border-border flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
        {/* Recherche et Filtre par Discipline */}
        <div className="flex flex-col sm:flex-row items-center gap-3 flex-1 w-full">
          {/* Recherche */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-foreground-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par titre, ISBN ou auteur..."
              className="w-full pl-9 pr-8 py-2 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy min-h-[40px]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-navy cursor-pointer"
                title="Effacer la recherche"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sélecteur de Discipline Dropdown */}
          <div className="relative w-full sm:w-64">
            <Filter className="w-3.5 h-3.5 text-gold absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={disciplineFilter}
              onChange={(e) => setDisciplineFilter(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-semibold min-h-[40px] appearance-none cursor-pointer"
            >
              <option value="all">Toutes disciplines ({books.length})</option>
              {disciplines.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-foreground-muted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {(disciplineFilter !== "all" || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setDisciplineFilter("all");
              }}
              className="px-3 py-2 text-xs text-foreground-muted hover:text-error transition-colors flex items-center gap-1 cursor-pointer shrink-0"
              title="Réinitialiser les filtres"
            >
              <X className="w-3.5 h-3.5" />
              <span>Effacer filtres</span>
            </button>
          )}
        </div>

        {/* Compteur & Sélecteur de Vue Grille / Tableau */}
        <div className="flex items-center justify-between sm:justify-end gap-3 w-full md:w-auto shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-border">
          <span className="text-xs text-foreground-muted font-medium whitespace-nowrap">
            {filteredBooks.length} ouvrage{filteredBooks.length > 1 ? "s" : ""}
          </span>

          <div className="inline-flex rounded-xl bg-background-secondary border border-border p-1">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === "grid"
                  ? "bg-navy text-white shadow-xs font-bold"
                  : "text-foreground-muted hover:text-navy"
              }`}
              title="Affichage en Grille"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-gold" />
              <span>Grille</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === "table"
                  ? "bg-navy text-white shadow-xs font-bold"
                  : "text-foreground-muted hover:text-navy"
              }`}
              title="Affichage en Tableau"
            >
              <List className="w-3.5 h-3.5 text-gold" />
              <span>Tableau</span>
            </button>
          </div>
        </div>
      </div>

      {/* Rendu dynamique : Erreur, Chargement, Grille ou DataTable */}
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
      ) : viewMode === "grid" ? (
        /* VUE EN GRILLE */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredBooks.map((book) => (
            <div
              key={book.id}
              className="p-5 rounded-3xl bg-background border border-border space-y-4 shadow-xs hover:border-gold/60 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Visuel Couverture Réelle ou 3D Standardisée LAHAThèque */}
                <div className="relative rounded-2xl overflow-hidden bg-background-secondary/60 border border-border p-3 flex items-center justify-center group shadow-xs">
                  <BookCover3D
                    title={book.title}
                    authors={book.authors}
                    discipline={book.discipline}
                    coverUrl={book.cover_url}
                    size="md"
                    className="w-28 h-40 sm:w-32 sm:h-44"
                  />
                  <button
                    type="button"
                    onClick={() => setPreviewBook(book)}
                    className="absolute inset-0 bg-navy/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs gap-1.5 backdrop-blur-xs cursor-pointer rounded-2xl"
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
                    ISBN : {book.isbn_digital}
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
                  Voir Extrait & Fiche
                </button>

                <button
                  type="button"
                  onClick={() => setOrderBook(book)}
                  className="w-full py-2.5 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer min-h-[44px] bg-gold text-navy hover:bg-gold-light"
                >
                  <Package className="w-3.5 h-3.5" />
                  Commander cet Ouvrage
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* VUE EN TABLEAU (DATATABLE AÉRÉE & VISUELLE) */
        <div className="space-y-4">
          <DataTable
            data={filteredBooks}
            columns={columns}
            rowKey="id"
            loading={loading}
            searchable={false}
            emptyMessage="Aucun ouvrage ne correspond à vos filtres."
          />
        </div>
      )}

      {/* Modale de Commande Grossiste Directe */}
      <WholesaleOrderModal
        book={orderBook}
        isOpen={orderBook !== null}
        onClose={() => setOrderBook(null)}
      />

      {/* Modale d'Extrait & Aperçu */}
      <BookPreviewModal
        book={previewBook}
        isOpen={previewBook !== null}
        onClose={() => setPreviewBook(null)}
        onAddToCart={handleAddToCart}
        onOrder={(b) => {
          setPreviewBook(null);
          setOrderBook(b);
        }}
      />

      {/* Drawer du Panier */}
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
    </div>
  );
}
