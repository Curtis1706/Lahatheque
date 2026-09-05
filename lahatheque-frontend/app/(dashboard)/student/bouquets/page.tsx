"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * PAGE BOUQUETS DOCUMENTAIRES CLIENT (MASQUÉE / MISE EN COMMENTAIRE)
 * Désactivée à la demande du client. Redirection automatique vers /student.
 */
export default function StudentBouquetsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/student");
  }, [router]);

  return null;
}

/*
import React, { useState } from "react";
import { Layers, BookOpen, Check, Sparkles, ArrowRight, ShieldCheck, Clock, CheckCircle2, Loader2, Info } from "lucide-react";
import { getClientBouquets, subscribeToClientBouquet, ClientBouquet } from "@/lib/services/bouquets";
import { Modal } from "@/components/ui/modal";
import { toast } from "sonner";
import Link from "next/link";

function ArchivedStudentBouquetsPage() {
  const [bouquets, setBouquets] = useState<ClientBouquet[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBouquet, setSelectedBouquet] = useState<ClientBouquet | null>(null);
  const [subscribing, setSubscribing] = useState(false);

  const loadBouquets = async () => {
    try {
      setLoading(true);
      const data = await getClientBouquets();
      setBouquets(data);
    } catch {
      toast.error("Impossible de charger les bouquets documentaires.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBouquets();
  }, []);

  const handleConfirmSubscribe = async () => {
    if (!selectedBouquet) return;
    setSubscribing(true);
    try {
      const res = await subscribeToClientBouquet(selectedBouquet.id);
      if (res.success) {
        toast.success(res.message || `Abonnement au bouquet « ${selectedBouquet.title} » activé avec succès.`);
        setSelectedBouquet(null);
        await loadBouquets();
      } else {
        toast.error(res.error || "Erreur lors de la souscription.");
      }
    } catch {
      toast.error("Erreur serveur lors de la souscription.");
    } finally {
      setSubscribing(false);
    }
  };

  const formatPrice = (amount: number, currency: string = "XOF") => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: currency === "XOF" ? "XOF" : "EUR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full max-w-7xl mx-auto space-y-6 sm:space-y-8 pb-16 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-lg bg-gold/10 border border-gold/30 flex items-center justify-center text-gold shrink-0">
              <Layers className="size-5" />
            </div>
            <div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
                Bouquets Documentaires
              </h1>
              <p className="font-sans text-xs sm:text-sm text-foreground-muted">
                Accédez en illimité à des collections complètes d'ouvrages par discipline ou thématique.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/student/books"
            className="font-sans text-xs sm:text-sm px-4 py-2 rounded-lg border border-border bg-background hover:bg-background-secondary text-foreground font-medium transition-colors flex items-center gap-2"
          >
            <BookOpen className="size-4 text-navy" />
            Ma Bibliothèque
          </Link>
        </div>
      </div>

      <div className="bg-navy/5 border border-navy/15 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="size-5 text-gold shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <h3 className="font-sans text-sm font-semibold text-navy">
              Lecture illimitée et sécurisée
            </h3>
            <p className="font-sans text-xs text-foreground-muted leading-relaxed">
              La souscription à un bouquet débloque immédiatement la lecture intégrale de tous les ouvrages inclus dans votre liseuse connectée pendant 1 an.
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-80 rounded-xl border border-border bg-background-secondary/50 animate-pulse p-6 space-y-4"
            >
              <div className="h-6 bg-border/60 rounded w-2/3" />
              <div className="h-4 bg-border/40 rounded w-1/3" />
              <div className="h-20 bg-border/30 rounded w-full" />
              <div className="h-10 bg-border/50 rounded w-full mt-auto" />
            </div>
          ))}
        </div>
      ) : bouquets.length === 0 ? (
        <div className="text-center py-16 px-4 border border-dashed border-border rounded-2xl bg-background-secondary/30 space-y-3">
          <div className="w-12 h-12 rounded-full bg-navy/5 border border-border mx-auto flex items-center justify-center text-navy">
            <Layers className="size-6 text-foreground-muted" />
          </div>
          <h3 className="font-serif text-lg font-bold text-navy">Aucun bouquet disponible</h3>
          <p className="font-sans text-xs sm:text-sm text-foreground-muted max-w-md mx-auto">
            Les offres de bouquets documentaires seront bientôt publiées sur le catalogue.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bouquets.map((b) => (
            <div
              key={b.id}
              className={`rounded-2xl border transition-all duration-200 flex flex-col justify-between bg-background overflow-hidden relative group ${
                b.is_subscribed
                  ? "border-gold/50 shadow-sm ring-1 ring-gold/20"
                  : "border-border hover:border-gold/40 hover:shadow-md"
              }`}
            >
              {b.is_subscribed && (
                <div className="bg-gold text-white font-sans text-[11px] font-semibold tracking-wider uppercase px-3 py-1 flex items-center justify-center gap-1.5 shadow-sm">
                  <CheckCircle2 className="size-3.5" />
                  Abonnement Actif
                </div>
              )}

              <div className="p-5 sm:p-6 space-y-4 flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="font-sans inline-block text-[11px] font-semibold text-gold uppercase tracking-wider bg-gold/10 px-2.5 py-0.5 rounded-md mb-2">
                        {b.discipline || (b.bouquet_type === "discipline" ? "Par Discipline" : "Thématique")}
                      </span>
                      <h3 className="font-serif text-lg sm:text-xl font-bold text-navy group-hover:text-gold transition-colors leading-snug">
                        {b.title}
                      </h3>
                    </div>
                  </div>

                  {b.description && (
                    <p className="font-sans text-xs sm:text-sm text-foreground-muted line-clamp-3 leading-relaxed">
                      {b.description}
                    </p>
                  )}
                </div>

                <div className="space-y-3 pt-4 border-t border-border mt-4">
                  <div className="flex items-center justify-between text-xs font-sans text-foreground-muted">
                    <span className="flex items-center gap-1.5">
                      <BookOpen className="size-4 text-navy" />
                      <strong>{b.books_count}</strong> {b.books_count > 1 ? "ouvrages inclus" : "ouvrage inclus"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="size-3.5" />
                      1 an d'accès
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between pt-1">
                    <span className="font-sans text-xs text-foreground-muted uppercase tracking-wider">
                      Tarif annuel
                    </span>
                    <span className="font-sans text-lg sm:text-xl font-bold text-navy">
                      {formatPrice(b.annual_price, b.currency)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-5 pt-0 sm:p-6 sm:pt-0">
                {b.is_subscribed ? (
                  <Link
                    href="/student/books"
                    className="w-full py-2.5 px-4 rounded-xl bg-gold/10 text-gold hover:bg-gold/20 font-sans text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                  >
                    <BookOpen className="size-4" />
                    Consulter les livres
                  </Link>
                ) : (
                  <button
                    onClick={() => setSelectedBouquet(b)}
                    className="w-full py-2.5 px-4 rounded-xl bg-navy hover:bg-navy-hover text-white font-sans text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Sparkles className="size-4 text-gold" />
                    S'abonner maintenant
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedBouquet && (
        <Modal
          open={Boolean(selectedBouquet)}
          onClose={() => !subscribing && setSelectedBouquet(null)}
          title="Souscrire au Bouquet Documentaire"
          description="Confirmation de votre abonnement annuel"
          maxWidth={520}
        >
          <div className="space-y-5 p-1">
            <div className="bg-background-secondary/50 rounded-xl p-4 border border-border space-y-2">
              <span className="font-sans text-[11px] font-semibold text-gold uppercase tracking-wider">
                {selectedBouquet.discipline || "Bouquet Documentaire"}
              </span>
              <h4 className="font-serif text-lg font-bold text-navy">{selectedBouquet.title}</h4>
              <p className="font-sans text-xs text-foreground-muted leading-relaxed">
                {selectedBouquet.description || "Accès illimité à tous les ouvrages de cette collection dans votre liseuse numérique."}
              </p>
            </div>

            <div className="space-y-2 text-xs font-sans">
              <div className="flex justify-between py-2 border-b border-border text-foreground-muted">
                <span>Nombre de livres inclus</span>
                <span className="font-semibold text-navy">{selectedBouquet.books_count} titres</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border text-foreground-muted">
                <span>Durée de validité</span>
                <span className="font-semibold text-navy">12 mois (1 an)</span>
              </div>
              <div className="flex justify-between py-2 text-sm">
                <span className="font-semibold text-navy">Total à régler</span>
                <span className="font-bold text-navy text-base">
                  {formatPrice(selectedBouquet.annual_price, selectedBouquet.currency)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-lg bg-navy/5 border border-navy/10 text-xs font-sans text-foreground-muted">
              <Info className="size-4 text-navy shrink-0" />
              <span>
                L'accès à tous les livres du bouquet sera immédiatement actif dans votre bibliothèque.
              </span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <button
                type="button"
                disabled={subscribing}
                onClick={() => setSelectedBouquet(null)}
                className="px-4 py-2 rounded-lg border border-border bg-background hover:bg-background-secondary text-foreground text-xs sm:text-sm font-medium transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={subscribing}
                onClick={handleConfirmSubscribe}
                className="px-5 py-2 rounded-lg bg-gold hover:bg-gold-dark text-white text-xs sm:text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm"
              >
                {subscribing ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Validation...
                  </>
                ) : (
                  <>
                    Confirmer l'abonnement
                    <ArrowRight className="size-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
*/

