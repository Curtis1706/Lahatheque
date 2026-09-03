"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Inbox,
  Search,
  FileText,
  Download,
  Mail,
  Phone,
  MapPin,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  Eye,
  FileSpreadsheet,
  X,
  ExternalLink,
  ShieldCheck,
  UserCheck,
  XCircle,
  HelpCircle,
  ChevronRight,
} from "lucide-react";
import {
  getManuscriptLeads,
  updateManuscriptLeadStatus,
  type ManuscriptLead,
} from "@/lib/services/admin";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { toast } from "sonner";

const STATUS_CONFIG: Record<
  ManuscriptLead["status"],
  { label: string; badgeClass: string; dotClass: string; icon: React.ReactNode }
> = {
  new: {
    label: "Nouvelle soumission",
    badgeClass: "bg-gold/15 text-gold border border-gold/30",
    dotClass: "bg-gold",
    icon: <Clock className="w-3.5 h-3.5 text-gold" />,
  },
  contacted: {
    label: "Auteur contacté",
    badgeClass: "bg-navy/10 text-navy border border-navy/20",
    dotClass: "bg-navy",
    icon: <Mail className="w-3.5 h-3.5 text-navy" />,
  },
  converted: {
    label: "Compte auteur créé",
    badgeClass: "bg-success/15 text-success border border-success/30",
    dotClass: "bg-success",
    icon: <UserCheck className="w-3.5 h-3.5 text-success" />,
  },
  rejected: {
    label: "Non retenue",
    badgeClass: "bg-foreground-muted/10 text-foreground-muted border border-border",
    dotClass: "bg-foreground-muted",
    icon: <XCircle className="w-3.5 h-3.5 text-foreground-muted" />,
  },
};

