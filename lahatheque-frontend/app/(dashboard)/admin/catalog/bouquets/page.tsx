"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Layers,
  ArrowLeft,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  BookOpen,
  Building2,
  Globe,
  Sparkles,
  CheckCircle2,
  XCircle,
  X,
  AlertCircle,
  Check,
  PieChart,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  getBouquetOfferings,
  createBouquetOffering,
  updateBouquetOffering,
  deleteBouquetOffering,
  BouquetOfferingAdmin,
} from "@/lib/services/admin";
import { searchBooks } from "@/lib/services/catalog";
import { Book } from "@/lib/types/catalog";
import { BouquetDistributionModal } from "@/components/features/bouquets/bouquet-distribution-modal";
import { BookMultiCombobox } from "@/components/features/bouquets/book-multi-combobox";
import { getDisciplines, DisciplineItem } from "@/lib/services/classification";

const BOUQUET_TYPES = [
  { value: "discipline", label: "Par Discipline", desc: "Tous les ouvrages rattachés à une discipline académique" },
  { value: "faculty", label: "Par Faculté", desc: "Ouvrages d'une faculté ou département universitaire" },
  { value: "university", label: "Intégral Université", desc: "Tous les ouvrages affiliés à un établissement partenaire" },
  { value: "country", label: "Par Pays", desc: "Ouvrages édités ou rattachés à un pays spécifique" },
  { value: "custom", label: "Personnalisé (Sur-mesure)", desc: "Sélection manuelle d'ouvrages par l'administrateur" },
] as const;

const WEST_AFRICAN_COUNTRIES = [
  { code: "BJ", label: "Bénin (BJ)" },
  { code: "SN", label: "Sénégal (SN)" },
  { code: "CI", label: "Côte d'Ivoire (CI)" },
  { code: "TG", label: "Togo (TG)" },
  { code: "NE", label: "Niger (NE)" },
  { code: "BF", label: "Burkina Faso (BF)" },
  { code: "ML", label: "Mali (ML)" },
  { code: "CM", label: "Cameroun (CM)" },
  { code: "GN", label: "Guinée (GN)" },
  { code: "FR", label: "France (FR)" },
];

