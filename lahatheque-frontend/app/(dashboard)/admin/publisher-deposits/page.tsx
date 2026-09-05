"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileCheck2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  BookOpen,
  Send,
  Download,
  FileText,
  Eye,
  ShieldCheck,
  Lock,
  Copy,
  Printer,
} from "lucide-react";
import { BookCover3D } from "@/components/ui/book-cover-3d";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Modal } from "@/components/ui/modal";
import { InlineLoader } from "@/components/ui/page-loader";
import {
  getPublisherDepositsForReview,
  submitEditorialDecision,
  submitRightsDecision,
  publishPublisherDeposit,
  type PublisherDepositForReview,
} from "@/lib/services/publisher";
import {
  getDepositProtectionConfig,
  updateDepositProtectionConfig,
  type DepositProtectionConfig,
} from "@/lib/services/admin";
import { toast } from "sonner";

function StatusChip({ value }: { value: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending: { label: "En attente", cls: "bg-warning/10 text-warning border-warning/20" },
    approved: { label: "Validé", cls: "bg-success/10 text-success border-success/20" },
    revision_requested: { label: "Corrections demandées", cls: "bg-error/10 text-error border-error/20" },
  };
  const s = map[value] ?? { label: value, cls: "bg-background border-border text-foreground-muted" };
  return (
    <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full border font-semibold ${s.cls}`}>
      {s.label}
    </span>
  );
}

export default function AdminPublisherDepositsPage() {
  const [deposits, setDeposits] = useState<PublisherDepositForReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");

  const [selected, setSelected] = useState<PublisherDepositForReview | null>(null);
  const [editDecision, setEditDecision] = useState<"approved" | "revision_requested">("approved");
  const [editComment, setEditComment] = useState("");
  const [rightsDecision, setRightsDecision] = useState<"approved" | "revision_requested">("approved");
  const [rightsComment, setRightsComment] = useState("");
  const [activeModal, setActiveModal] = useState<"editorial" | "rights" | "publish" | "details" | "protection" | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // État de la modale de sécurisation & protection DRM
  const [protectionDeposit, setProtectionDeposit] = useState<PublisherDepositForReview | null>(null);
  const [protectionConfig, setProtectionConfig] = useState<DepositProtectionConfig>({
    watermark_enabled: true,
    watermark_position: "bottom-right",
    watermark_opacity: 30,
    lcp_drm_enabled: true,
    disable_copy_paste: true,
    disable_print: false,
  });
  const [loadingProtection, setLoadingProtection] = useState(false);
  const [submittingProtection, setSubmittingProtection] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const data = await getPublisherDepositsForReview();
      setDeposits(data);
    } catch {
      toast.error("Impossible de charger les dépôts éditeurs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = deposits.filter((d) => {
    if (filterStatus === "pending") return d.editorial_status === "pending" || d.rights_status === "pending";
    if (filterStatus === "ready") return d.editorial_status === "approved" && d.rights_status === "approved" && d.status !== "published";
    if (filterStatus === "published") return d.status === "published";
    return true;
  });

  const pendingCount = deposits.filter((d) => d.editorial_status === "pending" || d.rights_status === "pending").length;
  const readyCount = deposits.filter((d) => d.editorial_status === "approved" && d.rights_status === "approved" && d.status !== "published").length;
  const publishedCount = deposits.filter((d) => d.status === "published").length;

  const openModal = (dep: PublisherDepositForReview, modal: "editorial" | "rights" | "publish" | "details" | "protection") => {
    setSelected(dep);
    setEditComment(dep.editorial_comment || "");
    setRightsComment(dep.rights_comment || "");
    setEditDecision("approved");
    setRightsDecision("approved");
    setActiveModal(modal);
  };

  const closeModal = () => {
    setSelected(null);
    setProtectionDeposit(null);
    setActiveModal(null);
  };

  const openProtectionModal = async (deposit: PublisherDepositForReview) => {
    setSelected(deposit);
    setProtectionDeposit(deposit);
    setActiveModal("protection");
    setLoadingProtection(true);
    try {
      const cfg = await getDepositProtectionConfig(deposit.id);
      if (cfg) {
        setProtectionConfig({
          watermark_enabled: cfg.watermark_enabled ?? true,
          watermark_position: cfg.watermark_position || "bottom-right",
          watermark_opacity: typeof cfg.watermark_opacity === "number" ? cfg.watermark_opacity : 30,
          lcp_drm_enabled: cfg.lcp_drm_enabled ?? true,
          disable_copy_paste: cfg.disable_copy_paste ?? true,
          disable_print: cfg.disable_print ?? false,
        });
      }
    } catch {
      toast.error("Impossible de récupérer la configuration de protection.");
    } finally {
      setLoadingProtection(false);
    }
  };

  const handleSaveProtection = async () => {
    if (!protectionDeposit) return;
    setSubmittingProtection(true);
    try {
      const ok = await updateDepositProtectionConfig(protectionDeposit.id, protectionConfig);
      if (ok) {
        toast.success("Configuration de sécurité mise à jour avec succès.");
        closeModal();
      } else {
        toast.error("Erreur lors de la mise à jour de la sécurité.");
      }
    } catch {
      toast.error("Erreur de communication avec le serveur.");
    } finally {
      setSubmittingProtection(false);
    }
  };

  const handleEditorial = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      const res = await submitEditorialDecision(selected.id, editDecision, editComment);
      if (res.success) {
        toast.success(`Conformité éditoriale : ${editDecision === "approved" ? "validée" : "corrections demandées"}.`);
        closeModal();
        await load();
      } else {
        toast.error(res.error || "Erreur lors de la décision éditoriale.");
      }
    } catch {
      toast.error("Erreur de communication.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRights = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      const res = await submitRightsDecision(selected.id, rightsDecision, rightsComment);
      if (res.success) {
        toast.success(`Vérification des droits : ${rightsDecision === "approved" ? "validée" : "corrections demandées"}.`);
        closeModal();
        await load();
      } else {
        toast.error(res.error || "Erreur lors de la décision juridique.");
      }
    } catch {
      toast.error("Erreur de communication.");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePublish = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      const res = await publishPublisherDeposit(selected.id);
      if (res.success) {
        toast.success(`« ${selected.title} » publié sur la vitrine LAHAThèque.`);
        closeModal();
        await load();
      } else {
        toast.error(res.error || "Publication impossible.");
      }
    } catch {
      toast.error("Erreur de communication.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderMobileCard = (row: PublisherDepositForReview) => (
    <div className="space-y-3 bg-background p-4 rounded-2xl border border-border">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <BookCover3D
            title={row.title}
            authors={row.publisher_name}
            discipline={row.discipline}
            coverUrl={row.cover_url}
            size="xs"
            interactive={false}
          />
          <div className="min-w-0">
            <h4 className="font-serif font-bold text-navy text-sm leading-snug">
              {row.title}
            </h4>
            <p className="text-xs text-gold font-medium mt-0.5">{row.publisher_name}</p>
            <span className="text-[10px] text-foreground-muted font-mono">{row.isbn_digital}</span>
          </div>
        </div>
        <StatusBadge status={row.status} />
      </div>

      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60 text-xs">
        <div className="space-y-0.5">
          <span className="text-[10px] font-bold text-foreground-muted uppercase">Éditorial</span>
          <div><StatusChip value={row.editorial_status} /></div>
        </div>
        <div className="space-y-0.5">
          <span className="text-[10px] font-bold text-foreground-muted uppercase">Droits</span>
          <div><StatusChip value={row.rights_status} /></div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-border/60 gap-2 flex-wrap">
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-navy/10 text-navy font-semibold">
          {row.discipline}
        </span>

        <div className="flex items-center gap-1.5 flex-wrap">
          {row.file_url && (
            <a
              href={row.file_url}
              target="_blank"
              rel="noopener noreferrer"
              download
              onClick={(e) => e.stopPropagation()}
              className="p-2 rounded-xl bg-background border border-border text-foreground hover:border-gold hover:text-navy transition-colors cursor-pointer"
              title="Télécharger le PDF"
              aria-label="Télécharger le PDF"
            >
              <Download className="w-3.5 h-3.5 text-gold" />
            </a>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openModal(row, "details");
            }}
            className="px-2.5 py-1.5 rounded-xl bg-background border border-border text-navy text-xs font-semibold hover:border-gold cursor-pointer transition-colors"
          >
            Détails
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openModal(row, "editorial");
            }}
            className="px-2.5 py-1.5 rounded-xl bg-background border border-border text-foreground text-xs font-semibold hover:border-gold cursor-pointer transition-colors"
          >
            Éditorial
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openModal(row, "rights");
            }}
            className="px-2.5 py-1.5 rounded-xl bg-background border border-border text-foreground text-xs font-semibold hover:border-gold cursor-pointer transition-colors"
          >
            Droits
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openProtectionModal(row);
            }}
            className="px-2.5 py-1.5 rounded-xl bg-background border border-border text-navy text-xs font-semibold hover:border-gold cursor-pointer transition-colors"
          >
            Sécuriser
          </button>
          {row.editorial_status === "approved" && row.rights_status === "approved" && row.status !== "published" && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openModal(row, "publish");
              }}
              className="px-3 py-1.5 rounded-xl bg-success text-white text-xs font-semibold hover:bg-success/90 cursor-pointer shadow-xs"
            >
              Publier
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const columns: DataTableColumn<PublisherDepositForReview>[] = [
    {
      key: "title",
      header: "Ouvrage & Éditeur",
      className: "min-w-[280px]",
      cell: (row) => (
        <div className="flex items-center gap-3 py-0.5">
          <BookCover3D
            title={row.title}
            authors={row.publisher_name}
            discipline={row.discipline}
            coverUrl={row.cover_url}
            size="xs"
            interactive={false}
          />
          <div className="space-y-0.5 min-w-0">
            <p className="font-serif font-bold text-xs sm:text-sm text-navy line-clamp-1">{row.title}</p>
            <p className="text-[11px] text-gold font-medium">{row.publisher_name}</p>
            <span className="text-[10px] text-foreground-muted font-mono">{row.isbn_digital}</span>
          </div>
        </div>
      ),
    },
    {
      key: "discipline",
      header: "Discipline",
      className: "min-w-[150px]",
      cell: (row) => (
        <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-navy/10 text-navy font-semibold">
          {row.discipline}
        </span>
      ),
    },
    {
      key: "editorial_status",
      header: "Conformité éditoriale",
      className: "min-w-[150px]",
      cell: (row) => <StatusChip value={row.editorial_status} />,
    },
    {
      key: "rights_status",
      header: "Vérification droits",
      className: "min-w-[150px]",
      cell: (row) => <StatusChip value={row.rights_status} />,
    },
    {
      key: "status",
      header: "Statut global",
      className: "min-w-[130px]",
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "actions" as keyof PublisherDepositForReview,
      header: "Actions",
      className: "text-right min-w-[280px]",
      cell: (row) => (
        <div className="flex items-center justify-end gap-1.5 flex-nowrap">
          {/* Bouton Téléchargement PDF */}
          {row.file_url ? (
            <a
              href={row.file_url}
              target="_blank"
              rel="noopener noreferrer"
              download
              onClick={(e) => e.stopPropagation()}
              className="p-2 rounded-xl bg-background border border-border hover:border-gold hover:text-navy text-foreground transition-colors inline-flex items-center justify-center shrink-0 cursor-pointer"
              title="Télécharger le fichier PDF soumis"
              aria-label="Télécharger le PDF"
            >
              <Download className="w-4 h-4 text-gold" />
            </a>
          ) : (
            <span
              className="p-2 rounded-xl bg-background-secondary/60 border border-border/40 text-foreground-muted/40 inline-flex items-center justify-center shrink-0 cursor-not-allowed"
              title="Aucun fichier PDF joint"
              aria-label="Aucun PDF joint"
            >
              <Download className="w-4 h-4" />
            </span>
          )}

          {/* Bouton Consulter / Dossier Complet */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openModal(row, "details");
            }}
            className="p-2 rounded-xl bg-background border border-border hover:border-gold hover:text-navy text-foreground text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shrink-0 shadow-2xs"
            title="Consulter le dossier complet"
          >
            <Eye className="w-4 h-4 text-navy" />
          </button>

          {/* Bouton Examen Éditorial */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openModal(row, "editorial");
            }}
            className="px-2.5 py-1.5 rounded-xl bg-background border border-border hover:border-gold hover:text-navy text-foreground text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-2xs"
            title="Décision éditoriale (Chef Maquettiste)"
          >
            <FileCheck2 className="w-3.5 h-3.5 text-gold shrink-0" />
            <span>Éditorial</span>
          </button>

          {/* Bouton Examen Droits */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openModal(row, "rights");
            }}
            className="px-2.5 py-1.5 rounded-xl bg-background border border-border hover:border-gold hover:text-navy text-foreground text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-2xs"
            title="Décision juridique (Juriste)"
          >
            <FileCheck2 className="w-3.5 h-3.5 text-gold shrink-0" />
            <span>Droits</span>
          </button>

          {/* Bouton Sécuriser */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openProtectionModal(row);
            }}
            className="px-2.5 py-1.5 rounded-xl bg-background border border-border hover:border-gold hover:text-navy text-navy text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow-2xs"
            title="Sécuriser (Filigrane & DRM LCP)"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-gold shrink-0" />
            <span>Sécuriser</span>
          </button>

          {/* Bouton Publier (si doublement validé) */}
          {row.editorial_status === "approved" && row.rights_status === "approved" && row.status !== "published" && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openModal(row, "publish");
              }}
              className="px-3 py-1.5 rounded-xl bg-success text-white text-xs font-semibold flex items-center gap-1 hover:bg-success/90 transition-colors shadow-xs cursor-pointer shrink-0"
              title="Publier l'ouvrage sur la vitrine"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Publier</span>
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2 text-xs text-foreground-muted mb-1">
            <Link href="/admin" className="hover:text-navy transition-colors">Administration</Link>
            <span>/</span>
            <span className="text-navy font-semibold">Dépôts Éditeurs Tiers</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-navy flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-gold" />
            File d'examen — Éditeurs Tiers
          </h1>
          <p className="text-xs sm:text-sm text-foreground-muted mt-0.5">
            Deux volets distincts par dépôt : conformité éditoriale et vérification des droits (Juriste). La publication n&apos;est possible que lorsque les deux sont validés.
          </p>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          type="button"
          onClick={() => setFilterStatus(filterStatus === "pending" ? "all" : "pending")}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            filterStatus === "pending"
              ? "bg-warning/10 border-warning shadow-xs ring-2 ring-warning/20"
              : "bg-background-secondary border-border hover:border-navy/30"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground-muted">Volets en attente</span>
            <Clock className="w-4 h-4 text-warning" />
          </div>
          <p className="text-2xl font-bold font-serif text-navy mt-2">{pendingCount}</p>
          <p className="text-[11px] text-foreground-muted mt-1">Dépôts avec au moins un volet non validé</p>
        </button>

        <button
          type="button"
          onClick={() => setFilterStatus(filterStatus === "ready" ? "all" : "ready")}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            filterStatus === "ready"
              ? "bg-success/10 border-success shadow-xs ring-2 ring-success/20"
              : "bg-background-secondary border-border hover:border-navy/30"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground-muted">Prêts à publier</span>
            <CheckCircle2 className="w-4 h-4 text-success" />
          </div>
          <p className="text-2xl font-bold font-serif text-navy mt-2">{readyCount}</p>
          <p className="text-[11px] text-foreground-muted mt-1">Éditorial ET droits validés, en attente de publication</p>
        </button>

        <button
          type="button"
          onClick={() => setFilterStatus(filterStatus === "published" ? "all" : "published")}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            filterStatus === "published"
              ? "bg-navy/10 border-navy shadow-xs ring-2 ring-navy/20"
              : "bg-background-secondary border-border hover:border-navy/30"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground-muted">Publiés</span>
            <BookOpen className="w-4 h-4 text-navy" />
          </div>
          <p className="text-2xl font-bold font-serif text-navy mt-2">{publishedCount}</p>
          <p className="text-[11px] text-foreground-muted mt-1">Ouvrages en ligne sur la vitrine</p>
        </button>
      </div>

      {/* Tableau avec DataTable */}
      <DataTable
        data={filtered}
        columns={columns}
        rowKey="id"
        loading={loading}
        searchable={true}
        searchPlaceholder="Rechercher par titre, éditeur ou ISBN..."
        mobileCard={renderMobileCard}
        onRowClick={(row) => openModal(row, "details")}
        pageSize={10}
        emptyMessage="Aucun dépôt éditeur tiers à examiner."
      />

      {/* Modale — Décision éditoriale */}
      <Modal open={activeModal === "editorial"} onClose={closeModal} title="Conformité Éditoriale">
        <div className="p-6 space-y-5">
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-gold/10 border border-gold/20">
            <FileCheck2 className="w-5 h-5 text-gold shrink-0" />
            <div>
              <p className="text-xs font-bold text-navy">Volet éditorial (Mise en page &amp; Structure)</p>
              <p className="text-[11px] text-foreground">{selected?.title}</p>
              <p className="text-[10px] text-foreground-muted">{selected?.publisher_name}</p>
            </div>
          </div>

          {/* Manuscrit PDF & Téléchargement */}
          <div className="p-3.5 rounded-2xl bg-background border border-border space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-gold" />
                <span className="text-xs font-bold text-navy">Manuscrit & Épreuve PDF</span>
              </div>
              {selected?.file_url ? (
                <a
                  href={selected.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="px-3 py-1.5 rounded-xl bg-gold/15 text-navy hover:bg-gold/25 font-bold text-xs border border-gold/30 transition-all inline-flex items-center gap-1.5 shadow-xs"
                >
                  <Download className="w-3.5 h-3.5 text-gold" />
                  <span>Télécharger le PDF</span>
                </a>
              ) : (
                <span className="text-[11px] text-foreground-muted font-medium italic">
                  Aucun fichier joint
                </span>
              )}
            </div>
            {selected?.file_url ? (
              <p className="text-[11px] text-foreground-muted">
                Téléchargez le document pour examiner la mise en page, la typographie et la structure éditoriale.
              </p>
            ) : (
              <p className="text-[11px] text-error/80">
                L'éditeur n'a pas joint de fichier PDF lors du dépôt initial.
              </p>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground block mb-1.5">Décision</label>
            <div className="flex gap-2">
              {(["approved", "revision_requested"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setEditDecision(v)}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    editDecision === v
                      ? v === "approved" ? "bg-success text-white border-success" : "bg-error text-white border-error"
                      : "bg-background border-border text-foreground"
                  }`}
                >
                  {v === "approved" ? "Valider" : "Demander corrections"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-foreground block mb-1.5">Commentaire éditorial</label>
            <textarea
              rows={3}
              value={editComment}
              onChange={(e) => setEditComment(e.target.value)}
              placeholder="Observations sur la mise en page, structure, normes éditoriales..."
              className="w-full p-2.5 text-xs rounded-xl bg-background border border-border focus:border-gold focus:outline-none resize-none"
            />
          </div>
          <div className="pt-3 border-t border-border flex justify-end gap-2">
            <button type="button" onClick={closeModal} className="px-4 py-2 rounded-xl text-xs font-semibold text-foreground-muted hover:bg-background-secondary">
              Annuler
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={handleEditorial}
              className="px-5 py-2 rounded-xl bg-navy text-white text-xs font-semibold hover:bg-navy-hover transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {submitting ? <><InlineLoader size={14} /><span>Enregistrement...</span></> : <><CheckCircle2 className="w-3.5 h-3.5" /><span>Enregistrer</span></>}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modale — Décision droits */}
      <Modal open={activeModal === "rights"} onClose={closeModal} title="Vérification des Droits">
        <div className="p-6 space-y-5">
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-gold/10 border border-gold/20">
            <FileCheck2 className="w-5 h-5 text-gold shrink-0" />
            <div>
              <p className="text-xs font-bold text-navy">Volet juridique — Juriste</p>
              <p className="text-[11px] text-foreground">{selected?.title}</p>
              <p className="text-[10px] text-foreground-muted">{selected?.publisher_name}</p>
            </div>
          </div>

          {/* Manuscrit PDF & Téléchargement */}
          <div className="p-3.5 rounded-2xl bg-background border border-border space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-gold" />
                <span className="text-xs font-bold text-navy">Manuscrit & Épreuve PDF</span>
              </div>
              {selected?.file_url ? (
                <a
                  href={selected.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="px-3 py-1.5 rounded-xl bg-gold/15 text-navy hover:bg-gold/25 font-bold text-xs border border-gold/30 transition-all inline-flex items-center gap-1.5 shadow-xs"
                >
                  <Download className="w-3.5 h-3.5 text-gold" />
                  <span>Télécharger le PDF</span>
                </a>
              ) : (
                <span className="text-[11px] text-foreground-muted font-medium italic">
                  Aucun fichier joint
                </span>
              )}
            </div>
            {selected?.file_url ? (
              <p className="text-[11px] text-foreground-muted">
                Vérifiez les mentions légales, la page de garde et les cessions de droits sur le manuscrit.
              </p>
            ) : (
              <p className="text-[11px] text-error/80">
                L'éditeur n'a pas joint de fichier PDF lors du dépôt initial.
              </p>
            )}
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground block mb-1.5">Décision</label>
            <div className="flex gap-2">
              {(["approved", "revision_requested"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setRightsDecision(v)}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    rightsDecision === v
                      ? v === "approved" ? "bg-success text-white border-success" : "bg-error text-white border-error"
                      : "bg-background border-border text-foreground"
                  }`}
                >
                  {v === "approved" ? "Valider" : "Demander corrections"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-foreground block mb-1.5">Commentaire juridique</label>
            <textarea
              rows={3}
              value={rightsComment}
              onChange={(e) => setRightsComment(e.target.value)}
              placeholder="Vérification contrat de cession, pourcentages de droits d'auteur, conformité légale..."
              className="w-full p-2.5 text-xs rounded-xl bg-background border border-border focus:border-gold focus:outline-none resize-none"
            />
          </div>
          <div className="pt-3 border-t border-border flex justify-end gap-2">
            <button type="button" onClick={closeModal} className="px-4 py-2 rounded-xl text-xs font-semibold text-foreground-muted hover:bg-background-secondary">
              Annuler
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={handleRights}
              className="px-5 py-2 rounded-xl bg-navy text-white text-xs font-semibold hover:bg-navy-hover transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {submitting ? <><InlineLoader size={14} /><span>Enregistrement...</span></> : <><CheckCircle2 className="w-3.5 h-3.5" /><span>Enregistrer</span></>}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modale — Publication finale */}
      <Modal open={activeModal === "publish"} onClose={closeModal} title="Publication sur la Vitrine">
        <div className="p-6 space-y-5">
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-success/10 border border-success/20">
            <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
            <div>
              <p className="text-xs font-bold text-success">Les deux volets sont validés</p>
              <p className="text-[11px] text-foreground">
                Conformité éditoriale : Validé — Vérification des droits : Validé
              </p>
            </div>
          </div>
          <div className="space-y-1 text-xs">
            <p className="font-semibold text-foreground">Ouvrage : <span className="font-serif text-navy">{selected?.title}</span></p>
            <p className="text-foreground-muted">Éditeur : {selected?.publisher_name} — ISBN : {selected?.isbn_digital}</p>
          </div>

          {/* Manuscrit PDF & Téléchargement */}
          {selected?.file_url && (
            <div className="p-3 rounded-xl bg-background border border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-gold" />
                <span className="text-xs font-bold text-navy">Manuscrit finalisé</span>
              </div>
              <a
                href={selected.file_url}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="px-3 py-1.5 rounded-xl bg-gold/15 text-navy hover:bg-gold/25 font-bold text-xs border border-gold/30 transition-all inline-flex items-center gap-1.5 shadow-xs"
              >
                <Download className="w-3.5 h-3.5 text-gold" />
                <span>Télécharger le PDF</span>
              </a>
            </div>
          )}

          <div className="p-3 rounded-xl bg-warning/10 border border-warning/20 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
            <p className="text-[11px] text-foreground">
              Cette action crée une entrée vendable dans le catalogue public et notifie l'éditeur. Elle est irréversible via cet écran.
            </p>
          </div>
          <div className="pt-3 border-t border-border flex justify-end gap-2">
            <button type="button" onClick={closeModal} className="px-4 py-2 rounded-xl text-xs font-semibold text-foreground-muted hover:bg-background-secondary">
              Annuler
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={handlePublish}
              className="px-5 py-2 rounded-xl bg-success text-white text-xs font-semibold hover:bg-success/90 transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {submitting ? <><InlineLoader size={14} /><span>Publication...</span></> : <><Send className="w-3.5 h-3.5" /><span>Confirmer la publication</span></>}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modale — Dossier complet / Détails */}
      <Modal open={activeModal === "details"} onClose={closeModal} title="Dossier Dépôt Éditeur Tiers">
        {selected && (
          <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
            {/* Header Ouvrage */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-2xl bg-navy/5 border border-navy/10">
              <BookCover3D
                title={selected.title}
                authors={selected.publisher_name}
                discipline={selected.discipline}
                coverUrl={selected.cover_url}
                size="sm"
                interactive={false}
              />
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-navy/10 text-navy font-semibold">
                    {selected.discipline}
                  </span>
                  <StatusBadge status={selected.status} />
                </div>
                <h3 className="font-serif font-bold text-base sm:text-lg text-navy leading-snug">
                  {selected.title}
                </h3>
                <p className="text-xs text-gold font-semibold">
                  Maison d&apos;édition : {selected.publisher_name}
                </p>
                <div className="flex items-center gap-4 text-xs text-foreground-muted font-mono pt-1">
                  <span>ISBN : {selected.isbn_digital}</span>
                  {selected.price > 0 && (
                    <span className="font-bold text-navy">
                      {selected.price.toLocaleString("fr-FR")} XOF
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Téléchargement Manuscrit */}
            <div className="p-4 rounded-2xl bg-background border border-border flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2.5 rounded-xl bg-gold/15 text-gold shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-xs text-navy">Fichier Manuscrit &amp; Épreuve</p>
                  <p className="text-[11px] text-foreground-muted">Format PDF complet soumis par l&apos;éditeur</p>
                </div>
              </div>
              {selected.file_url ? (
                <a
                  href={selected.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="px-3.5 py-2 rounded-xl bg-gold text-navy hover:bg-gold-light font-bold text-xs transition-colors inline-flex items-center gap-1.5 shadow-xs shrink-0"
                >
                  <Download className="w-4 h-4" />
                  <span>Télécharger</span>
                </a>
              ) : (
                <span className="text-xs text-foreground-muted italic">Aucun PDF joint</span>
              )}
            </div>

            {/* Suivi des deux volets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Volet Éditorial */}
              <div className="p-4 rounded-2xl bg-background-secondary border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-navy flex items-center gap-1.5">
                    <FileCheck2 className="w-4 h-4 text-gold" />
                    Volet Éditorial
                  </span>
                  <StatusChip value={selected.editorial_status} />
                </div>
                <p className="text-xs text-foreground-muted">
                  {selected.editorial_comment || "Aucun commentaire éditorial renseigné."}
                </p>
                <button
                  type="button"
                  onClick={() => openModal(selected, "editorial")}
                  className="w-full py-2 rounded-xl bg-background border border-border hover:border-gold text-xs font-semibold text-navy transition-colors text-center cursor-pointer"
                >
                  Modifier la décision éditoriale
                </button>
              </div>

              {/* Volet Droits */}
              <div className="p-4 rounded-2xl bg-background-secondary border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-navy flex items-center gap-1.5">
                    <FileCheck2 className="w-4 h-4 text-gold" />
                    Volet Juridique (Droits)
                  </span>
                  <StatusChip value={selected.rights_status} />
                </div>
                <p className="text-xs text-foreground-muted">
                  {selected.rights_comment || "Aucune observation juridique renseignée."}
                </p>
                <button
                  type="button"
                  onClick={() => openModal(selected, "rights")}
                  className="w-full py-2 rounded-xl bg-background border border-border hover:border-gold text-xs font-semibold text-navy transition-colors text-center cursor-pointer"
                >
                  Modifier la décision droits
                </button>
              </div>
            </div>

            {/* Footer Modal Actions */}
            <div className="pt-4 border-t border-border flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-foreground-muted hover:bg-background-secondary"
              >
                Fermer
              </button>

              {selected.editorial_status === "approved" &&
                selected.rights_status === "approved" &&
                selected.status !== "published" && (
                  <button
                    type="button"
                    onClick={() => openModal(selected, "publish")}
                    className="px-4 py-2 rounded-xl bg-success text-white text-xs font-semibold hover:bg-success/90 transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Publier sur la vitrine</span>
                  </button>
                )}
            </div>
          </div>
        )}
      </Modal>

      {/* Modale — Sécurisation & Protection DRM */}
      <Modal
        open={activeModal === "protection"}
        onClose={closeModal}
        maxWidth={580}
        maxHeight="min(90vh, 760px)"
        title="Sécurisation & Protection DRM"
      >
        <div className="space-y-4 text-xs">
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-gold/10 border border-gold/20">
            <ShieldCheck className="w-5 h-5 text-gold shrink-0" />
            <div>
              <p className="text-xs font-bold text-navy">
                Paramètres de protection anti-piratage &amp; DRM
              </p>
              <p className="text-[11px] text-foreground font-semibold">
                {protectionDeposit?.title}
              </p>
              <p className="text-[10px] text-foreground-muted">
                Éditeur : {protectionDeposit?.publisher_name}
              </p>
            </div>
          </div>

          {loadingProtection ? (
            <div className="p-8 text-center">
              <InlineLoader size={24} />
            </div>
          ) : (
            <>
              {/* 1. Filigrane Visible */}
              <div
                onClick={() =>
                  setProtectionConfig((prev) => ({
                    ...prev,
                    watermark_enabled: !prev.watermark_enabled,
                  }))
                }
                className="p-4 rounded-2xl bg-background-secondary border border-border space-y-3 cursor-pointer hover:border-gold/40 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-gold shrink-0" />
                    <div>
                      <p className="font-bold text-navy">Filigrane Visuel Personnalisé</p>
                      <p className="text-[11px] text-foreground-muted">
                        Incruste un tatouage dynamique sur chaque page visualisée.
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={protectionConfig.watermark_enabled}
                    onChange={(e) => {
                      e.stopPropagation();
                      setProtectionConfig((prev) => ({
                        ...prev,
                        watermark_enabled: e.target.checked,
                      }));
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-4 h-4 accent-navy cursor-pointer shrink-0"
                  />
                </div>

                {protectionConfig.watermark_enabled && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/60"
                  >
                    <div>
                      <label className="text-[10px] uppercase font-bold text-navy block mb-1">
                        Position du filigrane
                      </label>
                      <select
                        value={protectionConfig.watermark_position}
                        onChange={(e) =>
                          setProtectionConfig((prev) => ({
                            ...prev,
                            watermark_position: e.target.value,
                          }))
                        }
                        className="w-full text-xs p-2 rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-navy"
                      >
                        <option value="bottom-right">Bas Droite</option>
                        <option value="center">Centre Diagonal</option>
                        <option value="top-right">Haut Droite</option>
                        <option value="bottom-left">Bas Gauche</option>
                        <option value="top-left">Haut Gauche</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-navy block mb-1">
                        Opacité ({protectionConfig.watermark_opacity}%)
                      </label>
                      <input
                        type="range"
                        min="5"
                        max="100"
                        step="5"
                        value={protectionConfig.watermark_opacity}
                        onChange={(e) =>
                          setProtectionConfig((prev) => ({
                            ...prev,
                            watermark_opacity: parseInt(e.target.value, 10),
                          }))
                        }
                        className="w-full accent-gold mt-1.5 cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Protection DRM LCP */}
              <div
                onClick={() =>
                  setProtectionConfig((prev) => ({
                    ...prev,
                    lcp_drm_enabled: !prev.lcp_drm_enabled,
                  }))
                }
                className="flex items-center justify-between p-4 rounded-2xl bg-background-secondary border border-border cursor-pointer hover:border-gold/40 transition-colors"
              >
                <div className="flex items-center gap-2 pr-3">
                  <Lock className="w-4 h-4 text-gold shrink-0" />
                  <div>
                    <p className="font-bold text-navy">Protection DRM LCP (Readium)</p>
                    <p className="text-[11px] text-foreground-muted">
                      Chiffre le contenu et limite l&apos;accès aux liseuses agréées.
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={protectionConfig.lcp_drm_enabled}
                  onChange={(e) => {
                    e.stopPropagation();
                    setProtectionConfig((prev) => ({
                      ...prev,
                      lcp_drm_enabled: e.target.checked,
                    }));
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-4 h-4 accent-navy cursor-pointer shrink-0"
                />
              </div>

              {/* 3. Bloquer copier-coller */}
              <div
                onClick={() =>
                  setProtectionConfig((prev) => ({
                    ...prev,
                    disable_copy_paste: !prev.disable_copy_paste,
                  }))
                }
                className="flex items-center justify-between p-4 rounded-2xl bg-background-secondary border border-border cursor-pointer hover:border-gold/40 transition-colors"
              >
                <div className="flex items-center gap-2 pr-3">
                  <Copy className="w-4 h-4 text-gold shrink-0" />
                  <div>
                    <p className="font-bold text-navy">Bloquer le Copier-Coller</p>
                    <p className="text-[11px] text-foreground-muted">
                      Désactive la sélection et la copie de texte dans le lecteur web.
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={protectionConfig.disable_copy_paste}
                  onChange={(e) => {
                    e.stopPropagation();
                    setProtectionConfig((prev) => ({
                      ...prev,
                      disable_copy_paste: e.target.checked,
                    }));
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-4 h-4 accent-navy cursor-pointer shrink-0"
                />
              </div>

              {/* 4. Bloquer impression */}
              <div
                onClick={() =>
                  setProtectionConfig((prev) => ({
                    ...prev,
                    disable_print: !prev.disable_print,
                  }))
                }
                className="flex items-center justify-between p-4 rounded-2xl bg-background-secondary border border-border cursor-pointer hover:border-gold/40 transition-colors"
              >
                <div className="flex items-center gap-2 pr-3">
                  <Printer className="w-4 h-4 text-gold shrink-0" />
                  <div>
                    <p className="font-bold text-navy">Bloquer l&apos;Impression</p>
                    <p className="text-[11px] text-foreground-muted">
                      Interdit l&apos;impression papier et l&apos;export virtuel via le navigateur.
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={protectionConfig.disable_print}
                  onChange={(e) => {
                    e.stopPropagation();
                    setProtectionConfig((prev) => ({
                      ...prev,
                      disable_print: e.target.checked,
                    }));
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-4 h-4 accent-navy cursor-pointer shrink-0"
                />
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-foreground-muted hover:bg-background-secondary cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  disabled={submittingProtection}
                  onClick={handleSaveProtection}
                  className="px-5 py-2 rounded-xl bg-navy text-white text-xs font-semibold hover:bg-navy-hover transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {submittingProtection ? (
                    <>
                      <InlineLoader size={14} />
                      <span>Enregistrement...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-gold" />
                      <span>Enregistrer</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}

