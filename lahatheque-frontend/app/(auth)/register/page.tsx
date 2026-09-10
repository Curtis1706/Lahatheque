"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BookOpen, 
  UserCheck, 
  ArrowRight, 
  ArrowLeft,
  Mail, 
  Lock, 
  User, 
  Sparkles,
  AlertCircle,
  Handshake,
  ShieldCheck,
  Check,
  RotateCcw,
  MessageSquare,
  KeyRound,
} from "lucide-react";
import { registerUser, requestOTP, verifyOTP } from "@/lib/services/auth";
import { PhoneInput } from "@/components/ui/phone-input";
import { OTPInput } from "@/components/ui/otp-input";
import { cn } from "@/lib/utils";

export default function RegisterPage() {
  const router = useRouter();

  // Étape courante (1: Profil & Avatar, 2: Identité & Téléphone, 3: Email & Mot de passe, 4: Vérification OTP)
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Rôles en auto-inscription directe selon Cahier des Charges v3.2 : Lecteur ou Auteur
  const [role, setRole] = useState<"student" | "author">("student");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    phone: "+229",
    country: "BJ",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  // États du flux de vérification OTP
  const [otpCode, setOtpCode] = useState<string[]>(["", "", "", "", "", ""]);
  const [otpChannel, setOtpChannel] = useState<"email" | "sms">("email");
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [otpVerifying, setOtpVerifying] = useState<boolean>(false);

  React.useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("La photo ne doit pas dépasser 5 Mo.");
        return;
      }
      setAvatarFile(file);
      const url = URL.createObjectURL(file);
      setAvatarPreview(url);
      setError("");
    }
  };

  const removeAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  const handleNextStep = () => {
    setError("");
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      if (!formData.first_name.trim()) {
        setError("Veuillez renseigner votre prénom.");
        return;
      }
      if (!formData.last_name.trim()) {
        setError("Veuillez renseigner votre nom de famille.");
        return;
      }
      setStep(3);
    }
  };

  const handlePrevStep = () => {
    setError("");
    if (step > 1 && step < 4) {
      setStep((prev) => (prev - 1) as 1 | 2 | 3 | 4);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.email.trim()) {
      setError("Veuillez renseigner une adresse email valide.");
      return;
    }
    if (!formData.password || formData.password.length < 8) {
      setError("Le mot de passe doit comporter au moins 8 caractères.");
      return;
    }

    setLoading(true);

    try {
      const cleanPhone = formData.phone && formData.phone.trim() !== "+229" && formData.phone.trim().length > 4
        ? formData.phone.trim().replace(/\s+/g, '')
        : undefined;

      const res = await registerUser({
        email: formData.email.trim(),
        password: formData.password,
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        phone: cleanPhone,
        country: formData.country,
        role: role
      }, avatarFile);

      if (res.success) {
        setSuccess("Compte initialisé ! Un code de vérification vient d'être envoyé par e-mail.");
        setStep(4);
        setResendCooldown(60);
      } else {
        setError(res.error || "Erreur lors de l'inscription.");
      }
    } catch (err: any) {
      console.error("[REGISTER FORM ERROR]", err);
      setError("Une erreur inattendue est survenue.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const fullCode = otpCode.join("").trim();
    if (fullCode.length !== 6) {
      setError("Veuillez saisir les 6 chiffres du code de vérification.");
      return;
    }
    setError("");
    setSuccess("");
    setOtpVerifying(true);

    try {
      const res = await verifyOTP(formData.email.trim(), fullCode);
      if (res.success) {
        setSuccess("Compte validé avec succès ! Accès en cours...");
        setTimeout(() => {
          if (role === "author") {
            router.push("/author");
          } else {
            router.push("/student");
          }
        }, 1200);
      } else {
        setError(res.error || "Code de vérification invalide ou expiré.");
      }
    } catch (err) {
      console.error("[OTP VERIFY ERROR]", err);
      setError("Erreur réseau lors de la validation du code.");
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleResendOtp = async (channel: "email" | "sms") => {
    if (resendCooldown > 0) return;
    setError("");
    setSuccess("");
    setOtpChannel(channel);
    try {
      const cleanPhone = formData.phone && formData.phone.trim() !== "+229" && formData.phone.trim().length > 4
        ? formData.phone.trim().replace(/\s+/g, '')
        : undefined;

      if (channel === "sms" && !cleanPhone) {
        setError("Aucun numéro de téléphone valide n'a été fourni lors de l'inscription pour le SMS.");
        return;
      }

      const targetIdentifier = (channel === "sms" && cleanPhone) ? cleanPhone : formData.email;
      const res = await requestOTP(targetIdentifier.trim(), channel);
      if (res.success) {
        setSuccess(`Un nouveau code vous a été envoyé par ${channel === "email" ? "e-mail" : "SMS"}.`);
        setResendCooldown(60);
      } else {
        setError(res.error || "Impossible de renvoyer le code.");
      }
    } catch (err) {
      console.error("[OTP RESEND ERROR]", err);
      setError("Erreur lors du renvoi du code.");
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      const digits = value.replace(/\D/g, "").slice(0, 6).split("");
      if (digits.length > 0) {
        const next = [...otpCode];
        digits.forEach((char, idx) => {
          if (idx < 6) next[idx] = char;
        });
        setOtpCode(next);
        const nextFocus = Math.min(digits.length, 5);
        document.getElementById(`otp-digit-${nextFocus}`)?.focus();
        return;
      }
    }
    const digit = value.replace(/\D/g, "");
    const next = [...otpCode];
    next[index] = digit;
    setOtpCode(next);
    if (digit && index < 5) {
      document.getElementById(`otp-digit-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpCode[index] && index > 0) {
      document.getElementById(`otp-digit-${index - 1}`)?.focus();
    }
  };

  const stepsMetadata = [
    { num: 1, title: "Profil", icon: UserCheck },
    { num: 2, title: "Identité", icon: User },
    { num: 3, title: "Sécurité", icon: ShieldCheck },
    { num: 4, title: "Vérification", icon: KeyRound },
  ];

  return (
    <div className="min-h-screen bg-background-secondary text-foreground flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="w-full max-w-xl space-y-6 bg-background p-6 sm:p-10 rounded-3xl border border-border shadow-xl animate-in fade-in duration-300"
      >
        
        {/* En-tête */}
        <div className="text-center space-y-3 flex flex-col items-center justify-center">
          <Link href="/" className="inline-flex flex-col items-center mb-1 group">
            <div className="p-1.5 bg-background rounded-3xl border border-border shadow-lg group-hover:border-gold/30 transition-colors">
              <Image src="/logo.jpg" alt="LAHA Editions" width={72} height={72} className="rounded-2xl" />
            </div>
          </Link>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-navy/5 text-navy text-xs font-bold uppercase tracking-wider border border-gold/20">
            <Sparkles className="w-3.5 h-3.5 text-gold" />
            Création de Compte LAHAThèque
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-navy">
            Rejoignez la Bibliothèque Numérique
          </h1>
          <p className="text-xs text-foreground-muted max-w-md">
            Créez votre compte en 3 étapes simples pour accéder immédiatement à vos lectures ou déposer vos manuscrits.
          </p>
        </div>

        {/* Stepper Horizontal Épuré */}
        <div className="pt-2 pb-1">
          <div className="flex items-center justify-between max-w-sm mx-auto">
            {stepsMetadata.map((s, idx) => (
              <React.Fragment key={s.num}>
                <div className="flex flex-col items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (s.num < step) setStep(s.num as 1 | 2 | 3);
                    }}
                    disabled={s.num > step}
                    className={cn(
                      "w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all min-h-[36px] min-w-[36px]",
                      step === s.num
                        ? "bg-navy text-gold ring-2 ring-gold border border-navy shadow-md"
                        : step > s.num
                        ? "bg-gold text-navy cursor-pointer hover:bg-gold/90"
                        : "bg-background-secondary text-foreground-muted border border-border cursor-not-allowed"
                    )}
                    title={`Étape ${s.num}: ${s.title}`}
                  >
                    {step > s.num ? <Check className="w-4 h-4 stroke-[3]" /> : s.num}
                  </button>
                  <span className={cn(
                    "text-[10px] font-semibold uppercase tracking-wider font-sans",
                    step === s.num ? "text-navy font-bold" : step > s.num ? "text-gold" : "text-foreground-muted"
                  )}>
                    {s.title}
                  </span>
                </div>
                {idx < stepsMetadata.length - 1 && (
                  <div className="flex-1 h-0.5 mx-2 bg-border relative -top-3.5">
                    <div
                      className="h-full bg-gold transition-all duration-300"
                      style={{ width: step > idx + 1 ? "100%" : "0%" }}
                    />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Alertes Erreur / Succès */}
        {error && (
          <div className="p-3.5 rounded-xl bg-error/10 border border-error/30 text-error text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {success && (
          <div className="p-3.5 rounded-xl bg-success/10 border border-success/30 text-success text-xs font-medium flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            {success}
          </div>
        )}

        {/* Formulaire avec Transitions Multi-Step */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <AnimatePresence mode="wait">
            
            {/* ── Étape 1 : Profil & Photo ────────────────── */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                transition={{ duration: 0.25 }}
                className="space-y-5"
              >
                {/* Sélection du Profil */}
                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-navy block text-center sm:text-left">
                    Sélectionnez votre profil d&apos;inscription
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setRole("student")}
                      className={cn(
                        "p-4 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center gap-2 transition-all cursor-pointer min-h-[96px]",
                        role === "student"
                          ? "bg-navy text-white border-navy ring-2 ring-gold shadow-md"
                          : "bg-background text-foreground border-border hover:border-gold"
                      )}
                    >
                      <BookOpen className={cn("w-6 h-6", role === "student" ? "text-gold" : "text-foreground-muted")} />
                      <div className="text-center">
                        <span className="font-bold block text-sm">Lecteur</span>
                        <span className="text-[10px] text-foreground-muted block font-normal">Étudiant, Élève, Particulier</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRole("author")}
                      className={cn(
                        "p-4 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center gap-2 transition-all cursor-pointer min-h-[96px]",
                        role === "author"
                          ? "bg-navy text-white border-navy ring-2 ring-gold shadow-md"
                          : "bg-background text-foreground border-border hover:border-gold"
                      )}
                    >
                      <UserCheck className={cn("w-6 h-6", role === "author" ? "text-gold" : "text-foreground-muted")} />
                      <div className="text-center">
                        <span className="font-bold block text-sm">Auteur</span>
                        <span className="text-[10px] text-foreground-muted block font-normal">Dépôt &amp; étude de manuscrits</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Photo de profil (Optionnel) */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-navy block text-center sm:text-left">
                    Photo de profil <span className="text-foreground-muted font-normal normal-case">(Optionnel)</span>
                  </label>
                  <div className="flex items-center gap-5 p-3.5 rounded-2xl bg-background-secondary border border-border">
                    <div className="relative group shrink-0">
                      <div className="w-16 h-16 rounded-full bg-background border-2 border-border overflow-hidden flex items-center justify-center shadow-inner">
                        {avatarPreview ? (
                          <img 
                            src={avatarPreview} 
                            alt="Aperçu profil" 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <User className="w-8 h-8 text-foreground-muted" />
                        )}
                      </div>
                      {avatarPreview && (
                        <button
                          type="button"
                          onClick={removeAvatar}
                          className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-navy hover:bg-navy-hover text-white text-[10px] font-bold flex items-center justify-center shadow"
                          title="Supprimer la photo"
                        >
                          ×
                        </button>
                      )}
                    </div>

                    <div className="flex-1 space-y-1">
                      <label 
                        htmlFor="avatar-upload" 
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background border border-border hover:border-gold text-xs font-semibold text-navy cursor-pointer transition-colors shadow-sm min-h-[36px]"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-gold" />
                        {avatarPreview ? "Changer la photo" : "Importer une photo"}
                      </label>
                      <input 
                        id="avatar-upload"
                        type="file" 
                        accept="image/png, image/jpeg, image/webp" 
                        onChange={handleAvatarChange}
                        className="hidden" 
                      />
                      <p className="text-[10px] text-foreground-muted">
                        Formats JPG, PNG ou WEBP acceptés. Max 5 Mo.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bouton Suivant Étape 1 */}
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="w-full py-3.5 px-4 rounded-xl bg-navy hover:bg-navy-hover text-white text-xs sm:text-sm font-bold shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
                >
                  Continuer vers vos coordonnées
                  <ArrowRight className="w-4 h-4 text-gold" />
                </button>
              </motion.div>
            )}

            {/* ── Étape 2 : Identité & Téléphone ──────────── */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                transition={{ duration: 0.25 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-navy">Prénom *</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3.5 w-4 h-4 text-foreground-muted pointer-events-none" />
                      <input
                        type="text"
                        required
                        value={formData.first_name}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                        placeholder="Jean"
                        className="w-full pl-10 pr-3 py-3 rounded-xl border border-border bg-background text-foreground text-xs sm:text-sm focus:ring-2 focus:ring-navy focus:outline-none transition-all min-h-[44px]"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-navy">Nom *</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3.5 w-4 h-4 text-foreground-muted pointer-events-none" />
                      <input
                        type="text"
                        required
                        value={formData.last_name}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                        placeholder="Kouadio"
                        className="w-full pl-10 pr-3 py-3 rounded-xl border border-border bg-background text-foreground text-xs sm:text-sm focus:ring-2 focus:ring-navy focus:outline-none transition-all min-h-[44px]"
                      />
                    </div>
                  </div>
                </div>

                {/* Numéro de Téléphone avec sélection d'indicatif pays */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-navy">Numéro de Téléphone</label>
                  <PhoneInput
                    value={formData.phone}
                    onChange={(phone) => setFormData({ ...formData, phone })}
                  />
                </div>

                {/* Boutons Navigation Étape 2 */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="w-1/3 py-3 px-3 rounded-xl border border-border bg-background hover:bg-background-secondary text-foreground text-xs sm:text-sm font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px]"
                  >
                    <ArrowLeft className="w-4 h-4 text-foreground-muted" />
                    Retour
                  </button>
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="w-2/3 py-3.5 px-4 rounded-xl bg-navy hover:bg-navy-hover text-white text-xs sm:text-sm font-bold shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
                  >
                    Sécuriser le compte
                    <ArrowRight className="w-4 h-4 text-gold" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── Étape 3 : Email & Mot de passe ─────────── */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                transition={{ duration: 0.25 }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-navy">Adresse Email *</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-foreground-muted pointer-events-none" />
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="jean.kouadio@example.com"
                      className="w-full pl-10 pr-3 py-3 rounded-xl border border-border bg-background text-foreground text-xs sm:text-sm focus:ring-2 focus:ring-navy focus:outline-none transition-all min-h-[44px]"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-navy">Mot de Passe *</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-foreground-muted pointer-events-none" />
                    <input
                      type="password"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Minimum 8 caractères"
                      className="w-full pl-10 pr-3 py-3 rounded-xl border border-border bg-background text-foreground text-xs sm:text-sm focus:ring-2 focus:ring-navy focus:outline-none transition-all min-h-[44px]"
                    />
                  </div>
                  <p className="text-[10px] text-foreground-muted">
                    Doit comporter au moins 8 caractères pour protéger vos accès.
                  </p>
                </div>

                {/* Récapitulatif profil */}
                <div className="p-3 rounded-xl bg-background-secondary border border-border text-[11px] text-foreground-muted flex items-center justify-between">
                  <span>Inscription en tant que : <strong className="text-navy capitalize">{role === "author" ? "Auteur" : "Lecteur"}</strong></span>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-gold hover:underline font-bold text-[10px] uppercase tracking-wider cursor-pointer"
                  >
                    Modifier
                  </button>
                </div>

                {/* Boutons Navigation Étape 3 */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    disabled={loading}
                    className="w-1/3 py-3 px-3 rounded-xl border border-border bg-background hover:bg-background-secondary text-foreground text-xs sm:text-sm font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px] disabled:opacity-50"
                  >
                    <ArrowLeft className="w-4 h-4 text-foreground-muted" />
                    Retour
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-2/3 py-3.5 px-4 rounded-xl bg-navy hover:bg-navy-hover text-white text-xs sm:text-sm font-bold shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer min-h-[44px] disabled:opacity-70"
                  >
                    {loading ? "Création en cours..." : `Créer mon compte ${role === "author" ? "Auteur" : "Lecteur"}`}
                    <ArrowRight className="w-4 h-4 text-gold" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── Étape 4 : Vérification OTP ─────────── */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                transition={{ duration: 0.25 }}
                className="space-y-5"
              >
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-navy/5 border border-gold/20 flex items-center justify-center mx-auto text-navy">
                    <KeyRound className="w-6 h-6 text-gold" />
                  </div>
                  <h2 className="text-lg font-serif font-bold text-navy">
                    Vérification de Sécurité
                  </h2>
                  <p className="text-xs text-foreground-muted max-w-sm mx-auto">
                    Saisissez le code à 6 chiffres envoyé à <strong className="text-navy">{formData.email}</strong> pour valider votre compte.
                  </p>
                </div>

                {/* Sélecteur de canal (Email Resend vs SMS) */}
                <div className="flex items-center justify-center gap-2 p-1 bg-background-secondary rounded-xl border border-border max-w-xs mx-auto">
                  <button
                    type="button"
                    onClick={() => handleResendOtp("email")}
                    disabled={resendCooldown > 0}
                    className={cn(
                      "flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all min-h-[36px]",
                      otpChannel === "email"
                        ? "bg-navy text-white shadow-sm"
                        : "text-foreground-muted hover:text-navy cursor-pointer"
                    )}
                  >
                    <Mail className="w-3.5 h-3.5 text-gold" />
                    E-mail
                  </button>
                  {formData.phone && formData.phone.trim() !== "+229" && formData.phone.trim().length > 4 && (
                    <button
                      type="button"
                      onClick={() => handleResendOtp("sms")}
                      disabled={resendCooldown > 0}
                      className={cn(
                        "flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all min-h-[36px]",
                        otpChannel === "sms"
                          ? "bg-navy text-white shadow-sm"
                          : "text-foreground-muted hover:text-navy cursor-pointer"
                      )}
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-gold" />
                      SMS
                    </button>
                  )}
                </div>

                {/* Saisie des 6 chiffres via composant 21st.dev */}
                <div className="py-2">
                  <OTPInput
                    value={otpCode}
                    onChange={setOtpCode}
                    onComplete={() => handleVerifyOtp()}
                    disabled={otpVerifying}
                    separator={true}
                  />
                </div>

                {/* Bouton de validation OTP */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => handleVerifyOtp()}
                    disabled={otpVerifying || otpCode.join("").length !== 6}
                    className="w-full py-3.5 px-4 rounded-xl bg-navy hover:bg-navy-hover text-white text-xs sm:text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer min-h-[44px] disabled:opacity-50"
                  >
                    {otpVerifying ? "Vérification en cours..." : "Valider mon compte"}
                    <ArrowRight className="w-4 h-4 text-gold" />
                  </button>
                </div>

                {/* Renvoi de code avec décompte */}
                <div className="text-center pt-1">
                  {resendCooldown > 0 ? (
                    <p className="text-xs text-foreground-muted font-mono">
                      Renvoyer un nouveau code dans <span className="font-bold text-navy">{resendCooldown}s</span>
                    </p>
                  ) : (
                    <div className="flex items-center justify-center gap-3 text-xs">
                      <button
                        type="button"
                        onClick={() => handleResendOtp("email")}
                        className="text-navy hover:text-gold font-bold underline flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3 text-gold" />
                        Renvoyer par e-mail
                      </button>
                      {formData.phone && formData.phone.trim() !== "+229" && formData.phone.trim().length > 4 && (
                        <>
                          <span className="text-border">•</span>
                          <button
                            type="button"
                            onClick={() => handleResendOtp("sms")}
                            className="text-navy hover:text-gold font-bold underline flex items-center gap-1 cursor-pointer"
                          >
                            <MessageSquare className="w-3 h-3 text-gold" />
                            Renvoyer par SMS
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </form>

        {/* Bloc d'Accès Institutionnel / Partenaires selon v3.2 */}
        <div className="bg-background-secondary p-4 rounded-2xl border border-border space-y-2 text-xs">
          <div className="flex items-center gap-2 text-navy font-bold">
            <Handshake className="w-4 h-4 text-gold shrink-0" />
            <span>Institutions &amp; Partenaires (Écoles, Éditeurs, Grossistes)</span>
          </div>
          <p className="text-[11px] text-foreground-muted">
            Les comptes institutionnels (conventions partenaires, maisons d&apos;édition et licences grossistes) sont soumis à validation préalable par LAHA Éditions.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-1 text-[11px] font-bold text-navy hover:text-gold transition-colors pt-1"
          >
            Faire une demande de partenariat institutionnel →
          </Link>
        </div>

        {/* Footer */}
        <div className="text-center pt-2 border-t border-border text-xs text-foreground-muted">
          Vous avez déjà un compte ?{" "}
          <Link href="/login" className="font-bold text-navy hover:underline">
            Se connecter
          </Link>
        </div>

      </motion.div>
    </div>
  );
}
