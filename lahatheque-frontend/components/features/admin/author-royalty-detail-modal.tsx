"use client";

import React, { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import {
  getAuthorRoyaltyDetail,
  type AuthorRoyaltyDetail,
} from "@/lib/services/admin";
import {
  BookOpen,
  DollarSign,
  TrendingUp,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Headphones,
  RefreshCw,
  Percent,
} from "lucide-react";

export interface AuthorRoyaltyDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  authorId: string | null;
  authorName?: string;
}

export function AuthorRoyaltyDetailModal({
  isOpen,
  onClose,
  authorId,
  authorName,
}: AuthorRoyaltyDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AuthorRoyaltyDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !authorId) {
      setData(null);
      setError(null);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    getAuthorRoyaltyDetail(authorId)
      .then((res) => {
        if (!isMounted) return;
        if (res) {
          setData(res);
        } else {
          setError("Impossible de charger les détails des redevances pour cet auteur.");
        }
      })
      .catch(() => {
        if (!isMounted) return;
        setError("Une erreur est survenue lors de la récupération des informations.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, authorId]);

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-navy">
          <BookOpen className="w-5 h-5 text-gold" />
          <span className="font-serif text-lg font-bold">
            Détail des Redevances — {authorName || data?.author?.name || "Auteur"}
          </span>
        </div>
      }
      description="Ventilation analytique des droits d'auteur par ouvrage, par format de vente et échéances"
      maxWidth={780}
      maxHeight="min(88vh, 760px)"
      footer={
        <div className="flex justify-end w-full">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-border bg-background-secondary text-navy hover:bg-background text-xs font-semibold transition-colors min-h-[44px]"
          >
            Fermer
          </button>
        </div>
      }
    >
      <div className="space-y-6 py-1">
        {/* Loading State */}
        {loading && (
          <div className="space-y-4 animate-pulse">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-20 bg-background-secondary rounded-2xl border border-border" />
              ))}
            </div>
            <div className="h-44 bg-background-secondary rounded-2xl border border-border" />
            <div className="h-36 bg-background-secondary rounded-2xl border border-border" />
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="p-4 rounded-2xl bg-danger/10 border border-danger/20 text-danger text-xs flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="flex-1">{error}</p>
            <button
              type="button"
              onClick={() => {
                if (authorId) {
                  setLoading(true);
                  setError(null);
                  getAuthorRoyaltyDetail(authorId).then(setData).catch(() => setError("Erreur"));
                }
              }}
              className="px-3 py-1.5 rounded-xl bg-danger/20 hover:bg-danger/30 text-xs font-semibold transition-colors inline-flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Réessayer</span>
            </button>
          </div>
        )}

        {/* Content */}
        {!loading && data && (
          <>
            {/* Header: Author Info & Contracts */}
            <div className="p-4 rounded-2xl bg-background-secondary border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs text-foreground-muted font-medium">Compte Auteur Partenaire</p>
                <h3 className="font-serif text-base font-bold text-navy">{data.author.name}</h3>
                <p className="text-xs text-foreground-muted">{data.author.email}</p>
              </div>

              {data.contracts && data.contracts.length > 0 && (
                <div className="flex flex-col sm:items-end gap-1">
                  <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-navy bg-background px-3 py-1.5 rounded-xl border border-border">
                    <FileText className="w-3.5 h-3.5 text-gold" />
                    <span>{data.contracts[0].contract_number}</span>
                    <span className="text-[11px] text-success font-medium">Actif</span>
                  </div>
                  <p className="text-[11px] text-foreground-muted truncate max-w-xs">
                    {data.contracts[0].title}
                  </p>
                </div>
              )}
            </div>

            {/* 4 KPI Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-2xl bg-background-secondary border border-border space-y-1">
                <div className="flex items-center justify-between text-foreground-muted">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">Ventes Totales</span>
                  <BookOpen className="w-3.5 h-3.5 text-gold" />
                </div>
                <div className="font-serif text-lg font-bold text-navy">
                  {data.author.books_sold_total} <span className="text-xs font-normal text-foreground-muted">ex.</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-background-secondary border border-border space-y-1">
                <div className="flex items-center justify-between text-foreground-muted">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">CA Brut Généré</span>
                  <TrendingUp className="w-3.5 h-3.5 text-gold" />
                </div>
                <div className="font-serif text-lg font-bold text-navy">
                  {data.author.total_revenue_generated.toLocaleString("fr-FR")} <span className="text-[10px] font-normal text-foreground-muted">FCFA</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-background-secondary border border-border space-y-1">
                <div className="flex items-center justify-between text-foreground-muted">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">Droits Dus</span>
                  <DollarSign className="w-3.5 h-3.5 text-gold" />
                </div>
                <div className="font-serif text-lg font-bold text-navy">
                  {data.author.total_royalties_due.toLocaleString("fr-FR")} <span className="text-[10px] font-normal text-foreground-muted">FCFA</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-background-secondary border border-border space-y-1">
                <div className="flex items-center justify-between text-foreground-muted">
                  <span className="text-[11px] font-semibold uppercase tracking-wider">Solde Exigible</span>
                  <Clock className="w-3.5 h-3.5 text-gold" />
                </div>
                <div className="font-serif text-lg font-bold text-navy">
                  {data.author.total_royalties_outstanding.toLocaleString("fr-FR")} <span className="text-[10px] font-normal text-foreground-muted">FCFA</span>
                </div>
              </div>
            </div>

            {/* Section 1: Breakdown per Book */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-serif text-sm font-bold text-navy">
                  Ventilation par Ouvrage & Format ({data.books.length})
                </h4>
                <span className="text-xs text-foreground-muted">
                  Taux contractuel effectif : <strong className="text-gold font-mono">{data.author.avg_royalty_rate_percent}%</strong>
                </span>
              </div>

              <div className="space-y-3">
                {data.books.map((book) => (
                  <div
                    key={book.book_id}
                    className="p-4 rounded-2xl bg-background-secondary border border-border space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-14 rounded-lg bg-navy/5 border border-border overflow-hidden shrink-0 flex items-center justify-center">
                          {book.cover_image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={book.cover_image}
                              alt={book.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <BookOpen className="w-5 h-5 text-foreground-muted" />
                          )}
                        </div>
                        <div>
                          <h5 className="font-serif text-sm font-bold text-navy">{book.title}</h5>
                          <p className="text-[11px] text-foreground-muted">ISBN : {book.isbn || "Non attribué"}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-gold bg-gold/10 px-2.5 py-1 rounded-full border border-gold/20">
                          <Percent className="w-3 h-3" /> Taux : {book.effective_rate_percent}%
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-navy bg-navy/5 px-2.5 py-1 rounded-full border border-border">
                          Part : {book.pool_share_percent}%
                        </span>
                      </div>
                    </div>

                    {/* Format breakdown table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="text-foreground-muted border-b border-border text-[11px]">
                            <th className="pb-2 font-medium">Format de vente</th>
                            <th className="pb-2 font-medium text-center">Exemplaires vendus</th>
                            <th className="pb-2 font-medium text-right">Chiffre d&apos;affaires</th>
                            <th className="pb-2 font-medium text-center">Taux appliqué</th>
                            <th className="pb-2 font-medium text-right">Redevance due</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {/* Paper */}
                          <tr>
                            <td className="py-2.5 flex items-center gap-1.5 font-medium text-navy">
                              <BookOpen className="w-3.5 h-3.5 text-foreground-muted" />
                              <span>Papier broché</span>
                            </td>
                            <td className="py-2.5 text-center font-bold text-navy">
                              {book.sales_by_format.paper.units_sold} ex.
                            </td>
                            <td className="py-2.5 font-mono text-right text-navy">
                              {book.sales_by_format.paper.revenue.toLocaleString("fr-FR")} FCFA
                            </td>
                            <td className="py-2.5 text-center font-mono font-bold text-gold">
                              {book.sales_by_format.paper.rate_percent}%
                            </td>
                            <td className="py-2.5 font-mono font-bold text-right text-navy">
                              {book.sales_by_format.paper.royalty_amount.toLocaleString("fr-FR")} FCFA
                            </td>
                          </tr>

                          {/* Digital */}
                          <tr>
                            <td className="py-2.5 flex items-center gap-1.5 font-medium text-navy">
                              <Smartphone className="w-3.5 h-3.5 text-foreground-muted" />
                              <span>Numérique (LCP DRM)</span>
                            </td>
                            <td className="py-2.5 text-center font-bold text-navy">
                              {book.sales_by_format.digital.units_sold} ex.
                            </td>
                            <td className="py-2.5 font-mono text-right text-navy">
                              {book.sales_by_format.digital.revenue.toLocaleString("fr-FR")} FCFA
                            </td>
                            <td className="py-2.5 text-center font-mono font-bold text-gold">
                              {book.sales_by_format.digital.rate_percent}%
                            </td>
                            <td className="py-2.5 font-mono font-bold text-right text-navy">
                              {book.sales_by_format.digital.royalty_amount.toLocaleString("fr-FR")} FCFA
                            </td>
                          </tr>

                          {/* Audio */}
                          <tr>
                            <td className="py-2.5 flex items-center gap-1.5 font-medium text-navy">
                              <Headphones className="w-3.5 h-3.5 text-foreground-muted" />
                              <span>Audio / TTS</span>
                            </td>
                            <td className="py-2.5 text-center font-bold text-navy">
                              {book.sales_by_format.audio.units_sold} ex.
                            </td>
                            <td className="py-2.5 font-mono text-right text-navy">
                              {book.sales_by_format.audio.revenue.toLocaleString("fr-FR")} FCFA
                            </td>
                            <td className="py-2.5 text-center font-mono font-bold text-gold">
                              {book.sales_by_format.audio.rate_percent}%
                            </td>
                            <td className="py-2.5 font-mono font-bold text-right text-navy">
                              {book.sales_by_format.audio.royalty_amount.toLocaleString("fr-FR")} FCFA
                            </td>
                          </tr>

                          {/* Book Subtotal */}
                          <tr className="bg-background font-semibold text-navy">
                            <td className="py-2.5 pl-2 rounded-l-xl">Total Ouvrage</td>
                            <td className="py-2.5 text-center">{book.book_units_total} ex.</td>
                            <td className="py-2.5 font-mono text-right">
                              {book.book_revenue_total.toLocaleString("fr-FR")} FCFA
                            </td>
                            <td className="py-2.5 text-center text-foreground-muted">—</td>
                            <td className="py-2.5 pr-2 rounded-r-xl font-mono text-right text-gold">
                              {book.book_royalties_total.toLocaleString("fr-FR")} FCFA
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 2: Payout Lines History */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="font-serif text-sm font-bold text-navy">
                  Historique des Échéances Mensuelles ({data.payout_lines.length})
                </h4>
                <span className="text-[11px] text-foreground-muted">Généré par le moteur de calcul</span>
              </div>

              {data.payout_lines.length > 0 ? (
                <div className="overflow-x-auto rounded-2xl border border-border">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-background-secondary border-b border-border text-foreground-muted text-[11px]">
                        <th className="py-2.5 px-3 font-semibold">Période</th>
                        <th className="py-2.5 px-3 font-semibold">Ouvrage</th>
                        <th className="py-2.5 px-3 font-semibold text-right">Montant Calculé</th>
                        <th className="py-2.5 px-3 font-semibold text-center">Statut de Règlement</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {data.payout_lines.map((line) => (
                        <tr key={line.id} className="hover:bg-background-secondary/40 transition-colors">
                          <td className="py-2.5 px-3 font-medium text-navy">{line.period}</td>
                          <td className="py-2.5 px-3 text-navy">{line.book_title}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-navy text-right">
                            {line.amount.toLocaleString("fr-FR")} FCFA
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {line.is_settled ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-success bg-success/10 px-2.5 py-0.5 rounded-full border border-success/20">
                                <CheckCircle2 className="w-3 h-3" /> Réglé
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gold bg-gold/10 px-2.5 py-0.5 rounded-full border border-gold/20">
                                <Clock className="w-3 h-3" /> En attente
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-background-secondary border border-border text-center text-xs text-foreground-muted">
                  Aucune ligne de redevance formalisée. Cliquez sur &laquo; Recalculer les Redevances Maintenant &raquo; sur la page principale pour clore et formaliser l&apos;échéance.
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
