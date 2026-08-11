"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Building2, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  BookOpen, 
  ArrowRight, 
  Calendar,
  CreditCard,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Clock,
  CheckCircle2
} from "lucide-react";
import { fetchStudentSubscriptionState, cancelStudentSubscription } from "@/lib/services/student-subscriptions";
import { SubscriptionApiResponse, BillingFrequency, StudentSubscription } from "@/lib/types/student-subscriptions";
import { SubscriptionCancelModal } from "@/components/student/subscriptions/SubscriptionCancelModal";
import { StudentKpiCharts } from "@/components/features/student/student-kpi-charts";
import { fetchStudentStudyStats } from "@/lib/services/student";
import { StudentStudyStats } from "@/lib/types/student";

export default function StudentSubscriptionsPage() {
  const [subData, setSubData] = useState<SubscriptionApiResponse | null>(null);
  const [stats, setStats] = useState<StudentStudyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [billingFreq, setBillingFreq] = useState<BillingFrequency>("annual");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    async function loadSubData() {
      setLoading(true);
      const [data, statsData] = await Promise.all([
        fetchStudentSubscriptionState(),
        fetchStudentStudyStats()
      ]);
      setSubData(data);
      setStats(statsData);
      setLoading(false);
    }
    loadSubData();
  }, []);

  const handleConfirmCancel = async () => {
    if (!subData?.active_subscription) return;
    setIsCancelling(true);
    const res = await cancelStudentSubscription(subData.active_subscription.id);
    if (res.success) {
      setSubData((prev) => prev ? {
        ...prev,
        active_subscription: prev.active_subscription ? {
          ...prev.active_subscription,
          auto_renew: false
        } : null
      } : null);
    }
    setIsCancelling(false);
    setIsCancelModalOpen(false);
  };

  const faqItems = [
    {
      q: "Comment fonctionne l'accès institutionnel offert par mon Université ?",
      a: "Si votre établissement (ex: UAC, UNA) dispose d'une convention active avec LAHA Éditions, votre affiliation étudiant validée débloque automatiquement l'accès intégral au bouquet académique sans aucun frais individuel."
    },
    {
      q: "Puis-je lire mes manuels hors-ligne sur la liseuse ?",
      a: "Oui. Votre abonnement actif vous permet d'enregistrer des exemplaires chiffrés sur l'application mobile et de poursuivre votre étude même sans connexion Internet."
    },
    {
      q: "Que se passe-t-il lorsque mon abonnement arrive à échéance ?",
      a: "À l'échéance, la lecture intégrale des ouvrages sous abonnement est suspendue. Cependant, toutes vos fiches de révision, surlignages et notes personnelles restent conservées dans votre espace."
    },
    {
      q: "Est-il possible de résilier le renouvellement automatique à tout moment ?",
      a: "Absolument. Vous pouvez désactiver le renouvellement automatique d'un seul clic. Vos accès resteront totalement actifs jusqu'à la fin de la période déjà réglée."
    }
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* 1. KPIS ET VISUALISATIONS DE DONNÉES 21st.dev EN PREMIER */}
      {!loading && stats ? (
        <StudentKpiCharts stats={stats} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="bg-background border border-border p-5 rounded-2xl animate-pulse space-y-3 h-40" />
          ))}
        </div>
      )}
      
      {/* En-tête de section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4 text-gold" />
            Accès & Bouquets Documentaires
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Gestion d'Abonnement Étudiant
          </h1>
          <p className="text-xs text-foreground-muted mt-1">
            Gérez vos pass de lecture intégrale, votre accès institutionnel université et vos options de renouvellement.
          </p>
        </div>
      </div>

      {/* Skeletons de chargement */}
      {loading ? (
        <div className="space-y-6 animate-pulse">
          <div className="h-40 bg-background-secondary rounded-3xl w-full" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-64 bg-background-secondary rounded-3xl" />
            <div className="h-64 bg-background-secondary rounded-3xl" />
            <div className="h-64 bg-background-secondary rounded-3xl" />
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* Bannière Accès Institutionnel UAC / UNA */}
          {subData?.has_active_institutional_access && (
            <div className="bg-navy text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-gold/40 relative overflow-hidden">
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2 max-w-2xl">
                  <div className="flex items-center gap-2 text-gold text-xs font-bold uppercase tracking-widest">
                    <Building2 className="w-4 h-4" />
                    Accès Institutionnel Actif
                  </div>
                  <h2 className="font-serif text-xl sm:text-2xl font-bold text-white">
                    Pass Académique offert par {subData.institution_name || "votre Université"}
                  </h2>
                  <p className="text-xs text-white/80 leading-relaxed">
                    Votre affiliation étudiant a été certifiée par l'établissement. Vous bénéficiez de l'accès illimité à l'ensemble du fonds documentaire souscrit par votre université sans aucuns frais d'inscription personnels.
                  </p>
                </div>
                <Link
                  href="/student/catalog"
                  className="px-5 py-3.5 rounded-xl bg-gold hover:bg-gold-hover text-navy font-bold text-xs shrink-0 shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <BookOpen className="w-4 h-4" />
                  Accéder aux Ouvrages Offerts
                </Link>
              </div>
            </div>
          )}

          {/* Carte d'Abonnement Individuel Actif */}
          {subData?.active_subscription && (
            <div className="bg-background border border-border rounded-3xl p-6 space-y-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold text-navy bg-gold/20 px-2.5 py-0.5 rounded-md border border-gold/30">
                      Abonnement Individuel
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-success/10 text-success border border-success/30 font-bold text-[10px] uppercase">
                      Actif
                    </span>
                  </div>
                  <h3 className="font-serif text-xl font-bold text-navy">{subData.active_subscription.plan.name}</h3>
                </div>

                <div className="text-left sm:text-right">
                  <span className="font-serif font-bold text-gold-dark text-xl">
                    {(typeof subData.active_subscription.plan.price_amount === "string" 
                      ? parseFloat(subData.active_subscription.plan.price_amount) 
                      : subData.active_subscription.plan.price_amount).toLocaleString("fr-FR")} FCFA
                  </span>
                  <span className="text-xs text-foreground-muted block">
                    / {subData.active_subscription.plan.duration_days} jours
                  </span>
                </div>
              </div>

              {/* Jauge de validité & dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="bg-background-secondary p-4 rounded-2xl border border-border space-y-1">
                  <span className="text-foreground-muted text-[11px] block">Début d'engagement :</span>
                  <span className="font-bold text-navy flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-navy shrink-0" />
                    {new Date(subData.active_subscription.starts_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                </div>

                <div className="bg-background-secondary p-4 rounded-2xl border border-border space-y-1">
                  <span className="text-foreground-muted text-[11px] block">Date d'échéance :</span>
                  <span className="font-bold text-navy flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-gold-dark shrink-0" />
                    {new Date(subData.active_subscription.expires_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                </div>
              </div>

              {/* Renouvellement auto & Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-border text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                  <span className="text-foreground-muted">
                    Renouvellement automatique :{" "}
                    <span className="font-bold text-navy">
                      {subData.active_subscription.auto_renew ? "Activé" : "Désactivé (Prendra fin à l'échéance)"}
                    </span>
                  </span>
                </div>

                {subData.active_subscription.auto_renew && (
                  <button
                    onClick={() => setIsCancelModalOpen(true)}
                    className="px-4 py-2 rounded-xl border border-error/30 bg-error/5 hover:bg-error/10 text-error font-bold text-xs transition-colors self-start sm:self-auto"
                  >
                    Désactiver le renouvellement
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Selector Fréquence Tarifaire (Mensuel vs Annuel selon CDC Section 8) */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-serif text-xl font-bold text-navy">Découvrir les Formules d'Abonnement</h3>
                <p className="text-xs text-foreground-muted">Sélectionnez la durée qui correspond à vos besoins académiques.</p>
              </div>

              {/* Switcher Mensuel / Annuel */}
              <div className="flex items-center bg-background-secondary border border-border p-1 rounded-xl shrink-0 self-start sm:self-auto">
                <button
                  onClick={() => setBillingFreq("monthly")}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    billingFreq === "monthly" ? "bg-navy text-white shadow-sm" : "text-foreground-muted hover:text-navy"
                  }`}
                >
                  Mensuel (30 Jours)
                </button>
                <button
                  onClick={() => setBillingFreq("annual")}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    billingFreq === "annual" ? "bg-navy text-white shadow-sm" : "text-foreground-muted hover:text-navy"
                  }`}
                >
                  <span>Annuel (365 Jours)</span>
                  <span className="bg-gold text-navy text-[9px] px-1.5 py-0.5 rounded uppercase font-bold">
                    Économisez 50%
                  </span>
                </button>
              </div>
            </div>

            {/* Grille des Offres */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Offre Mensuelle */}
              <div className={`bg-background border-2 rounded-3xl p-6 flex flex-col justify-between space-y-6 transition-all ${
                billingFreq === "monthly" ? "border-navy shadow-md" : "border-border opacity-80 hover:opacity-100"
              }`}>
                <div className="space-y-4">
                  <span className="text-[10px] uppercase font-bold text-navy bg-navy/10 px-2.5 py-1 rounded-md border border-navy/20">
                    Étudiant Mensuel
                  </span>
                  <h4 className="font-serif text-lg font-bold text-navy">Pass Révisions 30 Jours</h4>
                  <div className="flex items-baseline gap-1">
                    <span className="font-serif text-3xl font-bold text-navy">2.500</span>
                    <span className="text-xs font-bold text-gold-dark">FCFA / mois</span>
                  </div>
                  <ul className="space-y-2 text-xs text-foreground/90 pt-2 border-t border-border">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-success shrink-0" />
                      <span>Lecture intégrale sur liseuse</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-success shrink-0" />
                      <span>Annotations et extraits sauvegardés</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-success shrink-0" />
                      <span>Streaming audio inclus</span>
                    </li>
                  </ul>
                </div>
                <Link
                  href="/cart"
                  className="w-full py-3 rounded-xl bg-navy hover:bg-navy-hover text-white text-xs font-bold text-center transition-colors shadow flex items-center justify-center gap-2"
                >
                  Souscrire l'offre Mensuelle
                  <ArrowRight className="w-4 h-4 text-gold" />
                </Link>
              </div>

              {/* Offre Annuelle (Mise en avant) */}
              <div className={`bg-background border-2 rounded-3xl p-6 flex flex-col justify-between space-y-6 transition-all relative ${
                billingFreq === "annual" ? "border-gold shadow-lg" : "border-border"
              }`}>
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gold text-navy font-bold text-[10px] uppercase tracking-wider px-3.5 py-1 rounded-full shadow">
                  Offre la plus avantageuse
                </div>
                <div className="space-y-4">
                  <span className="text-[10px] uppercase font-bold text-navy bg-gold/20 px-2.5 py-1 rounded-md border border-gold/30">
                    Étudiant Annuel
                  </span>
                  <h4 className="font-serif text-lg font-bold text-navy">Pass Annuel Universitaire</h4>
                  <div className="flex items-baseline gap-1">
                    <span className="font-serif text-3xl font-bold text-navy">15.000</span>
                    <span className="text-xs font-bold text-gold-dark">FCFA / an</span>
                  </div>
                  <ul className="space-y-2 text-xs text-foreground/90 pt-2 border-t border-border">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-success shrink-0" />
                      <span>365 jours d'accès illimité au catalogue</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-success shrink-0" />
                      <span>Économisez 50% par rapport à l'offre mensuelle</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-success shrink-0" />
                      <span>Exportation des fiches de lecture en PDF</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-success shrink-0" />
                      <span>Priorité sur les nouvelles parutions</span>
                    </li>
                  </ul>
                </div>
                <Link
                  href="/cart"
                  className="w-full py-3 rounded-xl bg-gold hover:bg-gold-hover text-navy text-xs font-bold text-center transition-colors shadow-md flex items-center justify-center gap-2"
                >
                  Choisir l'offre Annuelle
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Bouquet Université */}
              <div className="bg-background border-2 border-border rounded-3xl p-6 flex flex-col justify-between space-y-6 transition-all">
                <div className="space-y-4">
                  <span className="text-[10px] uppercase font-bold text-navy bg-navy/10 px-2.5 py-1 rounded-md border border-navy/20">
                    Université / Faculté
                  </span>
                  <h4 className="font-serif text-lg font-bold text-navy">Bouquet Institutionnel</h4>
                  <div className="flex items-baseline gap-1">
                    <span className="font-serif text-2xl font-bold text-navy">Gratuit</span>
                    <span className="text-xs font-bold text-foreground-muted">/ étudiant affilié</span>
                  </div>
                  <ul className="space-y-2 text-xs text-foreground/90 pt-2 border-t border-border">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-success shrink-0" />
                      <span>Pris en charge par votre faculté</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-success shrink-0" />
                      <span>Validation immédiate via carte d'étudiant</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-success shrink-0" />
                      <span>Consultation illimitée en bibliothèque</span>
                    </li>
                  </ul>
                </div>
                <Link
                  href="/contact"
                  className="w-full py-3 rounded-xl border border-border bg-background-secondary hover:bg-background text-navy text-xs font-bold text-center transition-colors flex items-center justify-center gap-2"
                >
                  Contacter le support université
                </Link>
              </div>

            </div>
          </div>

          {/* FAQ Accordéon Étudiant */}
          <div className="space-y-4 pt-4 border-t border-border">
            <div className="flex items-center gap-2 text-navy">
              <HelpCircle className="w-5 h-5 text-gold shrink-0" />
              <h3 className="font-serif text-lg font-bold">Foire aux questions de l'étudiant</h3>
            </div>

            <div className="space-y-3">
              {faqItems.map((item, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div key={idx} className="border border-border rounded-2xl bg-background overflow-hidden transition-all">
                    <button
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      className="w-full p-4 text-left flex items-center justify-between gap-4 hover:bg-background-secondary transition-colors"
                    >
                      <span className="font-bold text-xs text-navy">{item.q}</span>
                      {isOpen ? <ChevronUp className="w-4 h-4 text-gold shrink-0" /> : <ChevronDown className="w-4 h-4 text-gold shrink-0" />}
                    </button>
                    {isOpen && (
                      <div className="p-4 pt-0 text-xs text-foreground-muted border-t border-border/40 leading-relaxed bg-background-secondary/50">
                        {item.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* Modale de confirmation de résiliation */}
      {subData?.active_subscription && (
        <SubscriptionCancelModal
          subscriptionName={subData.active_subscription.plan.name}
          expiresAt={subData.active_subscription.expires_at}
          isOpen={isCancelModalOpen}
          onClose={() => setIsCancelModalOpen(false)}
          onConfirmCancel={handleConfirmCancel}
          isSubmitting={isCancelling}
        />
      )}

    </div>
  );
}
