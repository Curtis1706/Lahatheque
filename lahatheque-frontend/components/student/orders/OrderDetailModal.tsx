"use client";

import React, { useEffect } from "react";
import { X, Printer, BookOpen, MapPin, ShoppingBag, ShieldCheck, Download } from "lucide-react";
import { toast } from "sonner";
import { StudentOrder } from "@/lib/types/student-orders";
import { useAuth } from "@/hooks/use-auth";

interface OrderDetailModalProps {
  order: StudentOrder | null;
  isOpen: boolean;
  onClose: () => void;
}

export function OrderDetailModal({ order, isOpen, onClose }: OrderDetailModalProps) {
  const { user } = useAuth();

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
    const orderRef = `#${order.id.slice(0, 8).toUpperCase()}`;
    const filename = `facture_LAHA_${orderRef.replace("#", "")}.pdf`;

    // Téléchargement direct de la facture officielle certifiée générée par le backend (identique à celle jointe à l'email)
    try {
      const res = await fetch(`/api/bff/commerce/orders/${order.id}/invoice/`, {
        method: "GET",
        credentials: "include",
        headers: { Accept: "application/pdf" },
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success("Facture PDF officielle téléchargée avec succès !");
        return;
      }
      throw new Error("Échec du serveur");
    } catch (apiErr) {
      console.error("[OrderDetailModal] Erreur de téléchargement de la facture:", apiErr);
      toast.error("Impossible de télécharger la facture officielle pour le moment.");
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
