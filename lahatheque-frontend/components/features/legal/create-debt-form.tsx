"use client";

import React, { useState, useId } from "react";
import {
  Building2,
  User,
  Mail,
  Calendar,
  DollarSign,
  FileText,
  CheckCircle2,
  AlertTriangle,
  UploadCloud,
  ShieldCheck,
  Clock,
  ArrowLeft,
  Send,
  Info,
  Layers,
  FileCheck,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { PhoneInput } from "@/components/ui/phone-input";
import { createClientDebt } from "@/lib/services/legal";
import type { ClientDebt, CreateClientDebtPayload, DebtReminderConfig } from "@/lib/types/legal";

interface CreateDebtFormProps {
  onSuccess: (newDebt: ClientDebt) => void;
  onCancel: () => void;
  reminderConfig: DebtReminderConfig | null;
}

export function CreateDebtForm({ onSuccess, onCancel, reminderConfig }: CreateDebtFormProps) {
  const formId = useId();

  // Débiteur
  const [clientType, setClientType] = useState<CreateClientDebtPayload["client_type"]>("bookstore");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("+229");
  const [country, setCountry] = useState("Bénin");

  // Détails financiers & Pièce d'origine
  const [amount, setAmount] = useState<number>(150000);
  const [currency] = useState("XOF");
  const [motive, setMotive] = useState("Facture de commande d'ouvrages impayée");
  const [customMotive, setCustomMotive] = useState("");
  const [referenceDocument, setReferenceDocument] = useState(`FAC-2026-${Math.floor(1000 + Math.random() * 9000)}`);
  const [issueDate, setIssueDate] = useState(
    new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );

  // Échéancier
  const defaultDueDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const [dueDate, setDueDate] = useState(defaultDueDate);

  // Automatisation des relances ("ce que ça implique")
  const [autoRemindEnabled, setAutoRemindEnabled] = useState(true);
  const [initialReminderLevel, setInitialReminderLevel] = useState<1 | 2 | 3>(1);
  const [sendImmediateReminder, setSendImmediateReminder] = useState(false);
  const [ccAccountant, setCcAccountant] = useState(true);

  // Pièce justificative & notes
  const [fileName, setFileName] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);

  // Calcul dynamique du délai / retard
  const calculateOverdueDays = () => {
    if (!dueDate) return { days: 0, isOverdue: false };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    return {
      days: diffDays,
      isOverdue: diffDays > 0,
    };
  };

  const overdueInfo = calculateOverdueDays();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      toast.info(`Pièce justificative sélectionnée : ${file.name}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientName.trim()) {
      toast.error("Veuillez renseigner la raison sociale ou le nom du débiteur.");
      return;
    }
    if (!clientEmail.trim() || !clientEmail.includes("@")) {
      toast.error("Veuillez renseigner une adresse e-mail de relance valide.");
      return;
    }
    if (amount <= 0) {
      toast.error("Le montant de la créance doit être supérieur à 0 FCFA.");
      return;
    }
    if (!dueDate) {
      toast.error("Veuillez préciser la date limite de règlement.");
      return;
    }

    setLoading(true);
    try {
      const finalMotive = motive === "autre" ? customMotive || "Créance diverse" : motive;

      const payload: CreateClientDebtPayload = {
        client_name: clientName.trim(),
        client_email: clientEmail.trim().toLowerCase(),
        client_type: clientType,
        client_phone: clientPhone.trim(),
        country,
        amount,
        currency,
        due_date: dueDate,
        issue_date: issueDate,
        motive: finalMotive,
        reference_document: referenceDocument.trim(),
        auto_remind_enabled: autoRemindEnabled,
        initial_reminder_level: initialReminderLevel,
        send_immediate_reminder: sendImmediateReminder,
        cc_accountant: ccAccountant,
        notes: notes.trim(),
        file_name: fileName || undefined,
      };

      const newDebt = await createClientDebt(payload);
      toast.success(`La dette de ${newDebt.client_name} (${amount.toLocaleString("fr-FR")} FCFA) a été enregistrée avec succès.`);
      onSuccess(newDebt);
    } catch {
      toast.error("Erreur lors de l'enregistrement de la dette client.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Bannière explicative "Ce que déclarer une dette implique" */}
      <div className="p-4 sm:p-6 rounded-3xl bg-background-secondary border border-border space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gold/15 text-gold border border-gold/30">
              <ShieldCheck className="w-5 h-5 text-gold shrink-0" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-navy text-base">
                Déclaration d&apos;un Impayé &amp; Enregistrement au Registre de Recouvrement
              </h2>
              <p className="text-xs text-foreground-muted">
                Ce que l&apos;enregistrement d&apos;une dette implique pour le suivi juridique et comptable
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-navy hover:text-navy-hover transition-colors self-start sm:self-auto cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Retour aux relances
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs text-foreground-muted">
          <div className="p-3 rounded-2xl bg-background border border-border space-y-1">
            <p className="font-bold text-navy flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-gold" />
              Inscription au Registre
            </p>
            <p className="text-[11px] leading-relaxed">
              La créance est immédiatement comptabilisée dans l&apos;espace Juriste et visible dans le journal des impayés.
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-background border border-border space-y-1">
            <p className="font-bold text-navy flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-gold" />
              Moteur de Relance Automatique
            </p>
            <p className="text-[11px] leading-relaxed">
              Si activé, les avis d&apos;échéance seront générés selon la fréquence paramétrée (
              {reminderConfig?.frequency_days || 10} jours) jusqu&apos;à {reminderConfig?.max_reminders_count || 3} relances max.
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-background border border-border space-y-1">
            <p className="font-bold text-navy flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-gold" />
              Traçabilité &amp; Copie Comptable
            </p>
            <p className="text-[11px] leading-relaxed">
              Toute notification émise est consignée dans le journal d&apos;audit légal et transmise au service financier.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1 : Identification du Débiteur */}
        <div className="p-6 rounded-3xl bg-background border border-border space-y-4 shadow-xs">
          <div className="border-b border-border pb-3">
            <h3 className="font-serif font-bold text-navy text-sm flex items-center gap-2">
              <User className="w-4 h-4 text-gold" />
              1. Identification du Débiteur &amp; Contact Officiel
            </h3>
            <p className="text-xs text-foreground-muted mt-0.5">
              Sélectionnez la qualité du client et renseignez les coordonnées de notification
            </p>
          </div>

          {/* Type de Débiteur */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-navy uppercase tracking-wider">
              Type d&apos;Entité Débitrice *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {[
                { type: "bookstore", label: "Librairie", desc: "Dépôt-vente / Réseau", icon: Building2 },
                { type: "wholesaler", label: "Grossiste", desc: "Commande B2B", icon: Layers },
                { type: "institution", label: "Université", desc: "Convention cadre", icon: ShieldCheck },
                { type: "author", label: "Auteur", desc: "Avance / Crédit", icon: User },
                { type: "individual", label: "Particulier", desc: "Client lecteur", icon: User },
                { type: "other", label: "Partenaire", desc: "Autre contrat", icon: FileText },
              ].map((item) => {
                const isSelected = clientType === item.type;
                const Icon = item.icon;
                return (
                  <button
                    key={item.type}
                    type="button"
                    onClick={() => setClientType(item.type as any)}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer min-h-[56px] flex flex-col justify-between ${
                      isSelected
                        ? "bg-navy text-white border-navy shadow-xs"
                        : "bg-background-secondary border-border hover:border-gold/50 text-navy"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <Icon className={`w-4 h-4 ${isSelected ? "text-gold" : "text-foreground-muted"}`} />
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-gold" />}
                    </div>
                    <div>
                      <p className="font-bold text-xs leading-tight">{item.label}</p>
                      <p className={`text-[10px] truncate ${isSelected ? "text-navy-light" : "text-foreground-muted"}`}>
                        {item.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            {/* Nom / Raison Sociale */}
            <div>
              <label htmlFor={`${formId}-clientName`} className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
                Raison Sociale / Nom Complet du Débiteur *
              </label>
              <input
                id={`${formId}-clientName`}
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="ex: Librairie Centrale de Parakou, Université d'Abomey-Calavi..."
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-border bg-background-secondary focus:outline-none focus:border-gold text-navy min-h-[44px]"
                required
              />
            </div>

            {/* Email de Relance */}
            <div>
              <label htmlFor={`${formId}-clientEmail`} className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
                Adresse E-mail Officielle de Relance *
              </label>
              <div className="relative">
                <input
                  id={`${formId}-clientEmail`}
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="comptabilite@partenaire.bj ou client@gmail.com"
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border border-border bg-background-secondary focus:outline-none focus:border-gold text-navy min-h-[44px]"
                  required
                />
                <Mail className="w-4 h-4 text-foreground-muted absolute left-3 top-3.5" />
              </div>
              <p className="text-[10px] text-foreground-muted mt-1">
                Reçoit les avis d&apos;échéance, relances cordiales et mises en demeure.
              </p>
            </div>

            {/* Téléphone */}
            <div>
              <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
                Téléphone / WhatsApp Professionnel
              </label>
              <PhoneInput
                value={clientPhone}
                onChange={(val) => setClientPhone(val)}
                className="min-h-[44px]"
              />
            </div>

            {/* Pays */}
            <div>
              <label htmlFor={`${formId}-country`} className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
                Pays de Résidence / Siège Social
              </label>
              <select
                id={`${formId}-country`}
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-border bg-background-secondary focus:outline-none focus:border-gold text-navy min-h-[44px] cursor-pointer"
              >
                <option value="Bénin">Bénin (BJ)</option>
                <option value="Togo">Togo (TG)</option>
                <option value="Côte d'Ivoire">Côte d&apos;Ivoire (CI)</option>
                <option value="Sénégal">Sénégal (SN)</option>
                <option value="Burkina Faso">Burkina Faso (BF)</option>
                <option value="Niger">Niger (NE)</option>
                <option value="Mali">Mali (ML)</option>
                <option value="Autre pays">Autre pays</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2 : Détails Financiers & Justificatif */}
        <div className="p-6 rounded-3xl bg-background border border-border space-y-4 shadow-xs">
          <div className="border-b border-border pb-3">
            <h3 className="font-serif font-bold text-navy text-sm flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-gold" />
              2. Qualification Financière &amp; Origine de la Créance
            </h3>
            <p className="text-xs text-foreground-muted mt-0.5">
              Montant impayé, motif contractuel et référence de la facture ou du bon de commande
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Montant */}
            <div>
              <label htmlFor={`${formId}-amount`} className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
                Montant Principal en Impayé (FCFA) *
              </label>
              <div className="relative">
                <input
                  id={`${formId}-amount`}
                  type="number"
                  min="100"
                  step="500"
                  value={amount}
                  onChange={(e) => setAmount(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full pl-9 pr-14 py-2.5 text-xs font-mono font-bold rounded-xl border border-border bg-background-secondary focus:outline-none focus:border-gold text-navy min-h-[44px]"
                  required
                />
                <DollarSign className="w-4 h-4 text-gold absolute left-3 top-3.5" />
                <span className="absolute right-3 top-3 text-xs font-bold font-mono text-foreground-muted">
                  {currency}
                </span>
              </div>
              <p className="text-[10px] text-foreground-muted mt-1">
                Soit {amount.toLocaleString("fr-FR")} {currency}
              </p>
            </div>

            {/* Référence document */}
            <div>
              <label htmlFor={`${formId}-refDoc`} className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
                Référence Facture / Bon de Commande *
              </label>
              <div className="relative">
                <input
                  id={`${formId}-refDoc`}
                  type="text"
                  value={referenceDocument}
                  onChange={(e) => setReferenceDocument(e.target.value)}
                  placeholder="ex: FAC-2026-0842, CMD-2026-118..."
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs font-mono font-bold rounded-xl border border-border bg-background-secondary focus:outline-none focus:border-gold text-navy min-h-[44px]"
                  required
                />
                <FileText className="w-4 h-4 text-foreground-muted absolute left-3 top-3.5" />
              </div>
            </div>

            {/* Date d'émission */}
            <div>
              <label htmlFor={`${formId}-issueDate`} className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
                Date d&apos;Émission de la Pièce
              </label>
              <div className="relative">
                <input
                  id={`${formId}-issueDate`}
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs font-mono rounded-xl border border-border bg-background-secondary focus:outline-none focus:border-gold text-navy min-h-[44px] cursor-pointer"
                />
                <Calendar className="w-4 h-4 text-foreground-muted absolute left-3 top-3.5" />
              </div>
            </div>
          </div>

          {/* Motif de la créance */}
          <div className="space-y-2 pt-1">
            <label htmlFor={`${formId}-motive`} className="block text-xs font-bold text-navy uppercase tracking-wider">
              Motif / Nature de l&apos;Impayé *
            </label>
            <select
              id={`${formId}-motive`}
              value={motive}
              onChange={(e) => setMotive(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-border bg-background-secondary focus:outline-none focus:border-gold text-navy min-h-[44px] cursor-pointer"
            >
              <option value="Facture de commande d'ouvrages impayée">
                Facture de commande d&apos;ouvrages impayée (Livraison effectuée)
              </option>
              <option value="Achat d'exemplaires papier à crédit échu">
                Achat d&apos;exemplaires papier à crédit échu (Grossiste / Librairie)
              </option>
              <option value="Dépôt-vente de livres non soldé">
                Dépôt-vente de livres non soldé (Invendus non restitués ni réglés)
              </option>
              <option value="Convention universitaire / Redevance annuelle échue">
                Convention universitaire / Redevance institutionnelle impayée
              </option>
              <option value="Avance sur droits d'auteur ou solde débiteur">
                Avance sur droits d&apos;auteur ou solde débiteur en attente de régularisation
              </option>
              <option value="autre">Autre motif contractuel / commercial...</option>
            </select>

            {motive === "autre" && (
              <input
                type="text"
                value={customMotive}
                onChange={(e) => setCustomMotive(e.target.value)}
                placeholder="Précisez la nature de la créance..."
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-border bg-background focus:outline-none focus:border-gold text-navy min-h-[44px] mt-2 animate-fadeIn"
                required
              />
            )}
          </div>
        </div>

        {/* Section 3 : Échéancier & Règles de Relance Automatique ("Ce que ça implique") */}
        <div className="p-6 rounded-3xl bg-background border border-border space-y-4 shadow-xs">
          <div className="border-b border-border pb-3">
            <h3 className="font-serif font-bold text-navy text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-gold" />
              3. Échéancier &amp; Paramétrage des Relances Automatiques
            </h3>
            <p className="text-xs text-foreground-muted mt-0.5">
              Définissez la date d&apos;exigibilité et la stratégie de notification automatisée
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
            {/* Date d'échéance */}
            <div>
              <label htmlFor={`${formId}-dueDate`} className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
                Date Limite d&apos;Exigibilité (Échéance de paiement) *
              </label>
              <div className="relative">
                <input
                  id={`${formId}-dueDate`}
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 text-xs font-mono font-bold rounded-xl border border-border bg-background-secondary focus:outline-none focus:border-gold text-navy min-h-[44px] cursor-pointer"
                  required
                />
                <Calendar className="w-4 h-4 text-gold absolute left-3 top-3.5" />
              </div>

              {/* Badge d'état d'échéance dynamique */}
              <div className="mt-2">
                {overdueInfo.isOverdue ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 text-xs font-bold">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span>Créance déjà échue (+{overdueInfo.days} jours de retard) — Éligible à relance immédiate</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-xs font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Échéance future (à échoir dans {Math.abs(overdueInfo.days)} jours)</span>
                  </div>
                )}
              </div>
            </div>

            {/* Niveau initial de relance */}
            <div>
              <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
                Niveau Initial de Relance
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { level: 1, label: "Niveau 1", desc: "Amiable / Courtois" },
                  { level: 2, label: "Niveau 2", desc: "Rappel formel" },
                  { level: 3, label: "Niveau 3", desc: "Mise en demeure" },
                ].map((item) => (
                  <button
                    key={item.level}
                    type="button"
                    onClick={() => setInitialReminderLevel(item.level as any)}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer min-h-[44px] flex flex-col items-center justify-center ${
                      initialReminderLevel === item.level
                        ? "bg-navy text-white border-navy font-bold shadow-xs"
                        : "bg-background-secondary border-border text-navy hover:border-gold/50"
                    }`}
                  >
                    <span className="text-xs font-bold">{item.label}</span>
                    <span className="text-[10px] opacity-75">{item.desc}</span>
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-foreground-muted mt-1">
                Détermine le ton et les mentions juridiques insérées dans l&apos;e-mail de relance.
              </p>
            </div>
          </div>

          {/* Options d'automatisation & Cases à cocher */}
          <div className="p-4 rounded-2xl bg-background-secondary border border-border space-y-3 pt-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRemindEnabled}
                onChange={(e) => setAutoRemindEnabled(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-navy focus:ring-navy cursor-pointer accent-navy"
              />
              <div className="text-xs">
                <span className="font-bold text-navy block">
                  Inclure cette créance dans le cycle des relances automatiques LAHAThèque
                </span>
                <span className="text-foreground-muted text-[11px]">
                  Le système planifiera les relances selon les règles de la plateforme (fréquence de{" "}
                  {reminderConfig?.frequency_days || 10} jours, seuil de {reminderConfig?.min_amount_threshold || 5000} FCFA).
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={sendImmediateReminder}
                onChange={(e) => setSendImmediateReminder(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-navy focus:ring-navy cursor-pointer accent-navy"
              />
              <div className="text-xs">
                <span className="font-bold text-navy block">
                  Déclencher immédiatement l&apos;envoi de la 1ère relance par e-mail
                </span>
                <span className="text-foreground-muted text-[11px]">
                  Un e-mail de notification officiel sera expédié dès l&apos;enregistrement à {clientEmail || "l'adresse client"}.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={ccAccountant}
                onChange={(e) => setCcAccountant(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-navy focus:ring-navy cursor-pointer accent-navy"
              />
              <div className="text-xs">
                <span className="font-bold text-navy block">
                  Mettre en copie le service comptabilité ({reminderConfig?.accountant_email || "contact@mail.lahalex.com"})
                </span>
                <span className="text-foreground-muted text-[11px]">
                  Permet la réconciliation financière et le suivi des règlements bancaires / Mobile Money.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Section 4 : Pièce Justificative & Notes Juridiques */}
        <div className="p-6 rounded-3xl bg-background border border-border space-y-4 shadow-xs">
          <div className="border-b border-border pb-3">
            <h3 className="font-serif font-bold text-navy text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-gold" />
              4. Pièce Justificative &amp; Observations Confidentielles
            </h3>
            <p className="text-xs text-foreground-muted mt-0.5">
              Joignez la facture signée, le bon de livraison et conservez l&apos;historique des échanges
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Zone de dépôt justificatif */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-navy uppercase tracking-wider">
                Document Justificatif (PDF, Facture, Bon de livraison)
              </label>
              <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-border hover:border-gold rounded-2xl bg-background-secondary/50 cursor-pointer transition-colors min-h-[110px] text-center">
                <UploadCloud className="w-6 h-6 text-gold mb-1" />
                <span className="text-xs font-bold text-navy">
                  {fileName ? fileName : "Glisser-déposer ou cliquer pour joindre un justificatif"}
                </span>
                <span className="text-[10px] text-foreground-muted mt-0.5">
                  Format PDF, PNG, JPG (jusqu&apos;à 25 Mo)
                </span>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
              {fileName && (
                <div className="flex items-center justify-between text-[11px] p-2 rounded-xl bg-gold/10 border border-gold/20 text-navy">
                  <span className="font-bold truncate">{fileName}</span>
                  <button
                    type="button"
                    onClick={() => setFileName(null)}
                    className="p-1 hover:text-rose-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Notes internes confidentielles */}
            <div className="space-y-1.5">
              <label htmlFor={`${formId}-notes`} className="block text-xs font-bold text-navy uppercase tracking-wider">
                Notes Confidentielles Internes (Juriste &amp; Comptabilité)
              </label>
              <textarea
                id={`${formId}-notes`}
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Historique des relances téléphoniques, promesses de paiement, accord d'échéancier..."
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-border bg-background-secondary focus:outline-none focus:border-gold text-navy resize-none"
              />
            </div>
          </div>
        </div>

        {/* Récapitulatif dynamique & Barre d'actions */}
        <div className="p-4 sm:p-6 rounded-3xl bg-navy text-white border border-navy-hover flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-gold shrink-0" />
              <span className="font-bold text-sm">
                Total à recouvrer : {amount.toLocaleString("fr-FR")} {currency}
              </span>
            </div>
            <p className="text-navy-light text-[11px]">
              Débiteur : <strong>{clientName || "Non renseigné"}</strong> • Échéance :{" "}
              <strong>{dueDate ? new Date(dueDate).toLocaleDateString("fr-FR") : "Non définie"}</strong> • Relance immédiate :{" "}
              <strong>{sendImmediateReminder ? "Oui (Niveau " + initialReminderLevel + ")" : "Non"}</strong>
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              disabled={loading}
              onClick={onCancel}
              className="px-4 py-2.5 rounded-xl border border-border text-white text-xs font-bold hover:bg-navy-hover transition-colors min-h-[44px] cursor-pointer disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-gold hover:bg-gold-hover text-navy font-bold text-xs transition-all flex items-center gap-2 shadow-sm min-h-[44px] cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Clock className="w-4 h-4 animate-spin text-navy" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-navy" />
                  Enregistrer la Dette Client
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
