"use client";

import React, { useEffect, useState, useMemo } from "react";
import { 
  Key, 
  Filter, 
  RotateCcw, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Server, 
  Eye, 
  X, 
  Copy, 
  Check,
  Search
} from "lucide-react";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { getPartnerApiLogs, ApiRequestLogItem } from "@/lib/services/admin";
import { toast } from "sonner";

function StatusPill({ status }: { status: number }) {
  const isSuccess = status >= 200 && status < 300;
  const isClientError = status >= 400 && status < 500;
  const color = isSuccess
    ? "bg-success/10 text-success border border-success/20"
    : isClientError
    ? "bg-warning/10 text-warning border border-warning/20"
    : status >= 500
    ? "bg-error/10 text-error border border-error/20"
    : "bg-background-secondary border border-border text-navy";

  return (
    <span className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-semibold ${color}`}>
      {status}
    </span>
  );
}

function MethodBadge({ method }: { method: string }) {
  const m = method.toUpperCase();
  const color = 
    m === "GET"
      ? "bg-navy/10 text-navy border-navy/20"
      : m === "POST"
      ? "bg-gold/15 text-gold border-gold/30"
      : m === "PUT" || m === "PATCH"
      ? "bg-warning/10 text-warning border-warning/20"
      : m === "DELETE"
      ? "bg-error/10 text-error border-error/20"
      : "bg-background-secondary text-foreground-muted border-border";

  return (
    <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase border ${color}`}>
      {method}
    </span>
  );
}

