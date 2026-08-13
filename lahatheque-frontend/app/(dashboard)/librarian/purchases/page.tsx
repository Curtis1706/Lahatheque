"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { PackageCheck, ArrowLeft, Plus, Download, Truck, CheckCircle2, Clock } from "lucide-react";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { getUniversityPaperPurchases, createPaperOrder } from "@/lib/services/librarian";
import type { UniversityPaperPurchase } from "@/lib/types/librarian";

export default function UniversityPaperPurchasesPage() {
  const [purchases, setPurchases] = useState<UniversityPaperPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookTitle, setBookTitle] = useState("");
  const [copiesCount, setCopiesCount] = useState(50);
  const [unitPrice, setUnitPrice] = useState(12000);
  const [ordering, setOrdering] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await getUniversityPaperPurchases();
      setPurchases(data);
      setLoading(false);
    }
    loadData();
  }, []);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookTitle.trim()) return;

    setOrdering(true);
    try {
      const newPurchase = await createPaperOrder(bookTitle, copiesCount, unitPrice);
      setPurchases((prev) => [newPurchase, ...prev]);
      alert(`Commande papier ${newPurchase.reference} transmise au Gestionnaire de Stock !`);
      setBookTitle("");
    } finally {
      setOrdering(false);
    }
  };

  const columns: DataTableColumn<UniversityPaperPurchase>[] = [
    {
      key: "reference",
      header: "Référence Commande",
      cell: (row) => (
        <div>
          <p className="font-mono font-bold text-xs text-navy leading-snug">{row.reference}</p>
          <p className="text-[10px] text-foreground-muted">Commandé le {row.date}</p>
        </div>
      ),
    },
    {
      key: "title",
      header: "Ouvrage Papier",
      cell: (row) => (
        <div>
          <p className="font-serif font-bold text-xs text-navy leading-snug">{row.title}</p>
          {row.bundle_name && <p className="text-[10px] text-gold font-semibold">{row.bundle_name}</p>}
        </div>
      ),
    },
    {
      key: "copies_count",
      header: "Quantité Exemplaires",
      cell: (row) => (
        <span className="font-mono font-bold text-xs text-navy">
          {row.copies_count} ex. ({row.unit_price.toLocaleString("fr-FR")} XOF/u)
        </span>
      ),
    },
    {
      key: "total_price",
      header: "Montant Total",
      cell: (row) => (
        <span className="font-mono font-bold text-gold text-xs">
          {row.total_price.toLocaleString("fr-FR")} XOF
        </span>
      ),
    },
    {
      key: "status",
      header: "Suivi Expédition / Livraison",
      cell: (row) => (
        <div className="space-y-1">
          <StatusBadge status={row.status} />
          {row.tracking_number && (
            <span className="text-[10px] font-mono text-foreground-muted block">Suivi: {row.tracking_number}</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/librarian" className="hover:text-navy">Vue d&apos;ensemble</Link>
        <span>/</span>
        <span className="text-navy font-semibold">Achats Livres Papier</span>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/librarian" className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Vue d&apos;ensemble
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
            <PackageCheck className="w-4 h-4 text-gold" />
            Commandes Papier pour Bibliothèques Physiques (Section 4.1)
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Achats de Livres Papier (Unitaire &amp; Bouquet)
          </h1>
          <p className="text-xs text-foreground-muted mt-1">
            Commandez des exemplaires physiques d&apos;ouvrages ou de bouquets documentaires avec suivi en direct de l&apos;expédition.
          </p>
        </div>
      </div>

      {/* Formulaire Rapide de Commande Papier */}
      <form onSubmit={handleCreateOrder} className="p-6 rounded-3xl bg-background border border-border space-y-4 shadow-xs">
        <h3 className="font-serif font-bold text-navy text-sm uppercase tracking-wider">
          Passer une Nouvelle Commande d&apos;Exemplaires Papier
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="sm:col-span-2">
            <label htmlFor="book-title" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">Titre de l&apos;Ouvrage ou du Bouquet *</label>
            <input
              id="book-title"
              type="text"
              value={bookTitle}
              onChange={(e) => setBookTitle(e.target.value)}
              placeholder="ex. Traité de Droit Administratif Général (Lot 50 ex.)"
              className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl text-navy font-semibold focus:outline-none focus:border-gold min-h-[44px]"
              required
            />
          </div>

          <div>
            <label htmlFor="copies-cnt" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">Nombre d&apos;Exemplaires *</label>
            <input
              id="copies-cnt"
              type="number"
              min="1"
              value={copiesCount}
              onChange={(e) => setCopiesCount(parseInt(e.target.value) || 1)}
              className="w-full px-3.5 py-2.5 text-xs font-mono font-bold bg-background-secondary border border-border rounded-xl text-navy focus:outline-none focus:border-gold min-h-[44px]"
              required
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={ordering}
            className="px-6 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors inline-flex items-center gap-2 min-h-[44px] shadow-xs disabled:opacity-50"
          >
            {ordering ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Plus className="w-4 h-4 text-gold" />
                Commander les Exemplaires Papier
              </>
            )}
          </button>
        </div>
      </form>

      {/* Table des Achats Papier */}
      <div className="space-y-4">
        <h3 className="font-serif font-bold text-navy text-base">
          Historique des Commandes Papier ({purchases.length})
        </h3>

        <DataTable
          data={purchases}
          columns={columns}
          rowKey="id"
          loading={loading}
          emptyMessage="Aucun achat papier enregistré pour votre université."
          pageSize={10}
        />
      </div>
    </div>
  );
}