export default function AdminManuscriptLeadsPage() {
  const [leads, setLeads] = useState<ManuscriptLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedLead, setSelectedLead] = useState<ManuscriptLead | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchLeads = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await getManuscriptLeads();
      setLeads(data);
      if (isRefresh) {
        toast.success("Liste des manuscrits actualisée avec succès.");
      }
    } catch {
      toast.error("Impossible de charger les soumissions de manuscrits.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleStatusChange = async (id: string, newStatus: ManuscriptLead["status"]) => {
    setUpdatingId(id);
    try {
      const ok = await updateManuscriptLeadStatus(id, newStatus);
      if (ok) {
        setLeads((prev) =>
          prev.map((l) =>
            l.id === id
              ? {
                  ...l,
                  status: newStatus,
                  status_display: STATUS_CONFIG[newStatus].label,
                }
              : l
          )
        );
        if (selectedLead && selectedLead.id === id) {
          setSelectedLead((prev) =>
            prev
              ? {
                  ...prev,
                  status: newStatus,
                  status_display: STATUS_CONFIG[newStatus].label,
                }
              : null
          );
        }
        toast.success(`Statut mis à jour : ${STATUS_CONFIG[newStatus].label}`);
      } else {
        toast.error("Erreur lors de la mise à jour du statut.");
      }
    } catch {
      toast.error("Erreur de communication avec le serveur.");
    } finally {
      setUpdatingId(null);
    }
  };

  const counts = useMemo(() => {
    const res = { all: leads.length, new: 0, contacted: 0, converted: 0, rejected: 0 };
    leads.forEach((l) => {
      if (res[l.status] !== undefined) res[l.status]++;
    });
    return res;
  }, [leads]);

  const displayedLeads = useMemo(() => {
    if (statusFilter === "all") return leads;
    return leads.filter((l) => l.status === statusFilter);
  }, [leads, statusFilter]);

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

  const exportCSV = () => {
    if (leads.length === 0) {
      toast.info("Aucun manuscrit à exporter.");
      return;
    }

    const headers = [
      "Date",
      "Titre de l'ouvrage",
      "Genre / Discipline",
      "Nom complet",
      "Email",
      "Téléphone",
      "Pays",
      "Statut",
      "Lien Fichier",
    ];

    const rows = leads.map((l) => [
      `"${formatDate(l.created_at)}"`,
      `"${(l.book_title || "").replace(/"/g, '""')}"`,
      `"${(l.genre || "").replace(/"/g, '""')}"`,
      `"${(l.full_name || "").replace(/"/g, '""')}"`,
      `"${l.email || ""}"`,
      `"${l.phone || ""}"`,
      `"${(l.country || "").replace(/"/g, '""')}"`,
      `"${STATUS_CONFIG[l.status]?.label || l.status}"`,
      `"${l.manuscript_file_url || ""}"`,
    ]);

    const csvContent = "\uFEFF" + [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `manuscrits_lahatheque_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Fichier CSV exporté avec succès.");
  };

  // ─── Colonnes de la DataTable ───────────────────────────────────────────────
  const columns: DataTableColumn<ManuscriptLead>[] = [
    {
      key: "book_title",
      header: "Ouvrage & Discipline",
      cell: (row) => (
        <div className="space-y-1 py-1 min-w-[200px]">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-navy/5 text-navy border border-border">
              {row.genre || "Général"}
            </span>
            {row.country && (
              <span className="text-[11px] text-foreground-muted flex items-center gap-0.5">
                <MapPin className="w-3 h-3 text-gold" />
                {row.country}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setSelectedLead(row)}
            className="font-serif font-bold text-navy hover:text-gold text-sm text-left line-clamp-2 cursor-pointer transition-colors block"
          >
            « {row.book_title} »
          </button>
          <span className="text-[11px] text-foreground-muted flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDate(row.created_at)}
          </span>
        </div>
      ),
    },
    {
      key: "full_name",
      header: "Auteur & Contact",
      cell: (row) => (
        <div className="space-y-1 py-1 text-xs min-w-[180px]">
          <p className="font-semibold text-navy flex items-center gap-1.5">
            {row.full_name}
          </p>
          <a
            href={`mailto:${row.email}`}
            className="text-foreground-muted hover:text-gold flex items-center gap-1.5 truncate max-w-[220px]"
            title={`Envoyer un email à ${row.email}`}
          >
            <Mail className="w-3 h-3 text-gold shrink-0" />
            <span className="truncate">{row.email}</span>
          </a>
          {row.phone ? (
            <a
              href={`tel:${row.phone}`}
              className="text-foreground-muted hover:text-gold flex items-center gap-1.5"
            >
              <Phone className="w-3 h-3 text-gold shrink-0" />
              <span>{row.phone}</span>
            </a>
          ) : (
            <span className="text-foreground-muted text-[11px]">Téléphone non renseigné</span>
          )}
        </div>
      ),
    },
    {
      key: "manuscript_file_url",
      header: "Fichier Manuscrit",
      cell: (row) => {
        if (!row.manuscript_file_url) {
          return (
            <span className="text-xs text-foreground-muted italic flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-foreground-muted" />
              Non disponible
            </span>
          );
        }

        const isDocx = row.manuscript_file_url.includes(".docx") || row.manuscript_file_url.includes(".doc");
        const fileExt = isDocx ? "DOCX" : "PDF";

        return (
          <div className="py-1">
            <a
              href={row.manuscript_file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-background hover:bg-gold/10 hover:border-gold text-xs font-bold text-navy transition-all shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-gold shrink-0" />
              <span>Télécharger ({fileExt})</span>
            </a>
          </div>
        );
      },
    },
    {
      key: "status",
      header: "Statut d'Instruction",
      cell: (row) => {
        const cfg = STATUS_CONFIG[row.status] || STATUS_CONFIG.new;
        const isCurrentUpdating = updatingId === row.id;

        return (
          <div className="py-1 space-y-1.5 min-w-[160px]">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${cfg.badgeClass}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotClass}`} />
              {cfg.label}
            </span>

            <select
              disabled={isCurrentUpdating}
              value={row.status}
              onChange={(e) =>
                handleStatusChange(row.id, e.target.value as ManuscriptLead["status"])
              }
              className="block w-full text-[11px] bg-background border border-border rounded-lg p-1.5 text-foreground focus:ring-1 focus:ring-navy focus:border-navy cursor-pointer disabled:opacity-50"
              aria-label={`Modifier le statut de ${row.book_title}`}
            >
              <option value="new">Nouvelle</option>
              <option value="contacted">Contactée</option>
              <option value="converted">Compte auteur créé</option>
              <option value="rejected">Non retenue</option>
            </select>
          </div>
        );
      },
    },
    {
      key: "actions",
      header: "Dossier",
      className: "text-right",
      cell: (row) => (
        <div className="flex items-center justify-end gap-1.5 py-1">
          <button
            type="button"
            onClick={() => setSelectedLead(row)}
            className="px-3 py-1.5 rounded-xl bg-navy hover:bg-navy-hover text-white text-xs font-bold transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
            title="Consulter le dossier complet"
          >
            <Eye className="w-3.5 h-3.5 text-gold" />
            <span>Examiner</span>
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full min-h-screen bg-background p-4 sm:p-6 lg:p-8 space-y-6 animate-in fade-in duration-300">
      {/* ─── EN-TÊTE DE PAGE ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-xl bg-gold/15 text-gold flex items-center justify-center">
              <Inbox className="w-4 h-4" />
            </div>
            <h1 className="font-serif text-2xl md:text-3xl font-bold text-navy">
              Manuscrits Reçus (Public)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-foreground-muted">
            Gestion, examen éditorial et suivi des propositions de manuscrits soumises via les formulaires publics.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          <button
            type="button"
            onClick={exportCSV}
            disabled={leads.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-border bg-background hover:bg-background-secondary text-navy text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50 min-h-[40px]"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-gold" />
            <span>Exporter CSV</span>
          </button>

          <button
            type="button"
            onClick={() => fetchLeads(true)}
            disabled={loading || refreshing}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-navy text-white hover:bg-navy-hover text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50 min-h-[40px]"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-gold ${refreshing ? "animate-spin" : ""}`} />
            <span>{refreshing ? "Actualisation..." : "Actualiser"}</span>
          </button>
        </div>
      </div>

      {/* ─── KPI CARDS CLICQUABLES (Filtres Rapides) ─────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {[
          {
            id: "all",
            label: "Toutes les soumissions",
            count: counts.all,
            icon: <Inbox className="w-4 h-4 text-navy" />,
            borderClass: statusFilter === "all" ? "ring-2 ring-navy border-navy" : "border-border",
          },
          {
            id: "new",
            label: "Nouvelles à traiter",
            count: counts.new,
            icon: <Clock className="w-4 h-4 text-gold" />,
            borderClass: statusFilter === "new" ? "ring-2 ring-gold border-gold" : "border-border",
          },
          {
            id: "contacted",
            label: "Auteurs contactés",
            count: counts.contacted,
            icon: <Mail className="w-4 h-4 text-navy" />,
            borderClass: statusFilter === "contacted" ? "ring-2 ring-navy border-navy" : "border-border",
          },
          {
            id: "converted",
            label: "Comptes créés",
            count: counts.converted,
            icon: <UserCheck className="w-4 h-4 text-success" />,
            borderClass: statusFilter === "converted" ? "ring-2 ring-success border-success" : "border-border",
          },
          {
            id: "rejected",
            label: "Non retenues",
            count: counts.rejected,
            icon: <XCircle className="w-4 h-4 text-foreground-muted" />,
            borderClass: statusFilter === "rejected" ? "ring-2 ring-foreground-muted border-foreground-muted" : "border-border",
          },
        ].map((card) => (
          <button
            key={card.id}
            type="button"
            onClick={() => setStatusFilter(card.id)}
            className={`p-4 rounded-2xl bg-background border transition-all text-left flex flex-col justify-between gap-2 shadow-xs hover:shadow-sm cursor-pointer ${card.borderClass}`}
          >
            <div className="flex items-center justify-between">
              <span className="p-2 rounded-xl bg-background-secondary">{card.icon}</span>
              <span className="font-mono text-xl sm:text-2xl font-bold text-navy">{card.count}</span>
            </div>
            <span className="text-xs font-semibold text-foreground-muted">{card.label}</span>
          </button>
        ))}
      </div>

      {/* ─── DATA TABLE PRINCIPALE ───────────────────────────────────────────── */}
      <DataTable<ManuscriptLead>
        data={displayedLeads}
        columns={columns}
        rowKey="id"
        loading={loading}
        searchable={true}
        searchPlaceholder="Rechercher par titre, auteur, email, genre, pays..."
        pageSize={10}
        pageSizeOptions={[10, 20, 50]}
        emptyMessage="Aucune proposition de manuscrit trouvée dans cette sélection."
        emptyState={
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-navy/5 text-navy flex items-center justify-center mx-auto">
              <Inbox className="w-6 h-6 text-gold" />
            </div>
            <h3 className="font-serif text-lg font-bold text-navy">Aucun manuscrit trouvé</h3>
            <p className="text-xs text-foreground-muted max-w-md mx-auto">
              {statusFilter !== "all"
                ? "Aucune proposition ne correspond au filtre de statut sélectionné."
                : "Les nouvelles propositions soumises depuis les formulaires publics apparaîtront automatiquement ici dès réception."}
            </p>
          </div>
        }
        mobileCard={(row) => {
          const cfg = STATUS_CONFIG[row.status] || STATUS_CONFIG.new;
          return (
            <div className="p-4 rounded-2xl bg-background border border-border shadow-xs space-y-3">
              <div className="flex items-start justify-between gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-navy/5 text-navy border border-border">
                  {row.genre || "Général"}
                </span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg.badgeClass}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotClass}`} />
                  {cfg.label}
                </span>
              </div>

              <div>
                <h3 className="font-serif font-bold text-navy text-base leading-snug">
                  « {row.book_title} »
                </h3>
                <p className="text-xs text-foreground-muted mt-0.5 font-medium">
                  Par {row.full_name} {row.country ? `(${row.country})` : ""}
                </p>
              </div>

              <div className="pt-2 border-t border-border flex items-center justify-between gap-2">
                {row.manuscript_file_url ? (
                  <a
                    href={row.manuscript_file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold text-gold hover:underline inline-flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Télécharger
                  </a>
                ) : (
                  <span className="text-[11px] text-foreground-muted">Sans fichier</span>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedLead(row)}
                  className="px-3 py-1.5 rounded-xl bg-navy text-white text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-gold" />
                  Examiner
                </button>
              </div>
            </div>
          );
        }}
      />

      {/* ─── MODALE D'EXAMEN DU DOSSIER MANUSCRIT ─────────────────────────────── */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 bg-navy/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-background border border-border rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden space-y-6 animate-in zoom-in-95 duration-200">
            {/* Header de la modale */}
            <div className="p-6 bg-navy text-white flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-gold/20 text-gold text-[10px] font-bold uppercase tracking-wider">
                    {selectedLead.genre || "Discipline non renseignée"}
                  </span>
                  <span className="text-xs text-white/70">
                    Déposé le {formatDate(selectedLead.created_at)}
                  </span>
                </div>
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-white leading-tight">
                  « {selectedLead.book_title} »
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setSelectedLead(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                title="Fermer la fiche"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 pt-0 space-y-6">
              {/* Coordonnées de l'auteur */}
              <div className="p-4 rounded-2xl bg-background-secondary border border-border space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-navy flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-gold" />
                  Identité &amp; Coordonnées de l&apos;Auteur
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-foreground-muted block">Nom complet</span>
                    <span className="font-semibold text-navy">{selectedLead.full_name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-foreground-muted block">Adresse Email</span>
                    <a
                      href={`mailto:${selectedLead.email}`}
                      className="font-medium text-navy hover:text-gold flex items-center gap-1 truncate"
                    >
                      <Mail className="w-3 h-3 text-gold shrink-0" />
                      <span className="truncate">{selectedLead.email}</span>
                    </a>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-foreground-muted block">Téléphone / WhatsApp</span>
                    {selectedLead.phone ? (
                      <a
                        href={`tel:${selectedLead.phone}`}
                        className="font-medium text-navy hover:text-gold flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3 text-gold shrink-0" />
                        <span>{selectedLead.phone}</span>
                      </a>
                    ) : (
                      <span className="text-foreground-muted">Non renseigné</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Fichier et Téléchargement */}
              <div className="p-4 rounded-2xl bg-gold/10 border border-gold/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gold/20 text-gold flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-navy">Manuscrit Déposé</h5>
                    <p className="text-[11px] text-foreground-muted">
                      Document original téléversé par l&apos;auteur.
                    </p>
                  </div>
                </div>

                {selectedLead.manuscript_file_url ? (
                  <a
                    href={selectedLead.manuscript_file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl bg-navy hover:bg-navy-hover text-white text-xs font-bold inline-flex items-center gap-2 shadow-xs transition-colors shrink-0 min-h-[40px] cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-gold" />
                    <span>Télécharger le Manuscrit</span>
                  </a>
                ) : (
                  <span className="text-xs font-bold text-foreground-muted">Fichier non joint</span>
                )}
              </div>

              {/* Résumé / Pitch */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-navy flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-gold" />
                  Synopsis &amp; Présentation de l&apos;Œuvre
                </h4>
                <div className="p-4 rounded-2xl bg-background-secondary border border-border text-xs sm:text-sm text-foreground leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
                  {selectedLead.summary || "Aucun synopsis renseigné par l'auteur."}
                </div>
              </div>

              {/* Décision & Changement de statut */}
              <div className="p-4 rounded-2xl bg-background-secondary border border-border space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-navy">
                  Décision du Comité Éditorial
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(
                    [
                      { id: "new", label: "Nouvelle", color: "hover:bg-gold/20" },
                      { id: "contacted", label: "Contactée", color: "hover:bg-navy/20" },
                      { id: "converted", label: "Convertie", color: "hover:bg-success/20" },
                      { id: "rejected", label: "Non retenue", color: "hover:bg-foreground-muted/20" },
                    ] as const
                  ).map((st) => {
                    const isCurrent = selectedLead.status === st.id;
                    return (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => handleStatusChange(selectedLead.id, st.id)}
                        disabled={updatingId === selectedLead.id}
                        className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          isCurrent
                            ? "bg-navy text-white border-navy shadow-xs"
                            : "bg-background text-foreground-muted border-border hover:text-navy"
                        }`}
                      >
                        {st.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Boutons d'action du bas */}
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <a
                  href={`mailto:${selectedLead.email}?subject=Votre proposition de manuscrit « ${selectedLead.book_title} » - LAHA Éditions`}
                  className="px-4 py-2 rounded-xl border border-border bg-background hover:bg-background-secondary text-navy text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer min-h-[40px]"
                >
                  <Mail className="w-3.5 h-3.5 text-gold" />
                  <span>Contacter l&apos;Auteur</span>
                </a>

                <button
                  type="button"
                  onClick={() => setSelectedLead(null)}
                  className="px-5 py-2 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors cursor-pointer min-h-[40px]"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
