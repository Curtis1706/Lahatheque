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
  Users,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  getBouquetOfferings,
  createBouquetOffering,
  updateBouquetOffering,
  deleteBouquetOffering,
  getInstitutionBooksPreview,
  BouquetOfferingAdmin,
} from "@/lib/services/admin";
import { searchBooks, searchCatalogBooks } from "@/lib/services/catalog";
import { Book } from "@/lib/types/catalog";
import { BouquetDistributionModal } from "@/components/features/bouquets/bouquet-distribution-modal";
import { BookMultiCombobox } from "@/components/features/bouquets/book-multi-combobox";
import { getDisciplines, DisciplineItem } from "@/lib/services/classification";
import { BouquetBooksPreviewModal } from "@/components/features/bouquets/bouquet-books-preview-modal";
import { BouquetSubscriptionsDrawer } from "@/components/features/bouquets/bouquet-subscriptions-drawer";

const BOUQUET_TYPES = [
  { value: "general", label: "Bouquet Général (Catalogue Intégral)", desc: "Tous les ouvrages publiés du catalogue" },
  { value: "discipline", label: "Par Discipline", desc: "Tous les ouvrages rattachés à une discipline académique" },
  { value: "university", label: "Intégral Université", desc: "Tous les ouvrages affiliés à une université partenaire (obligatoire)" },
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

  // Modal & Drawers State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOffering, setEditingOffering] = useState<BouquetOfferingAdmin | null>(null);
  const [selectedDistributionBouquet, setSelectedDistributionBouquet] = useState<BouquetOfferingAdmin | null>(null);
  const [selectedSubscribersBouquet, setSelectedSubscribersBouquet] = useState<BouquetOfferingAdmin | null>(null);
  const [previewInstitutionId, setPreviewInstitutionId] = useState<string | null>(null);
  const [previewInstitutionName, setPreviewInstitutionName] = useState<string>("");
  const [previewBouquetId, setPreviewBouquetId] = useState<string | null>(null);
  const [previewBouquetTitle, setPreviewBouquetTitle] = useState<string>("");
  const [previewDirectBooks, setPreviewDirectBooks] = useState<any[] | null>(null);
  const [previewDirectTitle, setPreviewDirectTitle] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [bouquetType, setBouquetType] = useState<"general" | "discipline" | "university" | "country" | "custom">("discipline");
  const [discipline, setDiscipline] = useState("");
  const [targetInstitution, setTargetInstitution] = useState<string>("");
  const [institutionLiveCount, setInstitutionLiveCount] = useState<number | null>(null);
  const [institutionLoadingCount, setInstitutionLoadingCount] = useState(false);
  const [country, setCountry] = useState("BJ");
  const [monthlyPrice, setMonthlyPrice] = useState("50000");
  const [annualPrice, setAnnualPrice] = useState("500000");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [selectedBookIds, setSelectedBookIds] = useState<string[]>([]);

  // Auxiliary data
  const [catalogBooks, setCatalogBooks] = useState<Book[]>([]);
  const [catalogTotalCount, setCatalogTotalCount] = useState<number>(0);
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

  const loadInstitutions = async () => {
    try {
      const res = await fetch("/api/bff/partners/institutions/", {
        credentials: "include",
        cache: "no-store",
      });
      if (res.ok) {
        const json = await res.json();
        const list = Array.isArray(json) ? json : (json?.data || json?.results || []);
        if (Array.isArray(list) && list.length > 0) {
          // Prioriser les universités partenaires ayants droit (UAC, UP, UNSTIM, UNA, etc.)
          const partnerInstitutions = list.filter(
            (i: any) =>
              i.institution_type === "partner" ||
              ["UAC", "UP", "UNSTIM", "UNA"].includes((i.code || "").toUpperCase())
          );
          const activeList = partnerInstitutions.length > 0 ? partnerInstitutions : list;
          setInstitutions(
            activeList.map((i: any) => ({
              id: String(i.id),
              name: i.name ? `${i.name}${i.code ? ` (${i.code})` : ""}` : (i.title || "Université Partenaire"),
            }))
          );
        }
      }
    } catch (err) {
      console.error("[ADMIN BOUQUETS] Erreur chargement universités:", err);
    }
  };

  useEffect(() => {
    loadData();
    loadInstitutions();
    searchCatalogBooks({ page_size: 1 }).then((res) => {
      if (res && typeof res.count === 'number') {
        setCatalogTotalCount(res.count);
      }
    }).catch(() => {});
    getDisciplines().then((d) => setDbDisciplines(d)).catch(() => {});
  }, []);

  useEffect(() => {
    if (isModalOpen && institutions.length === 0) {
      loadInstitutions();
    }
  }, [isModalOpen, institutions.length]);

  // Décompte dynamique et liste en temps réel selon le type de bouquet sélectionné dans la modale
  useEffect(() => {
    if (!isModalOpen) return;

    if (bouquetType === "university") {
      if (targetInstitution) {
        setInstitutionLoadingCount(true);
        getInstitutionBooksPreview(targetInstitution)
          .then((res) => {
            setInstitutionLiveCount(res ? res.books_count : 0);
          })
          .catch(() => {
            setInstitutionLiveCount(0);
          })
          .finally(() => {
            setInstitutionLoadingCount(false);
          });
      } else {
        setInstitutionLiveCount(null);
      }
    } else if (bouquetType === "discipline") {
      if (discipline.trim()) {
        setInstitutionLoadingCount(true);
        searchCatalogBooks({ discipline: discipline.trim(), page_size: 20 })
          .then((res) => {
            setInstitutionLiveCount(res.count);
          })
          .catch(() => {
            const discLower = discipline.toLowerCase().trim();
            const matched = catalogBooks.filter((b) => {
              const bDisc = (b.discipline_detail?.name || "").toLowerCase().trim();
              return bDisc.includes(discLower) || discLower.includes(bDisc);
            });
            setInstitutionLiveCount(matched.length);
          })
          .finally(() => {
            setInstitutionLoadingCount(false);
          });
      } else {
        setInstitutionLiveCount(0);
      }
    } else if (bouquetType === "country") {
      if (country) {
        setInstitutionLoadingCount(true);
        searchCatalogBooks({ country, page_size: 20 })
          .then((res) => {
            setInstitutionLiveCount(res.count);
          })
          .catch(() => {
            const matched = catalogBooks.filter((b) => (b.country || "").toUpperCase() === country.toUpperCase());
            setInstitutionLiveCount(matched.length);
          })
          .finally(() => {
            setInstitutionLoadingCount(false);
          });
      } else {
        setInstitutionLiveCount(0);
      }
    } else if (bouquetType === "general") {
      setInstitutionLoadingCount(true);
      searchCatalogBooks({ page_size: 20 })
        .then((res) => {
          setInstitutionLiveCount(res.count);
        })
        .catch(() => {
          setInstitutionLiveCount(catalogBooks.length);
        })
        .finally(() => {
          setInstitutionLoadingCount(false);
        });
    } else if (bouquetType === "custom") {
      setInstitutionLiveCount(selectedBookIds.length);
    }
  }, [isModalOpen, bouquetType, targetInstitution, discipline, country, selectedBookIds.length, catalogBooks]);

  const handleTypeFilterChange = (newType: string) => {
    setTypeFilter(newType);
    setSubFilter("all");
  };

  const openCreateModal = () => {
    setEditingOffering(null);
    setTitle("");
    setBouquetType("discipline");
    setDiscipline("");
    setTargetInstitution("");
    setCountry("BJ");
    setMonthlyPrice("50000");
    setAnnualPrice("500000");
    setDescription("");
    setIsActive(true);
    setSelectedBookIds([]);
    setIsModalOpen(true);
  };

  const openEditModal = (offering: BouquetOfferingAdmin) => {
    setEditingOffering(offering);
    setTitle(offering.title);
    const bType = offering.bouquet_type === "faculty" ? "discipline" : offering.bouquet_type;
    setBouquetType(bType as any);
    setDiscipline(offering.discipline || "");
    setTargetInstitution(offering.target_institution || "");
    setCountry(offering.country || "BJ");
    const mPrice = offering.monthly_price !== undefined ? Math.round(Number(offering.monthly_price)) : 50000;
    const aPrice = offering.annual_price !== undefined ? Math.round(Number(offering.annual_price)) : 500000;
    setMonthlyPrice(String(mPrice));
    setAnnualPrice(String(aPrice));
    setDescription(offering.description || "");
    setIsActive(offering.is_active);
    setSelectedBookIds(offering.custom_book_ids || []);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Le titre du bouquet est obligatoire.");
      return;
    }

    if (bouquetType === "university" && !targetInstitution) {
      toast.error("La sélection d'une université partenaire est obligatoire pour le type Intégral Université.");
      return;
    }

    const parsePrice = (val: string | number | undefined, fallback = 0) => {
      if (val === undefined || val === null) return fallback;
      const cleaned = String(val).replace(/\s+/g, "").replace(",", ".");
      const num = parseFloat(cleaned);
      return isNaN(num) ? fallback : Math.max(0, num);
    };

    const payload: Partial<BouquetOfferingAdmin> = {
      title: title.trim(),
      bouquet_type: bouquetType,
      discipline: bouquetType === "discipline" ? discipline.trim() : "",
      target_institution: bouquetType === "university" ? targetInstitution : null,
      country: bouquetType === "country" ? country : "",
      monthly_price: parsePrice(monthlyPrice, 50000),
      annual_price: parsePrice(annualPrice, 500000),
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
          toast.error("Erreur lors de la mise à jour du bouquet.");
        }
      } else {
        const ok = await createBouquetOffering(payload);
        if (ok) {
          toast.success(`Le bouquet « ${title} » a été créé avec succès.`);
          setIsModalOpen(false);
          loadData();
        } else {
          toast.error("Erreur lors de la création du bouquet.");
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Une erreur inattendue est survenue.");
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

  // Liste consolidée des disciplines réelles
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
        if (!matchTitle && !matchDesc && !matchDisc) return false;
      }
      return true;
    });
  }, [offerings, searchQuery, typeFilter, subFilter]);

  const typeLabels: Record<string, string> = {
    discipline: "Discipline",
    university: "Intégral Université",
    country: "Pays",
    custom: "Sur-mesure",
    general: "Général",
    faculty: "Université",
  };

  const columns: DataTableColumn<BouquetOfferingAdmin>[] = [
    {
      key: "title",
      header: "Bouquet & Périmètre",
      cell: (row) => (
        <div className="space-y-1 py-1 font-poppins">
          <p className="font-playfair font-bold text-xs sm:text-sm text-navy leading-snug">{row.title}</p>
          <div className="flex items-center gap-2 flex-wrap text-[11px] text-foreground/70">
            <span className="px-2 py-0.5 rounded-md bg-navy/10 text-navy text-[10px] font-bold border border-navy/20">
              {typeLabels[row.bouquet_type] || row.bouquet_type}
            </span>
            {row.bouquet_type === "discipline" && row.discipline && (
              <span className="font-medium text-navy">Discipline : {row.discipline}</span>
            )}
            {row.bouquet_type === "university" && (
              <span className="font-medium text-navy flex items-center gap-1">
                <Building2 className="w-3 h-3 text-gold" />
                {row.target_institution_name || institutions.find((i) => i.id === row.target_institution)?.name || "Établissement lié"}
              </span>
            )}
            {row.bouquet_type === "country" && row.country && (
              <span className="font-medium text-navy">Pays : {row.country}</span>
            )}
            {row.bouquet_type === "custom" && (
              <span className="font-medium text-gold">{row.custom_book_ids?.length || 0} livre(s) choisi(s)</span>
            )}
          </div>
          {row.description && (
            <p className="text-[10px] text-foreground/60 line-clamp-1 max-w-[340px]">{row.description}</p>
          )}
        </div>
      ),
    },
    {
      key: "books_count",
      header: "Contenu Réel",
      cell: (row) => (
        <div className="text-xs space-y-1 font-poppins">
          <button
            type="button"
            onClick={() => {
              setPreviewBouquetId(row.id);
              setPreviewBouquetTitle(row.title);
            }}
            title="Inspecter la liste des ouvrages et couvertures"
            className="inline-flex items-center gap-1 font-mono font-bold text-navy bg-background-secondary hover:bg-gold/10 hover:border-gold/40 px-2.5 py-1 rounded-lg border border-border transition-colors cursor-pointer group"
          >
            <BookOpen className="w-3.5 h-3.5 text-gold group-hover:scale-110 transition-transform" />
            <span>{row.books_count.toLocaleString("fr-FR")} livre(s)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setPreviewBouquetId(row.id);
              setPreviewBouquetTitle(row.title);
            }}
            className="block text-[10px] text-gold hover:underline font-medium cursor-pointer"
          >
            Voir la liste &amp; couvertures
          </button>
        </div>
      ),
    },
    {
      key: "monthly_price",
      header: "Tarif Mensuel",
      cell: (row) => (
        <div className="text-xs font-poppins">
          <p className="font-mono font-bold text-navy">
            {(row.monthly_price || 50000).toLocaleString("fr-FR")} {row.currency || "XOF"}
          </p>
          <p className="text-[10px] text-foreground/60">Formule 30 jours</p>
        </div>
      ),
    },
    {
      key: "annual_price",
      header: "Tarif Annuel",
      cell: (row) => (
        <div className="text-xs font-poppins">
          <p className="font-mono font-bold text-navy">
            {(row.annual_price || 500000).toLocaleString("fr-FR")} {row.currency || "XOF"}
          </p>
          <p className="text-[10px] text-foreground/60">Formule 365 jours</p>
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
      header: "Actions",
      cell: (row) => (
        <div className="flex items-center gap-2 justify-end font-poppins">
          {/* Bouton Consulter les Abonnés (T011) */}
          <button
            type="button"
            onClick={() => setSelectedSubscribersBouquet(row)}
            className="px-2.5 py-1.5 rounded-xl bg-navy/10 text-navy text-xs font-semibold hover:bg-navy hover:text-white transition-colors inline-flex items-center gap-1 min-h-[36px]"
            title="Consulter les abonnés actifs et expirés de ce bouquet"
          >
            <Users className="w-3.5 h-3.5 text-gold" />
            <span className="hidden sm:inline">Abonnés</span>
          </button>

          {/* Bouton Modifier */}
          <button
            type="button"
            onClick={() => openEditModal(row)}
            className="px-2.5 py-1.5 rounded-xl bg-background-secondary border border-border text-navy text-xs font-semibold hover:bg-navy-hover hover:text-white transition-colors inline-flex items-center gap-1 min-h-[36px]"
            title="Modifier le bouquet"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Modifier</span>
          </button>

          {/* Bouton Désactiver */}
          {row.is_active && (
            <button
              type="button"
              onClick={() => handleDelete(row)}
              className="p-2 rounded-xl text-foreground/50 hover:text-navy hover:bg-background-secondary transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
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
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 max-w-7xl mx-auto font-poppins">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground/60">
        <Link href="/admin" className="hover:text-navy transition-colors">Administration</Link>
        <span>/</span>
        <Link href="/admin/catalog" className="hover:text-navy transition-colors">Catalogue &amp; Tarifs</Link>
        <span>/</span>
        <span className="text-navy font-semibold">Bouquets Documentaires</span>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/admin/catalog" className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-1">
            <ArrowLeft className="w-3.5 h-3.5 text-gold" />
            Catalogue &amp; Tarifs
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
            <Layers className="w-4 h-4 text-gold" />
            Offres Documentaires &amp; Campus
          </div>
          <h1 className="font-playfair text-2xl sm:text-3xl font-bold text-navy">
            Catalogue des Bouquets Documentaires
          </h1>
          <p className="text-xs text-foreground/70 mt-1">
            Gérez les bouquets documentaires avec double tarification mensuelle (30j) et annuelle (365j), configuration des universités partenaires et suivi des souscriptions.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors inline-flex items-center gap-2 shadow-sm min-h-[44px]"
        >
          <Plus className="w-4 h-4 text-gold" />
          Nouveau Bouquet
        </button>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-background border border-border shadow-sm space-y-1">
          <p className="text-[11px] font-bold text-foreground/60 uppercase">Total Offres</p>
          <p className="font-playfair text-2xl font-bold text-navy">{offerings.length}</p>
          <p className="text-[10px] text-foreground/60">Bouquets enregistrés</p>
        </div>
        <div className="p-4 rounded-2xl bg-background border border-border shadow-sm space-y-1">
          <p className="text-[11px] font-bold text-foreground/60 uppercase">Automatiques</p>
          <p className="font-playfair text-2xl font-bold text-navy">
            {offerings.filter((o) => o.bouquet_type !== "custom").length}
          </p>
          <p className="text-[10px] text-foreground/60">Calculés en direct</p>
        </div>
        <div className="p-4 rounded-2xl bg-background border border-border shadow-sm space-y-1">
          <p className="text-[11px] font-bold text-foreground/60 uppercase">Personnalisés</p>
          <p className="font-playfair text-2xl font-bold text-navy">
            {offerings.filter((o) => o.bouquet_type === "custom").length}
          </p>
          <p className="text-[10px] text-foreground/60">Sélections manuelles</p>
        </div>
        <div className="p-4 rounded-2xl bg-background border border-border shadow-sm space-y-1">
          <p className="text-[11px] font-bold text-foreground/60 uppercase">Actifs</p>
          <p className="font-playfair text-2xl font-bold text-navy">
            {offerings.filter((o) => o.is_active).length}
          </p>
          <p className="text-[10px] text-foreground/60">Visibles pour souscription</p>
        </div>
      </div>

      {/* Filtres & Recherche */}
      <div className="p-4 rounded-2xl bg-background border border-border flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-sm">
        <div className="relative w-full md:w-80 shrink-0">
          <Search className="w-4 h-4 text-foreground/50 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par titre ou discipline..."
            className="w-full pl-9 pr-3.5 py-2 text-xs bg-background-secondary/40 border border-border rounded-xl focus:outline-none focus:border-gold text-navy min-h-[40px]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* 1er Filtre : Type de Bouquet */}
          <div className="relative min-w-[200px] flex-1 sm:flex-initial">
            <select
              value={typeFilter}
              onChange={(e) => handleTypeFilterChange(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-background-secondary/40 border border-border rounded-xl text-navy font-semibold focus:outline-none focus:border-gold min-h-[40px]"
            >
              <option value="all">Tous les Types de Bouquets</option>
              {BOUQUET_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* 2ème Filtre Dynamique : Disciplines */}
          {typeFilter === "discipline" && (
            <div className="relative min-w-[220px] flex-1 sm:flex-initial animate-in fade-in duration-200">
              <select
                value={subFilter}
                onChange={(e) => setSubFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-background-secondary/40 border border-gold/40 rounded-xl text-navy font-semibold focus:outline-none focus:border-gold min-h-[40px]"
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

          {/* 2ème Filtre Dynamique : Universités */}
          {typeFilter === "university" && (
            <div className="relative min-w-[220px] flex-1 sm:flex-initial animate-in fade-in duration-200">
              <select
                value={subFilter}
                onChange={(e) => setSubFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-background-secondary/40 border border-gold/40 rounded-xl text-navy font-semibold focus:outline-none focus:border-gold min-h-[40px]"
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

          {/* 2ème Filtre Dynamique : Pays */}
          {typeFilter === "country" && (
            <div className="relative min-w-[200px] flex-1 sm:flex-initial animate-in fade-in duration-200">
              <select
                value={subFilter}
                onChange={(e) => setSubFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-background-secondary/40 border border-gold/40 rounded-xl text-navy font-semibold focus:outline-none focus:border-gold min-h-[40px]"
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
              className="px-3 py-2 text-xs rounded-xl bg-navy/10 text-navy font-semibold hover:bg-navy hover:text-white transition-colors flex items-center gap-1.5 min-h-[40px] shrink-0"
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
        emptyMessage="Aucun bouquet documentaire ne correspond à vos critères."
        pageSize={20}
        pageSizeOptions={[10, 20, 50, 100]}
      />

      {/* Modal Création / Édition */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-dark/60 backdrop-blur-sm overflow-y-auto font-poppins">
          <div className="relative w-full max-w-2xl rounded-2xl bg-background border border-border shadow-2xl p-6 sm:p-8 my-8 max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gold flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  {editingOffering ? "Édition Bouquet" : "Nouveau Bouquet Documentaire"}
                </span>
                <h3 className="font-playfair text-xl font-bold text-navy">
                  {editingOffering ? `Modifier « ${editingOffering.title} »` : "Configurer un Bouquet Documentaire"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-foreground/60 hover:bg-background-secondary hover:text-navy transition-colors"
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
                  className="w-full px-3.5 py-2.5 text-xs bg-background-secondary/40 border border-border rounded-xl text-navy font-semibold focus:outline-none focus:border-gold min-h-[44px]"
                >
                  {BOUQUET_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label} — {t.desc}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-foreground/60">
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
                  className="w-full px-3.5 py-2.5 text-xs bg-background-secondary/40 border border-border rounded-xl text-navy focus:outline-none focus:border-gold min-h-[44px]"
                />
              </div>

              {/* Champs Conditionnels selon le type */}
              {bouquetType === "general" && (
                <div className="space-y-3 p-4 rounded-xl bg-background-secondary/30 border border-border">
                  <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg bg-gold/5 border border-gold/20">
                    <div className="flex items-center gap-2 text-xs">
                      <BookOpen className="w-4 h-4 text-gold" />
                      <span className="text-navy font-semibold">
                        {institutionLiveCount ?? catalogTotalCount} ouvrage(s) dans le catalogue intégral
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        setPreviewDirectTitle("Bouquet Général (Catalogue Intégral)");
                        try {
                          const res = await searchCatalogBooks({ page_size: 100 });
                          if (res && res.results && res.results.length > 0) {
                            setPreviewDirectBooks(res.results.map((b) => ({
                              id: b.id,
                              title: b.title,
                              authors: (b.authors_details || []).map((a) => `${a.first_name} ${a.last_name}`.trim()),
                              isbn: b.isbn,
                              cover_url: b.cover_url || b.cover_image,
                              discipline: b.discipline_detail?.name || "",
                              format_type: b.format_type,
                              price_digital: b.price_digital || 0,
                              publication_year: b.publication_year,
                            })));
                            return;
                          }
                        } catch (err) {
                          console.error(err);
                        }
                        const matched = catalogBooks.map((b) => ({
                          id: b.id,
                          title: b.title,
                          authors: (b.authors_details || []).map((a) => `${a.first_name} ${a.last_name}`.trim()),
                          isbn: b.isbn,
                          cover_url: b.cover_url || b.cover_image,
                          discipline: b.discipline_detail?.name || "",
                          format_type: b.format_type,
                          price_digital: b.price_digital || 0,
                          publication_year: b.publication_year,
                        }));
                        setPreviewDirectBooks(matched);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy text-white text-xs font-medium hover:bg-navy-hover transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-gold" />
                      <span>Inspecter les livres &amp; couvertures</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-foreground/60">
                    L&apos;intégralité des ouvrages publiés du catalogue est automatiquement incluse et mise à jour en direct pour ce bouquet.
                  </p>
                </div>
              )}

              {bouquetType === "discipline" && (
                <div className="space-y-2 p-4 rounded-xl bg-background-secondary/30 border border-border">
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

                  {discipline.trim() && (
                    <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg bg-gold/5 border border-gold/20">
                      <div className="flex items-center gap-2 text-xs">
                        <BookOpen className="w-4 h-4 text-gold" />
                        <span className="text-navy font-semibold">
                          {institutionLiveCount ?? 0} ouvrage(s) dans cette discipline
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          setPreviewDirectTitle(`Discipline : ${discipline}`);
                          try {
                            const res = await searchCatalogBooks({ discipline: discipline.trim(), page_size: 100 });
                            if (res && res.results && res.results.length > 0) {
                              setPreviewDirectBooks(res.results.map((b) => ({
                                id: b.id,
                                title: b.title,
                                authors: (b.authors_details || []).map((a) => `${a.first_name} ${a.last_name}`.trim()),
                                isbn: b.isbn,
                                cover_url: b.cover_url || b.cover_image,
                                discipline: b.discipline_detail?.name || discipline,
                                format_type: b.format_type,
                                price_digital: b.price_digital || 0,
                                publication_year: b.publication_year,
                              })));
                              return;
                            }
                          } catch (err) {
                            console.error(err);
                          }
                          const discLower = discipline.toLowerCase().trim();
                          const matched = catalogBooks.filter((b) => {
                            const bDisc = (b.discipline_detail?.name || "").toLowerCase().trim();
                            return bDisc.includes(discLower) || discLower.includes(bDisc);
                          }).map((b) => ({
                            id: b.id,
                            title: b.title,
                            authors: (b.authors_details || []).map((a) => `${a.first_name} ${a.last_name}`.trim()),
                            isbn: b.isbn,
                            cover_url: b.cover_url || b.cover_image,
                            discipline: b.discipline_detail?.name || discipline,
                            format_type: b.format_type,
                            price_digital: b.price_digital || 0,
                            publication_year: b.publication_year,
                          }));
                          setPreviewDirectBooks(matched);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy text-white text-xs font-medium hover:bg-navy-hover transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-gold" />
                        <span>Inspecter les livres &amp; couvertures</span>
                      </button>
                    </div>
                  )}

                  <p className="text-[10px] text-foreground/60">
                    Tous les ouvrages publiés rattachés à cette discipline seront inclus automatiquement.
                  </p>
                </div>
              )}

              {bouquetType === "university" && (
                <div className="space-y-3 p-4 rounded-xl bg-background-secondary/30 border border-border">
                  <div className="space-y-1.5">
                    <label className="flex items-center justify-between text-xs font-bold text-navy">
                      <span>Université Partenaire <span className="text-gold">*</span></span>
                      {institutionLoadingCount && (
                        <span className="text-[10px] text-gold animate-pulse">Décompte en cours...</span>
                      )}
                    </label>
                    <select
                      required
                      value={targetInstitution}
                      onChange={(e) => setTargetInstitution(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs bg-background border border-border rounded-xl text-navy font-medium focus:outline-none focus:border-gold min-h-[44px]"
                    >
                      <option value="">-- Sélectionner l&apos;université partenaire cible --</option>
                      {institutions.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {targetInstitution && (
                    <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg bg-gold/5 border border-gold/20">
                      <div className="flex items-center gap-2 text-xs">
                        <BookOpen className="w-4 h-4 text-gold" />
                        <span className="text-navy font-semibold">
                          {institutionLoadingCount
                            ? "Calcul du catalogue..."
                            : `${institutionLiveCount ?? 0} ouvrage(s) publié(s) actuellement`}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewInstitutionId(targetInstitution);
                          setPreviewInstitutionName(institutions.find((i) => i.id === targetInstitution)?.name || "");
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy text-white text-xs font-medium hover:bg-navy-hover transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-gold" />
                        <span>Inspecter les livres &amp; couvertures</span>
                      </button>
                    </div>
                  )}

                  <p className="text-[10px] text-foreground/60">
                    Tous les ouvrages publiés rattachés à cette université seront inclus automatiquement et mis à jour en temps réel.
                  </p>
                </div>
              )}

              {bouquetType === "country" && (
                <div className="space-y-3 p-4 rounded-xl bg-background-secondary/30 border border-border">
                  <div className="space-y-1.5">
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
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg bg-gold/5 border border-gold/20">
                    <div className="flex items-center gap-2 text-xs">
                      <BookOpen className="w-4 h-4 text-gold" />
                      <span className="text-navy font-semibold">
                        {institutionLiveCount ?? 0} ouvrage(s) rattaché(s) à ce pays
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        const countryLabel = WEST_AFRICAN_COUNTRIES.find((c) => c.code === country)?.label || country;
                        setPreviewDirectTitle(`Pays : ${countryLabel}`);
                        try {
                          const res = await searchCatalogBooks({ country, page_size: 100 });
                          if (res && res.results && res.results.length > 0) {
                            setPreviewDirectBooks(res.results.map((b) => ({
                              id: b.id,
                              title: b.title,
                              authors: (b.authors_details || []).map((a) => `${a.first_name} ${a.last_name}`.trim()),
                              isbn: b.isbn,
                              cover_url: b.cover_url || b.cover_image,
                              discipline: b.discipline_detail?.name || "",
                              format_type: b.format_type,
                              price_digital: b.price_digital || 0,
                              publication_year: b.publication_year,
                            })));
                            return;
                          }
                        } catch (err) {
                          console.error(err);
                        }
                        const matched = catalogBooks.filter((b) => (b.country || "").toUpperCase() === country.toUpperCase()).map((b) => ({
                          id: b.id,
                          title: b.title,
                          authors: (b.authors_details || []).map((a) => `${a.first_name} ${a.last_name}`.trim()),
                          isbn: b.isbn,
                          cover_url: b.cover_url || b.cover_image,
                          discipline: b.discipline_detail?.name || "",
                          format_type: b.format_type,
                          price_digital: b.price_digital || 0,
                          publication_year: b.publication_year,
                        }));
                        setPreviewDirectBooks(matched);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy text-white text-xs font-medium hover:bg-navy-hover transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-gold" />
                      <span>Inspecter les livres &amp; couvertures</span>
                    </button>
                  </div>

                  <p className="text-[10px] text-foreground/60">
                    Regroupe tous les ouvrages édités dans le pays sélectionné.
                  </p>
                </div>
              )}

              {bouquetType === "custom" && (
                <div className="space-y-3 p-4 rounded-xl bg-background-secondary/30 border border-border">
                  <BookMultiCombobox
                    books={catalogBooks}
                    selectedBookIds={selectedBookIds}
                    onChange={setSelectedBookIds}
                    placeholder="Rechercher et cocher des ouvrages du catalogue..."
                  />

                  {selectedBookIds.length > 0 && (
                    <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg bg-gold/5 border border-gold/20">
                      <div className="flex items-center gap-2 text-xs">
                        <BookOpen className="w-4 h-4 text-gold" />
                        <span className="text-navy font-semibold">
                          {selectedBookIds.length} ouvrage(s) sélectionné(s)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const matched = catalogBooks.filter((b) => selectedBookIds.includes(b.id)).map((b) => ({
                            id: b.id,
                            title: b.title,
                            authors: (b.authors_details || []).map((a) => `${a.first_name} ${a.last_name}`.trim()),
                            isbn: b.isbn,
                            cover_url: b.cover_url || b.cover_image,
                            discipline: b.discipline_detail?.name || "",
                            format_type: b.format_type,
                            price_digital: b.price_digital || 0,
                            publication_year: b.publication_year,
                          }));
                          setPreviewDirectBooks(matched);
                          setPreviewDirectTitle(title || "Bouquet Sur-mesure");
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy text-white text-xs font-medium hover:bg-navy-hover transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-gold" />
                        <span>Inspecter les livres &amp; couvertures ({selectedBookIds.length})</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Double Tarification : Mensuelle (30j) & Annuelle (365j) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-navy">
                    Tarif Mensuel (XOF) <span className="text-gold">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    step="any"
                    value={monthlyPrice}
                    onChange={(e) => setMonthlyPrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-background-secondary/40 border border-border rounded-xl text-navy font-mono font-bold focus:outline-none focus:border-gold min-h-[44px]"
                  />
                  <p className="text-[10px] text-foreground/60">Formule pour 30 jours d&apos;accès</p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-navy">
                    Tarif Annuel (XOF) <span className="text-gold">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    step="any"
                    value={annualPrice}
                    onChange={(e) => setAnnualPrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-background-secondary/40 border border-border rounded-xl text-navy font-mono font-bold focus:outline-none focus:border-gold min-h-[44px]"
                  />
                  <p className="text-[10px] text-foreground/60">Formule pour 365 jours d&apos;accès</p>
                </div>
              </div>

              {/* Statut d'activation */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-background-secondary/30 border border-border cursor-pointer min-h-[44px]">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-gold focus:ring-gold border-border"
                  />
                  <span className="text-xs font-bold text-navy">Offre Active &amp; Ouverte à la Souscription</span>
                </label>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-navy">Description Commerciale &amp; Contenu</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Décrivez les avantages et le périmètre documentaire de cette offre..."
                  className="w-full px-3.5 py-2.5 text-xs bg-background-secondary/40 border border-border rounded-xl text-navy focus:outline-none focus:border-gold resize-none"
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
                  className="px-5 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors inline-flex items-center gap-2 shadow-sm min-h-[44px] disabled:opacity-50"
                >
                  <Layers className="w-4 h-4 text-gold" />
                  <span>
                    {submitting
                      ? "Enregistrement..."
                      : editingOffering
                      ? "Enregistrer les Modifications"
                      : "Créer le Bouquet"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modale d'inspection des livres avec couvertures (T009) */}
      <BouquetBooksPreviewModal
        isOpen={!!previewBouquetId || !!previewInstitutionId || !!previewDirectBooks}
        onClose={() => {
          setPreviewBouquetId(null);
          setPreviewBouquetTitle("");
          setPreviewInstitutionId(null);
          setPreviewInstitutionName("");
          setPreviewDirectBooks(null);
          setPreviewDirectTitle("");
        }}
        bouquetId={previewBouquetId}
        bouquetTitle={previewBouquetTitle}
        institutionId={previewInstitutionId}
        institutionName={previewInstitutionName}
        directBooks={previewDirectBooks}
        directTitle={previewDirectTitle}
      />

      {/* Tiroir d'audit des abonnés (T011) */}
      <BouquetSubscriptionsDrawer
        isOpen={!!selectedSubscribersBouquet}
        onClose={() => setSelectedSubscribersBouquet(null)}
        bouquet={selectedSubscribersBouquet}
      />

      {/* Modale Répartition Multi-Universités & Statistiques */}
      <BouquetDistributionModal
        open={!!selectedDistributionBouquet}
        onClose={() => setSelectedDistributionBouquet(null)}
        bouquet={selectedDistributionBouquet}
      />
    </div>
  );
}
