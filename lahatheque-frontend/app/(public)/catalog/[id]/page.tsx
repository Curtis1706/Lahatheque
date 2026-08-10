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
  Sparkles,
  AlertTriangle
} from "lucide-react";
import { getBookById } from "@/lib/services/catalog";
import { BookActionButtons } from "@/components/catalog/book-action-buttons";

export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const book = await getBookById(id);

  if (!book) {
    return (
      <div className="min-h-screen bg-background text-foreground py-20 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-error/10 text-error flex items-center justify-center">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h1 className="font-serif text-2xl font-bold text-navy">Ouvrage introuvable</h1>
        <p className="text-sm text-foreground-muted max-w-sm">
          Le document demandé n'existe pas ou n'est plus disponible dans notre catalogue.
        </p>
        <Link
          href="/catalog"
          className="inline-flex items-center gap-2 bg-navy hover:bg-navy-hover text-white text-xs font-bold px-6 py-3 rounded-lg shadow"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour au catalogue
        </Link>
      </div>
    );
  }

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
            {/* Simulation 3D de reliure de livre premium */}
            <div className="bg-gradient-to-r from-navy-dark to-navy text-white rounded-r-2xl rounded-l-md p-8 min-h-[340px] flex flex-col justify-between items-center relative border-y border-r border-navy-hover border-l-[6px] border-l-gold shadow-lg transform hover:scale-[1.02] transition-transform duration-300">
              <div className="w-16 h-16 rounded-full bg-gold/10 text-gold flex items-center justify-center my-auto shadow-inner">
                <FileText className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <span className="text-[9px] font-bold uppercase tracking-widest text-gold block">
                  {book.discipline_detail.name}
                </span>
                <h2 className="font-serif font-bold text-sm leading-snug text-white/90 line-clamp-3 px-2">
                  {book.title}
                </h2>
              </div>
              <span className="absolute top-4 right-4 px-2 py-0.5 rounded bg-background text-gold text-[9px] font-bold uppercase tracking-wider border border-gold/30">
                {book.format_type.toUpperCase()}
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
                {book.discipline_detail.name}
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
                Par {book.authors_details.map((a) => `${a.first_name} ${a.last_name}`).join(", ")}
              </p>

              {/* Table de Métadonnées */}
              <div className="grid grid-cols-2 gap-4 py-4 border-y border-border text-xs sm:text-sm">
                <div>
                  <span className="text-foreground-muted block text-xs font-semibold uppercase tracking-wider">Éditeur</span>
                  <span className="font-medium text-navy">{book.publisher_name}</span>
                </div>
                <div>
                  <span className="text-foreground-muted block text-xs font-semibold uppercase tracking-wider">Établissement</span>
                  <span className="font-medium text-navy flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-gold inline" />
                    {book.institution_name}
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
                    {book.country} • {book.language === "fr" ? "Français" : book.language.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Synopsis */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-navy">Résumé / Présentation</h3>
                <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed">
                  {book.summary}
                </p>
              </div>
            </div>

              {/* Zone d'Achat & Consultation */}
              <BookActionButtons book={book} />

          </div>

        </div>

      </div>
    </div>
  );
}
