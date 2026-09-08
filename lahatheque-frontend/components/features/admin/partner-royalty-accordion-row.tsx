"use client";

import React from "react";
import { AdminPartnerRoyaltySummary, AdminPartnerBookDetail } from "@/lib/types/admin";
import { BookOpen, Layers, FileText, Headphones, Percent } from "lucide-react";

interface PartnerRoyaltyAccordionRowProps {
  partner: AdminPartnerRoyaltySummary;
}

export function PartnerRoyaltyAccordionRow({
  partner,
}: PartnerRoyaltyAccordionRowProps) {
  const getFormatIcon = (format: string) => {
    switch (format) {
      case "paper":
        return <BookOpen className="w-3.5 h-3.5 text-gold" />;
      case "digital":
        return <FileText className="w-3.5 h-3.5 text-navy" />;
      case "audio":
        return <Headphones className="w-3.5 h-3.5 text-gold" />;
      case "bouquet":
        return <Layers className="w-3.5 h-3.5 text-gold" />;
      default:
        return <BookOpen className="w-3.5 h-3.5 text-gold" />;
    }
  };

  const getFormatLabel = (format: string) => {
    switch (format) {
      case "paper":
        return "Papier";
      case "digital":
        return "Numérique";
      case "audio":
        return "Audio";
      case "bouquet":
        return "Bouquet Campus";
      default:
        return format;
    }
  };

  return (
    <div className="rounded-xl border border-border bg-background p-3 sm:p-4 shadow-xs">
      {/* Header de l'accordéon */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-border/60">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-navy/5 text-navy">
            <BookOpen className="w-4 h-4 text-gold" />
          </span>
          <div>
            <h4 className="font-poppins font-semibold text-xs sm:text-sm text-foreground">
              Ventilation par ouvrage • {partner.partner_name}
            </h4>
            <p className="text-[11px] text-foreground-muted font-poppins">
              {partner.books.length} référence{partner.books.length > 1 ? "s" : ""} active{partner.books.length > 1 ? "s" : ""} • Taux moyen appliqué : {partner.average_rate_percent}%
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-poppins">
          <div className="text-right">
            <span className="text-[11px] text-foreground-muted block">CA Brut Généré</span>
            <span className="font-bold text-navy font-mono text-xs sm:text-sm">
              {partner.total_revenue_generated.toLocaleString("fr-FR")} FCFA
            </span>
          </div>
          <div className="text-right pl-3 border-l border-border/60">
            <span className="text-[11px] text-foreground-muted block">Droits Totaux Dûs</span>
            <span className="font-bold text-gold font-mono text-xs sm:text-sm">
              {partner.total_royalties_due.toLocaleString("fr-FR")} FCFA
            </span>
          </div>
        </div>
      </div>

      {/* Liste des ouvrages - Mobile (Cartes) */}
      <div className="block sm:hidden space-y-2">
        {partner.books.map((book: AdminPartnerBookDetail, index: number) => (
          <div
            key={book.book_id || index}
            className="p-2.5 rounded-lg border border-border/60 bg-background-secondary/30 space-y-1.5 text-xs font-poppins"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="font-medium text-foreground line-clamp-2">
                {book.title}
              </p>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-navy/5 text-navy border border-navy/10 flex-shrink-0">
                {getFormatIcon(book.format)}
                {getFormatLabel(book.format)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] text-foreground-muted pt-1 border-t border-border/40">
              <div>
                <span>Volume : </span>
                <strong className="text-foreground font-mono">{book.units_or_reads_count} ex./lect.</strong>
              </div>
              <div className="text-right">
                <span>Taux : </span>
                <span className="inline-flex items-center font-bold text-gold font-mono">
                  <Percent className="w-2.5 h-2.5 mr-0.5" />
                  {book.effective_rate_percent}%
                </span>
              </div>
              <div>
                <span>CA Brut : </span>
                <span className="font-mono text-foreground">{book.gross_revenue_generated.toLocaleString("fr-FR")} F</span>
              </div>
              <div className="text-right">
                <span>Droits : </span>
                <span className="font-mono font-bold text-navy">{book.royalties_earned.toLocaleString("fr-FR")} F</span>
              </div>
            </div>
          </div>
        ))}

        {partner.books.length === 0 && (
          <p className="text-center py-4 text-xs text-foreground-muted font-poppins">
            Aucun ouvrage individuel enregistré pour cet ayant-droit.
          </p>
        )}
      </div>

      {/* Liste des ouvrages - Desktop (Tableau) */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left text-xs font-poppins">
          <thead>
            <tr className="border-b border-border/60 text-foreground-muted text-[11px]">
              <th className="pb-2 font-medium">Titre de l&apos;ouvrage / Référence</th>
              <th className="pb-2 font-medium text-center">Format</th>
              <th className="pb-2 font-medium text-center">Volume / Lectures</th>
              <th className="pb-2 font-medium text-center">Taux Contractuel</th>
              <th className="pb-2 font-medium text-right">CA Brut Généré</th>
              <th className="pb-2 font-medium text-right">Droits Acquis</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {partner.books.map((book: AdminPartnerBookDetail, index: number) => (
              <tr key={book.book_id || index} className="hover:bg-background-secondary/40 transition-colors">
                <td className="py-2.5 font-medium text-foreground">
                  {book.title}
                </td>
                <td className="py-2.5 text-center">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-navy/5 text-navy border border-navy/10">
                    {getFormatIcon(book.format)}
                    {getFormatLabel(book.format)}
                  </span>
                </td>
                <td className="py-2.5 text-center font-mono text-foreground-muted">
                  {book.units_or_reads_count}
                </td>
                <td className="py-2.5 text-center font-mono font-bold text-gold">
                  {book.effective_rate_percent}%
                </td>
                <td className="py-2.5 text-right font-mono text-foreground">
                  {book.gross_revenue_generated.toLocaleString("fr-FR")} FCFA
                </td>
                <td className="py-2.5 text-right font-mono font-bold text-navy">
                  {book.royalties_earned.toLocaleString("fr-FR")} FCFA
                </td>
              </tr>
            ))}

            {partner.books.length === 0 && (
              <tr>
                <td colSpan={6} className="py-4 text-center text-foreground-muted">
                  Aucun ouvrage individuel enregistré pour cet ayant-droit.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
