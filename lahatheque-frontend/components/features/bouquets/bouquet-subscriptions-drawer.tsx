"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Users,
  Building2,
  User,
  Calendar,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  Search,
  Layers,
  Filter,
} from "lucide-react";
import {
  getBouquetSubscriptions,
  BouquetSubscriptionsResponse,
  BouquetSubscriberItem,
  BouquetOfferingAdmin,
} from "@/lib/services/admin";

export interface BouquetSubscriptionsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  bouquet: BouquetOfferingAdmin | null;
}

export function BouquetSubscriptionsDrawer({
  isOpen,
  onClose,
  bouquet,
}: BouquetSubscriptionsDrawerProps) {
  const [data, setData] = useState<BouquetSubscriptionsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "pending" | "expired">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "institution" | "client">("all");

  useEffect(() => {
    if (!isOpen || !bouquet) {
      setData(null);
      setError(null);
      setSearchQuery("");
      setStatusFilter("all");
      setTypeFilter("all");
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    getBouquetSubscriptions(bouquet.id)
      .then((res) => {
        if (!isMounted) return;
        if (res) {
          setData(res);
        } else {
          setError("Impossible de charger l'historique des souscriptions.");
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Erreur abonnements bouquet:", err);
        setError("Une erreur réseau est survenue lors de la récupération des souscriptions.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, bouquet]);

  const filteredSubscriptions = useMemo(() => {
    if (!data?.subscriptions) return [];
    let list = data.subscriptions;

    if (statusFilter !== "all") {
      list = list.filter((s) => s.status === statusFilter);
    }

    if (typeFilter !== "all") {
      list = list.filter((s) => s.type === typeFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.subscriber_name.toLowerCase().includes(q) ||
          s.subscriber_code.toLowerCase().includes(q) ||
          s.subscriber_email.toLowerCase().includes(q)
      );
    }

    return list;
  }, [data, statusFilter, typeFilter, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-navy-dark/60 backdrop-blur-sm animate-in fade-in duration-200 font-poppins">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div
          className="w-screen max-w-2xl bg-background border-l border-border shadow-2xl flex flex-col overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="subscriptions-drawer-title"
        >
          {/* En-tête */}
          <div className="p-4 sm:p-6 border-b border-border bg-background-secondary/40 flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/30 flex items-center justify-center text-gold shrink-0 mt-0.5">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-gold tracking-wider uppercase">
                  Audit des Souscriptions
                </span>
                <h2
                  id="subscriptions-drawer-title"
                  className="font-playfair font-bold text-lg sm:text-xl text-navy leading-tight"
                >
                  {bouquet?.title || "Bouquet documentaire"}
                </h2>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-foreground/70">
                  <span>
                    Total : <strong className="text-navy">{data?.total_subscribers ?? 0}</strong> souscripteur(s)
                  </span>
                  <span>•</span>
                  <span>
                    Actifs : <strong className="text-emerald-700">{data?.active_subscribers ?? 0}</strong> en cours
                  </span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer le tiroir"
              className="p-2 rounded-lg text-foreground/60 hover:text-navy hover:bg-background-secondary transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Filtres & Recherche */}
          <div className="p-4 border-b border-border bg-background space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/50" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher par nom, code ou email..."
                className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-border bg-background-secondary/30 focus:bg-background focus:outline-none focus:border-gold transition-all"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              {/* Filtre Type */}
              <div className="flex items-center gap-1 bg-background-secondary/50 p-1 rounded-lg border border-border text-xs">
                <button
                  type="button"
                  onClick={() => setTypeFilter("all")}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    typeFilter === "all"
                      ? "bg-navy text-background font-medium"
                      : "text-foreground/70 hover:text-navy"
                  }`}
                >
                  Tous
                </button>
                <button
                  type="button"
                  onClick={() => setTypeFilter("institution")}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    typeFilter === "institution"
                      ? "bg-navy text-background font-medium"
                      : "text-foreground/70 hover:text-navy"
                  }`}
                >
                  Universités
                </button>
                <button
                  type="button"
                  onClick={() => setTypeFilter("client")}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    typeFilter === "client"
                      ? "bg-navy text-background font-medium"
                      : "text-foreground/70 hover:text-navy"
                  }`}
                >
                  Particuliers
                </button>
              </div>

              {/* Filtre Statut */}
              <div className="flex items-center gap-1 bg-background-secondary/50 p-1 rounded-lg border border-border text-xs">
                <button
                  type="button"
                  onClick={() => setStatusFilter("all")}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    statusFilter === "all"
                      ? "bg-navy text-background font-medium"
                      : "text-foreground/70 hover:text-navy"
                  }`}
                >
                  Tous
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("active")}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    statusFilter === "active"
                      ? "bg-emerald-700 text-white font-medium"
                      : "text-foreground/70 hover:text-navy"
                  }`}
                >
                  Actifs
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("pending")}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    statusFilter === "pending"
                      ? "bg-amber-600 text-white font-medium"
                      : "text-foreground/70 hover:text-navy"
                  }`}
                >
                  En attente
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("expired")}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    statusFilter === "expired"
                      ? "bg-foreground/70 text-white font-medium"
                      : "text-foreground/70 hover:text-navy"
                  }`}
                >
                  Expirés
                </button>
              </div>
            </div>
          </div>

          {/* Liste scrollable des abonnés */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
            {loading ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-10 h-10 mx-auto rounded-full border-2 border-gold border-t-transparent animate-spin" />
                <p className="text-sm text-foreground/70">Chargement des abonnés du bouquet...</p>
              </div>
            ) : error ? (
              <div className="py-12 px-4 rounded-xl border border-border bg-background-secondary/40 text-center space-y-2">
                <AlertCircle className="w-8 h-8 text-foreground/60 mx-auto" />
                <p className="text-sm text-foreground/80">{error}</p>
              </div>
            ) : filteredSubscriptions.length === 0 ? (
              <div className="py-16 text-center space-y-2">
                <Users className="w-10 h-10 text-foreground/40 mx-auto" />
                <p className="font-playfair font-semibold text-base text-navy">
                  Aucun souscripteur trouvé
                </p>
                <p className="text-xs text-foreground/60 max-w-xs mx-auto">
                  {searchQuery || statusFilter !== "all" || typeFilter !== "all"
                    ? "Aucun résultat pour les critères de recherche sélectionnés."
                    : "Ce bouquet n'a encore enregistré aucune souscription."}
                </p>
              </div>
            ) : (
              filteredSubscriptions.map((sub) => {
                const isActive = sub.status === "active";
                const isInstitution = sub.type === "institution";

                return (
                  <div
                    key={sub.id}
                    className="p-4 rounded-xl border border-border bg-background-secondary/20 hover:border-gold/30 hover:bg-background-secondary/40 transition-all space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            isInstitution
                              ? "bg-navy/10 text-navy"
                              : "bg-gold/10 text-gold"
                          }`}
                        >
                          {isInstitution ? (
                            <Building2 className="w-4 h-4" />
                          ) : (
                            <User className="w-4 h-4" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-semibold text-xs sm:text-sm text-navy truncate">
                            {sub.subscriber_name}
                          </h4>
                          <p className="text-[11px] text-foreground/60 truncate">
                            {sub.subscriber_email}
                          </p>
                        </div>
                      </div>

                      {/* Badge Statut */}
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium shrink-0 ${
                          sub.status === "active"
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                            : sub.status === "pending"
                            ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20"
                            : sub.status === "cancelled"
                            ? "bg-destructive/10 text-destructive border border-destructive/20"
                            : "bg-background-secondary text-foreground/60 border border-border"
                        }`}
                      >
                        {sub.status === "active" ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Actif
                          </>
                        ) : sub.status === "pending" ? (
                          <>
                            <Clock className="w-3 h-3 text-amber-600" />
                            En attente
                          </>
                        ) : sub.status === "cancelled" ? (
                          <>
                            <AlertCircle className="w-3 h-3 text-destructive" />
                            Annulé
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3 text-foreground/50" />
                            Expiré
                          </>
                        )}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-border/40 text-xs">
                      <div>
                        <span className="text-[10px] text-foreground/50 block">Formule</span>
                        <span className="font-medium text-navy capitalize">
                          {sub.subscription_period === "monthly" ? "Mensuel (30j)" : "Annuel (365j)"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-foreground/50 block">Montant payé</span>
                        <span className="font-semibold text-gold">
                          {sub.price_paid.toLocaleString()} {sub.currency}
                        </span>
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <span className="text-[10px] text-foreground/50 block">Échéance</span>
                        <span className="font-medium text-foreground/80 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-foreground/40" />
                          {sub.end_date
                            ? new Date(sub.end_date).toLocaleDateString("fr-FR", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })
                            : "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pied de page */}
          <div className="p-4 border-t border-border bg-background-secondary/30 flex items-center justify-between">
            <span className="text-xs text-foreground/60">
              {filteredSubscriptions.length} souscription(s) affichée(s)
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-navy text-background text-xs sm:text-sm font-medium hover:bg-navy-hover transition-colors shadow-sm"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
