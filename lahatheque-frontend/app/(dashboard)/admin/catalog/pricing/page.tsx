"use client";

import React, { useEffect, useState } from "react";
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
} from "@/lib/services/admin";
import { AdminCatalogBook, GlobalPricingConfig } from "@/lib/types/admin";
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

  const loadData = async () => {
    try {
      setLoading(true);
      const [configData, catalogData] = await Promise.all([
        getGlobalPricingConfig(),
        getAdminCatalog(),
      ]);
      setGlobalConfig(configData);
      setBooks(catalogData);
      if (configData) {
        setDefaultDigitalPrice(configData.prix_defaut_numerique_xof || 3000);
        setDefaultPaperPrice(configData.prix_defaut_papier_xof || 5000);
        setDefaultAudioPrice(configData.prix_defaut_audio_xof || 2500);
      }
    } catch (err) {
      toast.error("Erreur de chargement de la cascade tarifaire.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveDefaults = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingGlobal(true);
    try {
      const res = await updateGlobalPricingConfig({
        prix_defaut_numerique_xof: defaultDigitalPrice,
        prix_defaut_papier_xof: defaultPaperPrice,
        prix_defaut_audio_xof: defaultAudioPrice,
      });
      if (res.success) {
        toast.success("Cascade tarifaire par défaut mise à jour avec succès !");
      } else {
        toast.error(res.error || "Erreur de mise à jour des prix par défaut.");
      }
    } catch {
      toast.error("Erreur de communication avec le serveur.");
    } finally {
      setSavingGlobal(false);
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

  const columns: DataTableColumn<AdminCatalogBook>[] = [
    {
      key: "title",
      header: "Ouvrage & Auteur",
      cell: (row) => (
        <div>
          <p className="font-semibold text-xs text-foreground truncate max-w-[260px]">{row.title}</p>
          <p className="text-[11px] text-foreground-muted font-mono">{row.isbn} • {row.publisher_name}</p>
        </div>
      ),
    },
    {
      key: "discipline",
      header: "Discipline",
      cell: (row) => (
        <span className="text-xs px-2 py-0.5 rounded-full bg-navy-light text-navy font-medium">
          {row.discipline || "Sciences"}
        </span>
      ),
    },
    {
      key: "price_digital",
      header: "Prix Numérique (XOF)",
      cell: (row) => {
        const isCustom = row.price_digital !== defaultDigitalPrice;
        return (
          <div className="flex items-center gap-1.5 font-mono text-xs">
            <span className={`font-bold ${isCustom ? "text-gold" : "text-foreground"}`}>
              {row.price_digital?.toLocaleString("fr-FR")} XOF
            </span>
            {isCustom && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-gold/15 text-gold font-semibold">
                Spécifique
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "price_paper",
      header: "Prix Papier (XOF)",
      cell: (row) => {
        const isCustom = row.price_paper !== defaultPaperPrice;
        return (
          <div className="flex items-center gap-1.5 font-mono text-xs">
            <span className={`font-bold ${isCustom ? "text-gold" : "text-foreground"}`}>
              {row.price_paper?.toLocaleString("fr-FR")} XOF
            </span>
            {isCustom && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-gold/15 text-gold font-semibold">
                Spécifique
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      cell: (row) => {
        const isCustom = row.price_digital !== defaultDigitalPrice || row.price_paper !== defaultPaperPrice;
        return (
          <div className="flex items-center justify-end gap-1.5">
            <button
              onClick={() => handleOpenEditBook(row)}
              className="px-2.5 py-1 rounded-lg bg-navy-light text-navy text-xs font-semibold hover:bg-navy hover:text-white transition-colors flex items-center gap-1"
              title="Ajuster le tarif de ce livre"
            >
              <Edit3 className="w-3.5 h-3.5 text-gold" />
              Modifier
            </button>
            {isCustom && (
              <button
                onClick={() => handleResetToDefault(row)}
                className="px-2.5 py-1 rounded-lg border border-border text-foreground-muted text-xs font-medium hover:border-gold hover:text-navy transition-colors flex items-center gap-1"
                title="Réaligner en 1 clic sur les tarifs par défaut"
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

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto space-y-6">
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
              Cascade Tarifaire Multi-Formats
            </div>
            <h1 className="text-xl sm:text-2xl font-bold font-serif text-navy">
              Politique Tarifaire du Catalogue
            </h1>
            <p className="text-xs sm:text-sm text-foreground-muted mt-0.5">
              Définir les prix par défaut de la cascade globale et gérer les dérogations ouvrage par ouvrage avec réalignement en 1 clic.
            </p>
          </div>
        </div>
      </div>

      {/* Grille des Prix par Défaut (Cascade Globale) */}
      <form
        onSubmit={handleSaveDefaults}
        className="p-5 sm:p-6 rounded-2xl bg-background-secondary border border-border space-y-4 shadow-xs"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
          <div>
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Tag className="w-4 h-4 text-gold" />
              Tarifs Généraux par Défaut (Cascade Plateforme)
            </h2>
            <p className="text-xs text-foreground-muted mt-0.5">
              Ces prix s'appliquent automatiquement à tous les livres qui n'ont pas de dérogation spécifique.
            </p>
          </div>
          <button
            type="submit"
            disabled={savingGlobal}
            className="px-4 py-2 rounded-xl bg-navy text-white text-xs font-semibold hover:bg-navy-hover transition-colors flex items-center gap-1.5 shadow-sm shrink-0 disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5 text-gold" />
            {savingGlobal ? "Enregistrement..." : "Enregistrer la Cascade"}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          {/* Format Numérique */}
          <div className="p-4 rounded-xl bg-background border border-border space-y-2">
            <label className="text-xs font-semibold text-foreground block">
              Prix Livre Numérique (EPUB / PDF)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="500"
                step="100"
                value={defaultDigitalPrice}
                onChange={(e) => setDefaultDigitalPrice(Number(e.target.value))}
                className="w-full p-2.5 text-sm font-mono font-bold rounded-lg bg-background-secondary border border-border text-foreground focus:border-gold focus:outline-none"
                required
              />
              <span className="text-xs font-bold text-foreground-muted">XOF</span>
            </div>
            <p className="text-[11px] text-foreground-muted">Applicable aux liseuses & accès web sécurisés</p>
          </div>

          {/* Format Papier */}
          <div className="p-4 rounded-xl bg-background border border-border space-y-2">
            <label className="text-xs font-semibold text-foreground block">
              Prix Livre Papier (Broché Physique)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1000"
                step="100"
                value={defaultPaperPrice}
                onChange={(e) => setDefaultPaperPrice(Number(e.target.value))}
                className="w-full p-2.5 text-sm font-mono font-bold rounded-lg bg-background-secondary border border-border text-foreground focus:border-gold focus:outline-none"
                required
              />
              <span className="text-xs font-bold text-foreground-muted">XOF</span>
            </div>
            <p className="text-[11px] text-foreground-muted">Prix de base pour tirage et livraison physique</p>
          </div>

          {/* Format Audio */}
          <div className="p-4 rounded-xl bg-background border border-border space-y-2">
            <label className="text-xs font-semibold text-foreground block">
              Prix Livre Audio (Synthèse Vocale)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="500"
                step="100"
                value={defaultAudioPrice}
                onChange={(e) => setDefaultAudioPrice(Number(e.target.value))}
                className="w-full p-2.5 text-sm font-mono font-bold rounded-lg bg-background-secondary border border-border text-foreground focus:border-gold focus:outline-none"
                required
              />
              <span className="text-xs font-bold text-foreground-muted">XOF</span>
            </div>
            <p className="text-[11px] text-foreground-muted">Écoute en streaming protégée</p>
          </div>
        </div>
      </form>

      {/* Grille du Catalogue avec Tarification Par Ouvrage */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground">
            Tarifs par Ouvrage & Dérogations ({books.length})
          </h2>
          <span className="text-xs text-foreground-muted">
            Possibilité de modifier ou réaligner chaque livre individuellement
          </span>
        </div>

        <DataTable
          data={books}
          columns={columns}
          rowKey="id"
          loading={loading}
          searchPlaceholder="Rechercher par titre ou ISBN..."
        />
      </div>

      {/* Modale d'Édition Spécifique d'un Ouvrage */}
      {editingBook && (
        <Modal
          open={!!editingBook}
          onClose={() => setEditingBook(null)}
          title={`Tarification Spécifique : "${editingBook.title}"`}
        >
          <form onSubmit={handleSaveBookPricing} className="space-y-4 pt-2">
            <div className="p-3 rounded-xl bg-background-secondary border border-border space-y-1 text-xs text-foreground-muted">
              <p><strong className="text-foreground">Éditeur :</strong> {editingBook.publisher_name}</p>
              <p><strong className="text-foreground">ISBN :</strong> {editingBook.isbn}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-foreground">
                  Prix Numérique Spécifique (XOF)
                </label>
                <input
                  type="number"
                  min="500"
                  step="100"
                  value={customDigitalPrice}
                  onChange={(e) => setCustomDigitalPrice(Number(e.target.value))}
                  className="w-full mt-1.5 p-2.5 text-sm font-mono font-bold rounded-xl bg-background border border-border text-foreground focus:border-gold focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-foreground">
                  Prix Papier Spécifique (XOF)
                </label>
                <input
                  type="number"
                  min="1000"
                  step="100"
                  value={customPaperPrice}
                  onChange={(e) => setCustomPaperPrice(Number(e.target.value))}
                  className="w-full mt-1.5 p-2.5 text-sm font-mono font-bold rounded-xl bg-background border border-border text-foreground focus:border-gold focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setEditingBook(null)}
                className="px-4 py-2 rounded-xl border border-border text-xs font-semibold hover:bg-background-secondary text-foreground"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={savingBookPricing}
                className="px-4 py-2 rounded-xl bg-navy text-white text-xs font-semibold hover:bg-navy-hover transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4 text-gold" />
                {savingBookPricing ? "Enregistrement..." : "Appliquer les Prix Spécifiques"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
