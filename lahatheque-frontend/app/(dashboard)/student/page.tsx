"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { getClientOverviewKpis } from "@/lib/services/student";
import type { ClientOverviewKpis } from "@/lib/types/student";
import {
  BookOpen,
  Search,
  Sparkles,
  ArrowRight,
  PackageCheck,
  ChevronRight,
  GraduationCap,
  Play,
  Eye,
  ShieldCheck,
  Building2,
} from "lucide-react";

export default function StudentOverviewPage() {
  const { user } = useAuth();
  const [kpis, setKpis] = useState<ClientOverviewKpis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await getClientOverviewKpis();
        setKpis(data);
      } catch (err) {
        console.error("Erreur de chargement du dashboard client", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const currentBook = kpis?.currentReadingBook;

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 sm:space-y-8">
      {/* Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-navy border border-navy-hover text-white shadow-md">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/20 text-gold text-xs font-bold mb-2 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            Mon Espace Client &amp; Lecteur
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif tracking-tight">
            Bienvenue sur LAHAThèque, {user?.first_name || "Cher Lecteur"} 👋
          </h1>
          <p className="text-xs sm:text-sm text-navy-light mt-1">
            Reprenez votre lecture en ligne, écoutez vos livres audio et explorez le catalogue numérique.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/student/catalog"
            className="px-4 py-2.5 rounded-xl bg-gold text-navy font-bold text-xs hover:bg-gold-light transition-all flex items-center gap-2 shadow-sm min-h-[44px]"
          >
            <Search className="w-4 h-4" />
            Explorer le Catalogue
          </Link>
        </div>
      </div>

      {/* Bloc Reprise de Lecture Instantanée */}
      {currentBook && (
        <div className="p-6 rounded-3xl bg-background border border-gold shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-16 h-20 rounded-2xl bg-navy overflow-hidden shrink-0 shadow-sm border border-border">
              {currentBook.cover_url ? (
                <img src={currentBook.cover_url} alt={currentBook.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white font-serif font-bold text-lg">
                  {currentBook.title.slice(0, 1)}
                </div>
              )}
            </div>

            <div className="min-w-0 space-y-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gold/15 text-gold text-[10px] font-mono font-bold uppercase">
                Reprise de Lecture ({currentBook.progress_percent}%)
              </span>
              <h3 className="font-serif font-bold text-navy text-lg truncate">{currentBook.title}</h3>
              <p className="text-xs text-foreground-muted truncate">Par {currentBook.author}</p>
              {currentBook.last_read_chapter && (
                <p className="text-xs text-navy font-semibold truncate pt-0.5">{currentBook.last_read_chapter}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href={`/catalog/reader/${currentBook.id}`}
              className="px-6 py-3 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors inline-flex items-center gap-2 min-h-[44px] shadow-xs"
            >
              <Play className="w-4 h-4 text-gold fill-gold" />
              Reprendre la Lecture ({currentBook.progress_percent}%)
            </Link>
          </div>
        </div>
      )}

      {/* Synthèse 3 Cartes (Bibliothèque, Abonnement, Affiliation Universitaire Optionnelle) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/student/books" className="block">
          <div className="p-5 rounded-3xl bg-background border border-border hover:border-gold transition-all space-y-2 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-navy uppercase tracking-wider">Ma Bibliothèque</span>
              <div className="p-2 rounded-xl bg-gold/15 text-gold"><BookOpen className="w-4 h-4" /></div>
            </div>
            <p className="font-serif font-bold text-2xl text-navy">{kpis?.totalBooksInLibrary || 4} ouvrages</p>
            <p className="text-[11px] text-foreground-muted">Accès illimité ou achetés à l&apos;unité</p>
          </div>
        </Link>

        <Link href="/student/subscriptions" className="block">
          <div className="p-5 rounded-3xl bg-background border border-border hover:border-gold transition-all space-y-2 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-navy uppercase tracking-wider">Mon Abonnement / Pass</span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600"><Sparkles className="w-4 h-4" /></div>
            </div>
            <p className="font-serif font-bold text-lg text-emerald-600 truncate">{kpis?.activeSubscriptionStatus || "Pass Illimité"}</p>
            <p className="text-[11px] text-foreground-muted">Abonnement actif</p>
          </div>
        </Link>

        <Link href="/student/profile" className="block">
          <div className="p-5 rounded-3xl bg-background border border-border hover:border-gold transition-all space-y-2 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-navy uppercase tracking-wider">Affiliation Université</span>
              <div className="p-2 rounded-xl bg-navy-light text-navy"><Building2 className="w-4 h-4" /></div>
            </div>
            <p className="font-serif font-bold text-sm text-navy truncate">
              {kpis?.hasUniversityAffiliation ? kpis.institutionName : "Aucune (Optionnel)"}
            </p>
            <p className="text-[11px] text-foreground-muted">
              {kpis?.hasUniversityAffiliation ? "Bouquet institutionnel débloqué" : "Rattacher mon établissement"}
            </p>
          </div>
        </Link>
      </div>

      {/* Raccourcis d'Action */}
      <div className="p-6 rounded-3xl bg-background-secondary border border-border space-y-4 shadow-xs">
        <div className="pb-3 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold font-serif text-navy">Services &amp; Actions Rapides</h2>
            <p className="text-[11px] text-foreground-muted mt-0.5">Accédez directement à vos livres, commandes papier et abonnements</p>
          </div>
          <Link href="/student/catalog" className="text-xs font-bold text-gold hover:text-gold-dark flex items-center gap-1">
            Voir tout le catalogue <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              label: "Ma Bibliothèque de Livres",
              desc: "Accédez à tous vos titres en EPUB, PDF et Audio",
              icon: BookOpen,
              href: "/student/books",
              primary: true,
            },
            {
              label: "Recherche & Découverte",
              desc: "Rechercher des ouvrages et lire des extraits",
              icon: Search,
              href: "/student/catalog",
            },
            {
              label: "Commandes Papier Physiques",
              desc: "Suivi des achats d'exemplaires papier",
              icon: PackageCheck,
              href: "/student/orders",
            },
            {
              label: "Abonnements & Pass",
              desc: "Gérer votre pass mensuel/annuel",
              icon: Sparkles,
              href: "/student/subscriptions",
            },
            {
              label: "Affiliation Universitaire",
              desc: "Rattacher votre compte à votre université",
              icon: GraduationCap,
              href: "/student/profile",
            },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`p-4 rounded-2xl border transition-all flex items-center justify-between group shadow-xs ${
                item.primary
                  ? "bg-navy border-navy-hover text-white hover:border-gold"
                  : "bg-background border-border hover:border-gold text-foreground"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`p-2.5 rounded-xl shrink-0 ${
                    item.primary ? "bg-gold/20 text-gold" : "bg-navy-light text-navy"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className={`font-bold text-xs truncate ${item.primary ? "text-white" : "text-navy"}`}>
                    {item.label}
                  </p>
                  <p className="text-[10px] text-foreground-muted truncate">{item.desc}</p>
                </div>
              </div>
              <ChevronRight
                className={`w-4 h-4 shrink-0 transition-colors ${
                  item.primary ? "text-gold" : "text-foreground-muted group-hover:text-gold"
                }`}
              />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
