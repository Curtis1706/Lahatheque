"use client";

import React, { useState } from "react";
import { BookOpen, FileText, Eye, ShieldCheck, Tag, X, ExternalLink } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import type { WholesalerBookItem } from "@/lib/types/wholesaler";

interface BookPreviewModalProps {
  book: WholesalerBookItem | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (book: WholesalerBookItem) => void;
}

export function BookPreviewModal({
  book,
  isOpen,
  onClose,
  onAddToCart,
}: BookPreviewModalProps) {
  const [activeTab, setActiveTab] = useState<"metadata" | "excerpt">("metadata");

  if (!book) return null;

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-navy font-serif font-bold text-base">
          <BookOpen className="w-5 h-5 text-gold" />
          Aperçu &amp; Extrait d&apos;Ouvrage Grossiste
        </div>
      }
      maxWidth={650}
    >
      <div className="space-y-5 pt-2">
        {/* Navigation Onglets Aperçu vs Extrait */}
        <div className="flex items-center gap-2 border-b border-border pb-2">
          <button
            type="button"
            onClick={() => setActiveTab("metadata")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              activeTab === "metadata"
                ? "bg-navy text-white"
                : "bg-background-secondary text-foreground-muted hover:text-navy"
            }`}
          >
            Métadonnées &amp; Tarifs Grossiste
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("excerpt")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
              activeTab === "excerpt"
                ? "bg-navy text-white"
                : "bg-background-secondary text-foreground-muted hover:text-navy"
            }`}
          >
            <Eye className="w-3.5 h-3.5 text-gold" />
            Consulter Extrait Spécimen
          </button>
        </div>

        {/* Tab 1: Métadonnées & Tarifs */}
        {activeTab === "metadata" && (
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-start">
            <div className="sm:col-span-4 space-y-3">
              <img
                src={book.cover_url}
                alt={book.title}
                className="w-full aspect-[3/4] object-cover rounded-2xl border border-border shadow-md"
              />
              <div className="p-3 rounded-2xl bg-gold/15 text-gold text-center text-xs font-bold border border-gold/30">
                Discipline : {book.discipline}
              </div>
            </div>

            <div className="sm:col-span-8 space-y-4 text-xs">
              <div>
                <h3 className="font-serif font-bold text-navy text-lg leading-snug">{book.title}</h3>
                <p className="text-foreground-muted mt-0.5">Auteurs : <span className="font-semibold text-navy">{book.authors.join(", ")}</span></p>
                <p className="text-foreground-muted font-mono text-[11px] mt-0.5">Éditeur : {book.publisher_name}</p>
              </div>

              {/* Grille des tarifs de gros */}
              <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-background-secondary border border-border">
                <div className="p-2 bg-background rounded-xl border border-border text-center">
                  <span className="text-[10px] text-foreground-muted uppercase font-bold block">Tarif Licences Numériques</span>
                  <span className="font-mono font-bold text-gold text-sm">{book.digital_wholesale_price.toLocaleString("fr-FR")} XOF</span>
                  <span className="text-[9px] text-foreground-muted block line-through">Prix Public: {book.public_price.toLocaleString("fr-FR")} XOF</span>
                </div>
                <div className="p-2 bg-background rounded-xl border border-border text-center">
                  <span className="text-[10px] text-foreground-muted uppercase font-bold block">Tarif Exemplaires Papier</span>
                  <span className="font-mono font-bold text-gold text-sm">{book.print_wholesale_price.toLocaleString("fr-FR")} XOF</span>
                  <span className="text-[9px] text-emerald-600 font-bold block">Stock Dispo: {book.stock_available_print} ex.</span>
                </div>
              </div>

              <div>
                <span className="text-foreground-muted text-[10px] uppercase font-bold block mb-1">Résumé de l&apos;Ouvrage</span>
                <p className="p-3 rounded-2xl bg-background-secondary border border-border text-foreground leading-relaxed italic text-[11px]">
                  &ldquo;{book.summary}&rdquo;
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Extrait spécimen / Aperçu PDF */}
        {activeTab === "excerpt" && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-navy/5 border border-navy/20 text-xs text-navy flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-gold" />
                <span>Extrait gratuit réservé aux grossistes partenaires</span>
              </div>
              {book.sample_excerpt_url && (
                <a
                  href={book.sample_excerpt_url}
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-gold hover:underline flex items-center gap-1"
                >
                  Ouvrir en plein écran <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            <div className="w-full h-80 rounded-2xl bg-background-secondary border border-border flex items-center justify-center text-center p-6 space-y-3">
              <div>
                <BookOpen className="w-10 h-10 text-gold mx-auto mb-2" />
                <p className="font-serif font-bold text-navy text-sm">Visionneuse d&apos;Extrait LAHAThèque</p>
                <p className="text-xs text-foreground-muted max-w-sm mt-1">
                  Feuilletez les premières pages de l&apos;ouvrage pour évaluer le contenu avant votre commande groupée.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-foreground-muted hover:text-navy"
          >
            Fermer
          </button>
          <button
            type="button"
            onClick={() => {
              onAddToCart(book);
              onClose();
            }}
            className="px-5 py-2.5 rounded-xl bg-gold text-navy text-xs font-bold hover:bg-gold-light transition-colors flex items-center gap-2 shadow-xs"
          >
            <BookOpen className="w-4 h-4" />
            Ajouter au Panier Groupé
          </button>
        </div>
      </div>
    </Modal>
  );
}
