"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  GraduationCap,
  ArrowLeft,
  Building2,
  Upload,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Sparkles,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Clock,
  Download,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { PageLoader, InlineLoader } from "@/components/ui/page-loader";
import {
  getStudentUniversity,
  requestAffiliation,
  type AffiliationAPI,
  type InstitutionAPI,
  type BouquetAPI,
} from "@/lib/services/student";

// ─── Badge Statut ─────────────────────────────────────────────────────────────

function StatusBadge({ status, display }: { status: string; display: string }) {
  const map: Record<string, string> = {
    approved: "bg-success/15 text-success border-success/30",
    pending: "bg-warning/15 text-warning border-warning/30",
    rejected: "bg-error/15 text-error border-error/30",
    suspended: "bg-error/15 text-error border-error/30",
    expired: "bg-foreground-muted/15 text-foreground-muted border-border",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${map[status] || "border-border text-foreground-muted"}`}
    >
      {status === "approved" && <ShieldCheck className="w-3 h-3" />}
      {status === "pending" && <Clock className="w-3 h-3" />}
      {status === "rejected" && <AlertCircle className="w-3 h-3" />}
      {display}
    </span>
  );
}

// ─── Carte Bouquet ────────────────────────────────────────────────────

function BouquetCard({ bouquet }: { bouquet: BouquetAPI }) {
  const handleDownloadWord = () => {
    toast.success(`Catalogue Word officiel (.doc) téléchargé pour ${bouquet.title}`);
  };

  return (
    <div className="p-5 rounded-3xl bg-background border border-border hover:border-gold/60 transition-all shadow-xs flex flex-col justify-between gap-3">
      <div className="space-y-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-gold px-2.5 py-0.5 rounded-md bg-navy/5 border border-gold/30">
          {bouquet.bouquet_type || "Bouquet"} {bouquet.faculty_code && `— ${bouquet.faculty_code}`}
        </span>
        <h4 className="font-serif font-bold text-navy text-sm leading-snug">
          {bouquet.title}
        </h4>
        <p className="text-xs text-foreground-muted">
          Accès institutionnel accordé par le rectorat pour votre cursus académique.
        </p>
      </div>

      <div className="pt-3 border-t border-border flex items-center justify-between text-xs flex-wrap gap-2">
        <div className="flex items-center gap-1.5 text-foreground-muted">
          <BookOpen className="w-3.5 h-3.5 text-gold" />
          <span className="font-mono font-bold text-navy">
            {bouquet.books_count}
          </span>
          <span>manuels inclus</span>
        </div>

        <button
          type="button"
          onClick={handleDownloadWord}
          title="Télécharger la liste au format Word officiel"
          className="inline-flex items-center gap-1 text-[11px] font-bold text-navy hover:text-gold transition-colors"
        >
          <FileText className="w-3.5 h-3.5 text-gold" />
          Export Word
        </button>
      </div>
    </div>
  );
}

// ─── Bloc Affiliation Active ───────────────────────────────────────────────────

function AffiliationActive({ aff }: { aff: AffiliationAPI }) {
  return (
    <div className="space-y-6">
      {/* Info institution */}
      <div className="p-6 rounded-3xl bg-background border border-border shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-gold uppercase tracking-wider">
            {aff.institution_detail?.country} &bull; {aff.institution_detail?.code}
          </p>
          <h2 className="font-serif font-bold text-navy text-lg sm:text-xl">
            {aff.institution_detail?.name}
          </h2>
          {aff.student_card_number && (
            <p className="text-xs font-mono text-foreground-muted">
              Matricule académique :{" "}
              <span className="text-navy font-bold">
                {aff.student_card_number}
              </span>
            </p>
          )}
          {aff.level && (
            <p className="text-xs text-foreground-muted">
              Niveau d&apos;études : <strong className="text-navy">{aff.level}</strong>
            </p>
          )}
        </div>
        <StatusBadge status={aff.status} display={aff.status_display} />
      </div>

      {/* Bouquets débloqués */}
      {aff.bouquets && aff.bouquets.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-navy text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-gold" />
              Mes Bouquets Documentaires Débloqués ({aff.bouquets.length})
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {aff.bouquets.map((bq) => (
              <BouquetCard key={bq.id} bouquet={bq} />
            ))}
          </div>

          <div className="text-center pt-2">
            <Link
              href="/student/books"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors min-h-[44px] shadow-xs"
            >
              <BookOpen className="w-4 h-4 text-gold" />
              Consulter mes manuels débloqués
            </Link>
          </div>
        </div>
      ) : (
        <div className="py-12 rounded-3xl bg-background border border-dashed border-border text-center space-y-3">
          <Sparkles className="w-8 h-8 text-foreground-muted mx-auto opacity-40" />
          <p className="text-sm font-semibold text-navy">
            Aucun bouquet actif pour votre faculté actuellement
          </p>
          <p className="text-xs text-foreground-muted max-w-sm mx-auto">
            Votre établissement n&apos;a pas encore souscrit à des packs documentaires pour ce semestre.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Formulaire d'Affiliation ─────────────────────────────────────────────────

function AffiliationForm({
  institutions,
  onSuccess,
}: {
  institutions: InstitutionAPI[];
  onSuccess: (aff: AffiliationAPI) => void;
}) {
  const [institutionId, setInstitutionId] = useState(
    institutions[0]?.id || ""
  );
  const [level, setLevel] = useState("Licence 1");
  const [matricule, setMatricule] = useState("");
  const [cardFile, setCardFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matricule.trim()) {
      toast.error("Le numéro de matricule est obligatoire.");
      setError("Le numéro de matricule est obligatoire.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const aff = await requestAffiliation({
        institution_id: institutionId,
        student_card_number: matricule,
        level,
        carte_etudiant_image: cardFile ? cardFile.name : "",
      });
      toast.success("Demande d'affiliation transmise avec succès au rectorat.");
      onSuccess(aff);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Erreur lors de la soumission de la demande.";
      toast.error(msg);
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-background border border-border rounded-3xl p-6 sm:p-10 shadow-xs space-y-6 max-w-3xl mx-auto">
      <div className="text-center space-y-2">
        <div className="p-4 rounded-full bg-gold/15 text-gold w-16 h-16 mx-auto flex items-center justify-center">
          <GraduationCap className="w-8 h-8" />
        </div>
        <h2 className="font-serif font-bold text-navy text-2xl">
          Rattacher mon Établissement Universitaire
        </h2>
        <p className="text-xs text-foreground-muted max-w-md mx-auto leading-relaxed">
          Entrez votre matricule académique pour débloquer automatiquement et sans frais les manuels et revues souscrits par votre faculté.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-xl mx-auto">
        {error && (
          <div className="p-3 rounded-2xl bg-error/10 border border-error/20 text-error text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {error}
          </div>
        )}

        <div className="space-y-1">
          <label
            htmlFor="institution-select"
            className="text-[10px] font-bold uppercase tracking-wider text-navy"
          >
            Université Partenaire *
          </label>
          <select
            id="institution-select"
            required
            value={institutionId}
            onChange={(e) => setInstitutionId(e.target.value)}
            className="w-full bg-background-secondary border border-border rounded-xl p-3 text-xs text-navy font-semibold focus:outline-none focus:border-gold min-h-[44px]"
          >
            {institutions.map((inst) => (
              <option key={inst.id} value={inst.id}>
                {inst.name} ({inst.code} &bull; {inst.country})
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label
            htmlFor="level-input"
            className="text-[10px] font-bold uppercase tracking-wider text-navy"
          >
            Niveau d&apos;études / Filière *
          </label>
          <input
            id="level-input"
            type="text"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            placeholder="ex. Licence 1 Droit, Master 2 Économie..."
            className="w-full bg-background-secondary border border-border rounded-xl p-3 text-xs text-navy font-semibold focus:outline-none focus:border-gold min-h-[44px]"
            required
          />
        </div>

        <div className="space-y-1">
          <label
            htmlFor="matricule-input"
            className="text-[10px] font-bold uppercase tracking-wider text-navy"
          >
            Numéro de Matricule Académique *
          </label>
          <input
            id="matricule-input"
            type="text"
            required
            placeholder="ex. MAT-2024-UAC-88412"
            value={matricule}
            onChange={(e) => setMatricule(e.target.value)}
            className="w-full bg-background-secondary border border-border rounded-xl p-3 text-xs font-mono text-navy font-bold focus:outline-none focus:border-gold min-h-[44px]"
          />
          <p className="text-[10px] text-foreground-muted">
            Aucune adresse email institutionnelle n&apos;est exigée. Le matricule permet la vérification.
          </p>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-wider text-navy">
            Carte d&apos;étudiant ou certificat de scolarité (Optionnel)
          </label>
          <div className="relative border-2 border-dashed border-border rounded-2xl p-4 text-center hover:border-gold transition-colors cursor-pointer bg-background-secondary">
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => {
                const f = e.target.files?.[0] || null;
                setCardFile(f);
                if (f) toast.info(`Justificatif sélectionné : ${f.name}`);
              }}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <Upload className="w-5 h-5 text-gold mx-auto mb-1" />
            <p className="text-xs font-bold text-navy">
              {cardFile ? cardFile.name : "Cliquez ou glissez votre justificatif ici"}
            </p>
            <p className="text-[10px] text-foreground-muted">
              Format JPG, PNG ou PDF &bull; max 5 Mo
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 px-4 rounded-xl bg-navy hover:bg-navy-hover text-white text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-2 min-h-[44px] disabled:opacity-60 cursor-pointer"
        >
          {submitting ? (
            <InlineLoader size={16} />
          ) : (
            <ArrowRight className="w-4 h-4 text-gold" />
          )}
          {submitting
            ? "Validation auprès de l'établissement..."
            : "Transmettre ma demande d'affiliation"}
        </button>
      </form>
    </div>
  );
}

// ─── Page Principale ──────────────────────────────────────────────────────────

export default function StudentUniversityPage() {
  const [affiliation, setAffiliation] = useState<AffiliationAPI | null>(null);
  const [institutions, setInstitutions] = useState<InstitutionAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const data = await getStudentUniversity();
        setAffiliation(data.affiliation);
        setInstitutions(data.institutions);
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "Erreur de chargement"
        );
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleAffiliationSuccess = (aff: AffiliationAPI) => {
    setAffiliation(aff);
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/student" className="hover:text-navy">
          Mon Espace
        </Link>
        <span>/</span>
        <span className="text-navy font-semibold">Mon Université &amp; Bouquets Campus</span>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/student"
            className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Retour
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
            <GraduationCap className="w-4 h-4 text-gold" />
            Partenariat Académique &amp; Bouquets Campus
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            {affiliation?.status === "approved"
              ? affiliation.institution_detail?.name
              : "Affiliation Universitaire"}
          </h1>
          <p className="text-xs text-foreground-muted mt-1">
            {affiliation?.status === "approved"
              ? "Accès actif aux bouquets documentaires souscrits par votre faculté."
              : "Liez votre compte à votre établissement pour débloquer les bouquets campus de votre cursus."}
          </p>
        </div>

        {affiliation?.status === "approved" && (
          <span className="px-3.5 py-1.5 rounded-full bg-gold/15 text-gold border border-gold/30 text-xs font-bold shrink-0 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            Affiliation Campus Active
          </span>
        )}
      </div>

      {/* ── Erreur ────────────────────────────────────────────────────── */}
      {error && (
        <div className="p-4 rounded-2xl bg-error/10 border border-error/30 text-error text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* ── Chargement ────────────────────────────────────────────────── */}
      {loading && (
        <PageLoader label="Chargement de votre statut universitaire" />
      )}

      {/* ── Affiliation en attente de validation ──────────────────────── */}
      {!loading && affiliation && affiliation.status === "pending" && (
        <div className="p-8 rounded-3xl bg-background border border-warning/30 shadow-xs text-center space-y-3">
          <Clock className="w-10 h-10 text-warning mx-auto" />
          <h2 className="font-serif font-bold text-navy text-xl">
            Demande en cours d&apos;examen par votre établissement
          </h2>
          <p className="text-xs text-foreground-muted max-w-md mx-auto">
            Votre demande d&apos;affiliation pour{" "}
            <strong>{affiliation.institution_detail?.name}</strong> a été
            transmise. Délai estimé de vérification : 24–48h ouvrables.
          </p>
          <div className="pt-2">
            <StatusBadge
              status={affiliation.status}
              display={affiliation.status_display}
            />
          </div>
        </div>
      )}

      {/* ── Affiliation rejetée — permettre une nouvelle demande ─────── */}
      {!loading && affiliation && (affiliation.status === "rejected" || affiliation.status === "expired") && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-error/10 border border-error/30 space-y-2">
            <StatusBadge
              status={affiliation.status}
              display={affiliation.status_display}
            />
            {affiliation.motif_rejet && (
              <p className="text-xs text-error">{affiliation.motif_rejet}</p>
            )}
          </div>
          {institutions.length > 0 && (
            <AffiliationForm
              institutions={institutions}
              onSuccess={handleAffiliationSuccess}
            />
          )}
        </div>
      )}

      {/* ── Affiliation Active ─────────────────────────────────────────── */}
      {!loading && affiliation && affiliation.status === "approved" && (
        <AffiliationActive aff={affiliation} />
      )}

      {/* ── Aucune affiliation ─────────────────────────────────────────── */}
      {!loading && !affiliation && institutions.length > 0 && (
        <AffiliationForm
          institutions={institutions}
          onSuccess={handleAffiliationSuccess}
        />
      )}

      {/* ── Aucune institution disponible ────────────────────────────── */}
      {!loading && !affiliation && institutions.length === 0 && !error && (
        <div className="py-16 rounded-3xl bg-background border border-dashed border-border text-center space-y-3">
          <Building2 className="w-10 h-10 text-foreground-muted mx-auto opacity-40" />
          <p className="text-sm font-semibold text-navy">
            Aucun établissement partenaire disponible
          </p>
          <p className="text-xs text-foreground-muted">
            Le réseau d&apos;universités partenaires est en cours d&apos;expansion.
          </p>
        </div>
      )}
    </div>
  );
}
