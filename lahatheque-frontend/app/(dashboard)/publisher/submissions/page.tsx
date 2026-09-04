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
} from "lucide-react";
import { BookCover3D } from "@/components/ui/book-cover-3d";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { getPublisherBooks } from "@/lib/services/publisher";
import type { PublisherBook, ValidationStep } from "@/lib/types/publisher";

const STEP_CONFIG: Record<
  ValidationStep,
  { label: string; shortLabel: string; icon: React.ElementType; badgeClass: string }
> = {
  step_1_deposited: {
    label: "1. Dépôt initial",
    shortLabel: "1. Dépôt",
    icon: FileText,
    badgeClass: "bg-navy/10 text-navy border-navy/20",
  },
  step_2_auto_check: {
    label: "2. Contrôle automatique",
    shortLabel: "2. Contrôle auto",
    icon: ShieldCheck,
    badgeClass: "bg-info/10 text-info border-info/20",
  },
  step_3_editorial_review: {
    label: "3. Examen éditorial LAHA",
    shortLabel: "3. Examen LAHA",
    icon: Clock,
    badgeClass: "bg-gold/15 text-gold border-gold/30",
  },
  step_4_notification: {
    label: "4. Corrections requises",
    shortLabel: "4. Corrections",
    icon: AlertTriangle,
    badgeClass: "bg-warning/15 text-warning border-warning/30",
  },
  step_5_published: {
    label: "5. Publié sur vitrine",
    shortLabel: "5. Publié",
    icon: Globe,
    badgeClass: "bg-success/10 text-success border-success/20",
  },
};

