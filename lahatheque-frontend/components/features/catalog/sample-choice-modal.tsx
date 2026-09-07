"use client";

/**
 * Modale de Choix du Format d'Extrait (SampleChoiceModal).
 * Permet à l'utilisateur de choisir entre lire l'extrait écrit (Liseuse DRM)
 * ou écouter l'extrait audio (Lecteur Audio immersif).
 * Conforme à la charte LAHAThèque : tokens sémantiques, zéro émoji, Playfair/Poppins.
 */

import React from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Headphones, X, ArrowRight } from "lucide-react";
import { useAudioPlayer } from "@/components/features/audio/audio-player-context";

export interface SampleChoiceBook {
  id: string;
  title: string;
  author?: string;
  authors?: Array<{ full_name?: string }>;
  cover_image?: string;
  cover_url?: string;
  cover_image_url?: string;
  sample_pages_count?: number;
  has_audio?: boolean;
  has_audio_version?: boolean;
  price_audio?: number | null;
}

interface SampleChoiceModalProps {
  book: SampleChoiceBook | null;
  isOpen: boolean;
  onClose: () => void;
}

export function SampleChoiceModal({
  book,
  isOpen,
  onClose,
}: SampleChoiceModalProps) {
  const router = useRouter();
  const { playBook } = useAudioPlayer();

  if (!isOpen || !book) return null;

  const authorName =
    book.author ||
    book.authors?.map((a) => a.full_name).filter(Boolean).join(", ") ||
    "Auteur LAHAThèque";

  const handleReadSample = () => {
    onClose();
    router.push(`/catalog/reader/${book.id}?mode=sample`);
  };

  const handleListenSample = async () => {
    onClose();
    // Lance la lecture de l'extrait audio et redirige vers la page universelle de lecture
    await playBook(book.id, { preview: true });
    router.push(`/listen/${book.id}`);
  };

  const hasDigitalFormat = (book as any).is_digital_available !== false && (book as any).format_type !== "audio";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="sample-choice-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-dark/70 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-background border border-border rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Bouton Fermer */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-foreground-muted hover:text-navy hover:bg-background-secondary transition-colors cursor-pointer"
          title="Fermer la fenêtre"
        >
          <X className="w-5 h-5" />
        </button>

        {/* En-tête */}
        <div className="space-y-1 pr-8">
          <span className="text-[10px] uppercase tracking-widest font-bold text-gold px-2.5 py-1 rounded-md bg-gold/10 border border-gold/30 inline-block">
            Découverte Gratuite
          </span>
          <h3
            id="sample-choice-title"
            className="font-serif font-bold text-xl sm:text-2xl text-navy pt-1"
          >
            Choisir le format d&apos;extrait
          </h3>
          <p className="text-xs sm:text-sm text-foreground-muted font-sans line-clamp-1">
            « {book.title} » • {authorName}
          </p>
        </div>

        {/* Options de choix */}
        <div className={`grid gap-4 pt-2 ${hasDigitalFormat ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}>
          {/* Option 1 : Lire l'extrait écrit (uniquement si le format numérique existe) */}
          {hasDigitalFormat && (
            <button
              type="button"
              onClick={handleReadSample}
              className="group p-5 rounded-2xl border-2 border-border hover:border-gold/60 bg-background-secondary hover:bg-background transition-all text-left flex flex-col justify-between gap-4 cursor-pointer shadow-xs hover:shadow-md"
            >
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-navy/10 group-hover:bg-gold/15 text-navy group-hover:text-gold flex items-center justify-center transition-colors">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-serif font-bold text-base text-navy group-hover:text-gold transition-colors">
                    Lire le livre
                  </h4>
                  <p className="text-xs text-foreground-muted font-sans leading-relaxed">
                    Feuilletez les premières pages de l&apos;ouvrage.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border/60 text-xs font-semibold text-navy group-hover:text-gold">
                <span>Ouvrir la liseuse</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </div>
            </button>
          )}

          {/* Option 2 : Écouter l'extrait audio */}
          <button
            type="button"
            onClick={handleListenSample}
            className="group p-5 rounded-2xl border-2 border-gold/40 hover:border-gold bg-gold/5 hover:bg-gold/10 transition-all text-left flex flex-col justify-between gap-4 cursor-pointer shadow-xs hover:shadow-md"
          >
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-gold/20 text-gold flex items-center justify-center transition-colors">
                <Headphones className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-serif font-bold text-base text-navy group-hover:text-gold transition-colors">
                    Écouter l&apos;audio
                  </h4>
                  <span className="text-[10px] uppercase font-bold text-gold px-1.5 py-0.5 rounded bg-gold/15 border border-gold/30">
                    3:00 max
                  </span>
                </div>
                <p className="text-xs text-foreground-muted font-sans leading-relaxed">
                  Écoutez les 3 premières minutes de la version audio haute fidélité.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gold/20 text-xs font-semibold text-gold">
              <span>Lancer l&apos;écoute</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </div>
          </button>
        </div>

        {/* Pied de modale informatif */}
        <div className="text-center pt-2 border-t border-border/60">
          <p className="text-[11px] text-foreground-muted font-sans">
            Aucun débit ni carte bancaire requis pour consulter les extraits.
          </p>
        </div>
      </div>
    </div>
  );
}
