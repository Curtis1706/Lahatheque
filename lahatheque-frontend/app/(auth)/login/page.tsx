"use client";

import * as React from "react";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Loader2, Mail, Lock, Phone, ArrowRight } from "lucide-react";
import { PhoneInput } from "@/components/ui/phone-input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth, type LoginResponse } from "@/hooks/use-auth";

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center text-navy font-bold">
        Chargement de l'espace connexion...
      </div>
    }>
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
          router.push("/dashboard/admin");
        } else if (role === "student") {
          router.push("/dashboard/student");
        } else if (role === "teacher") {
          router.push("/teacher");
        } else if (role === "author") {
          router.push("/dashboard/author");
        } else if (role === "publisher") {
          router.push("/publisher");
        } else {
          router.push("/dashboard");
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
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center space-x-3 mb-4 group">
            <div className="p-2 bg-background rounded-xl border border-border shadow-sm group-hover:border-gold/30 transition-colors">
              <Image src="/logo.png" alt="LAHA Editions" width={36} height={36} className="rounded" />
            </div>
            <span className="font-serif text-2xl font-bold text-navy">LAHAThèque</span>
          </Link>
          <p className="text-xs text-foreground-muted">Accédez à votre bibliothèque universitaire numérique</p>
        </div>

        {/* Auth form card inspired by @bankkroll component */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="relative overflow-hidden rounded-2xl border border-border/60 bg-background shadow-xl"
        >
          <div className="p-8">
            <div className="mb-6 text-center">
              <h1 className="text-xl font-bold text-navy">Bon retour</h1>
              <p className="text-xs text-foreground-muted mt-1">Connectez-vous pour continuer</p>
            </div>

            {error && (
              <div className="mb-4 animate-in fade-in slide-in-from-top-1 rounded-lg border border-error/20 bg-error/10 p-3 text-xs text-error font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Tab Selector for Identity type */}
              <Tabs defaultValue="email" className="w-full" onValueChange={(val: string) => setLoginMethod(val as "email" | "phone")}>
                <TabsList className="grid w-full grid-cols-2 bg-background-secondary p-1 rounded border border-border/40 mb-4">
                  <TabsTrigger 
                    value="email" 
                    className="rounded py-2 text-xs font-bold transition-all data-[state=active]:bg-background data-[state=active]:text-navy data-[state=active]:shadow-sm"
                  >
                    <Mail className="h-3.5 w-3.5 mr-2" />
                    Adresse Email
                  </TabsTrigger>
                  <TabsTrigger 
                    value="phone" 
                    className="rounded py-2 text-xs font-bold transition-all data-[state=active]:bg-background data-[state=active]:text-navy data-[state=active]:shadow-sm"
                  >
                    <Phone className="h-3.5 w-3.5 mr-2" />
                    Téléphone (Indicatif)
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="email" className="mt-0 space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="email" className="text-xs font-bold text-navy">Identifiant ou Email *</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-foreground-muted pointer-events-none" />
                      <input
                        type="text"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required={loginMethod === "email"}
                        className="w-full pl-10 pr-4 py-3 rounded border border-border bg-background-secondary text-foreground text-sm focus:outline-none focus:border-navy"
                        placeholder="Ex: marc.sow@uac.edu"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="phone" className="mt-0 space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="phone" className="text-xs font-bold text-navy">Numéro de téléphone *</label>
                    <PhoneInput
                      value={formData.phone}
                      onChange={(val: any) => setFormData({ ...formData, phone: val || "" })}
                      className="w-full"
                    />
                  </div>
                </TabsContent>
              </Tabs>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-xs font-bold text-navy">Mot de passe *</label>
                  <Link 
                    href="/forgot-password" 
                    className="text-xs text-gold hover:text-gold-dark font-bold transition-colors"
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
                    className="w-full pl-10 pr-10 py-3 rounded border border-border bg-background-secondary text-foreground text-sm focus:outline-none focus:border-navy"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-foreground-muted hover:text-navy transition-colors p-1"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-navy hover:bg-navy-hover text-white text-xs font-bold rounded shadow transition-all disabled:opacity-75 flex items-center justify-center gap-2 mt-6"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
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
          <Link href="/register" className="text-gold hover:text-gold-dark font-bold underline transition-colors">
            Créer un compte
          </Link>
        </p>

      </div>
    </div>
  );
}
