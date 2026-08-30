"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Sparkles, 
  Save, 
  Send, 
  Plus, 
  CheckCircle2, 
  ShieldCheck,
  BookOpen,
  FileCode,
  AlertCircle,
  Wand2,
  Layers,
  GraduationCap,
  Tag,
  Check,
  Search,
  FileText,
  X,
  ChevronDown,
  RotateCcw,
  UserCheck,
  Users,
  Loader2,
} from "lucide-react";
import { FileDropzone } from "@/components/features/layout-artist/file-dropzone";
import { AISuggestionBadge } from "@/components/features/layout-artist/ai-suggestion-badge";
import { DepositWizardStepper, DEPOSIT_STEPS } from "@/components/features/layout-artist/deposit-wizard-stepper";
import { AIAnalysisProgressCard } from "@/components/features/layout-artist/ai-analysis-progress-card";
import { DepositSubmissionModal } from "@/components/features/layout-artist/deposit-submission-modal";
import { BookCover3D } from "@/components/ui/book-cover-3d";
import { SearchableSelect, type SearchableOption } from "@/components/ui/searchable-select";
import { createDeposit, createDepositWithFiles, searchPreEditions, searchAuthors, type PreEditionSearchResult, type AuthorSearchResult } from "@/lib/services/layout-artist";
import { extractBookMetadataWithAi, AiBookAnalysisResult } from "@/lib/services/ai";
import type { ClassificationSource } from "@/lib/types/layout-artist";
import { toast } from "sonner";
import { InlineLoader } from "@/components/ui/page-loader";
import { cn } from "@/lib/utils";

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

