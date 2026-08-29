import React from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, CheckCircle2, ShieldAlert, CreditCard, RefreshCw, FileText } from "lucide-react";

export const metadata = {
  title: "Conditions Générales d'Utilisation — LAHAThèque",
  description: "Conditions générales d'utilisation et de vente de la bibliothèque universitaire numérique LAHAThèque.",
};

export default function CguPage() {
  return (
    <div className="min-h-screen bg-background text-foreground py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-10">
        
        {/* Breadcrumb / Return */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-foreground-muted hover:text-gold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à l'accueil
        </Link>

        {/* Header */}
        <div className="space-y-3 border-b border-border pb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 text-navy border border-gold/20 text-xs font-bold uppercase tracking-wider">
            <FileText className="w-3.5 h-3.5 text-gold" />
            Contrat d'Utilisation
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-navy">
            Conditions Générales d'Utilisation & de Vente
          </h1>
          <p className="text-sm text-foreground-muted">
            Entrée en vigueur : 29 août 2026
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-8 text-sm leading-relaxed text-foreground/90">
          
          <section className="bg-background-secondary p-6 rounded-xl border border-border space-y-4">
            <div className="flex items-center gap-3 text-navy font-bold font-serif text-lg">
              <BookOpen className="w-5 h-5 text-gold shrink-0" />
              <h2>Article 1 — Objet du Service</h2>
            </div>
            <p>
              Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation de la plateforme numérique <strong>LAHAThèque</strong>. LAHAThèque propose un service de consultation en ligne, d'achat d'ouvrages numériques et physiques, et d'abonnements documentaires destinés aux étudiants, enseignants, chercheurs et institutions académiques.
            </p>
          </section>

          <section className="bg-background-secondary p-6 rounded-xl border border-border space-y-4">
            <div className="flex items-center gap-3 text-navy font-bold font-serif text-lg">
              <CheckCircle2 className="w-5 h-5 text-gold shrink-0" />
              <h2>Article 2 — Accès & Inscription</h2>
            </div>
            <p>
              L'accès à la consultation des extraits et du catalogue public est ouvert à tout visiteur. La lecture intégrale des ouvrages, le dépôt de manuscrits et la gestion d'abonnements nécessitent la création d'un compte utilisateur authentifié. L'utilisateur s'engage à fournir des informations véridiques et à préserver la confidentialité de ses identifiants.
            </p>
          </section>

          <section className="bg-background-secondary p-6 rounded-xl border border-border space-y-4">
            <div className="flex items-center gap-3 text-navy font-bold font-serif text-lg">
              <CreditCard className="w-5 h-5 text-gold shrink-0" />
              <h2>Article 3 — Tarifs, Abonnements & Paiements</h2>
            </div>
            <p>
              Les tarifs des ouvrages et des formules d'abonnement sont exprimés en Francs CFA (FCFA) toutes taxes comprises. Les transactions s'effectuent via nos prestataires de paiement sécurisés certifiés (Mobile Money, cartes bancaires).
            </p>
            <ul className="space-y-1.5 text-foreground-muted list-disc list-inside">
              <li><strong>Pass Individuels :</strong> Accès personnel non transférable pour la durée souscrite.</li>
              <li><strong>Accès Institutionnels :</strong> Déblocage des bouquets documentaires pour les étudiants et enseignants validés par leur université partenaire.</li>
            </ul>
          </section>

          <section className="bg-background-secondary p-6 rounded-xl border border-border space-y-4">
            <div className="flex items-center gap-3 text-navy font-bold font-serif text-lg">
              <ShieldAlert className="w-5 h-5 text-gold shrink-0" />
              <h2>Article 4 — Sécurité, DRM & Restrictions d'Usage</h2>
            </div>
            <p>
              Les ouvrages consultés au sein de la liseuse numérique intégrée font l'objet d'un tatouage numérique dynamique (filigrane nominatif). Sont formellement prohibés :
            </p>
            <ul className="space-y-1.5 text-foreground-muted list-disc list-inside">
              <li>Toute tentative de décompilation, rétro-ingénierie ou contournement du module DRM.</li>
              <li>L'utilisation de scripts, robots ou logiciels d'aspiration automatisée de contenu.</li>
              <li>Le partage d'identifiants permettant des sessions simultanées non autorisées.</li>
            </ul>
          </section>

          <section className="bg-background-secondary p-6 rounded-xl border border-border space-y-4">
            <div className="flex items-center gap-3 text-navy font-bold font-serif text-lg">
              <RefreshCw className="w-5 h-5 text-gold shrink-0" />
              <h2>Article 5 — Modification des Conditions</h2>
            </div>
            <p>
              LAHAThèque se réserve le droit de modifier unilatéralement les présentes conditions pour se conformer aux évolutions réglementaires et techniques. Les utilisateurs seront informés de toute modification substantielle.
            </p>
          </section>

        </div>

      </div>
    </div>
  );
}
