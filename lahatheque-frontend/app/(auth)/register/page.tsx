"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { 
  BookOpen, 
  UserCheck, 
  Building2, 
  ArrowRight, 
  Mail, 
  Lock, 
  User, 
  Sparkles,
  AlertCircle,
  Library,
  Handshake,
  ShieldCheck
} from "lucide-react";
import { registerUser } from "@/lib/services/auth";
import { PhoneInput } from "@/components/ui/phone-input";

export default function RegisterPage() {
  const router = useRouter();
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

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

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
    }
  };

  const removeAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
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
      }, avatarFile);

      if (res.success) {
        setSuccess("Compte créé avec succès ! Redirection...");
        setTimeout(() => {
          if (role === "author") {
            router.push("/author");
          } else {
            router.push("/student");
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

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-navy/5 text-navy text-xs font-bold uppercase tracking-wider border border-gold/20">
            <Sparkles className="w-3.5 h-3.5 text-gold" />
            Création de Compte LAHAThèque
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-navy">
            Rejoignez la Bibliothèque Numérique
          </h1>
          <p className="text-xs text-foreground-muted max-w-md">
            Créez votre compte en auto-inscription directe pour accéder immédiatement à vos lectures ou déposer vos manuscrits.
          </p>
        </div>

        {/* Sélection du Profil (Auto-inscription directe : Lecteur vs Auteur) */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-navy block text-center sm:text-left">
            Sélectionnez votre profil d&apos;inscription
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setRole("student")}
              className={`p-4 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                role === "student"
                  ? "bg-navy text-white border-navy ring-2 ring-gold shadow-md"
                  : "bg-background text-foreground border-border hover:border-gold"
              }`}
            >
              <BookOpen className={`w-6 h-6 ${role === "student" ? "text-gold" : "text-foreground-muted"}`} />
              <div className="text-center">
                <span className="font-bold block text-sm">Lecteur</span>
                <span className="text-[10px] text-foreground-muted block font-normal">Étudiant, Élève, Enseignant, Particulier</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setRole("author")}
              className={`p-4 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                role === "author"
                  ? "bg-navy text-white border-navy ring-2 ring-gold shadow-md"
                  : "bg-background text-foreground border-border hover:border-gold"
              }`}
            >
              <UserCheck className={`w-6 h-6 ${role === "author" ? "text-gold" : "text-foreground-muted"}`} />
              <div className="text-center">
                <span className="font-bold block text-sm">Auteur</span>
                <span className="text-[10px] text-foreground-muted block font-normal">Dépôt &amp; étude de manuscrits</span>
              </div>
            </button>
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
          
          {/* Photo de profil avec prévisualisation */}
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
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background border border-border hover:border-gold text-xs font-semibold text-navy cursor-pointer transition-colors shadow-sm"
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

          {/* Numéro de Téléphone avec sélection d'indicatif pays */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-navy">Numéro de Téléphone</label>
            <PhoneInput
              value={formData.phone}
              onChange={(phone) => setFormData({ ...formData, phone })}
            />
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
                placeholder="••••••••"
                className="w-full pl-10 pr-3 py-3 rounded-xl border border-border bg-background text-foreground text-xs sm:text-sm focus:ring-2 focus:ring-navy focus:outline-none transition-all min-h-[44px]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-navy hover:bg-navy-hover text-white text-xs sm:text-sm font-bold shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
          >
            {loading ? "Création en cours..." : `Créer mon compte ${role === "author" ? "Auteur" : "Lecteur"}`}
            <ArrowRight className="w-4 h-4 text-gold" />
          </button>
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
