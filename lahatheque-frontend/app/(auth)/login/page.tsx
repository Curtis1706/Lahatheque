"use client"

import type React from "react"

import { useState, useEffect, Suspense } from "react"
import { motion } from "framer-motion"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Eye, EyeOff, Mail, Lock, ArrowRight, Phone } from "lucide-react"

import BlurText from "@/components/ui/blur-text"
import { GlowingEffect } from "@/components/ui/glowing-effect"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PhoneInput } from "@/components/ui/phone-input"
import { useAuth, type LoginResponse } from "@/hooks/use-auth"

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-laha-black flex items-center justify-center text-laha-gold">Chargement...</div>}>
      <LoginContent />
    </Suspense>
  )
}

function LoginContent() {
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    password: "",
  })
  const [loginMethod, setLoginMethod] = useState<"email" | "phone">("email")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useAuth()

  // Gérer les messages d'erreur depuis l'URL
  useEffect(() => {
    const message = searchParams.get('message')
    if (message) {
      setError(message)
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const loginIdentity = loginMethod === "email" ? formData.email : formData.phone
      const result: LoginResponse = await login(loginIdentity, formData.password)
      
      if (result.success) {
        // Redirection directe selon le rôle (plus d'OTP au login)
        const role = result.user?.role
        if (role === 'admin' || role === 'super_admin') {
          router.push('/dashboard/admin')
        } else if (role === 'student') {
          router.push('/dashboard/student')
        } else if (role === 'teacher') {
          router.push('/dashboard/teacher')
        } else if (role === 'author') {
          router.push('/dashboard/author')
        } else if (role === 'parent') {
          router.push('/dashboard/parent')
        } else if (role === 'super_client') {
          router.push('/dashboard/super_client')
        } else {
          router.push('/dashboard')
        }
      } else {
        setError(result.error || "Identifiants invalides")
      }
    } catch (error) {
      console.error('Erreur lors de la connexion:', error)
      setError("Erreur interne du serveur")
    } finally {
      setIsLoading(false)
    }
  }

  // Fonctions OTP conservées uniquement pour référence si besoin futur, 
  // mais inutilisées dans le flux de login standard maintenant.
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    // Clear error when user starts typing
    if (error) {
      setError("")
    }
  }

  return (
    <div className="min-h-screen bg-hero-gradient flex items-center justify-center p-4 transition-colors duration-500">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center space-x-4 mb-10 group transition-all">
            <div className="p-2 bg-background rounded-2xl shadow-lg border border-transparent group-hover:border-laha-gold/30 transition-colors">
              <Image src="/logo.png" alt="LAHA Editions" width={48} height={48} className="rounded-lg" />
            </div>
            <span className="font-heading text-3xl font-bold text-foreground">Lahacademia</span>
          </Link>

          <BlurText
            text="Bon retour parmi nous !"
            delay={150}
            animateBy="words"
            direction="top"
            className="font-heading text-4xl font-bold text-foreground mb-3"
          />

          <BlurText
            text="Connectez-vous pour accéder à votre espace personnel"
            delay={200}
            animateBy="words"
            direction="bottom"
            className="text-muted-foreground font-medium"
          />
        </div>

        {/* Login Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="relative"
        >
          <div className="relative rounded-3xl border border-transparent p-8 sm:p-10 bg-card/60 dark:bg-laha-black-light/50 backdrop-blur-xl shadow-2xl overflow-hidden">
            <GlowingEffect spread={60} glow={true} disabled={false} proximity={64} inactiveZone={0.01} />

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
                  {error}
                </div>
              )}

              {/* Login Method Toggle */}
              <Tabs defaultValue="email" className="w-full" onValueChange={(val: string) => setLoginMethod(val as "email" | "phone")}>
                <TabsList className="grid w-full grid-cols-2 bg-muted/50 border border-transparent p-1 rounded-xl mb-8">
                  <TabsTrigger 
                    value="email" 
                    className="rounded-lg py-2.5 data-[state=active]:bg-background data-[state=active]:text-laha-gold data-[state=active]:shadow-sm transition-all"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Email
                  </TabsTrigger>
                  <TabsTrigger 
                    value="phone" 
                    className="rounded-lg py-2.5 data-[state=active]:bg-background data-[state=active]:text-laha-gold data-[state=active]:shadow-sm transition-all"
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Téléphone
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="email" className="mt-0 space-y-6">
                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-foreground/80 mb-2 ml-1">
                      Adresse email ou Pseudo
                    </label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-laha-gold transition-colors" />
                      <input
                        type="text"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required={loginMethod === "email"}
                        className="w-full pl-12 pr-4 py-4 bg-background border border-transparent rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-laha-gold/30 focus:border-laha-gold/50 transition-all text-base shadow-sm"
                        placeholder="votre@email.com ou votre pseudo"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="phone" className="mt-0 space-y-6">
                  <div>
                    <label htmlFor="phone" className="block text-sm font-semibold text-foreground/80 mb-2 ml-1">
                      Numéro de téléphone
                    </label>
                    <PhoneInput
                      value={formData.phone}
                      onChange={(val: any) => setFormData({ ...formData, phone: val || "" })}
                      className="w-full"
                    />
                  </div>
                </TabsContent>
              </Tabs>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-foreground/80 mb-2 ml-1">
                  Mot de passe
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-laha-gold transition-colors" />
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full pl-12 pr-12 py-4 bg-background border border-transparent rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-laha-gold/30 focus:border-laha-gold/50 transition-all text-base shadow-sm"
                    placeholder="•••••••• ou Code PIN"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between px-1">
                <label className="flex items-center cursor-pointer group">
                  <input type="checkbox" className="h-4 w-4 rounded border-border bg-background text-laha-gold focus:ring-laha-gold" />
                  <span className="ml-2 text-sm text-muted-foreground group-hover:text-foreground transition-colors font-medium">Se souvenir de moi</span>
                </label>
                <Link href="/forgot-password" className="text-sm text-laha-gold font-bold hover:underline transition-all">
                  Mot de passe oublié ?
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-14 bg-gradient-to-r from-laha-gold to-laha-gold-warm py-3 rounded-xl text-laha-black font-bold hover:scale-[1.02] shadow-lg shadow-laha-gold/20 transition-all disabled:opacity-70 flex items-center justify-center gap-3 text-lg"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 border-3 border-laha-black/20 border-t-laha-black rounded-full animate-spin" />
                    <span>Connexion en cours...</span>
                  </div>
                ) : (
                  <>
                    Se connecter
                    <ArrowRight className="h-6 w-6" />
                  </>
                )}
              </button>
            </form>

          </div>
        </motion.div>

        {/* Sign Up Link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-center mt-10"
        >
          <p className="text-muted-foreground font-medium">
            Pas encore de compte ?{" "}
            <Link href="/account-type" className="text-laha-gold font-bold hover:underline ml-1">
              Créer un compte
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
