"use client";

import { useEffect, useState } from "react";
import { getCatalogItems, createCatalogItem } from "@/lib/services/layout-artist";
import { BookCatalogItem } from "@/lib/types/layout-artist";
import { 
  Plus, 
  FileText, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  BookOpen, 
  Music, 
  Upload, 
  Globe, 
  MapPin,
  ArrowRight,
  ShieldCheck,
  Languages
} from "lucide-react";
import Link from "next/link";
import { Dropzone } from "@/components/ui/dropzone";

export default function LayoutArtistPage() {
  const [items, setItems] = useState<BookCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"list" | "create">("list");

  // Form states
  const [title, setTitle] = useState("");
  const [authors, setAuthors] = useState("");
  const [isbn, setIsbn] = useState("");
  const [year, setYear] = useState("");
  const [discipline, setDiscipline] = useState("");
  const [faculty, setFaculty] = useState("");
  const [university, setUniversity] = useState("");
  const [format, setFormat] = useState<BookCatalogItem["format"]>("PDF");
  const [hasAudio, setHasAudio] = useState(false);
  
  // Fichiers
  const [bookFile, setBookFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  
  // IA assists (simulées)
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiSummary, setAiSummary] = useState("");
  const [aiLanguage, setAiLanguage] = useState("");
  const [aiCountry, setAiCountry] = useState("");
  
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await getCatalogItems();
        setItems(data);
      } catch (err) {
        console.error("Erreur de chargement", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const triggerAiAssistant = () => {
    if (!title) {
      alert("Veuillez saisir un titre d'ouvrage pour générer les métadonnées par IA.");
      return;
    }
    setIsAiProcessing(true);
    setTimeout(() => {
      setAiLanguage("Français");
      setAiCountry("Bénin");
      setAiSummary(`Résumé assisté par IA de l'ouvrage "${title}" : Traité d'études universitaires destiné aux facultés de la sous-région, consolidant les bases académiques et pratiques.`);
      setIsAiProcessing(false);
    }, 1500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !authors || !isbn || !year || !discipline || !bookFile) {
      alert("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    try {
      setSubmitting(true);
      const data: Omit<BookCatalogItem, "id" | "status" | "created_at"> = {
        title,
        isbn,
        authors,
        year,
        discipline,
        language: aiLanguage || "Français",
        country: aiCountry || "Bénin",
        faculty,
        university,
        format,
        has_audio: hasAudio,
        suggested_summary: aiSummary
      };
      const created = await createCatalogItem(data);
      setItems(prev => [created, ...prev]);
      setActiveTab("list");
      
      // Reset form
      setTitle("");
      setAuthors("");
      setIsbn("");
      setYear("");
      setDiscipline("");
      setFaculty("");
      setUniversity("");
      setBookFile(null);
      setAudioFile(null);
      setHasAudio(false);
      setAiLanguage("");
      setAiCountry("");
      setAiSummary("");
    } catch (err) {
      alert("Erreur lors de la création.");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: BookCatalogItem["status"]) => {
    switch (status) {
      case "approved":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold bg-success/10 text-success border border-success/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> Validé & Vitrine
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold bg-warning/10 text-warning border border-warning/20">
            <Clock className="w-3.5 h-3.5" /> En attente validation
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold bg-error/10 text-error border border-error/20">
            <XCircle className="w-3.5 h-3.5" /> Refusé
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold bg-background-secondary text-foreground-muted border border-border">
            Brouillon
          </span>
        );
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-serif text-2xl lg:text-3xl font-bold text-navy">Espace Maquettiste</h1>
          <p className="text-sm text-foreground-muted">Intégrez et mettez en ligne les ouvrages du catalogue universitaire.</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("list")}
            className={`px-4 py-2 text-xs font-bold rounded-lg border transition-all ${
              activeTab === "list" 
                ? "bg-navy text-white border-navy" 
                : "bg-background text-navy border-border hover:bg-background-secondary"
            }`}
          >
            Mes Créations
          </button>
          <button
            onClick={() => setActiveTab("create")}
            className={`px-4 py-2 text-xs font-bold rounded-lg border transition-all flex items-center gap-1.5 ${
              activeTab === "create" 
                ? "bg-navy text-white border-navy" 
                : "bg-background text-navy border-border hover:bg-background-secondary"
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            Créer une fiche
          </button>
          
          <Link
            href="/layout-artist/validation"
            className="px-4 py-2 text-xs font-bold rounded-lg border border-gold bg-gold/10 text-gold-dark hover:bg-gold hover:text-white transition-all flex items-center gap-1"
          >
            Validation Chef Maquettiste
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {activeTab === "list" ? (
        /* LIST OF OUVRA GES */
        loading ? (
          <div className="p-6 space-y-4 animate-pulse bg-background border border-border rounded-xl">
            <div className="h-10 bg-background-secondary rounded" />
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center border border-border rounded-xl bg-background-secondary max-w-sm mx-auto space-y-3">
            <BookOpen className="w-12 h-12 text-gold mx-auto" />
            <h3 className="text-base font-bold text-navy">Aucun ouvrage</h3>
            <p className="text-xs text-foreground-muted">Aucune fiche de catalogue n'a encore été créée.</p>
          </div>
        ) : (
          <div className="bg-background border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-background-secondary border-b border-border text-navy font-bold text-xs uppercase tracking-wider">
                    <th className="p-4">Ouvrage / Auteur</th>
                    <th className="p-4">ISBN / Année</th>
                    <th className="p-4">Discipline / Institution</th>
                    <th className="p-4 text-center">Format / Audio</th>
                    <th className="p-4">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-background-secondary/30 transition-colors">
                      <td className="p-4">
                        <p className="font-bold text-navy">{item.title}</p>
                        <p className="text-xs text-foreground-muted">{item.authors}</p>
                      </td>
                      <td className="p-4">
                        <p className="font-mono text-xs text-navy font-bold">{item.isbn}</p>
                        <p className="text-xs text-foreground-muted">Publié en {item.year}</p>
                      </td>
                      <td className="p-4 text-xs">
                        <p className="font-bold text-navy">{item.discipline}</p>
                        <p className="text-foreground-muted">{item.university} ({item.faculty})</p>
                      </td>
                      <td className="p-4 text-center">
                        <div className="inline-flex flex-col items-center gap-1">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-navy-light text-navy">{item.format}</span>
                          {item.has_audio && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] text-gold font-bold">
                              <Music className="w-2.5 h-2.5" /> Audio LCP
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">{getStatusBadge(item.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        /* CREATE FORM WITH IA ASSIST */
        <form onSubmit={handleSubmit} className="bg-background border border-border rounded-xl p-6 shadow-sm space-y-6">
          <div className="border-b border-border pb-3 flex justify-between items-center">
            <h3 className="font-serif font-bold text-navy text-lg">Nouvel ouvrage universitaire</h3>
            <button
              type="button"
              onClick={triggerAiAssistant}
              disabled={isAiProcessing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gold/10 hover:bg-gold text-gold-dark hover:text-white border border-gold/20 text-xs font-bold transition-all disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {isAiProcessing ? "Analyse IA..." : "Suggérer par IA"}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Left side: Basic Fields */}
            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-navy">Titre de l'ouvrage *</label>
                <input 
                  type="text" required
                  className="bg-background border border-border rounded p-3 text-sm focus:outline-none focus:border-navy"
                  placeholder="Ex: Manuel de Cardiologie Pédiatrique"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-navy">Auteur(s) *</label>
                  <input 
                    type="text" required
                    className="bg-background border border-border rounded p-3 text-sm focus:outline-none focus:border-navy"
                    placeholder="Ex: Pr. Koffi"
                    value={authors}
                    onChange={(e) => setAuthors(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-navy">ISBN *</label>
                  <input 
                    type="text" required
                    className="bg-background border border-border rounded p-3 text-sm focus:outline-none focus:border-navy font-mono"
                    placeholder="Ex: 978-2-84111-..."
                    value={isbn}
                    onChange={(e) => setIsbn(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-navy">Année d'édition *</label>
                  <input 
                    type="number" required
                    className="bg-background border border-border rounded p-3 text-sm focus:outline-none focus:border-navy"
                    placeholder="Ex: 2026"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-navy">Discipline académique *</label>
                  <select 
                    className="bg-background border border-border rounded p-3 text-sm focus:outline-none focus:border-navy cursor-pointer"
                    value={discipline}
                    onChange={(e) => setDiscipline(e.target.value)}
                    required
                  >
                    <option value="">-- Choisir --</option>
                    <option value="Médecine & Santé">Médecine & Santé</option>
                    <option value="Droit & Sciences Politiques">Droit & Sciences Politiques</option>
                    <option value="Économie & Gestion">Économie & Gestion</option>
                    <option value="Sciences & Technologies">Sciences & Technologies</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-navy">Université</label>
                  <input 
                    type="text"
                    className="bg-background border border-border rounded p-3 text-sm focus:outline-none focus:border-navy"
                    placeholder="Ex: UAC"
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-navy">Faculté / Établissement</label>
                  <input 
                    type="text"
                    className="bg-background border border-border rounded p-3 text-sm focus:outline-none focus:border-navy"
                    placeholder="Ex: FSS"
                    value={faculty}
                    onChange={(e) => setFaculty(e.target.value)}
                  />
                </div>
              </div>

              {/* DRM & Audio options */}
              <div className="bg-background-secondary p-4 rounded-xl border border-border space-y-3">
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="hasAudio"
                    className="w-4 h-4 cursor-pointer"
                    checked={hasAudio}
                    onChange={(e) => setHasAudio(e.target.checked)}
                  />
                  <label htmlFor="hasAudio" className="text-xs font-bold text-navy cursor-pointer flex items-center gap-1">
                    <Music className="w-3.5 h-3.5 text-gold" />
                    Cet ouvrage dispose d'une version Livre Audio
                  </label>
                </div>

                {hasAudio && (
                  <div className="space-y-3 pt-2 border-t border-border animate-in fade-in duration-200">
                    <div className="flex items-center gap-1.5 text-[10px] text-success font-bold">
                      <ShieldCheck className="w-4 h-4 text-success" />
                      Protection DRM / LCP automatique sur le livre audio.
                    </div>
                    <Dropzone onFileSelect={(file) => setAudioFile(file)} acceptTypes={[".mp3", ".m4b"]} />
                  </div>
                )}
              </div>
            </div>

            {/* Right side: Uploader & IA feedback */}
            <div className="space-y-6">
              
              {/* Main Book Dropzone */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-navy">Fichier principal du livre *</label>
                <Dropzone onFileSelect={(file) => setBookFile(file)} />
              </div>

              {/* IA Assistant Panel */}
              <div className="bg-navy-dark text-white rounded-2xl p-5 border border-navy/30 space-y-4 shadow-sm relative overflow-hidden">
                <div className="flex items-center gap-1.5 text-xs font-bold text-gold uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-gold" />
                  Assistant IA — Métadonnées suggérées
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <span className="text-white/60 flex items-center gap-1">
                      <Languages className="w-3.5 h-3.5" /> Langue (Obligatoire)
                    </span>
                    <input 
                      type="text"
                      className="bg-navy/80 border border-gold/20 rounded p-2 text-white w-full text-xs"
                      value={aiLanguage}
                      placeholder="Saisie ou suggestion..."
                      onChange={(e) => setAiLanguage(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-white/60 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> Pays de diffusion
                    </span>
                    <input 
                      type="text"
                      className="bg-navy/80 border border-gold/20 rounded p-2 text-white w-full text-xs"
                      value={aiCountry}
                      placeholder="Saisie ou suggestion..."
                      onChange={(e) => setAiCountry(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <span className="text-white/60">Résumé analytique du livre (quatrième de couverture)</span>
                  <textarea
                    rows={4}
                    className="bg-navy/80 border border-gold/20 rounded p-2.5 text-white w-full text-xs resize-none"
                    value={aiSummary}
                    placeholder="Généré automatiquement par l'IA lors du scan du fichier..."
                    onChange={(e) => setAiSummary(e.target.value)}
                  />
                </div>
              </div>
            </div>

          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <button 
              type="button"
              onClick={() => setActiveTab("list")}
              className="border border-border text-navy bg-background hover:bg-background-secondary text-xs font-bold px-5 py-2.5 rounded-lg"
            >
              Annuler
            </button>
            <button 
              type="submit"
              disabled={submitting || !bookFile}
              className="bg-navy hover:bg-navy-hover text-white text-xs font-bold px-6 py-2.5 rounded-lg shadow disabled:opacity-50"
            >
              {submitting ? "Enregistrement..." : "Soumettre pour validation"}
            </button>
          </div>
        </form>
      )}

    </div>
  );
}
