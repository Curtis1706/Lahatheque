"use client";

import React, { useEffect, useState } from "react";
import {
  Landmark,
  TrendingUp,
  Wallet,
  Clock,
  Building2,
  Users,
  Search,
  RefreshCw,
  Percent,
  CheckCircle2,
  DollarSign,
  BookOpen,
} from "lucide-react";
import {
  getAdminGlobalFinance,
  getAuthorRoyaltiesReport,
  type AdminGlobalFinance,
  type AuthorRoyaltyReportLine,
} from "@/lib/services/admin";

export default function AdminFinancePage() {
  const [finance, setFinance] = useState<AdminGlobalFinance | null>(null);
  const [authorRoyalties, setAuthorRoyalties] = useState<AuthorRoyaltyReportLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchAuthor, setSearchAuthor] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [fData, rData] = await Promise.all([
        getAdminGlobalFinance(),
        getAuthorRoyaltiesReport(),
      ]);
      setFinance(fData);
      setAuthorRoyalties(rData);
    } catch {
      // Fallback empty
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredAuthors = authorRoyalties.filter((a) => {
    const q = searchAuthor.toLowerCase();
    return a.author_name.toLowerCase().includes(q) || a.author_id.toLowerCase().includes(q);
  });

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full max-w-7xl mx-auto space-y-6 sm:space-y-8 pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 text-xs text-foreground-muted mb-1">
            <span>Administration</span>
            <span>/</span>
            <span className="text-navy font-semibold">Direction Financière</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Finances Globales de la Plateforme
          </h1>
          <p className="text-sm text-foreground-muted mt-1">
            Vue consolidée 360° des encaissements, créances, bouquets universitaires et redevances auteurs
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-background-secondary border border-border text-navy hover:border-gold/40 text-xs font-bold transition-all min-h-[44px]"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-gold" : "text-foreground-muted"}`} />
          <span>Actualiser</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-background border border-border space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-foreground-muted">Revenu Global Encaissé</span>
            <div className="p-2.5 rounded-2xl bg-gold/10 text-gold border border-gold/20">
              <Landmark className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="font-serif text-2xl font-bold text-navy">
              {(finance?.total_platform_revenue || 0).toLocaleString("fr-FR")} <span className="text-xs font-normal text-foreground-muted">FCFA</span>
            </div>
            <p className="text-xs text-foreground-muted mt-1">Tous flux (clients, univ., grossistes)</p>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-background border border-border space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-foreground-muted">Crédits Auteurs en Cours</span>
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="font-serif text-2xl font-bold text-navy">
              {(finance?.credit?.outstanding_total || 0).toLocaleString("fr-FR")} <span className="text-xs font-normal text-foreground-muted">FCFA</span>
            </div>
            <p className="text-xs text-foreground-muted mt-1">{finance?.credit?.outstanding_count || 0} commande{(finance?.credit?.outstanding_count || 0) > 1 ? "s" : ""} en attente</p>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-background border border-border space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-foreground-muted">Redevances Versées</span>
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="font-serif text-2xl font-bold text-navy">
              {(finance?.author_payouts?.total_processed || 0).toLocaleString("fr-FR")} <span className="text-xs font-normal text-foreground-muted">FCFA</span>
            </div>
            <p className="text-xs text-foreground-muted mt-1">Versements effectués aux auteurs</p>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-background border border-border space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-foreground-muted">Redevances en Attente</span>
            <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-600 border border-blue-500/20">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="font-serif text-2xl font-bold text-navy">
              {(finance?.author_payouts?.total_pending || 0).toLocaleString("fr-FR")} <span className="text-xs font-normal text-foreground-muted">FCFA</span>
            </div>
            <p className="text-xs text-foreground-muted mt-1">{finance?.author_payouts?.pending_count || 0} demande{(finance?.author_payouts?.pending_count || 0) > 1 ? "s" : ""} de retrait</p>
          </div>
        </div>
      </div>

      {/* Breakdown by Platform Revenue Stream */}
      <div className="p-6 rounded-3xl bg-background border border-border space-y-5">
        <div>
          <h2 className="font-serif text-lg font-bold text-navy">Répartition par Source de Revenus</h2>
          <p className="text-xs text-foreground-muted mt-0.5">Agrégation des flux d&apos;encaissement directs et partenariats B2B / institutionnels</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-background-secondary border border-border flex items-center gap-4">
            <div className="p-3 rounded-xl bg-navy/5 text-navy border border-border">
              <Users className="w-5 h-5 text-gold" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-foreground-muted truncate">Lecteurs & Auteurs</p>
              <p className="font-serif font-bold text-navy text-base mt-0.5">
                {(finance?.breakdown?.student_author_orders?.total || 0).toLocaleString("fr-FR")} <span className="text-[10px] font-normal">FCFA</span>
              </p>
              <p className="text-[11px] text-foreground-muted">{finance?.breakdown?.student_author_orders?.count || 0} commandes payées</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-background-secondary border border-border flex items-center gap-4">
            <div className="p-3 rounded-xl bg-navy/5 text-navy border border-border">
              <Building2 className="w-5 h-5 text-gold" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-foreground-muted truncate">Universités Partenaires</p>
              <p className="font-serif font-bold text-navy text-base mt-0.5">
                {(finance?.breakdown?.university_orders?.total || 0).toLocaleString("fr-FR")} <span className="text-[10px] font-normal">FCFA</span>
              </p>
              <p className="text-[11px] text-foreground-muted">{finance?.breakdown?.university_orders?.count || 0} commandes campus</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-background-secondary border border-border flex items-center gap-4">
            <div className="p-3 rounded-xl bg-navy/5 text-navy border border-border">
              <TrendingUp className="w-5 h-5 text-gold" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-foreground-muted truncate">Grossistes & Librairies</p>
              <p className="font-serif font-bold text-navy text-base mt-0.5">
                {(finance?.breakdown?.wholesale_orders?.total || 0).toLocaleString("fr-FR")} <span className="text-[10px] font-normal">FCFA</span>
              </p>
              <p className="text-[11px] text-foreground-muted">{finance?.breakdown?.wholesale_orders?.count || 0} commandes B2B</p>
            </div>
          </div>
        </div>
      </div>

      {/* Author Royalties Table */}
      <div className="p-6 rounded-3xl bg-background border border-border space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-serif text-lg font-bold text-navy">État Récapitulatif des Redevances par Auteur</h2>
            <p className="text-xs text-foreground-muted mt-0.5">
              Calcul des droits selon les taux contractuels, volumes vendus et montants versés
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-foreground-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher un auteur..."
              value={searchAuthor}
              onChange={(e) => setSearchAuthor(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-border bg-background-secondary text-navy placeholder:text-foreground-muted focus:outline-none focus:border-gold min-h-[40px]"
            />
          </div>
        </div>

        {/* Mobile View: Cards */}
        <div className="block lg:hidden space-y-3">
          {filteredAuthors.map((a) => (
            <div key={a.author_id} className="p-4 rounded-2xl bg-background-secondary border border-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-navy">{a.author_name}</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-gold bg-gold/10 px-2 py-0.5 rounded-full border border-gold/20">
                  <Percent className="w-3 h-3" /> {a.royalty_rate_percent}%
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-foreground-muted pt-1">
                <div>
                  <span>Ouvrages : </span>
                  <span className="font-bold text-navy">{a.books_count}</span>
                </div>
                <div>
                  <span>Ventes : </span>
                  <span className="font-bold text-navy">{a.books_sold_total} ex.</span>
                </div>
                <div>
                  <span>Total Dû : </span>
                  <span className="font-mono font-bold text-navy">{a.total_royalties_due.toLocaleString("fr-FR")} F</span>
                </div>
                <div>
                  <span>Déjà Versé : </span>
                  <span className="font-mono font-bold text-emerald-600">{a.total_royalties_paid.toLocaleString("fr-FR")} F</span>
                </div>
              </div>

              <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground-muted">Solde Restant :</span>
                <span className="font-mono font-bold text-navy">{a.total_royalties_outstanding.toLocaleString("fr-FR")} FCFA</span>
              </div>
            </div>
          ))}

          {filteredAuthors.length === 0 && (
            <div className="p-8 text-center text-xs text-foreground-muted">
              Aucun auteur avec redevances trouvé.
            </div>
          )}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border text-foreground-muted">
                <th className="pb-3 font-semibold uppercase tracking-wider">Auteur Partenaire</th>
                <th className="pb-3 font-semibold uppercase tracking-wider text-center">Ouvrages</th>
                <th className="pb-3 font-semibold uppercase tracking-wider text-center">Ventes Cumulées</th>
                <th className="pb-3 font-semibold uppercase tracking-wider text-center">Taux Moyen</th>
                <th className="pb-3 font-semibold uppercase tracking-wider text-right">Total Droit Dû</th>
                <th className="pb-3 font-semibold uppercase tracking-wider text-right">Total Déjà Versé</th>
                <th className="pb-3 font-semibold uppercase tracking-wider text-right">Solde Restant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredAuthors.map((a) => (
                <tr key={a.author_id} className="hover:bg-background-secondary/50 transition-colors">
                  <td className="py-3.5 font-medium text-navy">{a.author_name}</td>
                  <td className="py-3.5 text-center font-bold text-navy">
                    <span className="inline-flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5 text-foreground-muted" />
                      {a.books_count}
                    </span>
                  </td>
                  <td className="py-3.5 text-center font-bold text-navy">{a.books_sold_total} ex.</td>
                  <td className="py-3.5 text-center font-mono font-bold text-gold">{a.royalty_rate_percent}%</td>
                  <td className="py-3.5 font-mono font-bold text-navy text-right">{a.total_royalties_due.toLocaleString("fr-FR")} FCFA</td>
                  <td className="py-3.5 font-mono font-bold text-emerald-600 text-right">{a.total_royalties_paid.toLocaleString("fr-FR")} FCFA</td>
                  <td className="py-3.5 font-mono font-bold text-navy text-right">{a.total_royalties_outstanding.toLocaleString("fr-FR")} FCFA</td>
                </tr>
              ))}

              {filteredAuthors.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-foreground-muted">
                    Aucun auteur avec redevances trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
