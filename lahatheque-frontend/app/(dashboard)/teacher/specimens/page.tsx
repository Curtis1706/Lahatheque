"use client";

import { useEffect, useState } from "react";
import { 
  getSpecimenRequests, 
  createSpecimenRequest 
} from "@/lib/services/teacher";
import { SpecimenRequest } from "@/lib/types/teacher";
import { 
  BookOpen, 
  FileText, 
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  ArrowLeft,
  AlertTriangle
} from "lucide-react";
import Link from "next/link";
import { DataTable } from "@/components/ui/data-table";
import { Modal } from "@/components/ui/modal";
import { StatusBadge } from "@/components/ui/status-badge";
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
        return <StatusBadge status="success" leftIcon={CheckCircle2} leftLabel="Accordé (Actif)" />;
      case "pending":
        return <StatusBadge status="warning" leftIcon={Clock} leftLabel="En attente de validation" />;
      case "rejected":
        return <StatusBadge status="error" leftIcon={XCircle} leftLabel="Refusé" />;
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
      {/* Main Content — DataTable */}
      <div className="pt-4">
        <DataTable
          data={specimens}
          rowKey="id"
          loading={loading}
          skeletonRows={3}
          emptyMessage="Vous n'avez pas encore demandé de spécimen pédagogique."
          columns={[
            {
              key: "id",
              header: "Référence",
              cell: (req) => <span className="font-mono font-bold text-navy text-xs">{req.id as string}</span>,
            },
            {
              key: "book_title",
              header: "Ouvrage demandé",
              cell: (req) => <span className="font-bold text-navy">{req.book_title as string}</span>,
            },
            {
              key: "author",
              header: "Auteur",
              cell: (req) => <span className="text-foreground-muted">{req.author as string}</span>,
              hideOnMobile: true,
            },
            {
              key: "requested_at",
              header: "Date de demande",
              cell: (req) => (
                <span className="text-foreground-muted">
                  {new Date(req.requested_at as string).toLocaleDateString("fr-FR")}
                </span>
              ),
              hideOnMobile: true,
            },
            {
              key: "status",
              header: "Statut",
              cell: (req) => getStatusBadge(req.status as SpecimenRequest["status"]),
            },
          ]}
          mobileCard={(req) => (
            <div className="space-y-2">
              <div className="flex justify-between items-start gap-2">
                <p className="font-bold text-navy text-sm">{req.book_title as string}</p>
                {getStatusBadge(req.status as SpecimenRequest["status"])}
              </div>
              <p className="text-xs text-foreground-muted">Auteur : {req.author as string}</p>
              <div className="flex justify-between items-center pt-2 text-[10px] text-foreground-muted">
                <span>Réf : {req.id as string}</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Demandé le {new Date(req.requested_at as string).toLocaleDateString("fr-FR")}
                </span>
              </div>
            </div>
          )}
        />
      </div>

      {/* Modal: Request Specimen */}
      <Modal
        open={showSpecimenModal}
        onClose={() => setShowSpecimenModal(false)}
        title="Demander un spécimen d'évaluation"
        maxWidth={500}
        footer={
          <>
            <button 
              type="button"
              onClick={() => setShowSpecimenModal(false)}
              className="border border-border text-navy bg-background hover:bg-background-secondary text-xs font-bold px-4 py-2 rounded"
            >
              Annuler
            </button>
            <button 
              type="submit"
              form="request-specimen-form"
              disabled={submittingSpecimen}
              className="bg-gold hover:bg-gold-dark text-white text-xs font-bold px-4 py-2 rounded disabled:opacity-50"
            >
              {submittingSpecimen ? "Envoi..." : "Envoyer la demande"}
            </button>
          </>
        }
      >
        <form id="request-specimen-form" onSubmit={handleRequestSpecimen} className="space-y-4 pt-2 pb-2">
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
        </form>
      </Modal>

    </div>
  );
}
