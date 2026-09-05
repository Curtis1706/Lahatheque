"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  getAdminStockOverview,
  getAdminStockHolders,
  getAdminStockTransactions,
  recordAdminManualPayment,
} from "@/lib/services/admin";
import {
  AdminStockOverview,
  StockHolder,
  StockTransaction,
} from "@/lib/types/admin";
import {
  Boxes,
  Building2,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  Clock,
  CheckCircle2,
  PackageCheck,
  Plus,
  Loader2,
  MapPin,
  User,
  Banknote,
  ReceiptText,
  Users,
  Phone,
  Mail,
  BookOpen,
  Search,
  Filter,
  X,
  FileText,
  Smartphone,
  Wallet,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { PageLoader } from "@/components/ui/page-loader";

export default function AdminStockOverviewPage() {
  const [overview, setOverview] = useState<AdminStockOverview | null>(null);
  const [holders, setHolders] = useState<StockHolder[]>([]);
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Navigation par onglets
  const [activeTab, setActiveTab] = useState<"holders" | "transactions" | "warehouses">("holders");

  // Filtres détenteurs
  const [searchHolder, setSearchHolder] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  // Filtres transactions
  const [searchTx, setSearchTx] = useState("");
  const [methodFilter, setMethodFilter] = useState("all");

  // Modale Enregistrement Paiement Manuel
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [paymentHolderName, setPaymentHolderName] = useState("");
  const [paymentHolderId, setPaymentHolderId] = useState("");
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState("especes");
  const [paymentReceipt, setPaymentReceipt] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [overviewData, holdersData, txData] = await Promise.all([
        getAdminStockOverview(),
        getAdminStockHolders().catch(() => []),
        getAdminStockTransactions().catch(() => []),
      ]);
      setOverview(overviewData);
      setHolders(holdersData);
      setTransactions(txData);
    } catch {
      toast.error("Impossible de charger les données de stock physique.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleOpenPaymentModal = (holder?: StockHolder) => {
    const today = new Date();
    const dateStr = today.toISOString().split("T")[0];
    const ymd = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;
    const randNum = Math.floor(1000 + Math.random() * 9000);

    if (holder) {
      setPaymentHolderName(holder.name);
      setPaymentHolderId(holder.holder_id || holder.id);
      setPaymentAmount(
        holder.remaining_balance_xof > 0
          ? holder.remaining_balance_xof.toString()
          : ""
      );
      setPaymentNotes(`Règlement pour le stock détenu (${holder.total_copies} ex. papier).`);
    } else {
      setPaymentHolderName("");
      setPaymentHolderId("");
      setPaymentAmount("");
      setPaymentNotes("");
    }

    setPaymentMethod("especes");
    setPaymentReceipt(`REC-ESP-${ymd}-${randNum}`);
    setPaymentDate(dateStr);
    setIsPaymentModalOpen(true);
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(paymentAmount);

    if (!paymentHolderName.trim()) {
      toast.error("Veuillez renseigner le nom du détenteur.");
      return;
    }
    if (!numAmount || numAmount <= 0) {
      toast.error("Veuillez saisir un montant supérieur à 0 FCFA.");
      return;
    }

    try {
      setSubmittingPayment(true);
      const res = await recordAdminManualPayment({
        holder_name: paymentHolderName.trim(),
        holder_id: paymentHolderId || undefined,
        amount: numAmount,
        payment_method: paymentMethod,
        reference_receipt: paymentReceipt.trim() || undefined,
        notes: paymentNotes.trim() || undefined,
      });

      if (res.success) {
        toast.success(res.message || "Règlement enregistré avec succès.");
        setIsPaymentModalOpen(false);
        await loadAllData();
      } else {
        toast.error(res.error || "Erreur lors de l'enregistrement du paiement.");
      }
    } catch {
      toast.error("Erreur technique lors de l'enregistrement du paiement.");
    } finally {
      setSubmittingPayment(false);
    }
  };

  // Filtrage des détenteurs
  const filteredHolders = useMemo(() => {
    return holders.filter((h) => {
      const q = searchHolder.trim().toLowerCase();
      const matchesSearch =
        !q ||
        h.name.toLowerCase().includes(q) ||
        h.contact_name.toLowerCase().includes(q) ||
        h.city.toLowerCase().includes(q) ||
        h.phone.toLowerCase().includes(q) ||
        h.email.toLowerCase().includes(q);

      const matchesType = typeFilter === "all" || h.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [holders, searchHolder, typeFilter]);

  // Filtrage des transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const q = searchTx.trim().toLowerCase();
      const matchesSearch =
        !q ||
        tx.reference.toLowerCase().includes(q) ||
        tx.holder_name.toLowerCase().includes(q) ||
        tx.transaction_label.toLowerCase().includes(q) ||
        tx.notes.toLowerCase().includes(q) ||
        tx.recorded_by.toLowerCase().includes(q);

      const matchesMethod = methodFilter === "all" || tx.payment_method === methodFilter;
      return matchesSearch && matchesMethod;
    });
  }, [transactions, searchTx, methodFilter]);

  // Totaux consolidés pour le reporting
  const totalOutstandingToRecover = useMemo(() => {
    return holders.reduce((sum, h) => sum + (h.remaining_balance_xof || 0), 0);
  }, [holders]);

  const totalPhysicalCopiesHeld = useMemo(() => {
    return holders.reduce((sum, h) => sum + (h.total_copies || 0), 0);
  }, [holders]);

  if (loading || !overview) {
    return <PageLoader label="Supervision des stocks et détenteurs régionaux" />;
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* En-tête avec fil d'Ariane et actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2 text-xs text-foreground-muted mb-1">
            <Link href="/admin" className="hover:text-navy transition-colors">
              Administration
            </Link>
            <span>/</span>
            <span className="text-navy font-semibold">Stock Physique & Entrepôts</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-navy flex items-center gap-2.5">
            <Boxes className="w-6 h-6 text-gold shrink-0" />
            Supervision des Stocks Physiques Régionaux
          </h1>
          <p className="text-xs sm:text-sm text-foreground-muted mt-0.5">
            Suivi des détenteurs, valorisation du stock papier, historique des transactions et encaissements manuels en espèces.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Action Principale : Enregistrer un Paiement Manuel */}
          <button
            onClick={() => handleOpenPaymentModal()}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gold text-navy text-xs font-bold hover:bg-gold/90 transition-all shadow-xs cursor-pointer min-h-[44px]"
          >
            <Banknote className="w-4 h-4 text-navy" />
            <span>Enregistrer un Règlement</span>
          </button>

          <Link
            href="/admin/stock/movements"
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-navy text-white text-xs font-semibold hover:bg-navy/90 transition-colors shadow-xs min-h-[44px]"
          >
            <TrendingDown className="w-4 h-4 text-gold" />
            <span>Mouvements & Pertes</span>
          </Link>

          <Link
            href="/admin/stock/warehouses"
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground text-xs font-semibold hover:border-gold transition-colors min-h-[44px]"
          >
            <Building2 className="w-4 h-4 text-gold" />
            <span>Gérer les Entrepôts</span>
          </Link>
        </div>
      </div>

      {/* Cartes d'Indicateurs Consolidation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-background-secondary border border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground-muted">Stock Physique Total</span>
            <Boxes className="w-4 h-4 text-gold" />
          </div>
          <p className="text-2xl font-bold font-serif text-navy mt-2">
            {overview.totalPhysicalStock.toLocaleString("fr-FR")}
          </p>
          <p className="text-[11px] text-foreground-muted mt-1">
            {totalPhysicalCopiesHeld > 0
              ? `${totalPhysicalCopiesHeld.toLocaleString("fr-FR")} ex. répartis sur le réseau`
              : "Exemplaires papier en stock"}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-background-secondary border border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground-muted">Valeur Consolidée</span>
            <PackageCheck className="w-4 h-4 text-success" />
          </div>
          <p className="text-2xl font-bold font-mono text-navy mt-2">
            {overview.totalStockValueXof.toLocaleString("fr-FR")}{" "}
            <span className="text-xs font-sans text-gold font-bold">FCFA</span>
          </p>
          <p className="text-[11px] text-foreground-muted mt-1">Valorisation au prix public moyen</p>
        </div>

        <div className="p-4 rounded-2xl bg-background-secondary border border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground-muted">Reste à Recouvrer</span>
            <Wallet className="w-4 h-4 text-gold" />
          </div>
          <p className="text-2xl font-bold font-mono text-navy mt-2">
            {totalOutstandingToRecover.toLocaleString("fr-FR")}{" "}
            <span className="text-xs font-sans text-gold font-bold">FCFA</span>
          </p>
          <p className="text-[11px] text-foreground-muted mt-1">Encaissements et créances en attente</p>
        </div>

        <Link
          href="/admin/stock/movements"
          className="p-4 rounded-2xl bg-gold/10 border border-gold/30 hover:border-gold transition-all block group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-navy">Régularisations en Attente</span>
            <Clock className="w-4 h-4 text-gold" />
          </div>
          <p className="text-2xl font-bold font-serif text-navy mt-2">
            {overview.pendingLossAdjustments}
          </p>
          <p className="text-[11px] text-foreground-muted mt-1 group-hover:text-navy flex items-center gap-1 transition-colors">
            <span>Passations en perte à valider</span>
            <ArrowRight className="w-3 h-3 text-gold" />
          </p>
        </Link>
      </div>

      {/* Onglets de Navigation Principale */}
      <div className="flex items-center gap-2 border-b border-border overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab("holders")}
          className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer shrink-0 ${
            activeTab === "holders"
              ? "border-navy text-navy font-bold"
              : "border-transparent text-foreground-muted hover:text-navy"
          }`}
        >
          <Users className="w-4 h-4 text-gold" />
          <span>Détenteurs de Stock & Valorisation</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-navy/10 text-navy">
            {holders.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("transactions")}
          className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer shrink-0 ${
            activeTab === "transactions"
              ? "border-navy text-navy font-bold"
              : "border-transparent text-foreground-muted hover:text-navy"
          }`}
        >
          <ReceiptText className="w-4 h-4 text-gold" />
          <span>Historique des Transactions</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-navy/10 text-navy">
            {transactions.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("warehouses")}
          className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-all cursor-pointer shrink-0 ${
            activeTab === "warehouses"
              ? "border-navy text-navy font-bold"
              : "border-transparent text-foreground-muted hover:text-navy"
          }`}
        >
          <Building2 className="w-4 h-4 text-gold" />
          <span>Entrepôts & Plateformes Régionales</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-navy/10 text-navy">
            {overview.warehouses.length}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* ONGLET 1 : DÉTENTEURS DE STOCK & VALORISATION                             */}
      {/* ========================================================================= */}
      {activeTab === "holders" && (
        <div className="space-y-4">
          {/* Barre de Recherche et Filtres */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-foreground-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchHolder}
                onChange={(e) => setSearchHolder(e.target.value)}
                placeholder="Rechercher par détenteur, contact, ville ou téléphone..."
                className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-navy min-h-[40px]"
              />
              {searchHolder && (
                <button
                  onClick={() => setSearchHolder("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-navy"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Filter className="w-3.5 h-3.5 text-foreground-muted" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-navy min-h-[40px]"
              >
                <option value="all">Tous les profils</option>
                <option value="grossiste">Grossistes & Librairies</option>
                <option value="auteur_partenaire">Auteurs Dépositaires</option>
                <option value="universite">Universités & Campus</option>
                <option value="client_depot">Clients Dépositaires</option>
                <option value="entrepot_hub">Hubs Logistiques</option>
              </select>
            </div>
          </div>

          {/* Table / Liste des Détenteurs */}
          {filteredHolders.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-background-secondary border border-border space-y-3">
              <Users className="w-8 h-8 text-foreground-muted mx-auto" />
              <p className="text-sm font-semibold text-foreground">Aucun détenteur de stock trouvé</p>
              <p className="text-xs text-foreground-muted">
                Aucun partenaire ne correspond aux critères de recherche actuels.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-background-secondary overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border bg-background/50 text-[11px] font-semibold text-foreground-muted">
                      <th className="py-3 px-4">Détenteur & Profil</th>
                      <th className="py-3 px-4">Coordonnées</th>
                      <th className="py-3 px-4 text-center">Exemplaires Détenus</th>
                      <th className="py-3 px-4 text-right">Valeur du Stock</th>
                      <th className="py-3 px-4 text-right">Déjà Réglé</th>
                      <th className="py-3 px-4 text-right">Reste à Recouvrer</th>
                      <th className="py-3 px-4 text-center">Statut</th>
                      <th className="py-3 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredHolders.map((holder) => {
                      const isHub = holder.type === "entrepot_hub";
                      return (
                        <tr
                          key={holder.id}
                          className="hover:bg-background/80 transition-colors"
                        >
                          {/* Détenteur */}
                          <td className="py-3.5 px-4">
                            <div className="space-y-0.5">
                              <p className="font-bold font-serif text-navy text-xs">
                                {holder.name}
                              </p>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-navy/10 text-navy">
                                  {holder.type_label}
                                </span>
                                {holder.city && (
                                  <span className="text-[10px] text-foreground-muted flex items-center gap-0.5">
                                    <MapPin className="w-3 h-3 text-gold" />
                                    {holder.city}, {holder.country}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Coordonnées */}
                          <td className="py-3.5 px-4">
                            <div className="space-y-0.5 text-foreground-muted text-[11px]">
                              {holder.contact_name && (
                                <p className="text-foreground font-medium flex items-center gap-1">
                                  <User className="w-3 h-3 text-gold" />
                                  {holder.contact_name}
                                </p>
                              )}
                              {holder.phone && (
                                <p className="flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-foreground-muted" />
                                  {holder.phone}
                                </p>
                              )}
                              {holder.email && (
                                <p className="flex items-center gap-1">
                                  <Mail className="w-3 h-3 text-foreground-muted" />
                                  {holder.email}
                                </p>
                              )}
                            </div>
                          </td>

                          {/* Exemplaires Détenus */}
                          <td className="py-3.5 px-4 text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-background border border-border font-mono font-bold text-navy">
                              <BookOpen className="w-3.5 h-3.5 text-gold" />
                              {holder.total_copies.toLocaleString("fr-FR")} ex.
                            </span>
                          </td>

                          {/* Valeur du Stock */}
                          <td className="py-3.5 px-4 text-right">
                            <p className="font-mono font-bold text-navy">
                              {holder.total_value_xof.toLocaleString("fr-FR")}
                            </p>
                            <span className="text-[10px] text-gold font-sans font-semibold">FCFA</span>
                          </td>

                          {/* Déjà Réglé */}
                          <td className="py-3.5 px-4 text-right">
                            <p className="font-mono text-success font-semibold">
                              {holder.total_paid_xof.toLocaleString("fr-FR")}
                            </p>
                            <span className="text-[10px] text-foreground-muted">FCFA</span>
                          </td>

                          {/* Reste à Recouvrer */}
                          <td className="py-3.5 px-4 text-right">
                            <p
                              className={`font-mono font-bold ${
                                holder.remaining_balance_xof > 0
                                  ? "text-error"
                                  : "text-foreground-muted"
                              }`}
                            >
                              {holder.remaining_balance_xof.toLocaleString("fr-FR")}
                            </p>
                            <span className="text-[10px] text-foreground-muted">FCFA</span>
                          </td>

                          {/* Statut Règlement */}
                          <td className="py-3.5 px-4 text-center">
                            {isHub ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-navy/10 text-navy border border-navy/20">
                                <Building2 className="w-3 h-3" />
                                Hub Actif
                              </span>
                            ) : holder.payment_status === "paid" ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-success/10 text-success border border-success/20">
                                <CheckCircle2 className="w-3 h-3" />
                                Soldé
                              </span>
                            ) : holder.payment_status === "partial" ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-warning/10 text-warning border border-warning/20">
                                <Clock className="w-3 h-3" />
                                Partiel
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-gold/15 text-gold border border-gold/30">
                                <AlertTriangle className="w-3 h-3" />
                                En attente
                              </span>
                            )}
                          </td>

                          {/* Action */}
                          <td className="py-3.5 px-4 text-center">
                            {!isHub && holder.remaining_balance_xof > 0 ? (
                              <button
                                onClick={() => handleOpenPaymentModal(holder)}
                                className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-navy text-white text-[11px] font-semibold hover:bg-navy/90 transition-colors cursor-pointer min-h-[34px]"
                              >
                                <Banknote className="w-3.5 h-3.5 text-gold" />
                                <span>Encaisser</span>
                              </button>
                            ) : !isHub ? (
                              <span className="text-[10px] text-foreground-muted italic">Rien à recouvrer</span>
                            ) : null}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ONGLET 2 : HISTORIQUE DES TRANSACTIONS & ENCAISSEMENTS                     */}
      {/* ========================================================================= */}
      {activeTab === "transactions" && (
        <div className="space-y-4">
          {/* Barre de Recherche et Filtres */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-foreground-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTx}
                onChange={(e) => setSearchTx(e.target.value)}
                placeholder="Rechercher par référence reçu, détenteur, opérateur..."
                className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-navy min-h-[40px]"
              />
              {searchTx && (
                <button
                  onClick={() => setSearchTx("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-navy"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Filter className="w-3.5 h-3.5 text-foreground-muted" />
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-navy min-h-[40px]"
              >
                <option value="all">Tous les règlements</option>
                <option value="especes">Espèces (Caisse)</option>
                <option value="virement">Virement Bancaire</option>
                <option value="cheque">Chèque</option>
                <option value="mobile_money">Mobile Money</option>
              </select>
            </div>
          </div>

          {/* Table des Transactions */}
          {filteredTransactions.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-background-secondary border border-border space-y-3">
              <ReceiptText className="w-8 h-8 text-foreground-muted mx-auto" />
              <p className="text-sm font-semibold text-foreground">Aucune transaction enregistrée</p>
              <p className="text-xs text-foreground-muted">
                Les règlements d'espèces et flux bancaires apparaîtront ici dès leur enregistrement.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-background-secondary overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-border bg-background/50 text-[11px] font-semibold text-foreground-muted">
                      <th className="py-3 px-4">Réf. Transaction / Reçu</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Dépositaire & Tiers</th>
                      <th className="py-3 px-4">Opération</th>
                      <th className="py-3 px-4">Mode de Règlement</th>
                      <th className="py-3 px-4 text-right">Montant Encaissé</th>
                      <th className="py-3 px-4">Enregistré par</th>
                      <th className="py-3 px-4">Observations</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredTransactions.map((tx) => {
                      const isCash = tx.payment_method === "especes";
                      return (
                        <tr
                          key={tx.id}
                          className="hover:bg-background/80 transition-colors"
                        >
                          {/* Référence */}
                          <td className="py-3 px-4">
                            <span className="font-mono font-bold text-navy px-2 py-0.5 rounded bg-navy/10">
                              {tx.reference}
                            </span>
                          </td>

                          {/* Date */}
                          <td className="py-3 px-4 text-foreground-muted text-[11px]">
                            {tx.date ? new Date(tx.date).toLocaleDateString("fr-FR", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }) : "—"}
                          </td>

                          {/* Dépositaire */}
                          <td className="py-3 px-4">
                            <p className="font-bold text-navy text-xs">{tx.holder_name}</p>
                            <span className="text-[10px] text-foreground-muted">
                              {tx.holder_type}
                            </span>
                          </td>

                          {/* Opération */}
                          <td className="py-3 px-4">
                            <span className="text-foreground font-medium">
                              {tx.transaction_label}
                            </span>
                          </td>

                          {/* Mode de Règlement */}
                          <td className="py-3 px-4">
                            {isCash ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gold/15 text-gold border border-gold/30">
                                <Banknote className="w-3 h-3" />
                                Espèces (Caisse)
                              </span>
                            ) : tx.payment_method === "virement" ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-navy/10 text-navy border border-navy/20">
                                <Building2 className="w-3 h-3" />
                                Virement
                              </span>
                            ) : tx.payment_method === "cheque" ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-background text-foreground border border-border">
                                <FileText className="w-3 h-3" />
                                Chèque
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-success/10 text-success border border-success/20">
                                <Smartphone className="w-3 h-3" />
                                Mobile Money
                              </span>
                            )}
                          </td>

                          {/* Montant */}
                          <td className="py-3 px-4 text-right">
                            <p className="font-mono font-bold text-navy text-sm">
                              {tx.amount.toLocaleString("fr-FR")}
                            </p>
                            <span className="text-[10px] text-gold font-sans font-semibold">FCFA</span>
                          </td>

                          {/* Enregistré par */}
                          <td className="py-3 px-4 text-foreground-muted text-[11px]">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3 text-gold" />
                              {tx.recorded_by}
                            </span>
                          </td>

                          {/* Notes */}
                          <td className="py-3 px-4 text-foreground-muted text-[11px] max-w-xs truncate">
                            {tx.notes || "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ONGLET 3 : ENTREPÔTS & PLATEFORMES DE DISTRIBUTION                        */}
      {/* ========================================================================= */}
      {activeTab === "warehouses" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Building2 className="w-4 h-4 text-gold" />
              Entrepôts & Plateformes de Distribution
            </h2>

            <Link
              href="/admin/stock/warehouses"
              className="text-xs text-navy font-semibold hover:text-gold transition-colors flex items-center gap-1"
            >
              <span>Voir tous les hubs</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {overview.warehouses.map((wh) => (
              <div
                key={wh.id}
                className="p-5 rounded-2xl bg-background-secondary border border-border space-y-4 hover:border-gold/50 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-navy/10 text-navy">
                      {wh.code}
                    </span>
                    <h3 className="text-sm font-bold text-foreground font-serif mt-1">
                      {wh.name}
                    </h3>
                  </div>
                  <span className="text-xs text-foreground-muted flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-gold shrink-0" />
                    {wh.city}, {wh.country}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60 text-xs">
                  <div className="p-2.5 rounded-xl bg-background border border-border">
                    <span className="text-[10px] text-foreground-muted">Exemplaires</span>
                    <p className="font-bold text-navy font-mono mt-0.5">
                      {wh.total_items.toLocaleString("fr-FR")}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-background border border-border">
                    <span className="text-[10px] text-foreground-muted">Alertes Rupture</span>
                    <p
                      className={`font-bold font-mono mt-0.5 ${
                        wh.critical_alerts > 0 ? "text-error" : "text-success"
                      }`}
                    >
                      {wh.critical_alerts} critique{wh.critical_alerts > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-foreground-muted pt-1">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3 text-gold" />
                    {wh.manager_name}
                  </span>
                  <span className="text-success font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Opérationnel
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALE : ENREGISTRER UN PAIEMENT MANUEL (ESPÈCES / CAISSE)                */}
      {/* ========================================================================= */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-background border border-border rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 my-8">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Banknote className="w-5 h-5 text-gold" />
                <h3 className="font-serif font-bold text-navy text-base">
                  Enregistrer un Règlement Manuel
                </h3>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="p-1.5 rounded-lg text-foreground-muted hover:text-navy cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-foreground-muted">
              Enregistrez un encaissement direct en caisse (espèces, virement, chèque) pour mettre à jour la valeur et le statut du dépositaire.
            </p>

            <form onSubmit={handleSubmitPayment} className="space-y-4 text-xs">
              {/* Détenteur */}
              <div>
                <label className="block font-bold text-navy mb-1">
                  Détenteur de Stock / Dépositaire *
                </label>
                <input
                  type="text"
                  value={paymentHolderName}
                  onChange={(e) => setPaymentHolderName(e.target.value)}
                  placeholder="Ex: Librairie Notre Dame / Auteur Dépositaire"
                  list="holders-datalist"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-navy min-h-[44px]"
                />
                <datalist id="holders-datalist">
                  {holders
                    .filter((h) => h.type !== "entrepot_hub")
                    .map((h) => (
                      <option key={h.id} value={h.name}>
                        {h.name} — {h.type_label} (Solde : {h.remaining_balance_xof.toLocaleString("fr-FR")} FCFA)
                      </option>
                    ))}
                </datalist>
              </div>

              {/* Montant et Mode de Règlement */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-navy mb-1">
                    Montant Encaissé (FCFA) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="Ex: 50000"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground font-mono text-xs focus:ring-2 focus:ring-navy min-h-[44px]"
                  />
                  {paymentAmount && !isNaN(Number(paymentAmount)) && (
                    <p className="text-[10px] text-gold font-mono font-semibold mt-1">
                      {Number(paymentAmount).toLocaleString("fr-FR")} FCFA
                    </p>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-navy mb-1">
                    Mode de Règlement *
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-navy min-h-[44px]"
                  >
                    <option value="especes">Espèces (Caisse / Guichet)</option>
                    <option value="virement">Virement Bancaire</option>
                    <option value="cheque">Chèque Certifié</option>
                    <option value="mobile_money">Mobile Money (MTN / Moov / Wave)</option>
                  </select>
                </div>
              </div>

              {/* Référence et Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-navy mb-1">
                    Référence Reçu / Quittance
                  </label>
                  <input
                    type="text"
                    value={paymentReceipt}
                    onChange={(e) => setPaymentReceipt(e.target.value)}
                    placeholder="REC-ESP-..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground font-mono text-xs focus:ring-2 focus:ring-navy min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-navy mb-1">
                    Date du Règlement
                  </label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-navy min-h-[44px]"
                  />
                </div>
              </div>

              {/* Notes et Observations */}
              <div>
                <label className="block font-bold text-navy mb-1">
                  Observations / Remarques de Caisse
                </label>
                <textarea
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Ex: Paiement en espèces reçu en mains propres à l'administration..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:ring-2 focus:ring-navy resize-none"
                />
              </div>

              {/* Actions de validation */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  disabled={submittingPayment}
                  className="px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs font-semibold hover:border-gold transition-colors cursor-pointer min-h-[44px]"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submittingPayment}
                  className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-gold text-navy text-xs font-bold hover:bg-gold/90 transition-all shadow-xs cursor-pointer min-h-[44px]"
                >
                  {submittingPayment ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-navy" />
                      <span>Enregistrement...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-navy" />
                      <span>Confirmer le Règlement</span>
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
