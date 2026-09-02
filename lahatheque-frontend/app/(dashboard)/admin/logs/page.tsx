"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  Activity,
  Terminal,
  RefreshCw,
  Eye,
  X,
  Radio,
  SlidersHorizontal,
  Table as TableIcon,
  Layers,
  Clock,
  UserCheck,
  ShieldCheck,
} from "lucide-react";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { DataStream, DataStreamEntry } from "@/components/ui/data-stream";
import { getAdminLogs } from "@/lib/services/admin";
import { AdminAccessLog } from "@/lib/types/admin";

function getActionTypeCategory(action: string): "info" | "warning" | "error" | "success" {
  const upper = action.toUpperCase();
  if (upper.includes("DELETE") || upper.includes("REJECT") || upper.includes("REVOKE")) {
    return "error";
  }
  if (upper.includes("CREATE") || upper.includes("PUBLISH") || upper.includes("APPROVE") || upper.includes("SUCCESS")) {
    return "success";
  }
  if (upper.includes("RESET") || upper.includes("UPDATE") || upper.includes("SUSPEND") || upper.includes("TOGGLE")) {
    return "warning";
  }
  return "info";
}

function ActionBadge({ action }: { action: string }) {
  const category = getActionTypeCategory(action);
  const colorMap = {
    success: "bg-success/10 text-success border-success/20",
    warning: "bg-warning/10 text-warning border-warning/20",
    error: "bg-error/10 text-error border-error/20",
    info: "bg-navy/5 text-navy border-border",
  };

  return (
    <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-mono font-bold border ${colorMap[category]}`}>
      {action}
    </span>
  );
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AdminAccessLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [liveStreamActive, setLiveStreamActive] = useState(true);
  const [viewMode, setViewMode] = useState<"split" | "terminal" | "table">("split");
  const [selectedLog, setSelectedLog] = useState<AdminAccessLog | null>(null);

  const fetchLogs = useCallback(async (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    try {
      const data = await getAdminLogs();
      setLogs(data);
    } catch {
      // Ignorer l'erreur réseau en arrière-plan
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Polling temps réel si Live Stream activé (toutes les 6 secondes)
  useEffect(() => {
    if (!liveStreamActive) return;
    const interval = setInterval(() => {
      fetchLogs(true);
    }, 6000);
    return () => clearInterval(interval);
  }, [liveStreamActive, fetchLogs]);

  // Conversion des logs en entrées DataStream pour le terminal
  const streamEntries: DataStreamEntry[] = logs.slice(0, 30).map((log) => {
    const timeStr = log.timestamp
      ? new Date(log.timestamp).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      : "--:--:--";
    const category = getActionTypeCategory(log.action_type);
    const detailSnippet = log.details ? ` [${log.details}]` : "";
    return {
      timestamp: timeStr,
      type: category,
      text: `[${log.user_email}] ${log.action_type} ➔ ${log.resource} (${log.ip_address} · ${log.country || "BJ"})${detailSnippet}`,
    };
  });

  const handleTerminalEntryClick = (entry: DataStreamEntry, index: number) => {
    const matchingLog = logs[index];
    if (matchingLog) {
      setSelectedLog(matchingLog);
    }
  };

  // KPIs calculés
  const uniqueAdmins = Array.from(new Set(logs.map((l) => l.user_email))).length;
  const lastLogDate = logs[0]?.timestamp ? new Date(logs[0].timestamp).toLocaleString("fr-FR") : "—";

  const columns: DataTableColumn<AdminAccessLog>[] = [
    {
      key: "timestamp",
      header: "Date & Heure",
      className: "min-w-[160px]",
      cell: (row) => (
        <span className="text-xs text-foreground-muted font-mono">
          {row.timestamp ? new Date(row.timestamp).toLocaleString("fr-FR") : "—"}
        </span>
      ),
    },
    {
      key: "user_email",
      header: "Administrateur",
      className: "min-w-[200px]",
      cell: (row) => (
        <div>
          <p className="text-xs font-semibold text-navy truncate max-w-[190px]">{row.user_email}</p>
          <p className="text-[10px] font-mono text-foreground-muted uppercase tracking-wider">{row.user_role}</p>
        </div>
      ),
    },
    {
      key: "action_type",
      header: "Action Effectuée",
      className: "min-w-[220px]",
      cell: (row) => <ActionBadge action={row.action_type} />,
    },
    {
      key: "resource",
      header: "Ressource Ciblée",
      className: "min-w-[220px]",
      cell: (row) => (
        <span className="text-xs font-mono text-foreground truncate max-w-[220px] block" title={row.resource}>
          {row.resource}
        </span>
      ),
      hideOnMobile: true,
    },
    {
      key: "ip_address",
      header: "IP & Origine",
      className: "min-w-[140px]",
      cell: (row) => (
        <span className="font-mono text-xs text-foreground-muted">
          {row.ip_address} · {row.country || "BJ"}
        </span>
      ),
      hideOnMobile: true,
    },
    {
      key: "id",
      header: "Détails",
      className: "min-w-[80px] text-right",
      cell: (row) => (
        <button
          type="button"
          onClick={() => setSelectedLog(row)}
          className="inline-flex items-center justify-center p-2 rounded-xl text-navy hover:text-gold hover:bg-gold/10 transition-colors"
          title="Inspecter le log complet"
        >
          <Eye className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2 text-xs text-foreground-muted mb-1">
            <span>Administration</span>
            <span>/</span>
            <span className="text-navy font-semibold">Sécurité & Audit</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-navy flex items-center gap-2.5">
            <Activity className="w-6 h-6 text-gold" />
            Journal d&apos;Audit Système & Flux Live
          </h1>
          <p className="text-xs sm:text-sm text-foreground-muted mt-1">
            Surveillance continue et traçabilité 360° de toutes les actions d&apos;administration sur l&apos;application.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Mode Switcher */}
          <div className="inline-flex rounded-2xl bg-background-secondary border border-border p-1">
            <button
              type="button"
              onClick={() => setViewMode("split")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                viewMode === "split"
                  ? "bg-navy text-white shadow-sm"
                  : "text-foreground-muted hover:text-navy"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Scindée</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("terminal")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                viewMode === "terminal"
                  ? "bg-navy text-white shadow-sm"
                  : "text-foreground-muted hover:text-navy"
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Terminal</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                viewMode === "table"
                  ? "bg-navy text-white shadow-sm"
                  : "text-foreground-muted hover:text-navy"
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
          </div>

          {/* Live Stream Toggle */}
          <button
            type="button"
            onClick={() => setLiveStreamActive(!liveStreamActive)}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl border text-xs font-bold transition-all min-h-[40px] ${
              liveStreamActive
                ? "bg-success/10 border-success/30 text-success"
                : "bg-background-secondary border-border text-foreground-muted hover:text-navy"
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${liveStreamActive ? "animate-pulse text-success" : ""}`} />
            <span>{liveStreamActive ? "Live Stream Actif" : "Stream en Pause"}</span>
          </button>

          {/* Manual Refresh */}
          <button
            type="button"
            onClick={() => fetchLogs(false)}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-2xl bg-background-secondary border border-border text-navy hover:border-gold/40 text-xs font-bold transition-all min-h-[40px]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-gold" : "text-foreground-muted"}`} />
            <span>Actualiser</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 sm:p-5 rounded-3xl bg-background border border-border space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-foreground-muted">Événements Journalisés</span>
            <div className="p-2 rounded-xl bg-gold/10 text-gold border border-gold/20">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="font-serif text-2xl font-bold text-navy">{logs.length}</div>
          <p className="text-[11px] text-foreground-muted">Traces d&apos;audit actives conservées</p>
        </div>

        <div className="p-4 sm:p-5 rounded-3xl bg-background border border-border space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-foreground-muted">Administrateurs Actifs</span>
            <div className="p-2 rounded-xl bg-navy/5 text-navy border border-border">
              <UserCheck className="w-4 h-4 text-gold" />
            </div>
          </div>
          <div className="font-serif text-2xl font-bold text-navy">{uniqueAdmins}</div>
          <p className="text-[11px] text-foreground-muted">Comptes ayant opéré des changements</p>
        </div>

        <div className="p-4 sm:p-5 rounded-3xl bg-background border border-border space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-foreground-muted">Dernière Action Enregistrée</span>
            <div className="p-2 rounded-xl bg-success/10 text-success border border-success/20">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono text-xs font-bold text-navy truncate">{lastLogDate}</div>
          <p className="text-[11px] text-foreground-muted">Synchronisation continue</p>
        </div>
      </div>

      {/* Terminal View */}
      {(viewMode === "split" || viewMode === "terminal") && (
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-gold" />
              <span className="font-serif text-sm font-bold text-navy">Flux Terminal en Direct</span>
            </div>
            <span className="text-[11px] text-foreground-muted">Cliquez sur une ligne pour inspecter</span>
          </div>

          <DataStream
            entries={streamEntries}
            title="FLUX D'AUDIT SYSTÈME LAHATHÈQUE (LIVE STREAM)"
            maxVisible={10}
            streaming={liveStreamActive}
            onEntryClick={handleTerminalEntryClick}
            className="w-full"
          />
        </div>
      )}

      {/* Structured Table View */}
      {(viewMode === "split" || viewMode === "table") && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <TableIcon className="w-4 h-4 text-gold" />
              <span className="font-serif text-sm font-bold text-navy">Journal d&apos;Audit Structuré</span>
            </div>
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
      )}

      {/* Log Inspection Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-background rounded-3xl border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-border bg-background-secondary">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-gold/10 text-gold border border-gold/20">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif text-base font-bold text-navy">Inspection de l&apos;Événement d&apos;Audit</h3>
                  <p className="text-[11px] font-mono text-foreground-muted">ID : {selectedLog.id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="p-2 rounded-full text-foreground-muted hover:text-navy hover:bg-navy/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-2xl bg-background-secondary border border-border space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted">Date & Heure</span>
                  <p className="font-mono text-xs font-semibold text-navy">
                    {selectedLog.timestamp ? new Date(selectedLog.timestamp).toLocaleString("fr-FR") : "—"}
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-background-secondary border border-border space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted">Action Enregistrée</span>
                  <div>
                    <ActionBadge action={selectedLog.action_type} />
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-background-secondary border border-border space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted">Administrateur</span>
                  <p className="text-xs font-bold text-navy">{selectedLog.user_email}</p>
                  <p className="text-[10px] font-mono text-foreground-muted uppercase">{selectedLog.user_role}</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-background-secondary border border-border space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted">Origine Réseau</span>
                  <p className="font-mono text-xs font-semibold text-navy">
                    {selectedLog.ip_address} · {selectedLog.country || "Bénin"}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-background-secondary border border-border space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted">Ressource Impactée</span>
                <p className="font-mono text-xs text-navy break-all">{selectedLog.resource}</p>
              </div>

              {selectedLog.details && (
                <div className="p-4 rounded-2xl bg-navy-dark text-slate-100 border border-navy-hover space-y-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-gold">
                    Détails & Payload d&apos;Exécution
                  </span>
                  <pre className="font-mono text-xs whitespace-pre-wrap break-all text-slate-300 bg-navy/60 p-3 rounded-xl border border-navy-hover">
                    {selectedLog.details}
                  </pre>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-border bg-background-secondary flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2 rounded-2xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors min-h-[40px]"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
