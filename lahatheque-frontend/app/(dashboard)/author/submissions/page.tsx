"use client";

import { useEffect, useState } from "react";
import { 
  getAuthorSubmissions, 
  submitManuscript 
} from "@/lib/services/author";
import { AuthorSubmission } from "@/lib/types/author";
import { 
  ArrowLeft, 
  Plus, 
  Clock, 
  CheckCircle, 
  XCircle, 
  FileText, 
  Calendar,
  AlertTriangle
} from "lucide-react";
import Link from "next/link";
import { DataTable } from "@/components/ui/data-table";
import { Dropzone } from "@/components/ui/dropzone";

export default function AuthorSubmissionsPage() {
  const [submissions, setSubmissions] = useState<AuthorSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  // State de modale
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [discipline, setDiscipline] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadSubmissions() {
      try {
        setLoading(true);
        const data = await getAuthorSubmissions();
        setSubmissions(data);
      } catch (err) {
        console.error("Erreur de chargement des manuscrits", err);
      } finally {
        setLoading(false);
      }
    }
    loadSubmissions();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !discipline || !selectedFile) return;
    try {
      setSubmitting(true);
      const sub = await submitManuscript(title, discipline, selectedFile.name);
      setSubmissions(prev => [sub, ...prev]);
      setShowModal(false);
      setTitle("");
      setDiscipline("");
      setSelectedFile(null);
    } catch (err) {
      alert("Erreur lors de la soumission.");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: AuthorSubmission["status"]) => {
    switch (status) {
      case "approved":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold bg-success/10 text-success border border-success/20">
            <CheckCircle className="w-3.5 h-3.5" /> Approuvé / Publié
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold bg-warning/10 text-warning border border-warning/20">
            <Clock className="w-3.5 h-3.5" /> Soumis
          </span>
        );
      case "under_review":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold bg-warning/10 text-warning border border-warning/20">
            <Clock className="w-3.5 h-3.5" /> En relecture
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold bg-error/10 text-error border border-error/20">
            <XCircle className="w-3.5 h-3.5" /> Refusé
          </span>
        );
      case "draft":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold bg-background-secondary text-foreground-muted border border-border">
            Brouillon
          </span>
        );
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <Link
            href="/author"
            className="inline-flex items-center gap-1 text-xs font-bold text-navy hover:text-gold transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Retour au Tableau de Bord
          </Link>
          <h1 className="font-serif text-2xl lg:text-3xl font-bold text-navy">Manuscrits & Dépôts</h1>
          <p className="text-sm text-foreground-muted">Déposez vos travaux pour étude de conformité éditoriale et légale.</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center justify-center gap-2 bg-gold hover:bg-gold-dark text-white font-bold text-sm px-5 py-3 rounded shadow-sm self-start sm:self-auto transition-colors"
        >
          <Plus className="w-4 h-4" />
          Déposer un manuscrit
        </button>
      </div>

      {/* Main List */}
      <div className="pt-2">
        <DataTable
          data={submissions}
          rowKey="id"
          loading={loading}
          skeletonRows={4}
          filterKey="status"
          filterOptions={[
            { value: "draft", label: "Brouillon" },
            { value: "pending", label: "Soumis" },
            { value: "under_review", label: "En relecture" },
            { value: "approved", label: "Approuvé / Publié" },
            { value: "rejected", label: "Refusé" },
          ]}
          searchPlaceholder="Rechercher un manuscrit..."
          emptyMessage="Vous n'avez pas encore déposé de livre ou manuscrit."
          columns={[
            {
              key: "title",
              header: "Titre de l'œuvre",
              cell: (sub) => (
                <div>
                  <p className="font-bold text-navy">{sub.title as string}</p>
                  <p className="text-[10px] text-foreground-muted font-mono">Réf : {sub.id as string}</p>
                </div>
              ),
            },
            {
              key: "discipline",
              header: "Discipline",
              cell: (sub) => <span className="text-foreground-muted">{sub.discipline as string}</span>,
              hideOnMobile: true,
            },
            {
              key: "submitted_at",
              header: "Date de soumission",
              cell: (sub) => (
                <span className="text-foreground-muted">
                  {new Date(sub.submitted_at as string).toLocaleDateString("fr-FR")}
                </span>
              ),
              hideOnMobile: true,
            },
            {
              key: "file_name",
              header: "Nom du fichier",
              cell: (sub) => <span className="text-foreground-muted font-mono text-xs">{sub.file_name as string}</span>,
              hideOnMobile: true,
            },
            {
              key: "status",
              header: "Statut",
              cell: (sub) => getStatusBadge(sub.status as AuthorSubmission["status"]),
            },
          ]}
          mobileCard={(sub) => (
            <div className="space-y-2">
              <div className="flex justify-between items-start gap-2">
                <p className="font-bold text-navy text-sm">{sub.title as string}</p>
                {getStatusBadge(sub.status as AuthorSubmission["status"])}
              </div>
              <div className="text-xs text-foreground-muted space-y-0.5">
                <p><span className="font-bold text-navy">Discipline :</span> {sub.discipline as string}</p>
                <p><span className="font-bold text-navy">Fichier :</span> {sub.file_name as string}</p>
              </div>
              <div className="flex justify-between items-center pt-2 text-[10px] text-foreground-muted">
                <span>Réf : {sub.id as string}</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Soumis le {new Date(sub.submitted_at as string).toLocaleDateString("fr-FR")}
                </span>
              </div>
            </div>
          )}
        />
      </div>

      {/* Modal: Submit Manuscript */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60">
          <div className="bg-background rounded-lg border border-border shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="border-b border-border pb-2">
              <h3 className="font-serif text-lg font-bold text-navy">Déposer un nouveau manuscrit</h3>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-navy">Titre de l'œuvre *</label>
                <input 
                  type="text" 
                  required
                  className="bg-background border border-border rounded p-3 text-sm focus:outline-none focus:border-navy"
                  placeholder="Ex: Traité de Droit Administratif"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
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
                  <option value="">-- Choisir une discipline --</option>
                  <option value="Droit & Sciences Politiques">Droit & Sciences Politiques</option>
                  <option value="Économie & Gestion">Économie & Gestion</option>
                  <option value="Sciences & Technologies">Sciences & Technologies</option>
                  <option value="Lettres, Langues & Arts">Lettres, Langues & Arts</option>
                </select>
              </div>
              
              {/* Dropzone component uploader */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-navy">Fichier du manuscrit (PDF ou EPUB) *</label>
                <Dropzone onFileSelect={(file) => setSelectedFile(file)} />
              </div>

              <div className="bg-background-secondary p-3.5 rounded border border-border flex items-start gap-2.5 text-[11px] text-foreground-muted leading-relaxed">
                <AlertTriangle className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                <span>
                  En déposant ce manuscrit, vous certifiez en être l'auteur légal et acceptez que l'équipe éditoriale procède à une lecture d'étude de conformité.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="border border-border text-navy bg-background hover:bg-background-secondary text-xs font-bold px-4 py-2 rounded"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  disabled={submitting || !selectedFile}
                  className="bg-gold hover:bg-gold-dark text-white text-xs font-bold px-4 py-2 rounded disabled:opacity-50"
                >
                  {submitting ? "Envoi..." : "Déposer l'œuvre"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
