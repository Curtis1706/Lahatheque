"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, PlusCircle, Sparkles, Upload, Save, CheckCircle2, ShieldCheck, DollarSign, Tag, Info } from "lucide-react";
import { FileDropzone } from "@/components/features/layout-artist/file-dropzone";
import { createPublisherBook } from "@/lib/services/publisher";
import type { SalesModel } from "@/lib/types/publisher";

export default function NewPublisherBookPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);

  // Bloc 1: Identification
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [isbnDigital, setIsbnDigital] = useState("");
  const [isbnPrint, setIsbnPrint] = useState("");
  const [doi, setDoi] = useState("");
  const [language, setLanguage] = useState("Français");

  // Bloc 2: Contributeurs
  const [authors, setAuthors] = useState("");
  const [coAuthors, setCoAuthors] = useState("");

  // Bloc 3: Classification
  const [discipline, setDiscipline] = useState("Droit Public & Administration");
  const [keywords, setKeywords] = useState("droit, afrique, uac");
  const [targetAudience, setTargetAudience] = useState<"universitaire" | "professionnel" | "grand_public">("universitaire");
  const [aiClassifying, setAiClassifying] = useState(false);

  // Bloc 4: Commercial
  const [price, setPrice] = useState(12000);
  const [currency, setCurrency] = useState("XOF");
  const [salesModel, setSalesModel] = useState<SalesModel>("purchase");
  const [territories, setTerritories] = useState("Bénin, Togo, Côte d'Ivoire, Sénégal");

  // Bloc 5: Description & Visuels
  const [summary, setSummary] = useState("");
  const [authorsBio, setAuthorsBio] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);

  // Bloc 6: Droits & Licences
  const [licenceType, setLicenceType] = useState<"tous_droits_reserves" | "creative_commons">("tous_droits_reserves");
  const [submitting, setSubmitting] = useState(false);

  // Simulation suggestion IA classification & résumé
  const handleAiSuggest = () => {
    setAiClassifying(true);
    setTimeout(() => {
      setDiscipline("Droit Public & Administration");
      setKeywords("droit administratif, jurisprudence, uac, afrique de l'ouest");
      if (!summary) {
        setSummary(
          "Analyse doctrinale approfondie des grands principes du droit administratif comparé en Afrique francophone."
        );
      }
      setAiClassifying(false);
    }, 800);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !isbnDigital || !authors) return;

    setSubmitting(true);
    try {
      await createPublisherBook({
        title,
        subtitle,
        isbn_digital: isbnDigital,
        isbn_print: isbnPrint || undefined,
        doi: doi || undefined,
        authors: authors.split(",").map((a) => a.trim()).filter(Boolean),
        discipline,
        keywords: keywords.split(",").map((k) => k.trim()).filter(Boolean),
        target_audience: targetAudience,
        price,
        currency,
        sales_model: salesModel,
        allowed_territories: territories.split(",").map((t) => t.trim()).filter(Boolean),
        summary,
        authors_bio: authorsBio,
        licence_type: licenceType,
      });

      alert("L'ouvrage a été transmis avec succès ! Il entre désormais dans le flux de validation en 5 étapes.");
      router.push("/publisher/catalog");
    } catch (err) {
      alert("Erreur lors du dépôt.");
    } finally {
      setSubmitting(false);
    }
  };

  const stepLabels = [
    "1. Identification",
    "2. Contributeurs",
    "3. Classification (IA)",
    "4. Commercial",
    "5. Description & Visuels",
    "6. Droits & Licences",
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/publisher" className="hover:text-navy">Vue d&apos;ensemble</Link>
        <span>/</span>
        <Link href="/publisher/catalog" className="hover:text-navy">Catalogue</Link>
        <span>/</span>
        <span className="text-navy font-semibold">Nouveau Dépôt Web</span>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-4">
        <Link href="/publisher/catalog" className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-2">
          <ArrowLeft className="w-3.5 h-3.5" />
          Retour au Catalogue
        </Link>
        <h1 className="font-serif text-2xl font-bold text-navy">
          Nouveau Dépôt d&apos;Ouvrage (Formulaire 6 Blocs)
        </h1>
        <p className="text-xs text-foreground-muted mt-1">
          Remplissez les métadonnées de l&apos;œuvre selon les normes de la section 5.3 du Cahier des charges v3.2.
        </p>
      </div>

      {/* Stepper Navigation 6 Blocs */}
      <div className="flex items-center gap-1 border-b border-border pb-3 overflow-x-auto">
        {stepLabels.map((lbl, idx) => {
          const stepNum = idx + 1;
          const isActive = currentStep === stepNum;
          return (
            <button
              key={lbl}
              type="button"
              onClick={() => setCurrentStep(stepNum)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors border ${
                isActive
                  ? "bg-navy text-white border-navy"
                  : "bg-background-secondary text-foreground-muted border-border hover:text-navy"
              }`}
            >
              {lbl}
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Bloc 1: Identification */}
        {currentStep === 1 && (
          <div className="p-6 rounded-3xl bg-background border border-border space-y-4 shadow-xs">
            <h3 className="font-serif font-bold text-navy text-sm uppercase tracking-wider flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-gold" />
              Bloc 1 : Identification de l&apos;Œuvre
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label htmlFor="title" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">Titre Principal *</label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="ex. Traité de Droit Administratif Comparé"
                  className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl text-navy font-semibold focus:outline-none focus:border-gold min-h-[44px]"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="subtitle" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">Sous-titre (Optionnel)</label>
                <input
                  id="subtitle"
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="ex. Théorie générale et jurisprudence"
                  className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl text-navy min-h-[44px]"
                />
              </div>

              <div>
                <label htmlFor="isbn-digital" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">ISBN Numérique *</label>
                <input
                  id="isbn-digital"
                  type="text"
                  value={isbnDigital}
                  onChange={(e) => setIsbnDigital(e.target.value)}
                  placeholder="978-2-01-398010-4"
                  className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl font-mono text-navy font-bold focus:outline-none focus:border-gold min-h-[44px]"
                  required
                />
              </div>

              <div>
                <label htmlFor="isbn-print" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">ISBN Papier (Optionnel)</label>
                <input
                  id="isbn-print"
                  type="text"
                  value={isbnPrint}
                  onChange={(e) => setIsbnPrint(e.target.value)}
                  placeholder="978-2-01-398011-1"
                  className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl font-mono text-navy min-h-[44px]"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-5 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors"
              >
                Étape Suivante →
              </button>
            </div>
          </div>
        )}

        {/* Bloc 2: Contributeurs */}
        {currentStep === 2 && (
          <div className="p-6 rounded-3xl bg-background border border-border space-y-4 shadow-xs">
            <h3 className="font-serif font-bold text-navy text-sm uppercase tracking-wider flex items-center gap-2">
              <Tag className="w-4 h-4 text-gold" />
              Bloc 2 : Auteurs &amp; Contributeurs
            </h3>

            <div className="space-y-4">
              <div>
                <label htmlFor="authors" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">Auteur(s) Principal(aux) (séparés par des virgules) *</label>
                <input
                  id="authors"
                  type="text"
                  value={authors}
                  onChange={(e) => setAuthors(e.target.value)}
                  placeholder="ex. Prof. Augustin CHAKIROU, Dr. Honoré ZINSOU"
                  className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl text-navy font-semibold focus:outline-none focus:border-gold min-h-[44px]"
                  required
                />
              </div>

              <div>
                <label htmlFor="co-authors" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">Co-auteurs, Traducteurs, Préfaciers (Optionnel)</label>
                <input
                  id="co-authors"
                  type="text"
                  value={coAuthors}
                  onChange={(e) => setCoAuthors(e.target.value)}
                  placeholder="ex. Dr. Honoré ZINSOU (Traducteur)"
                  className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl text-navy min-h-[44px]"
                />
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-5 py-2.5 rounded-xl border border-border text-xs font-semibold text-foreground-muted"
              >
                ← Précédent
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="px-5 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors"
              >
                Étape Suivante →
              </button>
            </div>
          </div>
        )}

        {/* Bloc 3: Classification & IA */}
        {currentStep === 3 && (
          <div className="p-6 rounded-3xl bg-background border border-border space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-bold text-navy text-sm uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-gold" />
                Bloc 3 : Classification Thématique &amp; Assistance IA
              </h3>
              <button
                type="button"
                onClick={handleAiSuggest}
                disabled={aiClassifying}
                className="px-3 py-1.5 rounded-xl bg-gold/15 text-gold border border-gold/30 text-xs font-bold hover:bg-gold/25 transition-colors flex items-center gap-1.5"
              >
                {aiClassifying ? (
                  <span className="w-3.5 h-3.5 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-gold" />
                )}
                Suggérer par l&apos;IA
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="discipline" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">Discipline Académique *</label>
                <select
                  id="discipline"
                  value={discipline}
                  onChange={(e) => setDiscipline(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl text-navy font-semibold min-h-[44px]"
                >
                  <option value="Droit Public & Administration">Droit Public &amp; Administration</option>
                  <option value="Sciences Économiques">Sciences Économiques</option>
                  <option value="Médecine & Santé">Médecine &amp; Santé</option>
                  <option value="Agronomie & Environnement">Agronomie &amp; Environnement</option>
                </select>
              </div>

              <div>
                <label htmlFor="target-audience" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">Public Cible *</label>
                <select
                  id="target-audience"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl text-navy font-semibold min-h-[44px]"
                >
                  <option value="universitaire">Universitaire &amp; Chercheurs</option>
                  <option value="professionnel">Professionnel &amp; Praticiens</option>
                  <option value="grand_public">Grand Public</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="keywords" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">Mots-Clés Libres (séparés par des virgules)</label>
                <input
                  id="keywords"
                  type="text"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl text-navy min-h-[44px]"
                />
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-5 py-2.5 rounded-xl border border-border text-xs font-semibold text-foreground-muted"
              >
                ← Précédent
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="px-5 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors"
              >
                Étape Suivante →
              </button>
            </div>
          </div>
        )}

        {/* Bloc 4: Commercial */}
        {currentStep === 4 && (
          <div className="p-6 rounded-3xl bg-background border border-border space-y-4 shadow-xs">
            <h3 className="font-serif font-bold text-navy text-sm uppercase tracking-wider flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-gold" />
              Bloc 4 : Informations Commerciales &amp; Prix
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="price" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">Prix Unitaire *</label>
                <div className="relative">
                  <input
                    id="price"
                    type="number"
                    min="0"
                    step="500"
                    value={price}
                    onChange={(e) => setPrice(parseInt(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 text-xs font-mono font-bold bg-background-secondary border border-border rounded-xl text-navy min-h-[44px]"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono font-bold text-gold text-xs">{currency}</span>
                </div>
              </div>

              <div>
                <label htmlFor="sales-model" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">Modèle de Vente *</label>
                <select
                  id="sales-model"
                  value={salesModel}
                  onChange={(e) => setSalesModel(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl text-navy font-semibold min-h-[44px]"
                >
                  <option value="purchase">Vente Unitaire</option>
                  <option value="subscription">Bouquet &amp; Abonnement</option>
                  <option value="free">Accès Libre / Open Access</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="territories" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">Territoires Autorisés</label>
                <input
                  id="territories"
                  type="text"
                  value={territories}
                  onChange={(e) => setTerritories(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl text-navy min-h-[44px]"
                />
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="px-5 py-2.5 rounded-xl border border-border text-xs font-semibold text-foreground-muted"
              >
                ← Précédent
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(5)}
                className="px-5 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors"
              >
                Étape Suivante →
              </button>
            </div>
          </div>
        )}

        {/* Bloc 5: Description & Visuels */}
        {currentStep === 5 && (
          <div className="p-6 rounded-3xl bg-background border border-border space-y-4 shadow-xs">
            <h3 className="font-serif font-bold text-navy text-sm uppercase tracking-wider flex items-center gap-2">
              <Upload className="w-4 h-4 text-gold" />
              Bloc 5 : Description &amp; Couverture Haute Résolution
            </h3>

            <div className="space-y-4">
              <div>
                <label htmlFor="summary" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">Résumé / 4ème de Couverture *</label>
                <textarea
                  id="summary"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  rows={4}
                  placeholder="Résumé synthétique présent sur la fiche publique de l'ouvrage..."
                  className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl text-navy min-h-[100px]"
                  required
                />
              </div>

              <div>
                <FileDropzone
                  acceptTypes={["image/jpeg", "image/png"]}
                  label="Couverture Haute Résolution (JPEG / PNG, min 1500x2000px) *"
                  onFileSelect={(f) => setCoverFile(f)}
                  onFileRemove={() => setCoverFile(null)}
                  selectedFileName={coverFile?.name}
                  selectedFileSize={coverFile?.size}
                />
              </div>
            </div>

            <div className="flex justify-between pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="px-5 py-2.5 rounded-xl border border-border text-xs font-semibold text-foreground-muted"
              >
                ← Précédent
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(6)}
                className="px-5 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors"
              >
                Étape Suivante →
              </button>
            </div>
          </div>
        )}

        {/* Bloc 6: Droits & Licences */}
        {currentStep === 6 && (
          <div className="p-6 rounded-3xl bg-background border border-border space-y-4 shadow-xs">
            <h3 className="font-serif font-bold text-navy text-sm uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-gold" />
              Bloc 6 : Droits &amp; Licences Applicables
            </h3>

            <div className="space-y-4">
              <div>
                <label htmlFor="licence-type" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">Licence Applicable *</label>
                <select
                  id="licence-type"
                  value={licenceType}
                  onChange={(e) => setLicenceType(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl text-navy font-semibold min-h-[44px]"
                >
                  <option value="tous_droits_reserves">Tous Droits Réservés (Exclusive Partner)</option>
                  <option value="creative_commons">Creative Commons (CC-BY-NC)</option>
                </select>
              </div>

              {/* Taux de redevance convenu en lecture seule (Section 5.3) */}
              <div className="p-4 rounded-2xl bg-navy/5 border border-navy/20 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-gold" />
                  <div>
                    <span className="font-bold text-navy block">Taux de Redevance Contractuel Convenu</span>
                    <span className="text-[10px] text-foreground-muted">Réf Contrat : CTR-PUB-2025-08 (Fixé par avenant légal)</span>
                  </div>
                </div>
                <span className="font-mono font-bold text-gold text-base px-3 py-1 bg-background rounded-xl border border-border">
                  22%
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => setCurrentStep(5)}
                className="px-5 py-2.5 rounded-xl border border-border text-xs font-semibold text-foreground-muted"
              >
                ← Précédent
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors flex items-center justify-center gap-2 min-h-[44px] shadow-xs"
              >
                {submitting ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4 text-gold" />
                    Transmettre le Dépôt pour Validation
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
