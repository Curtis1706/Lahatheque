"use client";

import React, { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { AdminUser } from "@/lib/types/admin";
import { updateAdminUser } from "@/lib/services/admin";
import {
  Building2,
  User,
  Phone,
  Globe,
  Pencil,
  Loader2,
  AlertTriangle,
  CheckCircle,
  School,
  PlusCircle,
  Percent,
} from "lucide-react";
import { toast } from "sonner";

interface EditUniversityUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AdminUser | null;
  onUpdated: () => void;
}

export function EditUniversityUserModal({
  isOpen,
  onClose,
  user,
  onUpdated,
}: EditUniversityUserModalProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("BJ");

  const [institutionMode, setInstitutionMode] = useState<"keep" | "existing" | "new">("keep");
  const [institutions, setInstitutions] = useState<
    { id: string; name: string; code?: string; royalty_rate?: number }[]
  >([]);
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<string>("");
  const [newInstName, setNewInstName] = useState("");
  const [newInstCode, setNewInstCode] = useState("");
  const [newInstCountry, setNewInstCountry] = useState("BJ");
  const [newInstRate, setNewInstRate] = useState<number>(15.0);

  const [overrideRate, setOverrideRate] = useState<number | "">("");
  const [showRateOverride, setShowRateOverride] = useState(false);

  const [loadingInstitutions, setLoadingInstitutions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    setFirstName(user.first_name);
    setLastName(user.last_name);
    setPhone(user.phone || "");
    setCountry(user.country || "BJ");
    setInstitutionMode("keep");
    setSelectedInstitutionId("");
    setNewInstName("");
    setNewInstCode("");
    setNewInstCountry("BJ");
    setNewInstRate(15.0);
    setOverrideRate("");
    setShowRateOverride(false);
  }, [user, isOpen]);

  useEffect(() => {
    if (institutionMode === "existing" && institutions.length === 0) {
      setLoadingInstitutions(true);
      fetch("/api/bff/partners/institutions/", { credentials: "include" })
        .then((r) => r.json())
        .then((d) => {
          const list = d?.data || d?.results || [];
          setInstitutions(list);
        })
        .catch(() => {})
        .finally(() => setLoadingInstitutions(false));
    }
  }, [institutionMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!firstName.trim() || !lastName.trim()) {
      toast.error("Le prénom et le nom sont obligatoires.");
      return;
    }
    if (institutionMode === "existing" && !selectedInstitutionId) {
      toast.error("Veuillez sélectionner une institution partenaire.");
      return;
    }
    if (institutionMode === "new" && !newInstName.trim()) {
      toast.error("Veuillez saisir le nom de la nouvelle institution.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim(),
        country,
      };

      if (institutionMode === "existing" && selectedInstitutionId) {
        payload.institution_id = selectedInstitutionId;
        if (showRateOverride && overrideRate !== "" && Number(overrideRate) > 0) {
          payload.royalty_rate_override = Number(overrideRate);
        }
      } else if (institutionMode === "new" && newInstName.trim()) {
        payload.institution_mode = "new";
        payload.institution_name = newInstName.trim();
        payload.institution_code = newInstCode.trim();
        payload.institution_country = newInstCountry;
        payload.institution_royalty_rate = newInstRate;
      }

      const res = await updateAdminUser(user.id, payload);
      if (res.success) {
        toast.success("Compte universitaire mis à jour avec succès.");
        onUpdated();
        onClose();
      } else {
        toast.error(res.error || "Erreur lors de la mise à jour.");
        if (res.suggestion_id) {
          setInstitutionMode("existing");
          setSelectedInstitutionId(res.suggestion_id);
          fetch("/api/bff/partners/institutions/", { credentials: "include" })
            .then((r) => r.json())
            .then((d) => {
              const list = d?.data || d?.results || [];
              setInstitutions(list);
            })
            .catch(() => {});
        }
      }
    } catch {
      toast.error("Impossible de contacter le serveur.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  const instDetail = (user as any).institution_detail || (user as any).institution;
  const currentInstName =
    instDetail?.name || (user as any).institution_name || user.extra_info?.institution_name;
  const currentInstCode = instDetail?.code;
  const currentRate = instDetail?.royalty_rate ?? 15.0;

  return (
    <Modal open={isOpen} onClose={onClose} title="Modifier le Compte Université">
      <form onSubmit={handleSubmit} className="p-5 space-y-5 max-w-lg mx-auto">
        {/* Current institution banner */}
        {currentInstName && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-navy/5 border border-navy/20">
            <div className="w-9 h-9 rounded-xl bg-navy flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs font-bold text-navy">{currentInstName}</p>
                {currentInstCode && (
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-gold/10 border border-gold/20 text-gold">
                    {currentInstCode}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-foreground-muted">
                Taux actuel :{" "}
                <span className="font-bold text-gold font-mono">{currentRate}%</span>
              </p>
            </div>
          </div>
        )}

        {/* Identity */}
        <div className="space-y-3">
          <p className="text-xs font-bold text-navy flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-gold" />
            Identité du Mandataire
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[11px] font-medium text-foreground">Prénom *</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full mt-1 p-2.5 text-xs rounded-xl bg-background border border-border focus:border-gold focus:outline-none"
                placeholder="Prénom"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-foreground">Nom *</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full mt-1 p-2.5 text-xs rounded-xl bg-background border border-border focus:border-gold focus:outline-none"
                placeholder="Nom"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[11px] font-medium text-foreground flex items-center gap-1">
                <Phone className="w-3 h-3" /> Téléphone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full mt-1 p-2.5 text-xs rounded-xl bg-background border border-border focus:border-gold focus:outline-none"
                placeholder="+229 90 00 00 00"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-foreground flex items-center gap-1">
                <Globe className="w-3 h-3" /> Pays
              </label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full mt-1 p-2.5 text-xs rounded-xl bg-background border border-border focus:border-gold focus:outline-none"
              >
                <option value="BJ">Bénin</option>
                <option value="TG">Togo</option>
                <option value="CI">Côte d&apos;Ivoire</option>
                <option value="SN">Sénégal</option>
                <option value="NE">Niger</option>
                <option value="GA">Gabon</option>
                <option value="ML">Mali</option>
                <option value="CM">Cameroun</option>
              </select>
            </div>
          </div>
        </div>

        {/* Institution */}
        <div className="space-y-3 p-3 rounded-2xl bg-background-secondary border border-border">
          <p className="text-xs font-bold text-navy flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-gold" />
            Institution Partenaire
          </p>

          <div className="flex gap-1.5 flex-wrap">
            {(
              [
                { value: "keep", label: "Conserver", Icon: CheckCircle, active: "ring-1 ring-navy text-foreground" },
                { value: "existing", label: "Rattacher", Icon: School, active: "bg-navy text-white border-navy" },
                { value: "new", label: "Nouvelle", Icon: PlusCircle, active: "bg-gold text-navy border-gold" },
              ] as const
            ).map(({ value, label, Icon, active }) => (
              <button
                key={value}
                type="button"
                onClick={() => setInstitutionMode(value)}
                className={`flex-1 min-w-0 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-semibold border transition-colors ${
                  institutionMode === value
                    ? active
                    : "bg-background border-border text-foreground-muted hover:border-navy"
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                {label}
              </button>
            ))}
          </div>

          {institutionMode === "keep" && (
            <p className="text-[11px] text-foreground-muted">
              {currentInstName
                ? `Institution conservée : ${currentInstName}`
                : "Aucune institution associée — sélectionnez une option ci-dessus."}
            </p>
          )}

          {institutionMode === "existing" && (
            <div className="space-y-2">
              {loadingInstitutions ? (
                <div className="flex items-center gap-2 p-2.5 text-xs text-foreground-muted">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Chargement...
                </div>
              ) : (
                <select
                  value={selectedInstitutionId}
                  onChange={(e) => setSelectedInstitutionId(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl bg-background border border-border focus:border-gold focus:outline-none min-h-[44px]"
                >
                  <option value="">-- Sélectionner une institution --</option>
                  {institutions.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.name}
                      {inst.code ? ` (${inst.code})` : ""}
                      {inst.royalty_rate !== undefined ? ` — ${inst.royalty_rate}%` : ""}
                    </option>
                  ))}
                </select>
              )}
              <div>
                <button
                  type="button"
                  onClick={() => setShowRateOverride((v) => !v)}
                  className="text-[11px] text-gold underline-offset-2 underline flex items-center gap-1 cursor-pointer"
                >
                  <Percent className="w-3 h-3" />
                  {showRateOverride ? "Annuler l'ajustement" : "Ajuster le taux conventionné"}
                </button>
                {showRateOverride && (
                  <div className="mt-2 space-y-1">
                    <label className="text-[11px] font-medium text-foreground">Taux dérogatoire (%)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={50}
                        step={0.5}
                        value={overrideRate}
                        onChange={(e) =>
                          setOverrideRate(e.target.value === "" ? "" : Number(e.target.value))
                        }
                        placeholder="15.0"
                        className="w-28 p-2.5 text-xs rounded-xl bg-background border border-border focus:border-gold focus:outline-none font-mono"
                      />
                      <span className="text-xs text-foreground-muted">% (défaut : 15%)</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {institutionMode === "new" && (
            <div className="space-y-2.5">
              <div>
                <label className="text-[11px] font-medium text-foreground">Nom officiel *</label>
                <input
                  type="text"
                  value={newInstName}
                  onChange={(e) => setNewInstName(e.target.value)}
                  placeholder="Université de Lomé"
                  className="w-full mt-1 p-2.5 text-xs rounded-xl bg-background border border-border focus:border-gold focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-medium text-foreground">Sigle</label>
                  <input
                    type="text"
                    value={newInstCode}
                    onChange={(e) => setNewInstCode(e.target.value.toUpperCase())}
                    placeholder="UL"
                    maxLength={12}
                    className="w-full mt-1 p-2.5 text-xs rounded-xl bg-background border border-border focus:border-gold focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-foreground">Pays</label>
                  <select
                    value={newInstCountry}
                    onChange={(e) => setNewInstCountry(e.target.value)}
                    className="w-full mt-1 p-2.5 text-xs rounded-xl bg-background border border-border focus:border-gold focus:outline-none"
                  >
                    <option value="BJ">Bénin</option>
                    <option value="TG">Togo</option>
                    <option value="CI">Côte d&apos;Ivoire</option>
                    <option value="SN">Sénégal</option>
                    <option value="NE">Niger</option>
                    <option value="GA">Gabon</option>
                    <option value="ML">Mali</option>
                    <option value="CM">Cameroun</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[11px] font-medium text-foreground flex items-center gap-1">
                  <Percent className="w-3 h-3 text-gold" />
                  Taux de redevance (%)
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="number"
                    min={1}
                    max={50}
                    step={0.5}
                    value={newInstRate}
                    onChange={(e) => setNewInstRate(Number(e.target.value))}
                    className="w-28 p-2.5 text-xs rounded-xl bg-background border border-border focus:border-gold focus:outline-none font-mono"
                  />
                  <span className="text-xs text-foreground-muted">% (standard : 15%)</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 p-2 rounded-lg bg-gold/10 border border-gold/20 text-[10px] text-navy">
                <AlertTriangle className="w-3 h-3 text-gold shrink-0" />
                <span>
                  Le code sigle sera généré automatiquement si laissé vide (ex : UL, UL-2...).
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-1 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-medium text-foreground-muted hover:bg-background-secondary transition-colors cursor-pointer"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Pencil className="w-3.5 h-3.5" />
                Enregistrer
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
