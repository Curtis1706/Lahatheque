"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  Sparkles,
  Upload,
  Save,
  CheckCircle2,
  ShieldCheck,
  DollarSign,
  Tag,
  Info,
  Building2,
  Bot,
  Image as ImageIcon,
  X,
  Wand2,
  Users,
  Search,
  ChevronDown,
  Globe,
  Layers,
  FileText,
  UserCheck,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { FileDropzone } from "@/components/features/layout-artist/file-dropzone";
import { AIAnalysisProgressCard } from "@/components/features/layout-artist/ai-analysis-progress-card";
import { SearchableSelect, type SearchableOption } from "@/components/ui/searchable-select";
import { DisciplineCombobox } from "@/components/features/catalog/discipline-combobox";
import { InlineLoader } from "@/components/ui/page-loader";
import { createPublisherBook } from "@/lib/services/publisher";
import { extractBookMetadataWithAi, type AiBookAnalysisResult } from "@/lib/services/ai";
import { searchAuthors, type AuthorSearchResult } from "@/lib/services/layout-artist";
import { getDisciplines, type DisciplineItem } from "@/lib/services/classification";
import {
  SUPPORTED_LANGUAGES,
  SUPPORTED_COUNTRIES,
  matchLanguage,
} from "@/lib/constants/classification";
import type { SalesModel } from "@/lib/types/publisher";
import { cn } from "@/lib/utils";

// Options des Comboboxes (SearchableSelect)
const LANGUAGE_OPTIONS: SearchableOption[] = SUPPORTED_LANGUAGES.map((l) => ({
  value: l.code,
  label: l.label,
  badge: l.code.toUpperCase(),
  subtitle:
    l.code === "fr"
      ? "Langue officielle principale"
      : l.code === "en"
      ? "Langue internationale de diffusion"
      : ["fon", "yo", "wo", "sw", "ha", "ln", "bm"].includes(l.code)
      ? "Langue africaine nationale & régionale"
      : "Langue internationale",
}));

const TARGET_AUDIENCE_OPTIONS: SearchableOption[] = [
  {
    value: "universitaire",
    label: "Niveau Universitaire (Licence / Master / Doctorat)",
    subtitle: "Étudiants du supérieur, enseignants-chercheurs et doctorants",
    badge: "Académique",
  },
  {
    value: "professionnel",
    label: "Professionnels & Praticiens",
    subtitle: "Cadres, juristes, magistrats, experts-comptables, consultants",
    badge: "Métiers",
  },
  {
    value: "grand_public",
    label: "Grand Public & Culture Générale",
    subtitle: "Ouvrages littéraires, romans, essais, vulgarisation accessible",
    badge: "Général",
  },
];

const SALES_MODEL_OPTIONS: SearchableOption[] = [
  {
    value: "purchase",
    label: "Vente à l'unité uniquement",
    subtitle: "Achat pérenne de la licence numérique par les lecteurs ou institutions",
    badge: "Achat Unitaire",
  },
  {
    value: "subscription",
    label: "Inclus dans les abonnements",
    subtitle: "Accessible sans surcoût aux abonnés particuliers de la plateforme",
    badge: "Abonnement",
  },
  {
    value: "bundle",
    label: "Intégrable aux bouquets institutionnels",
    subtitle: "Éligible aux packages et souscriptions universitaires",
    badge: "Bouquet B2B",
  },
  {
    value: "free",
    label: "Accès Libre (Open Access)",
    subtitle: "Consultation intégrale ouverte à l'ensemble de la communauté",
    badge: "Libre Accès",
  },
];



// Helper pour faire correspondre strictement les suggestions IA aux disciplines réelles de la BD (1 à 3)
function matchAiToDbDisciplines(
  aiDisciplines: string[] | undefined,
  aiGenreCategory: string | undefined,
  aiDeweyCode: string | undefined,
  dbList: DisciplineItem[]
): string[] {
  if (!dbList || dbList.length === 0) return [];

  const candidates: string[] = [];
  if (Array.isArray(aiDisciplines)) {
    candidates.push(...aiDisciplines);
  }
  if (aiGenreCategory) {
    candidates.push(aiGenreCategory);
  }

  const selected: string[] = [];

  const normalize = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();

  // 1. Correspondance exacte ou inclusion mutuelle dans le nom officiel
  for (const cand of candidates) {
    if (!cand) continue;
    const normCand = normalize(cand);

    let found = dbList.find((d) => normalize(d.name) === normCand);
    if (!found) {
      found = dbList.find(
        (d) => normalize(d.name).includes(normCand) || normCand.includes(normalize(d.name))
      );
    }

    if (found && !selected.includes(found.name)) {
      selected.push(found.name);
      if (selected.length >= 3) break;
    }
  }

  // 2. Si aucune correspondance directe, tenter par code Dewey
  if (selected.length === 0 && aiDeweyCode) {
    const cleanDewey = aiDeweyCode.trim().slice(0, 2);
    const deweyMatch = dbList.find((d) => d.code_dewey && d.code_dewey.startsWith(cleanDewey));
    if (deweyMatch && !selected.includes(deweyMatch.name)) {
      selected.push(deweyMatch.name);
    }
  }

  // 3. Si toujours moins de 1 trouvé, tentative par mots-clés sémantiques significatifs
  if (selected.length === 0 && candidates.length > 0) {
    const allWords = candidates
      .join(" ")
      .toLowerCase()
      .split(/[\s,;&/]+/)
      .filter((w) => w.length >= 4);

    for (const d of dbList) {
      const normD = normalize(d.name);
      if (allWords.some((w) => normD.includes(normalize(w)))) {
        if (!selected.includes(d.name)) {
          selected.push(d.name);
          if (selected.length >= 3) break;
        }
      }
    }
  }

  // 4. Fallback de sécurité : toujours prendre au moins la 1ère discipline réelle de la BD
  if (selected.length === 0 && dbList.length > 0) {
    selected.push(dbList[0].name);
  }

  // Limiter strictement de 1 à 3 disciplines réelles issues de la base
  return selected.slice(0, 3);
}

