"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createBookSubmission } from "@/lib/services/publisher";
import { SalesModel } from "@/lib/types/publisher";
import { 
  ChevronRight, 
  ChevronLeft, 
  Upload, 
  Check, 
  AlertTriangle,
  Info,
  BookOpen,
  DollarSign,
  FileText
} from "lucide-react";
import { Dropzone } from "@/components/ui/dropzone";

export default function NewSubmissionPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [authors, setAuthors] = useState("");
  const [lang, setLang] = useState("fr");
  const [summary, setSummary] = useState("");

  // Fichiers state
  const [manuscriptFile, setManuscriptFile] = useState<File | null>(null);
  const [manuscriptProgress, setManuscriptProgress] = useState(0);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverProgress, setCoverProgress] = useState(0);

  // Commercial state
  const [price, setPrice] = useState("0");
  const [salesModel, setSalesModel] = useState<SalesModel>("purchase");
  const [isbnDigital, setIsbnDigital] = useState("");
  const [isbnPrint, setIsbnPrint] = useState("");

  // Refs pour inputs
  const manuscriptRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  // Simulation d'upload
  const simulateUpload = (file: File, type: "manuscript" | "cover") => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 20;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
      }
      if (type === "manuscript") {
        setManuscriptProgress(Math.min(Math.round(progress), 100));
      } else {
        setCoverProgress(Math.min(Math.round(progress), 100));
      }
    }, 150);
  };

  const handleManuscriptSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setManuscriptFile(file);
      setManuscriptProgress(0);
      simulateUpload(file, "manuscript");
    }
  };

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCoverFile(file);
      setCoverProgress(0);
      simulateUpload(file, "cover");
    }
  };

  const handleNext = () => {
    if (step === 1 && (!title || !authors || !summary)) {
      setError("Veuillez remplir tous les champs obligatoires (*) de cette étape.");
      return;
    }
    if (step === 2 && (!manuscriptFile || manuscriptProgress < 100)) {
      setError("Veuillez téléverser le fichier du manuscrit avant de continuer.");
      return;
    }
    setError(null);
    setStep(prev => prev + 1);
  };

  const handlePrev = () => {
    setError(null);
    setStep(prev => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!price || !salesModel) {
      setError("Veuillez spécifier le modèle commercial et le prix.");
      return;
    }
    try {
      setLoading(true);
      await createBookSubmission({
        title,
        subtitle: subtitle || undefined,
        authors: authors.split(",").map(a => a.trim()),
        price: parseInt(price) || 0,
        currency: "FCFA",
        sales_model: salesModel,
        summary,
        isbn_digital: isbnDigital || undefined,
        isbn_print: isbnPrint || undefined
      });
      router.push("/publisher/submissions");
    } catch (err) {
      setError("Une erreur est survenue lors de la création de la soumission.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      
      {/* Title */}
      <div>
        <h1 className="font-serif text-2xl lg:text-3xl font-bold text-navy">Déposer un nouvel ouvrage</h1>
        <p className="text-sm text-foreground-muted">Soumettez les métadonnées et fichiers de votre ouvrage pour validation par LAHA Éditions.</p>
      </div>

      {/* Stepper Wizard Indicator */}
      <div className="bg-background border border-border p-4 rounded flex items-center justify-between text-xs font-bold text-navy-hover">
        <div className="flex items-center gap-2">
          <span className={`w-6 h-6 rounded-full flex items-center justify-center border text-[10px] ${
            step >= 1 ? "bg-navy text-white border-navy" : "border-border text-foreground-muted"
          }`}>1</span>
          <span className={step === 1 ? "text-navy font-bold" : "text-foreground-muted"}>Informations</span>
        </div>
        <ChevronRight className="w-4 h-4 text-foreground-muted" />
        <div className="flex items-center gap-2">
          <span className={`w-6 h-6 rounded-full flex items-center justify-center border text-[10px] ${
            step >= 2 ? "bg-navy text-white border-navy" : "border-border text-foreground-muted"
          }`}>2</span>
          <span className={step === 2 ? "text-navy font-bold" : "text-foreground-muted"}>Fichiers</span>
        </div>
        <ChevronRight className="w-4 h-4 text-foreground-muted" />
        <div className="flex items-center gap-2">
          <span className={`w-6 h-6 rounded-full flex items-center justify-center border text-[10px] ${
            step >= 3 ? "bg-navy text-white border-navy" : "border-border text-foreground-muted"
          }`}>3</span>
          <span className={step === 3 ? "text-navy font-bold" : "text-foreground-muted"}>Commercial</span>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-error/10 border border-error/20 p-4 rounded text-error text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Form Card */}
      <div className="bg-background border border-border rounded shadow-sm p-6 lg:p-8">
        
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* STEP 1: General Info */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-serif text-lg font-bold text-navy flex items-center gap-2 border-b border-border pb-2">
                <BookOpen className="w-5 h-5 text-gold" />
                Informations générales de l'ouvrage
              </h2>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-navy">Titre de l'ouvrage *</label>
                <input 
                  type="text" 
                  className="bg-background border border-border rounded p-3 text-sm focus:outline-none focus:border-navy"
                  placeholder="Ex: Précis de Droit Civil"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-navy">Sous-titre (Optionnel)</label>
                <input 
                  type="text" 
                  className="bg-background border border-border rounded p-3 text-sm focus:outline-none focus:border-navy"
                  placeholder="Ex: Tome 1 : Les Personnes et la Famille"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-navy">Auteur(s) * <span className="text-[10px] text-foreground-muted">(séparés par une virgule)</span></label>
                  <input 
                    type="text" 
                    className="bg-background border border-border rounded p-3 text-sm focus:outline-none focus:border-navy"
                    placeholder="Ex: Dr. Koffi SESSOU, Pr. Marc SOW"
                    value={authors}
                    onChange={(e) => setAuthors(e.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-navy">Langue du manuscrit *</label>
                  <select 
                    className="bg-background border border-border rounded p-3 text-sm focus:outline-none focus:border-navy cursor-pointer"
                    value={lang}
                    onChange={(e) => setLang(e.target.value)}
                  >
                    <option value="fr">Français</option>
                    <option value="en">Anglais</option>
                    <option value="ar">Arabe</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-navy">Résumé / Quatrième de couverture *</label>
                <textarea 
                  rows={5}
                  className="bg-background border border-border rounded p-3 text-sm focus:outline-none focus:border-navy resize-none"
                  placeholder="Présentez brièvement le contenu de l'ouvrage..."
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          {/* STEP 2: Files Upload */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="font-serif text-lg font-bold text-navy flex items-center gap-2 border-b border-border pb-2">
                <FileText className="w-5 h-5 text-gold" />
                Fichiers du manuscrit & couverture
              </h2>

              {/* Manuscript dropzone */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-navy block">Fichier numérique du livre * (PDF, EPUB)</label>
                <Dropzone 
                  onFileSelect={(file) => {
                    setManuscriptFile(file);
                    setManuscriptProgress(100);
                  }}
                  acceptTypes={[".pdf", ".epub"]}
                  maxSizeMB={50}
                />
              </div>

              {/* Cover dropzone */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-navy block">Image de couverture (Optionnelle - JPG, PNG)</label>
                <Dropzone 
                  onFileSelect={(file) => {
                    setCoverFile(file);
                    setCoverProgress(100);
                  }}
                  acceptTypes={[".jpg", ".jpeg", ".png"]}
                  maxSizeMB={5}
                />
              </div>
            </div>
          )}

          {/* STEP 3: Commercial & Pricing */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="font-serif text-lg font-bold text-navy flex items-center gap-2 border-b border-border pb-2">
                <DollarSign className="w-5 h-5 text-gold" />
                Modèle commercial & Références
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-navy">Modèle de vente *</label>
                  <select 
                    className="bg-background border border-border rounded p-3 text-sm focus:outline-none focus:border-navy cursor-pointer"
                    value={salesModel}
                    onChange={(e) => setSalesModel(e.target.value as SalesModel)}
                  >
                    <option value="purchase">Vente unitaire</option>
                    <option value="subscription">Abonnement Bouquet</option>
                    <option value="free">Accès libre (Gratuit)</option>
                  </select>
                </div>
                {salesModel !== "free" && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-navy">Prix public (FCFA) *</label>
                    <input 
                      type="number" 
                      className="bg-background border border-border rounded p-3 text-sm focus:outline-none focus:border-navy"
                      placeholder="Ex: 12000"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      required
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-navy">ISBN Numérique (Optionnel)</label>
                  <input 
                    type="text" 
                    className="bg-background border border-border rounded p-3 text-sm focus:outline-none focus:border-navy"
                    placeholder="978-X-XXXX-XXXX-X"
                    value={isbnDigital}
                    onChange={(e) => setIsbnDigital(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-navy">ISBN Papier (Optionnel)</label>
                  <input 
                    type="text" 
                    className="bg-background border border-border rounded p-3 text-sm focus:outline-none focus:border-navy"
                    placeholder="978-X-XXXX-XXXX-X"
                    value={isbnPrint}
                    onChange={(e) => setIsbnPrint(e.target.value)}
                  />
                </div>
              </div>

              <div className="bg-background-secondary p-4 rounded border border-border flex items-start gap-3 mt-4 text-xs text-foreground-muted leading-relaxed">
                <Info className="w-5 h-5 text-gold shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-navy">Informations éditoriales importantes</p>
                  <p className="mt-1">
                    Conformément au contrat de partenariat, LAHA Éditions appliquera une commission de 15% sur les ventes unitaires ou les consultations via bouquets. Les redevances seront reversées trimestriellement.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Actions */}
          <div className="pt-6 border-t border-border flex justify-between gap-4">
            {step > 1 ? (
              <button 
                type="button" 
                onClick={handlePrev}
                className="border border-border text-navy bg-background hover:bg-background-secondary text-sm font-bold px-6 py-3 rounded flex items-center gap-2 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Précédent
              </button>
            ) : (
              <button 
                type="button" 
                onClick={() => router.push("/publisher/submissions")}
                className="border border-border text-navy bg-background hover:bg-background-secondary text-sm font-bold px-6 py-3 rounded transition-colors"
              >
                Annuler
              </button>
            )}

            {step < 3 ? (
              <button 
                type="button" 
                onClick={handleNext}
                className="bg-navy hover:bg-navy-hover text-white text-sm font-bold px-6 py-3 rounded flex items-center gap-2 transition-colors"
              >
                Suivant
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button 
                type="submit" 
                disabled={loading}
                className="bg-gold hover:bg-gold-dark text-white text-sm font-bold px-8 py-3 rounded flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50"
              >
                {loading ? "Création..." : "Soumettre l'ouvrage"}
                <Check className="w-4 h-4" />
              </button>
            )}
          </div>

        </form>

      </div>

    </div>
  );
}
