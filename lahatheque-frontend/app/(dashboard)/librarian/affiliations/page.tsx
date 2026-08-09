"use client";

import { useEffect, useState } from "react";
import { 
  getStudentAffiliations, 
  approveAffiliation, 
  rejectAffiliation 
} from "@/lib/services/librarian";
import { StudentAffiliation } from "@/lib/types/librarian";
import { 
  ArrowLeft, 
  Check, 
  X, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  UserCheck
} from "lucide-react";
import Link from "next/link";
import { DataTable } from "@/components/ui/data-table";
import { Modal } from "@/components/ui/modal";

export default function StudentAffiliationsPage() {
  const [affiliations, setAffiliations] = useState<StudentAffiliation[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);

  // Modale de rejet
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectId, setRejectId] = useState("");
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    async function loadAffiliations() {
      try {
        setLoading(true);
        const data = await getStudentAffiliations();
        setAffiliations(data);
      } catch (err) {
        console.error("Erreur de chargement des affiliations", err);
      } finally {
        setLoading(false);
      }
    }
    loadAffiliations();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      setActioningId(id);
      const success = await approveAffiliation(id);
      if (success) {
        setAffiliations(prev => prev.map(aff => {
          if (aff.id === id) return { ...aff, status: "approved" as const };
          return aff;
        }));
      }
    } catch (err) {
      alert("Erreur lors de la validation.");
    } finally {
      setActioningId(null);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectReason) return;
    try {
      setActioningId(rejectId);
      const success = await rejectAffiliation(rejectId, rejectReason);
      if (success) {
        setAffiliations(prev => prev.map(aff => {
          if (aff.id === rejectId) return { ...aff, status: "rejected" as const, rejection_reason: rejectReason };
          return aff;
        }));
        setShowRejectModal(false);
        setRejectReason("");
        setRejectId("");
      }
    } catch (err) {
      alert("Erreur lors du rejet.");
    } finally {
      setActioningId(null);
    }
  };

  const getStatusBadge = (status: StudentAffiliation["status"]) => {
    switch (status) {
      case "approved":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold bg-success/10 text-success border border-success/20">
            <CheckCircle className="w-3.5 h-3.5" /> Approuvé
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold bg-warning/10 text-warning border border-warning/20">
            <Clock className="w-3.5 h-3.5" /> En attente
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold bg-error/10 text-error border border-error/20">
            <XCircle className="w-3.5 h-3.5" /> Rejeté
          </span>
        );
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      
      {/* Header */}
      <div className="space-y-1">
        <Link
          href="/librarian"
          className="inline-flex items-center gap-1 text-xs font-bold text-navy hover:text-gold transition-colors mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Retour au Tableau de Bord
        </Link>
        <h1 className="font-serif text-2xl lg:text-3xl font-bold text-navy">Affiliations Étudiants</h1>
        <p className="text-sm text-foreground-muted">Validez les inscriptions des étudiants de votre université pour activer leur abonnement.</p>
      </div>

      {/* Main List */}
      <div className="pt-2">
        <DataTable
          data={affiliations}
          rowKey="id"
          loading={loading}
          skeletonRows={4}
          filterKey="status"
          filterOptions={[
            { value: "pending", label: "En attente" },
            { value: "approved", label: "Validé" },
            { value: "rejected", label: "Rejeté" },
          ]}
          searchPlaceholder="Rechercher un étudiant..."
          emptyMessage="Aucune demande d'affiliation enregistrée pour le moment."
          columns={[
            {
              key: "student_name",
              header: "Étudiant",
              cell: (aff) => (
                <div>
                  <p className="font-bold text-navy">{aff.student_name as string}</p>
                  <p className="text-xs text-foreground-muted">{aff.student_email as string}</p>
                </div>
              ),
            },
            {
              key: "student_card_number",
              header: "Carte Étudiant / Coordonnées",
              cell: (aff) => (
                <div>
                  <p className="font-mono text-navy font-bold text-xs">{aff.student_card_number as string}</p>
                  <p className="text-xs text-foreground-muted">{aff.faculty as string}</p>
                </div>
              ),
              hideOnMobile: true,
            },
            {
              key: "requested_at",
              header: "Date de demande",
              cell: (aff) => (
                <span className="text-foreground-muted">
                  {new Date(aff.requested_at as string).toLocaleDateString("fr-FR")}
                </span>
              ),
              hideOnMobile: true,
            },
            {
              key: "status",
              header: "Statut",
              cell: (aff) => getStatusBadge(aff.status as StudentAffiliation["status"]),
            },
            {
              key: "actions",
              header: "Actions de modération",
              className: "text-right",
              cell: (aff) => (
                <div className="flex justify-end gap-2 items-center">
                  {(aff.status as string) === "pending" ? (
                    <div className="inline-flex gap-2">
                      <button
                        onClick={() => handleApprove(aff.id as string)}
                        disabled={actioningId === aff.id}
                        className="p-1.5 rounded bg-success/10 text-success border border-success/20 hover:bg-success hover:text-white transition-all"
                        title="Approuver l'accès"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => { setRejectId(aff.id as string); setShowRejectModal(true); }}
                        disabled={actioningId === aff.id}
                        className="p-1.5 rounded bg-error/10 text-error border border-error/20 hover:bg-error hover:text-white transition-all"
                        title="Rejeter la demande"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-foreground-muted italic">Traité</span>
                  )}
                </div>
              ),
            },
          ]}
          mobileCard={(aff) => (
            <div className="space-y-3">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <p className="font-bold text-navy text-sm">{aff.student_name as string}</p>
                  <p className="text-xs text-foreground-muted">{aff.student_email as string}</p>
                </div>
                {getStatusBadge(aff.status as StudentAffiliation["status"])}
              </div>

              <div className="text-xs text-foreground-muted space-y-0.5">
                <p><span className="font-bold text-navy">Carte :</span> {aff.student_card_number as string}</p>
                <p><span className="font-bold text-navy">Faculté :</span> {aff.faculty as string}</p>
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-[10px] text-foreground-muted">
                  Demandé le {new Date(aff.requested_at as string).toLocaleDateString("fr-FR")}
                </span>
                
                {(aff.status as string) === "pending" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(aff.id as string)}
                      disabled={actioningId === aff.id}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded text-xs font-bold bg-success text-white"
                    >
                      <Check className="w-3.5 h-3.5" /> Valider
                    </button>
                    <button
                      onClick={() => { setRejectId(aff.id as string); setShowRejectModal(true); }}
                      disabled={actioningId === aff.id}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded text-xs font-bold bg-error text-white"
                    >
                      <X className="w-3.5 h-3.5" /> Refuser
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        />
      </div>

      {/* Modal: Rejection Reason Confirmation */}
      <Modal
        open={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        title={
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-error shrink-0" />
            <span>Rejeter l'affiliation étudiant</span>
          </div>
        }
        maxWidth={500}
        footer={
          <>
            <button 
              type="button"
              onClick={() => setShowRejectModal(false)}
              className="border border-border text-navy bg-background hover:bg-background-secondary text-xs font-bold px-4 py-2 rounded"
            >
              Annuler
            </button>
            <button 
              type="submit"
              form="reject-affiliation-form"
              className="bg-error hover:bg-error-hover text-white text-xs font-bold px-4 py-2 rounded"
            >
              Confirmer le rejet
            </button>
          </>
        }
      >
        <form id="reject-affiliation-form" onSubmit={handleRejectSubmit} className="space-y-4 pt-2 pb-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-navy">Motif du rejet *</label>
            <textarea 
              required
              rows={3}
              className="bg-background border border-border rounded p-3 text-sm focus:outline-none focus:border-navy resize-none"
              placeholder="Ex: Numéro de carte étudiant invalide ou expiré."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
        </form>
      </Modal>

    </div>
  );
}
