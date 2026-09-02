"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Book, 
  BookOpen, 
  ShoppingBag, 
  Check, 
  Plus, 
  Minus, 
  Truck, 
  Store, 
  Globe, 
  Heart, 
  Laptop,
  Eye,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { useCart } from "@/context/cart-context";
import { formatEur } from "@/components/cart/cart-drawer";

interface BookActionButtonsProps {
  book: {
    id: string;
    title: string;
    author?: string;
    authors?: any;
    authors_details?: { first_name: string; last_name: string }[];
    discipline_detail?: { id: number; name: string };
    country?: string;
    level?: string;
    price?: number;
    price_paper?: number;
    cover_image?: string;
    cover_url?: string;
    stock_disponible?: number;
    is_paper_available?: boolean;
    is_digital_available?: boolean;
  };
}

export function BookActionButtons({ book }: BookActionButtonsProps) {
  const router = useRouter();
  const { addItem } = useCart();

  const isDigitalAvailable = book.is_digital_available ?? true;
  const isPaperAvailable = book.is_paper_available ?? true;
  const stockPaper = book.stock_disponible ?? 15;

  // Format initial par défaut selon disponibilité
  const initialFormat = isPaperAvailable && stockPaper > 0 ? "paper" : isDigitalAvailable ? "digital" : "paper";
  const [selectedFormat, setSelectedFormat] = useState<"digital" | "paper">(initialFormat);
  const [quantity, setQuantity] = useState<number>(1);
  const [isWishlist, setIsWishlist] = useState<boolean>(false);
  const [addedAnimation, setAddedAnimation] = useState<boolean>(false);

  const priceDigital = book.price || 2500;
  const pricePaper = book.price_paper || (book.price ? Math.round(book.price * 1.3) : 3500);

  const activePrice = selectedFormat === "digital" ? priceDigital : pricePaper;

  const authorName = book.author || 
    (book.authors_details ? book.authors_details.map(a => `${a.first_name} ${a.last_name}`).join(", ") : 
    (typeof book.authors === "string" ? book.authors : "Auteur LAHA"));

  const handleAddToCart = (autoRedirectToCheckout = false) => {
    const coverUrl = book.cover_url || book.cover_image || (book.id ? `/api/bff/catalog/books/${book.id}/cover/` : "");
    addItem({
      bookId: book.id,
      title: book.title,
      author: authorName,
      cover: coverUrl,
      format: selectedFormat,
      price: activePrice,
      quantity: selectedFormat === "digital" ? 1 : quantity,
      maxStockPaper: stockPaper,
      category: book.discipline_detail?.name || "Scolaires",
      country: book.country || "Bénin",
      level: book.level || "Tous niveaux",
    }, !autoRedirectToCheckout);

    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 2000);

    if (autoRedirectToCheckout) {
      router.push("/checkout");
    }
  };

  return (
    <div className="space-y-6 pt-2">
      {/* 1. Sélection de Format (Cartes Interactives) */}
      <div className="space-y-2.5">
        <label className="text-[11px] font-bold uppercase tracking-wider text-foreground-muted block font-mono">
          Choisir un format
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Option Format Papier */}
          {isPaperAvailable && (
            <button
              type="button"
              disabled={stockPaper <= 0}
              onClick={() => {
                setSelectedFormat("paper");
              }}
              className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between gap-2.5 cursor-pointer ${
                selectedFormat === "paper"
                  ? "border-2 border-navy bg-navy/5 shadow-xs"
                  : "border-border bg-background hover:border-gold/60"
              } ${stockPaper <= 0 ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${selectedFormat === "paper" ? "bg-navy text-white" : "bg-background-secondary text-navy"}`}>
                    <Book className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-xs sm:text-sm text-navy">
                    Livre papier
                  </span>
                </div>
                {selectedFormat === "paper" && (
                  <CheckCircle2 className="w-4 h-4 text-navy shrink-0" />
                )}
              </div>

              <div>
                <div className="font-bold text-xs sm:text-sm font-mono text-navy">
                  {pricePaper.toLocaleString("fr-FR")} F CFA
                </div>
                <div className="text-[10px] text-foreground-muted font-mono">
                  ≈ {formatEur(pricePaper)} €
                </div>
              </div>

              <div className="text-[10px] text-foreground-muted border-t border-border/50 pt-1.5 flex items-center justify-between">
                <span>{stockPaper > 0 ? "Livraison ou Click & Collect" : "Rupture de stock"}</span>
                {stockPaper > 0 && stockPaper <= 5 && (
                  <span className="text-amber-600 font-semibold font-mono">Plus que {stockPaper} ex.</span>
                )}
              </div>
            </button>
          )}

          {/* Option Format Numérique */}
          {isDigitalAvailable && (
            <button
              type="button"
              onClick={() => {
                setSelectedFormat("digital");
              }}
              className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between gap-2.5 cursor-pointer ${
                selectedFormat === "digital"
                  ? "border-2 border-navy bg-navy/5 shadow-xs"
                  : "border-border bg-background hover:border-gold/60"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${selectedFormat === "digital" ? "bg-navy text-white" : "bg-background-secondary text-navy"}`}>
                    <Laptop className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-xs sm:text-sm text-navy">
                    Livre numérique
                  </span>
                </div>
                {selectedFormat === "digital" && (
                  <CheckCircle2 className="w-4 h-4 text-navy shrink-0" />
                )}
              </div>

              <div>
                <div className="font-bold text-xs sm:text-sm font-mono text-navy">
                  {priceDigital.toLocaleString("fr-FR")} F CFA
                </div>
                <div className="text-[10px] text-foreground-muted font-mono">
                  ≈ {formatEur(priceDigital)} €
                </div>
              </div>

              <div className="text-[10px] text-foreground-muted border-t border-border/50 pt-1.5">
                Lecture immédiate (Immersion 3D)
              </div>
            </button>
          )}
        </div>
      </div>

      {/* 2. Ligne d'Actions : Quantité + Ajouter au panier + Acheter maintenant + Favori */}
      <div className="space-y-3">
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
          {/* Sélecteur de Quantité (pour livre papier uniquement) */}
          {selectedFormat === "paper" && (
            <div className="flex items-center border border-border rounded-xl bg-background p-1 shrink-0">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-foreground hover:bg-background-secondary transition-colors cursor-pointer"
                aria-label="Diminuer la quantité"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-8 text-center text-xs font-bold font-mono text-navy">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(stockPaper, q + 1))}
                disabled={quantity >= stockPaper}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-foreground hover:bg-background-secondary transition-colors cursor-pointer disabled:opacity-40"
                aria-label="Augmenter la quantité"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Bouton Ajouter au Panier (Secondaire avec icône) */}
          <button
            type="button"
            onClick={() => handleAddToCart(false)}
            disabled={selectedFormat === "paper" && stockPaper <= 0}
            className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl border-2 border-navy bg-background hover:bg-navy/5 text-navy font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed active:scale-98"
          >
            {addedAnimation ? <Check className="w-4 h-4 text-emerald-600" /> : <ShoppingBag className="w-4 h-4" />}
            <span>{addedAnimation ? "Ajouté !" : "Ajouter au panier"}</span>
          </button>

          {/* Bouton Acheter Maintenant (Primaire Solide Navy) */}
          <button
            type="button"
            onClick={() => handleAddToCart(true)}
            disabled={selectedFormat === "paper" && stockPaper <= 0}
            className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-navy hover:bg-navy-dark text-white font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed active:scale-98"
          >
            <span>Acheter maintenant</span>
          </button>

          {/* Bouton Wishlist */}
          <button
            type="button"
            onClick={() => setIsWishlist(!isWishlist)}
            title={isWishlist ? "Retirer des favoris" : "Ajouter aux favoris"}
            className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 transition-all cursor-pointer ${
              isWishlist 
                ? "bg-red-50 border-red-200 text-red-500" 
                : "border-border bg-background hover:bg-background-secondary text-foreground-muted hover:text-navy"
            }`}
          >
            <Heart className={`w-4.5 h-4.5 ${isWishlist ? "fill-current" : ""}`} />
          </button>
        </div>

        {/* Bouton Extrait 3D / Consultation Directe */}
        <Link
          href={`/catalog/reader/${book.id}?mode=sample`}
          className="w-full py-2.5 px-4 rounded-xl bg-background-secondary hover:bg-navy/10 text-navy font-semibold text-xs transition-all flex items-center justify-center gap-2 border border-border cursor-pointer"
        >
          <BookOpen className="w-4 h-4 text-gold" />
          <span>Feuilleter l'extrait gratuit en immersion 3D</span>
        </Link>
      </div>

      {/* 3. Avantages & Modes de Livraison */}
      <div className="p-4 rounded-2xl bg-background border border-border/80 space-y-2.5 text-xs text-foreground-secondary">
        <div className="flex items-center gap-2.5">
          <Truck className="w-4 h-4 text-navy shrink-0" />
          <span><strong>Livraison à domicile</strong> partout en Afrique de l'Ouest et à l'international.</span>
        </div>

        <div className="flex items-center gap-2.5">
          <Store className="w-4 h-4 text-gold shrink-0" />
          <span><strong>Click &amp; Collect gratuit</strong> — retrait en librairie partenaire sous 24h.</span>
        </div>

        <div className="flex items-center gap-2.5 text-[11px] pt-1 border-t border-border/50 text-foreground-muted">
          <Globe className="w-3.5 h-3.5 text-navy shrink-0" />
          <span>Client en France ou Europe ? Titre également distribué par notre réseau partenaire <strong>Africa Vivre</strong>.</span>
        </div>
      </div>
    </div>
  );
}
