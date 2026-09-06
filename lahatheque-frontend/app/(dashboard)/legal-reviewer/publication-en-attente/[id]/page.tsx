"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Users,
  ShieldCheck,
  ShieldAlert,
  Send,
  Calendar,
  FileSignature,
} from "lucide-react";
import { toast } from "sonner";
import { AuthGuard } from "@/components/auth-guard";
import { InlineLoader } from "@/components/ui/page-loader";
import { BookCover3D } from "@/components/ui/book-cover-3d";
import {
  getPendingPublicationBooks,
  publishPendingOuvrage,
} from "@/lib/services/legal";
import type { PendingPublicationBook } from "@/lib/types/legal";

export default function PendingPublicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = params?.id;
  const bookId = Array.isArray(rawId) ? rawId[0] : (rawId as string);

  const [book, setBook] = useState<PendingPublicationBook | null>(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      if (!bookId) return;
      try {
        setLoading(true);
        const books = await getPendingPublicationBooks();
        const match = books.find((b: PendingPublicationBook) => b.id === bookId);
        if (!match) {
          setNotFound(true);
        } else {
          setBook(match);
        }
      } catch {
        toast.error("Impossible de charger les informations de cet ouvrage.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [bookId]);

  const handlePublish = async () => {
    if (!book) return;
    setPublishing(true);
    try {
      const result = await publishPendingOuvrage(book.id);
      if (result.success) {
        toast.success(result.message || `L'ouvrage « ${book.title} » est maintenant publié sur la vitrine.`);
        router.push("/legal-reviewer/publication-en-attente");
      } else {
        toast.error(result.error || "Impossible de publier cet ouvrage.");
      }
    } finally {
      setPublishing(false);
    }
  };

  return (
    <AuthGuard requiredRoles={["legal_reviewer", "admin", "super_admin"]}>
      <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
        <Link
          href="/legal-reviewer/publication-en-attente"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground-muted hover:text-navy transition-colors min-h-[44px]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Retour à la liste des publications en attente</span>
        </Link>

        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-center rounded-2xl border border-border bg-background-secondary">
            <InlineLoader size={32} />
            <p className="text-xs font-medium text-foreground-muted">
              Chargement des détails de l&apos;ouvrage...
            </p>
          </div>
        ) : notFound || !book ? (
          <div className="p-8 sm:p-10 rounded-2xl border border-border bg-background-secondary text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-gold/10 text-gold flex items-center justify-center mx-auto">
              <BookOpen className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="font-serif font-bold text-navy text-lg">
                Ouvrage introuvable ou déjà publié
              </h2>
              <p className="text-xs text-foreground-muted max-w-md mx-auto">
                Cet ouvrage n&apos;est plus en attente de validation juridique, ou sa publication a déjà été traitée.
              </p>
            </div>
            <Link
              href="/legal-reviewer/publication-en-attente"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors min-h-[44px]"
            >
              Retour à la liste
            </Link>
          </div>
        ) : (
          <div className="bg-background-secondary rounded-2xl border border-border p-5 sm:p-6 space-y-6 shadow-xs">
            <div className="flex flex-col sm:flex-row gap-5 items-start">
              {book.cover_url ? (
                <div className="shrink-0 mx-auto sm:mx-0">
                  <BookCover3D
                    coverUrl={book.cover_url}
                    title={book.title}
                    authors={book.authors}
                    discipline={book.discipline}
                    size="md"
                  />
                </div>
              ) : (
                <div className="w-24 h-32 rounded-xl bg-navy/5 border border-border flex items-center justify-center shrink-0 mx-auto sm:mx-0 text-gold">
                  <BookOpen className="w-8 h-8" />
                </div>
              )}

              <div className="flex-1 space-y-2.5 w-full">
                <div className="space-y-1">
                  <span className="inline-block text-[11px] font-bold text-gold uppercase tracking-wider">
                    {book.discipline || "Discipline non renseignée"}
                  </span>
                  <h1 className="text-lg sm:text-xl font-serif font-bold text-navy leading-snug">
                    {book.title}
                  </h1>
                </div>

                <div className="flex items-center gap-2 text-xs text-foreground-muted">
                  <Users className="w-4 h-4 text-foreground-muted shrink-0" />
                  <span>
                    {book.authors && book.authors.length > 0
                      ? book.authors.join(", ")
                      : "Auteur non renseigné"}
                  </span>
                </div>

                {book.created_at && (
                  <div className="flex items-center gap-2 text-xs text-foreground-muted">
                    <Calendar className="w-4 h-4 text-foreground-muted shrink-0" />
                    <span>
                      Dossier transmis le{" "}
                      {new Date(book.created_at).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Statut contractuel */}
            <div className="p-4 rounded-xl bg-background border border-border space-y-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-medium text-foreground-muted">
                  Contrôle contractuel :
                </span>
                {book.has_active_contract ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-success bg-success/10 px-2.5 py-1 rounded-lg border border-success/20">
                    <ShieldCheck className="w-4 h-4" />
                    Contrat actif rattaché
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-gold-dark bg-gold/10 px-2.5 py-1 rounded-lg border border-gold/20">
                    <ShieldAlert className="w-4 h-4" />
                    Aucun contrat actif
                  </span>
                )}
              </div>

              {!book.has_active_contract && (
                <div className="pt-2 border-t border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <p className="text-xs text-foreground-muted">
                    Un contrat signé valide est requis avant toute mise en ligne publique.
                  </p>
                  <Link
                    href={`/legal-reviewer/contracts/new?book_id=${book.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-gold hover:text-gold-dark transition-colors min-h-[44px]"
                  >
                    <FileSignature className="w-3.5 h-3.5" />
                    <span>Établir le contrat</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Actions de publication */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handlePublish}
                disabled={!book.has_active_contract || publishing}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px] shadow-xs cursor-pointer"
              >
                {publishing ? (
                  <>
                    <InlineLoader size={16} />
                    <span>Publication en cours...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-gold" />
                    <span>Publier sur la Vitrine</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
