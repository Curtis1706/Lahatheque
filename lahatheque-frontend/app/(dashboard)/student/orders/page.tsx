"use client";

import React, { useCallback, useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  PackageCheck,
  ArrowLeft,
  ShoppingBag,
  Truck,
  Copy,
  Download,
  Plus,
  Search,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import {
  getStudentOrders,
  type OrderAPI,
  type OrderLineAPI,
} from "@/lib/services/student";
import OrderCreateForm from "@/components/student/OrderCreateForm";
import { BookCover } from "@/components/features/student/book-cover";
import { ViewToggle, type ViewMode } from "@/components/features/student/view-toggle";
import { Pagination } from "@/components/ui/pagination";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(amount: number | string): string {
  const num = typeof amount === "number" ? amount : parseFloat(String(amount)) || 0;
  return num.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + " XOF";
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ─── Badge Statut Sémantique ──────────────────────────────────────────────────

function StatusBadge({
  status,
  label,
}: {
  status: string;
  label: string;
}) {
  const map: Record<string, string> = {
    paid: "bg-success/15 text-success border-success/30",
    completed: "bg-success/15 text-success border-success/30",
    pending: "bg-warning/15 text-warning border-warning/30",
    processing: "bg-navy/10 text-navy border-navy/20",
    failed: "bg-error/15 text-error border-error/30",
    cancelled: "bg-error/15 text-error border-error/30",
    refunded: "bg-foreground-muted/15 text-foreground-muted border-border",
    en_preparation: "bg-navy/10 text-navy border-navy/20",
    expedie: "bg-warning/15 text-warning border-warning/30",
    livre: "bg-success/15 text-success border-success/30",
  };
  const cls = map[status] || "bg-background-secondary text-foreground-muted border-border";
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${cls}`}
    >
      {label}
    </span>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonOrder() {
  return (
    <div className="p-5 rounded-3xl border border-border bg-background animate-pulse space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-12 h-16 rounded-xl bg-navy/10 shrink-0" />
        <div className="space-y-2 flex-1">
          <div className="h-3 rounded bg-navy/10 w-1/3" />
          <div className="h-2 rounded bg-navy/10 w-2/3" />
          <div className="h-2 rounded bg-navy/10 w-1/2" />
        </div>
      </div>
    </div>
  );
}

// ─── Carte Commande (Vue Grille) ──────────────────────────────────────────────

function OrderCard({ order }: { order: OrderAPI }) {
  const [expanded, setExpanded] = useState(false);

  const handleCopyTracking = (tracking: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(tracking);
    toast.success(`Numéro de suivi copié : ${tracking}`);
  };

  const handleDownloadInvoice = (e: React.MouseEvent) => {
    e.stopPropagation();
    toast.success(`Facture #${String(order.id).slice(0, 8).toUpperCase()} générée`);
  };

  const primaryItem = order.lignes?.[0];

  return (
    <div className="rounded-3xl border border-border bg-background shadow-xs overflow-hidden transition-all hover:border-gold/50">
      {/* En-tête cliquable */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-background-secondary/50 transition-colors text-left cursor-pointer"
      >
        <div className="flex items-center gap-4 min-w-0 flex-1">
          {/* Miniatures des couvertures (jusqu'à 2 livres) */}
          <div className="flex items-center -space-x-4 shrink-0">
            {order.lignes.slice(0, 2).map((ligne, idx) => (
              <div
                key={ligne.id || idx}
                className="relative z-10 transition-transform hover:z-20 hover:scale-105"
              >
                <BookCover
                  book={{
                    id: String(ligne.ouvrage || ligne.id),
                    title: ligne.ouvrage_title,
                  }}
                  size="xs"
                />
              </div>
            ))}
          </div>

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-[10px] font-bold text-navy bg-navy/5 px-2 py-0.5 rounded-md border border-navy/10">
                #{String(order.id).slice(0, 8).toUpperCase()}
              </span>
              <StatusBadge
                status={order.statut_paiement}
                label={order.statut_paiement_display}
              />
              <StatusBadge
                status={order.statut_commande}
                label={order.statut_commande_display}
              />
            </div>

            <p className="font-serif font-bold text-navy text-sm truncate">
              {primaryItem?.ouvrage_title || "Commande d'ouvrages"}
              {order.lignes.length > 1 && (
                <span className="text-xs font-normal text-foreground-muted">
                  {" "}et {order.lignes.length - 1} autre{order.lignes.length > 2 ? "s" : ""}
                </span>
              )}
            </p>

            <p className="text-[11px] text-foreground-muted">
              {formatDate(order.created_at)} &bull; {order.lignes.length} article{order.lignes.length > 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-3 self-end sm:self-center">
          <div className="text-right">
            <p className="font-mono font-bold text-navy text-sm sm:text-base">
              {formatPrice(order.total_amount)}
            </p>
            <p className="text-[10px] text-gold font-bold flex items-center gap-1 justify-end">
              <span>{expanded ? "Masquer le détail" : "Afficher le détail"}</span>
              <ChevronRight className={`w-3 h-3 transition-transform ${expanded ? "rotate-90" : ""}`} />
            </p>
          </div>
        </div>
      </button>

      {/* Détail étendu */}
      {expanded && (
        <div className="border-t border-border p-5 space-y-4 bg-background-secondary/60 animate-in fade-in duration-200">
          {/* Lignes de commande */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-navy">
              Articles commandés
            </p>
            {order.lignes.map((ligne: OrderLineAPI) => (
              <div
                key={ligne.id}
                className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-background border border-border"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="shrink-0">
                    <BookCover
                      book={{
                        id: String(ligne.ouvrage || ligne.id),
                        title: ligne.ouvrage_title,
                      }}
                      size="xs"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="font-serif font-bold text-navy text-xs truncate">
                      {ligne.ouvrage_title}
                    </p>
                    <p className="text-[10px] text-foreground-muted">
                      Format : <strong className="text-navy">{ligne.format_display}</strong> &bull; Quantité : <strong className="font-mono text-navy">{ligne.quantity}</strong>
                    </p>
                  </div>
                </div>
                <p className="shrink-0 font-mono font-bold text-navy text-xs sm:text-sm">
                  {formatPrice(ligne.unit_price * ligne.quantity)}
                </p>
              </div>
            ))}
          </div>

          {/* Suivi expédition & logistique physique */}
          {order.livraison && (
            <div className="pt-3 border-t border-border space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-gold" />
                  <h4 className="font-bold text-navy text-xs uppercase tracking-wider">
                    Suivi Colis Physique
                  </h4>
                  <StatusBadge
                    status={order.livraison.statut}
                    label={order.livraison.statut_display}
                  />
                </div>

                {order.livraison.tracking_number && (
                  <button
                    type="button"
                    onClick={(e) => handleCopyTracking(order.livraison!.tracking_number, e)}
                    className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-navy bg-background hover:border-gold px-2.5 py-1 rounded-lg border border-border transition-colors cursor-pointer"
                  >
                    <Copy className="w-3 h-3 text-gold" />
                    Tracking : {order.livraison.tracking_number}
                  </button>
                )}
              </div>

              <div className="text-xs space-y-0.5 text-foreground-muted bg-background p-3.5 rounded-2xl border border-border">
                <p>
                  <strong className="text-navy">Adresse :</strong> {order.livraison.shipping_address}, {order.livraison.city}, {order.livraison.country}
                </p>
                {order.livraison.carrier_name && (
                  <p>
                    <strong className="text-navy">Transporteur :</strong> {order.livraison.carrier_name}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Facture PDF */}
          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={handleDownloadInvoice}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors shadow-xs min-h-[40px] cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-gold" />
              Télécharger le reçu PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tableau Data Table des Commandes ─────────────────────────────────────────

function OrdersDataTable({ orders }: { orders: OrderAPI[] }) {
  return (
    <div className="rounded-3xl border border-border bg-background overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-border bg-background-secondary text-foreground-muted text-[11px] font-bold uppercase tracking-wider">
              <th className="py-3.5 px-4">Commande</th>
              <th className="py-3.5 px-4">Ouvrage(s)</th>
              <th className="py-3.5 px-4">Format &amp; Qté</th>
              <th className="py-3.5 px-4">Paiement</th>
              <th className="py-3.5 px-4">Livraison</th>
              <th className="py-3.5 px-4 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-navy font-medium">
            {orders.map((order) => {
              const primaryItem = order.lignes?.[0];
              return (
                <tr key={order.id} className="hover:bg-background-secondary/50 transition-colors">
                  {/* Commande */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    <p className="font-mono font-bold text-navy">
                      #{String(order.id).slice(0, 8).toUpperCase()}
                    </p>
                    <p className="text-[10px] text-foreground-muted">
                      {formatDate(order.created_at)}
                    </p>
                  </td>

                  {/* Ouvrage(s) avec Cover */}
                  <td className="py-4 px-4 min-w-[220px]">
                    <div className="flex items-center gap-3">
                      <div className="shrink-0">
                        <BookCover
                          book={{
                            id: String(primaryItem?.ouvrage || primaryItem?.id || order.id),
                            title: primaryItem?.ouvrage_title || "Ouvrage",
                          }}
                          size="xs"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="font-serif font-bold text-navy text-xs truncate max-w-[200px]">
                          {primaryItem?.ouvrage_title || "Ouvrage commandé"}
                        </p>
                        {order.lignes.length > 1 && (
                          <p className="text-[10px] text-gold font-medium">
                            + {order.lignes.length - 1} autre{order.lignes.length > 2 ? "s" : ""} livre{order.lignes.length > 2 ? "s" : ""}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Format & Qté */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    <span className="text-[11px] font-semibold text-navy">
                      {primaryItem?.format_display || "Numérique"}
                    </span>
                    <p className="text-[10px] text-foreground-muted font-mono">
                      {order.lignes.reduce((sum, l) => sum + l.quantity, 0)} exemplaire(s)
                    </p>
                  </td>

                  {/* Statut Paiement */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    <StatusBadge
                      status={order.statut_paiement}
                      label={order.statut_paiement_display}
                    />
                  </td>

                  {/* Statut Livraison */}
                  <td className="py-4 px-4 whitespace-nowrap">
                    <StatusBadge
                      status={order.statut_commande}
                      label={order.statut_commande_display}
                    />
                  </td>

                  {/* Total */}
                  <td className="py-4 px-4 text-right whitespace-nowrap">
                    <span className="font-mono font-bold text-navy text-sm">
                      {formatPrice(order.total_amount)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Page Principale ──────────────────────────────────────────────────────────

export default function StudentOrdersPage() {
  const [orders, setOrders] = useState<OrderAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Filtres & affichage
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "pending">("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getStudentOrders();
      setOrders(data);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Erreur de chargement des commandes"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Calculs financiers stricts sans concaténation de chaînes
  const paidCount = useMemo(
    () => orders.filter((o) => o.statut_paiement === "paid").length,
    [orders]
  );
  const pendingCount = useMemo(
    () => orders.filter((o) => o.statut_paiement === "pending").length,
    [orders]
  );
  const totalSpent = useMemo(
    () =>
      orders
        .filter((o) => o.statut_paiement === "paid")
        .reduce((acc, o) => acc + (parseFloat(String(o.total_amount)) || 0), 0),
    [orders]
  );

  // Filtrage combiné : recherche & onglet statut
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (statusFilter === "paid" && o.statut_paiement !== "paid") return false;
      if (statusFilter === "pending" && o.statut_paiement !== "pending") return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        String(o.id).toLowerCase().includes(q) ||
        o.lignes.some((l) => l.ouvrage_title.toLowerCase().includes(q))
      );
    });
  }, [orders, statusFilter, searchQuery]);

  // Pagination
  const totalOrders = filteredOrders.length;
  const totalPages = Math.ceil(totalOrders / pageSize) || 1;

  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, currentPage, pageSize]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setCurrentPage(1);
    toast.info("Filtres réinitialisés");
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 max-w-7xl mx-auto min-w-0 pr-14 sm:pr-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/student" className="hover:text-navy transition-colors">
          Mon Espace
        </Link>
        <span>/</span>
        <span className="text-navy font-semibold">Achats &amp; Commandes</span>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/student"
            className="inline-flex items-center gap-1.5 text-xs text-navy font-bold hover:underline mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Retour à l&apos;espace étudiant</span>
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1.5">
            <PackageCheck className="w-4 h-4 text-gold" />
            <span>Historique des Transactions</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-navy">
            Achats &amp; Commandes
          </h1>
          <p className="text-xs sm:text-sm text-foreground-muted mt-1.5 max-w-2xl leading-relaxed">
            Consultez le suivi de vos achats d&apos;ouvrages numériques et commandes d&apos;exemplaires papier avec bordereaux de livraison.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <ViewToggle mode={viewMode} onChange={setViewMode} />
          <button
            onClick={() => setShowCreateForm((v) => !v)}
            className="inline-flex items-center gap-2 bg-navy hover:bg-navy-hover text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors shrink-0 min-h-[44px] cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4 text-gold" aria-hidden="true" />
            <span>Nouvelle commande</span>
          </button>
        </div>
      </div>

      {/* ── KPIs Financiers ───────────────────────────────────────────── */}
      {!loading && orders.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-3xl bg-background border border-border shadow-xs text-center">
            <p className="font-serif font-bold text-3xl text-navy">
              {paidCount}
            </p>
            <p className="text-xs text-foreground-muted mt-1 font-medium">Commandes Payées</p>
          </div>
          <div className="p-5 rounded-3xl bg-background border border-border shadow-xs text-center">
            <p className="font-serif font-bold text-3xl text-navy">
              {pendingCount}
            </p>
            <p className="text-xs text-foreground-muted mt-1 font-medium">
              En attente de paiement
            </p>
          </div>
          <div className="p-5 rounded-3xl bg-background border border-border shadow-xs text-center">
            <p className="font-mono font-bold text-xl sm:text-2xl text-gold truncate">
              {formatPrice(totalSpent)}
            </p>
            <p className="text-xs text-foreground-muted mt-1 font-medium">
              Total dépensé
            </p>
          </div>
        </div>
      )}

      {/* ── Formulaire Nouvelle Commande ────────────────────────────────── */}
      {showCreateForm && (
        <OrderCreateForm
          onCancel={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false);
            loadData();
          }}
        />
      )}

      {/* ── Filtres & Recherche ────────────────────────────────────────── */}
      <div className="p-5 rounded-3xl bg-background border border-border space-y-4 shadow-xs">
        {/* Recherche */}
        <div className="relative">
          <Search className="w-4 h-4 text-foreground-muted absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Rechercher par titre de livre ou référence de commande..."
            className="w-full pl-11 pr-4 py-3 text-xs sm:text-sm bg-background-secondary border border-border rounded-2xl text-navy placeholder:text-foreground-muted focus:outline-none focus:border-gold min-h-[48px] transition-colors"
          />
        </div>

        {/* Onglets Filtres Statut */}
        <div className="flex items-center gap-2 pt-2 border-t border-border flex-wrap">
          <button
            type="button"
            onClick={() => {
              setStatusFilter("all");
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors border min-h-[40px] cursor-pointer ${
              statusFilter === "all"
                ? "bg-navy text-white border-navy shadow-xs"
                : "bg-background-secondary text-foreground-muted border-border hover:text-navy hover:bg-background"
            }`}
          >
            Toutes ({orders.length})
          </button>

          <button
            type="button"
            onClick={() => {
              setStatusFilter("paid");
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors border min-h-[40px] cursor-pointer ${
              statusFilter === "paid"
                ? "bg-navy text-white border-navy shadow-xs"
                : "bg-background-secondary text-foreground-muted border-border hover:text-navy hover:bg-background"
            }`}
          >
            Payées ({paidCount})
          </button>

          <button
            type="button"
            onClick={() => {
              setStatusFilter("pending");
              setCurrentPage(1);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors border min-h-[40px] cursor-pointer ${
              statusFilter === "pending"
                ? "bg-gold text-navy border-gold shadow-xs"
                : "bg-background-secondary text-foreground-muted border-border hover:text-navy hover:bg-background"
            }`}
          >
            En attente ({pendingCount})
          </button>
        </div>
      </div>

      {/* ── Erreur ────────────────────────────────────────────────────── */}
      {error && (
        <div className="p-4 rounded-2xl border border-error/30 bg-error/10 text-error text-xs sm:text-sm font-medium">
          {error}
        </div>
      )}

      {/* ── Liste / Tableau des Commandes ──────────────────────────────── */}
      <div className="space-y-6">
        {!loading && (
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <p className="text-xs text-foreground-muted">
              <strong className="text-navy font-bold">{totalOrders}</strong> commande{totalOrders > 1 ? "s" : ""}{" "}
              {statusFilter === "paid" ? "payées" : statusFilter === "pending" ? "en attente" : "enregistrées"}
              {searchQuery && (
                <span>
                  {" "}pour « <strong className="text-navy">{searchQuery}</strong> »
                </span>
              )}
            </p>

            {totalPages > 1 && (
              <span className="text-xs text-foreground-muted font-medium">
                Page <strong className="text-navy">{currentPage}</strong> sur <strong className="text-navy">{totalPages}</strong>
              </span>
            )}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonOrder key={i} />
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-20 px-6 rounded-3xl bg-background border border-dashed border-border text-center space-y-4 shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-navy/5 flex items-center justify-center mx-auto text-foreground-muted">
              <PackageCheck className="w-7 h-7 opacity-60" />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <h3 className="font-serif font-bold text-navy text-lg">
                {orders.length === 0
                  ? "Aucun achat enregistré"
                  : "Aucune commande correspondante"}
              </h3>
              <p className="text-xs text-foreground-muted leading-relaxed">
                {orders.length === 0
                  ? "Explorez le catalogue académique pour acquérir vos premiers ouvrages numériques ou commander vos livres papier."
                  : "Modifiez vos critères de recherche ou réinitialisez les filtres."}
              </p>
            </div>
            {orders.length === 0 ? (
              <Link
                href="/student/catalog"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors min-h-[44px] shadow-xs cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4 text-gold" />
                <span>Explorer le Catalogue</span>
              </Link>
            ) : (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors min-h-[44px] shadow-xs cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-gold" />
                <span>Réinitialiser les filtres</span>
              </button>
            )}
          </div>
        ) : (
          <>
            {viewMode === "grid" ? (
              <div className="space-y-3.5">
                {paginatedOrders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
            ) : (
              <OrdersDataTable orders={paginatedOrders} />
            )}

            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalOrders}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              onPageSizeChange={(s) => {
                setPageSize(s);
                setCurrentPage(1);
              }}
              pageSizeOptions={[6, 9, 12, 24]}
              itemLabel="commandes"
            />
          </>
        )}
      </div>
    </div>
  );
}
