"use client";

import React, { useEffect } from "react";
import { X, Printer, BookOpen, MapPin, ShoppingBag, ShieldCheck, Download } from "lucide-react";
import { toast } from "sonner";
import { StudentOrder } from "@/lib/types/student-orders";
import { generateOfficialPdf } from "@/lib/services/export-service";

interface OrderDetailModalProps {
  order: StudentOrder | null;
  isOpen: boolean;
  onClose: () => void;
}

export function OrderDetailModal({ order, isOpen, onClose }: OrderDetailModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !order) return null;

  const totalNumber = typeof order.total_amount === "string" ? parseFloat(order.total_amount) : order.total_amount;
  const subtotal = totalNumber / 1.18; // Simulating 18% VAT included
  const vat = totalNumber - subtotal;

  const handleDownloadPdf = async () => {
    try {
      const orderRef = `#${order.id.slice(0, 8).toUpperCase()}`;
      await generateOfficialPdf({
        docType: "FACTURE",
        docNumber: orderRef,
        date: new Date(order.created_at).toLocaleDateString("fr-FR"),
        recipient: {
          name: "Client / Apprenant LAHAThèque",
          roleOrTitle: "Compte Lecteur Particulier",
          addressOrCampus: order.livraison ? `${order.livraison.shipping_address}, ${order.livraison.city}` : "Livraison Numérique Instantanée",
          emailOrPhone: order.livraison?.carrier_name ? `Transporteur : ${order.livraison.carrier_name}` : "contact@lahatheque.bj",
        },
        summaryCards: [
          { label: "Articles", value: `${order.lignes?.length || 0} ouvrage(s)` },
          { label: "Mode Livraison", value: order.livraison?.carrier_name || "Numérique Instantané" },
          { label: "Paiement", value: order.statut_paiement === "paid" ? "Payé (Mobile Money)" : "En attente" },
        ],
        tableHeaders: ["Réf.", "Titre de l'Ouvrage", "Format", "Qté", "Prix Unitaire", "Total"],
        tableRows: (order.lignes || []).map((l, idx) => [
          `ART-${idx + 1}`,
          l.ouvrage_title,
          l.format_type === "paper" ? "Livre Papier" : "Numérique",
          `${l.quantity} ex.`,
          `${Number(l.unit_price).toLocaleString("fr-FR")} FCFA`,
          `${(Number(l.unit_price) * l.quantity).toLocaleString("fr-FR")} FCFA`,
        ]),
        totalAmount: `${totalNumber.toLocaleString("fr-FR")} FCFA`,
        totalNotes: "Facture et reçu de paiement certifiés LAHAThèque. Conforme aux normes UEMOA.",
        filename: `facture_LAHA_${orderRef.replace("#", "")}.pdf`,
      });
      toast.success("Facture PDF officielle générée avec succès !");
    } catch {
      toast.error("Erreur lors du téléchargement de la facture.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-dark/70 animate-in fade-in duration-200">
      <div className="bg-background border border-border w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-border bg-background-secondary flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-navy text-gold rounded-xl border border-navy-hover">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-navy">Reçu de Commande #{order.id.substring(0, 12)}</h2>
              <p className="text-xs text-foreground-muted">
                Émis le {new Date(order.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-foreground-muted hover:text-navy hover:bg-background rounded-full transition-colors cursor-pointer"
            aria-label="Fermer la modale"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
          
          {/* Status & Payment badge */}
          <div className="flex items-center justify-between bg-navy/5 border border-navy/10 p-4 rounded-2xl">
            <div>
              <span className="text-foreground-muted block text-[10px]">Statut du paiement</span>
              <span className="font-bold text-navy uppercase">{order.statut_paiement}</span>
            </div>
            <div className="text-right">
              <span className="text-foreground-muted block text-[10px]">Statut commande</span>
              <span className="font-bold text-navy uppercase">{order.statut_commande}</span>
            </div>
          </div>

          {/* Delivery section if physical */}
          {order.livraison && (
            <div className="border border-border p-4 rounded-2xl bg-background-secondary space-y-2">
              <div className="flex items-center gap-2 font-bold text-navy">
                <MapPin className="w-4 h-4 text-gold" />
                <span>Adresse de Livraison</span>
              </div>
              <p className="text-foreground leading-relaxed">
                {order.livraison.shipping_address}<br />
                {order.livraison.city}, {order.livraison.country}
              </p>
              {order.livraison.tracking_number && (
                <div className="mt-2 pt-2 border-t border-border flex items-center justify-between">
                  <span className="text-foreground-muted">Numéro de suivi :</span>
                  <span className="font-mono font-bold text-navy">{order.livraison.tracking_number}</span>
                </div>
              )}
            </div>
          )}

          {/* Items list */}
          <div className="space-y-3">
            <h3 className="font-bold text-navy font-serif">Articles commandés ({order.lignes?.length || 0})</h3>
            <div className="divide-y divide-border border border-border rounded-2xl overflow-hidden bg-background">
              {order.lignes?.map((item) => (
                <div key={item.id} className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-10 bg-navy/10 rounded border border-border flex items-center justify-center shrink-0">
                      <BookOpen className="w-4 h-4 text-navy" />
                    </div>
                    <div>
                      <h4 className="font-bold text-navy">{item.ouvrage_title}</h4>
                      <span className="text-[10px] text-foreground-muted">Format: {item.format_type === "paper" ? "Livre Papier" : "Numérique"} · Qté: {item.quantity}</span>
                    </div>
                  </div>
                  <div className="text-right font-bold text-navy">
                    {(Number(item.unit_price) * item.quantity).toLocaleString("fr-FR")} FCFA
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals Calculation */}
          <div className="border-t border-border pt-4 space-y-2 text-right">
            <div className="flex justify-between text-foreground-muted">
              <span>Sous-total HT</span>
              <span>{Math.round(subtotal).toLocaleString("fr-FR")} FCFA</span>
            </div>
            <div className="flex justify-between text-foreground-muted">
              <span>TVA (18%)</span>
              <span>{Math.round(vat).toLocaleString("fr-FR")} FCFA</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-navy border-t border-border pt-2">
              <span>Total TTC</span>
              <span className="text-gold font-serif">{totalNumber.toLocaleString("fr-FR")} FCFA</span>
            </div>
          </div>

        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 border-t border-border bg-background-secondary flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-[11px] text-foreground-muted">
            <ShieldCheck className="w-4 h-4 text-success shrink-0" />
            Document officiel LAHA Éditions
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-4 py-2.5 rounded-xl border border-border hover:bg-background text-navy font-bold flex items-center gap-2 transition-colors cursor-pointer min-h-[44px]"
            >
              <Printer className="w-4 h-4" />
              Imprimer
            </button>
            <button
              onClick={handleDownloadPdf}
              className="px-4 py-2.5 rounded-xl bg-navy hover:bg-navy-hover text-white font-bold flex items-center gap-2 transition-colors shadow cursor-pointer min-h-[44px]"
            >
              <Download className="w-4 h-4 text-gold" />
              Télécharger Reçu
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
