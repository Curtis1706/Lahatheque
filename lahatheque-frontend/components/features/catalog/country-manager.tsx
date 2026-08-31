"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Plus,
  Trash2,
  Pencil,
  Globe,
  Check,
  X,
  Phone,
  Coins,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { Modal } from "@/components/ui/modal";
import { ConfirmationModal } from "@/components/ui/confirmation-modal";
import { CountryFlag } from "@/components/ui/country-flag";
import {
  getCountries,
  createCountry,
  updateCountry,
  deleteCountry,
  AFRICAN_COUNTRIES_PRESET,
  type CountryItem,
} from "@/lib/services/countries";

interface CountryTableRow extends CountryItem {
  status: string;
}

export function CountryManager() {
  const [countries, setCountries] = useState<CountryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Création / Édition
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCountry, setEditingCountry] = useState<CountryItem | null>(null);
  const [formCode, setFormCode] = useState("");
  const [formName, setFormName] = useState("");
  const [formPhoneCode, setFormPhoneCode] = useState("");
  const [formCurrency, setFormCurrency] = useState("FCFA");
  const [formIsActive, setFormIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Modal Confirmation Suppression
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [countryToDelete, setCountryToDelete] = useState<CountryItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Chargement des pays
  async function load() {
    setLoading(true);
    try {
      const data = await getCountries();
      setCountries(data);
    } catch {
      toast.error("Erreur de chargement des pays.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // Formatage pour la DataTable
  const tableData: CountryTableRow[] = useMemo(() => {
    return countries.map((c) => ({
      ...c,
      status: c.is_active !== false ? "active" : "inactive",
    }));
  }, [countries]);

  // Ouverture du modal de création
  const handleOpenCreate = () => {
    setEditingCountry(null);
    setFormCode("");
    setFormName("");
    setFormPhoneCode("+229");
    setFormCurrency("FCFA");
    setFormIsActive(true);
    setModalOpen(true);
  };

  // Sélection rapide d'un pays dans le preset
  const handleSelectPreset = (preset: typeof AFRICAN_COUNTRIES_PRESET[0]) => {
    setFormCode(preset.code);
    setFormName(preset.name);
    setFormPhoneCode(preset.phone_code);
    setFormCurrency(preset.currency);
  };

  // Ouverture du modal d'édition
  const handleOpenEdit = (country: CountryItem) => {
    setEditingCountry(country);
    setFormCode(country.code);
    setFormName(country.name);
    setFormPhoneCode(country.phone_code || "");
    setFormCurrency(country.currency || "FCFA");
    setFormIsActive(country.is_active !== false);
    setModalOpen(true);
  };

  // Soumission formulaire
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formCode.trim() || !formName.trim()) {
      toast.error("Le code ISO et le nom du pays sont obligatoires.");
      return;
    }

    setSubmitting(true);
    try {
      if (editingCountry) {
        await updateCountry(editingCountry.id, {
          code: formCode.trim().toUpperCase(),
          name: formName.trim(),
          phone_code: formPhoneCode.trim(),
          currency: formCurrency.trim(),
          is_active: formIsActive,
        });
        toast.success(`Pays « ${formName} » mis à jour.`);
      } else {
        await createCountry({
          code: formCode.trim().toUpperCase(),
          name: formName.trim(),
          phone_code: formPhoneCode.trim(),
          currency: formCurrency.trim(),
          is_active: formIsActive,
        });
        toast.success(`Pays « ${formName} » ajouté avec succès.`);
      }
      setModalOpen(false);
      load();
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'enregistrement du pays.");
    } finally {
      setSubmitting(false);
    }
  };

  // Bascule rapide statut Actif / Inactif
  const handleToggleStatus = async (country: CountryItem) => {
    const nextStatus = country.is_active === false;
    try {
      await updateCountry(country.id, {
        is_active: nextStatus,
      });
      toast.success(
        nextStatus
          ? `Pays « ${country.name} » activé (disponible à l'inscription).`
          : `Pays « ${country.name} » désactivé.`
      );
      load();
    } catch {
      toast.error("Erreur lors de la modification du statut.");
    }
  };

  // Suppression
  const handleConfirmDelete = async () => {
    if (!countryToDelete) return;
    setDeleting(true);
    try {
      await deleteCountry(countryToDelete.id);
      toast.success(`Pays « ${countryToDelete.name} » supprimé.`);
      setDeleteModalOpen(false);
      setCountryToDelete(null);
      load();
    } catch (err: any) {
      toast.error(err.message || "Suppression impossible.");
    } finally {
      setDeleting(false);
    }
  };

  // Colonnes DataTable
  const columns: DataTableColumn<CountryTableRow>[] = [
    {
      key: "name",
      header: "Pays & Drapeau",
      cell: (row) => (
        <div className="flex items-center gap-3">
          <CountryFlag code={row.code} title={row.name} className="w-6 h-4 rounded-xs shadow-xs" />
          <div>
            <span className="font-serif font-bold text-navy text-sm block">
              {row.name}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "code",
      header: "Code ISO",
      cell: (row) => (
        <span className="px-2 py-0.5 rounded-md bg-navy/5 text-navy border border-border text-xs font-mono font-bold inline-block">
          {row.code}
        </span>
      ),
    },
    {
      key: "phone_code",
      header: "Indicatif",
      cell: (row) => (
        <span className="inline-flex items-center gap-1 text-xs text-foreground font-mono">
          <Phone className="w-3.5 h-3.5 text-foreground-muted" />
          <span>{row.phone_code || "—"}</span>
        </span>
      ),
    },
    {
      key: "currency",
      header: "Devise",
      cell: (row) => (
        <span className="inline-flex items-center gap-1 text-xs text-foreground font-semibold">
          <Coins className="w-3.5 h-3.5 text-gold" />
          <span>{row.currency || "FCFA"}</span>
        </span>
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
            onClick={() => handleToggleStatus(row)}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer border ${
              active
                ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 hover:bg-emerald-500/20"
                : "bg-slate-500/10 text-slate-600 border-slate-500/20 hover:bg-slate-500/20"
            }`}
            title="Cliquer pour basculer la disponibilité à l'inscription"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-slate-400"}`} />
            {active ? "Actif (Disponible)" : "Inactif"}
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
            onClick={() => handleOpenEdit(row)}
            className="p-2 text-foreground-muted hover:text-navy hover:bg-background-secondary rounded-xl transition-colors cursor-pointer"
            title="Modifier le pays"
            aria-label="Modifier"
          >
            <Pencil className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => {
              setCountryToDelete(row);
              setDeleteModalOpen(true);
            }}
            className="p-2 text-rose-600 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
            title="Supprimer le pays"
            aria-label="Supprimer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  // Carte mobile
  const renderMobileCard = (row: CountryTableRow) => {
    const active = row.is_active !== false;
    return (
      <div className="space-y-3 bg-background p-4 rounded-2xl border border-border">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <CountryFlag code={row.code} title={row.name} className="w-7 h-5 rounded-xs shadow-xs" />
            <div>
              <h4 className="font-serif font-bold text-navy text-base leading-snug">
                {row.name}
              </h4>
              <span className="text-[11px] font-mono text-foreground-muted">
                ISO: {row.code} • Indicatif: {row.phone_code}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleToggleStatus(row)}
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

        <div className="pt-2 border-t border-border flex items-center justify-between gap-2 text-xs">
          <span className="font-semibold text-navy flex items-center gap-1">
            <Coins className="w-3.5 h-3.5 text-gold" />
            {row.currency || "FCFA"}
          </span>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleOpenEdit(row)}
              className="p-2 text-foreground-muted hover:text-navy rounded-lg"
              title="Modifier"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setCountryToDelete(row);
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

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-foreground-muted mb-1">
            <span>Catalogue</span>
            <span>/</span>
            <span className="text-navy font-semibold">Référentiel</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy flex items-center gap-2.5">
            <Globe className="w-6 h-6 text-gold" />
            Gestion des Pays &amp; Référentiel Géographique
          </h1>
          <p className="text-xs text-foreground-muted mt-1">
            Pays autorisés à l&apos;inscription, codes téléphoniques et devises associées aux comptes utilisateurs
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-navy hover:bg-navy-hover text-white text-xs font-bold transition-all shadow-xs self-start sm:self-auto min-h-[44px] cursor-pointer"
        >
          <Plus className="w-4 h-4 text-gold" />
          <span>Ajouter un pays</span>
        </button>
      </div>

      {/* DataTable principale */}
      <DataTable
        data={tableData}
        columns={columns}
        rowKey="id"
        loading={loading}
        searchPlaceholder="Rechercher un pays, code ISO, indicatif (+229)..."
        filterKey="status"
        filterOptions={[
          { value: "active", label: "Pays Actifs (Disponibles)" },
          { value: "inactive", label: "Pays Inactifs" },
        ]}
        filterPlaceholder="Tous les statuts"
        pageSize={10}
        pageSizeOptions={[10, 25, 50, 100]}
        showPagination={true}
        mobileCard={renderMobileCard}
        emptyMessage="Aucun pays configuré dans le référentiel."
      />

      {/* ========================================================================= */}
      {/* MODAL : Ajout / Modification d'un Pays                                    */}
      {/* ========================================================================= */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingCountry ? `Modifier « ${editingCountry.name} »` : "Ajouter un nouveau pays"}
        description="Configurez le pays, son code ISO, son indicatif téléphonique et sa disponibilité."
        maxWidth={540}
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl border border-border bg-background hover:bg-background-secondary text-navy font-bold text-xs transition-colors min-h-[44px] cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-navy hover:bg-navy-hover text-white text-xs font-bold transition-colors min-h-[44px] cursor-pointer disabled:opacity-50 shadow-xs"
            >
              {submitting ? "Enregistrement..." : (editingCountry ? "Enregistrer" : "Ajouter le pays")}
            </button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Sélection rapide Preset (si création) */}
          {!editingCountry && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-navy uppercase tracking-wider block">
                Sélection rapide (Pays africains)
              </label>
              <select
                onChange={(e) => {
                  const found = AFRICAN_COUNTRIES_PRESET.find((p) => p.code === e.target.value);
                  if (found) handleSelectPreset(found);
                }}
                defaultValue=""
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-border rounded-xl bg-background text-navy focus:outline-none focus:border-navy focus:ring-2 focus:ring-gold/30 min-h-[44px]"
              >
                <option value="" disabled>Choisir dans la liste prédéfinie...</option>
                {AFRICAN_COUNTRIES_PRESET.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.name} ({p.code} • {p.phone_code} • {p.currency})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Nom du pays */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-navy uppercase tracking-wider block">
              Nom officiel du pays *
            </label>
            <input
              type="text"
              required
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Ex: Bénin"
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-border rounded-xl bg-background text-navy focus:outline-none focus:border-navy focus:ring-2 focus:ring-gold/30 min-h-[44px]"
            />
          </div>

          {/* Grille Code ISO, Indicatif, Devise */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-navy uppercase tracking-wider block">
                Code ISO (2 lettres) *
              </label>
              <div className="flex items-center gap-2">
                {formCode && <CountryFlag code={formCode} className="w-5 h-3.5 rounded-xs" />}
                <input
                  type="text"
                  required
                  maxLength={2}
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                  placeholder="BJ"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-mono uppercase border border-border rounded-xl bg-background text-navy focus:outline-none focus:border-navy focus:ring-2 focus:ring-gold/30 min-h-[44px]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-navy uppercase tracking-wider block">
                Indicatif tél.
              </label>
              <input
                type="text"
                value={formPhoneCode}
                onChange={(e) => setFormPhoneCode(e.target.value)}
                placeholder="+229"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-mono border border-border rounded-xl bg-background text-navy focus:outline-none focus:border-navy focus:ring-2 focus:ring-gold/30 min-h-[44px]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-navy uppercase tracking-wider block">
                Devise
              </label>
              <input
                type="text"
                value={formCurrency}
                onChange={(e) => setFormCurrency(e.target.value)}
                placeholder="FCFA"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm border border-border rounded-xl bg-background text-navy focus:outline-none focus:border-navy focus:ring-2 focus:ring-gold/30 min-h-[44px]"
              />
            </div>
          </div>

          {/* Statut Actif / Inactif */}
          <div className="pt-2 border-t border-border flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-navy block">Disponibilité à l&apos;inscription</span>
              <span className="text-[11px] text-foreground-muted block">
                {formIsActive ? "Sélectionnable par les utilisateurs lors de l'inscription" : "Désactivé / Masqué"}
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

      {/* Confirmation Suppression */}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setCountryToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        loading={deleting}
        title={`Supprimer le pays « ${countryToDelete?.name} » ?`}
        description="Cette action retirera ce pays du référentiel et des options d'inscription."
        confirmLabel="Supprimer"
      />
    </div>
  );
}

export default CountryManager;
