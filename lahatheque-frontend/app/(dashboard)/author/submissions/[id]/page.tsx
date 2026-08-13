"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PenTool, ArrowLeft, Download, FileText } from "lucide-react";
import { AuthorSubmissionStepper } from "@/components/features/author/author-submission-stepper";
import { getAuthorSubmissions } from "@/lib/services/author";
import type { AuthorSubmission } from "@/lib/types/author";

export default function AuthorSubmissionDetailPage() {
  const params = useParams();
  const subId = (params?.id as string) || "sub-aut-001";

  const [sub, setSub] = useState<AuthorSubmission | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const list = await getAuthorSubmissions();
      const item = list.find((s) => s.id === subId) || list[0];
      setSub(item);
      setLoading(false);
    }
    loadData();
  }, [subId]);

  if (loading || !sub) {
    return (
      <div className="p-8 text-center space-y-4">
        <span className="w-8 h-8 border-2 border-navy border-t-gold rounded-full animate-spin inline-block" />
        <p className="text-xs text-foreground-muted font-mono">Chargement du dossier de dépôt...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-8 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/author" className="hover:text-navy">Vue d&apos;ensemble</Link>
        <span>/</span>
        <Link href="/author/submissions" className="hover:text-navy">Mes Dépôts</Link>
        <span>/</span>
        <span className="text-navy font-semibold">{sub.title}</span>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/author/submissions" className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Retour à Mes Dépôts
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
            <PenTool className="w-4 h-4 text-gold" />
            Suivi du Dossier de Dépôt
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            {sub.title}
          </h1>
          <p className="text-xs text-foreground-muted mt-1">
            Déposé le {sub.submitted_at} — Version {sub.version_type}
          </p>
        </div>
      </div>

      {/* Stepper des 2 Étapes (Étape 1 Étude vs Étape 2 Préparation Catalogue) */}
      <AuthorSubmissionStepper submission={sub} />

      {/* Fiche des Informations Déposées */}
      <div className="p-6 rounded-3xl bg-background border border-border space-y-4 shadow-xs">
        <h3 className="font-serif font-bold text-navy text-sm uppercase tracking-wider border-b border-border pb-2">
          Informations du Manuscrit
        </h3>

        <div className="space-y-3 text-xs">
          <div>
            <span className="text-[10px] font-bold text-foreground-muted uppercase tracking-wider block">Fichier Manuscrit :</span>
            <a
              href={sub.manuscript_file_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 font-mono font-bold text-navy hover:text-gold mt-1 underline"
            >
              <Download className="w-4 h-4 text-gold" />
              {sub.manuscript_file_url}
            </a>
          </div>

          <div>
            <span className="text-[10px] font-bold text-foreground-muted uppercase tracking-wider block">Résumé ou Note d&apos;Intention :</span>
            <p className="text-navy leading-relaxed mt-1">{sub.suggested_summary}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
