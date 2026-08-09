"use client";

import { useEffect, useState } from "react";
import { 
  getPreEditions, 
  createLegalContract, 
  createPreEdition 
} from "@/lib/services/legal";
import { PreEditionItem, LegalContract } from "@/lib/types/legal";
import { 
  ArrowLeft, 
  FileText, 
  Plus, 
  Calendar, 
  Percent, 
  Building2, 
  User, 
  Bookmark,
  PlusCircle,
  Clock,
  Sparkles
} from "lucide-react";
import Link from "next/link";
import { DataTable } from "@/components/ui/data-table";
import { Modal } from "@/components/ui/modal";
import { EmptyState, EmptyIcon, EmptyTitle, EmptyDescription } from "@/components/ui/empty-state";
import { Dropzone } from "@/components/ui/dropzone";
import { useSliderWithInput } from "@/lib/hooks/use-slider-with-input";

export default function LegalContractsPage() {
  const [preEditions, setPreEditions] = useState<PreEditionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"contract" | "preedition">("contract");

  // Form Contrats
  const [contractRef, setContractRef] = useState("");
  const [contractBook, setContractBook] = useState("");
  const [contractAuthor, setContractAuthor] = useState("");
  const [contractFile, setContractFile] = useState<File | null>(null);
  
  // Slider hook pour pourcentage
  const {
    sliderValue,
    inputValues,
    validateAndUpdateValue,
    handleInputChange,
    handleSliderChange
  } = useSliderWithInput({
    minValue: 0,
    maxValue: 100,
    initialValue: [10],
    defaultValue: [10]
  });

  // Form Pré-éditions
  const [preTitle, setPreTitle] = useState("");
  const [preAuthor, setPreAuthor] = useState("");
  const [preUniversity, setPreUniversity] = useState("");
  const [preFaculty, setPreFaculty] = useState("");

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const preData = await getPreEditions();
        setPreEditions(preData);
      } catch (err) {
        console.error("Erreur de chargement des pré-éditions", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleContractSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractRef || !contractBook || !contractAuthor || !contractFile) {
      alert("Veuillez remplir tous les champs obligatoires du contrat.");
      return;
    }
    try {
      setSubmitting(true);
      const data: Omit<LegalContract, "id" | "status" | "signed_at"> = {
        reference: contractRef,
        book_title: contractBook,
        author_name: contractAuthor,
        royalty_rate: sliderValue[0],
        contract_file: contractFile.name
      };
      await createLegalContract(data);
      alert("Contrat d'édition enregistré avec succès !");
      
      // Reset Form
      setContractRef("");
      setContractBook("");
      setContractAuthor("");
      setContractFile(null);
    } catch (err) {
      alert("Erreur lors de la création.");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePreEditionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!preTitle || !preAuthor) {
      alert("Le titre et l'auteur de l'ouvrage pré-édité sont obligatoires.");
      return;
    }
    try {
      setSubmitting(true);
      const data: Omit<PreEditionItem, "id" | "created_at"> = {
        title: preTitle,
        author_name: preAuthor,
        university: preUniversity,
        faculty: preFaculty
      };
      const created = await createPreEdition(data);
      setPreEditions(prev => [created, ...prev]);
      alert("Pré-édition d'ouvrage enregistrée avec succès !");
      
      // Reset Form
      setPreTitle("");
      setPreAuthor("");
      setPreUniversity("");
      setPreFaculty("");
    } catch (err) {
      alert("Erreur lors du pré-enregistrement.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      
      {/* Header */}
      <div className="space-y-1">
        <Link
          href="/legal-reviewer"
          className="inline-flex items-center gap-1 text-xs font-bold text-navy hover:text-gold transition-colors mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Retour à l'Accueil Juriste
        </Link>
        <h1 className="font-serif text-2xl lg:text-3xl font-bold text-navy">Contrats & Pré-éditions</h1>
        <p className="text-sm text-foreground-muted">Gérez la conformité légale des œuvres avant leur mise en ligne ou pendant la phase éditoriale.</p>
      </div>

      {/* Tabs selectors */}
      <div className="flex border-b border-border gap-2">
        <button
          onClick={() => setActiveTab("contract")}
          className={`pb-3 text-xs font-bold transition-all px-4 border-b-2 ${
            activeTab === "contract" 
              ? "border-navy text-navy" 
              : "border-transparent text-foreground-muted hover:text-navy"
          }`}
        >
          Enregistrer un Contrat d'Édition
        </button>
        <button
          onClick={() => setActiveTab("preedition")}
          className={`pb-3 text-xs font-bold transition-all px-4 border-b-2 ${
            activeTab === "preedition" 
              ? "border-navy text-navy" 
              : "border-transparent text-foreground-muted hover:text-navy"
          }`}
        >
          Pré-éditions et Pré-enregistrements
        </button>
      </div>

      {activeTab === "contract" ? (
        /* REGISTER CONTRACT FORM */
        <form onSubmit={handleContractSubmit} className="bg-background border border-border rounded-xl p-6 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Fields */}
          <div className="lg:col-span-7 space-y-4">
            <h3 className="font-serif font-bold text-navy text-base flex items-center gap-1.5 border-b border-border pb-2">
              <FileText className="w-5 h-5 text-gold" />
              Notice légale du contrat
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-navy">Référence du Contrat *</label>
                <input 
                  type="text" required
                  className="bg-background border border-border rounded p-3 text-sm focus:outline-none focus:border-navy font-mono"
                  placeholder="Ex: CTR-2026-FADESP-009"
                  value={contractRef}
                  onChange={(e) => setContractRef(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-navy">Nom de l'Auteur ayant droit *</label>
                <input 
                  type="text" required
                  className="bg-background border border-border rounded p-3 text-sm focus:outline-none focus:border-navy"
                  placeholder="Ex: Marc-Aurèle DE SOUZA"
                  value={contractAuthor}
                  onChange={(e) => setContractAuthor(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-navy">Titre de l'ouvrage associé *</label>
              <input 
                type="text" required
                className="bg-background border border-border rounded p-3 text-sm focus:outline-none focus:border-navy"
                placeholder="Ex: Le Droit Foncier au Bénin"
                value={contractBook}
                onChange={(e) => setContractBook(e.target.value)}
              />
            </div>

            {/* Slider couplé (useSliderWithInput de 21st.dev ID 1441) */}
            <div className="bg-background-secondary p-4 rounded-xl border border-border space-y-4">
              <div className="flex justify-between items-center text-xs">
                <label className="font-bold text-navy flex items-center gap-1">
                  <Percent className="w-3.5 h-3.5 text-gold" /> Taux de redevance (Droits d'auteur)
                </label>
                <span className="font-bold text-navy">{sliderValue[0]} %</span>
              </div>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={sliderValue[0]}
                  onChange={(e) => handleSliderChange([parseInt(e.target.value)])}
                  className="flex-1 h-1.5 bg-border rounded-lg appearance-none cursor-pointer accent-navy"
                />
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={inputValues[0]}
                    onChange={(e) => handleInputChange(e, 0)}
                    onBlur={() => validateAndUpdateValue(inputValues[0], 0)}
                    className="w-14 bg-background border border-border rounded p-2 text-center text-xs font-bold text-navy"
                  />
                  <span className="text-xs text-foreground-muted">%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Upload Contract */}
          <div className="lg:col-span-5 space-y-4">
            <h3 className="font-serif font-bold text-navy text-base flex items-center gap-1.5 border-b border-border pb-2">
              <Bookmark className="w-5 h-5 text-gold" />
              Contrat signé PDF / Word
            </h3>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-navy">Fichier numérisé du contrat signé *</label>
              <Dropzone onFileSelect={(file) => setContractFile(file)} />
            </div>

            <div className="pt-4 flex justify-end gap-2 border-t border-border/40">
              <button 
                type="submit"
                disabled={submitting || !contractFile}
                className="w-full py-3 bg-navy hover:bg-navy-hover text-white text-xs font-bold rounded-lg shadow disabled:opacity-50 transition-colors"
              >
                {submitting ? "Enregistrement..." : "Enregistrer le contrat"}
              </button>
            </div>
          </div>

        </form>
      ) : (
        /* PRE-EDITIONS TAB */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Form */}
          <form onSubmit={handlePreEditionSubmit} className="lg:col-span-5 bg-background border border-border rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="font-serif font-bold text-navy text-base flex items-center gap-1.5 border-b border-border pb-2">
              <PlusCircle className="w-5 h-5 text-gold" />
              Pré-enregistrement de livre
            </h3>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-navy">Titre provisoire du livre *</label>
              <input 
                type="text" required
                className="bg-background border border-border rounded p-3 text-sm focus:outline-none focus:border-navy"
                placeholder="Ex: Manuel de Droit Constitutionnel"
                value={preTitle}
                onChange={(e) => setPreTitle(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-navy">Nom de l'Auteur / Enseignant *</label>
              <input 
                type="text" required
                className="bg-background border border-border rounded p-3 text-sm focus:outline-none focus:border-navy"
                placeholder="Ex: Pr. Koffi Mensah"
                value={preAuthor}
                onChange={(e) => setPreAuthor(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-navy">Université</label>
                <input 
                  type="text"
                  className="bg-background border border-border rounded p-3 text-sm focus:outline-none focus:border-navy"
                  placeholder="Ex: Université de Lomé"
                  value={preUniversity}
                  onChange={(e) => setPreUniversity(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-navy">Faculté</label>
                <input 
                  type="text"
                  className="bg-background border border-border rounded p-3 text-sm focus:outline-none focus:border-navy"
                  placeholder="Ex: FDD"
                  value={preFaculty}
                  onChange={(e) => setPreFaculty(e.target.value)}
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-navy hover:bg-navy-hover text-white text-xs font-bold rounded-lg shadow disabled:opacity-50 transition-colors"
            >
              {submitting ? "Enregistrement..." : "Créer la fiche de pré-édition"}
            </button>
          </form>

          {/* Right Lists */}
          <div className="lg:col-span-7 space-y-4">
            <h3 className="font-serif text-lg font-bold text-navy flex items-center gap-2">
              <Clock className="w-5 h-5 text-gold" />
              Ouvrages universitaires en pré-édition
            </h3>

            {loading ? (
              <div className="p-6 space-y-4 animate-pulse bg-background border border-border rounded-xl">
                <div className="h-10 bg-background-secondary rounded" />
              </div>
            ) : preEditions.length === 0 ? (
              <EmptyState className="py-12 border border-border rounded-xl bg-background">
                <EmptyIcon icon={FileText} />
                <EmptyTitle>Aucune fiche de pré-édition</EmptyTitle>
                <EmptyDescription>Les fiches de pré-édition enregistrées apparaîtront ici.</EmptyDescription>
              </EmptyState>
            ) : (
              <div className="bg-background border border-border rounded-xl shadow-sm overflow-hidden">
                <div className="divide-y divide-border/40">
                  {preEditions.map((item) => (
                    <div key={item.id} className="p-5 hover:bg-background-secondary/20 transition-colors flex justify-between items-center gap-4">
                      <div className="space-y-1">
                        <h4 className="font-bold text-navy text-sm">{item.title}</h4>
                        <p className="text-xs text-foreground-muted">Auteur : {item.author_name}</p>
                        <p className="text-[10px] text-foreground-muted">{item.university} — {item.faculty}</p>
                      </div>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-navy-light text-navy">
                        En cours
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
