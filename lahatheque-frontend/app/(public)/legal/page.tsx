import React from "react";
import Link from "next/link";
import { ShieldCheck, FileText, ArrowLeft, Mail, Building, Globe, Scale } from "lucide-react";

export const metadata = {
  title: "Mentions Légales — LAHAThèque",
  description: "Mentions légales et informations juridiques officielles de la plateforme LAHAThèque.",
};

export default function LegalPage() {
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
            <Scale className="w-3.5 h-3.5 text-gold" />
            Cadre Réglementaire
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-navy">
            Mentions Légales
          </h1>
          <p className="text-sm text-foreground-muted">
            Dernière mise à jour : 29 août 2026
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-8 text-sm leading-relaxed text-foreground/90">
          
          <section className="bg-background-secondary p-6 rounded-xl border border-border space-y-4">
            <div className="flex items-center gap-3 text-navy font-bold font-serif text-lg">
              <Building className="w-5 h-5 text-gold shrink-0" />
              <h2>1. Éditeur de la Plateforme</h2>
            </div>
            <p>
              La plateforme numérique <strong>LAHAThèque</strong> est éditée par <strong>Laha Éditions SA</strong>, société spécialisée dans l'édition et la diffusion d'ouvrages scolaires, universitaires et scientifiques.
            </p>
            <ul className="space-y-1.5 text-foreground-muted list-disc list-inside">
              <li><strong>Raison sociale :</strong> Laha Éditions SA</li>
              <li><strong>Siège social :</strong> Cotonou, République du Bénin</li>
              <li><strong>Courriel de contact :</strong> contact@lahatheque.com</li>
              <li><strong>Directeur de la publication :</strong> Direction Générale de Laha Éditions SA</li>
            </ul>
          </section>

          <section className="bg-background-secondary p-6 rounded-xl border border-border space-y-4">
            <div className="flex items-center gap-3 text-navy font-bold font-serif text-lg">
              <Globe className="w-5 h-5 text-gold shrink-0" />
              <h2>2. Hébergement &amp; Sécurité des Données</h2>
            </div>
            <p>
              L'infrastructure et les serveurs de stockage sécurisés sont hébergés conformément aux normes internationales de disponibilité et de protection des données :
            </p>
            <ul className="space-y-1.5 text-foreground-muted list-disc list-inside">
              <li><strong>Infrastructure Cloud :</strong> Environnement haute disponibilité avec chiffrement au repos (AES-256) et en transit (TLS 1.3).</li>
              <li><strong>Protection DRM &amp; Filigrane dynamique :</strong> Tous les flux de lecture sont protégés par le module de sécurité propriétaire LAHA DRM empêchant toute capture ou extraction non autorisée.</li>
            </ul>
          </section>

          <section className="bg-background-secondary p-6 rounded-xl border border-border space-y-4">
            <div className="flex items-center gap-3 text-navy font-bold font-serif text-lg">
              <ShieldCheck className="w-5 h-5 text-gold shrink-0" />
              <h2>3. Propriété Intellectuelle &amp; Droits d'Auteur</h2>
            </div>
            <p>
              L'ensemble des contenus présents sur LAHAThèque (textes, manuscrits, thèses, ouvrages, illustrations, logos, interfaces et architectures logicielles) est protégé par le Code de la propriété intellectuelle et les traités internationaux relatifs aux droits d'auteur (OAPI, OMPI, Convention de Berne).
            </p>
            <p className="text-foreground-muted">
              Toute reproduction, représentation, modification, publication, adaptation totale ou partielle des éléments de la plateforme, quel que soit le moyen ou le procédé utilisé, est strictement interdite sans autorisation écrite préalable de <strong>Laha Éditions SA</strong> ou des titulaires de droits respectifs.
            </p>
          </section>

          <section className="bg-background-secondary p-6 rounded-xl border border-border space-y-4">
            <div className="flex items-center gap-3 text-navy font-bold font-serif text-lg">
              <FileText className="w-5 h-5 text-gold shrink-0" />
              <h2>4. Données Personnelles & Cookies</h2>
            </div>
            <p>
              LAHAThèque respecte la vie privée de ses utilisateurs. Les données personnelles collectées (identifiants, historique de lecture sécurisé, annotations) sont strictement nécessaires au fonctionnement du service et à la gestion des droits d'accès. Aucune donnée n'est cédée à des tiers à des fins publicitaires.
            </p>
            <p className="text-foreground-muted">
              Pour exercer vos droits d'accès, de rectification ou de suppression, vous pouvez contacter notre délégué à la protection des données à l'adresse : <span className="text-navy font-medium">dpo@lahatheque.com</span>.
            </p>
          </section>

        </div>

      </div>
    </div>
  );
}
