"use client";

import * as React from "react";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, Phone, ArrowRight } from "lucide-react";
import { PhoneInput } from "@/components/ui/phone-input";
import { useAuth, type LoginResponse } from "@/hooks/use-auth";
import { PageLoader, InlineLoader } from "@/components/ui/page-loader";

export default function LoginPage() {
  return (
    <Suspense fallback={<PageLoader label="Chargement de l'espace connexion" />}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    password: "",
  });
  const [loginMethod, setLoginMethod] = useState<"email" | "phone">("email");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  useEffect(() => {
    const message = searchParams.get("message");
    if (message) {
      setError(message);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const loginIdentity = loginMethod === "email" ? formData.email : formData.phone;
      if (!loginIdentity) {
        setError(loginMethod === "email" ? "Veuillez entrer votre email" : "Veuillez entrer votre numéro de téléphone");
        setIsLoading(false);
        return;
      }
      
      const result: LoginResponse = await login(loginIdentity, formData.password);
      
      if (result.success) {
        const role = result.user?.role as any;
        if (role === "admin" || role === "super_admin") {
          router.push("/admin");
        } else if (role === "student" || role === "teacher") {
          router.push("/student");
        } else if (role === "author") {
          router.push("/author");
        } else if (role === "publisher") {
          router.push("/publisher");
        } else if (role === "university") {
          router.push("/university");
        } else if (role === "layout_artist") {
          router.push("/layout-artist");
        } else if (role === "chief_layout") {
          router.push("/chief-layout");
        } else if (role === "manager") {
          router.push("/manager");
        } else if (role === "legal_reviewer") {
          router.push("/legal-reviewer");
        } else if (role === "wholesaler") {
          router.push("/wholesaler");
        } else {
          router.push("/student");
        }
      } else {
        setError(result.error || "Identifiants invalides");
      }
    } catch (err) {
      console.error("Erreur lors de la connexion:", err);
      setError("Erreur interne du serveur");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) setError("");
  };

  return (
    <div className="min-h-screen bg-background-secondary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        
        {/* Logo Header */}
        <div className="text-center mb-8 flex flex-col items-center justify-center">
          <Link href="/" className="inline-flex flex-col items-center mb-2 group">
            <div className="p-1.5 bg-background rounded-3xl border border-border shadow-lg group-hover:border-gold/30 transition-colors">
              <Image src="/logo.jpg" alt="LAHA Editions" width={80} height={80} style={{ width: "auto", height: "auto" }} className="rounded-2xl" />
            </div>
          </Link>
          <p className="text-xs text-foreground-muted mt-2">Accédez à votre bibliothèque universitaire numérique</p>
        </div>

        {/* Auth form card inspired by @bankkroll component */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="relative overflow-hidden rounded-3xl border border-border bg-background shadow-xl"
        >
          <div className="p-6 sm:p-10">
            <div className="mb-8 text-center">
              <h1 className="text-2xl font-serif font-bold text-navy">Bon retour</h1>
              <p className="text-xs text-foreground-muted mt-1.5">Connectez-vous pour continuer</p>
            </div>

            {error && (
              <div className="mb-6 animate-in fade-in slide-in-from-top-1 rounded-xl border border-error/20 bg-error/10 p-3.5 text-xs text-error font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Tab Selector for Identity type */}
              <div className="w-full space-y-4">
                <div className="grid w-full grid-cols-2 bg-background-secondary p-1 rounded-xl border border-border mb-6">
                  <button 
                    type="button"
                    onClick={() => setLoginMethod("email")}
                    className={`rounded-lg py-2.5 text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      loginMethod === "email" 
                        ? "bg-background text-navy shadow-sm border border-border/40" 
                        : "text-foreground-muted hover:text-navy"
                    }`}
                  >
                    <Mail className="h-3.5 w-3.5" />
                    Adresse Email
                  </button>
                  <button 
                    type="button"
                    onClick={() => setLoginMethod("phone")}
                    className={`rounded-lg py-2.5 text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      loginMethod === "phone" 
                        ? "bg-background text-navy shadow-sm border border-border/40" 
                        : "text-foreground-muted hover:text-navy"
                    }`}
                  >
                    <Phone className="h-3.5 w-3.5" />
                    Téléphone (Indicatif)
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  {loginMethod === "email" ? (
                    <motion.div 
                      key="email"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 8 }}
                      transition={{ duration: 0.15 }}
                      className="space-y-2"
                    >
                      <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-navy">Identifiant ou Email *</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-foreground-muted pointer-events-none" />
                        <input
                          type="text"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required={loginMethod === "email"}
                          className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-border bg-background-secondary text-foreground text-sm focus:outline-none focus:border-navy transition-all focus:bg-background"
                          placeholder="Ex: marc.sow@uac.edu"
                        />
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="phone"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 8 }}
                      transition={{ duration: 0.15 }}
                      className="space-y-2"
                    >
                      <label htmlFor="phone" className="text-xs font-bold uppercase tracking-wider text-navy">Numéro de téléphone *</label>
                      <PhoneInput
                        value={formData.phone}
                        onChange={(val: any) => setFormData({ ...formData, phone: val || "" })}
                        className="w-full"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Password */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-navy">Mot de passe *</label>
                  <Link 
                    href="/forgot-password" 
                    className="text-xs text-gold hover:text-gold-hover font-bold transition-colors"
                  >
                    Mot de passe oublié ?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-foreground-muted pointer-events-none" />
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full pl-10 pr-10 py-3.5 rounded-xl border border-border bg-background-secondary text-foreground text-sm focus:outline-none focus:border-navy transition-all focus:bg-background"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-foreground-muted hover:text-navy transition-colors p-1"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-navy hover:bg-navy-hover text-white text-xs font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-75 flex items-center justify-center gap-2 mt-8"
              >
                {isLoading ? (
                  <>
                    <InlineLoader size={16} />
                    Connexion en cours...
                  </>
                ) : (
                  <>
                    Se connecter
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

            </form>
          </div>
        </motion.div>

        {/* Register Link */}
        <p className="text-center text-xs text-foreground-muted mt-6">
          Pas encore inscrit ?{" "}
          <Link href="/register" className="text-gold hover:text-gold-hover font-bold transition-colors">
            Créer un compte
          </Link>
        </p>

      </div>
    </div>
  );
}
