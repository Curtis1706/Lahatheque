"use client";

import React, { useEffect, useState } from "react";
import { Plus, Trash2, Pencil, X, Check, Layers, ChevronDown, ChevronRight, Folder, FolderPlus, BookOpen } from "lucide-react";
import { toast } from "sonner";
import {
  getDisciplines,
  createDiscipline,
  updateDiscipline,
  deleteDiscipline,
  getDomains,
  createDomain,
  deleteDomain,
  type DisciplineItem,
  type DomainItem,
} from "@/lib/services/classification";

export function DisciplineManager() {
  const [disciplines, setDisciplines] = useState<DisciplineItem[]>([]);
  const [domains, setDomains] = useState<DomainItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDewey, setNewDewey] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editDewey, setEditDewey] = useState("");

  const [newDomainName, setNewDomainName] = useState("");
  const [creatingDomainFor, setCreatingDomainFor] = useState<number | null>(null);

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

  async function handleCreate() {
    if (!newName.trim()) {
      toast.error("Le nom de la discipline est obligatoire.");
      return;
    }
    try {
      await createDiscipline({
        name: newName.trim(),
        code_dewey: newDewey.trim() || undefined,
        description: newDescription.trim() || undefined,
      });
      toast.success("Discipline créée avec succès.");
      setNewName("");
      setNewDewey("");
      setNewDescription("");
      setShowNewForm(false);
      load();
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la création.");
    }
  }

  async function handleUpdate(id: number) {
    if (!editName.trim()) return;
    try {
      await updateDiscipline(id, {
        name: editName.trim(),
        code_dewey: editDewey.trim(),
      });
      toast.success("Discipline modifiée.");
      setEditingId(null);
      load();
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la modification.");
    }
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`Supprimer définitivement la discipline « ${name} » ?`)) return;
    try {
      await deleteDiscipline(id);
      toast.success("Discipline supprimée.");
      load();
    } catch (err: any) {
      toast.error(err.message || "Suppression impossible.");
    }
  }

  async function handleAddDomain(disciplineId: number) {
    if (!newDomainName.trim()) return;
    try {
      await createDomain({ discipline: disciplineId, name: newDomainName.trim() });
      toast.success("Sous-catégorie ajoutée.");
      setNewDomainName("");
      setCreatingDomainFor(null);
      load();
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'ajout de la sous-catégorie.");
    }
  }

  async function handleDeleteDomain(id: number) {
    if (!confirm("Supprimer cette sous-catégorie ?")) return;
    try {
      await deleteDomain(id);
      toast.success("Sous-catégorie supprimée.");
      load();
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la suppression.");
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
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
          onClick={() => setShowNewForm((v) => !v)}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-navy text-white text-xs font-bold hover:bg-navy-dark transition-all self-start sm:self-auto min-h-[44px]"
        >
          <Plus className="w-4 h-4 text-gold" />
          <span>Nouvelle discipline</span>
        </button>
      </div>

      {/* Formulaire de création */}
      {showNewForm && (
        <div className="p-5 rounded-3xl border border-gold/40 bg-gold/5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-sm font-bold text-navy flex items-center gap-2">
              <FolderPlus className="w-4 h-4 text-gold" />
              Créer une nouvelle discipline académique
            </h3>
            <button
              onClick={() => setShowNewForm(false)}
              className="p-1 rounded-lg text-foreground-muted hover:bg-background transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-[11px] font-bold text-navy uppercase tracking-wider">
                Intitulé de la discipline *
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex: Droit Public & Sciences Politiques"
                className="w-full px-3.5 py-2.5 text-xs border border-border rounded-xl bg-background text-navy focus:outline-none focus:border-gold min-h-[44px]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-navy uppercase tracking-wider">
                Code Dewey (optionnel)
              </label>
              <input
                type="text"
                value={newDewey}
                onChange={(e) => setNewDewey(e.target.value)}
                placeholder="Ex: 340"
                className="w-full px-3.5 py-2.5 text-xs font-mono border border-border rounded-xl bg-background text-navy focus:outline-none focus:border-gold min-h-[44px]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-navy uppercase tracking-wider">
              Description / Périmètre
            </label>
            <input
              type="text"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Ex: Traités, manuels et revues juridiques de droit constitutionnel et administratif"
              className="w-full px-3.5 py-2.5 text-xs border border-border rounded-xl bg-background text-navy focus:outline-none focus:border-gold min-h-[44px]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowNewForm(false)}
              className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-foreground-muted hover:bg-background min-h-[40px]"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleCreate}
              className="px-5 py-2 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-dark min-h-[40px]"
            >
              Enregistrer la discipline
            </button>
          </div>
        </div>
      )}

      {/* Liste des Disciplines */}
      {loading ? (
        <div className="p-12 text-center text-xs text-foreground-muted bg-background rounded-3xl border border-border">
          Chargement du référentiel...
        </div>
      ) : disciplines.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-background border border-dashed border-border space-y-3">
          <BookOpen className="w-8 h-8 text-foreground-muted mx-auto" />
          <p className="font-serif font-bold text-navy">Aucune discipline configurée</p>
          <p className="text-xs text-foreground-muted">
            Créez votre première discipline pour structurer les dépôts et le catalogue.
          </p>
        </div>
      ) : (
        <div className="rounded-3xl border border-border bg-background divide-y divide-border overflow-hidden">
          {disciplines.map((d) => {
            const disciplineDomains = domains.filter((dom) => dom.discipline === d.id);
            const isExpanded = expandedId === d.id;
            const isEditing = editingId === d.id;

            return (
              <div key={d.id} className="p-4 sm:p-5 hover:bg-background-secondary/30 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {isEditing ? (
                    <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 px-3.5 py-2 text-xs border border-border rounded-xl bg-background text-navy focus:outline-none focus:border-gold min-h-[40px]"
                        autoFocus
                      />
                      <input
                        type="text"
                        value={editDewey}
                        onChange={(e) => setEditDewey(e.target.value)}
                        placeholder="Dewey"
                        className="w-24 px-3 py-2 text-xs font-mono border border-border rounded-xl bg-background text-navy focus:outline-none focus:border-gold min-h-[40px]"
                      />
                      <div className="flex items-center gap-1.5 self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={() => handleUpdate(d.id)}
                          className="p-2.5 text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-xl min-h-[40px] min-w-[40px] flex items-center justify-center"
                          title="Enregistrer"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="p-2.5 text-rose-600 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl min-h-[40px] min-w-[40px] flex items-center justify-center"
                          title="Annuler"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setExpandedId(isExpanded ? null : d.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          setExpandedId(isExpanded ? null : d.id);
                        }
                      }}
                      className="flex-1 flex items-start gap-3 cursor-pointer text-left select-none"
                    >
                      <div className="p-2 rounded-xl bg-navy/5 text-navy border border-border mt-0.5 shrink-0">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-gold" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-foreground-muted" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-serif font-bold text-navy text-sm sm:text-base">
                            {d.name}
                          </span>
                          {d.code_dewey && (
                            <span className="px-2 py-0.5 rounded-md bg-gold/10 text-gold border border-gold/20 text-[10px] font-mono font-bold">
                              Dewey {d.code_dewey}
                            </span>
                          )}
                          <span className="text-[11px] text-foreground-muted">
                            ({disciplineDomains.length} sous-catégorie{disciplineDomains.length > 1 ? "s" : ""})
                          </span>
                        </div>
                        {d.description && (
                          <p className="text-xs text-foreground-muted mt-0.5 line-clamp-1">{d.description}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {!isEditing && (
                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(d.id);
                          setEditName(d.name);
                          setEditDewey(d.code_dewey || "");
                        }}
                        className="p-2 text-foreground-muted hover:text-navy hover:bg-background-secondary rounded-xl transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center"
                        title="Modifier"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(d.id, d.name)}
                        className="p-2 text-rose-600 hover:bg-rose-500/10 rounded-xl transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Section dépliée : sous-catégories (Domain) */}
                {isExpanded && (
                  <div className="mt-4 pt-3 pl-4 sm:pl-9 border-t border-border space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-navy uppercase tracking-wider flex items-center gap-1.5">
                        <Folder className="w-3.5 h-3.5 text-gold" />
                        Sous-catégories rattachées ({disciplineDomains.length})
                      </h4>
                    </div>

                    {disciplineDomains.length === 0 ? (
                      <p className="text-xs text-foreground-muted italic">
                        Aucune sous-catégorie pour cette discipline.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {disciplineDomains.map((dom) => (
                          <div
                            key={dom.id}
                            className="p-2.5 rounded-xl bg-background-secondary border border-border flex items-center justify-between text-xs"
                          >
                            <span className="font-medium text-navy truncate">{dom.name}</span>
                            <button
                              type="button"
                              onClick={() => handleDeleteDomain(dom.id)}
                              className="p-1 text-rose-600 hover:bg-rose-500/10 rounded-lg transition-colors ml-2 shrink-0"
                              title="Supprimer la sous-catégorie"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Ajout d'une sous-catégorie */}
                    <div className="pt-2 flex items-center gap-2 max-w-md">
                      <input
                        type="text"
                        value={creatingDomainFor === d.id ? newDomainName : ""}
                        onChange={(e) => {
                          setCreatingDomainFor(d.id);
                          setNewDomainName(e.target.value);
                        }}
                        onFocus={() => setCreatingDomainFor(d.id)}
                        placeholder="Ajouter une sous-catégorie..."
                        className="flex-1 px-3 py-2 text-xs border border-border rounded-xl bg-background text-navy focus:outline-none focus:border-gold min-h-[38px]"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddDomain(d.id)}
                        className="px-4 py-2 rounded-xl bg-gold/10 border border-gold/30 text-gold hover:bg-gold/20 text-xs font-bold min-h-[38px] transition-colors"
                      >
                        Ajouter
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
