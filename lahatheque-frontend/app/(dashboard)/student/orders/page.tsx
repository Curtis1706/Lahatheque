"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  PackageCheck,
  ArrowLeft,
  ShoppingBag,
  Truck,
  BookOpen,
  AlertCircle,
  Package,
  Copy,
  Download,
  CheckCircle2,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import {
  getStudentOrders,
  type OrderAPI,
  type OrderLineAPI,
} from "@/lib/services/student";
import OrderCreateForm from "@/components/student/OrderCreateForm";
import { BookCover } from "@/components/features/student/book-cover";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(amount: number): string {
  return amount.toLocaleString("fr-FR") + " XOF";
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ─── Badge Statut ─────────────────────────────────────────────────────────────

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
    <div className="p-5 rounded-2xl border border-border bg-background animate-pulse space-y-3">
      <div className="h-3 rounded bg-navy/10 w-1/3" />
      <div className="h-2 rounded bg-navy/10 w-2/3" />
      <div className="h-2 rounded bg-navy/10 w-1/2" />
    </div>
  );
}

// ─── Carte Commande ───────────────────────────────────────────────────────────

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

  return (
    <div className="rounded-3xl border border-border bg-background shadow-xs overflow-hidden transition-all">
      {/* En-tête cliquable */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-background-secondary transition-colors text-left"
      >
        <div className="min-w-0 space-y-1">
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
          <p className="text-[11px] text-foreground-muted">
            {formatDate(order.created_at)} —{" "}
            {order.lignes.length} article
            {order.lignes.length > 1 ? "s" : ""}
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-3 self-end sm:self-center">
          <div className="text-right">
            <p className="font-mono font-bold text-gold text-sm sm:text-base">
              {formatPrice(order.total_amount)}
            </p>
            <p className="text-[10px] text-foreground-muted font-medium">
              {expanded ? "Masquer le détail" : "Afficher le détail"}
            </p>
          </div>
        </div>
      </button>

      {/* Détail étendu */}
      {expanded && (
        <div className="border-t border-border p-5 space-y-4 bg-background-secondary animate-in fade-in duration-200">
          {/* Lignes de commande */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted">
              Articles commandés
            </p>
            {order.lignes.map((ligne: OrderLineAPI) => (
              <div
                key={ligne.id}
                className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-background border border-border"
              >
                <div className="flex items-center gap-3 min-w-0">
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
                      Format : {ligne.format_display} &bull; Quantité : {ligne.quantity}
                    </p>
                  </div>
                </div>
                <p className="shrink-0 font-mono font-bold text-navy text-xs">
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
                    className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-navy bg-background hover:border-gold px-2.5 py-1 rounded-lg border border-border transition-colors"
                  >
                    <Copy className="w-3 h-3 text-gold" />
                    Tracking : {order.livraison.tracking_number}
                  </button>
                )}
              </div>

              <div className="text-xs space-y-0.5 text-foreground-muted bg-background p-3 rounded-2xl border border-border">
                <p>
                  <strong>Adresse :</strong> {order.livraison.shipping_address}, {order.livraison.city}, {order.livraison.country}
                </p>
                {order.livraison.carrier_name && (
                  <p>
                    <strong>Transporteur :</strong> {order.livraison.carrier_name}
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
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors shadow-xs min-h-[36px]"
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

// ─── Page Principale ──────────────────────────────────────────────────────────

export default function StudentOrdersPage() {
  const [orders, setOrders] = useState<OrderAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

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

  const paidCount = orders.filter((o) => o.statut_paiement === "paid").length;
  const pendingCount = orders.filter(
    (o) => o.statut_paiement === "pending"
  ).length;
  const totalSpent = orders
    .filter((o) => o.statut_paiement === "paid")
    .reduce((acc, o) => acc + o.total_amount, 0);

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/student" className="hover:text-navy">
          Mon Espace
        </Link>
        <span>/</span>
        <span className="text-navy font-semibold">Achats &amp; Commandes</span>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-5">
        <Link
          href="/student"
          className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Retour
        </Link>
        <div className="flex items-start sm:items-center justify-between flex-col sm:flex-row gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
              <PackageCheck className="w-4 h-4 text-gold" />
              Historique des Transactions
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
              Achats &amp; Commandes
            </h1>
            <p className="text-xs text-foreground-muted mt-1">
              Achats unitaires numériques et commandes de livres papier avec suivi
              d&apos;expédition en temps réel.
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm((v) => !v)}
            className="inline-flex items-center gap-2 bg-navy hover:bg-navy-hover text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors shrink-0 min-h-[44px]"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            Nouvelle commande
          </button>
        </div>
      </div>

      {/* ── Erreur ────────────────────────────────────────────────────── */}
      {error && (
        <div className="p-4 rounded-2xl border border-error/30 bg-error/10 text-error text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
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

      {/* ── KPIs ──────────────────────────────────────────────────────── */}
      {!loading && orders.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <div className="p-4 sm:p-5 rounded-3xl bg-background border border-border shadow-xs text-center">
            <p className="font-serif font-bold text-2xl sm:text-3xl text-navy">
              {paidCount}
            </p>
            <p className="text-[10px] sm:text-xs text-foreground-muted mt-0.5">Payées</p>
          </div>
          <div className="p-4 sm:p-5 rounded-3xl bg-background border border-border shadow-xs text-center">
            <p className="font-serif font-bold text-2xl sm:text-3xl text-navy">
              {pendingCount}
            </p>
            <p className="text-[10px] sm:text-xs text-foreground-muted mt-0.5">
              En attente
            </p>
          </div>
          <div className="p-4 sm:p-5 rounded-3xl bg-background border border-border shadow-xs text-center">
            <p className="font-serif font-bold text-lg sm:text-2xl text-gold">
              {formatPrice(totalSpent)}
            </p>
            <p className="text-[10px] sm:text-xs text-foreground-muted mt-0.5">
              Total dépensé
            </p>
          </div>
        </div>
      )}

      {/* ── Liste des Commandes ────────────────────────────────────────── */}
      <div className="space-y-4">
        <h2 className="font-serif font-bold text-navy text-base">
          {loading
            ? "Chargement de vos commandes..."
            : `Historique des commandes (${orders.length})`}
        </h2>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonOrder key={i} />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="py-16 rounded-3xl bg-background border border-dashed border-border text-center space-y-3">
            <Package className="w-10 h-10 text-foreground-muted mx-auto opacity-40" />
            <h3 className="font-serif font-bold text-navy text-lg">
              Aucun achat enregistré
            </h3>
            <p className="text-xs text-foreground-muted max-w-sm mx-auto">
              Explorez le catalogue académique pour acquérir vos premiers ouvrages numériques ou papier.
            </p>
            <Link
              href="/student/catalog"
              className="inline-flex mt-2 items-center gap-2 px-5 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors min-h-[44px]"
            >
              <ShoppingBag className="w-4 h-4 text-gold" />
              Explorer le Catalogue
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
