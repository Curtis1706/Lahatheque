"use client";

import React, { useEffect, useState } from "react";
import { Sparkles, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { Modal } from "@/components/ui/modal";
import { FlipBook } from "@/components/library/FlipBook";
import type { ClientBookAccess } from "@/lib/types/student";

interface BookSampleModalProps {
  book: (Partial<ClientBookAccess> & { id: string; title: string; author?: string }) | null;
  isOpen: boolean;
  onClose: () => void;
}

export function BookSampleModal({ book, isOpen, onClose }: BookSampleModalProps) {
  const [samplePagesCount, setSamplePagesCount] = useState<number>(() => book?.sample_pages_count || 10);
  const [error, setError] = useState<string | null>(null);
  const [reachedEnd, setReachedEnd] = useState(false);

  useEffect(() => {
    if (!isOpen || !book?.id) return;

    setReachedEnd(false);
    setError(null);

    // Résolution asynchrone légère du nombre exact de pages d'extrait
    fetch(`/api/bff/catalog/books/${book.id}/sample/`, {
      method: "HEAD",
      credentials: "include",
    })
      .then((res) => {
        const pages = res.headers.get("X-Sample-Pages") || res.headers.get("x-sample-pages");
        if (pages) {
          setSamplePagesCount(parseInt(pages, 10));
        }
      })
      .catch(() => {
        // Fallback transparent sur le sample_pages_count du livre
      });
  }, [isOpen, book?.id]);

  if (!book) return null;

  const effectiveTotalPages = samplePagesCount || book.sample_pages_count || 10;
  const streamUrl = `/api/bff/catalog/books/${book.id}/sample/`;
  const pageUrlTemplate = (page: number) => `/api/bff/catalog/books/${book.id}/page/?page=${page}&mode=sample`;

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
      maxWidth={800}
    >
      <div className="space-y-4 pt-2">
        {error && (
          <div className="text-center py-12 space-y-3">
            <p className="text-sm text-foreground-muted">{error}</p>
          </div>
        )}

        {!error && (
          <div className="rounded-2xl overflow-hidden border border-border bg-background-secondary" style={{ height: 480 }}>
            <FlipBook
              fileUrl={streamUrl}
              bookId={`sample-${book.id}`}
              pageUrlTemplate={pageUrlTemplate}
              totalPages={effectiveTotalPages}
              onLastPageReached={() => setReachedEnd(true)}
              hideInternalHeader={true}
              hideQuiz={true}
              isSample={true}
            />
          </div>
        )}

        {reachedEnd && (
          <div className="p-5 rounded-2xl bg-navy text-white text-center space-y-3">
            <p className="font-serif font-bold text-base">Fin de l&apos;extrait gratuit ({samplePagesCount} pages)</p>
            <p className="text-xs text-white/80">
              Pour continuer la lecture de « {book.title} », achetez l&apos;ouvrage ou activez votre
              bouquet universitaire.
            </p>
            <Link
              href={`/student/catalog/${book.id}`}
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gold text-navy text-xs font-bold hover:bg-gold-hover transition-colors cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              Voir les options d&apos;achat
            </Link>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <Link
            href={`/catalog/reader/${book.id}?mode=sample`}
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors inline-flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-gold" />
            Ouvrir dans la liseuse complète
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-background-secondary border border-border text-navy text-xs font-bold hover:bg-border/40 transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </Modal>
  );
}
