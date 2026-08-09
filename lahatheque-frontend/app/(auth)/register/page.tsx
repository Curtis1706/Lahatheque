"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { 
  GraduationCap, 
  BookOpen, 
  Building2, 
  UserCheck, 
  ArrowRight, 
  Mail, 
  Lock, 
  User, 
  Sparkles,
  AlertCircle,
  Library,
  Globe
} from "lucide-react";
import { registerUser } from "@/lib/services/auth";
import { PhoneInput } from "@/components/ui/phone-input";

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<"student" | "teacher" | "author" | "publisher" | "librarian">("student");
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

  const getCountryDialCode = (code: string) => {
    switch (code) {
      case "BJ": return "+229";
      case "SN": return "+221";
      case "TG": return "+228";
      case "CI": return "+225";
      case "NE": return "+227";
      case "CD": return "+243";
      default: return "+229";
    }
  };

  const handleCountryChange = (countryCode: string) => {
    const dialCode = getCountryDialCode(countryCode);
    setFormData({
      ...formData,
      country: countryCode,
      phone: dialCode
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await registerUser({
        email: formData.email,
        password: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone || undefined,
        country: formData.country,
        role: role
      });

      if (res.success) {
        setSuccess("Compte créé avec succès ! Redirection...");
        setTimeout(() => {
          if (role === "student") {
            router.push("/student");
          } else if (role === "publisher") {
            router.push("/publisher");
          } else if (role === "teacher") {
            router.push("/teacher");
          } else if (role === "librarian") {
            router.push("/librarian");
          } else {
            router.push("/catalog");
          }
        }, 1500);
      } else {
        setError(res.error || "Erreur lors de l'inscription.");
      }
    } catch {
      setError("Une erreur inattendue est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-secondary text-foreground flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="w-full max-w-xl space-y-8 bg-background p-6 sm:p-10 rounded-3xl border border-border shadow-xl animate-in fade-in duration-300"
      >
        
        {/* Header */}
        <div className="text-center space-y-4 flex flex-col items-center justify-center">
          <Link href="/" className="inline-flex flex-col items-center mb-2 group">
            <div className="p-1.5 bg-background rounded-3xl border border-border shadow-lg group-hover:border-gold/30 transition-colors">
              <Image src="/logo.jpg" alt="LAHA Editions" width={80} height={80} className="rounded-2xl" />
            </div>
          </Link>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-navy-light text-navy text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-gold" />
            Création de Compte LAHAThèque
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-navy">
            Rejoignez la Bibliothèque Numérique
          </h1>
        </div>

        {/* Sélection du Rôle */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-navy block text-center sm:text-left">
            Sélectionnez votre profil
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { id: "student", label: "Étudiant", icon: GraduationCap },
              { id: "teacher", label: "Enseignant", icon: BookOpen },
              { id: "author", label: "Auteur", icon: UserCheck },
              { id: "publisher", label: "Éditeur", icon: Building2 },
              { id: "librarian", label: "Bibliothécaire", icon: Library },
            ].map((item) => {
              const Icon = item.icon;
              const active = role === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setRole(item.id as typeof role)}
                  className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                    active 
                      ? "bg-navy text-white border-navy ring-2 ring-gold shadow-md" 
                      : "bg-background text-foreground border-border hover:border-gold"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${active ? "text-gold" : "text-foreground-muted"}`} />
                  <span className="text-[10px] leading-tight text-center">{item.label}</span>
                </button>
              );
            })}
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
          <div className="p-3.5 rounded-xl bg-success/10 border border-success/30 text-success text-xs font-medium">
            {success}
          </div>
        )}

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-navy">Prénom</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 w-4 h-4 text-foreground-muted pointer-events-none" />
                <input
                  type="text"
                  required
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  placeholder="Jean"
                  className="w-full pl-10 pr-3 py-3 rounded-xl border border-border bg-background text-foreground text-xs sm:text-sm focus:ring-2 focus:ring-navy focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-navy">Nom</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 w-4 h-4 text-foreground-muted pointer-events-none" />
                <input
                  type="text"
                  required
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  placeholder="Agossou"
                  className="w-full pl-10 pr-3 py-3 rounded-xl border border-border bg-background text-foreground text-xs sm:text-sm focus:ring-2 focus:ring-navy focus:outline-none transition-all"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-navy">Adresse Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-foreground-muted pointer-events-none" />
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="etudiant@univ.edu"
                className="w-full pl-10 pr-3 py-3 rounded-xl border border-border bg-background text-foreground text-xs sm:text-sm focus:ring-2 focus:ring-navy focus:outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-2 animate-in fade-in duration-200">
            <label className="text-xs font-bold uppercase tracking-wider text-navy">Pays</label>
            <div className="relative">
              <Globe className="absolute left-3.5 top-3.5 w-4 h-4 text-foreground-muted pointer-events-none" />
              <select
                value={formData.country}
                onChange={(e) => handleCountryChange(e.target.value)}
                className="w-full pl-10 pr-3 py-3 rounded-xl border border-border bg-background text-foreground text-xs sm:text-sm focus:ring-2 focus:ring-navy focus:outline-none cursor-pointer"
              >
                <option value="BJ">Bénin (BJ)</option>
                <option value="SN">Sénégal (SN)</option>
                <option value="TG">Togo (TG)</option>
                <option value="CI">Côte d'Ivoire (CI)</option>
                <option value="NE">Niger (NE)</option>
                <option value="CD">RDC (CD)</option>
              </select>
            </div>
          </div>

          <div className="space-y-2 animate-in fade-in duration-200">
            <label className="text-xs font-bold uppercase tracking-wider text-navy">Numéro de Téléphone *</label>
            <PhoneInput
              value={formData.phone}
              onChange={(val: any) => setFormData({ ...formData, phone: val || "" })}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-navy">Mot de passe</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-foreground-muted pointer-events-none" />
              <input
                type="password"
                required
                minLength={8}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="•••••••• (min 8 caractères)"
                className="w-full pl-10 pr-3 py-3 rounded-xl border border-border bg-background text-foreground text-xs sm:text-sm focus:ring-2 focus:ring-navy focus:outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl bg-navy text-white text-xs sm:text-sm font-semibold hover:bg-navy-hover transition-colors flex items-center justify-center gap-2 shadow-lg hover:shadow-xl mt-6 cursor-pointer"
          >
            {loading ? "Création du compte..." : "S'inscrire sur LAHAThèque"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Lien Login */}
        <div className="text-center pt-4 border-t border-border mt-4">
          <p className="text-xs text-foreground-muted">
            Déjà inscrit ?{" "}
            <Link href="/login" className="text-gold font-bold hover:text-gold-hover transition-colors">
              Se connecter
            </Link>
          </p>
        </div>

      </motion.div>
    </div>
  );
}
