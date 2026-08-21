"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { getAdminSubscriptions } from "@/lib/services/admin";
import { AdminSubscriptionItem } from "@/lib/types/admin";

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<AdminSubscriptionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await getAdminSubscriptions();
        setSubscriptions(data);
      } catch (err) {
        console.error("Erreur de chargement des souscriptions admin", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const columns: DataTableColumn<AdminSubscriptionItem>[] = [
    {
      key: "name",
      header: "Intitulé de la Souscription",
      cell: (row) => (
        <div>
          <p className="font-semibold text-xs text-foreground">{row.name}</p>
          <p className="text-[11px] text-foreground-muted">{row.holder}</p>
        </div>
      ),
    },
    {
      key: "type",
      header: "Type",
      cell: (row) => (
        <span className="text-xs px-2.5 py-0.5 rounded-full bg-navy-light text-navy font-semibold">
          {row.type === "institution_bouquet" ? "Bouquet Universitaire (B2B)" : "Pass Individuel"}
        </span>
      ),
    },
    {
      key: "activeUsers",
      header: "Accès Simultanés",
      cell: (row) => (
        <span className="font-mono text-xs font-semibold text-foreground">
          {row.activeUsers.toLocaleString()} utilisateurs
        </span>
      ),
    },
    {
      key: "amount",
      header: "Montant",
      cell: (row) => (
        <span className="font-mono text-xs font-bold text-gold-dark">
          {row.amount.toLocaleString("fr-FR")} FCFA
        </span>
      ),
    },
    {
      key: "expiresAt",
      header: "Date d'Expiration",
      cell: (row) => (
        <span className="font-mono text-xs text-foreground-muted">
          {row.expiresAt ? new Date(row.expiresAt).toLocaleDateString("fr-FR") : "N/A"}
        </span>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <Link
          href="/admin/sales"
          className="inline-flex items-center gap-1 text-xs font-medium text-gold hover:text-gold-dark mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Retour aux Ventes
        </Link>
        <div className="pb-4 border-b border-border">
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-navy">
            Abonnements Lecteurs & Bouquets Institutionnels
          </h1>
          <p className="text-xs sm:text-sm text-foreground-muted mt-0.5">
            Suivi des accès simultanés, renouvellements et licences globales souscrites par les universités.
          </p>
        </div>
      </div>

      <DataTable
        data={subscriptions}
        columns={columns}
        rowKey="id"
        loading={loading}
        emptyMessage="Aucune souscription ou bouquet actif enregistré pour le moment."
        searchPlaceholder="Rechercher par titulaire ou bouquet..."
      />
    </div>
  );
}