export default function NewDepositPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Transmission Modal State
  const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<"idle" | "uploading" | "processing" | "registering" | "success" | "error">("idle");
  const [submissionError, setSubmissionError] = useState<string | undefined>(undefined);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  // Pre-Edition State (Select Combobox)
  const [preEditionSearch, setPreEditionSearch] = useState("");
  const [allPreEditions, setAllPreEditions] = useState<PreEditionSearchResult[]>([]);
  const [isPreEditionOpen, setIsPreEditionOpen] = useState(false);
  const [selectedPreEdition, setSelectedPreEdition] = useState<PreEditionSearchResult | null>(null);
  const [loadingPreEditions, setLoadingPreEditions] = useState(false);
  const [authorsList, setAuthorsList] = useState<AuthorSearchResult[]>([]);

  // Authors State (Searchable Combobox & Tags)
  const [authorSearch, setAuthorSearch] = useState("");
  const [allAuthors, setAllAuthors] = useState<AuthorSearchResult[]>([]);
  const [selectedAuthors, setSelectedAuthors] = useState<string[]>([]);
  const [isAuthorOpen, setIsAuthorOpen] = useState(false);
  const [loadingAuthors, setLoadingAuthors] = useState(false);

  // Form State
  const [bookFile, setBookFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | undefined>(undefined);

  // Metadata State
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [authorsStr, setAuthorsStr] = useState("");
  const [authorsEmailsStr, setAuthorsEmailsStr] = useState("");
  const [year, setYear] = useState(2026);
  const [language, setLanguage] = useState("Français");
  const [summary, setSummary] = useState("");
  const [isbn, setIsbn] = useState("");
  const [priceDigital, setPriceDigital] = useState(5000);
  const [pricePaper, setPricePaper] = useState(7500);

  // Classification State
  const [realDisciplines, setRealDisciplines] = useState<DisciplineItem[]>([]);
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
  const [hasAppliedAi, setHasAppliedAi] = useState(false);

  React.useEffect(() => {
    getDisciplines().then((res) => {
      if (res && res.length > 0) {
        setRealDisciplines(res);
      }
    });

    // Préchargement automatique des dossiers de pré-édition et auteurs
    setLoadingPreEditions(true);
    Promise.all([
      searchPreEditions("").catch(() => []),
      searchAuthors("").catch(() => [])
    ]).then(([preEditions, authors]) => {
      setAllPreEditions(preEditions || []);
      setAuthorsList(authors || []);
      setLoadingPreEditions(false);
    }).catch(() => {
      setLoadingPreEditions(false);
    });

    // Préchargement automatique de la liste des auteurs certifiés
    setLoadingAuthors(true);
    searchAuthors("").then((res) => {
      setAllAuthors(res || []);
      setLoadingAuthors(false);
    }).catch(() => {
      setLoadingAuthors(false);
    });
  }, []);

  const handleAddAuthor = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (!selectedAuthors.includes(trimmed)) {
      const updated = [...selectedAuthors, trimmed];
      setSelectedAuthors(updated);
      setAuthorsStr(updated.join(", "));
    }
    setAuthorSearch("");
  };

  const handleRemoveAuthor = (nameToRemove: string) => {
    const updated = selectedAuthors.filter((a) => a !== nameToRemove);
    setSelectedAuthors(updated);
    setAuthorsStr(updated.join(", "));
  };

  const handleAuthorsStrChange = (val: string) => {
    setAuthorsStr(val);
    const parsed = val.split(",").map((s) => s.trim()).filter(Boolean);
    setSelectedAuthors(parsed);
  };

  const handleBookFileSelect = async (file: File) => {
    setBookFile(file);
    if (!title) {
      const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/_/g, " ").replace(/-/g, " ");
      setTitle(cleanName);
    }

    // Déclencher l'analyse IA automatique
    setAiLoading(true);
    toast.info("Analyse documentaire du manuscrit en cours...");
    
    try {
      const res = await extractBookMetadataWithAi(file, file.name);

      if (res.success && res.data) {
        setAiResult(res.data);
        toast.success("Suggestions documentaires générées avec succès.");
        
        const matchedGenre = matchGenreCategory(res.data.genre_category, res.data.dewey_code);
        const matchedLang = matchLanguage(res.data.language || res.data.language_code);
        const matchedCountry = matchCountry(res.data.country);

        // Auto-application initiale intelligente
        if (!title || title === file.name.replace(/\.[^/.]+$/, "")) setTitle(res.data.title);
        if (!subtitle && res.data.subtitle) setSubtitle(res.data.subtitle);
        if (res.data.authors && res.data.authors.length > 0) {
          setSelectedAuthors(res.data.authors);
          setAuthorsStr(res.data.authors.join(", "));
        }
        if (!summary) setSummary(res.data.summary);
        if (res.data.isbn) setIsbn(res.data.isbn);
        setDeweyCode(res.data.dewey_code || matchedGenre.dewey);
        setGenreCategory(matchedGenre.label);
        setLanguage(matchedLang);
        setCountry(matchedCountry);
        if (res.data.institution_suggestion) setUniversity(res.data.institution_suggestion);
        if (res.data.faculty_suggestion || matchedGenre.faculty) setFaculty(res.data.faculty_suggestion || matchedGenre.faculty || "");
        if (res.data.target_audience) setTargetAudience(res.data.target_audience);
        if (res.data.keywords) setKeywords(res.data.keywords);
        if (res.data.onix_3_xml) setOnixXml(res.data.onix_3_xml);
        setHasAppliedAi(true);
      }
    } catch (e) {
      console.error("[Deposit AI Error]", e);
      toast.error("Erreur lors de l'analyse IA, basculement en mode manuel.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleApplyAllAiData = () => {
    if (!aiResult) return;
    setTitle(aiResult.title);
    if (aiResult.subtitle) setSubtitle(aiResult.subtitle);
    if (aiResult.authors && aiResult.authors.length > 0) {
      setSelectedAuthors(aiResult.authors);
      setAuthorsStr(aiResult.authors.join(", "));
    }
    setSummary(aiResult.summary);
    setIsbn(aiResult.isbn);

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
    setHasAppliedAi(true);
    toast.success("Suggestions IA réappliquées avec succès sur l'ensemble des champs !");
  };

  const handleCoverSelect = (file: File) => {
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleSelectPreEdition = (dossier: PreEditionSearchResult | null) => {
    setSelectedPreEdition(dossier);
    setIsPreEditionOpen(false);
    setPreEditionSearch("");
    if (dossier) {
      if (dossier.titre_previsionnel) setTitle(dossier.titre_previsionnel);
      if (dossier.auteur_nom) {
        setSelectedAuthors([dossier.auteur_nom]);
        setAuthorsStr(dossier.auteur_nom);
      }
      if (dossier.auteur_email) setAuthorsEmailsStr(dossier.auteur_email);
      if (dossier.universite_nom) setUniversity(dossier.universite_nom);
      if (dossier.faculte_nom) setFaculty(dossier.faculte_nom);
      toast.success(`Dossier ${dossier.code_dossier} rattaché ! Métadonnées pré-remplies.`);
    } else {
      toast.info("Rattachement retiré. Saisie libre activée.");
    }
  };

  const filteredPreEditions = allPreEditions.filter((d) => {
    if (!preEditionSearch.trim()) return true;
    const q = preEditionSearch.toLowerCase();
    return (
      d.code_dossier.toLowerCase().includes(q) ||
      d.titre_previsionnel.toLowerCase().includes(q) ||
      d.auteur_nom.toLowerCase().includes(q) ||
      (d.universite_nom && d.universite_nom.toLowerCase().includes(q))
    );
  });

  const filteredAuthors = allAuthors.filter((a) => {
    if (selectedAuthors.includes(a.name)) return false;
    if (!authorSearch.trim()) return true;
    const q = authorSearch.toLowerCase();
    return (
      a.name.toLowerCase().includes(q) ||
      (a.institution && a.institution.toLowerCase().includes(q)) ||
      (a.email && a.email.toLowerCase().includes(q))
    );
  });

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
    console.log(`[Deposit Page] Enregistrement d'un brouillon pour « ${title || "Nouveau Dépôt"} »...`);
    try {
      const dep = await createDepositWithFiles(
        {
          metadata: {
            title: title || "Nouveau Dépôt",
            authors: authorsStr ? authorsStr.split(",").map((a) => a.trim()) : ["Auteur"],
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
            discipline: genreCategory,
            source: aiResult ? "ai_suggested" : "manual",
          },
          files: {
            format: bookFile?.name.endsWith(".epub") ? "EPUB" : "PDF",
            book_file_name: bookFile?.name,
            cover_url: coverPreview,
          },
          status: "draft",
          default_price: 5000,
        },
        bookFile,
        coverFile,
        {
          pre_edition_dossier_id: selectedPreEdition?.id,
          authors_emails: authorsEmailsStr,
        }
      );
      console.log(`[Deposit Page] Brouillon enregistré avec succès. ID: ${dep.id}`);
      toast.success("Brouillon sauvegardé avec succès.");
      router.push(`/layout-artist/deposits/${dep.id}`);
    } catch (err: any) {
      console.error(`[Deposit Page ERROR] Échec de la sauvegarde du brouillon :`, err);
      toast.error(err.message || "Erreur lors de la sauvegarde du brouillon.");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitValidation = async () => {
    if (!title || !bookFile) {
      toast.error("Veuillez sélectionner le fichier du livre et renseigner au minimum le titre.");
      return;
    }

    console.log(`[Deposit Page] Lancement de la transmission au Chef Maquettiste...`, {
      titre: title,
      auteurs: authorsStr,
      isbn: isbn,
      discipline: genreCategory,
      fichier: bookFile.name,
      tailleMo: (bookFile.size / (1024 * 1024)).toFixed(2),
    });

    setSaving(true);
    setSubmissionError(undefined);
    setIsSubmissionModalOpen(true);
    setSubmissionStatus("uploading");

    try {
      // 1. Envoi et téléversement du fichier
      const depPromise = createDepositWithFiles(
        {
          metadata: {
            title,
            authors: authorsStr ? authorsStr.split(",").map((a) => a.trim()) : ["Auteur"],
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
            discipline: genreCategory,
            source: aiResult ? "ai_suggested" : "manual",
          },
          files: {
            format: bookFile.name.endsWith(".epub") ? "EPUB" : "PDF",
            book_file_name: bookFile.name,
            cover_url: coverPreview,
          },
          status: "pending_validation",
          default_price: 5000,
        },
        bookFile,
        coverFile,
        {
          pre_edition_dossier_id: selectedPreEdition?.id,
          authors_emails: authorsEmailsStr,
          onUploadProgress: (percent) => {
            setUploadProgress(percent);
            // Dès que l'upload R2 est terminé, on passe visuellement à l'étape ONIX
            // sans attendre la réponse du POST Django (qui peut prendre du temps en prod)
            if (percent >= 100) {
              setSubmissionStatus("processing");
            }
          },
        }
      );

      const dep = await depPromise;
      console.log(`[Deposit Page] Réponse backend reçue pour le dépôt #${dep.id}.`);

      // 2. Enregistrement (l'étape ONIX est déjà affichée via onUploadProgress si R2 a réussi,
      // sinon on la force ici pour le chemin sans R2)
      setSubmissionStatus("processing");
      console.log(`[Deposit Page] Structuration de la notice ONIX 3.0 et classification Dewey...`);
      await new Promise((resolve) => setTimeout(resolve, 800));

      setSubmissionStatus("registering");
      console.log(`[Deposit Page] Inscription au registre de validation du Chef Maquettiste...`);
      await new Promise((resolve) => setTimeout(resolve, 600));

      // 3. Confirmation de succès
      setSubmissionStatus("success");
      console.log(`[Deposit Page SUCCESS] Transmission terminée avec succès ! Redirection vers la liste...`);
      toast.success("Maquette transmise avec succès au Chef Maquettiste !");

      setTimeout(() => {
        window.location.href = "/layout-artist/deposits";
      }, 1000);
    } catch (err: any) {
      console.error(`[Deposit Page ERROR] Échec lors de la transmission :`, err);

      // Cas particulier : 502 Bad Gateway en prod = timeout BFF/Gunicorn
      // Le dépôt a probablement été créé côté Django mais la réponse n'est pas revenue à temps.
      // On redirige vers la liste plutôt que de bloquer sur erreur.
      const is502 = err.message?.includes('502') || err.message?.includes('Impossible de contacter');
      if (is502) {
        console.warn(`[Deposit Page] 502 détecté — le dépôt a probablement été créé. Redirection vers la liste...`);
        toast.info("Transmission envoyée. Si votre dépôt n'apparaît pas, patientez quelques secondes et actualisez.");
        setTimeout(() => {
          window.location.href = "/layout-artist/deposits";
        }, 2500);
        return;
      }

      setSubmissionStatus("error");
      setSubmissionError(err.message || "Erreur lors de la transmission de la maquette.");
      toast.error(err.message || "Erreur lors de la transmission de la maquette.");
      setSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/layout-artist" className="hover:text-navy">Espace Maquettiste</Link>
        <span>/</span>
        <Link href="/layout-artist/deposits" className="hover:text-navy">Dépôts</Link>
        <span>/</span>
        <span className="text-navy font-semibold">Nouveau Dépôt</span>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/layout-artist/deposits" className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Retour à la liste des dépôts
          </Link>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Déposer une Nouvelle Maquette
          </h1>
          <p className="text-xs text-foreground-muted mt-0.5">
            Téléversez votre épreuve PDF ou EPUB et personnalisez les suggestions extraites par l&apos;IA.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveDraft}
            disabled={saving || !bookFile}
            className="px-4 py-2.5 rounded-xl border border-border bg-background hover:bg-background-secondary text-xs font-bold text-navy flex items-center gap-1.5 shadow-xs transition-colors min-h-[44px] cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin text-foreground-muted" />
            ) : (
              <Save className="w-4 h-4 text-foreground-muted" />
            )}
            <span className="hidden sm:inline">Sauvegarder Brouillon</span>
            <span className="sm:hidden">Brouillon</span>
          </button>

          <button
            onClick={handleSubmitValidation}
            disabled={saving || !bookFile}
            className="px-5 py-2.5 rounded-xl bg-navy hover:bg-navy-hover text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors min-h-[44px] cursor-pointer disabled:opacity-50 shrink-0"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 text-gold animate-spin" />
                <span>Transmission...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4 text-gold" />
                <span>Soumettre</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stepper Navigation */}
      <DepositWizardStepper currentStep={currentStep} onStepClick={(s) => setCurrentStep(s)} />

      {/* ─── ANIMATION D'ANALYSE IA EN COURS ─────────────────────────────── */}
      {aiLoading && (
        <AIAnalysisProgressCard fileName={bookFile?.name} />
      )}

      {/* ─── BANDEAU ASSISTANT IA SI ANALYSE DISPONIBLE ──────────────────────── */}
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

            {hasAppliedAi ? (
              <button
                onClick={handleApplyAllAiData}
                className="px-4 py-2 rounded-xl bg-gold/20 text-gold hover:bg-gold hover:text-navy border border-gold/40 text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 shrink-0 min-h-[40px] cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Réappliquer les suggestions IA
              </button>
            ) : (
              <button
                onClick={handleApplyAllAiData}
                className="px-4 py-2 rounded-xl bg-gold hover:bg-gold-light text-navy text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 shrink-0 min-h-[40px] cursor-pointer"
              >
                <Wand2 className="w-3.5 h-3.5" />
                Tout Appliquer en 1 Clic
              </button>
            )}
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

      {/* ─── ÉTAPE 1 : FICHIERS SOURCES (PDF/EPUB & COUVERTURE) ──────────────── */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Dropzone Fichier Livre */}
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
                La liseuse supporte nativement le format PDF sécurisé avec synthèse vocale TTS intégrée.
              </p>
            </div>

            {/* Dropzone Couverture */}
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
              Étape suivante : Métadonnées Éditoriales →
            </button>
          </div>
        </div>
      )}

      {/* ─── ÉTAPE 2 : MÉTADONNÉES & RÉSUMÉ ───────────────────────────────────── */}
      {currentStep === 2 && (
        <div className="bg-background border border-border rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
            <h3 className="font-serif font-bold text-navy text-base flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-gold" />
              Métadonnées de la Notice Éditoriale
            </h3>
            <div className="flex items-center gap-2">
              <AISuggestionBadge source={aiResult ? "ai_suggested" : "manual"} />
            </div>
          </div>

          <div className="space-y-4">
            {/* Rattachement Pré-édition */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-1.5 mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-navy flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-gold" />
                  Dossier de pré-édition Juriste (Facultatif)
                </label>
                {allPreEditions.length > 0 && (
                  <span className="text-[11px] font-semibold text-gold">
                    {allPreEditions.length} dossier{allPreEditions.length > 1 ? "s" : ""} disponible{allPreEditions.length > 1 ? "s" : ""}
                  </span>
                )}
              </div>

              {selectedPreEdition ? (
                <div className="p-3.5 bg-navy/5 border border-gold/30 rounded-2xl flex items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gold/10 text-gold flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono font-bold text-gold uppercase px-1.5 py-0.5 bg-gold/10 rounded">
                          {selectedPreEdition.code_dossier}
                        </span>
                        <span className="text-xs font-bold text-navy">{selectedPreEdition.titre_previsionnel}</span>
                      </div>
                      <p className="text-[11px] text-foreground-muted">
                        Auteur : <strong className="text-foreground">{selectedPreEdition.auteur_nom}</strong>
                        {selectedPreEdition.auteur_email ? ` (${selectedPreEdition.auteur_email})` : ""} · {selectedPreEdition.universite_nom}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsPreEditionOpen(true)}
                      className="px-2.5 py-1.5 text-[11px] font-bold text-gold bg-gold/10 hover:bg-gold/20 rounded-xl transition-colors cursor-pointer"
                    >
                      Changer
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectPreEdition(null)}
                      className="p-1.5 text-foreground-muted hover:text-red-500 rounded-lg hover:bg-background transition-colors cursor-pointer"
                      title="Détacher le dossier"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  {/* Select Trigger Button */}
                  <button
                    type="button"
                    onClick={() => setIsPreEditionOpen(!isPreEditionOpen)}
                    className="w-full bg-background-secondary border border-border rounded-xl px-3.5 py-2.5 text-xs text-left flex items-center justify-between gap-2 hover:border-navy focus:ring-2 focus:ring-navy min-h-[44px] transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2 text-foreground-muted truncate">
                      <Search className="w-4 h-4 text-foreground-muted shrink-0" />
                      {loadingPreEditions ? "Chargement des dossiers pré-enregistrés..." : "Sélectionner ou rechercher un dossier de pré-édition..."}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0 text-foreground-muted">
                      {loadingPreEditions && <InlineLoader size={12} />}
                      <ChevronDown className={cn("w-4 h-4 transition-transform", isPreEditionOpen && "rotate-180")} />
                    </div>
                  </button>

                  {/* Dropdown with Search Input & List */}
                  {isPreEditionOpen && (
                    <div className="absolute z-30 top-full mt-1.5 left-0 right-0 bg-background border border-border rounded-2xl shadow-xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
                      {/* Search Bar inside dropdown */}
                      <div className="p-2.5 border-b border-border bg-background-secondary">
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-foreground-muted absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            placeholder="Filtrer par titre, nom d'auteur ou code dossier..."
                            value={preEditionSearch}
                            onChange={(e) => setPreEditionSearch(e.target.value)}
                            autoFocus
                            className="w-full bg-background border border-border rounded-xl pl-8 pr-3 py-1.5 text-xs text-foreground focus:ring-2 focus:ring-navy min-h-[36px]"
                          />
                        </div>
                      </div>

                      {/* List */}
                      <div className="max-h-60 overflow-y-auto divide-y divide-border">
                        <button
                          type="button"
                          onClick={() => handleSelectPreEdition(null)}
                          className="w-full text-left p-3 hover:bg-navy/5 transition-colors flex items-center justify-between text-xs text-foreground-muted italic cursor-pointer"
                        >
                          <span>Aucun dossier (Saisie manuelle libre)</span>
                        </button>

                        {filteredPreEditions.length > 0 ? (
                          filteredPreEditions.map((dossier) => (
                            <button
                              key={dossier.id}
                              type="button"
                              onClick={() => handleSelectPreEdition(dossier)}
                              className="w-full text-left p-3 hover:bg-navy/5 transition-colors flex items-center justify-between gap-3 text-xs cursor-pointer"
                            >
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-[10px] font-bold text-gold px-1.5 py-0.5 bg-gold/10 rounded">
                                    {dossier.code_dossier}
                                  </span>
                                  <span className="font-semibold text-navy">{dossier.titre_previsionnel}</span>
                                </div>
                                <p className="text-[11px] text-foreground-muted mt-0.5">
                                  Auteur : <strong className="text-foreground">{dossier.auteur_nom}</strong>
                                  {dossier.universite_nom ? ` · ${dossier.universite_nom}` : ""}
                                </p>
                              </div>
                              <span className="text-[11px] font-bold text-gold shrink-0 bg-gold/10 hover:bg-gold hover:text-navy px-2.5 py-1 rounded-lg transition-colors">
                                Rattacher →
                              </span>
                            </button>
                          ))
                        ) : (
                          <div className="p-4 text-center text-xs text-foreground-muted">
                            Aucun dossier trouvé pour &quot;{preEditionSearch}&quot;.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

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
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-navy">Sous-titre (Optionnel)</label>
                {aiResult?.subtitle && aiResult.subtitle !== subtitle && (
                  <button
                    type="button"
                    onClick={() => setSubtitle(aiResult.subtitle || "")}
                    className="text-[11px] font-bold text-gold hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Wand2 className="w-3 h-3" />
                    Insérer sous-titre IA
                  </button>
                )}
              </div>
              <input
                type="text"
                placeholder="Ex: Traité théorique et pratique à l'usage des universités"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="w-full bg-background border border-border rounded-xl p-3 text-xs sm:text-sm text-foreground focus:ring-2 focus:ring-navy min-h-[44px]"
              />
            </div>

            {/* Auteurs, ISBN, Année */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Auteur(s) Combobox avec recherche et tags */}
                <div className="space-y-1.5 sm:col-span-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-navy flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-gold" />
                      Auteur(s) *
                    </label>
                    {aiResult?.authors && aiResult.authors.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAuthors(aiResult.authors);
                          setAuthorsStr(aiResult.authors.join(", "));
                        }}
                        className="text-[10px] font-bold text-gold hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                      >
                        <Wand2 className="w-2.5 h-2.5" />
                        IA ({aiResult.authors.length})
                      </button>
                    )}
                  </div>
                  {/* Badges d'auteurs sélectionnés */}
                  {selectedAuthors.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pb-1">
                      {selectedAuthors.map((authorName) => (
                        <span
                          key={authorName}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-navy/10 text-navy font-semibold text-xs rounded-xl border border-navy/20"
                        >
                          <span className="truncate max-w-[150px]">{authorName}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveAuthor(authorName)}
                            className="text-foreground-muted hover:text-red-500 transition-colors cursor-pointer"
                            title="Retirer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Champ Combobox de recherche et ajout */}
                  <div className="relative">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-foreground-muted absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Rechercher ou saisir un auteur..."
                        value={authorSearch}
                        onChange={(e) => {
                          setAuthorSearch(e.target.value);
                          setIsAuthorOpen(true);
                        }}
                        onFocus={() => setIsAuthorOpen(true)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && authorSearch.trim()) {
                            e.preventDefault();
                            handleAddAuthor(authorSearch);
                          }
                        }}
                        className="w-full bg-background border border-border rounded-xl pl-8 pr-8 py-2.5 text-xs text-foreground focus:ring-2 focus:ring-navy min-h-[44px]"
                      />
                      <button
                        type="button"
                        onClick={() => setIsAuthorOpen(!isAuthorOpen)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-foreground-muted p-1 hover:text-navy cursor-pointer"
                      >
                        <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", isAuthorOpen && "rotate-180")} />
                      </button>
                    </div>

                    {/* Input caché requis pour la validation HTML du formulaire */}
                    <input
                      type="text"
                      required
                      value={authorsStr}
                      onChange={(e) => handleAuthorsStrChange(e.target.value)}
                      className="sr-only"
                      tabIndex={-1}
                    />

                    {/* Liste déroulante des auteurs trouvés */}
                    {isAuthorOpen && (
                      <div className="absolute z-30 top-full mt-1.5 left-0 right-0 bg-background border border-border rounded-2xl shadow-xl overflow-hidden max-h-56 overflow-y-auto divide-y divide-border animate-in fade-in-0 zoom-in-95 duration-150">
                        {authorSearch.trim() && !allAuthors.some((a) => a.name.toLowerCase() === authorSearch.toLowerCase().trim()) && (
                          <button
                            type="button"
                            onClick={() => {
                              handleAddAuthor(authorSearch);
                              setIsAuthorOpen(false);
                            }}
                            className="w-full text-left p-3 hover:bg-gold/10 transition-colors flex items-center justify-between text-xs text-gold font-bold cursor-pointer"
                          >
                            <span>+ Ajouter « {authorSearch.trim()} »</span>
                            <span className="text-[10px] bg-gold/20 px-2 py-0.5 rounded">Entrée ↵</span>
                          </button>
                        )}

                        {filteredAuthors.length > 0 ? (
                          filteredAuthors.map((author) => (
                            <button
                              key={author.id || author.name}
                              type="button"
                              onClick={() => {
                                handleAddAuthor(author.name);
                                setIsAuthorOpen(false);
                              }}
                              className="w-full text-left p-3 hover:bg-navy/5 transition-colors flex items-center justify-between gap-2 text-xs cursor-pointer"
                            >
                              <div>
                                <p className="font-semibold text-navy">{author.name}</p>
                                <p className="text-[11px] text-foreground-muted">
                                  {author.institution || author.email || "Auteur certifié LAHA"}
                                </p>
                              </div>
                              <span className="text-[10px] font-bold text-gold bg-gold/10 px-2 py-0.5 rounded-md">
                                Choisir
                              </span>
                            </button>
                          ))
                        ) : (
                          !authorSearch.trim() && (
                            <div className="p-3 text-center text-xs text-foreground-muted">
                              {loadingAuthors ? "Chargement des auteurs..." : "Tapez un nom pour ajouter un auteur."}
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-navy">ISBN-13</label>
                    {aiResult?.isbn && (
                      <button
                        type="button"
                        onClick={() => setIsbn(aiResult.isbn)}
                        className="text-[10px] font-bold text-gold hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                      >
                        <Wand2 className="w-2.5 h-2.5" />
                        IA
                      </button>
                    )}
                  </div>
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

              {/* Email compte auteur optionnel */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-navy">
                  Email(s) du/des compte(s) auteur(s) (Facultatif)
                </label>
                <input
                  type="text"
                  placeholder="ex: auteur1@lahatheque.com, auteur2@lahatheque.com"
                  value={authorsEmailsStr}
                  onChange={(e) => setAuthorsEmailsStr(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl p-3 text-xs sm:text-sm text-foreground focus:ring-2 focus:ring-navy min-h-[44px]"
                />
                <p className="text-[11px] text-foreground-muted">
                  Si l&apos;auteur possède un compte LAHAThèque, son email permet d&apos;associer automatiquement ses futures statistiques de vente à son espace personnel. Facultatif.
                </p>
              </div>
            </div>

            {/* Prix */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-navy">Prix Numérique (FCFA)</label>
                <input
                  type="number"
                  step="500"
                  value={priceDigital}
                  onChange={(e) => setPriceDigital(parseFloat(e.target.value) || 0)}
                  className="w-full bg-background border border-border rounded-xl p-3 text-xs sm:text-sm text-foreground focus:ring-2 focus:ring-navy min-h-[44px]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-navy">Prix Papier (FCFA)</label>
                <input
                  type="number"
                  step="500"
                  value={pricePaper}
                  onChange={(e) => setPricePaper(parseFloat(e.target.value) || 0)}
                  className="w-full bg-background border border-border rounded-xl p-3 text-xs sm:text-sm text-foreground focus:ring-2 focus:ring-navy min-h-[44px]"
                />
              </div>
            </div>

            {/* Résumé */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-navy">
                  Résumé Exécutif / 4e de Couverture *
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
                placeholder="Rédigez la présentation de l'ouvrage qui apparaîtra sur la vitrine et dans la liseuse..."
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
                  <label className="text-xs font-bold uppercase tracking-wider text-navy">Genre / Discipline *</label>
                  {aiResult?.genre_category && (
                    <button
                      type="button"
                      onClick={() => handleGenreChange(aiResult.genre_category)}
                      className="text-[10px] font-bold text-gold hover:underline inline-flex items-center gap-1 cursor-pointer"
                      title={`Appliquer la discipline IA : ${aiResult.genre_category}`}
                    >
                      <Wand2 className="w-2.5 h-2.5" />
                      IA : {aiResult.genre_category}
                    </button>
                  )}
                </div>
                <select
                  value={genreCategory}
                  onChange={(e) => handleGenreChange(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl p-3 text-xs sm:text-sm text-foreground focus:ring-2 focus:ring-navy min-h-[44px]"
                >
                  {realDisciplines.length > 0
                    ? realDisciplines.map((d) => (
                        <option key={d.id} value={d.name}>
                          {d.name} {d.code_dewey ? `(${d.code_dewey})` : ""}
                        </option>
                      ))
                    : getGenreOptions(aiResult?.genre_category, genreCategory).map((g, i) => (
                        <option key={i} value={g.label}>
                          {g.label} ({g.dewey})
                        </option>
                      ))}
                </select>
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
              Étape suivante : Récapitulatif &amp; Validation →
            </button>
          </div>
        </div>
      )}

      {/* ─── ÉTAPE 4 : RÉCAPITULATIF & SOUMISSION ─────────────────────────────── */}
      {currentStep === 4 && (
        <div className="bg-background border border-border rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="font-serif font-bold text-navy text-base flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-gold" />
              Récapitulatif Avant Soumission au Chef Maquettiste
            </h3>
            <div className="flex items-center gap-2">
              <AISuggestionBadge source={aiResult ? "ai_suggested" : "manual"} />
              <span className="px-3 py-1 rounded-full bg-navy/10 text-navy text-xs font-bold uppercase tracking-wider border border-navy/20">
                Format {bookFile?.name.endsWith(".epub") ? "EPUB" : "PDF"}
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
                {university && university !== "Non affilié (Grand Public / Fiction / Scolaire)" && (
                  <p className="text-navy font-bold flex items-center gap-1">
                    <GraduationCap className="w-3.5 h-3.5 text-gold" />
                    {university} {faculty ? `• ${faculty}` : ""}
                  </p>
                )}
                <p className="text-foreground-muted leading-relaxed line-clamp-3 pt-1 border-t border-border">
                  {summary || "Aucun résumé fourni."}
                </p>
              </div>

              {/* Aperçu ONIX 3.0 XML */}
              {onixXml && (
                <div className="p-3 rounded-xl bg-navy/5 border border-border space-y-1">
                  <div className="flex items-center gap-1.5 text-navy font-bold text-[11px]">
                    <FileCode className="w-3.5 h-3.5 text-gold" />
                    Notice XML ONIX 3.0 générée prête pour l&apos;export
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
              onClick={handleSubmitValidation}
              disabled={saving}
              className="px-6 py-3 rounded-xl bg-navy hover:bg-navy-hover text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md transition-colors min-h-[44px] cursor-pointer"
            >
              <Send className="w-4 h-4 text-gold" />
              {saving ? "Transmission en cours..." : "Confirmer et Envoyer au Chef Maquettiste"}
            </button>
          </div>
        </div>
      )}

      {/* Modale de transmission dynamique & barre de progression */}
      <DepositSubmissionModal
        isOpen={isSubmissionModalOpen}
        fileName={bookFile?.name}
        fileSizeMb={bookFile ? bookFile.size / (1024 * 1024) : undefined}
        status={submissionStatus}
        errorMessage={submissionError}
        realProgress={uploadProgress}
      />
    </div>
  );
}
