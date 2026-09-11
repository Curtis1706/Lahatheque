"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Landmark,
  TrendingUp,
  Wallet,
  Clock,
  Building2,
  Users,
  Search,
  RefreshCw,
  Percent,
  CheckCircle2,
  BookOpen,
  Eye,
  Download,
  Library,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import {
  getAdminGlobalFinance,
  getAdminPartnerRoyaltiesSummary,
  triggerRoyaltyCalculationNow,
  type AdminGlobalFinance,
} from "@/lib/services/admin";
import { AdminPartnerRoyaltySummary } from "@/lib/types/admin";
import { AuthorRoyaltyDetailModal } from "@/components/features/admin/author-royalty-detail-modal";
import { PartnerRoyaltyAccordionRow } from "@/components/features/admin/partner-royalty-accordion-row";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";

type RoleTab = "all" | "author" | "publisher" | "university";

export default function AdminFinancePage() {
  const [finance, setFinance] = useState<AdminGlobalFinance | null>(null);
  const [partners, setPartners] = useState<AdminPartnerRoyaltySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<RoleTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [triggeringCalc, setTriggeringCalc] = useState(false);
  const [selectedAuthor, setSelectedAuthor] = useState<{ id: string; name: string } | null>(null);
  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [fData, pData] = await Promise.all([
        getAdminGlobalFinance(),
        getAdminPartnerRoyaltiesSummary(),
      ]);
      setFinance(fData);
      setPartners(pData);
    } catch {
      toast.error("Erreur lors du chargement des données financières.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTriggerCalculation = async () => {
    setTriggeringCalc(true);
    try {
      const result = await triggerRoyaltyCalculationNow();
      if (result.success) {
        toast.success(result.message || "Calcul des redevances exécuté avec succès.");
        loadData();
      } else {
        toast.error(result.error || "Échec du calcul des redevances.");
      }
    } catch {
      toast.error("Impossible de déclencher le calcul.");
    } finally {
      setTriggeringCalc(false);
    }
  };

  // Filtrage par onglet et recherche
  const filteredPartners = useMemo(() => {
    return partners.filter((p) => {
      const matchesTab = activeTab === "all" || p.partner_type === activeTab;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.partner_name.toLowerCase().includes(q) ||
        p.partner_id.toLowerCase().includes(q);
      return matchesTab && matchesSearch;
    });
  }, [partners, activeTab, searchQuery]);

  // Compteurs pour badges d'onglets
  const tabCounts = useMemo(() => {
    return {
      all: partners.length,
      author: partners.filter((p) => p.partner_type === "author").length,
      publisher: partners.filter((p) => p.partner_type === "publisher").length,
      university: partners.filter((p) => p.partner_type === "university").length,
    };
  }, [partners]);

  const getPartnerTypeBadge = (type: string) => {
    switch (type) {
      case "author":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-navy/10 text-navy border border-navy/20">
            <Users className="w-3 h-3 text-gold" />
            Auteur
          </span>
        );
      case "publisher":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gold/10 text-gold border border-gold/30">
            <Building2 className="w-3 h-3 text-gold" />
            Éditeur Tiers
          </span>
        );
      case "university":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-navy/5 text-navy border border-border">
            <Library className="w-3 h-3 text-gold" />
            Université
          </span>
        );
      default:
        return null;
    }
  };

  const handleExportCsv = () => {
    if (filteredPartners.length === 0) {
      toast.info("Aucun partenaire à exporter sur cette sélection.");
      return;
    }

    const headers = [
      "ID_Partenaire",
      "Nom_Partenaire",
      "Type_Partenaire",
      "Nombre_Ouvrages",
      "Ventes_Cumulees",
      "Taux_Moyen_Pourcent",
      "CA_Brut_Genere_FCFA",
      "Redevances_Dues_FCFA",
      "Redevances_Versees_FCFA",
      "Solde_Restant_FCFA",
    ];

    const rows = filteredPartners.map((p) => [
      `"${p.partner_id}"`,
      `"${p.partner_name.replace(/"/g, '""')}"`,
      `"${p.partner_type}"`,
      p.books_count,
      p.total_units_sold,
      p.average_rate_percent,
      p.total_revenue_generated,
      p.total_royalties_due,
      p.total_royalties_paid,
      p.balance_outstanding,
    ]);

    const csvContent = "\uFEFF" + [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `recapitulatif_droits_partenaires_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Export CSV des droits partenaires téléchargé.");
  };

  const columns: DataTableColumn<AdminPartnerRoyaltySummary>[] = [
    {
      key: "partner_name",
      header: "Ayant-Droit / Partenaire",
      cell: (row: AdminPartnerRoyaltySummary) => (
        <div className="space-y-1">
          <p className="font-poppins font-medium text-xs sm:text-sm text-foreground">
            {row.partner_name}
          </p>
          <div>{getPartnerTypeBadge(row.partner_type)}</div>
        </div>
      ),
    },
    {
      key: "books_count",
      header: "Ouvrages",
      cell: (row: AdminPartnerRoyaltySummary) => (
        <div className="flex items-center gap-1.5 text-xs font-poppins">
          <BookOpen className="w-3.5 h-3.5 text-foreground-muted" />
          <span className="font-semibold text-foreground">{row.books_count}</span>
        </div>
      ),
    },
    {
      key: "total_units_sold",
      header: "Ventes / Lect.",
      cell: (row: AdminPartnerRoyaltySummary) => (
        <span className="font-mono text-xs text-foreground">
          {row.total_units_sold} ex.
        </span>
      ),
    },
    {
      key: "average_rate_percent",
      header: "Taux Moyen",
      cell: (row: AdminPartnerRoyaltySummary) => (
        <span className="inline-flex items-center font-mono text-xs font-bold text-gold">
          <Percent className="w-3 h-3 mr-0.5" />
          {row.average_rate_percent}%
        </span>
      ),
    },
    {
      key: "total_revenue_generated",
      header: "CA Brut Généré",
      cell: (row: AdminPartnerRoyaltySummary) => (
        <span className="font-mono text-xs font-medium text-foreground">
          {row.total_revenue_generated.toLocaleString("fr-FR")} FCFA
        </span>
      ),
    },
    {
      key: "total_royalties_due",
      header: "Droits Dûs",
      cell: (row: AdminPartnerRoyaltySummary) => (
        <span className="font-mono text-xs font-bold text-navy">
          {row.total_royalties_due.toLocaleString("fr-FR")} FCFA
        </span>
      ),
    },
    {
      key: "total_royalties_paid",
      header: "Déjà Versé",
      cell: (row: AdminPartnerRoyaltySummary) => (
        <span className="font-mono text-xs font-semibold text-success">
          {row.total_royalties_paid.toLocaleString("fr-FR")} FCFA
        </span>
      ),
    },
    {
      key: "balance_outstanding",
      header: "Solde Restant",
      cell: (row: AdminPartnerRoyaltySummary) => (
        <span className="font-mono text-xs font-bold text-navy">
          {row.balance_outstanding.toLocaleString("fr-FR")} FCFA
        </span>
      ),
    },
    {
      key: "partner_id",
      header: "Actions",
      cell: (row: AdminPartnerRoyaltySummary) => (
        <div className="flex items-center justify-end gap-1.5">
          {row.partner_type === "author" && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedAuthor({ id: row.partner_id, name: row.partner_name });
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-border bg-background text-navy hover:text-gold hover:border-gold/40 text-xs font-semibold transition-all min-h-[36px]"
              title="Consulter le relevé officiel de l'auteur"
            >
              <Eye className="w-3.5 h-3.5 text-gold" />
              <span className="hidden sm:inline">Détail</span>
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full max-w-7xl mx-auto space-y-6 sm:space-y-8 pb-12 animate-in fade-in duration-300 font-poppins">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 text-xs text-foreground-muted mb-1">
            <span>Administration</span>
            <span>/</span>
            <span className="text-navy font-semibold">Direction Financière</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Finances Globales de la Plateforme
          </h1>
          <p className="text-sm text-foreground-muted mt-1">
            Vue consolidée 360° des encaissements, créances, marge plateforme et redevances partenaires
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={handleTriggerCalculation}
            disabled={triggeringCalc}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-navy text-white text-xs font-semibold hover:bg-navy-hover disabled:opacity-50 transition-all min-h-[44px]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${triggeringCalc ? "animate-spin text-gold" : ""}`} />
            <span>{triggeringCalc ? "Calcul..." : "Recalculer Redevances"}</span>
          </button>

          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-background-secondary border border-border text-navy hover:border-gold/40 text-xs font-bold transition-all min-h-[44px]"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-gold" : "text-foreground-muted"}`} />
            <span>Actualiser</span>
          </button>
        </div>
      </div>

      {/* 360° Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-background border border-border space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-foreground-muted">Revenu Global Encaissé</span>
            <div className="p-2.5 rounded-2xl bg-gold/10 text-gold border border-gold/20">
              <Landmark className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="font-serif text-2xl font-bold text-navy">
              {(finance?.total_platform_revenue || 0).toLocaleString("fr-FR")} <span className="text-xs font-normal text-foreground-muted">FCFA</span>
            </div>
            <p className="text-xs text-foreground-muted mt-1">Tous flux réconciliés (clients, univ., grossistes)</p>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-background border border-border space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-foreground-muted">Redevances Totales Dues</span>
            <div className="p-2.5 rounded-2xl bg-navy/5 text-navy border border-border">
              <Percent className="w-5 h-5 text-gold" />
            </div>
          </div>
          <div>
            <div className="font-serif text-2xl font-bold text-navy">
              {(finance?.royalties_overview?.total_generated || 0).toLocaleString("fr-FR")} <span className="text-xs font-normal text-foreground-muted">FCFA</span>
            </div>
            <p className="text-xs text-foreground-muted mt-1">Droits calculés revenant aux partenaires</p>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-background border border-border space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-foreground-muted">Redevances Versées</span>
            <div className="p-2.5 rounded-2xl bg-success/10 text-success border border-success/20">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="font-serif text-2xl font-bold text-navy">
              {(finance?.royalties_overview?.total_paid || 0).toLocaleString("fr-FR")} <span className="text-xs font-normal text-foreground-muted">FCFA</span>
            </div>
            <p className="text-xs text-foreground-muted mt-1">Versements effectués aux ayant-droits</p>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-background border border-border space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-foreground-muted">Solde Restant Exigible</span>
            <div className="p-2.5 rounded-2xl bg-gold/10 text-gold border border-gold/20">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="font-serif text-2xl font-bold text-navy">
              {(finance?.royalties_overview?.total_outstanding || 0).toLocaleString("fr-FR")} <span className="text-xs font-normal text-foreground-muted">FCFA</span>
            </div>
            <p className="text-xs text-foreground-muted mt-1">Engagements en attente de liquidation</p>
          </div>
        </div>
      </div>

      {/* Marge Plateforme & Créances */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-3xl bg-background border border-border flex items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-foreground-muted">Marge Nette Plateforme</span>
            <div className="font-serif text-xl font-bold text-navy">
              {(finance?.platform_margin?.net_retained_platform || 0).toLocaleString("fr-FR")} <span className="text-xs font-normal text-foreground-muted">FCFA</span>
            </div>
            <p className="text-xs text-foreground-muted">
              Taux moyen de rétention LAHA : <strong className="text-navy">{finance?.platform_margin?.commission_rate_avg || 0}%</strong>
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-gold/10 text-gold border border-gold/20 flex-shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-background border border-border flex items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-foreground-muted">Créances en Cours d&apos;Encaissement</span>
            <div className="font-serif text-xl font-bold text-navy">
              {(finance?.credit?.outstanding_total || 0).toLocaleString("fr-FR")} <span className="text-xs font-normal text-foreground-muted">FCFA</span>
            </div>
            <p className="text-xs text-foreground-muted">
              {finance?.credit?.outstanding_count || 0} commande{(finance?.credit?.outstanding_count || 0) > 1 ? "s" : ""} en attente de dénouement
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-navy/5 text-navy border border-border flex-shrink-0">
            <Wallet className="w-6 h-6 text-gold" />
          </div>
        </div>
      </div>

      {/* Breakdown by Platform Revenue Stream */}
      <div className="p-6 rounded-3xl bg-background border border-border space-y-5">
        <div>
          <h2 className="font-serif text-lg font-bold text-navy">Répartition par Source de Revenus</h2>
          <p className="text-xs text-foreground-muted mt-0.5">Agrégation des flux d&apos;encaissement directs et partenariats B2B / institutionnels</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-background-secondary border border-border flex items-center gap-4">
            <div className="p-3 rounded-xl bg-navy/5 text-navy border border-border">
              <Users className="w-5 h-5 text-gold" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-foreground-muted truncate">Lecteurs & Auteurs</p>
              <p className="font-serif font-bold text-navy text-base mt-0.5">
                {(finance?.breakdown?.student_author_orders?.total || 0).toLocaleString("fr-FR")} <span className="text-[10px] font-normal">FCFA</span>
              </p>
              <p className="text-[11px] text-foreground-muted">{finance?.breakdown?.student_author_orders?.count || 0} commandes payées</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-background-secondary border border-border flex items-center gap-4">
            <div className="p-3 rounded-xl bg-navy/5 text-navy border border-border">
              <Building2 className="w-5 h-5 text-gold" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-foreground-muted truncate">Universités Partenaires</p>
              <p className="font-serif font-bold text-navy text-base mt-0.5">
                {(finance?.breakdown?.university_orders?.total || 0).toLocaleString("fr-FR")} <span className="text-[10px] font-normal">FCFA</span>
              </p>
              <p className="text-[11px] text-foreground-muted">{finance?.breakdown?.university_orders?.count || 0} commandes campus</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-background-secondary border border-border flex items-center gap-4">
            <div className="p-3 rounded-xl bg-navy/5 text-navy border border-border">
              <TrendingUp className="w-5 h-5 text-gold" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-foreground-muted truncate">Grossistes & Librairies</p>
              <p className="font-serif font-bold text-navy text-base mt-0.5">
                {(finance?.breakdown?.wholesale_orders?.total || 0).toLocaleString("fr-FR")} <span className="text-[10px] font-normal">FCFA</span>
              </p>
              <p className="text-[11px] text-foreground-muted">{finance?.breakdown?.wholesale_orders?.count || 0} commandes B2B</p>
            </div>
          </div>
        </div>
      </div>

      {/* Multi-Partner Royalties Table */}
      <div className="p-6 rounded-3xl bg-background border border-border space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-serif text-lg font-bold text-navy">
              État Récapitulatif Consolidé des Droits & Redevances Partenaires
            </h2>
            <p className="text-xs text-foreground-muted mt-0.5">
              Synthèse multi-partenaires avec lignes d&apos;ouvrages dépliables en accordéon pour chaque ayant-droit
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-background-secondary border border-border text-navy hover:border-gold/40 text-xs font-semibold transition-all min-h-[40px]"
            >
              <Download className="w-3.5 h-3.5 text-gold" />
              <span>Exporter CSV</span>
            </button>
          </div>
        </div>

        {/* Filter Tabs & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          {/* Role Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-background-secondary border border-border overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap min-h-[36px] flex items-center gap-1.5 ${
                activeTab === "all"
                  ? "bg-navy text-white shadow-xs"
                  : "text-foreground-muted hover:text-navy"
              }`}
            >
              <span>Tous</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === "all" ? "bg-white/20 text-white" : "bg-navy/5 text-foreground-muted"
              }`}>
                {tabCounts.all}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("author")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap min-h-[36px] flex items-center gap-1.5 ${
                activeTab === "author"
                  ? "bg-navy text-white shadow-xs"
                  : "text-foreground-muted hover:text-navy"
              }`}
            >
              <span>Auteurs</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === "author" ? "bg-white/20 text-white" : "bg-navy/5 text-foreground-muted"
              }`}>
                {tabCounts.author}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("publisher")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap min-h-[36px] flex items-center gap-1.5 ${
                activeTab === "publisher"
                  ? "bg-navy text-white shadow-xs"
                  : "text-foreground-muted hover:text-navy"
              }`}
            >
              <span>Éditeurs Tiers</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === "publisher" ? "bg-white/20 text-white" : "bg-navy/5 text-foreground-muted"
              }`}>
                {tabCounts.publisher}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("university")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap min-h-[36px] flex items-center gap-1.5 ${
                activeTab === "university"
                  ? "bg-navy text-white shadow-xs"
                  : "text-foreground-muted hover:text-navy"
              }`}
            >
              <span>Universités</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === "university" ? "bg-white/20 text-white" : "bg-navy/5 text-foreground-muted"
              }`}>
                {tabCounts.university}
              </span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-foreground-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher un partenaire..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-border bg-background-secondary text-navy placeholder:text-foreground-muted focus:outline-none focus:border-gold min-h-[44px]"
            />
          </div>
        </div>

        {/* Data Table with Expandable Row */}
        <DataTable
          data={filteredPartners}
          columns={columns}
          rowKey="partner_id"
          pageSize={20}
          pageSizeOptions={[10, 20, 50, 100]}
          searchable={false}
          loading={loading}
          emptyMessage="Aucun ayant-droit ou partenaire trouvé correspondant aux critères."
          renderExpandedRow={(partner: AdminPartnerRoyaltySummary) => <PartnerRoyaltyAccordionRow partner={partner} />}
          expandedRowKeys={expandedRowKeys}
          onExpandedRowsChange={setExpandedRowKeys}
        />
      </div>

      <AuthorRoyaltyDetailModal
        isOpen={!!selectedAuthor}
        onClose={() => setSelectedAuthor(null)}
        authorId={selectedAuthor?.id || null}
        authorName={selectedAuthor?.name}
      />
    </div>
  );
}
