"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  PackageCheck,
  Search,
  User as UserIcon,
  Plus,
  X,
  Truck,
  Eye,
  CheckCircle2,
  Clock,
  ArrowLeft,
  CreditCard,
  AlertCircle,
  Filter,
  Check,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";
import { OrderCreateForm } from "@/components/student/OrderCreateForm";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { ShipOrderModal } from "@/components/features/manager/ship-order-modal";
import { OrderDetailModal } from "@/components/features/manager/order-detail-modal";
import {
  getDeliveries,
  markAsShipped,
  markAsDelivered,
  confirmManualPayment,
} from "@/lib/services/manager";
import { searchClients } from "@/lib/services/admin";
import type { ManagerOrder } from "@/lib/types/manager";
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
  // ─── État Gestion des Commandes ─────────────────────────────────────────────
  const [orders, setOrders] = useState<ManagerOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | "to_ship" | "shipped" | "delivered">("all");
  const [searchOrderQuery, setSearchOrderQuery] = useState("");

  // Modales
  const [shipTarget, setShipTarget] = useState<ManagerOrder | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<ManagerOrder | null>(null);
  const [confirmingPaymentId, setConfirmingPaymentId] = useState<string | null>(null);

  // ─── État Création Manuelle de Commande ──────────────────────────────────────
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
      const data = await getDeliveries();
      setOrders(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Impossible de charger le registre des commandes.");
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // ─── Recherche de Clients (Debounced) ───────────────────────────────────────
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

  // ─── Actions Commandes ──────────────────────────────────────────────────────
  const handleShip = async (carrier: string, trackingNumber: string) => {
    if (!shipTarget) return;
    try {
      await markAsShipped(shipTarget.id, carrier, trackingNumber);
      toast.success(`Commande #${shipTarget.id.slice(0, 8)} marquée comme expédiée.`);
      setShipTarget(null);
      await loadOrders();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur lors de l'expédition.";
      toast.error(msg);
    }
  };

  const handleDeliver = async (order: ManagerOrder) => {
    try {
      await markAsDelivered(order.id);
      toast.success(`Commande #${order.id.slice(0, 8)} marquée comme livrée.`);
      setSelectedOrder(null);
      await loadOrders();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur lors de la confirmation de livraison.";
      toast.error(msg);
    }
  };

  const handleConfirmPayment = async (order: ManagerOrder) => {
    setConfirmingPaymentId(order.id);
    try {
      const ok = await confirmManualPayment(order.id);
      if (!ok) throw new Error("Échec de la validation du paiement.");
      toast.success(`Paiement de la commande #${order.id.slice(0, 8)} validé.`);
      await loadOrders();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur lors de la validation du paiement.";
      toast.error(msg);
    } finally {
      setConfirmingPaymentId(null);
    }
  };

  // ─── Filtrage des Commandes ────────────────────────────────────────────────
  const filteredOrders = useMemo(() => {
    return orders.filter((ord) => {
      // Filtre statut
      if (statusFilter !== "all" && ord.status !== statusFilter) {
        return false;
      }
      // Filtre texte
      if (searchOrderQuery.trim()) {
        const q = searchOrderQuery.toLowerCase();
        const idMatch = ord.id.toLowerCase().includes(q) || (ord.commande_id && ord.commande_id.toLowerCase().includes(q));
        const clientMatch = ord.customer_name.toLowerCase().includes(q) || ord.customer_email.toLowerCase().includes(q);
        const bookMatch = ord.items.some((i) => i.book_title.toLowerCase().includes(q));
        if (!idMatch && !clientMatch && !bookMatch) return false;
      }
      return true;
    });
  }, [orders, statusFilter, searchOrderQuery]);

  // ─── Colonnes du Tableau ───────────────────────────────────────────────────
  const columns: DataTableColumn<ManagerOrder>[] = [
    {
      key: "id",
      header: "Réf. Commande",
      cell: (row) => (
        <button
          type="button"
          onClick={() => setSelectedOrder(row)}
          className="font-mono font-bold text-xs text-navy hover:text-gold hover:underline text-left cursor-pointer"
          title="Consulter le détail complet"
        >
          #{row.id.slice(0, 8)}
        </button>
      ),
    },
    {
      key: "customer_name",
      header: "Client & Coordonnées",
      cell: (row) => (
        <div>
          <p className="font-semibold text-xs text-navy">{row.customer_name}</p>
          <p className="text-[11px] text-foreground-muted">
            {row.customer_email}
            {row.customer_phone ? ` • ${row.customer_phone}` : ""}
          </p>
          {row.city && (
            <p className="text-[10px] text-foreground-muted font-medium">
              {row.city}, {row.country || "BJ"}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "items",
      header: "Articles",
      cell: (row) => {
        const totalQty = row.items.reduce((sum, item) => sum + (item.quantity || 1), 0);
        const firstItem = row.items[0];

        if (!firstItem) {
          return <span className="text-xs text-foreground-muted italic">Aucun article</span>;
        }

        return (
          <div className="flex items-center gap-2.5 max-w-xs">
            <div className="w-8 h-11 rounded bg-background-secondary border border-border overflow-hidden shrink-0 flex items-center justify-center">
              {firstItem.cover_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={firstItem.cover_url}
                  alt={firstItem.book_title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <BookOpen className="w-3.5 h-3.5 text-gold" />
              )}
            </div>

            <div className="min-w-0">
              <p className="text-xs font-bold text-navy truncate">
                {firstItem.book_title}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold bg-gold/15 text-navy">
                  {totalQty} ex.
                </span>
                {row.items.length > 1 && (
                  <span className="text-[10px] text-foreground-muted">
                    +{row.items.length - 1} autre{row.items.length > 2 ? "s" : ""}
                  </span>
                )}
                {row.total_amount ? (
                  <span className="text-[10px] font-mono font-bold text-navy">
                    • {row.total_amount.toLocaleString("fr-FR")} XOF
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: "statut_paiement" as keyof ManagerOrder,
      header: "Paiement",
      cell: (row) => {
        const isPaid = row.statut_paiement === "paid";
        const isConfirming = confirmingPaymentId === row.id;

        return (
          <div className="space-y-1">
            <span
              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                isPaid
                  ? "bg-emerald-500/10 text-emerald-700 border border-emerald-500/30"
                  : "bg-amber-500/10 text-amber-700 border border-amber-500/30"
              }`}
            >
              {isPaid ? (
                <>
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Payé</span>
                </>
              ) : (
                <>
                  <Clock className="w-3 h-3 text-amber-600" />
                  <span>En attente</span>
                </>
              )}
            </span>

            {!isPaid && (
              <button
                type="button"
                disabled={isConfirming}
                onClick={(e) => {
                  e.stopPropagation();
                  handleConfirmPayment(row);
                }}
                className="block text-[10px] font-bold text-gold hover:underline cursor-pointer disabled:opacity-50"
                title="Confirmer la réception du paiement manuel (espèces/virement)"
              >
                {isConfirming ? "Validation…" : "Confirmer le paiement"}
              </button>
            )}
          </div>
        );
      },
    },
    {
      key: "status",
      header: "Livraison",
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "order_date",
      header: "Date",
      hideOnMobile: true,
      cell: (row) => (
        <span className="text-xs text-foreground-muted font-mono whitespace-nowrap">
          {row.order_date
            ? new Date(row.order_date).toLocaleDateString("fr-FR", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "—"}
        </span>
      ),
    },
    {
      key: "actions" as keyof ManagerOrder,
      header: "Actions",
      cell: (row) => (
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedOrder(row);
            }}
            className="p-2 rounded-xl bg-background border border-border text-navy hover:border-gold hover:text-gold transition-colors flex items-center justify-center min-h-[36px] min-w-[36px] cursor-pointer"
            title="Consulter les détails"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>

          {row.status === "to_ship" && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShipTarget(row);
              }}
              className="px-3 py-1.5 rounded-xl bg-navy text-white text-[10px] font-bold hover:bg-navy-hover transition-colors flex items-center gap-1.5 whitespace-nowrap min-h-[36px] cursor-pointer shadow-xs"
              title="Expédier la commande"
            >
              <Truck className="w-3.5 h-3.5 text-gold" />
              <span>Expédier</span>
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
            <span>Administration Commerciale</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Gestion des commandes
          </h1>
          <p className="text-xs text-foreground-muted">
            Passez commande directement pour n&apos;importe quel client et supervisez les expéditions de la plateforme.
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
              <p className="text-xs text-foreground-muted mt-0.5">
                Recherchez l&apos;utilisateur (étudiant, lecteur, auteur, établissement) pour qui la commande sera établie.
              </p>
            </div>

            {/* Si aucun client sélectionné : Recherche & Sélecteur */}
            {!selectedClient ? (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                  {/* Champ de recherche */}
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-foreground-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={clientSearchQuery}
                      onChange={(e) => setClientSearchQuery(e.target.value)}
                      placeholder="Rechercher un client par nom, email, téléphone..."
                      className="w-full pl-10 pr-4 py-2.5 text-xs bg-background border border-border rounded-xl text-navy placeholder:text-foreground-muted focus:border-gold outline-none min-h-[44px]"
                    />
                  </div>

                  {/* Filtre rôle */}
                  <select
                    value={clientRoleFilter}
                    onChange={(e) => setClientRoleFilter(e.target.value)}
                    className="px-3.5 py-2.5 text-xs bg-background border border-border rounded-xl text-navy focus:border-gold outline-none min-h-[44px]"
                    aria-label="Filtrer par rôle"
                  >
                    <option value="all">Tous les profils</option>
                    <option value="student">Lecteurs / Étudiants</option>
                    <option value="author">Auteurs</option>
                    <option value="university">Universités</option>
                    <option value="wholesaler">Grossistes</option>
                  </select>
                </div>

                {/* Résultats de recherche */}
                <div className="border border-border rounded-2xl bg-background overflow-hidden divide-y divide-border max-h-72 overflow-y-auto">
                  {searchingClients ? (
                    <div className="p-6 text-center text-xs text-foreground-muted flex items-center justify-center gap-2">
                      <Loader variant="spinner" size={14} className="text-gold" />
                      <span>Recherche des comptes clients en cours...</span>
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="p-6 text-center text-xs text-foreground-muted italic">
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
                              <p className="text-[11px] text-foreground-muted truncate">
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
              /* Client sélectionné : Carte récapitulative */
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
                    <p className="text-xs text-foreground-muted truncate">
                      {selectedClient.email}
                      {selectedClient.phone ? ` • ${selectedClient.phone}` : ""}
                      {selectedClient.country ? ` • ${selectedClient.country}` : ""}
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

          {/* Formulaire de sélection d'articles réutilisé avec client cible */}
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

      {/* ── Section 2 — Gestion & Supervision des Commandes ─────────────── */}
      <section aria-labelledby="section-manage-orders" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-wrap">
          <div>
            <h2
              id="section-manage-orders"
              className="font-serif text-xl sm:text-2xl font-bold text-navy flex items-center gap-2"
            >
              <Truck className="w-5 h-5 text-gold" />
              <span>Gestion &amp; Expédition des Commandes</span>
            </h2>
            <p className="text-xs text-foreground-muted">
              {filteredOrders.length} commande{filteredOrders.length > 1 ? "s" : ""} affichée{filteredOrders.length > 1 ? "s" : ""}.
            </p>
          </div>

          {/* Recherche */}
          <div className="relative min-w-[240px]">
            <Search className="w-3.5 h-3.5 text-foreground-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchOrderQuery}
              onChange={(e) => setSearchOrderQuery(e.target.value)}
              placeholder="Filtrer par réf, client ou livre..."
              className="w-full pl-9 pr-3.5 py-2 text-xs bg-background border border-border rounded-xl text-navy placeholder:text-foreground-muted focus:border-gold outline-none min-h-[40px]"
            />
          </div>
        </div>

        {/* Onglets Filtres Statut */}
        <div className="flex items-center gap-2 border-b border-border pb-3 overflow-x-auto">
          {[
            { id: "all", label: "Toutes les commandes" },
            { id: "to_ship", label: "À expédier" },
            { id: "shipped", label: "En transit" },
            { id: "delivered", label: "Livrées" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id as typeof statusFilter)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === tab.id
                  ? "bg-navy text-white shadow-xs"
                  : "text-foreground-muted hover:text-navy hover:bg-background-secondary"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tableau des Commandes */}
        <DataTable
          data={filteredOrders}
          columns={columns}
          rowKey="id"
          loading={loadingOrders}
          emptyMessage="Aucune commande correspondant aux critères."
          onRowClick={(row) => setSelectedOrder(row)}
        />
      </section>

      {/* ── Modales d'Expédition & de Détails ─────────────────────────────── */}
      {shipTarget && (
        <ShipOrderModal
          order={shipTarget}
          isOpen={Boolean(shipTarget)}
          onClose={() => setShipTarget(null)}
          onConfirm={handleShip}
        />
      )}

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          isOpen={Boolean(selectedOrder)}
          onClose={() => setSelectedOrder(null)}
          onShip={(ord) => setShipTarget(ord)}
          onDeliver={(ord) => handleDeliver(ord)}
        />
      )}
    </div>
  );
}
