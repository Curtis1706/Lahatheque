"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { 
  ShoppingBag, 
  Search, 
  BookOpen, 
  Package, 
  FileText, 
  Filter,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Clock,
  Sparkles,
  ArrowLeft
} from "lucide-react";
import { StudentOrder, OrderFormatFilter, OrderStatusFilter } from "@/lib/types/student-orders";
import { fetchStudentOrders } from "@/lib/services/student-orders";
import { fetchStudentStudyStats } from "@/lib/services/student";
import { StudentStudyStats } from "@/lib/types/student";
import { StudentKpiCharts } from "@/components/features/student/student-kpi-charts";
import { OrderTrackerStepper } from "@/components/student/orders/OrderTrackerStepper";
import { OrderDetailModal } from "@/components/student/orders/OrderDetailModal";

export default function StudentOrdersPage() {
  const [orders, setOrders] = useState<StudentOrder[]>([]);
  const [stats, setStats] = useState<StudentStudyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [formatFilter, setFormatFilter] = useState<OrderFormatFilter>("all");
  const [statusFilter, setStatusFilter] = useState<OrderStatusFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [selectedOrderForModal, setSelectedOrderForModal] = useState<StudentOrder | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [ordersData, statsData] = await Promise.all([
        fetchStudentOrders(),
        fetchStudentStudyStats()
      ]);
      setOrders(ordersData);
      setStats(statsData);
      setLoading(false);
    }
    loadData();
  }, []);

  // Dérivation du badge selon la matrice statut_paiement × statut_commande × PhysicalDelivery.statut
  const renderStatusBadge = (order: StudentOrder) => {
    const { statut_paiement, statut_commande } = order;

    if (statut_paiement === "paid" && statut_commande === "completed") {
      return (
        <span className="px-2.5 py-1 rounded-full bg-success/10 text-success border border-success/30 font-bold text-[10px] uppercase">
          Payé & Livré
        </span>
      );
    }
    if (statut_paiement === "paid" && statut_commande !== "completed") {
      return (
        <span className="px-2.5 py-1 rounded-full bg-navy/10 text-navy border border-navy/30 font-bold text-[10px] uppercase">
          En Cours de Traitement
        </span>
      );
    }
    if (statut_paiement === "pending") {
      return (
        <span className="px-2.5 py-1 rounded-full bg-warning/10 text-warning border border-warning/30 font-bold text-[10px] uppercase">
          Paiement En Attente
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full bg-error/10 text-error border border-error/30 font-bold text-[10px] uppercase">
        Annulée / Échouée
      </span>
    );
  };

  // Filtrage combiné (Recherche, Format, Statut)
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // 1. Recherche texte (id commande ou titre ouvrage)
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        const matchId = order.id.toLowerCase().includes(query);
        const matchOuvrage = order.lignes.some((l) =>
          l.ouvrage_title.toLowerCase().includes(query)
        );
        if (!matchId && !matchOuvrage) return false;
      }

      // 2. Filtre par format (digital / paper)
      if (formatFilter === "digital") {
        if (!order.lignes.some(l => l.format_type === "digital")) return false;
      } else if (formatFilter === "paper") {
        if (!order.lignes.some(l => l.format_type === "paper")) return false;
      }

      // 3. Filtre par statut
      if (statusFilter === "completed") {
        if (order.statut_commande !== "completed" || order.statut_paiement !== "paid") return false;
      } else if (statusFilter === "in_progress") {
        if (order.statut_paiement !== "paid" || order.statut_commande === "completed") return false;
      } else if (statusFilter === "failed_cancelled") {
        if (order.statut_commande !== "cancelled" && order.statut_paiement !== "failed") return false;
      }

      return true;
    });
  }, [orders, searchQuery, formatFilter, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage) || 1;
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(start, start + itemsPerPage);
  }, [filteredOrders, currentPage, itemsPerPage]);

  return (
    <div className="space-y-8 max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* 1. VISUALISATIONS KPIS 21ST.DEV EN PREMIER */}
      {!loading && stats ? (
        <StudentKpiCharts stats={stats} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="bg-background border border-border p-5 rounded-2xl animate-pulse space-y-3 h-40" />
          ))}
        </div>
      )}
      
      {/* En-tête de section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <Link href="/student" className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Retour à mon espace
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
            <ShoppingBag className="w-4 h-4 text-gold" />
            Historique & Suivi des Commandes
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Mes Commandes & Factures
          </h1>
          <p className="text-xs text-foreground-muted mt-1">
            Retrouvez l&apos;intégralité de vos achats d&apos;ouvrages numériques et imprimés, et suivez l&apos;avancement des livraisons physiques.
          </p>
        </div>

        <Link
          href="/student/catalog"
          className="inline-flex items-center justify-center gap-2 bg-navy hover:bg-navy-hover text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-xs"
        >
          <BookOpen className="w-4 h-4 text-gold" />
          Parcourir le Catalogue
        </Link>
      </div>

      {/* Barre de Recherche et Filtres */}
      <div className="bg-background border border-border p-4 rounded-2xl space-y-4 shadow-xs">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Recherche */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-foreground-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher par N° de commande ou titre d'ouvrage..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-foreground placeholder:text-foreground-muted min-h-[40px]"
            />
          </div>

          {/* Filtres par format */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: "all", label: "Tous les formats" },
              { id: "digital", label: "Numérique" },
              { id: "paper", label: "Imprimé (Papier)" },
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => {
                  setFormatFilter(btn.id as OrderFormatFilter);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors border ${
                  formatFilter === btn.id
                    ? "bg-navy text-white border-navy"
                    : "bg-background-secondary text-foreground-muted border-border hover:text-navy"
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filtres par statut */}
        <div className="flex items-center gap-2 pt-2 border-t border-border overflow-x-auto">
          <span className="text-[11px] font-bold text-foreground-muted uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Filter className="w-3 h-3 text-gold" />
            Statut :
          </span>
          {[
            { id: "all", label: "Tous" },
            { id: "completed", label: "Livrées / Terminées" },
            { id: "in_progress", label: "En cours" },
            { id: "failed_cancelled", label: "Annulées / Échouées" },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => {
                setStatusFilter(st.id as OrderStatusFilter);
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors ${
                statusFilter === st.id
                  ? "bg-navy/10 text-navy border border-navy/30 font-bold"
                  : "text-foreground-muted hover:text-navy"
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Liste des Commandes */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-32 bg-background-secondary rounded-2xl" />
          <div className="h-32 bg-background-secondary rounded-2xl" />
        </div>
      ) : paginatedOrders.length === 0 ? (
        <div className="bg-background border border-border p-8 rounded-2xl text-center space-y-3">
          <Package className="w-10 h-10 text-foreground-muted mx-auto" />
          <h3 className="font-serif font-bold text-navy text-lg">Aucune commande trouvée</h3>
          <p className="text-xs text-foreground-muted">
            Aucun achat ne correspond à vos critères de recherche actuels.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {paginatedOrders.map((order) => {
            const hasPaperItem = order.lignes.some((l) => l.format_type === "paper");
            return (
              <div
                key={order.id}
                className="bg-background border border-border rounded-2xl p-5 space-y-4 shadow-xs hover:border-gold/50 transition-colors"
              >
                {/* En-tête de carte */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-serif font-bold text-navy text-sm">
                      {order.id}
                    </span>
                    <span className="text-xs text-foreground-muted">
                      Passée le {new Date(order.created_at).toLocaleDateString("fr-FR")}
                    </span>
                    {renderStatusBadge(order)}
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      onClick={() => setSelectedOrderForModal(order)}
                      className="px-3 py-1.5 rounded-xl bg-background-secondary border border-border text-navy text-xs font-semibold hover:border-gold transition-colors inline-flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5 text-gold" />
                      Détails & Facture
                    </button>
                  </div>
                </div>

                {/* Tracker de Livraison Physique (si présent) */}
                {hasPaperItem && order.livraison && (
                  <div className="bg-background-secondary p-4 rounded-xl border border-border space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-navy">
                      <span className="flex items-center gap-1.5">
                        <Package className="w-4 h-4 text-gold" />
                        Livraison physique ({order.livraison.city})
                      </span>
                      {order.livraison.tracking_number && (
                        <span className="text-[11px] font-mono text-foreground-muted">
                          Suivi : {order.livraison.tracking_number}
                        </span>
                      )}
                    </div>
                    <OrderTrackerStepper status={order.livraison.statut} />
                  </div>
                )}

                {/* Articles de la commande */}
                <div className="space-y-2">
                  {order.lignes.map((ligne) => (
                    <div key={ligne.id} className="flex items-center justify-between gap-4 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <BookOpen className="w-4 h-4 text-gold shrink-0" />
                        <span className="font-semibold text-navy truncate">
                          {ligne.ouvrage_title}
                        </span>
                        <span className="text-[10px] text-foreground-muted bg-background-secondary px-2 py-0.5 rounded border border-border shrink-0">
                          {ligne.format_type === "paper" ? "Imprimé" : "Numérique"}
                        </span>
                      </div>
                      <span className="font-serif font-bold text-navy shrink-0">
                        {Number(ligne.unit_price).toLocaleString("fr-FR")} {order.currency || "FCFA"}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Pied de carte : Total */}
                <div className="flex items-center justify-between pt-2 border-t border-border text-xs">
                  <span className="text-foreground-muted">
                    Total TTC ({order.lignes.length} article{order.lignes.length > 1 ? "s" : ""})
                  </span>
                  <strong className="font-serif text-navy text-base font-bold">
                    {Number(order.total_amount).toLocaleString("fr-FR")} {order.currency || "FCFA"}
                  </strong>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-border pt-4 text-xs text-foreground-muted">
          <span>Page {currentPage} sur {totalPages}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg bg-background-secondary border border-border disabled:opacity-40 hover:border-gold transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg bg-background-secondary border border-border disabled:opacity-40 hover:border-gold transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modale de Détail de Commande */}
      {selectedOrderForModal && (
        <OrderDetailModal
          order={selectedOrderForModal}
          isOpen={!!selectedOrderForModal}
          onClose={() => setSelectedOrderForModal(null)}
        />
      )}
    </div>
  );
}
