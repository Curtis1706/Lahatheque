"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  ShoppingBag,
  BookOpen,
  Truck,
  Eye,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  Calendar,
  AlertCircle,
  Coins,
  Building2,
  CreditCard,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { createOrder } from "@/lib/services/commerce-orders";
import type { BookAPI } from "@/lib/services/student";
import { InlineLoader } from "@/components/ui/page-loader";

type Format = "digital" | "paper";

export function AuthorCatalogOrderModal({
  book,
  onClose,
  onOpenSample,
  onOrderSuccess,
}: {
  book: BookAPI;
  onClose: () => void;
  onOpenSample?: () => void;
  onOrderSuccess?: () => void;
}) {
  const router = useRouter();
  const paperAvailable = Boolean(book.is_paper_available) && (book.price_paper ?? 0) > 0;
  const isDigitalOwned = Boolean(book.is_owned || book.has_digital_access || book.progress_percent !== undefined);

  const [format, setFormat] = useState<Format>(() => {
    if (isDigitalOwned && paperAvailable) return "paper";
    return "digital";
  });

  const [quantity, setQuantity] = useState(1);
  const [shippingAddress, setShippingAddress] = useState("");
  const [settlementMode, setSettlementMode] = useState<"immediate" | "credit">("immediate");

  // Date d'échéance par défaut : dans 30 jours
  const defaultDueDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  };
  const minDueDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  };

  const [creditDueDate, setCreditDueDate] = useState(defaultDueDate());
  const [modePaiement, setModePaiement] = useState<"mobile_money" | "virement" | "especes" | "carte">("mobile_money");
  const [submitting, setSubmitting] = useState(false);
  const [paymentPhase, setPaymentPhase] = useState<"idle" | "countdown" | "success">("idle");
  const [countdownAmount, setCountdownAmount] = useState<number>(0);
  const [progressPct, setProgressPct] = useState<number>(0);
  const [success, setSuccess] = useState(false);

  const unitPrice = format === "digital" ? (book.price_digital ?? 0) : (book.price_paper ?? 0);
  const shippingFee = format === "paper" ? 2500 : 0;
  const total = unitPrice * quantity + shippingFee;

  const authorsDisplay =
    book.authors && Array.isArray(book.authors) && book.authors.length > 0
      ? book.authors.map((a: any) => a.full_name || `${a.first_name || ""} ${a.last_name || ""}`.trim()).join(", ")
      : (book as any).author || "Auteur LAHA";

  function runCountdownAnimation(startAmount: number, durationMs: number): Promise<void> {
    return new Promise((resolve) => {
      const startTime = performance.now();
      function step(now: number) {
        const elapsed = now - startTime;
        const rawProgress = Math.min(elapsed / durationMs, 1);
        const eased = 1 - Math.pow(1 - rawProgress, 3);
        const currentAmount = Math.max(0, Math.round(startAmount * (1 - eased)));

        setCountdownAmount(currentAmount);
        setProgressPct(Math.min(100, Math.round(rawProgress * 100)));

        if (rawProgress < 1) {
          requestAnimationFrame(step);
        } else {
          setCountdownAmount(0);
          setProgressPct(100);
          resolve();
        }
      }
      requestAnimationFrame(step);
    });
  }

  async function handleSubmit() {
    if (format === "digital" && isDigitalOwned) {
      router.push(`/catalog/reader/${book.id}`);
      onClose();
      return;
    }

    if (format === "paper" && !shippingAddress.trim()) {
      toast.error("Veuillez renseigner votre adresse de livraison.");
      return;
    }

    if (settlementMode === "credit") {
      if (!creditDueDate) {
        toast.error("Veuillez choisir une date d'échéance de paiement.");
        return;
      }
      const todayStr = new Date().toISOString().split("T")[0];
      if (creditDueDate <= todayStr) {
        toast.error("La date d'échéance doit être au moins à partir de demain.");
        return;
      }
    }

    setSubmitting(true);

    if (settlementMode === "immediate") {
      setPaymentPhase("countdown");
      setCountdownAmount(total);
      setProgressPct(0);
    }

    try {
      const payload = {
        items: [{ ouvrage_id: book.id, format_type: format, quantity }],
        type_commande: "personnel" as const,
        mode_paiement: modePaiement,
        shipping_address: format === "paper" ? shippingAddress : undefined,
        city: "Cotonou",
        country: "BJ",
        is_credit_purchase: settlementMode === "credit",
        credit_due_date: settlementMode === "credit" ? creditDueDate : undefined,
      };

      if (settlementMode === "immediate") {
        const [orderResult] = await Promise.all([
          createOrder(payload),
          runCountdownAnimation(total, 2200),
        ]);

        if (orderResult.payment_url || orderResult.checkout_url) {
          window.location.href = (orderResult.payment_url || orderResult.checkout_url)!;
          return;
        }

        setPaymentPhase("success");
        setSuccess(true);
        onOrderSuccess?.();
      } else {
        // Achat à crédit
        await createOrder(payload);
        setSuccess(true);
        toast.success(`Achat à crédit validé. Échéance au ${new Date(creditDueDate).toLocaleDateString("fr-FR")}.`);
        onOrderSuccess?.();
      }
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la création de la commande.");
      setPaymentPhase("idle");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-3xl bg-background border border-border shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-background">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gold/10 text-gold border border-gold/20">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-navy">Commander l&apos;Ouvrage</h2>
              <p className="text-xs text-foreground-muted">Espace Auteur Partenaire</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="p-2 rounded-xl text-foreground-muted hover:bg-background-secondary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {success ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-serif text-xl font-bold text-navy">
                  {settlementMode === "credit" ? "Commande en dépôt Confirmé !" : "Commande Confirmée !"}
                </h3>
                <p className="text-xs text-foreground-muted mt-1 max-w-sm mx-auto">
                  {settlementMode === "credit"
                    ? `Votre ouvrage est disponible. Le paiement de ${total.toLocaleString("fr-FR")} FCFA est dû avant le ${new Date(creditDueDate).toLocaleDateString("fr-FR")}.`
                    : format === "digital"
                    ? "L'ouvrage a été ajouté à votre bibliothèque et est prêt pour la lecture."
                    : "Votre commande papier a été enregistrée. Notre équipe prépare votre colis."}
                </p>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                {format === "digital" && (
                  <button
                    onClick={() => {
                      router.push("/student/books");
                      onClose();
                    }}
                    className="px-5 py-3 rounded-2xl bg-navy text-white text-xs font-bold hover:bg-navy-dark transition-all min-h-[44px]"
                  >
                    Accéder à ma bibliothèque
                  </button>
                )}
                <button
                  onClick={() => {
                    router.push("/author/purchases");
                    onClose();
                  }}
                  className="px-5 py-3 rounded-2xl bg-gold/10 border border-gold/30 text-gold text-xs font-bold hover:bg-gold/20 transition-all min-h-[44px]"
                >
                  Voir mes achats & crédits
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Détails du Livre */}
              <div className="flex gap-4 p-4 rounded-2xl bg-background-secondary border border-border">
                <div className="w-14 h-20 rounded-xl bg-navy/10 border border-navy/20 flex items-center justify-center shrink-0">
                  <BookOpen className="w-6 h-6 text-navy/40" />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gold">
                    {book.discipline_name || "Ouvrage Académique"}
                  </span>
                  <h4 className="font-serif font-bold text-navy text-sm line-clamp-2 leading-snug">
                    {book.title}
                  </h4>
                  <p className="text-xs text-foreground-muted truncate">Par {authorsDisplay}</p>
                </div>
              </div>

              {/* Choix du Format */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-navy">Format souhaité</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormat("digital")}
                    className={`p-3.5 rounded-2xl border text-left transition-all min-h-[44px] ${
                      format === "digital"
                        ? "border-gold bg-gold/5 ring-1 ring-gold"
                        : "border-border bg-background-secondary hover:border-gold/40"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <BookOpen className={`w-4 h-4 ${format === "digital" ? "text-gold" : "text-foreground-muted"}`} />
                      <span className="text-xs font-bold text-navy">Numérique (DRM)</span>
                    </div>
                    <p className="font-mono font-bold text-gold text-sm mt-1">
                      {(book.price_digital ?? 0).toLocaleString("fr-FR")} FCFA
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => paperAvailable && setFormat("paper")}
                    disabled={!paperAvailable}
                    className={`p-3.5 rounded-2xl border text-left transition-all min-h-[44px] ${
                      !paperAvailable
                        ? "opacity-50 cursor-not-allowed border-border bg-background-secondary"
                        : format === "paper"
                        ? "border-gold bg-gold/5 ring-1 ring-gold"
                        : "border-border bg-background-secondary hover:border-gold/40"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Truck className={`w-4 h-4 ${format === "paper" ? "text-gold" : "text-foreground-muted"}`} />
                      <span className="text-xs font-bold text-navy">Livre Papier</span>
                    </div>
                    <p className="font-mono font-bold text-navy text-sm mt-1">
                      {paperAvailable ? `${(book.price_paper ?? 0).toLocaleString("fr-FR")} FCFA` : "Indisponible"}
                    </p>
                  </button>
                </div>
              </div>

              {/* Quantité si papier */}
              {format === "paper" && (
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-navy">Quantité d&apos;exemplaires</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-24 px-3.5 py-2.5 rounded-xl border border-border bg-background-secondary text-xs font-mono font-bold text-navy focus:outline-none focus:border-gold min-h-[44px]"
                    />
                    <span className="text-xs text-foreground-muted">
                      Frais de livraison : <span className="font-mono font-bold text-navy">2 500 FCFA</span>
                    </span>
                  </div>
                </div>
              )}

              {/* Adresse de livraison si papier */}
              {format === "paper" && (
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-navy">
                    Adresse de livraison (Bénin / Sous-région) *
                  </label>
                  <input
                    type="text"
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    placeholder="Ex: Quartier Haie Vive, Rue 340, Cotonou..."
                    className="w-full px-4 py-2.5 rounded-xl border border-border bg-background-secondary text-xs text-navy placeholder:text-foreground-muted focus:outline-none focus:border-gold min-h-[44px]"
                  />
                </div>
              )}

              {/* SÉLECTEUR : Payer maintenant vs Prendre à crédit */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-navy">Mode de règlement Auteur</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSettlementMode("immediate")}
                    className={`p-3.5 rounded-2xl border text-left transition-all min-h-[44px] ${
                      settlementMode === "immediate"
                        ? "border-navy bg-navy/5 ring-1 ring-navy"
                        : "border-border bg-background-secondary hover:border-navy/40"
                    }`}
                  >
                    <span className="text-xs font-bold text-navy block">Règlement Immédiat</span>
                    <span className="text-[10px] text-foreground-muted">Payer en ligne ou manuel</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSettlementMode("credit")}
                    className={`p-3.5 rounded-2xl border text-left transition-all min-h-[44px] ${
                      settlementMode === "credit"
                        ? "border-gold bg-gold/10 ring-1 ring-gold"
                        : "border-border bg-background-secondary hover:border-gold/40"
                    }`}
                  >
                    <span className="text-xs font-bold text-gold block">Paiement en dépôt</span>
                    <span className="text-[10px] text-foreground-muted">Accès direct avec échéancier</span>
                  </button>
                </div>
              </div>

              {/* Si Achat à Crédit : Date d'échéance & Avertissement */}
              {settlementMode === "credit" ? (
                <div className="p-4 rounded-2xl bg-gold/5 border border-gold/20 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-navy">
                    <Calendar className="w-4 h-4 text-gold" />
                    <span>Date d&apos;échéance du règlement *</span>
                  </div>
                  <input
                    type="date"
                    min={minDueDate()}
                    value={creditDueDate}
                    onChange={(e) => setCreditDueDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-xs font-mono font-bold text-navy focus:outline-none focus:border-gold min-h-[44px]"
                  />
                  <div className="flex items-start gap-2 text-[11px] text-foreground-muted">
                    <AlertCircle className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                    <span>
                      Vous vous engagez à régler cette commande avant le{" "}
                      <strong className="text-navy">
                        {creditDueDate ? new Date(creditDueDate).toLocaleDateString("fr-FR") : "la date fixée"}
                      </strong>
                      . Des relances automatiques seront émises par le service financier en cas de retard.
                    </span>
                  </div>
                </div>
              ) : (
                /* Si Règlement Immédiat : Choix du moyen de paiement */
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-navy">Canal de paiement</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "mobile_money", label: "Mobile Money", icon: Coins },
                      { id: "virement", label: "Virement", icon: Building2 },
                      { id: "carte", label: "Carte Bancaire", icon: CreditCard },
                      { id: "especes", label: "Espèces", icon: Wallet },
                    ].map((m) => {
                      const Icon = m.icon;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setModePaiement(m.id as any)}
                          className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs font-medium transition-all min-h-[44px] ${
                            modePaiement === m.id
                              ? "border-navy bg-navy/5 text-navy font-bold"
                              : "border-border bg-background-secondary text-foreground-muted hover:text-navy"
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${modePaiement === m.id ? "text-gold" : "text-foreground-muted"}`} />
                          <span>{m.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Animation Décrémentation lors du paiement immédiat */}
              {paymentPhase === "countdown" && (
                <div className="p-4 rounded-2xl bg-navy/5 border border-navy/20 text-center space-y-2">
                  <p className="text-xs text-foreground-muted">Traitement de l&apos;encaissement...</p>
                  <p className="font-mono text-2xl font-bold text-navy">
                    {countdownAmount.toLocaleString("fr-FR")} FCFA
                  </p>
                  <div className="w-full bg-border rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-gold h-full transition-all duration-75 ease-out"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Récapitulatif & Total */}
              <div className="p-4 rounded-2xl bg-background-secondary border border-border flex items-center justify-between">
                <div>
                  <span className="text-xs text-foreground-muted">Total à {settlementMode === "credit" ? "régler à terme" : "payer"}</span>
                  <p className="font-serif text-xl font-bold text-navy">
                    {total.toLocaleString("fr-FR")} <span className="text-xs font-normal">FCFA</span>
                  </p>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-foreground-muted">
                  <ShieldCheck className="w-4 h-4 text-gold" />
                  <span>{settlementMode === "credit" ? "Accord crédit Auteur" : "Paiement sécurisé"}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!success && (
          <div className="p-6 border-t border-border bg-background flex items-center justify-between gap-3">
            {onOpenSample ? (
              <button
                type="button"
                onClick={onOpenSample}
                disabled={submitting}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl border border-border bg-background-secondary text-xs font-semibold text-navy hover:border-gold/40 transition-colors min-h-[44px]"
              >
                <Eye className="w-4 h-4 text-gold" />
                <span>Extrait</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2.5 rounded-2xl border border-border text-xs font-semibold text-foreground-muted hover:bg-background-secondary transition-colors min-h-[44px]"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-2xl bg-navy text-white text-xs font-bold hover:bg-navy-dark transition-all disabled:opacity-50 min-h-[44px]"
              >
                {submitting ? (
                  <>
                    <InlineLoader size={16} />
                    <span>Traitement...</span>
                  </>
                ) : settlementMode === "credit" ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-gold" />
                    <span>Confirmer la commande</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4 text-gold" />
                    <span>Payer {total.toLocaleString("fr-FR")} FCFA</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
