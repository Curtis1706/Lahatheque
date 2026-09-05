"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Lock } from "lucide-react";
import { ProtectionConfigCard } from "@/components/features/publisher/protection-config-card";
import { getPublisherBookDetail, updatePublisherBookProtection } from "@/lib/services/publisher";
import type { PublisherBook, ProtectionConfig } from "@/lib/types/publisher";

export default function BookProtectionPage() {
  const params = useParams();
  const bookId = (params?.id as string) || "";
  const [book, setBook] = useState<PublisherBook | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bookId) return;
    async function loadData() {
      setLoading(true);
      const data = await getPublisherBookDetail(bookId);
      setBook(data);
      setLoading(false);
    }
    loadData();
  }, [bookId]);

  const handleSaveProtection = async (newConfig: ProtectionConfig) => {
    if (!book) return;
    const success = await updatePublisherBookProtection(book.id, newConfig);
    if (success) {
      setBook((prev) => (prev ? { ...prev, protection_config: newConfig } : prev));
    }
  };

  if (loading) {
    return (
      <div className="p-8 space-y-4 max-w-4xl mx-auto animate-pulse">
        <div className="h-8 bg-background-secondary rounded w-1/3" />
        <div className="h-64 bg-background-secondary rounded-3xl" />
      </div>
    );
  }

  if (!book) {
    return (
      <div className="p-8 text-center space-y-4 max-w-md mx-auto">
        <h2 className="font-serif font-bold text-navy text-lg">Ouvrage introuvable</h2>
        <Link href="/publisher/catalog" className="text-xs font-bold text-gold hover:underline block">
          Retour au Catalogue
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/publisher" className="hover:text-navy">Vue d&apos;ensemble</Link>
        <span>/</span>
        <Link href="/publisher/catalog" className="hover:text-navy">Catalogue</Link>
        <span>/</span>
        <Link href={`/publisher/catalog/${book.id}`} className="hover:text-navy">{book.title}</Link>
        <span>/</span>
        <span className="text-navy font-semibold">Protection DRM/LCP</span>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-6">
        <Link href={`/publisher/catalog/${book.id}`} className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-2">
          <ArrowLeft className="w-3.5 h-3.5" />
          Retour à la Fiche Ouvrage
        </Link>
        <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
          <ShieldCheck className="w-4 h-4 text-gold" />
          Protection Droits Numériques (Section 6)
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
          Configuration Anti-piratage — {book.title}
        </h1>
        <p className="text-xs text-foreground-muted mt-1">
          Réglez le filigrane visuel, la protection DRM LCP et les restrictions de copie/impression pour cet ouvrage.
        </p>
      </div>

      {/* Carte de switches 21st.dev Privacy Settings Switches id: 22210 */}
      <ProtectionConfigCard
        initialConfig={book.protection_config}
        onSave={handleSaveProtection}
      />
    </div>
  );
}
