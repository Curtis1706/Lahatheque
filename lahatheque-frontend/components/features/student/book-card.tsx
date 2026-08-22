"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Bookmark,
  ArrowUpRight,
  CheckCircle2,
  Sparkles,
  BookOpen,
  ShoppingBag,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { ClientBookAccess } from "@/lib/types/student";
import { BookCover } from "./book-cover";
import { BookSampleModal } from "./book-sample-modal";
import { PaperOrderModal } from "./paper-order-modal";
import { createOrder } from "@/lib/services/commerce-orders";
import { cn } from "@/lib/utils";

interface BookCardProps {
  book: ClientBookAccess;
  onToggleFavorite?: (id: string) => Promise<void> | void;
  className?: string;
}

export function BookCard({ book, onToggleFavorite, className }: BookCardProps) {
  const [showSample, setShowSample] = useState(false);
  const [showPaperModal, setShowPaperModal] = useState(false);
  const [isFav, setIsFav] = useState(book.is_favorite);

  const handleFavoriteClick = async () => {
    const nextFav = !isFav;
    setIsFav(nextFav);
    if (nextFav) {
      toast.success(`« ${book.title} » ajouté aux favoris`);
    } else {
      toast.info(`« ${book.title} » retiré des favoris`);
    }
    if (onToggleFavorite) {
      await onToggleFavorite(book.id);
    }
  };

  const handlePaperOrder = async (
    bookId: string,
    bookTitle: string,
    price: number,
    address: string,
    quantity: number
  ) => {
    try {
      await createOrder({
        items: [{ ouvrage_id: bookId, format_type: "paper", quantity }],
        type_commande: "personnel",
        mode_paiement: "especes",
        shipping_address: address,
        city: "Cotonou",
        country: "BJ",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur lors de la création de la commande.";
      toast.error(msg);
      throw err;
    }
  };

  const authorName =
    book.author ||
    book.authors?.map((a) => a.full_name).join(", ") ||
    "Auteur académique";

  const disciplineName = book.discipline || book.discipline_name || "Général";

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={cn(
          "group bg-background border border-border hover:border-gold/60 rounded-3xl p-4 sm:p-5 transition-all duration-200 flex flex-col sm:flex-row gap-4 sm:gap-5 justify-between shadow-xs w-full min-w-0 overflow-hidden",
          className
        )}
      >
        {/* Couverture */}
        <div className="flex justify-center sm:justify-start shrink-0">
          <Link href={`/catalog/reader/${book.id}`} title="Ouvrir dans la Liseuse">
            <BookCover book={book} size="md" />
          </Link>
        </div>

        {/* Métadonnées & Actions */}
        <div className="flex-1 flex flex-col justify-between space-y-3 min-w-0">
          <div className="space-y-2">
            {/* Discipline, Format & Favoris */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gold px-2.5 py-0.5 rounded-md bg-navy/5 border border-gold/30 truncate max-w-[180px]">
                  {disciplineName}
                </span>
              </div>

              <button
                type="button"
                onClick={handleFavoriteClick}
                title={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
                className={cn(
                  "p-1.5 rounded-full transition-colors shrink-0",
                  isFav ? "text-gold" : "text-foreground-muted hover:text-gold"
                )}
              >
                <Bookmark className={cn("w-4 h-4", isFav && "fill-current")} />
              </button>
            </div>

            {/* Titre & Auteur */}
            <div className="space-y-0.5">
              <Link href={`/catalog/reader/${book.id}`}>
                <h3 className="font-serif font-bold text-navy text-base lg:text-lg leading-snug group-hover:text-gold transition-colors line-clamp-2">
                  {book.title}
                </h3>
              </Link>
              <p className="text-xs text-foreground-muted font-medium truncate">
                Par <span className="text-navy font-semibold">{authorName}</span>{" "}
                {book.page_count ? `• ${book.page_count} pages` : ""}
              </p>
            </div>

            {/* Établissement & Type d'accès */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              {book.institution_name && (
                <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] text-navy font-medium bg-background-secondary px-2 py-0.5 rounded-lg border border-border truncate max-w-full">
                  <CheckCircle2 className="w-3 h-3 text-gold shrink-0" />
                  <span className="truncate">{book.institution_name}</span>
                </span>
              )}
              {book.access_type === "institution_bundle" && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-navy bg-gold/15 px-2 py-0.5 rounded-md border border-gold/30 shrink-0">
                  <Sparkles className="w-3 h-3 text-gold" />
                  Bouquet Campus
                </span>
              )}
            </div>

            {/* Barre de Progression */}
            {book.progress_percent !== undefined && (
              <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-foreground-muted font-medium">Progression</span>
                  <span className="font-bold text-navy font-mono">{book.progress_percent}%</span>
                </div>
                <div className="w-full bg-background-secondary h-2 rounded-full overflow-hidden border border-border">
                  <div
                    className="bg-gold h-full rounded-full transition-all duration-300"
                    style={{ width: `${book.progress_percent}%` }}
                  />
                </div>
                {book.last_read_chapter && (
                  <p className="text-[11px] text-foreground-muted truncate italic">
                    {book.last_read_chapter}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Boutons d'Action */}
          <div className="pt-3 border-t border-border flex items-center justify-between gap-2 text-xs flex-wrap">
            <button
              type="button"
              onClick={() => setShowSample(true)}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-foreground-muted hover:text-navy transition-colors"
            >
              <Eye className="w-3.5 h-3.5 text-gold" />
              Extrait gratuit
            </button>

            <div className="flex items-center gap-2 ml-auto">
              {(book.has_paper_version || (book.paper_price && book.paper_price > 0)) && (
                <button
                  type="button"
                  onClick={() => setShowPaperModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-background-secondary hover:bg-navy/10 text-navy text-xs font-semibold border border-border transition-all min-h-[36px]"
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-gold" />
                  Papier
                </button>
              )}

              <Link
                href={`/student/catalog/${book.id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-background-secondary hover:bg-navy/10 text-navy text-xs font-semibold border border-border transition-all min-h-[36px]"
              >
                <BookOpen className="w-3.5 h-3.5 text-gold" />
                Fiche
              </Link>

              <Link
                href={`/catalog/reader/${book.id}`}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors shadow-xs min-h-[36px]"
              >
                Lire
                <ArrowUpRight className="w-3.5 h-3.5 text-gold" />
              </Link>
            </div>
          </div>
        </div>
      </motion.div>

      <BookSampleModal
        book={book}
        isOpen={showSample}
        onClose={() => setShowSample(false)}
      />

      <PaperOrderModal
        book={book}
        isOpen={showPaperModal}
        onClose={() => setShowPaperModal(false)}
        onConfirmOrder={handlePaperOrder}
      />
    </>
  );
}
