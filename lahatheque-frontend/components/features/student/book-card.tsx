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
  Headphones,
  Languages,
} from "lucide-react";
import { toast } from "sonner";
import { ClientBookAccess } from "@/lib/types/student";
import { BookCover } from "./book-cover";
import { PaperOrderModal } from "./paper-order-modal";
import { createOrder } from "@/lib/services/commerce-orders";
import { useAudioPlayer } from "@/components/features/audio/audio-player-context";
import { cn } from "@/lib/utils";

interface BookCardProps {
  book: ClientBookAccess;
  onToggleFavorite?: (id: string) => Promise<void> | void;
  className?: string;
}

export function BookCard({ book, onToggleFavorite, className }: BookCardProps) {
  const { playBook } = useAudioPlayer();
  const [showPaperModal, setShowPaperModal] = useState(false);
  const [isFav, setIsFav] = useState(book.is_favorite);
  const [selectedLang, setSelectedLang] = useState<string>(
    book.available_languages?.[0] || book.language || "fr"
  );

  const isAudioOwned = Boolean(book.is_audio_owned || (book as any).has_audio_access);
  const isDigitalOwned = Boolean(book.is_owned || book.has_digital_access);

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
    quantity: number,
    language?: string
  ) => {
    try {
      await createOrder({
        items: [{
          ouvrage_id: bookId,
          format_type: "paper",
          quantity,
          selected_language: language || "fr"
        }],
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
          "group bg-background border border-border hover:border-gold/60 rounded-3xl p-4 sm:p-5 transition-all duration-200 flex flex-col justify-between gap-4 shadow-xs w-full min-w-0 overflow-hidden",
          className
        )}
      >
        {/* Partie Haute : Couverture & Métadonnées */}
        <div className="space-y-3 min-w-0">
          <div className="flex items-start gap-3.5 min-w-0">
            {isDigitalOwned ? (
              <Link
                href={`/catalog/reader/${book.id}${selectedLang ? `?lang=${selectedLang}` : ""}`}
                title="Ouvrir dans la Liseuse"
                className="shrink-0 group-hover:scale-[1.02] transition-transform"
              >
                <BookCover book={book} size="sm" />
              </Link>
            ) : isAudioOwned ? (
              <button
                type="button"
                onClick={() => playBook(book.id)}
                title="Écouter la version audio"
                className="shrink-0 group-hover:scale-[1.02] transition-transform cursor-pointer"
              >
                <BookCover book={book} size="sm" />
              </button>
            ) : (
              <div className="shrink-0">
                <BookCover book={book} size="sm" />
              </div>
            )}

            <div className="flex-1 min-w-0 space-y-1.5">
              {/* Discipline, Format & Favoris */}
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gold px-2 py-0.5 rounded-md bg-gold/10 border border-gold/25 truncate max-w-[140px]">
                    {disciplineName}
                  </span>

                  {isAudioOwned && isDigitalOwned ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-gold px-2 py-0.5 rounded-md bg-gold/15 border border-gold/30">
                      <Headphones className="w-3 h-3 text-gold" />
                      Num. &amp; Audio
                    </span>
                  ) : isAudioOwned ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-gold px-2 py-0.5 rounded-md bg-gold/15 border border-gold/30">
                      <Headphones className="w-3 h-3 text-gold" />
                      Livre Audio
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-navy px-2 py-0.5 rounded-md bg-navy/5 border border-border">
                      <BookOpen className="w-3 h-3 text-gold" />
                      Numérique
                    </span>
                  )}
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
                <Link href={`/catalog/reader/${book.id}${selectedLang ? `?lang=${selectedLang}` : ""}`}>
                  <h3 className="font-serif font-bold text-navy text-sm sm:text-base leading-snug group-hover:text-gold transition-colors line-clamp-2">
                    {book.title}
                  </h3>
                </Link>
                <p className="text-xs text-foreground-muted font-medium truncate">
                  Par <span className="text-navy font-semibold">{authorName}</span>
                </p>
              </div>

              {/* Établissement & Type d'accès */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                {book.institution_name && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-navy font-medium bg-background-secondary px-2 py-0.5 rounded-lg border border-border truncate max-w-full">
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
            </div>
          </div>

          {/* Barre de Progression (Réservée à la lecture numérique) */}
          {isDigitalOwned && typeof book.progress_percent === "number" && (
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

        {/* Partie Basse : Boutons d'Action (Zéro débordement, alignement parfait) */}
        <div className="pt-3 border-t border-border flex items-center gap-2 text-xs w-full min-w-0">
          <Link
            href={`/student/catalog/${book.id}`}
            className="px-3 py-2 rounded-xl bg-background-secondary hover:bg-navy/10 text-navy text-xs font-semibold border border-border transition-all min-h-[38px] inline-flex items-center justify-center gap-1.5 shrink-0"
            title="Consulter la fiche détaillée"
          >
            <BookOpen className="w-3.5 h-3.5 text-gold" />
            <span>Fiche</span>
          </Link>

          {/* Écouter réservé STRICTEMENT aux possesseurs de l'audio */}
          {isAudioOwned && (
            <button
              type="button"
              onClick={() => playBook(book.id)}
              className={cn(
                "px-3 py-2 rounded-xl transition-all min-h-[38px] inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-xs",
                !isDigitalOwned
                  ? "flex-1 bg-navy hover:bg-navy-hover text-white font-bold text-xs"
                  : "bg-gold/15 hover:bg-gold/25 text-navy font-bold text-xs border border-gold/40 shrink-0"
              )}
              title="Écouter la version audio"
            >
              <Headphones className="w-3.5 h-3.5 text-gold" />
              <span className="truncate">Écouter</span>
            </button>
          )}

          {(book.has_paper_version || (book.paper_price && book.paper_price > 0)) && (
            <button
              type="button"
              onClick={() => setShowPaperModal(true)}
              className="px-3 py-2 rounded-xl bg-background-secondary hover:bg-navy/10 text-navy text-xs font-semibold border border-border transition-all min-h-[38px] inline-flex items-center justify-center gap-1.5 shrink-0"
              title="Commander un exemplaire papier"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-gold" />
              <span>Papier</span>
            </button>
          )}

          {isDigitalOwned && book.available_languages && book.available_languages.length > 1 && (
            <div className="inline-flex items-center rounded-xl bg-background-secondary border border-border p-0.5 text-xs shrink-0">
              {book.available_languages.map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setSelectedLang(lang)}
                  className={cn(
                    "px-2 py-1 rounded-lg font-bold text-[10px] uppercase transition-colors",
                    selectedLang.toLowerCase() === lang.toLowerCase()
                      ? "bg-navy text-gold"
                      : "text-foreground-muted hover:text-navy"
                  )}
                >
                  {lang}
                </button>
              ))}
            </div>
          )}

          {isDigitalOwned && (
            <Link
              href={`/catalog/reader/${book.id}${selectedLang ? `?lang=${selectedLang}` : ""}`}
              className="flex-1 px-4 py-2 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors shadow-xs min-h-[38px] inline-flex items-center justify-center gap-1.5 min-w-0 truncate"
              title="Lire dans la Liseuse"
            >
              <span className="truncate">Lire</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-gold shrink-0" />
            </Link>
          )}
        </div>
      </motion.div>

      <PaperOrderModal
        book={book}
        isOpen={showPaperModal}
        onClose={() => setShowPaperModal(false)}
        onConfirmOrder={handlePaperOrder}
      />
    </>
  );
}
