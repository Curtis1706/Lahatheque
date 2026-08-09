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
  Trash2, 
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  TrendingUp,
  DownloadCloud
} from "lucide-react";
import Link from "next/link";
import { KpiGrid, type KpiCardProps } from "@/components/ui/kpi-card";
import { DataTable } from "@/components/ui/data-table";
import { Modal } from "@/components/ui/modal";

export default function PublisherDashboardPage() {
  const [stats, setStats] = useState<PublisherStats | null>(null);
  const [submissions, setSubmissions] = useState<BookSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
        setError(null);
      } catch (err) {
        setError("Impossible de charger les données du tableau de bord. Veuillez réessayer.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

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

      {/* Catalogue — DataTable (21st.dev #22162, felipemenezes098/table-12) */}
      <DataTable
        data={submissions}
        rowKey="id"
        loading={loading}
        skeletonRows={4}
        searchPlaceholder="Rechercher par titre, auteur..."
        filterKey="status"
        filterPlaceholder="Tous les statuts"
        filterOptions={[
          { value: "draft", label: "Brouillon" },
          { value: "pending", label: "En attente" },
          { value: "approved", label: "Approuvé" },
          { value: "rejected", label: "Rejeté" },
        ]}
        emptyMessage="Vous n'avez pas encore soumis de manuscrit ou d'ouvrage sur la plateforme."
        headerActions={
          <button className="inline-flex items-center gap-2 border border-border text-navy bg-background hover:bg-background-secondary font-bold text-sm px-4 py-2.5 rounded-xl transition-colors shadow-sm">
            <DownloadCloud className="w-4 h-4" />
            Exporter
          </button>
        }
        columns={[
          {
            key: "title",
            header: "Ouvrage",
            cell: (sub) => (
              <div>
                <p className="font-bold text-navy">{sub.title}</p>
                {sub.subtitle && <p className="text-xs text-foreground-muted">{sub.subtitle}</p>}
              </div>
            ),
          },
          {
            key: "authors",
            header: "Auteurs",
            cell: (sub) => (
              <span className="text-foreground-muted">{(sub.authors as string[]).join(", ")}</span>
            ),
            hideOnMobile: true,
          },
          {
            key: "sales_model",
            header: "Modèle",
            cell: (sub) => formatSalesModel(sub.sales_model as BookSubmission["sales_model"]),
            hideOnMobile: true,
          },
          {
            key: "price",
            header: "Prix",
            cell: (sub) => (
              <span className="font-bold text-navy">
                {(sub.price as number).toLocaleString()} {sub.currency as string}
              </span>
            ),
            hideOnMobile: true,
          },
          {
            key: "status",
            header: "Statut",
            cell: (sub) => getStatusBadge(sub.status as BookSubmission["status"]),
          },
          {
            key: "id",
            header: "Actions",
            className: "text-right",
            cell: (sub) => (
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedBook(sub as unknown as BookSubmission); }}
                  className="text-gold hover:text-gold-dark font-bold text-xs"
                >
                  Détails
                </button>
                {sub.status === "draft" && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setBookToDelete(sub as unknown as BookSubmission); }}
                    className="text-error hover:text-red-700 inline-flex items-center justify-center p-1"
                    title="Supprimer ce brouillon"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ),
          },
        ]}
        mobileCard={(sub) => (
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-bold text-navy text-base">{sub.title as string}</p>
                {sub.subtitle && <p className="text-xs text-foreground-muted">{sub.subtitle as string}</p>}
              </div>
              {getStatusBadge(sub.status as BookSubmission["status"])}
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-foreground-muted block">Auteurs :</span>
                <span className="font-medium">{(sub.authors as string[]).join(", ")}</span>
              </div>
              <div>
                <span className="text-foreground-muted block">Modèle :</span>
                <span className="font-medium">{formatSalesModel(sub.sales_model as BookSubmission["sales_model"])}</span>
              </div>
              <div>
                <span className="text-foreground-muted block">Prix :</span>
                <span className="font-bold text-navy">{(sub.price as number).toLocaleString()} {sub.currency as string}</span>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-1">
              {sub.status === "draft" && (
                <button
                  onClick={(e) => { e.stopPropagation(); setBookToDelete(sub as unknown as BookSubmission); }}
                  className="text-error border border-error/20 hover:bg-error/5 text-xs font-bold px-3 py-1.5 rounded flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Supprimer
                </button>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); setSelectedBook(sub as unknown as BookSubmission); }}
                className="bg-gold hover:bg-gold-dark text-white text-xs font-bold px-4 py-1.5 rounded"
              >
                Détails
              </button>
            </div>
          </div>
        )}
      />


      {/* Modal: Book Details */}
      <Modal
        open={selectedBook !== null}
        onClose={() => setSelectedBook(null)}
        title="Fiche détaillée du dépôt"
        maxWidth={650}
        footer={
          <button 
            onClick={() => setSelectedBook(null)}
            className="bg-navy hover:bg-navy-hover text-white text-sm font-bold px-6 py-2 rounded"
          >
            Fermer
          </button>
        }
      >
        {selectedBook && (
          <div className="space-y-6 pt-2">
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
        )}
      </Modal>

      {/* Modal: Confirm Delete */}
      <Modal
        open={bookToDelete !== null}
        onClose={() => setBookToDelete(null)}
        title={
          <div className="flex items-center gap-3 text-error">
            <AlertTriangle className="w-6 h-6 shrink-0" />
            <span>Confirmer la suppression</span>
          </div>
        }
        maxWidth={450}
        footer={
          <>
            <button 
              onClick={() => setBookToDelete(null)}
              className="border border-border text-navy bg-background hover:bg-background-secondary text-sm font-bold px-4 py-2 rounded"
            >
              Annuler
            </button>
            <button 
              onClick={() => bookToDelete && handleDelete(bookToDelete.id)}
              className="bg-error hover:bg-red-700 text-white text-sm font-bold px-4 py-2 rounded"
            >
              Supprimer
            </button>
          </>
        }
      >
        {bookToDelete && (
          <p className="text-sm text-foreground-muted pt-2 pb-2">
            Êtes-vous sûr de vouloir supprimer définitivement le brouillon de l'ouvrage <span className="font-bold text-navy">"{bookToDelete.title}"</span> ? Cette action est irréversible.
          </p>
        )}
      </Modal>

    </div>
  );
}
