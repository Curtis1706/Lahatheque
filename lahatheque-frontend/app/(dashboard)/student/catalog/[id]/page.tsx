"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { BookOpen, Eye, ArrowLeft, ShoppingBag, Sparkles, PackageCheck, ShieldCheck, CheckCircle2 } from "lucide-react";
import { BookSampleModal } from "@/components/features/student/book-sample-modal";
import { PaperOrderModal } from "@/components/features/student/paper-order-modal";
import { getClientBookDetails, orderPaperCopy } from "@/lib/services/student";
import type { ClientBookAccess } from "@/lib/types/student";

export default function StudentBookDetailPage() {
  const params = useParams();
  const bookId = (params?.id as string) || "book-cli-01";

  const [book, setBook] = useState<ClientBookAccess | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSampleModal, setShowSampleModal] = useState(false);
  const [showPaperModal, setShowPaperModal] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await getClientBookDetails(bookId);
      setBook(data);
      setLoading(false);
    }
    loadData();
  }, [bookId]);

  if (loading || !book) {
    return (
      <div className="p-8 text-center space-y-4">
        <span className="w-8 h-8 border-2 border-navy border-t-gold rounded-full animate-spin inline-block" />
        <p className="text-xs text-foreground-muted font-mono">Chargement de la fiche ouvrage...</p>
      </div>
    );
  }

  const handleConfirmPaperOrder = async (id: string, title: string, price: number, address: string) => {
    const newOrd = await orderPaperCopy(id, title, price, address);
    alert(`Votre commande d'exemplaire papier (${newOrd.reference}) a été transmise avec succès !`);
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-8 max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/student" className="hover:text-navy">Mon Espace</Link>
        <span>/</span>
        <Link href="/student/catalog" className="hover:text-navy">Catalogue</Link>
        <span>/</span>
        <span className="text-navy font-semibold">{book.title}</span>
      </div>

      {/* Header */}
      <Link href="/student/catalog" className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline">
        <ArrowLeft className="w-3.5 h-3.5" />
        Retour au catalogue
      </Link>

      {/* Fiche Ouvrage Principale */}
      <div className="p-6 sm:p-8 rounded-3xl bg-background border border-border space-y-6 shadow-xs flex flex-col md:flex-row gap-8">
        {/* Cover Image */}
        <div className="w-full md:w-64 h-80 rounded-2xl bg-navy overflow-hidden shrink-0 border border-border shadow-md relative">
          {book.cover_url ? (
            <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white font-serif font-bold text-3xl">
              {book.title.slice(0, 1)}
            </div>
          )}
          <span className="absolute top-3 right-3 px-3 py-1 rounded-full bg-navy/90 text-gold text-xs font-mono font-bold">
            Format {book.format}
          </span>
        </div>

        {/* Details & Actions */}
        <div className="flex-1 space-y-5">
          <div>
            <span className="px-3 py-1 rounded-full bg-gold/15 text-gold text-xs font-mono font-bold uppercase">
              {book.discipline}
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy mt-2 leading-tight">
              {book.title}
            </h1>
            <p className="text-xs sm:text-sm text-foreground-muted mt-1 font-semibold">Par {book.author}</p>
          </div>

          <p className="text-xs text-foreground leading-relaxed bg-background-secondary p-4 rounded-2xl border border-border">
            {book.description}
          </p>

          <div className="grid grid-cols-2 gap-4 text-xs font-mono border-t border-b border-border py-3">
            <div>
              <span className="text-foreground-muted block text-[10px]">ISBN Numérique</span>
              <span className="font-bold text-navy">{book.isbn_digital}</span>
            </div>
            {book.isbn_print && (
              <div>
                <span className="text-foreground-muted block text-[10px]">ISBN Papier</span>
                <span className="font-bold text-navy">{book.isbn_print}</span>
              </div>
            )}
          </div>

          {/* Modèles d'Achat & Boutons d'Action */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-wrap items-center gap-3">
              {/* Bouton Extrait Gratuit */}
              <button
                type="button"
                onClick={() => setShowSampleModal(true)}
                className="px-5 py-3 rounded-xl bg-gold/15 text-navy font-bold text-xs hover:bg-gold transition-colors inline-flex items-center gap-2 shadow-xs min-h-[44px]"
              >
                <Eye className="w-4 h-4 text-gold" />
                Lire l&apos;Extrait Gratuit
              </button>

              {/* Bouton Achat Unitaire Numérique */}
              <Link
                href="/student/books"
                className="px-6 py-3 rounded-xl bg-navy text-white font-bold text-xs hover:bg-navy-hover transition-colors inline-flex items-center gap-2 shadow-xs min-h-[44px]"
              >
                <ShoppingBag className="w-4 h-4 text-gold" />
                Acheter en Numérique ({(book.price_digital || 0).toLocaleString("fr-FR")} XOF)
              </Link>

              {/* Bouton Commande Papier Physique si disponible */}
              {book.has_paper_version && (
                <button
                  type="button"
                  onClick={() => setShowPaperModal(true)}
                  className="px-5 py-3 rounded-xl border border-border bg-background text-navy font-bold text-xs hover:border-gold transition-colors inline-flex items-center gap-2 shadow-xs min-h-[44px]"
                >
                  <PackageCheck className="w-4 h-4 text-gold" />
                  Commander la Version Papier ({(book.paper_price || 15000).toLocaleString("fr-FR")} XOF)
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modale d'extrait gratuit lisible sans friction */}
      <BookSampleModal
        book={book}
        isOpen={showSampleModal}
        onClose={() => setShowSampleModal(false)}
      />

      {/* Modale de commande papier physique */}
      <PaperOrderModal
        book={book}
        isOpen={showPaperModal}
        onClose={() => setShowPaperModal(false)}
        onConfirmOrder={handleConfirmPaperOrder}
      />
    </div>
  );
}
