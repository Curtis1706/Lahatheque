"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  ExternalLink,
  Key,
  Layers,
  LogOut,
  Radio,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  Trash2,
  User,
  Zap,
  FileUp,
  FileText,
  AlertTriangle,
  GraduationCap,
  Sparkles,
  Eye,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  getPartnerReaderSessions,
  revokePartnerReaderSession,
  PartnerReaderSessionItem,
} from "@/lib/services/admin";
import { KpiMetricCard } from "@/components/ui/kpi-metric-card";
import { ViewModeToggle, ViewMode } from "@/components/ui/view-mode-toggle";

export default function AdminHostedSessionsPage() {
  const [sessions, setSessions] = useState<PartnerReaderSessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sessionToRevoke, setSessionToRevoke] = useState<PartnerReaderSessionItem | null>(null);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const data = await getPartnerReaderSessions();
      setSessions(data);
    } catch (err) {
      toast.error("Erreur lors de la récupération des sessions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const confirmRevoke = async () => {
    if (!sessionToRevoke) return;
    try {
      await revokePartnerReaderSession(sessionToRevoke.id);
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionToRevoke.id ? { ...s, status: "revoked" as const } : s
        )
      );
      toast.success("Session révoquée avec succès", {
        description: `La session de ${sessionToRevoke.userName} a été interrompue.`,
      });
      setSessionToRevoke(null);
    } catch (err) {
      toast.error("Erreur lors de la révocation de la session.");
    }
  };

  const activeCount = sessions.filter(
    (s) => s.status === "in_progress" || s.status === "opened"
  ).length;
  const byodCount = sessions.filter((s) => s.sourceType === "external_url").length;
  const finishedCount = sessions.filter((s) => s.status === "finished").length;

  const filteredSessions = sessions.filter((s) => {
    const matchesSearch =
      s.documentTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.partnerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.userIp.includes(searchQuery);

    let matchesFilter = true;
    if (filterStatus === "live") {
      matchesFilter = s.status === "in_progress" || s.status === "opened";
    } else if (filterStatus === "byod") {
      matchesFilter = s.sourceType === "external_url";
    } else if (filterStatus === "catalog") {
      matchesFilter = s.sourceType === "catalog_book";
    } else if (filterStatus === "finished") {
      matchesFilter = s.status === "finished";
    } else if (filterStatus === "revoked") {
      matchesFilter = s.status === "revoked";
    }

    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status: PartnerReaderSessionItem["status"]) => {
    switch (status) {
      case "in_progress":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            En lecture
          </span>
        );
      case "opened":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-600 border border-blue-500/30">
            Ouverte
          </span>
        );
      case "finished":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-navy/10 text-navy border border-navy/20">
            <CheckCircle2 className="w-3 h-3 text-gold" />
            Terminée
          </span>
        );
      case "revoked":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500/15 text-red-600 border border-red-500/30">
            Révoquée
          </span>
        );
      case "expired":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-foreground-muted/15 text-foreground-muted">
            Expirée
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* En-tête de la page */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] uppercase tracking-wider font-bold bg-gold/15 text-gold border border-gold/30">
              Supervision en Direct
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-navy mt-1">
            Sessions de Lecture Hébergées
          </h1>
          <p className="text-xs sm:text-sm text-foreground-secondary">
            Supervisez les flux de lecture actifs chez vos partenaires et révoquez les accès suspects en temps réel.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={loadSessions}
            className="p-2.5 rounded-xl border border-border bg-background hover:bg-background-secondary text-foreground transition-all cursor-pointer"
            title="Actualiser la liste"
          >
            <RefreshCw className={`w-4 h-4 text-gold ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Onglets de navigation segmentés */}
      <div className="flex items-center gap-1.5 p-1 bg-background-secondary rounded-xl border border-border overflow-x-auto">
        <Link
          href="/admin/api"
          className="px-4 py-2 rounded-lg text-xs font-semibold text-foreground-secondary hover:text-foreground flex items-center gap-2 shrink-0 transition-all"
        >
          <Key className="w-3.5 h-3.5 text-gold" />
          <span>Clés API & Identifiants</span>
        </Link>
        <Link
          href="/admin/api/sessions"
          className="px-4 py-2 rounded-lg text-xs font-bold bg-background text-navy shadow-sm border border-border flex items-center gap-2 shrink-0 transition-all"
        >
          <Radio className="w-3.5 h-3.5 text-emerald-600" />
          <span>Sessions de Lecture Hébergées</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-navy/10 text-navy font-mono font-bold">
            {sessions.length}
          </span>
        </Link>
        <Link
          href="/admin/api/logs"
          className="px-4 py-2 rounded-lg text-xs font-semibold text-foreground-secondary hover:text-foreground flex items-center gap-2 shrink-0 transition-all"
        >
          <FileText className="w-3.5 h-3.5 text-blue-500" />
          <span>Journaux des Requêtes API</span>
        </Link>
      </div>

      {/* KPI Cards (Composants 21st.dev adaptés) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiMetricCard
          label="Lectures Actives"
          value={activeCount}
          caption="Apprenants connectés"
          tone="emerald"
          icon={<Radio className="w-4 h-4 animate-pulse text-emerald-600" />}
        />
        <KpiMetricCard
          label="Documents Externes"
          value={byodCount}
          caption="Fichiers partenaires distants"
          tone="blue"
          icon={<FileUp className="w-4 h-4 text-blue-500" />}
        />
        <KpiMetricCard
          label="Lectures Terminées"
          value={finishedCount}
          caption="Sessions clôturées"
          tone="default"
          icon={<CheckCircle2 className="w-4 h-4 text-gold" />}
        />
        <KpiMetricCard
          label="Total Enregistré"
          value={sessions.length}
          caption="Historique des sessions"
          tone="gold"
          icon={<Layers className="w-4 h-4 text-gold" />}
        />
      </div>

      {/* Barre de Recherche, Filtres et Sélecteur Grille / Liste (Composant 21st.dev ViewModeToggle) */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-background-secondary p-3 rounded-2xl border border-border">
        <div className="flex flex-col sm:flex-row items-center gap-3 flex-1">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" />
            <input
              type="text"
              placeholder="Rechercher étudiant, livre, IP, partenaire..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-gold text-foreground placeholder:text-foreground-muted"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
            {[
              { id: "all", label: "Toutes les sessions" },
              { id: "live", label: "En lecture" },
              { id: "byod", label: "Documents Externes" },
              { id: "catalog", label: "Catalogue LAHA" },
              { id: "finished", label: "Terminées" },
              { id: "revoked", label: "Révoquées" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterStatus(f.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  filterStatus === f.id
                    ? "bg-navy text-white shadow-sm"
                    : "bg-background text-foreground-secondary hover:text-foreground border border-border"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sélecteur Grille / Liste 21st.dev */}
        <ViewModeToggle value={viewMode} onChange={setViewMode} />
      </div>

      {/* Liste / Grille des Sessions de Lecture */}
      {loading ? (
        <div className="p-12 text-center rounded-2xl bg-background-secondary border border-border space-y-3">
          <Loader2 className="w-8 h-8 text-gold animate-spin mx-auto" />
          <p className="text-sm font-semibold text-navy">Chargement des sessions de lecture...</p>
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-background-secondary border border-border space-y-3">
          <div className="w-12 h-12 rounded-full bg-navy/10 flex items-center justify-center text-navy mx-auto">
            <Radio className="w-6 h-6 text-gold" />
          </div>
          <h3 className="text-base font-bold text-navy">Aucune session active</h3>
          <p className="text-xs text-foreground-secondary max-w-sm mx-auto">
            Aucune session de lecture ne correspond à vos filtres actuels.
          </p>
        </div>
      ) : viewMode === "grid" ? (
        /* ================= VUE GRILLE (CARTES DÉTAILLÉES) ================= */
        <div className="space-y-3">
          {filteredSessions.map((session) => (
            <div
              key={session.id}
              className="p-4 rounded-2xl bg-background-secondary border border-border shadow-sm hover:border-border-hover transition-colors space-y-3"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                {/* Info Principale */}
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-navy">
                      {session.id}
                    </span>
                    {getStatusBadge(session.status)}
                    {session.sourceType === "external_url" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20">
                        <FileUp className="w-3 h-3" />
                        Document Externe Partenaire
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-500/10 text-purple-600 border border-purple-500/20">
                        <BookOpen className="w-3 h-3" />
                        Catalogue LAHA
                      </span>
                    )}
                    <span className="text-[11px] text-foreground-secondary">
                      Partenaire : <strong className="text-foreground">{session.partnerName}</strong>
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-gold shrink-0" />
                    {session.documentTitle}
                  </h3>
                </div>

                {/* Boutons d'Action & Révocation */}
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/read/${session.tokenDemo}`}
                    target="_blank"
                    className="px-3 py-1.5 rounded-xl bg-navy text-white text-xs font-semibold hover:bg-navy-dark transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    <Eye className="w-3.5 h-3.5 text-gold" />
                    <span>Tester Lecteur</span>
                    <ExternalLink className="w-3 h-3 opacity-70" />
                  </Link>

                  {session.status !== "revoked" && (
                    <button
                      onClick={() => setSessionToRevoke(session)}
                      className="px-3 py-1.5 rounded-xl border border-red-500/30 text-red-600 hover:bg-red-500/10 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                      title="Révoquer l'accès immédiatement"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Révoquer</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Détails Utilisateur et Télémétrie */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 p-3 rounded-xl bg-background border border-border text-xs">
                {/* Utilisateur */}
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-foreground-muted tracking-wider">
                    Apprenant
                  </span>
                  <div className="font-semibold text-foreground flex items-center gap-1">
                    <User className="w-3 h-3 text-gold" />
                    {session.userName}
                  </div>
                  <div className="text-[11px] text-foreground-secondary font-mono">
                    {session.userEmail}
                  </div>
                </div>

                {/* IP & Empreinte */}
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-foreground-muted tracking-wider">
                    IP & Sécurité
                  </span>
                  <div className="font-mono text-foreground font-semibold flex items-center gap-1">
                    <Shield className="w-3 h-3 text-emerald-600" />
                    {session.userIp}
                  </div>
                  <div className="text-[11px] text-foreground-secondary flex items-center gap-1">
                    <Clock className="w-3 h-3 text-gold" />
                    {session.createdAt}
                  </div>
                </div>

                {/* Progression de Lecture */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-foreground-secondary font-medium">Progression</span>
                    <span className="font-bold text-navy font-mono">
                      {session.progressPercent}%
                    </span>
                  </div>
                  <div className="w-full bg-background-secondary rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-gold h-full rounded-full transition-all duration-300"
                      style={{ width: `${session.progressPercent}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-foreground-muted">
                    Page {session.currentPage} sur {session.totalPages} • {session.readingTimeMinutes} min
                  </div>
                </div>

                {/* Quiz & Évaluation */}
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-foreground-muted tracking-wider">
                    Évaluation / Quiz
                  </span>
                  {session.quizCompleted ? (
                    <div className="flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="font-bold text-emerald-600 font-mono">
                        {session.quizScore !== null ? `${session.quizScore}%` : "Validé"}
                      </span>
                    </div>
                  ) : (
                    <div className="text-foreground-muted text-[11px]">
                      Non complété
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ================= VUE LISTE (TABLEAU COMPACT) ================= */
        <div className="rounded-2xl bg-background-secondary border border-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-background text-foreground-secondary">
                  <th className="py-3 px-4 font-semibold">ID & Statut</th>
                  <th className="py-3 px-4 font-semibold">Document & Partenaire</th>
                  <th className="py-3 px-4 font-semibold">Apprenant</th>
                  <th className="py-3 px-4 font-semibold">Progression</th>
                  <th className="py-3 px-4 font-semibold">Temps</th>
                  <th className="py-3 px-4 font-semibold">Quiz</th>
                  <th className="py-3 px-4 font-semibold">Date</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredSessions.map((s) => (
                  <tr key={s.id} className="hover:bg-background/60 transition-colors">
                    <td className="py-3 px-4 font-mono">
                      <div className="font-bold text-navy">{s.id.substring(0, 12)}</div>
                      <div className="mt-0.5">{getStatusBadge(s.status)}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-foreground line-clamp-1 max-w-xs flex items-center gap-1">
                        <BookOpen className="w-3 h-3 text-gold shrink-0" />
                        {s.documentTitle}
                      </div>
                      <div className="text-[11px] text-foreground-secondary">{s.partnerName}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-navy flex items-center gap-1">
                        <User className="w-3 h-3 text-gold" />
                        {s.userName}
                      </div>
                      <div className="text-[10px] text-foreground-muted font-mono">{s.userIp}</div>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <div className="font-bold text-navy">{s.progressPercent}%</div>
                      <div className="text-[10px] text-foreground-muted">p. {s.currentPage}/{s.totalPages}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-foreground-secondary">
                      {s.readingTimeMinutes} min
                    </td>
                    <td className="py-3 px-4">
                      {s.quizCompleted ? (
                        <span className="font-bold text-emerald-600 font-mono text-[11px]">
                          {s.quizScore !== null ? `${s.quizScore}%` : "Validé"}
                        </span>
                      ) : (
                        <span className="text-foreground-muted text-[10px]">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-foreground-secondary whitespace-nowrap">
                      {s.createdAt}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/read/${s.tokenDemo}`}
                          target="_blank"
                          className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-navy text-white hover:bg-navy-dark transition-all inline-flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3 text-gold" />
                          <span>Tester</span>
                        </Link>
                        {s.status !== "revoked" && (
                          <button
                            onClick={() => setSessionToRevoke(s)}
                            className="p-1 rounded-lg text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-colors cursor-pointer"
                            title="Révoquer la session"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modale de Confirmation de Révocation de Session */}
      {sessionToRevoke && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-600 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-navy">Interrompre cette session ?</h3>
              <p className="text-xs text-foreground-secondary">
                L'accès de l'étudiant <strong className="text-foreground">{sessionToRevoke.userName}</strong> ({sessionToRevoke.userEmail}) sera instantanément fermé et le token révoqué.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border text-xs font-semibold">
              <button
                onClick={() => setSessionToRevoke(null)}
                className="px-4 py-2 rounded-xl border border-border hover:bg-background-secondary transition-all cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={confirmRevoke}
                className="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Révoquer la Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
