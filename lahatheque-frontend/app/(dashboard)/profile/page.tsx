"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { 
  User, 
  Mail, 
  Phone, 
  Shield, 
  Save, 
  Lock,
  Bell,
  CheckCircle,
  Eye,
  EyeOff
} from "lucide-react";
import { DashboardHeader } from "@/components/ui/dashboard-header";

export default function ProfilePage() {
  const { user } = useAuth();

  // Form profile states
  const [name, setName] = useState(user ? `${user.first_name} ${user.last_name}` : "Marc-Aurèle DE SOUZA");
  const [email, setEmail] = useState(user?.email || "marcaurele@laha.bj");
  const [phone, setPhone] = useState(user?.phone || "+229 97 00 00 00");
  
  // Passwords
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Visibility
  const [showPassword, setShowPassword] = useState(false);

  // Preference notifications
  const [emailNotif, setEmailNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(false);

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setTimeout(() => {
      setSavingProfile(false);
      alert("Profil mis à jour avec succès !");
    }, 800);
  };

  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("Le nouveau mot de passe et sa confirmation ne correspondent pas.");
      return;
    }
    setSavingPassword(true);
    setTimeout(() => {
      setSavingPassword(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      alert("Votre mot de passe a été modifié avec succès !");
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <main className="flex-1 p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-8">
        
        {/* Header */}
        <div className="space-y-1">
          <h1 className="font-serif text-2xl lg:text-3xl font-bold text-navy">Mon Profil & Paramètres</h1>
          <p className="text-sm text-foreground-muted">Gérez vos informations personnelles, vos identifiants et vos abonnements de notification.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Profile Information Form */}
          <div className="md:col-span-8 space-y-6">
            
            {/* Personal Details */}
            <form onSubmit={handleSaveProfile} className="bg-background border border-border rounded-xl p-6 shadow-sm space-y-4">
              <h3 className="font-serif font-bold text-navy text-base flex items-center gap-1.5 border-b border-border pb-2">
                <User className="w-5 h-5 text-gold" />
                Informations Personnelles
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-navy">Nom complet *</label>
                  <input 
                    type="text" required
                    className="bg-background border border-border rounded p-3 text-sm focus:outline-none focus:border-navy"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-navy">Adresse Email *</label>
                  <input 
                    type="email" required
                    className="bg-background border border-border rounded p-3 text-sm focus:outline-none focus:border-navy"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-navy">Téléphone mobile</label>
                  <input 
                    type="text"
                    className="bg-background border border-border rounded p-3 text-sm focus:outline-none focus:border-navy"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-navy">Rôle Plateforme</label>
                  <div className="bg-background-secondary border border-border rounded p-3 text-sm text-foreground-muted font-bold flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-gold" />
                    <span>{user?.role ? user.role.toUpperCase() : "LECTEUR"}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="inline-flex items-center gap-1.5 bg-navy hover:bg-navy-hover text-white text-xs font-bold px-5 py-2.5 rounded shadow disabled:opacity-50 transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  {savingProfile ? "Enregistrement..." : "Sauvegarder"}
                </button>
              </div>
            </form>

            {/* Change Password */}
            <form onSubmit={handleSavePassword} className="bg-background border border-border rounded-xl p-6 shadow-sm space-y-4">
              <h3 className="font-serif font-bold text-navy text-base flex items-center gap-1.5 border-b border-border pb-2">
                <Lock className="w-5 h-5 text-gold" />
                Sécurité & Mot de passe
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5 relative">
                  <label className="text-xs font-bold text-navy">Mot de passe actuel</label>
                  <input 
                    type={showPassword ? "text" : "password"}
                    className="bg-background border border-border rounded p-3 text-sm focus:outline-none focus:border-navy"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-navy">Nouveau mot de passe</label>
                  <input 
                    type={showPassword ? "text" : "password"}
                    className="bg-background border border-border rounded p-3 text-sm focus:outline-none focus:border-navy"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-navy">Confirmer le mot de passe</label>
                  <input 
                    type={showPassword ? "text" : "password"}
                    className="bg-background border border-border rounded p-3 text-sm focus:outline-none focus:border-navy"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs text-foreground-muted hover:text-navy font-bold flex items-center gap-1"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  {showPassword ? "Masquer" : "Afficher les caractères"}
                </button>

                <button
                  type="submit"
                  disabled={savingPassword || !newPassword}
                  className="inline-flex items-center gap-1.5 bg-navy hover:bg-navy-hover text-white text-xs font-bold px-5 py-2.5 rounded shadow disabled:opacity-50 transition-colors"
                >
                  <Lock className="w-3.5 h-3.5" />
                  {savingPassword ? "Modification..." : "Modifier le mot de passe"}
                </button>
              </div>
            </form>

          </div>

          {/* Right Column: Preferences */}
          <div className="md:col-span-4 bg-background border border-border rounded-xl shadow-sm p-5 space-y-4">
            <h3 className="font-serif text-base font-bold text-navy flex items-center gap-1.5 border-b border-border pb-3">
              <Bell className="w-5 h-5 text-gold" />
              Préférences d'alerte
            </h3>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <input 
                  type="checkbox" 
                  id="emailNotif"
                  className="w-4 h-4 cursor-pointer mt-0.5"
                  checked={emailNotif}
                  onChange={(e) => setEmailNotif(e.target.checked)}
                />
                <div className="space-y-0.5">
                  <label htmlFor="emailNotif" className="text-xs font-bold text-navy cursor-pointer">
                    Alertes par e-mail
                  </label>
                  <p className="text-[10px] text-foreground-muted leading-relaxed">
                    Recevez vos relevés mensuels de redevances et validations de manuscrits directement dans votre boîte mail.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 pt-3 border-t border-border/40">
                <input 
                  type="checkbox" 
                  id="smsNotif"
                  className="w-4 h-4 cursor-pointer mt-0.5"
                  checked={smsNotif}
                  onChange={(e) => setSmsNotif(e.target.checked)}
                />
                <div className="space-y-0.5">
                  <label htmlFor="smsNotif" className="text-xs font-bold text-navy cursor-pointer">
                    Alertes par SMS
                  </label>
                  <p className="text-[10px] text-foreground-muted leading-relaxed">
                    Recevez des notifications instantanées sur votre mobile lors d'un nouveau dépôt ou d'un achat validé.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}
