"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Filter,
  FileText,
  Search,
  Building2,
  User,
  RefreshCw,
  TrendingUp,
  BookOpen,
  Coins,
  RotateCcw,
  CheckCircle2,
  BookMarked,
  ChevronLeft,
  ChevronRight,
  Layers,
} from "lucide-react";
import { toast } from "sonner";
import { DatePicker } from "@/components/ui/date-picker";
import { Combobox, ComboboxOption } from "@/components/ui/combobox";
import { getAdminConsolidatedSales } from "@/lib/services/admin";
import { generateOfficialPdf, generateCsvExport } from "@/lib/services/export-service";
import type {
  AdminSaleOrder,
  AdminSalesConsolidatedResponse,
} from "@/lib/types/admin-finance";

// Formateur de devises FCFA
function formatFcfa(amount: number): string {
  return Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

type PeriodPreset = "current_month" | "last_30_days" | "last_90_days" | "current_year" | "all" | "custom";

export default function AdminReportsPage() {
  // États de filtrage
  const [selectedPreset, setSelectedPreset] = useState<PeriodPreset>("current_month");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [authorQuery, setAuthorQuery] = useState<string>("");
  const [selectedInstitution, setSelectedInstitution] = useState<string>("all");
  const [selectedPublisher, setSelectedPublisher] = useState<string>("all");
  const [selectedChannel, setSelectedChannel] = useState<string>("all");

  // Données & état de chargement
  const [salesData, setSalesData] = useState<AdminSalesConsolidatedResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  // Calcul automatique des dates de presets
  const applyPresetDates = useCallback((preset: PeriodPreset) => {
    setSelectedPreset(preset);
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    if (preset === "current_month") {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(firstDay.toISOString().slice(0, 10));
      setEndDate(todayStr);
    } else if (preset === "last_30_days") {
      const past = new Date(now);
      past.setDate(past.getDate() - 30);
      setStartDate(past.toISOString().slice(0, 10));
      setEndDate(todayStr);
    } else if (preset === "last_90_days") {
      const past = new Date(now);
      past.setDate(past.getDate() - 90);
      setStartDate(past.toISOString().slice(0, 10));
      setEndDate(todayStr);
    } else if (preset === "current_year") {
      const firstDayOfYear = new Date(now.getFullYear(), 0, 1);
      setStartDate(firstDayOfYear.toISOString().slice(0, 10));
      setEndDate(todayStr);
    } else if (preset === "all") {
      setStartDate("");
      setEndDate("");
    }
  }, []);

  // Initialisation au chargement avec le mois en cours
  useEffect(() => {
    applyPresetDates("current_month");
  }, [applyPresetDates]);

  // Chargement des données réelles
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAdminConsolidatedSales({
        channel: selectedChannel !== "all" ? selectedChannel : undefined,
        q: searchQuery.trim() || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        author: authorQuery.trim() || undefined,
        institution: selectedInstitution !== "all" ? selectedInstitution : undefined,
        publisher: selectedPublisher !== "all" ? selectedPublisher : undefined,
      });
      setSalesData(data);
      setCurrentPage(1);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur de chargement des ventes.";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [selectedChannel, searchQuery, startDate, endDate, authorQuery, selectedInstitution, selectedPublisher]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Réinitialisation de l'ensemble des filtres
  const handleResetFilters = () => {
    setSearchQuery("");
    setAuthorQuery("");
    setSelectedInstitution("all");
    setSelectedPublisher("all");
    setSelectedChannel("all");
    applyPresetDates("current_month");
  };

  const orders: AdminSaleOrder[] = useMemo(() => {
    return salesData?.orders || [];
  }, [salesData]);

  // Calcul des métriques KPI en temps réel
  const metrics = useMemo(() => {
    const totalRev = salesData?.total_revenue_consolidated ?? 0;
    const totalCount = salesData?.total_orders_count ?? 0;
    const totalVolume = orders.reduce((acc, o) => {
      return acc + (o.items?.reduce((sub, it) => sub + (it.quantity || 1), 0) || 0);
    }, 0);
    // Estimation indicative du pool de redevances (base contractuelle moyenne ~30%)
    const estimatedRoyalties = totalRev * 0.3;

    return {
      totalRev,
      totalCount,
      totalVolume,
      estimatedRoyalties,
    };
  }, [salesData, orders]);

  // Listes disponibles pour les menus déroulants
  const institutions = useMemo(() => salesData?.available_institutions || [], [salesData]);
  const publishers = useMemo(() => salesData?.available_publishers || [], [salesData]);

  // Options structurées pour les composants Combobox
  const institutionOptions: ComboboxOption[] = useMemo(() => {
    const list: ComboboxOption[] = [
      { value: "all", label: "Toutes les universités partenaires", icon: Building2 },
    ];
    institutions.forEach((inst) => {
      list.push({ value: inst, label: inst, icon: Building2 });
    });
    return list;
  }, [institutions]);

  const publisherOptions: ComboboxOption[] = useMemo(() => {
    const list: ComboboxOption[] = [
      { value: "all", label: "Tous les éditeurs", icon: BookMarked },
    ];
    publishers.forEach((pub) => {
      list.push({ value: pub, label: pub, icon: BookMarked });
    });
    return list;
  }, [publishers]);

  const channelOptions: ComboboxOption[] = useMemo(() => [
    { value: "all", label: "Tous les canaux de vente", icon: Layers },
    { value: "b2c_individual", label: "Vente Unitaire Lecteur (B2C)", icon: User },
    { value: "b2b_university", label: "Commande Campus B2B (Universités)", icon: Building2 },
    { value: "b2b_wholesale", label: "Commande Grossiste B2B", icon: Layers },
  ], []);

  // Options d'auteurs issues des données réelles
  const authorOptions: ComboboxOption[] = useMemo(() => {
    const set = new Set<string>();
    orders.forEach((o) => {
      o.items?.forEach((it) => {
        it.author_names?.forEach((a) => {
          if (a && a.trim()) set.add(a.trim());
        });
        if (it.author_display && it.author_display.trim()) {
          set.add(it.author_display.trim());
        }
      });
    });
    const list: ComboboxOption[] = [
      { value: "", label: "Tous les auteurs", icon: User },
    ];
    Array.from(set)
      .sort()
      .forEach((a) => {
        list.push({ value: a, label: a, icon: User });
      });
    return list;
  }, [orders]);

  // Pagination sur la prévisualisation
  const totalPages = Math.ceil(orders.length / pageSize) || 1;
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return orders.slice(start, start + pageSize);
  }, [orders, currentPage]);

  // Libellé de période pour les documents
  const getPeriodSummary = () => {
    if (startDate && endDate) {
      return `Du ${new Date(startDate).toLocaleDateString("fr-FR")} au ${new Date(endDate).toLocaleDateString("fr-FR")}`;
    }
    if (startDate) {
      return `À partir du ${new Date(startDate).toLocaleDateString("fr-FR")}`;
    }
    if (endDate) {
      return `Jusqu'au ${new Date(endDate).toLocaleDateString("fr-FR")}`;
    }
    return "Tout l'historique d'activité";
  };

  // 1. Déclenchement Export PDF Officiel SYSCOHADA
  const handleExportPdf = async () => {
    if (orders.length === 0) {
      toast.error("Aucune transaction ne correspond à vos filtres actuels pour l'export.");
      return;
    }
    setIsExporting(true);
    try {
      await generateOfficialPdf({
        docType: "RAPPORT_FINANCIER",
        docNumber: `REP-${Date.now().toString().slice(-6)}`,
        date: new Date().toLocaleDateString("fr-FR"),
        period: getPeriodSummary(),
        recipient: {
          name: "Direction Générale & Contrôle de Gestion",
          roleOrTitle: "Administration Centrale LAHAThèque",
          emailOrPhone: "direction@lahatheque.bj",
          addressOrCampus: "Cotonou, République du Bénin",
        },
        summaryCards: [
          { label: "Chiffre d'Affaires", value: `${formatFcfa(metrics.totalRev)} FCFA` },
          { label: "Transactions", value: `${metrics.totalCount} commandes` },
          { label: "Volume Exemplaires", value: `${metrics.totalVolume} ex.` },
          { label: "Redevances Estimées", value: `${formatFcfa(metrics.estimatedRoyalties)} FCFA` },
        ],
        tableHeaders: ["Réf.", "Date", "Canal", "Acheteur", "Ouvrages & Auteurs", "Quantité", "Montant Net"],
        tableRows: orders.map((o) => [
          o.order_reference,
          o.created_at ? new Date(o.created_at).toLocaleDateString("fr-FR") : "-",
          o.channel_label,
          o.buyer_name,
          o.items
            .map((it) => `${it.book_title}${it.author_display ? ` (${it.author_display})` : ""}`)
            .join("; "),
          `${o.items.reduce((acc, it) => acc + (it.quantity || 1), 0)} ex.`,
          `${formatFcfa(o.net_amount_paid)} FCFA`,
        ]),
        totalAmount: `${formatFcfa(metrics.totalRev)} FCFA`,
        totalNotes: `Rapport généré conformément aux filtres appliqués (${getPeriodSummary()}). Traçabilité intégrale et conformité aux normes comptables SYSCOHADA.`,
        filename: `rapport_ventes_lahatheque_${new Date().toISOString().slice(0, 10)}.pdf`,
      });
      toast.success("Rapport PDF officiel généré avec succès !");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur lors de la génération du PDF.";
      toast.error(msg);
    } finally {
      setIsExporting(false);
    }
  };

  // 2. Déclenchement Export CSV / Excel UTF-8 BOM
  const handleExportCsvOrExcel = (type: "csv" | "excel") => {
    if (orders.length === 0) {
      toast.error("Aucune transaction ne correspond à vos filtres actuels pour l'export.");
      return;
    }
    setIsExporting(true);
    try {
      const exportRows = orders.map((o) => ({
        Reference_Commande: o.order_reference,
        Date_Paiement: o.created_at ? new Date(o.created_at).toLocaleString("fr-FR") : "",
        Canal_Distribution: o.channel_label,
        Nom_Acheteur: o.buyer_name,
        Email_Acheteur: o.buyer_email,
        Profil_Acheteur: o.buyer_role,
        Titres_Ouvrages: o.items.map((it) => it.book_title).join(" | "),
        Auteurs: o.items.map((it) => it.author_display || "").filter(Boolean).join(" | "),
        ISBN: o.items.map((it) => it.isbn || "").filter(Boolean).join(" | "),
        Maison_Edition: o.items.map((it) => it.publisher_name || "").filter(Boolean).join(" | "),
        Universite_Partenaire: o.items.map((it) => it.institution_name || "").filter(Boolean).join(" | "),
        Nombre_Lignes: o.items.length,
        Quantite_Totale: o.items.reduce((acc, it) => acc + (it.quantity || 1), 0),
        Mode_Reglement: o.payment_method,
        Statut_Paiement: o.payment_status === "paid" ? "Regle" : o.payment_status,
        Montant_Brut_FCFA: o.gross_amount,
        Montant_Net_Regle_FCFA: o.net_amount_paid,
      }));

      const filename = `export_ventes_lahatheque_${new Date().toISOString().slice(0, 10)}`;
      generateCsvExport(exportRows, filename);
      toast.success(`Export ${type === "excel" ? "Excel" : "CSV"} généré avec succès (format UTF-8 BOM) !`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur lors de l'exportation des données.";
      toast.error(msg);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* ── En-tête de la page ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-navy">
            Rapports & Exports Analytiques
          </h1>
          <p className="text-xs sm:text-sm text-foreground-muted mt-0.5">
            Filtrage avancé, calcul dynamique des états financiers et export certifié SYSCOHADA.
          </p>
        </div>

        {/* Bouton rafraîchir */}
        <button
          onClick={fetchData}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-background-secondary border border-border text-xs font-semibold text-foreground hover:bg-background hover:border-gold/50 transition-colors disabled:opacity-50 cursor-pointer min-h-[44px]"
          title="Actualiser les données"
        >
          <RefreshCw className={`w-4 h-4 text-gold ${isLoading ? "animate-spin" : ""}`} />
          <span>Actualiser</span>
        </button>
      </div>

      {/* ── Section Configuration & Filtres ── */}
      <div className="p-4 sm:p-6 rounded-2xl bg-background-secondary border border-border space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Filter className="w-4 h-4 text-gold" />
            Paramètres du Rapport & Filtres
          </h2>

          <button
            onClick={handleResetFilters}
            className="text-xs text-foreground-muted hover:text-navy flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Réinitialiser tous les critères de filtrage"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Réinitialiser</span>
          </button>
        </div>

        {/* 1. Sélecteur de période rapide (Presets) */}
        <div>
          <label className="text-xs font-semibold text-foreground-muted block mb-2">
            Période d&apos;analyse :
          </label>
          <div className="flex flex-wrap gap-2">
            {[
              { id: "current_month" as PeriodPreset, label: "Ce mois" },
              { id: "last_30_days" as PeriodPreset, label: "30 derniers jours" },
              { id: "last_90_days" as PeriodPreset, label: "90 jours" },
              { id: "current_year" as PeriodPreset, label: "Année en cours" },
              { id: "all" as PeriodPreset, label: "Tout l'historique" },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => applyPresetDates(p.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer min-h-[44px] flex items-center ${
                  selectedPreset === p.id
                    ? "bg-navy text-white shadow-sm font-semibold"
                    : "bg-background border border-border text-foreground hover:border-gold/40 hover:bg-background-secondary"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Composants Calendrier complets (Date de Début & Date de Fin) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
          <div>
            <label className="text-xs font-medium text-foreground block mb-1.5">
              Date de début
            </label>
            <DatePicker
              id="report-start-date"
              value={startDate}
              onChange={(val) => {
                setStartDate(val);
                setSelectedPreset("custom");
              }}
              placeholder="Sélectionner une date..."
              maxDate={endDate || undefined}
              className="w-full"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-foreground block mb-1.5">
              Date de fin
            </label>
            <DatePicker
              id="report-end-date"
              value={endDate}
              onChange={(val) => {
                setEndDate(val);
                setSelectedPreset("custom");
              }}
              placeholder="Sélectionner une date..."
              minDate={startDate || undefined}
              className="w-full"
            />
          </div>

          {/* Recherche Ouvrage / Titre / ISBN */}
          <div>
            <label className="text-xs font-medium text-foreground block mb-1.5">
              Ouvrage / Titre / ISBN
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ex: Droit civil, 978-2..."
                className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl bg-background border border-border text-foreground placeholder:text-foreground-muted focus:border-gold focus:outline-none min-h-[44px]"
              />
              <Search className="w-4 h-4 text-foreground-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Recherche par Auteur via Combobox */}
          <div>
            <label className="text-xs font-medium text-foreground block mb-1.5">
              Auteur
            </label>
            <Combobox
              id="report-author-combobox"
              value={authorQuery}
              onChange={setAuthorQuery}
              options={authorOptions}
              placeholder="Tous les auteurs"
              searchPlaceholder="Rechercher un auteur..."
              emptyText="Aucun auteur trouvé."
            />
          </div>
        </div>

        {/* 3. Filtres Entités (Université, Éditeur tiers, Canal de vente) via Combobox */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          {/* Université / Institution */}
          <div>
            <label className="text-xs font-medium text-foreground block mb-1.5">
              Université / Établissement
            </label>
            <Combobox
              id="report-institution-combobox"
              value={selectedInstitution}
              onChange={setSelectedInstitution}
              options={institutionOptions}
              placeholder="Toutes les universités partenaires"
              searchPlaceholder="Rechercher une université..."
              emptyText="Aucune université trouvée."
            />
          </div>

          {/* Éditeur tiers */}
          <div>
            <label className="text-xs font-medium text-foreground block mb-1.5">
              Maison d&apos;Édition / Éditeur tiers
            </label>
            <Combobox
              id="report-publisher-combobox"
              value={selectedPublisher}
              onChange={setSelectedPublisher}
              options={publisherOptions}
              placeholder="Tous les éditeurs"
              searchPlaceholder="Rechercher un éditeur..."
              emptyText="Aucun éditeur trouvé."
            />
          </div>

          {/* Canal de vente */}
          <div>
            <label className="text-xs font-medium text-foreground block mb-1.5">
              Canal de Distribution
            </label>
            <Combobox
              id="report-channel-combobox"
              value={selectedChannel}
              onChange={setSelectedChannel}
              options={channelOptions}
              placeholder="Tous les canaux de vente"
              searchPlaceholder="Filtrer un canal..."
              emptyText="Aucun canal trouvé."
            />
          </div>
        </div>

        {/* 4. Barre d'Actions d'Export */}
        <div className="pt-4 border-t border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-xs text-foreground-muted flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-gold" />
            <span>
              {isLoading
                ? "Synchronisation..."
                : `${orders.length} transaction${orders.length > 1 ? "s" : ""} prête${orders.length > 1 ? "s" : ""} pour l'export`}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Export CSV */}
            <button
              onClick={() => handleExportCsvOrExcel("csv")}
              disabled={isExporting || isLoading || orders.length === 0}
              className="px-4 py-2 rounded-xl bg-background border border-border text-foreground hover:bg-background-secondary text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-40 cursor-pointer min-h-[44px]"
              title="Exporter les données brutes en CSV"
            >
              <Download className="w-4 h-4 text-gold" />
              <span>Exporter en CSV</span>
            </button>

            {/* Export Excel UTF-8 BOM */}
            <button
              onClick={() => handleExportCsvOrExcel("excel")}
              disabled={isExporting || isLoading || orders.length === 0}
              className="px-4 py-2 rounded-xl bg-background border border-border text-foreground hover:bg-background-secondary text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-40 cursor-pointer min-h-[44px]"
              title="Exporter pour Microsoft Excel (UTF-8 BOM)"
            >
              <FileSpreadsheet className="w-4 h-4 text-gold" />
              <span>Exporter en Excel</span>
            </button>

            {/* Export PDF Officiel */}
            <button
              onClick={handleExportPdf}
              disabled={isExporting || isLoading || orders.length === 0}
              className="px-4 py-2 rounded-xl bg-navy text-white hover:bg-navy-hover text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors disabled:opacity-40 cursor-pointer min-h-[44px]"
              title="Télécharger le rapport certifié SYSCOHADA au format PDF"
            >
              <FileText className="w-4 h-4 text-gold" />
              <span>{isExporting ? "Génération..." : "Exporter en PDF Officiel"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Cartes Récapitulatives KPIs ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CA Consolidé */}
        <div className="p-4 rounded-2xl bg-background-secondary border border-border space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-foreground-muted">Chiffre d&apos;Affaires Consolidé</span>
            <div className="p-2 rounded-xl bg-gold/10 text-gold">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-bold font-serif text-navy">
            {isLoading ? "---" : `${formatFcfa(metrics.totalRev)} FCFA`}
          </div>
          <div className="text-[11px] text-foreground-muted">Montant net réglé et encaissé</div>
        </div>

        {/* Transactions / Commandes */}
        <div className="p-4 rounded-2xl bg-background-secondary border border-border space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-foreground-muted">Transactions / Ventes</span>
            <div className="p-2 rounded-xl bg-gold/10 text-gold">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-bold font-serif text-navy">
            {isLoading ? "---" : `${metrics.totalCount} commande${metrics.totalCount > 1 ? "s" : ""}`}
          </div>
          <div className="text-[11px] text-foreground-muted">Activité globale sur la sélection</div>
        </div>

        {/* Volume Exemplaires */}
        <div className="p-4 rounded-2xl bg-background-secondary border border-border space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-foreground-muted">Volume d&apos;Ouvrages</span>
            <div className="p-2 rounded-xl bg-gold/10 text-gold">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-bold font-serif text-navy">
            {isLoading ? "---" : `${metrics.totalVolume} exemplaire${metrics.totalVolume > 1 ? "s" : ""}`}
          </div>
          <div className="text-[11px] text-foreground-muted">Unités physiques et licences</div>
        </div>

        {/* Redevances Estimées */}
        <div className="p-4 rounded-2xl bg-background-secondary border border-border space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-foreground-muted">Redevances Estimées</span>
            <div className="p-2 rounded-xl bg-gold/10 text-gold">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-bold font-serif text-navy">
            {isLoading ? "---" : `${formatFcfa(metrics.estimatedRoyalties)} FCFA`}
          </div>
          <div className="text-[11px] text-foreground-muted">Pool contractuel prévisionnel (~30%)</div>
        </div>
      </div>

      {/* ── Table de Prévisualisation Interactive ── */}
      <div className="rounded-2xl bg-background-secondary border border-border overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-foreground">
              Aperçu des Données Filtrées
            </h3>
            <p className="text-xs text-foreground-muted mt-0.5">
              Prévisualisation des transactions exactes avant téléchargement du rapport.
            </p>
          </div>

          <div className="text-xs text-foreground-muted">
            Page {currentPage} sur {totalPages}
          </div>
        </div>

        {/* État de chargement */}
        {isLoading ? (
          <div className="p-12 text-center space-y-3">
            <RefreshCw className="w-6 h-6 text-gold animate-spin mx-auto" />
            <p className="text-xs text-foreground-muted">Extraction et consolidation des ventes en cours...</p>
          </div>
        ) : orders.length === 0 ? (
          /* État vide */
          <div className="p-12 text-center space-y-3">
            <BookMarked className="w-8 h-8 text-foreground-muted mx-auto" />
            <p className="text-sm font-semibold text-foreground">Aucune transaction trouvée</p>
            <p className="text-xs text-foreground-muted max-w-sm mx-auto">
              Aucun résultat ne correspond aux filtres de date, titre, auteur ou institution sélectionnés.
            </p>
            <button
              onClick={handleResetFilters}
              className="mt-2 px-4 py-2 rounded-xl bg-background border border-border text-xs font-semibold text-navy hover:bg-background-secondary transition-colors cursor-pointer min-h-[44px]"
            >
              Effacer les filtres
            </button>
          </div>
        ) : (
          /* Tableau des transactions */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-background text-foreground-muted font-medium border-b border-border">
                <tr>
                  <th className="py-3 px-4">Date & Réf.</th>
                  <th className="py-3 px-4">Canal</th>
                  <th className="py-3 px-4">Acheteur</th>
                  <th className="py-3 px-4">Ouvrages & Auteurs</th>
                  <th className="py-3 px-4 text-center">Quantité</th>
                  <th className="py-3 px-4 text-right">Montant Réglé</th>
                  <th className="py-3 px-4 text-center">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-background/60 transition-colors">
                    {/* Date & Réf */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-navy">{o.order_reference}</div>
                      <div className="text-[11px] text-foreground-muted">
                        {o.created_at ? new Date(o.created_at).toLocaleDateString("fr-FR") : "-"}
                      </div>
                    </td>

                    {/* Canal */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-navy/10 text-navy">
                        {o.channel === "b2c_individual" && <User className="w-3 h-3 text-gold" />}
                        {o.channel === "b2b_university" && <Building2 className="w-3 h-3 text-gold" />}
                        {o.channel === "b2b_wholesale" && <Layers className="w-3 h-3 text-gold" />}
                        <span>{o.channel_label}</span>
                      </span>
                    </td>

                    {/* Acheteur */}
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-foreground">{o.buyer_name}</div>
                      {o.buyer_email && (
                        <div className="text-[11px] text-foreground-muted truncate max-w-[180px]">
                          {o.buyer_email}
                        </div>
                      )}
                    </td>

                    {/* Ouvrages & Auteurs */}
                    <td className="py-3.5 px-4 max-w-xs">
                      {o.items.map((it, idx) => (
                        <div key={it.id || idx} className="mb-1 last:mb-0">
                          <div className="font-medium text-foreground truncate" title={it.book_title}>
                            {it.book_title}
                          </div>
                          <div className="text-[11px] text-foreground-muted truncate">
                            {it.author_display && <span>Par {it.author_display}</span>}
                            {it.publisher_name && (
                              <span className="ml-1 text-gold/80">({it.publisher_name})</span>
                            )}
                            {it.institution_name && !it.publisher_name && (
                              <span className="ml-1 text-gold/80">({it.institution_name})</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </td>

                    {/* Quantité */}
                    <td className="py-3.5 px-4 text-center font-medium text-foreground whitespace-nowrap">
                      {o.items.reduce((acc, it) => acc + (it.quantity || 1), 0)} ex.
                    </td>

                    {/* Montant Réglé */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <span className="font-bold font-serif text-navy">
                        {formatFcfa(o.net_amount_paid)} FCFA
                      </span>
                    </td>

                    {/* Statut */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {o.payment_status === "paid" ? "Réglé" : o.payment_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Contrôles de pagination ── */}
        {orders.length > pageSize && (
          <div className="p-3.5 border-t border-border flex items-center justify-between text-xs bg-background">
            <span className="text-foreground-muted">
              Affichage {((currentPage - 1) * pageSize) + 1} à {Math.min(currentPage * pageSize, orders.length)} sur {orders.length} transactions
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg bg-background-secondary border border-border text-foreground hover:bg-background disabled:opacity-40 cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
                title="Page précédente"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="font-medium text-foreground px-2">
                {currentPage} / {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg bg-background-secondary border border-border text-foreground hover:bg-background disabled:opacity-40 cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
                title="Page suivante"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
