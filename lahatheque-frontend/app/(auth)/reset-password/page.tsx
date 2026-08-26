"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle, Lock } from "lucide-react";
import Link from "next/link";
import { InlineLoader } from "@/components/ui/page-loader";

export default function ResetPasswordPage() {
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Les mots de passe ne correspondent pas.");
      return;
    }
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setLoading(false);
    setSuccess(true);
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
            <h1 className="font-serif text-2xl font-bold text-navy">Réinitialisation</h1>
            <p className="text-xs text-foreground-muted">
              Saisissez le code reçu et définissez votre nouveau mot de passe.
            </p>
          </div>

          {success ? (
            <div className="space-y-4 text-center py-4">
              <CheckCircle className="w-12 h-12 text-success mx-auto" />
              <h3 className="text-base font-bold text-navy">Mot de passe modifié !</h3>
              <p className="text-xs text-foreground-muted">
                Votre mot de passe a été mis à jour avec succès. Vous pouvez désormais vous connecter.
              </p>
              <Link 
                href="/login" 
                className="inline-flex items-center justify-center w-full py-3 bg-navy hover:bg-navy-hover text-white text-xs font-bold rounded shadow-sm transition-colors mt-4"
              >
                Se connecter
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div className="space-y-1.5">
                <label htmlFor="code" className="text-xs font-bold text-navy">Code de réinitialisation *</label>
                <input
                  type="text"
                  id="code"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-4 py-3 rounded border border-border bg-background-secondary text-foreground text-sm focus:outline-none focus:border-navy text-center font-mono tracking-widest"
                  placeholder="123456"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="text-xs font-bold text-navy">Nouveau mot de passe *</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-foreground-muted pointer-events-none" />
                  <input
                    type="password"
                    id="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded border border-border bg-background-secondary text-foreground text-sm focus:outline-none focus:border-navy"
                    placeholder="••••••••"
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
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded border border-border bg-background-secondary text-foreground text-sm focus:outline-none focus:border-navy"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !code || !password || !confirmPassword}
                className="w-full py-3 bg-navy hover:bg-navy-hover text-white text-xs font-bold rounded shadow transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
              >
                {loading ? (
                  <>
                    <InlineLoader size={16} />
                    Modification...
                  </>
                ) : (
                  <>
                    Enregistrer le mot de passe
                    <ArrowRight className="w-4 h-4" />
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
