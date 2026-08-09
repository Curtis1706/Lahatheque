"use client";

import { useEffect, useState } from "react";
import { getCatalogItems, approveCatalogItem, rejectCatalogItem } from "@/lib/services/layout-artist";
import { BookCatalogItem } from "@/lib/types/layout-artist";
import { 
  ArrowLeft, 
  Check, 
  X, 
  Clock, 
  BookOpen, 
  CheckCircle2, 
  AlertTriangle,
  FileText,
  ShieldCheck,
  Music
} from "lucide-react";
import { EmptyState, EmptyIcon, EmptyTitle, EmptyDescription } from "@/components/ui/empty-state";
import Link from "next/link";

export default function LayoutValidationPage() {
  const [items, setItems] = useState<BookCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await getCatalogItems();
        setItems(data);
      } catch (err) {
        console.error("Erreur de chargement", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const pendingItems = items.filter(item => item.status === "pending");

  const handleApprove = async (id: string) => {
    try {
      setActioningId(id);
      const success = await approveCatalogItem(id);
      if (success) {
        setItems(prev => prev.map(item => {
          if (item.id === id) return { ...item, status: "approved" as const };
          return item;
        }));
        alert("Ouvrage validé ! Il est désormais publié instantanément sur la vitrine publique.");
      }
    } catch (err) {
      alert("Erreur lors de la validation.");
    } finally {
      setActioningId(null);
    }
  };

  const handleReject = async (id: string) => {
    try {
      setActioningId(id);
      const success = await rejectCatalogItem(id);
      if (success) {
        setItems(prev => prev.map(item => {
          if (item.id === id) return { ...item, status: "rejected" as const };
          return item;
        }));
        alert("Ouvrage rejeté.");
      }
    } catch (err) {
      alert("Erreur lors du rejet.");
    } finally {
      setActioningId(null);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      
      {/* Header */}
      <div className="space-y-1">
        <Link
          href="/layout-artist"
          className="inline-flex items-center gap-1 text-xs font-bold text-navy hover:text-gold transition-colors mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Retour au Portail Maquettiste
        </Link>
        <h1 className="font-serif text-2xl lg:text-3xl font-bold text-navy">Validation Chef Maquettiste</h1>
        <p className="text-sm text-foreground-muted">Passez en revue et validez la mise en ligne des notices documentaires.</p>
      </div>

      {/* Pending Validation List */}
      {loading ? (
        <div className="p-6 space-y-4 animate-pulse bg-background border border-border rounded-xl">
          <div className="h-12 bg-background-secondary rounded" />
          <div className="h-12 bg-background-secondary rounded" />
        </div>
      ) : pendingItems.length === 0 ? (
        <EmptyState className="py-12 border border-border rounded-xl bg-background-secondary max-w-md mx-auto">
          <EmptyIcon icon={CheckCircle2} />
          <EmptyTitle>Tout est validé</EmptyTitle>
          <EmptyDescription>Aucun ouvrage en attente de publication pour le moment.</EmptyDescription>
        </EmptyState>
      ) : (
        <div className="space-y-6">
          {pendingItems.map((item) => (
            <div key={item.id} className="bg-background border border-border rounded-xl p-6 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Info Book */}
              <div className="lg:col-span-8 space-y-4">
                <div className="space-y-1">
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-warning/10 text-warning border border-warning/20">
                    En attente de relecture technique
                  </span>
                  <h3 className="font-serif font-bold text-navy text-lg leading-snug">{item.title}</h3>
                  <p className="text-xs text-foreground-muted">Saisi par le Maquettiste le {new Date(item.created_at).toLocaleDateString("fr-FR")}</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-foreground-muted block">Auteur(s)</span>
                    <span className="font-bold text-navy">{item.authors}</span>
                  </div>
                  <div>
                    <span className="text-foreground-muted block">ISBN</span>
                    <span className="font-mono font-bold text-navy">{item.isbn}</span>
                  </div>
                  <div>
                    <span className="text-foreground-muted block">Discipline</span>
                    <span className="font-bold text-navy">{item.discipline}</span>
                  </div>
                  <div>
                    <span className="text-foreground-muted block">Institution</span>
                    <span className="font-bold text-navy">{item.university} ({item.faculty})</span>
                  </div>
                </div>

                {item.suggested_summary && (
                  <div className="bg-background-secondary p-3.5 rounded border border-border/60 text-xs space-y-1">
                    <span className="font-bold text-navy block">Résumé analytique :</span>
                    <p className="text-foreground-muted leading-relaxed">{item.suggested_summary}</p>
                  </div>
                )}

                <div className="flex flex-wrap gap-4 text-xs font-semibold text-foreground-muted">
                  <span>Format : <span className="text-navy font-bold">{item.format}</span></span>
                  <span>Langue : <span className="text-navy font-bold">{item.language}</span></span>
                  <span>Pays de diffusion : <span className="text-navy font-bold">{item.country}</span></span>
                  {item.has_audio && (
                    <span className="inline-flex items-center gap-1 text-gold font-bold">
                      <Music className="w-3.5 h-3.5" />
                      Livre Audio inclus (LCP DRM)
                    </span>
                  )}
                </div>
              </div>

              {/* Actions Box */}
              <div className="lg:col-span-4 bg-background-secondary p-5 rounded-xl border border-border space-y-4 flex flex-col justify-between h-full">
                <div className="space-y-2">
                  <h4 className="font-bold text-navy text-xs uppercase tracking-wider">Modération de publication</h4>
                  <p className="text-[11px] text-foreground-muted leading-relaxed">
                    La validation publiera automatiquement cet ouvrage sur le site public de LAHAThèque avec sa couverture, son résumé et son prix.
                  </p>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <button
                    onClick={() => handleApprove(item.id)}
                    disabled={actioningId === item.id}
                    className="w-full py-2.5 bg-success hover:bg-success-hover text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    Approuver & Publier
                  </button>
                  <button
                    onClick={() => handleReject(item.id)}
                    disabled={actioningId === item.id}
                    className="w-full py-2.5 bg-background border border-error/30 hover:bg-error/10 text-error text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                  >
                    <X className="w-4 h-4" />
                    Rejeter la fiche
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}
