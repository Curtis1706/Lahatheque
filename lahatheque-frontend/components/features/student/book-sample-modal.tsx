"use client";

import React from "react";
import { Sparkles, FileText, ArrowUpRight, BookOpen } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import type { ClientBookAccess } from "@/lib/types/student";
import { BookCover } from "./book-cover";

interface BookSampleModalProps {
  book: (Partial<ClientBookAccess> & { id: string; title: string; author?: string }) | null;
  isOpen: boolean;
  onClose: () => void;
}

export function BookSampleModal({
  book,
  isOpen,
  onClose,
}: BookSampleModalProps) {
  if (!book) return null;

  const authorName = book.author || "Auteur académique";
  const disciplineName = book.discipline || book.discipline_name || "Matière générale";

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-navy font-serif font-bold text-base">
          <Sparkles className="w-5 h-5 text-gold" />
          Extrait Gratuit : {book.title}
        </div>
      }
      maxWidth={680}
    >
      <div className="space-y-4 pt-2 text-xs">
        <div className="p-3.5 rounded-2xl bg-gold/10 border border-gold/30 text-navy flex items-center justify-between">
          <span className="font-semibold flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-gold" />
            Lecture d&apos;extrait gratuit ({book.sample_pages_count || 15} premières pages)
          </span>
          <span className="text-[10px] font-mono uppercase bg-gold/20 text-gold px-2 py-0.5 rounded font-bold">
            Sans inscription
          </span>
        </div>

        {/* Header avec Couverture et résumé */}
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-background-secondary border border-border">
          <BookCover book={book} size="sm" />
          <div className="min-w-0 space-y-1">
            <h3 className="font-serif font-bold text-navy text-sm line-clamp-2">{book.title}</h3>
            <p className="text-xs text-foreground-muted truncate">Par {authorName}</p>
            <p className="text-[11px] text-navy font-medium font-mono">{disciplineName}</p>
          </div>
        </div>

        {/* Aperçu des pages d'extrait */}
        <div className="p-6 rounded-3xl bg-background-secondary border border-border min-h-[200px] max-h-[300px] overflow-y-auto space-y-4 font-serif text-sm leading-relaxed text-foreground select-none">
          <p className="first-letter:text-3xl first-letter:font-bold first-letter:text-navy">
            &ldquo;L&apos;organisation des institutions et la diffusion des connaissances juridiques et scientifiques constituent les piliers de l&apos;excellence universitaire en Afrique. Cet extrait présente la table des matières, l&apos;introduction générale et les fondements méthodologiques de l&apos;ouvrage.&rdquo;
          </p>

          <p className="text-xs text-foreground-muted font-sans italic border-l-2 border-gold pl-3 py-1">
            Note de consultation : Vous pouvez lire cet extrait en toute liberté. Pour débloquer l&apos;intégralité de l&apos;ouvrage, vous pouvez l&apos;acquérir à l&apos;unité ou activer vos bouquets universitaires partenaires.
          </p>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-border flex-wrap gap-2">
          <Link
            href={`/catalog/reader/${book.id}`}
            onClick={() => {
              toast.info(`Ouverture de la liseuse pour « ${book.title} »`);
              onClose();
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gold text-navy text-xs font-bold hover:bg-gold-light transition-colors min-h-[40px]"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Ouvrir la Liseuse Complète
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors min-h-[40px]"
          >
            Fermer
          </button>
        </div>
      </div>
    </Modal>
  );
}
