"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Building2, ArrowLeft, Save, ShieldCheck, Mail, Phone, MapPin, Bell } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function WholesalerProfilePage() {
  const { user } = useAuth();
  const [companyName, setCompanyName] = useState("Librairie Internationale Bénin SARL");
  const [rccm, setRccm] = useState("RB/COT/20-B-12345");
  const [address, setAddress] = useState("Avenue Steinmetz, Carré 122, Cotonou, Bénin");
  const [phone, setPhone] = useState("+229 97 00 11 22");
  const [email, setEmail] = useState("commandes@librairie-benin.com");
  const [notifyNewBooks, setNotifyNewBooks] = useState(true);
  const [notifyBestSellers, setNotifyBestSellers] = useState(true);
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      alert("Paramètres d'entreprise et coordonnées de facturation enregistrés avec succès !");
    }, 600);
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/wholesaler" className="hover:text-navy">Vue d&apos;ensemble</Link>
        <span>/</span>
        <span className="text-navy font-semibold">Profil &amp; Facturation</span>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/wholesaler" className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Vue d&apos;ensemble
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4 text-gold" />
            Compte Partenaire Grossiste (Section 4.1)
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Profil Entreprise &amp; Coordonnées de Facturation
          </h1>
          <p className="text-xs text-foreground-muted mt-1">
            Gérez vos informations de société, adresses de livraison par défaut et préférences d&apos;alerte.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Informations Entreprise */}
        <div className="p-6 rounded-3xl bg-background border border-border space-y-4 shadow-xs">
          <h3 className="font-serif font-bold text-navy text-sm uppercase tracking-wider border-b border-border pb-2">
            Informations Légales de la Société
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label htmlFor="company-name" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">Raison Sociale / Société *</label>
              <input
                id="company-name"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl text-navy font-semibold focus:outline-none focus:border-gold min-h-[44px]"
                required
              />
            </div>

            <div>
              <label htmlFor="rccm" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">Numéro RCCM / IFU *</label>
              <input
                id="rccm"
                type="text"
                value={rccm}
                onChange={(e) => setRccm(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl font-mono text-navy font-bold focus:outline-none focus:border-gold min-h-[44px]"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="addr" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">Adresse Siège &amp; Facturation *</label>
              <input
                id="addr"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl text-navy font-semibold focus:outline-none focus:border-gold min-h-[44px]"
                required
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">Téléphone de Contact *</label>
              <input
                id="phone"
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl font-mono text-navy font-bold focus:outline-none focus:border-gold min-h-[44px]"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">E-mail Réception Factures *</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl font-mono text-navy font-bold focus:outline-none focus:border-gold min-h-[44px]"
                required
              />
            </div>
          </div>
        </div>

        {/* Préférences de Notifications */}
        <div className="p-6 rounded-3xl bg-background border border-border space-y-4 shadow-xs">
          <h3 className="font-serif font-bold text-navy text-sm uppercase tracking-wider border-b border-border pb-2 flex items-center gap-2">
            <Bell className="w-4 h-4 text-gold" />
            Préférences de Notifications &amp; Alertes Automatiques
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-4 rounded-2xl bg-background-secondary border border-border flex items-center justify-between">
              <div>
                <span className="font-bold text-navy block">Alerte Nouveautés Catalogue</span>
                <span className="text-[11px] text-foreground-muted">Recevoir une notification automatique dès la publication d&apos;un nouveau livre.</span>
              </div>
              <button
                type="button"
                onClick={() => setNotifyNewBooks(!notifyNewBooks)}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                  notifyNewBooks ? "bg-gold" : "bg-border"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    notifyNewBooks ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-background-secondary border border-border flex items-center justify-between">
              <div>
                <span className="font-bold text-navy block">Alerte Meilleures Ventes</span>
                <span className="text-[11px] text-foreground-muted">Recevoir un rapport mensuel des titres les plus vendus pour orienter vos réapprovisionnements.</span>
              </div>
              <button
                type="button"
                onClick={() => setNotifyBestSellers(!notifyBestSellers)}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                  notifyBestSellers ? "bg-navy" : "bg-border"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    notifyBestSellers ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
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
                  Enregistrer les Modifications
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
