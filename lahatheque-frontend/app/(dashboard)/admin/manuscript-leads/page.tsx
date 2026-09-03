"use client";

import { useEffect, useState, useMemo } from "react";
import { 
  Inbox, 
  Search, 
  FileText, 
  Download, 
  Mail, 
  Phone, 
  MapPin, 
  BookOpen, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  Filter,
  RefreshCw
} from "lucide-react";
import { 
  getManuscriptLeads, 
  updateManuscriptLeadStatus, 
  ManuscriptLead 
} from "@/lib/services/admin";
import { InlineLoader } from "@/components/ui/page-loader";

const STATUS_CONFIG: Record<
  ManuscriptLead["status"],
  { label: string; badgeClass: string; dotClass: string }
> = {
  new: {
    label: "Nouvelle",
    badgeClass: "bg-gold/15 text-gold border border-gold/30",
    dotClass: "bg-gold",
  },
  contacted: {
    label: "Contactée",
    badgeClass: "bg-navy/10 text-navy border border-navy/20",
    dotClass: "bg-navy",
  },
  converted: {
    label: "Compte auteur créé",
    badgeClass: "bg-success/15 text-success border border-success/30",
    dotClass: "bg-success",
  },
  rejected: {
    label: "Non retenue",
    badgeClass: "bg-foreground-muted/10 text-foreground-muted border border-border",
    dotClass: "bg-foreground-muted",
  },
};

