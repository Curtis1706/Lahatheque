"use client";

import React, { useState } from "react";
import { AdminOrder } from "@/lib/types/admin";
import {
  confirmManualOrderPayment,
  verifyOnlineOrderPayment,
  remindAbandonedOrder,
} from "@/lib/services/admin";
import {
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Mail,
  Receipt,
  CreditCard,
  Building2,
  Banknote,
  PhoneCall,
  FileText,
  Clock,
  User,
} from "lucide-react";
import { toast } from "sonner";

interface OrderActionModalProps {
  order: AdminOrder;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function OrderActionModal({
  order,
  isOpen,
  onClose,
  onSuccess,
}: OrderActionModalProps) {
  const [activeTab, setActiveTab] = useState<"details" | "manual_pay" | "verify_moneroo">("details");
  const [manualMode, setManualMode] = useState<string>("especes");
  const [manualRef, setManualRef] = useState<string>("");
  const [submittingManual, setSubmittingManual] = useState<boolean>(false);
  const [verifyingMoneroo, setVerifyingMoneroo] = useState<boolean>(false);
  const [sendingReminder, setSendingReminder] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const isPaid = order.statut_paiement === "paid";
  const isAbandoned = order.statut_paiement === "abandoned";
  const isPending = order.statut_paiement === "pending";
  const isCredit = order.is_credit_purchase || order.statut_paiement === "credit";

  const handleManualPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualRef.trim()) {
      setErrorMsg("Veuillez saisir un numéro de référence ou reçu de caisse.");
      return;
    }

