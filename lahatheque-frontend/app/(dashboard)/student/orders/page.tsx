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
  Eye,
  X,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";
import {
  getStudentOrders,
  type OrderAPI,
} from "@/lib/services/student";
import OrderCreateForm from "@/components/student/OrderCreateForm";
import { BookCover } from "@/components/features/student/book-cover";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";

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

// ─── Ligne Étendue de Commande ────────────────────────────────────────────────

interface OrderTableRow extends OrderAPI {
  order_reference: string;
  book_title_summary: string;
}

// ─── Page Principale ──────────────────────────────────────────────────────────

export default function StudentOrdersPage() {
  const [orders, setOrders] = useState<OrderAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedOrderModal, setSelectedOrderModal] = useState<OrderTableRow | null>(null);

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

  // Fermeture de la modale avec la touche Échap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedOrderModal(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Calculs financiers stricts sans concaténation
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

  const handleCopyTracking = (tracking: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(tracking);
    toast.success(`Numéro de suivi copié : ${tracking}`);
  };

  const handleDownloadInvoice = (order: OrderAPI, e: React.MouseEvent) => {
    e.stopPropagation();
    toast.success(`Facture #${String(order.id).slice(0, 8).toUpperCase()} téléchargée avec succès.`);
  };

  // Transformation des données pour la DataTable
  const tableData: OrderTableRow[] = useMemo(() => {
    return orders.map((o) => ({
      ...o,
      order_reference: `#${String(o.id).slice(0, 8).toUpperCase()}`,
      book_title_summary: o.lignes.map((l) => l.ouvrage_title).join(", "),
    }));
  }, [orders]);

  // Définition des colonnes DataTable
  const columns: DataTableColumn<OrderTableRow>[] = [
    {
      key: "order_reference",
      header: "N° Commande & Date",
      cell: (row) => (
        <div className="space-y-0.5">
          <p className="font-mono font-bold text-navy text-xs">
            {row.order_reference}
          </p>
          <p className="text-[10px] text-foreground-muted">
            {formatDate(row.created_at)}
          </p>
        </div>
      ),
    },
    {
      key: "book_title_summary",
      header: "Ouvrage(s) commandé(s)",
      cell: (row) => {
        const primaryLigne = row.lignes?.[0];
        return (
          <div className="flex items-center gap-3 min-w-[200px]">
            <div className="flex items-center -space-x-4 shrink-0">
              {row.lignes.slice(0, 2).map((ligne, idx) => (
                <div key={ligne.id || idx} className="relative z-10 transition-transform hover:z-20 hover:scale-105">
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

            <div className="min-w-0 flex-1">
              <p className="font-serif font-bold text-navy text-xs truncate max-w-[220px]">
                {primaryLigne?.ouvrage_title || "Commande d'ouvrages"}
              </p>
              <p className="text-[10px] text-foreground-muted">
                {row.lignes.length} article{row.lignes.length > 1 ? "s" : ""}
                {row.lignes.length > 1 && (
                  <span className="text-gold font-semibold"> (+{row.lignes.length - 1} autre{row.lignes.length > 2 ? "s" : ""})</span>
                )}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      key: "statut_paiement",
      header: "Paiement",
      cell: (row) => (
        <StatusBadge
          status={row.statut_paiement}
          label={row.statut_paiement_display}
        />
      ),
    },
    {
      key: "statut_commande",
      header: "Statut Commande",
      cell: (row) => (
        <StatusBadge
          status={row.statut_commande}
          label={row.statut_commande_display}
        />
      ),
    },
    {
      key: "delivery_status",
      header: "Statut Livraison",
      cell: (row) => {
        const status = row.delivery_status || row.livraison?.statut;
        const display = row.delivery_status_display || (row.livraison as any)?.statut_display || status;
        return status ? (
          <StatusBadge status={status} label={display || status} />
        ) : (
          <span className="text-[10px] text-foreground-muted">—</span>
        );
      },
    },
    {
      key: "total_amount",
      header: "Montant Total",
      className: "text-right",
      cell: (row) => (
        <div className="text-right">
          <p className="font-mono font-bold text-navy text-xs sm:text-sm">
            {formatPrice(row.total_amount)}
          </p>
          <p className="text-[10px] text-foreground-muted">
            {row.mode_paiement_display || "Règlement"}
          </p>
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      cell: (row) => (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedOrderModal(row);
            }}
            className="px-3 py-1.5 rounded-xl border border-navy/20 bg-navy/5 hover:bg-navy hover:text-white text-navy text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Eye className="w-3.5 h-3.5 text-gold" />
            <span>Détails</span>
          </button>
        </div>
      ),
    },
  ];

  // Rendu mobile de chaque commande en carte empilée
  const renderMobileCard = (row: OrderTableRow) => {
    const primaryLigne = row.lignes?.[0];

    return (
      <div
        onClick={() => setSelectedOrderModal(row)}
        className="p-4 rounded-3xl border border-border bg-background space-y-3 shadow-xs cursor-pointer hover:border-gold/50 transition-colors"
      >
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="font-mono text-[10px] font-bold text-navy bg-navy/5 px-2 py-0.5 rounded-md border border-navy/10">
            {row.order_reference}
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <StatusBadge status={row.statut_paiement} label={row.statut_paiement_display} />
            <StatusBadge status={row.statut_commande} label={row.statut_commande_display} />
            {(row.delivery_status || row.livraison?.statut) && (
              <StatusBadge
                status={row.delivery_status || row.livraison!.statut}
                label={row.delivery_status_display || (row.livraison as any)?.statut_display || row.delivery_status || row.livraison!.statut}
              />
            )}
          </div>
        </div>

        <div className="flex items-center gap-3.5 pt-1">
          <div className="shrink-0">
            <BookCover
              book={{
                id: String(primaryLigne?.ouvrage || primaryLigne?.id || row.id),
                title: primaryLigne?.ouvrage_title || "Ouvrage",
              }}
              size="xs"
            />
          </div>
          <div className="min-w-0 flex-1 space-y-0.5">
            <p className="font-serif font-bold text-navy text-xs truncate">
              {primaryLigne?.ouvrage_title || "Commande d'ouvrages"}
            </p>
            <p className="text-[11px] text-foreground-muted">
              {formatDate(row.created_at)} &bull; {row.lignes.length} article{row.lignes.length > 1 ? "s" : ""}
            </p>
            <p className="font-mono font-bold text-navy text-xs pt-1">
              {formatPrice(row.total_amount)}
            </p>
          </div>
        </div>

        <div className="pt-2 border-t border-border flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-navy flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-gold" />
            <span>Voir détails</span>
          </span>

          <button
            type="button"
            onClick={(e) => handleDownloadInvoice(row, e)}
            className="p-1.5 rounded-lg text-gold hover:bg-navy/5 transition-colors cursor-pointer"
            title="Télécharger le reçu PDF"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
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

        <div className="flex items-center gap-3">
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
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="h-28 rounded-3xl bg-background border border-border animate-pulse" />
          <div className="h-28 rounded-3xl bg-background border border-border animate-pulse" />
          <div className="h-28 rounded-3xl bg-background border border-border animate-pulse" />
        </div>
      ) : orders.length > 0 ? (
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
      ) : null}

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

      {/* ── Erreur ────────────────────────────────────────────────────── */}
      {error && (
        <div className="p-4 rounded-2xl border border-error/30 bg-error/10 text-error text-xs sm:text-sm font-medium">
          {error}
        </div>
      )}

      {/* ── DataTable Officielle des Commandes ──────────────────────────── */}
      <div className="space-y-4">
        <DataTable<OrderTableRow>
          data={tableData}
          columns={columns}
          rowKey="id"
          loading={loading}
          onRowClick={(row) => setSelectedOrderModal(row)}
          searchPlaceholder="Rechercher par référence ou titre d'ouvrage..."
          filterKey="statut_paiement"
          filterOptions={[
            { value: "all", label: "Tous les paiements" },
            { value: "paid", label: "Payées uniquement" },
            { value: "pending", label: "En attente uniquement" },
          ]}
          filterPlaceholder="Filtrer par statut"
          pageSize={10}
          pageSizeOptions={[10, 20, 50]}
          mobileCard={renderMobileCard}
          emptyState={
            <div className="py-20 px-6 rounded-3xl bg-background border border-dashed border-border text-center space-y-4 shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-navy/5 flex items-center justify-center mx-auto text-foreground-muted">
                <PackageCheck className="w-7 h-7 opacity-60" />
              </div>
              <div className="space-y-1 max-w-sm mx-auto">
                <h3 className="font-serif font-bold text-navy text-lg">
                  Aucun achat enregistré
                </h3>
                <p className="text-xs text-foreground-muted leading-relaxed">
                  Explorez le catalogue académique pour acquérir vos premiers ouvrages numériques ou commander vos livres papier.
                </p>
              </div>
              <Link
                href="/student/catalog"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors min-h-[44px] shadow-xs cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4 text-gold" />
                <span>Explorer le Catalogue</span>
              </Link>
            </div>
          }
        />
      </div>

      {/* ── Modale Complète de Détails de Commande ───────────────────── */}
      {selectedOrderModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setSelectedOrderModal(null)}
        >
          <div
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-background border border-border shadow-2xl space-y-6 p-6 sm:p-8 relative animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header modal */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-border">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono font-bold text-navy text-sm sm:text-base bg-navy/5 px-2.5 py-1 rounded-lg border border-navy/15">
                    {selectedOrderModal.order_reference}
                  </span>
                  <StatusBadge
                    status={selectedOrderModal.statut_paiement}
                    label={selectedOrderModal.statut_paiement_display}
                  />
                  <StatusBadge
                    status={selectedOrderModal.statut_commande}
                    label={selectedOrderModal.statut_commande_display}
                  />
                  {(selectedOrderModal.delivery_status || selectedOrderModal.livraison?.statut) && (
                    <StatusBadge
                      status={selectedOrderModal.delivery_status || selectedOrderModal.livraison!.statut}
                      label={
                        selectedOrderModal.delivery_status_display ||
                        (selectedOrderModal.livraison as any)?.statut_display ||
                        selectedOrderModal.delivery_status ||
                        selectedOrderModal.livraison!.statut
                      }
                    />
                  )}
                </div>
                <p className="text-xs text-foreground-muted">
                  Passée le {formatDate(selectedOrderModal.created_at)} &bull; {selectedOrderModal.mode_paiement_display || "Règlement"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrderModal(null)}
                className="p-2 rounded-xl text-foreground-muted hover:text-navy hover:bg-background-secondary transition-colors cursor-pointer"
                title="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Articles commandés */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-navy flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-gold" />
                <span>Articles commandés ({selectedOrderModal.lignes.length})</span>
              </h4>

              <div className="divide-y divide-border border border-border rounded-2xl overflow-hidden bg-background-secondary/20">
                {selectedOrderModal.lignes.map((ligne) => (
                  <div key={ligne.id} className="p-4 flex items-center justify-between gap-4 bg-background">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <BookCover
                        book={{
                          id: String(ligne.ouvrage || ligne.id),
                          title: ligne.ouvrage_title,
                        }}
                        size="xs"
                      />
                      <div className="min-w-0 space-y-0.5">
                        <p className="font-serif font-bold text-navy text-sm truncate max-w-sm">
                          {ligne.ouvrage_title}
                        </p>
                        <p className="text-xs text-foreground-muted">
                          Format : <strong className="text-navy">{ligne.format_display}</strong> &bull; Quantité : <strong className="font-mono text-navy">{ligne.quantity}</strong>
                        </p>
                        <p className="font-mono text-[11px] text-foreground-muted">
                          Prix unitaire : {formatPrice(ligne.unit_price)}
                        </p>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-navy text-sm sm:text-base shrink-0">
                      {formatPrice(ligne.unit_price * ligne.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Informations de livraison (si commande physique) */}
            {selectedOrderModal.livraison && (
              <div className="p-5 rounded-2xl bg-navy text-white space-y-3 shadow-md">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-gold" />
                    <span className="text-xs font-bold text-gold uppercase tracking-wider">
                      Suivi de Livraison :
                    </span>
                    <StatusBadge
                      status={selectedOrderModal.livraison.statut}
                      label={selectedOrderModal.livraison.statut_display}
                    />
                  </div>

                  {selectedOrderModal.livraison.tracking_number && (
                    <button
                      type="button"
                      onClick={(e) => handleCopyTracking(selectedOrderModal.livraison!.tracking_number, e)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-navy-dark border border-navy-hover text-gold font-mono text-xs font-bold cursor-pointer hover:bg-navy-hover transition-colors"
                      title="Copier le numéro de suivi"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{selectedOrderModal.livraison.tracking_number}</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-navy-hover text-xs">
                  <div>
                    <span className="text-white/60 block text-[11px]">Adresse de destination :</span>
                    <p className="font-medium text-white/95 mt-0.5">
                      {selectedOrderModal.livraison.shipping_address}, {selectedOrderModal.livraison.city}
                      {selectedOrderModal.livraison.country ? ` (${selectedOrderModal.livraison.country})` : ""}
                    </p>
                  </div>
                  {selectedOrderModal.livraison.carrier_name && (
                    <div>
                      <span className="text-white/60 block text-[11px]">Transporteur :</span>
                      <p className="font-medium text-white/95 mt-0.5">
                        {selectedOrderModal.livraison.carrier_name}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Récapitulatif financier */}
            <div className="p-4 rounded-2xl bg-background-secondary border border-border space-y-2 text-xs">
              <div className="flex justify-between text-foreground-muted">
                <span>Mode de règlement</span>
                <span className="font-semibold text-navy">
                  {selectedOrderModal.mode_paiement_display || "Règlement"}
                </span>
              </div>
              <div className="flex justify-between items-baseline pt-2 border-t border-border font-bold text-sm">
                <span className="text-navy">Montant total réglé</span>
                <span className="font-mono text-base text-navy font-bold">
                  {formatPrice(selectedOrderModal.total_amount)}
                </span>
              </div>
            </div>

            {/* Actions footer */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={(e) => handleDownloadInvoice(selectedOrderModal, e)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-navy/20 bg-background hover:bg-background-secondary text-navy text-xs font-bold transition-colors shadow-xs cursor-pointer min-h-[44px]"
              >
                <Download className="w-4 h-4 text-gold" />
                <span>Télécharger le reçu PDF</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedOrderModal(null)}
                className="px-5 py-2.5 rounded-xl bg-navy hover:bg-navy-hover text-white text-xs font-bold transition-colors min-h-[44px] cursor-pointer shadow-xs"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
