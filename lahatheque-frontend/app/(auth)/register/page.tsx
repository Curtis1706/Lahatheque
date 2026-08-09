"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  GraduationCap, 
  BookOpen, 
  Building2, 
  UserCheck, 
  ArrowRight, 
  Mail, 
  Lock, 
  User, 
  Phone, 
  Globe,
  Sparkles,
  AlertCircle
} from "lucide-react";import { registerUser } from "@/lib/services/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<"student" | "teacher" | "author" | "publisher">("student");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    phone: "",
    country: "BJ",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await registerUser({
        email: formData.email,
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
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-xl space-y-8 bg-background-secondary p-6 sm:p-8 rounded-3xl border border-border shadow-md">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-navy-light text-navy text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-gold" />
            Création de Compte LAHAThèque
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-navy">
            Rejoignez la Bibliothèque Numérique
          </h1>
          <p className="text-xs sm:text-sm text-foreground-muted">
            Accédez aux ressources académiques et gérez vos publications
          </p>
        </div>

        {/* Sélection du Rôle */}
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-navy block text-center sm:text-left">
            Sélectionnez votre profil
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: "student", label: "Étudiant", icon: GraduationCap },
              { id: "teacher", label: "Enseignant", icon: BookOpen },
              { id: "author", label: "Auteur", icon: UserCheck },
              { id: "publisher", label: "Éditeur", icon: Building2 },
            ].map((item) => {
              const Icon = item.icon;
              const active = role === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setRole(item.id as typeof role)}
                  className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-2 transition-all ${
                    active 
                      ? "bg-navy text-white border-navy ring-2 ring-gold" 
                      : "bg-background text-foreground border-border hover:border-gold"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${active ? "text-gold" : "text-foreground-muted"}`} />
                  {item.label}
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
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-navy">Prénom</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 w-4 h-4 text-foreground-muted pointer-events-none" />
                <input
                  type="text"
                  required
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  placeholder="Jean"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs sm:text-sm focus:ring-2 focus:ring-navy focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-navy">Nom</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 w-4 h-4 text-foreground-muted pointer-events-none" />
                <input
                  type="text"
                  required
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  placeholder="Agossou"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs sm:text-sm focus:ring-2 focus:ring-navy focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-navy">Adresse Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-foreground-muted pointer-events-none" />
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="etudiant@univ.edu"
                className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs sm:text-sm focus:ring-2 focus:ring-navy focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-navy">Téléphone</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-3 w-4 h-4 text-foreground-muted pointer-events-none" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+229 97 00 00 00"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs sm:text-sm focus:ring-2 focus:ring-navy focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-navy">Pays</label>
              <div className="relative">
                <Globe className="absolute left-3.5 top-3 w-4 h-4 text-foreground-muted pointer-events-none" />
                <select
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs sm:text-sm focus:ring-2 focus:ring-navy focus:outline-none"
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
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-navy">Mot de passe</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-foreground-muted pointer-events-none" />
              <input
                type="password"
                required
                minLength={8}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="•••••••• (min 8 caractères)"
                className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs sm:text-sm focus:ring-2 focus:ring-navy focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-navy text-white text-xs sm:text-sm font-semibold hover:bg-navy-hover transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            {loading ? "Création du compte..." : "S'inscrire sur LAHAThèque"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Lien Login */}
        <div className="text-center pt-2 border-t border-border">
          <p className="text-xs text-foreground-muted">
            Déjà inscrit ?{" "}
            <Link href="/login" className="text-gold font-bold hover:underline">
              Se connecter
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
