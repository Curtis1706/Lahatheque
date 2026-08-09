"use client";

import { useEffect, useState } from "react";
import { 
  getPublisherStats, 
  getBookSubmissions, 
  deleteBookSubmission 
} from "@/lib/services/publisher";
import { BookSubmission, PublisherStats } from "@/lib/types/publisher";
import { 
  DollarSign, 
  Eye, 
  Download, 
  BookOpen, 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  TrendingUp,
  DownloadCloud,
  ChevronRight
} from "lucide-react";
import Link from "next/link";
import { KpiGrid, type KpiCardProps } from "@/components/ui/kpi-card";

export default function PublisherDashboardPage() {
  const [stats, setStats] = useState<PublisherStats | null>(null);
  const [submissions, setSubmissions] = useState<BookSubmission[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<BookSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtres
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Modales & Détails
  const [selectedBook, setSelectedBook] = useState<BookSubmission | null>(null);
  const [bookToDelete, setBookToDelete] = useState<BookSubmission | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [statsData, submissionsData] = await Promise.all([
          getPublisherStats(),
          getBookSubmissions()
        ]);
        setStats(statsData);
        setSubmissions(submissionsData);
        setFilteredSubmissions(submissionsData);
        setError(null);
      } catch (err) {
        setError("Impossible de charger les données du tableau de bord. Veuillez réessayer.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Filtrer les soumissions à chaque changement de filtres
  useEffect(() => {
    let result = submissions;

    if (searchTerm) {
      result = result.filter(sub => 
        sub.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.authors.some(author => author.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (statusFilter !== "all") {
      result = result.filter(sub => sub.status === statusFilter);
    }

    setFilteredSubmissions(result);
  }, [searchTerm, statusFilter, submissions]);

  const handleDelete = async (id: string) => {
    if (!bookToDelete) return;
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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-bold bg-success/10 text-success border border-success/20">
            <CheckCircle className="w-3.5 h-3.5" />
            Approuvé
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-bold bg-warning/10 text-warning border border-warning/20">
            <Clock className="w-3.5 h-3.5" />
            En attente
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-bold bg-error/10 text-error border border-error/20">
            <XCircle className="w-3.5 h-3.5" />
            Rejeté
          </span>
        );
      case "draft":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-bold bg-navy-hover/10 text-foreground-muted border border-navy-hover/20">
            <FileText className="w-3.5 h-3.5" />
            Brouillon
          </span>
        );
    }
  };

  const formatSalesModel = (model: BookSubmission["sales_model"]) => {
    switch (model) {
      case "purchase": return "Vente à l'unité";
      case "subscription": return "Abonnement Bouquet";
      case "free": return "Accès libre";
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-8">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl lg:text-3xl font-bold text-navy">Espace Éditeur Tiers</h1>
          <p className="text-sm text-foreground-muted">Gérez vos dépôts et suivez l'usage de vos ouvrages.</p>
        </div>
        <Link 
          href="/publisher/submissions/new"
          className="inline-flex items-center justify-center gap-2 bg-gold hover:bg-gold-dark text-white font-bold text-sm px-5 py-3 rounded transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Soumettre un ouvrage
        </Link>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-error/10 border border-error/20 p-4 rounded text-error text-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-bold">Erreur de chargement</p>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="bg-background border border-border p-5 rounded-2xl animate-pulse space-y-3 h-36">
              <div className="w-10 h-10 rounded-xl bg-background-secondary" />
              <div className="h-7 w-20 bg-background-secondary rounded" />
              <div className="h-3.5 w-32 bg-background-secondary rounded" />
            </div>
          ))}
        </div>
      ) : (
        stats && (
          <KpiGrid
            cols={4}
            cards={[
              {
                label: "Redevances cumulées",
                value: stats.total_royalties,
                formatValue: (v) => `${v.toLocaleString("fr-FR")} FCFA`,
                icon: DollarSign,
                trend: 12,
                sparkline: [30, 45, 40, 60, 55, 75, 70],
              },
              {
                label: "Consultations",
                value: stats.total_views,
                icon: Eye,
                trend: 8,
                sparkline: [20, 35, 50, 45, 65, 60, 80],
              },
              {
                label: "Téléchargements",
                value: stats.total_downloads,
                icon: Download,
                trend: -3,
                sparkline: [70, 65, 55, 60, 45, 50, 40],
              },
              {
                label: "Commission de distribution",
                value: stats.average_commission_rate,
                formatValue: (v) => `${v}%`,
                icon: TrendingUp,
              },
            ] satisfies KpiCardProps[]}
          />
        )
      )}

      {/* Catalogue / Table Section */}
      <div className="bg-background border border-border rounded shadow-sm overflow-hidden">
        
        {/* Filters bar */}
        <div className="p-4 border-b border-border flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative flex-grow max-w-md">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-foreground-muted">
              <Search className="w-4 h-4" />
            </span>
            <input 
              type="text" 
              placeholder="Rechercher par titre, auteur..."
              className="w-full bg-background border border-border rounded pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                className="bg-background border border-border rounded text-sm pl-8 pr-8 py-2 focus:outline-none focus:border-navy appearance-none cursor-pointer"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">Tous les statuts</option>
                <option value="draft">Brouillons</option>
                <option value="pending">En attente</option>
                <option value="approved">Approuvés</option>
                <option value="rejected">Rejetés</option>
              </select>
              <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-foreground-muted">
                <Filter className="w-3.5 h-3.5" />
              </span>
              <span className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none text-foreground-muted">
                <ChevronRight className="w-3.5 h-3.5 rotate-90" />
              </span>
            </div>

            <button className="inline-flex items-center gap-2 border border-border text-navy bg-background hover:bg-background-secondary font-bold text-sm px-4 py-2 rounded transition-colors shadow-sm">
              <DownloadCloud className="w-4 h-4" />
              Exporter
            </button>
          </div>
        </div>

        {/* Table & Cards container */}
        <div>
          {loading ? (
            // Skeletons de chargement de la table
            <div className="p-6 space-y-4 animate-pulse">
              <div className="h-10 bg-background-secondary rounded" />
              <div className="h-12 bg-background-secondary rounded" />
              <div className="h-12 bg-background-secondary rounded" />
              <div className="h-12 bg-background-secondary rounded" />
            </div>
          ) : (
            <>
              {filteredSubmissions.length === 0 ? (
                // Empty State
                <div className="p-12 text-center max-w-md mx-auto space-y-4">
                  <div className="w-16 h-16 rounded-full bg-navy-hover/10 text-navy flex items-center justify-center mx-auto">
                    <BookOpen className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-navy">Aucun ouvrage trouvé</h3>
                  <p className="text-sm text-foreground-muted">
                    {searchTerm || statusFilter !== "all" 
                      ? "Aucun résultat ne correspond à vos critères de recherche ou de filtre." 
                      : "Vous n'avez pas encore soumis de manuscrit ou d'ouvrage sur la plateforme."}
                  </p>
                  {(searchTerm || statusFilter !== "all") && (
                    <button 
                      onClick={() => { setSearchTerm(""); setStatusFilter("all"); }}
                      className="text-gold font-bold text-sm hover:underline"
                    >
                      Réinitialiser les filtres
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {/* Table Desktop (lg breakpoint) */}
                  <div className="hidden lg:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-background-secondary border-b border-border text-navy font-bold text-xs uppercase tracking-wider">
                          <th className="p-4">Ouvrage</th>
                          <th className="p-4">Auteurs</th>
                          <th className="p-4">Modèle commercial</th>
                          <th className="p-4">Prix</th>
                          <th className="p-4">Statut</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border text-sm">
                        {filteredSubmissions.map((sub) => (
                          <tr key={sub.id} className="hover:bg-background-secondary/40 transition-colors">
                            <td className="p-4">
                              <p className="font-bold text-navy">{sub.title}</p>
                              {sub.subtitle && <p className="text-xs text-foreground-muted">{sub.subtitle}</p>}
                            </td>
                            <td className="p-4 text-foreground-muted">{sub.authors.join(", ")}</td>
                            <td className="p-4">{formatSalesModel(sub.sales_model)}</td>
                            <td className="p-4 font-bold text-navy">{sub.price.toLocaleString()} {sub.currency}</td>
                            <td className="p-4">{getStatusBadge(sub.status)}</td>
                            <td className="p-4 text-right space-x-2">
                              <button 
                                onClick={() => setSelectedBook(sub)}
                                className="text-gold hover:text-gold-dark font-bold text-xs"
                              >
                                Détails
                              </button>
                              {sub.status === "draft" && (
                                <button 
                                  onClick={() => setBookToDelete(sub)}
                                  className="text-error hover:text-red-700 inline-flex items-center justify-center p-1"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Cards Mobile & Tablet (under lg) */}
                  <div className="lg:hidden divide-y divide-border">
                    {filteredSubmissions.map((sub) => (
                      <div key={sub.id} className="p-4 space-y-3 hover:bg-background-secondary/20 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-bold text-navy text-base">{sub.title}</p>
                            {sub.subtitle && <p className="text-xs text-foreground-muted">{sub.subtitle}</p>}
                          </div>
                          {getStatusBadge(sub.status)}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-foreground-muted block">Auteurs :</span>
                            <span className="font-medium">{sub.authors.join(", ")}</span>
                          </div>
                          <div>
                            <span className="text-foreground-muted block">Modèle :</span>
                            <span className="font-medium">{formatSalesModel(sub.sales_model)}</span>
                          </div>
                          <div>
                            <span className="text-foreground-muted block">Prix :</span>
                            <span className="font-bold text-navy">{sub.price.toLocaleString()} {sub.currency}</span>
                          </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                          {sub.status === "draft" && (
                            <button 
                              onClick={() => setBookToDelete(sub)}
                              className="text-error border border-error/20 hover:bg-error/5 text-xs font-bold px-3 py-1.5 rounded flex items-center gap-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Supprimer
                            </button>
                          )}
                          <button 
                            onClick={() => setSelectedBook(sub)}
                            className="bg-gold hover:bg-gold-dark text-white text-xs font-bold px-4 py-1.5 rounded"
                          >
                            Détails
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>

      </div>

      {/* Modal: Book Details */}
      {selectedBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60">
          <div className="bg-background rounded-lg border border-border shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold text-navy">Fiche détaillée du dépôt</h3>
              <button 
                onClick={() => setSelectedBook(null)}
                className="text-foreground-muted hover:text-navy"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <h4 className="text-xl font-serif font-bold text-navy">{selectedBook.title}</h4>
                {selectedBook.subtitle && <p className="text-sm text-foreground-muted">{selectedBook.subtitle}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-foreground-muted block">Statut du dépôt :</span>
                  <div className="mt-1">{getStatusBadge(selectedBook.status)}</div>
                </div>
                <div>
                  <span className="text-foreground-muted block">Date de dépôt :</span>
                  <span className="font-bold text-navy">{new Date(selectedBook.created_at).toLocaleDateString("fr-FR")}</span>
                </div>
                <div>
                  <span className="text-foreground-muted block">Auteurs :</span>
                  <span className="font-medium text-navy">{selectedBook.authors.join(", ")}</span>
                </div>
                <div>
                  <span className="text-foreground-muted block">Modèle commercial :</span>
                  <span className="font-medium text-navy">{formatSalesModel(selectedBook.sales_model)}</span>
                </div>
                <div>
                  <span className="text-foreground-muted block">Prix public :</span>
                  <span className="font-bold text-navy">{selectedBook.price.toLocaleString()} {selectedBook.currency}</span>
                </div>
                {selectedBook.isbn_digital && (
                  <div>
                    <span className="text-foreground-muted block">ISBN Numérique :</span>
                    <span className="font-medium text-navy">{selectedBook.isbn_digital}</span>
                  </div>
                )}
              </div>

              {selectedBook.reject_reason && (
                <div className="bg-error/5 border border-error/20 p-4 rounded text-error text-sm">
                  <p className="font-bold mb-1">Motif du rejet :</p>
                  <p>{selectedBook.reject_reason}</p>
                </div>
              )}

              <div className="pt-4 border-t border-border">
                <span className="text-foreground-muted block text-xs font-bold uppercase tracking-wider mb-2">Résumé / Présentation</span>
                <p className="text-sm leading-relaxed text-foreground-muted">{selectedBook.summary}</p>
              </div>
            </div>
            <div className="p-6 border-t border-border flex justify-end">
              <button 
                onClick={() => setSelectedBook(null)}
                className="bg-navy hover:bg-navy-hover text-white text-sm font-bold px-6 py-2 rounded"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirm Delete */}
      {bookToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60">
          <div className="bg-background rounded-lg border border-border shadow-2xl max-w-md w-full p-6 space-y-6">
            <div className="flex items-center gap-3 text-error">
              <AlertTriangle className="w-8 h-8 shrink-0" />
              <h3 className="text-lg font-bold">Confirmer la suppression</h3>
            </div>
            <p className="text-sm text-foreground-muted">
              Êtes-vous sûr de vouloir supprimer définitivement le brouillon de l'ouvrage <span className="font-bold text-navy">"{bookToDelete.title}"</span> ? Cette action est irréversible.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setBookToDelete(null)}
                className="border border-border text-navy bg-background hover:bg-background-secondary text-sm font-bold px-4 py-2 rounded"
              >
                Annuler
              </button>
              <button 
                onClick={() => handleDelete(bookToDelete.id)}
                className="bg-error hover:bg-red-700 text-white text-sm font-bold px-4 py-2 rounded"
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
