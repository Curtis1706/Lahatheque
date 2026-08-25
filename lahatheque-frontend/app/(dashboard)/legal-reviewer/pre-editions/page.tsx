"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileSpreadsheet,
  PlusCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Building2,
  Search,
  Users,
  Eye,
  ArrowRight,
  Sparkles,
  FileText,
  Filter,
  Edit2,
  Trash2,
  RotateCw,
} from "lucide-react";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { Modal } from "@/components/ui/modal";
import { StatusBadge } from "@/components/ui/status-badge";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { DatePicker } from "@/components/ui/date-picker";
import { EditPreEditionModal } from "@/components/features/legal/edit-pre-edition-modal";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import {
  getPreEditionContracts,
  createPreEditionContract,
  updatePreEditionStatus,
  deletePreEdition,
  getContractFormOptions,
} from "@/lib/services/legal";
import type {
  PreEditionContract,
  ContractFormOptions,
} from "@/lib/types/legal";
import { toast } from "sonner";

export default function LegalPreEditionsPage() {
  const router = useRouter();
  const [preEditions, setPreEditions] = useState<PreEditionContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Options pour la sélection
  const [formOptions, setFormOptions] = useState<ContractFormOptions | null>(null);

  // Modale création pré-édition
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [isExistingAuthor, setIsExistingAuthor] = useState(true);
  const [selectedAuthorId, setSelectedAuthorId] = useState("");
  const [customAuthorName, setCustomAuthorName] = useState("");
  const [customAuthorEmail, setCustomAuthorEmail] = useState("");
  const [selectedInstitutionId, setSelectedInstitutionId] = useState("");
  const [customUniversity, setCustomUniversity] = useState("Université d'Abomey-Calavi (UAC)");
  const [faculty, setFaculty] = useState("Faculté de Droit et de Science Politique (FADESP)");
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Modale détails & transition de statut
  const [selectedDossier, setSelectedDossier] = useState<PreEditionContract | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Modale Édition CRUD
  const [dossierToEdit, setDossierToEdit] = useState<PreEditionContract | null>(null);

  // Modale Suppression / Archivage CRUD
  const [dossierToDelete, setDossierToDelete] = useState<PreEditionContract | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Chargement des données
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPreEditionContracts({
        search: searchQuery.trim() || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
      });
      setPreEditions(data);
    } catch (err) {
      console.error("Erreur chargement pré-éditions:", err);
      toast.error("Impossible de charger les dossiers de pré-édition.");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter]);

  const handleDeleteDossierConfirm = async () => {
    if (!dossierToDelete) return;
    try {
      setDeleting(true);
      const ok = await deletePreEdition(dossierToDelete.id);
      if (ok) {
        toast.success(`Dossier ${dossierToDelete.code_dossier} supprimé avec succès.`);
        setPreEditions((prev) => prev.filter((p) => p.id !== dossierToDelete.id));
        setDossierToDelete(null);
        if (selectedDossier?.id === dossierToDelete.id) {
          setIsDetailModalOpen(false);
          setSelectedDossier(null);
        }
        loadData();
      } else {
        toast.error("Erreur lors de la suppression du dossier.");
      }
    } catch (err: any) {
      toast.error(err.message || "Erreur de suppression.");
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 200);
    return () => clearTimeout(timer);
  }, [loadData]);

  // Chargement des options d'auteurs et d'universités
  useEffect(() => {
    async function loadOptions() {
      try {
        const opts = await getContractFormOptions();
        setFormOptions(opts);
        if (opts.authors && opts.authors.length > 0) {
          setSelectedAuthorId(opts.authors[0].id);
        }
        if (opts.institutions && opts.institutions.length > 0) {
          setSelectedInstitutionId(opts.institutions[0].id);
          setCustomUniversity(opts.institutions[0].name);
        }
      } catch (err) {
        console.error("Erreur chargement options formulaire:", err);
      }
    }
    loadOptions();
  }, []);

  // Formatage pour SearchableSelect
  const authorOptions = useMemo(() => {
    if (!formOptions?.authors) return [];
    return formOptions.authors.map((a) => ({
      value: a.id,
      label: a.name,
      subtitle: a.email,
      badge: a.phone || "Auteur",
    }));
  }, [formOptions]);

  const institutionOptions = useMemo(() => {
    if (!formOptions?.institutions) return [];
    return formOptions.institutions.map((i) => ({
      value: i.id,
      label: i.name,
      subtitle: `Pays: ${i.country}`,
      badge: `Taux: ${i.rate}%`,
    }));
  }, [formOptions]);

  // Métriques KPI
  const stats = useMemo(() => {
    const total = preEditions.length;
    const pendingManuscript = preEditions.filter((p) => p.status === "en_attente_depot").length;
    const inLayout = preEditions.filter((p) => p.status === "maquette_en_cours").length;
    const validated = preEditions.filter((p) => p.status === "valide_legalement" || p.status === "depot_lie").length;
    return { total, pendingManuscript, inLayout, validated };
  }, [preEditions]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    let finalAuthorName = customAuthorName.trim();
    let finalAuthorEmail = customAuthorEmail.trim();

    if (isExistingAuthor) {
      const auth = formOptions?.authors.find((a) => a.id === selectedAuthorId);
      if (auth) {
        finalAuthorName = auth.name;
        finalAuthorEmail = auth.email;
      }
    }

    let finalUniversityName = customUniversity;
    if (selectedInstitutionId) {
      const inst = formOptions?.institutions.find((i) => i.id === selectedInstitutionId);
      if (inst) finalUniversityName = inst.name;
    }

    if (!title || !finalAuthorName) {
      toast.error("Veuillez renseigner le titre prévisionnel et l'auteur.");
      return;
    }

    setSubmitting(true);
    try {
      const created = await createPreEditionContract({
        title,
        author_name: finalAuthorName,
        author_email: finalAuthorEmail || undefined,
        university: finalUniversityName,
        faculty,
        expected_delivery_date: expectedDeliveryDate || undefined,
        notes: notes.trim() || undefined,
      });

      if (created) {
        setPreEditions((prev) => [created, ...prev]);
        toast.success("Dossier de pré-édition enregistré avec succès !");
      }
      setIsModalOpen(false);
      setTitle("");
      setCustomAuthorName("");
      setCustomAuthorEmail("");
      setNotes("");
      setExpectedDeliveryDate("");
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'enregistrement.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (dossierId: string, newStatus: string) => {
    setUpdatingStatus(true);
    try {
      const ok = await updatePreEditionStatus(dossierId, { status: newStatus });
      if (ok) {
        setPreEditions((prev) =>
          prev.map((d) => (d.id === dossierId ? { ...d, status: newStatus as any } : d))
        );
        if (selectedDossier && selectedDossier.id === dossierId) {
          setSelectedDossier({ ...selectedDossier, status: newStatus as any });
        }
        toast.success("Statut du dossier mis à jour !");
      } else {
        toast.error("Impossible de mettre à jour le statut.");
      }
    } catch (err: any) {
      toast.error(err.message || "Erreur de mise à jour.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleConvertToContract = (dossier: PreEditionContract) => {
    router.push(
      `/legal-reviewer/contracts/new?pre_edition_id=${dossier.id}&title=${encodeURIComponent(
        dossier.title
      )}&author_name=${encodeURIComponent(dossier.author_name)}`
    );
  };

  const columns: DataTableColumn<PreEditionContract>[] = [
    {
      key: "title",
      header: "Code Dossier & Titre Prévisionnel",
      cell: (row) => (
        <div
          onClick={() => {
            setSelectedDossier(row);
            setIsDetailModalOpen(true);
          }}
          className="cursor-pointer group block"
        >
          <span className="font-mono font-bold text-[10px] text-gold uppercase px-1.5 py-0.5 rounded bg-gold/10 border border-gold/20 inline-block mb-1">
            {row.code_dossier}
          </span>
          <p className="font-bold text-xs text-navy group-hover:text-gold transition-colors line-clamp-2">
            {row.title}
          </p>
        </div>
      ),
    },
    {
      key: "author_name",
      header: "Auteur Bénéficiaire",
      cell: (row) => (
        <div>
          <span className="font-semibold text-xs text-foreground block">{row.author_name}</span>
          {row.author_email && (
            <span className="text-[10px] text-foreground-muted font-mono">{row.author_email}</span>
          )}
        </div>
      ),
    },
    {
      key: "university",
      header: "Institution & Faculté",
      cell: (row) => (
        <div>
          <p className="font-semibold text-xs text-navy">{row.university}</p>
          <p className="text-[10px] text-foreground-muted truncate max-w-[220px]">{row.faculty}</p>
        </div>
      ),
    },
    {
      key: "created_at",
      header: "Remise Prévue",
      hideOnMobile: true,
      cell: (row) => {
        if (!row.expected_delivery_date) {
          return <span className="text-2xs text-foreground-muted italic">Non définie</span>;
        }
        const d = new Date(row.expected_delivery_date);
        return (
          <span className="text-xs font-mono font-medium text-navy">
            {d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
          </span>
        );
      },
    },
    {
      key: "status",
      header: "Statut Cycle de Vie",
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "actions" as keyof PreEditionContract,
      header: "Actions",
      cell: (row) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          {/* Bouton de conversion directe en contrat */}
          <button
            type="button"
            onClick={() => handleConvertToContract(row)}
            className="px-2.5 py-1.5 rounded-xl bg-navy hover:bg-navy-dark text-gold font-bold text-[11px] transition-colors whitespace-nowrap min-h-[36px] inline-flex items-center gap-1 border border-gold/30 shadow-xs cursor-pointer"
            title="Générer et sceller le Contrat d'Édition Officiel"
          >
            <FileText className="w-3.5 h-3.5 text-gold" />
            <span className="hidden sm:inline">Contrat</span>
          </button>

          {/* Bouton Fiche Détail */}
          <button
            type="button"
            onClick={() => {
              setSelectedDossier(row);
              setIsDetailModalOpen(true);
            }}
            className="p-2 rounded-xl bg-background hover:bg-background-secondary text-foreground-muted hover:text-navy transition-colors border border-border min-h-[36px] min-w-[36px] inline-flex items-center justify-center cursor-pointer"
            title="Consulter les détails du dossier"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>

          {/* Bouton Modifier */}
          <button
            type="button"
            onClick={() => setDossierToEdit(row)}
            className="p-2 rounded-xl bg-background hover:bg-background-secondary text-navy font-bold text-xs transition-colors border border-border min-h-[36px] min-w-[36px] inline-flex items-center justify-center cursor-pointer"
            title="Modifier ce dossier de pré-édition"
          >
            <Edit2 className="w-3.5 h-3.5 text-navy" />
          </button>

          {/* Bouton Supprimer / Archiver */}
          <button
            type="button"
            onClick={() => setDossierToDelete(row)}
            className="p-2 rounded-xl bg-background hover:bg-destructive/10 text-destructive font-bold text-xs transition-colors border border-border hover:border-destructive/30 min-h-[36px] min-w-[36px] inline-flex items-center justify-center cursor-pointer"
            title="Archiver ce dossier de pré-édition"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/legal-reviewer" className="hover:text-navy">
          Vue d&apos;ensemble
        </Link>
        <span>/</span>
        <span className="text-navy font-semibold">Dossiers de Pré-édition</span>
      </div>

      {/* En-tête de page */}
      <div className="border-b border-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/legal-reviewer"
            className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Vue d&apos;ensemble
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
            <FileSpreadsheet className="w-4 h-4 text-gold" />
            Pré-Enregistrement &amp; Cadrage Légal
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Dossiers de Pré-édition
          </h1>
          <p className="text-xs text-foreground-muted mt-1">
            Enregistrement préalable des projets d&apos;ouvrages avant fabrication maquette et conversion en contrat scellé.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 bg-navy hover:bg-navy-dark text-gold text-xs font-bold px-4 py-2.5 rounded-xl transition-colors border border-gold/30 shadow-xs min-h-[44px] cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          Nouveau Dossier Pré-édition
        </button>
      </div>

      {/* Cartes KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-5 rounded-2xl bg-background border border-border shadow-xs space-y-1">
          <span className="text-2xs text-foreground-muted uppercase font-bold tracking-wider block">
            Total Dossiers
          </span>
          <p className="font-serif text-2xl font-bold text-navy">{stats.total}</p>
        </div>

        <div className="p-5 rounded-2xl bg-background border border-border shadow-xs space-y-1">
          <span className="text-2xs text-foreground-muted uppercase font-bold tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-gold" /> En attente manuscrit
          </span>
          <p className="font-serif text-2xl font-bold text-navy">{stats.pendingManuscript}</p>
        </div>

        <div className="p-5 rounded-2xl bg-background border border-border shadow-xs space-y-1">
          <span className="text-2xs text-foreground-muted uppercase font-bold tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-gold" /> Maquette en cours
          </span>
          <p className="font-serif text-2xl font-bold text-navy">{stats.inLayout}</p>
        </div>

        <div className="p-5 rounded-2xl bg-background border border-border shadow-xs space-y-1">
          <span className="text-2xs text-foreground-muted uppercase font-bold tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-gold" /> Validés / Scellés
          </span>
          <p className="font-serif text-2xl font-bold text-navy">{stats.validated}</p>
        </div>
      </div>

      {/* Barre de Recherche et Filtres */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-background-secondary/60 p-3 rounded-2xl border border-border">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-foreground-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par titre, auteur, code dossier, université..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-background border border-border rounded-xl focus:outline-none focus:border-gold text-navy placeholder:text-foreground-muted min-h-[40px]"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Filter className="w-4 h-4 text-foreground-muted shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-semibold text-navy bg-background border border-border rounded-xl px-3 py-2 focus:outline-none focus:border-gold min-h-[40px] cursor-pointer"
          >
            <option value="all">Tous les statuts</option>
            <option value="en_attente_depot">En attente du manuscrit</option>
            <option value="maquette_en_cours">Maquette en cours</option>
            <option value="valide_legalement">Validé légalement</option>
            <option value="archive">Archivé</option>
          </select>

          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="p-2.5 rounded-xl bg-background hover:bg-background-secondary border border-border text-navy font-bold text-xs transition-colors min-h-[40px] min-w-[40px] inline-flex items-center justify-center cursor-pointer shadow-2xs"
            title="Actualiser les dossiers"
          >
            <RotateCw className={`w-3.5 h-3.5 text-navy ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Tableau des Dossiers */}
      <DataTable
        data={preEditions}
        columns={columns}
        rowKey="id"
        loading={loading}
        searchable={false}
        emptyMessage="Aucun dossier de pré-édition ne correspond à vos critères."
        pageSize={10}
      />

      {/* Modale de Création de Dossier Pré-Édition */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Créer un Dossier de Pré-édition"
      >
        <form onSubmit={handleCreate} className="space-y-4 pt-2">
          {/* Titre prévisionnel */}
          <div>
            <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
              Titre Prévisionnel de l&apos;Ouvrage *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ex. Manuel de Pharmacologie et Thérapeutique Clinique"
              className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-semibold min-h-[44px]"
              required
            />
          </div>

          {/* Type d'auteur (Existant ou Externe) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-navy uppercase tracking-wider">
                Auteur Bénéficiaire *
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsExistingAuthor(true)}
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-md transition-colors ${
                    isExistingAuthor ? "bg-navy text-gold" : "text-foreground-muted hover:text-navy"
                  }`}
                >
                  Compte Auteur Existant
                </button>
                <button
                  type="button"
                  onClick={() => setIsExistingAuthor(false)}
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-md transition-colors ${
                    !isExistingAuthor ? "bg-navy text-gold" : "text-foreground-muted hover:text-navy"
                  }`}
                >
                  Nouvel Auteur Externe
                </button>
              </div>
            </div>

            {isExistingAuthor ? (
              <SearchableSelect
                options={authorOptions}
                value={selectedAuthorId}
                onChange={setSelectedAuthorId}
                placeholder="Rechercher un auteur inscrit..."
                searchPlaceholder="Taper le nom ou l'email..."
                icon={<Users className="w-4 h-4" />}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={customAuthorName}
                  onChange={(e) => setCustomAuthorName(e.target.value)}
                  placeholder="Nom complet (ex. Prof. Victorien DOUGNON)"
                  className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-semibold min-h-[44px]"
                  required={!isExistingAuthor}
                />
                <input
                  type="email"
                  value={customAuthorEmail}
                  onChange={(e) => setCustomAuthorEmail(e.target.value)}
                  placeholder="Email (ex. v.dougnon@uac.bj)"
                  className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy min-h-[44px]"
                />
              </div>
            )}
          </div>

          {/* Université & Faculté */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
                Université Rattachée *
              </label>
              <SearchableSelect
                options={institutionOptions}
                value={selectedInstitutionId}
                onChange={(val) => {
                  setSelectedInstitutionId(val);
                  const inst = formOptions?.institutions.find((i) => i.id === val);
                  if (inst) setCustomUniversity(inst.name);
                }}
                placeholder="Sélectionner l'université..."
                searchPlaceholder="Rechercher l'institution..."
                icon={<Building2 className="w-4 h-4" />}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
                Faculté / Établissement *
              </label>
              <input
                type="text"
                value={faculty}
                onChange={(e) => setFaculty(e.target.value)}
                placeholder="ex. Faculté de Médecine (FSS)"
                className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-semibold min-h-[44px]"
                required
              />
            </div>
          </div>

          {/* Date prévue de remise du manuscrit */}
          <div>
            <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
              Date Prévue de Remise du Manuscrit
            </label>
            <DatePicker
              value={expectedDeliveryDate}
              onChange={setExpectedDeliveryDate}
              placeholder="Sélectionner la date estimée..."
              presets={[
                { label: "+1 mois", offsetMonths: 1 },
                { label: "+3 mois", offsetMonths: 3 },
                { label: "+6 mois", offsetMonths: 6 },
              ]}
            />
          </div>

          {/* Notes juridiques */}
          <div>
            <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
              Notes &amp; Particularités Juridiques
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Engagement de publication, préaccord d'exclusivité, volume estimé..."
              className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy min-h-[70px]"
            />
          </div>

          {/* Boutons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-border text-xs font-semibold text-foreground-muted hover:text-navy transition-colors min-h-[44px]"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-navy text-gold text-xs font-bold hover:bg-navy-dark transition-colors border border-gold/30 disabled:opacity-50 min-h-[44px]"
            >
              {submitting ? "Enregistrement..." : "Enregistrer la Pré-Édition"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modale de Consultation et Mise à Jour de Statut */}
      {selectedDossier && (
        <Modal
          open={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={`Dossier ${selectedDossier.code_dossier}`}
        >
          <div className="space-y-4 text-xs pt-2">
            <div className="p-4 rounded-2xl bg-background-secondary border border-border space-y-2">
              <span className="text-2xs font-bold text-gold uppercase tracking-wider">
                Titre Prévisionnel
              </span>
              <h3 className="font-serif text-base font-bold text-navy">
                {selectedDossier.title}
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-foreground-muted text-[10px] uppercase font-bold block">
                  Auteur
                </span>
                <span className="font-semibold text-navy">{selectedDossier.author_name}</span>
                {selectedDossier.author_email && (
                  <span className="text-foreground-muted text-[10px] block font-mono">
                    {selectedDossier.author_email}
                  </span>
                )}
              </div>

              <div>
                <span className="text-foreground-muted text-[10px] uppercase font-bold block">
                  Statut Actuel
                </span>
                <StatusBadge status={selectedDossier.status} />
              </div>

              <div>
                <span className="text-foreground-muted text-[10px] uppercase font-bold block">
                  Institution
                </span>
                <span className="font-semibold text-navy">{selectedDossier.university}</span>
              </div>

              <div>
                <span className="text-foreground-muted text-[10px] uppercase font-bold block">
                  Faculté
                </span>
                <span className="font-semibold text-navy">{selectedDossier.faculty}</span>
              </div>
            </div>

            {selectedDossier.expected_delivery_date && (
              <div>
                <span className="text-foreground-muted text-[10px] uppercase font-bold block">
                  Date Prévue de Remise du Manuscrit
                </span>
                <span className="font-mono font-bold text-navy">
                  {new Date(selectedDossier.expected_delivery_date).toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            )}

            {selectedDossier.notes && (
              <div className="p-3 rounded-xl bg-background border border-border text-foreground-muted text-[11px]">
                <span className="font-bold text-navy block mb-0.5">Notes juridiques :</span>
                <p>{selectedDossier.notes}</p>
              </div>
            )}

            {/* Changement de statut rapide */}
            <div className="p-4 rounded-2xl bg-background-secondary border border-border space-y-2.5">
              <span className="font-bold text-navy text-xs uppercase tracking-wider block">
                Faire progresser le statut du dossier
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  disabled={updatingStatus || selectedDossier.status === "en_attente_depot"}
                  onClick={() => handleStatusChange(selectedDossier.id, "en_attente_depot")}
                  className={`p-2.5 rounded-xl text-center text-2xs font-bold border transition-colors ${
                    selectedDossier.status === "en_attente_depot"
                      ? "bg-navy text-gold border-gold/30"
                      : "bg-background hover:bg-background-secondary text-navy border-border"
                  }`}
                >
                  En attente manuscrit
                </button>

                <button
                  type="button"
                  disabled={updatingStatus || selectedDossier.status === "maquette_en_cours"}
                  onClick={() => handleStatusChange(selectedDossier.id, "maquette_en_cours")}
                  className={`p-2.5 rounded-xl text-center text-2xs font-bold border transition-colors ${
                    selectedDossier.status === "maquette_en_cours"
                      ? "bg-navy text-gold border-gold/30"
                      : "bg-background hover:bg-background-secondary text-navy border-border"
                  }`}
                >
                  Maquette en cours
                </button>

                <button
                  type="button"
                  disabled={updatingStatus || selectedDossier.status === "valide_legalement"}
                  onClick={() => handleStatusChange(selectedDossier.id, "valide_legalement")}
                  className={`p-2.5 rounded-xl text-center text-2xs font-bold border transition-colors ${
                    selectedDossier.status === "valide_legalement"
                      ? "bg-navy text-gold border-gold/30"
                      : "bg-background hover:bg-background-secondary text-navy border-border"
                  }`}
                >
                  Validé légalement
                </button>
              </div>
            </div>

            {/* Actions dans la modale : Modifier, Archiver, Conversion */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsDetailModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-foreground-muted hover:text-navy min-h-[44px]"
                >
                  Fermer
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsDetailModalOpen(false);
                    setDossierToEdit(selectedDossier);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-background hover:bg-background-secondary border border-border text-xs font-bold text-navy inline-flex items-center gap-1.5 min-h-[44px] cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5 text-navy" />
                  Modifier
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDossierToDelete(selectedDossier);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-background hover:bg-destructive/10 border border-border hover:border-destructive/30 text-xs font-bold text-destructive inline-flex items-center gap-1.5 min-h-[44px] cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Archiver
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsDetailModalOpen(false);
                  handleConvertToContract(selectedDossier);
                }}
                className="px-4 py-2 rounded-xl bg-navy hover:bg-navy-dark text-gold font-bold text-xs transition-colors inline-flex items-center gap-2 min-h-[44px] border border-gold/30 shadow-xs cursor-pointer"
              >
                <FileText className="w-4 h-4 text-gold" />
                Générer Contrat d&apos;Édition
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modale d'Édition CRUD Pré-édition */}
      {dossierToEdit && (
        <EditPreEditionModal
          dossier={dossierToEdit}
          isOpen={!!dossierToEdit}
          onClose={() => setDossierToEdit(null)}
          onSuccess={loadData}
        />
      )}

      {/* Modale de Confirmation de Suppression / Archivage */}
      {dossierToDelete && (
        <ConfirmationModal
          isOpen={!!dossierToDelete}
          onClose={() => setDossierToDelete(null)}
          onConfirm={handleDeleteDossierConfirm}
          loading={deleting}
          title="Archiver le dossier de pré-édition"
          description={`Êtes-vous sûr de vouloir archiver le dossier « ${dossierToDelete.code_dossier} — ${dossierToDelete.title} » ? Son statut passera à archivé.`}
          confirmLabel="Archiver le dossier"
          isDestructive={true}
        />
      )}
    </div>
  );
}
