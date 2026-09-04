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
import { toast } from "sonner";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { getUniversityPaperOrders } from "@/lib/services/university";
import { generateOfficialPdf } from "@/lib/services/export-service";
import type { UniversityPaperOrder } from "@/lib/types/university";

export default function UniversityPurchasesPage() {
  const [orders, setOrders] = useState<UniversityPaperOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingPdfId, setGeneratingPdfId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const data = await getUniversityPaperOrders();
        setOrders(data);
      } catch (err) {
        console.error("Erreur chargement commandes papier:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleDownloadBonPdf = async (order: UniversityPaperOrder) => {
    setGeneratingPdfId(order.id);
    try {
      const totalQty = order.items.reduce((sum, it) => sum + it.quantity, 0);
      await generateOfficialPdf({
        docType: "BON_COMMANDE",
        docNumber: order.order_number,
        date: new Date(order.created_at).toLocaleDateString("fr-FR"),
        recipient: {
          name: "Université Partenaire (Campus)",
          roleOrTitle: order.contact_person || "Responsable Acquisitions",
          addressOrCampus: order.delivery_campus,
          emailOrPhone: order.contact_phone,
        },
        summaryCards: [
          { label: "Volumes Commandés", value: `${totalQty} exemplaires` },
          { label: "Montant Facturé", value: `${order.total_amount.toLocaleString("fr-FR")} ${order.currency}` },
          {
            label: "Statut Livraison",
            value:
              order.status === "delivered"
                ? "Livré sur Campus"
                : order.status === "in_transit"
                ? "En cours d'acheminement"
                : "En préparation logistique",
          },
          { label: "Suivi Expédition", value: order.tracking_number || "Attribué à l'envoi" },
        ],
        tableHeaders: [
          "Réf.",
          "Titre de l'Ouvrage",
          "Fonds / Campus",
          "Quantité",
          "Prix Unitaire",
          "Total Ligne",
        ],
        tableRows: order.items.map((it, idx) => {
          const unitPrice = it.unit_price || 0;
          const lineTotal = unitPrice * it.quantity;
          return [
            `LIGNE-${idx + 1}`,
            it.title,
            "Fonds Académique",
            `${it.quantity} ex.`,
            `${unitPrice.toLocaleString("fr-FR")} ${order.currency}`,
            `${lineTotal.toLocaleString("fr-FR")} ${order.currency}`,
          ];
        }),
        totalAmount: `${order.total_amount.toLocaleString("fr-FR")} ${order.currency}`,
        totalNotes:
          "Bon de Commande Institutionnel certifié conforme pour l'approvisionnement des bibliothèques universitaires. Conditions de livraison : Franco de port pour les commandes campus partenaires. Éditions LAHAThèque S.A.",
        filename: `bon_commande_${order.order_number}.pdf`,
      });
      toast.success(`Bon de commande officiel ${order.order_number} téléchargé en PDF !`);
    } catch (err) {
      console.error("Erreur génération PDF bon de commande:", err);
      toast.error("Une erreur est survenue lors de la génération du bon de commande PDF.");
    } finally {
      setGeneratingPdfId(null);
    }
  };

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
            Réception : {row.contact_person} ({row.contact_phone})
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
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-navy/10 text-navy border border-navy/20">
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
          <button
            type="button"
            disabled={generatingPdfId === row.id}
            onClick={() => handleDownloadBonPdf(row)}
            className="px-3 py-1.5 rounded-xl bg-background-secondary border border-border hover:border-gold hover:text-navy text-navy text-[11px] font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer min-h-[36px] disabled:opacity-50"
            title="Télécharger le bon de commande officiel PDF"
          >
            <FileText className="w-3.5 h-3.5 text-gold" />
            <span>{generatingPdfId === row.id ? "Génération..." : "Bon PDF"}</span>
          </button>
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
        <span className="text-navy font-semibold">Commandes</span>
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
            Approvisionnement &amp; Commandes
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Commandes de l&apos;Établissement
          </h1>
          <p className="text-xs text-foreground-muted mt-1">
            Suivi des commandes passées pour approvisionner les bibliothèques et départements de votre université.
          </p>
        </div>

        <Link
          href="/university/purchases/new"
          className="px-4 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors inline-flex items-center gap-2 shadow-xs min-h-[44px]"
        >
          <PlusCircle className="w-4 h-4 text-gold" />
          Nouvelle Commande
        </Link>
      </div>

      {/* Table DataTable 21st.dev paginée */}
      <DataTable
        data={orders}
        columns={columns}
        rowKey="id"
        loading={loading}
        emptyMessage="Aucune commande n'a été passée pour le moment."
        pageSize={10}
        mobileCard={(row) => (
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-mono font-bold text-navy">{row.order_number}</span>
                <p className="text-[10px] text-foreground-muted">
                  {new Date(row.created_at).toLocaleDateString("fr-FR")}
                </p>
              </div>
              <div>
                {row.status === "delivered" ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" /> Livré
                  </span>
                ) : row.status === "in_transit" ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-navy/10 text-navy border border-navy/20">
                    <Truck className="w-3 h-3 text-gold" /> En transit
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    <Clock className="w-3 h-3" /> En préparation
                  </span>
                )}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-background-secondary border border-border space-y-1">
              <p className="font-semibold text-navy truncate">{row.delivery_campus}</p>
              <p className="text-[10px] text-foreground-muted">
                Réception : {row.contact_person} ({row.contact_phone})
              </p>
              <p className="text-[10px] font-mono text-navy font-bold pt-1">
                {row.items.reduce((sum, it) => sum + it.quantity, 0)} exemplaires — {row.items.map((i) => i.title).join(", ")}
              </p>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="font-mono text-sm font-bold text-navy">
                {row.total_amount.toLocaleString("fr-FR")} {row.currency}
              </span>
              <button
                type="button"
                disabled={generatingPdfId === row.id}
                onClick={() => handleDownloadBonPdf(row)}
                className="px-3 py-1.5 rounded-xl bg-background-secondary border border-border hover:border-gold hover:text-navy text-navy text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer min-h-[36px]"
              >
                <FileText className="w-3.5 h-3.5 text-gold" />
                <span>{generatingPdfId === row.id ? "Génération..." : "Bon PDF"}</span>
              </button>
            </div>
          </div>
        )}
      />
    </div>
  );
}
