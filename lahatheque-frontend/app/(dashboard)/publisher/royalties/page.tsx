"use client";

import { useEffect, useState } from "react";
import { getPublisherStats, getRoyaltyPayments, getSalesTransactions } from "@/lib/services/publisher";
import { PublisherStats, RoyaltyPayment, SalesTransaction } from "@/lib/types/publisher";
import { 
  DollarSign, 
  TrendingUp, 
  DownloadCloud, 
  CheckCircle, 
  Clock, 
  ArrowRight,
  TrendingDown,
  Calendar,
  CreditCard
} from "lucide-react";

export default function RoyaltiesPage() {
  const [stats, setStats] = useState<PublisherStats | null>(null);
  const [payments, setPayments] = useState<RoyaltyPayment[]>([]);
  const [transactions, setTransactions] = useState<SalesTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRoyaltyData() {
      try {
        setLoading(true);
        const [statsData, paymentsData, txData] = await Promise.all([
          getPublisherStats(),
          getRoyaltyPayments(),
          getSalesTransactions()
        ]);
        setStats(statsData);
        setPayments(paymentsData);
        setTransactions(txData);
      } catch (err) {
        console.error("Erreur de chargement des redevances", err);
      } finally {
        setLoading(false);
      }
    }
    loadRoyaltyData();
  }, []);

  const totalPaid = payments
    .filter(p => p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingPayment = payments
    .filter(p => p.status === "processing")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="p-6 lg:p-8 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl lg:text-3xl font-bold text-navy">Redevances & Ventes</h1>
          <p className="text-sm text-foreground-muted">Suivez vos gains, vos ventes unitaires et l'état de vos versements.</p>
        </div>
        <button className="inline-flex items-center justify-center gap-2 bg-gold hover:bg-gold-dark text-white font-bold text-sm px-5 py-3 rounded shadow-sm self-start sm:self-auto">
          <DownloadCloud className="w-4 h-4" />
          Télécharger le rapport annuel
        </button>
      </div>

      {/* Stats Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="bg-background border border-border p-6 rounded animate-pulse space-y-2">
              <div className="h-4 w-20 bg-background-secondary rounded" />
              <div className="h-6 w-32 bg-background-secondary rounded" />
            </div>
          ))
        ) : (
          stats && (
            <>
              {/* Box 1 */}
              <div className="bg-background border border-border p-6 rounded flex items-center justify-between">
                <div>
                  <span className="text-xs text-foreground-muted font-medium block">Total cumulé gagné</span>
                  <span className="text-2xl font-bold text-navy mt-1">{(stats.total_royalties).toLocaleString()} FCFA</span>
                </div>
                <div className="w-10 h-10 rounded bg-gold/10 text-gold flex items-center justify-center">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>

              {/* Box 2 */}
              <div className="bg-background border border-border p-6 rounded flex items-center justify-between">
                <div>
                  <span className="text-xs text-foreground-muted font-medium block font-sans">Déjà versé (Payé)</span>
                  <span className="text-2xl font-bold text-success mt-1">{totalPaid.toLocaleString()} FCFA</span>
                </div>
                <div className="w-10 h-10 rounded bg-success/10 text-success flex items-center justify-center">
                  <CheckCircle className="w-5 h-5" />
                </div>
              </div>

              {/* Box 3 */}
              <div className="bg-background border border-border p-6 rounded flex items-center justify-between">
                <div>
                  <span className="text-xs text-foreground-muted font-medium block">En cours de versement</span>
                  <span className="text-2xl font-bold text-warning mt-1">{pendingPayment.toLocaleString()} FCFA</span>
                </div>
                <div className="w-10 h-10 rounded bg-warning/10 text-warning flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
            </>
          )
        )}
      </div>

      {/* Detail grids */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left : Last Sales Transactions Table */}
        <div className="lg:col-span-8 bg-background border border-border rounded shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-serif text-base font-bold text-navy">Historique des ventes récentes</h3>
            <span className="text-xs text-foreground-muted font-medium">SYSCOHADA Standard</span>
          </div>

          {loading ? (
            <div className="p-6 space-y-4 animate-pulse">
              <div className="h-8 bg-background-secondary rounded" />
              <div className="h-10 bg-background-secondary rounded" />
              <div className="h-10 bg-background-secondary rounded" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-background-secondary border-b border-border text-navy font-bold text-xs uppercase tracking-wider">
                    <th className="p-4">Ouvrage</th>
                    <th className="p-4">Type de vente</th>
                    <th className="p-4">Prix de vente</th>
                    <th className="p-4 text-right">Votre Redevance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-background-secondary/30 transition-colors">
                      <td className="p-4">
                        <p className="font-bold text-navy">{tx.book_title}</p>
                        <p className="text-[10px] text-foreground-muted flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          {new Date(tx.transaction_date).toLocaleDateString("fr-FR")} à {new Date(tx.transaction_date).toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                          tx.type === "purchase" 
                            ? "bg-navy-hover/10 text-navy" 
                            : "bg-gold/10 text-gold-dark"
                        }`}>
                          {tx.type === "purchase" ? "Achat direct" : "Part bouquet"}
                        </span>
                      </td>
                      <td className="p-4 text-foreground-muted font-medium">
                        {tx.sale_price.toLocaleString()} {tx.currency}
                      </td>
                      <td className="p-4 text-right font-bold text-navy">
                        +{tx.royalty_earned.toLocaleString()} {tx.currency}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right : Payments disbursements history */}
        <div className="lg:col-span-4 bg-background border border-border rounded shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="font-serif text-base font-bold text-navy">Historique des versements</h3>
          </div>

          {loading ? (
            <div className="p-6 space-y-4 animate-pulse">
              <div className="h-12 bg-background-secondary rounded" />
              <div className="h-12 bg-background-secondary rounded" />
            </div>
          ) : (
            <div className="divide-y divide-border">
              {payments.map((p) => (
                <div key={p.id} className="p-4 space-y-3 hover:bg-background-secondary/20 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-navy text-sm">+{p.amount.toLocaleString()} {p.currency}</span>
                    {p.status === "paid" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-success/10 text-success">
                        <CheckCircle className="w-3 h-3" /> Payé
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-warning/10 text-warning">
                        <Clock className="w-3 h-3" /> En cours
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-foreground-muted space-y-1">
                    <p className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      Versé le {new Date(p.payment_date).toLocaleDateString("fr-FR")}
                    </p>
                    <p className="flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5" />
                      {p.payment_method}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
