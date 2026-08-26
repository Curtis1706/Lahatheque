"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  PenTool, 
  ArrowLeft, 
  Send,
  AlertCircle
} from "lucide-react";
import { AuthorFileDropzone } from "@/components/features/author/author-file-dropzone";
import { createAuthorSubmission } from "@/lib/services/author";
import { extractBookMetadataWithAi } from "@/lib/services/ai";
import { toast } from "sonner";
import { InlineLoader } from "@/components/ui/page-loader";

export default function AuthorNewSubmissionPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [versionType, setVersionType] = useState<"preview" | "brouillon" | "finale">("brouillon");
  const [summary, setSummary] = useState("");
  const [language, setLanguage] = useState("Français");
  const [file, setFile] = useState<File | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Suggestion automatique par l'IA via extraction PyMuPDF
  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    setIsAiLoading(true);
    toast.info("Analyse du manuscrit par l'IA en cours...");
    try {
      const result = await extractBookMetadataWithAi(selectedFile, selectedFile.name);
      if (result.success && result.data) {
        if (!title && result.data.title) setTitle(result.data.title);
        if (result.data.summary) setSummary(result.data.summary);
        if (result.data.language) setLanguage(result.data.language);
        toast.success("Métadonnées et résumé extraits avec succès !");
      }
    } catch (err) {
      console.warn("Extraction IA fallback", err);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Veuillez saisir le titre de l'ouvrage.");
      return;
    }

    setSubmitting(true);
    try {
      const sub = await createAuthorSubmission(
        title,
        file ? `/uploads/submissions/${file.name}` : "/uploads/submissions/manuscrit.pdf",
        versionType,
        summary,
        language
      );
      toast.success("Votre manuscrit a été déposé avec succès pour étude par l'équipe LAHA Éditions !");
      router.push("/author/submissions");
    } catch (err) {
      toast.error("Une erreur est survenue lors de la soumission.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
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
            Soumission de Manuscrit • Étape 1 : Étude Éditoriale
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Déposer un Nouveau Manuscrit
          </h1>
          <p className="text-xs text-foreground-muted mt-1">
            Transmettez votre projet d&apos;ouvrage pour évaluation par le comité éditorial de LAHA Éditions.
          </p>
        </div>
      </div>

      {/* Rappel d'Information : Circuit Éditorial */}
      <div className="p-4 rounded-2xl bg-gold/10 border border-gold/30 text-xs text-navy space-y-1">
        <p className="font-bold flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4 text-gold" />
          Rappel du Circuit Éditorial (Étape 1 — Étude Éditoriale) :
        </p>
        <p className="text-foreground-muted leading-relaxed">
          À ce stade, vous déposez votre manuscrit pour **évaluation éditoriale**. La mise en page et la classification Dewey/ONIX seront coordonnées avec le Maquettiste lors de l&apos;Étape 2 après acceptation.
        </p>
      </div>

      {/* Formulaire de Soumission */}
      <form onSubmit={handleSubmit} className="p-6 sm:p-8 rounded-3xl bg-background border border-border space-y-6 shadow-xs">
        {/* 21st.dev FileDropzone Component */}
        <div>
          <label className="block font-bold text-navy text-xs mb-2">
            Fichier du Manuscrit (PDF, EPUB ou Word DOCX)
          </label>
          <AuthorFileDropzone
            onFileSelected={handleFileSelect}
            selectedFile={file}
            onRemoveFile={() => setFile(null)}
            isLoading={isAiLoading}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* Titre */}
          <div className="sm:col-span-2">
            <label className="block font-bold text-navy mb-1.5">
              Titre Proposé du Manuscrit *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Traité de Droit Commercial Général OHADA"
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-navy min-h-[44px]"
              required
            />
          </div>

          {/* Type de Version */}
          <div>
            <label className="block font-bold text-navy mb-1.5">
              État d&apos;Avancement du Manuscrit
            </label>
            <select
              value={versionType}
              onChange={(e) => setVersionType(e.target.value as any)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-navy min-h-[44px]"
            >
              <option value="brouillon">Brouillon de travail (En cours de rédaction)</option>
              <option value="preview">Épreuve intermédiaire / Extrait (Preview)</option>
              <option value="finale">Version Finale Complète (Prête pour relecture)</option>
            </select>
          </div>

          {/* Langue */}
          <div>
            <label className="block font-bold text-navy mb-1.5">
              Langue de Rédaction
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-navy min-h-[44px]"
            >
              <option value="Français">Français</option>
              <option value="Anglais">Anglais (English)</option>
              <option value="Arabe">Arabe (العربية)</option>
              <option value="Portugais">Portugais (Português)</option>
              <option value="Fon">Fon / Langues Nationales</option>
            </select>
          </div>

          {/* Résumé / Argumentaire */}
          <div className="sm:col-span-2">
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-bold text-navy">
                Résumé ou Note d&apos;Intention Auteur
              </label>
            </div>
            <textarea
              rows={4}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Présentez brièvement la thématique, le public ciblé (étudiants, praticiens, grand public) et les points forts de l'ouvrage..."
              className="w-full p-3 rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-navy leading-relaxed"
            />
          </div>
        </div>

        {/* Boutons d'Action */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <Link
            href="/author/submissions"
            className="px-4 py-2.5 rounded-xl border border-border text-foreground hover:bg-background-secondary text-xs font-bold transition-colors min-h-[44px] flex items-center cursor-pointer"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={submitting || !title.trim()}
            className="px-6 py-2.5 rounded-xl bg-gold text-navy text-xs font-bold hover:bg-gold-light transition-colors flex items-center gap-2 min-h-[44px] shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {submitting ? (
              <InlineLoader size={16} />
            ) : (
              <>
                <Send className="w-4 h-4" />
                Soumettre le Manuscrit pour Étude
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
