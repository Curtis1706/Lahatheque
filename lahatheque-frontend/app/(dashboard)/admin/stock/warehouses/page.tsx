"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Modal } from "@/components/ui/modal";
import {
  getAdminStockOverview,
  createAdminWarehouse,
} from "@/lib/services/admin";
import { AdminWarehouse } from "@/lib/types/admin";
import {
  Building2,
  Plus,
  ArrowLeft,
  MapPin,
  User,
  Boxes,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

export default function AdminWarehousesPage() {
  const [warehouses, setWarehouses] = useState<AdminWarehouse[]>([]);
  const [loading, setLoading] = useState(true);

  // Modale de Création
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [country, setCountry] = useState("Bénin");
  const [city, setCity] = useState("");
  const [managerName, setManagerName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getAdminStockOverview();
      setWarehouses(data.warehouses);
    } catch {
      toast.error("Impossible de récupérer la liste des entrepôts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim() || !city.trim() || !managerName.trim()) {
      toast.error("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createAdminWarehouse({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        country,
        city: city.trim(),
        manager_name: managerName.trim(),
      });

      if (res.success) {
        toast.success(res.message || "Entrepôt créé avec succès !");
        setIsCreateOpen(false);
        setName("");
        setCode("");
        setCity("");
        setManagerName("");
        await loadData();
      } else {
        toast.error(res.error || "Erreur lors de la création.");
      }
    } catch {
      toast.error("Erreur de communication avec le serveur.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3 text-foreground-muted">
          <Loader2 className="w-6 h-6 animate-spin text-navy" />
          <p className="text-xs">Chargement des entrepôts régionaux...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2 text-xs text-foreground-muted mb-1">
            <Link href="/admin" className="hover:text-navy transition-colors">Administration</Link>
            <span>/</span>
            <Link href="/admin/stock" className="hover:text-navy transition-colors">Stock Physique</Link>
            <span>/</span>
            <span className="text-navy font-semibold">Entrepôts Régionaux</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-navy flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-gold" />
            Gestion des Entrepôts & Hubs Logistiques
          </h1>
          <p className="text-xs sm:text-sm text-foreground-muted mt-0.5">
            Configuration des plateformes régionales de stockage, gestionnaires délégués et inventaires locaux.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/stock"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-background border border-border text-foreground text-xs font-semibold hover:border-gold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Vue Stock</span>
          </Link>

          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-navy text-white text-xs font-semibold hover:bg-navy/90 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4 text-gold" />
            <span>Nouvel Entrepôt</span>
          </button>
        </div>
      </div>

      {/* Grille des Entrepôts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {warehouses.map((wh) => (
          <div
            key={wh.id}
            className="p-6 rounded-2xl bg-background-secondary border border-border space-y-4 hover:border-gold/50 transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-navy/10 text-navy">
                    {wh.code}
                  </span>
                  <h2 className="text-base font-bold text-foreground font-serif mt-1.5">
                    {wh.name}
                  </h2>
                </div>
                <span className="text-xs text-foreground-muted flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-gold shrink-0" />
                  {wh.city}, {wh.country}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-background border border-border space-y-1 text-xs">
                <div className="flex items-center justify-between text-foreground-muted">
                  <span>Responsable de site</span>
                  <span className="font-medium text-navy flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-gold" />
                    {wh.manager_name}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded-xl bg-background border border-border">
                  <span className="text-[11px] text-foreground-muted">Volume Actuel</span>
                  <p className="font-bold text-navy font-mono text-sm mt-0.5">
                    {wh.total_items.toLocaleString("fr-FR")} ex.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-background border border-border">
                  <span className="text-[11px] text-foreground-muted">Ruptures / Alertes</span>
                  <p className={`font-bold font-mono text-sm mt-0.5 ${wh.critical_alerts > 0 ? "text-error" : "text-success"}`}>
                    {wh.critical_alerts} alerte{wh.critical_alerts > 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
              <span className="text-success font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                Opérationnel
              </span>

              <Link
                href="/admin/stock/movements"
                className="text-navy font-semibold hover:text-gold transition-colors"
              >
                Voir les flux &rarr;
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Modale de Création d'Entrepôt */}
      <Modal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Créer un Nouvel Entrepôt Régional"
      >
        <form onSubmit={handleCreate} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-foreground">Nom de l'Entrepôt *</label>
            <input
              type="text"
              required
              placeholder="Ex: Entrepôt Libreville Hub Sud"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full mt-1.5 p-2.5 text-xs rounded-xl bg-background border border-border focus:border-gold focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-foreground">Code Identifiant *</label>
              <input
                type="text"
                required
                placeholder="WAR-LBV-01"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full mt-1.5 p-2.5 text-xs rounded-xl bg-background border border-border focus:border-gold focus:outline-none font-mono uppercase"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">Pays *</label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full mt-1.5 p-2.5 text-xs rounded-xl bg-background border border-border focus:border-gold focus:outline-none"
              >
                <option value="Bénin">Bénin</option>
                <option value="Sénégal">Sénégal</option>
                <option value="Côte d'Ivoire">Côte d'Ivoire</option>
                <option value="Togo">Togo</option>
                <option value="Gabon">Gabon</option>
                <option value="Cameroun">Cameroun</option>
                <option value="RDC">RDC</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-foreground">Ville de localisation *</label>
              <input
                type="text"
                required
                placeholder="Ex: Libreville"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full mt-1.5 p-2.5 text-xs rounded-xl bg-background border border-border focus:border-gold focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">Gestionnaire Responsable *</label>
              <input
                type="text"
                required
                placeholder="Ex: Patrick Mba"
                value={managerName}
                onChange={(e) => setManagerName(e.target.value)}
                className="w-full mt-1.5 p-2.5 text-xs rounded-xl bg-background border border-border focus:border-gold focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-border flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-foreground-muted hover:bg-background-secondary"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-navy text-white text-xs font-semibold hover:bg-navy/90 transition-colors flex items-center gap-1.5 disabled:opacity-50 shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Création...</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5 text-gold" />
                  <span>Enregistrer l'Entrepôt</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
