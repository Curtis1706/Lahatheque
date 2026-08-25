"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  BookOpen, 
  Send, 
  Save, 
  AlertCircle, 
  CheckCircle2, 
  ShieldCheck, 
  FileText,
  Upload,
  Image as ImageIcon,
  DollarSign,
  GraduationCap,
  Sparkles,
  Wand2,
  Check,
  Search,
  Layers,
  HelpCircle,
  Hash
} from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { AISuggestionBadge } from "@/components/features/layout-artist/ai-suggestion-badge";
import { BookCover3D } from "@/components/ui/book-cover-3d";
import { getDepositDetail, updateDeposit, submitDepositForValidation } from "@/lib/services/layout-artist";
import { extractBookMetadataWithAi, type AiBookAnalysisResult } from "@/lib/services/ai";
import type { LayoutDeposit } from "@/lib/types/layout-artist";
import { toast } from "sonner";

export default function DepositDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [deposit, setDeposit] = useState<LayoutDeposit | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingCover, setSavingCover] = useState(false);

  // IA State
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AiBookAnalysisResult | null>(null);

  // Form State - Métadonnées
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [authorsStr, setAuthorsStr] = useState("");
  const [year, setYear] = useState(2026);
  const [language, setLanguage] = useState("Français");
  const [summary, setSummary] = useState("");
  const [isbn, setIsbn] = useState("");
  const [keywordsStr, setKeywordsStr] = useState("");

  // Form State - Classification
  const [discipline, setDiscipline] = useState("");
  const [deweyCode, setDeweyCode] = useState("");
  const [country, setCountry] = useState("BJ");
  const [university, setUniversity] = useState("");
  const [faculty, setFaculty] = useState("");
  const [department, setDepartment] = useState("");
  const [targetAudience, setTargetAudience] = useState("");

  // Form State - Format & Tarification
  const [format, setFormat] = useState<"PDF" | "EPUB" | "AUDIO" | "PAPIER">("PDF");
  const [priceDigital, setPriceDigital] = useState(5000);
  const [isPaperAvailable, setIsPaperAvailable] = useState(false);
  const [pricePaper, setPricePaper] = useState(7500);

  // Fichiers de remplacement
  const [newBookFile, setNewBookFile] = useState<File | null>(null);
  const [newCoverFile, setNewCoverFile] = useState<File | null>(null);
  const [newCoverPreview, setNewCoverPreview] = useState<string | null>(null);

  const bookFileInputRef = useRef<HTMLInputElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const data = await getDepositDetail(id);
        setDeposit(data);
        if (data) {
          setTitle(data.metadata.title || "");
          setSubtitle(data.metadata.subtitle || "");
          setAuthorsStr(data.metadata.authors.join(", "));
          setYear(data.metadata.publication_year || 2026);
          setLanguage(data.metadata.language || "Français");
          setSummary(data.metadata.summary || "");
          setIsbn(data.metadata.isbn || "");
          setKeywordsStr(data.metadata.keywords?.join(", ") || "");

          setDiscipline(data.classification.discipline || "");
          setDeweyCode(data.classification.dewey_code || "");
          setCountry(data.classification.country || "BJ");
          setUniversity(data.classification.university || "");
          setFaculty(data.classification.faculty || "");
          setDepartment(data.classification.department || "");
          setTargetAudience(data.classification.target_audience || "");

          setFormat(data.files.format || "PDF");
          setPriceDigital(data.default_price || 5000);
          setIsPaperAvailable(Boolean(data.is_paper_available));
          setPricePaper(data.admin_price || 7500);
        }
      } catch (err) {
        toast.error("Impossible de charger le dépôt.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  const handleRunAiAnalysis = async (customFile?: File) => {
    setAiLoading(true);
    toast.info("Analyse IA en cours (OpenAI & PyMuPDF)...");
    try {
      const fileToAnalyze = customFile || newBookFile || undefined;
      const filenameToAnalyze = fileToAnalyze?.name || deposit?.files.book_file_name || deposit?.metadata.title || "ouvrage.pdf";
      const res = await extractBookMetadataWithAi(fileToAnalyze, filenameToAnalyze, summary || title);
      
      if (res.success && res.data) {
        setAiResult(res.data);
        toast.success("Suggestions IA générées avec succès ! Vous pouvez appliquer champ par champ ou tout appliquer.");
      } else {
        toast.error(res.error || "Erreur lors de l'analyse IA.");
      }
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'analyse IA.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleApplyAllAi = () => {
    if (!aiResult) return;
    if (aiResult.title) setTitle(aiResult.title);
    if (aiResult.subtitle) setSubtitle(aiResult.subtitle);
    if (aiResult.authors?.length) setAuthorsStr(aiResult.authors.join(", "));
    if (aiResult.publication_year) setYear(aiResult.publication_year);
    if (aiResult.language) setLanguage(aiResult.language);
    if (aiResult.summary) setSummary(aiResult.summary);
    if (aiResult.isbn) setIsbn(aiResult.isbn);
    if (aiResult.keywords?.length) setKeywordsStr(aiResult.keywords.join(", "));
    if (aiResult.genre_category) setDiscipline(aiResult.genre_category);
    if (aiResult.dewey_code) setDeweyCode(aiResult.dewey_code);
    if (aiResult.institution_suggestion) setUniversity(aiResult.institution_suggestion);
    if (aiResult.faculty_suggestion) setFaculty(aiResult.faculty_suggestion);
    if (aiResult.department_suggestion) setDepartment(aiResult.department_suggestion);
    if (aiResult.target_audience) setTargetAudience(aiResult.target_audience);
    if (aiResult.country) setCountry(aiResult.country);
    toast.success("Toutes les métadonnées et classifications suggérées par l'IA ont été appliquées !");
  };

  const handleCoverSelect = (file: File) => {
    setNewCoverFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setNewCoverPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSaveCoverOnly = async () => {
    if (!deposit || !newCoverFile) return;
    setSavingCover(true);
    try {
      const updated = await updateDeposit(
        deposit.id,
        {
          metadata: deposit.metadata,
          classification: deposit.classification,
          files: deposit.files,
          default_price: deposit.default_price,
          admin_price: deposit.admin_price,
          is_paper_available: deposit.is_paper_available,
        },
        null,
        newCoverFile
      );

      if (updated) {
        setDeposit(updated);
        setNewCoverFile(null);
        setNewCoverPreview(null);
        toast.success("Nouvelle image de couverture enregistrée avec succès !");
      } else {
        toast.error("Erreur lors de la mise à jour de la couverture.");
      }
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'enregistrement de la couverture.");
    } finally {
      setSavingCover(false);
    }
  };

  const handleSave = async () => {
    if (!deposit) return;
    setSaving(true);
    try {
      const keywordsArray = keywordsStr
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean);

      const updated = await updateDeposit(
        deposit.id,
        {
          metadata: {
            ...deposit.metadata,
            title,
            subtitle,
            authors: authorsStr.split(",").map((a) => a.trim()).filter(Boolean),
            publication_year: Number(year),
            language,
            summary,
            isbn,
            keywords: keywordsArray,
          },
          classification: {
            ...deposit.classification,
            discipline,
            dewey_code: deweyCode,
            country,
            university,
            faculty,
            department,
            target_audience: targetAudience,
          },
          files: {
            ...deposit.files,
            format,
          },
          default_price: Number(priceDigital),
          admin_price: Number(pricePaper),
          is_paper_available: isPaperAvailable,
        },
        newBookFile,
        newCoverFile
      );

      if (updated) {
        setDeposit(updated);
        setNewBookFile(null);
        setNewCoverFile(null);
        setNewCoverPreview(null);
        toast.success("Modifications enregistrées avec succès.");
      } else {
        toast.error("Erreur lors de la sauvegarde. Veuillez réessayer.");
      }
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la sauvegarde.");
    } finally {
      setSaving(false);
    }
  };

  const handleResubmit = async () => {
    if (!deposit) return;
    setSaving(true);
    try {
      const keywordsArray = keywordsStr
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean);

      const updated = await updateDeposit(
        deposit.id,
        {
          metadata: {
            ...deposit.metadata,
            title,
            subtitle,
            authors: authorsStr.split(",").map((a) => a.trim()).filter(Boolean),
            publication_year: Number(year),
            language,
            summary,
            isbn,
            keywords: keywordsArray,
          },
          classification: {
            ...deposit.classification,
            discipline,
            dewey_code: deweyCode,
            country,
            university,
            faculty,
            department,
            target_audience: targetAudience,
          },
          files: {
            ...deposit.files,
            format,
          },
          default_price: Number(priceDigital),
          admin_price: Number(pricePaper),
          is_paper_available: isPaperAvailable,
        },
        newBookFile,
        newCoverFile
      );

      if (updated) {
        const submitted = await submitDepositForValidation(deposit.id);
        if (submitted) {
          toast.success("Corrections soumises au Chef Maquettiste avec succès !");
          router.push("/layout-artist/deposits");
          return;
        }
      }
      toast.error("Erreur lors de la resoumission. Veuillez réessayer.");
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la resoumission.");
    } finally {
      setSaving(false);
    }
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
    <div className="p-3.5 sm:p-6 md:p-8 w-full max-w-5xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/layout-artist" className="hover:text-navy">Vue d&apos;ensemble</Link>
        <span>/</span>
        <Link href="/layout-artist/deposits" className="hover:text-navy">Mes Dépôts</Link>
        <span>/</span>
        <span className="text-navy font-semibold truncate max-w-[220px]">{deposit.metadata.title}</span>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-5 space-y-4">
        <Link href="/layout-artist/deposits" className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline">
          <ArrowLeft className="w-3.5 h-3.5" />
          Retour à mes dépôts
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="font-serif text-xl sm:text-2xl font-bold text-navy">{deposit.metadata.title}</h1>
            <p className="text-xs text-foreground-muted mt-0.5">
              Déposé le {new Date(deposit.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Bouton Lancer Analyse IA */}
            <button
              type="button"
              onClick={() => handleRunAiAnalysis()}
              disabled={aiLoading}
              className="px-3.5 py-2 rounded-xl bg-gold/15 hover:bg-gold/25 border border-gold/40 text-gold text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer min-h-[40px]"
              title="Analyser le document avec l'Intelligence Artificielle pour extraire et suggérer des métadonnées"
            >
              {aiLoading ? (
                <span className="w-3.5 h-3.5 border-2 border-gold border-t-transparent rounded-full animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-gold" />
              )}
              <span>{aiLoading ? "Analyse en cours..." : "Assistant IA"}</span>
            </button>

            <Link
              href={`/catalog/reader/${deposit.id}`}
              target="_blank"
              className="px-4 py-2 rounded-xl bg-navy hover:bg-navy-hover text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer min-h-[40px]"
            >
              <BookOpen className="w-4 h-4 text-gold" />
              Lire dans la Liseuse
            </Link>
            <StatusBadge status={deposit.status} />
          </div>
        </div>
      </div>

      {/* Bannière Suggestions IA globales si générées */}
      {aiResult && (
        <div className="p-4 rounded-2xl bg-gold/10 border border-gold/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gold/20 text-gold flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-navy">
                Suggestions IA prêtes pour l&apos;ensemble de la notice
              </p>
              <p className="text-[11px] text-foreground-muted">
                Vous pouvez insérer les valeurs suggérées champ par champ ou appliquer l&apos;ensemble en un clic.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleApplyAllAi}
            className="px-4 py-2 rounded-xl bg-navy hover:bg-navy-hover text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors shrink-0 cursor-pointer min-h-[38px]"
          >
            <Wand2 className="w-3.5 h-3.5 text-gold" />
            Tout Appliquer
          </button>
        </div>
      )}

      {/* Message de révision si revision_requested */}
      {deposit.status === "revision_requested" && (
        <div className="p-5 rounded-3xl bg-error/5 border border-error/20 space-y-2">
          <div className="flex items-center gap-2 text-error font-bold text-xs uppercase tracking-wider">
            <AlertCircle className="w-4 h-4" />
            Demande de correction du Chef Maquettiste
          </div>
          <p className="text-xs text-foreground bg-background p-3.5 rounded-2xl border border-border italic font-medium">
            &ldquo;{deposit.chef_comment || "Veuillez vérifier et corriger les métadonnées et fichiers de l'ouvrage."}&rdquo;
          </p>
          <p className="text-[11px] text-foreground-muted">
            Apportez les modifications requises ci-dessous sur chaque bloc puis cliquez sur &quot;Soumettre les corrections au Chef Maquettiste&quot;.
          </p>
        </div>
      )}

      {/* Formulaire complet des 4 étapes */}
      <div className="space-y-6">
        {/* BLOC 1 : FICHIERS & COUVERTURE */}
        <div className="p-5 sm:p-6 rounded-3xl bg-background-secondary border border-border space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="font-serif font-bold text-navy text-sm sm:text-base flex items-center gap-2">
              <Upload className="w-4 h-4 text-gold" />
              1. Fichiers de l&apos;Épreuve &amp; Couverture
            </h3>
            <span className="text-[11px] text-foreground-muted font-mono">Format actuel : {format}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Fichier Ouvrage */}
            <div className="p-4 rounded-2xl bg-background border border-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-navy flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-gold" />
                  Document original de l&apos;ouvrage
                </span>
                {newBookFile && (
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                    Nouveau fichier sélectionné
                  </span>
                )}
              </div>

              <div className="p-3 rounded-xl bg-background-secondary border border-border text-xs">
                <p className="font-bold text-navy truncate">
                  {newBookFile ? newBookFile.name : (deposit.files.book_file_name || `${deposit.metadata.title}.pdf`)}
                </p>
                <p className="text-[11px] text-foreground-muted mt-0.5">
                  {newBookFile
                    ? `${(newBookFile.size / (1024 * 1024)).toFixed(2)} Mo`
                    : deposit.files.book_file_size
                      ? `${(deposit.files.book_file_size / (1024 * 1024)).toFixed(2)} Mo`
                      : "Document chargé"}
                </p>
              </div>

              <div>
                <input
                  ref={bookFileInputRef}
                  type="file"
                  accept=".pdf,.epub"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      const f = e.target.files[0];
                      setNewBookFile(f);
                      handleRunAiAnalysis(f);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => bookFileInputRef.current?.click()}
                  className="w-full py-2 px-3 rounded-xl border border-border bg-background hover:bg-background-secondary text-xs font-bold text-navy flex items-center justify-center gap-2 transition-colors cursor-pointer min-h-[38px]"
                >
                  <Upload className="w-3.5 h-3.5 text-gold" />
                  {newBookFile ? "Changer le fichier sélectionné" : "Remplacer le fichier PDF / EPUB"}
                </button>
              </div>
            </div>

            {/* Couverture */}
            <div className="p-4 rounded-2xl bg-background border border-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-navy flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-gold" />
                  Couverture de l&apos;ouvrage
                </span>
                {newCoverFile && (
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                    Nouvelle image prête
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <BookCover3D
                  title={title || deposit.metadata.title}
                  authors={authorsStr ? authorsStr.split(",") : deposit.metadata.authors}
                  discipline={discipline || deposit.classification.discipline}
                  coverUrl={newCoverPreview || deposit.files.cover_url}
                  size="xs"
                />
                <div className="text-xs min-w-0">
                  <p className="font-semibold text-navy truncate">
                    {newCoverFile ? newCoverFile.name : (deposit.files.cover_name || "Couverture actuelle")}
                  </p>
                  <p className="text-[11px] text-foreground-muted mt-0.5">Rendu 3D généré automatiquement</p>
                </div>
              </div>

              <div className="space-y-2">
                <input
                  ref={coverFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleCoverSelect(e.target.files[0]);
                  }}
                />
                <button
                  type="button"
                  onClick={() => coverFileInputRef.current?.click()}
                  className="w-full py-2 px-3 rounded-xl border border-border bg-background hover:bg-background-secondary text-xs font-bold text-navy flex items-center justify-center gap-2 transition-colors cursor-pointer min-h-[38px]"
                >
                  <Upload className="w-3.5 h-3.5 text-gold" />
                  {newCoverFile ? "Changer la couverture sélectionnée" : "Remplacer l'image de couverture"}
                </button>

                {newCoverFile && (
                  <button
                    type="button"
                    onClick={handleSaveCoverOnly}
                    disabled={savingCover}
                    className="w-full py-2 px-3 rounded-xl bg-gold text-navy text-xs font-bold hover:bg-gold-light transition-colors flex items-center justify-center gap-2 cursor-pointer min-h-[38px] shadow-sm"
                  >
                    {savingCover ? (
                      <span className="w-4 h-4 border-2 border-navy/30 border-t-navy rounded-full animate-spin" />
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        Enregistrer la nouvelle image de couverture
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* BLOC 2 : MÉTADONNÉES ÉDITORIALES */}
        <div className="p-5 sm:p-6 rounded-3xl bg-background-secondary border border-border space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
            <h3 className="font-serif font-bold text-navy text-sm sm:text-base flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-gold" />
              2. Notice Éditoriale Complète
            </h3>
            <AISuggestionBadge source={aiResult ? "ai_suggested" : deposit.metadata.language_source} />
          </div>

          {/* Pré-édition liée */}
          {(deposit.metadata.pre_edition_code || deposit.pre_edition_dossier) && (
            <div className="p-3.5 bg-background border border-border rounded-2xl flex items-center gap-3 text-xs">
              <div className="w-7 h-7 rounded-lg bg-gold/10 text-gold flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-navy">
                  Rattaché au dossier pré-édition : <span className="font-mono text-gold">{deposit.metadata.pre_edition_code || deposit.pre_edition_dossier?.code_dossier}</span>
                </p>
                <p className="text-[11px] text-foreground-muted truncate">
                  {deposit.metadata.pre_edition_title || deposit.pre_edition_dossier?.titre_previsionnel}
                </p>
              </div>
            </div>
          )}

          <div className="space-y-3.5 text-xs">
            {/* Titre & Sous-titre */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block font-semibold text-navy">Titre de l&apos;ouvrage *</label>
                  {aiResult?.title && aiResult.title !== title && (
                    <button
                      type="button"
                      onClick={() => setTitle(aiResult.title)}
                      className="text-[11px] font-bold text-gold hover:underline inline-flex items-center gap-1 cursor-pointer"
                      title={aiResult.title}
                    >
                      <Wand2 className="w-3 h-3" />
                      IA : « {aiResult.title.slice(0, 24)}... »
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground min-h-[42px] font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block font-semibold text-navy">Sous-titre (Optionnel)</label>
                  {aiResult?.subtitle && aiResult.subtitle !== subtitle && (
                    <button
                      type="button"
                      onClick={() => setSubtitle(aiResult.subtitle || "")}
                      className="text-[11px] font-bold text-gold hover:underline inline-flex items-center gap-1 cursor-pointer"
                      title={aiResult.subtitle}
                    >
                      <Wand2 className="w-3 h-3" />
                      IA : « {aiResult.subtitle.slice(0, 22)}... »
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Ex : Manuel pratique et analyse critique"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground min-h-[42px]"
                />
              </div>
            </div>

            {/* Auteurs, Année & Langue */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="sm:col-span-1 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block font-semibold text-navy">Auteur(s) *</label>
                  {aiResult?.authors?.length && (
                    <button
                      type="button"
                      onClick={() => setAuthorsStr(aiResult.authors.join(", "))}
                      className="text-[11px] font-bold text-gold hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                    >
                      <Wand2 className="w-2.5 h-2.5" />
                      IA
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={authorsStr}
                  onChange={(e) => setAuthorsStr(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground min-h-[42px]"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block font-semibold text-navy">Année de publication</label>
                  {aiResult?.publication_year && (
                    <button
                      type="button"
                      onClick={() => setYear(aiResult.publication_year)}
                      className="text-[11px] font-bold text-gold hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                    >
                      <Wand2 className="w-2.5 h-2.5" />
                      IA
                    </button>
                  )}
                </div>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground min-h-[42px]"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block font-semibold text-navy">Langue de l&apos;ouvrage</label>
                  {aiResult?.language && (
                    <button
                      type="button"
                      onClick={() => setLanguage(aiResult.language)}
                      className="text-[11px] font-bold text-gold hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                    >
                      <Wand2 className="w-2.5 h-2.5" />
                      IA : {aiResult.language}
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground min-h-[42px]"
                />
              </div>
            </div>

            {/* Code ISBN & Mots-clés */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <label className="block font-semibold text-navy">Code ISBN</label>
                    {aiResult?.isbn && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                        aiResult.isbn_found_in_document
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-gold/15 text-gold"
                      }`}>
                        {aiResult.isbn_found_in_document ? "Extrait du PDF" : "Proposition IA"}
                      </span>
                    )}
                  </div>
                  {aiResult?.isbn && (
                    <button
                      type="button"
                      onClick={() => setIsbn(aiResult.isbn)}
                      className="text-[11px] font-bold text-gold hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                    >
                      <Wand2 className="w-2.5 h-2.5" />
                      Appliquer : {aiResult.isbn}
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={isbn}
                  onChange={(e) => setIsbn(e.target.value)}
                  placeholder="978-..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground min-h-[42px] font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block font-semibold text-navy">Mots-clés (Optionnel)</label>
                  {aiResult?.keywords?.length && (
                    <button
                      type="button"
                      onClick={() => setKeywordsStr(aiResult.keywords.join(", "))}
                      className="text-[11px] font-bold text-gold hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                    >
                      <Wand2 className="w-2.5 h-2.5" />
                      Insérer tags IA
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={keywordsStr}
                  onChange={(e) => setKeywordsStr(e.target.value)}
                  placeholder="Ex : Droit, Obligations, Contrat, Philosophie"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground min-h-[42px]"
                />
              </div>
            </div>

            {/* Résumé */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block font-semibold text-navy">Résumé éditorial</label>
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
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={4}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground resize-none leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* BLOC 3 : CLASSIFICATION ACADÉMIQUE */}
        <div className="p-5 sm:p-6 rounded-3xl bg-background-secondary border border-border space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
            <h3 className="font-serif font-bold text-navy text-sm sm:text-base flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-gold" />
              3. Classification Académique &amp; Structurelle
            </h3>
            <AISuggestionBadge source={aiResult ? "ai_suggested" : deposit.classification.source} />
          </div>

          <div className="space-y-3.5 text-xs">
            {/* Discipline & Dewey */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block font-semibold text-navy">Discipline académique *</label>
                  {aiResult?.genre_category && (
                    <button
                      type="button"
                      onClick={() => setDiscipline(aiResult.genre_category)}
                      className="text-[11px] font-bold text-gold hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                    >
                      <Wand2 className="w-2.5 h-2.5" />
                      IA : {aiResult.genre_category}
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={discipline}
                  onChange={(e) => setDiscipline(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground font-semibold min-h-[42px]"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block font-semibold text-navy">Indice / Code Dewey (Optionnel)</label>
                  {aiResult?.dewey_code && (
                    <button
                      type="button"
                      onClick={() => setDeweyCode(aiResult.dewey_code)}
                      className="text-[11px] font-bold text-gold hover:underline inline-flex items-center gap-0.5 cursor-pointer"
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
                  placeholder="Ex : 340 (Droit), 100 (Philosophie)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground font-mono min-h-[42px]"
                />
              </div>
            </div>

            {/* Université & Faculté */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block font-semibold text-navy">Université / Établissement (Optionnel)</label>
                  {aiResult?.institution_suggestion && (
                    <button
                      type="button"
                      onClick={() => setUniversity(aiResult.institution_suggestion || "")}
                      className="text-[11px] font-bold text-gold hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                    >
                      <Wand2 className="w-2.5 h-2.5" />
                      IA : {aiResult.institution_suggestion.length > 25 ? `${aiResult.institution_suggestion.slice(0, 25)}...` : aiResult.institution_suggestion}
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  placeholder="Ex : Université d'Abomey-Calavi (UAC)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground min-h-[42px]"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block font-semibold text-navy">Faculté / UFR (Optionnel)</label>
                  {aiResult?.faculty_suggestion && (
                    <button
                      type="button"
                      onClick={() => setFaculty(aiResult.faculty_suggestion || "")}
                      className="text-[11px] font-bold text-gold hover:underline inline-flex items-center gap-0.5 cursor-pointer"
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
                  placeholder="Ex : Faculté de Droit et de Science Politique (FADESP)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground min-h-[42px]"
                />
              </div>
            </div>

            {/* Département, Public Cible & Pays */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block font-semibold text-navy">Département (Optionnel)</label>
                  {aiResult?.department_suggestion && (
                    <button
                      type="button"
                      onClick={() => setDepartment(aiResult.department_suggestion || "")}
                      className="text-[11px] font-bold text-gold hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                    >
                      <Wand2 className="w-2.5 h-2.5" />
                      IA
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="Ex : Droit Privé, Philosophie"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground min-h-[42px]"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block font-semibold text-navy">Public Cible (Optionnel)</label>
                  {aiResult?.target_audience && (
                    <button
                      type="button"
                      onClick={() => setTargetAudience(aiResult.target_audience)}
                      className="text-[11px] font-bold text-gold hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                    >
                      <Wand2 className="w-2.5 h-2.5" />
                      IA
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="Ex : Licence, Master, Doctorat, Grand Public"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground min-h-[42px]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-semibold text-navy">Code Pays (ISO)</label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="BJ, CI, SN, BR, etc."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground font-mono min-h-[42px]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* BLOC 4 : COMMERCIALISATION & PROTECTION DRM */}
        <div className="p-5 sm:p-6 rounded-3xl bg-background-secondary border border-border space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
            <h3 className="font-serif font-bold text-navy text-sm sm:text-base flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-gold" />
              4. Tarification, Format &amp; Protection DRM
            </h3>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-gold" />
              <StatusBadge status="approved" leftLabel="Tatouage &amp; DRM LCP Actifs" />
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-navy mb-1">Format de publication</label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground font-semibold min-h-[42px]"
                >
                  <option value="PDF">PDF (Mise en page fixe sécurisée)</option>
                  <option value="EPUB">EPUB (Texte recomposable)</option>
                  <option value="AUDIO">AUDIO (Livre audio)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-navy mb-1">Prix Numérique (FCFA) *</label>
                <input
                  type="number"
                  value={priceDigital}
                  onChange={(e) => setPriceDigital(Number(e.target.value))}
                  min={0}
                  step={500}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground font-bold min-h-[42px]"
                />
              </div>
            </div>

            {/* Option Papier */}
            <div className="p-4 rounded-2xl bg-background border border-border space-y-3">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isPaperAvailable}
                  onChange={(e) => setIsPaperAvailable(e.target.checked)}
                  className="w-4 h-4 rounded border-border text-navy focus:ring-navy cursor-pointer"
                />
                <span className="font-bold text-navy text-xs">
                  Disponible également en version imprimée (Livre Papier)
                </span>
              </label>

              {isPaperAvailable && (
                <div className="pt-2 pl-7">
                  <label className="block font-semibold text-navy mb-1">Prix Version Papier (FCFA)</label>
                  <input
                    type="number"
                    value={pricePaper}
                    onChange={(e) => setPricePaper(Number(e.target.value))}
                    min={0}
                    step={500}
                    className="w-full max-w-xs px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground font-bold min-h-[42px]"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Actions de sauvegarde & resoumission */}
      <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-border">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-border bg-background text-navy text-xs font-bold hover:bg-background-secondary transition-colors flex items-center justify-center gap-2 min-h-[44px] cursor-pointer"
        >
          <Save className="w-4 h-4 text-gold" />
          Enregistrer les modifications
        </button>

        {deposit.status === "revision_requested" && (
          <button
            type="button"
            onClick={handleResubmit}
            disabled={saving}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gold text-navy text-xs font-bold hover:bg-gold-light transition-colors flex items-center justify-center gap-2 min-h-[44px] shadow-sm cursor-pointer"
          >
            {saving ? (
              <span className="w-4 h-4 border-2 border-navy/30 border-t-navy rounded-full animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                Soumettre les corrections au Chef Maquettiste
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
