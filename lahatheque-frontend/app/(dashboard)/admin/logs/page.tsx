"use client";

import React, { useEffect, useState } from "react";
import { Activity } from "lucide-react";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { getAdminLogs } from "@/lib/services/admin";
import { AdminAccessLog } from "@/lib/types/admin";

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AdminAccessLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdminLogs()
      .then(setLogs)
      .finally(() => setLoading(false));
  }, []);

  const columns: DataTableColumn<AdminAccessLog>[] = [
    {
      key: "timestamp",
      header: "Date",
      cell: (row) => (
        <span className="text-xs text-foreground-muted font-mono">
          {row.timestamp ? new Date(row.timestamp).toLocaleString("fr-FR") : "—"}
        </span>
      ),
    },
    {
      key: "user_email",
      header: "Administrateur",
      cell: (row) => (
        <div>
          <p className="text-xs font-semibold text-foreground">{row.user_email}</p>
          <p className="text-[10px] text-foreground-muted uppercase">{row.user_role}</p>
        </div>
      ),
    },
    {
      key: "action_type",
      header: "Action",
      cell: (row) => (
        <span className="text-xs px-2 py-0.5 rounded-full bg-navy-light text-navy font-semibold">
          {row.action_type}
        </span>
      ),
    },
    {
      key: "resource",
      header: "Ressource",
      cell: (row) => <span className="text-xs text-foreground">{row.resource}</span>,
      hideOnMobile: true,
    },
    {
      key: "ip_address",
      header: "IP & Pays",
      cell: (row) => (
        <span className="font-mono text-xs text-foreground-muted">
          {row.ip_address} · {row.country}
        </span>
      ),
      hideOnMobile: true,
    },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="pb-4 border-b border-border">
        <h1 className="text-xl sm:text-2xl font-bold font-serif text-navy flex items-center gap-2">
          <Activity className="w-5 h-5 text-gold" />
          Journal d&apos;Audit Système
        </h1>
        <p className="text-xs sm:text-sm text-foreground-muted mt-0.5">
          Historique complet des actions administratives effectuées sur la plateforme.
        </p>
      </div>

      <DataTable
        data={logs}
        columns={columns}
        rowKey="id"
        loading={loading}
        searchPlaceholder="Rechercher par administrateur, action ou ressource..."
        emptyMessage="Aucune entrée d'audit trouvée."
      />
    </div>
  );
}
