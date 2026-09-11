"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  PackageCheck,
  Search,
  User as UserIcon,
  Plus,
  X,
  Eye,
  CheckCircle2,
  Clock,
  CreditCard,
  AlertCircle,
  Check,
  BookOpen,
  Warehouse,
  Building2,
  Package,
  Truck,
  RotateCcw,
  Mail,
  Receipt,
  Banknote,
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { OrderCreateForm } from "@/components/student/OrderCreateForm";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { OrderActionModal } from "@/components/features/admin/order-action-modal";
import {
  getAdminOrders,
  searchClients,
  remindAbandonedOrder,
} from "@/lib/services/admin";
import type {
  AdminOrder,
  AdminOrdersKpis,
  AdminOrderPaymentStatus,
} from "@/lib/types/admin";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Loader } from "@/components/ui/loader";

interface ClientSearchResult {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  phone?: string;
  country?: string;
  avatar_url?: string;
}

export default function AdminOrdersPage() {
  // ─── État Commandes Réelles (BFF / Django) ──────────────────────────────────
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [kpis, setKpis] = useState<AdminOrdersKpis>({
    total_orders_count: 0,
    paid_count: 0,
    pending_count: 0,
    credit_count: 0,
    abandoned_count: 0,
    failed_count: 0,
    cancelled_count: 0,
    total_paid_amount: 0,
    total_credit_amount: 0,
    potential_abandoned_loss: 0,
  });
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<AdminOrderPaymentStatus>("all");
  const [periodFilter, setPeriodFilter] = useState<string>("all");
  const [searchOrderQuery, setSearchOrderQuery] = useState("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalOrders, setTotalOrders] = useState<number>(0);

  // ─── Modale d'Action Commande ──────────────────────────────────────────────
  const [selectedOrderForAction, setSelectedOrderForAction] = useState<AdminOrder | null>(null);

  // ─── État Création Manuelle de Commande pour un Client ──────────────────────
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [clientSearchQuery, setClientSearchQuery] = useState("");
  const [clientRoleFilter, setClientRoleFilter] = useState<string>("all");
  const [searchingClients, setSearchingClients] = useState(false);
  const [searchResults, setSearchResults] = useState<ClientSearchResult[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientSearchResult | null>(null);

  // ─── Chargement des Commandes ───────────────────────────────────────────────
  const loadOrders = useCallback(async () => {
    setLoadingOrders(true);
    try {
      const res = await getAdminOrders({
        statut_paiement: paymentStatusFilter,
        period: periodFilter,
        q: searchOrderQuery.trim() || undefined,
        page: currentPage,
        page_size: 20,
      });

      setOrders(res.orders || []);
      if (res.kpis) {
        setKpis(res.kpis);
      }
      setTotalOrders(res.total || 0);
    } catch {
      toast.error("Impossible de charger le registre des commandes.");
    } finally {
      setLoadingOrders(false);
    }
  }, [paymentStatusFilter, periodFilter, searchOrderQuery, currentPage]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // ─── Recherche de Clients pour Création ─────────────────────────────────────
  useEffect(() => {
    if (!isCreatingOrder || selectedClient) return;

    const timer = setTimeout(async () => {
      setSearchingClients(true);
      try {
        const results = await searchClients(
          clientSearchQuery.trim(),
          clientRoleFilter === "all" ? undefined : clientRoleFilter
        );
        setSearchResults(Array.isArray(results) ? results : []);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchingClients(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [clientSearchQuery, clientRoleFilter, isCreatingOrder, selectedClient]);

  // ─── Relance Panier Rapide en 1 clic ────────────────────────────────────────
  const handleQuickReminder = async (e: React.MouseEvent, order: AdminOrder) => {
    e.stopPropagation();
    try {
      const res = await remindAbandonedOrder(order.id);
      if (res.success) {
        toast.success(res.message || "Email de relance envoyé avec succès.");
        loadOrders();
      } else {
        toast.error(res.error || "Échec de l'envoi de la relance.");
      }
    } catch {
      toast.error("Erreur réseau lors de la relance.");
    }
  };

  const formatCurrency = (val: number, currency = "XOF") => {
    return `${val.toLocaleString("fr-FR")} ${currency}`;
  };

  // ─── Colonnes du Tableau des Commandes ──────────────────────────────────────
  const columns: DataTableColumn<AdminOrder>[] = [
    {
      key: "order_reference",
      header: "Réf. Commande",
      cell: (row) => (
        <button
          type="button"
          onClick={() => setSelectedOrderForAction(row)}
          className="font-mono font-bold text-xs text-navy hover:text-gold hover:underline text-left cursor-pointer flex items-center gap-1"
          title="Consulter ou gérer la commande"
        >
          <span>{row.order_reference || `#${row.id.slice(0, 8).toUpperCase()}`}</span>
        </button>
      ),
    },
    {
      key: "customer_name",
      header: "Acheteur & Coordonnées",
      cell: (row) => (
        <div>
          <p className="font-semibold text-xs text-navy">{row.customer_name}</p>
          <p className="text-[11px] text-muted-foreground">{row.customer_email}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[10px] px-1.5 py-0.2 rounded font-medium bg-muted text-muted-foreground capitalize">
              {row.customer_role || "Lecteur"}
            </span>
            {row.manual_payment_reference && (
              <span className="text-[10px] text-gold font-mono truncate max-w-[130px]" title={row.manual_payment_reference}>
                Réf: {row.manual_payment_reference}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "items",
      header: "Articles & Volumes",
      cell: (row) => {
        const firstItem = row.items?.[0];
        if (!firstItem) {
          return <span className="text-xs text-muted-foreground italic">Aucun article</span>;
        }

        return (
          <div className="min-w-0 max-w-xs">
            <p className="text-xs font-medium text-navy truncate" title={firstItem.book_title}>
              {firstItem.book_title}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-muted-foreground">
              <span className="font-mono font-semibold text-navy">
                {row.items_count} article{row.items_count > 1 ? "s" : ""}
              </span>
              {row.items.length > 1 && (
                <span>(+{row.items.length - 1} autre{row.items.length > 2 ? "s" : ""})</span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: "total_amount",
      header: "Montant",
      cell: (row) => (
        <div>
          <span className="font-mono font-bold text-xs text-navy block">
            {formatCurrency(row.total_amount, row.currency)}
          </span>
          <span className="text-[10px] text-muted-foreground">
            {row.mode_paiement_display || row.mode_paiement}
          </span>
        </div>
      ),
    },
    {
      key: "statut_paiement",
      header: "Statut Paiement",
      cell: (row) => {
        const isPaid = row.statut_paiement === "paid";
        const isAbandoned = row.statut_paiement === "abandoned";
        const isCredit = row.is_credit_purchase || row.statut_paiement === "credit";
        const isFailed = row.statut_paiement === "failed";
        const isCancelled = row.statut_paiement === "cancelled";

        return (
          <div className="space-y-1">
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isPaid
                  ? "bg-emerald-500/10 text-emerald-700 border border-emerald-500/30"
                  : isAbandoned
                  ? "bg-rose-500/10 text-rose-700 border border-rose-500/30"
                  : isCredit
                  ? "bg-amber-500/10 text-amber-700 border border-amber-500/30"
                  : isFailed || isCancelled
                  ? "bg-destructive/10 text-destructive border border-destructive/30"
                  : "bg-navy/5 text-navy border border-border"
              }`}
            >
              {isPaid ? (
                <>
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Payé</span>
                </>
              ) : isAbandoned ? (
                <>
                  <RotateCcw className="w-3 h-3 text-rose-600" />
                  <span>Panier abandonné</span>
                </>
              ) : isCredit ? (
                <>
                  <Clock className="w-3 h-3 text-amber-600" />
                  <span>À crédit</span>
                </>
              ) : isFailed ? (
                <>
                  <XCircle className="w-3 h-3 text-destructive" />
                  <span>Échec</span>
                </>
              ) : (
                <>
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <span>En attente</span>
                </>
              )}
            </span>

            {/* Horodatage relance si existante */}
            {row.last_reminder_sent_at && (
              <span className="text-[9px] text-muted-foreground block">
                Relancé le {new Date(row.last_reminder_sent_at).toLocaleDateString("fr-FR")}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "created_at",
      header: "Date",
      hideOnMobile: true,
      cell: (row) => (
        <span className="text-xs text-muted-foreground font-mono whitespace-nowrap">
          {new Date(row.created_at).toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </span>
      ),
    },
    {
      key: "actions" as keyof AdminOrder,
      header: "Actions",
      cell: (row) => (
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedOrderForAction(row);
            }}
            className="px-3 py-1.5 rounded-xl bg-navy text-white text-xs font-semibold hover:bg-navy-hover transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs min-h-[36px]"
            title="Ouvrir la console d'actions"
          >
            <Eye className="w-3.5 h-3.5 text-gold" />
            <span>Gérer</span>
          </button>

          {(row.statut_paiement === "abandoned" || row.statut_paiement === "pending") && (
            <button
              type="button"
              onClick={(e) => handleQuickReminder(e, row)}
              className="p-2 rounded-xl bg-background border border-border text-navy hover:border-gold hover:text-gold transition-colors flex items-center justify-center min-h-[36px] min-w-[36px] cursor-pointer"
              title="Envoyer une relance email directe"
            >
              <Mail className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-8 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* ── En-tête de Page ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider">
            <PackageCheck className="w-4 h-4 text-gold" />
            <span>Administration Commerciale &amp; Finances</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Supervision des Commandes
          </h1>
          <p className="text-xs text-muted-foreground">
            Supervisez 100 % des commandes, encaissements et paniers abandonnés avec console d'actions rapides.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isCreatingOrder ? (
            <button
              type="button"
              onClick={() => {
                setIsCreatingOrder(true);
                setSelectedClient(null);
                setClientSearchQuery("");
              }}
              className="px-4 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors flex items-center gap-2 min-h-[44px] cursor-pointer shadow-md"
            >
              <Plus className="w-4 h-4 text-gold" />
              <span>Créer une commande pour un client</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setIsCreatingOrder(false);
                setSelectedClient(null);
              }}
              className="px-4 py-2.5 rounded-xl border border-border text-navy text-xs font-semibold hover:bg-background-secondary transition-colors flex items-center gap-1.5 min-h-[44px] cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>Masquer le formulaire</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Bandeau des 4 KPIs Financiers & Volumétriques ─────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 : CA Encaissé Réel */}
        <div className="p-4 rounded-2xl border border-border bg-background-secondary/40 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">CA Encaissé</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="font-serif text-xl sm:text-2xl font-bold text-navy">
              {formatCurrency(kpis.total_paid_amount)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {kpis.paid_count} commande{kpis.paid_count > 1 ? "s" : ""} payée{kpis.paid_count > 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* KPI 2 : Encours Crédit */}
        <div className="p-4 rounded-2xl border border-border bg-background-secondary/40 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Créances / À Crédit</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="font-serif text-xl sm:text-2xl font-bold text-navy">
              {formatCurrency(kpis.total_credit_amount)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {kpis.credit_count} achat{kpis.credit_count > 1 ? "s" : ""} à échéance autorisée
            </p>
          </div>
        </div>

        {/* KPI 3 : Manque à gagner (Paniers abandonnés) */}
        <div className="p-4 rounded-2xl border border-border bg-background-secondary/40 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Paniers Abandonnés</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="font-serif text-xl sm:text-2xl font-bold text-rose-700">
              {formatCurrency(kpis.potential_abandoned_loss)}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {kpis.abandoned_count} abandon{kpis.abandoned_count > 1 ? "s" : ""} (manque à gagner)
            </p>
          </div>
        </div>

        {/* KPI 4 : Taux de conversion & En attente */}
        <div className="p-4 rounded-2xl border border-border bg-background-secondary/40 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">En attente / Total</span>
            <div className="p-2 rounded-xl bg-navy/10 text-navy">
              <PackageCheck className="w-4 h-4 text-gold" />
            </div>
          </div>
          <div>
            <p className="font-serif text-xl sm:text-2xl font-bold text-navy">
              {kpis.pending_count} / {kpis.total_orders_count}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {kpis.failed_count + kpis.cancelled_count} échec{kpis.failed_count + kpis.cancelled_count > 1 ? "s" : ""} ou annulation{kpis.failed_count + kpis.cancelled_count > 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      {/* ── Accès Rapide Files Opérationnelles ───────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-background-secondary rounded-2xl border border-border">
        <span className="text-[11px] font-bold text-navy uppercase tracking-wider flex items-center gap-1.5 mr-1">
          <Truck className="w-3.5 h-3.5 text-gold" />
          Files Opérationnelles :
        </span>
        <Link
          href="/admin/sales"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-background hover:bg-background-secondary border border-border text-navy text-xs font-semibold hover:border-gold hover:text-gold transition-colors min-h-[36px]"
        >
          <Receipt className="w-3.5 h-3.5 text-gold" />
          <span>Ventes Consolidées</span>
        </Link>
        <Link
          href="/admin/finance"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-background hover:bg-background-secondary border border-border text-navy text-xs font-semibold hover:border-gold hover:text-gold transition-colors min-h-[36px]"
        >
          <TrendingUp className="w-3.5 h-3.5 text-gold" />
          <span>Synthèse Financière</span>
        </Link>
        <Link
          href="/admin/payouts"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-background hover:bg-background-secondary border border-border text-navy text-xs font-semibold hover:border-gold hover:text-gold transition-colors min-h-[36px]"
        >
          <Banknote className="w-3.5 h-3.5 text-gold" />
          <span>Versements Redevances</span>
        </Link>
        <Link
          href="/manager"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-background hover:bg-background-secondary border border-border text-navy text-xs font-semibold hover:border-gold hover:text-gold transition-colors min-h-[36px]"
        >
          <Warehouse className="w-3.5 h-3.5 text-gold" />
          <span>Vue Stock &amp; Livraisons</span>
        </Link>
      </div>

      {/* ── Section 1 — Création Manuelle de Commande pour un Client ─────── */}
      {isCreatingOrder && (
        <section aria-labelledby="section-create-order" className="space-y-6">
          <div className="bg-background-secondary/60 border border-border rounded-3xl p-5 sm:p-7 space-y-6">
            <div className="border-b border-border pb-4">
              <h2
                id="section-create-order"
                className="font-serif text-lg sm:text-xl font-bold text-navy flex items-center gap-2"
              >
                <UserIcon className="w-5 h-5 text-gold" />
                <span>1. Identification du Client Cible</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Recherchez l&apos;utilisateur (étudiant, lecteur, auteur, établissement) pour qui la commande sera établie.
              </p>
            </div>

            {!selectedClient ? (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={clientSearchQuery}
                      onChange={(e) => setClientSearchQuery(e.target.value)}
                      placeholder="Rechercher un client par nom, email, téléphone..."
                      className="w-full pl-10 pr-4 py-2.5 text-xs bg-background border border-border rounded-xl text-navy placeholder:text-muted-foreground focus:border-gold outline-hidden min-h-[44px]"
                    />
                  </div>

                  <select
                    value={clientRoleFilter}
                    onChange={(e) => setClientRoleFilter(e.target.value)}
                    className="px-3.5 py-2.5 text-xs bg-background border border-border rounded-xl text-navy focus:border-gold outline-hidden min-h-[44px]"
                    aria-label="Filtrer par rôle"
                  >
                    <option value="all">Tous les profils</option>
                    <option value="student">Lecteurs / Étudiants</option>
                    <option value="author">Auteurs</option>
                    <option value="university">Universités</option>
                    <option value="wholesaler">Grossistes</option>
                  </select>
                </div>

                <div className="border border-border rounded-2xl bg-background overflow-hidden divide-y divide-border max-h-72 overflow-y-auto">
                  {searchingClients ? (
                    <div className="p-6 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                      <Loader variant="spinner" size={14} className="text-gold" />
                      <span>Recherche des comptes clients en cours...</span>
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="p-6 text-center text-xs text-muted-foreground italic">
                      {clientSearchQuery.trim()
                        ? `Aucun compte trouvé pour « ${clientSearchQuery} »`
                        : "Tapez au moins une lettre pour rechercher un compte client"}
                    </div>
                  ) : (
                    searchResults.map((client) => {
                      const fullName = `${client.first_name || ""} ${client.last_name || ""}`.trim() || client.email;
                      return (
                        <div
                          key={client.id}
                          className="p-3.5 flex items-center justify-between gap-3 hover:bg-background-secondary transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <UserAvatar
                              src={client.avatar_url}
                              name={fullName}
                              size="sm"
                              className="border border-gold/20 shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="font-serif font-bold text-navy text-xs truncate">
                                {fullName}
                              </p>
                              <p className="text-[11px] text-muted-foreground truncate">
                                {client.email}
                                {client.phone ? ` • ${client.phone}` : ""}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-navy/5 text-navy border border-border capitalize">
                              {client.role || "Lecteur"}
                            </span>
                            <button
                              type="button"
                              onClick={() => setSelectedClient(client)}
                              className="px-3.5 py-1.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs min-h-[36px]"
                            >
                              <Check className="w-3.5 h-3.5 text-gold" />
                              <span>Sélectionner</span>
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-background border border-gold/30 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3 min-w-0">
                  <UserAvatar
                    src={selectedClient.avatar_url}
                    name={`${selectedClient.first_name || ""} ${selectedClient.last_name || ""}`.trim() || selectedClient.email}
                    size="md"
                    className="border-2 border-gold shrink-0"
                  />
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gold block">
                      Client sélectionné
                    </span>
                    <p className="font-serif font-bold text-navy text-sm sm:text-base truncate">
                      {`${selectedClient.first_name || ""} ${selectedClient.last_name || ""}`.trim() || selectedClient.email}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {selectedClient.email}
                      {selectedClient.phone ? ` • ${selectedClient.phone}` : ""}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedClient(null)}
                  className="px-3.5 py-2 rounded-xl border border-border text-xs font-semibold text-navy hover:bg-background-secondary transition-colors cursor-pointer"
                >
                  Changer de client
                </button>
              </div>
            )}
          </div>

          {selectedClient && (
            <div className="space-y-3">
              <OrderCreateForm
                targetClientId={selectedClient.id}
                targetClientName={`${selectedClient.first_name || ""} ${selectedClient.last_name || ""}`.trim() || selectedClient.email}
                onSuccess={() => {
                  setSelectedClient(null);
                  setIsCreatingOrder(false);
                  loadOrders();
                }}
                onCancel={() => {
                  setSelectedClient(null);
                  setIsCreatingOrder(false);
                }}
              />
            </div>
          )}
        </section>
      )}

      {/* ── Section 2 — Supervision & Filtres des Commandes ───────────────── */}
      <section aria-labelledby="section-manage-orders" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-wrap">
          <div>
            <h2
              id="section-manage-orders"
              className="font-serif text-xl sm:text-2xl font-bold text-navy flex items-center gap-2"
            >
              <Receipt className="w-5 h-5 text-gold" />
              <span>Registre Général des Commandes</span>
            </h2>
            <p className="text-xs text-muted-foreground">
              {totalOrders} commande{totalOrders > 1 ? "s" : ""} répertoriée{totalOrders > 1 ? "s" : ""} dans la sélection.
            </p>
          </div>

          {/* Recherche & Filtre Période */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <select
              value={periodFilter}
              onChange={(e) => {
                setPeriodFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 text-xs bg-background border border-border rounded-xl text-navy focus:border-gold outline-hidden min-h-[40px]"
            >
              <option value="all">Toutes périodes</option>
              <option value="today">Aujourd'hui</option>
              <option value="week">Cette semaine</option>
              <option value="month">Ce mois</option>
              <option value="year">Cette année</option>
            </select>

            <div className="relative min-w-[220px]">
              <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchOrderQuery}
                onChange={(e) => {
                  setSearchOrderQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Réf, client ou livre..."
                className="w-full pl-9 pr-3.5 py-2 text-xs bg-background border border-border rounded-xl text-navy placeholder:text-muted-foreground focus:border-gold outline-hidden min-h-[40px]"
              />
            </div>
          </div>
        </div>

        {/* Onglets Filtres Statut Sémantiques */}
        <div className="flex items-center gap-2 border-b border-border pb-3 overflow-x-auto">
          {[
            { id: "all", label: "Toutes", count: kpis.total_orders_count },
            { id: "paid", label: "Payées", count: kpis.paid_count },
            { id: "credit", label: "À crédit", count: kpis.credit_count },
            { id: "pending", label: "En attente", count: kpis.pending_count },
            { id: "abandoned", label: "Paniers abandonnés", count: kpis.abandoned_count },
            { id: "failed", label: "Échouées", count: kpis.failed_count },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setPaymentStatusFilter(tab.id as AdminOrderPaymentStatus);
                setCurrentPage(1);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 ${
                paymentStatusFilter === tab.id
                  ? "bg-navy text-white shadow-xs"
                  : "text-muted-foreground hover:text-navy hover:bg-background-secondary"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  paymentStatusFilter === tab.id
                    ? "bg-gold text-navy font-bold"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Tableau des Commandes Réelles */}
        <DataTable
          data={orders}
          columns={columns}
          rowKey="id"
          loading={loadingOrders}
          emptyMessage="Aucune commande trouvée pour ces critères de recherche."
          onRowClick={(row) => setSelectedOrderForAction(row)}
          pageSize={20}
          pageSizeOptions={[10, 20, 50, 100]}
        />
      </section>

      {/* ── Modale d'Actions Complète sur la Commande ────────────────────── */}
      {selectedOrderForAction && (
        <OrderActionModal
          order={selectedOrderForAction}
          isOpen={Boolean(selectedOrderForAction)}
          onClose={() => setSelectedOrderForAction(null)}
          onSuccess={() => {
            loadOrders();
          }}
        />
      )}
    </div>
  );
}
