"use client";

import React, { useEffect, useState, useMemo } from "react";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  TotalSalesChart,
  TimeSlotFilter,
  Period,
} from "@/components/ui/total-sales-chart";
import {
  getAdminSales,
  getAdminKpis,
  getRevenueCategoryBreakdown,
} from "@/lib/services/admin";
import {
  AdminSale,
  AdminKpi,
  RevenueCategoryBreakdown,
} from "@/lib/types/admin";
import { Download, Clock, X } from "lucide-react";
import { toast } from "sonner";
import { generateCsvExport } from "@/lib/services/export-service";

export default function AdminSalesPage() {
  const [sales, setSales] = useState<AdminSale[]>([]);
  const [kpis, setKpis] = useState<AdminKpi | null>(null);
  const [revenueBreakdown, setRevenueBreakdown] = useState<RevenueCategoryBreakdown[]>([]);
  const [loading, setLoading] = useState(true);

  // État de la plage horaire et de la période
  const [timeSlot, setTimeSlot] = useState<TimeSlotFilter | null>(null);
  const [period, setPeriod] = useState<Period>("1m");

  useEffect(() => {
    async function loadSalesData() {
      try {
        setLoading(true);
        const [salesData, kpisData, breakdownData] = await Promise.all([
          getAdminSales(),
          getAdminKpis(),
          getRevenueCategoryBreakdown(),
        ]);
        setSales(salesData);
        setKpis(kpisData);
        setRevenueBreakdown(breakdownData);
      } catch {
        toast.error("Erreur de chargement des ventes.");
      } finally {
        setLoading(false);
      }
    }
    loadSalesData();
  }, []);

  // Ventes filtrées selon la plage horaire
  const filteredSales = useMemo(() => {
    if (!timeSlot || timeSlot.id === "all") return sales;
    return sales.filter((s) => {
      if (!s.created_at) return true;
      const d = new Date(s.created_at);
      if (isNaN(d.getTime())) return true;
      const h = d.getHours();
      const { startHour, endHour } = timeSlot;
      if (startHour <= endHour) {
        return h >= startHour && h <= endHour;
      } else {
        return h >= startHour || h <= endHour;
      }
    });
  }, [sales, timeSlot]);

  // Montant consolidé selon le créneau
  const computedTotalRevenue = useMemo(() => {
    if (!timeSlot || timeSlot.id === "all") {
      return kpis?.totalRevenue ?? 0;
    }
    return filteredSales.reduce((sum, s) => sum + (s.amount || 0), 0);
  }, [filteredSales, timeSlot, kpis]);

  // Ventilation des canaux selon le créneau
  const computedChannels = useMemo(() => {
    if (!timeSlot || timeSlot.id === "all") {
      return revenueBreakdown.map((c) => ({
        name: c.label,
        amount: c.amount,
        change: `${c.percentage >= 0 ? "+" : ""}${c.percentage}%`,
        isPositive: c.percentage >= 0,
      }));
    }

    const catMap: Record<string, { label: string; amount: number }> = {
      unitaire_digital: { label: "Ventes numériques unitaires", amount: 0 },
      bouquet_institution: { label: "Bouquets Universités (B2B)", amount: 0 },
      abonnement_individuel: { label: "Abonnements Lecteur & Pass", amount: 0 },
      grossiste_papier: { label: "Commandes Grossistes & Réassort", amount: 0 },
      unitaire_papier: { label: "Livres physiques (papier)", amount: 0 },
    };

    filteredSales.forEach((s) => {
      const key = s.type || "unitaire_digital";
      if (!catMap[key]) {
        catMap[key] = { label: key, amount: 0 };
      }
      catMap[key].amount += s.amount || 0;
    });

    const total = Object.values(catMap).reduce((acc, c) => acc + c.amount, 0);

    const activeList = Object.values(catMap).filter((c) => c.amount > 0);
    if (activeList.length === 0) {
      return revenueBreakdown.map((c) => ({
        name: c.label,
        amount: 0,
        change: "0%",
        isPositive: true,
      }));
    }

    return activeList.map((c) => {
      const pct = total > 0 ? Math.round((c.amount / total) * 100) : 0;
      return {
        name: c.label,
        amount: c.amount,
        change: `${pct}%`,
        isPositive: true,
      };
    });
  }, [filteredSales, timeSlot, revenueBreakdown]);

  // Données de courbe temporelle pour la plage horaire
  const computedTimelineData = useMemo(() => {
    if (!timeSlot || timeSlot.id === "all") {
      return (kpis?.salesCurve ?? []).map((p) => ({
        label: p.month,
        value: p.total,
      }));
    }

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
      const hourSales = filteredSales.filter((s) => {
        if (!s.created_at) return false;
        const d = new Date(s.created_at);
        return !isNaN(d.getTime()) && d.getHours() === h;
      });
      const hourTotal = hourSales.reduce((sum, s) => sum + (s.amount || 0), 0);
      cumulative += hourTotal;

      const fallbackVal = Math.round((computedTotalRevenue * (idx + 1)) / hours.length);
      return {
        label: `${String(h).padStart(2, "0")}h`,
        value: cumulative > 0 ? cumulative : fallbackVal,
      };
    });
  }, [timeSlot, filteredSales, kpis, computedTotalRevenue]);

  const columns: DataTableColumn<AdminSale>[] = [
    {
      key: "id",
      header: "N° Commande",
      cell: (row) => <span className="font-mono text-xs font-bold text-navy">{row.order_number || row.id}</span>,
    },
    {
      key: "user_name",
      header: "Acheteur",
      cell: (row) => (
        <div>
          <p className="font-medium text-xs text-foreground">{row.user_name}</p>
          <p className="text-[11px] text-foreground-muted">{row.user_email}</p>
        </div>
      ),
    },
    {
      key: "item",
      header: "Produit / Intitulé",
      cell: (row) => (
        <span className="text-xs text-foreground font-medium">
          {row.book_title || row.subscription_name}
        </span>
      ),
    },
    {
      key: "type",
      header: "Catégorie",
      cell: (row) => (
        <span className="text-xs px-2.5 py-0.5 rounded-full bg-navy/10 text-navy font-semibold border border-navy/20">
          {row.type === "unitaire_digital"
            ? "Livre numérique"
            : row.type === "grossiste_papier"
            ? "Grossiste (Papier)"
            : row.type === "grossiste_numerique"
            ? "Grossiste (Numérique)"
            : row.type === "bouquet_institution"
            ? "Bouquet B2B"
            : row.type === "abonnement_individuel"
            ? "Pass Lecteur"
            : "Livre papier"}
        </span>
      ),
    },
    {
      key: "amount",
      header: "Montant",
      cell: (row) => (
        <span className="font-mono text-xs font-bold text-navy">
          {row.amount.toLocaleString("fr-FR")} {row.currency || "XOF"}
        </span>
      ),
    },
    {
      key: "payment_status",
      header: "Paiement",
      cell: (row) => <StatusBadge status={row.payment_status} />,
    },
    {
      key: "created_at",
      header: "Date & Heure",
      cell: (row) => (
        <div className="font-mono text-xs">
          <span className="text-foreground font-semibold">
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
    if (!filteredSales || filteredSales.length === 0) {
      toast.info("Aucune vente à exporter sur cette sélection.");
      return;
    }

    const slotSuffix = timeSlot && timeSlot.id !== "all" ? `_${timeSlot.startHour}h-${timeSlot.endHour}h` : "";
    const filename = `journal_ventes_lahatheque${slotSuffix}_${new Date().toISOString().slice(0, 10)}`;

    generateCsvExport(
      filteredSales.map((s) => ({
        Numero_Commande: s.order_number || s.id,
        Client: s.user_name || s.buyer_name || s.user_email,
        Email: s.user_email || s.buyer_email || "",
        Article_Achete: s.book_title || s.item_title || s.subscription_name || "Abonnement / Bouquet",
        Type_Produit: s.type || s.item_type || "unitaire",
        Moyen_Paiement: s.payment_method || "Mobile Money",
        Montant_FCFA: s.amount,
        Devise: s.currency || "XOF",
        Statut_Paiement: s.payment_status,
        Date_Transaction: s.created_at ? new Date(s.created_at).toLocaleDateString("fr-FR") : "",
        Heure_Transaction: s.created_at
          ? new Date(s.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
          : "",
        Pays: s.country || "BJ",
      })),
      filename
    );
    toast.success("Journal des ventes exporté avec succès (format UTF-8 BOM pour Excel) !");
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-navy">
            Gestion des Ventes &amp; Revenus Commercialisés
          </h1>
          <p className="text-xs sm:text-sm text-foreground-muted mt-0.5">
            Historique des achats unitaires, abonnements B2C, bouquets universitaires B2B et analyse par plages horaires.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          className="px-4 py-2.5 rounded-xl bg-navy text-white text-xs font-semibold hover:bg-navy-hover transition-colors flex items-center gap-2 shadow-xs shrink-0 cursor-pointer min-h-[44px]"
        >
          <Download className="w-4 h-4 text-gold" />
          Exporter le Journal ({filteredSales.length})
        </button>
      </div>

      {/* Graphique d'évolution des ventes avec sélection de période et de plage horaire */}
      <TotalSalesChart
        title="Progression des Ventes & Revenus"
        subtitle="Pilotage chronologique du chiffre d'affaires et ventilation par canal de vente"
        totalAmountText={`${computedTotalRevenue.toLocaleString("fr-FR")} FCFA`}
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

      {/* Tableau des ventes filtrable */}
      <div className="space-y-3">
        {timeSlot && timeSlot.id !== "all" && (
          <div className="p-3 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-navy">
              <Clock className="w-4 h-4 text-gold shrink-0" />
              <span>
                Filtre horaire actif : <strong>{timeSlot.label}</strong> • Affichage de <strong>{filteredSales.length}</strong> transaction(s)
              </span>
            </div>
            <button
              type="button"
              onClick={() => setTimeSlot(null)}
              className="text-xs font-bold text-navy hover:text-navy-hover underline cursor-pointer"
            >
              Réinitialiser
            </button>
          </div>
        )}

        <DataTable
          data={filteredSales}
          columns={columns}
          rowKey="id"
          loading={loading}
          filterKey="type"
          filterOptions={[
            { value: "all", label: "Toutes les catégories" },
            { value: "unitaire_digital", label: "Ventes numériques unitaires" },
            { value: "bouquet_institution", label: "Bouquets Universités (B2B)" },
            { value: "abonnement_individuel", label: "Pass & Abonnements" },
            { value: "unitaire_papier", label: "Livres physiques (papier)" },
          ]}
          filterPlaceholder="Filtrer par catégorie..."
          searchPlaceholder="Rechercher par client, e-mail ou référence..."
          emptyMessage={
            timeSlot && timeSlot.id !== "all"
              ? "Aucune transaction enregistrée sur cette plage horaire."
              : "Aucune vente enregistrée."
          }
        />
      </div>
    </div>
  );
}