const stepFilterTabs: { id: string; label: string }[] = [
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

  // Décompte par étape
  const stepCounts = useMemo(() => {
    const counts: Record<string, number> = { all: books.length };
    stepFilterTabs.forEach((tab) => {
      if (tab.id !== "all") {
        counts[tab.id] = books.filter((b) => b.validation_step === tab.id).length;
      }
    });
    return counts;
  }, [books]);

  // Filtrage par étape sélectionnée
  const filteredSubmissions = useMemo(() => {
    if (selectedStep === "all") return books;
    return books.filter((b) => b.validation_step === selectedStep);
  }, [books, selectedStep]);

  // Colonnes DataTable (Spécifiques au circuit de dépôt éditeur)
  const columns: DataTableColumn<PublisherBook>[] = [
    {
      key: "title",
      header: "Ouvrage & ISBN",
      className: "min-w-[300px]",
      cell: (row) => (
        <Link
          href={`/publisher/catalog/${row.id}`}
          className="hover:opacity-90 transition-opacity flex items-center gap-3 py-1 group"
        >
          <BookCover3D
            title={row.title}
            authors={row.authors}
            discipline={row.discipline}
            coverUrl={row.cover_url}
            size="xs"
            interactive={false}
          />
          <div className="min-w-0">
            <p className="font-serif font-bold text-xs sm:text-sm text-navy leading-snug group-hover:text-gold transition-colors line-clamp-1">
              {row.title}
            </p>
            {row.subtitle && (
              <p className="text-[11px] text-foreground-muted line-clamp-1 italic">
                {row.subtitle}
              </p>
            )}
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-foreground-muted font-mono font-semibold">
                ISBN : {row.isbn_digital}
              </span>
            </div>
          </div>
        </Link>
      ),
    },
    {
      key: "authors",
      header: "Auteur(s)",
      cell: (row) => (
        <span className="font-semibold text-xs text-foreground line-clamp-2">
          {row.authors.join(", ")}
        </span>
      ),
    },
    {
      key: "discipline",
      header: "Discipline",
      hideOnMobile: true,
      cell: (row) => (
        <span className="text-[11px] font-semibold text-navy bg-navy-light px-2.5 py-1 rounded-lg">
          {row.discipline}
        </span>
      ),
    },
    {
      key: "validation_step",
      header: "Étape du Circuit",
      cell: (row) => {
        const step = STEP_CONFIG[row.validation_step] || {
          label: row.validation_step,
          shortLabel: row.validation_step,
          icon: Clock,
          badgeClass: "bg-background-secondary text-foreground-muted border-border",
        };
        const StepIcon = step.icon;

        return (
          <div className="space-y-1">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold ${step.badgeClass}`}
            >
              <StepIcon className="w-3.5 h-3.5 shrink-0" />
              <span>{step.label}</span>
            </span>
            {row.editorial_comment && (
              <div className="flex items-center gap-1 text-[10px] font-bold text-warning">
                <AlertTriangle className="w-3 h-3" />
                <span>Note éditoriale</span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: "status",
      header: "Statut",
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "created_at",
      header: "Date de Dépôt",
      hideOnMobile: true,
      cell: (row) => (
        <span className="text-xs text-foreground-muted whitespace-nowrap">
          {row.created_at ? new Date(row.created_at).toLocaleDateString("fr-FR") : "—"}
        </span>
      ),
    },
    {
      key: "actions" as keyof PublisherBook,
      header: "Actions",
      className: "text-right",
      cell: (row) => (
        <div className="flex items-center justify-end gap-2">
          <Link
            href={`/publisher/catalog/${row.id}`}
            className="px-3 py-1.5 rounded-xl bg-background-secondary border border-border hover:border-gold hover:text-navy text-foreground font-bold text-xs transition-colors inline-flex items-center gap-1.5 min-h-[36px]"
          >
            <Eye className="w-3.5 h-3.5 text-gold" />
            <span>Détails</span>
          </Link>
        </div>
      ),
    },
  ];

  // Rendu Responsive Mobile-First (Carte sous lg)
  const renderMobileCard = (row: PublisherBook) => {
    const step = STEP_CONFIG[row.validation_step] || {
      label: row.validation_step,
      shortLabel: row.validation_step,
      icon: Clock,
      badgeClass: "bg-background-secondary text-foreground-muted border-border",
    };
    const StepIcon = step.icon;

    return (
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <BookCover3D
            title={row.title}
            authors={row.authors}
            discipline={row.discipline}
            coverUrl={row.cover_url}
            size="xs"
            interactive={false}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <StatusBadge status={row.status} />
              <span className="text-[10px] font-semibold text-navy bg-navy-light px-2 py-0.5 rounded-md">
                {row.discipline}
              </span>
            </div>
            <h4 className="font-serif font-bold text-navy text-sm leading-snug line-clamp-2">
              {row.title}
            </h4>
            <p className="text-xs text-foreground-muted mt-0.5 line-clamp-1">
              {row.authors.join(", ")}
            </p>
            <p className="text-[10px] font-mono text-foreground-muted mt-0.5">
              ISBN : {row.isbn_digital}
            </p>
          </div>
        </div>

        {/* Étape du Circuit Mobile */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold ${step.badgeClass}`}
          >
            <StepIcon className="w-3.5 h-3.5 shrink-0" />
            <span>{step.label}</span>
          </span>

          <Link
            href={`/publisher/catalog/${row.id}`}
            className="px-3 py-1.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors inline-flex items-center gap-1.5 min-h-[36px]"
          >
            <Eye className="w-3.5 h-3.5 text-gold" />
            <span>Voir Détails</span>
          </Link>
        </div>

        {/* Commentaire éditorial mobile si présent */}
        {row.editorial_comment && (
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-0.5">
            <span className="font-bold text-navy flex items-center gap-1 text-[11px]">
              <AlertTriangle className="w-3 h-3 text-gold" />
              Commentaire éditorial LAHA :
            </span>
            <p className="text-foreground text-[11px] italic line-clamp-2">
              {row.editorial_comment}
            </p>
          </div>
        )}
      </div>
    );
  };

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

      {/* Onglets Filtres par Étape du Circuit de Validation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {stepFilterTabs.map((flt) => {
          const count = stepCounts[flt.id] ?? 0;
          const isActive = selectedStep === flt.id;

          return (
            <button
              key={flt.id}
              onClick={() => setSelectedStep(flt.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 min-h-[40px] shrink-0 ${
                isActive
                  ? "bg-navy text-white shadow-xs"
                  : "bg-background border border-border text-foreground-muted hover:text-navy hover:border-gold"
              }`}
            >
              <span>{flt.label}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  isActive ? "bg-white/20 text-white" : "bg-background-secondary text-foreground"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* DataTable Officielle LAHAThèque */}
      <DataTable<PublisherBook>
        data={filteredSubmissions}
        columns={columns}
        rowKey="id"
        loading={loading}
        searchable={true}
        searchPlaceholder="Rechercher par titre, auteur ou ISBN..."
        pageSize={10}
        pageSizeOptions={[10, 20, 50]}
        mobileCard={renderMobileCard}
        emptyState={
          <div className="py-16 text-center space-y-3">
            <Clock className="w-10 h-10 text-foreground-muted mx-auto" />
            <h3 className="font-serif font-bold text-navy text-base">
              Aucun dépôt ne correspond aux critères
            </h3>
            <p className="text-xs text-foreground-muted max-w-md mx-auto">
              Aucun ouvrage n&apos;a été trouvé pour cette étape du workflow ou avec ces termes de recherche.
            </p>
            {selectedStep !== "all" && (
              <button
                type="button"
                onClick={() => setSelectedStep("all")}
                className="text-gold hover:underline text-xs font-bold mt-2"
              >
                Voir tous les dépôts
              </button>
            )}
          </div>
        }
      />
    </div>
  );
}
