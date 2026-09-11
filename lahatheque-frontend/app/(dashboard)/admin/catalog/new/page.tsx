"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Sparkles,
  Save,
  ShieldCheck,
  BookOpen,
  FileCode,
  Wand2,
  Layers,
  GraduationCap,
  CheckCircle2,
  ShoppingBag,
  Plus,
  Trash2,
  Languages,
  Search,
  FileUp,
  Globe,
} from "lucide-react";
import { uploadFileDirectlyToR2 } from "@/lib/services/storage";
import { updateAdminBook } from "@/lib/services/admin";
import type { AdminCatalogLanguageVersion } from "@/lib/types/admin";
import { FileDropzone } from "@/components/features/layout-artist/file-dropzone";
import { AISuggestionBadge } from "@/components/features/layout-artist/ai-suggestion-badge";
import { DepositWizardStepper } from "@/components/features/layout-artist/deposit-wizard-stepper";
import { AIAnalysisProgressCard } from "@/components/features/layout-artist/ai-analysis-progress-card";
import { BookCover3D } from "@/components/ui/book-cover-3d";
import { createDepositWithFiles } from "@/lib/services/layout-artist";
import { extractBookMetadataWithAi, type AiBookAnalysisResult } from "@/lib/services/ai";
import {
  matchGenreCategory,
  matchLanguage,
  matchCountry,
  getLanguageOptions,
  getCountryOptions,
} from "@/lib/constants/classification";
import { getDisciplines, type DisciplineItem } from "@/lib/services/classification";
import { DisciplineCombobox } from "@/components/features/catalog/discipline-combobox";
import { PublisherCombobox } from "@/components/features/catalog/publisher-combobox";
import { AuthorCombobox } from "@/components/features/catalog/author-combobox";
import { UniversityCombobox } from "@/components/features/catalog/university-combobox";
import { CountryCombobox } from "@/components/features/catalog/country-combobox";
import { toast } from "sonner";

const AVAILABLE_LANGUAGES_LIST = [
  { code: "fr", label: "Français (FR)" },
  { code: "en", label: "Anglais (EN)" },
  { code: "es", label: "Espagnol (ES)" },
  { code: "pt", label: "Portugais (PT)" },
  { code: "de", label: "Allemand (DE)" },
  { code: "ar", label: "Arabe (AR)" },
  { code: "zh", label: "Chinois (ZH)" },
];

const LANG_CODE_TO_LABEL: Record<string, string> = {
  fr: "Français",
  en: "Anglais",
  es: "Espagnol",
  pt: "Portugais",
  de: "Allemand",
  ar: "Arabe",
  zh: "Chinois",
};

const LABEL_TO_LANG_CODE: Record<string, string> = {
  "Français": "fr",
  "Anglais": "en",
  "Espagnol": "es",
  "Portugais": "pt",
  "Allemand": "de",
  "Arabe": "ar",
  "Chinois": "zh",
};

export interface InitialTranslationEntry {
  id: string;
  language: string;
  title: string;
  file: File | null;
  status: "ready" | "in_progress" | "draft";
  is_paper_available: boolean;
  paper_stock: number;
}

