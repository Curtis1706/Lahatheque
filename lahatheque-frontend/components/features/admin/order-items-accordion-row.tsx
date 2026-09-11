"use client";

import React from "react";
import { AdminSaleOrder, AdminSaleOrderItem } from "@/lib/types/admin";
import { BookOpen, Layers, FileText, Headphones, Sparkles } from "lucide-react";

interface OrderItemsAccordionRowProps {
  order: AdminSaleOrder;
  colSpan?: number;
}

export function OrderItemsAccordionRow({
  order,
}: OrderItemsAccordionRowProps) {
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
        return "Livre Papier";
      case "digital":
        return "Numérique (PDF/EPUB)";
      case "audio":
        return "Livre Audio";
      case "bouquet":
        return "Bouquet Campus B2B";
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
            <Layers className="w-4 h-4 text-gold" />
          </span>
          <div>
            <h4 className="font-poppins font-semibold text-xs sm:text-sm text-foreground">
              Détail des articles • Commande {order.order_reference}
            </h4>
            <p className="text-[11px] text-foreground-muted font-poppins">
              {order.items_count} article{order.items_count > 1 ? "s" : ""} • Canal : {order.channel_label}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-poppins">
          <span className="text-foreground-muted">Montant net réglé :</span>
          <span className="font-bold text-navy font-mono text-sm">
            {order.net_amount_paid.toLocaleString("fr-FR")} FCFA
          </span>
        </div>
      </div>

      {/* Liste des articles - Mobile (Cards) & Desktop (Table) */}
      <div className="block sm:hidden space-y-2">
        {order.items.map((item: AdminSaleOrderItem, index: number) => (
          <div
            key={item.id || index}
            className="p-2.5 rounded-lg border border-border/60 bg-background-secondary/30 space-y-2 text-xs font-poppins"
          >
            <div className="flex items-start gap-2.5">
              {/* Couverture Mobile */}
              <div className="w-9 h-12 rounded-md overflow-hidden bg-navy/5 border border-border flex-shrink-0 flex items-center justify-center">
                {item.cover_url ? (
                  <img
                    src={item.cover_url}
                    alt={item.book_title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <BookOpen className="w-4 h-4 text-gold/70" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-1.5">
                  <p className="font-medium text-foreground line-clamp-2">
                    {item.book_title}
                  </p>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-navy/5 text-navy border border-navy/10 flex-shrink-0">
                    {getFormatIcon(item.format)}
                    {getFormatLabel(item.format)}
                  </span>
                </div>
                {item.author_display && (
                  <p className="text-[10px] text-foreground-muted line-clamp-1 mt-0.5">
                    {item.author_display}
                  </p>
                )}
                {item.isbn && (
                  <p className="text-[10px] text-foreground-muted font-mono mt-0.5">
                    ISBN : {item.isbn}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-foreground-muted pt-1.5 border-t border-border/40">
              <span>
                Qté : <strong className="text-foreground font-mono">{item.quantity}</strong> × {item.unit_price.toLocaleString("fr-FR")} FCFA
              </span>
              <span className="font-bold text-foreground font-mono">
                {item.subtotal.toLocaleString("fr-FR")} FCFA
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Table desktop */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left text-xs font-poppins">
          <thead>
            <tr className="border-b border-border/60 text-foreground-muted uppercase text-[10px] tracking-wider">
              <th className="pb-2 font-medium">Ouvrage &amp; Détails</th>
              <th className="pb-2 font-medium">Format</th>
              <th className="pb-2 font-medium text-center">Quantité</th>
              <th className="pb-2 font-medium text-right">Prix Unitaire</th>
              <th className="pb-2 font-medium text-right">Sous-total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {order.items.map((item: AdminSaleOrderItem, index: number) => (
              <tr key={item.id || index} className="hover:bg-background-secondary/20 transition-colors">
                <td className="py-2.5 pr-3">
                  <div className="flex items-center gap-3">
                    {/* Couverture Desktop */}
                    <div className="w-10 h-14 rounded-md overflow-hidden bg-navy/5 border border-border flex-shrink-0 flex items-center justify-center shadow-xs">
                      {item.cover_url ? (
                        <img
                          src={item.cover_url}
                          alt={item.book_title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <BookOpen className="w-4 h-4 text-gold/70" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="font-medium text-foreground line-clamp-1">
                        {item.book_title}
                      </p>
                      {item.author_display && (
                        <p className="text-[11px] text-foreground-muted line-clamp-1">
                          {item.author_display}
                        </p>
                      )}
                      {item.isbn && (
                        <p className="text-[10px] text-foreground-muted font-mono">
                          ISBN : {item.isbn}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-2.5 pr-3 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-navy/5 text-navy border border-navy/10">
                    {getFormatIcon(item.format)}
                    {getFormatLabel(item.format)}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-center font-mono font-medium text-foreground">
                  {item.quantity}
                </td>
                <td className="py-2.5 px-3 text-right font-mono text-foreground-muted">
                  {item.unit_price.toLocaleString("fr-FR")} FCFA
                </td>
                <td className="py-2.5 pl-3 text-right font-mono font-bold text-navy">
                  {item.subtotal.toLocaleString("fr-FR")} FCFA
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
