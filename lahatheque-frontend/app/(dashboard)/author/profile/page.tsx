"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { User, ArrowLeft, Save, CreditCard, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { AuthorTeamAccessCard } from "@/components/features/author/author-team-access-card";
import { getAuthorDelegates, inviteAuthorDelegate, removeAuthorDelegate } from "@/lib/services/author";
import type { AuthorDelegateAccess } from "@/lib/types/author";

export default function AuthorProfilePage() {
  const { user } = useAuth();
  const [firstName, setFirstName] = useState("Augustin");
  const [lastName, setLastName] = useState("CHAKIROU");
  const [email, setEmail] = useState(user?.email || "augustin.chakirou@uac.bj");
  const [phone, setPhone] = useState("+229 97 00 11 22");

  // Coordonnées bancaires directes (Validation Client : Pas besoin de validation interne)
  const [bankName, setBankName] = useState("ECOBANK Bénin");
  const [iban, setIBAN] = useState("BJ66 0100 1001 0000 1234 5678 90");
  const [swift, setSWIFT] = useState("ECOCBJBJ");
  const [momoNumber, setMomoNumber] = useState("+229 97 00 11 22");

  // Délégation d'accès (Co-auteurs & Assistants)
  const [delegates, setDelegates] = useState<AuthorDelegateAccess[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      const data = await getAuthorDelegates();
      setDelegates(data);
    }
    loadData();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      alert("Vos coordonnées personnelles et bancaires ont été enregistrées avec succès !");
    }, 500);
  };

  const handleInviteDelegate = async (name: string, email: string, role: "co_author" | "assistant") => {
    const newDel = await inviteAuthorDelegate(name, email, role);
    setDelegates((prev) => [...prev, newDel]);
  };

  const handleRemoveDelegate = async (id: string) => {
    if (!confirm("Voulez-vous révoquer l'accès délégué pour cette personne ?")) return;
    const ok = await removeAuthorDelegate(id);
    if (ok) {
      setDelegates((prev) => prev.filter((d) => d.id !== id));
      alert("Accès délégué révoqué.");
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-8 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/author" className="hover:text-navy">Vue d&apos;ensemble</Link>
        <span>/</span>
        <span className="text-navy font-semibold">Profil &amp; Délégation</span>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/author" className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Vue d&apos;ensemble
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
            <User className="w-4 h-4 text-gold" />
            Paramètres du Compte Auteur (Section 4.1 Cahier v3.2)
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Profil &amp; Coordonnées de Paiement
          </h1>
          <p className="text-xs text-foreground-muted mt-1">
            Mettez à jour vos informations personnelles, vos coordonnées de versement des droits et vos accès délégués.
          </p>
        </div>
      </div>

      {/* Carte 21st.dev de Délégation d'Accès (TeamAccessCard 8618) */}
      <AuthorTeamAccessCard
        delegates={delegates}
        onInviteDelegate={handleInviteDelegate}
        onRemoveDelegate={handleRemoveDelegate}
      />

      {/* Formulaire 1: Informations Personnelles & Coordonnées Bancaires Directes */}
      <form onSubmit={handleSaveProfile} className="p-6 rounded-3xl bg-background border border-border space-y-6 shadow-xs">
        <div className="space-y-4">
          <h3 className="font-serif font-bold text-navy text-sm uppercase tracking-wider border-b border-border pb-2">
            Informations Personnelles
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label htmlFor="auth-fn" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">Prénom *</label>
              <input
                id="auth-fn"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl text-navy font-semibold focus:outline-none focus:border-gold min-h-[44px]"
                required
              />
            </div>

            <div>
              <label htmlFor="auth-ln" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">Nom *</label>
              <input
                id="auth-ln"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl text-navy font-semibold focus:outline-none focus:border-gold min-h-[44px]"
                required
              />
            </div>

            <div>
              <label htmlFor="auth-em" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">E-mail *</label>
              <input
                id="auth-em"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl font-mono text-navy font-bold focus:outline-none focus:border-gold min-h-[44px]"
                required
              />
            </div>

            <div>
              <label htmlFor="auth-ph" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">Téléphone *</label>
              <input
                id="auth-ph"
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl font-mono text-navy font-bold focus:outline-none focus:border-gold min-h-[44px]"
                required
              />
            </div>
          </div>
        </div>

        {/* Coordonnées Bancaires Directes (Validation Client : enregistrement direct) */}
        <div className="space-y-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-gold" />
            <h3 className="font-serif font-bold text-navy text-sm uppercase tracking-wider">
              Coordonnées de Versement des Droits (Directes &amp; Sans Validation)
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label htmlFor="bank-n" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">Nom de la Banque *</label>
              <input
                id="bank-n"
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl text-navy font-semibold focus:outline-none focus:border-gold min-h-[44px]"
                required
              />
            </div>

            <div>
              <label htmlFor="bank-iban" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">IBAN / Compte Bancaire *</label>
              <input
                id="bank-iban"
                type="text"
                value={iban}
                onChange={(e) => setIBAN(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl font-mono text-navy font-bold focus:outline-none focus:border-gold min-h-[44px]"
                required
              />
            </div>

            <div>
              <label htmlFor="bank-swift" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">Code SWIFT / BIC *</label>
              <input
                id="bank-swift"
                type="text"
                value={swift}
                onChange={(e) => setSWIFT(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl font-mono text-navy font-bold focus:outline-none focus:border-gold min-h-[44px]"
                required
              />
            </div>

            <div>
              <label htmlFor="momo-n" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">Numéro Mobile Money (Optionnel)</label>
              <input
                id="momo-n"
                type="text"
                value={momoNumber}
                onChange={(e) => setMomoNumber(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl font-mono text-navy font-bold focus:outline-none focus:border-gold min-h-[44px]"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors inline-flex items-center gap-2 shadow-xs min-h-[44px]"
          >
            {saving ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4 text-gold" />
                Enregistrer les Coordonnées
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
