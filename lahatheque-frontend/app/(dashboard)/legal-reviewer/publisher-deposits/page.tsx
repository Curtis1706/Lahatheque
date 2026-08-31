"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Scale,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  BookOpen,
  FileCheck2,
  AlertTriangle,
  Download,
  FileText,
} from "lucide-react";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { Modal } from "@/components/ui/modal";
import { InlineLoader } from "@/components/ui/page-loader";
import {
  getPublisherDepositsForReview,
  submitRightsDecision,
  type PublisherDepositForReview,
} from "@/lib/services/publisher";
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

export default function LegalReviewerPublisherDepositsPage() {
  const [deposits, setDeposits] = useState<PublisherDepositForReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [selected, setSelected] = useState<PublisherDepositForReview | null>(null);
  const [decision, setDecision] = useState<"approved" | "revision_requested">("approved");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
    if (d.status === "published") return false;
    const q = search.toLowerCase();
    return (
      d.title.toLowerCase().includes(q) ||
      d.publisher_name.toLowerCase().includes(q) ||
      d.isbn_digital.toLowerCase().includes(q)
    );
  });

  const pendingRights = deposits.filter((d) => d.rights_status === "pending").length;

  const openModal = (dep: PublisherDepositForReview) => {
    setSelected(dep);
    setComment(dep.rights_comment || "");
    setDecision("approved");
  };

  const closeModal = () => {
    setSelected(null);
  };

  const handleSubmit = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      const res = await submitRightsDecision(selected.id, decision, comment);
      if (res.success) {
        toast.success(`Vérification des droits : ${decision === "approved" ? "validée" : "corrections demandées"}.`);
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

  const columns: DataTableColumn<PublisherDepositForReview>[] = [
    {
      key: "title",
      header: "Ouvrage & Éditeur",
      cell: (row) => (
        <div className="flex items-center gap-3">
          {row.cover_url && row.cover_url !== "/placeholder-cover.jpg" ? (
            <img
              src={row.cover_url}
              alt=""
              className="w-8 h-11 rounded-md object-cover border border-border shrink-0 shadow-2xs"
            />
          ) : (
            <div className="w-8 h-11 rounded-md bg-navy/5 border border-border flex items-center justify-center shrink-0">
              <BookOpen className="w-3.5 h-3.5 text-gold/70" />
            </div>
          )}
          <div className="space-y-0.5 min-w-0">
            <p className="font-semibold text-xs text-foreground line-clamp-1">{row.title}</p>
            <p className="text-[10px] text-gold font-medium">{row.publisher_name}</p>
            <span className="text-[10px] text-foreground-muted font-mono">{row.isbn_digital}</span>
          </div>
        </div>
      ),
    },
    {
      key: "discipline",
      header: "Discipline",
      cell: (row) => (
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-navy/10 text-navy font-semibold">
          {row.discipline}
        </span>
      ),
    },
    {
      key: "editorial_status",
      header: "Volet éditorial (Chef Maquettiste)",
      cell: (row) => <StatusChip value={row.editorial_status} />,
    },
    {
      key: "rights_status",
      header: "Volet droits (votre décision)",
      cell: (row) => <StatusChip value={row.rights_status} />,
    },
    {
      key: "actions" as keyof PublisherDepositForReview,
      header: "Action",
      cell: (row) => (
        <div className="flex items-center gap-1.5 flex-wrap">
          {row.file_url ? (
            <a
              href={row.file_url}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="p-2 rounded-xl bg-background border border-border hover:border-gold hover:text-navy text-foreground-muted transition-colors inline-flex items-center gap-1 text-xs font-semibold"
              title="Télécharger le PDF soumis"
            >
              <Download className="w-3.5 h-3.5 text-gold" />
              <span className="hidden sm:inline">PDF</span>
            </a>
          ) : (
            <span
              className="p-2 rounded-xl bg-background/50 border border-border/50 text-foreground-muted/50 inline-flex items-center gap-1 text-xs cursor-not-allowed"
              title="Aucun fichier PDF joint"
            >
              <Download className="w-3.5 h-3.5 text-foreground-muted/40" />
              <span className="hidden sm:inline text-[10px]">Sans PDF</span>
            </span>
          )}

          <button
            type="button"
            onClick={() => openModal(row)}
            className="px-3 py-1.5 rounded-xl bg-navy text-white text-[10px] font-bold hover:bg-navy-hover transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Scale className="w-3.5 h-3.5 text-gold" />
            Décision juridique
          </button>
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
            <Link href="/legal-reviewer" className="hover:text-navy transition-colors">Espace Juridique</Link>
            <span>/</span>
            <span className="text-navy font-semibold">Dépôts Éditeurs Tiers — Droits</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-navy flex items-center gap-2.5">
            <Scale className="w-6 h-6 text-gold" />
            Vérification des Droits — Éditeurs Tiers
          </h1>
          <p className="text-xs sm:text-sm text-foreground-muted mt-0.5">
            Votre rôle : vérifier les droits d'auteur et les cessions de droits pour chaque dépôt éditeur partenaire. Téléchargez le manuscrit PDF pour inspecter les mentions légales avant décision.
          </p>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl bg-background-secondary border border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground-muted">Droits en attente de vérification</span>
            <Clock className="w-4 h-4 text-warning" />
          </div>
          <p className="text-2xl font-bold font-serif text-navy mt-2">{pendingRights}</p>
          <p className="text-[11px] text-foreground-muted mt-1">Dépôts sans décision juridique de votre part</p>
        </div>
        <div className="p-4 rounded-2xl bg-background-secondary border border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground-muted">Total dépôts actifs</span>
            <BookOpen className="w-4 h-4 text-navy" />
          </div>
          <p className="text-2xl font-bold font-serif text-navy mt-2">{filtered.length}</p>
          <p className="text-[11px] text-foreground-muted mt-1">Hors dépôts déjà publiés</p>
        </div>
      </div>

      {/* Recherche */}
      <div className="p-4 rounded-2xl bg-background-secondary border border-border">
        <div className="relative">
          <Search className="w-4 h-4 text-foreground-muted absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Rechercher par titre, éditeur ou ISBN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-background border border-border focus:border-gold focus:outline-none"
          />
        </div>
      </div>

      {/* Tableau */}
      <div className="rounded-2xl bg-background-secondary border border-border overflow-hidden p-4 sm:p-6">
        <DataTable
          data={filtered}
          columns={columns}
          rowKey="id"
          loading={loading}
          emptyMessage="Aucun dépôt éditeur à vérifier pour l'instant."
        />
      </div>

      {/* Modale décision droits */}
      <Modal open={!!selected} onClose={closeModal} title="Décision de Vérification des Droits">
        <div className="p-6 space-y-5">
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-gold/10 border border-gold/20">
            <Scale className="w-5 h-5 text-gold shrink-0" />
            <div>
              <p className="text-xs font-bold text-navy">{selected?.title}</p>
              <p className="text-[10px] text-foreground-muted">{selected?.publisher_name} — {selected?.discipline}</p>
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

          {selected?.editorial_status !== "approved" && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-warning/10 border border-warning/20">
              <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
              <p className="text-[11px] text-foreground">
                Note : la conformité éditoriale n'est pas encore validée par le Chef Maquettiste. Votre décision reste enregistrée mais la publication nécessitera les deux volets.
              </p>
            </div>
          )}
          <div>
            <label className="text-xs font-semibold text-foreground block mb-1.5">Décision juridique</label>
            <div className="flex gap-2">
              {(["approved", "revision_requested"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setDecision(v)}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    decision === v
                      ? v === "approved" ? "bg-success text-white border-success" : "bg-error text-white border-error"
                      : "bg-background border-border text-foreground"
                  }`}
                >
                  {v === "approved" ? "Droits conformes" : "Corrections nécessaires"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-foreground block mb-1.5">Commentaire juridique</label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Vérification contrat de cession, pourcentages de droits d'auteur, territoires de diffusion, conformité DROIT OHADA..."
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
              onClick={handleSubmit}
              className={`px-5 py-2 rounded-xl text-white text-xs font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-50 ${
                decision === "approved" ? "bg-success hover:bg-success/90" : "bg-error hover:bg-error/90"
              }`}
            >
              {submitting ? (
                <><InlineLoader size={14} /><span>Enregistrement...</span></>
              ) : decision === "approved" ? (
                <><CheckCircle2 className="w-3.5 h-3.5" /><span>Valider les droits</span></>
              ) : (
                <><XCircle className="w-3.5 h-3.5" /><span>Demander corrections</span></>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