export default function AdminApiLogsPage() {
  const [logs, setLogs] = useState<ApiRequestLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtres
  const [selectedMethod, setSelectedMethod] = useState<string>("all");
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>("all");
  const [selectedPartner, setSelectedPartner] = useState<string>("all");
  const [selectedStatusGroup, setSelectedStatusGroup] = useState<string>("all");
  
  // Modale de détail
  const [detailLog, setDetailLog] = useState<ApiRequestLogItem | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    getPartnerApiLogs()
      .then(setLogs)
      .finally(() => setLoading(false));
  }, []);

  // Extraction dynamique des endpoints et partenaires uniques
  const uniqueEndpoints = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((log) => {
      if (log.endpoint) set.add(log.endpoint);
    });
    return Array.from(set).sort();
  }, [logs]);

  const uniquePartners = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((log) => {
      const p = log.partner?.trim() || "Accès Public (Sans clé)";
      set.add(p);
    });
    return Array.from(set).sort();
  }, [logs]);

  const availableMethods = ["GET", "POST", "PUT", "PATCH", "DELETE"];

  // Filtrage des données
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Filtre Méthode
      if (selectedMethod !== "all" && log.method.toUpperCase() !== selectedMethod.toUpperCase()) {
        return false;
      }
      // Filtre Endpoint
      if (selectedEndpoint !== "all" && log.endpoint !== selectedEndpoint) {
        return false;
      }
      // Filtre Partenaire
      if (selectedPartner !== "all") {
        const partnerName = log.partner?.trim() || "Accès Public (Sans clé)";
        if (partnerName !== selectedPartner) return false;
      }
      // Filtre Statut
      if (selectedStatusGroup === "2xx" && (log.status < 200 || log.status >= 300)) {
        return false;
      }
      if (selectedStatusGroup === "4xx" && (log.status < 400 || log.status >= 500)) {
        return false;
      }
      if (selectedStatusGroup === "5xx" && log.status < 500) {
        return false;
      }
      return true;
    });
  }, [logs, selectedMethod, selectedEndpoint, selectedPartner, selectedStatusGroup]);

  // KPIs
  const stats = useMemo(() => {
    const total = filteredLogs.length;
    const successes = filteredLogs.filter((l) => l.status >= 200 && l.status < 300).length;
    const errors = filteredLogs.filter((l) => l.status >= 400).length;
    const successRate = total > 0 ? Math.round((successes / total) * 100) : 100;
    const avgResponseTime = total > 0 
      ? Math.round(filteredLogs.reduce((acc, l) => acc + (l.responseTimeMs || 0), 0) / total)
      : 0;

    return { total, successes, errors, successRate, avgResponseTime };
  }, [filteredLogs]);

  const hasActiveFilters = 
    selectedMethod !== "all" || 
    selectedEndpoint !== "all" || 
    selectedPartner !== "all" || 
    selectedStatusGroup !== "all";

  const handleResetFilters = () => {
    setSelectedMethod("all");
    setSelectedEndpoint("all");
    setSelectedPartner("all");
    setSelectedStatusGroup("all");
  };

  const handleCopyPayload = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success("Copié dans le presse-papier");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const columns: DataTableColumn<ApiRequestLogItem>[] = [
    {
      key: "timestamp",
      header: "Date",
      className: "min-w-[150px]",
      cell: (row) => (
        <span className="text-xs text-foreground-muted font-mono">
          {row.timestamp ? new Date(row.timestamp).toLocaleString("fr-FR") : "—"}
        </span>
      ),
    },
    {
      key: "partner",
      header: "Partenaire / Origine",
      className: "min-w-[170px]",
      cell: (row) => {
        const isPublic = !row.partner || row.partner.toLowerCase().includes("non authentifi") || row.partner.toLowerCase().includes("public");
        return isPublic ? (
          <span className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-md bg-navy/5 text-foreground-muted border border-border">
            Accès Public (Sans clé)
          </span>
        ) : (
          <span className="text-xs font-semibold text-navy">{row.partner}</span>
        );
      },
    },
    {
      key: "endpoint",
      header: "Méthode & Endpoint",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <MethodBadge method={row.method} />
          <span className="text-xs font-mono text-foreground truncate max-w-[260px]" title={row.endpoint}>
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
    {
      key: "actions",
      header: "Détails",
      className: "text-right",
      cell: (row) => (
        <button
          type="button"
          onClick={() => setDetailLog(row)}
          title="Voir le détail de la requête"
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-navy/5 hover:bg-gold/10 text-navy hover:text-gold border border-border transition-colors text-xs font-semibold cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Inspecter</span>
        </button>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-navy flex items-center gap-2">
            <Key className="w-5 h-5 text-gold" />
            Logs d&apos;Appels API Partenaires
          </h1>
          <p className="text-xs sm:text-sm text-foreground-muted mt-0.5">
            Historique et surveillance des requêtes effectuées par les partenaires via l&apos;API REST.
          </p>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-background-secondary border border-border hover:border-gold/40 text-navy text-xs font-bold transition-all self-start sm:self-auto cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-gold" />
            Réinitialiser les filtres
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-background border border-border space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-foreground-muted">Requêtes Filtrées</span>
            <Server className="w-4 h-4 text-gold" />
          </div>
          <div className="font-serif text-xl sm:text-2xl font-bold text-navy">{stats.total}</div>
          <p className="text-[10px] text-foreground-muted">sur {logs.length} requêtes totales</p>
        </div>

        <div className="p-4 rounded-2xl bg-background border border-border space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-foreground-muted">Taux de Succès</span>
            <CheckCircle2 className="w-4 h-4 text-success" />
          </div>
          <div className="font-serif text-xl sm:text-2xl font-bold text-success">{stats.successRate}%</div>
          <p className="text-[10px] text-foreground-muted">{stats.successes} réponses 2xx valides</p>
        </div>

        <div className="p-4 rounded-2xl bg-background border border-border space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-foreground-muted">Erreurs Client / Serv.</span>
            <AlertTriangle className={`w-4 h-4 ${stats.errors > 0 ? "text-error" : "text-foreground-muted"}`} />
          </div>
          <div className={`font-serif text-xl sm:text-2xl font-bold ${stats.errors > 0 ? "text-error" : "text-navy"}`}>
            {stats.errors}
          </div>
          <p className="text-[10px] text-foreground-muted">Statuts 4xx et 5xx détectés</p>
        </div>

        <div className="p-4 rounded-2xl bg-background border border-border space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-foreground-muted">Latence Moyenne</span>
            <Clock className="w-4 h-4 text-gold" />
          </div>
          <div className="font-mono text-xl sm:text-2xl font-bold text-navy">{stats.avgResponseTime} ms</div>
          <p className="text-[10px] text-foreground-muted">Temps de traitement serveur</p>
        </div>
      </div>

      {/* Barre de Filtrage Détaillée */}
      <div className="p-4 rounded-2xl bg-background border border-border space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-border">
          <Filter className="w-4 h-4 text-gold" />
          <span className="text-xs font-bold uppercase tracking-wider text-navy">Filtres Spécifiques</span>
        </div>

        {/* 1. Boutons Méthodes HTTP */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-foreground-muted">Méthode HTTP :</label>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedMethod("all")}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                selectedMethod === "all"
                  ? "bg-navy text-white border-navy shadow-xs"
                  : "bg-background-secondary text-foreground-muted hover:text-navy border-border"
              }`}
            >
              Toutes ({logs.length})
            </button>
            {availableMethods.map((m) => {
              const count = logs.filter((l) => l.method.toUpperCase() === m).length;
              if (count === 0 && selectedMethod !== m) return null;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => setSelectedMethod(selectedMethod === m ? "all" : m)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    selectedMethod === m
                      ? "bg-gold text-navy border-gold shadow-xs font-extrabold"
                      : "bg-background-secondary text-foreground-muted hover:text-navy border-border"
                  }`}
                >
                  {m} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Menus déroulants : Endpoint, Partenaire et Statut */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* Endpoint */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-foreground-muted">Filtrer par Endpoint :</label>
            <select
              value={selectedEndpoint}
              onChange={(e) => setSelectedEndpoint(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-background-secondary border border-border text-xs text-navy font-mono font-medium focus:outline-none focus:border-gold transition-colors cursor-pointer"
            >
              <option value="all">Tous les endpoints ({uniqueEndpoints.length})</option>
              {uniqueEndpoints.map((ep) => (
                <option key={ep} value={ep}>
                  {ep}
                </option>
              ))}
            </select>
          </div>

          {/* Partenaire */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-foreground-muted">Filtrer par Partenaire :</label>
            <select
              value={selectedPartner}
              onChange={(e) => setSelectedPartner(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-background-secondary border border-border text-xs text-navy font-semibold focus:outline-none focus:border-gold transition-colors cursor-pointer"
            >
              <option value="all">Tous les partenaires ({uniquePartners.length})</option>
              {uniquePartners.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Statut */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-foreground-muted">Filtrer par Statut HTTP :</label>
            <select
              value={selectedStatusGroup}
              onChange={(e) => setSelectedStatusGroup(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-background-secondary border border-border text-xs text-navy font-semibold focus:outline-none focus:border-gold transition-colors cursor-pointer"
            >
              <option value="all">Tous les codes de statut</option>
              <option value="2xx">Succès (2xx)</option>
              <option value="4xx">Erreurs Client (4xx)</option>
              <option value="5xx">Erreurs Serveur (5xx)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table des résultats */}
      <DataTable
        data={filteredLogs}
        columns={columns}
        rowKey="id"
        loading={loading}
        searchPlaceholder="Recherche libre par IP, payload, mot-clé..."
        emptyMessage="Aucun appel API ne correspond aux filtres sélectionnés."
      />

      {/* Modal Détail Requête */}
      {detailLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-xs">
          <div className="bg-background border border-border rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-6 border-b border-border flex items-center justify-between bg-background-secondary">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <MethodBadge method={detailLog.method} />
                  <span className="font-mono font-bold text-sm text-navy truncate max-w-md">
                    {detailLog.endpoint}
                  </span>
                </div>
                <p className="text-xs text-foreground-muted font-mono">
                  {detailLog.timestamp ? new Date(detailLog.timestamp).toLocaleString("fr-FR") : "—"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetailLog(null)}
                className="p-2 rounded-xl bg-background border border-border hover:bg-navy/5 text-foreground-muted hover:text-navy transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-2xl bg-background-secondary border border-border">
                <div>
                  <span className="text-[10px] font-bold uppercase text-foreground-muted block">Statut HTTP</span>
                  <div className="mt-1"><StatusPill status={detailLog.status} /></div>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-foreground-muted block">Latence</span>
                  <span className="font-mono font-bold text-navy mt-1 block">{detailLog.responseTimeMs} ms</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-foreground-muted block">Partenaire</span>
                  <span className="font-semibold text-navy mt-1 block truncate">{detailLog.partner || "Public"}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-foreground-muted block">IP Cliente</span>
                  <span className="font-mono text-foreground-muted mt-1 block">{detailLog.clientIp || "—"}</span>
                </div>
              </div>

              {/* Request Payload */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-navy text-xs">Payload Requête (Corps / Paramètres) :</span>
                  {detailLog.requestPayload && (
                    <button
                      type="button"
                      onClick={() => handleCopyPayload(detailLog.requestPayload, "req")}
                      className="inline-flex items-center gap-1 text-[11px] text-gold hover:underline cursor-pointer"
                    >
                      {copiedKey === "req" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      Copier
                    </button>
                  )}
                </div>
                <pre className="p-3 rounded-xl bg-navy-dark text-white font-mono text-[11px] overflow-x-auto max-h-48 border border-border">
                  {detailLog.requestPayload || "Aucun payload de requête (GET ou corps vide)."}
                </pre>
              </div>

              {/* Response Payload */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-navy text-xs">Payload Réponse :</span>
                  {detailLog.responsePayload && (
                    <button
                      type="button"
                      onClick={() => handleCopyPayload(detailLog.responsePayload, "res")}
                      className="inline-flex items-center gap-1 text-[11px] text-gold hover:underline cursor-pointer"
                    >
                      {copiedKey === "res" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      Copier
                    </button>
                  )}
                </div>
                <pre className="p-3 rounded-xl bg-navy-dark text-white font-mono text-[11px] overflow-x-auto max-h-48 border border-border">
                  {detailLog.responsePayload || "Réponse binaire ou vide."}
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-border flex justify-end bg-background-secondary">
              <button
                type="button"
                onClick={() => setDetailLog(null)}
                className="px-4 py-2 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors cursor-pointer"
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

