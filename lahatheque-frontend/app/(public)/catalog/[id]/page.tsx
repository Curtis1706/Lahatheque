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
import { Book as Book3D } from "@/components/ui/book";

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
          <div className="space-y-4 text-center flex flex-col items-center justify-center">
            {book.cover_url || book.cover_image ? (
              <div className="relative w-[180px] sm:w-[220px] aspect-[2/3] rounded-r-xl rounded-l-sm overflow-hidden shadow-2xl border-l-4 border-black/30 border-r border-t border-b border-border/80">
                <img
                  src={book.cover_url || book.cover_image}
                  alt={book.title}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="flex items-center justify-center py-4">
                <Book3D 
                  title={book.title}
                  author={book.authors_details.map((a) => `${a.first_name} ${a.last_name}`).join(", ")}
                  variant="lahatheque"
                  color={book.cover_color || "var(--navy)"}
                  textColor={book.cover_text_color || "var(--gold)"}
                  width={{ sm: 160, md: 180, lg: 200, xl: 200 }}
                  textured
                />
              </div>
            )}

            {/* Badges de Confiance */}
            <div className="flex items-center justify-center gap-4 text-foreground-muted text-xs pt-2">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-gold" />
                Certifié LAHA
              </span>
              <span className="flex items-center gap-1">
                <Award className="w-4 h-4 text-gold" />
                Accès Partenaire
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
