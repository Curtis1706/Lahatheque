"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { 
  BookOpenCheck, 
  FileText, 
  Download, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ArrowLeft, 
  MessageSquare,
  AlertCircle,
  ExternalLink,
  Search,
  Check,
  X
} from "lucide-react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/ui/status-badge";
import { 
  getManuscriptsForReview, 
  decideOnManuscript, 
  type ManuscriptForReview 
} from "@/lib/services/layout-artist";

export default function ChiefLayoutManuscriptsPage() {
  const [manuscripts, setManuscripts] = useState<ManuscriptForReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "study_pending" | "catalog_preparation" | "rejected">("study_pending");
  const [searchQuery, setSearchQuery] = useState("");

  // Modale de décision
  const [selectedManuscript, setSelectedManuscript] = useState<ManuscriptForReview | null>(null);
  const [decisionType, setDecisionType] = useState<"accept" | "reject">("accept");
  const [editorialNote, setEditorialNote] = useState("");
  const [submittingDecision, setSubmittingDecision] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const data = await getManuscriptsForReview();
      setManuscripts(data);
    } catch (err) {
      console.error("Erreur chargement manuscrits:", err);
      toast.error("Impossible de charger les manuscrits.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredManuscripts = useMemo(() => {
    return manuscripts.filter((m) => {
      if (activeTab === "study_pending" && m.status !== "study_pending") return false;
      if (activeTab === "catalog_preparation" && m.status !== "catalog_preparation" && m.status !== "accepted") return false;
      if (activeTab === "rejected" && m.status !== "rejected") return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = m.title.toLowerCase().includes(q);
        const matchAuthor = m.author_name.toLowerCase().includes(q) || m.author_email.toLowerCase().includes(q);
        const matchSummary = m.suggested_summary.toLowerCase().includes(q);
        if (!matchTitle && !matchAuthor && !matchSummary) return false;
      }
      return true;
    });
  }, [manuscripts, activeTab, searchQuery]);

  const counts = useMemo(() => {
    return {
      all: manuscripts.length,
      study_pending: manuscripts.filter((m) => m.status === "study_pending").length,
      catalog_preparation: manuscripts.filter((m) => m.status === "catalog_preparation" || m.status === "accepted").length,
      rejected: manuscripts.filter((m) => m.status === "rejected").length,
    };
  }, [manuscripts]);

  function openDecisionModal(manuscript: ManuscriptForReview, type: "accept" | "reject") {
    setSelectedManuscript(manuscript);
    setDecisionType(type);
    setEditorialNote("");
  }

  async function handleConfirmDecision() {
    if (!selectedManuscript) return;

    setSubmittingDecision(true);
    try {
      const ok = await decideOnManuscript(selectedManuscript.id, decisionType, editorialNote);
      if (ok) {
        toast.success(
          decisionType === "accept"
            ? `Le manuscrit « ${selectedManuscript.title} » a été accepté. Prêt pour la maquette.`
            : `Le manuscrit « ${selectedManuscript.title} » a été refusé.`
        );
        setSelectedManuscript(null);
        // Mettre à jour localement l'état
        setManuscripts((prev) =>
          prev.map((m) =>
            m.id === selectedManuscript.id
              ? {
                  ...m,
                  status: decisionType === "accept" ? "catalog_preparation" : "rejected",
                  editorial_note: editorialNote,
                }
              : m
          )
        );
      } else {
        toast.error("Échec de l'enregistrement de la décision.");
      }
    } catch {
      toast.error("Une erreur est survenue lors de la validation.");
    } finally {
      setSubmittingDecision(false);
    }
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 sm:space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/chief-layout" className="hover:text-navy">Chef Maquettiste</Link>
        <span>/</span>
        <span className="text-navy font-semibold">Étude des Manuscrits</span>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/chief-layout" className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Espace Chef Maquettiste
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
            <BookOpenCheck className="w-4 h-4 text-gold" />
            Comité Éditorial &amp; Mise en Page
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            File d&apos;Étude des Manuscrits Auteurs
          </h1>
          <p className="text-xs text-foreground-muted mt-1">
            Examinez les propositions soumises par les auteurs, émettez une note éditoriale et transférez les ouvrages retenus à l&apos;équipe de maquettage.
          </p>
        </div>
      </div>

      {/* Tabs & Barre de Recherche */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Onglets */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setActiveTab("study_pending")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "study_pending"
                ? "bg-navy text-white shadow-xs"
                : "bg-background-secondary text-foreground-muted hover:text-navy border border-border"
            }`}
          >
            À l&apos;étude ({counts.study_pending})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("catalog_preparation")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "catalog_preparation"
                ? "bg-navy text-white shadow-xs"
                : "bg-background-secondary text-foreground-muted hover:text-navy border border-border"
            }`}
          >
            Acceptés ({counts.catalog_preparation})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("rejected")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "rejected"
                ? "bg-navy text-white shadow-xs"
                : "bg-background-secondary text-foreground-muted hover:text-navy border border-border"
            }`}
          >
            Refusés ({counts.rejected})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "all"
                ? "bg-navy text-white shadow-xs"
                : "bg-background-secondary text-foreground-muted hover:text-navy border border-border"
            }`}
          >
            Tous ({counts.all})
          </button>
        </div>

        {/* Recherche rapide */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted pointer-events-none" />
          <input
            type="search"
            placeholder="Rechercher titre, auteur..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-border bg-background focus:outline-none focus:border-navy"
          />
        </div>
      </div>

      {/* Liste des manuscrits */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-background-secondary rounded-2xl animate-pulse border border-border" />
          ))}
        </div>
      ) : filteredManuscripts.length === 0 ? (
        <div className="p-12 text-center bg-background border border-border rounded-3xl space-y-2">
          <BookOpenCheck className="w-10 h-10 text-foreground-muted mx-auto" />
          <h3 className="font-bold text-sm text-navy">Aucun manuscrit trouvé</h3>
          <p className="text-xs text-foreground-muted">
            {activeTab === "study_pending"
              ? "Tous les manuscrits en attente ont été étudiés."
              : "Aucune soumission ne correspond à ce filtre."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredManuscripts.map((m) => (
            <div
              key={m.id}
              className="bg-background border border-border rounded-2xl p-5 shadow-xs transition-all hover:border-navy/30 space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded-md bg-gold/15 text-navy font-mono text-[10px] font-bold uppercase tracking-wider">
                      {m.version_type || "Manuscrit Original"}
                    </span>
                    <span className="text-[11px] text-foreground-muted font-medium">
                      Langue : <strong className="text-navy uppercase">{m.suggested_language || "FR"}</strong>
                    </span>
                    <span className="text-[11px] text-foreground-muted">
                      Déposé le {new Date(m.submitted_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
                    </span>
                  </div>
                  <h3 className="font-serif text-lg font-bold text-navy leading-snug">
                    {m.title}
                  </h3>
                  <p className="text-xs text-foreground-muted font-medium">
                    Auteur : <span className="font-bold text-navy">{m.author_name}</span> ({m.author_email})
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={m.status} />
                </div>
              </div>

              {/* Résumé suggéré */}
              {m.suggested_summary && (
                <div className="p-3.5 rounded-xl bg-background-secondary border border-border text-xs text-foreground/90 leading-relaxed">
                  <p className="font-bold text-[11px] text-navy uppercase tracking-wider mb-1">Résumé / Présentation de l&apos;auteur :</p>
                  <p className="line-clamp-3">{m.suggested_summary}</p>
                </div>
              )}

              {/* Note éditoriale déjà enregistrée */}
              {m.editorial_note && (
                <div className="p-3 rounded-xl bg-navy/5 border border-navy/20 text-xs text-navy space-y-0.5">
                  <p className="font-bold text-[11px] text-navy flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-gold" />
                    Note éditoriale enregistrée :
                  </p>
                  <p className="text-foreground-muted">{m.editorial_note}</p>
                </div>
              )}

              {/* Barre d'action inférieure */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-border">
                <div>
                  {m.manuscript_file_url ? (
                    <a
                      href={m.manuscript_file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-navy hover:text-gold transition-colors"
                    >
                      <Download className="w-3.5 h-3.5 text-gold" />
                      Télécharger / Consulter le fichier manuscrit
                      <ExternalLink className="w-3 h-3 opacity-60" />
                    </a>
                  ) : (
                    <span className="text-xs text-foreground-muted italic">
                      Aucun fichier binaire rattaché
                    </span>
                  )}
                </div>

                {m.status === "study_pending" && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openDecisionModal(m, "reject")}
                      className="px-3.5 py-2 rounded-xl border border-border hover:bg-background-secondary text-foreground text-xs font-bold transition-colors inline-flex items-center gap-1.5 min-h-[38px] cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5 text-foreground-muted" />
                      Refuser
                    </button>
                    <button
                      type="button"
                      onClick={() => openDecisionModal(m, "accept")}
                      className="px-4 py-2 rounded-xl bg-navy hover:bg-navy-dark text-white text-xs font-bold transition-colors inline-flex items-center gap-1.5 shadow-xs min-h-[38px] cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-gold" />
                      Accepter pour Maquette
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modale de décision éditoriale */}
      {selectedManuscript && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-dark/70 backdrop-blur-xs p-4">
          <div className="bg-background border border-border rounded-3xl shadow-2xl w-full max-w-lg p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between gap-3 border-b border-border pb-4">
              <div>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  decisionType === "accept" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
                }`}>
                  {decisionType === "accept" ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                  {decisionType === "accept" ? "Acceptation du manuscrit" : "Refus du manuscrit"}
                </span>
                <h3 className="font-serif text-lg font-bold text-navy mt-1">
                  « {selectedManuscript.title} »
                </h3>
                <p className="text-xs text-foreground-muted">
                  Auteur : {selectedManuscript.author_name} ({selectedManuscript.author_email})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedManuscript(null)}
                className="p-1.5 rounded-xl hover:bg-background-secondary text-foreground-muted transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-navy uppercase tracking-wider block">
                {decisionType === "accept" ? "Note éditoriale / Instructions pour la maquette (optionnel) :" : "Motif du refus (transmis à l'auteur) :"}
              </label>
              <textarea
                value={editorialNote}
                onChange={(e) => setEditorialNote(e.target.value)}
                rows={4}
                placeholder={
                  decisionType === "accept"
                    ? "Ex: Excellent texte de droit commercial, prévoir une maquette avec 3 parties principales..."
                    : "Ex: Le manuscrit ne correspond pas à la ligne éditoriale actuelle de LAHA..."
                }
                className="w-full p-3 text-xs border border-border rounded-2xl bg-background-secondary text-foreground focus:outline-none focus:border-navy resize-none"
              />
              <p className="text-[11px] text-foreground-muted">
                Une notification système et par email sera transmise automatiquement à l&apos;auteur.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setSelectedManuscript(null)}
                disabled={submittingDecision}
                className="px-4 py-2.5 rounded-xl border border-border text-xs font-bold hover:bg-background-secondary transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmDecision}
                disabled={submittingDecision}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer ${
                  decisionType === "accept"
                    ? "bg-navy hover:bg-navy-dark"
                    : "bg-destructive hover:opacity-90"
                }`}
              >
                {submittingDecision ? "Enregistrement..." : decisionType === "accept" ? "Confirmer l'acceptation" : "Confirmer le refus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
