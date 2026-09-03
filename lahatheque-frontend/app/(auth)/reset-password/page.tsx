"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle, Lock, Mail, KeyRound } from "lucide-react";
import Link from "next/link";
import { InlineLoader } from "@/components/ui/page-loader";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const emailFromUrl = searchParams.get("email") || "";

  const [email, setEmail] = useState(emailFromUrl);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (emailFromUrl && !email) {
      setEmail(emailFromUrl);
    }
  }, [emailFromUrl, email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Veuillez renseigner votre adresse email.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    if (password.length < 8) {
      setError("Le mot de passe doit comporter au moins 8 caractères.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/bff/accounts/reset-password/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code: code.trim(),
          new_password: password,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error || "Code invalide ou expiré.");
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
    <div className="bg-background border border-border rounded-2xl shadow-xl p-8 space-y-6 relative overflow-hidden">
      <div className="space-y-2 text-center">
        <h1 className="font-serif text-2xl font-bold text-navy">Réinitialisation</h1>
        <p className="text-xs text-foreground-muted">
          Saisissez le code à 6 chiffres reçu par email et définissez votre nouveau mot de passe.
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
          <h3 className="text-base font-bold text-navy">Mot de passe modifié !</h3>
          <p className="text-xs text-foreground-muted">
            Votre mot de passe a été mis à jour avec succès. Vous pouvez désormais vous connecter à votre compte.
          </p>
          <Link 
            href="/login" 
            className="inline-flex items-center justify-center w-full py-3.5 bg-navy hover:bg-navy-hover text-white text-xs font-bold rounded-xl shadow-sm transition-colors mt-4"
          >
            Se connecter
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-xs font-bold text-navy">Adresse email *</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-foreground-muted pointer-events-none" />
              <input
                type="email"
                id="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background-secondary text-foreground text-sm focus:outline-none focus:border-navy"
                placeholder="nom@universite.edu"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="code" className="text-xs font-bold text-navy">Code de réinitialisation (6 chiffres) *</label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-foreground-muted pointer-events-none" />
              <input
                type="text"
                id="code"
                required
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background-secondary text-foreground text-sm focus:outline-none focus:border-navy font-mono tracking-widest text-center text-base"
                placeholder="123456"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-xs font-bold text-navy">Nouveau mot de passe *</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-foreground-muted pointer-events-none" />
              <input
                type="password"
                id="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background-secondary text-foreground text-sm focus:outline-none focus:border-navy"
                placeholder="Minimum 8 caractères"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="confirmPassword" className="text-xs font-bold text-navy">Confirmer le mot de passe *</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-foreground-muted pointer-events-none" />
              <input
                type="password"
                id="confirmPassword"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background-secondary text-foreground text-sm focus:outline-none focus:border-navy"
                placeholder="Répétez le mot de passe"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !email || !code || !password || !confirmPassword}
            className="w-full py-3.5 bg-navy hover:bg-navy-hover text-white text-xs font-bold rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-4 cursor-pointer"
          >
            {loading ? (
              <>
                <InlineLoader size={16} />
                <span>Modification en cours...</span>
              </>
            ) : (
              <>
                <span>Enregistrer le nouveau mot de passe</span>
                <ArrowRight className="w-4 h-4 text-gold" />
              </>
            )}
          </button>

        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
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

        <Suspense fallback={<div className="p-8 rounded-2xl bg-background border border-border text-center text-xs text-foreground-muted animate-pulse">Chargement...</div>}>
          <ResetPasswordForm />
        </Suspense>

      </div>
    </div>
  );
}
