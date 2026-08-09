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
      {loading ? (
        <div className="p-6 space-y-4 animate-pulse bg-background border border-border rounded-xl">
          <div className="h-10 bg-background-secondary rounded" />
          <div className="h-10 bg-background-secondary rounded" />
        </div>
      ) : affiliations.length === 0 ? (
        <div className="p-12 text-center border border-border rounded-xl bg-background-secondary max-w-md mx-auto space-y-3">
          <UserCheck className="w-12 h-12 text-gold mx-auto" />
          <h3 className="text-base font-bold text-navy">Aucun étudiant</h3>
          <p className="text-xs text-foreground-muted">Aucune demande d'affiliation enregistrée pour le moment.</p>
        </div>
      ) : (
        <div className="bg-background border border-border rounded-xl shadow-sm overflow-hidden">
          
          {/* Desktop view */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-background-secondary border-b border-border text-navy font-bold text-xs uppercase tracking-wider">
                  <th className="p-4">Étudiant</th>
                  <th className="p-4">Carte Étudiant / Coordonnées</th>
                  <th className="p-4">Date de demande</th>
                  <th className="p-4">Statut</th>
                  <th className="p-4 text-right">Actions de modération</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {affiliations.map((aff) => (
                  <tr key={aff.id} className="hover:bg-background-secondary/30 transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-navy">{aff.student_name}</p>
                      <p className="text-xs text-foreground-muted">{aff.student_email}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-mono text-navy font-bold text-xs">{aff.student_card_number}</p>
                      <p className="text-xs text-foreground-muted">{aff.faculty}</p>
                    </td>
                    <td className="p-4 text-foreground-muted">
                      {new Date(aff.requested_at).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="p-4">{getStatusBadge(aff.status)}</td>
                    <td className="p-4 text-right">
                      {aff.status === "pending" ? (
                        <div className="inline-flex gap-2">
                          <button
                            onClick={() => handleApprove(aff.id)}
                            disabled={actioningId === aff.id}
                            className="p-1.5 rounded bg-success/10 text-success border border-success/20 hover:bg-success hover:text-white transition-all"
                            title="Approuver l'accès"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { setRejectId(aff.id); setShowRejectModal(true); }}
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile view */}
          <div className="md:hidden divide-y divide-border/40">
            {affiliations.map((aff) => (
              <div key={aff.id} className="p-4 space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <p className="font-bold text-navy text-sm">{aff.student_name}</p>
                    <p className="text-xs text-foreground-muted">{aff.student_email}</p>
                  </div>
                  {getStatusBadge(aff.status)}
                </div>

                <div className="text-xs text-foreground-muted space-y-0.5">
                  <p><span className="font-bold text-navy">Carte :</span> {aff.student_card_number}</p>
                  <p><span className="font-bold text-navy">Faculté :</span> {aff.faculty}</p>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-[10px] text-foreground-muted">
                    Demandé le {new Date(aff.requested_at).toLocaleDateString("fr-FR")}
                  </span>
                  
                  {aff.status === "pending" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(aff.id)}
                        disabled={actioningId === aff.id}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded text-xs font-bold bg-success text-white"
                      >
                        <Check className="w-3.5 h-3.5" /> Valider
                      </button>
                      <button
                        onClick={() => { setRejectId(aff.id); setShowRejectModal(true); }}
                        disabled={actioningId === aff.id}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded text-xs font-bold bg-error text-white"
                      >
                        <X className="w-3.5 h-3.5" /> Refuser
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* Modal: Rejection Reason Confirmation */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60">
          <div className="bg-background rounded-lg border border-border shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="border-b border-border pb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-error shrink-0" />
              <h3 className="font-serif text-lg font-bold text-navy">Rejeter l'affiliation étudiant</h3>
            </div>
            <form onSubmit={handleRejectSubmit} className="space-y-4">
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
              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="border border-border text-navy bg-background hover:bg-background-secondary text-xs font-bold px-4 py-2 rounded"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  className="bg-error hover:bg-error-hover text-white text-xs font-bold px-4 py-2 rounded"
                >
                  Confirmer le rejet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