export default function AdminManuscriptLeadsPage() {
  const [leads, setLeads] = useState<ManuscriptLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSummaries, setExpandedSummaries] = useState<Record<string, boolean>>({});
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const fetchLeads = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await getManuscriptLeads(statusFilter);
      setLeads(data);
    } catch {
      setFeedback({
        type: "error",
        message: "Impossible de charger les soumissions de manuscrits.",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [statusFilter]);

  const handleStatusChange = async (id: string, newStatus: ManuscriptLead["status"]) => {
    setUpdatingId(id);
    setFeedback(null);
    try {
      const ok = await updateManuscriptLeadStatus(id, newStatus);
      if (ok) {
        setLeads((prev) =>
          prev.map((lead) =>
            lead.id === id
              ? {
                  ...lead,
                  status: newStatus,
                  status_display: STATUS_CONFIG[newStatus].label,
                }
              : lead
          )
        );
        setFeedback({
          type: "success",
          message: `Statut mis à jour : ${STATUS_CONFIG[newStatus].label}`,
        });
        setTimeout(() => setFeedback(null), 3000);
      } else {
        setFeedback({
          type: "error",
          message: "Erreur lors de la mise à jour du statut.",
        });
      }
    } catch {
      setFeedback({
        type: "error",
        message: "Erreur de communication avec le serveur.",
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleSummary = (id: string) => {
    setExpandedSummaries((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredLeads = useMemo(() => {
    if (!searchQuery.trim()) return leads;
    const q = searchQuery.toLowerCase();
    return leads.filter(
      (l) =>
        l.full_name.toLowerCase().includes(q) ||
        l.book_title.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        l.genre.toLowerCase().includes(q) ||
        l.country.toLowerCase().includes(q)
    );
  }, [leads, searchQuery]);

  const countsByStatus = useMemo(() => {
    const counts = { all: leads.length, new: 0, contacted: 0, converted: 0, rejected: 0 };
    leads.forEach((l) => {
      if (counts[l.status] !== undefined) {
        counts[l.status]++;
      }
    });
    return counts;
  }, [leads]);

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="w-full min-h-screen bg-background p-4 sm:p-6 lg:p-8 space-y-6">
      
      {/* En-tête de page */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg bg-gold/15 text-gold flex items-center justify-center">
              <Inbox className="w-4 h-4" />
            </div>
            <h1 className="font-serif text-2xl md:text-3xl font-bold text-navy">
              Manuscrits Reçus (Public)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-foreground-muted">
            Gestion et suivi des propositions de manuscrits soumises via le formulaire public.
          </p>
        </div>

        <button
          onClick={() => fetchLeads(true)}
          disabled={loading || refreshing}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-background hover:bg-background-secondary text-navy text-xs font-semibold shadow-sm transition-colors cursor-pointer self-start sm:self-auto disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-gold ${refreshing ? "animate-spin" : ""}`} />
          <span>Actualiser</span>
        </button>
      </div>

      {/* Message de feedback toast inline */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-medium flex items-center gap-2 animate-in fade-in duration-150 ${
            feedback.type === "success"
              ? "bg-success/10 border-success/30 text-success"
              : "bg-error/10 border-error/30 text-error"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Barre d'outils : Filtres par statut et recherche */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center bg-background-secondary p-4 rounded-2xl border border-border">
        
        {/* Filtres statuts tabs */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: "all", label: "Toutes", count: countsByStatus.all },
            { id: "new", label: "Nouvelles", count: countsByStatus.new },
            { id: "contacted", label: "Contactées", count: countsByStatus.contacted },
            { id: "converted", label: "Converties", count: countsByStatus.converted },
            { id: "rejected", label: "Non retenues", count: countsByStatus.rejected },
          ].map((tab) => {
            const active = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                  active
                    ? "bg-navy text-white shadow-sm"
                    : "bg-background text-foreground-muted hover:text-navy border border-border"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-semibold ${
                    active ? "bg-white/20 text-white" : "bg-background-secondary text-foreground-muted"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Barre de recherche */}
        <div className="relative min-w-[240px] lg:min-w-[300px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par auteur, titre, pays..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-border bg-background text-foreground text-xs focus:outline-none focus:border-navy"
          />
        </div>

      </div>

      {/* Contenu principal : Liste des soumissions */}
      {loading ? (
        <div className="py-16 text-center space-y-3">
          <InlineLoader size={32} />
          <p className="text-xs text-foreground-muted">Chargement des soumissions de manuscrits...</p>
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="bg-background border border-border rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-navy/5 text-navy flex items-center justify-center mx-auto">
            <Inbox className="w-6 h-6 text-gold" />
          </div>
          <h3 className="font-serif text-lg font-bold text-navy">Aucun manuscrit trouvé</h3>
          <p className="text-xs text-foreground-muted max-w-sm mx-auto">
            {searchQuery
              ? "Aucune soumission ne correspond à vos critères de recherche."
              : statusFilter !== "all"
              ? "Aucune soumission dans cette catégorie de statut."
              : "Aucune proposition de manuscrit n'a encore été reçue via le formulaire public."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredLeads.map((lead) => {
            const cfg = STATUS_CONFIG[lead.status] || STATUS_CONFIG.new;
            const isExpanded = Boolean(expandedSummaries[lead.id]);
            const isUpdating = updatingId === lead.id;

            return (
              <div
                key={lead.id}
                className="bg-background border border-border rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-all space-y-4"
              >
                {/* Ligne haute : Titre de l'ouvrage, Statut & Date */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-navy/5 text-navy border border-border">
                        {lead.genre || "Discipline non spécifiée"}
                      </span>
                      {lead.country && (
                        <span className="text-xs text-foreground-muted flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-gold" />
                          {lead.country}
                        </span>
                      )}
                    </div>
                    <h2 className="font-serif text-lg sm:text-xl font-bold text-navy leading-snug">
                      « {lead.book_title} »
                    </h2>
                  </div>

                  <div className="flex items-center gap-3 self-start sm:self-auto shrink-0">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${cfg.badgeClass}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotClass}`} />
                      {cfg.label}
                    </span>
                    <span className="text-[11px] text-foreground-muted flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(lead.created_at)}
                    </span>
                  </div>
                </div>

                {/* Coordonnées de l'auteur */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-background-secondary p-3.5 rounded-xl border border-border text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-foreground-muted block mb-0.5">
                      Auteur
                    </span>
                    <span className="font-semibold text-navy block truncate">
                      {lead.full_name}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-foreground-muted block mb-0.5">
                      Email
                    </span>
                    <a
                      href={`mailto:${lead.email}`}
                      className="font-medium text-navy hover:text-gold flex items-center gap-1.5 truncate"
                    >
                      <Mail className="w-3 h-3 text-gold shrink-0" />
                      <span className="truncate">{lead.email}</span>
                    </a>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-foreground-muted block mb-0.5">
                      Téléphone
                    </span>
                    {lead.phone ? (
                      <a
                        href={`tel:${lead.phone}`}
                        className="font-medium text-navy hover:text-gold flex items-center gap-1.5"
                      >
                        <Phone className="w-3 h-3 text-gold shrink-0" />
                        <span>{lead.phone}</span>
                      </a>
                    ) : (
                      <span className="text-foreground-muted">Non renseigné</span>
                    )}
                  </div>
                </div>

                {/* Résumé / Synopsis de l'ouvrage */}
                {lead.summary && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-navy">
                        Synopsis / Thématique :
                      </span>
                      {lead.summary.length > 200 && (
                        <button
                          type="button"
                          onClick={() => toggleSummary(lead.id)}
                          className="text-xs font-bold text-gold hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          {isExpanded ? (
                            <>
                              <span>Réduire</span>
                              <ChevronUp className="w-3.5 h-3.5" />
                            </>
                          ) : (
                            <>
                              <span>Voir tout le synopsis</span>
                              <ChevronDown className="w-3.5 h-3.5" />
                            </>
                          )}
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-foreground-muted leading-relaxed whitespace-pre-line bg-background p-3 rounded-xl border border-border">
                      {isExpanded || lead.summary.length <= 200
                        ? lead.summary
                        : `${lead.summary.slice(0, 200)}...`}
                    </p>
                  </div>
                )}

                {/* Barre d'action basse : Télécharger le fichier + Changement de statut */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-border">
                  
                  {/* Lien de téléchargement manuscrit */}
                  <div>
                    {lead.manuscript_file_url ? (
                      <a
                        href={lead.manuscript_file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-navy hover:bg-navy-hover text-white text-xs font-bold shadow-sm transition-colors cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 text-gold" />
                        <span>Télécharger le manuscrit</span>
                      </a>
                    ) : (
                      <span className="text-xs text-foreground-muted italic">
                        Aucun fichier joint
                      </span>
                    )}
                  </div>

                  {/* Sélecteur de statut */}
                  <div className="flex items-center gap-2">
                    <label
                      htmlFor={`status-select-${lead.id}`}
                      className="text-xs font-bold text-navy whitespace-nowrap"
                    >
                      Statut dossier :
                    </label>
                    <div className="relative">
                      <select
                        id={`status-select-${lead.id}`}
                        value={lead.status}
                        disabled={isUpdating}
                        onChange={(e) =>
                          handleStatusChange(
                            lead.id,
                            e.target.value as ManuscriptLead["status"]
                          )
                        }
                        className="pl-3 pr-8 py-1.5 rounded-xl border border-border bg-background text-navy font-semibold text-xs focus:outline-none focus:border-navy cursor-pointer disabled:opacity-50 appearance-none"
                      >
                        <option value="new">Nouvelle</option>
                        <option value="contacted">Contactée</option>
                        <option value="converted">Compte auteur créé</option>
                        <option value="rejected">Non retenue</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-foreground-muted absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                    {isUpdating && <InlineLoader size={14} />}
                  </div>

                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
