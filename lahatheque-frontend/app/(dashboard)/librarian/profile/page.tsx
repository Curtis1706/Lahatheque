"use client";

import React, { useState } from "react";
import Link from "next/link";
import { GraduationCap, ArrowLeft, Save, ShieldCheck, Mail, Phone, MapPin, Building2, CreditCard } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function UniversityProfilePage() {
  const { user } = useAuth();
  const [univName, setUnivName] = useState("Université d'Abomey-Calavi (UAC)");
  const [country, setCountry] = useState("Bénin");
  const [city, setCity] = useState("Abomey-Calavi");
  const [contactName, setContactName] = useState("Dr. Basile KPADONOU (Directeur de la Bibliothèque Centrale)");
  const [email, setEmail] = useState("bibliotheque.centrale@uac.bj");
  const [phone, setPhone] = useState("+229 21 36 00 11");
  const [iban, setIban] = useState("BJ66 BJ01 0010 0123 4567 8901 234");
  const [bankName, setBankName] = useState("BOA Bénin - Agence UAC Calavi");
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      alert("Profil de l'établissement et coordonnées bancaires enregistrés avec succès !");
    }, 600);
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/librarian" className="hover:text-navy">Vue d&apos;ensemble</Link>
        <span>/</span>
        <span className="text-navy font-semibold">Profil &amp; Paramètres</span>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/librarian" className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Vue d&apos;ensemble
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
            <GraduationCap className="w-4 h-4 text-gold" />
            Compte Unique Centralisé Établissement (Section 4.1)
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Fiche Université &amp; Coordonnées de Versement
          </h1>
          <p className="text-xs text-foreground-muted mt-1">
            Gérez la fiche institutionnelle de votre université, vos facultés rattachées et vos coordonnées bancaires pour la redevance 15%.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Informations Institutionnelles */}
        <div className="p-6 rounded-3xl bg-background border border-border space-y-4 shadow-xs">
          <h3 className="font-serif font-bold text-navy text-sm uppercase tracking-wider border-b border-border pb-2">
            Identité de l&apos;Université Partenaire
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="sm:col-span-2">
              <label htmlFor="univ-name" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">Nom Officiel de l&apos;Établissement *</label>
              <input
                id="univ-name"
                type="text"
                value={univName}
                onChange={(e) => setUnivName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl text-navy font-semibold focus:outline-none focus:border-gold min-h-[44px]"
                required
              />
            </div>

            <div>
              <label htmlFor="country" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">Pays *</label>
              <input
                id="country"
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl text-navy font-semibold focus:outline-none focus:border-gold min-h-[44px]"
                required
              />
            </div>

            <div>
              <label htmlFor="city" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">Ville / Campus Principal *</label>
              <input
                id="city"
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl text-navy font-semibold focus:outline-none focus:border-gold min-h-[44px]"
                required
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="contact-name" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">Responsable de la Bibliothèque / Contact Officiel *</label>
              <input
                id="contact-name"
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl text-navy font-semibold focus:outline-none focus:border-gold min-h-[44px]"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">E-mail Officiel Établissement *</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl font-mono text-navy font-bold focus:outline-none focus:border-gold min-h-[44px]"
                required
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">Téléphone Secrétariat *</label>
              <input
                id="phone"
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl font-mono text-navy font-bold focus:outline-none focus:border-gold min-h-[44px]"
                required
              />
            </div>
          </div>
        </div>

        {/* Facultés Rattachées à l'Établissement (Validation Client Point 1) */}
        <div className="p-6 rounded-3xl bg-background border border-border space-y-3 shadow-xs text-xs">
          <h3 className="font-serif font-bold text-navy text-sm uppercase tracking-wider border-b border-border pb-2 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-gold" />
            Facultés Rattachées au Compte Unique Centralisé
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-navy font-semibold">
            {[
              "Faculté de Droit et de Science Politique (FADESP)",
              "Faculté des Sciences Économiques et de Gestion (FASEG)",
              "Faculté des Sciences de la Santé (FSS)",
              "Faculté des Sciences Agronomiques (FSA)",
              "Faculté des Lettres, Arts et Sciences Humaines (FLASH)",
            ].map((fac, idx) => (
              <div key={idx} className="p-3 rounded-2xl bg-background-secondary border border-border flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-gold shrink-0" />
                <span className="truncate">{fac}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Coordonnées Bancaires de Versement (Redevance 15%) */}
        <div className="p-6 rounded-3xl bg-background border border-border space-y-4 shadow-xs">
          <h3 className="font-serif font-bold text-navy text-sm uppercase tracking-wider border-b border-border pb-2 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-gold" />
            Coordonnées Bancaires pour le Versement de la Redevance (15%)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label htmlFor="bank-name" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">Établissement Bancaire *</label>
              <input
                id="bank-name"
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl text-navy font-semibold focus:outline-none focus:border-gold min-h-[44px]"
                required
              />
            </div>

            <div>
              <label htmlFor="iban" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">Numéro de Compte / RIB / IBAN *</label>
              <input
                id="iban"
                type="text"
                value={iban}
                onChange={(e) => setIban(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl font-mono text-navy font-bold focus:outline-none focus:border-gold min-h-[44px]"
                required
              />
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
        </div>
      </form>
    </div>
  );
}
