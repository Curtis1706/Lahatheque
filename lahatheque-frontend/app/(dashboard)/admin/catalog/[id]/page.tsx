"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, Shield, Tag, Eye, ShoppingBag, Download } from "lucide-react";
import { getAdminCatalog } from "@/lib/services/admin";
import { AdminCatalogBook } from "@/lib/types/admin";
import { StatusBadge } from "@/components/ui/status-badge";

export default function AdminBookDetailPage() {
  const params = useParams();
  const bookId = (params?.id as string) || "bk-101";
  const [book, setBook] = useState<AdminCatalogBook | null>(null);

  useEffect(() => {
    async function loadBook() {
      const books = await getAdminCatalog();
      const found = books.find((b) => b.id === bookId) || books[0];
      setBook(found);
    }
    loadBook();
  }, [bookId]);

  if (!book) {
    return <div className="p-8 text-center text-xs text-foreground-muted">Chargement de la fiche livre...</div>;
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <Link
          href="/admin/catalog"
          className="inline-flex items-center gap-1 text-xs font-medium text-gold hover:text-gold-dark mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Retour au catalogue
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
          <div>
            <span className="text-[11px] font-mono text-gold uppercase tracking-wider font-semibold">
              ISBN: {book.isbn}
            </span>
            <h1 className="text-xl sm:text-2xl font-bold font-serif text-navy mt-0.5">{book.title}</h1>
            <p className="text-xs text-foreground-muted">
              Par {Array.isArray(book.authors) && book.authors.length > 0 ? book.authors.join(", ") : (book.author_name || "Auteur non renseigné")} • Éditeur : {book.publisher_name}
            </p>
          </div>
          <StatusBadge status={book.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Infos Bibliographiques */}
        <div className="p-5 rounded-2xl bg-background-secondary border border-border space-y-3">
          <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-gold" />
            Métadonnées Bibliographiques
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-border">
              <span className="text-foreground-muted">Discipline :</span>
              <span className="font-medium">{book.discipline}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border">
              <span className="text-foreground-muted">Format principal :</span>
              <span className="font-mono uppercase font-semibold text-navy">{book.format_type}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border">
              <span className="text-foreground-muted">Date de publication :</span>
              <span className="font-mono">{book.publication_date}</span>
            </div>
          </div>
        </div>

        {/* Statistiques & Ventes */}
        <div className="p-5 rounded-2xl bg-background-secondary border border-border space-y-3">
          <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-navy" />
            Performances Commerciales
          </h3>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between py-1 border-b border-border">
              <span className="text-foreground-muted">Prix Numérique :</span>
              <span className="font-bold text-foreground">{book.price_digital.toLocaleString("fr-FR")} FCFA</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border">
              <span className="text-foreground-muted">Prix Papier :</span>
              <span className="font-bold text-foreground">{book.price_paper.toLocaleString("fr-FR")} FCFA</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border">
              <span className="text-foreground-muted">Ventes unitaires :</span>
              <span className="font-bold text-success">{book.sales_count} ex.</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border">
              <span className="text-foreground-muted">Lectures en ligne :</span>
              <span className="font-bold text-gold-dark">{book.consultation_count.toLocaleString()} consultations</span>
            </div>
          </div>
        </div>

        {/* Protection & DRM */}
        <div className="p-5 rounded-2xl bg-background-secondary border border-border space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <Shield className="w-4 h-4 text-gold" />
              Protection Numérique
            </h3>
            <Link
              href={`/admin/catalog/${book.id}/protection`}
              className="text-[11px] font-bold text-navy hover:text-gold transition-colors"
            >
              Modifier &rarr;
            </Link>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-border">
              <span className="text-foreground-muted">Technologie DRM :</span>
              <span className="font-mono font-bold uppercase text-navy">{book.protection_type || "LCP"}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border">
              <span className="text-foreground-muted">Filigrane e-mail :</span>
              <span className="font-semibold text-success">Activé</span>
            </div>
            <div className="flex justify-between py-1 border-b border-border">
              <span className="text-foreground-muted">Impression :</span>
              <span className="text-foreground-muted">Interdite</span>
            </div>
          </div>
        </div>
      </div>

      {/* Barre d'Actions Administrateur & Lecteur Souverain */}
      <div className="p-6 rounded-2xl bg-background-secondary border border-border flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-navy flex items-center gap-2">
            <Eye className="w-4 h-4 text-gold" />
            Lecture Souveraine Administrateur
          </h4>
          <p className="text-xs text-foreground-muted mt-0.5">
            Accès intégral sans restriction au lecteur universel sécurisé avec filigrane de supervision.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <Link
            href={`/catalog/reader/${book.id}`}
            className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-navy text-white text-xs font-semibold hover:bg-navy/90 transition-colors flex items-center justify-center gap-2 shadow-xs"
          >
            <BookOpen className="w-4 h-4 text-gold" />
            <span>Lire l'Ouvrage (Lecteur LAHA)</span>
          </Link>

          <Link
            href={`/admin/catalog/${book.id}/protection`}
            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-background border border-border text-foreground text-xs font-semibold hover:border-gold transition-colors flex items-center justify-center gap-1.5"
          >
            <Shield className="w-3.5 h-3.5 text-gold" />
            <span>Gérer DRM</span>
          </Link>

          <Link
            href="/admin/catalog/pricing"
            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-background border border-border text-foreground text-xs font-semibold hover:border-gold transition-colors flex items-center justify-center gap-1.5"
          >
            <Tag className="w-3.5 h-3.5 text-gold" />
            <span>Ajuster Prix</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
