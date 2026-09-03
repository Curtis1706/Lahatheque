"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Sparkles, 
  Save, 
  Send, 
  ShieldCheck,
  BookOpen,
  FileCode,
  AlertCircle,
  Wand2,
  Layers,
  GraduationCap,
  CheckCircle2,
  ShoppingBag
} from "lucide-react";
import { FileDropzone } from "@/components/features/layout-artist/file-dropzone";
import { AISuggestionBadge } from "@/components/features/layout-artist/ai-suggestion-badge";
import { DepositWizardStepper } from "@/components/features/layout-artist/deposit-wizard-stepper";
import { AIAnalysisProgressCard } from "@/components/features/layout-artist/ai-analysis-progress-card";
import { BookCover3D } from "@/components/ui/book-cover-3d";
import { createDepositWithFiles } from "@/lib/services/layout-artist";
import { extractBookMetadataWithAi, type AiBookAnalysisResult } from "@/lib/services/ai";
import { 
  GENRE_CATEGORIES, 
  matchGenreCategory, 
  matchLanguage, 
  matchCountry, 
  getUniversityOptions, 
  getLanguageOptions, 
  getCountryOptions, 
  getGenreOptions 
} from "@/lib/constants/classification";
import { getDisciplines, type DisciplineItem } from "@/lib/services/classification";
import { DisciplineCombobox } from "@/components/features/catalog/discipline-combobox";
import { PublisherCombobox } from "@/components/features/catalog/publisher-combobox";
import { toast } from "sonner";

