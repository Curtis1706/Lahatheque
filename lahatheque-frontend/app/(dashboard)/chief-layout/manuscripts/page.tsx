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
  ExternalLink,
  Search,
  Check,
  X,
  Eye,
  Layers,
  Sparkles,
  Filter
} from "lucide-react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/ui/status-badge";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { Modal } from "@/components/ui/modal";
import { 
  getManuscriptsForReview, 
  decideOnManuscript, 
  type ManuscriptForReview 
} from "@/lib/services/layout-artist";

export default function ChiefLayoutManuscriptsPage() {
  const [manuscripts, setManuscripts] = useState<ManuscriptForReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "study_pending" | "catalog_preparation" | "rejected">("all");

  // Modales
  const [selectedManuscript, setSelectedManuscript] = useState<ManuscriptForReview | null>(null);
  const [viewingManuscript, setViewingManuscript] = useState<ManuscriptForReview | null>(null);
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

  const counts = useMemo(() => {
    return {
      all: manuscripts.length,
      study_pending: manuscripts.filter((m) => m.status === "study_pending").length,
      catalog_preparation: manuscripts.filter((m) => m.status === "catalog_preparation" || m.status === "accepted").length,
      rejected: manuscripts.filter((m) => m.status === "rejected").length,
    };
  }, [manuscripts]);

  const filteredByTab = useMemo(() => {
    if (activeTab === "study_pending") return manuscripts.filter((m) => m.status === "study_pending");
    if (activeTab === "catalog_preparation") return manuscripts.filter((m) => m.status === "catalog_preparation" || m.status === "accepted");
    if (activeTab === "rejected") return manuscripts.filter((m) => m.status === "rejected");
    return manuscripts;
  }, [manuscripts, activeTab]);

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
            ? `Le manuscrit « ${selectedManuscript.title} » a été accepté et transmis à l'équipe de maquettage.`
            : `Le manuscrit « ${selectedManuscript.title} » a été refusé.`
        );
        setSelectedManuscript(null);
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

  // Définition des colonnes de la DataTable découpées et aérées
  const columns: DataTableColumn<ManuscriptForReview>[] = [
    {
      key: "title",
      header: "Manuscrit",
      className: "min-w-[200px]",
      cell: (row) => (
        <div className="space-y-1">
          <p className="font-serif font-bold text-navy text-sm leading-snug line-clamp-2">
            {row.title}
          </p>
          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-gold/15 text-navy font-mono uppercase tracking-wider">
            {row.version_type === "brouillon" ? "Brouillon" : "Version finale"}
          </span>
        </div>
      ),
    },
    {
      key: "author_name",
      header: "Auteur",
      className: "min-w-[160px]",
      cell: (row) => (
        <div className="space-y-0.5">
          <p className="font-sans font-semibold text-navy text-xs">
            {row.author_name}
          </p>
          <p className="font-mono text-[11px] text-foreground-muted truncate">
            {row.author_email}
          </p>
        </div>
      ),
    },
    {
      key: "submitted_at",
      header: "Date de dépôt",
      className: "min-w-[120px]",
      cell: (row) => (
        <div className="flex items-center gap-1.5 text-xs text-foreground font-medium">
          <Clock className="w-3.5 h-3.5 text-foreground-muted shrink-0" />
          <span>
            {new Date(row.submitted_at).toLocaleDateString("fr-FR", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>
      ),
    },
    {
      key: "suggested_language",
      header: "Langue",
      className: "min-w-[100px]",
      cell: (row) => (
        <span className="px-2.5 py-1 rounded-lg bg-background-secondary border border-border text-navy font-semibold text-[11px] uppercase tracking-wide">
          {row.suggested_language || "Français"}
        </span>
      ),
    },
    {
      key: "suggested_summary",
      header: "Résumé",
      className: "min-w-[220px] max-w-[280px]",
      cell: (row) => (
        <div className="space-y-1">
          <p className="text-xs text-foreground-muted line-clamp-2 leading-relaxed">
            {row.suggested_summary || "—"}
          </p>
          {row.editorial_note && (
            <div className="flex items-center gap-1 text-[10px] text-gold font-semibold">
              <MessageSquare className="w-3 h-3 text-gold shrink-0" />
              <span>Note éditoriale présente</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: "manuscript_file_url",
      header: "Fichier",
      className: "min-w-[130px]",
      cell: (row) =>
        row.manuscript_file_url ? (
          <a
            href={row.manuscript_file_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-navy/5 hover:bg-navy/10 text-navy text-xs font-semibold transition-colors border border-navy/10"
            title="Consulter le fichier manuscrit"
          >
            <Download className="w-3.5 h-3.5 text-gold shrink-0" />
            <span>Fichier</span>
            <ExternalLink className="w-3 h-3 opacity-60" />
          </a>
        ) : (
          <span className="text-[11px] text-foreground-muted italic">Non joint</span>
        ),
    },
    {
      key: "status",
      header: "Statut",
      className: "min-w-[140px]",
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "actions",
      header: "Actions",
      className: "min-w-[170px] text-right",
      cell: (row) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => setViewingManuscript(row)}
            className="p-1.5 rounded-lg border border-border bg-background hover:bg-background-secondary text-foreground-muted hover:text-navy transition-colors cursor-pointer"
            title="Voir la fiche complète du manuscrit"
          >
            <Eye className="w-4 h-4" />
          </button>

          {row.status === "study_pending" ? (
            <>
              <button
                type="button"
                onClick={() => openDecisionModal(row, "reject")}
                className="px-2.5 py-1.5 rounded-lg border border-border hover:bg-background-secondary text-foreground text-xs font-semibold transition-colors inline-flex items-center gap-1 cursor-pointer"
                title="Refuser ce manuscrit"
              >
                <XCircle className="w-3.5 h-3.5 text-foreground-muted" />
                <span>Refuser</span>
              </button>
              <button
                type="button"
                onClick={() => openDecisionModal(row, "accept")}
                className="px-3 py-1.5 rounded-lg bg-navy hover:bg-navy-dark text-white text-xs font-semibold transition-colors inline-flex items-center gap-1 shadow-xs cursor-pointer"
                title="Accepter ce manuscrit pour la maquette"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-gold" />
                <span>Accepter</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setViewingManuscript(row)}
              className="px-3 py-1.5 rounded-lg bg-background-secondary border border-border text-foreground-muted hover:text-navy text-xs font-medium transition-colors cursor-pointer"
            >
              Détails
            </button>
          )}
        </div>
      ),
    },
  ];

  // Rendu sous forme de carte pour mobile (< lg)
  const renderMobileCard = (row: ManuscriptForReview) => (
    <div className="space-y-3.5">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-0.5 rounded-md bg-gold/15 text-navy font-mono text-[10px] font-bold uppercase tracking-wider">
              {row.version_type === "brouillon" ? "Brouillon" : "Version finale"}
            </span>
            <span className="text-[11px] text-foreground-muted">
              {new Date(row.submitted_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
            </span>
          </div>
          <h3 className="font-serif font-bold text-navy text-sm leading-snug">
            {row.title}
          </h3>
          <p className="text-xs text-foreground-muted">
            Auteur : <strong className="text-navy font-semibold">{row.author_name}</strong> ({row.author_email})
          </p>
        </div>
        <StatusBadge status={row.status} />
      </div>

      {row.suggested_summary && (
        <div className="p-3 rounded-xl bg-background-secondary border border-border text-xs text-foreground/90 leading-relaxed">
          <p className="font-bold text-[10px] text-navy uppercase tracking-wider mb-0.5">Résumé :</p>
          <p className="line-clamp-3 text-xs">{row.suggested_summary}</p>
        </div>
      )}

      {row.editorial_note && (
        <div className="p-2.5 rounded-xl bg-navy/5 border border-navy/15 text-xs text-navy space-y-0.5">
          <p className="font-bold text-[10px] text-navy flex items-center gap-1">
            <MessageSquare className="w-3 h-3 text-gold" />
            Note éditoriale :
          </p>
          <p className="text-foreground-muted text-xs">{row.editorial_note}</p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border">
        {row.manuscript_file_url ? (
          <a
            href={row.manuscript_file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-bold text-navy hover:text-gold transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-gold" />
            <span>Fichier manuscrit</span>
          </a>
        ) : (
          <span className="text-[11px] text-foreground-muted italic">Aucun fichier</span>
        )}

        <div className="flex items-center gap-1.5 ml-auto">
          <button
            type="button"
            onClick={() => setViewingManuscript(row)}
            className="px-2.5 py-1.5 rounded-lg border border-border bg-background text-foreground-muted hover:text-navy text-xs font-semibold"
          >
            Détails
          </button>
          {row.status === "study_pending" && (
            <>
              <button
                type="button"
                onClick={() => openDecisionModal(row, "reject")}
                className="px-2.5 py-1.5 rounded-lg border border-border text-foreground text-xs font-semibold"
              >
                Refuser
              </button>
              <button
                type="button"
                onClick={() => openDecisionModal(row, "accept")}
                className="px-3 py-1.5 rounded-lg bg-navy text-white text-xs font-semibold shadow-xs"
              >
                Accepter
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 sm:space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted font-sans">
        <Link href="/chief-layout" className="hover:text-navy transition-colors">Chef Maquettiste</Link>
        <span>/</span>
        <span className="text-navy font-semibold">Étude des Manuscrits</span>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link href="/chief-layout" className="inline-flex items-center gap-1.5 text-xs text-navy font-bold hover:underline mb-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Espace Chef Maquettiste
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider">
            <BookOpenCheck className="w-4 h-4 text-gold" />
            Comité Éditorial &amp; Mise en Page
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            File d&apos;Étude des Manuscrits Auteurs
          </h1>
          <p className="text-xs text-foreground-muted">
            Examinez les propositions soumises par les auteurs, émettez une note éditoriale et transférez les ouvrages retenus à l&apos;équipe de maquettage.
          </p>
        </div>
      </div>

      {/* Onglets Rapides de Filtrage */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === "all"
              ? "bg-navy text-white shadow-xs"
              : "bg-background-secondary text-foreground-muted hover:text-navy border border-border"
          }`}
        >
          Tous les manuscrits ({counts.all})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("study_pending")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
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
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === "catalog_preparation"
              ? "bg-navy text-white shadow-xs"
              : "bg-background-secondary text-foreground-muted hover:text-navy border border-border"
          }`}
        >
          Acceptés / Maquette ({counts.catalog_preparation})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("rejected")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === "rejected"
              ? "bg-navy text-white shadow-xs"
              : "bg-background-secondary text-foreground-muted hover:text-navy border border-border"
          }`}
        >
          Refusés ({counts.rejected})
        </button>
      </div>

      {/* DataTable Complète avec Pagination & Recherche */}
      <DataTable
        data={filteredByTab}
        columns={columns}
        rowKey="id"
        loading={loading}
        pageSize={10}
        pageSizeOptions={[10, 20, 50]}
        searchPlaceholder="Rechercher un manuscrit, auteur, mot-clé..."
        filterKey="status"
        filterPlaceholder="Tous les statuts"
        filterOptions={[
          { value: "study_pending", label: "À l'étude" },
          { value: "catalog_preparation", label: "En préparation maquette" },
          { value: "accepted", label: "Accepté" },
          { value: "rejected", label: "Refusé" },
        ]}
        mobileCard={renderMobileCard}
        emptyMessage="Aucun manuscrit trouvé dans cette catégorie."
        onRowClick={(row) => setViewingManuscript(row)}
      />

      {/* Modale de Consultation Détaillée du Manuscrit */}
      {viewingManuscript && (
        <Modal
          open={Boolean(viewingManuscript)}
          onClose={() => setViewingManuscript(null)}
          title="Fiche du Manuscrit Auteur"
          description="Détails complets de la soumission et instructions éditoriales"
          maxWidth={640}
        >
          <div className="space-y-4 p-1">
            <div className="p-4 rounded-2xl bg-background-secondary border border-border space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-md bg-gold/15 text-navy font-mono text-[10px] font-bold uppercase tracking-wider">
                  {viewingManuscript.version_type === "brouillon" ? "Brouillon" : "Version finale"}
                </span>
                <StatusBadge status={viewingManuscript.status} />
              </div>
              <h3 className="font-serif font-bold text-navy text-lg leading-snug">
                {viewingManuscript.title}
              </h3>
              <p className="text-xs text-foreground">
                Auteur : <strong className="text-navy">{viewingManuscript.author_name}</strong> ({viewingManuscript.author_email})
              </p>
              <div className="flex items-center gap-4 text-xs text-foreground-muted pt-1">
                <span>Langue : <strong className="text-navy uppercase">{viewingManuscript.suggested_language || "FR"}</strong></span>
                <span>Déposé le : {new Date(viewingManuscript.submitted_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="font-bold text-navy uppercase text-[10px] tracking-wider block">
                Résumé &amp; Présentation par l&apos;Auteur :
              </span>
              <div className="text-foreground-muted leading-relaxed bg-background p-3.5 rounded-xl border border-border max-h-48 overflow-y-auto whitespace-pre-line text-xs">
                {viewingManuscript.suggested_summary || "Aucun résumé fourni."}
              </div>
            </div>

            {viewingManuscript.editorial_note && (
              <div className="p-3.5 rounded-xl bg-navy/5 border border-navy/20 space-y-1 text-xs">
                <span className="font-bold text-navy uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-gold" />
                  Note éditoriale enregistrée :
                </span>
                <p className="text-foreground italic bg-background p-2.5 rounded-lg border border-border">
                  « {viewingManuscript.editorial_note} »
                </p>
              </div>
            )}

            {viewingManuscript.manuscript_file_url && (
              <div className="pt-2">
                <a
                  href={viewingManuscript.manuscript_file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-navy text-white hover:bg-navy-hover transition-colors font-sans text-xs font-bold flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4 text-gold" />
                  Télécharger le fichier manuscrit
                </a>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setViewingManuscript(null)}
                className="px-4 py-2 rounded-xl border border-border text-xs font-bold hover:bg-background-secondary transition-colors"
              >
                Fermer
              </button>
              {viewingManuscript.status === "study_pending" && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      const m = viewingManuscript;
                      setViewingManuscript(null);
                      openDecisionModal(m, "reject");
                    }}
                    className="px-3.5 py-2 rounded-xl border border-border hover:bg-background-secondary text-foreground text-xs font-bold transition-colors"
                  >
                    Refuser
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const m = viewingManuscript;
                      setViewingManuscript(null);
                      openDecisionModal(m, "accept");
                    }}
                    className="px-4 py-2 rounded-xl bg-navy hover:bg-navy-dark text-white text-xs font-bold transition-colors"
                  >
                    Accepter pour Maquette
                  </button>
                </>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Modale de décision éditoriale */}
      {selectedManuscript && (
        <Modal
          open={Boolean(selectedManuscript)}
          onClose={() => !submittingDecision && setSelectedManuscript(null)}
          title={decisionType === "accept" ? "Accepter le manuscrit" : "Refuser le manuscrit"}
          description={decisionType === "accept" ? "Transmission du manuscrit à l'équipe de mise en page" : "Motif de refus transmis à l'auteur"}
          maxWidth={520}
        >
          <div className="space-y-4 p-1">
            <div className="p-3.5 rounded-xl bg-background-secondary border border-border space-y-1">
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                decisionType === "accept" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
              }`}>
                {decisionType === "accept" ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                {decisionType === "accept" ? "Validation Éditoriale" : "Rejet Éditorial"}
              </span>
              <h4 className="font-serif font-bold text-navy text-sm leading-snug">
                « {selectedManuscript.title} »
              </h4>
              <p className="text-xs text-foreground-muted">
                Auteur : {selectedManuscript.author_name} ({selectedManuscript.author_email})
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-navy uppercase tracking-wider block">
                {decisionType === "accept" ? "Note éditoriale / Instructions pour la maquette (optionnel) :" : "Motif du refus (obligatoire, transmis à l'auteur) :"}
              </label>
              <textarea
                value={editorialNote}
                onChange={(e) => setEditorialNote(e.target.value)}
                rows={4}
                placeholder={
                  decisionType === "accept"
                    ? "Ex: Manuscrit validé. Prévoir une maquette avec sommaire dynamique et 3 niveaux de titres..."
                    : "Ex: Le manuscrit ne correspond pas à la ligne éditoriale actuelle de la collection..."
                }
                className="w-full p-3 text-xs border border-border rounded-xl bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-navy resize-none"
              />
              <p className="text-[10px] text-foreground-muted">
                Une notification officielle sera automatiquement transmise à l&apos;auteur.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setSelectedManuscript(null)}
                disabled={submittingDecision}
                className="px-4 py-2 rounded-xl border border-border text-xs font-bold hover:bg-background-secondary transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmDecision}
                disabled={submittingDecision || (decisionType === "reject" && !editorialNote.trim())}
                className={`px-5 py-2 rounded-xl text-xs font-bold text-white transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ${
                  decisionType === "accept"
                    ? "bg-navy hover:bg-navy-dark"
                    : "bg-destructive hover:opacity-90"
                }`}
              >
                {submittingDecision ? "Enregistrement..." : decisionType === "accept" ? "Confirmer l'acceptation" : "Confirmer le refus"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
