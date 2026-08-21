"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, GraduationCap, ShoppingCart, Sparkles, ShieldCheck } from "lucide-react";

export default function StudentAccessInfoPage() {
  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-8 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/student" className="hover:text-navy">Mon Espace</Link>
        <span>/</span>
        <span className="text-navy font-semibold">Modes d&apos;Accès &amp; Bouquets</span>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/student" className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Retour à l&apos;accueil
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4 text-gold" />
            Accès aux Ouvrages LAHAThèque
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Comment Accéder aux Livres et Ressources ?
          </h1>
          <p className="text-xs text-foreground-muted mt-1">
            Découvrez les différents moyens d&apos;accès à votre bibliothèque numérique et vos commandes physiques.
          </p>
        </div>
      </div>

      {/* 3 Cartes de Modes d'accès */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. Université & Bouquets Campus */}
        <div className="p-6 rounded-3xl bg-background border border-border flex flex-col justify-between space-y-6 shadow-xs">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-gold/15 text-gold flex items-center justify-center">
              <GraduationCap className="w-6 h-6" />
            </div>
            <span className="px-3 py-1 rounded-full bg-gold/15 text-gold text-xs font-mono font-bold uppercase inline-block">
              Accès Institutionnel
            </span>
            <h2 className="font-serif font-bold text-navy text-lg">
              Bouquets Campus Université
            </h2>
            <p className="text-xs text-foreground-muted leading-relaxed">
              Si votre établissement supérieur est partenaire de LAHAThèque, vous pouvez débloquer l&apos;accès gratuit et illimité à tous les bouquets documentaires de votre faculté en renseignant votre numéro de matricule académique.
            </p>
          </div>

          <div className="pt-4 border-t border-border">
            <Link
              href="/student/university"
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors min-h-[44px]"
            >
              <GraduationCap className="w-4 h-4 text-gold" />
              Associer mon Université
            </Link>
          </div>
        </div>

        {/* 2. Achats Unitaires Numériques & Papier */}
        <div className="p-6 rounded-3xl bg-background border border-border flex flex-col justify-between space-y-6 shadow-xs">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-navy/10 text-navy flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-navy" />
            </div>
            <span className="px-3 py-1 rounded-full bg-navy/10 text-navy text-xs font-mono font-bold uppercase inline-block">
              Achat à l&apos;Unité
            </span>
            <h2 className="font-serif font-bold text-navy text-lg">
              Numérique &amp; Exemplaire Papier
            </h2>
            <p className="text-xs text-foreground-muted leading-relaxed">
              Achetez directement les manuels, traités ou ouvrages dont vous avez besoin. L&apos;accès numérique (EPUB/PDF avec synthèse vocale TTS intégrée) est instantané à vie. Vous pouvez également commander l&apos;exemplaire imprimé livré chez vous.
            </p>
          </div>

          <div className="pt-4 border-t border-border">
            <Link
              href="/student/catalog"
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors min-h-[44px]"
            >
              <BookOpen className="w-4 h-4 text-gold" />
              Explorer le Catalogue
            </Link>
          </div>
        </div>

        {/* 3. Domaine Public & Extraits Gratuits */}
        <div className="p-6 rounded-3xl bg-background border border-border flex flex-col justify-between space-y-6 shadow-xs">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-mono font-bold uppercase inline-block">
              Accès Libre &amp; Découverte
            </span>
            <h2 className="font-serif font-bold text-navy text-lg">
              Extraits &amp; Livres Libres
            </h2>
            <p className="text-xs text-foreground-muted leading-relaxed">
              Consultez gratuitement les premiers chapitres de tous les ouvrages du catalogue sans carte bancaire ni inscription préalable. Les œuvres du patrimoine et du domaine public sont en accès libre et illimité.
            </p>
          </div>

          <div className="pt-4 border-t border-border">
            <Link
              href="/student/catalog"
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-background-secondary border border-border text-navy text-xs font-bold hover:bg-navy hover:text-white transition-colors min-h-[44px]"
            >
              Lire des Extraits Gratuits
            </Link>
          </div>
        </div>
      </div>

      {/* Note d'information sur la Synthèse Vocale et la Liseuse */}
      <div className="p-6 rounded-3xl bg-navy text-white border border-navy-hover space-y-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-gold" />
          <h3 className="font-serif font-bold text-base text-white">
            Lecture Assistée et Synthèse Vocale (TTS)
          </h3>
        </div>
        <p className="text-xs text-white/80 leading-relaxed max-w-4xl">
          Tous les livres de votre bibliothèque intègrent nativement le lecteur de synthèse vocale (Text-To-Speech). Ouvrez n&apos;importe quel ouvrage dans la liseuse interactive et activez le mode audio d&apos;un simple clic pour écouter la lecture fluide du texte.
        </p>
      </div>
    </div>
  );
}
