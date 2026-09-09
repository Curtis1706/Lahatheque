"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  User, 
  Sparkles, 
  FileText, 
  Globe, 
  BookOpen, 
  FileCode, 
  Check, 
  Layers,
  GraduationCap,
  Headphones,
  Languages,
  Search,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { AISuggestionBadge } from "@/components/features/layout-artist/ai-suggestion-badge";
import { VitrinePreviewCard } from "@/components/features/chief-layout/vitrine-preview-card";
import { RevisionModal } from "@/components/features/chief-layout/revision-modal";
import { getDepositDetail, validateDeposit, requestRevision, updateDeposit } from "@/lib/services/layout-artist";
import { InlineLoader } from "@/components/ui/page-loader";
import { useAudioPlayer } from "@/components/features/audio/audio-player-context";
import { AudioReplacementDropzone } from "@/components/features/layout-artist/audio-replacement-dropzone";
import type { LayoutDeposit } from "@/lib/types/layout-artist";
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

export default function ChefValidationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { playBook } = useAudioPlayer();

  const [deposit, setDeposit] = useState<LayoutDeposit | null>(null);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [revisionModalOpen, setRevisionModalOpen] = useState(false);
  const [showXmlNotice, setShowXmlNotice] = useState(false);
  const [priceDigital, setPriceDigital] = useState<number>(5000);
  const [pricePaper, setPricePaper] = useState<number>(7500);
  const [isPaperAvailable, setIsPaperAvailable] = useState(false);

  // Translation & Language Adjustment State
  const [isOriginal, setIsOriginal] = useState<boolean>(true);
  const [originalLanguage, setOriginalLanguage] = useState<string>("fr");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("Français");
  const [allEligibleBooks, setAllEligibleBooks] = useState<any[]>([]);
  const [selectedParentBook, setSelectedParentBook] = useState<any | null>(null);
  const [parentBookSearch, setParentBookSearch] = useState("");
  const [isParentBookOpen, setIsParentBookOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [data, eligibleRes] = await Promise.all([
          getDepositDetail(id),
          fetch("/api/bff/audio/eligible-books/?limit=all", { credentials: "include" })
            .then((r) => r.json())
            .catch(() => ({ data: [] })),
        ]);

        setDeposit(data);
        const eligibleList = eligibleRes?.data || eligibleRes?.results || [];
        setAllEligibleBooks(eligibleList);

        if (data) {
          if (data.default_price) setPriceDigital(data.default_price);
          if (data.is_paper_available !== undefined) setIsPaperAvailable(data.is_paper_available);
          
          const isOrig = data.is_original !== false;
          setIsOriginal(isOrig);
          const origLang = data.original_language || (data.metadata?.language ? LABEL_TO_LANG_CODE[data.metadata.language] : "fr") || "fr";
          setOriginalLanguage(origLang);
          setSelectedLanguage(data.metadata?.language || LANG_CODE_TO_LABEL[origLang] || "Français");

          if (!isOrig) {
            if (data.parent_ouvrage_id || data.parent_ouvrage_title) {
              const matched = eligibleList.find((b: any) => String(b.id) === String(data.parent_ouvrage_id));
              if (matched) {
                setSelectedParentBook(matched);
              } else {
                setSelectedParentBook({
                  id: data.parent_ouvrage_id || "linked",
                  title: data.parent_ouvrage_title || "Ouvrage de référence",
                  author: data.metadata?.authors?.[0] || "",
                });
              }
            }
          }
        }
      } catch (err) {
        toast.error("Impossible de charger les détails du dépôt.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  const handleValidate = async () => {
    if (!deposit) return;
    setValidating(true);
    try {
      // Sauvegarde préalable des corrections linguistiques et de rattachement
      await updateDeposit(deposit.id, {
        metadata: {
          ...deposit.metadata,
          language: isOriginal ? (LANG_CODE_TO_LABEL[originalLanguage] || "Français") : selectedLanguage,
        },
        is_original: isOriginal,
        original_language: isOriginal ? originalLanguage : (selectedParentBook?.original_language || "fr"),
        parent_ouvrage_id: !isOriginal && selectedParentBook ? String(selectedParentBook.id) : undefined,
      } as any);

      const success = await validateDeposit(
        deposit.id,
        undefined,
        priceDigital,
        isPaperAvailable ? pricePaper : 0,
        isPaperAvailable
      );
      if (success) {
        toast.success("Ouvrage validé avec succès ! Transmis au Juriste pour vérification contractuelle avant publication.");
        router.push("/chief-layout/validation");
      }
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la validation.");
    } finally {
      setValidating(false);
    }
  };

  const handleConfirmRevision = async (comment: string) => {
    if (!deposit) return;
    const success = await requestRevision(deposit.id, comment);
    if (success) {
      toast.info("Demande de retouche transmise au maquettiste avec succès.");
      router.push("/chief-layout/validation");
    }
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 md:p-8 w-full max-w-5xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-background-secondary rounded-xl" />
        <div className="h-64 bg-background-secondary rounded-3xl" />
      </div>
    );
  }

  if (!deposit) {
    return (
      <div className="p-4 sm:p-6 md:p-8 w-full max-w-5xl mx-auto text-center space-y-4">
        <FileText className="w-12 h-12 text-foreground-muted mx-auto" />
        <h2 className="font-serif font-bold text-navy text-xl">Dépôt introuvable</h2>
        <Link href="/chief-layout/validation" className="text-xs text-gold font-bold hover:underline">
          Retour à la liste des dépôts
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/chief-layout" className="hover:text-navy">Vue d&apos;ensemble</Link>
        <span>/</span>
        <Link href="/chief-layout/validation" className="hover:text-navy">Dépôts à valider</Link>
        <span>/</span>
        <span className="text-navy font-semibold truncate max-w-[200px]">{deposit.metadata.title}</span>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/chief-layout/validation" className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Retour à la liste à valider
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
            <User className="w-4 h-4 text-gold" />
            Maquettiste : {deposit.maquettiste_name}
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            {deposit.metadata.title}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <StatusBadge status={deposit.status} />
        </div>
      </div>

      {/* Aperçu Fiche Vitrine 3D */}
      <VitrinePreviewCard deposit={deposit} />

      {/* Bouton Feuilleter / Inspecter le document */}
      <div className="p-5 rounded-3xl bg-background border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gold/15 text-gold shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-serif font-bold text-sm text-navy">Contrôle Visuel de l&apos;Épreuve</h4>
            <p className="text-xs text-foreground-muted">
              Format {deposit.files.format} • Typographie, mise en page et tables des matières
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowXmlNotice(!showXmlNotice)}
            className="px-4 py-2 rounded-xl border border-border text-xs font-bold text-navy hover:bg-background-secondary flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileCode className="w-4 h-4 text-gold" />
            {showXmlNotice ? "Masquer notice ONIX 3.0" : "Inspecter notice ONIX 3.0"}
          </button>

          <button
            type="button"
            onClick={() => playBook(deposit.id)}
            className="px-4 py-2 rounded-xl bg-gold/15 hover:bg-gold/25 border border-gold/40 text-navy text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            title="Écouter la piste audio (Privilège Chef Maquettiste)"
          >
            <Headphones className="w-4 h-4 text-gold" />
            <span>Écouter l&apos;audio</span>
          </button>

          {((deposit as any).is_digital_available !== false && (deposit as any).format_type !== "audio") && (
            <Link
              href={`/catalog/reader/${deposit.id}`}
              target="_blank"
              className="px-5 py-2.5 rounded-xl bg-navy hover:bg-navy-hover text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-gold" />
              Lire dans la Liseuse LAHAThèque
            </Link>
          )}
        </div>
      </div>

      {/* Notice ONIX 3.0 Dépliable */}
      {showXmlNotice && (
        <div className="p-5 rounded-3xl bg-navy text-white border border-navy-hover space-y-2 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-navy-hover pb-2">
            <span className="font-bold text-xs text-gold uppercase tracking-wider flex items-center gap-1.5">
              <FileCode className="w-4 h-4" />
              Notice Standardisée ONIX 3.0 Release 3.0 (EDItEUR)
            </span>
            <span className="text-[10px] text-white/60 font-mono">Prêt pour export</span>
          </div>
          <pre className="p-3 rounded-xl bg-navy-dark text-[10px] font-mono text-white/80 max-h-48 overflow-y-auto border border-navy-hover">
{`<?xml version="1.0" encoding="UTF-8"?>
<ONIXMessage release="3.0" xmlns="http://ns.editeur.org/onix/3.0/reference">
  <Header>
    <Sender><SenderName>LAHA Editions</SenderName></Sender>
  </Header>
  <Product>
    <RecordReference>LAHA-${deposit.id}</RecordReference>
    <NotificationType>03</NotificationType>
    <DescriptiveDetail>
      <TitleDetail><TitleText>${deposit.metadata.title}</TitleText></TitleDetail>
      <Contributor><PersonName>${deposit.metadata.authors.join(", ")}</PersonName></Contributor>
      <Language><LanguageCode>${deposit.metadata.language === "Français" ? "fre" : "eng"}</LanguageCode></Language>
      <Subject><SubjectHeadingText>${deposit.classification.discipline}</SubjectHeadingText></Subject>
    </DescriptiveDetail>
  </Product>
</ONIXMessage>`}
          </pre>
        </div>
      )}

      {/* Informations Détaillées du Dépôt */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Métadonnées & Classification */}
        <div className="p-6 rounded-3xl bg-background-secondary border border-border space-y-4">
          <h3 className="text-sm font-bold text-navy flex items-center justify-between">
            <span>Métadonnées &amp; Classification</span>
            <AISuggestionBadge source={deposit.classification.source} />
          </h3>

          <div className="space-y-2.5 text-xs">
            <p><span className="text-foreground-muted font-medium">Titre :</span> <span className="font-semibold text-foreground">{deposit.metadata.title}</span></p>
            {deposit.metadata.subtitle && (
              <p><span className="text-foreground-muted font-medium">Sous-titre :</span> <span className="text-foreground">{deposit.metadata.subtitle}</span></p>
            )}
            <div>
              <span className="text-foreground-muted font-medium block mb-1">Auteur(s) &amp; Contributeurs :</span>
              <div className="flex flex-wrap gap-1.5">
                {deposit.metadata.authors.map((a, i) => (
                  <span key={i} className="px-2.5 py-0.5 rounded-lg bg-navy/5 text-navy font-semibold text-[11px] border border-navy/15">
                    {a}
                  </span>
                ))}
              </div>
            </div>
            {deposit.metadata.publisher_name && (
              <p><span className="text-foreground-muted font-medium">Maison d&apos;Édition :</span> <span className="text-foreground font-semibold">{deposit.metadata.publisher_name}</span></p>
            )}
            <p><span className="text-foreground-muted font-medium">Langue :</span> <span className="text-foreground font-semibold">{deposit.metadata.language}</span></p>
            {deposit.is_original === false && (
              <div className="p-2 rounded-xl bg-gold/10 border border-gold/30 text-navy font-semibold text-[11px]">
                Version Traduite {deposit.parent_ouvrage_title ? `rattachée à : ${deposit.parent_ouvrage_title}` : ""}
              </div>
            )}
            <p>
              <span className="text-foreground-muted font-medium">Discipline(s) :</span>{" "}
              <span className="text-foreground font-semibold">
                {deposit.classification.disciplines && deposit.classification.disciplines.length > 0
                  ? deposit.classification.disciplines.join(" • ")
                  : deposit.classification.discipline}
              </span>
            </p>
            {deposit.classification.country && (
              <p><span className="text-foreground-muted font-medium">Pays d&apos;Ancrage :</span> <span className="text-foreground font-semibold">{deposit.classification.country}</span></p>
            )}
            {deposit.classification.university && (
              <p className="flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5 text-gold shrink-0" />
                <span className="text-foreground">{deposit.classification.university} {deposit.classification.faculty ? `• ${deposit.classification.faculty}` : ""}</span>
              </p>
            )}
            <p className="pt-2 border-t border-border text-foreground-muted italic leading-relaxed">
              &ldquo;{deposit.metadata.summary || "Aucun résumé fourni."}&rdquo;
            </p>
          </div>
        </div>

        {/* Fichiers & Sécurité DRM */}
        <div className="p-6 rounded-3xl bg-background-secondary border border-border space-y-4">
          <h3 className="text-sm font-bold text-navy flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-gold" />
            Fichiers &amp; Sécurité DRM
          </h3>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-background border border-border">
              <span className="font-semibold text-navy">Format de l&apos;ouvrage</span>
              <span className="font-mono font-bold text-gold">{deposit.files.format}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-2xl bg-background border border-border">
              <span className="font-semibold text-navy">Protection &amp; Filigrane Numérique</span>
              <StatusBadge status="approved" leftLabel="Watermarking & DRM Actifs" />
            </div>
            <div className="flex items-center justify-between p-3 rounded-2xl bg-background border border-border">
              <span className="font-semibold text-navy">Synthèse Vocale Audio (TTS)</span>
              <span className="text-success font-bold">Compatible Lecteur</span>
            </div>
          </div>
        </div>
      </div>

      {/* Remplacement / Contrôle Audio */}
      <AudioReplacementDropzone
        bookId={deposit.id}
        bookTitle={deposit.metadata.title}
        currentDurationSeconds={(deposit as any).audio_duration_seconds}
        onSuccess={() => router.refresh()}
      />

      {/* Actions de Décision Éditoriale */}
      {deposit.status === "pending_validation" && (
        <div className="p-6 rounded-3xl bg-background border border-gold/40 shadow-md space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-gold" />
            <h3 className="text-sm font-bold text-navy">Décision de validation éditoriale</h3>
          </div>

          {/* Vérification & Ajustement Linguistique */}
          <div className="p-4 rounded-2xl bg-background-secondary border border-border space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-navy flex items-center gap-1.5">
                <Languages className="w-4 h-4 text-gold" />
                Vérification Linguistique &amp; Nature de l&apos;Ouvrage
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-navy block mb-1.5">Nature de l&apos;œuvre</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsOriginal(true);
                      setSelectedParentBook(null);
                    }}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      isOriginal
                        ? "bg-navy text-white shadow-xs"
                        : "bg-background text-foreground-muted hover:text-navy border border-border"
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5 text-gold" />
                    <span>Original</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsOriginal(false);
                      if (selectedLanguage.toLowerCase() === "français") {
                        setSelectedLanguage("Anglais");
                      }
                    }}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      !isOriginal
                        ? "bg-navy text-white shadow-xs"
                        : "bg-background text-foreground-muted hover:text-navy border border-border"
                    }`}
                  >
                    <Languages className="w-3.5 h-3.5 text-gold" />
                    <span>Traduction</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-navy block mb-1.5">
                  {isOriginal ? "Langue originale de l&apos;ouvrage" : "Langue de cette version traduite"}
                </label>
                {isOriginal ? (
                  <select
                    value={originalLanguage}
                    onChange={(e) => {
                      const code = e.target.value;
                      setOriginalLanguage(code);
                      setSelectedLanguage(LANG_CODE_TO_LABEL[code] || "Français");
                    }}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground font-semibold focus:ring-2 focus:ring-navy min-h-[38px]"
                  >
                    {AVAILABLE_LANGUAGES_LIST.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <select
                    value={LABEL_TO_LANG_CODE[selectedLanguage] || "en"}
                    onChange={(e) => {
                      const code = e.target.value;
                      setSelectedLanguage(LANG_CODE_TO_LABEL[code] || "Anglais");
                    }}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground font-semibold focus:ring-2 focus:ring-navy min-h-[38px]"
                  >
                    {AVAILABLE_LANGUAGES_LIST.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Si Traduction: sélection ou correction de l'ouvrage original de référence */}
            {!isOriginal && (
              <div className="pt-2 border-t border-border space-y-2">
                <label className="text-[11px] font-bold text-navy block">
                  Ouvrage original rattaché au catalogue *
                </label>
                {selectedParentBook ? (
                  <div className="p-3 bg-gold/10 border border-gold/40 rounded-xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-10 rounded bg-background border border-border overflow-hidden shrink-0 flex items-center justify-center">
                        {selectedParentBook.cover_url ? (
                          <img src={selectedParentBook.cover_url} alt={selectedParentBook.title} className="w-full h-full object-cover" />
                        ) : (
                          <BookOpen className="w-3.5 h-3.5 text-gold" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-navy truncate">{selectedParentBook.title}</p>
                        <p className="text-[11px] text-foreground-muted truncate">
                          Par {selectedParentBook.author || selectedParentBook.authors_display || "Auteur"}
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
                      className="w-full bg-background border border-border rounded-xl pl-9 pr-4 py-2 text-xs text-foreground focus:ring-2 focus:ring-navy min-h-[38px]"
                    />
                    {isParentBookOpen && (
                      <div className="absolute z-30 top-full mt-1 left-0 right-0 bg-background border border-border rounded-2xl shadow-xl max-h-48 overflow-y-auto divide-y divide-border">
                        {allEligibleBooks
                          .filter((b) =>
                            !parentBookSearch.trim() ||
                            (b.title && b.title.toLowerCase().includes(parentBookSearch.toLowerCase())) ||
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

          {/* Toggle Disponibilité Papier */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl border border-border bg-background-secondary">
            <div>
              <p className="text-xs font-bold text-navy">Disponible en version papier physique</p>
              <p className="text-[11px] text-foreground-muted">
                Active le format papier et l&apos;entrée en stock lors de la publication finale.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsPaperAvailable((v) => !v)}
              className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer shrink-0 ${isPaperAvailable ? "bg-gold" : "bg-border"}`}
              title={isPaperAvailable ? "Désactiver la version papier" : "Activer la version papier"}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${isPaperAvailable ? "translate-x-5" : ""}`} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-background-secondary border border-border">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-navy uppercase tracking-wider">Prix Numérique (FCFA)</label>
              <input
                type="number"
                step="500"
                value={priceDigital}
                onChange={(e) => setPriceDigital(parseFloat(e.target.value) || 0)}
                className="w-full bg-background border border-border rounded-xl p-2.5 text-xs text-foreground font-bold focus:ring-2 focus:ring-navy min-h-[40px]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-navy uppercase tracking-wider flex items-center justify-between">
                <span>Prix Papier (FCFA)</span>
                {!isPaperAvailable && (
                  <span className="text-[10px] font-normal text-foreground-muted lowercase">Non disponible</span>
                )}
              </label>
              <input
                type="number"
                step="500"
                disabled={!isPaperAvailable}
                value={isPaperAvailable ? pricePaper : 0}
                onChange={(e) => setPricePaper(parseFloat(e.target.value) || 0)}
                className={`w-full bg-background border border-border rounded-xl p-2.5 text-xs text-foreground font-bold focus:ring-2 focus:ring-navy min-h-[40px] transition-opacity ${
                  !isPaperAvailable ? "opacity-40 cursor-not-allowed bg-background-secondary" : ""
                }`}
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setRevisionModalOpen(true)}
              className="w-full sm:flex-1 px-4 py-3 rounded-2xl border border-error/30 bg-error/10 text-error font-bold text-xs hover:bg-error/20 transition-colors flex items-center justify-center gap-2 min-h-[44px] cursor-pointer"
            >
              <AlertCircle className="w-4 h-4" />
              Demander une correction
            </button>

            <button
              type="button"
              onClick={handleValidate}
              disabled={validating}
              className="w-full sm:flex-1 px-6 py-3 rounded-2xl bg-navy hover:bg-navy-hover text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50 min-h-[44px] shadow-sm cursor-pointer"
            >
              {validating ? (
                <InlineLoader size={16} />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-gold" />
                  Valider et Envoyer au Juriste
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Modale de révision */}
      {revisionModalOpen && (
        <RevisionModal
          deposit={deposit}
          isOpen={revisionModalOpen}
          onClose={() => setRevisionModalOpen(false)}
          onConfirm={handleConfirmRevision}
        />
      )}
    </div>
  );
}
