"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { CheckSquare, Search, Filter, ArrowLeft, User, Eye, CheckCircle2, AlertCircle, BookOpen } from "lucide-react";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { BookCover3D } from "@/components/ui/book-cover-3d";
import { useAuth } from "@/hooks/use-auth";
import { ChiefExaminationModal } from "@/components/features/chief-layout/chief-examination-modal";
import { getDisciplines, type DisciplineItem } from "@/lib/services/classification";
import { DisciplineCombobox } from "@/components/features/catalog/discipline-combobox";
import { getPendingDeposits, validateDeposit, requestRevision } from "@/lib/services/layout-artist";
import type { LayoutDeposit } from "@/lib/types/layout-artist";
import { toast } from "sonner";

export default function ChefValidationPage() {
  const { user } = useAuth();
  const [deposits, setDeposits] = useState<LayoutDeposit[]>([]);
  const [disciplines, setDisciplines] = useState<DisciplineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [disciplineFilter, setDisciplineFilter] = useState("all");
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

  const loadData = async () => {
    setLoading(true);
    try {
      const [depositsData, disciplinesData] = await Promise.all([
        getPendingDeposits(),
        getDisciplines(),
      ]);
      setDeposits(depositsData);
      setDisciplines(disciplinesData);
    } catch {
      toast.error("Erreur de chargement des dépôts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredDeposits = useMemo(() => {
    return deposits.filter((dep) => {
      if (disciplineFilter !== "all" && dep.classification.discipline !== disciplineFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = dep.metadata.title.toLowerCase().includes(q);
        const matchMaquettiste = dep.maquettiste_name.toLowerCase().includes(q);
        if (!matchTitle && !matchMaquettiste) return false;
      }
      return true;
    });
  }, [deposits, searchQuery, disciplineFilter]);

  const handleQuickValidate = async (id: string) => {
    await validateDeposit(id);
    toast.success("Ouvrage validé avec succès ! Mis en ligne sur la vitrine publique.");
    await loadData();
  };

  const handleQuickReject = async (id: string, reason: string) => {
    await requestRevision(id, reason);
    toast.error("Refus enregistré. Le motif de correction a été transmis au maquettiste.");
    await loadData();
  };

  const columns: DataTableColumn<LayoutDeposit>[] = [
    {
      key: "metadata.title",
      header: "Ouvrage & Couverture",
      cell: (row) => (
        <button
          type="button"
          onClick={() => setSelectedDeposit(row)}
          className="flex items-center gap-3 text-left hover:text-navy transition-colors group py-1 cursor-pointer"
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
        <span className="text-xs text-foreground font-medium">{row.classification.discipline}</span>
      ),
    },
    {
      key: "submitted_at",
      header: "Soumis le",
      cell: (row) => (
        <span className="text-xs text-foreground-muted font-mono">
          {row.submitted_at
            ? new Date(row.submitted_at).toLocaleDateString("fr-FR", {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Statut",
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "actions" as keyof LayoutDeposit,
      header: "Actions",
      cell: (row) => (
        <div className="flex items-center gap-1.5 justify-end">
          <Link
            href={`/catalog/reader/${row.id}`}
            target="_blank"
            onClick={(e) => e.stopPropagation()}
            className="p-2 rounded-xl border border-border bg-background-secondary hover:bg-navy hover:text-white text-foreground-muted transition-colors inline-flex items-center justify-center min-h-[36px] min-w-[36px]"
            title="Lire dans la Liseuse LAHAThèque"
          >
            <BookOpen className="w-3.5 h-3.5 text-gold" />
          </Link>
          <button
            type="button"
            onClick={() => setSelectedDeposit(row)}
            className="px-3 py-1.5 rounded-xl bg-navy text-white text-[10px] font-bold hover:bg-navy-hover transition-colors whitespace-nowrap min-h-[36px] inline-flex items-center gap-1 shadow-xs cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-gold" />
            Examiner &amp; Décider
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/chief-layout" className="hover:text-navy">
          Vue d&apos;ensemble
        </Link>
        <span>/</span>
        <span className="text-navy font-semibold">Dépôts à Valider</span>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-6">
        <Link href="/chief-layout" className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          Vue d&apos;ensemble
        </Link>
        <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
          <CheckSquare className="w-4 h-4 text-gold" />
          Chef Maquettiste
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
          Dépôts en Attente de Validation
        </h1>
        <p className="text-xs text-foreground-muted mt-1">
          Examinez les dépôts soumis par les maquettistes. En cas de refus, motivez la décision pour permettre la correction. La validation déclenche la mise en ligne automatique sur la vitrine.
        </p>
      </div>

      {/* Barre de Recherche et Filtres */}
      <div className="bg-background border border-border p-4 rounded-2xl space-y-3 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-foreground-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par titre ou nom de maquettiste..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-foreground placeholder:text-foreground-muted min-h-[40px]"
          />
        </div>

        {/* Filtre par discipline avec recherche */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-2 border-t border-border">
          <span className="text-[11px] font-bold text-foreground-muted uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Filter className="w-3 h-3 text-gold" />
            Discipline :
          </span>
          <div className="w-full sm:w-72">
            <DisciplineCombobox
              value={disciplineFilter === "all" ? "" : disciplineFilter}
              onChange={(val) => setDisciplineFilter(val || "all")}
              disciplines={disciplines}
              includeAllOption={true}
              allOptionLabel={`Toutes les disciplines (${deposits.length})`}
              placeholder="Toutes les disciplines..."
              searchPlaceholder="Rechercher une discipline..."
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <DataTable
        data={filteredDeposits}
        columns={columns}
        rowKey="id"
        loading={loading}
        emptyMessage="Aucun dépôt en attente de validation."
        onRowClick={(row) => setSelectedDeposit(row)}
        pageSize={10}
      />

      {/* Modale d'examen rapide & Décision (Validation vs Refus avec motif) */}
      <ChiefExaminationModal
        deposit={selectedDeposit}
        isOpen={!!selectedDeposit}
        onClose={() => setSelectedDeposit(null)}
        onValidate={handleQuickValidate}
        onReject={handleQuickReject}
      />
    </div>
  );
}
