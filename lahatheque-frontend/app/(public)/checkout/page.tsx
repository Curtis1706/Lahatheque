"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  CreditCard, 
  Smartphone, 
  CheckCircle2, 
  Truck, 
  Lock, 
  ArrowLeft, 
  ShoppingBag, 
  Loader2,
  AlertCircle
} from "lucide-react";
import { useCart } from "@/context/cart-context";
import { useAuth } from "@/hooks/use-auth";

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { items, totalAmount, totalCount, clearCart } = useCart();

  const [paymentProvider, setPaymentProvider] = useState<"mock" | "moneroo" | "stripe">("mock");
  const [shippingAddress, setShippingAddress] = useState("");
  const [city, setCity] = useState("Cotonou");
  const [country, setCountry] = useState("BJ");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderCompleted, setOrderCompleted] = useState<any | null>(null);

  const hasPaperItem = items.some((i) => i.format === "paper");

  if (items.length === 0 && !orderCompleted) {
    return (
      <div className="min-h-[60vh] bg-background text-foreground py-16 px-4 flex flex-col items-center justify-center text-center">
        <h1 className="font-serif text-2xl font-bold text-navy mb-2">Aucun article à commander</h1>
        <p className="text-sm text-foreground-muted mb-6">Votre panier est vide.</p>
        <Link
          href="/catalog"
          className="bg-navy text-white text-xs font-bold px-6 py-3 rounded-xl shadow"
        >
          Retourner au catalogue
        </Link>
      </div>
    );
  }

  if (orderCompleted) {
    return (
      <div className="min-h-[70vh] bg-background text-foreground py-16 px-4 flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-6 animate-in fade-in zoom-in duration-300">
        <div className="w-20 h-20 rounded-full bg-success/10 text-success flex items-center justify-center">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h1 className="font-serif text-2xl font-bold text-navy">Commande confirmée !</h1>
          <p className="text-xs text-foreground-muted">
            Numéro de commande : <span className="font-bold font-mono text-navy">{orderCompleted.order_id}</span>
          </p>
          <p className="text-xs text-foreground/80 leading-relaxed pt-2">
            Votre paiement de <span className="font-bold text-gold-dark">{parseInt(orderCompleted.total_amount || 0).toLocaleString("fr-FR")} FCFA</span> a été validé avec succès.
            Vos accès de lecture sont désormais immédiatement actifs.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full pt-4">
          <Link
            href="/student/orders"
            className="flex-1 py-3.5 px-4 rounded-xl bg-navy hover:bg-navy-hover text-white text-xs font-bold text-center shadow-md transition-colors"
          >
            Voir mes commandes
          </Link>
          <Link
            href="/student"
            className="flex-1 py-3.5 px-4 rounded-xl bg-background border border-border text-navy text-xs font-bold text-center hover:bg-background-secondary transition-colors"
          >
            Mon Espace Étudiant
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (hasPaperItem && !shippingAddress.trim()) {
      setError("Veuillez saisir votre adresse de livraison pour le livre papier.");
      setLoading(false);
      return;
    }

    try {
      const payload = {
        payment_provider: paymentProvider,
        shipping_address: shippingAddress,
        city: city,
        country: country,
        items: items.map((item) => ({
          ouvrage_id: item.bookId,
          format_type: item.format,
          quantity: item.quantity,
        })),
      };

      const res = await fetch("/api/bff/commerce/orders/", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Échec de la validation de la commande.");
      }

      const data = await res.json();
      setOrderCompleted(data);
      clearCart();
    } catch (err: any) {
      setError(err.message || "Erreur réseau lors de la validation de commande.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* En-tête */}
        <div className="flex items-center justify-between border-b border-border pb-6">
          <div>
            <Link href="/cart" className="inline-flex items-center gap-1.5 text-xs font-bold text-navy hover:underline mb-2">
              <ArrowLeft className="w-3.5 h-3.5" />
              Retour au panier
            </Link>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
              Paiement & Validation
            </h1>
          </div>
          <div className="flex items-center gap-2 text-xs text-foreground-muted">
            <Lock className="w-4 h-4 text-success" />
            <span>Paiement sécurisé SSL</span>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-error/10 border border-error/30 text-error text-xs font-medium flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Erreur de paiement</p>
              <p>{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Options de Paiement et Livraison */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Utilisateur connecté */}
            <div className="bg-background border border-border rounded-2xl p-5 space-y-3 shadow-sm">
              <h2 className="text-xs font-bold text-navy uppercase tracking-wider">Identité du client</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="text-foreground-muted block mb-1">Nom & Prénom</label>
                  <input
                    type="text"
                    disabled
                    value={user ? `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.email : "Invité"}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background-secondary border border-border font-medium text-navy text-xs"
                  />
                </div>
                <div>
                  <label className="text-foreground-muted block mb-1">Adresse Email</label>
                  <input
                    type="email"
                    disabled
                    value={user?.email || ""}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background-secondary border border-border font-medium text-navy text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Adresse de livraison (si format papier) */}
            {hasPaperItem && (
              <div className="bg-background border border-border rounded-2xl p-5 space-y-4 shadow-sm animate-in fade-in">
                <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider">
                  <Truck className="w-4 h-4 text-gold" />
                  Adresse de Livraison (Livre Papier)
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-foreground-muted block mb-1">Adresse complète de livraison *</label>
                    <textarea
                      required
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      placeholder="Ex: Quartier Cadjehoun, Immeuble Laha, 2ème étage, Cotonou"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-navy text-xs focus:ring-1 focus:ring-gold outline-none"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-foreground-muted block mb-1">Ville</label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-navy text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-foreground-muted block mb-1">Pays</label>
                      <select
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-navy text-xs"
                      >
                        <option value="BJ">Bénin (+229)</option>
                        <option value="SN">Sénégal (+221)</option>
                        <option value="CI">Côte d'Ivoire (+225)</option>
                        <option value="TG">Togo (+228)</option>
                        <option value="CM">Cameroun (+237)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Mode de Paiement */}
            <div className="bg-background border border-border rounded-2xl p-5 space-y-4 shadow-sm">
              <h2 className="text-xs font-bold text-navy uppercase tracking-wider">Mode de Paiement</h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                
                {/* Mock Provider */}
                <button
                  type="button"
                  onClick={() => setPaymentProvider("mock")}
                  className={`p-4 rounded-xl border text-left flex flex-col justify-between gap-3 transition-all cursor-pointer ${
                    paymentProvider === "mock"
                      ? "border-navy bg-navy/5 ring-2 ring-navy/20"
                      : "border-border hover:border-gold"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <Smartphone className="w-5 h-5 text-gold" />
                    <span className="text-[10px] font-bold uppercase bg-gold/20 text-navy px-2 py-0.5 rounded">Simulateur</span>
                  </div>
                  <div>
                    <p className="font-bold text-xs text-navy">Test Instantané</p>
                    <p className="text-[10px] text-foreground-muted">Paiement dev immédiat</p>
                  </div>
                </button>

                {/* Moneroo Provider */}
                <button
                  type="button"
                  onClick={() => setPaymentProvider("moneroo")}
                  className={`p-4 rounded-xl border text-left flex flex-col justify-between gap-3 transition-all cursor-pointer ${
                    paymentProvider === "moneroo"
                      ? "border-navy bg-navy/5 ring-2 ring-navy/20"
                      : "border-border hover:border-gold"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <Smartphone className="w-5 h-5 text-navy" />
                    <span className="text-[10px] font-bold uppercase bg-navy/10 text-navy px-2 py-0.5 rounded">Mobile Money</span>
                  </div>
                  <div>
                    <p className="font-bold text-xs text-navy">Moneroo Afrique</p>
                    <p className="text-[10px] text-foreground-muted">MTN, Moov, Wave, Orange</p>
                  </div>
                </button>

                {/* Stripe Provider */}
                <button
                  type="button"
                  onClick={() => setPaymentProvider("stripe")}
                  className={`p-4 rounded-xl border text-left flex flex-col justify-between gap-3 transition-all cursor-pointer ${
                    paymentProvider === "stripe"
                      ? "border-navy bg-navy/5 ring-2 ring-navy/20"
                      : "border-border hover:border-gold"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <CreditCard className="w-5 h-5 text-navy" />
                    <span className="text-[10px] font-bold uppercase bg-navy/10 text-navy px-2 py-0.5 rounded">Carte CB</span>
                  </div>
                  <div>
                    <p className="font-bold text-xs text-navy">Carte Bancaire</p>
                    <p className="text-[10px] text-foreground-muted">Visa, Mastercard International</p>
                  </div>
                </button>

              </div>
            </div>

          </div>

          {/* Récapitulatif Final */}
          <div className="bg-background border border-border rounded-2xl p-6 space-y-6 h-fit shadow-sm">
            <h2 className="font-serif font-bold text-lg text-navy border-b border-border pb-3">
              Récapitulatif ({totalCount})
            </h2>

            <div className="space-y-3 text-xs max-h-48 overflow-y-auto divide-y divide-border">
              {items.map((item) => (
                <div key={item.id} className="pt-2 first:pt-0 flex justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-bold text-navy truncate">{item.title}</p>
                    <p className="text-[10px] text-foreground-muted">
                      {item.format === "digital" ? "Numérique" : "Papier"} x {item.quantity}
                    </p>
                  </div>
                  <span className="font-semibold text-navy shrink-0">
                    {(item.price * item.quantity).toLocaleString("fr-FR")} FCFA
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-4 space-y-2 text-xs">
              <div className="flex justify-between text-base font-bold text-navy">
                <span>Total à payer</span>
                <span className="text-gold-dark">{totalAmount.toLocaleString("fr-FR")} FCFA</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl bg-gold hover:bg-gold-hover text-navy font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Traitement en cours...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Confirmer et Payér ({totalAmount.toLocaleString("fr-FR")} FCFA)
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
