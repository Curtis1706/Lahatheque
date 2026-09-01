"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Clock,
  PlusCircle,
  UploadCloud,
  Eye,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  Send,
  Globe,
  FileText,
  Search,
  Filter,
} from "lucide-react";
import { BookCover3D } from "@/components/ui/book-cover-3d";
import { StatusBadge } from "@/components/ui/status-badge";
import { getPublisherBooks } from "@/lib/services/publisher";
import type { PublisherBook, ValidationStep } from "@/lib/types/publisher";

const stepFilters: { id: string; label: string }[] = [
  { id: "all", label: "Tous les dépôts" },
  { id: "step_1_deposited", label: "1. Dépôt initial" },
  { id: "step_2_auto_check", label: "2. Contrôle automatique" },
  { id: "step_3_editorial_review", label: "3. Examen éditorial LAHA" },
  { id: "step_4_notification", label: "4. Corrections requises" },
  { id: "step_5_published", label: "5. Publiés sur la vitrine" },
];

export default function PublisherSubmissionsPage() {
  const [books, setBooks] = useState<PublisherBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStep, setSelectedStep] = useState("all");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const data = await getPublisherBooks();
        setBooks(data);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredSubmissions = useMemo(() => {
    return books.filter((b) => {
      if (selectedStep !== "all" && b.validation_step !== selectedStep) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = b.title.toLowerCase().includes(q);
        const matchIsbn = b.isbn_digital.toLowerCase().includes(q);
        const matchAuthor = b.authors.some((a) => a.toLowerCase().includes(q));
        if (!matchTitle && !matchIsbn && !matchAuthor) return false;
      }
      return true;
    });
  }, [books, searchQuery, selectedStep]);

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/20 text-gold text-xs font-bold mb-2 uppercase tracking-wider">
            <Clock className="w-3.5 h-3.5" />
            Circuit de Contrôle &amp; Validation
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-navy tracking-tight">
            Suivi des Dépôts d&apos;Ouvrages (5 Étapes)
          </h1>
          <p className="text-xs sm:text-sm text-foreground-muted mt-0.5">
            Suivez l&apos;avancement de vos manuscrits soumis à l&apos;équipe éditoriale et juridique de LAHA Éditions.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/publisher/catalog/batch"
            className="px-3.5 py-2.5 rounded-xl bg-background-secondary border border-border text-navy font-bold text-xs hover:border-gold transition-colors inline-flex items-center gap-2 min-h-[44px]"
          >
            <UploadCloud className="w-4 h-4 text-gold" />
            Import Lot ONIX
          </Link>
          <Link
            href="/publisher/catalog/new"
            className="px-4 py-2.5 rounded-xl bg-gold text-navy font-bold text-xs hover:bg-gold-light transition-all inline-flex items-center gap-2 shadow-xs min-h-[44px]"
          >
            <PlusCircle className="w-4 h-4" />
            Nouveau Dépôt
          </Link>
        </div>
      </div>

      {/* Barre de Recherche et Filtres */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par titre, auteur ou ISBN..."
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-background border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-semibold min-h-[44px]"
          />
        </div>

        {/* Filtres par étapes */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {stepFilters.map((flt) => (
            <button
              key={flt.id}
              onClick={() => setSelectedStep(flt.id)}
              className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors min-h-[40px] ${
                selectedStep === flt.id
                  ? "bg-navy text-white shadow-xs"
                  : "bg-background-secondary border border-border text-foreground-muted hover:text-navy"
              }`}
            >
              {flt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Liste des Soumissions */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-6 rounded-3xl bg-background border border-border animate-pulse h-36" />
          ))}
        </div>
      ) : filteredSubmissions.length === 0 ? (
        <div className="p-12 rounded-3xl bg-background border border-border text-center space-y-3">
          <Clock className="w-10 h-10 text-foreground-muted mx-auto" />
          <h3 className="font-serif font-bold text-navy text-base">Aucun dépôt ne correspond aux critères</h3>
          <p className="text-xs text-foreground-muted max-w-md mx-auto">
            Aucun ouvrage n&apos;a été trouvé pour cette étape du workflow ou avec ces termes de recherche.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSubmissions.map((b) => (
            <div
              key={b.id}
              className="p-6 rounded-3xl bg-background border border-border space-y-4 shadow-xs hover:border-gold transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
                <div className="flex items-start gap-3.5">
                  <BookCover3D
                    title={b.title}
                    authors={b.authors}
                    discipline={b.discipline}
                    coverUrl={b.cover_url}
                    size="xs"
                    interactive={false}
                  />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono font-bold text-xs text-gold">ISBN : {b.isbn_digital}</span>
                      <span className="text-[11px] font-semibold text-navy bg-navy-light px-2 py-0.5 rounded-md">
                        {b.discipline}
                      </span>
                      <StatusBadge status={b.status} />
                    </div>
                    <h3 className="font-serif font-bold text-navy text-base leading-snug">{b.title}</h3>
                    <p className="text-xs text-foreground-muted mt-0.5">
                      Auteur(s) : <span className="font-semibold text-foreground">{b.authors.join(", ")}</span> • Déposé le {new Date(b.created_at).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/publisher/catalog/${b.id}`}
                    className="px-4 py-2 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors inline-flex items-center gap-2 min-h-[40px] shadow-xs"
                  >
                    <Eye className="w-4 h-4 text-gold" />
                    Voir Détails &amp; Timeline
                  </Link>
                </div>
              </div>

              {/* Mini Stepper 5 Étapes */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                {[
                  { step: "step_1_deposited", label: "1. Dépôt Initial", icon: FileText },
                  { step: "step_2_auto_check", label: "2. Contrôle Technique", icon: ShieldCheck },
                  { step: "step_3_editorial_review", label: "3. Examen LAHA", icon: Clock },
                  { step: "step_4_notification", label: "4. Notification", icon: Send },
                  { step: "step_5_published", label: "5. Publication Vitrine", icon: Globe },
                ].map((s, idx) => {
                  const stepOrder = [
                    "step_1_deposited",
                    "step_2_auto_check",
                    "step_3_editorial_review",
                    "step_4_notification",
                    "step_5_published",
                  ];
                  const currentIdx = stepOrder.indexOf(b.validation_step);
                  const isDone = idx < currentIdx || b.status === "published";
                  const isCurrent = idx === currentIdx && b.status !== "published";

                  return (
                    <div
                      key={s.step}
                      className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                        isDone
                          ? "bg-emerald-500/5 border-emerald-500/30 text-emerald-700 font-semibold"
                          : isCurrent
                          ? "bg-gold/10 border-gold text-navy font-bold shadow-2xs"
                          : "bg-background-secondary border-border text-foreground-muted opacity-50"
                      }`}
                    >
                      <s.icon className={`w-3.5 h-3.5 shrink-0 ${isDone ? "text-emerald-600" : isCurrent ? "text-gold" : ""}`} />
                      <span className="truncate text-[11px]">{s.label}</span>
                    </div>
                  );
                })}
              </div>

              {/* Commentaire éditorial si présent */}
              {b.editorial_comment && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-1">
                  <span className="font-bold text-navy flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-gold" />
                    Commentaire de l&apos;Équipe Éditoriale LAHA :
                  </span>
                  <p className="text-foreground italic">{b.editorial_comment}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