export default function AdminNewProductPage() {
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
  const [authors, setAuthors] = useState<string[]>(["Auteur LAHA"]);
  const [newAuthorInput, setNewAuthorInput] = useState("");
  const [publisherName, setPublisherName] = useState("LAHA Éditions");
  const [year, setYear] = useState(2026);
  const [language, setLanguage] = useState("Français");
  const [summary, setSummary] = useState("");
  const [isbn, setIsbn] = useState("");
  const [priceDigital, setPriceDigital] = useState<number | string>(5000);
  const [isPaperAvailable, setIsPaperAvailable] = useState(false);
  const [pricePaper, setPricePaper] = useState<number | string>(7500);

  // Multilingual & Translation Declination
  const [isOriginal, setIsOriginal] = useState(true);
  const [originalLanguage, setOriginalLanguage] = useState("fr");
  const [allEligibleBooks, setAllEligibleBooks] = useState<any[]>([]);
  const [parentBookSearch, setParentBookSearch] = useState("");
  const [isParentBookOpen, setIsParentBookOpen] = useState(false);
  const [selectedParentBook, setSelectedParentBook] = useState<any | null>(null);

  // Translations addition directly during creation
  const [translations, setTranslations] = useState<InitialTranslationEntry[]>([]);
  const [addLangCode, setAddLangCode] = useState("en");
  const [addLangTitle, setAddLangTitle] = useState("");
  const [addLangStatus, setAddLangStatus] = useState<"ready" | "in_progress" | "draft">("ready");
  const [addLangFile, setAddLangFile] = useState<File | null>(null);
  const [addLangPaper, setAddLangPaper] = useState(false);
  const [addLangStock, setAddLangStock] = useState(0);

  const handleAddTranslation = () => {
    if (!addLangCode) return;
    if (translations.some((t) => t.language.toLowerCase() === addLangCode.toLowerCase())) {
      toast.error(`La traduction en ${addLangCode.toUpperCase()} est déjà configurée.`);
      return;
    }
    const item: InitialTranslationEntry = {
      id: Math.random().toString(36).substring(2, 9),
      language: addLangCode,
      title: addLangTitle.trim() || `${title || "Ouvrage"} (${addLangCode.toUpperCase()})`,
      file: addLangFile,
      status: addLangStatus,
      is_paper_available: addLangPaper,
      paper_stock: addLangStock,
    };
    setTranslations([...translations, item]);
    setAddLangTitle("");
    setAddLangFile(null);
    setAddLangPaper(false);
    setAddLangStock(0);
    toast.success(`Déclinaison ${addLangCode.toUpperCase()} ajoutée.`);
  };

  const handleRemoveTranslation = (id: string) => {
    setTranslations(translations.filter((t) => t.id !== id));
  };

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

  // Chargement des disciplines et des livres pour rattachement de traduction
  useEffect(() => {
    async function loadInitialData() {
      try {
        const data = await getDisciplines();
        if (data && data.length > 0) {
          setRealDisciplines(data);
          if (data[0]?.name) {
            setGenreCategory(data[0].name);
            setCategories([data[0].name]);
          }
        }
      } catch (err) {
        console.error("Erreur chargement disciplines", err);
      }

      try {
        const res = await fetch("/api/bff/audio/eligible-books/?limit=all", { credentials: "include" });
        if (res.ok) {
          const json = await res.json();
          setAllEligibleBooks(json.data || json.results || []);
        }
      } catch (err) {
        console.warn("[Admin New Book] Impossible de charger les ouvrages éligibles:", err);
      }
    }
    loadInitialData();
  }, []);

  const handleAddAuthor = () => {
    const trimmed = newAuthorInput.trim();
    if (!trimmed) return;
    if (!authors.includes(trimmed)) {
      setAuthors([...authors, trimmed]);
    }
    setNewAuthorInput("");
  };

  const handleRemoveAuthor = (index: number) => {
    if (authors.length <= 1) {
      toast.error("Un ouvrage doit avoir au minimum un auteur.");
      return;
    }
    setAuthors(authors.filter((_, idx) => idx !== index));
  };

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
        if (result.data.authors && result.data.authors.length > 0) setAuthors(result.data.authors);
        if (result.data.publisher_name) setPublisherName(result.data.publisher_name);
        if (!summary && result.data.summary) setSummary(result.data.summary);
        if (!isbn && result.data.isbn) setIsbn(result.data.isbn);
        setDeweyCode(result.data.dewey_code || matchedGenre.dewey);
        const aiDiscs =
          result.data.disciplines && result.data.disciplines.length > 0
            ? result.data.disciplines
            : [matchedGenre.label];
        setCategories(aiDiscs);
        setGenreCategory(aiDiscs[0] || matchedGenre.label);
        setLanguage(matchedLang);
        const autoCode = LABEL_TO_LANG_CODE[matchedLang] || (result.data.language_code ? result.data.language_code.toLowerCase().slice(0, 2) : "fr");
        setOriginalLanguage(autoCode);
        setAddLangCode(autoCode === "fr" ? "en" : "fr");
        setCountry(matchedCountry);
        if (result.data.institution_suggestion) setUniversity(result.data.institution_suggestion);
        if (result.data.faculty_suggestion || matchedGenre.faculty)
          setFaculty(result.data.faculty_suggestion || matchedGenre.faculty || "");
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
    if (aiResult.authors && aiResult.authors.length > 0) setAuthors(aiResult.authors);
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
    const autoCode = LABEL_TO_LANG_CODE[matchedLang] || (aiResult.language_code ? aiResult.language_code.toLowerCase().slice(0, 2) : "fr");
    setOriginalLanguage(autoCode);
    setAddLangCode(autoCode === "fr" ? "en" : "fr");
    setCountry(matchedCountry);
    if (aiResult.institution_suggestion) setUniversity(aiResult.institution_suggestion);
    if (aiResult.faculty_suggestion || matchedGenre.faculty)
      setFaculty(aiResult.faculty_suggestion || matchedGenre.faculty || "");
    if (aiResult.target_audience) setTargetAudience(aiResult.target_audience);
    if (aiResult.keywords) setKeywords(aiResult.keywords);
    if (aiResult.onix_3_xml) setOnixXml(aiResult.onix_3_xml);
    toast.success("Toutes les suggestions IA ont été appliquées avec succès !");
  };

  const handleCoverSelect = (file: File) => {
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      await createDepositWithFiles(
        {
          metadata: {
            title: title || "Nouveau Livre Admin",
            subtitle,
            authors: authors.length > 0 ? authors : ["Auteur LAHA"],
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
          default_price: Number(priceDigital) >= 0 ? Number(priceDigital) : 0,
          admin_price: isPaperAvailable ? (Number(pricePaper) >= 0 ? Number(pricePaper) : 0) : 0,
          is_paper_available: isPaperAvailable,
        },
        bookFile,
        coverFile,
        {
          is_original: isOriginal,
          original_language: originalLanguage,
          parent_ouvrage_id: !isOriginal && selectedParentBook ? String(selectedParentBook.id) : undefined,
        }
      );
      toast.success("Brouillon sauvegardé avec succès.");
      router.push("/admin/catalog");
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
      const createdDeposit = await createDepositWithFiles(
        {
          metadata: {
            title,
            subtitle,
            authors: authors.length > 0 ? authors : ["Auteur LAHA"],
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
          default_price: Number(priceDigital) >= 0 ? Number(priceDigital) : 0,
          admin_price: isPaperAvailable ? (Number(pricePaper) >= 0 ? Number(pricePaper) : 0) : 0,
          is_paper_available: isPaperAvailable,
        },
        bookFile,
        coverFile,
        {
          is_original: isOriginal,
          original_language: originalLanguage,
          parent_ouvrage_id: !isOriginal && selectedParentBook ? String(selectedParentBook.id) : undefined,
        }
      );

      // Si des versions traduites supplémentaires ont été configurées
      if (createdDeposit?.id && translations.length > 0) {
        toast.info("Téléversement et rattachement des traductions...");
        const langPayload: AdminCatalogLanguageVersion[] = [
          {
            language: originalLanguage || "fr",
            is_original: true,
            title: title,
            summary: summary,
            translation_status: "ready",
            page_count: 0,
            is_paper_available: isPaperAvailable,
            paper_stock: 0,
          },
        ];

        for (const tr of translations) {
          let trKey = "";
          if (tr.file) {
            try {
              const trRes = await uploadFileDirectlyToR2(tr.file, "book");
              if (trRes.fileKey) trKey = trRes.fileKey;
            } catch (trErr) {
              console.warn(`Échec téléversement traduction ${tr.language}:`, trErr);
            }
          }
          langPayload.push({
            language: tr.language,
            is_original: false,
            title: tr.title,
            summary: summary,
            r2_key_pdf: trKey,
            translation_status: tr.status,
            page_count: 0,
            is_paper_available: tr.is_paper_available,
            paper_stock: tr.paper_stock,
          });
        }

        await updateAdminBook(String(createdDeposit.id), {
          languages: langPayload,
          is_original: isOriginal,
          original_language: originalLanguage,
        });
      }

      toast.success(`L'ouvrage « ${title} » a été ajouté et publié immédiatement au catalogue officiel !`);
      router.push("/admin/catalog");
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
        <Link href="/admin/catalog" className="hover:text-navy">
          Gestion du Catalogue
        </Link>
        <span>/</span>
        <span className="text-navy font-semibold">Ajouter un Ouvrage</span>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/admin/catalog"
            className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Retour au catalogue global
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
              Ajouter un Ouvrage
            </h1>
            <span className="px-2.5 py-0.5 rounded-md bg-gold/15 text-gold text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Publication Directe
            </span>
          </div>
          <p className="text-xs text-foreground-muted mt-0.5">
            Dépôt direct assisté par IA, enrichissement documentaire immédiat et mise en ligne sur le catalogue officiel.
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
            {saving ? "Publication en cours..." : "Ajouter & Publier Directement"}
          </button>
        </div>
      </div>

      {/* Stepper Navigation */}
      <DepositWizardStepper currentStep={currentStep} onStepClick={(s) => setCurrentStep(s)} />

      {/* ─── ANIMATION D'ANALYSE IA EN COURS ─────────────────────────────── */}
      {aiLoading && <AIAnalysisProgressCard fileName={bookFile?.name} />}

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

            {/* Déclinaison & Multilinguisme */}
            <div className="p-4 rounded-2xl bg-background-secondary border border-border space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-navy flex items-center gap-1.5">
                    <Languages className="w-4 h-4 text-gold" />
                    Nature de la version déposée
                  </span>
                  <p className="text-[11px] text-foreground-muted">
                    Précisez s&apos;il s&apos;agit d&apos;une œuvre originale ou d&apos;une traduction à rattacher à un ouvrage maître existant.
                  </p>
                </div>
                <div className="inline-flex rounded-xl p-1 bg-background border border-border">
                  <button
                    type="button"
                    onClick={() => setIsOriginal(true)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isOriginal ? "bg-navy text-white shadow-xs" : "text-foreground-muted hover:text-navy"
                    }`}
                  >
                    Œuvre Originale
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsOriginal(false)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      !isOriginal ? "bg-gold text-navy shadow-xs" : "text-foreground-muted hover:text-navy"
                    }`}
                  >
                    Version Traduite
                  </button>
                </div>
              </div>

              {isOriginal && (
                <div className="pt-3 border-t border-border grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                  <div className="sm:col-span-6 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase tracking-wider text-navy flex items-center gap-1.5">
                        <Languages className="w-3.5 h-3.5 text-gold" />
                        Langue originale de l&apos;ouvrage *
                      </label>
                      {aiResult?.language && (
                        <button
                          type="button"
                          onClick={() => {
                            const matchedLang = matchLanguage(aiResult.language);
                            const code = LABEL_TO_LANG_CODE[matchedLang] || "fr";
                            setOriginalLanguage(code);
                            setLanguage(matchedLang);
                            if (code !== "fr") {
                              setAddLangCode("fr");
                            } else {
                              setAddLangCode("en");
                            }
                          }}
                          className="text-[10px] font-bold text-gold hover:underline inline-flex items-center gap-1 cursor-pointer"
                          title={`Corriger avec la suggestion IA : ${matchLanguage(aiResult.language)}`}
                        >
                          <Wand2 className="w-2.5 h-2.5" />
                          IA : {matchLanguage(aiResult.language)}
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-foreground-muted">
                      Définissez manuellement la langue réelle de l&apos;ouvrage ou corrigez celle détectée par l&apos;IA.
                    </p>
                  </div>
                  <div className="sm:col-span-6">
                    <select
                      value={originalLanguage}
                      onChange={(e) => {
                        const newCode = e.target.value;
                        setOriginalLanguage(newCode);
                        setLanguage(LANG_CODE_TO_LABEL[newCode] || "Français");
                        if (newCode !== "fr") {
                          setAddLangCode("fr");
                        } else {
                          setAddLangCode("en");
                        }
                      }}
                      className="w-full bg-background border border-border rounded-xl p-2.5 text-xs sm:text-sm text-foreground font-semibold focus:ring-2 focus:ring-navy min-h-[40px]"
                    >
                      {AVAILABLE_LANGUAGES_LIST.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {!isOriginal && (
                <div className="pt-3 border-t border-border space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                    <div className="sm:col-span-6 space-y-0.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-navy flex items-center gap-1.5">
                        <Languages className="w-3.5 h-3.5 text-gold" />
                        Langue de cette version traduite *
                      </label>
                      <p className="text-[11px] text-foreground-muted">
                        Précisez la langue du document traduit que vous déposez.
                      </p>
                    </div>
                    <div className="sm:col-span-6">
                      <select
                        value={LABEL_TO_LANG_CODE[language] || "fr"}
                        onChange={(e) => {
                          const newCode = e.target.value;
                          setLanguage(LANG_CODE_TO_LABEL[newCode] || "Français");
                        }}
                        className="w-full bg-background border border-border rounded-xl p-2.5 text-xs sm:text-sm text-foreground font-semibold focus:ring-2 focus:ring-navy min-h-[40px]"
                      >
                        {AVAILABLE_LANGUAGES_LIST.map((lang) => (
                          <option key={lang.code} value={lang.code}>
                            {lang.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <label className="text-xs font-bold uppercase tracking-wider text-navy block">
                    Sélectionner l&apos;ouvrage original de référence *
                  </label>
                  {selectedParentBook ? (
                    <div className="p-3 bg-gold/10 border border-gold/40 rounded-xl flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-12 rounded bg-background border border-border overflow-hidden shrink-0 flex items-center justify-center">
                          {selectedParentBook.cover_url ? (
                            <img src={selectedParentBook.cover_url} alt={selectedParentBook.title} className="w-full h-full object-cover" />
                          ) : (
                            <BookOpen className="w-4 h-4 text-gold" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-navy truncate">{selectedParentBook.title}</p>
                          <p className="text-[11px] text-foreground-muted truncate">
                            Par {selectedParentBook.author || selectedParentBook.authors_display} • {selectedParentBook.category}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedParentBook(null)}
                        className="text-xs text-foreground-muted hover:text-red-500 font-bold px-2 py-1 transition-colors cursor-pointer"
                      >
                        Changer
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-foreground-muted absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Rechercher l'ouvrage original par titre ou auteur..."
                        value={parentBookSearch}
                        onChange={(e) => {
                          setParentBookSearch(e.target.value);
                          setIsParentBookOpen(true);
                        }}
                        onFocus={() => setIsParentBookOpen(true)}
                        className="w-full bg-background border border-border rounded-xl pl-9 pr-4 py-2 text-xs text-foreground focus:ring-2 focus:ring-navy min-h-[40px]"
                      />
                      {isParentBookOpen && (
                        <div className="absolute z-30 top-full mt-1 left-0 right-0 bg-background border border-border rounded-2xl shadow-xl max-h-48 overflow-y-auto divide-y divide-border">
                          {allEligibleBooks
                            .filter((b) =>
                              !parentBookSearch.trim() ||
                              b.title.toLowerCase().includes(parentBookSearch.toLowerCase()) ||
                              (b.author && b.author.toLowerCase().includes(parentBookSearch.toLowerCase()))
                            )
                            .slice(0, 10)
                            .map((b) => (
                              <button
                                key={b.id}
                                type="button"
                                onClick={() => {
                                  setSelectedParentBook(b);
                                  setIsParentBookOpen(false);
                                  if (!title) setTitle(`${b.title} (Traduction)`);
                                  if (b.author || b.authors_display) {
                                    const aName = b.author || b.authors_display;
                                    setAuthors([aName]);
                                  }
                                  if (b.category) {
                                    setCategories([b.category]);
                                    setGenreCategory(b.category);
                                  }
                                }}
                                className="w-full p-2.5 text-left hover:bg-navy/5 flex items-center justify-between gap-2 text-xs cursor-pointer"
                              >
                                <div className="truncate">
                                  <span className="font-bold text-navy block truncate">{b.title}</span>
                                  <span className="text-[11px] text-foreground-muted block truncate">{b.author || b.authors_display}</span>
                                </div>
                                <span className="text-[10px] font-bold text-gold bg-gold/10 px-2 py-0.5 rounded shrink-0">
                                  Lier
                                </span>
                              </button>
                            ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Déclinaisons Linguistiques & Traductions Additionnelles (Multi-upload dès la création) */}
            {isOriginal && (
              <div className="p-4 sm:p-5 rounded-2xl bg-background-secondary border border-border space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-2.5">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-navy flex items-center gap-1.5">
                      <Globe className="w-4 h-4 text-gold" />
                      Traductions &amp; Déclinaisons Linguistiques (Optionnel dès l&apos;ajout)
                    </span>
                    <p className="text-[11px] text-foreground-muted">
                      Ajoutez et téléversez directement les fichiers traduits (PDF / EPUB) dès cette étape.
                    </p>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-gold/15 text-navy border border-gold/30 shrink-0">
                    {translations.length} traduction(s) configurée(s)
                  </span>
                </div>

                {/* Formulaire d'ajout d'une version traduite */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-3 bg-background border border-border rounded-xl items-end">
                  <div className="sm:col-span-3 space-y-1">
                    <label className="text-[10px] font-bold text-navy uppercase">Langue Cible</label>
                    <select
                      value={addLangCode}
                      onChange={(e) => setAddLangCode(e.target.value)}
                      className="w-full bg-background-secondary border border-border rounded-lg p-2 text-xs text-foreground min-h-[36px]"
                    >
                      {AVAILABLE_LANGUAGES_LIST.filter(
                        (l) => !translations.some((t) => t.language.toLowerCase() === l.code.toLowerCase())
                      ).map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-4 space-y-1">
                    <label className="text-[10px] font-bold text-navy uppercase">Titre Traduit</label>
                    <input
                      type="text"
                      value={addLangTitle}
                      onChange={(e) => setAddLangTitle(e.target.value)}
                      placeholder="Titre dans cette langue..."
                      className="w-full bg-background-secondary border border-border rounded-lg p-2 text-xs text-foreground min-h-[36px]"
                    />
                  </div>

                  <div className="sm:col-span-3 space-y-1">
                    <label className="text-[10px] font-bold text-navy uppercase">Fichier Traduit (PDF/EPUB)</label>
                    <input
                      type="file"
                      accept=".pdf,.epub"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setAddLangFile(e.target.files[0]);
                        }
                      }}
                      className="w-full text-xs text-foreground file:mr-2 file:py-1 file:px-2 file:rounded-md file:border file:border-border file:text-[11px] file:bg-navy/10 file:text-navy cursor-pointer"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <button
                      type="button"
                      onClick={handleAddTranslation}
                      className="w-full py-2 px-3 rounded-lg bg-navy hover:bg-navy-hover text-white text-xs font-bold transition-colors flex items-center justify-center gap-1 min-h-[36px] cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Ajouter
                    </button>
                  </div>
                </div>

                {/* Liste des traductions configurées */}
                {translations.length > 0 && (
                  <div className="space-y-2 pt-1">
                    {translations.map((tr) => (
                      <div
                        key={tr.id}
                        className="p-2.5 rounded-xl bg-background border border-border flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono font-bold text-[10px] px-2 py-0.5 rounded bg-gold/15 text-navy border border-gold/30">
                            {tr.language.toUpperCase()}
                          </span>
                          <span className="font-bold text-navy truncate">{tr.title}</span>
                          {tr.file && (
                            <span className="text-[11px] text-foreground-muted truncate font-mono">
                              ({tr.file.name})
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveTranslation(tr.id)}
                          className="p-1 rounded-lg hover:bg-error/10 text-foreground-muted hover:text-error transition-colors cursor-pointer"
                          title="Retirer cette traduction"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Auteurs multiples avec AuthorCombobox */}
            <div className="space-y-3 pt-1">
              <label className="text-xs font-bold uppercase tracking-wider text-navy flex items-center justify-between">
                <span>Auteur(s) &amp; Contributeurs *</span>
                <span className="text-[11px] font-normal text-foreground-muted">{authors.length} auteur(s)</span>
              </label>

              <div className="flex flex-wrap gap-2">
                {authors.map((author, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 bg-navy/5 border border-navy/20 rounded-xl px-3 py-1.5 text-xs text-navy font-medium"
                  >
                    <span>{author}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAuthor(idx)}
                      className="text-foreground-muted hover:text-red-500 transition-colors cursor-pointer"
                      title="Retirer cet auteur"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 max-w-lg items-center">
                <div className="flex-1">
                  <AuthorCombobox
                    value={newAuthorInput}
                    onChange={(name) => setNewAuthorInput(name)}
                    placeholder="Rechercher en base ou saisir un auteur..."
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddAuthor}
                  className="px-4 py-2.5 rounded-xl bg-navy text-gold text-xs font-bold hover:bg-navy-hover transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 min-h-[44px]"
                >
                  <Plus className="w-4 h-4" />
                  <span>Ajouter</span>
                </button>
              </div>
            </div>

            {/* Éditeur, ISBN, Année */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                    min={0}
                    step="any"
                    value={priceDigital}
                    onChange={(e) => setPriceDigital(e.target.value === "" ? "" : Number(e.target.value))}
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
                    min={0}
                    step="any"
                    disabled={!isPaperAvailable}
                    value={pricePaper}
                    onChange={(e) => setPricePaper(e.target.value === "" ? "" : Number(e.target.value))}
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
                        const newDiscs =
                          aiResult.disciplines && aiResult.disciplines.length > 0
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
                <UniversityCombobox
                  value={university}
                  onChange={(val) => setUniversity(val)}
                  aiSuggestion={aiResult?.institution_suggestion}
                />
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

            {/* Pays d'Ancrage */}
            <div className="space-y-1.5 max-w-md">
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
              <CountryCombobox
                value={country}
                onChange={(name, code) => setCountry(code || name)}
                placeholder="Sélectionner le pays..."
              />
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
                authors={authors.length > 0 ? authors.join(", ") : "Auteur LAHA"}
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
                <p className="text-foreground font-semibold">
                  Auteur(s) : {authors.length > 0 ? authors.join(", ") : "Auteur LAHA"}
                </p>
                <p className="text-foreground font-semibold">
                  Maison d&apos;Édition : <span className="text-gold">{publisherName || "Non spécifiée"}</span>
                </p>
                <p className="text-foreground-muted">Genre : {genreCategory}</p>
                {!isOriginal && (
                  <p className="text-xs font-bold text-gold">
                    Version Traduite rattachée à : {selectedParentBook?.title || "Ouvrage maître"}
                  </p>
                )}

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
              {saving ? "Publication en cours..." : "Ajouter & Publier Immédiatement au Catalogue"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
