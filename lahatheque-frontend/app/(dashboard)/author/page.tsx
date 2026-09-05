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
  ShoppingBag,
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

      {/* Bannière Avantage Tarif Auteur */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gold/10 border border-gold/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-gold text-navy shrink-0 shadow-2xs">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-navy text-white uppercase tracking-wider">
                Avantage Partenaire Auteur
              </span>
              <span className="text-xs font-bold text-gold font-mono">
                -40% Papier &bull; -25% Numérique
              </span>
            </div>
            <h2 className="font-serif font-bold text-base sm:text-lg text-navy">
              Tarif Préférentiel Auteur &ndash; Réduction Exclusive sur vos Ouvrages
            </h2>
            <p className="text-xs text-foreground-muted">
              Commandez vos exemplaires imprimés pour vos séances de dédicaces, cours ou proches avec une réduction automatique configurée par l&apos;administration.
            </p>
          </div>
        </div>

        <Link
          href="/author/catalog"
          className="px-5 py-2.5 rounded-xl bg-navy text-white font-bold text-xs hover:bg-navy-hover transition-colors inline-flex items-center gap-2 shadow-xs shrink-0 self-start sm:self-auto min-h-[44px]"
        >
          <span>Commander mes livres (-40%)</span>
          <ArrowRight className="w-3.5 h-3.5 text-gold" />
        </Link>
      </div>

      {/* 3 KPI Cards Principaux Connectés au Backend */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Ventes Réalisées */}
        <Link href="/author/books" className="block">
          <ProgressMetricCard
            title="Ventes Réalisées"
            total={`${(kpis?.totalSales ?? 0).toLocaleString("fr-FR")} ex.`}
            percent="En hausse"
            trend="up"
            accent="emerald"
            delta={`${kpis?.publishedBooksCount ?? 0} ouvrages`}
            deltaLabel="au catalogue"
            data={kpis?.timelines?.sales || getRollingTimeline(kpis?.totalSales ?? 0)}
          />
        </Link>

        {/* Droits d'Auteur en Attente */}
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

        {/* Total Droits Rétribués */}
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

      {/* Synthèse Logistique des Stocks & Tirages Papier */}
      {kpis && (
        <div className="p-5 sm:p-6 rounded-3xl bg-background-secondary border border-border space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-navy-light text-navy">
                <BookOpen className="w-4 h-4 text-gold" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold font-serif text-navy">
                  Suivi des Stocks &amp; Tirages Papier
                </h2>
                <p className="text-[11px] text-foreground-muted mt-0.5">
                  Situation en temps réel de vos tirages physiques dans le réseau de distribution LAHA
                </p>
              </div>
            </div>
            <Link
              href="/author/books"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-navy hover:text-gold transition-colors"
            >
              <span>Voir le stock par ouvrage</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-foreground-muted">
                Taux d&apos;écoulement du tirage physique :
              </span>
              <span className="font-mono font-bold text-navy">
                {kpis.stockInitial && kpis.stockInitial > 0
                  ? `${Math.min(100, Math.round(((kpis.stockInitial - (kpis.stockRemaining ?? 0)) / kpis.stockInitial) * 100))}% écoulé`
                  : "0% écoulé"}
              </span>
            </div>

            {/* Barre de progression visuelle */}
            <div className="w-full h-3 bg-background rounded-full overflow-hidden border border-border">
              <div
                className="h-full bg-gold rounded-full transition-all duration-500"
                style={{
                  width: `${
                    kpis.stockInitial && kpis.stockInitial > 0
                      ? Math.min(
                          100,
                          Math.max(
                            0,
                            Math.round(
                              ((kpis.stockInitial - (kpis.stockRemaining ?? 0)) /
                                kpis.stockInitial) *
                                100
                            )
                          )
                        )
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="p-3.5 rounded-2xl bg-background border border-border space-y-1">
              <span className="text-[10px] text-foreground-muted uppercase tracking-wider font-bold block">
                Stock Initial (Tirage Global)
              </span>
              <p className="font-mono text-lg font-bold text-navy">
                {(kpis.stockInitial ?? 0).toLocaleString("fr-FR")}{" "}
                <span className="text-xs font-sans text-foreground-muted">ex.</span>
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-background border border-border space-y-1">
              <span className="text-[10px] text-foreground-muted uppercase tracking-wider font-bold block">
                Exemplaires Papier Écoulés
              </span>
              <p className="font-mono text-lg font-bold text-emerald-600">
                {Math.max(0, (kpis.stockInitial ?? 0) - (kpis.stockRemaining ?? 0)).toLocaleString("fr-FR")}{" "}
                <span className="text-xs font-sans text-foreground-muted">ex.</span>
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-navy-light border border-navy-hover/20 space-y-1">
              <span className="text-[10px] text-navy uppercase tracking-wider font-bold block">
                Stock Restant Disponible
              </span>
              <p className="font-mono text-lg font-bold text-navy">
                {(kpis.stockRemaining ?? 0).toLocaleString("fr-FR")}{" "}
                <span className="text-xs font-sans text-gold">ex.</span>
              </p>
            </div>
          </div>
        </div>
      )}

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
                  label: "Commander mes Livres",
                  desc: "Tarif préférentiel (-40% papier, -25% numérique)",
                  icon: ShoppingBag,
                  href: "/author/catalog",
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
