"use client";

import { useEffect, useState } from "react";
import { 
  getBouquetSubscriptions, 
  getUsageStats, 
  renewSubscription 
} from "@/lib/services/librarian";
import { BouquetSubscription, UsageStats } from "@/lib/types/librarian";
import { 
  ArrowLeft, 
  Bookmark, 
  TrendingUp, 
  Calendar, 
  Download, 
  BookOpen, 
  RefreshCw,
  CheckCircle2,
  Lock
} from "lucide-react";
import Link from "next/link";

export default function LibrarianStatsPage() {
  const [bouquets, setBouquets] = useState<BouquetSubscription[]>([]);
  const [stats, setStats] = useState<UsageStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [renewingId, setRenewingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadStatsData() {
      try {
        setLoading(true);
        const [bqData, statsData] = await Promise.all([
          getBouquetSubscriptions(),
          getUsageStats()
        ]);
        setBouquets(bqData);
        setStats(statsData);
      } catch (err) {
        console.error("Erreur de chargement des statistiques", err);
      } finally {
        setLoading(false);
      }
    }
    loadStatsData();
  }, []);

  const handleRenew = async (id: string) => {
    try {
      setRenewingId(id);
      const success = await renewSubscription(id);
      if (success) {
        setBouquets(prev => prev.map(bq => {
          if (bq.id === id) {
            const nextYear = new Date();
            nextYear.setFullYear(nextYear.getFullYear() + 1);
            return {
              ...bq,
              end_date: nextYear.toISOString(),
              status: "active" as const
            };
          }
          return bq;
        }));
        alert("Abonnement renouvelé pour 1 an avec succès !");
      }
    } catch (err) {
      alert("Erreur lors du renouvellement.");
    } finally {
      setRenewingId(null);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-8">
      
      {/* Header */}
      <div className="space-y-1">
        <Link
          href="/librarian"
          className="inline-flex items-center gap-1 text-xs font-bold text-navy hover:text-gold transition-colors mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Retour au Tableau de Bord
        </Link>
        <h1 className="font-serif text-2xl lg:text-3xl font-bold text-navy">Statistiques & Abonnements</h1>
        <p className="text-sm text-foreground-muted">Analysez l'utilisation des manuels et gérez vos bouquets documentaires.</p>
      </div>

      {/* Grid: Bouquets Subscription Management */}
      <div className="space-y-4">
        <h3 className="font-serif text-lg font-bold text-navy flex items-center gap-2">
          <Bookmark className="w-5 h-5 text-gold" />
          Gestion des bouquets documentaires
        </h3>
        
        {loading ? (
          <div className="h-32 bg-background border border-border animate-pulse rounded-xl" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {bouquets.map((bq) => (
              <div key={bq.id} className="bg-background border border-border rounded-xl p-6 shadow-sm flex flex-col justify-between gap-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-start gap-4">
                    <h4 className="font-serif font-bold text-navy text-base leading-snug">{bq.name}</h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-success/10 text-success border border-success/20">
                      Actif
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-foreground-muted">
                      <span>Utilisation des licences</span>
                      <span className="font-semibold">{bq.active_licenses} / {bq.max_licenses}</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-border overflow-hidden">
                      <div 
                        className="h-full bg-gold rounded-full" 
                        style={{ width: `${(bq.active_licenses / bq.max_licenses) * 100}%` }}
                      />
                    </div>
                  </div>

                  <p className="text-[11px] text-foreground-muted flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Période d'abonnement : Jusqu'au {new Date(bq.end_date).toLocaleDateString("fr-FR")}
                  </p>
                </div>

                <button
                  onClick={() => handleRenew(bq.id)}
                  disabled={renewingId === bq.id}
                  className="w-full py-2 bg-navy hover:bg-navy-hover text-white text-xs font-bold rounded shadow transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${renewingId === bq.id ? "animate-spin" : ""}`} />
                  {renewingId === bq.id ? "Renouvellement..." : "Renouveler l'abonnement"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Usage Analytics Grid */}
      <div className="space-y-4">
        <h3 className="font-serif text-lg font-bold text-navy flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-gold" />
          Rapports de consommation par discipline
        </h3>

        {loading ? (
          <div className="h-48 bg-background border border-border animate-pulse rounded-xl" />
        ) : (
          <div className="bg-background border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-background-secondary border-b border-border text-navy font-bold text-xs uppercase tracking-wider">
                    <th className="p-4">Discipline</th>
                    <th className="p-4 text-center">Consultations en ligne</th>
                    <th className="p-4 text-center">Téléchargements</th>
                    <th className="p-4 text-center">Volume (Pages lues)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {stats.map((row) => (
                    <tr key={row.discipline} className="hover:bg-background-secondary/30 transition-colors">
                      <td className="p-4 font-bold text-navy">{row.discipline}</td>
                      <td className="p-4 text-center text-foreground-muted">{row.views}</td>
                      <td className="p-4 text-center text-foreground-muted">{row.downloads}</td>
                      <td className="p-4 text-center font-bold text-navy">{row.pages_read.toLocaleString()} pages</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
