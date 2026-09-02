"use client";

import React, { useState } from "react";
import { Truck, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { ManagerOrder } from "@/lib/types/manager";
import { InlineLoader } from "@/components/ui/page-loader";

interface ShipOrderModalProps {
  order: ManagerOrder;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (carrier: string, trackingNumber: string) => Promise<void>;
}

export function ShipOrderModal({ order, isOpen, onClose, onConfirm }: ShipOrderModalProps) {
  const [carrier, setCarrier] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ carrier?: string; tracking?: string }>({});

  const validate = (): boolean => {
    const newErrors: { carrier?: string; tracking?: string } = {};
    if (!carrier.trim()) newErrors.carrier = "Le transporteur est obligatoire";
    if (!trackingNumber.trim()) newErrors.tracking = "Le numéro de suivi est obligatoire";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await onConfirm(carrier.trim(), trackingNumber.trim());
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        onClick={onClose}
        onKeyDown={handleKeyDown}
        role="dialog"
        aria-modal="true"
        aria-label="Confirmer l'expédition"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="bg-background border border-border rounded-2xl shadow-lg w-full max-w-md p-6 space-y-5"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-navy-light">
                <Truck className="w-5 h-5 text-gold" />
              </div>
              <div>
                <h2 className="font-serif font-bold text-navy text-base">Confirmer l&apos;expédition</h2>
                <p className="text-xs text-foreground-muted">Commande {order.id}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-background-secondary transition-colors"
              title="Fermer"
            >
              <X className="w-4 h-4 text-foreground-muted" />
            </button>
          </div>

          {/* Résumé commande */}
          <div className="bg-background-secondary p-3 rounded-xl border border-border text-xs space-y-1">
            <p className="text-foreground-muted">Destinataire : <span className="font-semibold text-foreground">{order.customer_name}</span></p>
            <p className="text-foreground-muted">Adresse : <span className="text-foreground">{order.shipping_address}, {order.city}</span></p>
            <p className="text-foreground-muted">{order.items.length} article{order.items.length > 1 ? "s" : ""}</p>
          </div>

          {/* Formulaire */}
          <div className="space-y-3">
            <div>
              <label htmlFor="carrier" className="block text-xs font-semibold text-navy mb-1">
                Transporteur *
              </label>
              <input
                id="carrier"
                type="text"
                value={carrier}
                onChange={(e) => { setCarrier(e.target.value); setErrors((p) => ({ ...p, carrier: undefined })); }}
                placeholder="Ex: DHL Express Bénin, La Poste Bénin..."
                className={`w-full px-3 py-2 text-xs rounded-xl border ${errors.carrier ? "border-error" : "border-border"} bg-background focus:outline-none focus:border-gold text-foreground placeholder:text-foreground-muted min-h-[40px]`}
                autoFocus
              />
              {errors.carrier && <p className="text-[10px] text-error mt-0.5">{errors.carrier}</p>}
            </div>
            <div>
              <label htmlFor="tracking" className="block text-xs font-semibold text-navy mb-1">
                Numéro de suivi *
              </label>
              <input
                id="tracking"
                type="text"
                value={trackingNumber}
                onChange={(e) => { setTrackingNumber(e.target.value); setErrors((p) => ({ ...p, tracking: undefined })); }}
                placeholder="Ex: DHL-BJ-20260810-4421"
                className={`w-full px-3 py-2 text-xs rounded-xl border ${errors.tracking ? "border-error" : "border-border"} bg-background focus:outline-none focus:border-gold text-foreground placeholder:text-foreground-muted min-h-[40px]`}
              />
              {errors.tracking && <p className="text-[10px] text-error mt-0.5">{errors.tracking}</p>}
            </div>
          </div>

          {/* Info */}
          <p className="text-[10px] text-foreground-muted">
            Le client recevra automatiquement un e-mail de notification d&apos;expédition avec le numéro de suivi.
          </p>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-border text-xs font-semibold text-foreground-muted hover:text-navy hover:border-navy transition-colors min-h-[44px]"
            >
              Annuler
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors flex items-center justify-center gap-2 disabled:opacity-50 min-h-[44px]"
            >
              {loading ? (
                <InlineLoader size={16} />
              ) : (
                <>
                  <Truck className="w-4 h-4" />
                  Confirmer l&apos;expédition
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
