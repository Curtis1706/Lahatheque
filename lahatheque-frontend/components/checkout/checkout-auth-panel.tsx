"use client";

import { useState } from "react";
import { User as UserIcon, Mail, Lock, KeyRound, ShieldCheck, ArrowRight, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { PhoneInput } from "@/components/ui/phone-input";
import { OTPInput } from "@/components/ui/otp-input";
import { registerUser, requestOTP, verifyOTP } from "@/lib/services/auth";
import { toast } from "sonner";

interface CheckoutAuthPanelProps {
  onAuthenticated?: () => void;
}

export function CheckoutAuthPanel({ onAuthenticated }: CheckoutAuthPanelProps) {
  const { login, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");

  // State Connexion
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState("");

  // State Inscription
  const [regFirstName, setRegFirstName] = useState("");
  const [regLastName, setRegLastName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [regError, setRegError] = useState("");

  // Étape OTP pour l'inscription
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState(["", "", "", "", "", ""]);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);

  // Soumission Connexion
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    const startTime = performance.now();

    if (!loginEmail.trim() || !loginPassword) {
      setLoginError("Veuillez renseigner votre email et votre mot de passe.");
      return;
    }

    setIsLoggingIn(true);
    console.groupCollapsed(`[CHECKOUT AUTH] Tentative de connexion [${new Date().toLocaleTimeString()}]`);
    console.log("Email:", loginEmail.trim());

    try {
      const res = await login(loginEmail.trim(), loginPassword);
      const elapsedMs = Math.round(performance.now() - startTime);
      console.log(`[CHECKOUT AUTH] Résultat login en ${elapsedMs}ms:`, res);
      console.groupEnd();

      if (res.success) {
        toast.success("Connexion réussie ! Vos coordonnées ont été chargées.");
        if (onAuthenticated) onAuthenticated();
      } else {
        setLoginError(res.error || "Identifiants incorrects. Veuillez réessayer.");
      }
    } catch (err: any) {
      console.error("[CHECKOUT AUTH] Erreur réseau:", err);
      console.groupEnd();
      setLoginError("Impossible de joindre le serveur d'authentification.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Soumission Inscription Rapide (Étape 1)
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");
    const startTime = performance.now();

    if (!regEmail.trim()) {
      setRegError("Une adresse e-mail valide est requise.");
      return;
    }
    if (!regPassword || regPassword.length < 8) {
      setRegError("Le mot de passe doit comporter au moins 8 caractères.");
      return;
    }

    setIsRegistering(true);
    console.groupCollapsed(`[CHECKOUT AUTH] Initialisation compte client [${new Date().toLocaleTimeString()}]`);

    try {
      const cleanPhone = regPhone && regPhone.trim() !== "+229" && regPhone.trim().length > 4
        ? regPhone.trim().replace(/\s+/g, "")
        : undefined;

      const res = await registerUser({
        first_name: regFirstName.trim() || "Client",
        last_name: regLastName.trim() || "LAHAThèque",
        email: regEmail.trim(),
        password: regPassword,
        phone: cleanPhone,
        country: "BJ",
        role: "student",
      });

      const elapsedMs = Math.round(performance.now() - startTime);
      console.log(`[CHECKOUT AUTH] Compte initialisé en ${elapsedMs}ms:`, res);
      console.groupEnd();

      if (res.success) {
        toast.success("Compte créé ! Veuillez saisir le code de vérification envoyé.");
        setIsOtpStep(true);
        setResendCooldown(60);
      } else {
        setRegError(res.error || "Impossible de créer le compte avec ces informations.");
      }
    } catch (err: any) {
      console.error("[CHECKOUT AUTH] Erreur création compte:", err);
      console.groupEnd();
      setRegError("Erreur de communication avec le serveur.");
    } finally {
      setIsRegistering(false);
    }
  };

  // Soumission Validation OTP (Étape 2)
  const handleOtpVerify = async (codeToVerify?: string) => {
    const fullCode = codeToVerify || otpCode.join("").trim();
    if (fullCode.length !== 6) {
      setOtpError("Veuillez saisir le code complet à 6 chiffres.");
      return;
    }

    setOtpError("");
    setIsVerifyingOtp(true);
    const startTime = performance.now();
    console.groupCollapsed(`[CHECKOUT AUTH] Validation OTP [${new Date().toLocaleTimeString()}]`);

    try {
      const res = await verifyOTP(regEmail.trim(), fullCode);
      const elapsedMs = Math.round(performance.now() - startTime);
      console.log(`[CHECKOUT AUTH] Résultat OTP en ${elapsedMs}ms:`, res);
      console.groupEnd();

      if (res.success) {
        toast.success("Votre compte client est validé et prêt pour le paiement !");
        await refreshUser();
        if (onAuthenticated) onAuthenticated();
      } else {
        setOtpError(res.error || "Code incorrect ou expiré. Veuillez vérifier votre boîte mail.");
      }
    } catch (err: any) {
      console.error("[CHECKOUT AUTH] Erreur validation OTP:", err);
      console.groupEnd();
      setOtpError("Erreur réseau lors de la validation du code.");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Renvoi du code OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    try {
      const res = await requestOTP(regEmail.trim(), "email");
      if (res.success) {
        toast.success("Un nouveau code de vérification vous a été envoyé par e-mail.");
        setResendCooldown(60);
      } else {
        toast.error(res.error || "Impossible de renvoyer le code pour le moment.");
      }
    } catch {
      toast.error("Erreur réseau lors du renvoi du code.");
    }
  };

  return (
    <div className="bg-background border border-border rounded-2xl p-6 sm:p-8 shadow-md space-y-6">
      
      {/* En-tête de section */}
      <div className="border-b border-border pb-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/10 text-gold text-[11px] font-bold uppercase tracking-wider mb-2">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Étape 1 • Identification Client</span>
        </div>
        <h2 className="font-serif text-xl sm:text-2xl font-bold text-navy">
          Finalisez votre commande
        </h2>
        <p className="text-xs text-foreground-muted mt-1 leading-relaxed">
          Pour activer vos accès de lecture et sauvegarder vos adresses de livraison, identifiez-vous ou créez votre compte en 1 minute. Votre panier reste intact.
        </p>
      </div>

      {/* Onglets Choix Identification */}
      {!isOtpStep && (
        <div className="flex border-b border-border">
          <button
            type="button"
            onClick={() => { setActiveTab("login"); setLoginError(""); setRegError(""); }}
            className={`flex-1 py-3 text-xs sm:text-sm font-bold border-b-2 transition-colors cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === "login"
                ? "border-navy text-navy"
                : "border-transparent text-foreground-muted hover:text-navy"
            }`}
          >
            <UserIcon className="w-4 h-4 text-gold" />
            <span>Déjà client ? Se connecter</span>
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab("register"); setLoginError(""); setRegError(""); }}
            className={`flex-1 py-3 text-xs sm:text-sm font-bold border-b-2 transition-colors cursor-pointer flex items-center justify-center gap-2 ${
              activeTab === "register"
                ? "border-navy text-navy"
                : "border-transparent text-foreground-muted hover:text-navy"
            }`}
          >
            <KeyRound className="w-4 h-4 text-gold" />
            <span>Nouveau client ? Créer mon compte</span>
          </button>
        </div>
      )}

      {/* Formulaire Connexion */}
      {activeTab === "login" && !isOtpStep && (
        <form onSubmit={handleLoginSubmit} className="space-y-4">
          {loginError && (
            <div className="p-3.5 rounded-xl bg-error/10 border border-error/20 text-error text-xs font-medium">
              {loginError}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-navy block" htmlFor="checkout-login-email">
              Adresse e-mail ou identifiant *
            </label>
            <div className="relative">
              <input
                id="checkout-login-email"
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="votre.email@exemple.com"
                required
                className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-background border border-border text-xs text-navy focus:ring-2 focus:ring-gold/30 focus:border-navy outline-none transition-all"
              />
              <Mail className="w-4 h-4 text-foreground-muted absolute left-3.5 top-3.5" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-navy block" htmlFor="checkout-login-password">
              Mot de passe *
            </label>
            <div className="relative">
              <input
                id="checkout-login-password"
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-background border border-border text-xs text-navy focus:ring-2 focus:ring-gold/30 focus:border-navy outline-none transition-all"
              />
              <Lock className="w-4 h-4 text-foreground-muted absolute left-3.5 top-3.5" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoggingIn}
            className="w-full min-h-[44px] py-3.5 rounded-xl bg-navy hover:bg-navy-hover text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoggingIn ? (
              <span>Connexion en cours...</span>
            ) : (
              <>
                <span>Me connecter et continuer vers le paiement</span>
                <ArrowRight className="w-4 h-4 text-gold" />
              </>
            )}
          </button>
        </form>
      )}

      {/* Formulaire Inscription Rapide */}
      {activeTab === "register" && !isOtpStep && (
        <form onSubmit={handleRegisterSubmit} className="space-y-4">
          {regError && (
            <div className="p-3.5 rounded-xl bg-error/10 border border-error/20 text-error text-xs font-medium">
              {regError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-navy block" htmlFor="reg-first-name">
                Prénom *
              </label>
              <input
                id="reg-first-name"
                type="text"
                value={regFirstName}
                onChange={(e) => setRegFirstName(e.target.value)}
                placeholder="Votre prénom"
                required
                className="w-full px-3.5 py-3 rounded-xl bg-background border border-border text-xs text-navy focus:ring-2 focus:ring-gold/30 focus:border-navy outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-navy block" htmlFor="reg-last-name">
                Nom de famille *
              </label>
              <input
                id="reg-last-name"
                type="text"
                value={regLastName}
                onChange={(e) => setRegLastName(e.target.value)}
                placeholder="Votre nom"
                required
                className="w-full px-3.5 py-3 rounded-xl bg-background border border-border text-xs text-navy focus:ring-2 focus:ring-gold/30 focus:border-navy outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-navy block" htmlFor="reg-email">
                Adresse e-mail *
              </label>
              <input
                id="reg-email"
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="exemple@domaine.com"
                required
                className="w-full px-3.5 py-3 rounded-xl bg-background border border-border text-xs text-navy focus:ring-2 focus:ring-gold/30 focus:border-navy outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-navy block">
                Téléphone
              </label>
              <PhoneInput
                value={regPhone}
                onChange={setRegPhone}
                placeholder="Numéro de contact"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-navy block" htmlFor="reg-password">
              Créer un mot de passe (8 caractères min.) *
            </label>
            <input
              id="reg-password"
              type="password"
              value={regPassword}
              onChange={(e) => setRegPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-3.5 py-3 rounded-xl bg-background border border-border text-xs text-navy focus:ring-2 focus:ring-gold/30 focus:border-navy outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isRegistering}
            className="w-full min-h-[44px] py-3.5 rounded-xl bg-navy hover:bg-navy-hover text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isRegistering ? (
              <span>Création du compte...</span>
            ) : (
              <>
                <span>Créer mon compte client &amp; recevoir mon code</span>
                <ArrowRight className="w-4 h-4 text-gold" />
              </>
            )}
          </button>
        </form>
      )}

      {/* Étape OTP Inscription Rapide */}
      {isOtpStep && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="text-center space-y-1.5">
            <p className="text-xs font-bold text-navy uppercase tracking-wider">
              Vérification de sécurité
            </p>
            <p className="text-xs text-foreground-muted">
              Un code à 6 chiffres a été envoyé à <strong>{regEmail}</strong>.
            </p>
          </div>

          {otpError && (
            <div className="p-3.5 rounded-xl bg-error/10 border border-error/20 text-error text-xs font-medium text-center">
              {otpError}
            </div>
          )}

          <div className="flex justify-center py-2">
            <OTPInput
              value={otpCode}
              onChange={setOtpCode}
              onComplete={(code) => handleOtpVerify(code)}
              disabled={isVerifyingOtp}
            />
          </div>

          <button
            type="button"
            onClick={() => handleOtpVerify()}
            disabled={isVerifyingOtp || otpCode.join("").length !== 6}
            className="w-full min-h-[44px] py-3.5 rounded-xl bg-navy hover:bg-navy-hover text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isVerifyingOtp ? (
              <span>Validation du code en cours...</span>
            ) : (
              <>
                <span>Valider mon compte et accéder au paiement</span>
                <ArrowRight className="w-4 h-4 text-gold" />
              </>
            )}
          </button>

          <div className="flex items-center justify-between text-xs text-foreground-muted pt-2 border-t border-border">
            <button
              type="button"
              onClick={() => setIsOtpStep(false)}
              className="hover:text-navy underline cursor-pointer"
            >
              Modifier mes informations
            </button>
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={resendCooldown > 0}
              className="hover:text-navy text-gold font-medium flex items-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${resendCooldown > 0 ? "animate-spin" : ""}`} />
              <span>{resendCooldown > 0 ? `Renvoyer (${resendCooldown}s)` : "Renvoyer le code"}</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
