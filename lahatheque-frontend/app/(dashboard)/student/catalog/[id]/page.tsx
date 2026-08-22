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
import { PaperOrderModal } from "@/components/features/student/paper-order-modal";
import { createOrder } from "@/lib/services/commerce-orders";

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
  onOpenPaper,
}: {
  access: { access_granted: boolean; reason: string; stream_url?: string; error?: string };
  book: BookAPI;
  onOpenSample: () => void;
  onOpenPaper: () => void;
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

          {book.price_paper > 0 && (
            <button
              type="button"
              onClick={onOpenPaper}
              className="py-3 px-4 rounded-2xl bg-background border border-border hover:border-gold text-navy text-xs font-semibold transition-all flex items-center justify-center gap-1.5 min-h-[44px]"
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
        <button
          type="button"
          onClick={onOpenSample}
          className="p-4 rounded-2xl border border-border bg-background-secondary hover:border-gold text-left space-y-1 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-navy flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-gold" />
              Extrait Gratuit
            </span>
            <span className="text-[10px] uppercase font-bold text-gold bg-gold/15 px-2 py-0.5 rounded-md">
              15 Pages
            </span>
          </div>
          <p className="text-[11px] text-foreground-muted">
            Lecture instantanée sans inscription préalable.
          </p>
        </button>

        {/* Achat numérique */}
        {book.price_digital > 0 && (
          <button
            type="button"
            onClick={() => toast.info(`Achat numérique initié pour ${book.price_digital} XOF`)}
            className="p-4 rounded-2xl border border-gold/40 bg-gold/10 hover:bg-gold/20 text-left space-y-1 transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-navy flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-gold" />
                Achat Numérique
              </span>
              <span className="text-xs font-bold font-mono text-gold">
                {book.price_digital.toLocaleString("fr-FR")} XOF
              </span>
            </div>
            <p className="text-[11px] text-foreground-muted">
              Accès perpétuel sur liseuse et applications mobiles.
            </p>
          </button>
        )}

        {/* Commande papier */}
        {book.price_paper > 0 && (
          <button
            type="button"
            onClick={onOpenPaper}
            className="p-4 rounded-2xl border border-border bg-background-secondary hover:border-gold text-left space-y-1 transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-navy flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-navy" />
                Livre Papier Physique
              </span>
              <span className="text-xs font-bold font-mono text-navy">
                {book.price_paper.toLocaleString("fr-FR")} XOF
              </span>
            </div>
            <p className="text-[11px] text-foreground-muted">
              Impression soignée, livraison campus ou domicile.
            </p>
          </button>
        )}

        {/* Bouquet campus */}
        <Link
          href="/student/university"
          className="p-4 rounded-2xl border border-navy/20 bg-navy/5 hover:bg-navy/10 text-left space-y-1 transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-navy flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-gold" />
              Bouquet Campus
            </span>
            <span className="text-[10px] uppercase font-bold text-navy bg-navy/15 px-2 py-0.5 rounded-md">
              Sans Frais
            </span>
          </div>
          <p className="text-[11px] text-foreground-muted">
            Rattachez votre matricule universitaire.
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
  const [showPaper, setShowPaper] = useState(false);

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

  const handleConfirmPaper = async (
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
        <div className="shrink-0 w-36 h-48 sm:w-44 sm:h-60 rounded-2xl bg-navy-dark border border-navy flex flex-col justify-between p-4 text-white shadow-md mx-auto sm:mx-0">
          <div className="space-y-1">
            <span className="text-[9px] font-mono text-gold font-bold uppercase tracking-wider block">
              {book.discipline_name || "ACADÉMIQUE"}
            </span>
            <div className="h-0.5 w-6 bg-gold rounded" />
          </div>
          <div className="space-y-1">
            <h4 className="font-serif font-bold text-white text-xs sm:text-sm line-clamp-3 leading-tight">
              {book.title}
            </h4>
            <p className="text-[10px] text-foreground-muted truncate">
              {authorName}
            </p>
          </div>
          <div className="pt-2 border-t border-navy/40 flex justify-between text-[9px] text-foreground-muted">
            <span>Éd. {new Date(book.publication_date || "2026").getFullYear()}</span>
            <BookOpen className="w-3 h-3 text-gold" />
          </div>
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
            <button
              type="button"
              onClick={() => setShowSample(true)}
              className="px-4 py-2 rounded-xl border border-border bg-background-secondary hover:border-gold text-navy text-xs font-semibold transition-all flex items-center gap-1.5 min-h-[40px]"
            >
              <Eye className="w-3.5 h-3.5 text-gold" />
              Consulter l&apos;extrait (15 pages)
            </button>
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
          onOpenPaper={() => setShowPaper(true)}
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

      <PaperOrderModal
        book={{
          ...book,
          author: authorName,
        }}
        isOpen={showPaper}
        onClose={() => setShowPaper(false)}
        onConfirmOrder={handleConfirmPaper}
      />
    </div>
  );
}
