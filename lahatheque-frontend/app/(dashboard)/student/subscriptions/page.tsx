"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, ArrowLeft, CheckCircle2, ShieldCheck, Clock, RefreshCw } from "lucide-react";
import { getClientSubscriptions, cancelClientSubscription } from "@/lib/services/student";
import type { ClientSubscription } from "@/lib/types/student";

export default function StudentSubscriptionsPage() {
  const [subs, setSubs] = useState<ClientSubscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await getClientSubscriptions();
      setSubs(data);
      setLoading(false);
    }
    loadData();
  }, []);

  const handleCancelAutoRenew = async (subId: string) => {
    if (!confirm("Voulez-vous désactiver le renouvellement automatique ? Votre accès restera actif jusqu'à la fin de la période payée.")) return;
    const ok = await cancelClientSubscription(subId);
    if (ok) {
      setSubs((prev) =>
        prev.map((s) => (s.id === subId ? { ...s, auto_renew: false } : s))
      );
      alert("Renouvellement automatique désactivé. Vous conservez votre accès jusqu'à la date d'échéance.");
    }
  };

  const activeSub = subs.find((s) => s.status === "active");

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-8 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/student" className="hover:text-navy">Mon Espace</Link>
        <span>/</span>
        <span className="text-navy font-semibold">Abonnements &amp; Pass</span>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/student" className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Mon Espace
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4 text-gold" />
            Gestion des Pass Lecteur (Section 3.5)
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Mon Abonnement &amp; Formules Pass
          </h1>
          <p className="text-xs text-foreground-muted mt-1">
            Gérez votre abonnement individuel mensuel ou annuel et découvrez les formules d&apos;accès illimité.
          </p>
        </div>
      </div>

      {/* Règle de Résiliation (Section 3.5.3 Cahier des charges) */}
      <div className="p-4 rounded-2xl bg-gold/10 border border-gold/30 text-xs text-navy space-y-1">
        <p className="font-bold flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-gold" />
          Règle d&apos;Échéance Payée (Section 3.5.3) :
        </p>
        <p className="text-foreground-muted leading-relaxed">
          En cas de résiliation ou désactivation du renouvellement automatique, votre accès à la bibliothèque **reste strictement maintenu jusqu&apos;à l&apos;échéance réellement payée**. L&apos;accès n&apos;est jamais coupé immédiatement.
        </p>
      </div>

      {/* Statut de l'Abonnement Actif */}
      {activeSub ? (
        <div className="p-6 rounded-3xl bg-navy text-white border border-navy-hover shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <span className="px-3 py-1 rounded-full bg-gold/20 text-gold text-xs font-bold uppercase tracking-wider">
              Abonnement Individuel Actif
            </span>
            <span className="text-xs font-mono text-gold font-bold">{activeSub.price.toLocaleString("fr-FR")} XOF / mois</span>
          </div>

          <div>
            <h3 className="font-serif font-bold text-xl text-white">{activeSub.name}</h3>
            <p className="text-xs text-navy-light mt-1">Prochain renouvellement prévu le : {activeSub.next_billing_date}</p>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-navy-hover text-xs">
            <span className="flex items-center gap-1.5 text-white/80">
              <RefreshCw className="w-3.5 h-3.5 text-gold" />
              Renouvellement automatique : {activeSub.auto_renew ? "Activé" : "Désactivé (Fin d'accès à l'échéance)"}
            </span>

            {activeSub.auto_renew && (
              <button
                type="button"
                onClick={() => handleCancelAutoRenew(activeSub.id)}
                className="px-4 py-2 rounded-xl bg-navy-dark text-gold font-bold hover:bg-gold hover:text-navy transition-colors border border-gold/30 min-h-[40px]"
              >
                Désactiver le Renouvellement
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="p-6 rounded-3xl bg-background-secondary border border-border text-center space-y-3">
          <p className="font-serif font-bold text-navy text-base">Aucun abonnement individuel actif</p>
          <p className="text-xs text-foreground-muted">Souscrivez à un pass mensuel ou annuel ci-dessous pour débloquer l&apos;accès illimité.</p>
        </div>
      )}

      {/* Formules de Pass Individuels Disponibles */}
      <div className="space-y-4 pt-4 border-t border-border">
        <h3 className="font-serif font-bold text-navy text-lg flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-gold" />
          Formules d&apos;Abonnement Individuel Disponibles
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-3xl bg-background border border-border space-y-4 shadow-xs flex flex-col justify-between">
            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-gold/15 text-gold text-xs font-mono font-bold uppercase">Formule Mensuelle</span>
              <h4 className="font-serif font-bold text-navy text-lg">Pass Lecteur Mensuel</h4>
              <p className="text-xs text-foreground-muted">Accès illimité à l&apos;intégralité du catalogue numérique et audio pendant 30 jours.</p>
            </div>
            <div className="pt-3 border-t border-border flex items-baseline justify-between">
              <span className="font-bold text-navy text-2xl font-mono">4 900 XOF</span>
              <button
                type="button"
                onClick={() => alert("Validation de la souscription au Pass Mensuel...")}
                className="px-5 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors min-h-[40px]"
              >
                Souscrire au Pass
              </button>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-background border border-border space-y-4 shadow-xs flex flex-col justify-between">
            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-mono font-bold uppercase">Formule Annuelle (-20%)</span>
              <h4 className="font-serif font-bold text-navy text-lg">Pass Lecteur Annuel</h4>
              <p className="text-xs text-foreground-muted">12 mois d&apos;accès illimité avec 2 mois offerts et téléchargements LCP DRM inclus.</p>
            </div>
            <div className="pt-3 border-t border-border flex items-baseline justify-between">
              <span className="font-bold text-navy text-2xl font-mono">45 000 XOF</span>
              <button
                type="button"
                onClick={() => alert("Validation de la souscription au Pass Annuel...")}
                className="px-5 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors min-h-[40px]"
              >
                Souscrire à l&apos;Année
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
