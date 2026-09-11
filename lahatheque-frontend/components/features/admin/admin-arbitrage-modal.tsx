"use client";

import React, { useState, useEffect } from "react";
import {
  Scale,
  X,
  Warehouse,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Eye,
  EyeOff,
  PackagePlus,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { InlineLoader } from "@/components/ui/page-loader";
import { BookCover3D } from "@/components/ui/book-cover-3d";
import { StatusBadge } from "@/components/ui/status-badge";
import { arbitrateEscalation } from "@/lib/services/manager";
import type { EscalatedOutage, AdminOutageStatus } from "@/lib/types/manager";
import { toast } from "sonner";

interface AdminArbitrageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  outage: EscalatedOutage | null;
}

export function AdminArbitrageModal({
  isOpen,
  onClose,
  onSuccess,
  outage,
}: AdminArbitrageModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<AdminOutageStatus>("acknowledged");
  const [adminNote, setAdminNote] = useState("");
  const [paperSaleToggle, setPaperSaleToggle] = useState<boolean>(true);
  const [enableRestock, setEnableRestock] = useState(false);
  const [restockQuantity, setRestockQuantity] = useState<string>("200");
  const [restockRef, setRestockRef] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (outage) {
      setSelectedStatus(
        outage.admin_status === "reported" ? "acknowledged" : outage.admin_status
      );
      setAdminNote(outage.admin_note || "");
      setPaperSaleToggle(outage.is_paper_available !== false);
      setEnableRestock(false);
      setRestockRef(`TIRAGE-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
      setError(null);
    }
  }, [outage]);

  if (!isOpen || !outage) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let parsedQty: number | undefined = undefined;
    if (enableRestock) {
      const q = parseFloat(restockQuantity);
      if (isNaN(q) || q <= 0) {
        setError("Veuillez saisir une quantité de réassort strictement positive.");
        return;
      }
      parsedQty = q;
    }

    try {
      setSubmitting(true);
      await arbitrateEscalation({
        id: outage.id,
        stock_id: outage.stock_id,
        admin_status: selectedStatus,
        admin_note: adminNote.trim(),
        is_paper_available: paperSaleToggle,
        restock_quantity: parsedQty,
        reference_document: enableRestock ? (restockRef.trim() || undefined) : undefined,
      });

      toast.success("Décision d'arbitrage enregistrée avec succès.");
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || "Erreur lors de l'enregistrement de l'arbitrage.");
    } finally {
      setSubmitting(false);
    }
  };

  const coverUrl =
    outage.cover_url ||
    (outage.book_id ? `/api/bff/catalog/books/${outage.book_id}/cover/` : undefined);

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 overflow-hidden"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label="Arbitrage exécutif de la rupture"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="bg-background border border-border rounded-2xl shadow-xl w-full max-w-xl overflow-hidden flex flex-col max-h-[min(92dvh,740px)]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 sm:p-6 pb-4 border-b border-border/50 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gold/10 border border-gold/20 text-gold">
                <Scale className="w-5 h-5 text-gold" />
              </div>
              <div>
                <h2 className="font-serif font-bold text-navy text-base sm:text-lg">
                  Arbitrage Exécutif de la Rupture
                </h2>
                <p className="text-xs text-foreground-muted">
                  Décision administrative sur l&apos;alerte remontée par le hub
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-background-secondary transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer text-foreground-muted hover:text-navy"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Formulaire & Corps */}
          <form onSubmit={handleSubmit} className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-6 space-y-5 text-xs">
            {/* Carte Récapitulative Ouvrage */}
            <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-background-secondary border border-border">
              <BookCover3D
                title={outage.book_title}
                authors={outage.authors}
                discipline={outage.discipline}
                coverUrl={coverUrl}
                size="xs"
                interactive={false}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <StatusBadge status={outage.admin_status} />
                  <span className="text-[10px] text-foreground-muted flex items-center gap-1 font-medium">
                    <Warehouse className="w-3 h-3 text-gold shrink-0" />
                    {outage.warehouse_nom || outage.warehouse}
                  </span>
                </div>
                <h4 className="font-serif font-bold text-navy text-sm leading-snug line-clamp-2">
                  {outage.book_title}
                </h4>
                {outage.isbn && outage.isbn !== "—" && (
                  <p className="text-[10px] text-foreground-muted font-mono mt-0.5">
                    ISBN : {outage.isbn}
                  </p>
                )}
                {outage.current_quantity !== undefined && (
                  <p className="text-[11px] text-foreground-muted mt-1">
                    Stock actuel :{" "}
                    <strong className={outage.current_quantity === 0 ? "text-error font-bold" : "text-navy"}>
                      {outage.current_quantity} ex.
                    </strong>{" "}
                    {outage.seuil_alerte ? `(seuil d'alerte : ${outage.seuil_alerte} ex.)` : ""}
                  </p>
                )}
              </div>
            </div>

            {/* Signalement Gestionnaire */}
            <div className="p-3.5 rounded-xl bg-error/5 border border-error/20 space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-error flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  Signalé par {outage.reported_by}
                </span>
                <span className="text-foreground-muted font-mono text-[10px]">
                  {new Date(outage.reported_at).toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
              <p className="text-xs text-foreground bg-background p-2.5 rounded-lg border border-border italic leading-relaxed">
                « {outage.impact_description} »
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-error/10 border border-error/20 text-error text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* 1. Sélection du Statut d'Arbitrage */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-navy uppercase tracking-wider">
                1. Décision de qualification du statut *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  {
                    status: "acknowledged" as AdminOutageStatus,
                    label: "Prise en compte",
                    desc: "Dossier ouvert, arbitrage en cours d'étude.",
                    icon: Clock,
                  },
                  {
                    status: "in_reprint" as AdminOutageStatus,
                    label: "En réimpression",
                    desc: "Bon de tirage ou commande lancée à l'imprimerie.",
                    icon: Scale,
                  },
                  {
                    status: "resolved" as AdminOutageStatus,
                    label: "Résolue",
                    desc: "Stock complété ou situation régularisée.",
                    icon: CheckCircle2,
                  },
                ].map((opt) => {
                  const Icon = opt.icon;
                  const isSelected = selectedStatus === opt.status;
                  return (
                    <button
                      key={opt.status}
                      type="button"
                      onClick={() => setSelectedStatus(opt.status)}
                      className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer min-h-[82px] ${
                        isSelected
                          ? "border-gold bg-gold/10 shadow-xs"
                          : "border-border bg-background hover:border-gold/40"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-bold ${isSelected ? "text-navy" : "text-foreground"}`}>
                          {opt.label}
                        </span>
                        <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-gold" : "text-foreground-muted"}`} />
                      </div>
                      <p className="text-[10px] text-foreground-muted leading-tight">
                        {opt.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Régulation de la Disponibilité Vitrine Papier */}
            <div className="p-3.5 rounded-xl bg-background-secondary border border-border space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-navy flex items-center gap-1.5">
                    {paperSaleToggle ? (
                      <Eye className="w-4 h-4 text-success" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-error" />
                    )}
                    Disponibilité en Vitrine Publique
                  </h4>
                  <p className="text-[11px] text-foreground-muted mt-0.5">
                    Autoriser ou suspendre la commande de la version papier sur la boutique en ligne.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPaperSaleToggle(!paperSaleToggle)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer min-h-[36px] ${
                    paperSaleToggle
                      ? "bg-success/10 text-success border-success/30 hover:bg-success/20"
                      : "bg-error/10 text-error border-error/30 hover:bg-error/20"
                  }`}
                >
                  {paperSaleToggle ? "Vente papier Active" : "Vente papier Suspendue"}
                </button>
              </div>
              {!paperSaleToggle && (
                <p className="text-[10px] text-error font-medium">
                  Important : En suspendant la vente papier, les clients ne pourront pas commander ce livre papier tant que le stock n&apos;est pas rétabli.
                </p>
              )}
            </div>

            {/* 3. Option Réapprovisionnement Immédiat */}
            <div className="p-3.5 rounded-xl bg-background-secondary border border-border space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={enableRestock}
                    onChange={(e) => setEnableRestock(e.target.checked)}
                    className="rounded border-border text-navy focus:ring-gold"
                  />
                  <span className="text-xs font-bold text-navy flex items-center gap-1">
                    <PackagePlus className="w-3.5 h-3.5 text-gold" />
                    Enregistrer une réception de stock immédiate
                  </span>
                </label>
                {enableRestock && (
                  <span className="text-[10px] text-success font-semibold">
                    Statut automatique : Résolue
                  </span>
                )}
              </div>

              {enableRestock && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/60">
                  <div>
                    <label className="block text-[11px] font-semibold text-navy mb-1">
                      Quantité reçue *
                    </label>
                    <input
                      type="number"
                      step="any"
                      min={1}
                      value={restockQuantity}
                      onChange={(e) => setRestockQuantity(e.target.value)}
                      placeholder="Ex: 100, 300"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background focus:outline-none focus:border-gold font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-navy mb-1">
                      Référence bon de livraison / tirage
                    </label>
                    <input
                      type="text"
                      value={restockRef}
                      onChange={(e) => setRestockRef(e.target.value)}
                      placeholder="Ex: TIRAGE-2026-009"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background focus:outline-none focus:border-gold font-mono"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 4. Consigne Administrative / Note de Décision */}
            <div>
              <label htmlFor="admin-note" className="block text-xs font-semibold text-navy mb-1">
                Instruction administrative / Note de décision
              </label>
              <textarea
                id="admin-note"
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Ex: Bon de commande 300 ex envoyé à l'imprimerie GraphiPlus. Réception estimée le 18 septembre..."
                rows={3}
                className="w-full px-3.5 py-2 rounded-xl border border-border bg-background focus:outline-none focus:border-gold text-foreground text-xs resize-none placeholder:text-foreground-muted"
              />
              <p className="text-[10px] text-foreground-muted mt-1">
                Cette note sera transmise au gestionnaire de hub ayant remonté l&apos;alerte.
              </p>
            </div>

            {/* Boutons Footer */}
            <div className="pt-3 border-t border-border flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2.5 rounded-xl border border-border text-xs font-semibold text-foreground-muted hover:text-navy hover:border-navy transition-colors min-h-[44px] cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy/90 transition-colors flex items-center gap-2 min-h-[44px] cursor-pointer shadow-xs"
              >
                {submitting ? (
                  <InlineLoader size={16} />
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4 text-gold" />
                    Enregistrer la Décision d&apos;Arbitrage
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
