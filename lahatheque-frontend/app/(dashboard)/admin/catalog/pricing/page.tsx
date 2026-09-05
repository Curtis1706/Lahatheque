"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Tag,
  History,
  Save,
  RotateCcw,
  Edit3,
  BookOpen,
  CheckCircle2,
  Sliders,
  DollarSign,
  Search,
} from "lucide-react";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { Modal } from "@/components/ui/modal";
import {
  getGlobalPricingConfig,
  updateGlobalPricingConfig,
  getAdminCatalog,
  updateBookPricing,
  resetBookPricing,
  getRoleDiscounts,
  updateRoleDiscounts,
} from "@/lib/services/admin";
import { AdminCatalogBook, GlobalPricingConfig } from "@/lib/types/admin";
import { getBouquetRoyaltyRate, setBouquetRoyaltyRate } from "@/lib/services/bouquet-distribution";
import { toast } from "sonner";

export default function AdminPricingCascadePage() {
  const [globalConfig, setGlobalConfig] = useState<GlobalPricingConfig | null>(null);
  const [books, setBooks] = useState<AdminCatalogBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingGlobal, setSavingGlobal] = useState(false);

  // Valeurs de cascade par défaut
  const [defaultDigitalPrice, setDefaultDigitalPrice] = useState(3000);
  const [defaultPaperPrice, setDefaultPaperPrice] = useState(5000);
  const [defaultAudioPrice, setDefaultAudioPrice] = useState(2500);

  // Modale d'édition d'un tarif spécifique d'un ouvrage
  const [editingBook, setEditingBook] = useState<AdminCatalogBook | null>(null);
  const [customDigitalPrice, setCustomDigitalPrice] = useState<number>(3000);
  const [customPaperPrice, setCustomPaperPrice] = useState<number>(5000);
  const [savingBookPricing, setSavingBookPricing] = useState(false);

  // Paramètres Multi-Rôles / Profils Acheteurs
  const [authorDigitalDiscount, setAuthorDigitalDiscount] = useState<number>(25);
  const [authorPaperDiscount, setAuthorPaperDiscount] = useState<number>(40);

  const [wholesaleDigitalDiscount, setWholesaleDigitalDiscount] = useState<number>(25);
  const [wholesalePaperDiscount, setWholesalePaperDiscount] = useState<number>(32);
  const [wholesaleMinQty, setWholesaleMinQty] = useState<number>(20);

  const [universityDigitalDiscount, setUniversityDigitalDiscount] = useState<number>(35);
  const [universityPaperDiscount, setUniversityPaperDiscount] = useState<number>(25);
  const [universityBouquetRoyaltyRate, setUniversityBouquetRoyaltyRate] = useState<number>(15);

  const [savingPolicy, setSavingPolicy] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [configData, catalogData, roleDiscountsData] = await Promise.all([
        getGlobalPricingConfig(),
        getAdminCatalog(),
        getRoleDiscounts(),
      ]);
      setGlobalConfig(configData);
      setBooks(catalogData);
      if (configData) {
        setDefaultDigitalPrice(configData.prix_defaut_numerique_xof || 3000);
        setDefaultPaperPrice(configData.prix_defaut_papier_xof || 5000);
        setDefaultAudioPrice(configData.prix_defaut_audio_xof || 2500);
      }
      if (roleDiscountsData) {
        if (roleDiscountsData.author) {
          setAuthorPaperDiscount(roleDiscountsData.author.paper_pct ?? 40);
          setAuthorDigitalDiscount(roleDiscountsData.author.digital_pct ?? 25);
        }
        if (roleDiscountsData.wholesaler) {
          setWholesalePaperDiscount(roleDiscountsData.wholesaler.paper_pct ?? 32);
          setWholesaleDigitalDiscount(roleDiscountsData.wholesaler.digital_pct ?? 25);
        }
        if (roleDiscountsData.university) {
          setUniversityPaperDiscount(roleDiscountsData.university.paper_pct ?? 25);
          setUniversityDigitalDiscount(roleDiscountsData.university.digital_pct ?? 35);
        }
      }
      setUniversityBouquetRoyaltyRate(getBouquetRoyaltyRate());
    } catch (err) {
      toast.error("Erreur de chargement de la cascade tarifaire.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSavePublicDefaults = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingGlobal(true);
    try {
      const res = await updateGlobalPricingConfig({
        prix_defaut_numerique_xof: defaultDigitalPrice,
        prix_defaut_papier_xof: defaultPaperPrice,
        prix_defaut_audio_xof: defaultAudioPrice,
      });
      if (res.success) {
        toast.success("Cascade tarifaire publique enregistrée avec succès !");
      } else {
        toast.error(res.error || "Erreur de mise à jour des prix par défaut.");
      }
    } catch {
      toast.error("Erreur de communication avec le serveur.");
    } finally {
      setSavingGlobal(false);
    }
  };

  const handleSaveMultiRolePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPolicy(true);
    try {
      const res = await updateRoleDiscounts({
        author: {
          paper_pct: Number(authorPaperDiscount),
          digital_pct: Number(authorDigitalDiscount),
        },
        wholesaler: {
          paper_pct: Number(wholesalePaperDiscount),
          digital_pct: Number(wholesaleDigitalDiscount),
        },
        university: {
          paper_pct: Number(universityPaperDiscount),
          digital_pct: Number(universityDigitalDiscount),
        },
      });
      setBouquetRoyaltyRate(Number(universityBouquetRoyaltyRate));
      if (res.success) {
        toast.success(
          res.message || "Grille tarifaire et taux de redevance bouquets mis à jour pour tous les profils."
        );
      } else {
        toast.error(res.error || "Erreur lors de la mise à jour des remises.");
      }
    } catch {
      toast.error("Erreur de communication avec le serveur.");
    } finally {
      setSavingPolicy(false);
    }
  };

  const handleOpenEditBook = (book: AdminCatalogBook) => {
    setEditingBook(book);
    setCustomDigitalPrice(book.price_digital || defaultDigitalPrice);
    setCustomPaperPrice(book.price_paper || defaultPaperPrice);
  };

  const handleSaveBookPricing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBook) return;
    setSavingBookPricing(true);
    try {
      const res = await updateBookPricing(editingBook.id, {
        price_digital: customDigitalPrice,
        price_paper: customPaperPrice,
      });
      if (res.success) {
        toast.success(`Tarifs spécifiques pour "${editingBook.title}" enregistrés.`);
        setBooks((prev) =>
          prev.map((b) =>
            b.id === editingBook.id
              ? {
                  ...b,
                  price_digital: customDigitalPrice,
                  price_paper: customPaperPrice,
                }
              : b
          )
        );
        setEditingBook(null);
      } else {
        toast.error(res.error || "Erreur d'enregistrement.");
      }
    } catch {
      toast.error("Erreur serveur lors de la modification des prix.");
    } finally {
      setSavingBookPricing(false);
    }
  };

  const handleResetToDefault = async (book: AdminCatalogBook) => {
    try {
      const res = await resetBookPricing(book.id);
      if (res.success) {
        toast.success(`L'ouvrage "${book.title}" a été réaligné sur la cascade tarifaire globale.`);
        setBooks((prev) =>
          prev.map((b) =>
            b.id === book.id
              ? {
                  ...b,
                  price_digital: defaultDigitalPrice,
                  price_paper: defaultPaperPrice,
                }
              : b
          )
        );
      } else {
        toast.error(res.error || "Erreur lors du réalignement.");
      }
    } catch {
      toast.error("Erreur réseau.");
    }
  };

  // Onglet d'affichage actif pour le tableau
  const [activeTabRole, setActiveTabRole] = useState<"all" | "public" | "author" | "wholesale" | "university">("all");

  const columns: DataTableColumn<AdminCatalogBook>[] = useMemo(() => {
    if (activeTabRole === "all") {
      return [
        {
          key: "title",
          header: "Ouvrage & Éditeur",
          cell: (row: AdminCatalogBook) => (
            <div className="flex items-center gap-3 py-1">
              <div className="w-9 h-12 rounded-lg bg-navy/5 border border-border shrink-0 overflow-hidden flex items-center justify-center shadow-2xs">
                {row.cover_url ? (
                  <img src={row.cover_url} alt={row.title} className="w-full h-full object-cover" />
                ) : (
                  <BookOpen className="w-4 h-4 text-navy/40" />
                )}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-xs text-navy truncate max-w-[220px]" title={row.title}>
                  {row.title}
                </p>
                <p className="text-[11px] text-foreground-muted font-mono truncate max-w-[220px]">
                  {row.isbn} • {row.publisher_name}
                </p>
              </div>
            </div>
          ),
        },
        {
          key: "discipline",
          header: "Discipline",
          cell: (row: AdminCatalogBook) => (
            <span className="text-[10px] px-2.5 py-1 rounded-lg bg-gold/10 text-gold font-bold border border-gold/20 whitespace-nowrap inline-block">
              {row.discipline || "Général"}
            </span>
          ),
        },
        {
          key: "public_prices",
          header: "Prix Publics (Détail)",
          cell: (row: AdminCatalogBook) => {
            const dig = row.price_digital || defaultDigitalPrice;
            const pap = row.price_paper || defaultPaperPrice;
            return (
              <div className="space-y-1 font-mono text-xs whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-foreground-muted font-sans uppercase">Num :</span>
                  <span className="font-bold text-navy">{dig.toLocaleString("fr-FR")} XOF</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-foreground-muted font-sans uppercase">Papier :</span>
                  <span className="font-bold text-navy">{pap.toLocaleString("fr-FR")} XOF</span>
                </div>
              </div>
            );
          },
        },
        {
          key: "multi_roles",
          header: "Grille Multi-Rôles (Prix Nets Remisés)",
          cell: (row: AdminCatalogBook) => {
            const dig = row.price_digital || defaultDigitalPrice;
            const pap = row.price_paper || defaultPaperPrice;

            const authorPap = Math.round(pap * (1 - authorPaperDiscount / 100));
            const wholesalePap = Math.round(pap * (1 - wholesalePaperDiscount / 100));
            const uniPap = Math.round(pap * (1 - universityPaperDiscount / 100));

            return (
              <div className="grid grid-cols-3 gap-2 text-xs font-mono whitespace-nowrap min-w-[280px]">
                {/* Auteur */}
                <div className="p-1.5 rounded-xl bg-gold/10 border border-gold/25 text-center">
                  <span className="text-[9px] font-bold text-gold uppercase block font-sans">
                    Auteur (-{authorPaperDiscount}%)
                  </span>
                  <span className="font-bold text-navy text-[11px]">
                    {authorPap.toLocaleString("fr-FR")} XOF
                  </span>
                </div>

                {/* Grossiste */}
                <div className="p-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-center">
                  <span className="text-[9px] font-bold text-emerald-700 uppercase block font-sans">
                    Gros (-{wholesalePaperDiscount}%)
                  </span>
                  <span className="font-bold text-navy text-[11px]">
                    {wholesalePap.toLocaleString("fr-FR")} XOF
                  </span>
                </div>

                {/* Université */}
                <div className="p-1.5 rounded-xl bg-blue-500/10 border border-blue-500/25 text-center">
                  <span className="text-[9px] font-bold text-blue-700 uppercase block font-sans">
                    Campus (-{universityPaperDiscount}%)
                  </span>
                  <span className="font-bold text-navy text-[11px]">
                    {uniPap.toLocaleString("fr-FR")} XOF
                  </span>
                </div>
              </div>
            );
          },
        },
        {
          key: "actions",
          header: "Actions",
          className: "text-right",
          cell: (row: AdminCatalogBook) => {
            const isCustom = row.price_digital !== defaultDigitalPrice || row.price_paper !== defaultPaperPrice;
            return (
              <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                <button
                  onClick={() => handleOpenEditBook(row)}
                  className="px-3 py-1.5 rounded-xl bg-navy text-white text-xs font-semibold hover:bg-navy-hover transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer min-h-[34px]"
                  title="Modifier le prix de base de cet ouvrage"
                >
                  <Edit3 className="w-3.5 h-3.5 text-gold" />
                  Modifier
                </button>
                {isCustom && (
                  <button
                    onClick={() => handleResetToDefault(row)}
                    className="px-2.5 py-1.5 rounded-xl border border-border text-foreground-muted text-xs font-medium hover:border-gold hover:text-navy transition-colors flex items-center gap-1 cursor-pointer min-h-[34px]"
                    title="Réaligner sur la cascade globale"
                  >
                    <RotateCcw className="w-3 h-3 text-gold" />
                    Réaligner
                  </button>
                )}
              </div>
            );
          },
        },
      ];
    }

    // Vues filtrées par profil spécifique
    const profileConfig = {
      public: {
        title: "Clients & Lecteurs",
        digDiscount: 0,
        papDiscount: 0,
        badgeClass: "bg-navy-light text-navy",
      },
      author: {
        title: "Auteurs & Chercheurs",
        digDiscount: authorDigitalDiscount,
        papDiscount: authorPaperDiscount,
        badgeClass: "bg-gold/15 text-gold border border-gold/30",
      },
      wholesale: {
        title: "Grossistes & Librairies",
        digDiscount: wholesaleDigitalDiscount,
        papDiscount: wholesalePaperDiscount,
        badgeClass: "bg-emerald-500/15 text-emerald-700 border border-emerald-500/30",
      },
      university: {
        title: "Universités & Campus",
        digDiscount: universityDigitalDiscount,
        papDiscount: universityPaperDiscount,
        badgeClass: "bg-blue-500/15 text-blue-700 border border-blue-500/30",
      },
    }[activeTabRole];

    return [
      {
        key: "title",
        header: "Ouvrage",
        cell: (row: AdminCatalogBook) => (
          <div className="flex items-center gap-3 py-1">
            <div className="w-9 h-12 rounded-lg bg-navy/5 border border-border shrink-0 overflow-hidden flex items-center justify-center shadow-2xs">
              {row.cover_url ? (
                <img src={row.cover_url} alt={row.title} className="w-full h-full object-cover" />
              ) : (
                <BookOpen className="w-4 h-4 text-navy/40" />
              )}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-xs text-navy truncate max-w-[240px]" title={row.title}>
                {row.title}
              </p>
              <p className="text-[11px] text-foreground-muted font-mono truncate max-w-[240px]">
                {row.isbn} • {row.publisher_name}
              </p>
            </div>
          </div>
        ),
      },
      {
        key: "discipline",
        header: "Discipline",
        cell: (row: AdminCatalogBook) => (
          <span className="text-[10px] px-2.5 py-1 rounded-lg bg-gold/10 text-gold font-bold border border-gold/20 whitespace-nowrap inline-block">
            {row.discipline || "Général"}
          </span>
        ),
      },
      {
        key: "base_public",
        header: "Prix Public de Base",
        cell: (row: AdminCatalogBook) => {
          const dig = row.price_digital || defaultDigitalPrice;
          const pap = row.price_paper || defaultPaperPrice;
          return (
            <div className="space-y-1 font-mono text-xs text-foreground-muted whitespace-nowrap">
              <div>Num: <span className="line-through">{dig.toLocaleString("fr-FR")} XOF</span></div>
              <div>Papier: <span className="line-through">{pap.toLocaleString("fr-FR")} XOF</span></div>
            </div>
          );
        },
      },
      {
        key: "net_price",
        header: `Tarif Net Facturé (${profileConfig?.title})`,
        cell: (row: AdminCatalogBook) => {
          const dig = row.price_digital || defaultDigitalPrice;
          const pap = row.price_paper || defaultPaperPrice;
          const netDig = Math.round(dig * (1 - (profileConfig?.digDiscount || 0) / 100));
          const netPap = Math.round(pap * (1 - (profileConfig?.papDiscount || 0) / 100));

          return (
            <div className="space-y-1 font-mono text-xs whitespace-nowrap">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-sans font-bold text-navy">Numérique :</span>
                <span className="font-bold text-gold">{netDig.toLocaleString("fr-FR")} XOF</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-sans font-bold text-navy">Papier :</span>
                <span className="font-bold text-gold">{netPap.toLocaleString("fr-FR")} XOF</span>
              </div>
            </div>
          );
        },
      },
      {
        key: "saving",
        header: "Remise & Économie",
        cell: (row: AdminCatalogBook) => {
          const pap = row.price_paper || defaultPaperPrice;
          const discountPct = profileConfig?.papDiscount || 0;
          const economie = Math.round((pap * discountPct) / 100);

          if (discountPct === 0) {
            return <span className="text-xs text-foreground-muted italic">Plein Tarif</span>;
          }

          return (
            <div className="space-y-0.5 whitespace-nowrap">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md inline-block ${profileConfig?.badgeClass}`}>
                -{discountPct}% de remise
              </span>
              <p className="text-[10px] font-mono text-emerald-700 font-bold">
                Économie: {economie.toLocaleString("fr-FR")} XOF / ex.
              </p>
            </div>
          );
        },
      },
      {
        key: "actions",
        header: "Actions",
        className: "text-right",
        cell: (row: AdminCatalogBook) => (
          <button
            onClick={() => handleOpenEditBook(row)}
            className="px-3 py-1.5 rounded-xl bg-navy text-white text-xs font-semibold hover:bg-navy-hover transition-colors inline-flex items-center gap-1.5 shadow-2xs cursor-pointer min-h-[34px] whitespace-nowrap"
          >
            <Edit3 className="w-3.5 h-3.5 text-gold" />
            Modifier
          </button>
        ),
      },
    ];
  }, [
    activeTabRole,
    defaultDigitalPrice,
    defaultPaperPrice,
    authorDigitalDiscount,
    authorPaperDiscount,
    wholesaleDigitalDiscount,
    wholesalePaperDiscount,
    universityDigitalDiscount,
    universityPaperDiscount,
  ]);

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/admin/catalog"
          className="inline-flex items-center gap-1 text-xs font-medium text-gold hover:text-gold-dark mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Retour au catalogue
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-navy-light text-navy text-xs font-semibold mb-2">
              <Sliders className="w-3.5 h-3.5 text-gold" />
              Grille Tarifaire Multi-Rôles &amp; Profils Acheteurs
            </div>
            <h1 className="text-xl sm:text-2xl font-bold font-serif text-navy">
              Politique Tarifaire &amp; Remises par Profil Acheteur
            </h1>
            <p className="text-xs sm:text-sm text-foreground-muted mt-0.5">
              Fixez les prix publics de référence et les remises accordées à chaque type de rôle (Étudiants/Clients, Auteurs, Grossistes B2B, Universités).
            </p>
          </div>
        </div>
      </div>

      {/* Grille 4 Profils Acheteurs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Profil 1: Grand Public / Étudiants */}
        <form
          onSubmit={handleSavePublicDefaults}
          className="p-5 rounded-2xl bg-background-secondary border border-border space-y-3.5 flex flex-col justify-between shadow-xs"
        >
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <span className="text-xs font-bold text-navy uppercase tracking-wider">1. Clients &amp; Étudiants</span>
              <span className="text-[10px] font-bold text-navy bg-navy-light px-2 py-0.5 rounded-full">Plein Tarif (100%)</span>
            </div>
            <p className="text-[11px] text-foreground-muted mt-1.5">
              Prix public standard appliqué sur la liseuse et à l&apos;unité.
            </p>

            <div className="space-y-2 mt-3 text-xs">
              <div>
                <label className="text-[10px] font-semibold text-foreground-muted block">Numérique Défaut</label>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <input
                    type="number"
                    min="500"
                    step="100"
                    value={defaultDigitalPrice}
                    onChange={(e) => setDefaultDigitalPrice(Number(e.target.value))}
                    className="w-full p-2 text-xs font-mono font-bold rounded-lg bg-background border border-border text-navy focus:border-gold focus:outline-none"
                    required
                  />
                  <span className="text-[10px] font-bold text-foreground-muted">XOF</span>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-foreground-muted block">Papier Défaut</label>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <input
                    type="number"
                    min="1000"
                    step="100"
                    value={defaultPaperPrice}
                    onChange={(e) => setDefaultPaperPrice(Number(e.target.value))}
                    className="w-full p-2 text-xs font-mono font-bold rounded-lg bg-background border border-border text-navy focus:border-gold focus:outline-none"
                    required
                  />
                  <span className="text-[10px] font-bold text-foreground-muted">XOF</span>
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={savingGlobal}
            className="w-full py-2 rounded-xl bg-navy text-white text-xs font-semibold hover:bg-navy-hover transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer min-h-[38px] disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5 text-gold" />
            {savingGlobal ? "Sauvegarde..." : "Valider Public"}
          </button>
        </form>

        {/* Profil 2: Auteurs */}
        <div className="p-5 rounded-2xl bg-background-secondary border border-border space-y-3.5 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <span className="text-xs font-bold text-navy uppercase tracking-wider">2. Auteurs &amp; Chercheurs</span>
              <span className="text-[10px] font-bold text-gold bg-gold/10 px-2 py-0.5 rounded-full border border-gold/20">Tarif Auteur</span>
            </div>
            <p className="text-[11px] text-foreground-muted mt-1.5">
              Remise pour commandes d&apos;exemplaires personnels, dédicaces ou acquisitions auteur.
            </p>

            <div className="space-y-2 mt-3 text-xs">
              <div>
                <label className="text-[10px] font-semibold text-foreground-muted block">Remise Papier Auteur</label>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <input
                    type="number"
                    min="0"
                    max="70"
                    value={authorPaperDiscount}
                    onChange={(e) => setAuthorPaperDiscount(Number(e.target.value))}
                    className="w-full p-2 text-xs font-mono font-bold rounded-lg bg-background border border-border text-navy focus:border-gold focus:outline-none"
                  />
                  <span className="text-[10px] font-bold text-foreground-muted">%</span>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-foreground-muted block">Remise Numérique Auteur</label>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <input
                    type="number"
                    min="0"
                    max="70"
                    value={authorDigitalDiscount}
                    onChange={(e) => setAuthorDigitalDiscount(Number(e.target.value))}
                    className="w-full p-2 text-xs font-mono font-bold rounded-lg bg-background border border-border text-navy focus:border-gold focus:outline-none"
                  />
                  <span className="text-[10px] font-bold text-foreground-muted">%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-2 rounded-xl bg-gold/10 text-gold text-[10px] font-bold text-center border border-gold/20">
            Ex: Papier à {(defaultPaperPrice * (1 - authorPaperDiscount / 100)).toLocaleString("fr-FR")} XOF
          </div>
        </div>

        {/* Profil 3: Grossistes & Librairies */}
        <div className="p-5 rounded-2xl bg-background-secondary border border-border space-y-3.5 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <span className="text-xs font-bold text-navy uppercase tracking-wider">3. Grossistes (B2B)</span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Achat en Gros</span>
            </div>
            <p className="text-[11px] text-foreground-muted mt-1.5">
              Commandes groupées de licences et cartons de livres (min. {wholesaleMinQty} ex.).
            </p>

            <div className="space-y-2 mt-3 text-xs">
              <div>
                <label className="text-[10px] font-semibold text-foreground-muted block">Remise Papier Grossiste</label>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <input
                    type="number"
                    min="0"
                    max="70"
                    value={wholesalePaperDiscount}
                    onChange={(e) => setWholesalePaperDiscount(Number(e.target.value))}
                    className="w-full p-2 text-xs font-mono font-bold rounded-lg bg-background border border-border text-navy focus:border-gold focus:outline-none"
                  />
                  <span className="text-[10px] font-bold text-foreground-muted">%</span>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-foreground-muted block">Remise Numérique Grossiste</label>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <input
                    type="number"
                    min="0"
                    max="70"
                    value={wholesaleDigitalDiscount}
                    onChange={(e) => setWholesaleDigitalDiscount(Number(e.target.value))}
                    className="w-full p-2 text-xs font-mono font-bold rounded-lg bg-background border border-border text-navy focus:border-gold focus:outline-none"
                  />
                  <span className="text-[10px] font-bold text-foreground-muted">%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-800 text-[10px] font-bold text-center border border-emerald-200">
            Ex: Papier à {(defaultPaperPrice * (1 - wholesalePaperDiscount / 100)).toLocaleString("fr-FR")} XOF
          </div>
        </div>

        {/* Profil 4: Universités & Institutions */}
        <div className="p-5 rounded-2xl bg-background-secondary border border-border space-y-3.5 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <span className="text-xs font-bold text-navy uppercase tracking-wider">4. Universités &amp; Campus</span>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">Institutionnel</span>
            </div>
            <p className="text-[11px] text-foreground-muted mt-1.5">
              Bouquets documentaires campus et commandes de bibliothèques universitaires.
            </p>

            <div className="space-y-2 mt-3 text-xs">
              <div>
                <label className="text-[10px] font-semibold text-foreground-muted block">Remise Numérique Campus</label>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <input
                    type="number"
                    min="0"
                    max="70"
                    value={universityDigitalDiscount}
                    onChange={(e) => setUniversityDigitalDiscount(Number(e.target.value))}
                    className="w-full p-2 text-xs font-mono font-bold rounded-lg bg-background border border-border text-navy focus:border-gold focus:outline-none"
                  />
                  <span className="text-[10px] font-bold text-foreground-muted">%</span>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-foreground-muted block">Remise Papier Campus</label>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <input
                    type="number"
                    min="0"
                    max="70"
                    value={universityPaperDiscount}
                    onChange={(e) => setUniversityPaperDiscount(Number(e.target.value))}
                    className="w-full p-2 text-xs font-mono font-bold rounded-lg bg-background border border-border text-navy focus:border-gold focus:outline-none"
                  />
                  <span className="text-[10px] font-bold text-foreground-muted">%</span>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-navy block">Redevance Bouquets (Prorata)</label>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={universityBouquetRoyaltyRate}
                    onChange={(e) => setUniversityBouquetRoyaltyRate(Number(e.target.value))}
                    className="w-full p-2 text-xs font-mono font-bold rounded-lg bg-background border border-gold text-navy focus:border-gold focus:outline-none"
                  />
                  <span className="text-[10px] font-bold text-gold">%</span>
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveMultiRolePolicy}
            disabled={savingPolicy}
            className="w-full py-2 rounded-xl bg-gold text-navy text-xs font-bold hover:bg-gold-light transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer min-h-[38px] disabled:opacity-50"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            {savingPolicy ? "Sauvegarde..." : "Appliquer Tout"}
          </button>
        </div>
      </div>

      {/* Tableau Comparatif Multi-Rôles par Ouvrage */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-border">
          <div>
            <h2 className="text-base font-bold text-navy font-serif">
              Matrice Tarifaire Multi-Rôles par Ouvrage ({books.length})
            </h2>
            <p className="text-xs text-foreground-muted mt-0.5">
              Visualisez et comparez les tarifs appliqués selon le profil connecté.
            </p>
          </div>

          {/* Onglets de Vue Profils */}
          <div className="flex items-center gap-1.5 p-1 bg-background-secondary rounded-xl border border-border overflow-x-auto self-start sm:self-auto">
            {[
              { id: "all", label: "Vue Synthétique (Tous)" },
              { id: "public", label: "Clients & Lecteurs" },
              { id: "author", label: `Auteurs (-${authorPaperDiscount}%)` },
              { id: "wholesale", label: `Grossistes (-${wholesalePaperDiscount}%)` },
              { id: "university", label: `Universités (-${universityPaperDiscount}%)` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTabRole(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  activeTabRole === tab.id
                    ? "bg-navy text-white shadow-xs font-bold"
                    : "text-foreground-muted hover:text-navy hover:bg-background/80"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <DataTable
          data={books}
          columns={columns}
          rowKey="id"
          loading={loading}
          searchPlaceholder="Rechercher par titre, ISBN ou auteur..."
        />
      </div>

      {/* Modale d'Édition Spécifique d'un Ouvrage */}
      {editingBook && (
        <Modal
          open={!!editingBook}
          onClose={() => setEditingBook(null)}
          title={`Tarification de Référence : "${editingBook.title}"`}
        >
          <form onSubmit={handleSaveBookPricing} className="space-y-4 pt-2">
            <div className="p-3 rounded-xl bg-background-secondary border border-border space-y-1 text-xs text-foreground-muted">
              <p><strong className="text-navy">Éditeur :</strong> {editingBook.publisher_name}</p>
              <p><strong className="text-navy">ISBN :</strong> {editingBook.isbn}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-navy">
                  Prix Public Numérique Spécifique (XOF)
                </label>
                <input
                  type="number"
                  min="500"
                  step="100"
                  value={customDigitalPrice}
                  onChange={(e) => setCustomDigitalPrice(Number(e.target.value))}
                  className="w-full mt-1.5 p-2.5 text-xs font-mono font-bold rounded-xl bg-background border border-border text-navy focus:border-gold focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-navy">
                  Prix Public Papier Spécifique (XOF)
                </label>
                <input
                  type="number"
                  min="1000"
                  step="100"
                  value={customPaperPrice}
                  onChange={(e) => setCustomPaperPrice(Number(e.target.value))}
                  className="w-full mt-1.5 p-2.5 text-xs font-mono font-bold rounded-xl bg-background border border-border text-navy focus:border-gold focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Aperçu immédiat des prix nets par profil */}
            <div className="p-3.5 rounded-2xl bg-background-secondary border border-border space-y-2 text-xs">
              <p className="font-bold text-navy text-[11px] uppercase tracking-wider">
                Impact sur les Profils Acheteurs :
              </p>
              <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono">
                <div className="p-2 rounded-xl bg-background border border-border">
                  <span className="text-foreground-muted block font-semibold">Auteur</span>
                  <span className="font-bold text-gold text-xs">
                    {Math.round(customPaperPrice * (1 - authorPaperDiscount / 100)).toLocaleString("fr-FR")} XOF
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-background border border-border">
                  <span className="text-foreground-muted block font-semibold">Grossiste</span>
                  <span className="font-bold text-navy text-xs">
                    {Math.round(customPaperPrice * (1 - wholesalePaperDiscount / 100)).toLocaleString("fr-FR")} XOF
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-background border border-border">
                  <span className="text-foreground-muted block font-semibold">Université</span>
                  <span className="font-bold text-navy text-xs">
                    {Math.round(customPaperPrice * (1 - universityPaperDiscount / 100)).toLocaleString("fr-FR")} XOF
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setEditingBook(null)}
                className="px-4 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-background-secondary text-navy cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={savingBookPricing}
                className="px-4 py-2 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-gold" />
                {savingBookPricing ? "Enregistrement..." : "Appliquer les Prix"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
