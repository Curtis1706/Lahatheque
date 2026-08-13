"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Sparkles, Save, Send, Plus, CheckCircle2, ShieldCheck } from "lucide-react";
import { FileDropzone } from "@/components/features/layout-artist/file-dropzone";
import { AISuggestionBadge } from "@/components/features/layout-artist/ai-suggestion-badge";
import { DepositWizardStepper, DEPOSIT_STEPS } from "@/components/features/layout-artist/deposit-wizard-stepper";
import { createDeposit, simulateAiDetection } from "@/lib/services/layout-artist";
import type { ClassificationSource } from "@/lib/types/layout-artist";

export default function NewDepositPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Form State
  const [bookFile, setBookFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | undefined>(undefined);
  const [audioFile, setAudioFile] = useState<File | null>(null);

  // Metadata State
  const [title, setTitle] = useState("");
  const [authorsStr, setAuthorsStr] = useState("");
  const [year, setYear] = useState(2026);
  const [language, setLanguage] = useState("Français");
  const [languageSource, setLanguageSource] = useState<ClassificationSource>("ai_suggested");
  const [summary, setSummary] = useState("");
  const [summarySource, setSummarySource] = useState<ClassificationSource>("ai_suggested");
  const [isbn, setIsbn] = useState("");

  // Classification State
  const [country, setCountry] = useState("BJ");
  const [university, setUniversity] = useState("Université d'Abomey-Calavi (UAC)");
  const [faculty, setFaculty] = useState("Faculté de Droit et de Science Politique (FADESP)");
  const [discipline, setDiscipline] = useState("Droit & Sciences Politiques");
  const [classificationSource, setClassificationSource] = useState<ClassificationSource>("ai_suggested");

  // IA Loading State
  const [aiLoading, setAiLoading] = useState(false);

  const handleBookFileSelect = async (file: File) => {
    setBookFile(file);
    if (!title) {
      // Pré-remplir le titre à partir du nom de fichier sans extension
      const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/_/g, " ");
      setTitle(cleanName);
    }
    // Déclencher la détection IA
    setAiLoading(true);
    const aiData = await simulateAiDetection(file.name);
    setLanguage(aiData.language);
    setDiscipline(aiData.discipline);
    setFaculty(aiData.faculty);
    if (!summary) setSummary(aiData.summary);
    setAiLoading(false);
  };

  const handleCoverSelect = (file: File) => {
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    const dep = await createDeposit({
      metadata: {
        title: title || "Nouveau Dépôt",
        authors: authorsStr ? authorsStr.split(",").map((a) => a.trim()) : ["Auteur"],
        publication_year: year,
        language,
        language_source: languageSource,
        summary,
        summary_source: summarySource,
        isbn,
      },
      classification: {
        country,
        university,
        faculty,
        discipline,
        source: classificationSource,
      },
      files: {
        format: bookFile?.name.endsWith(".epub") ? "EPUB" : "PDF",
        book_file_name: bookFile?.name,
        cover_url: coverPreview,
      },
      status: "draft",
    });
    setSaving(false);
    router.push(`/layout-artist/deposits/${dep.id}`);
  };

  const handleSubmitValidation = async () => {
    setSaving(true);
    const dep = await createDeposit({
      metadata: {
        title: title || "Nouveau Dépôt",
        authors: authorsStr ? authorsStr.split(",").map((a) => a.trim()) : ["Auteur"],
        publication_year: year,
        language,
        language_source: languageSource,
        summary,
        summary_source: summarySource,
        isbn,
      },
      classification: {
        country,
        university,
        faculty,
        discipline,
        source: classificationSource,
      },
      files: {
        format: bookFile?.name.endsWith(".epub") ? "EPUB" : "PDF",
        book_file_name: bookFile?.name,
        cover_url: coverPreview,
      },
      status: "pending_validation",
    });
    setSaving(false);
    router.push("/layout-artist/deposits");
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/layout-artist" className="hover:text-navy">Vue d&apos;ensemble</Link>
        <span>/</span>
        <Link href="/layout-artist/deposits" className="hover:text-navy">Mes Dépôts</Link>
        <span>/</span>
        <span className="text-navy font-semibold">Nouveau Dépôt</span>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/layout-artist/deposits" className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Retour à mes dépôts
          </Link>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Nouveau Dépôt d&apos;Ouvrage
          </h1>
          <p className="text-xs text-foreground-muted mt-1">
            Déposez le livre papier ou numérique, saisissez les métadonnées et profitez des suggestions de l&apos;IA.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={saving}
            className="px-4 py-2.5 rounded-xl border border-border bg-background hover:bg-background-secondary text-navy text-xs font-bold transition-colors flex items-center gap-2 min-h-[44px]"
          >
            <Save className="w-4 h-4 text-gold" />
            Enregistrer brouillon
          </button>
        </div>
      </div>

      {/* Stepper Multi-étapes 21st.dev */}
      <DepositWizardStepper
        currentStep={currentStep}
        onStepClick={(s) => setCurrentStep(s)}
      />

      {/* Contenu Étape 1 : Fichiers */}
      {currentStep === 1 && (
        <div className="p-6 rounded-3xl bg-background-secondary border border-border space-y-6 shadow-xs">
          <h3 className="text-sm font-bold text-navy flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-gold" />
            Étape 1 — Téléversement des Fichiers principaux
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FileDropzone
              label="1. Fichier Livre (PDF ou EPUB) *"
              acceptTypes={[".pdf", ".epub"]}
              maxSizeMB={150}
              onFileSelect={handleBookFileSelect}
              onFileRemove={() => setBookFile(null)}
              selectedFileName={bookFile?.name}
              selectedFileSize={bookFile?.size}
            />

            <FileDropzone
              label="2. Visuel de Couverture (JPG/PNG) *"
              acceptTypes={["image/jpeg", "image/png", "image/webp"]}
              maxSizeMB={20}
              onFileSelect={handleCoverSelect}
              onFileRemove={() => { setCoverFile(null); setCoverPreview(undefined); }}
              selectedFileName={coverFile?.name}
              selectedFileSize={coverFile?.size}
              previewUrl={coverPreview}
            />
          </div>

          <div className="flex justify-end pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              disabled={!bookFile}
              className="px-6 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors disabled:opacity-40 min-h-[44px]"
            >
              Étape suivante : Métadonnées →
            </button>
          </div>
        </div>
      )}

      {/* Contenu Étape 2 : Métadonnées & Langue */}
      {currentStep === 2 && (
        <div className="p-6 rounded-3xl bg-background-secondary border border-border space-y-6 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-navy">
              Étape 2 — Métadonnées de base &amp; Langue de l&apos;ouvrage
            </h3>
            {aiLoading && (
              <span className="text-xs text-gold font-bold flex items-center gap-1.5 animate-pulse">
                <Sparkles className="w-4 h-4" /> Détection IA en cours...
              </span>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="dep-title" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
                Titre de l&apos;ouvrage *
              </label>
              <input
                id="dep-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Droit Constitutionnel Béninois — Tome 1"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-border bg-background focus:outline-none focus:border-gold text-foreground min-h-[44px]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="dep-authors" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
                  Auteur(s) (séparés par une virgule) *
                </label>
                <input
                  id="dep-authors"
                  type="text"
                  value={authorsStr}
                  onChange={(e) => setAuthorsStr(e.target.value)}
                  placeholder="Ex: Prof. Théodore HOLO, Dr. A. SOSSA"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-border bg-background focus:outline-none focus:border-gold text-foreground min-h-[44px]"
                />
              </div>

              <div>
                <label htmlFor="dep-year" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
                  Année de publication *
                </label>
                <input
                  id="dep-year"
                  type="number"
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value) || 2026)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-border bg-background focus:outline-none focus:border-gold text-foreground font-mono min-h-[44px]"
                />
              </div>
            </div>

            {/* Langue obligatoire avec suggestion IA */}
            <div className="p-4 rounded-2xl bg-background border border-border space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="dep-lang" className="block text-xs font-bold text-navy uppercase tracking-wider">
                  Langue de l&apos;ouvrage * (Obligatoire)
                </label>
                <AISuggestionBadge source={languageSource} />
              </div>
              <select
                id="dep-lang"
                value={language}
                onChange={(e) => {
                  setLanguage(e.target.value);
                  setLanguageSource("manual_override");
                }}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-border bg-background-secondary focus:outline-none focus:border-gold text-foreground min-h-[44px]"
              >
                <option value="Français">Français</option>
                <option value="Anglais">Anglais</option>
                <option value="Fon">Fon</option>
                <option value="Yoruba">Yoruba</option>
                <option value="Arabe">Arabe</option>
              </select>
            </div>

            {/* Résumé */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="dep-summary" className="block text-xs font-bold text-navy uppercase tracking-wider">
                  Résumé / Présentation de l&apos;ouvrage
                </label>
                <AISuggestionBadge source={summarySource} />
              </div>
              <textarea
                id="dep-summary"
                value={summary}
                onChange={(e) => {
                  setSummary(e.target.value);
                  setSummarySource("manual_override");
                }}
                rows={4}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-border bg-background focus:outline-none focus:border-gold text-foreground resize-none"
                placeholder="Présentation synthétique de l'ouvrage..."
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="px-4 py-2.5 rounded-xl border border-border text-xs font-semibold text-foreground-muted hover:text-navy min-h-[44px]"
            >
              ← Précédent
            </button>
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              disabled={!title || !authorsStr}
              className="px-6 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors disabled:opacity-40 min-h-[44px]"
            >
              Étape suivante : Classification →
            </button>
          </div>
        </div>
      )}

      {/* Contenu Étape 3 : Classification */}
      {currentStep === 3 && (
        <div className="p-6 rounded-3xl bg-background-secondary border border-border space-y-6 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-navy">
              Étape 3 — Classification &amp; Rattachement Académique
            </h3>
            <AISuggestionBadge source={classificationSource} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
                Pays
              </label>
              <select
                value={country}
                onChange={(e) => { setCountry(e.target.value); setClassificationSource("manual_override"); }}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-border bg-background focus:outline-none focus:border-gold text-foreground min-h-[44px]"
              >
                <option value="BJ">Bénin (BJ)</option>
                <option value="SN">Sénégal (SN)</option>
                <option value="CI">Côte d&apos;Ivoire (CI)</option>
                <option value="TG">Togo (TG)</option>
                <option value="NE">Niger (NE)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
                Discipline *
              </label>
              <select
                value={discipline}
                onChange={(e) => { setDiscipline(e.target.value); setClassificationSource("manual_override"); }}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-border bg-background focus:outline-none focus:border-gold text-foreground min-h-[44px]"
              >
                <option value="Droit & Sciences Politiques">Droit &amp; Sciences Politiques</option>
                <option value="Médecine & Santé">Médecine &amp; Santé</option>
                <option value="Économie & Gestion">Économie &amp; Gestion</option>
                <option value="Sciences Exactes">Sciences Exactes</option>
                <option value="Sciences Humaines">Sciences Humaines</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
                Université &amp; Faculté / Institut
              </label>
              <input
                type="text"
                value={faculty}
                onChange={(e) => { setFaculty(e.target.value); setClassificationSource("manual_override"); }}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-border bg-background focus:outline-none focus:border-gold text-foreground min-h-[44px]"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="px-4 py-2.5 rounded-xl border border-border text-xs font-semibold text-foreground-muted hover:text-navy min-h-[44px]"
            >
              ← Précédent
            </button>
            <button
              type="button"
              onClick={() => setCurrentStep(4)}
              className="px-6 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors min-h-[44px]"
            >
              Étape suivante : Version Audio &amp; Validation →
            </button>
          </div>
        </div>
      )}

      {/* Contenu Étape 4 : Version Audio & Soumission */}
      {currentStep === 4 && (
        <div className="p-6 rounded-3xl bg-background-secondary border border-border space-y-6 shadow-xs">
          <h3 className="text-sm font-bold text-navy">
            Étape 4 — Version Audio (facultative) &amp; DRM Automatique
          </h3>

          <div className="p-4 rounded-2xl bg-gold/5 border border-gold/20 flex items-start gap-3 text-xs">
            <ShieldCheck className="w-5 h-5 text-gold shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-navy">Protection DRM/LCP et Chiffrement Audio Automatique</p>
              <p className="text-foreground-muted text-[11px] mt-0.5">
                Dès le téléversement d&apos;un fichier audio (MP3/M4B), le système applique automatiquement le chiffrement LCP et le filigrane audio invisible. Aucune configuration manuelle n&apos;est requise.
              </p>
            </div>
          </div>

          <FileDropzone
            label="Ajouter un fichier livre audio (Facultatif)"
            acceptTypes={[".mp3", ".m4b", ".wav"]}
            maxSizeMB={300}
            onFileSelect={(f) => setAudioFile(f)}
            onFileRemove={() => setAudioFile(null)}
            selectedFileName={audioFile?.name}
            selectedFileSize={audioFile?.size}
          />

          <div className="flex items-center justify-between pt-6 border-t border-border">
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="px-4 py-2.5 rounded-xl border border-border text-xs font-semibold text-foreground-muted hover:text-navy min-h-[44px]"
            >
              ← Précédent
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={saving}
                className="px-4 py-2.5 rounded-xl border border-border bg-background text-navy text-xs font-bold hover:bg-background-secondary min-h-[44px]"
              >
                Enregistrer brouillon
              </button>
              <button
                type="button"
                onClick={handleSubmitValidation}
                disabled={saving || !title || !authorsStr}
                className="px-6 py-2.5 rounded-xl bg-gold text-navy text-xs font-bold hover:bg-gold-light transition-colors flex items-center gap-2 min-h-[44px] shadow-sm"
              >
                {saving ? (
                  <span className="w-4 h-4 border-2 border-navy/30 border-t-navy rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Soumettre pour Validation
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
