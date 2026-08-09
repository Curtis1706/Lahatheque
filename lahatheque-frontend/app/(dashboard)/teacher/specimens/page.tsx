"use client";

import { useEffect, useState } from "react";
import { 
  getSpecimenRequests, 
  createSpecimenRequest 
} from "@/lib/services/teacher";
import { SpecimenRequest } from "@/lib/types/teacher";
import { 
  Plus, 
  CheckCircle, 
  Clock, 
  XCircle, 
  ArrowLeft,
  Calendar,
  AlertTriangle,
  FileText
} from "lucide-react";
import Link from "next/link";
import { mockBooks } from "@/lib/mock/catalog";

export default function TeacherSpecimensPage() {
  const [specimens, setSpecimens] = useState<SpecimenRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // State des modales
  const [showSpecimenModal, setShowSpecimenModal] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState("");
  const [submittingSpecimen, setSubmittingSpecimen] = useState(false);

  useEffect(() => {
    async function loadSpecimens() {
      try {
        setLoading(true);
        const data = await getSpecimenRequests();
        setSpecimens(data);
      } catch (err) {
        console.error("Erreur lors du chargement des spécimens", err);
      } finally {
        setLoading(false);
      }
    }
    loadSpecimens();
  }, []);

  const handleRequestSpecimen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookId) return;
    const selectedBook = mockBooks.find(b => b.id === selectedBookId);
    if (!selectedBook) return;
    try {
      setSubmittingSpecimen(true);
      const req = await createSpecimenRequest(
        selectedBook.id, 
        selectedBook.title, 
        selectedBook.authors_details.map(a => `${a.first_name} ${a.last_name}`).join(", ")
      );
      setSpecimens(prev => [req, ...prev]);
      setShowSpecimenModal(false);
      setSelectedBookId("");
    } catch (err) {
      alert("Erreur lors de la demande.");
    } finally {
      setSubmittingSpecimen(false);
    }
  };

  const getStatusBadge = (status: SpecimenRequest["status"]) => {
    switch (status) {
      case "approved":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold bg-success/10 text-success border border-success/20">
            <CheckCircle className="w-3.5 h-3.5" /> Accordé (Actif)
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold bg-warning/10 text-warning border border-warning/20">
            <Clock className="w-3.5 h-3.5" /> En attente de validation
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold bg-error/10 text-error border border-error/20">
            <XCircle className="w-3.5 h-3.5" /> Refusé
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
            href="/teacher"
            className="inline-flex items-center gap-1 text-xs font-bold text-navy hover:text-gold transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Retour au Tableau de Bord
          </Link>
          <h1 className="font-serif text-2xl lg:text-3xl font-bold text-navy">Demandes de Spécimens</h1>
          <p className="text-sm text-foreground-muted">Visualisez et effectuez des demandes d'évaluation de manuels pour vos cours.</p>
        </div>

        <button
          onClick={() => setShowSpecimenModal(true)}
          className="inline-flex items-center justify-center gap-2 bg-gold hover:bg-gold-dark text-white font-bold text-sm px-5 py-3 rounded shadow-sm self-start sm:self-auto transition-colors"
        >
          <Plus className="w-4 h-4" />
          Demander un Spécimen
        </button>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="p-6 space-y-4 animate-pulse bg-background border border-border rounded">
          <div className="h-10 bg-background-secondary rounded" />
          <div className="h-12 bg-background-secondary rounded" />
        </div>
      ) : specimens.length === 0 ? (
        <div className="p-12 text-center border border-border rounded-xl bg-background-secondary max-w-md mx-auto space-y-3">
          <FileText className="w-12 h-12 text-gold mx-auto" />
          <h3 className="text-base font-bold text-navy">Aucune demande</h3>
          <p className="text-xs text-foreground-muted">Vous n'avez pas encore demandé de spécimen pédagogique.</p>
        </div>
      ) : (
        <div className="bg-background border border-border rounded-xl shadow-sm overflow-hidden">
          
          {/* Desktop View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-background-secondary border-b border-border text-navy font-bold text-xs uppercase tracking-wider">
                  <th className="p-4">Référence</th>
                  <th className="p-4">Ouvrage demandé</th>
                  <th className="p-4">Auteur</th>
                  <th className="p-4">Date de demande</th>
                  <th className="p-4">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {specimens.map((req) => (
                  <tr key={req.id} className="hover:bg-background-secondary/30 transition-colors">
                    <td className="p-4 font-mono font-bold text-navy text-xs">{req.id}</td>
                    <td className="p-4 font-bold text-navy">{req.book_title}</td>
                    <td className="p-4 text-foreground-muted">{req.author}</td>
                    <td className="p-4 text-foreground-muted">
                      {new Date(req.requested_at).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="p-4">{getStatusBadge(req.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile View */}
          <div className="md:hidden divide-y divide-border/40">
            {specimens.map((req) => (
              <div key={req.id} className="p-4 space-y-2">
                <div className="flex justify-between items-start gap-2">
                  <p className="font-bold text-navy text-sm">{req.book_title}</p>
                  {getStatusBadge(req.status)}
                </div>
                <p className="text-xs text-foreground-muted">Auteur : {req.author}</p>
                <div className="flex justify-between items-center pt-2 text-[10px] text-foreground-muted">
                  <span>Réf : {req.id}</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Demandé le {new Date(req.requested_at).toLocaleDateString("fr-FR")}
                  </span>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* Modal: Request Specimen */}
      {showSpecimenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60">
          <div className="bg-background rounded-lg border border-border shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="border-b border-border pb-2">
              <h3 className="font-serif text-lg font-bold text-navy">Demander un spécimen d'évaluation</h3>
            </div>
            <form onSubmit={handleRequestSpecimen} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-navy">Sélectionner un manuel *</label>
                <select 
                  className="bg-background border border-border rounded p-3 text-sm focus:outline-none focus:border-navy cursor-pointer"
                  value={selectedBookId}
                  onChange={(e) => setSelectedBookId(e.target.value)}
                  required
                >
                  <option value="">-- Choisir un ouvrage --</option>
                  {mockBooks.map((book) => (
                    <option key={book.id} value={book.id}>
                      {book.title} ({book.authors_details.map(a => a.last_name).join(", ")})
                    </option>
                  ))}
                </select>
              </div>
              <div className="bg-background-secondary p-3.5 rounded border border-border flex items-start gap-2.5 text-[11px] text-foreground-muted leading-relaxed">
                <AlertTriangle className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                <span>
                  L'accès spécimen numérique est accordé gratuitement pour une durée de 30 jours renouvelables après validation de votre affiliation par notre service éditorial.
                </span>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button"
                  onClick={() => setShowSpecimenModal(false)}
                  className="border border-border text-navy bg-background hover:bg-background-secondary text-xs font-bold px-4 py-2 rounded"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  disabled={submittingSpecimen}
                  className="bg-gold hover:bg-gold-dark text-white text-xs font-bold px-4 py-2 rounded disabled:opacity-50"
                >
                  {submittingSpecimen ? "Envoi..." : "Envoyer la demande"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
