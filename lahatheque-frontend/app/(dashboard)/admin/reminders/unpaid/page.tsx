"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { getAdminReminders } from "@/lib/services/admin";
import { AdminReminder } from "@/lib/types/admin";
import { StatusBadge } from "@/components/ui/status-badge";
import { toast } from "sonner";

export default function AdminUnpaidRemindersPage() {
  const [data, setData] = useState<AdminReminder[]>([]);

  useEffect(() => {
    getAdminReminders().then((items) =>
      setData(items.filter((i) => i.type === "unpaid_invoice" || i.type === "expiring_subscription"))
    );
  }, []);

  const handleSend = (id: string, email: string) => {
    setData((prev) => prev.map((r) => (r.id === id ? { ...r, status: "sent" } : r)));
    toast.success(`Notification de relance transmise à ${email}`);
  };

  const columns: DataTableColumn<AdminReminder>[] = [
    {
      key: "entity_name",
      header: "Client / Établissement",
      cell: (row) => (
        <div>
          <p className="font-semibold text-xs text-foreground">{row.entity_name}</p>
          <p className="text-[11px] text-foreground-muted">{row.target_email}</p>
        </div>
      ),
    },
    {
      key: "amount_or_count",
      header: "Facture / Montant en Retard",
      cell: (row) => <span className="text-xs font-mono font-bold text-error">{row.amount_or_count}</span>,
    },
    {
      key: "days_overdue",
      header: "Jours d'Échéance",
      cell: (row) => (
        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-warning/15 text-gold-dark">
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
        <button
          onClick={() => handleSend(row.id, row.target_email)}
          className="px-3 py-1 rounded-lg bg-navy text-white text-xs font-semibold hover:bg-navy-hover transition-colors inline-flex items-center gap-1"
        >
          <Send className="w-3 h-3 text-gold" /> Relancer Impayé
        </button>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      <div>
        <Link
          href="/admin/reminders"
          className="inline-flex items-center gap-1 text-xs font-medium text-gold hover:text-gold-dark mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Retour aux Relances
        </Link>
        <div className="pb-4 border-b border-border">
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-navy">
            Relances — Impayés & Abonnements Expirants
          </h1>
          <p className="text-xs sm:text-sm text-foreground-muted mt-0.5">
            Centre de gestion des notifications financières pour les universités, grossistes et clients individuels.
          </p>
        </div>
      </div>

      <DataTable data={data} columns={columns} rowKey="id" />
    </div>
  );
}
