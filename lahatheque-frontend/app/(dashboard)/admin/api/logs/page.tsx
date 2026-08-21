"use client";

import React, { useEffect, useState } from "react";
import { Key } from "lucide-react";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { getPartnerApiLogs, ApiRequestLogItem } from "@/lib/services/admin";

function StatusPill({ status }: { status: number }) {
  const isSuccess = status >= 200 && status < 300;
  const isClientError = status >= 400 && status < 500;
  const color = isSuccess
    ? "bg-emerald-500/10 text-emerald-600"
    : isClientError
    ? "bg-amber-500/10 text-amber-600"
    : status >= 500
    ? "bg-error/10 text-error"
    : "bg-navy-light text-navy";

  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-mono font-semibold ${color}`}>
      {status}
    </span>
  );
}

export default function AdminApiLogsPage() {
  const [logs, setLogs] = useState<ApiRequestLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPartnerApiLogs()
      .then(setLogs)
      .finally(() => setLoading(false));
  }, []);

  const columns: DataTableColumn<ApiRequestLogItem>[] = [
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
      key: "partner",
      header: "Partenaire",
      cell: (row) => <span className="text-xs font-semibold text-navy">{row.partner}</span>,
    },
    {
      key: "endpoint",
      header: "Méthode & Endpoint",
      cell: (row) => (
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono font-bold text-gold uppercase">
            {row.method}
          </span>
          <span className="text-xs font-mono text-foreground truncate max-w-[220px]">
            {row.endpoint}
          </span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Statut",
      cell: (row) => <StatusPill status={row.status} />,
    },
    {
      key: "responseTimeMs",
      header: "Temps de Réponse",
      cell: (row) => (
        <span className="font-mono text-xs text-foreground-muted">
          {row.responseTimeMs} ms
        </span>
      ),
      hideOnMobile: true,
    },
    {
      key: "clientIp",
      header: "IP Cliente",
      cell: (row) => (
        <span className="font-mono text-xs text-foreground-muted">{row.clientIp}</span>
      ),
      hideOnMobile: true,
    },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="pb-4 border-b border-border">
        <h1 className="text-xl sm:text-2xl font-bold font-serif text-navy flex items-center gap-2">
          <Key className="w-5 h-5 text-gold" />
          Logs d&apos;Appels API Partenaires
        </h1>
        <p className="text-xs sm:text-sm text-foreground-muted mt-0.5">
          Historique des requêtes effectuées par les partenaires (éditeurs, universités) via
          l&apos;API REST.
        </p>
      </div>

      <DataTable
        data={logs}
        columns={columns}
        rowKey="id"
        loading={loading}
        searchPlaceholder="Rechercher par partenaire, endpoint ou statut..."
        emptyMessage="Aucun appel API enregistré."
      />
    </div>
  );
}
