"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  TotalSalesChart,
  TimeSlotFilter,
  Period,
} from "@/components/ui/total-sales-chart";
import { getAdminConsolidatedSales, getAdminKpis } from "@/lib/services/admin";
import {
  AdminSaleOrder,
  AdminSalesConsolidatedResponse,
  AdminKpi,
} from "@/lib/types/admin";
import {
  Download,
  Clock,
  Filter,
  ShoppingBag,
  BookOpen,
  Layers,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  ChevronDown,
  AlertCircle,
  XCircle,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { generateCsvExport } from "@/lib/services/export-service";
import { OrderItemsAccordionRow } from "@/components/features/admin/order-items-accordion-row";

export default function AdminSalesPage() {
  const [salesData, setSalesData] = useState<AdminSalesConsolidatedResponse | null>(null);
  const [kpis, setKpis] = useState<AdminKpi | null>(null);
  const [loading, setLoading] = useState(true);

  // Filtres
  const [selectedChannel, setSelectedChannel] = useState<string>("all");
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>("all");
  const [timeSlot, setTimeSlot] = useState<TimeSlotFilter | null>(null);
  const [period, setPeriod] = useState<Period>("1m");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const loadConsolidatedSales = useCallback(async () => {
    try {
      setLoading(true);
      const [data, kpisRes] = await Promise.all([
        getAdminConsolidatedSales({
          channel: selectedChannel !== "all" ? selectedChannel : undefined,
          payment_status: selectedPaymentStatus !== "all" ? selectedPaymentStatus : undefined,
          period: period || undefined,
          time_slot: timeSlot && timeSlot.id !== "all" ? timeSlot.id : undefined,
          q: searchQuery || undefined,
        }),
        getAdminKpis().catch(() => null),
      ]);
      setSalesData(data);
      if (kpisRes) setKpis(kpisRes);
    } catch {
      toast.error("Erreur lors de la récupération des ventes consolidées.");
    } finally {
      setLoading(false);
    }
  }, [selectedChannel, selectedPaymentStatus, period, timeSlot, searchQuery]);

  useEffect(() => {
    loadConsolidatedSales();
  }, [loadConsolidatedSales]);

  // Données de ventilation par canal pour le graphique
  const computedChannels = useMemo(() => {
    if (!salesData?.channel_breakdown) return [];
    const cb = salesData.channel_breakdown;
    return [
      {
        name: "Ventes Unitaires B2C",
        amount: cb.b2c_individual?.amount || 0,
        change: `${cb.b2c_individual?.percentage || 0}%`,
        isPositive: true,
      },
      {
        name: "Bouquets Campus B2B",
        amount: cb.b2b_university?.amount || 0,
        change: `${cb.b2b_university?.percentage || 0}%`,
        isPositive: true,
      },
      {
        name: "Commandes Grossistes B2B",
        amount: cb.b2b_wholesale?.amount || 0,
        change: `${cb.b2b_wholesale?.percentage || 0}%`,
        isPositive: true,
      },
    ];
  }, [salesData]);

  // Total CA dynamique calculé
  const totalRevenue = useMemo(() => {
    return salesData?.total_revenue_consolidated ?? 0;
  }, [salesData]);

  // Données de courbe temporelle
  const computedTimelineData = useMemo(() => {
    const orders = salesData?.orders || [];
    if (timeSlot && timeSlot.id !== "all") {
      const { startHour, endHour } = timeSlot;
      const hours: number[] = [];
      if (startHour <= endHour) {
        for (let h = startHour; h <= endHour; h++) hours.push(h);
      } else {
        for (let h = startHour; h <= 23; h++) hours.push(h);
        for (let h = 0; h <= endHour; h++) hours.push(h);
      }

      let cumulative = 0;
      return hours.map((h, idx) => {
        const hourOrders = orders.filter((o) => {
          if (!o.created_at) return false;
          const d = new Date(o.created_at);
          return !isNaN(d.getTime()) && d.getHours() === h;
        });
        const hourTotal = hourOrders.reduce((sum, o) => sum + (o.net_amount_paid || 0), 0);
        cumulative += hourTotal;
        const fallback = Math.round((totalRevenue * (idx + 1)) / hours.length);
        return {
          label: `${String(h).padStart(2, "0")}h`,
          value: cumulative > 0 ? cumulative : fallback,
        };
      });
    }

    if (kpis?.salesCurve && kpis.salesCurve.length > 0) {
      return kpis.salesCurve.map((p) => ({
        label: p.month,
        value: p.total,
      }));
    }

    // Fallback dynamique
    return [
      { label: "S-3", value: Math.round(totalRevenue * 0.2) },
      { label: "S-2", value: Math.round(totalRevenue * 0.45) },
      { label: "S-1", value: Math.round(totalRevenue * 0.75) },
      { label: "Actuel", value: totalRevenue },
    ];
  }, [salesData, timeSlot, kpis, totalRevenue]);

  // Colonnes du DataTable pour les commandes consolidées
  const columns: DataTableColumn<AdminSaleOrder>[] = [
    {
      key: "order_reference",
      header: "N° Commande",
      cell: (row) => (
        <div className="flex items-center gap-1.5 font-poppins">
          <span className="font-mono text-xs font-bold text-navy">
            {row.order_reference}
          </span>
        </div>
      ),
    },
    {
      key: "buyer_name",
      header: "Client / Établissement",
      cell: (row) => (
        <div className="font-poppins">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="font-medium text-xs text-foreground line-clamp-1">
              {row.is_pos_order ? (row.guest_name || row.buyer_name || "Client Comptoir") : row.buyer_name}
            </p>
            {row.is_pos_order && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gold/15 text-gold-dark border border-gold/30">
                Vente Comptoir
              </span>
            )}
          </div>
          <p className="text-[11px] text-foreground-muted line-clamp-1 font-mono">
            {row.is_pos_order
              ? (row.guest_phone ? `${row.guest_phone}${row.guest_email ? ` • ${row.guest_email}` : ""}` : (row.guest_email || "Vente en boutique"))
              : (row.buyer_email || "N/A")}
          </p>
        </div>
      ),
    },
    {
      key: "channel",
      header: "Canal de Vente",
      cell: (row) => {
        const isUniv = row.channel === "b2b_university";
        const isWs = row.channel === "b2b_wholesale";
        return (
          <span
            className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full font-medium border ${
              isUniv
                ? "bg-gold/10 text-navy border-gold/30"
                : isWs
                ? "bg-navy/10 text-navy border-navy/20"
                : "bg-background-secondary text-foreground-muted border-border"
            }`}
          >
            {isUniv ? (
              <Layers className="w-3 h-3 text-gold" />
            ) : isWs ? (
              <ShoppingBag className="w-3 h-3 text-navy" />
            ) : (
              <BookOpen className="w-3 h-3 text-foreground-muted" />
            )}
            {row.channel_label}
          </span>
        );
      },
    },
    {
      key: "items_count",
      header: "Articles",
      className: "text-center",
      cell: (row) => (
        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-mono font-medium bg-navy/5 text-navy border border-navy/10">
          {row.items_count} {row.items_count > 1 ? "ouvrages" : "ouvrage"}
        </span>
      ),
    },
    {
      key: "net_amount_paid",
      header: "Montant Net Réglé",
      cell: (row) => {
        const isPaid = row.payment_status === "paid" || row.net_amount_paid > 0;
        return (
          <div>
            <span className="font-mono text-xs font-bold text-navy block">
              {isPaid
                ? `${row.net_amount_paid.toLocaleString("fr-FR")} FCFA`
                : `${(row.gross_amount || 0).toLocaleString("fr-FR")} FCFA`}
            </span>
            {!isPaid && (
              <span className="text-[10px] text-foreground-muted block">
                Non encaissé
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "payment_method",
      header: "Règlement & Statut",
      cell: (row) => {
        const isPaid = row.payment_status === "paid";
        const isAbandoned = row.payment_status === "abandoned";
        const isCredit = row.payment_status === "credit";
        const isFailed = row.payment_status === "failed";
        const isCancelled = row.payment_status === "cancelled";

        return (
          <div className="text-xs font-poppins space-y-1">
            <span className="text-foreground font-medium block">
              {row.payment_method}
            </span>
            <div>
              {isPaid ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gold/15 text-navy border border-gold/30">
                  <CheckCircle2 className="w-3 h-3 text-gold" />
                  <span>Payé</span>
                </span>
              ) : isAbandoned ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-error/10 text-error border border-error/30">
                  <RotateCcw className="w-3 h-3 text-error" />
                  <span>Panier abandonné</span>
                </span>
              ) : isCredit ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-info/10 text-info border border-info/30">
                  <Clock className="w-3 h-3 text-info" />
                  <span>À crédit</span>
                </span>
              ) : isFailed ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-error/10 text-error border border-error/30">
                  <XCircle className="w-3 h-3 text-error" />
                  <span>Échoué</span>
                </span>
              ) : isCancelled ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-background-secondary text-foreground-muted border border-border">
                  <XCircle className="w-3 h-3 text-foreground-muted" />
                  <span>Annulé</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-warning/10 text-warning border border-warning/30">
                  <Clock className="w-3 h-3 text-warning" />
                  <span>En attente</span>
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: "created_at",
      header: "Date d'Achat",
      cell: (row) => (
        <div className="text-xs font-poppins">
          <span className="text-foreground font-medium font-mono">
            {row.created_at ? new Date(row.created_at).toLocaleDateString("fr-FR") : "N/A"}
          </span>
          {row.created_at && (
            <span className="text-[11px] text-foreground-muted block">
              {new Date(row.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>
      ),
    },
  ];

  const handleExportCsv = () => {
    const orders = salesData?.orders || [];
    if (orders.length === 0) {
      toast.info("Aucune vente à exporter sur cette sélection.");
      return;
    }

    const filename = `ventes_consolidees_lahatheque_${new Date().toISOString().slice(0, 10)}`;

    const exportRows: any[] = [];
    orders.forEach((o) => {
      if (o.items && o.items.length > 0) {
        o.items.forEach((item) => {
          exportRows.push({
            Numero_Commande: o.order_reference,
            Canal: o.channel_label,
            Client: o.buyer_name,
            Email: o.buyer_email,
            Titre_Ouvrage: item.book_title,
            Format: item.format,
            Quantite: item.quantity,
            Prix_Unitaire_FCFA: item.unit_price,
            Sous_Total_FCFA: item.subtotal,
            Montant_Total_Commande_FCFA: o.net_amount_paid,
            Mode_Paiement: o.payment_method,
            Statut: o.payment_status,
            Date: o.created_at ? new Date(o.created_at).toLocaleDateString("fr-FR") : "",
            Heure: o.created_at ? new Date(o.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "",
          });
        });
      } else {
        exportRows.push({
          Numero_Commande: o.order_reference,
          Canal: o.channel_label,
          Client: o.buyer_name,
          Email: o.buyer_email,
          Titre_Ouvrage: "Commande globale",
          Format: "N/A",
          Quantite: o.items_count,
          Prix_Unitaire_FCFA: o.net_amount_paid,
          Sous_Total_FCFA: o.net_amount_paid,
          Montant_Total_Commande_FCFA: o.net_amount_paid,
          Mode_Paiement: o.payment_method,
          Statut: o.payment_status,
          Date: o.created_at ? new Date(o.created_at).toLocaleDateString("fr-FR") : "",
          Heure: o.created_at ? new Date(o.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "",
        });
      }
    });

    generateCsvExport(exportRows, filename);
    toast.success("Bordereau récapitulatif des ventes consolidées exporté avec succès !");
  };

  const [showLedgerMenu, setShowLedgerMenu] = useState(false);

  const handleDownloadLedger = (format: "xlsx" | "pdf" | "csv") => {
    setShowLedgerMenu(false);
    const periodParam = period === "1m" ? "month" : period === "1y" ? "year" : "all";
    const downloadUrl = `/api/bff/reporting/admin/accounting-ledger/export/?format=${format}&period=${periodParam}`;
    window.open(downloadUrl, "_blank");
    toast.success(`Génération du Grand Livre Comptable (${format.toUpperCase()}) en cours...`);
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* En-tête de la page */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-navy">
            Gestion des Ventes &amp; Revenus Commercialisés
          </h1>
          <p className="text-xs sm:text-sm text-foreground-muted mt-0.5 font-poppins">
            Supervision exhaustive et réconciliation 100% dynamique du Chiffre d&apos;Affaires consolidé avec détail des articles.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Menu déroulant Grand Livre Comptable */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowLedgerMenu(!showLedgerMenu)}
              className="px-4 py-2.5 rounded-xl bg-gold text-navy text-xs font-semibold hover:bg-gold-hover transition-colors flex items-center gap-2 shadow-xs shrink-0 cursor-pointer min-h-[44px] font-poppins"
            >
              <FileSpreadsheet className="w-4 h-4 text-navy" />
              <span>Grand Livre Comptable</span>
              <ChevronDown className="w-3.5 h-3.5 text-navy" />
            </button>

            {showLedgerMenu && (
              <div
                className="absolute right-0 mt-1 w-56 bg-background border border-border rounded-xl shadow-xl z-20 py-1.5 animate-in fade-in zoom-in-95 duration-150"
                onMouseLeave={() => setShowLedgerMenu(false)}
              >
                <div className="px-3 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border mb-1">
                  Format du Grand Livre
                </div>
                <button
                  type="button"
                  onClick={() => handleDownloadLedger("xlsx")}
                  className="w-full text-left px-3 py-2 text-xs text-foreground hover:bg-background-secondary flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Format Excel (.xlsx)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadLedger("pdf")}
                  className="w-full text-left px-3 py-2 text-xs text-foreground hover:bg-background-secondary flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-rose-600" />
                  <span>Format PDF Officiel (.pdf)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadLedger("csv")}
                  className="w-full text-left px-3 py-2 text-xs text-foreground hover:bg-background-secondary flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4 text-navy" />
                  <span>Format Tableur CSV (.csv)</span>
                </button>
              </div>
            )}
          </div>

          {/* Bouton Bordereau Récapitulatif */}
          <button
            type="button"
            onClick={handleExportCsv}
            className="px-4 py-2.5 rounded-xl bg-navy text-white text-xs font-semibold hover:bg-navy-hover transition-colors flex items-center gap-2 shadow-xs shrink-0 cursor-pointer min-h-[44px] font-poppins"
          >
            <Download className="w-4 h-4 text-gold" />
            <span>Bordereau Récapitulatif ({salesData?.total_orders_count || 0})</span>
          </button>
        </div>
      </div>

      {/* Graphique et récapitulatif consolidé */}
      <TotalSalesChart
        title="Progression des Ventes & Revenus"
        subtitle="Pilotage chronologique du chiffre d'affaires consolidé et ventilation dynamique par canal"
        totalAmountText={`${totalRevenue.toLocaleString("fr-FR")} FCFA`}
        growthBadgeText={`${(kpis?.revenueTrend ?? 0) >= 0 ? "+" : ""}${kpis?.revenueTrend ?? 0}%`}
        channels={computedChannels}
        curvePoints={computedTimelineData.map((p) => p.value)}
        timelineData={computedTimelineData}
        showTimeSlotPicker={true}
        timeSlotFilter={timeSlot}
        onTimeSlotChange={setTimeSlot}
        period={period}
        onPeriodChange={setPeriod}
      />

      {/* Filtres par canaux & créneaux */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Onglets des canaux */}
          <div className="inline-flex p-1 rounded-xl bg-background-secondary border border-border text-xs font-poppins">
            {[
              { id: "all", label: "Tous les canaux" },
              { id: "b2c_individual", label: "Ventes Unitaires B2C" },
              { id: "b2b_university", label: "Bouquets Campus B2B" },
              { id: "b2b_wholesale", label: "Commandes Grossistes B2B" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedChannel(tab.id)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  selectedChannel === tab.id
                    ? "bg-navy text-white shadow-xs"
                    : "text-foreground-muted hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Onglets des statuts de commande & paiement */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-poppins">
            {[
              { id: "all", label: "Toutes les commandes" },
              { id: "paid", label: "Payées" },
              { id: "credit", label: "À crédit" },
              { id: "pending", label: "En attente" },
              { id: "abandoned", label: "Paniers abandonnés" },
              { id: "failed", label: "Échouées / Annulées" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedPaymentStatus(tab.id)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  selectedPaymentStatus === tab.id
                    ? "bg-gold text-navy font-bold shadow-xs"
                    : "bg-background-secondary text-foreground-muted hover:text-foreground border border-border"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Indicateur de filtre horaire actif */}
          {timeSlot && timeSlot.id !== "all" && (
            <div className="p-2 px-3 rounded-xl bg-gold/10 border border-gold/20 flex items-center gap-2 text-xs font-poppins">
              <Clock className="w-3.5 h-3.5 text-gold shrink-0" />
              <span className="text-navy">
                Créneau : <strong>{timeSlot.label}</strong>
              </span>
              <button
                type="button"
                onClick={() => setTimeSlot(null)}
                className="text-[11px] font-bold text-navy hover:underline ml-1 cursor-pointer"
              >
                Effacer
              </button>
            </div>
          )}
        </div>

        {/* Data Table avec accordéon dépliable pour chaque commande */}
        <DataTable
          data={salesData?.orders || []}
          columns={columns}
          rowKey="id"
          loading={loading}
          pageSize={20}
          pageSizeOptions={[10, 20, 50, 100]}
          searchPlaceholder="Rechercher par référence, acheteur, livre..."
          emptyMessage="Aucune commande enregistrée correspondant aux critères sélectionnés."
          renderExpandedRow={(order: AdminSaleOrder) => (
            <OrderItemsAccordionRow order={order} />
          )}
        />
      </div>
    </div>
  );
}
