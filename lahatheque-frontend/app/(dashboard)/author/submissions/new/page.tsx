"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { submitManuscript } from "@/lib/services/author";
import { 
  PenTool, 
  Upload, 
  ArrowLeft, 
  CheckCircle2, 
  Sparkles, 
  Info, 
  Lock 
} from "lucide-react";

export default function NewSubmissionPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [language, setLanguage] = useState("Français");
  const [versionType, setVersionType] = useState<"preview" | "brouillon" | "version_finale">("brouillon");
  const [fileName, setFileName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !fileName) return;

    try {
      setSubmitting(true);
      await submitManuscript(title, summary, language, versionType, fileName);
      setSuccess(true);
      setTimeout(() => {
        router.push("/author/submissions");
      }, 2000);
    } catch (err) {
      alert("Erreur lors de la soumission du manuscrit.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-4xl mx-auto w-full min-w-0">
      {/* Header */}
      <div className="space-y-1 border-b border-border pb-6">
        <Link href="/author/submissions" className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-2">
          <ArrowLeft className="w-3.5 h-3.5" />
          Retour à mes dépôts
        </Link>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gold">
          <PenTool className="w-4 h-4" />
          <span>Dépôt de Manuscrit pour Étude</span>
        </div>
        <h1 className="font-serif text-2xl lg:text-3xl font-bold text-navy">
          Soumettre un Nouveau Projet de Livre
        </h1>
        <p className="text-xs sm:text-sm text-foreground-muted">
          Déposez votre manuscrit pour évaluation par le comité éditorial LAHA Éditions.
        </p>
      </div>

      {/* Rappel du Processus IA & Édition en conformité v3.2 section 3.3.1 */}
      <div className="bg-navy/5 border border-gold/30 p-4 rounded-2xl flex items-start gap-3 text-xs text-foreground-muted">
        <Sparkles className="w-5 h-5 text-gold shrink-0 mt-0.5" />
        <div>
          <strong className="text-navy font-semibold block">Classification Automatique par l&apos;IA & l&apos;Équipe Éditoriale</strong>
          Conformément au cahier des charges LAHAThèque (section 4.1.C & 3.3.1), la classification de la discipline, de l&apos;université de rattachement, la tarification et la grille de droits d&apos;auteur sont automatiquement gérées par le système et le Juriste après dépôt.
        </div>
      </div>

      {success ? (
        <div className="bg-success/10 border border-success/30 p-8 rounded-3xl text-center space-y-3">
          <CheckCircle2 className="w-12 h-12 text-success mx-auto" />
          <h2 className="font-serif font-bold text-navy text-xl">Dépôt enregistré avec succès !</h2>
          <p className="text-xs text-foreground-muted">Votre manuscrit a été transmis au comité de lecture. Redirection en cours...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-background border border-border p-6 sm:p-8 rounded-3xl space-y-6 shadow-xs">
          {/* Zone de Téléversement de Fichier */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-navy uppercase tracking-wider block">
              Fichier Manuscrit (PDF, EPUB, Word) *
            </label>
            <div className="border-2 border-dashed border-border rounded-2xl p-6 text-center hover:border-gold transition-colors bg-background-secondary relative">
              <input
                type="file"
                accept=".pdf,.epub,.doc,.docx"
                onChange={handleFileChange}
                required
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <Upload className="w-8 h-8 text-gold mx-auto mb-2" />
              {fileName ? (
                <p className="text-xs font-bold text-navy">{fileName}</p>
              ) : (
                <p className="text-xs text-foreground-muted">
                  Cliquez ou glissez-déposez votre fichier ici <br />
                  <span className="text-[10px] text-foreground-muted/70">(Formats acceptés : PDF, EPUB, DOCX — Max 50 Mo)</span>
                </p>
              )}
            </div>
          </div>

          {/* Titre du Manuscrit */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-navy uppercase tracking-wider block">
              Titre de l&apos;Ouvrage *
            </label>
            <input
              type="text"
              placeholder="Ex: Le Droit Foncier au Bénin : Enjeux et Perspectives"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-background-secondary border border-border text-xs font-medium text-foreground focus:outline-none focus:border-gold min-h-[44px]"
            />
          </div>

          {/* Langue & Type de Version */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-navy uppercase tracking-wider block">
                Langue de Rédaction *
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-background-secondary border border-border text-xs font-medium text-foreground focus:outline-none focus:border-gold min-h-[44px]"
              >
                <option value="Français">Français</option>
                <option value="Anglais">Anglais</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-navy uppercase tracking-wider block">
                Type de Version Déposée *
              </label>
              <select
                value={versionType}
                onChange={(e) => setVersionType(e.target.value as any)}
                className="w-full px-4 py-3 rounded-xl bg-background-secondary border border-border text-xs font-medium text-foreground focus:outline-none focus:border-gold min-h-[44px]"
              >
                <option value="brouillon">Version Brouillon (Travail en cours)</option>
                <option value="preview">Extrait / Preview d&apos;Évaluation</option>
                <option value="version_finale">Version Finale pour Édition</option>
              </select>
            </div>
          </div>

          {/* Résumé / Aperçu Synoptique */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-navy uppercase tracking-wider block">
              Résumé / Présentation du Projet (Optionnel)
            </label>
            <textarea
              rows={4}
              placeholder="Décrivez les grandes lignes de votre ouvrage, le public cible universitaire ou la problématique traitée..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-background-secondary border border-border text-xs font-medium text-foreground focus:outline-none focus:border-gold"
            />
          </div>

          {/* Boutons d'Action */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Link
              href="/author/submissions"
              className="px-5 py-3 rounded-xl bg-background-secondary text-foreground text-xs font-semibold hover:bg-border transition-colors"
            >
              Annuler
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 rounded-xl bg-navy text-white text-xs font-semibold hover:bg-navy-hover transition-colors shadow-xs"
            >
              {submitting ? "Envoi du fichier..." : "Confirmer le Dépôt"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
