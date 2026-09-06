"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Bookmark,
  ArrowUpRight,
  CheckCircle2,
  BookOpen,
  Eye,
  ShoppingBag,
  Headphones,
} from "lucide-react";
import { toast } from "sonner";
import { ClientBookAccess } from "@/lib/types/student";
import { BookCover } from "./book-cover";
import { BookSampleModal } from "./book-sample-modal";
import { PaperOrderModal } from "./paper-order-modal";
import { createOrder } from "@/lib/services/commerce-orders";
import { useAudioPlayer } from "@/components/features/audio/audio-player-context";
import { cn } from "@/lib/utils";

interface BookListItemProps {
  book: ClientBookAccess;
  onToggleFavorite?: (id: string) => Promise<void> | void;
  className?: string;
}

export function BookListItem({ book, onToggleFavorite, className }: BookListItemProps) {
  const { playBook } = useAudioPlayer();
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
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className={cn(
          "group bg-background border border-border hover:border-gold/60 rounded-3xl p-4 transition-all duration-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs w-full min-w-0",
          className
        )}
      >
        {/* Couverture & Détails */}
        <div className="flex items-center gap-4 min-w-0 w-full md:w-auto flex-1">
          <Link href={`/catalog/reader/${book.id}`} title="Ouvrir dans la Liseuse" className="shrink-0">
            <BookCover book={book} size="sm" />
          </Link>

          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gold px-2.5 py-0.5 rounded-md bg-navy/5 border border-gold/30 shrink-0">
                {disciplineName}
              </span>
              {book.institution_name && (
                <span className="inline-flex items-center gap-1 text-[10px] text-navy font-medium bg-background-secondary px-2 py-0.5 rounded-md border border-border truncate max-w-[200px]">
                  <CheckCircle2 className="w-3 h-3 text-gold shrink-0" />
                  <span className="truncate">{book.institution_name}</span>
                </span>
              )}
            </div>

            <Link href={`/catalog/reader/${book.id}`}>
              <h3 className="font-serif font-bold text-navy text-base lg:text-lg leading-snug group-hover:text-gold transition-colors line-clamp-1">
                {book.title}
              </h3>
            </Link>
            <p className="text-xs text-foreground-muted font-medium truncate">
              Par <span className="text-navy font-semibold">{authorName}</span>{" "}
              {book.page_count ? `• ${book.page_count} pages` : ""}{" "}
              {book.edition_year ? `• Édition ${book.edition_year}` : ""}
            </p>
          </div>
        </div>

        {/* Progression */}
        {book.progress_percent !== undefined && (
          <div className="w-full md:w-48 space-y-1 shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-border">
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
              <p className="text-[10px] text-foreground-muted truncate italic">
                {book.last_read_chapter}
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 self-end md:self-center shrink-0 w-full md:w-auto justify-end border-t md:border-t-0 pt-2 md:pt-0 border-border">
          <button
            type="button"
            onClick={handleFavoriteClick}
            title={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
            className={cn(
              "p-2 rounded-xl border border-border transition-colors",
              isFav ? "text-gold bg-gold/10 border-gold/30" : "text-foreground-muted hover:text-gold"
            )}
          >
            <Bookmark className={cn("w-4 h-4", isFav && "fill-current")} />
          </button>

          <button
            type="button"
            onClick={() => setShowSample(true)}
            title="Consulter l'extrait"
            className="p-2 rounded-xl border border-border text-foreground-muted hover:text-navy transition-colors"
          >
            <Eye className="w-4 h-4 text-gold" />
          </button>

          {(book.has_paper_version || (book.paper_price && book.paper_price > 0)) && (
            <button
              type="button"
              onClick={() => setShowPaperModal(true)}
              title="Commander la version papier"
              className="p-2 rounded-xl border border-border text-navy hover:border-gold transition-colors"
            >
              <ShoppingBag className="w-4 h-4 text-gold" />
            </button>
          )}

          <Link
            href={`/student/catalog/${book.id}`}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-background-secondary hover:bg-navy/10 text-navy text-xs font-semibold border border-border transition-all min-h-[40px]"
          >
            <BookOpen className="w-3.5 h-3.5 text-gold" />
            Détails
          </Link>

          {(book.has_audio_version || (book as any).price_audio || (book as any).format === "audio" || (book as any).format_type === "audio") && (
            <button
              type="button"
              onClick={() => playBook(book.id)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gold/15 hover:bg-gold/25 text-navy font-bold text-xs border border-gold/40 transition-all min-h-[40px] cursor-pointer shadow-xs"
              title="Écouter la version audio"
            >
              <Headphones className="w-3.5 h-3.5 text-gold" />
              <span>Écouter</span>
            </button>
          )}

          <Link
            href={`/catalog/reader/${book.id}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors shadow-xs min-h-[40px]"
          >
            Lire
            <ArrowUpRight className="w-3.5 h-3.5 text-gold" />
          </Link>
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
