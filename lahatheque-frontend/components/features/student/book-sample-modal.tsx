"use client";

import React from "react";
import { BookOpen, X, Sparkles, ShieldCheck, FileText } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import type { ClientBookAccess } from "@/lib/types/student";

interface BookSampleModalProps {
  book: ClientBookAccess | null;
  isOpen: boolean;
  onClose: () => void;
}

export function BookSampleModal({
  book,
  isOpen,
  onClose,
}: BookSampleModalProps) {
  if (!book) return null;

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
      maxWidth={650}
    >
      <div className="space-y-4 pt-2 text-xs">
        <div className="p-3.5 rounded-2xl bg-gold/10 border border-gold/30 text-navy flex items-center justify-between">
          <span className="font-semibold flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-gold" />
            Lecture d&apos;extrait gratuit ({book.sample_pages_count || 20} premières pages)
          </span>
          <span className="text-[10px] font-mono uppercase bg-gold/20 text-gold px-2 py-0.5 rounded font-bold">
            Sans engagement
          </span>
        </div>

        {/* Aperçu des pages d'extrait */}
        <div className="p-6 rounded-3xl bg-background-secondary border border-border min-h-[280px] max-h-[360px] overflow-y-auto space-y-4 font-serif text-sm leading-relaxed text-foreground">
          <div className="border-b border-border pb-3 text-center">
            <h2 className="font-bold text-navy text-lg">{book.title}</h2>
            <p className="text-xs text-foreground-muted font-sans mt-1">Par {book.author}</p>
          </div>

          <p className="first-letter:text-3xl first-letter:font-bold first-letter:text-navy">
            &ldquo;L&apos;organisation administrative en Afrique sub-saharienne s&apos;appuie sur une tradition juridique pluraliste. Cet extrait présente les fondements institutionnels de la gouvernance locale et la répartition des compétences de puissance publique.&rdquo;
          </p>

          <p className="text-xs text-foreground-muted font-sans italic border-l-2 border-gold pl-3 py-1">
            Note : Cet extrait gratuit vous permet de consulter la table des matières et le premier chapitre avant d&apos;effectuer votre achat unitaire ou de vous abonner.
          </p>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-border">
          <span className="text-[11px] text-foreground-muted">
            Protection DRM LCP &amp; Filigrane actif
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors min-h-[40px]"
          >
            Fermer l&apos;extrait
          </button>
        </div>
      </div>
    </Modal>
  );
}
