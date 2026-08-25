"use client";

import React, { useEffect, useState } from "react";
import { Building2, ArrowLeft, Package, Truck, Phone, MapPin, Calendar } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import {
  getInstitutionalDeliveries,
  updateInstitutionalDelivery,
  type InstitutionalDelivery,
} from "@/lib/services/manager";

const STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  processing: "En préparation",
  in_transit: "Expédiée",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
};

export default function InstitutionalDeliveriesPage() {
  const [items, setItems] = useState<InstitutionalDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "university" | "wholesaler">("all");

  async function load() {
    setLoading(true);
    try {
      const data = await getInstitutionalDeliveries();
      setItems(data);
    } catch {
      toast.error("Impossible de charger les commandes institutionnelles.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleStatusChange(item: InstitutionalDelivery, newStatus: string) {
    try {
      await updateInstitutionalDelivery({ source: item.source, id: item.id, statut: newStatus });
      toast.success("Statut de livraison mis à jour, client notifié.");
      load();
    } catch {
      toast.error("Erreur lors de la mise à jour du statut.");
    }
  }

  const filtered = filter === "all" ? items : items.filter((i) => i.source === filter);

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 sm:space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/manager" className="hover:text-navy">Gestionnaire</Link>
        <span>/</span>
        <Link href="/manager/delivery" className="hover:text-navy">Livraisons</Link>
        <span>/</span>
        <span className="text-navy font-semibold">Commandes Institutionnelles</span>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/manager/delivery" className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Retour aux livraisons clients
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4 text-gold" />
            Partenariats &amp; Ventes B2B
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Commandes Institutionnelles &amp; Gros
          </h1>
          <p className="text-xs text-foreground-muted mt-1">
            Préparez et expédiez les commandes papier groupées passées par les universités partenaires et les grossistes agréés.
          </p>
        </div>
      </div>

      {/* Filtres par source */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {(["all", "university", "wholesaler"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              filter === f
                ? "bg-navy text-white shadow-xs"
                : "bg-background-secondary text-foreground-muted hover:text-navy border border-border"
            }`}
          >
            {f === "all"
              ? `Toutes les institutions (${items.length})`
              : f === "university"
              ? `Universités (${items.filter((i) => i.source === "university").length})`
              : `Grossistes (${items.filter((i) => i.source === "wholesaler").length})`}
          </button>
        ))}
      </div>

      {/* Liste des commandes institutionnelles */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 bg-background-secondary rounded-2xl animate-pulse border border-border" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center bg-background border border-border rounded-3xl space-y-2">
            <Building2 className="w-10 h-10 text-foreground-muted mx-auto" />
            <h3 className="font-bold text-sm text-navy">Aucune commande institutionnelle</h3>
            <p className="text-xs text-foreground-muted">
              Toutes les commandes d&apos;universités et de grossistes sont actuellement traitées.
            </p>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={`${item.source}-${item.id}`}
              className="bg-background border border-border rounded-2xl p-5 shadow-xs transition-all hover:border-navy/30 space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-navy/10 flex items-center justify-center shrink-0 mt-0.5">
                    {item.source === "university" ? (
                      <Building2 className="w-5 h-5 text-navy" />
                    ) : (
                      <Package className="w-5 h-5 text-navy" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md bg-gold/15 text-navy font-mono text-[10px] font-bold uppercase tracking-wider">
                        {item.source === "university" ? "Université Partenaire" : "Grossiste B2B"}
                      </span>
                      <span className="text-xs font-mono font-bold text-foreground-muted">
                        {item.reference}
                      </span>
                      <span className="text-[11px] text-foreground-muted flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-gold" />
                        {new Date(item.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
                      </span>
                    </div>
                    <h3 className="font-serif text-lg font-bold text-navy leading-snug">
                      {item.client_nom}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-foreground-muted flex-wrap">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-gold shrink-0" />
                        {item.destination}
                      </span>
                      {item.contact && (
                        <span className="flex items-center gap-1 font-mono">
                          <Phone className="w-3.5 h-3.5 text-gold shrink-0" />
                          {item.contact}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:items-end gap-2 shrink-0">
                  <div className="text-right">
                    <span className="text-[10px] text-foreground-muted uppercase font-bold block">Montant Facturé</span>
                    <span className="font-mono font-bold text-base text-navy">
                      {item.total_amount.toLocaleString("fr-FR")} XOF
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-[11px] font-bold text-foreground-muted uppercase">Statut :</label>
                    <select
                      value={item.statut}
                      onChange={(e) => handleStatusChange(item, e.target.value)}
                      aria-label="Statut de la commande"
                      className="px-3 py-1.5 text-xs font-semibold border border-border rounded-xl bg-background-secondary text-navy focus:outline-none focus:border-navy cursor-pointer"
                    >
                      {Object.entries(STATUS_LABELS).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Aperçu des articles */}
              {Array.isArray(item.items) && item.items.length > 0 && (
                <div className="pt-3 border-t border-border flex items-center gap-2 flex-wrap text-xs text-foreground-muted">
                  <span className="font-bold text-navy text-[11px] uppercase tracking-wider">Articles commandés :</span>
                  {item.items.slice(0, 3).map((it, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded-md bg-background-secondary border border-border text-[11px]">
                      {it.title || it.book_title || "Ouvrage"} (×{it.quantity || it.print_copies_qty || 1})
                    </span>
                  ))}
                  {item.items.length > 3 && (
                    <span className="text-[11px] text-gold font-bold">
                      +{item.items.length - 3} autre{item.items.length - 3 > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
