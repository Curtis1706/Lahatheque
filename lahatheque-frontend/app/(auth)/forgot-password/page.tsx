"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Phone, ArrowLeft, ArrowRight, CheckCircle } from "lucide-react";
import { PhoneInput } from "@/components/ui/phone-input";
import { InlineLoader } from "@/components/ui/page-loader";

export default function ForgotPasswordPage() {
  const [method, setMethod] = useState<"email" | "phone">("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/bff/accounts/forgot-password/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error || "Une erreur est survenue.");
        return;
      }
      setSuccess(true);
    } catch {
      setError("Impossible de contacter le serveur. Vérifiez votre connexion.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-secondary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        
        {/* Back Link */}
        <Link 
          href="/login" 
          className="inline-flex items-center gap-1.5 text-xs font-bold text-navy hover:text-gold transition-colors mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Retour à la connexion
        </Link>

        <div className="bg-background border border-border rounded-2xl shadow-xl p-8 space-y-6 relative overflow-hidden">
          
          <div className="space-y-2 text-center">
            <h1 className="font-serif text-2xl font-bold text-navy">Mot de passe oublié ?</h1>
            <p className="text-xs text-foreground-muted">
              Saisissez votre adresse email pour recevoir votre code de réinitialisation sécurisé.
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl border border-error/30 bg-error/10 text-error text-xs font-medium animate-in fade-in duration-150">
              {error}
            </div>
          )}

          {success ? (
            <div className="space-y-4 text-center py-4">
              <CheckCircle className="w-12 h-12 text-success mx-auto" />
              <h3 className="text-base font-bold text-navy">Demande envoyée !</h3>
              <p className="text-xs text-foreground-muted">
                {method === "email" 
                  ? `Si cette adresse est associée à un compte, un code de réinitialisation vient d'être envoyé à : ${email}`
                  : `Un code de validation a été envoyé par SMS au numéro : ${phone}`
                }
              </p>
              <div className="space-y-2 pt-2">
                <Link 
                  href={`/reset-password?email=${encodeURIComponent(email)}`}
                  className="inline-flex items-center justify-center w-full py-3.5 bg-navy hover:bg-navy-hover text-white text-xs font-bold rounded-xl shadow-sm transition-colors gap-2"
                >
                  <span>Saisir le code reçu</span>
                  <ArrowRight className="w-4 h-4 text-gold" />
                </Link>
                <Link 
                  href="/login" 
                  className="inline-flex items-center justify-center w-full py-2.5 text-xs text-foreground-muted hover:text-navy transition-colors font-medium"
                >
                  Retour à la connexion
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Reset Method Toggle */}
              <div className="w-full space-y-4">
                <div className="grid w-full grid-cols-2 bg-background-secondary p-1 rounded-xl border border-border mb-4">
                  <button 
                    type="button"
                    onClick={() => setMethod("email")}
                    className={`rounded-lg py-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      method === "email" 
                        ? "bg-background text-navy shadow-sm border border-border/40" 
                        : "text-foreground-muted hover:text-navy"
                    }`}
                  >
                    <Mail className="h-3.5 w-3.5" />
                    Par Email
                  </button>
                  <button 
                    type="button"
                    onClick={() => setMethod("phone")}
                    className={`rounded-lg py-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      method === "phone" 
                        ? "bg-background text-navy shadow-sm border border-border/40" 
                        : "text-foreground-muted hover:text-navy"
                    }`}
                  >
                    <Phone className="h-3.5 w-3.5" />
                    Par Téléphone
                  </button>
                </div>

                {method === "email" ? (
                  <div className="space-y-2 animate-in fade-in duration-200">
                    <label htmlFor="email" className="text-xs font-bold text-navy">Adresse email *</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-foreground-muted pointer-events-none" />
                      <input
                        type="email"
                        id="email"
                        required={method === "email"}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background-secondary text-foreground text-sm focus:outline-none focus:border-navy"
                        placeholder="nom@universite.edu"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 animate-in fade-in duration-200">
                    <label htmlFor="phone" className="text-xs font-bold text-navy">Numéro de téléphone *</label>
                    <PhoneInput
                      value={phone}
                      onChange={(val: any) => setPhone(val || "")}
                      className="w-full"
                    />
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || (method === "email" ? !email : !phone)}
                className="w-full py-3.5 bg-navy hover:bg-navy-hover text-white text-xs font-bold rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <>
                    <InlineLoader size={16} />
                    <span>Envoi en cours...</span>
                  </>
                ) : (
                  <>
                    <span>Envoyer le code de réinitialisation</span>
                    <ArrowRight className="w-4 h-4 text-gold" />
                  </>
                )}
              </button>

            </form>
          )}

        </div>

      </div>
    </div>
  );
}
