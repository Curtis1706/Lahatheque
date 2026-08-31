"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { 
  History, 
  Search, 
  ArrowLeft, 
  User, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  Eye, 
  Filter, 
  BookOpen, 
  Tag, 
  Calendar,
  X
} from "lucide-react";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { BookCover3D } from "@/components/ui/book-cover-3d";
import { useAuth } from "@/hooks/use-auth";
import { getValidationHistory } from "@/lib/services/layout-artist";
import type { LayoutDeposit } from "@/lib/types/layout-artist";
import { toast } from "sonner";

export default function ChefValidationHistoryPage() {
  const { user } = useAuth();
  const [deposits, setDeposits] = useState<LayoutDeposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "revision_requested">("all");
  const [selectedDeposit, setSelectedDeposit] = useState<LayoutDeposit | null>(null);

  const isCurrentUser = (deposit: LayoutDeposit) => {
    if (!user) return false;
    if (deposit.maquettiste_id && (deposit.maquettiste_id === user.id || deposit.maquettiste_id === String(user.id))) {
      return true;
    }
    const currentUserName = `${user.first_name || ""} ${user.last_name || ""}`.trim().toLowerCase();
    if (currentUserName && deposit.maquettiste_name && deposit.maquettiste_name.toLowerCase() === currentUserName) {
      return true;
    }
    if (user.email && deposit.maquettiste_name && deposit.maquettiste_name.toLowerCase() === user.email.toLowerCase()) {
      return true;
    }
    return false;
  };

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await getValidationHistory();
      setDeposits(data);
      setLoading(false);
    }
    loadData();
  }, []);

  const filteredDeposits = useMemo(() => {
    return deposits.filter((d) => {
      if (statusFilter !== "all" && d.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = d.metadata.title.toLowerCase().includes(q);
        const matchAuthor = d.metadata.authors.some((a) => a.toLowerCase().includes(q));
        const matchMaquettiste = d.maquettiste_name.toLowerCase().includes(q);
        if (!matchTitle && !matchAuthor && !matchMaquettiste) return false;
      }
      return true;
    });
  }, [deposits, searchQuery, statusFilter]);

  const publishedCount = deposits.filter((d) => d.status === "published").length;
  const revisionCount = deposits.filter((d) => d.status === "revision_requested").length;
  const totalDecisions = deposits.length;
  const approvalRate = totalDecisions > 0 ? Math.round((publishedCount / totalDecisions) * 100) : 100;

  const handleExportCsv = () => {
    if (filteredDeposits.length === 0) {
      toast.info("Aucune donnée à exporter.");
      return;
    }
    const headers = ["Titre", "Auteurs", "Maquettiste", "Discipline", "Statut", "Date Decision", "Commentaire"];
    const rows = filteredDeposits.map((d) => [
      `"${d.metadata.title.replace(/"/g, '""')}"`,
      `"${d.metadata.authors.join(", ").replace(/"/g, '""')}"`,
      `"${d.maquettiste_name}"`,
      `"${d.classification.discipline}"`,
      d.status === "published" ? "Valide & Publie" : "Revision Demandee",
      d.validated_at || d.created_at,
      `"${(d.chef_comment || "").replace(/"/g, '""')}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `historique_validations_lahatheque_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Historique exporté au format CSV avec succès.");
  };

  const columns: DataTableColumn<LayoutDeposit>[] = [
    {
      key: "metadata.title",
      header: "Ouvrage",
      cell: (row) => (
        <button
          type="button"
          onClick={() => setSelectedDeposit(row)}
          className="flex items-center gap-3 text-left hover:text-navy group transition-colors py-1 cursor-pointer"
        >
          <BookCover3D
            title={row.metadata.title}
            authors={row.metadata.authors}
            discipline={row.classification.discipline}
            coverUrl={row.files?.cover_url}
            size="xs"
          />
          <div className="min-w-0">
            <p className="font-bold text-xs text-navy group-hover:underline truncate max-w-[200px]">
              {row.metadata.title}
            </p>
            <p className="text-[10px] text-foreground-muted font-mono mt-0.5">{row.metadata.authors.join(", ")}</p>
          </div>
        </button>
      ),
    },
    {
      key: "maquettiste_name",
      header: "Maquettiste",
      cell: (row) => {
        const isMine = isCurrentUser(row);
        return (
          <span className="text-xs font-semibold flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-gold shrink-0" />
            {isMine ? (
              <span className="inline-flex items-center gap-1 text-gold font-bold">
                Vous
                {row.maquettiste_name && row.maquettiste_name !== "Maquettiste" && (
                  <span className="text-[10px] text-foreground-muted font-normal">({row.maquettiste_name})</span>
                )}
              </span>
            ) : (
              <span className="text-foreground">{row.maquettiste_name || "Maquettiste"}</span>
            )}
          </span>
        );
      },
    },
    {
      key: "classification.discipline",
      header: "Discipline",
      hideOnMobile: true,
      cell: (row) => (
        <span className="text-xs text-foreground-muted truncate max-w-[160px] block">
          {row.classification.discipline}
        </span>
      ),
    },
    {
      key: "validated_at",
      header: "Date de Décision",
      cell: (row) => (
        <span className="text-xs text-foreground-muted font-mono">
          {row.validated_at
            ? new Date(row.validated_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })
            : new Date(row.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
        </span>
      ),
    },
    {
      key: "status",
      header: "Décision",
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "actions",
      header: "Action",
      cell: (row) => (
        <button
          onClick={() => setSelectedDeposit(row)}
          className="px-3 py-1.5 rounded-lg border border-border text-xs font-bold text-navy hover:bg-background-secondary flex items-center gap-1 transition-colors min-h-[32px] cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5 text-gold" />
          Détail
        </button>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/chief-layout" className="hover:text-navy">Vue d&apos;ensemble</Link>
        <span>/</span>
        <span className="text-navy font-semibold">Historique des Validations</span>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/chief-layout" className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Vue d&apos;ensemble Chef Maquettiste
          </Link>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Historique des Décisions Éditoriales
          </h1>
          <p className="text-xs text-foreground-muted mt-0.5">
            Journal d&apos;audit des validations, publications et demandes de retouche effectuées.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="px-4 py-2.5 rounded-xl border border-border bg-background hover:bg-background-secondary text-xs font-bold text-navy flex items-center gap-1.5 shadow-xs transition-colors min-h-[44px] cursor-pointer"
        >
          <Download className="w-4 h-4 text-gold" />
          Exporter l&apos;Historique (CSV)
        </button>
      </div>

      {/* 3 Summary Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-background-secondary border border-border flex items-center gap-3 shadow-xs">
          <div className="p-3 rounded-xl bg-navy-light text-navy shrink-0">
            <History className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-foreground-muted block">Total Décisions</span>
            <span className="text-xl font-serif font-bold text-navy">{totalDecisions}</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-background-secondary border border-border flex items-center gap-3 shadow-xs">
          <div className="p-3 rounded-xl bg-success/15 text-success shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-foreground-muted block">Validés &amp; Mis en Ligne</span>
            <span className="text-xl font-serif font-bold text-success">{publishedCount} ({approvalRate}%)</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-background-secondary border border-border flex items-center gap-3 shadow-xs">
          <div className="p-3 rounded-xl bg-error/15 text-error shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-foreground-muted block">Renvoyés en Correction</span>
            <span className="text-xl font-serif font-bold text-error">{revisionCount}</span>
          </div>
        </div>
      </div>

      {/* Filtres & Recherche */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-background border border-border shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-foreground-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par titre, auteur, maquettiste..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-navy min-h-[40px]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {[
            { id: "all", label: "Toutes les décisions" },
            { id: "published", label: `Validés (${publishedCount})` },
            { id: "revision_requested", label: `Retouches (${revisionCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                statusFilter === tab.id
                  ? "bg-navy text-white shadow-xs"
                  : "bg-background-secondary text-foreground hover:bg-border/60"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tableau des décisions */}
      <div className="rounded-3xl bg-background border border-border shadow-xs overflow-hidden">
        <DataTable
          rowKey="id"
          columns={columns}
          data={filteredDeposits}
          loading={loading}
          emptyState={
            <div className="p-12 text-center space-y-2">
              <History className="w-8 h-8 text-foreground-muted mx-auto" />
              <p className="text-sm font-bold text-navy">Aucune décision archivée</p>
              <p className="text-xs text-foreground-muted">
                Les validations et rejets d&apos;épreuves apparaîtront automatiquement dans ce journal.
              </p>
            </div>
          }
        />
      </div>

      {/* Modale de Détail d'une Décision Archivée */}
      {selectedDeposit && (
        <div className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-background border border-border rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-border pb-4 shrink-0">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-gold" />
                <h3 className="font-serif font-bold text-navy text-base">Fiche Historique de la Décision</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDeposit(null)}
                className="p-1.5 rounded-lg hover:bg-background-secondary text-foreground-muted hover:text-navy cursor-pointer"
                title="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs overflow-y-auto flex-1 pr-1">
              <div className="p-4 rounded-2xl bg-background-secondary border border-border flex flex-col sm:flex-row gap-4 items-start">
                <BookCover3D
                  title={selectedDeposit.metadata.title}
                  authors={selectedDeposit.metadata.authors}
                  discipline={selectedDeposit.classification?.discipline}
                  coverUrl={selectedDeposit.files?.cover_url}
                  size="sm"
                  className="mx-auto sm:mx-0 shrink-0"
                />
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="font-serif font-bold text-navy text-base">{selectedDeposit.metadata.title}</h4>
                    <StatusBadge status={selectedDeposit.status} />
                  </div>
                  <p className="text-foreground font-semibold">Auteur(s) : {selectedDeposit.metadata.authors?.join(", ") || "Auteur Anonyme"}</p>
                  <p className="text-foreground-muted flex items-center gap-1">
                    Maquettiste :{" "}
                    {isCurrentUser(selectedDeposit) ? (
                      <span className="text-gold font-bold">
                        Vous {selectedDeposit.maquettiste_name && !["Vous", "Maquettiste", "Équipe Éditoriale LAHA"].includes(selectedDeposit.maquettiste_name) ? `(${selectedDeposit.maquettiste_name})` : ""}
                      </span>
                    ) : (
                      <span className="text-foreground font-medium">{selectedDeposit.maquettiste_name || "Équipe Éditoriale LAHA"}</span>
                    )}
                  </p>
                  <p className="text-foreground-muted">Discipline : {selectedDeposit.classification?.discipline || "Non spécifiée"}</p>
                  <p className="text-foreground-muted">Établissement : {selectedDeposit.classification?.university || "Non affilié"}</p>
                </div>
              </div>

              {selectedDeposit.chef_comment && (
                <div className="p-4 rounded-2xl bg-navy/5 border border-border space-y-1">
                  <span className="font-bold text-navy uppercase text-[10px] tracking-wider block">
                    Commentaire / Motif du Chef Maquettiste :
                  </span>
                  <p className="text-foreground italic bg-background p-3 rounded-xl border border-border">
                    « {selectedDeposit.chef_comment} »
                  </p>
                </div>
              )}

              <div className="space-y-1.5">
                <span className="font-bold text-navy uppercase text-[10px] tracking-wider block">
                  Résumé complet de l&apos;ouvrage :
                </span>
                <div className="text-foreground-muted leading-relaxed bg-background p-4 rounded-2xl border border-border max-h-56 overflow-y-auto whitespace-pre-line text-xs">
                  {selectedDeposit.metadata.summary || "Aucun résumé fourni."}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-border shrink-0">
              <button
                type="button"
                onClick={() => setSelectedDeposit(null)}
                className="px-5 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors cursor-pointer"
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
