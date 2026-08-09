"use client";

import { useEffect, useState } from "react";
import { getStudentAffiliations, getBouquetSubscriptions } from "@/lib/services/librarian";
import { StudentAffiliation, BouquetSubscription } from "@/lib/types/librarian";
import { 
  Users, 
  UserCheck, 
  Bookmark, 
  Building2, 
  CheckCircle, 
  Clock, 
  ArrowRight,
  FileText,
  TrendingUp,
  ShieldAlert
} from "lucide-react";
import Link from "next/link";
import { StatisticsCard12 } from "@/components/ui/statistics-card-12";

export default function LibrarianDashboardPage() {
  const [affiliations, setAffiliations] = useState<StudentAffiliation[]>([]);
  const [bouquets, setBouquets] = useState<BouquetSubscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [affData, bqData] = await Promise.all([
          getStudentAffiliations(),
          getBouquetSubscriptions()
        ]);
        setAffiliations(affData);
        setBouquets(bqData);
      } catch (err) {
        console.error("Erreur de chargement des données bibliothécaire", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const pendingAffiliations = affiliations.filter(a => a.status === "pending");
  const approvedCount = affiliations.filter(a => a.status === "approved").length;

  return (
    <div className="p-6 lg:p-8 space-y-8">
      
      {/* Header Banner */}
      <div className="bg-navy-dark text-white rounded-3xl p-6 sm:p-8 border border-navy/30 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-navy text-gold text-xs font-bold uppercase tracking-wider border border-gold/20">
            <Building2 className="w-3.5 h-3.5" />
            Portail Gestionnaire Institutionnel
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold">
            Université d'Abomey-Calavi (UAC)
          </h1>
          <p className="text-xs sm:text-sm text-white/80 max-w-xl">
            Gérez les accès abonnés de votre établissement, validez les affiliations d'étudiants et suivez le tableau de bord des consommations de ressources.
          </p>
        </div>

        <div className="bg-navy/80 p-4 rounded-2xl border border-gold/20 space-y-1.5 text-xs z-10 w-full md:w-auto shrink-0">
          <div className="flex items-center justify-between gap-6 text-foreground-muted font-semibold">
            <span>Abonnements Actifs :</span>
            <span className="text-gold font-bold">{bouquets.length} bouquets</span>
          </div>
          <div className="flex items-center justify-between gap-6 text-foreground-muted font-semibold">
            <span>Statut Institution :</span>
            <span className="text-success font-bold flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-success" /> En règle
            </span>
          </div>
        </div>
      </div>

      {/* Metrics (StatisticsCard12 de 21st.dev) */}
      <StatisticsCard12
        cards={[
          {
            icon: UserCheck,
            value: loading ? "..." : approvedCount,
            label: "Étudiants Affiliés Validés",
            infoText: "Accès actifs validés par votre établissement",
            badgeType: "success"
          },
          {
            icon: Clock,
            value: loading ? "..." : pendingAffiliations.length,
            label: "Demandes d'Affiliation en attente",
            infoText: "À valider ou rejeter par vos services",
            badgeType: "warning"
          },
          {
            icon: TrendingUp,
            value: "51 400 pages",
            label: "Consommations globales",
            infoText: "+14% de consultations ce mois-ci",
            badgeType: "neutral"
          }
        ]}
      />

      {/* Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left: Pending affiliations overview */}
        <div className="lg:col-span-7 bg-background border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <h3 className="font-serif text-base font-bold text-navy">Demandes d'affiliation en attente</h3>
            <Link 
              href="/librarian/affiliations" 
              className="text-xs text-gold hover:text-gold-dark font-bold flex items-center gap-1"
            >
              Traiter les demandes
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="p-6 space-y-4 animate-pulse">
              <div className="h-10 bg-background-secondary rounded" />
              <div className="h-10 bg-background-secondary rounded" />
            </div>
          ) : pendingAffiliations.length === 0 ? (
            <div className="p-10 text-center text-xs text-foreground-muted">
              Aucune demande d'affiliation en attente.
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {pendingAffiliations.slice(0, 3).map((aff) => (
                <div key={aff.id} className="p-5 flex justify-between items-start gap-4 hover:bg-background-secondary/20 transition-colors">
                  <div className="space-y-1">
                    <p className="font-bold text-navy text-sm">{aff.student_name}</p>
                    <p className="text-xs text-foreground-muted">{aff.student_email}</p>
                    <p className="text-[10px] text-foreground-muted font-mono">{aff.student_card_number} — {aff.faculty}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-warning/10 text-warning border border-warning/20 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> En attente
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Bouquet Subscriptions overview */}
        <div className="lg:col-span-5 bg-background border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <h3 className="font-serif text-base font-bold text-navy">Abonnements Bouquets</h3>
            <Link 
              href="/librarian/stats" 
              className="text-xs text-gold hover:text-gold-dark font-bold flex items-center gap-1"
            >
              Statistiques détaillées
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="p-6 space-y-4 animate-pulse">
              <div className="h-12 bg-background-secondary rounded" />
            </div>
          ) : bouquets.length === 0 ? (
            <div className="p-8 text-center text-xs text-foreground-muted">
              Aucun abonnement de bouquet souscrit.
            </div>
          ) : (
            <div className="divide-y divide-border/40 p-2">
              {bouquets.map((bq) => (
                <div key={bq.id} className="p-4 space-y-3 hover:bg-background-secondary/20 transition-colors rounded-lg">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-navy text-xs leading-snug">{bq.name}</h4>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-success/10 text-success border border-success/20">
                      Actif
                    </span>
                  </div>
                  
                  {/* Progress bar of licenses */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-foreground-muted">
                      <span>Licences utilisées</span>
                      <span className="font-semibold">{bq.active_licenses} / {bq.max_licenses}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-border overflow-hidden">
                      <div 
                        className="h-full bg-gold rounded-full" 
                        style={{ width: `${(bq.active_licenses / bq.max_licenses) * 100}%` }}
                      />
                    </div>
                  </div>

                  <p className="text-[9px] text-foreground-muted">
                    Expire le {new Date(bq.end_date).toLocaleDateString("fr-FR")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