    try {
      setSubmittingManual(true);
      setErrorMsg(null);

      const res = await confirmManualOrderPayment(order.id, {
        mode_paiement: manualMode,
        reference_paiement: manualRef.trim(),
      });

      if (res.success) {
        toast.success(res.message || "Paiement validé avec succès.");
        onSuccess();
        onClose();
      } else {
        setErrorMsg(res.error || "Erreur lors de la validation manuelle.");
      }
    } catch {
      setErrorMsg("Erreur de connexion au serveur.");
    } finally {
      setSubmittingManual(false);
    }
  };

  const handleVerifyMoneroo = async () => {
    try {
      setVerifyingMoneroo(true);
      setErrorMsg(null);

      const res = await verifyOnlineOrderPayment(order.id, order.moneroo_id || undefined);

      if (res.success) {
        toast.success("Vérification Moneroo : paiement confirmé et validé.");
        onSuccess();
        onClose();
      } else {
        toast.error(res.error || "Paiement non encore encaissé sur la passerelle.");
      }
    } catch {
      toast.error("Impossible de contacter la passerelle Moneroo.");
    } finally {
      setVerifyingMoneroo(false);
    }
  };

  const handleSendReminder = async () => {
    try {
      setSendingReminder(true);
      setErrorMsg(null);

      const res = await remindAbandonedOrder(order.id);

      if (res.success) {
        toast.success(res.message || "Email de relance envoyé au client.");
        onSuccess();
      } else {
        toast.error(res.error || "Échec de l'envoi de la relance.");
      }
    } catch {
      toast.error("Erreur lors de l'envoi de la relance.");
    } finally {
      setSendingReminder(false);
    }
  };

  const formatAmount = (val: number) => {
    return `${val.toLocaleString("fr-FR")} ${order.currency || "FCFA"}`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-background border border-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-background-secondary/30">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-lg font-bold text-foreground">
                Commande {order.order_reference}
              </h2>
              <span
                className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                  isPaid
                    ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                    : isAbandoned
                    ? "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                    : isCredit
                    ? "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                    : "bg-muted text-muted-foreground border border-border"
                }`}
              >
                {order.statut_paiement_display || order.statut_paiement}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Client : {order.customer_name} ({order.customer_email})
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-background-secondary"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation des onglets */}
        <div className="flex border-b border-border px-6 gap-2 bg-background">
          <button
            type="button"
            onClick={() => setActiveTab("details")}
            className={`py-3 px-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "details"
                ? "border-gold text-gold font-semibold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileText className="w-4 h-4" />
            Articles & Synthèse
          </button>

          {!isPaid && (
            <>
              <button
                type="button"
                onClick={() => setActiveTab("manual_pay")}
                className={`py-3 px-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeTab === "manual_pay"
                    ? "border-gold text-gold font-semibold"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Banknote className="w-4 h-4" />
                Validation manuelle
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("verify_moneroo")}
                className={`py-3 px-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeTab === "verify_moneroo"
                    ? "border-gold text-gold font-semibold"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <RefreshCw className="w-4 h-4" />
                Vérification passerelle
              </button>
            </>
          )}
        </div>

        {/* Corps de la modale */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {errorMsg && (
            <div className="flex items-start gap-3 p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Onglet Détails */}
          {activeTab === "details" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg border border-border bg-background-secondary/20">
                  <span className="text-[11px] text-muted-foreground block">Montant Total</span>
                  <span className="text-sm font-semibold text-foreground font-poppins">
                    {formatAmount(order.total_amount)}
                  </span>
                </div>
                <div className="p-3 rounded-lg border border-border bg-background-secondary/20">
                  <span className="text-[11px] text-muted-foreground block">Mode sélectionné</span>
                  <span className="text-xs font-medium text-foreground">
                    {order.mode_paiement_display || order.mode_paiement}
                  </span>
                </div>
                <div className="p-3 rounded-lg border border-border bg-background-secondary/20">
                  <span className="text-[11px] text-muted-foreground block">Date de création</span>
                  <span className="text-xs text-foreground">
                    {new Date(order.created_at).toLocaleDateString("fr-FR")}
                  </span>
                </div>
                <div className="p-3 rounded-lg border border-border bg-background-secondary/20">
                  <span className="text-[11px] text-muted-foreground block">Dernière relance</span>
                  <span className="text-xs text-foreground">
                    {order.last_reminder_sent_at
                      ? new Date(order.last_reminder_sent_at).toLocaleDateString("fr-FR")
                      : "Aucune"}
                  </span>
                </div>
              </div>

              {/* Référence manuelle ou passerelle si existante */}
              {(order.manual_payment_reference || order.moneroo_id) && (
                <div className="p-3 rounded-lg border border-border bg-background-secondary/10 space-y-1">
                  <span className="text-xs font-medium text-muted-foreground">Trace d'audit :</span>
                  {order.manual_payment_reference && (
                    <div className="text-xs text-foreground flex items-center gap-2">
                      <Receipt className="w-3.5 h-3.5 text-gold" />
                      <span>Réf. manuelle : <strong>{order.manual_payment_reference}</strong></span>
                      {order.manual_payment_confirmed_by && (
                        <span className="text-muted-foreground">({order.manual_payment_confirmed_by})</span>
                      )}
                    </div>
                  )}
                  {order.moneroo_id && (
                    <div className="text-xs text-foreground flex items-center gap-2">
                      <CreditCard className="w-3.5 h-3.5 text-gold" />
                      <span>ID Moneroo : <strong>{order.moneroo_id}</strong></span>
                    </div>
                  )}
                </div>
              )}

              {/* Liste des articles */}
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Articles commandés ({order.items?.length || 0})
                </h4>
                <div className="border border-border rounded-lg divide-y divide-border overflow-hidden">
                  {order.items && order.items.length > 0 ? (
                    order.items.map((it, idx) => (
                      <div key={it.id || idx} className="p-3 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-medium text-foreground">{it.book_title}</p>
                          <p className="text-muted-foreground text-[11px]">
                            Format: {it.format} &bull; Qté: {it.quantity} &times; {formatAmount(it.unit_price)}
                          </p>
                        </div>
                        <span className="font-semibold text-foreground">
                          {formatAmount(it.total_price)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-xs text-muted-foreground">
                      Aucun détail d'article disponible pour cette commande.
                    </div>
                  )}
                </div>
              </div>

              {/* Action de relance email si non payée */}
              {!isPaid && (
                <div className="pt-2 flex items-center justify-between p-3 rounded-lg border border-gold/30 bg-gold/5">
                  <div>
                    <p className="text-xs font-medium text-foreground">Relance client par email</p>
                    <p className="text-[11px] text-muted-foreground">
                      Transmet un rappel bienveillant avec le lien direct de finalisation au client.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSendReminder}
                    disabled={sendingReminder}
                    className="px-3 py-1.5 bg-gold text-navy font-medium text-xs rounded-lg hover:bg-gold-hover transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {sendingReminder ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Mail className="w-3.5 h-3.5" />
                    )}
                    Relancer le client
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Onglet Validation manuelle */}
          {activeTab === "manual_pay" && !isPaid && (
            <form onSubmit={handleManualPayment} className="space-y-4">
              <div className="p-3 rounded-lg bg-navy/5 border border-navy/10 text-xs text-foreground space-y-1">
                <p className="font-medium">Encaissement guichet ou virement direct</p>
                <p className="text-muted-foreground text-[11px]">
                  Utilisez cette console pour consigner un règlement reçu en espèces au siège,
                  un transfert direct Mobile Money sur flotte commerciale, un chèque ou un virement bancaire.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  Mode de règlement constaté *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "especes", label: "Espèces (Comptoir)", icon: Banknote },
                    { id: "momo_direct", label: "MoMo Direct (Flotte)", icon: PhoneCall },
                    { id: "virement", label: "Virement bancaire", icon: Building2 },
                    { id: "cheque", label: "Chèque", icon: Receipt },
                  ].map((m) => {
                    const Icon = m.icon;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setManualMode(m.id)}
                        className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs text-left transition-all ${
                          manualMode === m.id
                            ? "border-gold bg-gold/10 text-gold font-medium"
                            : "border-border hover:bg-background-secondary text-foreground"
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1">
                  Référence d'encaissement ou reçu de caisse *
                </label>
                <input
                  type="text"
                  value={manualRef}
                  onChange={(e) => setManualRef(e.target.value)}
                  placeholder="Ex: RECU-2026-0042 ou SMS MT-94827591"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-border bg-background focus:outline-hidden focus:border-gold"
                  required
                />
                <span className="text-[11px] text-muted-foreground mt-1 block">
                  Numéro de reçu physique, référence du virement ou ID de transaction opérateur.
                </span>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-border">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium border border-border rounded-lg hover:bg-background-secondary text-foreground transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submittingManual}
                  className="px-4 py-2 text-xs font-semibold bg-gold text-navy rounded-lg hover:bg-gold-hover transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submittingManual ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  Confirmer l'encaissement ({formatAmount(order.total_amount)})
                </button>
              </div>
            </form>
          )}

          {/* Onglet Vérification passerelle Moneroo */}
          {activeTab === "verify_moneroo" && !isPaid && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg border border-border bg-background-secondary/20 space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                  <CreditCard className="w-4 h-4 text-gold" />
                  <span>Passerelle de paiement en ligne (Moneroo)</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Interrogez directement l'API Moneroo pour vérifier si le client a validé
                  sa transaction sur son téléphone mais que le webhook n'a pas encore été reçu.
                </p>
                {order.moneroo_id && (
                  <p className="text-xs font-mono bg-background p-2 rounded border border-border">
                    ID Moneroo associé : {order.moneroo_id}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium border border-border rounded-lg hover:bg-background-secondary text-foreground transition-colors"
                >
                  Fermer
                </button>
                <button
                  type="button"
                  onClick={handleVerifyMoneroo}
                  disabled={verifyingMoneroo}
                  className="px-4 py-2 text-xs font-semibold bg-gold text-navy rounded-lg hover:bg-gold-hover transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {verifyingMoneroo ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5" />
                  )}
                  Interroger Moneroo en direct
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
