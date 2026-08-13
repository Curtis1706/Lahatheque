"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { User, ArrowLeft, Save, Building2, ShieldCheck, Upload, FileText, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { getClientUniversityAffiliation, submitUniversityAffiliation } from "@/lib/services/student";
import type { ClientUniversityAffiliation } from "@/lib/types/student";

export default function StudentProfilePage() {
  const { user } = useAuth();
  const [firstName, setFirstName] = useState(user?.first_name || "Jean-Luc");
  const [lastName, setLastName] = useState(user?.last_name || "KOUASSI");
  const [email, setEmail] = useState(user?.email || "jeanluc.kouassi@gmail.com");
  const [phone, setPhone] = useState("+229 97 12 34 56");
  const [address, setAddress] = useState("Quartier Zogbo, Cotonou, Bénin");

  // State d'affiliation optionnelle (Validation Client Point 1)
  const [affiliation, setAffiliation] = useState<ClientUniversityAffiliation | null>(null);
  const [selectedUniv, setSelectedUniv] = useState("Université d'Abomey-Calavi (UAC)");
  const [faculty, setFaculty] = useState("Faculté de Droit (FADESP)");
  const [cardNumber, setCardNumber] = useState("ETU-2024-88912");
  const [proofFileName, setProofFileName] = useState("carte-etudiant-uac.pdf");
  const [saving, setSaving] = useState(false);
  const [submittingAffiliation, setSubmittingAffiliation] = useState(false);

  useEffect(() => {
    async function loadAffiliation() {
      const data = await getClientUniversityAffiliation();
      setAffiliation(data);
    }
    loadAffiliation();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      alert("Vos informations personnelles et adresse de livraison ont été mises à jour !");
    }, 500);
  };

  const handleSubmitAffiliationForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingAffiliation(true);
    try {
      const updatedAff = await submitUniversityAffiliation(
        selectedUniv,
        faculty,
        cardNumber,
        `/docs/${proofFileName}`
      );
      setAffiliation(updatedAff);
      alert("Votre demande d'affiliation universitaire et votre pièce justificative ont été soumises pour validation !");
    } finally {
      setSubmittingAffiliation(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-8 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/student" className="hover:text-navy">Mon Espace</Link>
        <span>/</span>
        <span className="text-navy font-semibold">Profil &amp; Paramètres</span>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/student" className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Mon Espace
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
            <User className="w-4 h-4 text-gold" />
            Paramètres du Compte Lecteur (Section 3.6)
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Profil &amp; Affiliation Universitaire Optionnelle
          </h1>
          <p className="text-xs text-foreground-muted mt-1">
            Gérez vos informations personnelles, votre adresse de livraison papier et votre rattachement universitaire facultatif.
          </p>
        </div>
      </div>

      {/* Formulaire 1: Informations Personnelles */}
      <form onSubmit={handleSaveProfile} className="p-6 rounded-3xl bg-background border border-border space-y-4 shadow-xs">
        <h3 className="font-serif font-bold text-navy text-sm uppercase tracking-wider border-b border-border pb-2">
          Informations Personnelles &amp; Livraison
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label htmlFor="first-name" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">Prénom *</label>
            <input
              id="first-name"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl text-navy font-semibold focus:outline-none focus:border-gold min-h-[44px]"
              required
            />
          </div>

          <div>
            <label htmlFor="last-name" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">Nom *</label>
            <input
              id="last-name"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl text-navy font-semibold focus:outline-none focus:border-gold min-h-[44px]"
              required
            />
          </div>

          <div>
            <label htmlFor="email-addr" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">Adresse E-mail *</label>
            <input
              id="email-addr"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl font-mono text-navy font-bold focus:outline-none focus:border-gold min-h-[44px]"
              required
            />
          </div>

          <div>
            <label htmlFor="phone-num" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">Téléphone *</label>
            <input
              id="phone-num"
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl font-mono text-navy font-bold focus:outline-none focus:border-gold min-h-[44px]"
              required
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="user-addr" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">Adresse de Livraison Par Défaut (Livres Papier) *</label>
            <input
              id="user-addr"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl text-navy font-semibold focus:outline-none focus:border-gold min-h-[44px]"
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
                Enregistrer le Profil
              </>
            )}
          </button>
        </div>
      </form>

      {/* Formulaire 2: Affiliation Universitaire Optionnelle (Validation Client Point 1) */}
      <form onSubmit={handleSubmitAffiliationForm} className="p-6 rounded-3xl bg-background border border-border space-y-4 shadow-xs">
        <div className="border-b border-border pb-3 flex items-center justify-between">
          <div>
            <h3 className="font-serif font-bold text-navy text-sm uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-gold" />
              Affiliation Universitaire (Champ Facultatif / Optionnel)
            </h3>
            <p className="text-[11px] text-foreground-muted mt-0.5">
              Si vous êtes étudiant ou enseignant, rattachez votre établissement pour débloquer l&apos;accès au bouquet institutionnel.
            </p>
          </div>
          {affiliation?.status === "approved" && (
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 text-xs font-bold inline-flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Affilié &amp; Validé
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label htmlFor="univ-select" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">Choix de l&apos;Université en Base de Données *</label>
            <select
              id="univ-select"
              value={selectedUniv}
              onChange={(e) => setSelectedUniv(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl text-navy font-semibold focus:outline-none focus:border-gold min-h-[44px]"
            >
              <option value="Université d'Abomey-Calavi (UAC)">Université d&apos;Abomey-Calavi (UAC - Bénin)</option>
              <option value="Université Nationale d'Agriculture (UNA)">Université Nationale d&apos;Agriculture (UNA - Bénin)</option>
              <option value="Université de Parakou (UP)">Université de Parakou (UP - Bénin)</option>
              <option value="Université Cheikh Anta Diop (UCAD)">Université Cheikh Anta Diop (UCAD - Sénégal)</option>
            </select>
          </div>

          <div>
            <label htmlFor="fac-name" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">Faculté ou École *</label>
            <input
              id="fac-name"
              type="text"
              value={faculty}
              onChange={(e) => setFaculty(e.target.value)}
              placeholder="ex. Faculté de Droit (FADESP)"
              className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl text-navy font-semibold focus:outline-none focus:border-gold min-h-[44px]"
              required
            />
          </div>

          <div>
            <label htmlFor="card-num" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">Numéro de Carte Étudiant ou Matricule Enseignant *</label>
            <input
              id="card-num"
              type="text"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              placeholder="ex. ETU-2024-88912"
              className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl font-mono text-navy font-bold focus:outline-none focus:border-gold min-h-[44px]"
              required
            />
          </div>

          <div>
            <label htmlFor="proof-file" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
              Pièce Justificative (Carte Étudiant / Attestation PDF) *
            </label>
            <div className="flex items-center gap-2">
              <input
                id="proof-file"
                type="file"
                onChange={(e) => setProofFileName(e.target.files?.[0]?.name || "justificatif.pdf")}
                className="hidden"
              />
              <label
                htmlFor="proof-file"
                className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl text-navy font-semibold flex items-center justify-between cursor-pointer hover:border-gold min-h-[44px]"
              >
                <span className="truncate">{proofFileName}</span>
                <Upload className="w-4 h-4 text-gold shrink-0 ml-2" />
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={submittingAffiliation}
            className="px-6 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors inline-flex items-center gap-2 shadow-xs min-h-[44px] disabled:opacity-50"
          >
            {submittingAffiliation ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Building2 className="w-4 h-4 text-gold" />
                Soumettre ma Demande d&apos;Affiliation
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
