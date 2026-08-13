"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { PenTool, ArrowLeft, PlusCircle, Clock, ChevronRight, FileText } from "lucide-react";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { getAuthorSubmissions } from "@/lib/services/author";
import type { AuthorSubmission } from "@/lib/types/author";

export default function AuthorSubmissionsPage() {
  const [submissions, setSubmissions] = useState<AuthorSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await getAuthorSubmissions();
      setSubmissions(data);
      setLoading(false);
    }
    loadData();
  }, []);

  const columns: DataTableColumn<AuthorSubmission>[] = [
    {
      key: "title",
      header: "Titre du Manuscrit Soumis",
      cell: (row) => (
        <div>
          <p className="font-serif font-bold text-xs text-navy leading-snug">{row.title}</p>
          <span className="text-[10px] font-mono text-gold font-bold uppercase">{row.version_type}</span>
        </div>
      ),
    },
    {
      key: "submitted_at",
      header: "Date de Dépôt",
      cell: (row) => (
        <span className="font-mono text-xs text-foreground-muted">{row.submitted_at}</span>
      ),
    },
    {
      key: "status",
      header: "Statut des 2 Étapes",
      cell: (row) => (
        <div className="space-y-1">
          <StatusBadge status={row.status} />
          <span className="text-[10px] text-foreground-muted block font-mono">
            {row.status === "study_pending"
              ? "Étape 1 : En étude éditoriale"
              : row.status === "accepted"
              ? "Étape 2 : Préparation catalogue"
              : row.status === "correction_requested"
              ? "Correction demandée"
              : "Publié"}
          </span>
        </div>
      ),
    },
    {
      key: "id",
      header: "",
      cell: (row) => (
        <Link
          href={`/author/submissions/${row.id}`}
          className="px-3 py-1.5 rounded-xl bg-navy text-white text-[10px] font-bold hover:bg-navy-hover transition-colors inline-flex items-center gap-1 min-h-[36px]"
        >
          <FileText className="w-3.5 h-3.5 text-gold" />
          Consulter le Suivi
        </Link>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/author" className="hover:text-navy">Vue d&apos;ensemble</Link>
        <span>/</span>
        <span className="text-navy font-semibold">Mes Dépôts de Manuscrits</span>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/author" className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Vue d&apos;ensemble
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
            <PenTool className="w-4 h-4 text-gold" />
            Soumissions pour Étude Éditoriale (Section 4.1 Cahier v3.2)
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Mes Dépôts de Manuscrits
          </h1>
          <p className="text-xs text-foreground-muted mt-1">
            Suivez le statut de vos soumissions sur les 2 étapes (Étape 1 : Étude éditoriale par LAHA Éditions → Étape 2 : Préparation catalogue par le Maquettiste).
          </p>
        </div>

        <Link
          href="/author/submissions/new"
          className="px-5 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors inline-flex items-center gap-2 min-h-[44px] shadow-xs shrink-0"
        >
          <PlusCircle className="w-4 h-4 text-gold" />
          Déposer un Nouveau Manuscrit
        </Link>
      </div>

      {/* Tableau des Dépôts */}
      <div className="space-y-4">
        <h3 className="font-serif font-bold text-navy text-base">
          Dossiers de Dépôt en Cours &amp; Historique ({submissions.length})
        </h3>

        <DataTable
          data={submissions}
          columns={columns}
          rowKey="id"
          loading={loading}
          emptyMessage="Aucun dépôt de manuscrit enregistré pour le moment."
          pageSize={10}
        />
      </div>
    </div>
  );
}
