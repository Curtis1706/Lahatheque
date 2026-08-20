"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { ProgressMetricCard } from "@/components/ui/progress-metric-card";
import { getAuthorKpis, getAuthorSubmissions } from "@/lib/services/author";
import type { AuthorKpis, AuthorSubmission } from "@/lib/types/author";
import {
  PenTool,
  BookOpen,
  Eye,
  DollarSign,
  Download,
  PlusCircle,
  ArrowRight,
  Sparkles,
  ChevronRight,
  Clock,
  CheckCircle2,
  FileText,
  CreditCard,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";

// Générateur de timeline dynamique basée sur la date réelle
const getRollingTimeline = (count: number) => {
  const monthNames = ["Janv", "Févr", "Mars", "Avr", "Mai", "Juin", "Juil", "Août", "Sept", "Oct", "Nov", "Déc"];
  const now = new Date();
  const res = [];
  for (let i = 3; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
    res.push({
      date: `${String(d.getDate()).padStart(2, "0")} ${monthNames[d.getMonth()]}`,
      value: i === 0 ? count : Math.max(0, Math.round(count * (0.5 + 0.15 * (3 - i)))),
    });
  }
  return res;
};

export default function AuthorOverviewPage() {
  const { user } = useAuth();
  const [kpis, setKpis] = useState<AuthorKpis | null>(null);
  const [submissions, setSubmissions] = useState<AuthorSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [kData, sData] = await Promise.all([
          getAuthorKpis(),
          getAuthorSubmissions(),
        ]);
        setKpis(kData);
        setSubmissions(sData.slice(0, 3));
      } catch (err) {
        console.error("Erreur de chargement du dashboard auteur", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-navy border border-navy-hover text-white shadow-md">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/20 text-gold text-xs font-bold mb-2 uppercase tracking-wider">
            <PenTool className="w-3.5 h-3.5" />
            {kpis?.authorName || `${user?.first_name || "Auteur"} ${user?.last_name || "LAHA"}`}
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif tracking-tight">
            Espace Auteur — Suivi des Parutions &amp; Droits
          </h1>
          <p className="text-xs sm:text-sm text-navy-light mt-1">
            Consultez le bilan commercial de vos livres publiés, vos droits rétribués et déposez de nouveaux manuscrits pour étude.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/author/submissions/new"
            className="px-4 py-2.5 rounded-xl bg-gold text-navy font-bold text-xs hover:bg-gold-light transition-all flex items-center gap-2 shadow-sm min-h-[44px]"
          >
            <PlusCircle className="w-4 h-4" />
            Nouveau Dépôt de Manuscrit
          </Link>
        </div>
      </div>

      {/* 4 KPI Cards Connectées au Backend */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/author/books" className="block">
          <ProgressMetricCard
            title="Ventes Réalisées"
            total={`${kpis?.totalSales ?? 0} ex.`}
            percent="En hausse"
            trend="up"
            accent="gold"
            delta={`${kpis?.publishedBooksCount ?? 0} livres`}
            deltaLabel="au catalogue"
            data={kpis?.timelines?.sales || getRollingTimeline(kpis?.totalSales ?? 0)}
          />
        </Link>

        <Link href="/author/books" className="block">
          <ProgressMetricCard
            title="Lectures &amp; DRM"
            total={`${kpis?.totalDownloads ?? 0} lectures`}
            percent="Streaming"
            trend="up"
            accent="neutral"
            delta="Filigrane actif"
            deltaLabel="sécurisé"
            data={getRollingTimeline(kpis?.totalDownloads ?? 0)}
          />
        </Link>

        <Link href="/author/royalties" className="block">
          <ProgressMetricCard
            title="Droits d'Auteur en Attente"
            total={`${(kpis?.authorPendingRoyalties ?? 0).toLocaleString("fr-FR")} XOF`}
            percent="À percevoir"
            trend="up"
            accent="emerald"
            delta={kpis?.nextPaymentDate || "05 Septembre"}
            deltaLabel="prochain versement"
            data={kpis?.timelines?.royalties || getRollingTimeline(kpis?.authorPendingRoyalties ?? 0)}
          />
        </Link>

        <Link href="/author/royalties" className="block">
          <ProgressMetricCard
            title="Total Droits Rétribués"
            total={`${(kpis?.authorPaidRoyalties ?? 0).toLocaleString("fr-FR")} XOF`}
            percent="Cumul"
            trend="up"
            accent="emerald"
            delta="Historique"
            deltaLabel="versé à ce jour"
            data={getRollingTimeline(kpis?.authorPaidRoyalties ?? 0)}
          />
        </Link>
      </div>

      {/* 2 Colonnes : Raccourcis & Manuscrits récents */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne Gauche : Raccourcis & Gestion */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-3xl bg-background-secondary border border-border space-y-4 shadow-xs">
            <div className="pb-3 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold font-serif text-navy">Actions &amp; Accès Rapides</h2>
                <p className="text-[11px] text-foreground-muted mt-0.5">Navigation dans votre catalogue et vos relevés</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  label: "Mes Livres Publiés",
                  desc: "Statistiques et ventes par ouvrage",
                  icon: BookOpen,
                  href: "/author/books",
                },
                {
                  label: "Relevés de Redevances",
                  desc: "Historique et demandes de virement",
                  icon: CreditCard,
                  href: "/author/royalties",
                  accent: true,
                },
                {
                  label: "Dépôts de Manuscrits",
                  desc: "Suivi du comité éditorial",
                  icon: FileText,
                  href: "/author/submissions",
                },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between group shadow-xs ${
                    item.accent
                      ? "bg-navy border-navy-hover text-white hover:border-gold"
                      : "bg-background border-border hover:border-gold text-foreground"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`p-2.5 rounded-xl ${
                        item.accent ? "bg-gold/20 text-gold" : "bg-navy-light text-navy"
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${
                        item.accent ? "text-gold" : "text-foreground-muted"
                      }`}
                    />
                  </div>
                  <div>
                    <p className={`font-bold text-xs ${item.accent ? "text-white" : "text-navy"}`}>
                      {item.label}
                    </p>
                    <p className="text-[10px] text-foreground-muted mt-0.5">{item.desc}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Colonne Droite : Derniers Manuscrits Soumis */}
        <div className="p-6 rounded-3xl bg-background-secondary border border-border space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <h3 className="font-serif font-bold text-sm text-navy">Manuscrits Récents</h3>
            <Link href="/author/submissions" className="text-[11px] font-bold text-gold hover:underline">
              Voir tout
            </Link>
          </div>

          <div className="space-y-3">
            {submissions.map((sub) => (
              <Link
                key={sub.id}
                href={`/author/submissions/${sub.id}`}
                className="p-3 rounded-2xl bg-background border border-border hover:border-gold block transition-colors shadow-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-bold text-xs text-navy line-clamp-1">{sub.title}</p>
                  <StatusBadge status={sub.status} />
                </div>
                <p className="text-[10px] text-foreground-muted mt-1 font-mono">
                  Déposé le {sub.submitted_at} • Version {sub.version_type}
                </p>
              </Link>
            ))}

            {submissions.length === 0 && (
              <p className="text-xs text-foreground-muted text-center py-4">Aucun manuscrit en cours.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
