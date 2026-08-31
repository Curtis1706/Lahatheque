"use client";

import React, { useEffect, useState, useMemo } from "react";
import { 
  Plus, 
  Trash2, 
  Pencil, 
  Layers, 
  Folder, 
  FolderPlus, 
  BookOpen, 
  Check, 
  X,
  Sparkles,
  Search
} from "lucide-react";
import { toast } from "sonner";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { Modal } from "@/components/ui/modal";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import {
  getDisciplines,
  createDiscipline,
  updateDiscipline,
  deleteDiscipline,
  getDomains,
  createDomain,
  updateDomain,
  deleteDomain,
  type DisciplineItem,
  type DomainItem,
} from "@/lib/services/classification";

interface DisciplineTableRow extends DisciplineItem {
  status: string;
  domains_count: number;
  domains_list: DomainItem[];
}

export function DisciplineManager() {
  const [disciplines, setDisciplines] = useState<DisciplineItem[]>([]);
  const [domains, setDomains] = useState<DomainItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal 1 : Création / Édition de Discipline
  const [disciplineModalOpen, setDisciplineModalOpen] = useState(false);
  const [editingDiscipline, setEditingDiscipline] = useState<DisciplineItem | null>(null);
  const [formName, setFormName] = useState("");
  const [formDewey, setFormDewey] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);
  const [submittingDiscipline, setSubmittingDiscipline] = useState(false);

  // Modal 2 : Gestion des Sous-catégories
  const [domainsModalOpen, setDomainsModalOpen] = useState(false);
  const [activeDisciplineForDomains, setActiveDisciplineForDomains] = useState<DisciplineItem | null>(null);
  const [newDomainName, setNewDomainName] = useState("");
  const [addingDomain, setAddingDomain] = useState(false);

  // Modal 3 : Confirmation de suppression
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [disciplineToDelete, setDisciplineToDelete] = useState<DisciplineItem | null>(null);
  const [domainToDelete, setDomainToDelete] = useState<DomainItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Chargement des données
  async function load() {
    setLoading(true);
    try {
      const [d, dom] = await Promise.all([getDisciplines(), getDomains()]);
      setDisciplines(d);
      setDomains(dom);
    } catch {
      toast.error("Erreur de chargement du référentiel.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // Formatage des lignes pour la DataTable
  const tableData: DisciplineTableRow[] = useMemo(() => {
    return disciplines.map((d) => {
      const relatedDomains = domains.filter((dom) => dom.discipline === d.id);
      const isActive = d.is_active !== false;
      return {
        ...d,
        is_active: isActive,
        status: isActive ? "active" : "inactive",
        domains_count: relatedDomains.length,
        domains_list: relatedDomains,
      };
    });
  }, [disciplines, domains]);

  // Ouverture du modal de création
  const handleOpenCreateModal = () => {
    setEditingDiscipline(null);
    setFormName("");
    setFormDewey("");
    setFormDescription("");
    setFormIsActive(true);
    setDisciplineModalOpen(true);
  };

  // Ouverture du modal d'édition
  const handleOpenEditModal = (discipline: DisciplineItem) => {
    setEditingDiscipline(discipline);
    setFormName(discipline.name);
    setFormDewey(discipline.code_dewey || "");
    setFormDescription(discipline.description || "");
    setFormIsActive(discipline.is_active !== false);
    setDisciplineModalOpen(true);
  };

  // Soumission création ou modification de discipline
  const handleSubmitDiscipline = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formName.trim()) {
      toast.error("L'intitulé de la discipline est obligatoire.");
      return;
    }

    setSubmittingDiscipline(true);
    try {
      if (editingDiscipline) {
        await updateDiscipline(editingDiscipline.id, {
          name: formName.trim(),
          code_dewey: formDewey.trim(),
          description: formDescription.trim(),
          is_active: formIsActive,
        });
        toast.success("Discipline mise à jour avec succès.");
      } else {
        await createDiscipline({
          name: formName.trim(),
          code_dewey: formDewey.trim() || undefined,
          description: formDescription.trim() || undefined,
          is_active: formIsActive,
        });
        toast.success("Nouvelle discipline créée avec succès.");
      }
      setDisciplineModalOpen(false);
      load();
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'enregistrement.");
    } finally {
      setSubmittingDiscipline(false);
    }
  };

  // Bascule rapide Actif / Inactif pour une discipline
  const handleToggleDisciplineStatus = async (discipline: DisciplineItem) => {
    const nextStatus = discipline.is_active === false;
    try {
      await updateDiscipline(discipline.id, {
        is_active: nextStatus,
      });
      toast.success(
        nextStatus 
          ? `Discipline « ${discipline.name} » activée.` 
          : `Discipline « ${discipline.name} » désactivée.`
      );
      load();
    } catch {
      toast.error("Erreur lors de la modification du statut.");
    }
  };

  // Bascule rapide Actif / Inactif pour une sous-catégorie
  const handleToggleDomainStatus = async (domain: DomainItem) => {
    const nextStatus = domain.is_active === false;
    try {
      await updateDomain(domain.id, {
        is_active: nextStatus,
      });
      toast.success(
        nextStatus 
          ? `Sous-catégorie « ${domain.name} » activée.` 
          : `Sous-catégorie « ${domain.name} » désactivée.`
      );
      load();
    } catch {
      toast.error("Erreur lors du changement de statut de la sous-catégorie.");
    }
  };

  // Modal de gestion des sous-catégories
  const handleOpenDomainsModal = (discipline: DisciplineItem) => {
    setActiveDisciplineForDomains(discipline);
    setNewDomainName("");
    setDomainsModalOpen(true);
  };

  // Ajout d'une sous-catégorie
  const handleAddDomain = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeDisciplineForDomains || !newDomainName.trim()) return;

    setAddingDomain(true);
    try {
      await createDomain({
        discipline: activeDisciplineForDomains.id,
        name: newDomainName.trim(),
        is_active: true,
      });
      toast.success("Sous-catégorie ajoutée.");
      setNewDomainName("");
      load();
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'ajout.");
    } finally {
      setAddingDomain(false);
    }
  };

  // Suppression d'une discipline
  const handleConfirmDeleteDiscipline = async () => {
    if (!disciplineToDelete) return;
    setDeleting(true);
    try {
      await deleteDiscipline(disciplineToDelete.id);
      toast.success(`Discipline « ${disciplineToDelete.name} » supprimée.`);
      setDeleteModalOpen(false);
      setDisciplineToDelete(null);
      load();
    } catch (err: any) {
      toast.error(err.message || "Suppression impossible.");
    } finally {
      setDeleting(false);
    }
  };

  // Suppression d'une sous-catégorie
  const handleConfirmDeleteDomain = async () => {
    if (!domainToDelete) return;
    setDeleting(true);
    try {
      await deleteDomain(domainToDelete.id);
      toast.success(`Sous-catégorie « ${domainToDelete.name} » supprimée.`);
      setDomainToDelete(null);
      load();
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la suppression.");
    } finally {
      setDeleting(false);
    }
  };

  // Colonnes de la DataTable
  const columns: DataTableColumn<DisciplineTableRow>[] = [
    {
      key: "name",
      header: "Discipline académique",
      cell: (row) => (
        <div className="space-y-0.5">
          <span className="font-serif font-bold text-navy text-sm block">
            {row.name}
          </span>
          {row.description ? (
            <p className="text-xs text-foreground-muted line-clamp-1">
              {row.description}
            </p>
          ) : (
            <p className="text-[11px] text-foreground-muted/60 italic">
              Aucune description
            </p>
          )}
        </div>
      ),
    },
    {
      key: "code_dewey",
      header: "Code Dewey",
      cell: (row) => (
        row.code_dewey ? (
          <span className="px-2.5 py-1 rounded-md bg-gold/10 text-gold border border-gold/20 text-xs font-mono font-bold inline-block">
            {row.code_dewey}
          </span>
        ) : (
          <span className="text-foreground-muted text-xs">—</span>
        )
      ),
    },
    {
      key: "domains_count",
      header: "Sous-catégories",
      cell: (row) => (
        <button
          type="button"
          onClick={() => handleOpenDomainsModal(row)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-background-secondary hover:bg-gold/10 hover:text-navy text-foreground-muted text-xs font-medium border border-border transition-colors group cursor-pointer"
          title="Gérer les sous-catégories"
        >
          <Folder className="w-3.5 h-3.5 text-gold group-hover:scale-110 transition-transform" />
          <span>{row.domains_count} sous-catégorie{row.domains_count > 1 ? "s" : ""}</span>
        </button>
      ),
    },
    {
      key: "is_active",
      header: "Statut",
      cell: (row) => {
        const active = row.is_active !== false;
        return (
          <button
            type="button"
            onClick={() => handleToggleDisciplineStatus(row)}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer border ${
              active
                ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 hover:bg-emerald-500/20"
                : "bg-slate-500/10 text-slate-600 border-slate-500/20 hover:bg-slate-500/20"
            }`}
            title="Cliquer pour basculer le statut"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-slate-400"}`} />
            {active ? "Actif" : "Inactif"}
          </button>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      cell: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => handleOpenDomainsModal(row)}
            className="p-2 text-foreground-muted hover:text-navy hover:bg-background-secondary rounded-xl transition-colors cursor-pointer"
            title="Gérer les sous-catégories"
            aria-label="Gérer les sous-catégories"
          >
            <FolderPlus className="w-4 h-4 text-gold" />
          </button>

          <button
            type="button"
            onClick={() => handleOpenEditModal(row)}
            className="p-2 text-foreground-muted hover:text-navy hover:bg-background-secondary rounded-xl transition-colors cursor-pointer"
            title="Modifier la discipline"
            aria-label="Modifier"
          >
            <Pencil className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => {
              setDisciplineToDelete(row);
              setDeleteModalOpen(true);
            }}
            className="p-2 text-rose-600 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
            title="Supprimer la discipline"
            aria-label="Supprimer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  // Carte Mobile pour affichage réactif sous lg
  const renderMobileCard = (row: DisciplineTableRow) => {
    const active = row.is_active !== false;
    return (
      <div className="space-y-3 bg-background p-4 rounded-2xl border border-border">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-0.5">
            <h4 className="font-serif font-bold text-navy text-base leading-snug">
              {row.name}
            </h4>
            {row.code_dewey && (
              <span className="px-2 py-0.5 rounded-md bg-gold/10 text-gold border border-gold/20 text-[10px] font-mono font-bold inline-block">
                Dewey {row.code_dewey}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => handleToggleDisciplineStatus(row)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
              active
                ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
                : "bg-slate-500/10 text-slate-600 border-slate-500/20"
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-slate-400"}`} />
            {active ? "Actif" : "Inactif"}
          </button>
        </div>

        {row.description && (
          <p className="text-xs text-foreground-muted leading-relaxed">
            {row.description}
          </p>
        )}

        <div className="pt-2 border-t border-border flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => handleOpenDomainsModal(row)}
            className="inline-flex items-center gap-1 text-xs text-gold font-semibold hover:underline"
          >
            <Folder className="w-3.5 h-3.5" />
            <span>{row.domains_count} sous-catégorie{row.domains_count > 1 ? "s" : ""}</span>
          </button>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleOpenEditModal(row)}
              className="p-2 text-foreground-muted hover:text-navy rounded-lg"
              title="Modifier"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setDisciplineToDelete(row);
                setDeleteModalOpen(true);
              }}
              className="p-2 text-rose-600 hover:bg-rose-500/10 rounded-lg"
              title="Supprimer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Sous-catégories de la discipline active
  const activeDisciplineDomains = useMemo(() => {
    if (!activeDisciplineForDomains) return [];
    return domains.filter((d) => d.discipline === activeDisciplineForDomains.id);
  }, [domains, activeDisciplineForDomains]);

  return (
    <div className="space-y-6">
      {/* En-tête de section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-foreground-muted mb-1">
            <span>Catalogue</span>
            <span>/</span>
            <span className="text-navy font-semibold">Référentiel</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy flex items-center gap-2.5">
            <Layers className="w-6 h-6 text-gold" />
            Disciplines &amp; Catégories du Catalogue
          </h1>
          <p className="text-xs text-foreground-muted mt-1">
            Structure académique du catalogue : disciplines principales, codes Dewey et sous-catégories associées
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-navy hover:bg-navy-hover text-white text-xs font-bold transition-all shadow-xs self-start sm:self-auto min-h-[44px] cursor-pointer"
        >
          <Plus className="w-4 h-4 text-gold" />
          <span>Nouvelle discipline</span>
        </button>
      </div>

      {/* DataTable principale */}
      <DataTable
        data={tableData}
        columns={columns}
        rowKey="id"
        loading={loading}
        searchPlaceholder="Rechercher une discipline, un code Dewey..."
        filterKey="status"
        filterOptions={[
          { value: "active", label: "Disciplines Actives" },
          { value: "inactive", label: "Disciplines Inactives" },
        ]}
        filterPlaceholder="Tous les statuts"
        pageSize={10}
        pageSizeOptions={[10, 25, 50, 100]}
        showPagination={true}
        mobileCard={renderMobileCard}
        emptyMessage="Aucune discipline configurée dans le référentiel."
      />

      {/* ========================================================================= */}
      {/* MODAL 1 : Création / Modification de Discipline                           */}
      {/* ========================================================================= */}
      <Modal
        open={disciplineModalOpen}
        onClose={() => setDisciplineModalOpen(false)}
        title={editingDiscipline ? "Modifier la discipline" : "Nouvelle discipline académique"}
        description={
          editingDiscipline
            ? "Mettez à jour les informations et la visibilité de cette discipline."
            : "Renseignez les détails pour structurer les ouvrages du catalogue."
        }
        maxWidth={520}
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <button
              type="button"
              onClick={() => setDisciplineModalOpen(false)}
              disabled={submittingDiscipline}
              className="px-4 py-2.5 rounded-xl border border-border bg-background hover:bg-background-secondary text-navy font-bold text-xs transition-colors min-h-[44px] cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSubmitDiscipline}
              disabled={submittingDiscipline}
              className="px-5 py-2.5 rounded-xl bg-navy hover:bg-navy-hover text-white text-xs font-bold transition-colors min-h-[44px] cursor-pointer disabled:opacity-50 shadow-xs"
            >
              {submittingDiscipline ? "Enregistrement..." : (editingDiscipline ? "Enregistrer les modifications" : "Créer la discipline")}
            </button>
          </div>
        }
      >
        <form onSubmit={handleSubmitDiscipline} className="space-y-4 py-2">
          {/* Intitulé */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-navy uppercase tracking-wider block">
              Intitulé de la discipline *
            </label>
            <input
              type="text"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Ex: Droit Public & Sciences Politiques"
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-border rounded-xl bg-background text-navy focus:outline-none focus:border-navy focus:ring-2 focus:ring-gold/30 min-h-[44px]"
            />
          </div>

          {/* Code Dewey */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-navy uppercase tracking-wider block">
              Code Dewey (optionnel)
            </label>
            <input
              type="text"
              value={formDewey}
              onChange={(e) => setFormDewey(e.target.value)}
              placeholder="Ex: 340"
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-mono border border-border rounded-xl bg-background text-navy focus:outline-none focus:border-navy focus:ring-2 focus:ring-gold/30 min-h-[44px]"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-navy uppercase tracking-wider block">
              Description / Périmètre
            </label>
            <textarea
              rows={3}
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Ex: Traités, manuels et revues juridiques de droit constitutionnel et administratif"
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-border rounded-xl bg-background text-navy focus:outline-none focus:border-navy focus:ring-2 focus:ring-gold/30 resize-none"
            />
          </div>

          {/* Statut Actif / Inactif */}
          <div className="pt-2 border-t border-border flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-navy block">Statut de la discipline</span>
              <span className="text-[11px] text-foreground-muted block">
                {formIsActive ? "Visible dans le catalogue et les filtres" : "Masquée du catalogue"}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setFormIsActive(!formIsActive)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                formIsActive ? "bg-navy" : "bg-slate-300"
              }`}
              role="switch"
              aria-checked={formIsActive}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  formIsActive ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2 : Gestion des Sous-catégories                                     */}
      {/* ========================================================================= */}
      <Modal
        open={domainsModalOpen}
        onClose={() => setDomainsModalOpen(false)}
        title={activeDisciplineForDomains ? `Sous-catégories • ${activeDisciplineForDomains.name}` : "Sous-catégories"}
        description="Gérez et enrichissez les spécialités et sous-thématiques associées à cette discipline."
        maxWidth={580}
        footer={
          <div className="flex items-center justify-end w-full">
            <button
              type="button"
              onClick={() => setDomainsModalOpen(false)}
              className="px-5 py-2.5 rounded-xl bg-navy text-white hover:bg-navy-hover text-xs font-bold transition-colors min-h-[44px] cursor-pointer"
            >
              Terminer
            </button>
          </div>
        }
      >
        <div className="space-y-5 py-2">
          {/* Formulaire d'ajout rapide inline */}
          <form onSubmit={handleAddDomain} className="flex items-center gap-2">
            <input
              type="text"
              value={newDomainName}
              onChange={(e) => setNewDomainName(e.target.value)}
              placeholder="Nouvelle sous-catégorie (ex: Droit des affaires)..."
              className="flex-1 px-3.5 py-2 text-xs sm:text-sm border border-border rounded-xl bg-background text-navy focus:outline-none focus:border-navy focus:ring-2 focus:ring-gold/30 min-h-[44px]"
            />
            <button
              type="submit"
              disabled={addingDomain || !newDomainName.trim()}
              className="px-4 py-2 rounded-xl bg-gold hover:bg-gold-light text-navy font-bold text-xs min-h-[44px] transition-colors disabled:opacity-50 shrink-0 cursor-pointer shadow-xs"
            >
              {addingDomain ? "Ajout..." : "+ Ajouter"}
            </button>
          </form>

          {/* Liste des sous-catégories existantes */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-navy uppercase tracking-wider">
              <span>Sous-catégories enregistrées ({activeDisciplineDomains.length})</span>
            </div>

            {activeDisciplineDomains.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-background-secondary/50 border border-dashed border-border space-y-2">
                <Folder className="w-6 h-6 text-foreground-muted mx-auto" />
                <p className="text-xs text-foreground-muted">
                  Aucune sous-catégorie pour cette discipline. Ajoutez-en une ci-dessus.
                </p>
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto divide-y divide-border border border-border rounded-2xl overflow-hidden bg-background">
                {activeDisciplineDomains.map((dom) => {
                  const active = dom.is_active !== false;
                  return (
                    <div
                      key={dom.id}
                      className="p-3 flex items-center justify-between hover:bg-background-secondary/40 transition-colors text-xs"
                    >
                      <span className="font-medium text-navy truncate flex-1 pr-3">
                        {dom.name}
                      </span>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Toggle Statut Sous-catégorie */}
                        <button
                          type="button"
                          onClick={() => handleToggleDomainStatus(dom)}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition-colors cursor-pointer ${
                            active
                              ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
                              : "bg-slate-500/10 text-slate-600 border-slate-500/20"
                          }`}
                        >
                          <span className={`w-1 h-1 rounded-full ${active ? "bg-emerald-500" : "bg-slate-400"}`} />
                          {active ? "Actif" : "Inactif"}
                        </button>

                        {/* Bouton de suppression */}
                        <button
                          type="button"
                          onClick={() => {
                            setDomainToDelete(dom);
                          }}
                          className="p-1.5 text-rose-600 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                          title="Supprimer la sous-catégorie"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 3 : Confirmation de suppression de Discipline                       */}
      {/* ========================================================================= */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDisciplineToDelete(null);
        }}
        onConfirm={handleConfirmDeleteDiscipline}
        loading={deleting}
        title={`Supprimer « ${disciplineToDelete?.name} » ?`}
        description="Cette action supprimera définitivement la discipline et détachera les sous-catégories associées. Les ouvrages liés ne seront plus catégorisés."
        confirmLabel="Supprimer définitivement"
      />

      {/* MODAL 4 : Confirmation de suppression de Sous-catégorie                   */}
      <ConfirmationModal
        isOpen={Boolean(domainToDelete)}
        onClose={() => setDomainToDelete(null)}
        onConfirm={handleConfirmDeleteDomain}
        loading={deleting}
        title={`Supprimer « ${domainToDelete?.name} » ?`}
        description="Cette action supprimera définitivement la sous-catégorie sélectionnée."
        confirmLabel="Supprimer"
      />
    </div>
  );
}

export default DisciplineManager;
