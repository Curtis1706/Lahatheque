"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, Send, Save, AlertCircle, CheckCircle, ShieldCheck, FileText } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { AISuggestionBadge } from "@/components/features/layout-artist/ai-suggestion-badge";
import { getDepositDetail, updateDeposit, submitDepositForValidation } from "@/lib/services/layout-artist";
import type { LayoutDeposit } from "@/lib/types/layout-artist";

export default function DepositDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [deposit, setDeposit] = useState<LayoutDeposit | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [authorsStr, setAuthorsStr] = useState("");
  const [year, setYear] = useState(2026);
  const [language, setLanguage] = useState("Français");
  const [summary, setSummary] = useState("");
  const [discipline, setDiscipline] = useState("");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await getDepositDetail(id);
      setDeposit(data);
      if (data) {
        setTitle(data.metadata.title);
        setAuthorsStr(data.metadata.authors.join(", "));
        setYear(data.metadata.publication_year);
        setLanguage(data.metadata.language);
        setSummary(data.metadata.summary);
        setDiscipline(data.classification.discipline);
      }
      setLoading(false);
    }
    loadData();
  }, [id]);

  const isEditable = deposit?.status === "draft" || deposit?.status === "revision_requested";

  const handleSave = async () => {
    if (!deposit) return;
    setSaving(true);
    const updated = await updateDeposit(deposit.id, {
      metadata: {
        ...deposit.metadata,
        title,
        authors: authorsStr.split(",").map((a) => a.trim()),
        publication_year: year,
        language,
        summary,
      },
      classification: {
        ...deposit.classification,
        discipline,
      },
    });
    if (updated) setDeposit(updated);
    setSaving(false);
  };

  const handleResubmit = async () => {
    if (!deposit) return;
    setSaving(true);
    await handleSave();
    await submitDepositForValidation(deposit.id);
    setSaving(false);
    router.push("/layout-artist/deposits");
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 md:p-8 w-full max-w-5xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-background-secondary rounded-xl" />
        <div className="h-40 bg-background-secondary rounded-2xl" />
        <div className="h-64 bg-background-secondary rounded-2xl" />
      </div>
    );
  }

  if (!deposit) {
    return (
      <div className="p-4 sm:p-6 md:p-8 w-full max-w-5xl mx-auto text-center space-y-4">
        <BookOpen className="w-12 h-12 text-foreground-muted mx-auto" />
        <h2 className="font-serif font-bold text-navy text-xl">Dépôt introuvable</h2>
        <Link href="/layout-artist/deposits" className="text-xs text-gold font-bold hover:underline">
          Retour à mes dépôts
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full max-w-5xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/layout-artist" className="hover:text-navy">Vue d&apos;ensemble</Link>
        <span>/</span>
        <Link href="/layout-artist/deposits" className="hover:text-navy">Mes Dépôts</Link>
        <span>/</span>
        <span className="text-navy font-semibold truncate max-w-[200px]">{deposit.metadata.title}</span>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-6">
        <Link href="/layout-artist/deposits" className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-2">
          <ArrowLeft className="w-3.5 h-3.5" />
          Retour à mes dépôts
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="font-serif text-xl sm:text-2xl font-bold text-navy">{deposit.metadata.title}</h1>
            <p className="text-xs text-foreground-muted mt-1">
              Déposé le {new Date(deposit.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
            </p>
          </div>
          <StatusBadge status={deposit.status} />
        </div>
      </div>

      {/* Message de révision si revision_requested */}
      {deposit.status === "revision_requested" && (
        <div className="p-5 rounded-3xl bg-error/5 border border-error/20 space-y-2">
          <div className="flex items-center gap-2 text-error font-bold text-xs uppercase tracking-wider">
            <AlertCircle className="w-4 h-4" />
            Demande de correction du Chef Maquettiste
          </div>
          <p className="text-xs text-foreground bg-background p-3.5 rounded-2xl border border-border italic">
            &ldquo;{deposit.chef_comment || "Veuillez vérifier et corriger les métadonnées de l'ouvrage."}&rdquo;
          </p>
          <p className="text-[11px] text-foreground-muted">
            Apportez les modifications requises ci-dessous puis cliquez sur &quot;Soumettre les corrections&quot;.
          </p>
        </div>
      )}

      {/* Formulaire des 4 blocs */}
      <div className="space-y-6">
        {/* Bloc 1 : Métadonnées */}
        <div className="p-6 rounded-3xl bg-background-secondary border border-border space-y-4">
          <h3 className="text-sm font-bold text-navy flex items-center justify-between">
            <span>1. Métadonnées de base</span>
            <AISuggestionBadge source={deposit.metadata.language_source} />
          </h3>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-navy mb-1">Titre de l&apos;ouvrage</label>
              <input
                type="text"
                disabled={!isEditable}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-border bg-background text-foreground disabled:opacity-70 min-h-[40px]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-navy mb-1">Auteur(s)</label>
                <input
                  type="text"
                  disabled={!isEditable}
                  value={authorsStr}
                  onChange={(e) => setAuthorsStr(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-border bg-background text-foreground disabled:opacity-70 min-h-[40px]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-navy mb-1">Langue de l&apos;ouvrage</label>
                <input
                  type="text"
                  disabled={!isEditable}
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-border bg-background text-foreground disabled:opacity-70 min-h-[40px]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-navy mb-1">Résumé</label>
              <textarea
                disabled={!isEditable}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={3}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-border bg-background text-foreground disabled:opacity-70 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Bloc 2 : Classification */}
        <div className="p-6 rounded-3xl bg-background-secondary border border-border space-y-4">
          <h3 className="text-sm font-bold text-navy flex items-center justify-between">
            <span>2. Classification Académique</span>
            <AISuggestionBadge source={deposit.classification.source} />
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-foreground-muted block">Discipline</span>
              <input
                type="text"
                disabled={!isEditable}
                value={discipline}
                onChange={(e) => setDiscipline(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground font-semibold disabled:opacity-70 mt-1 min-h-[40px]"
              />
            </div>
            <div>
              <span className="text-foreground-muted block">Université &amp; Faculté</span>
              <p className="font-semibold text-foreground mt-2">{deposit.classification.university}</p>
              <p className="text-[11px] text-foreground-muted">{deposit.classification.faculty}</p>
            </div>
          </div>
        </div>

        {/* Bloc 3 : Format Numérique & DRM */}
        <div className="p-6 rounded-3xl bg-background-secondary border border-border space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-navy flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-gold" />
              3. Format Numérique &amp; Protection Filigrane DRM
            </h3>
            <Link
              href={`/read/${deposit.id}`}
              className="text-xs font-bold text-gold hover:underline flex items-center gap-1"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Feuilleter mon épreuve
            </Link>
          </div>
          <div className="p-3.5 rounded-2xl bg-background border border-border space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-navy">Format : {deposit.files.format}</span>
              <StatusBadge status="approved" leftLabel="Tatouage &amp; DRM Sécurisé" />
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      {isEditable && (
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2.5 rounded-xl border border-border bg-background text-navy text-xs font-bold hover:bg-background-secondary min-h-[44px]"
          >
            Enregistrer les modifications
          </button>

          {deposit.status === "revision_requested" && (
            <button
              type="button"
              onClick={handleResubmit}
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-gold text-navy text-xs font-bold hover:bg-gold-light transition-colors flex items-center gap-2 min-h-[44px] shadow-sm"
            >
              {saving ? (
                <span className="w-4 h-4 border-2 border-navy/30 border-t-navy rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Soumettre les corrections
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
