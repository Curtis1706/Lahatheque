"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  ArrowLeft,
  BookOpen,
  Loader2,
  Clock,
  AlertTriangle,
  RotateCcw,
  Calendar,
  X,
  CheckCircle2,
  Truck,
  Copy,
  Search,
  FileText,
  CreditCard,
  Building2,
  Coins,
  Wallet,
  ArrowUpRight,
  ShieldCheck,
  Package,
} from "lucide-react";
import { toast } from "sonner";
import { PageLoader, InlineLoader } from "@/components/ui/page-loader";
import {
  getStudentOrders,
  type OrderAPI,
  type OrderLineAPI,
} from "@/lib/services/student";
import { returnCreditOrder } from "@/lib/services/author";
import { StatusBadge } from "@/components/ui/status-badge";

type FilterTab = "all" | "credit" | "immediate" | "paper" | "returned";

function formatFRDate(dateStr?: string | null): string {
  if (!dateStr) return "Non définie";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function formatFRDateTime(dateStr?: string | null): string {
  if (!dateStr) return "Non définie";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

function getCreditDelayInfo(dueDateStr?: string | null): {
  isOverdue: boolean;
  daysRemaining: number;
  label: string;
  badgeStyle: string;
} {
  if (!dueDateStr) {
    return {
      isOverdue: false,
      daysRemaining: 0,
      label: "Échéance non spécifiée",
      badgeStyle: "bg-navy/10 text-navy border-navy/20",
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDateStr);
  due.setHours(0, 0, 0, 0);

  const diffMs = due.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const overdueDays = Math.abs(diffDays);
    return {
      isOverdue: true,
      daysRemaining: diffDays,
      label: `Échéance dépassée de ${overdueDays} jour${overdueDays > 1 ? "s" : ""}`,
      badgeStyle: "bg-error/10 text-error border-error/30",
    };
  }

  if (diffDays === 0) {
    return {
      isOverdue: false,
      daysRemaining: 0,
      label: "Échéance aujourd'hui",
      badgeStyle: "bg-gold/15 text-gold border-gold/40 font-bold",
    };
  }

  return {
    isOverdue: false,
    daysRemaining: diffDays,
    label: `Délai restant : ${diffDays} jour${diffDays > 1 ? "s" : ""}`,
    badgeStyle: "bg-gold/10 text-gold border-gold/30",
  };
}

function getPaymentMethodIcon(method?: string) {
  switch (method) {
    case "carte":
      return CreditCard;
    case "virement":
      return Building2;
    case "especes":
      return Wallet;
    case "mobile_money":
    default:
      return Coins;
  }
}

export default function AuthorPurchasesPage() {
  const [orders, setOrders] = useState<OrderAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentTab, setCurrentTab] = useState<FilterTab>("all");

  // Modale de retour produit à crédit
  const [returnOrder, setReturnOrder] = useState<OrderAPI | null>(null);
  const [returnReason, setReturnReason] = useState("");
  const [returning, setReturning] = useState(false);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getStudentOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const copyToClipboard = (text: string, label: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      toast.success(`${label} copié dans le presse-papier.`);
    }
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnOrder) return;

    setReturning(true);
    try {
      const ok = await returnCreditOrder(returnOrder.id, returnReason);
      if (ok) {
        toast.success(`La commande #${returnOrder.id.slice(0, 8)} a été retournée avec succès.`);
        setReturnOrder(null);
        setReturnReason("");
        await loadOrders();
      } else {
        toast.error("Échec du retour de la commande.");
      }
    } catch {
      toast.error("Une erreur est survenue lors du retour.");
    } finally {
      setReturning(false);
    }
  };

  // KPIs
  const kpis = useMemo(() => {
    const totalCount = orders.length;
    const creditOrders = orders.filter((o) => o.is_credit_purchase);
    const pendingCreditOrders = creditOrders.filter(
      (o) => o.statut_paiement === "pending" && o.statut_commande !== "returned"
    );
    const paidOrders = orders.filter((o) => o.statut_paiement === "paid");
    const paperOrders = orders.filter(
      (o) => o.livraison || o.lignes?.some((l) => l.format_type === "paper")
    );

    const pendingCreditAmount = pendingCreditOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
    const totalPaidAmount = paidOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);

    return {
      totalCount,
      pendingCreditCount: pendingCreditOrders.length,
      pendingCreditAmount,
      paidCount: paidOrders.length,
      totalPaidAmount,
      paperCount: paperOrders.length,
      creditCount: creditOrders.length,
      returnedCount: orders.filter((o) => o.statut_commande === "returned").length,
    };
  }, [orders]);

  // Filtrage
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Tab filter
      if (currentTab === "credit" && !order.is_credit_purchase) return false;
      if (currentTab === "immediate" && order.is_credit_purchase) return false;
      if (currentTab === "paper") {
        const hasPaper = order.livraison || order.lignes?.some((l) => l.format_type === "paper");
        if (!hasPaper) return false;
      }
      if (currentTab === "returned" && order.statut_commande !== "returned") return false;

      // Search query
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesId = order.id.toLowerCase().includes(q);
        const matchesTitle = order.lignes?.some((l) => l.ouvrage_title?.toLowerCase().includes(q));
        const matchesAuthor = order.lignes?.some((l) => l.author_name?.toLowerCase().includes(q));
        const matchesDelivery = order.livraison?.shipping_address?.toLowerCase().includes(q) ||
          order.livraison?.city?.toLowerCase().includes(q);
        return matchesId || matchesTitle || matchesAuthor || matchesDelivery;
      }

      return true;
    });
  }, [orders, currentTab, search]);

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-8 max-w-7xl mx-auto pb-16">
      {/* Fil d'Ariane */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/author" className="hover:text-navy transition-colors flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Vue d&apos;ensemble</span>
        </Link>
        <span>/</span>
        <span className="text-navy font-semibold">Mes Commandes &amp; Achats</span>
      </div>

      {/* En-tête de la page */}
      <div className="border-b border-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
            <ShoppingBag className="w-4 h-4 text-gold" />
            Espace Auteur Partenaire
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Mes Commandes &amp; Achats
          </h1>
          <p className="text-xs sm:text-sm text-foreground-muted mt-1">
            Suivi exhaustif de vos commandes d&apos;ouvrages, paiements en dépôt (à crédit) et livraisons papier.
          </p>
        </div>

        <Link
          href="/author/catalog"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-navy text-white text-xs font-bold hover:bg-navy-dark transition-all self-start sm:self-auto min-h-[44px]"
        >
          <ShoppingBag className="w-4 h-4 text-gold" />
          <span>Passer une commande</span>
        </Link>
      </div>

      {/* Encart Avantage Tarif Auteur */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gold/10 border border-gold/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gold text-navy shrink-0">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-xs text-navy">
              Avantage Auteur Actif : Remise de 40% sur le papier et 25% sur le numérique
            </p>
            <p className="text-[11px] text-foreground-muted">
              Vos réductions conventionnées sont appliquées automatiquement à toutes vos commandes d&apos;exemplaires, réglables immédiatement ou en dépôt (à crédit sous 30 jours).
            </p>
          </div>
        </div>
        <Link
          href="/author/catalog"
          className="px-4 py-2 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors inline-flex items-center gap-1.5 shrink-0 shadow-xs min-h-[40px]"
        >
          <span>Nouvelle commande (-40%)</span>
          <ArrowUpRight className="w-3.5 h-3.5 text-gold" />
        </Link>
      </div>

      {/* Cartes KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-background border border-border space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-foreground-muted font-medium">Total Commandes</span>
            <div className="p-2 rounded-xl bg-navy/5 text-navy">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <p className="font-serif text-2xl font-bold text-navy">{kpis.totalCount}</p>
          <p className="text-[11px] text-foreground-muted">Toutes transactions confondues</p>
        </div>

        <div className="p-5 rounded-3xl bg-background border border-gold/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gold font-bold">Paiements en Dépôt (Crédit)</span>
            <div className="p-2 rounded-xl bg-gold/10 text-gold">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="font-serif text-2xl font-bold text-navy">{kpis.pendingCreditCount}</p>
          <p className="text-[11px] font-mono font-semibold text-gold">
            {kpis.pendingCreditAmount.toLocaleString("fr-FR")} FCFA à régulariser
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-background border border-border space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-foreground-muted font-medium">Commandes Réglées</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="font-serif text-2xl font-bold text-navy">{kpis.paidCount}</p>
          <p className="text-[11px] font-mono text-foreground-muted">
            {kpis.totalPaidAmount.toLocaleString("fr-FR")} FCFA réglés
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-background border border-border space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-foreground-muted font-medium">Commandes Papier</span>
            <div className="p-2 rounded-xl bg-navy/5 text-gold">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <p className="font-serif text-2xl font-bold text-navy">{kpis.paperCount}</p>
          <p className="text-[11px] text-foreground-muted">Livraisons physiques</p>
        </div>
      </div>

      {/* Barre de Recherche & Filtres Onglets */}
      <div className="space-y-4">
        <div className="p-4 rounded-3xl bg-background border border-border flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-foreground-muted absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher par référence #, titre d'ouvrage, auteur, ville de livraison..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-2xl border border-border bg-background-secondary text-navy placeholder:text-foreground-muted focus:outline-none focus:border-gold min-h-[44px]"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: "all", label: "Toutes", count: kpis.totalCount },
              { id: "credit", label: "À Crédit (Dépôt)", count: kpis.creditCount },
              { id: "immediate", label: "Paiement Immédiat", count: kpis.totalCount - kpis.creditCount },
              { id: "paper", label: "Papier", count: kpis.paperCount },
              { id: "returned", label: "Retournées", count: kpis.returnedCount },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCurrentTab(tab.id as FilterTab)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 min-h-[40px] ${
                  currentTab === tab.id
                    ? "bg-navy text-white shadow-xs"
                    : "bg-background-secondary border border-border text-foreground-muted hover:text-navy"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                    currentTab === tab.id ? "bg-white/20 text-white" : "bg-navy/10 text-navy"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* État de chargement */}
      {loading && (
        <PageLoader label="Chargement de vos commandes" />
      )}

      {/* Liste détaillée des commandes */}
      {!loading && (
        <>
          {filteredOrders.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-background border border-dashed border-border space-y-3">
              <ShoppingBag className="w-10 h-10 text-foreground-muted mx-auto opacity-40" />
              <h3 className="font-serif text-base font-bold text-navy">Aucune commande trouvée</h3>
              <p className="text-xs text-foreground-muted max-w-sm mx-auto">
                {search || currentTab !== "all"
                  ? "Aucune commande ne correspond aux critères de filtre sélectionnés."
                  : "Vous n'avez effectué aucune commande pour le moment."}
              </p>
              <Link
                href="/author/catalog"
                className="inline-flex mt-2 items-center gap-2 px-5 py-2.5 rounded-2xl bg-navy text-white text-xs font-bold hover:bg-navy-dark transition-colors min-h-[44px]"
              >
                <ShoppingBag className="w-4 h-4 text-gold" />
                <span>Explorer le Catalogue des Ouvrages</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredOrders.map((order) => {
                const PaymentIcon = getPaymentMethodIcon(order.mode_paiement);
                const delayInfo = order.is_credit_purchase
                  ? getCreditDelayInfo(order.credit_due_date)
                  : null;
                const isReturned = order.statut_commande === "returned";
                const isPaid = order.statut_paiement === "paid";
                const isPendingPayment = order.statut_paiement === "pending";

                return (
                  <div
                    key={order.id}
                    className={`rounded-3xl bg-background border transition-all shadow-xs overflow-hidden ${
                      order.is_credit_purchase && isPendingPayment && !isReturned
                        ? delayInfo?.isOverdue
                          ? "border-error/40 ring-1 ring-error/20"
                          : "border-gold/40 hover:border-gold/60"
                        : "border-border hover:border-navy/30"
                    }`}
                  >
                    {/* 1. EN-TÊTE DE LA COMMANDE */}
                    <div className="p-5 sm:p-6 border-b border-border bg-background-secondary flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-sm font-bold text-navy">
                            #{order.id.slice(0, 8)}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(order.id, "Identifiant de commande")}
                            className="p-1 rounded-md text-foreground-muted hover:text-navy hover:bg-background transition-colors"
                            title="Copier l'identifiant complet"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          {/* Badge Statut Commande */}
                          <StatusBadge status={order.statut_commande} />

                          {/* Badge Statut Paiement */}
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                              isPaid
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                                : isReturned
                                ? "bg-background-secondary text-foreground-muted border-border"
                                : "bg-gold/10 text-gold border-gold/30"
                            }`}
                          >
                            {isPaid ? (
                              <>
                                <CheckCircle2 className="w-3 h-3" /> Payé
                              </>
                            ) : isReturned ? (
                              <>
                                <RotateCcw className="w-3 h-3" /> Retourné
                              </>
                            ) : (
                              <>
                                <Clock className="w-3 h-3" /> En attente de paiement
                              </>
                            )}
                          </span>

                          {/* Badge Type de Règlement */}
                          {order.is_credit_purchase ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-gold bg-gold/10 px-2.5 py-0.5 rounded-full border border-gold/30">
                              <Clock className="w-3 h-3" /> Paiement en Dépôt (Crédit)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-navy bg-navy/5 px-2.5 py-0.5 rounded-full border border-navy/15">
                              Règlement Immédiat
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-foreground-muted">
                          Passée le {formatFRDateTime(order.created_at)}
                        </p>
                      </div>

                      {/* Montant Total en-tête */}
                      <div className="flex items-center justify-between lg:justify-end gap-6 pt-2 lg:pt-0 border-t lg:border-t-0 border-border">
                        <div className="text-left lg:text-right">
                          <span className="text-[10px] uppercase font-bold text-foreground-muted block">
                            Montant Total
                          </span>
                          <span className="font-mono font-bold text-navy text-lg sm:text-xl">
                            {(order.total_amount ?? 0).toLocaleString("fr-FR")} FCFA
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 2. BLOC SPÉCIAL : DÉLAI DE REMBOURSEMENT / MODALITÉS CRÉDIT */}
                    {order.is_credit_purchase && (
                      <div
                        className={`p-5 border-b text-xs space-y-3 ${
                          isReturned
                            ? "bg-navy/5 border-border text-foreground-muted"
                            : delayInfo?.isOverdue
                            ? "bg-error/5 border-error/20"
                            : "bg-gold/5 border-gold/20"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div
                              className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                                isReturned
                                  ? "bg-navy/10 text-navy"
                                  : delayInfo?.isOverdue
                                  ? "bg-error/10 text-error"
                                  : "bg-gold/10 text-gold"
                              }`}
                            >
                              {isReturned ? (
                                <RotateCcw className="w-4 h-4" />
                              ) : delayInfo?.isOverdue ? (
                                <AlertTriangle className="w-4 h-4" />
                              ) : (
                                <Calendar className="w-4 h-4" />
                              )}
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-serif font-bold text-navy text-sm">
                                  {isReturned
                                    ? "Commande à Crédit Retournée"
                                    : "Modalité de Paiement en Dépôt (Crédit Auteur)"}
                                </h4>
                                {!isReturned && (
                                  <span
                                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${delayInfo?.badgeStyle}`}
                                  >
                                    {delayInfo?.label}
                                  </span>
                                )}
                              </div>
                              <p className="text-foreground-muted leading-relaxed">
                                {isReturned
                                  ? `Cette commande a été retournée le ${formatFRDate(
                                      order.returned_at
                                    )}. Les accès ont été révoqués et aucun montant n'est dû.`
                                  : `Délai de remboursement convenu : Date limite fixée au ${formatFRDate(
                                      order.credit_due_date
                                    )}.`}
                              </p>
                              {isReturned && order.return_reason && (
                                <p className="text-navy font-medium italic">
                                  Motif du retour : &ldquo;{order.return_reason}&rdquo;
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Bouton Retourner commande si non retournée et en attente */}
                          {!isReturned && !isPaid && (
                            <button
                              type="button"
                              onClick={() => setReturnOrder(order)}
                              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border border-rose-500/30 text-rose-600 hover:bg-rose-500/10 text-xs font-semibold transition-colors shrink-0 self-start sm:self-auto min-h-[38px]"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Retourner ce produit</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 3. DÉTAILS DES ARTICLES (LIGNES DE COMMANDE) */}
                    <div className="p-5 sm:p-6 space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-navy flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gold" />
                        Articles commandés ({order.lignes?.length || 0})
                      </h4>

                      <div className="divide-y divide-border border border-border rounded-2xl overflow-hidden bg-background">
                        {order.lignes?.map((ligne: OrderLineAPI) => (
                          <div
                            key={ligne.id}
                            className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-background-secondary/50 transition-colors"
                          >
                            <div className="flex items-center gap-3.5 min-w-0">
                              <div className="shrink-0 w-12 h-16 rounded-xl bg-navy/10 border border-navy/20 overflow-hidden shadow-xs flex items-center justify-center">
                                {ligne.ouvrage_cover_url ? (
                                  <img
                                    src={ligne.ouvrage_cover_url}
                                    alt={ligne.ouvrage_title}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                  />
                                ) : (
                                  <BookOpen className="w-5 h-5 text-navy/40" />
                                )}
                              </div>

                              <div className="min-w-0 space-y-1">
                                <span className="text-[10px] font-bold text-gold uppercase tracking-wider block">
                                  {ligne.discipline_name || "Ouvrage Académique"}
                                </span>
                                <h5 className="font-serif font-bold text-navy text-sm line-clamp-1">
                                  {ligne.ouvrage_title}
                                </h5>
                                <p className="text-xs text-foreground-muted truncate">
                                  Par {ligne.author_name || "Auteur LAHA"}
                                </p>
                                <div className="flex items-center gap-2 pt-0.5">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                                      ligne.format_type === "digital"
                                        ? "bg-navy/10 text-navy border border-navy/20"
                                        : "bg-gold/15 text-gold border border-gold/30"
                                    }`}
                                  >
                                    {ligne.format_display || (ligne.format_type === "digital" ? "Numérique (DRM)" : "Livre Papier")}
                                  </span>
                                  <span className="text-xs text-foreground-muted font-mono">
                                    Quantité : <strong className="text-navy">{ligne.quantity}</strong>
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border">
                              <div className="text-left sm:text-right">
                                <span className="text-[10px] text-foreground-muted block">
                                  {(ligne.unit_price ?? 0).toLocaleString("fr-FR")} FCFA / unité
                                </span>
                                <span className="font-mono font-bold text-navy text-sm">
                                  {((ligne.unit_price ?? 0) * (ligne.quantity || 1)).toLocaleString("fr-FR")} FCFA
                                </span>
                              </div>

                              {ligne.format_type === "digital" && !isReturned && (
                                <Link
                                  href={`/catalog/reader/${ligne.ouvrage}`}
                                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-navy text-white text-xs font-semibold hover:bg-navy-dark transition-colors min-h-[36px]"
                                >
                                  <BookOpen className="w-3.5 h-3.5 text-gold" />
                                  <span>Lire</span>
                                  <ArrowUpRight className="w-3 h-3 text-white/60" />
                                </Link>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 4. DÉTAILS DE LIVRAISON PHYSIQUE (SI COMMANDE PAPIER) */}
                    {order.livraison && (
                      <div className="p-5 sm:p-6 bg-background-secondary border-t border-border space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-navy flex items-center gap-2">
                            <Truck className="w-4 h-4 text-gold" />
                            Expédition &amp; Livraison Physique
                          </h4>
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-gold/10 text-gold border border-gold/30">
                            {order.livraison.statut_display || order.livraison.statut || "En préparation"}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs bg-background p-4 rounded-2xl border border-border">
                          <div className="space-y-1">
                            <span className="text-foreground-muted uppercase text-[10px] font-bold tracking-wider">
                              Adresse de livraison
                            </span>
                            <p className="text-navy font-semibold">
                              {order.livraison.shipping_address || "Non renseignée"}
                            </p>
                            <p className="text-foreground-muted">
                              {order.livraison.city}, {order.livraison.country}
                            </p>
                          </div>

                          <div className="space-y-1">
                            <span className="text-foreground-muted uppercase text-[10px] font-bold tracking-wider">
                              Transporteur &amp; Suivi
                            </span>
                            <p className="text-navy font-semibold">
                              {order.livraison.carrier_name || "Service Logistique LAHA Express"}
                            </p>
                            {order.livraison.tracking_number ? (
                              <p className="font-mono text-gold font-bold">
                                N° de suivi : {order.livraison.tracking_number}
                              </p>
                            ) : (
                              <p className="text-foreground-muted">Numéro de suivi transmis à l&apos;expédition</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 5. PIED DE CARTE FINANCIER & INFORMATIONS DE RÈGLEMENT */}
                    <div className="p-5 sm:p-6 border-t border-border bg-background flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4 text-xs flex-wrap">
                        <div className="flex items-center gap-2">
                          <PaymentIcon className="w-4 h-4 text-gold" />
                          <span className="text-foreground-muted">Canal :</span>
                          <span className="font-semibold text-navy">
                            {order.mode_paiement_display || "Mobile Money"}
                          </span>
                        </div>

                        <div className="h-4 w-px bg-border hidden sm:block" />

                        <div className="flex items-center gap-1.5 text-foreground-muted">
                          <ShieldCheck className="w-4 h-4 text-gold" />
                          <span>
                            {order.is_credit_purchase
                              ? "Protocole accord de crédit Auteur"
                              : "Paiement sécurisé LAHAThèque"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Link
                          href="/author/catalog"
                          className="px-4 py-2 rounded-xl border border-border bg-background-secondary text-navy text-xs font-semibold hover:border-gold/40 transition-colors min-h-[38px] flex items-center justify-center"
                        >
                          Nouveau titre
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* MODALE DE RETOUR PRODUIT CRÉDIT */}
      {returnOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="w-full max-w-md rounded-3xl bg-background border border-border shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-600 border border-rose-500/20">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-navy text-base">Retourner la commande</h3>
                  <p className="text-xs text-foreground-muted">Commande #{returnOrder.id.slice(0, 8)}</p>
                </div>
              </div>
              <button
                onClick={() => setReturnOrder(null)}
                className="p-2 rounded-xl text-foreground-muted hover:bg-background-secondary transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-gold/5 border border-gold/20 text-xs space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-navy">
                <Calendar className="w-4 h-4 text-gold" />
                <span>Rappel de l&apos;échéance initiale : {formatFRDate(returnOrder.credit_due_date)}</span>
              </div>
              <p className="text-foreground-muted leading-relaxed">
                Le retour de cette commande à crédit réintégrera les exemplaires papier en stock et révoquera les accès numériques associés. Le montant dû de{" "}
                <strong className="text-navy font-mono">
                  {(returnOrder.total_amount ?? 0).toLocaleString("fr-FR")} FCFA
                </strong>{" "}
                sera annulé sans pénalité.
              </p>
            </div>

            <form onSubmit={handleReturnSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-navy uppercase tracking-wider">
                  Motif du retour (facultatif)
                </label>
                <textarea
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  placeholder="Ex: Erreur de référence, format papier non requis, etc."
                  rows={3}
                  className="w-full p-3 text-xs rounded-xl border border-border bg-background-secondary text-navy placeholder:text-foreground-muted focus:outline-none focus:border-gold"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReturnOrder(null)}
                  disabled={returning}
                  className="px-4 py-2.5 rounded-xl border border-border text-xs font-semibold text-foreground-muted hover:bg-background-secondary min-h-[44px]"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={returning}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors disabled:opacity-50 min-h-[44px]"
                >
                  {returning ? (
                    <>
                      <InlineLoader size={16} />
                      <span>Traitement...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirmer le retour</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
