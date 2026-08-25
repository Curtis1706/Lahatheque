"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  ArrowLeft,
  Play,
  BookOpen,
  BookMarked,
  Loader2,
  Clock,
  AlertTriangle,
  RotateCcw,
  Calendar,
  X,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import {
  getStudentBooks,
  getStudentOrders,
  type BookAPI,
  type OrderAPI,
} from "@/lib/services/student";
import { returnCreditOrder } from "@/lib/services/author";
import { StatusBadge } from "@/components/ui/status-badge";

export default function AuthorPurchasesPage() {
  const [books, setBooks] = useState<BookAPI[]>([]);
  const [orders, setOrders] = useState<OrderAPI[]>([]);
  const [loading, setLoading] = useState(true);

  // Modale de retour
  const [returnOrder, setReturnOrder] = useState<OrderAPI | null>(null);
  const [returnReason, setReturnReason] = useState("");
  const [returning, setReturning] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [bData, oData] = await Promise.all([
        getStudentBooks(),
        getStudentOrders(),
      ]);
      setBooks(bData);
      setOrders(oData);
    } catch {
      // Fallback empty
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnOrder) return;

    setReturning(true);
    try {
      const ok = await returnCreditOrder(returnOrder.id, returnReason);
      if (ok) {
        toast.success(`La commande #${returnOrder.id.slice(0, 8)} a été retournée avec succès.`);
        setReturnOrder(null);
        setReturnReason("");
        await loadData();
      } else {
        toast.error("Échec du retour de la commande.");
      }
    } catch {
      toast.error("Une erreur est survenue lors du retour.");
    } finally {
      setReturning(false);
    }
  };

  const creditOrders = orders.filter(
    (o) => o.is_credit_purchase && o.statut_paiement === "pending" && o.statut_commande !== "returned"
  );

  const standardOrders = orders.filter(
    (o) => !o.is_credit_purchase || o.statut_paiement === "paid" || o.statut_commande === "returned"
  );

  const now = new Date();

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-8 max-w-7xl mx-auto pb-16">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/author" className="hover:text-navy">
          Vue d&apos;ensemble
        </Link>
        <span>/</span>
        <span className="text-navy font-semibold">Mes Achats &amp; Crédits</span>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/author"
            className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Vue d&apos;ensemble
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
            <ShoppingBag className="w-4 h-4 text-gold" />
            Espace Consommateur / Auteur
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Mes Achats &amp; Bibliothèque Personnelle
          </h1>
          <p className="text-xs text-foreground-muted mt-1">
            Retrouvez les ouvrages acquis, vos commandes à crédit et votre liseuse personnelle.
          </p>
        </div>

        <Link
          href="/author/catalog"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-navy text-white text-xs font-bold hover:bg-navy-dark transition-all self-start sm:self-auto min-h-[44px]"
        >
          <ShoppingBag className="w-4 h-4 text-gold" />
          <span>Catalogue des Ouvrages</span>
        </Link>
      </div>

      {/* Chargement */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-gold animate-spin" />
        </div>
      )}

      {!loading && (
        <>
          {/* SECTION : ACHATS À CRÉDIT EN ATTENTE DE RÈGLEMENT */}
          {creditOrders.length > 0 && (
            <div className="p-6 rounded-3xl bg-background border border-gold/30 shadow-xs space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-gold/10 text-gold border border-gold/20">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-serif font-bold text-navy text-base">
                      Mes Achats à Crédit — Paiement en attente ({creditOrders.length})
                    </h2>
                    <p className="text-xs text-foreground-muted">
                      Accès activé. Vous pouvez régler ou retourner un produit avant son échéance.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {creditOrders.map((order) => {
                  const isOverdue = order.credit_due_date ? new Date(order.credit_due_date) < now : false;
                  return (
                    <div
                      key={order.id}
                      className="p-5 rounded-2xl bg-background-secondary border border-border space-y-4 flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-navy">#{order.id.slice(0, 8)}</span>
                          {isOverdue ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-500/10 px-2.5 py-0.5 rounded-full border border-rose-500/20">
                              <AlertTriangle className="w-3 h-3" /> Échéance dépassée
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-gold bg-gold/10 px-2.5 py-0.5 rounded-full border border-gold/20">
                              <Clock className="w-3 h-3" /> À régler à terme
                            </span>
                          )}
                        </div>

                        <div className="space-y-1">
                          {order.lignes.map((l) => (
                            <p key={l.id} className="text-xs font-medium text-navy truncate">
                              • {l.ouvrage_title} ({l.format_display || l.format_type}) x{l.quantity}
                            </p>
                          ))}
                        </div>

                        <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
                          <span className="text-foreground-muted">Montant dû :</span>
                          <span className="font-mono font-bold text-navy text-sm">
                            {order.total_amount.toLocaleString("fr-FR")} FCFA
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <span className="text-foreground-muted flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-foreground-muted" /> Date d&apos;échéance :
                          </span>
                          <span className={`font-medium ${isOverdue ? "text-rose-600 font-bold" : "text-navy"}`}>
                            {order.credit_due_date
                              ? new Date(order.credit_due_date).toLocaleDateString("fr-FR")
                              : "Non définie"}
                          </span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setReturnOrder(order)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-rose-500/30 text-rose-600 hover:bg-rose-500/10 text-xs font-semibold transition-colors min-h-[36px]"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Retourner ce produit</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECTION : LIVRES DANS LA BIBLIOTHÈQUE CLIENT */}
          <div className="space-y-4">
            <h3 className="font-serif font-bold text-navy text-base flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-gold" />
              Livres dans Ma Bibliothèque Client ({books.length})
            </h3>

            {books.length === 0 ? (
              <div className="py-16 rounded-3xl bg-background border border-dashed border-border text-center space-y-3">
                <BookMarked className="w-10 h-10 text-foreground-muted mx-auto opacity-40" />
                <p className="font-serif font-bold text-navy">Bibliothèque vide</p>
                <p className="text-xs text-foreground-muted">
                  Explorez le catalogue pour acquérir vos premiers ouvrages.
                </p>
                <Link
                  href="/author/catalog"
                  className="inline-flex mt-2 items-center gap-2 px-4 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-dark transition-colors min-h-[44px]"
                >
                  Explorer le Catalogue Auteur
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                {books.map((book) => {
                  const authorName =
                    book.authors?.map((a) => a.full_name).join(", ") ||
                    "Auteur inconnu";
                  return (
                    <div
                      key={book.id}
                      className="p-4 rounded-3xl bg-background border border-border space-y-3 flex flex-col justify-between shadow-xs"
                    >
                      <div className="space-y-3">
                        <div className="w-full flex justify-center py-4 bg-navy/5 rounded-2xl border border-border relative">
                          <BookMarked className="w-12 h-16 text-navy/20" />
                          <span className="absolute top-2 right-2 px-2 py-0.5 rounded bg-gold/20 text-gold text-[10px] font-mono font-bold">
                            Acquis
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] font-bold text-foreground-muted uppercase tracking-wider block">
                            {book.discipline_name || "Académique"}
                          </span>
                          <h3 className="font-serif font-bold text-navy text-sm line-clamp-2 mt-0.5">
                            {book.title}
                          </h3>
                          <p className="text-xs text-foreground-muted truncate">
                            Par {authorName}
                          </p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-border">
                        <Link
                          href={`/catalog/reader/${book.id}`}
                          className="w-full py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-dark transition-colors flex items-center justify-center gap-2 min-h-[40px] shadow-xs"
                        >
                          <Play className="w-3.5 h-3.5 text-gold fill-gold" />
                          Lire le livre
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SECTION : HISTORIQUE DE TOUTES LES COMMANDES */}
          {standardOrders.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-serif font-bold text-navy text-base flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-gold" />
                Historique des Commandes ({standardOrders.length})
              </h3>
              <div className="space-y-2">
                {standardOrders.slice(0, 10).map((order) => (
                  <div
                    key={order.id}
                    className="p-4 rounded-2xl border border-border bg-background flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-mono font-bold text-navy">#{order.id.slice(0, 8)}</p>
                        <StatusBadge status={order.statut_commande} />
                        {order.is_credit_purchase && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-gold/10 text-gold border border-gold/20 font-bold">
                            Crédit
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-foreground-muted mt-1">
                        {order.lignes.map((l) => `${l.ouvrage_title} (${l.quantity})`).join(", ")}
                      </p>
                      <p className="text-[10px] text-foreground-muted">
                        {new Date(order.created_at).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>

                    <span className="font-mono font-bold text-navy text-xs sm:text-right">
                      {order.total_amount.toLocaleString("fr-FR")} FCFA
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Modale de Confirmation de Retour Produit */}
      {returnOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-background border border-border shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-600 border border-rose-500/20">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-navy text-base">Retourner la commande</h3>
                  <p className="text-xs text-foreground-muted">Commande #{returnOrder.id.slice(0, 8)}</p>
                </div>
              </div>
              <button
                onClick={() => setReturnOrder(null)}
                className="p-2 rounded-xl text-foreground-muted hover:bg-background-secondary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-foreground-muted">
              Le retour de cette commande à crédit réintégrera les exemplaires papier en stock et révoquera les accès numériques associés sans frais.
            </p>

            <form onSubmit={handleReturnSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-navy uppercase tracking-wider">
                  Motif du retour (facultatif)
                </label>
                <textarea
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  placeholder="Ex: Erreur de commande, format inadapté..."
                  rows={3}
                  className="w-full p-3 text-xs rounded-xl border border-border bg-background-secondary text-navy placeholder:text-foreground-muted focus:outline-none focus:border-gold"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReturnOrder(null)}
                  disabled={returning}
                  className="px-4 py-2.5 rounded-xl border border-border text-xs font-semibold text-foreground-muted hover:bg-background-secondary min-h-[44px]"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={returning}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors disabled:opacity-50 min-h-[44px]"
                >
                  {returning ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Traitement...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirmer le retour</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
