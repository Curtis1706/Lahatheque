"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  BookOpen,
  ArrowLeft,
  Play,
  ShoppingBag,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  BookMarked,
  Globe,
  Calendar,
  FileText,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import {
  getStudentBookDetail,
  type BookAPI,
} from "@/lib/services/student";
import { BookSampleModal } from "@/components/features/student/book-sample-modal";
import { UnifiedBookOrderModal } from "@/components/features/student/unified-book-order-modal";
import { BookCover } from "@/components/features/student/book-cover";

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-10 rounded-xl bg-navy/10 w-1/2" />
      <div className="flex gap-6">
        <div className="w-32 h-44 rounded-xl bg-navy/10 shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="h-6 rounded bg-navy/10 w-2/3" />
          <div className="h-4 rounded bg-navy/10 w-1/3" />
          <div className="h-3 rounded bg-navy/10 w-full" />
          <div className="h-3 rounded bg-navy/10 w-5/6" />
        </div>
      </div>
    </div>
  );
}

// ─── Bloc Accès ───────────────────────────────────────────────────────────────

function AccessBlock({
  access,
  book,
  onOpenSample,
  onOpenOrder,
}: {
  access: { access_granted: boolean; reason: string; stream_url?: string; error?: string };
  book: BookAPI;
  onOpenSample: () => void;
  onOpenOrder: () => void;
}) {
  if (access.access_granted) {
    const reasonLabels: Record<string, string> = {
      individual_purchase: "Achat unitaire numérique",
      active_subscription: "Pass Lecteur actif",
      institutional_subscription: "Bouquet Campus Partenaire",
      privilege_access: "Accès Privilégié",
    };
    return (
      <div className="p-6 rounded-3xl bg-success/10 border border-success/30 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-success" />
            <h3 className="font-bold text-success text-sm sm:text-base">Accès Complet Débloqué</h3>
          </div>
          <span className="text-[11px] px-3 py-1 rounded-full bg-success/20 text-success font-bold">
            {reasonLabels[access.reason] || access.reason}
          </span>
        </div>
        <p className="text-xs text-foreground-muted">
          Vous bénéficiez de la consultation intégrale en ligne sous DRM LCP et de la synthèse vocale assistée.
        </p>
        <div className="flex items-center gap-3 flex-wrap">
          <Link
            href={`/catalog/reader/${book.id}`}
            className="flex-1 py-3 px-5 rounded-2xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors flex items-center justify-center gap-2 min-h-[44px] shadow-xs"
          >
            <Play className="w-4 h-4 text-gold fill-gold" />
            Ouvrir la Liseuse Sécurisée
          </Link>

          {book.is_paper_available && book.price_paper > 0 && (
            <button
              type="button"
              onClick={onOpenOrder}
              className="py-3 px-4 rounded-2xl bg-background border border-border hover:border-gold text-navy text-xs font-semibold transition-all flex items-center justify-center gap-1.5 min-h-[44px] cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4 text-gold" />
              Commander en Papier
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-3xl bg-background border border-border space-y-4 shadow-xs">
      <div className="flex items-center gap-2">
        <AlertCircle className="w-5 h-5 text-gold" />
        <h3 className="font-bold text-navy text-base">Modalités d&apos;Accès &amp; Achat</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Extrait gratuit */}
        <Link
          href={`/catalog/reader/${book.id}?mode=sample`}
          className="p-4 rounded-2xl border border-border bg-background-secondary hover:border-gold text-left space-y-1 transition-all cursor-pointer block"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-navy flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-gold" />
              Extrait Gratuit
            </span>
            <span className="text-[10px] uppercase font-bold text-gold bg-gold/15 px-2 py-0.5 rounded-md">
              {book.sample_pages_count || 10} Pages
            </span>
          </div>
          <p className="text-[11px] text-foreground-muted">
            Lecture instantanée dans la liseuse sans inscription préalable.
          </p>
        </Link>

        {/* Commander cet ouvrage — Unifié */}
        <button
          type="button"
          onClick={onOpenOrder}
          className="p-4 rounded-2xl border border-gold/40 bg-gold/10 hover:bg-gold/20 text-left space-y-1 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-navy flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-gold" />
              Commander cet Ouvrage
            </span>
            <span className="text-xs font-bold font-mono text-gold">
              {(book.price_digital ?? 0).toLocaleString("fr-FR")} XOF
            </span>
          </div>
          <p className="text-[11px] text-foreground-muted">
            Choisissez le format numérique (accès immédiat) ou papier (si disponible).
          </p>
        </button>

        {/* Bouquet campus */}
        <Link
          href="/student/university"
          className="p-4 rounded-2xl border border-navy/20 bg-navy/5 hover:bg-navy/10 text-left space-y-1 transition-all flex flex-col justify-between sm:col-span-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-navy flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-gold" />
              Bouquet Campus Universitaire
            </span>
            <span className="text-[10px] uppercase font-bold text-navy bg-navy/15 px-2 py-0.5 rounded-md">
              Sans Frais
            </span>
          </div>
          <p className="text-[11px] text-foreground-muted">
            Rattachez votre matricule universitaire pour débloquer les ouvrages de votre faculté.
          </p>
        </Link>
      </div>
    </div>
  );
}

// ─── Page Principale ──────────────────────────────────────────────────────────

export default function StudentBookDetailPage() {
  const params = useParams();
  const bookId = params?.id as string;

  const [book, setBook] = useState<BookAPI | null>(null);
  const [access, setAccess] = useState<{
    access_granted: boolean;
    reason: string;
    stream_url?: string;
    error?: string;
  } | null>(null);
  const [progress, setProgress] = useState<{
    progress_percent: number;
    current_page: number;
    is_completed: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showSample, setShowSample] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);

  useEffect(() => {
    if (!bookId) return;
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const data = await getStudentBookDetail(bookId);
        setBook(data.ouvrage);
        setAccess(data.access);
        setProgress(data.reading_progress);
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "Erreur de chargement"
        );
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [bookId]);

  if (loading) {
    return (
      <div className="p-4 sm:p-6 md:p-8 w-full max-w-4xl mx-auto">
        <PageSkeleton />
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="p-4 sm:p-6 md:p-8 w-full max-w-4xl mx-auto">
        <div className="p-5 rounded-2xl bg-error/10 border border-error/30 text-error text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error || "Ouvrage introuvable."}
        </div>
        <Link
          href="/student/catalog"
          className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-navy hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Retour au catalogue
        </Link>
      </div>
    );
  }

  const authorName =
    book.authors?.map((a) => a.full_name).join(", ") || "Auteur académique";

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/student" className="hover:text-navy">
          Mon Espace
        </Link>
        <span>/</span>
        <Link href="/student/catalog" className="hover:text-navy">
          Catalogue
        </Link>
        <span>/</span>
        <span className="text-navy font-semibold truncate max-w-40">
          {book.title}
        </span>
      </div>

      <Link
        href="/student/catalog"
        className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Retour au catalogue
      </Link>

      {/* ── Fiche Livre ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-6 p-6 rounded-3xl bg-background border border-border shadow-xs">
        {/* Couverture */}
        <div className="shrink-0 flex justify-center sm:justify-start">
          <BookCover book={book} size="lg" />
        </div>

        {/* Infos */}
        <div className="flex-1 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div>
              <p className="text-[11px] font-bold text-gold uppercase tracking-wider">
                {book.discipline_name || "Académique"}
              </p>
              <h1 className="font-serif font-bold text-navy text-xl sm:text-2xl mt-0.5 leading-tight">
                {book.title}
              </h1>
              {book.subtitle && (
                <p className="text-sm text-foreground-muted mt-0.5">
                  {book.subtitle}
                </p>
              )}
            </div>

            <p className="text-xs text-foreground-muted">
              Par <strong className="text-navy">{authorName}</strong>
            </p>

            <div className="flex flex-wrap gap-3 text-[11px] pt-1">
              {book.publisher_name && (
                <div className="flex items-center gap-1 text-foreground-muted">
                  <FileText className="w-3.5 h-3.5 text-gold" />
                  {book.publisher_name}
                </div>
              )}
              {book.publication_date && (
                <div className="flex items-center gap-1 text-foreground-muted">
                  <Calendar className="w-3.5 h-3.5 text-gold" />
                  {new Date(book.publication_date).getFullYear()}
                </div>
              )}
              {book.page_count > 0 && (
                <div className="flex items-center gap-1 text-foreground-muted">
                  <BookOpen className="w-3.5 h-3.5 text-gold" />
                  {book.page_count} pages
                </div>
              )}
              {book.language && (
                <div className="flex items-center gap-1 text-foreground-muted">
                  <Globe className="w-3.5 h-3.5 text-gold" />
                  {book.language.toUpperCase()}
                </div>
              )}
            </div>

            {/* Progression */}
            {progress && (
              <div className="space-y-1 pt-2">
                <div className="flex justify-between text-[11px]">
                  <span className="text-foreground-muted">
                    {progress.is_completed ? "Lecture Terminée" : "En cours de lecture"}
                  </span>
                  <span className="font-bold text-navy font-mono">
                    {progress.progress_percent}% &bull; page {progress.current_page}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-navy/10 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${progress.is_completed ? "bg-success" : "bg-gold"}`}
                    style={{ width: `${progress.progress_percent}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-border flex-wrap">
            <Link
              href={`/catalog/reader/${book.id}?mode=sample`}
              className="px-4 py-2 rounded-xl border border-border bg-background-secondary hover:border-gold text-navy text-xs font-semibold transition-all flex items-center gap-1.5 min-h-[40px] cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-gold" />
              Consulter l&apos;extrait ({book.sample_pages_count || 10} pages)
            </Link>
          </div>
        </div>
      </div>



      {/* ── Résumé ────────────────────────────────────────────────────── */}
      {book.summary && (
        <div className="p-6 rounded-3xl bg-background border border-border shadow-xs space-y-2">
          <h2 className="font-bold text-navy text-sm uppercase tracking-wider">
            Présentation de l&apos;Ouvrage
          </h2>
          <p className="text-xs text-foreground-muted leading-relaxed">
            {book.summary}
          </p>
        </div>
      )}

      {/* ── Accès & Actions ───────────────────────────────────────────── */}
      {access && (
        <AccessBlock
          access={access}
          book={book}
          onOpenSample={() => setShowSample(true)}
          onOpenOrder={() => setShowOrderModal(true)}
        />
      )}

      {/* Modales */}
      <BookSampleModal
        book={{
          ...book,
          author: authorName,
        }}
        isOpen={showSample}
        onClose={() => setShowSample(false)}
      />

      {showOrderModal && book && (
        <UnifiedBookOrderModal
          book={book}
          onClose={() => setShowOrderModal(false)}
          onOpenSample={() => {
            setShowOrderModal(false);
            setShowSample(true);
          }}
          onDigitalPurchaseSuccess={async () => {
            const refreshed = await getStudentBookDetail(bookId);
            setBook(refreshed.ouvrage);
            setAccess(refreshed.access);
            setProgress(refreshed.reading_progress);
          }}
        />
      )}
    </div>
  );
}
