"use client";

import React, { useEffect, useState } from "react";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { getAdminReminders } from "@/lib/services/admin";
import { AdminReminder } from "@/lib/types/admin";
import { BellRing, Send, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";

export default function AdminRemindersPage() {
  const [reminders, setReminders] = useState<AdminReminder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRemindersData() {
      try {
        setLoading(true);
        const data = await getAdminReminders();
        setReminders(data);
      } catch (err) {
        toast.error("Erreur de chargement des relances.");
      } finally {
        setLoading(false);
      }
    }
    loadRemindersData();
  }, []);

  const handleSendReminder = (id: string, email: string) => {
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "sent" } : r))
    );
    toast.success(`E-mail de relance transmis avec succès à ${email} !`);
  };

  const columns: DataTableColumn<AdminReminder>[] = [
    {
      key: "entity_name",
      header: "Entité / Destinataire",
      cell: (row) => (
        <div>
          <p className="font-semibold text-xs text-foreground">{row.entity_name}</p>
          <p className="text-[11px] text-foreground-muted">{row.target_email}</p>
        </div>
      ),
    },
    {
      key: "type",
      header: "Motif de Relance",
      cell: (row) => (
        <span className="text-xs px-2.5 py-0.5 rounded-full bg-navy-light text-navy font-semibold">
          {row.type === "pending_deposit"
            ? "Dépôt / Maquette en attente"
            : row.type === "unpaid_invoice"
            ? "Facture / Impayé B2B"
            : row.type === "expiring_subscription"
            ? "Expiration Abonnement"
            : "Contrat à signer"}
        </span>
      ),
    },
    {
      key: "amount_or_count",
      header: "Détail",
      cell: (row) => (
        <span className="text-xs font-mono font-medium text-foreground">
          {row.amount_or_count || "N/A"}
        </span>
      ),
    },
    {
      key: "days_overdue",
      header: "Retard",
      cell: (row) => (
        <span
          className={`font-mono text-xs font-bold px-2 py-0.5 rounded-md ${
            row.days_overdue > 15
              ? "bg-error/15 text-error"
              : row.days_overdue > 0
              ? "bg-warning/15 text-gold-dark"
              : "bg-background border border-border text-foreground-muted"
          }`}
        >
          {row.days_overdue > 0 ? `${row.days_overdue} jours` : "À l'échéance"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Statut",
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "actions",
      header: "Action",
      className: "text-right",
      cell: (row) => (
        <div className="flex items-center justify-end">
          <button
            onClick={() => handleSendReminder(row.id, row.target_email)}
            className="px-3 py-1 rounded-lg bg-navy text-white text-xs font-semibold hover:bg-navy-hover transition-colors flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5 text-gold" /> Relancer
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-navy">
            Relances Automatiques & Suivi des Retards
          </h1>
          <p className="text-xs sm:text-sm text-foreground-muted mt-0.5">
            Centre de relances pour les dépôts en attente de maquette et les factures B2B impayées.
          </p>
        </div>
      </div>

      <DataTable
        data={reminders}
        columns={columns}
        rowKey="id"
        loading={loading}
        filterKey="type"
        filterOptions={[
          { value: "all", label: "Toutes les relances" },
          { value: "pending_deposit", label: "Dépôts en attente" },
          { value: "unpaid_invoice", label: "Factures impayées" },
          { value: "expiring_subscription", label: "Expirations" },
        ]}
        filterPlaceholder="Filtrer par motif..."
        searchPlaceholder="Rechercher par entité ou e-mail..."
      />
    </div>
  );
}
