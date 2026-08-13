"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PenTool, ArrowLeft, Upload, Sparkles, CheckCircle2, FileText, AlertCircle } from "lucide-react";
import { createAuthorSubmission } from "@/lib/services/author";

export default function AuthorNewSubmissionPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [versionType, setVersionType] = useState<"preview" | "brouillon" | "finale">("brouillon");
  const [summary, setSummary] = useState("");
  const [language, setLanguage] = useState("Français");
  const [fileName, setFileName] = useState("manuscrit-brouillon.pdf");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Suggestion automatique par l'IA (Section C — Intelligence Artificielle du Cahier v3.2)
  const handleSuggestWithAi = () => {
    if (!title.trim()) {
      alert("Veuillez saisir au moins le titre de l'ouvrage pour générer les suggestions IA.");
      return;
    }
    setIsAiLoading(true);
    setTimeout(() => {
      setSummary(
        `Cet ouvrage présente une étude approfondie sur ${title}. Il analyse les concepts clés, la jurisprudence dominante et propose une méthodologie claire à destination des chercheurs et praticiens.`
      );
      setLanguage("Français");
      setIsAiLoading(false);
    }, 600);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    try {
      await createAuthorSubmission(
        title,
        `/manuscripts/${fileName}`,
        versionType,
        summary,
        language
      );
      alert("Votre manuscrit a été déposé avec succès pour étude par l'équipe LAHA Éditions !");
      router.push("/author/submissions");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-8 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/author" className="hover:text-navy">Vue d&apos;ensemble</Link>
        <span>/</span>
        <Link href="/author/submissions" className="hover:text-navy">Mes Dépôts</Link>
        <span>/</span>
        <span className="text-navy font-semibold">Nouveau Dépôt</span>
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
            Soumission pour Étude Éditoriale (Section 4.1 Cahier v3.2)
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Déposer un Nouveau Manuscrit
          </h1>
          <p className="text-xs text-foreground-muted mt-1">
            Transmettez votre projet d&apos;ouvrage pour évaluation par le comité éditorial de LAHA Éditions.
          </p>
        </div>
      </div>

      {/* Rappel d'Information : Pas de métadonnées catalogue à ce stade */}
      <div className="p-4 rounded-2xl bg-gold/10 border border-gold/30 text-xs text-navy space-y-1">
        <p className="font-bold flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4 text-gold" />
          Rappel Import du Circuit Éditorial (Étape 1 — Étude) :
        </p>
        <p className="text-foreground-muted leading-relaxed">
          À ce stade, vous déposez votre manuscrit pour **évaluation éditoriale**. La classification catalogue (discipline, faculté, prix) sera réalisée par le Maquettiste lors de l&apos;Étape 2 si le manuscrit est accepté.
        </p>
      </div>

      {/* Formulaire de Soumission */}
      <form onSubmit={handleSubmit} className="p-6 rounded-3xl bg-background border border-border space-y-6 shadow-xs">
        <div className="space-y-4 text-xs">
          {/* Fichier Manuscrit Upload (21st.dev File Dropzone 19201) */}
          <div>
            <label htmlFor="manuscript-file" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
              Fichier du Manuscrit (PDF, EPUB, Word) *
            </label>
            <div className="flex items-center gap-2">
              <input
                id="manuscript-file"
                type="file"
                onChange={(e) => setFileName(e.target.files?.[0]?.name || "manuscrit.pdf")}
                className="hidden"
              />
              <label
                htmlFor="manuscript-file"
                className="w-full p-6 bg-background-secondary border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-gold transition-colors text-center space-y-2"
              >
                <Upload className="w-8 h-8 text-gold" />
                <span className="font-serif font-bold text-navy text-sm">{fileName}</span>
                <span className="text-[11px] text-foreground-muted">Cliquez pour téléverser votre fichier manuscrit (max 100 Mo)</span>
              </label>
            </div>
          </div>

          <div>
            <label htmlFor="book-title" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">Titre de l&apos;Ouvrage *</label>
            <input
              id="book-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ex. Traité de Droit Administratif Général"
              className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl text-navy font-semibold focus:outline-none focus:border-gold min-h-[44px]"
            />
          </div>

          <div>
            <label htmlFor="ver-type" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">Type de Version Déposée *</label>
            <select
              id="ver-type"
              value={versionType}
              onChange={(e) => setVersionType(e.target.value as "preview" | "brouillon" | "finale")}
              className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl text-navy font-semibold focus:outline-none focus:border-gold min-h-[44px]"
            >
              <option value="brouillon">Version Brouillon / Manuscrit en travail</option>
              <option value="preview">Extrait / Preview pour avis éditorial</option>
              <option value="finale">Version Finale Prête pour Édition</option>
            </select>
          </div>

          {/* Résumé avec Suggestion IA (Section C Cahier v3.2) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="summary-text" className="block text-xs font-bold text-navy uppercase tracking-wider">Résumé ou Note d&apos;Intention</label>
              <button
                type="button"
                onClick={handleSuggestWithAi}
                disabled={isAiLoading}
                className="text-[11px] font-bold text-gold hover:underline inline-flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {isAiLoading ? "Génération IA..." : "Suggérer par IA"}
              </button>
            </div>
            <textarea
              id="summary-text"
              rows={4}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Présentation synthétique du manuscrit et du public visé..."
              className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl text-navy font-semibold focus:outline-none focus:border-gold"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-border">
          <Link
            href="/author/submissions"
            className="px-4 py-2.5 rounded-xl border border-border text-xs font-semibold text-foreground-muted hover:text-navy"
          >
            Annuler
          </Link>

          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors inline-flex items-center gap-2 min-h-[44px] shadow-xs disabled:opacity-50"
          >
            {submitting ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-gold" />
                Soumettre pour Étude
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
