"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, ShoppingBag, Check } from "lucide-react";
import { useCart } from "@/context/cart-context";

interface BookActionButtonsProps {
  book: {
    id: string;
    title: string;
    author?: string;
    authors?: any;
    price?: number;
    price_paper?: number;
    cover_image?: string;
    stock_disponible?: number;
  };
}

export function BookActionButtons({ book }: BookActionButtonsProps) {
  const [selectedFormat, setSelectedFormat] = useState<"digital" | "paper">("digital");
  const [addedToCart, setAddedToCart] = useState(false);
  const { addItem } = useCart();

  const stockPaper = book.stock_disponible ?? 5;
  const priceDigital = book.price || 0;
  const pricePaper = book.price_paper || Math.round(priceDigital * 1.25);

  return (
    <div className="pt-6 border-t border-border space-y-4">
      <div className="flex flex-col gap-3">
        {/* Sélection Format */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-navy uppercase tracking-wider">Format :</label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedFormat("digital")}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                selectedFormat === "digital"
                  ? "bg-navy text-white border-navy shadow-sm"
                  : "bg-background text-foreground border-border hover:border-gold"
              }`}
            >
              Numérique ({priceDigital.toLocaleString("fr-FR")} FCFA)
            </button>

            <button
              type="button"
              disabled={stockPaper <= 0}
              onClick={() => setSelectedFormat("paper")}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                stockPaper <= 0
                  ? "bg-background-secondary text-foreground-muted border-border cursor-not-allowed opacity-60"
                  : selectedFormat === "paper"
                  ? "bg-navy text-white border-navy shadow-sm cursor-pointer"
                  : "bg-background text-foreground border-border hover:border-gold cursor-pointer"
              }`}
            >
              Papier ({pricePaper.toLocaleString("fr-FR")} FCFA)
              {stockPaper <= 0 && " (Rupture)"}
            </button>
          </div>
        </div>

        {/* Boutons d'Action */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-2">
          <Link
            href={`/catalog/reader/${book.id}`}
            className="flex-1 px-5 py-3.5 rounded-xl bg-navy hover:bg-navy-hover text-white text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <BookOpen className="w-4.5 h-4.5 text-gold" />
            Consulter le livre
          </Link>

          <button
            type="button"
            onClick={() => {
              const activePrice = selectedFormat === "digital" ? priceDigital : pricePaper;
              addItem({
                bookId: book.id,
                title: book.title,
                author: book.author || (typeof book.authors === 'string' ? book.authors : 'Auteur LAHAThèque'),
                cover: book.cover_image,
                format: selectedFormat,
                price: activePrice,
                quantity: 1,
                maxStockPaper: stockPaper,
              });
              setAddedToCart(true);
              setTimeout(() => setAddedToCart(false), 2500);
            }}
            className="px-5 py-3.5 rounded-xl bg-gold hover:bg-gold-hover text-navy font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer active:scale-95"
          >
            {addedToCart ? <Check className="w-4.5 h-4.5" /> : <ShoppingBag className="w-4.5 h-4.5" />}
            {addedToCart ? "Ajouté au panier !" : "Ajouter au panier"}
          </button>
        </div>
      </div>

      {addedToCart && (
        <div className="p-3.5 rounded-xl bg-gold/10 border border-gold/30 text-navy text-xs font-semibold flex items-center justify-between animate-in fade-in duration-200">
          <span>Livre ajouté au panier !</span>
          <Link href="/cart" className="font-bold underline text-gold-dark hover:text-navy">
            Voir le panier →
          </Link>
        </div>
      )}
    </div>
  );
}
