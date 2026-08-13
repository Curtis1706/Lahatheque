"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { GraduationCap, ArrowLeft, BookOpen, ShieldCheck, Sparkles, AlertCircle, Building2 } from "lucide-react";
import { getClientUniversityAffiliation, getClientLibraryBooks } from "@/lib/services/student";
import type { ClientUniversityAffiliation, ClientBookAccess } from "@/lib/types/student";

export default function StudentUniversityPage() {
  const [affiliation, setAffiliation] = useState<ClientUniversityAffiliation | null>(null);
  const [books, setBooks] = useState<ClientBookAccess[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [affData, booksData] = await Promise.all([
        getClientUniversityAffiliation(),
        getClientLibraryBooks("institution_bundle"),
      ]);
      setAffiliation(affData);
      setBooks(booksData);
      setLoading(false);
    }
    loadData();
  }, []);

  // BLOC CONDITIONNEL SECTION 7 CAHIER DES CHARGES :
  // Si le client n'a pas d'affiliation validée, ce bloc se masque ou invite à s'affilier.
  if (affiliation?.status !== "approved") {
    return (
      <div className="p-8 max-w-2xl mx-auto text-center space-y-4">
        <div className="p-4 rounded-full bg-gold/15 text-gold w-16 h-16 mx-auto flex items-center justify-center">
          <GraduationCap className="w-8 h-8" />
        </div>
        <h2 className="font-serif font-bold text-navy text-xl">Accès Réservé aux Membres Affiliés</h2>
        <p className="text-xs text-foreground-muted leading-relaxed">
          Le sous-menu &ldquo;Mon Université&rdquo; n&apos;est accessible qu&apos;aux lecteurs affiliés à un établissement partenaire disposant d&apos;un bouquet institutionnel.
        </p>
        <Link
          href="/student/profile"
          className="px-6 py-3 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors inline-flex items-center gap-2 min-h-[44px] shadow-xs"
        >
          <Building2 className="w-4 h-4 text-gold" />
          Faire une Demande d&apos;Affiliation (Profil)
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/student" className="hover:text-navy">Mon Espace</Link>
        <span>/</span>
        <span className="text-navy font-semibold">Mon Université</span>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/student" className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Mon Espace
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
            <GraduationCap className="w-4 h-4 text-gold" />
            Ressources Institutionnelles Rattachées (Section 7)
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            {affiliation.university_name}
          </h1>
          <p className="text-xs text-foreground-muted mt-1">
            Rattachement validé pour la {affiliation.faculty_name}. Accès aux bouquets documentaires souscrits par votre établissement.
          </p>
        </div>

        <span className="px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 text-xs font-bold shrink-0">
          Pass Établissement Actif
        </span>
      </div>

      {/* Grille des Ouvrages Inclus dans le Bouquet Institutionnel */}
      <div className="space-y-4">
        <h3 className="font-serif font-bold text-navy text-base flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-gold" />
          Ouvrages Inclus dans le Bouquet de Votre Établissement ({books.length})
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {books.map((book) => (
            <div
              key={book.id}
              className="p-4 rounded-3xl bg-background border border-border space-y-3 flex flex-col justify-between shadow-xs"
            >
              <div className="space-y-3">
                <div className="w-full h-44 rounded-2xl bg-navy overflow-hidden border border-border relative">
                  {book.cover_url ? (
                    <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white font-serif font-bold text-xl">
                      {book.title.slice(0, 1)}
                    </div>
                  )}
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded bg-gold/20 text-gold text-[10px] font-mono font-bold">
                    Bouquet UAC
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-foreground-muted uppercase tracking-wider block">{book.discipline}</span>
                  <h3 className="font-serif font-bold text-navy text-sm line-clamp-2 mt-0.5">{book.title}</h3>
                  <p className="text-xs text-foreground-muted truncate">Par {book.author}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-border">
                <Link
                  href={`/catalog/reader/${book.id}`}
                  className="w-full py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors flex items-center justify-center gap-2 min-h-[40px] shadow-xs"
                >
                  <BookOpen className="w-3.5 h-3.5 text-gold" />
                  Consulter via mon bouquet
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
