import Link from "next/link";
import { 
  BookOpen, 
  Download, 
  ShoppingBag, 
  ArrowLeft, 
  Building2, 
  Globe, 
  FileText, 
  ShieldCheck, 
  Award, 
  Clock,
  Sparkles
} from "lucide-react";

export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Mock Ouvrage pour l'affichage de démonstration
  const book = {
    id,
    isbn: "978-2-84299-123-4",
    title: "Droit Constitutionnel des États d'Afrique Francophone",
    subtitle: "Principes généraux et évolutions démocratiques",
    authors: [{ first_name: "Jean-Marc", last_name: "Agossou" }],
    discipline: "Droit & Sciences Politiques",
    publisher: "LAHA Éditions",
    institution: "Université d'Abomey-Calavi (UAC)",
    format_type: "PDF (Document Numérique Protégé)",
    language: "Français",
    country: "Bénin (BJ)",
    publication_date: "2024-10-15",
    page_count: 420,
    summary: `Cet ouvrage propose une analyse approfondie et synthétique des institutions politiques et du droit constitutionnel en Afrique subsaharienne francophone. Il traite des évolutions récentes du constitutionnalisme, de la séparation des pouvoirs, du contrôle de constitutionnalité et du droit des élections. Rédigé par le Professeur Jean-Marc Agossou, cet ouvrage s'adresse en priorité aux étudiants de Licence et Master en Droit, aux enseignants-chercheurs ainsi qu'aux praticiens du droit constitutionnel.`,
  };

  return (
    <div className="min-h-screen bg-background text-foreground py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Lien Retour */}
        <Link
          href="/catalog"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-navy hover:text-gold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour au catalogue
        </Link>

        {/* Carte Principale de la Fiche Ouvrage */}
        <div className="bg-background-secondary rounded-3xl border border-border overflow-hidden p-6 sm:p-8 lg:p-10 grid grid-cols-1 md:grid-cols-3 gap-8 shadow-sm">
          
          {/* Couverture / Aperçu Visuel */}
          <div className="space-y-4 text-center">
            <div className="bg-navy-dark text-white rounded-2xl p-8 min-h-[320px] flex flex-col justify-between items-center relative border border-navy/30 shadow-md">
              <div className="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center text-gold my-auto">
                <FileText className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gold block">
                  {book.discipline}
                </span>
                <h2 className="font-serif font-bold text-sm leading-snug text-white/95">
                  {book.title}
                </h2>
              </div>
              <span className="absolute top-4 right-4 px-2.5 py-1 rounded bg-navy text-gold text-[10px] font-bold uppercase tracking-wider border border-gold/30">
                PDF
              </span>
            </div>

            {/* Badges de Confiance */}
            <div className="flex items-center justify-center gap-4 text-foreground-muted text-xs pt-2">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-gold" />
                Certifié LAHA
              </span>
              <span className="flex items-center gap-1">
                <Award className="w-4 h-4 text-gold" />
                Accès Institutionnel
              </span>
            </div>
          </div>

          {/* Métadonnées & Détails */}
          <div className="md:col-span-2 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-navy-light text-navy text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-gold" />
                {book.discipline}
              </span>

              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-navy leading-tight">
                {book.title}
              </h1>

              {book.subtitle && (
                <p className="text-sm font-medium text-foreground-muted italic">
                  {book.subtitle}
                </p>
              )}

              <p className="text-sm font-semibold text-navy">
                Par {book.authors.map((a) => `${a.first_name} ${a.last_name}`).join(", ")}
              </p>

              {/* Table de Métadonnées */}
              <div className="grid grid-cols-2 gap-4 py-4 border-y border-border text-xs sm:text-sm">
                <div>
                  <span className="text-foreground-muted block text-xs font-semibold uppercase tracking-wider">Éditeur</span>
                  <span className="font-medium text-navy">{book.publisher}</span>
                </div>
                <div>
                  <span className="text-foreground-muted block text-xs font-semibold uppercase tracking-wider">Établissement</span>
                  <span className="font-medium text-navy flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-gold inline" />
                    {book.institution}
                  </span>
                </div>
                <div>
                  <span className="text-foreground-muted block text-xs font-semibold uppercase tracking-wider">ISBN</span>
                  <span className="font-mono text-navy">{book.isbn}</span>
                </div>
                <div>
                  <span className="text-foreground-muted block text-xs font-semibold uppercase tracking-wider">Pays & Langue</span>
                  <span className="font-medium text-navy flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-gold inline" />
                    {book.country} • {book.language}
                  </span>
                </div>
              </div>

              {/* Synopsis */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-navy">Résumé / Presentation</h3>
                <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed">
                  {book.summary}
                </p>
              </div>
            </div>

            {/* Zone de Boutons d'Action (Correction 5 — Placeholders Désactivés) */}
            <div className="pt-6 border-t border-border space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                
                {/* Accès Lecteur Protégé */}
                <Link
                  href={`/catalog/reader/${id}`}
                  className="flex-1 px-5 py-3 rounded-xl bg-navy text-white text-xs sm:text-sm font-semibold hover:bg-navy-hover transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <BookOpen className="w-4 h-4" />
                  Consulter dans le lecteur
                </Link>

                {/* Bouton Télécharger (Placeholder désactivé - Correction 5) */}
                <button
                  disabled
                  title="Module de téléchargement sécurisé bientôt disponible"
                  className="px-5 py-3 rounded-xl bg-background border border-border text-foreground-muted text-xs sm:text-sm font-semibold cursor-not-allowed opacity-60 flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Télécharger (Bientôt disponible)
                </button>

                {/* Bouton Acheter (Placeholder désactivé - Correction 5) */}
                <button
                  disabled
                  title="Module de paiement bientôt disponible"
                  className="px-5 py-3 rounded-xl bg-gold/10 border border-gold/30 text-gold-dark text-xs sm:text-sm font-semibold cursor-not-allowed opacity-60 flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4" />
                  Acheter (Bientôt disponible)
                </button>

              </div>

              <p className="text-[11px] text-foreground-muted text-center sm:text-left italic">
                * Les fonctions d'achat individuel et de téléchargement hors ligne seront activées lors de la prochaine phase. L'accès en lecture directe reste entièrement disponible.
              </p>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
