"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  DollarSign,
  ArrowLeft,
  Download,
  BookOpen,
  Laptop,
  Layers,
  Search,
  Filter,
  Info,
  Building2,
  TrendingUp,
  Percent,
  CheckCircle2,
  Clock,
  Sparkles,
  FileText,
  PieChart,
} from "lucide-react";
import { BouquetDistributionModal } from "@/components/features/bouquets/bouquet-distribution-modal";
import { UniversityRoyaltyCard } from "@/components/features/university/university-royalty-card";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import {
  getUniversityRoyalties,
  requestUniversityRoyaltyWithdrawal,
} from "@/lib/services/university";
import type {
  UniversityRoyaltiesDetailData,
  UniversityUnitSaleRoyalty,
  UniversityBouquetUsageRoyalty,
} from "@/lib/types/university";
import { toast } from "sonner";
import { generateOfficialPdf } from "@/lib/services/export-service";

type TabType = "unit_sales" | "bouquets";

export default function UniversityRoyaltiesPage() {
  const [data, setData] = useState<UniversityRoyaltiesDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("unit_sales");
  const [selectedBouquetForDistribution, setSelectedBouquetForDistribution] = useState<UniversityBouquetUsageRoyalty | null>(null);

  // Filtres Ventes Unitaires
  const [searchQuery, setSearchQuery] = useState("");
  const [formatFilter, setFormatFilter] = useState<"all" | "paper" | "digital">("all");
  const [buyerFilter, setBuyerFilter] = useState<string>("all");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const res = await getUniversityRoyalties();
      setData(res);
      setLoading(false);
    }
    loadData();
  }, []);

  const handleWithdraw = async (amount: number) => {
    const ok = await requestUniversityRoyaltyWithdrawal(amount);
    if (ok) {
      setData((prev) =>
        prev
          ? {
              ...prev,
              available_balance: Math.max(0, prev.available_balance - amount),
              total_paid: prev.total_paid + amount,
            }
          : prev
      );
    }
    return ok;
  };

  // Ventes unitaires filtrées
  const filteredUnitSales = useMemo(() => {
    if (!data?.unit_sales) return [];
    return data.unit_sales.filter((sale) => {
      const matchesSearch =
        searchQuery === "" ||
        sale.book_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sale.transaction_ref.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sale.discipline.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sale.authors.some((a) => a.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesFormat =
        formatFilter === "all" || sale.format === formatFilter;

      const matchesBuyer =
        buyerFilter === "all" || sale.buyer_type === buyerFilter;

      return matchesSearch && matchesFormat && matchesBuyer;
    });
  }, [data?.unit_sales, searchQuery, formatFilter, buyerFilter]);

  // Totaux filtrés
  const filteredSalesTotals = useMemo(() => {
    const count = filteredUnitSales.reduce((acc, s) => acc + s.quantity, 0);
    const gross = filteredUnitSales.reduce((acc, s) => acc + s.gross_amount, 0);
    const royalties = filteredUnitSales.reduce((acc, s) => acc + s.royalty_amount, 0);
    return { count, gross, royalties };
  }, [filteredUnitSales]);

  // Export PDF Relevé Ventes Unitaires
  const handleExportUnitSalesPdf = async () => {
    if (!data) return;
    try {
      await generateOfficialPdf({
        docType: "BORDEREAU_REDEVANCES",
        docNumber: `REL-VENTES-${Date.now().toString().slice(-6)}`,
        date: new Date().toLocaleDateString("fr-FR"),
        period: "Année Académique 2025-2026",
        recipient: {
          name: "Établissement Universitaire Partenaire",
          roleOrTitle: "Relevé Analytique des Ventes à l'Unité",
          addressOrCampus: "Campus Universitaire Principal",
          emailOrPhone: "redevances@lahatheque.bj",
        },
        summaryCards: [
          { label: "Taux Conventionné", value: `${data.contractual_rate}%` },
          { label: "Volume d'Exemplaires / Licences", value: `${filteredSalesTotals.count}` },
          { label: "Chiffre d'Affaires Brut", value: `${filteredSalesTotals.gross.toLocaleString("fr-FR")} ${data.currency}` },
          { label: "Redevances Nettes Reversées", value: `${filteredSalesTotals.royalties.toLocaleString("fr-FR")} ${data.currency}` },
        ],
        tableHeaders: [
          "Réf Transaction",
          "Date",
          "Ouvrage & Format",
          "Qté",
          "Prix Unit HT",
          "Brut HT",
          "Taux",
          "Redevance Nette",
        ],
        tableRows: filteredUnitSales.map((s) => [
          s.transaction_ref,
          s.date,
          `${s.book_title} (${s.format === "paper" ? "Papier" : "Numérique"})`,
          s.quantity,
          `${s.unit_price.toLocaleString("fr-FR")} ${s.currency}`,
          `${s.gross_amount.toLocaleString("fr-FR")} ${s.currency}`,
          `${s.royalty_rate}%`,
          `${s.royalty_amount.toLocaleString("fr-FR")} ${s.currency}`,
        ]),
        totalAmount: `${filteredSalesTotals.royalties.toLocaleString("fr-FR")} ${data.currency}`,
        totalNotes:
          "Relevé officiel certifié par LAHAThèque Éditions & Numérique S.A. Les montants sont calculés après application directe du taux conventionné sur le montant brut HT.",
        filename: `releve_ventes_unitaires_${new Date().toISOString().slice(0, 10)}.pdf`,
      });
      toast.success("Relevé officiel des ventes unitaires exporté en PDF !");
    } catch {
      toast.error("Erreur lors de l'exportation du relevé PDF.");
    }
  };

  // Export PDF Relevé Bouquets (Prorata Consultations)
  const handleExportBouquetsPdf = async () => {
    if (!data) return;
    try {
      const totalBouquetRoyalties = data.bouquet_royalties.reduce(
        (acc, b) => acc + b.net_royalty_amount,
        0
      );
      await generateOfficialPdf({
        docType: "BORDEREAU_REDEVANCES",
        docNumber: `REL-BOUQUET-${Date.now().toString().slice(-6)}`,
        date: new Date().toLocaleDateString("fr-FR"),
        period: "1er Trimestre 2026",
        recipient: {
          name: "Établissement Universitaire Partenaire",
          roleOrTitle: "Relevé Analytique Quotes-Parts Abonnements Bouquets",
          addressOrCampus: "Campus Universitaire Principal",
          emailOrPhone: "redevances@lahatheque.bj",
        },
        summaryCards: [
          { label: "Taux Conventionné", value: `${data.contractual_rate}%` },
          { label: "Bouquets Souscrits", value: `${data.bouquet_royalties.length}` },
          { label: "Consultations Vos Livres", value: `${data.totals_summary.bouquet_consultations_count.toLocaleString("fr-FR")}` },
          { label: "Redevances Bouquets Nettes", value: `${totalBouquetRoyalties.toLocaleString("fr-FR")} ${data.currency}` },
        ],
        tableHeaders: [
          "Bouquet & Faculté",
          "Livres Inclus",
          "Consultations (Établissement / Total)",
          "Part d'Usage (%)",
          "Assiette CA Allouée",
          "Taux",
          "Redevance Nette",
        ],
        tableRows: data.bouquet_royalties.map((b) => [
          `${b.bouquet_title} (${b.faculty_code || "Campus"})`,
          `${b.books_included_count} ouvrages`,
          `${b.university_consultations.toLocaleString("fr-FR")} / ${b.total_bouquet_consultations.toLocaleString("fr-FR")}`,
          `${b.consultation_share_percent.toFixed(2)}%`,
          `${b.bouquet_revenue_allocated.toLocaleString("fr-FR")} ${b.currency}`,
          `${b.royalty_rate}%`,
          `${b.net_royalty_amount.toLocaleString("fr-FR")} ${b.currency}`,
        ]),
        totalAmount: `${totalBouquetRoyalties.toLocaleString("fr-FR")} ${data.currency}`,
        totalNotes:
          "Calcul au prorata d'audience certifié par le système de traçabilité LAHAThèque. La redevance reversée correspond au pourcentage effectif de consultation de vos ouvrages appliqués sur l'assiette du bouquet puis multiplié par votre taux de redevance conventionné.",
        filename: `releve_redevances_bouquets_${new Date().toISOString().slice(0, 10)}.pdf`,
      });
      toast.success("Relevé officiel des redevances par bouquet exporté en PDF !");
    } catch {
      toast.error("Erreur lors de l'exportation du relevé PDF.");
    }
  };

  // Colonnes DataTable Ventes Unitaires
  const unitSalesColumns: DataTableColumn<UniversityUnitSaleRoyalty>[] = [
    {
      key: "transaction_ref",
      header: "Réf & Date",
      cell: (row) => (
        <div>
          <span className="font-mono text-xs font-bold text-navy">{row.transaction_ref}</span>
          <p className="text-[11px] text-foreground-muted">{row.date}</p>
        </div>
      ),
    },
    {
      key: "book_title",
      header: "Ouvrage & Discipline",
      cell: (row) => (
        <div className="max-w-xs">
          <p className="text-xs font-bold text-navy line-clamp-1">{row.book_title}</p>
          <p className="text-[11px] text-foreground-muted line-clamp-1">
            {row.authors.join(", ")} &bull;{" "}
            <span className="text-navy font-medium">{row.discipline}</span>
          </p>
        </div>
      ),
    },
    {
      key: "format",
      header: "Format",
      cell: (row) => {
        if (row.format === "paper") {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
              <BookOpen className="w-3 h-3 text-amber-700" />
              Papier
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-navy-light text-navy border border-navy-hover/20">
            <Laptop className="w-3 h-3 text-gold" />
            Numérique
          </span>
        );
      },
    },
    {
      key: "quantity",
      header: "Qté & Prix",
      hideOnMobile: true,
      cell: (row) => (
        <div>
          <span className="font-bold text-xs text-navy">{row.quantity} ex.</span>
          <p className="text-[10px] text-foreground-muted">
            {row.unit_price.toLocaleString("fr-FR")} {row.currency} / u
          </p>
        </div>
      ),
    },
    {
      key: "gross_amount",
      header: "Montant Brut (HT)",
      hideOnMobile: true,
      cell: (row) => (
        <span className="font-mono text-xs text-foreground font-semibold">
          {row.gross_amount.toLocaleString("fr-FR")} {row.currency}
        </span>
      ),
    },
    {
      key: "royalty_rate",
      header: "Taux",
      hideOnMobile: true,
      cell: (row) => {
        const instRate = data?.institution?.royalty_rate ?? data?.contractual_rate ?? 15;
        const appliedRate = row.applied_rate ?? row.royalty_rate;
        return (
          <div className="flex flex-col gap-1">
            <span className="font-bold text-xs text-navy bg-navy-light px-2 py-0.5 rounded-md inline-block w-fit">
              {appliedRate}%
            </span>
            {appliedRate !== instRate && (
              <span className="text-[10px] text-gold font-semibold">
                Taux spécifique à ce contrat : {appliedRate}% (au lieu du taux général {instRate}%)
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "royalty_amount",
      header: "Redevance Nette",
      cell: (row) => (
        <span className="font-mono text-xs font-bold text-navy">
          {row.royalty_amount.toLocaleString("fr-FR")} {row.currency}
        </span>
      ),
    },
    {
      key: "buyer_type",
      header: "Acheteur",
      hideOnMobile: true,
      cell: (row) => {
        const labels: Record<string, string> = {
          etudiant: "Étudiant",
          particulier: "Particulier",
          institution: "Institution",
          grossiste: "Grossiste",
        };
        return (
          <span className="text-[11px] font-medium text-foreground-muted uppercase tracking-wider">
            {labels[row.buyer_type] || row.buyer_type}
          </span>
        );
      },
    },
  ];

  if (loading || !data) {
    return (
      <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 max-w-7xl mx-auto animate-pulse">
        <div className="h-8 bg-background-secondary rounded-xl w-1/3" />
        <div className="h-48 bg-background-secondary rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-28 bg-background-secondary rounded-2xl" />
          <div className="h-28 bg-background-secondary rounded-2xl" />
          <div className="h-28 bg-background-secondary rounded-2xl" />
        </div>
        <div className="h-64 bg-background-secondary rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-8 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/university" className="hover:text-navy">Vue d&apos;ensemble</Link>
        <span>/</span>
        <span className="text-navy font-semibold">Redevances Universitaires</span>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/university" className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Vue d&apos;ensemble
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
            <DollarSign className="w-4 h-4 text-gold" />
            Rémunération Institutionnelle (Section 4.1.6 &amp; 7)
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Détail des Redevances de l&apos;Établissement ({data.contractual_rate}% HT)
          </h1>
          <p className="text-xs text-foreground-muted mt-1">
            Relevé analytique en temps réel des droits perçus sur les ventes unitaires papier, numériques et la quote-part des abonnements bouquets.
          </p>
        </div>
      </div>

      {/* Carte Financière Principale */}
      <UniversityRoyaltyCard
        availableBalance={data.available_balance}
        totalPaid={data.total_paid}
        contractualRate={data.contractual_rate}
        currency={data.currency}
        minThreshold={data.min_withdrawal_threshold}
        onWithdraw={handleWithdraw}
      />

      {/* 3 Cartes KPIs de Synthèse Analytique */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* KPI 1 : Ventes Papier */}
        <div className="p-5 rounded-2xl bg-background border border-border space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-navy uppercase tracking-wider">
              Ventes Papier à l&apos;Unité
            </span>
            <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-700">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-serif font-bold text-navy">
              {data.totals_summary.paper_royalties_total.toLocaleString("fr-FR")}{" "}
              <span className="text-xs font-sans text-gold">{data.currency}</span>
            </p>
            <p className="text-[11px] text-foreground-muted mt-1">
              Redevance nette perçue sur {data.totals_summary.paper_sales_count} exemplaires
            </p>
          </div>
          <div className="pt-2 border-t border-border flex items-center justify-between text-[11px] text-foreground-muted">
            <span>CA Brut Ventes :</span>
            <span className="font-mono font-semibold text-navy">
              {data.totals_summary.paper_gross_total.toLocaleString("fr-FR")} {data.currency}
            </span>
          </div>
        </div>

        {/* KPI 2 : Ventes Numériques */}
        <div className="p-5 rounded-2xl bg-background border border-border space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-navy uppercase tracking-wider">
              Ventes Numériques à l&apos;Unité
            </span>
            <div className="p-2 rounded-xl bg-navy-light text-navy">
              <Laptop className="w-4 h-4 text-gold" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-serif font-bold text-navy">
              {data.totals_summary.digital_royalties_total.toLocaleString("fr-FR")}{" "}
              <span className="text-xs font-sans text-gold">{data.currency}</span>
            </p>
            <p className="text-[11px] text-foreground-muted mt-1">
              Redevance nette perçue sur {data.totals_summary.digital_sales_count} licences
            </p>
          </div>
          <div className="pt-2 border-t border-border flex items-center justify-between text-[11px] text-foreground-muted">
            <span>CA Brut Ventes :</span>
            <span className="font-mono font-semibold text-navy">
              {data.totals_summary.digital_gross_total.toLocaleString("fr-FR")} {data.currency}
            </span>
          </div>
        </div>

        {/* KPI 3 : Quotes-Parts Abonnements Bouquets (Prorata) */}
        <div className="p-5 rounded-2xl bg-background border border-border space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-navy uppercase tracking-wider">
              Quotes-Parts Bouquets
            </span>
            <div className="p-2 rounded-xl bg-navy-light text-navy">
              <Layers className="w-4 h-4 text-gold" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-serif font-bold text-navy">
              {data.totals_summary.bouquet_royalties_total.toLocaleString("fr-FR")}{" "}
              <span className="text-xs font-sans text-gold">{data.currency}</span>
            </p>
            <p className="text-[11px] text-foreground-muted mt-1">
              Prorata basé sur {data.totals_summary.bouquet_consultations_count.toLocaleString("fr-FR")} consultations
            </p>
          </div>
          <div className="pt-2 border-t border-border flex items-center justify-between text-[11px] text-foreground-muted">
            <span>Assiette CA Bouquets :</span>
            <span className="font-mono font-semibold text-navy">
              {data.totals_summary.bouquet_gross_allocated.toLocaleString("fr-FR")} {data.currency}
            </span>
          </div>
        </div>
      </div>

      {/* Onglets de Navigation */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("unit_sales")}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-2 cursor-pointer min-h-[44px] ${
                activeTab === "unit_sales"
                  ? "bg-navy text-white shadow-xs"
                  : "bg-background-secondary text-foreground-muted hover:text-navy border border-border"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-gold" />
              <span>Ventes à l&apos;Unité (Papier &amp; Numérique)</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/20 text-white font-mono">
                {data.unit_sales.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("bouquets")}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-2 cursor-pointer min-h-[44px] ${
                activeTab === "bouquets"
                  ? "bg-navy text-white shadow-xs"
                  : "bg-background-secondary text-foreground-muted hover:text-navy border border-border"
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-gold" />
              <span>Redevances Bouquets (Prorata Consultations)</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/20 text-white font-mono">
                {data.bouquet_royalties.length}
              </span>
            </button>
          </div>

          {/* Boutons d'export PDF selon l'onglet */}
          {activeTab === "unit_sales" ? (
            <button
              type="button"
              onClick={handleExportUnitSalesPdf}
              className="px-3.5 py-2 rounded-xl bg-background-secondary border border-border hover:border-gold text-navy text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer min-h-[44px]"
            >
              <Download className="w-3.5 h-3.5 text-gold" />
              <span>Relevé Ventes PDF</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleExportBouquetsPdf}
              className="px-3.5 py-2 rounded-xl bg-background-secondary border border-border hover:border-gold text-navy text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer min-h-[44px]"
            >
              <Download className="w-3.5 h-3.5 text-gold" />
              <span>Relevé Bouquets PDF</span>
            </button>
          )}
        </div>

        {/* ─── ONGLET 1 : VENTES À L'UNITÉ ───────────────────────────────────── */}
        {activeTab === "unit_sales" && (
          <div className="space-y-4">
            {/* Barre de Recherche et Filtres */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-background-secondary p-3.5 rounded-2xl border border-border">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-foreground-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Rechercher par titre, auteur, discipline ou référence..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-background border border-border rounded-xl focus:outline-none focus:border-gold text-navy min-h-[40px]"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 bg-background border border-border rounded-xl px-2.5 py-1">
                  <Filter className="w-3.5 h-3.5 text-gold" />
                  <select
                    value={formatFilter}
                    onChange={(e) => setFormatFilter(e.target.value as any)}
                    className="text-xs bg-transparent text-navy font-semibold focus:outline-none cursor-pointer py-1"
                  >
                    <option value="all">Tous les Formats</option>
                    <option value="paper">Livre Papier uniquement</option>
                    <option value="digital">Livre Numérique uniquement</option>
                  </select>
                </div>

                <div className="flex items-center gap-1 bg-background border border-border rounded-xl px-2.5 py-1">
                  <select
                    value={buyerFilter}
                    onChange={(e) => setBuyerFilter(e.target.value)}
                    className="text-xs bg-transparent text-navy font-semibold focus:outline-none cursor-pointer py-1"
                  >
                    <option value="all">Tous les Acheteurs</option>
                    <option value="etudiant">Étudiants</option>
                    <option value="institution">Institutions / Bibliothèques</option>
                    <option value="particulier">Particuliers</option>
                    <option value="grossiste">Grossistes / Libraires</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Tableau des ventes unitaires */}
            <DataTable
              data={filteredUnitSales}
              columns={unitSalesColumns}
              rowKey="id"
              loading={loading}
              emptyMessage="Aucune vente unitaire trouvée pour ces critères de recherche."
              pageSize={10}
            />

            {/* Barre de récapitulatif des lignes filtrées */}
            {filteredUnitSales.length > 0 && (
              <div className="p-4 rounded-2xl bg-navy-light border border-navy-hover/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="text-navy font-medium">
                  Affichage de <span className="font-bold">{filteredUnitSales.length}</span> transaction(s) &bull;{" "}
                  <span className="font-bold">{filteredSalesTotals.count}</span> exemplaire(s) vendus
                </div>
                <div className="flex items-center gap-6">
                  <div>
                    <span className="text-foreground-muted">Total Brut : </span>
                    <span className="font-mono font-semibold text-navy">
                      {filteredSalesTotals.gross.toLocaleString("fr-FR")} {data.currency}
                    </span>
                  </div>
                  <div>
                    <span className="text-foreground-muted">Redevance Nette ({data.contractual_rate}%) : </span>
                    <span className="font-mono font-bold text-navy text-sm">
                      {filteredSalesTotals.royalties.toLocaleString("fr-FR")} {data.currency}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── ONGLET 2 : REDEVANCES BOUQUETS (PRORATA CONSULTATIONS) ─────────── */}
        {activeTab === "bouquets" && (
          <div className="space-y-6">
            {/* Bannière Pédagogique Formule de Répartition */}
            <div className="p-5 rounded-2xl bg-navy-light border border-navy-hover/20 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider">
                <Info className="w-4 h-4 text-gold" />
                <span>Règle de Répartition au Prorata des Consultations Réelles</span>
              </div>
              <p className="text-xs text-foreground-muted leading-relaxed">
                Pour chaque bouquet d&apos;abonnements thématique dans lequel figurent des ouvrages de votre établissement, votre redevance est calculée directement selon l&apos;usage réel :
              </p>
              <div className="p-3 rounded-xl bg-background border border-border font-mono text-xs text-navy font-semibold space-y-1">
                <p>
                  Part d&apos;Audience (%) = (Consultations des ouvrages de votre université &divide; Consultations globales du bouquet) &times; 100
                </p>
                <p className="text-gold">
                  Redevance Nette = Assiette CA allouée au bouquet &times; {data.contractual_rate}% (Taux Conventionné)
                </p>
              </div>
            </div>

            {/* Cartes Détaillées par Bouquet */}
            <div className="grid grid-cols-1 gap-4">
              {data.bouquet_royalties.map((bouquet) => {
                return (
                  <div
                    key={bouquet.id}
                    className="p-5 rounded-3xl bg-background border border-border hover:border-gold/50 transition-all space-y-4 shadow-xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-navy-light text-navy text-[10px] font-bold">
                            {bouquet.faculty_code || "Campus"}
                          </span>
                          <span className="text-[11px] text-foreground-muted">{bouquet.period}</span>
                        </div>
                        <h3 className="font-serif text-lg font-bold text-navy">
                          {bouquet.bouquet_title}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-3 py-1.5 rounded-full bg-gold/10 border border-gold/30 text-navy font-bold text-xs">
                          {bouquet.books_included_count} ouvrages de votre établissement
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedBouquetForDistribution(bouquet)}
                          className="px-3 py-1.5 rounded-full bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs min-h-[34px]"
                        >
                          <PieChart className="w-3.5 h-3.5 text-gold" />
                          <span>Répartition &amp; Redevances</span>
                        </button>
                      </div>
                    </div>

                    {/* Jauge et Chiffres de Consultation */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-foreground-muted">
                          Part de Consultation de vos Livres dans le Bouquet :
                        </span>
                        <span className="font-bold text-navy font-mono text-sm">
                          {bouquet.consultation_share_percent.toFixed(2)} % des lectures
                        </span>
                      </div>

                      {/* Barre de progression visuelle */}
                      <div className="w-full h-3 bg-background-secondary rounded-full overflow-hidden border border-border">
                        <div
                          className="h-full bg-gold rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, bouquet.consultation_share_percent)}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-foreground-muted">
                        <span>
                          <strong className="text-navy">{bouquet.university_consultations.toLocaleString("fr-FR")}</strong> consultations de vos {bouquet.books_included_count} livres
                        </span>
                        <span>
                          Sur un total global de <strong className="text-navy">{bouquet.total_bouquet_consultations.toLocaleString("fr-FR")}</strong> consultations
                        </span>
                      </div>
                    </div>

                    {/* Grille Financière du Bouquet */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                      <div className="p-3 rounded-xl bg-background-secondary border border-border">
                        <span className="text-[10px] text-foreground-muted uppercase tracking-wider block font-bold">
                          Assiette CA Proratisée
                        </span>
                        <p className="font-mono text-sm font-bold text-navy mt-0.5">
                          {bouquet.bouquet_revenue_allocated.toLocaleString("fr-FR")} {bouquet.currency}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-background-secondary border border-border">
                        <span className="text-[10px] text-foreground-muted uppercase tracking-wider block font-bold">
                          Taux Partenaire Appliqué
                        </span>
                        <p className="font-mono text-sm font-bold text-navy mt-0.5">
                          {bouquet.royalty_rate} % HT
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-navy-light border border-navy-hover/30">
                        <span className="text-[10px] text-navy uppercase tracking-wider block font-bold">
                          Redevance Nette Reversée
                        </span>
                        <p className="font-mono text-base font-bold text-navy mt-0.5">
                          {bouquet.net_royalty_amount.toLocaleString("fr-FR")} {bouquet.currency}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Modale Répartition Multi-Universités & Statistiques */}
      <BouquetDistributionModal
        open={!!selectedBouquetForDistribution}
        onClose={() => setSelectedBouquetForDistribution(null)}
        bouquet={
          selectedBouquetForDistribution
            ? {
                id: selectedBouquetForDistribution.bouquet_id,
                title: selectedBouquetForDistribution.bouquet_title,
                annual_price: selectedBouquetForDistribution.bouquet_revenue_allocated,
                currency: selectedBouquetForDistribution.currency,
              }
            : null
        }
        highlightUniversityName="Université"
        royaltyRate={data.contractual_rate}
      />
    </div>
  );
}
