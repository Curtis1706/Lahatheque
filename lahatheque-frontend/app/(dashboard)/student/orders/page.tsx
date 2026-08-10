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
  Sparkles
} from "lucide-react";
import { StudentOrder, OrderFormatFilter, OrderStatusFilter } from "@/lib/types/student-orders";
import { fetchStudentOrders } from "@/lib/services/student-orders";
import { OrderTrackerStepper } from "@/components/student/orders/OrderTrackerStepper";
import { OrderDetailModal } from "@/components/student/orders/OrderDetailModal";

export default function StudentOrdersPage() {
  const [orders, setOrders] = useState<StudentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [formatFilter, setFormatFilter] = useState<OrderFormatFilter>("all");
  const [statusFilter, setStatusFilter] = useState<OrderStatusFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [selectedOrderForModal, setSelectedOrderForModal] = useState<StudentOrder | null>(null);

  useEffect(() => {
    async function loadOrders() {
      setLoading(true);
      const data = await fetchStudentOrders();
      setOrders(data);
      setLoading(false);
    }
    loadOrders();
  }, []);

  // Dérivation du badge selon la matrice statut_paiement × statut_commande × PhysicalDelivery.statut
  const renderStatusBadge = (order: StudentOrder) => {
    const { statut_paiement, statut_commande, livraison } = order;

    if (statut_paiement === "paid" && statut_commande === "completed") {
      return (
        <span className="px-2.5 py-1 rounded-full bg-success/10 text-success border border-success/30 font-bold text-[10px] uppercase">
          Payé & Livré
        </span>
      );
    }

    if (statut_paiement === "paid" && (statut_commande === "processing" || statut_commande === "pending")) {
      const deliveryText = livraison?.statut === "expedie" ? "Payé - Expédié" : "Payé - Expédition en cours";
      return (
        <span className="px-2.5 py-1 rounded-full bg-gold/10 text-gold-dark border border-gold/30 font-bold text-[10px] uppercase">
          {deliveryText}
        </span>
      );
    }

    if (statut_paiement === "pending") {
      return (
        <span className="px-2.5 py-1 rounded-full bg-gold/10 text-gold-dark border border-gold/30 font-bold text-[10px] uppercase">
          Paiement en attente
        </span>
      );
    }

    if (statut_paiement === "refunded") {
      return (
        <span className="px-2.5 py-1 rounded-full bg-background-secondary text-foreground-muted border border-border font-bold text-[10px] uppercase">
          Remboursé
        </span>
      );
    }

    return (
      <span className="px-2.5 py-1 rounded-full bg-error/10 text-error border border-error/30 font-bold text-[10px] uppercase">
        {statut_paiement === "failed" ? "Échoué" : statut_commande === "cancelled" ? "Annulé" : statut_paiement}
      </span>
    );
  };

  // Filtrage combiné par recherche, format et statut
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // 1. Recherche texte (N° commande ou titre ouvrage)
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        order.id.toLowerCase().includes(q) || 
        order.lignes.some(l => l.ouvrage_title.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      // 2. Filtre par format
      if (formatFilter === "digital") {
        if (!order.lignes.some(l => l.format_type === "digital")) return false;
      } else if (formatFilter === "paper") {
        if (!order.lignes.some(l => l.format_type === "paper")) return false;
      }

      // 3. Filtre par statut (selon la matrice d'or)
      if (statusFilter === "in_progress") {
        const isInProgress = order.statut_paiement === "pending" || 
          (order.statut_paiement === "paid" && order.statut_commande !== "completed");
        if (!isInProgress) return false;
      } else if (statusFilter === "completed") {
        const isCompleted = order.statut_paiement === "paid" && order.statut_commande === "completed";
        if (!isCompleted) return false;
      } else if (statusFilter === "failed_cancelled") {
        const isFailed = order.statut_paiement === "failed" || 
          order.statut_paiement === "refunded" || 
          order.statut_commande === "cancelled";
        if (!isFailed) return false;
      }

      return true;
    });
  }, [orders, searchQuery, formatFilter, statusFilter]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / itemsPerPage));
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(start, start + itemsPerPage);
  }, [filteredOrders, currentPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      
      {/* Header avec Titre & Actions Commander */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
            <ShoppingBag className="w-4 h-4 text-gold" />
            Espace Étudiant
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Mes Commandes & Suivi d'Achats
          </h1>
          <p className="text-xs text-foreground-muted mt-1">
            Consultez vos reçus d'achat, débloquez vos ouvrages numériques et suivez vos livraisons physiques.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0 self-start md:self-auto">
          <Link
            href="/cart"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-background-secondary hover:bg-background text-navy text-xs font-bold transition-all shadow-xs"
          >
            <ShoppingBag className="w-4 h-4 text-gold" />
            Mon Panier
          </Link>
          <Link
            href="/student/catalog"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gold hover:bg-gold-hover text-navy text-xs font-bold transition-all shadow-md active:scale-95"
          >
            <BookOpen className="w-4 h-4" />
            Passer une commande
          </Link>
        </div>
      </div>

      {/* Barre de Recherche & Filtres Doubles (Format & Statut) */}
      <div className="bg-background border border-border rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm">
        
        {/* Recherche rapide */}
        <div className="relative">
          <Search className="w-4 h-4 text-foreground-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            placeholder="Rechercher par N° de commande ou titre d'ouvrage..."
            className="w-full pl-10 pr-4 py-2.5 bg-background-secondary border border-border rounded-xl text-xs text-foreground focus:outline-none focus:border-navy transition-colors"
          />
        </div>

        {/* Filtres doubles */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs pt-2 border-t border-border">
          
          {/* Filter Format */}
          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            <span className="text-[10px] font-bold uppercase tracking-wider text-navy mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3 text-gold" /> Format:
            </span>
            <button
              onClick={() => { setFormatFilter("all"); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                formatFilter === "all" ? "bg-navy text-white shadow-sm" : "bg-background-secondary text-foreground-muted hover:text-navy"
              }`}
            >
              Tous
            </button>
            <button
              onClick={() => { setFormatFilter("digital"); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                formatFilter === "digital" ? "bg-navy text-white shadow-sm" : "bg-background-secondary text-foreground-muted hover:text-navy"
              }`}
            >
              Numériques
            </button>
            <button
              onClick={() => { setFormatFilter("paper"); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                formatFilter === "paper" ? "bg-navy text-white shadow-sm" : "bg-background-secondary text-foreground-muted hover:text-navy"
              }`}
            >
              Colis Papier
            </button>
          </div>

          {/* Filter Statut */}
          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            <span className="text-[10px] font-bold uppercase tracking-wider text-navy mr-1">Statut:</span>
            <button
              onClick={() => { setStatusFilter("all"); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                statusFilter === "all" ? "bg-navy text-white shadow-sm" : "bg-background-secondary text-foreground-muted hover:text-navy"
              }`}
            >
              Tous
            </button>
            <button
              onClick={() => { setStatusFilter("in_progress"); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                statusFilter === "in_progress" ? "bg-navy text-white shadow-sm" : "bg-background-secondary text-foreground-muted hover:text-navy"
              }`}
            >
              En cours
            </button>
            <button
              onClick={() => { setStatusFilter("completed"); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                statusFilter === "completed" ? "bg-navy text-white shadow-sm" : "bg-background-secondary text-foreground-muted hover:text-navy"
              }`}
            >
              Payés & Livrés
            </button>
            <button
              onClick={() => { setStatusFilter("failed_cancelled"); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                statusFilter === "failed_cancelled" ? "bg-navy text-white shadow-sm" : "bg-background-secondary text-foreground-muted hover:text-navy"
              }`}
            >
              Échoués
            </button>
          </div>

        </div>

      </div>

      {/* Skeletons de chargement */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-background border border-border rounded-3xl p-6 space-y-4 animate-pulse">
              <div className="h-6 bg-background-secondary rounded-lg w-1/3" />
              <div className="h-16 bg-background-secondary rounded-xl w-full" />
              <div className="h-12 bg-background-secondary rounded-xl w-full" />
            </div>
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        /* État vide */
        <div className="bg-background border border-border rounded-3xl p-12 text-center space-y-4 max-w-md mx-auto">
          <div className="w-16 h-16 rounded-full bg-navy/5 text-navy flex items-center justify-center mx-auto">
            <Package className="w-8 h-8 text-gold" />
          </div>
          <h2 className="font-serif font-bold text-lg text-navy">Aucune commande trouvée</h2>
          <p className="text-xs text-foreground-muted">
            {searchQuery || formatFilter !== "all" || statusFilter !== "all"
              ? "Aucun résultat ne correspond à vos critères de recherche ou de filtre."
              : "Vous n'avez pas encore passé de commande d'ouvrage numérique ou papier."}
          </p>
          <Link
            href="/student/catalog"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gold hover:bg-gold-hover text-navy text-xs font-bold transition-all shadow-md active:scale-95"
          >
            <ShoppingBag className="w-4 h-4 text-navy" />
            Passer une commande (Explorer le catalogue)
          </Link>
        </div>
      ) : (
        /* Liste des cartes de commande */
        <div className="space-y-6">
          {paginatedOrders.map((order) => {
            const totalVal = typeof order.total_amount === "string" ? parseFloat(order.total_amount) : order.total_amount;

            return (
              <div
                key={order.id}
                className="bg-background border border-border rounded-3xl p-5 sm:p-6 space-y-5 shadow-sm transition-all hover:border-border/80"
              >
                {/* Entête commande */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-serif font-bold text-navy text-sm sm:text-base">
                        Commande #{order.id.substring(0, 12)}
                      </span>
                      {renderStatusBadge(order)}
                    </div>
                    <p className="text-[11px] text-foreground-muted mt-1 flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-gold shrink-0" />
                      Passée le {new Date(order.created_at).toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4">
                    <span className="font-serif font-bold text-gold-dark text-base sm:text-lg">
                      {totalVal.toLocaleString("fr-FR")} FCFA
                    </span>
                    <button
                      onClick={() => setSelectedOrderForModal(order)}
                      className="px-3 py-1.5 rounded-xl border border-border bg-background-secondary hover:bg-background text-navy font-bold text-xs transition-colors flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5 text-gold shrink-0" />
                      Voir reçu
                    </button>
                  </div>
                </div>

                {/* Articles commandés */}
                <div className="space-y-2.5">
                  <p className="text-[11px] font-bold text-navy uppercase tracking-wider">Ovrages commandés :</p>
                  <div className="space-y-2">
                    {order.lignes?.map((item) => {
                      const itemPrice = typeof item.unit_price === "string" ? parseFloat(item.unit_price) : item.unit_price;
                      
                      // Règle d'or #2 : Déblocage numérique immédiat dès que statut_paiement === 'paid'
                      const isDigitalPaid = item.format_type === "digital" && order.statut_paiement === "paid";

                      return (
                        <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between text-xs bg-background-secondary p-3.5 rounded-2xl border border-border/60 gap-3">
                          <div className="flex items-start gap-3 min-w-0">
                            <BookOpen className="w-4 h-4 text-navy shrink-0 mt-0.5" />
                            <div className="min-w-0">
                              <p className="font-bold text-navy truncate">{item.ouvrage_title}</p>
                              <p className="text-[10px] text-foreground-muted mt-0.5">
                                {item.format_type === "digital" ? "Format Numérique (Consultation illimitée)" : "Exemplaire Papier"} x {item.quantity}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 border-t sm:border-t-0 border-border/40 pt-2 sm:pt-0">
                            <span className="font-semibold text-navy">
                              {itemPrice.toLocaleString("fr-FR")} FCFA
                            </span>

                            {isDigitalPaid && (
                              <Link
                                href={`/catalog/reader/${item.ouvrage}`}
                                className="px-3.5 py-1.5 rounded-xl bg-navy hover:bg-navy-hover text-white text-[11px] font-bold transition-all shadow-sm flex items-center gap-1.5"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-gold shrink-0" />
                                Lire sur Liseuse
                              </Link>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Stepper de Livraison Physique */}
                {order.livraison && (
                  <OrderTrackerStepper
                    status={order.livraison.statut}
                    carrierName={order.livraison.carrier_name}
                    trackingNumber={order.livraison.tracking_number}
                  />
                )}

              </div>
            );
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-border text-xs">
              <span className="text-foreground-muted">
                Page <span className="font-bold text-navy">{currentPage}</span> sur {totalPages} ({filteredOrders.length} commandes)
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-xl border border-border hover:bg-background-secondary disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-navy" />
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-xl border border-border hover:bg-background-secondary disabled:opacity-40 transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-navy" />
                </button>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Modale de Détail & Reçu */}
      <OrderDetailModal
        order={selectedOrderForModal}
        isOpen={!!selectedOrderForModal}
        onClose={() => setSelectedOrderForModal(null)}
      />

    </div>
  );
}
