"use client";

import { useEffect, useState } from "react";
import { getAuthorSubmissions, getRoyaltyStatements } from "@/lib/services/author";
import { AuthorSubmission, RoyaltyStatement } from "@/lib/types/author";
import { 
  FileText, 
  TrendingUp, 
  Download, 
  DollarSign, 
  BookOpen, 
  Clock, 
  CheckCircle, 
  ArrowRight,
  User,
  Calendar,
  XCircle
} from "lucide-react";
import Link from "next/link";
import { KpiGrid, type KpiCardProps } from "@/components/ui/kpi-card";

export default function AuthorDashboardPage() {
  const [submissions, setSubmissions] = useState<AuthorSubmission[]>([]);
  const [statements, setStatements] = useState<RoyaltyStatement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [subData, stmtData] = await Promise.all([
          getAuthorSubmissions(),
          getRoyaltyStatements()
        ]);
        setSubmissions(subData);
        setStatements(stmtData);
      } catch (err) {
        console.error("Erreur de chargement des données auteur", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const totalVentes = statements.reduce((sum, s) => sum + s.sales_count, 0);
  const totalGains = statements.reduce((sum, s) => sum + s.amount, 0);

  const getStatusBadge = (status: AuthorSubmission["status"]) => {
    switch (status) {
      case "approved":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-success/10 text-success border border-success/20">
            <CheckCircle className="w-2.5 h-2.5" /> Approuvé
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-warning/10 text-warning border border-warning/20">
            <Clock className="w-2.5 h-2.5" /> Soumis
          </span>
        );
      case "under_review":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-warning/10 text-warning border border-warning/20">
            <Clock className="w-2.5 h-2.5" /> En relecture
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-error/10 text-error border border-error/20">
            <XCircle className="w-2.5 h-2.5" /> Refusé
          </span>
        );
      case "draft":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-background-secondary text-foreground-muted border border-border">
            Brouillon
          </span>
        );
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-8">
      
      {/* Header Banner */}
      <div className="bg-navy-dark text-white rounded-3xl p-6 sm:p-8 border border-navy/30 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-navy text-gold text-xs font-bold uppercase tracking-wider border border-gold/20">
            <User className="w-3.5 h-3.5" />
            Espace Auteur
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold">
            Marc-Aurèle DE SOUZA
          </h1>
          <p className="text-xs sm:text-sm text-white/80 max-w-xl">
            Suivez le succès de vos livres publiés, consultez vos redevances et déposez de nouveaux manuscrits pour étude.
          </p>
        </div>

        <div className="bg-navy/80 p-4 rounded-2xl border border-gold/20 space-y-1.5 text-xs z-10 w-full md:w-auto shrink-0">
          <div className="flex items-center justify-between gap-6 text-foreground-muted font-semibold">
            <span>Solde Disponible :</span>
            <span className="text-gold font-bold">{totalGains.toLocaleString()} FCFA</span>
          </div>
          <div className="flex items-center justify-between gap-6 text-foreground-muted font-semibold">
            <span>Ouvrages Publiés :</span>
            <span className="text-success font-bold">2 livres</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="bg-background border border-border p-5 rounded-2xl animate-pulse space-y-3 h-36">
              <div className="w-10 h-10 rounded-xl bg-background-secondary" />
              <div className="h-7 w-20 bg-background-secondary rounded" />
              <div className="h-3.5 w-32 bg-background-secondary rounded" />
            </div>
          ))}
        </div>
      ) : (
        <KpiGrid
          cols={3}
          cards={[
            {
              label: "Ventes cumulées",
              value: totalVentes,
              formatValue: (v) => `${v} ex.`,
              icon: TrendingUp,
              trend: 18,
              sparkline: [25, 40, 35, 55, 50, 70, 65],
            },
            {
              label: "Lectures & Téléchargements",
              value: 550,
              icon: Download,
              trend: 12,
              sparkline: [30, 45, 50, 60, 55, 75, 80],
            },
            {
              label: "Redevances accumulées",
              value: totalGains,
              formatValue: (v) => `${v.toLocaleString("fr-FR")} FCFA`,
              icon: DollarSign,
              trend: 9,
              sparkline: [40, 50, 45, 65, 60, 75, 70],
            },
          ] satisfies KpiCardProps[]}
        />
      )}

      {/* Grid: Submissions & Royalties Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left: Submissions overview */}
        <div className="lg:col-span-7 bg-background border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <h3 className="font-serif text-base font-bold text-navy">Vos manuscrits et dépôts récents</h3>
            <Link 
              href="/author/submissions" 
              className="text-xs text-gold hover:text-gold-dark font-bold flex items-center gap-1"
            >
              Nouveau dépôt
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="p-6 space-y-4 animate-pulse">
              <div className="h-10 bg-background-secondary rounded" />
              <div className="h-10 bg-background-secondary rounded" />
            </div>
          ) : submissions.length === 0 ? (
            <div className="p-10 text-center text-xs text-foreground-muted">
              Aucun manuscrit soumis.
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {submissions.slice(0, 3).map((sub) => (
                <div key={sub.id} className="p-5 flex justify-between items-start gap-4 hover:bg-background-secondary/20 transition-colors">
                  <div className="space-y-1">
                    <p className="font-bold text-navy text-sm leading-snug">{sub.title}</p>
                    <p className="text-[10px] text-foreground-muted">{sub.discipline} — Fichier : {sub.file_name}</p>
                  </div>
                  {getStatusBadge(sub.status)}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Royalty Statements overview */}
        <div className="lg:col-span-5 bg-background border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <h3 className="font-serif text-base font-bold text-navy">Relevés de droits récents</h3>
            <Link 
              href="/author/royalties" 
              className="text-xs text-gold hover:text-gold-dark font-bold flex items-center gap-1"
            >
              Détails des gains
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="p-6 space-y-4 animate-pulse">
              <div className="h-10 bg-background-secondary rounded" />
            </div>
          ) : statements.length === 0 ? (
            <div className="p-8 text-center text-xs text-foreground-muted">
              Aucun relevé disponible.
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {statements.slice(0, 3).map((stmt) => (
                <div key={stmt.id} className="p-4 space-y-2 hover:bg-background-secondary/20 transition-colors">
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-bold text-navy text-xs truncate max-w-[200px]">{stmt.book_title}</p>
                    <span className="font-bold text-navy text-xs shrink-0">+{stmt.amount.toLocaleString()} FCFA</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-foreground-muted">
                    <span>Période : {stmt.statement_period}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                      stmt.status === "paid" 
                        ? "bg-success/10 text-success border border-success/20" 
                        : "bg-warning/10 text-warning border border-warning/20"
                    }`}>
                      {stmt.status === "paid" ? "Payé" : "En cours"}
                    </span>
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
