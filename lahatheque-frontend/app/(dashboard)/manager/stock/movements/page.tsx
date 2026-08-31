"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Package,
  ArrowDownCircle,
  History,
  ChevronDown,
  X,
  Check,
  BookOpen,
  Search,
} from "lucide-react";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { InlineLoader } from "@/components/ui/page-loader";
import {
  getStockMovements,
  createRestock,
  createManualExit,
  getStockItems,
  getAvailableBooksForStock,
} from "@/lib/services/manager";
import type { AvailableBookForStock } from "@/lib/services/manager";
import type { StockMovement, StockItem } from "@/lib/types/manager";

// ─── Label type de mouvement ──────────────────────────────────────────────────
const MOVEMENT_LABELS: Record<string, string> = {
  restock: "Réassort",
  sale: "Vente",
  return: "Retour",
  damage: "Avarie",
  correction: "Correction",
  manual_exit: "Sortie manuelle",
  adjustment: "Ajustement",
};

// ─── Modal Réassort (Refonte UX) ──────────────────────────────────────────────
function RestockModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [books, setBooks] = useState<AvailableBookForStock[]>([]);
  const [selectedBook, setSelectedBook] = useState<AvailableBookForStock | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [quantite, setQuantite] = useState(1);
  const [reference, setReference] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoadingBooks(true);
      try {
        const data = await getAvailableBooksForStock();
        setBooks(data);
      } catch {
        setError("Impossible de charger les ouvrages.");
      } finally {
        setLoadingBooks(false);
      }
    }
    load();
  }, []);

  const filteredBooks = useMemo(() => {
    if (!searchQuery.trim()) return books;
    const q = searchQuery.toLowerCase();
    return books.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.authors.toLowerCase().includes(q) ||
        b.isbn.toLowerCase().includes(q)
    );
  }, [books, searchQuery]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!selectedBook) { setError("Sélectionnez un ouvrage."); return; }
    if (quantite <= 0) { setError("Quantité invalide."); return; }
    setSaving(true);
    try {
      await createRestock({
        stock_id: selectedBook.stock_id || undefined,
        ouvrage_id: selectedBook.stock_id ? undefined : selectedBook.ouvrage_id,
        quantite,
        reference_document: reference,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Erreur lors du réassort.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true">
      <div className="bg-background border border-border rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-lg font-bold text-navy flex items-center gap-2">
              <Package className="w-5 h-5 text-gold" />
              Réassort Stock
            </h2>
            <p className="text-xs text-foreground-muted mt-0.5">Approvisionner un ouvrage publié.</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-background-secondary transition-colors" title="Fermer">
            <X className="w-4 h-4 text-foreground-muted" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Recherche d'ouvrage */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-foreground-muted uppercase tracking-wider">
              Rechercher un ouvrage
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-foreground-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Titre, auteur ou ISBN..."
                className="w-full pl-9 pr-3 py-2.5 text-xs border border-border rounded-xl bg-background-secondary focus:outline-none focus:border-gold text-foreground min-h-[42px]"
              />
            </div>
          </div>

          {/* Liste des ouvrages cliquables */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-foreground-muted uppercase tracking-wider">
              Ouvrage ({filteredBooks.length} disponible{filteredBooks.length > 1 ? "s" : ""})
            </label>
            <div className="max-h-48 overflow-y-auto border border-border rounded-xl bg-background-secondary divide-y divide-border">
              {loadingBooks ? (
                <div className="p-4 text-center text-xs text-foreground-muted">Chargement des ouvrages...</div>
              ) : filteredBooks.length === 0 ? (
                <div className="p-4 text-center text-xs text-foreground-muted">Aucun ouvrage trouvé.</div>
              ) : (
                filteredBooks.map((book) => (
                  <button
                    key={book.ouvrage_id}
                    type="button"
                    onClick={() => setSelectedBook(book)}
                    className={`w-full flex items-center gap-3 p-3 text-left transition-colors ${
                      selectedBook?.ouvrage_id === book.ouvrage_id
                        ? "bg-gold/10 font-medium"
                        : "hover:bg-background"
                    }`}
                  >
                    {/* Couverture miniature */}
                    <div className="w-8 h-11 rounded bg-navy/10 flex-shrink-0 flex items-center justify-center overflow-hidden">
                      {book.cover_url ? (
                        <img src={book.cover_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <BookOpen className="w-4 h-4 text-navy/40" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-navy truncate">{book.title}</p>
                      <p className="text-[10px] text-foreground-muted truncate">
                        {book.authors || "Auteur inconnu"} {book.isbn ? `— ${book.isbn}` : ""}
                      </p>
                    </div>

                    {/* Badge stock actuel */}
                    <div className="flex-shrink-0 text-right">
                      {book.is_new_stock ? (
                        <span className="inline-block px-2 py-0.5 rounded-full bg-gold/20 text-gold text-[10px] font-bold">
                          Nouveau
                        </span>
                      ) : (
                        <span className={`text-xs font-mono font-bold ${
                          book.quantite_disponible <= 0 ? "text-error" :
                          book.quantite_disponible <= book.seuil_alerte ? "text-gold" :
                          "text-success"
                        }`}>
                          {book.quantite_disponible} en stock
                        </span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Ouvrage sélectionné — récapitulatif */}
          {selectedBook && (
            <div className="p-3 rounded-xl bg-navy/5 border border-navy/20 space-y-1">
              <p className="text-xs font-bold text-navy">{selectedBook.title}</p>
              <div className="flex items-center gap-3 text-[10px] text-foreground-muted">
                <span>Entrepôt : {selectedBook.warehouse_nom || selectedBook.warehouse || "Principal"}</span>
                <span>Stock actuel : <strong className="text-navy">{selectedBook.quantite_reelle}</strong></span>
                {selectedBook.is_new_stock && (
                  <span className="text-gold font-bold">Première entrée en stock</span>
                )}
              </div>
            </div>
          )}

          {/* Quantité */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-foreground-muted uppercase tracking-wider">
              Quantité à approvisionner
            </label>
            <input
              type="number"
              min={1}
              value={quantite}
              onChange={(e) => setQuantite(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full px-3 py-2.5 text-sm font-mono border border-border rounded-xl bg-background-secondary focus:outline-none focus:border-gold text-foreground min-h-[42px]"
            />
          </div>

          {/* Référence */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-foreground-muted uppercase tracking-wider">
              Référence document <span className="font-normal">(optionnel)</span>
            </label>
            <input
              type="text"
              value={reference}
              placeholder="BL-2026-001, facture fournisseur, bon de livraison..."
              onChange={(e) => setReference(e.target.value)}
              className="w-full px-3 py-2.5 text-xs border border-border rounded-xl bg-background-secondary focus:outline-none focus:border-gold text-foreground min-h-[42px]"
            />
          </div>

          {error && (
            <p className="text-xs text-error bg-error/10 border border-error/20 rounded-xl px-3 py-2">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-background-secondary transition-colors min-h-[44px]">
              Annuler
            </button>
            <button
              type="submit"
              disabled={saving || !selectedBook}
              className="flex-1 px-4 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-2 min-h-[44px]"
            >
              {saving ? (
                <InlineLoader size={16} />
              ) : (
                <Check className="w-4 h-4" />
              )}
              Approvisionner {quantite > 0 ? `(+${quantite})` : ""}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal Sortie Manuelle ────────────────────────────────────────────────────
function ManualExitModal({
  stockItems,
  onClose,
  onSuccess,
}: {
  stockItems: StockItem[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [stockId, setStockId] = useState("");
  const [quantite, setQuantite] = useState(1);
  const [motif, setMotif] = useState("");
  const [typeM, setTypeM] = useState<"manual_exit" | "adjustment" | "return">("manual_exit");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!stockId) { setError("Sélectionnez un ouvrage."); return; }
    if (quantite <= 0) { setError("Quantité invalide."); return; }
    if (!motif.trim()) { setError("Le motif est obligatoire."); return; }
    setSaving(true);
    try {
      await createManualExit({ stock_id: stockId, quantite, motif: motif.trim(), type_mouvement: typeM });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Erreur lors de la sortie manuelle.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true">
      <div className="bg-background border border-border rounded-2xl shadow-xl w-full max-w-md p-6 space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-lg font-bold text-navy">Sortie de Stock</h2>
            <p className="text-xs text-foreground-muted mt-0.5">Enregistrer une sortie (avarie, retour, correction).</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-background-secondary transition-colors" title="Fermer">
            <X className="w-4 h-4 text-foreground-muted" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-foreground-muted uppercase tracking-wider">Type de sortie</label>
            <div className="flex gap-2 flex-wrap">
              {[
                { val: "manual_exit", label: "Sortie manuelle" },
                { val: "return", label: "Retour" },
                { val: "adjustment", label: "Ajustement" },
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setTypeM(opt.val as any)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${
                    typeM === opt.val ? "bg-navy/10 text-navy border border-navy/30 font-bold" : "text-foreground-muted border border-border hover:border-navy/20"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sélection ouvrage */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-foreground-muted uppercase tracking-wider">Ouvrage / Stock</label>
            <div className="relative">
              <select
                value={stockId}
                onChange={(e) => setStockId(e.target.value)}
                className="w-full appearance-none px-3 pr-8 py-2.5 text-xs border border-border rounded-xl bg-background-secondary focus:outline-none focus:border-gold text-foreground min-h-[42px]"
              >
                <option value="">-- Choisir un ouvrage --</option>
                {stockItems.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title} — {(s as any).warehouse_nom || s.warehouse}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-foreground-muted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Quantité */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-foreground-muted uppercase tracking-wider">Quantité à sortir</label>
            <input
              type="number"
              min={1}
              value={quantite}
              onChange={(e) => setQuantite(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full px-3 py-2.5 text-sm font-mono border border-border rounded-xl bg-background-secondary focus:outline-none focus:border-gold text-foreground min-h-[42px]"
            />
          </div>

          {/* Motif */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-foreground-muted uppercase tracking-wider">Motif <span className="text-error">*</span></label>
            <textarea
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              placeholder="Ex : 12 exemplaires endommagés lors du transport…"
              rows={3}
              className="w-full px-3 py-2.5 text-xs border border-border rounded-xl bg-background-secondary focus:outline-none focus:border-gold text-foreground resize-none"
            />
          </div>

          {error && (
            <p className="text-xs text-error bg-error/10 border border-error/20 rounded-xl px-3 py-2">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-background-secondary transition-colors min-h-[44px]">
              Annuler
            </button>
            <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl bg-error text-white text-xs font-bold hover:bg-error/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 min-h-[44px]">
              {saving ? (
                <InlineLoader size={16} />
              ) : (
                <ArrowDownCircle className="w-4 h-4" />
              )}
              Enregistrer sortie
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function StockMovementsPage() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [mvData, stkData] = await Promise.all([
      getStockMovements(),
      getStockItems(),
    ]);
    setMovements(mvData);
    setStockItems(stkData);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const columns: DataTableColumn<StockMovement>[] = [
    {
      key: "created_at",
      header: "Date",
      cell: (row) => (
        <span className="text-xs text-foreground font-mono">
          {new Date(row.created_at).toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      ),
    },
    {
      key: "book_title",
      header: "Ouvrage",
      cell: (row) => (
        <span className="text-xs font-semibold text-navy truncate max-w-[180px] block">
          {row.book_title}
        </span>
      ),
    },
    {
      key: "movement_type",
      header: "Type",
      cell: (row) => <StatusBadge status={row.movement_type} />,
    },
    {
      key: "quantity",
      header: "Quantité",
      cell: (row) => (
        <span
          className={`font-mono font-bold text-xs ${
            row.quantity > 0 ? "text-success" : "text-error"
          }`}
        >
          {row.quantity > 0 ? `+${row.quantity}` : row.quantity}
        </span>
      ),
    },
    {
      key: "reason" as keyof StockMovement,
      header: "Motif",
      hideOnMobile: true,
      cell: (row) => (
        <span className="text-xs text-foreground-muted truncate max-w-[150px] block">
          {(row as any).motif || (row as any).reason || "—"}
        </span>
      ),
    },
    {
      key: "origin",
      header: "Origine",
      hideOnMobile: true,
      cell: (row) => (
        <span className="text-xs text-foreground-muted">
          {row.origin === "manual"
            ? "Manuel"
            : row.origin === "auto_order"
            ? "Commande auto"
            : "Retour fournisseur"}
        </span>
      ),
    },
    {
      key: "created_by",
      header: "Par",
      hideOnMobile: true,
      cell: (row) => (
        <span className="text-xs text-foreground-muted">{row.created_by}</span>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/manager" className="hover:text-navy">Vue d&apos;ensemble</Link>
        <span>/</span>
        <Link href="/manager/stock" className="hover:text-navy">Stock</Link>
        <span>/</span>
        <span className="text-navy font-semibold">Journal des Mouvements</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <Link href="/manager/stock" className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Retour au stock
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
            <History className="w-4 h-4 text-gold" />
            Journal d&apos;Audit
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Mouvements de Stock
          </h1>
          <p className="text-xs text-foreground-muted mt-1">
            Enregistrement immuable de toutes les entrées, sorties, retours et corrections.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setShowExitModal(true)}
            className="inline-flex items-center gap-2 bg-background border border-error text-error text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-error/5 transition-colors min-h-[44px]"
          >
            <ArrowDownCircle className="w-4 h-4" />
            Sortie manuelle
          </button>
          <button
            onClick={() => setShowRestockModal(true)}
            className="inline-flex items-center gap-2 bg-navy hover:bg-navy-hover text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-xs min-h-[44px]"
          >
            <Package className="w-4 h-4" />
            Réassort
          </button>
        </div>
      </div>

      {/* Stats résumés */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Total mouvements",
            value: movements.length,
            color: "text-navy",
          },
          {
            label: "Réassorts",
            value: movements.filter((m) => m.movement_type === "restock").length,
            color: "text-success",
          },
          {
            label: "Sorties",
            value: movements.filter((m) =>
              ["manual_exit", "damage", "adjustment"].includes(m.movement_type)
            ).length,
            color: "text-error",
          },
          {
            label: "Retours",
            value: movements.filter((m) => m.movement_type === "return").length,
            color: "text-gold",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="p-4 rounded-2xl bg-background-secondary border border-border"
          >
            <p className="text-[11px] text-foreground-muted uppercase tracking-wider font-bold mb-1">
              {stat.label}
            </p>
            <p className={`text-2xl font-bold font-mono ${stat.color}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Table */}
      <DataTable
        data={movements}
        columns={columns}
        rowKey="id"
        loading={loading}
        emptyMessage="Aucun mouvement enregistré pour le moment."
        pageSize={20}
      />

      {/* Modales */}
      {showRestockModal && (
        <RestockModal
          onClose={() => setShowRestockModal(false)}
          onSuccess={loadData}
        />
      )}
      {showExitModal && (
        <ManualExitModal
          stockItems={stockItems}
          onClose={() => setShowExitModal(false)}
          onSuccess={loadData}
        />
      )}
    </div>
  );
}