export default function NewPublisherBookPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);

  // Fichiers & Visuels (Étape 1 - Upload First)
  const [manuscriptFile, setManuscriptFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [summary, setSummary] = useState("");
  const [authorsBio, setAuthorsBio] = useState("");

  // Identification (Étape 2)
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [isbnDigital, setIsbnDigital] = useState("");
  const [isbnPrint, setIsbnPrint] = useState("");
  const [doi, setDoi] = useState("");
  const [language, setLanguage] = useState("fr");

  // Contributeurs (Étape 3 - Combobox Auteurs + Co-auteurs)
  const [authors, setAuthors] = useState("");
  const [selectedAuthors, setSelectedAuthors] = useState<string[]>([]);
  const [authorSearch, setAuthorSearch] = useState("");
  const [allAuthors, setAllAuthors] = useState<AuthorSearchResult[]>([]);
  const [isAuthorDropdownOpen, setIsAuthorDropdownOpen] = useState(false);
  const [coAuthors, setCoAuthors] = useState("");
  const authorDropdownRef = useRef<HTMLDivElement>(null);

  // Modèle Commercial (Étape 4)
  const [price, setPrice] = useState(10000);
  const [currency, setCurrency] = useState("XOF");
  const [salesModel, setSalesModel] = useState<SalesModel>("purchase");
  const [territories, setTerritories] = useState("Bénin, Togo, Côte d'Ivoire, Sénégal");

  // Classification Thématique (Étape 5 - 1 à 3 disciplines réelles de la BD)
  const [disciplinesList, setDisciplinesList] = useState<DisciplineItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [discipline, setDiscipline] = useState("");
  const [keywords, setKeywords] = useState("");
  const [targetAudience, setTargetAudience] = useState<"universitaire" | "professionnel" | "grand_public">("universitaire");

  // Droits & Protection (Étape 6)
  const [watermarkEnabled, setWatermarkEnabled] = useState(true);

  // États globaux IA & Soumission
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<AiBookAnalysisResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Chargement des disciplines réelles depuis la base de données et des auteurs référencés
  useEffect(() => {
    getDisciplines().then((list) => {
      if (list && list.length > 0) {
        setDisciplinesList(list);
        setCategories([list[0].name]);
        setDiscipline(list[0].name);
      }
    });

    searchAuthors("").then((res) => {
      if (res && res.length > 0) {
        setAllAuthors(res);
      }
    });
  }, []);

  // Fermeture du dropdown auteur au clic extérieur
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (authorDropdownRef.current && !authorDropdownRef.current.contains(event.target as Node)) {
        setIsAuthorDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Synchronisation des auteurs sélectionnés vers la chaîne textuelle
  const handleAddAuthor = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (!selectedAuthors.includes(trimmed)) {
      const updated = [...selectedAuthors, trimmed];
      setSelectedAuthors(updated);
      setAuthors(updated.join(", "));
    }
    setAuthorSearch("");
    setIsAuthorDropdownOpen(false);
  };

  const handleRemoveAuthor = (nameToRemove: string) => {
    const updated = selectedAuthors.filter((a) => a !== nameToRemove);
    setSelectedAuthors(updated);
    setAuthors(updated.join(", "));
  };

  const handleManualAuthorsChange = (val: string) => {
    setAuthors(val);
    const parsed = val.split(",").map((s) => s.trim()).filter(Boolean);
    setSelectedAuthors(parsed);
  };

  // Gestion de la couverture
  const handleCoverSelect = (f: File) => {
    setCoverFile(f);
    const url = URL.createObjectURL(f);
    setCoverPreview(url);
    toast.success(`Image de couverture « ${f.name} » prête.`);
  };

  const handleCoverRemove = () => {
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverFile(null);
    setCoverPreview(null);
  };

  // Déclenchement de l'analyse documentaire IA dès téléversement du manuscrit
  const handleManuscriptSelect = async (file: File) => {
    setManuscriptFile(file);
    toast.info(`Manuscrit « ${file.name} » prêt. Lancement de l'analyse IA...`);

    // Titre par défaut dérivé du nom de fichier si vide
    if (!title) {
      const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
      setTitle(cleanName);
    }

    setAiAnalyzing(true);
    try {
      const res = await extractBookMetadataWithAi(file, file.name);
      if (res.success && res.data) {
        const data = res.data;
        setAiResult(data);

        // Application automatique des métadonnées extraites
        if (data.title && (!title || title === file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " "))) {
          setTitle(data.title);
        }
        if (data.subtitle && !subtitle) {
          setSubtitle(data.subtitle);
        }
        if (data.authors && data.authors.length > 0) {
          setSelectedAuthors(data.authors);
          setAuthors(data.authors.join(", "));
        }
        if (data.isbn && !isbnDigital) {
          setIsbnDigital(data.isbn);
        }
        if (data.summary) {
          setSummary(data.summary);
        }

        // Matching strict contre les disciplines réelles de la base de données (1 à 3)
        const matched = matchAiToDbDisciplines(
          data.disciplines,
          data.genre_category,
          data.dewey_code,
          disciplinesList
        );
        if (matched.length > 0) {
          setCategories(matched);
          setDiscipline(matched[0]);
        }

        if (data.keywords && data.keywords.length > 0) {
          setKeywords(data.keywords.join(", "));
        }
        if (data.language) {
          const matchedLang = matchLanguage(data.language);
          const found = LANGUAGE_OPTIONS.find(
            (l) => l.label.toLowerCase() === matchedLang.toLowerCase() || l.value === data.language.toLowerCase()
          );
          if (found) setLanguage(found.value);
        }
        if (data.target_audience) {
          const lowerAudience = data.target_audience.toLowerCase();
          if (lowerAudience.includes("prof") || lowerAudience.includes("praticien")) {
            setTargetAudience("professionnel");
          } else if (lowerAudience.includes("grand") || lowerAudience.includes("public")) {
            setTargetAudience("grand_public");
          } else {
            setTargetAudience("universitaire");
          }
        }

        toast.success("Analyse IA terminée : métadonnées et classification BD préremplies avec succès.");
      }
    } catch (err) {
      console.warn("[Publisher Deposit AI]", err);
      toast.error("Analyse IA indisponible, vous pouvez renseigner les champs manuellement.");
    } finally {
      setAiAnalyzing(false);
    }
  };

  // Réapplication intégrale en 1 clic
  const handleApplyAllAiData = () => {
    if (!aiResult) return;
    if (aiResult.title) setTitle(aiResult.title);
    if (aiResult.subtitle) setSubtitle(aiResult.subtitle);
    if (aiResult.authors && aiResult.authors.length > 0) {
      setSelectedAuthors(aiResult.authors);
      setAuthors(aiResult.authors.join(", "));
    }
    if (aiResult.isbn) setIsbnDigital(aiResult.isbn);
    if (aiResult.summary) setSummary(aiResult.summary);

    // Matching strict contre la BD (1 à 3)
    const matched = matchAiToDbDisciplines(
      aiResult.disciplines,
      aiResult.genre_category,
      aiResult.dewey_code,
      disciplinesList
    );
    if (matched.length > 0) {
      setCategories(matched);
      setDiscipline(matched[0]);
    }

    if (aiResult.keywords && aiResult.keywords.length > 0) {
      setKeywords(aiResult.keywords.join(", "));
    }
    if (aiResult.language) {
      const matchedLang = matchLanguage(aiResult.language);
      const found = LANGUAGE_OPTIONS.find(
        (l) => l.label.toLowerCase() === matchedLang.toLowerCase() || l.value === aiResult.language.toLowerCase()
      );
      if (found) setLanguage(found.value);
    }
    if (aiResult.target_audience) {
      const lower = aiResult.target_audience.toLowerCase();
      if (lower.includes("prof")) setTargetAudience("professionnel");
      else if (lower.includes("grand")) setTargetAudience("grand_public");
      else setTargetAudience("universitaire");
    }
    toast.success("Toutes les métadonnées suggérées par l'IA ont été appliquées.");
  };

  // Soumission complète au comité éditorial LAHA
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !isbnDigital || !authors) {
      toast.error("Veuillez renseigner les champs obligatoires (Titre, ISBN numérique et Auteurs).");
      return;
    }
    if (categories.length === 0) {
      toast.error("Veuillez sélectionner de 1 à 3 disciplines issues du référentiel officiel.");
      return;
    }

    setSubmitting(true);
    try {
      await createPublisherBook(
        {
          title,
          subtitle: subtitle || undefined,
          isbn_digital: isbnDigital,
          isbn_print: isbnPrint || undefined,
          doi: doi || undefined,
          authors: authors.split(",").map((a) => a.trim()).filter(Boolean),
          discipline: categories[0] || discipline,
          disciplines: categories,
          language,
          keywords: keywords.split(",").map((k) => k.trim()).filter(Boolean),
          target_audience: targetAudience,
          price,
          currency,
          sales_model: salesModel,
          allowed_territories: territories.split(",").map((t) => t.trim()).filter(Boolean),
          summary: summary || "Ouvrage déposé pour examen éditorial.",
          authors_bio: authorsBio,
          licence_type: "tous_droits_reserves",
          protection_config: {
            watermark_enabled: watermarkEnabled,
            watermark_position: "bottom-right",
            watermark_opacity: 30,
            user_watermarking: true,
            lcp_drm_enabled: true,
            max_allowed_devices: 3,
            max_loan_days: 14,
            disable_copy_paste: true,
            disable_print: false,
            audio_encryption_auto: true,
            access_tracing_auto: true,
          },
        },
        manuscriptFile,
        coverFile
      );

      toast.success("L'ouvrage, son manuscrit et sa couverture ont été enregistrés avec succès dans la base de données.");
      router.push("/publisher/catalog");
    } catch {
      toast.error("Erreur lors du dépôt de l'ouvrage. Veuillez réessayer.");
    } finally {
      setSubmitting(false);
    }
  };

  const stepLabels = [
    "1. Fichiers & Analyse IA",
    "2. Identification",
    "3. Contributeurs",
    "4. Commercial",
    "5. Classification (IA)",
    "6. Droits & Protection",
  ];

  // Auteurs filtrés pour le dropdown
  const filteredAuthors = allAuthors.filter((a) => {
    const term = authorSearch.toLowerCase().trim();
    if (!term) return true;
    return (
      a.name.toLowerCase().includes(term) ||
      (a.institution && a.institution.toLowerCase().includes(term)) ||
      (a.email && a.email.toLowerCase().includes(term))
    );
  });

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* En-tête de page */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <Link
            href="/publisher/catalog"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-navy hover:text-gold transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au Catalogue
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold font-serif text-navy tracking-tight">
              Nouveau Dépôt d&apos;Ouvrage Partenaire
            </h1>
            <span className="px-2.5 py-0.5 rounded-md bg-gold/15 text-gold text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Assistance IA
            </span>
          </div>
          <p className="text-xs sm:text-sm text-foreground-muted mt-0.5">
            Soumettez le manuscrit et la couverture en premier pour que l&apos;IA préremplisse et optimise automatiquement les métadonnées.
          </p>
        </div>

        {/* Bouton de relance manuelle de l'analyse */}
        <button
          type="button"
          onClick={() => {
            if (manuscriptFile) {
              handleManuscriptSelect(manuscriptFile);
            } else {
              toast.info("Veuillez sélectionner votre manuscrit PDF à l'étape 1 pour lancer l'analyse documentaire.");
            }
          }}
          disabled={aiAnalyzing || !manuscriptFile}
          className="px-4 py-2.5 rounded-xl bg-gold/15 text-gold border border-gold/30 hover:bg-gold/25 font-bold text-xs transition-colors flex items-center gap-2 shadow-xs shrink-0 min-h-[44px] disabled:opacity-50 cursor-pointer"
        >
          {aiAnalyzing ? (
            <InlineLoader size={16} />
          ) : (
            <Bot className="w-4 h-4 text-gold" />
          )}
          <span>{aiAnalyzing ? "Analyse documentaire en cours..." : "Relancer l'Analyse IA"}</span>
        </button>
      </div>

      {/* Stepper Multi-Étapes Réactif */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 p-2 rounded-2xl bg-background-secondary border border-border">
        {stepLabels.map((lbl, idx) => {
          const stepNum = idx + 1;
          const isActive = currentStep === stepNum;
          const isPassed = currentStep > stepNum;
          return (
            <button
              key={lbl}
              type="button"
              onClick={() => setCurrentStep(stepNum)}
              className={`p-2.5 rounded-xl text-xs font-bold transition-all text-left flex items-center justify-between min-h-[44px] cursor-pointer ${
                isActive
                  ? "bg-navy text-white shadow-xs"
                  : isPassed
                  ? "bg-background text-emerald-700 border border-emerald-500/30"
                  : "text-foreground-muted hover:bg-background"
              }`}
            >
              <span className="truncate">{lbl}</span>
              {isPassed && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 ml-1" />}
            </button>
          );
        })}
      </div>

      {/* Animation d'Analyse IA en cours */}
      {aiAnalyzing && (
        <AIAnalysisProgressCard fileName={manuscriptFile?.name} />
      )}

      {/* Bandeau Assistant IA si analyse disponible */}
      {aiResult && !aiAnalyzing && (
        <div className="p-5 rounded-3xl bg-navy text-white border border-navy-hover space-y-3 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-gold/20 text-gold shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-sm text-gold">
                  Assistant IA • Notice Bibliographique &amp; Classification Prêtes
                </h3>
                <p className="text-[11px] text-white/80">
                  Document analysé : « {aiResult.title} » ({categories.join(", ") || aiResult.genre_category} • Cote Dewey {aiResult.dewey_code || "340"})
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleApplyAllAiData}
              className="px-4 py-2 rounded-xl bg-gold hover:bg-gold-light text-navy text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 shrink-0 min-h-[40px] cursor-pointer"
            >
              <Wand2 className="w-3.5 h-3.5" />
              Tout Appliquer en 1 Clic
            </button>
          </div>

          {aiResult.keywords && aiResult.keywords.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-white/10">
              <span className="text-[10px] uppercase font-bold text-gold">Mots-clés extraits :</span>
              {aiResult.keywords.map((tag, i) => (
                <span key={i} className="px-2 py-0.5 rounded-md bg-white/10 text-white text-[10px]">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Formulaire Principal Multi-Étapes */}
      <form onSubmit={handleSubmit} className="p-6 sm:p-8 rounded-3xl bg-background border border-border space-y-6 shadow-xs">
        {/* ─── ÉTAPE 1 : FICHIERS & ANALYSE IA (UPLOAD FIRST) ────────────────── */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-gold" />
                <h2 className="font-serif font-bold text-navy text-base">Fichiers Sources &amp; Analyse IA Immédiate</h2>
              </div>
              <span className="text-[11px] text-foreground-muted">Étape 1 sur 6</span>
            </div>

            {/* Grille Manuscrit (Prioritaire) + Première de Couverture */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* 1. Manuscrit PDF (Déclencheur IA) */}
              <div className="space-y-2 p-4 rounded-2xl bg-background-secondary border border-border">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-navy uppercase tracking-wider flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5 text-gold" />
                    Manuscrit / Épreuve Numérique (PDF) <span className="text-rose-500">*</span>
                  </label>
                  {manuscriptFile && (
                    <button
                      type="button"
                      onClick={() => {
                        setManuscriptFile(null);
                        setAiResult(null);
                      }}
                      className="text-[11px] font-semibold text-rose-500 hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <X className="w-3 h-3" /> Retirer
                    </button>
                  )}
                </div>
                <FileDropzone
                  label="Téléverser le Manuscrit (PDF uniquement)"
                  acceptTypes={[".pdf"]}
                  maxSizeMB={800}
                  selectedFileName={manuscriptFile?.name}
                  selectedFileSize={manuscriptFile?.size}
                  isLoading={aiAnalyzing}
                  loadingLabel="Extraction et analyse documentaire en cours..."
                  onFileSelect={handleManuscriptSelect}
                  onFileRemove={() => {
                    setManuscriptFile(null);
                    setAiResult(null);
                  }}
                />
                <p className="text-[10px] text-foreground-muted">
                  Le dépôt du PDF lance automatiquement la détection des métadonnées, du titre, des auteurs, du résumé et des catégories.
                </p>
              </div>

              {/* 2. Première de Couverture Image */}
              <div className="space-y-2 p-4 rounded-2xl bg-background-secondary border border-border">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-navy uppercase tracking-wider flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-gold" />
                    Première de Couverture (Image)
                  </label>
                  {coverFile && (
                    <button
                      type="button"
                      onClick={handleCoverRemove}
                      className="text-[11px] font-semibold text-rose-500 hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <X className="w-3 h-3" /> Supprimer
                    </button>
                  )}
                </div>

                {coverPreview ? (
                  <div className="flex items-center gap-4 p-3 rounded-xl bg-background border border-border">
                    <img
                      src={coverPreview}
                      alt="Aperçu couverture"
                      className="w-16 h-22 object-cover rounded-lg border border-border shadow-xs shrink-0"
                    />
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="text-xs font-bold text-navy truncate">{coverFile?.name}</p>
                      <p className="text-[10px] text-foreground-muted font-mono">
                        {coverFile ? `${(coverFile.size / 1024).toFixed(1)} Ko` : ""}
                      </p>
                      <span className="inline-block text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 font-semibold">
                        Couverture enregistrée
                      </span>
                    </div>
                  </div>
                ) : (
                  <FileDropzone
                    label="Téléverser l'Image de Couverture (PNG, JPG, WEBP)"
                    acceptTypes={[".png", ".jpg", ".jpeg", ".webp"]}
                    maxSizeMB={10}
                    selectedFileName={coverFile?.name}
                    selectedFileSize={coverFile?.size}
                    onFileSelect={handleCoverSelect}
                    onFileRemove={handleCoverRemove}
                  />
                )}
                <p className="text-[10px] text-foreground-muted">
                  Format recommandé : rapport 1:1.5 (ex. 1600x2400 px), max 10 Mo.
                </p>
              </div>
            </div>

            {/* Résumé et Biographie de l'auteur */}
            <div className="space-y-4 pt-2 border-t border-border">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-navy uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-gold" />
                    Résumé / Quatrième de Couverture
                  </label>
                  {aiResult?.summary && (
                    <button
                      type="button"
                      onClick={() => setSummary(aiResult.summary)}
                      className="text-[11px] font-bold text-gold hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Wand2 className="w-3 h-3" />
                      Appliquer le résumé généré par l&apos;IA
                    </button>
                  )}
                </div>
                <textarea
                  rows={4}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Présentation synthétique du contenu de l'ouvrage (extraite ou rédigée)..."
                  className="w-full p-3.5 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-medium leading-relaxed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-navy uppercase tracking-wider">
                  Biographie de l&apos;Auteur (Optionnel)
                </label>
                <textarea
                  rows={2}
                  value={authorsBio}
                  onChange={(e) => setAuthorsBio(e.target.value)}
                  placeholder="Notice biographique, titres universitaires et affiliations..."
                  className="w-full p-3.5 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-medium leading-relaxed"
                />
              </div>
            </div>
          </div>
        )}

        {/* ─── ÉTAPE 2 : IDENTIFICATION ────────────────────────────────────────── */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-gold" />
                <h2 className="font-serif font-bold text-navy text-base">Identification Bibliographique</h2>
              </div>
              <span className="text-[11px] text-foreground-muted">Étape 2 sur 6</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Titre Principal */}
              <div className="space-y-1.5 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-navy uppercase tracking-wider">
                    Titre Principal de l&apos;Ouvrage <span className="text-rose-500">*</span>
                  </label>
                  {aiResult?.title && aiResult.title !== title && (
                    <button
                      type="button"
                      onClick={() => setTitle(aiResult.title)}
                      className="text-[11px] font-bold text-gold hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Wand2 className="w-3 h-3" />
                      Insérer suggestion IA : « {aiResult.title.slice(0, 32)}... »
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="ex. Traité Général de Droit International et Africain"
                  required
                  className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-semibold min-h-[44px]"
                />
              </div>

              {/* Sous-Titre */}
              <div className="space-y-1.5 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-navy uppercase tracking-wider">Sous-Titre (Optionnel)</label>
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
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="ex. Principes, Traités et Jurisprudence OHADA"
                  className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-semibold min-h-[44px]"
                />
              </div>

              {/* ISBN Numérique */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-navy uppercase tracking-wider">
                    ISBN Numérique (EPUB/PDF) <span className="text-rose-500">*</span>
                  </label>
                  {aiResult?.isbn && (
                    <button
                      type="button"
                      onClick={() => setIsbnDigital(aiResult.isbn)}
                      className="text-[10px] font-bold text-gold hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Wand2 className="w-2.5 h-2.5" />
                      ISBN IA : {aiResult.isbn}
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={isbnDigital}
                  onChange={(e) => setIsbnDigital(e.target.value)}
                  placeholder="978-2-01-398010-4"
                  required
                  className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-mono min-h-[44px]"
                />
              </div>

              {/* ISBN Papier */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-navy uppercase tracking-wider">ISBN Format Papier</label>
                <input
                  type="text"
                  value={isbnPrint}
                  onChange={(e) => setIsbnPrint(e.target.value)}
                  placeholder="978-2-01-398011-1"
                  className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-mono min-h-[44px]"
                />
              </div>

              {/* DOI */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-navy uppercase tracking-wider">Identifiant DOI</label>
                <input
                  type="text"
                  value={doi}
                  onChange={(e) => setDoi(e.target.value)}
                  placeholder="10.1016/j.afadmin.2025.01"
                  className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-mono min-h-[44px]"
                />
              </div>

              {/* Langue de l'Ouvrage via SearchableSelect Combobox */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-navy uppercase tracking-wider">
                    Langue de l&apos;Ouvrage (Combobox)
                  </label>
                  {aiResult?.language && (
                    <span className="text-[10px] text-gold font-bold">
                      IA : {matchLanguage(aiResult.language)}
                    </span>
                  )}
                </div>
                <SearchableSelect
                  options={LANGUAGE_OPTIONS}
                  value={language}
                  onChange={(val) => setLanguage(val)}
                  placeholder="Rechercher une langue..."
                  searchPlaceholder="Filtrer par langue (ex: Français, Fon, Anglais)..."
                  icon={<Globe className="w-4 h-4 text-gold" />}
                />
              </div>
            </div>
          </div>
        )}

        {/* ─── ÉTAPE 3 : CONTRIBUTEURS ────────────────────────────────────────── */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-gold" />
                <h2 className="font-serif font-bold text-navy text-base">Contributeurs &amp; Auteurs</h2>
              </div>
              <span className="text-[11px] text-foreground-muted">Étape 3 sur 6</span>
            </div>

            <div className="space-y-4">
              {/* Combobox Auteurs avec recherche, suggestions et tags */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-navy uppercase tracking-wider flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-gold" />
                    Auteur(s) Principal(aux) <span className="text-rose-500">*</span>
                  </label>
                  {aiResult?.authors && aiResult.authors.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAuthors(aiResult.authors);
                        setAuthors(aiResult.authors.join(", "));
                      }}
                      className="text-[10px] font-bold text-gold hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Wand2 className="w-2.5 h-2.5" />
                      Appliquer les auteurs IA ({aiResult.authors.length})
                    </button>
                  )}
                </div>

                {/* Badges des auteurs sélectionnés */}
                {selectedAuthors.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pb-1">
                    {selectedAuthors.map((authorName) => (
                      <span
                        key={authorName}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-navy/10 text-navy font-bold text-xs rounded-xl border border-navy/20 shadow-2xs"
                      >
                        <UserCheck className="w-3 h-3 text-gold" />
                        <span>{authorName}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveAuthor(authorName)}
                          className="text-foreground-muted hover:text-rose-600 transition-colors ml-1 cursor-pointer"
                          title="Retirer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Combobox interactif de sélection et ajout d'auteurs */}
                <div ref={authorDropdownRef} className="relative">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 text-foreground-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={authorSearch}
                        onChange={(e) => {
                          setAuthorSearch(e.target.value);
                          setIsAuthorDropdownOpen(true);
                        }}
                        onFocus={() => setIsAuthorDropdownOpen(true)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            if (authorSearch.trim()) {
                              handleAddAuthor(authorSearch);
                            }
                          }
                        }}
                        placeholder="Rechercher parmi les auteurs référencés ou saisir un nouveau nom..."
                        className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-semibold min-h-[44px]"
                      />
                    </div>
                    {authorSearch.trim() && (
                      <button
                        type="button"
                        onClick={() => handleAddAuthor(authorSearch)}
                        className="px-4 py-2.5 bg-navy text-white text-xs font-bold rounded-xl hover:bg-navy-hover transition-colors flex items-center gap-1.5 shrink-0 min-h-[44px] cursor-pointer shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5 text-gold" />
                        Ajouter
                      </button>
                    )}
                  </div>

                  {/* Dropdown de recherche d'auteurs */}
                  {isAuthorDropdownOpen && filteredAuthors.length > 0 && (
                    <div className="absolute z-30 top-full mt-1.5 left-0 right-0 bg-background border border-border rounded-2xl shadow-xl overflow-hidden max-h-56 overflow-y-auto divide-y divide-border animate-in fade-in-0 zoom-in-95 duration-100">
                      {filteredAuthors.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleAddAuthor(item.name)}
                          className="w-full px-3.5 py-2.5 text-left text-xs hover:bg-background-secondary transition-colors flex items-center justify-between gap-2 cursor-pointer"
                        >
                          <div>
                            <p className="font-bold text-navy">{item.name}</p>
                            <p className="text-[10px] text-foreground-muted">
                              {item.institution || "Enseignant / Chercheur indépendant"}
                              {item.email ? ` · ${item.email}` : ""}
                            </p>
                          </div>
                          <span className="text-[10px] font-bold text-gold shrink-0">Choisir</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Saisie textuelle directe pour liberté totale */}
                <div className="pt-1">
                  <label className="text-[11px] font-semibold text-foreground-muted">
                    Ou modifiez directement la liste textuelle des auteurs (séparés par des virgules) :
                  </label>
                  <input
                    type="text"
                    value={authors}
                    onChange={(e) => handleManualAuthorsChange(e.target.value)}
                    placeholder="ex. Prof. Augustin CHAKIROU, Dr. Honoré ZINSOU"
                    required
                    className="w-full mt-1 px-3.5 py-2 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-semibold min-h-[38px]"
                  />
                </div>
              </div>

              {/* Co-auteurs */}
              <div className="space-y-1.5 pt-2 border-t border-border">
                <label className="text-xs font-bold text-navy uppercase tracking-wider">
                  Co-auteurs, Traducteurs ou Préfaciers
                </label>
                <input
                  type="text"
                  value={coAuthors}
                  onChange={(e) => setCoAuthors(e.target.value)}
                  placeholder="ex. Dr. Fatou DIOP (Préfacier), Pr. Marc KOUDJO (Traducteur)"
                  className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-semibold min-h-[44px]"
                />
              </div>
            </div>
          </div>
        )}

        {/* ─── ÉTAPE 4 : COMMERCIAL ───────────────────────────────────────────── */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-gold" />
                <h2 className="font-serif font-bold text-navy text-base">Modèle Commercial &amp; Territoires</h2>
              </div>
              <span className="text-[11px] text-foreground-muted">Étape 4 sur 6</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Prix Public Unitaire */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-navy uppercase tracking-wider">Prix Public Unitaire</label>
                <div className="relative">
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    min={0}
                    step={500}
                    className="w-full pl-3.5 pr-16 py-2.5 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-bold min-h-[44px]"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-foreground-muted">
                    {currency}
                  </span>
                </div>
              </div>

              {/* Modèle de Distribution via SearchableSelect Combobox */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-navy uppercase tracking-wider">
                  Modèle de Distribution (Combobox)
                </label>
                <SearchableSelect
                  options={SALES_MODEL_OPTIONS}
                  value={salesModel}
                  onChange={(val) => setSalesModel(val as SalesModel)}
                  placeholder="Sélectionner le modèle de vente..."
                  searchPlaceholder="Rechercher (ex: Vente, Abonnement, Open Access)..."
                />
              </div>

              {/* Territoires d'Exploitation avec Combobox et Presets */}
              <div className="space-y-2 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-navy uppercase tracking-wider">
                    Territoires d&apos;Exploitation Autorisés
                  </label>
                  <span className="text-[11px] text-foreground-muted">Saisie libre ou ajout via les sélecteurs</span>
                </div>

                {/* Boutons de presets rapides */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-bold text-navy uppercase">Presets rapides :</span>
                  <button
                    type="button"
                    onClick={() => setTerritories("Bénin, Togo, Côte d'Ivoire, Sénégal, Niger, Mali, Burkina Faso, Guinée-Bissau")}
                    className="px-2.5 py-1 text-[10px] font-bold bg-navy/5 text-navy hover:bg-navy/10 rounded-lg border border-border transition-colors cursor-pointer"
                  >
                    Espace UEMOA (8 pays)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTerritories("Bénin, Togo, Côte d'Ivoire, Sénégal, Cameroun, Gabon, Congo, RDC, Guinée, Mali, Niger, Burkina Faso")}
                    className="px-2.5 py-1 text-[10px] font-bold bg-navy/5 text-navy hover:bg-navy/10 rounded-lg border border-border transition-colors cursor-pointer"
                  >
                    Afrique Francophone
                  </button>
                  <button
                    type="button"
                    onClick={() => setTerritories("Monde Entier (Tous territoires sans restriction)")}
                    className="px-2.5 py-1 text-[10px] font-bold bg-gold/15 text-gold hover:bg-gold/25 rounded-lg border border-gold/30 transition-colors cursor-pointer"
                  >
                    Monde Entier
                  </button>
                </div>

                {/* Combobox pour ajouter un pays individuel */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  <div className="sm:col-span-1">
                    <SearchableSelect
                      options={SUPPORTED_COUNTRIES.map((c) => ({
                        value: c.label,
                        label: c.label,
                        badge: c.code,
                      }))}
                      value=""
                      onChange={(countryLabel) => {
                        if (!countryLabel) return;
                        const currentList = territories.split(",").map((t) => t.trim()).filter(Boolean);
                        if (!currentList.includes(countryLabel)) {
                          const updated = [...currentList, countryLabel];
                          setTerritories(updated.join(", "));
                          toast.success(`Pays « ${countryLabel} » ajouté aux territoires.`);
                        }
                      }}
                      placeholder="Ajouter un pays au catalogue..."
                      searchPlaceholder="Rechercher un pays..."
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      value={territories}
                      onChange={(e) => setTerritories(e.target.value)}
                      placeholder="ex. Bénin, Togo, Côte d'Ivoire, Sénégal, France, Monde"
                      className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-semibold min-h-[44px]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── ÉTAPE 5 : CLASSIFICATION (IA & BASE DE DONNÉES) ────────────────── */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-gold" />
                <h2 className="font-serif font-bold text-navy text-base">Classification Thématique &amp; Académique (Base de Données)</h2>
              </div>
              <span className="text-[11px] text-foreground-muted">Étape 5 sur 6</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Disciplines via DisciplineCombobox (1 à 3 de la base de données) */}
              <div className="space-y-1.5 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-navy uppercase tracking-wider">
                    Disciplines / Catégories <span className="text-[10px] font-normal text-foreground-muted">(1 à 3 obligatoires, référentiel officiel en base de données)</span>
                  </label>
                  <span className="text-[11px] font-bold text-navy">
                    {categories.length} / 3 sélectionnée{categories.length > 1 ? "s" : ""}
                  </span>
                </div>
                <DisciplineCombobox
                  multiple={true}
                  maxSelections={3}
                  values={categories}
                  onValuesChange={(newVals) => {
                    const clamped = newVals.slice(0, 3);
                    setCategories(clamped);
                    if (clamped.length > 0) setDiscipline(clamped[0]);
                  }}
                  disciplines={disciplinesList}
                  placeholder="Sélectionner ou rechercher une discipline de la base (1 à 3)..."
                  searchPlaceholder="Rechercher parmi les disciplines académiques officielles enregistrées..."
                />
                <p className="text-[11px] text-foreground-muted">
                  Les disciplines sont directement issues du catalogue officiel LAHAThèque en base de données.
                </p>
              </div>

              {/* Mots-Clés Thématiques */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-navy uppercase tracking-wider">Mots-Clés Thématiques</label>
                  {aiResult?.keywords && (
                    <button
                      type="button"
                      onClick={() => setKeywords(aiResult.keywords.join(", "))}
                      className="text-[10px] font-bold text-gold hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Wand2 className="w-2.5 h-2.5" />
                      Mots-clés IA ({aiResult.keywords.length})
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="ex. droit public, afrique de l'ouest, uac, jurisprudence"
                  className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-semibold min-h-[44px]"
                />
              </div>
            </div>
          </div>
        )}

        {/* ─── ÉTAPE 6 : DROITS & PROTECTION ─────────────────────────────────── */}
        {currentStep === 6 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-gold" />
                <h2 className="font-serif font-bold text-navy text-base">Droits, Licences &amp; Tatouage Numérique</h2>
              </div>
              <span className="text-[11px] text-foreground-muted">Étape 6 sur 6</span>
            </div>

            <div className="space-y-4">
              {/* Note informative Convention LAHA (Automatique) */}
              <div className="p-4 rounded-2xl bg-navy-light border border-navy-hover/20 space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-navy">
                  <ShieldCheck className="w-4 h-4 text-gold" />
                  <span>Tous Droits Réservés &bull; Convention Partenaire LAHA</span>
                </div>
                <p className="text-[11px] text-foreground-muted leading-relaxed">
                  L&apos;ouvrage déposé est automatiquement protégé par le système DRM LCP (Readium) conformément aux dispositions contractuelles de votre convention d&apos;édition.
                </p>
              </div>

              {/* Tatouage Numérique Visible Personnalisé */}
              <div className="p-4 rounded-2xl bg-background-secondary border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-navy">Activer le Tatouage Visible Personnalisé</span>
                    <p className="text-[11px] text-foreground-muted">
                      Inscrit dynamiquement le nom de l&apos;acquéreur, la date d&apos;achat et le numéro de licence unique sur les pages.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setWatermarkEnabled(!watermarkEnabled)}
                    className={`w-11 h-6 rounded-full transition-colors relative p-0.5 shrink-0 cursor-pointer ${
                      watermarkEnabled ? "bg-gold" : "bg-border"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transition-transform ${
                        watermarkEnabled ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Boutons de Navigation Suivant / Précédent */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
              className="px-5 py-2.5 rounded-xl bg-background-secondary border border-border text-xs font-bold text-navy hover:bg-background transition-colors min-h-[44px] cursor-pointer"
            >
              Étape Précédente
            </button>
          ) : (
            <div />
          )}

          {currentStep < 6 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((s) => Math.min(6, s + 1))}
              className="px-5 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors min-h-[44px] shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <span>
                {currentStep === 1
                  ? "Étape suivante : Identification →"
                  : currentStep === 2
                  ? "Étape suivante : Contributeurs →"
                  : currentStep === 3
                  ? "Étape suivante : Modèle Commercial →"
                  : currentStep === 4
                  ? "Étape suivante : Classification Thématique →"
                  : "Étape suivante : Droits & Protection →"}
              </span>
            </button>
          ) : (
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-gold text-navy font-bold text-xs hover:bg-gold-light transition-all flex items-center gap-2 min-h-[44px] shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <>
                  <InlineLoader size={16} />
                  <span>Envoi au comité...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Soumettre au Comité LAHA</span>
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
