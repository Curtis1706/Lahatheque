"use client";

import React, { useEffect, useState } from "react";
import {
  Wallet,
  CheckCircle2,
  Clock,
  AlertTriangle,
  CreditCard,
  Building2,
  Coins,
  RefreshCw,
  Search,
  Calendar,
  User,
} from "lucide-react";
import { getManagerFinanceReport, type ManagerFinanceReport } from "@/lib/services/manager";
import { StatusBadge } from "@/components/ui/status-badge";

const PAYMENT_METHOD_LABELS: Record<string, { label: string; icon: React.ElementType }> = {
  mobile_money: { label: "Mobile Money (MTN / Moov)", icon: Coins },
  virement: { label: "Virement Bancaire", icon: Building2 },
  especes: { label: "Espèces à la livraison", icon: Wallet },
  carte: { label: "Carte Bancaire", icon: CreditCard },
};

export default function ManagerFinancePage() {
  const [report, setReport] = useState<ManagerFinanceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchCredit, setSearchCredit] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getManagerFinanceReport();
      setReport(data);
    } catch {
      // Fallback empty
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredCredits = (report?.credit_orders || []).filter((o) => {
    const q = searchCredit.toLowerCase();
    return o.author_name.toLowerCase().includes(q) || o.id.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 text-xs text-foreground-muted mb-1">
            <span>Gestionnaire</span>
            <span>/</span>
            <span className="text-navy font-semibold">Supervision Financière</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Rapports & Flux Financiers
          </h1>
          <p className="text-sm text-foreground-muted mt-1">
            Supervision des encaissements réels, modes de paiement et achats à crédit des auteurs
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
            <span className="text-xs font-bold uppercase tracking-wider text-foreground-muted">Encaissé Réel</span>
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="font-serif text-2xl font-bold text-navy">
              {(report?.total_revenue_paid || 0).toLocaleString("fr-FR")} <span className="text-xs font-normal text-foreground-muted">FCFA</span>
            </div>
            <p className="text-xs text-foreground-muted mt-1">Total des commandes payées</p>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-background border border-border space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-foreground-muted">Crédits en Cours</span>
            <div className="p-2.5 rounded-2xl bg-gold/10 text-gold border border-gold/20">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="font-serif text-2xl font-bold text-navy">
              {(report?.credit_outstanding_total || 0).toLocaleString("fr-FR")} <span className="text-xs font-normal text-foreground-muted">FCFA</span>
            </div>
            <p className="text-xs text-foreground-muted mt-1">Achats auteurs en attente de règlement</p>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-background border border-border space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-foreground-muted">Crédits Réglés</span>
            <div className="p-2.5 rounded-2xl bg-blue-500/10 text-blue-600 border border-blue-500/20">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="font-serif text-2xl font-bold text-navy">
              {(report?.credit_settled_total || 0).toLocaleString("fr-FR")} <span className="text-xs font-normal text-foreground-muted">FCFA</span>
            </div>
            <p className="text-xs text-foreground-muted mt-1">Anciens crédits apurés avec succès</p>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-background border border-border space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-foreground-muted">Crédits en Retard</span>
            <div className={`p-2.5 rounded-2xl border ${(report?.credit_overdue_count || 0) > 0 ? "bg-rose-500/10 text-rose-600 border-rose-500/20" : "bg-background-secondary text-foreground-muted border-border"}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className={`font-serif text-2xl font-bold ${(report?.credit_overdue_count || 0) > 0 ? "text-rose-600" : "text-navy"}`}>
              {report?.credit_overdue_count || 0} <span className="text-xs font-normal text-foreground-muted">dossier{(report?.credit_overdue_count || 0) > 1 ? "s" : ""}</span>
            </div>
            <p className="text-xs text-foreground-muted mt-1">Échéance de paiement dépassée</p>
          </div>
        </div>
      </div>

      {/* Breakdown by Payment Method */}
      <div className="p-6 rounded-3xl bg-background border border-border space-y-5">
        <div>
          <h2 className="font-serif text-lg font-bold text-navy">Répartition par Mode de Paiement</h2>
          <p className="text-xs text-foreground-muted mt-0.5">Encaissements réels validés par canal financier</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(report?.revenue_by_payment_method || []).map((item) => {
            const config = PAYMENT_METHOD_LABELS[item.method] || { label: item.method, icon: CreditCard };
            const Icon = config.icon;
            return (
              <div key={item.method} className="p-4 rounded-2xl bg-background-secondary border border-border flex items-center gap-4">
                <div className="p-3 rounded-xl bg-navy/5 text-navy border border-border">
                  <Icon className="w-5 h-5 text-gold" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-foreground-muted truncate">{config.label}</p>
                  <p className="font-serif font-bold text-navy text-base mt-0.5">
                    {item.total.toLocaleString("fr-FR")} <span className="text-[10px] font-normal">FCFA</span>
                  </p>
                  <p className="text-[11px] text-foreground-muted">{item.count} commande{item.count > 1 ? "s" : ""}</p>
                </div>
              </div>
            );
          })}
          {(report?.revenue_by_payment_method || []).length === 0 && (
            <div className="col-span-full py-8 text-center text-xs text-foreground-muted">
              Aucune commande payée enregistrée pour le moment.
            </div>
          )}
        </div>
      </div>

      {/* Credit Orders Detailed List */}
      <div className="p-6 rounded-3xl bg-background border border-border space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-serif text-lg font-bold text-navy">Registre des Commandes à Crédit Auteurs</h2>
            <p className="text-xs text-foreground-muted mt-0.5">
              Suivi des sorties de stock et accès numériques accordés sur échéancier
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-foreground-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher un auteur ou réf..."
              value={searchCredit}
              onChange={(e) => setSearchCredit(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-border bg-background-secondary text-navy placeholder:text-foreground-muted focus:outline-none focus:border-gold min-h-[40px]"
            />
          </div>
        </div>

        {/* Mobile View: Cards */}
        <div className="block lg:hidden space-y-3">
          {filteredCredits.map((c) => (
            <div key={c.id} className="p-4 rounded-2xl bg-background-secondary border border-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-navy">#{c.id.slice(0, 8)}</span>
                {c.is_overdue && c.statut_paiement === "pending" ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                    <AlertTriangle className="w-3 h-3" /> En retard
                  </span>
                ) : (
                  <StatusBadge status={c.statut_paiement === "paid" ? "paid" : "pending"} />
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-navy font-semibold">
                  <User className="w-3.5 h-3.5 text-gold" />
                  <span>{c.author_name}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-foreground-muted pt-1">
                  <span>Montant dû :</span>
                  <span className="font-mono font-bold text-navy">{c.amount.toLocaleString("fr-FR")} FCFA</span>
                </div>
                <div className="flex items-center justify-between text-xs text-foreground-muted">
                  <span>Échéance :</span>
                  <span className={`font-medium ${c.is_overdue && c.statut_paiement === "pending" ? "text-rose-600 font-bold" : "text-navy"}`}>
                    {c.due_date ? new Date(c.due_date).toLocaleDateString("fr-FR") : "Non définie"}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {filteredCredits.length === 0 && (
            <div className="p-8 text-center text-xs text-foreground-muted">
              Aucun paiement en dépôt trouvé.
            </div>
          )}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border text-foreground-muted">
                <th className="pb-3 font-semibold uppercase tracking-wider">Référence</th>
                <th className="pb-3 font-semibold uppercase tracking-wider">Auteur Partenaire</th>
                <th className="pb-3 font-semibold uppercase tracking-wider text-right">Montant</th>
                <th className="pb-3 font-semibold uppercase tracking-wider text-center">Échéance</th>
                <th className="pb-3 font-semibold uppercase tracking-wider text-center">Statut Paiement</th>
                <th className="pb-3 font-semibold uppercase tracking-wider text-center">Statut Commande</th>
                <th className="pb-3 font-semibold uppercase tracking-wider text-right">Date d&apos;émission</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredCredits.map((c) => (
                <tr key={c.id} className="hover:bg-background-secondary/50 transition-colors">
                  <td className="py-3.5 font-mono font-bold text-navy">#{c.id.slice(0, 8)}</td>
                  <td className="py-3.5 font-medium text-navy">{c.author_name}</td>
                  <td className="py-3.5 font-mono font-bold text-navy text-right">{c.amount.toLocaleString("fr-FR")} FCFA</td>
                  <td className="py-3.5 text-center">
                    {c.due_date ? (
                      <div className="inline-flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-foreground-muted" />
                        <span className={c.is_overdue && c.statut_paiement === "pending" ? "text-rose-600 font-bold" : "text-navy"}>
                          {new Date(c.due_date).toLocaleDateString("fr-FR")}
                        </span>
                        {c.is_overdue && c.statut_paiement === "pending" && (
                          <span className="text-[10px] text-rose-600 font-bold bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                            Retard
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-foreground-muted">—</span>
                    )}
                  </td>
                  <td className="py-3.5 text-center">
                    <StatusBadge status={c.statut_paiement === "paid" ? "paid" : "pending"} />
                  </td>
                  <td className="py-3.5 text-center">
                    <StatusBadge status={c.statut_commande} />
                  </td>
                  <td className="py-3.5 text-right text-foreground-muted">
                    {new Date(c.created_at).toLocaleDateString("fr-FR")}
                  </td>
                </tr>
              ))}

              {filteredCredits.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-foreground-muted">
                    Aucun achat à crédit trouvé.
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
