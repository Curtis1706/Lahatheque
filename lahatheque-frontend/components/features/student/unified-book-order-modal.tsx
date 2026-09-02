import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { X, ShoppingBag, BookOpen, Truck, Eye, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { createOrder } from "@/lib/services/commerce-orders";
import type { BookAPI } from "@/lib/services/student";
import { InlineLoader } from "@/components/ui/page-loader";

type Format = "digital" | "paper";

export function UnifiedBookOrderModal({
  book,
  onClose,
  onOpenSample,
  onDigitalPurchaseSuccess,
}: {
  book: BookAPI;
  onClose: () => void;
  onOpenSample?: () => void;
  onDigitalPurchaseSuccess?: () => void;
}) {
  const router = useRouter();
  const paperAvailable = Boolean(book.is_paper_available) && (book.price_paper ?? 0) > 0;
  const isDigitalOwned = Boolean(book.is_owned || book.has_digital_access || book.progress_percent !== undefined);

  // Si le numérique est déjà possédé, sélectionner "paper" par défaut si disponible
  const [format, setFormat] = useState<Format>(() => {
    if (isDigitalOwned && paperAvailable) return "paper";
    return "digital";
  });

  const [quantity, setQuantity] = useState(1);
  const [shippingAddress, setShippingAddress] = useState("");
  const [modePaiement, setModePaiement] = useState<"mobile_money" | "virement" | "especes" | "carte">("mobile_money");
  const [submitting, setSubmitting] = useState(false);
  const [paymentPhase, setPaymentPhase] = useState<"idle" | "countdown" | "success">("idle");
  const [countdownAmount, setCountdownAmount] = useState<number>(0);
  const [progressPct, setProgressPct] = useState<number>(0);
  const [success, setSuccess] = useState(false);

  const unitPrice = format === "digital" ? (book.price_digital ?? 0) : (book.price_paper ?? 0);
  // Les frais de livraison sont définis par le Gestionnaire selon le service choisi,
  // communiqués après traitement — jamais un montant inventé côté client.
  const shippingFee = 0;
  const shippingFeeUnknown = format === "paper";
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
        // easeOutCubic: 1 - (1 - t)^3
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
    // Si déjà possédé en numérique et sélectionné, rediriger directement vers la lecture
    if (format === "digital" && isDigitalOwned) {
      router.push(`/catalog/reader/${book.id}`);
      onClose();
      return;
    }

    if (format === "paper" && !shippingAddress.trim()) {
      toast.error("Veuillez renseigner votre adresse de livraison.");
      return;
    }

    setSubmitting(true);
    setPaymentPhase("countdown");
    setCountdownAmount(total);
    setProgressPct(0);

    const orderPromise = createOrder({
      items: [{ ouvrage_id: book.id, format_type: format, quantity }],
      type_commande: "personnel",
      mode_paiement: modePaiement,
      shipping_address: format === "paper" ? shippingAddress : undefined,
      city: "Cotonou",
      country: "BJ",
    });

    const animationPromise = runCountdownAnimation(total, 1800);

    try {
      const [result] = await Promise.all([orderPromise, animationPromise]);

      if (result.payment_url) {
        window.location.href = result.payment_url;
        return;
      }

      // Pause visuelle de confirmation à 0 XOF
      await new Promise((r) => setTimeout(r, 350));

      if (format === "digital") {
        setPaymentPhase("success");
        setSuccess(true);
        onDigitalPurchaseSuccess?.();
      } else {
        toast.success(`Commande papier enregistrée (${quantity} exemplaire${quantity > 1 ? "s" : ""}).`);
        onClose();
      }
    } catch (err: unknown) {
      setPaymentPhase("idle");
      const msg = err instanceof Error ? err.message : "Erreur lors de la commande.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  // Écran d'animation du décompte de paiement (de 4500 à 0 XOF)
  if (paymentPhase === "countdown") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-dark/85 p-4 animate-in fade-in duration-200">
        <div className="bg-background border border-border rounded-3xl shadow-2xl w-full max-w-sm p-7 text-center space-y-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/10 text-gold text-[10px] font-bold uppercase tracking-wider border border-gold/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Débit Sécurisé LAHAThèque</span>
          </div>

          <div className="space-y-1 py-1">
            <p className="text-[11px] font-mono uppercase tracking-widest text-foreground-muted">Montant débité</p>
            <div className="font-mono text-4xl sm:text-5xl font-black text-navy tracking-tight flex items-baseline justify-center gap-2">
              <span className="tabular-nums transition-all">{countdownAmount.toLocaleString("fr-FR")}</span>
              <span className="text-base sm:text-lg font-bold text-gold">XOF</span>
            </div>
            <p className="text-[11px] text-foreground-muted truncate max-w-xs mx-auto pt-1 font-medium">
              « {book.title} »
            </p>
          </div>

          {/* Barre de progression fluide */}
          <div className="space-y-2">
            <div className="w-full bg-background-secondary rounded-full h-2.5 overflow-hidden border border-border">
              <div
                className="bg-gold h-full rounded-full transition-all duration-75 ease-out shadow-xs"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-foreground-muted font-mono">
              <span>{countdownAmount > 0 ? "Traitement du règlement..." : "Règlement finalisé"}</span>
              <span className="font-bold text-navy">{progressPct}%</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-background-secondary border border-border text-xs text-foreground-muted flex items-center justify-center gap-2">
            <InlineLoader size={14} />
            <span>Sécurisation de la transaction &amp; transfert de licence...</span>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-dark/85 p-4 animate-in fade-in zoom-in-95 duration-300">
        <div className="bg-background border border-border rounded-3xl shadow-2xl w-full max-w-sm p-7 text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-success/10 text-success flex items-center justify-center mx-auto border border-success/30 animate-in zoom-in duration-300">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-success/10 text-success text-[10px] font-bold border border-success/20 mb-1">
              <span>0 XOF Restant</span>
              <span>•</span>
              <span>Débit Effectué</span>
            </div>
            <h3 className="font-serif text-2xl font-bold text-navy">Paiement effectué !</h3>
            <p className="text-xs text-foreground-muted">
              « {book.title} » est maintenant disponible dans votre bibliothèque.
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-background-secondary border border-border text-left space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-navy font-bold">
              <span>Format activé</span>
              <span className="text-gold font-mono uppercase text-[11px] font-bold">Numérique (Accès illimité)</span>
            </div>
            <div className="flex items-center justify-between text-foreground-muted text-[11px]">
              <span>Total réglé</span>
              <span className="font-mono font-bold text-navy">{total.toLocaleString("fr-FR")} XOF</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <button
              type="button"
              onClick={() => router.push(`/catalog/reader/${book.id}`)}
              className="w-full px-4 py-3 rounded-2xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors flex items-center justify-center gap-2 min-h-[44px] shadow-sm cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-gold" />
              Ouvrir la liseuse maintenant
            </button>
            <button
              type="button"
              onClick={() => router.push("/student/books")}
              className="w-full px-4 py-2.5 rounded-2xl border border-border text-xs font-semibold text-navy hover:bg-background-secondary transition-colors min-h-[40px] cursor-pointer"
            >
              Aller à Ma Bibliothèque
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-navy-dark/80 p-4">
      <div className="bg-background border border-border rounded-3xl shadow-xl w-full max-w-lg p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-serif text-lg font-bold text-navy line-clamp-2">{book.title}</h2>
            <p className="text-xs text-foreground-muted truncate">
              {authorsDisplay}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-background-secondary text-foreground-muted hover:text-navy transition-colors shrink-0 cursor-pointer"
            title="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {onOpenSample && (
          <button
            type="button"
            onClick={onOpenSample}
            className="text-[11px] text-gold font-semibold flex items-center gap-1.5 hover:underline cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            Feuilleter l&apos;extrait gratuit avant d&apos;acheter
          </button>
        )}

        {/* Bannière d'information si déjà acquis */}
        {isDigitalOwned && (
          <div className="p-3.5 rounded-2xl bg-success/10 border border-success/30 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-bold text-navy">Vous possédez déjà cet ouvrage numérique</p>
              <p className="text-foreground-muted text-[11px] mt-0.5">
                L&apos;accès numérique est actif dans votre bibliothèque. Vous pouvez le lire directement ou commander un exemplaire papier ci-dessous.
              </p>
            </div>
          </div>
        )}

        {/* Sélection Format */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Option Numérique */}
          <button
            type="button"
            onClick={() => {
              if (!isDigitalOwned) {
                setFormat("digital");
              }
            }}
            className={`p-4 rounded-2xl border text-left space-y-1 transition-all relative ${
              isDigitalOwned
                ? "border-success/30 bg-success/5 cursor-default"
                : format === "digital"
                ? "border-gold bg-gold/10 cursor-pointer"
                : "border-border bg-background-secondary cursor-pointer"
            }`}
          >
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs font-bold text-navy flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-gold" />
                Numérique
              </span>
              {isDigitalOwned && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-success/15 text-success flex items-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5" /> Acquis
                </span>
              )}
            </div>

            {isDigitalOwned ? (
              <p className="text-xs font-bold text-success pt-1">
                Déjà dans votre bibliothèque
              </p>
            ) : (
              <span className="block text-sm font-mono font-bold text-gold">
                {(book.price_digital ?? 0).toLocaleString("fr-FR")} XOF
              </span>
            )}
            <p className="text-[10px] text-foreground-muted">
              {isDigitalOwned
                ? "Accès illimité actif."
                : "Accès immédiat dans votre bibliothèque."}
            </p>
          </button>

          {/* Option Papier */}
          <button
            type="button"
            onClick={() => paperAvailable && setFormat("paper")}
            disabled={!paperAvailable}
            className={`p-4 rounded-2xl border text-left space-y-1 transition-all relative ${
              !paperAvailable
                ? "border-border bg-background-secondary opacity-50 cursor-not-allowed"
                : format === "paper"
                ? "border-gold bg-gold/10 cursor-pointer"
                : "border-border bg-background-secondary cursor-pointer"
            }`}
          >
            <div className="flex items-center justify-between gap-1">
              <span className="text-xs font-bold text-navy flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-navy" />
                Papier
              </span>
              {paperAvailable && isDigitalOwned && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-gold/15 text-navy">
                  Disponible
                </span>
              )}
            </div>
            {paperAvailable ? (
              <>
                <span className="block text-sm font-mono font-bold text-navy">
                  {(book.price_paper ?? 0).toLocaleString("fr-FR")} XOF
                </span>
                <p className="text-[10px] text-foreground-muted">Livraison sous 24-48h.</p>
              </>
            ) : (
              <span className="text-[10px] font-semibold text-foreground-muted block pt-1">
                Non disponible en version papier
              </span>
            )}
          </button>
        </div>

        {/* Formulaire Papier */}
        {format === "paper" && (
          <>
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-background-secondary border border-border">
              <label className="text-[11px] font-bold text-navy uppercase tracking-wider flex-1">
                Quantité
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-8 h-8 rounded-lg border border-border bg-background flex items-center justify-center text-navy font-bold hover:bg-background-secondary transition-colors cursor-pointer"
                >
                  -
                </button>
                <span className="w-8 text-center font-mono font-bold text-sm text-navy">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-8 h-8 rounded-lg border border-border bg-background flex items-center justify-center text-navy font-bold hover:bg-background-secondary transition-colors cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-navy uppercase tracking-wider">
                Adresse de livraison complète
              </label>
              <textarea
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                rows={2}
                placeholder="Quartier, rue, repère, ville, téléphone..."
                className="w-full px-3.5 py-2.5 text-xs border border-border rounded-2xl bg-background-secondary text-foreground focus:outline-none focus:border-navy resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-navy uppercase tracking-wider">
                Mode de règlement
              </label>
              <select
                value={modePaiement}
                onChange={(e) => setModePaiement(e.target.value as any)}
                className="w-full px-3.5 py-2.5 text-xs border border-border rounded-2xl bg-background-secondary text-foreground font-medium focus:outline-none focus:border-navy min-h-[40px]"
              >
                <option value="mobile_money">Mobile Money (MTN / Moov / Orange / Wave)</option>
                <option value="virement">Virement bancaire</option>
                <option value="especes">Espèces à la livraison</option>
                <option value="carte">Carte bancaire</option>
              </select>
            </div>

            <div className="p-3.5 rounded-2xl bg-navy/5 border border-navy/20 space-y-1 text-right">
              {shippingFeeUnknown && (
                <p className="text-[11px] text-foreground-muted italic text-left">
                  Frais de livraison à confirmer — communiqués après traitement de votre commande par notre équipe logistique.
                </p>
              )}
              <p className="text-sm font-bold text-gold">Total : {total.toLocaleString("fr-FR")} XOF</p>
            </div>
          </>
        )}

        {/* Cas 1: Déjà possédé en numérique et pas de version papier */}
        {isDigitalOwned && !paperAvailable ? (
          <div className="pt-2 space-y-2">
            <button
              type="button"
              onClick={() => {
                router.push(`/catalog/reader/${book.id}`);
                onClose();
              }}
              className="w-full px-4 py-3 rounded-2xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors flex items-center justify-center gap-2 min-h-[44px] shadow-sm cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-gold" />
              Ouvrir dans la liseuse
            </button>
            <button
              type="button"
              onClick={() => {
                router.push("/student/books");
                onClose();
              }}
              className="w-full px-4 py-2.5 rounded-2xl border border-border text-xs font-semibold text-navy hover:bg-background-secondary transition-colors min-h-[40px] cursor-pointer"
            >
              Voir dans Ma Bibliothèque
            </button>
          </div>
        ) : isDigitalOwned && format === "digital" ? (
          /* Cas 2: Déjà possédé en numérique et format digital sélectionné alors que papier existe */
          <div className="pt-2 space-y-2">
            <button
              type="button"
              onClick={() => {
                router.push(`/catalog/reader/${book.id}`);
                onClose();
              }}
              className="w-full px-4 py-3 rounded-2xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors flex items-center justify-center gap-2 min-h-[44px] shadow-sm cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-gold" />
              Ouvrir dans la liseuse
            </button>
            {paperAvailable && (
              <button
                type="button"
                onClick={() => setFormat("paper")}
                className="w-full px-4 py-2.5 rounded-2xl border border-border text-xs font-bold text-navy hover:bg-background-secondary transition-colors flex items-center justify-center gap-1.5 min-h-[40px] cursor-pointer"
              >
                <Truck className="w-3.5 h-3.5 text-navy" />
                Commander plutôt la version papier
              </button>
            )}
          </div>
        ) : (
          /* Cas 3: Commande standard (numérique non possédé ou commande papier) */
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full px-4 py-3 rounded-2xl bg-navy text-white text-xs font-bold hover:bg-navy-hover disabled:opacity-50 transition-colors flex items-center justify-center gap-2 min-h-[44px] shadow-sm cursor-pointer"
          >
            {submitting ? (
              <InlineLoader size={16} />
            ) : (
              <ShoppingBag className="w-4 h-4 text-gold" />
            )}
            {format === "digital" ? "Acheter maintenant" : "Confirmer la commande papier"}
          </button>
        )}
      </div>
    </div>
  );
}
