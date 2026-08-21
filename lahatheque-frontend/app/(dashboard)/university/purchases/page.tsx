"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  ArrowLeft,
  PlusCircle,
  Truck,
  FileText,
  Clock,
  CheckCircle2,
  PackageCheck,
  Building2,
  Eye,
} from "lucide-react";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { getUniversityPaperOrders } from "@/lib/services/university";
import type { UniversityPaperOrder } from "@/lib/types/university";

export default function UniversityPurchasesPage() {
  const [orders, setOrders] = useState<UniversityPaperOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await getUniversityPaperOrders();
      setOrders(data);
      setLoading(false);
    }
    loadData();
  }, []);

  const columns: DataTableColumn<UniversityPaperOrder>[] = [
    {
      key: "order_number",
      header: "N° Commande & Date",
      cell: (row) => (
        <div>
          <span className="font-mono text-xs font-bold text-navy">{row.order_number}</span>
          <p className="text-[10px] text-foreground-muted">
            {new Date(row.created_at).toLocaleDateString("fr-FR")}
          </p>
        </div>
      ),
    },
    {
      key: "delivery_campus",
      header: "Campus & Contact",
      cell: (row) => (
        <div className="space-y-0.5">
          <p className="text-xs font-semibold text-navy leading-snug truncate max-w-[260px]">
            {row.delivery_campus}
          </p>
          <p className="text-[10px] text-foreground-muted">
            R&eacute;ception : {row.contact_person} ({row.contact_phone})
          </p>
        </div>
      ),
    },
    {
      key: "items",
      header: "Volumes Commandés",
      hideOnMobile: true,
      cell: (row) => {
        const totalQty = row.items.reduce((sum, it) => sum + it.quantity, 0);
        return (
          <div>
            <span className="font-mono text-xs font-bold text-navy">
              {totalQty} exemplaires
            </span>
            <p className="text-[10px] text-foreground-muted truncate max-w-[200px]">
              {row.items.map((i) => i.title).join(", ")}
            </p>
          </div>
        );
      },
    },
    {
      key: "total_amount",
      header: "Montant Facturé",
      cell: (row) => (
        <span className="font-mono text-xs font-bold text-navy">
          {row.total_amount.toLocaleString("fr-FR")} {row.currency}
        </span>
      ),
    },
    {
      key: "status",
      header: "Statut Livraison",
      cell: (row) => {
        if (row.status === "delivered") {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3 h-3" />
              Livré sur Campus
            </span>
          );
        }
        if (row.status === "in_transit") {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-navy-light text-navy border border-navy-hover/20">
              <Truck className="w-3 h-3 text-gold" />
              En cours de livraison
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3" />
            En préparation
          </span>
        );
      },
    },
    {
      key: "pdf_order_url" as keyof UniversityPaperOrder,
      header: "",
      cell: (row) => (
        <div className="flex items-center gap-2 justify-end">
          {row.tracking_number && (
            <span className="font-mono text-[10px] text-foreground-muted hidden sm:inline">
              Réf : {row.tracking_number}
            </span>
          )}
          <a
            href={row.pdf_order_url || "#"}
            className="px-2.5 py-1.5 rounded-xl bg-background-secondary border border-border hover:border-gold text-navy text-[11px] font-bold inline-flex items-center gap-1 transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-gold" />
            <span>Bon PDF</span>
          </a>
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/university" className="hover:text-navy">Vue d&apos;ensemble</Link>
        <span>/</span>
        <span className="text-navy font-semibold">Commandes Papier Campus</span>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/university" className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Vue d&apos;ensemble
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
            <ShoppingBag className="w-4 h-4 text-gold" />
            Approvisionnement des Bibliothèques Physiques (Section 4.1.6)
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Commandes de Livres Papier pour l&apos;Établissement
          </h1>
          <p className="text-xs text-foreground-muted mt-1">
            Suivi des commandes d&apos;ouvrages physiques passées pour approvisionner les bibliothèques et facultés de votre université.
          </p>
        </div>

        <Link
          href="/university/purchases/new"
          className="px-4 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors inline-flex items-center gap-2 shadow-xs min-h-[44px]"
        >
          <PlusCircle className="w-4 h-4 text-gold" />
          Nouvelle Commande Papier
        </Link>
      </div>

      {/* Table DataTable 21st.dev paginée */}
      <DataTable
        data={orders}
        columns={columns}
        rowKey="id"
        loading={loading}
        emptyMessage="Aucune commande de livre papier n'a été passée pour le moment."
        pageSize={10}
      />
    </div>
  );
}