export default function AdminBouquetsPage() {
  const [offerings, setOfferings] = useState<BouquetOfferingAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [subFilter, setSubFilter] = useState<string>("all");
  const [dbDisciplines, setDbDisciplines] = useState<DisciplineItem[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOffering, setEditingOffering] = useState<BouquetOfferingAdmin | null>(null);
  const [selectedDistributionBouquet, setSelectedDistributionBouquet] = useState<BouquetOfferingAdmin | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [bouquetType, setBouquetType] = useState<"discipline" | "faculty" | "university" | "country" | "custom">("discipline");
  const [discipline, setDiscipline] = useState("");
  const [facultyCode, setFacultyCode] = useState("");
  const [targetInstitution, setTargetInstitution] = useState<string>("");
  const [country, setCountry] = useState("BJ");
  const [annualPrice, setAnnualPrice] = useState("500000");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [selectedBookIds, setSelectedBookIds] = useState<string[]>([]);

  // Auxiliary data for custom & institution selectors
  const [catalogBooks, setCatalogBooks] = useState<Book[]>([]);
  const [institutions, setInstitutions] = useState<{ id: string; name: string }[]>([]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getBouquetOfferings();
      setOfferings(data);
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors du chargement des bouquets documentaires");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Load catalog books for custom bouquets
    searchBooks({}).then((books) => setCatalogBooks(books)).catch(() => {});
    // Load real disciplines from database
    getDisciplines().then((d) => setDbDisciplines(d)).catch(() => {});
    // Load institutions
    fetch("/api/bff/partners/institutions/", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        const list = Array.isArray(data) ? data : data.results || [];
        setInstitutions(list.map((i: any) => ({ id: String(i.id), name: i.name || i.title || "Université" })));
      })
      .catch(() => {});
  }, []);

  const handleTypeFilterChange = (newType: string) => {
    setTypeFilter(newType);
    setSubFilter("all");
  };

  const openCreateModal = () => {
    setEditingOffering(null);
    setTitle("");
    setBouquetType("discipline");
    setDiscipline("");
    setFacultyCode("");
    setTargetInstitution("");
    setCountry("BJ");
    setAnnualPrice("500000");
    setDescription("");
    setIsActive(true);
    setSelectedBookIds([]);
    setIsModalOpen(true);
  };

  const openEditModal = (offering: BouquetOfferingAdmin) => {
    setEditingOffering(offering);
    setTitle(offering.title);
    setBouquetType(offering.bouquet_type);
    setDiscipline(offering.discipline || "");
    setFacultyCode(offering.faculty_code || "");
    setTargetInstitution(offering.target_institution || "");
    setCountry(offering.country || "BJ");
    setAnnualPrice(String(offering.annual_price));
    setDescription(offering.description || "");
    setIsActive(offering.is_active);
    setSelectedBookIds(offering.custom_book_ids || []);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Le titre du bouquet est obligatoire");
      return;
    }

    const payload: Partial<BouquetOfferingAdmin> = {
      title: title.trim(),
      bouquet_type: bouquetType,
      discipline: bouquetType === "discipline" ? discipline.trim() : "",
      faculty_code: bouquetType === "faculty" ? facultyCode.trim() : "",
      target_institution: (bouquetType === "faculty" || bouquetType === "university") && targetInstitution ? targetInstitution : null,
      country: bouquetType === "country" ? country : "",
      annual_price: Number(annualPrice) || 0,
      description: description.trim(),
      is_active: isActive,
      custom_book_ids: bouquetType === "custom" ? selectedBookIds : [],
    };

    setSubmitting(true);
    try {
      if (editingOffering) {
        const ok = await updateBouquetOffering(editingOffering.id, payload);
        if (ok) {
          toast.success(`Le bouquet « ${title} » a été mis à jour avec succès.`);
          setIsModalOpen(false);
          loadData();
        } else {
          toast.error("Erreur lors de la mise à jour du bouquet");
        }
      } else {
        const ok = await createBouquetOffering(payload);
        if (ok) {
          toast.success(`Le bouquet « ${title} » a été créé avec succès.`);
          setIsModalOpen(false);
          loadData();
        } else {
          toast.error("Erreur lors de la création du bouquet");
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Une erreur inattendue est survenue");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (offering: BouquetOfferingAdmin) => {
    if (!confirm(`Désactiver l'offre « ${offering.title} » ?`)) return;
    try {
      const ok = await deleteBouquetOffering(offering.id);
      if (ok) {
        toast.success(`Bouquet « ${offering.title} » désactivé.`);
        loadData();
      } else {
        toast.error("Erreur lors de la désactivation");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erreur réseau");
    }
  };

  // Liste consolidée des disciplines réelles de la base de données & des bouquets
  const availableDisciplines = useMemo(() => {
    const map = new Map<string, string>();
    dbDisciplines.forEach((d) => {
      if (d.name && d.name.trim()) {
        map.set(d.name.trim().toLowerCase(), d.name.trim());
      }
    });
    offerings.forEach((o) => {
      if (o.bouquet_type === "discipline" && o.discipline && o.discipline.trim()) {
        const norm = o.discipline.trim().toLowerCase();
        if (!map.has(norm)) {
          map.set(norm, o.discipline.trim());
        }
      }
    });
    return Array.from(map.values()).sort((a, b) => a.localeCompare(b, "fr"));
  }, [dbDisciplines, offerings]);

  // Liste consolidée des facultés
  const availableFaculties = useMemo(() => {
    const set = new Set<string>();
    ["FADESP", "FASEG", "FAST", "FSS", "EPAC", "FLASH", "ENEAM", "ENSET", "INMES"].forEach((f) => set.add(f));
    offerings.forEach((o) => {
      if (o.bouquet_type === "faculty" && o.faculty_code && o.faculty_code.trim()) {
        set.add(o.faculty_code.trim());
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "fr"));
  }, [offerings]);

  const filteredOfferings = useMemo(() => {
    return offerings.filter((o) => {
      if (typeFilter !== "all" && o.bouquet_type !== typeFilter) return false;

      if (subFilter !== "all") {
        if (typeFilter === "discipline") {
          const oDisc = (o.discipline || "").toLowerCase().trim();
          const targetDisc = subFilter.toLowerCase().trim();
          if (!oDisc.includes(targetDisc) && !targetDisc.includes(oDisc)) {
            return false;
          }
        } else if (typeFilter === "faculty") {
          const oFac = (o.faculty_code || "").toLowerCase().trim();
          const targetFac = subFilter.toLowerCase().trim();
          if (!oFac.includes(targetFac) && !targetFac.includes(oFac)) {
            return false;
          }
        } else if (typeFilter === "university") {
          if (o.target_institution !== subFilter) {
            return false;
          }
        } else if (typeFilter === "country") {
          if ((o.country || "").toUpperCase() !== subFilter.toUpperCase()) {
            return false;
          }
        }
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = o.title.toLowerCase().includes(q);
        const matchDesc = (o.description || "").toLowerCase().includes(q);
        const matchDisc = (o.discipline || "").toLowerCase().includes(q);
        const matchFaculty = (o.faculty_code || "").toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchDisc && !matchFaculty) return false;
      }
      return true;
    });
  }, [offerings, searchQuery, typeFilter, subFilter]);

  const typeLabels: Record<string, string> = {
    discipline: "Discipline",
    faculty: "Faculté",
    university: "Intégral Université",
    country: "Pays",
    custom: "Sur-mesure",
  };

  const columns: DataTableColumn<BouquetOfferingAdmin>[] = [
    {
      key: "title",
      header: "Bouquet & Cible",
      cell: (row) => (
        <div className="space-y-1 py-1">
          <p className="font-serif font-bold text-xs text-navy leading-snug">{row.title}</p>
          <div className="flex items-center gap-2 flex-wrap text-[11px] text-foreground-muted">
            <span className="px-2 py-0.5 rounded-md bg-navy-light text-navy text-[10px] font-bold border border-navy-hover/20">
              {typeLabels[row.bouquet_type] || row.bouquet_type}
            </span>
            {row.bouquet_type === "discipline" && row.discipline && (
              <span className="font-medium text-navy">Discipline : {row.discipline}</span>
            )}
            {row.bouquet_type === "faculty" && row.faculty_code && (
              <span className="font-medium text-navy">Faculté : {row.faculty_code}</span>
            )}
            {row.bouquet_type === "country" && row.country && (
              <span className="font-medium text-navy">Pays : {row.country}</span>
            )}
            {row.bouquet_type === "custom" && (
              <span className="font-medium text-gold">{row.custom_book_ids?.length || 0} livre(s) choisi(s)</span>
            )}
          </div>
          {row.description && (
            <p className="text-[10px] text-foreground-muted line-clamp-1 max-w-[340px]">{row.description}</p>
          )}
        </div>
      ),
    },
    {
      key: "books_count",
      header: "Contenu Réel (Calculé)",
      cell: (row) => (
        <div className="text-xs space-y-0.5">
          <span className="inline-flex items-center gap-1 font-mono font-bold text-navy bg-background-secondary px-2.5 py-1 rounded-lg border border-border">
            <BookOpen className="w-3.5 h-3.5 text-gold" />
            {row.books_count.toLocaleString("fr-FR")} livre(s)
          </span>
          <p className="text-[9px] text-foreground-muted">Calcul temps réel</p>
        </div>
      ),
    },
    {
      key: "annual_price",
      header: "Tarif Annuel",
      cell: (row) => (
        <div className="text-xs">
          <p className="font-mono font-bold text-navy">
            {row.annual_price.toLocaleString("fr-FR")} {row.currency}
          </p>
          <p className="text-[10px] text-foreground-muted">Par an / établissement</p>
        </div>
      ),
    },
    {
      key: "is_active",
      header: "Statut",
      cell: (row) => (
        <StatusBadge
          status={row.is_active ? "active" : "inactive"}
          leftLabel={row.is_active ? "Actif au catalogue" : "Désactivé"}
        />
      ),
    },
    {
      key: "actions" as keyof BouquetOfferingAdmin,
      header: "",
      cell: (row) => (
        <div className="flex items-center gap-2 justify-end">
          <button
            onClick={() => openEditModal(row)}
            className="px-2.5 py-1.5 rounded-xl bg-navy-light text-navy text-xs font-bold hover:bg-navy-hover hover:text-white transition-colors inline-flex items-center gap-1 min-h-[36px]"
            title="Modifier le bouquet"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Modifier</span>
          </button>
          {row.is_active && (
            <button
              onClick={() => handleDelete(row)}
              className="p-2 rounded-xl text-error-foreground hover:bg-error/10 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
              title="Désactiver cette offre"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/admin" className="hover:text-navy">Administration</Link>
        <span>/</span>
        <Link href="/admin/catalog" className="hover:text-navy">Catalogue &amp; Tarifs</Link>
        <span>/</span>
        <span className="text-navy font-semibold">Bouquets Documentaires</span>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/admin/catalog" className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Catalogue &amp; Tarifs
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
            <Layers className="w-4 h-4 text-gold" />
            Offres Institutionnelles &amp; Campus
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Catalogue des Bouquets Documentaires
          </h1>
          <p className="text-xs text-foreground-muted mt-1">
            Créez et configurez les bouquets automatiques (discipline, faculté, pays) ou personnalisés proposés aux universités partenaires.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors inline-flex items-center gap-2 shadow-xs min-h-[44px]"
        >
          <Plus className="w-4 h-4 text-gold" />
          Nouveau Bouquet
        </button>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-background border border-border shadow-xs space-y-1">
          <p className="text-[11px] font-bold text-foreground-muted uppercase">Total Offres</p>
          <p className="font-serif text-2xl font-bold text-navy">{offerings.length}</p>
          <p className="text-[10px] text-foreground-muted">Bouquets enregistrés</p>
        </div>
        <div className="p-4 rounded-2xl bg-background border border-border shadow-xs space-y-1">
          <p className="text-[11px] font-bold text-foreground-muted uppercase">Automatiques</p>
          <p className="font-serif text-2xl font-bold text-navy">
            {offerings.filter((o) => o.bouquet_type !== "custom").length}
          </p>
          <p className="text-[10px] text-foreground-muted">Calculés en direct</p>
        </div>
        <div className="p-4 rounded-2xl bg-background border border-border shadow-xs space-y-1">
          <p className="text-[11px] font-bold text-foreground-muted uppercase">Personnalisés</p>
          <p className="font-serif text-2xl font-bold text-navy">
            {offerings.filter((o) => o.bouquet_type === "custom").length}
          </p>
          <p className="text-[10px] text-foreground-muted">Sélections manuelles</p>
        </div>
        <div className="p-4 rounded-2xl bg-background border border-border shadow-xs space-y-1">
          <p className="text-[11px] font-bold text-foreground-muted uppercase">Actifs</p>
          <p className="font-serif text-2xl font-bold text-navy">
            {offerings.filter((o) => o.is_active).length}
          </p>
          <p className="text-[10px] text-foreground-muted">Visibles aux universités</p>
        </div>
      </div>

      {/* Filtres & Recherche */}
      <div className="p-4 rounded-2xl bg-background border border-border flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-xs">
        <div className="relative w-full md:w-80 shrink-0">
          <Search className="w-4 h-4 text-foreground-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par titre, discipline ou faculté..."
            className="w-full pl-9 pr-3.5 py-2 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy min-h-[40px]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* 1er Filtre : Type de Bouquet */}
          <div className="relative min-w-[200px] flex-1 sm:flex-initial">
            <select
              value={typeFilter}
              onChange={(e) => handleTypeFilterChange(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-background-secondary border border-border rounded-xl text-navy font-semibold focus:outline-none focus:border-gold min-h-[40px]"
            >
              <option value="all">Tous les Types de Bouquets</option>
              {BOUQUET_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* 2ème Filtre Dynamique Contextuel : Disciplines de la BD */}
          {typeFilter === "discipline" && (
            <div className="relative min-w-[220px] flex-1 sm:flex-initial animate-in fade-in duration-200">
              <select
                value={subFilter}
                onChange={(e) => setSubFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-background-secondary border border-gold/50 rounded-xl text-navy font-semibold focus:outline-none focus:border-gold min-h-[40px]"
              >
                <option value="all">Toutes les Disciplines ({availableDisciplines.length})</option>
                {availableDisciplines.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 2ème Filtre Dynamique Contextuel : Facultés */}
          {typeFilter === "faculty" && (
            <div className="relative min-w-[200px] flex-1 sm:flex-initial animate-in fade-in duration-200">
              <select
                value={subFilter}
                onChange={(e) => setSubFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-background-secondary border border-gold/50 rounded-xl text-navy font-semibold focus:outline-none focus:border-gold min-h-[40px]"
              >
                <option value="all">Toutes les Facultés ({availableFaculties.length})</option>
                {availableFaculties.map((f) => (
                  <option key={f} value={f}>
                    Faculté : {f}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 2ème Filtre Dynamique Contextuel : Universités */}
          {typeFilter === "university" && (
            <div className="relative min-w-[220px] flex-1 sm:flex-initial animate-in fade-in duration-200">
              <select
                value={subFilter}
                onChange={(e) => setSubFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-background-secondary border border-gold/50 rounded-xl text-navy font-semibold focus:outline-none focus:border-gold min-h-[40px]"
              >
                <option value="all">Toutes les Universités ({institutions.length})</option>
                {institutions.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 2ème Filtre Dynamique Contextuel : Pays */}
          {typeFilter === "country" && (
            <div className="relative min-w-[200px] flex-1 sm:flex-initial animate-in fade-in duration-200">
              <select
                value={subFilter}
                onChange={(e) => setSubFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-background-secondary border border-gold/50 rounded-xl text-navy font-semibold focus:outline-none focus:border-gold min-h-[40px]"
              >
                <option value="all">Tous les Pays ({WEST_AFRICAN_COUNTRIES.length})</option>
                {WEST_AFRICAN_COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Bouton Réinitialiser */}
          {(typeFilter !== "all" || subFilter !== "all" || searchQuery.trim()) && (
            <button
              type="button"
              onClick={() => {
                setTypeFilter("all");
                setSubFilter("all");
                setSearchQuery("");
              }}
              className="px-3 py-2 text-xs rounded-xl bg-navy-light text-navy font-semibold hover:bg-navy hover:text-white transition-colors flex items-center gap-1.5 min-h-[40px] shrink-0"
              title="Réinitialiser les filtres"
            >
              <RotateCcw className="w-3.5 h-3.5 text-gold" />
              <span>Réinitialiser</span>
            </button>
          )}
        </div>
      </div>

      {/* Table DataTable paginée */}
      <DataTable
        data={filteredOfferings}
        columns={columns}
        rowKey="id"
        loading={loading}
        emptyMessage="Aucun bouquet documentaire ne correspond à vos filtres."
        pageSize={10}
      />

      {/* Modal Création / Édition */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 overflow-y-auto">
          <div className="relative w-full max-w-2xl rounded-3xl bg-background border border-border shadow-2xl p-6 sm:p-8 my-8 max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-navy flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-gold" />
                  {editingOffering ? "Édition Bouquet" : "Nouvelle Offre"}
                </span>
                <h3 className="font-serif text-xl font-bold text-navy">
                  {editingOffering ? `Modifier « ${editingOffering.title} »` : "Créer un Bouquet Documentaire"}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-foreground-muted hover:bg-background-secondary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Type de bouquet */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-navy">
                  Type de Bouquet <span className="text-gold">*</span>
                </label>
                <select
                  value={bouquetType}
                  onChange={(e) => setBouquetType(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl text-navy font-semibold focus:outline-none focus:border-gold min-h-[44px]"
                >
                  {BOUQUET_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label} — {t.desc}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-foreground-muted">
                  {bouquetType === "custom"
                    ? "Bouquet sur-mesure composé manuellement par sélection d'ouvrages."
                    : "Bouquet dynamique : le volume d'ouvrages est recalculé en direct à chaque consultation selon les critères."}
                </p>
              </div>

              {/* Titre du bouquet */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-navy">
                  Titre du Bouquet <span className="text-gold">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex : Bouquet Sciences Juridiques & Politiques"
                  className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl text-navy focus:outline-none focus:border-gold min-h-[44px]"
                />
              </div>

              {/* Champs Conditionnels selon le type */}
              {bouquetType === "discipline" && (
                <div className="space-y-2 p-4 rounded-2xl bg-background-secondary border border-border">
                  <label className="block text-xs font-bold text-navy">
                    Discipline Académique <span className="text-gold">*</span>
                  </label>
                  <div className="space-y-2">
                    <select
                      value={availableDisciplines.includes(discipline) ? discipline : (discipline ? "__custom__" : "")}
                      onChange={(e) => {
                        if (e.target.value !== "__custom__") {
                          setDiscipline(e.target.value);
                        }
                      }}
                      className="w-full px-3.5 py-2.5 text-xs bg-background border border-border rounded-xl text-navy font-semibold focus:outline-none focus:border-gold min-h-[44px]"
                    >
                      <option value="">-- Choisir une discipline de la base de données --</option>
                      {availableDisciplines.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                      <option value="__custom__">Autre discipline (saisie libre ci-dessous)...</option>
                    </select>

                    <input
                      type="text"
                      required
                      value={discipline}
                      onChange={(e) => setDiscipline(e.target.value)}
                      placeholder="Nom de la discipline (ex : Droit, Sciences Économiques...)"
                      className="w-full px-3.5 py-2.5 text-xs bg-background border border-border rounded-xl text-navy focus:outline-none focus:border-gold min-h-[44px]"
                    />
                  </div>
                  <p className="text-[10px] text-foreground-muted">
                    Tous les ouvrages publiés rattachés à cette discipline seront inclus automatiquement.
                  </p>
                </div>
              )}

              {bouquetType === "faculty" && (
                <div className="space-y-4 p-4 rounded-2xl bg-background-secondary border border-border">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-navy">
                      Code ou Nom de Faculté <span className="text-gold">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={facultyCode}
                      onChange={(e) => setFacultyCode(e.target.value)}
                      placeholder="Ex : FADESP, FASEG, FAST, FSS..."
                      className="w-full px-3.5 py-2.5 text-xs bg-background border border-border rounded-xl text-navy focus:outline-none focus:border-gold min-h-[44px]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-navy">
                      Établissement Spécifique (Optionnel)
                    </label>
                    <select
                      value={targetInstitution}
                      onChange={(e) => setTargetInstitution(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-background border border-border rounded-xl text-navy focus:outline-none focus:border-gold min-h-[44px]"
                    >
                      <option value="">Tous les établissements (Portée générale)</option>
                      {institutions.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {bouquetType === "university" && (
                <div className="space-y-1.5 p-4 rounded-2xl bg-background-secondary border border-border">
                  <label className="block text-xs font-bold text-navy">
                    Université Cible (Optionnel pour offre générale)
                  </label>
                  <select
                    value={targetInstitution}
                    onChange={(e) => setTargetInstitution(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-background border border-border rounded-xl text-navy focus:outline-none focus:border-gold min-h-[44px]"
                  >
                    <option value="">Université de l&apos;établissement connecté (Automatique)</option>
                    {institutions.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-foreground-muted">
                    Si vide, le bouquet sélectionnera l&apos;ensemble du catalogue affilié à l&apos;université qui consulte l&apos;offre.
                  </p>
                </div>
              )}

              {bouquetType === "country" && (
                <div className="space-y-1.5 p-4 rounded-2xl bg-background-secondary border border-border">
                  <label className="block text-xs font-bold text-navy">
                    Pays de Rattachement <span className="text-gold">*</span>
                  </label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-background border border-border rounded-xl text-navy font-semibold focus:outline-none focus:border-gold min-h-[44px]"
                  >
                    {WEST_AFRICAN_COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-foreground-muted">
                    Regroupe tous les ouvrages édités dans le pays sélectionné.
                  </p>
                </div>
              )}

              {bouquetType === "custom" && (
                <div className="p-4 rounded-2xl bg-background-secondary border border-border">
                  <BookMultiCombobox
                    books={catalogBooks}
                    selectedBookIds={selectedBookIds}
                    onChange={setSelectedBookIds}
                    placeholder="Rechercher et cocher des ouvrages du catalogue..."
                  />
                </div>
              )}

              {/* Tarif Annuel & Statut */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-navy">
                    Tarif Annuel (XOF) <span className="text-gold">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={1000}
                    value={annualPrice}
                    onChange={(e) => setAnnualPrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl text-navy font-mono font-bold focus:outline-none focus:border-gold min-h-[44px]"
                  />
                </div>

                <div className="space-y-1.5 flex flex-col justify-end">
                  <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-background-secondary border border-border cursor-pointer min-h-[44px]">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="w-4 h-4 rounded text-gold focus:ring-gold border-border"
                    />
                    <span className="text-xs font-bold text-navy">Offre Active &amp; Proposée</span>
                  </label>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-navy">Description Commerciale &amp; Contenu</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Décrivez les avantages et le périmètre documentaire de cette offre..."
                  className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl text-navy focus:outline-none focus:border-gold resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-background-secondary hover:bg-background border border-border text-navy text-xs font-bold transition-colors min-h-[44px]"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors inline-flex items-center gap-2 shadow-xs min-h-[44px] disabled:opacity-50"
                >
                  <Layers className="w-4 h-4 text-gold" />
                  <span>
                    {submitting
                      ? "Enregistrement..."
                      : editingOffering
                      ? "Enregistrer les Modifications"
                      : "Créer l'Offre"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modale Répartition Multi-Universités & Statistiques */}
      <BouquetDistributionModal
        open={!!selectedDistributionBouquet}
        onClose={() => setSelectedDistributionBouquet(null)}
        bouquet={selectedDistributionBouquet}
      />
    </div>
  );
}