export default function ChiefLayoutDepositPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Form State
  const [bookFile, setBookFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | undefined>(undefined);

  // Metadata State
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [authorsStr, setAuthorsStr] = useState("");
  const [publisherName, setPublisherName] = useState("LAHA Éditions");
  const [year, setYear] = useState(2026);
  const [language, setLanguage] = useState("Français");
  const [summary, setSummary] = useState("");
  const [isbn, setIsbn] = useState("");
  const [priceDigital, setPriceDigital] = useState(5000);
  const [isPaperAvailable, setIsPaperAvailable] = useState(false);
  const [pricePaper, setPricePaper] = useState(7500);

  // Classification State
  const [realDisciplines, setRealDisciplines] = useState<DisciplineItem[]>([]);
  const [categories, setCategories] = useState<string[]>(["Littérature Africaine & Conte"]);
  const [genreCategory, setGenreCategory] = useState("Littérature Africaine & Conte");
  const [deweyCode, setDeweyCode] = useState("800");
  const [country, setCountry] = useState("BJ");
  const [university, setUniversity] = useState("Université d'Abomey-Calavi (UAC - Bénin)");
  const [faculty, setFaculty] = useState("Faculté des Lettres, Langues, Arts et Communication (FLLAC)");
  const [targetAudience, setTargetAudience] = useState("Grand Public & Universitaire");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [onixXml, setOnixXml] = useState<string>("");

  // IA State
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AiBookAnalysisResult | null>(null);



  const handleBookFileSelect = async (file: File) => {
    setBookFile(file);
    if (!title) {
      const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
      setTitle(cleanName);
    }

    // Auto-détection IA des métadonnées
    setAiLoading(true);
    try {
      toast.info("Analyse documentaire du manuscrit en cours...");
      const result = await extractBookMetadataWithAi(file);
      if (result.success && result.data) {
        setAiResult(result.data);
        
        const matchedGenre = matchGenreCategory(result.data.genre_category, result.data.dewey_code);
        const matchedLang = matchLanguage(result.data.language || result.data.language_code);
        const matchedCountry = matchCountry(result.data.country);

        // Auto-application initiale
        if (!title || title === file.name.replace(/\.[^/.]+$/, "")) setTitle(result.data.title);
        if (!subtitle && result.data.subtitle) setSubtitle(result.data.subtitle);
        if (!authorsStr && result.data.authors?.length) setAuthorsStr(result.data.authors.join(", "));
        if (result.data.publisher_name) setPublisherName(result.data.publisher_name);
        if (!summary && result.data.summary) setSummary(result.data.summary);
        if (!isbn && result.data.isbn) setIsbn(result.data.isbn);
        setDeweyCode(result.data.dewey_code || matchedGenre.dewey);
        const aiDiscs = result.data.disciplines && result.data.disciplines.length > 0 
          ? result.data.disciplines 
          : [matchedGenre.label];
        setCategories(aiDiscs);
        setGenreCategory(aiDiscs[0] || matchedGenre.label);
        setLanguage(matchedLang);
        setCountry(matchedCountry);
        if (result.data.institution_suggestion) setUniversity(result.data.institution_suggestion);
        if (result.data.faculty_suggestion || matchedGenre.faculty) setFaculty(result.data.faculty_suggestion || matchedGenre.faculty || "");
        if (result.data.target_audience) setTargetAudience(result.data.target_audience);
        if (result.data.keywords) setKeywords(result.data.keywords);
        if (result.data.onix_3_xml) setOnixXml(result.data.onix_3_xml);

        toast.success("Analyse IA terminée avec succès !");
      }
    } catch {
      // Échec silencieux
    } finally {
      setAiLoading(false);
    }
  };

  const handleApplyAllAiData = () => {
    if (!aiResult) return;
    if (aiResult.title) setTitle(aiResult.title);
    if (aiResult.subtitle) setSubtitle(aiResult.subtitle);
    if (aiResult.authors && aiResult.authors.length > 0) setAuthorsStr(aiResult.authors.join(", "));
    if (aiResult.publisher_name) setPublisherName(aiResult.publisher_name);
    if (aiResult.isbn) setIsbn(aiResult.isbn);
    if (aiResult.summary) setSummary(aiResult.summary);
    if (aiResult.publication_year) setYear(aiResult.publication_year);

    const matchedGenre = matchGenreCategory(aiResult.genre_category, aiResult.dewey_code);
    const matchedLang = matchLanguage(aiResult.language || aiResult.language_code);
    const matchedCountry = matchCountry(aiResult.country);

    setDeweyCode(aiResult.dewey_code || matchedGenre.dewey);
    setGenreCategory(matchedGenre.label);
    setLanguage(matchedLang);
    setCountry(matchedCountry);
    if (aiResult.institution_suggestion) setUniversity(aiResult.institution_suggestion);
    if (aiResult.faculty_suggestion || matchedGenre.faculty) setFaculty(aiResult.faculty_suggestion || matchedGenre.faculty || "");
    if (aiResult.target_audience) setTargetAudience(aiResult.target_audience);
    if (aiResult.keywords) setKeywords(aiResult.keywords);
    if (aiResult.onix_3_xml) setOnixXml(aiResult.onix_3_xml);
    toast.success("Toutes les suggestions IA ont été appliquées avec succès !");
  };

  const handleCoverSelect = (file: File) => {
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleGenreChange = (newGenre: string) => {
    setGenreCategory(newGenre);
    const realFound = realDisciplines.find((d) => d.name === newGenre);
    if (realFound && realFound.code_dewey) {
      setDeweyCode(realFound.code_dewey);
    }
    const found = matchGenreCategory(newGenre);
    if (found) {
      if (!realFound?.code_dewey) {
        setDeweyCode(found.dewey);
      }
      if (found.faculty) {
        setFaculty(found.faculty);
      }
    }
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      await createDepositWithFiles(
        {
          metadata: {
            title: title || "Nouveau Dépôt Chef",
            subtitle,
            authors: authorsStr ? authorsStr.split(",").map((a) => a.trim()) : ["Auteur LAHA"],
            publisher_name: publisherName,
            publication_year: year,
            language,
            language_source: aiResult ? "ai_suggested" : "manual",
            summary,
            summary_source: aiResult ? "ai_suggested" : "manual",
            isbn,
          },
          classification: {
            country,
            university,
            faculty,
            discipline: categories[0] || genreCategory,
            disciplines: categories,
            source: aiResult ? "ai_suggested" : "manual",
          },
          files: {
            format: bookFile?.name.endsWith(".epub") ? "EPUB" : "PDF",
            book_file_name: bookFile?.name,
            cover_url: coverPreview,
          },
          status: "draft",
          default_price: priceDigital,
          admin_price: isPaperAvailable ? pricePaper : 0,
          is_paper_available: isPaperAvailable,
        },
        bookFile,
        coverFile
      );
      toast.success("Brouillon sauvegardé avec succès.");
      router.push("/chief-layout");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur lors de la sauvegarde du brouillon.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDirectPublish = async () => {
    if (!title || !bookFile) {
      toast.error("Veuillez sélectionner le fichier de l'ouvrage et renseigner au minimum le titre.");
      return;
    }

    setSaving(true);
    try {
      await createDepositWithFiles(
        {
          metadata: {
            title,
            subtitle,
            authors: authorsStr ? authorsStr.split(",").map((a) => a.trim()) : ["Auteur LAHA"],
            publisher_name: publisherName,
            publication_year: year,
            language,
            language_source: aiResult ? "ai_suggested" : "manual",
            summary,
            summary_source: aiResult ? "ai_suggested" : "manual",
            isbn,
          },
          classification: {
            country,
            university,
            faculty,
            discipline: categories[0] || genreCategory,
            disciplines: categories,
            source: aiResult ? "ai_suggested" : "manual",
          },
          files: {
            format: bookFile.name.endsWith(".epub") ? "EPUB" : "PDF",
            book_file_name: bookFile.name,
            cover_url: coverPreview,
          },
          status: "published",
          default_price: priceDigital,
          admin_price: isPaperAvailable ? pricePaper : 0,
          is_paper_available: isPaperAvailable,
        },
        bookFile,
        coverFile
      );
      toast.success(`L'ouvrage « ${title} » a été déposé, validé et publié immédiatement sur le catalogue officiel !`);
      router.push("/chief-layout/history");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur lors de la publication directe.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/chief-layout" className="hover:text-navy">Espace Chef Maquettiste</Link>
        <span>/</span>
        <span className="text-navy font-semibold">Déposer &amp; Publier un Ouvrage</span>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/chief-layout" className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Retour à la vue d&apos;ensemble
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
              Déposer un Ouvrage
            </h1>
            <span className="px-2.5 py-0.5 rounded-md bg-gold/15 text-gold text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Validation Directe
            </span>
          </div>
          <p className="text-xs text-foreground-muted mt-0.5">
            En tant que Chef Maquettiste, votre dépôt est certifié et publié directement sur le catalogue officiel et dans la liseuse protégée DRM.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleSaveDraft}
            disabled={saving || !bookFile}
            className="px-4 py-2.5 rounded-xl border border-border bg-background hover:bg-background-secondary text-xs font-bold text-navy flex items-center gap-1.5 shadow-xs transition-colors min-h-[44px] cursor-pointer"
          >
            <Save className="w-4 h-4 text-foreground-muted" />
            Brouillon
          </button>

          <button
            onClick={handleDirectPublish}
            disabled={saving || !bookFile}
            className="px-5 py-2.5 rounded-xl bg-gold hover:bg-gold-light text-navy text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all min-h-[44px] cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-navy" />
            {saving ? "Publication en cours..." : "Déposer & Publier Directement"}
          </button>
        </div>
      </div>

      {/* Stepper Navigation */}
      <DepositWizardStepper currentStep={currentStep} onStepClick={(s) => setCurrentStep(s)} />

      {/* ─── ANIMATION D'ANALYSE IA EN COURS ─────────────────────────────── */}
      {aiLoading && (
        <AIAnalysisProgressCard fileName={bookFile?.name} />
      )}

      {/* ─── BANDEAU ASSISTANT IA ────────────────────────────────────────────── */}
      {aiResult && !aiLoading && (
        <div className="p-5 rounded-3xl bg-navy text-white border border-navy-hover space-y-3 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-gold/20 text-gold shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-sm text-gold">
                  Assistant IA • Notice ONIX 3.0 &amp; Classification Disponibles
                </h3>
                <p className="text-[11px] text-white/80">
                  Document analysé : « {aiResult.title} » ({aiResult.genre_category} • Dewey {aiResult.dewey_code})
                </p>
              </div>
            </div>

            <button
              onClick={handleApplyAllAiData}
              className="px-4 py-2 rounded-xl bg-gold hover:bg-gold-light text-navy text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 shrink-0 min-h-[40px] cursor-pointer"
            >
              <Wand2 className="w-3.5 h-3.5" />
              Tout Appliquer en 1 Clic
            </button>
          </div>

          {aiResult.keywords && aiResult.keywords.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] uppercase font-bold text-gold">Mots-clés :</span>
              {aiResult.keywords.map((tag, i) => (
                <span key={i} className="px-2 py-0.5 rounded-md bg-white/10 text-white text-[10px]">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── ÉTAPE 1 : FICHIERS SOURCES ──────────────────────────────────────── */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <FileDropzone
                label="1. Fichier de l'Ouvrage (PDF uniquement) *"
                acceptTypes={[".pdf"]}
                maxSizeMB={800}
                onFileSelect={handleBookFileSelect}
                selectedFileName={bookFile?.name}
                selectedFileSize={bookFile?.size}
                isLoading={aiLoading}
                loadingLabel="Analyse IA en cours (OpenAI & PyMuPDF)..."
                onFileRemove={() => {
                  setBookFile(null);
                  setAiResult(null);
                }}
              />
              <p className="text-[11px] text-foreground-muted">
                La liseuse supporte nativement le format PDF sécurisé avec filigrane dynamique et synthèse vocale TTS intégrée.
              </p>
            </div>

            <div className="space-y-2">
              <FileDropzone
                label="2. Image de Couverture (Haute Résolution) *"
                acceptTypes={["image/jpeg", "image/png", "image/webp"]}
                maxSizeMB={15}
                onFileSelect={handleCoverSelect}
                selectedFileName={coverFile?.name}
                selectedFileSize={coverFile?.size}
                previewUrl={coverPreview}
                onFileRemove={() => {
                  setCoverFile(null);
                  setCoverPreview(undefined);
                }}
              />
              <p className="text-[11px] text-foreground-muted">
                Format portrait recommandé (rapport 1:1.5 ou 1:1.6, min. 1200x1800 px).
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={() => setCurrentStep(2)}
              disabled={!bookFile}
              className="px-6 py-3 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors shadow-xs flex items-center gap-2 disabled:opacity-50 min-h-[44px] cursor-pointer"
            >
              Étape suivante : Métadonnées &amp; Tarification →
            </button>
          </div>
        </div>
      )}

      {/* ─── ÉTAPE 2 : MÉTADONNÉES & TARIFICATION ────────────────────────────── */}
      {currentStep === 2 && (
        <div className="bg-background border border-border rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
            <h3 className="font-serif font-bold text-navy text-base flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-gold" />
              Notice Éditoriale &amp; Tarification
            </h3>
            <div className="flex items-center gap-2">
              <AISuggestionBadge source={aiResult ? "ai_suggested" : "manual"} />
            </div>
          </div>

          <div className="space-y-4">
            {/* Titre */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-navy">Titre de l&apos;Ouvrage *</label>
                {aiResult?.title && aiResult.title !== title && (
                  <button
                    type="button"
                    onClick={() => setTitle(aiResult.title)}
                    className="text-[11px] font-bold text-gold hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Wand2 className="w-3 h-3" />
                    Insérer suggestion IA : « {aiResult.title.slice(0, 30)}... »
                  </button>
                )}
              </div>
              <input
                type="text"
                required
                placeholder="Ex: Les Fondements du Droit Commercial Africain"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-background border border-border rounded-xl p-3 text-xs sm:text-sm text-foreground focus:ring-2 focus:ring-navy min-h-[44px]"
              />
            </div>

            {/* Sous-titre */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-navy">Sous-titre (Optionnel)</label>
              <input
                type="text"
                placeholder="Ex: Traité théorique et pratique à l'usage des universités"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="w-full bg-background border border-border rounded-xl p-3 text-xs sm:text-sm text-foreground focus:ring-2 focus:ring-navy min-h-[44px]"
              />
            </div>

            {/* Auteurs, Éditeur, ISBN, Année */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-navy">Auteur(s) *</label>
                <input
                  type="text"
                  required
                  placeholder="Pr. Jean KOUADIO, Dr. Aminata SOW"
                  value={authorsStr}
                  onChange={(e) => setAuthorsStr(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl p-3 text-xs sm:text-sm text-foreground focus:ring-2 focus:ring-navy min-h-[44px]"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-navy">Maison d&apos;Édition *</label>
                  {aiResult?.publisher_name && (
                    <button
                      type="button"
                      onClick={() => setPublisherName(aiResult.publisher_name!)}
                      className="text-[10px] font-bold text-gold hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                      title="Appliquer l'éditeur détecté par l'IA"
                    >
                      <Wand2 className="w-2.5 h-2.5" />
                      IA : {aiResult.publisher_name}
                    </button>
                  )}
                </div>
                <PublisherCombobox
                  value={publisherName}
                  onChange={(val) => setPublisherName(val)}
                  placeholder="Sélectionner ou saisir l'éditeur..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-navy">ISBN-13</label>
                <input
                  type="text"
                  placeholder="978-99919-X-XXX-X"
                  value={isbn}
                  onChange={(e) => setIsbn(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl p-3 text-xs sm:text-sm text-foreground focus:ring-2 focus:ring-navy min-h-[44px]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-navy">Année de Publication</label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value) || 2026)}
                  className="w-full bg-background border border-border rounded-xl p-3 text-xs sm:text-sm text-foreground focus:ring-2 focus:ring-navy min-h-[44px]"
                />
              </div>
            </div>

            {/* Tarification & Disponibilité Papier */}
            <div className="p-4 rounded-2xl bg-background-secondary border border-border space-y-4">
              <h4 className="text-xs font-bold text-navy uppercase tracking-wider flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-gold" />
                Options de Vente &amp; Disponibilité des Formats
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Prix Numérique */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-navy flex items-center justify-between">
                    <span>Prix Numérique (FCFA) *</span>
                    <span className="text-[10px] text-gold font-semibold">Accès Liseuse Immédiat</span>
                  </label>
                  <input
                    type="number"
                    step="500"
                    value={priceDigital}
                    onChange={(e) => setPriceDigital(parseFloat(e.target.value) || 0)}
                    className="w-full bg-background border border-border rounded-xl p-3 text-xs sm:text-sm text-foreground focus:ring-2 focus:ring-navy min-h-[44px]"
                  />
                </div>

                {/* Prix Papier */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-navy flex items-center justify-between">
                    <span className={!isPaperAvailable ? "text-foreground-muted" : ""}>Prix Version Papier (FCFA)</span>
                    <span className="text-[10px] text-foreground-muted font-normal">
                      {isPaperAvailable ? "Vente physique activée" : "Non disponible"}
                    </span>
                  </label>
                  <input
                    type="number"
                    step="500"
                    disabled={!isPaperAvailable}
                    value={pricePaper}
                    onChange={(e) => setPricePaper(parseFloat(e.target.value) || 0)}
                    className={`w-full bg-background border border-border rounded-xl p-3 text-xs sm:text-sm text-foreground focus:ring-2 focus:ring-navy min-h-[44px] ${
                      !isPaperAvailable ? "opacity-40 cursor-not-allowed bg-background-secondary" : ""
                    }`}
                  />
                </div>
              </div>

              {/* Toggle interactif Disponibilité Papier */}
              <div className="pt-2 border-t border-border flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-navy">Disponible en version papier physique</span>
                  <p className="text-[11px] text-foreground-muted">
                    {isPaperAvailable
                      ? "Les clients pourront commander des exemplaires physiques imprimés depuis le catalogue."
                      : "Seule la version numérique sera proposée aux lecteurs sur la plateforme."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsPaperAvailable((v) => !v)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    isPaperAvailable ? "bg-gold" : "bg-border"
                  }`}
                  role="switch"
                  aria-checked={isPaperAvailable}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      isPaperAvailable ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Résumé */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-navy">
                  Présentation de l&apos;Ouvrage / Résumé *
                </label>
                {aiResult?.summary && (
                  <button
                    type="button"
                    onClick={() => setSummary(aiResult.summary)}
                    className="text-[11px] font-bold text-gold hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Wand2 className="w-3 h-3" />
                    Remplacer par le résumé IA
                  </button>
                )}
              </div>
              <textarea
                rows={4}
                required
                placeholder="Rédigez la présentation de l'ouvrage qui apparaîtra sur le catalogue et dans la liseuse..."
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="w-full bg-background border border-border rounded-xl p-3 text-xs sm:text-sm text-foreground focus:ring-2 focus:ring-navy"
              />
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-border">
            <button
              onClick={() => setCurrentStep(1)}
              className="px-5 py-2.5 rounded-xl border border-border text-xs font-bold text-navy hover:bg-background-secondary min-h-[44px] cursor-pointer"
            >
              ← Retour aux Fichiers
            </button>
            <button
              onClick={() => setCurrentStep(3)}
              className="px-6 py-3 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors shadow-xs min-h-[44px] cursor-pointer"
            >
              Étape suivante : Classification &amp; Dewey →
            </button>
          </div>
        </div>
      )}

      {/* ─── ÉTAPE 3 : CLASSIFICATION & DEWEY ─────────────────────────────────── */}
      {currentStep === 3 && (
        <div className="bg-background border border-border rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
            <h3 className="font-serif font-bold text-navy text-base flex items-center gap-2">
              <Layers className="w-5 h-5 text-gold" />
              Classification Universelle &amp; Rattachement Institutionnel
            </h3>
            <div className="flex items-center gap-2">
              <AISuggestionBadge source={aiResult ? "ai_suggested" : "manual"} />
            </div>
          </div>

          <div className="space-y-4">
            {/* Genre & Dewey */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-navy">
                    Catégories / Disciplines * <span className="text-[10px] font-normal text-foreground-muted">(Plusieurs choix possibles)</span>
                  </label>
                  {aiResult && (aiResult.disciplines?.length || aiResult.genre_category) && (
                    <button
                      type="button"
                      onClick={() => {
                        const newDiscs = aiResult.disciplines && aiResult.disciplines.length > 0 
                          ? aiResult.disciplines 
                          : [aiResult.genre_category];
                        setCategories(newDiscs);
                        setGenreCategory(newDiscs[0] || aiResult.genre_category);
                      }}
                      className="text-[10px] font-bold text-gold hover:underline inline-flex items-center gap-1 cursor-pointer"
                      title="Appliquer les catégories suggérées par l'IA"
                    >
                      <Wand2 className="w-2.5 h-2.5" />
                      IA : {aiResult.disciplines && aiResult.disciplines.length > 0 ? aiResult.disciplines.join(", ") : aiResult.genre_category}
                    </button>
                  )}
                </div>
                <DisciplineCombobox
                  multiple={true}
                  values={categories}
                  onValuesChange={(newVals) => {
                    setCategories(newVals);
                    if (newVals.length > 0) setGenreCategory(newVals[0]);
                  }}
                  disciplines={realDisciplines}
                  placeholder="Sélectionner ou rechercher une discipline..."
                  searchPlaceholder="Rechercher parmi les disciplines..."
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-navy">Code Dewey *</label>
                  {aiResult?.dewey_code && (
                    <button
                      type="button"
                      onClick={() => setDeweyCode(aiResult.dewey_code)}
                      className="text-[10px] font-bold text-gold hover:underline inline-flex items-center gap-1 cursor-pointer"
                      title={`Appliquer le code Dewey IA : ${aiResult.dewey_code}`}
                    >
                      <Wand2 className="w-2.5 h-2.5" />
                      IA : {aiResult.dewey_code}
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={deweyCode}
                  onChange={(e) => setDeweyCode(e.target.value)}
                  placeholder="Ex: 340, 840, 741.5"
                  className="w-full bg-background border border-border rounded-xl p-3 text-xs sm:text-sm text-foreground focus:ring-2 focus:ring-navy min-h-[44px]"
                />
              </div>
            </div>

            {/* Université & Faculté */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-navy">Établissement (Si académique)</label>
                  {aiResult?.institution_suggestion && (
                    <button
                      type="button"
                      onClick={() => setUniversity(aiResult.institution_suggestion || "")}
                      className="text-[10px] font-bold text-gold hover:underline inline-flex items-center gap-1 cursor-pointer"
                      title={`Appliquer l'université suggérée : ${aiResult.institution_suggestion}`}
                    >
                      <Wand2 className="w-2.5 h-2.5" />
                      IA : {aiResult.institution_suggestion.length > 25 ? `${aiResult.institution_suggestion.slice(0, 25)}...` : aiResult.institution_suggestion}
                    </button>
                  )}
                </div>
                <select
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl p-3 text-xs sm:text-sm text-foreground focus:ring-2 focus:ring-navy min-h-[44px]"
                >
                  {getUniversityOptions(aiResult?.institution_suggestion, university).map((u, i) => (
                    <option key={i} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-navy">Faculté de Rattachement</label>
                  {aiResult?.faculty_suggestion && (
                    <button
                      type="button"
                      onClick={() => setFaculty(aiResult.faculty_suggestion || "")}
                      className="text-[10px] font-bold text-gold hover:underline inline-flex items-center gap-1 cursor-pointer"
                      title={`Appliquer la faculté suggérée : ${aiResult.faculty_suggestion}`}
                    >
                      <Wand2 className="w-2.5 h-2.5" />
                      IA : {aiResult.faculty_suggestion.length > 25 ? `${aiResult.faculty_suggestion.slice(0, 25)}...` : aiResult.faculty_suggestion}
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={faculty}
                  onChange={(e) => setFaculty(e.target.value)}
                  placeholder="Ex: Faculté de Droit (FADESP) ou vide si roman/manga"
                  className="w-full bg-background border border-border rounded-xl p-3 text-xs sm:text-sm text-foreground focus:ring-2 focus:ring-navy min-h-[44px]"
                />
              </div>
            </div>

            {/* Langue, Pays, Public Cible */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-navy">Langue</label>
                  {aiResult?.language && (
                    <button
                      type="button"
                      onClick={() => setLanguage(matchLanguage(aiResult.language))}
                      className="text-[10px] font-bold text-gold hover:underline inline-flex items-center gap-1 cursor-pointer"
                      title={`Appliquer la langue IA : ${matchLanguage(aiResult.language)}`}
                    >
                      <Wand2 className="w-2.5 h-2.5" />
                      IA : {matchLanguage(aiResult.language)}
                    </button>
                  )}
                </div>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl p-3 text-xs sm:text-sm text-foreground focus:ring-2 focus:ring-navy min-h-[44px]"
                >
                  {getLanguageOptions(aiResult?.language ? matchLanguage(aiResult.language) : null, language).map((lang, i) => (
                    <option key={i} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-navy">Pays d&apos;Ancrage</label>
                  {aiResult?.country && (
                    <button
                      type="button"
                      onClick={() => setCountry(matchCountry(aiResult.country))}
                      className="text-[10px] font-bold text-gold hover:underline inline-flex items-center gap-1 cursor-pointer"
                      title={`Appliquer le pays IA : ${matchCountry(aiResult.country)}`}
                    >
                      <Wand2 className="w-2.5 h-2.5" />
                      IA : {matchCountry(aiResult.country)}
                    </button>
                  )}
                </div>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl p-3 text-xs sm:text-sm text-foreground focus:ring-2 focus:ring-navy min-h-[44px]"
                >
                  {getCountryOptions(aiResult?.country ? matchCountry(aiResult.country) : null, country).map((c, i) => (
                    <option key={i} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-navy">Public Cible</label>
                  {aiResult?.target_audience && (
                    <button
                      type="button"
                      onClick={() => setTargetAudience(aiResult.target_audience)}
                      className="text-[10px] font-bold text-gold hover:underline inline-flex items-center gap-1 cursor-pointer"
                      title={`Appliquer le public cible IA : ${aiResult.target_audience}`}
                    >
                      <Wand2 className="w-2.5 h-2.5" />
                      IA : {aiResult.target_audience.length > 18 ? `${aiResult.target_audience.slice(0, 18)}...` : aiResult.target_audience}
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="Grand Public, Étudiants, etc."
                  className="w-full bg-background border border-border rounded-xl p-3 text-xs sm:text-sm text-foreground focus:ring-2 focus:ring-navy min-h-[44px]"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-border">
            <button
              onClick={() => setCurrentStep(2)}
              className="px-5 py-2.5 rounded-xl border border-border text-xs font-bold text-navy hover:bg-background-secondary min-h-[44px] cursor-pointer"
            >
              ← Retour aux Métadonnées
            </button>
            <button
              onClick={() => setCurrentStep(4)}
              className="px-6 py-3 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors shadow-xs min-h-[44px] cursor-pointer"
            >
              Étape suivante : Récapitulatif &amp; Publication →
            </button>
          </div>
        </div>
      )}

      {/* ─── ÉTAPE 4 : RÉCAPITULATIF & PUBLICATION DIRECTE ────────────────────── */}
      {currentStep === 4 && (
        <div className="bg-background border border-border rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="font-serif font-bold text-navy text-base flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-gold" />
              Récapitulatif &amp; Publication Directe
            </h3>
            <div className="flex items-center gap-2">
              <AISuggestionBadge source={aiResult ? "ai_suggested" : "manual"} />
              <span className="px-3 py-1 rounded-full bg-gold/15 text-navy text-xs font-bold uppercase tracking-wider border border-gold/30 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-gold" />
                Publication Immédiate
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-start">
            {/* Aperçu Couverture 3D */}
            <div className="w-full flex flex-col items-center justify-center p-4 rounded-2xl bg-navy/5 border border-border shadow-xs">
              <BookCover3D
                title={title || "Titre de l'ouvrage"}
                authors={authorsStr || "Auteur LAHA"}
                discipline={faculty || genreCategory}
                coverUrl={coverPreview}
                size="md"
              />
              <span className="text-[10px] text-navy font-bold uppercase tracking-wider mt-2 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-gold" />
                Rendu Vitrine 3D
              </span>
            </div>

            {/* Fiche Technique */}
            <div className="sm:col-span-2 space-y-3 text-xs">
              <div className="p-4 rounded-2xl bg-background-secondary border border-border space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-serif font-bold text-navy text-base">{title}</h4>
                    {subtitle && <p className="text-foreground-muted">{subtitle}</p>}
                  </div>
                  <span className="text-[10px] font-bold text-gold uppercase px-2 py-0.5 rounded bg-gold/10">
                    Dewey {deweyCode}
                  </span>
                </div>
                <p className="text-foreground font-semibold">Auteur(s) : {authorsStr || "Auteur LAHA"}</p>
                <p className="text-foreground-muted">Genre : {genreCategory}</p>
                
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border">
                  <div>
                    <span className="text-[10px] text-foreground-muted uppercase font-bold">Prix Numérique</span>
                    <p className="text-xs font-bold text-navy font-mono">{priceDigital.toLocaleString("fr-FR")} XOF</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-foreground-muted uppercase font-bold">Version Papier</span>
                    <p className="text-xs font-bold text-navy font-mono">
                      {isPaperAvailable ? `${pricePaper.toLocaleString("fr-FR")} XOF (Disponible)` : "Non disponible"}
                    </p>
                  </div>
                </div>

                {university && university !== "Non affilié (Grand Public / Fiction / Scolaire)" && (
                  <p className="text-navy font-bold flex items-center gap-1 pt-1 border-t border-border">
                    <GraduationCap className="w-3.5 h-3.5 text-gold" />
                    {university} {faculty ? `• ${faculty}` : ""}
                  </p>
                )}
                <p className="text-foreground-muted leading-relaxed line-clamp-3 pt-1 border-t border-border">
                  {summary || "Aucun résumé fourni."}
                </p>
              </div>

              {/* Notice ONIX XML */}
              {onixXml && (
                <div className="p-3 rounded-xl bg-navy/5 border border-border space-y-1">
                  <div className="flex items-center gap-1.5 text-navy font-bold text-[11px]">
                    <FileCode className="w-3.5 h-3.5 text-gold" />
                    Notice XML ONIX 3.0 prête pour l&apos;export
                  </div>
                  <pre className="text-[10px] text-foreground-muted max-h-24 overflow-y-auto font-mono bg-background p-2 rounded border border-border">
                    {onixXml}
                  </pre>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-border">
            <button
              onClick={() => setCurrentStep(3)}
              className="px-5 py-2.5 rounded-xl border border-border text-xs font-bold text-navy hover:bg-background-secondary min-h-[44px] cursor-pointer"
            >
              ← Modifier la Classification
            </button>

            <button
              onClick={handleDirectPublish}
              disabled={saving}
              className="px-6 py-3 rounded-xl bg-gold hover:bg-gold-light text-navy text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md transition-all min-h-[44px] cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-navy" />
              {saving ? "Publication en cours..." : "Déposer & Publier Immédiatement sur le Catalogue"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
