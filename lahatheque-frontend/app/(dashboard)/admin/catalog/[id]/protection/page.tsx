"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, BookOpen } from "lucide-react";
import { ProtectionConfigCard } from "@/components/features/publisher/protection-config-card";
import { getAdminCatalog } from "@/lib/services/admin";
import { getBookProtectionConfig, saveBookProtectionConfig } from "@/lib/services/protection";
import type { AdminCatalogBook } from "@/lib/types/admin";
import type { ProtectionConfig } from "@/lib/types/publisher";

export default function AdminBookProtectionPage() {
  const params = useParams();
  const bookId = (params?.id as string) || "";
  const [book, setBook] = useState<AdminCatalogBook | null>(null);
  const [protectionConfig, setProtectionConfig] = useState<ProtectionConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bookId) return;
    async function loadData() {
      setLoading(true);
      try {
        const [books, config] = await Promise.all([
          getAdminCatalog(),
          getBookProtectionConfig(bookId),
        ]);
        const found = books.find((b) => b.id === bookId) || null;
        setBook(found);
        setProtectionConfig(config);
      } catch (err) {
        console.error("Erreur chargement données de protection ouvrage:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [bookId]);

  const handleSaveProtection = async (newConfig: ProtectionConfig) => {
    if (!bookId) return;
    const success = await saveBookProtectionConfig(bookId, newConfig);
    if (success) {
      setProtectionConfig(newConfig);
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 md:p-8 space-y-4 max-w-5xl mx-auto animate-pulse">
        <div className="h-4 bg-background-secondary rounded w-1/4" />
        <div className="h-8 bg-background-secondary rounded w-1/2" />
        <div className="h-64 bg-background-secondary rounded-3xl" />
      </div>
    );
  }

  const bookTitle = book?.title || "Ouvrage du Catalogue";
  const authorName = Array.isArray(book?.authors) && book.authors.length > 0
    ? book.authors.join(", ")
    : (book?.author_name || "Auteur non renseigné");

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 max-w-5xl mx-auto font-sans">
      {/* Fil d'Ariane */}
      <div className="flex flex-wrap items-center gap-2 text-xs text-foreground-muted">
        <Link href="/admin" className="hover:text-navy transition-colors">Vue d&apos;ensemble</Link>
        <span>/</span>
        <Link href="/admin/catalog" className="hover:text-navy transition-colors">Catalogue</Link>
        <span>/</span>
        {book ? (
          <Link href={`/admin/catalog/${book.id}`} className="hover:text-navy transition-colors truncate max-w-[200px]">
            {bookTitle}
          </Link>
        ) : (
          <span className="truncate max-w-[200px]">{bookId}</span>
        )}
        <span>/</span>
        <span className="text-navy font-semibold">Protection Anti-Piratage</span>
      </div>

      {/* En-tête */}
      <div className="border-b border-border pb-6">
        <div className="flex items-center gap-3 mb-2">
          <Link
            href="/admin/catalog"
            className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:text-gold transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Retour au Catalogue
          </Link>
          {book && (
            <>
              <span className="text-border">|</span>
              <Link
                href={`/admin/catalog/${book.id}`}
                className="inline-flex items-center gap-1 text-xs text-foreground-muted hover:text-navy transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5 text-gold" />
                Fiche détaillée
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
          <ShieldCheck className="w-4 h-4 text-gold" />
          <span>Gestion Droits &amp; Sécurité DRM</span>
        </div>

        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
          Configuration Anti-piratage — {bookTitle}
        </h1>

        <p className="text-xs text-foreground-muted mt-1">
          Par {authorName} {book?.publisher_name ? `• Édition : ${book.publisher_name}` : ""}
        </p>
      </div>

      {/* Carte de configuration DRM */}
      {protectionConfig && (
        <ProtectionConfigCard
          initialConfig={protectionConfig}
          onSave={handleSaveProtection}
        />
      )}
    </div>
  );
}
