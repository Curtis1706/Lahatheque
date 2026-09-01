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
  const [samplePdfBytes, setSamplePdfBytes] = useState<Uint8Array | null>(null);
  const [samplePagesCount, setSamplePagesCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reachedEnd, setReachedEnd] = useState(false);

  useEffect(() => {
    if (!isOpen || !book?.id) return;

    setLoading(true);
    setError(null);
    setReachedEnd(false);

    fetch(`/api/bff/catalog/books/${book.id}/sample/`, { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          throw new Error(json.error || "Extrait indisponible pour cet ouvrage.");
        }
        const pages = res.headers.get("X-Sample-Pages") || res.headers.get("x-sample-pages");
        setSamplePagesCount(pages ? parseInt(pages, 10) : 0);
        const buf = await res.arrayBuffer();
        setSamplePdfBytes(new Uint8Array(buf));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [isOpen, book?.id]);

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
      maxWidth={800}
    >
      <div className="space-y-4 pt-2">
        {loading && (
          <div className="text-center py-12 space-y-2">
            <p className="text-xs text-foreground-muted">Chargement de l&apos;extrait...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-12 space-y-3">
            <p className="text-sm text-foreground-muted">{error}</p>
          </div>
        )}

        {!loading && !error && samplePdfBytes && (
          <div className="rounded-2xl overflow-hidden border border-border bg-background-secondary" style={{ height: 480 }}>
            <FlipBook
              fileUrl={samplePdfBytes}
              bookId={`sample-${book.id}`}
              onLastPageReached={() => setReachedEnd(true)}
              hideInternalHeader={true}
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

        <div className="flex justify-end pt-2 border-t border-border">
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
