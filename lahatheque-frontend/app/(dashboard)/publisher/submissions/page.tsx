"use client";

import { useEffect, useState } from "react";
import { getBookSubmissions, deleteBookSubmission } from "@/lib/services/publisher";
import { BookSubmission } from "@/lib/types/publisher";
import { 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  CheckCircle, 
  Clock, 
  XCircle, 
  FileText, 
  ArrowRight,
  Eye,
  AlertTriangle
} from "lucide-react";
import Link from "next/link";

export default function SubmissionsListPage() {
  const [submissions, setSubmissions] = useState<BookSubmission[]>([]);
  const [filtered, setFiltered] = useState<BookSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedBook, setSelectedBook] = useState<BookSubmission | null>(null);
  const [bookToDelete, setBookToDelete] = useState<BookSubmission | null>(null);

  useEffect(() => {
    async function loadSubmissions() {
      try {
        setLoading(true);
        const data = await getBookSubmissions();
        setSubmissions(data);
        setFiltered(data);
      } catch (err) {
        console.error("Erreur de chargement des soumissions", err);
      } finally {
        setLoading(false);
      }
    }
    loadSubmissions();
  }, []);

  useEffect(() => {
    let result = submissions;
    if (searchTerm) {
      result = result.filter(sub => 
        sub.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.authors.some(a => a.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    if (statusFilter !== "all") {
      result = result.filter(sub => sub.status === statusFilter);
    }
    setFiltered(result);
  }, [searchTerm, statusFilter, submissions]);

  const handleDelete = async (id: string) => {
    try {
      const success = await deleteBookSubmission(id);
      if (success) {
        setSubmissions(prev => prev.filter(sub => sub.id !== id));
      }
    } catch (err) {
      alert("Une erreur est survenue lors de la suppression.");
    } finally {
      setBookToDelete(null);
    }
  };

  const getStatusBadge = (status: BookSubmission["status"]) => {
    switch (status) {
      case "approved":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-success/10 text-success border border-success/20">
            <CheckCircle className="w-3 h-3" /> Approved
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-warning/10 text-warning border border-warning/20">
            <Clock className="w-3 h-3" /> En attente
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-error/10 text-error border border-error/20">
            <XCircle className="w-3 h-3" /> Rejeté
          </span>
        );
      case "draft":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-navy-hover/10 text-foreground-muted border border-navy-hover/20">
            <FileText className="w-3 h-3" /> Brouillon
          </span>
        );
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl lg:text-3xl font-bold text-navy">Vos Soumissions</h1>
          <p className="text-sm text-foreground-muted">Historique complet des manuscrits déposés pour validation.</p>
        </div>
        <Link 
          href="/publisher/submissions/new"
          className="inline-flex items-center justify-center gap-2 bg-gold hover:bg-gold-dark text-white font-bold text-sm px-5 py-3 rounded shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Nouveau Dépôt
        </Link>
      </div>

      {/* Table Container */}
      <div className="bg-background border border-border rounded shadow-sm overflow-hidden">
        
        {/* Filters */}
        <div className="p-4 border-b border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:max-w-xs">
            <input 
              type="text" 
              placeholder="Rechercher un ouvrage..."
              className="w-full bg-background border border-border rounded pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-navy"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="w-4 h-4 text-foreground-muted absolute left-3 top-3" />
          </div>

          <div className="relative w-full sm:w-auto">
            <select
              className="w-full bg-background border border-border rounded text-sm pl-8 pr-8 py-2 focus:outline-none focus:border-navy appearance-none cursor-pointer"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Tous les statuts</option>
              <option value="draft">Brouillons</option>
              <option value="pending">En attente</option>
              <option value="approved">Approuvés</option>
              <option value="rejected">Rejetés</option>
            </select>
            <Filter className="w-3.5 h-3.5 text-foreground-muted absolute left-2.5 top-3" />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="p-6 space-y-4 animate-pulse">
            <div className="h-10 bg-background-secondary rounded" />
            <div className="h-12 bg-background-secondary rounded" />
            <div className="h-12 bg-background-secondary rounded" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center max-w-sm mx-auto space-y-3">
            <div className="w-12 h-12 rounded-full bg-navy-hover/10 text-navy flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-navy">Aucune soumission</h3>
            <p className="text-xs text-foreground-muted">Aucun ouvrage ne correspond à vos filtres actuels.</p>
          </div>
        ) : (
          <>
            {/* Desktop View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-background-secondary border-b border-border text-navy font-bold text-xs uppercase tracking-wider">
                    <th className="p-4">Titre</th>
                    <th className="p-4">Auteur(s)</th>
                    <th className="p-4">Date de dépôt</th>
                    <th className="p-4">Statut</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm">
                  {filtered.map((sub) => (
                    <tr key={sub.id} className="hover:bg-background-secondary/30 transition-colors">
                      <td className="p-4">
                        <span className="font-bold text-navy">{sub.title}</span>
                      </td>
                      <td className="p-4 text-foreground-muted">{sub.authors.join(", ")}</td>
                      <td className="p-4 text-foreground-muted">
                        {new Date(sub.created_at).toLocaleDateString("fr-FR")}
                      </td>
                      <td className="p-4">{getStatusBadge(sub.status)}</td>
                      <td className="p-4 text-right space-x-2">
                        <button 
                          onClick={() => setSelectedBook(sub)}
                          className="text-gold hover:text-gold-dark font-bold text-xs"
                        >
                          Consulter
                        </button>
                        {sub.status === "draft" && (
                          <button 
                            onClick={() => setBookToDelete(sub)}
                            className="text-error hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4 inline" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden divide-y divide-border">
              {filtered.map((sub) => (
                <div key={sub.id} className="p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-navy text-sm">{sub.title}</span>
                    {getStatusBadge(sub.status)}
                  </div>
                  <p className="text-xs text-foreground-muted">Auteurs : {sub.authors.join(", ")}</p>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-[10px] text-foreground-muted">
                      Déposé le {new Date(sub.created_at).toLocaleDateString("fr-FR")}
                    </span>
                    <div className="flex items-center gap-3">
                      {sub.status === "draft" && (
                        <button 
                          onClick={() => setBookToDelete(sub)}
                          className="text-error"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      <button 
                        onClick={() => setSelectedBook(sub)}
                        className="bg-gold text-white text-xs font-bold px-3 py-1 rounded"
                      >
                        Consulter
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

      </div>

      {/* Details Modal */}
      {selectedBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60">
          <div className="bg-background rounded-lg border border-border shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold text-navy">Soumission {selectedBook.id}</h3>
              <button onClick={() => setSelectedBook(null)} className="text-foreground-muted hover:text-navy">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-sm">
              <div>
                <span className="text-foreground-muted block text-xs uppercase tracking-wider">Titre de l'ouvrage</span>
                <span className="text-base font-bold text-navy">{selectedBook.title}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-foreground-muted block text-xs">Date de dépôt</span>
                  <span className="font-medium">{new Date(selectedBook.created_at).toLocaleDateString("fr-FR")}</span>
                </div>
                <div>
                  <span className="text-foreground-muted block text-xs">Statut</span>
                  <span className="block mt-1">{getStatusBadge(selectedBook.status)}</span>
                </div>
              </div>
              <div>
                <span className="text-foreground-muted block text-xs">Auteurs</span>
                <span className="font-medium">{selectedBook.authors.join(", ")}</span>
              </div>
              <div>
                <span className="text-foreground-muted block text-xs">Résumé</span>
                <p className="text-foreground-muted mt-1 leading-relaxed bg-background-secondary p-3 rounded border border-border text-xs">
                  {selectedBook.summary}
                </p>
              </div>
              {selectedBook.reject_reason && (
                <div className="bg-error/5 border border-error/20 p-3 rounded text-error text-xs">
                  <span className="font-bold block mb-1">Motif de rejet :</span>
                  <span>{selectedBook.reject_reason}</span>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-border flex justify-end">
              <button 
                onClick={() => setSelectedBook(null)}
                className="bg-navy hover:bg-navy-hover text-white text-xs font-bold px-5 py-2 rounded"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {bookToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60">
          <div className="bg-background rounded-lg border border-border shadow-2xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center gap-3 text-error">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-bold">Confirmer la suppression</h3>
            </div>
            <p className="text-xs text-foreground-muted leading-relaxed">
              Voulez-vous vraiment supprimer le brouillon de l'ouvrage <span className="font-bold text-navy">"{bookToDelete.title}"</span> ?
            </p>
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setBookToDelete(null)}
                className="border border-border text-navy bg-background hover:bg-background-secondary text-xs font-bold px-4 py-2 rounded"
              >
                Annuler
              </button>
              <button 
                onClick={() => handleDelete(bookToDelete.id)}
                className="bg-error hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

