"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileCheck2,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  AlertTriangle,
  Search,
  BookOpen,
  RotateCcw,
  Send,
} from "lucide-react";
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
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const [selected, setSelected] = useState<PublisherDepositForReview | null>(null);
  const [editDecision, setEditDecision] = useState<"approved" | "revision_requested">("approved");
  const [editComment, setEditComment] = useState("");
  const [rightsDecision, setRightsDecision] = useState<"approved" | "revision_requested">("approved");
  const [rightsComment, setRightsComment] = useState("");
  const [activeModal, setActiveModal] = useState<"editorial" | "rights" | "publish" | null>(null);
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
    const q = search.toLowerCase();
    const matchSearch =
      d.title.toLowerCase().includes(q) ||
      d.publisher_name.toLowerCase().includes(q) ||
      d.isbn_digital.toLowerCase().includes(q);
    const matchStatus = filterStatus === "all" || d.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const pendingCount = deposits.filter((d) => d.editorial_status === "pending" || d.rights_status === "pending").length;
  const readyCount = deposits.filter((d) => d.editorial_status === "approved" && d.rights_status === "approved" && d.status !== "published").length;
  const publishedCount = deposits.filter((d) => d.status === "published").length;

  const openModal = (dep: PublisherDepositForReview, modal: "editorial" | "rights" | "publish") => {
    setSelected(dep);
    setEditComment(dep.editorial_comment || "");
    setRightsComment(dep.rights_comment || "");
    setEditDecision("approved");
    setRightsDecision("approved");
    setActiveModal(modal);
  };

  const closeModal = () => {
    setSelected(null);
    setActiveModal(null);
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

  const columns: DataTableColumn<PublisherDepositForReview>[] = [
    {
      key: "title",
      header: "Ouvrage & Éditeur",
      cell: (row) => (
        <div className="space-y-0.5">
          <p className="font-semibold text-xs text-foreground line-clamp-1">{row.title}</p>
          <p className="text-[10px] text-gold font-medium">{row.publisher_name}</p>
          <span className="text-[10px] text-foreground-muted font-mono">{row.isbn_digital}</span>
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
      header: "Conformité éditoriale",
      cell: (row) => <StatusChip value={row.editorial_status} />,
    },
    {
      key: "rights_status",
      header: "Vérification droits",
      cell: (row) => <StatusChip value={row.rights_status} />,
    },
    {
      key: "status",
      header: "Statut global",
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "actions" as keyof PublisherDepositForReview,
      header: "Actions",
      cell: (row) => (
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => openModal(row, "editorial")}
            className="px-2 py-1.5 rounded-xl bg-background border border-border hover:border-gold text-foreground text-[10px] font-semibold flex items-center gap-1 transition-colors"
            title="Décision éditoriale (Chef Maquettiste)"
          >
            <FileCheck2 className="w-3 h-3 text-gold" />
            Editorial
          </button>
          <button
            type="button"
            onClick={() => openModal(row, "rights")}
            className="px-2 py-1.5 rounded-xl bg-background border border-border hover:border-gold text-foreground text-[10px] font-semibold flex items-center gap-1 transition-colors"
            title="Décision juridique (Juriste)"
          >
            <FileCheck2 className="w-3 h-3 text-gold" />
            Droits
          </button>
          {row.editorial_status === "approved" && row.rights_status === "approved" && row.status !== "published" && (
            <button
              type="button"
              onClick={() => openModal(row, "publish")}
              className="px-2 py-1.5 rounded-xl bg-success text-white text-[10px] font-semibold flex items-center gap-1 hover:bg-success/90 transition-colors shadow-xs"
              title="Publier sur la vitrine"
            >
              <Send className="w-3 h-3" />
              Publier
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
            Deux volets distincts par dépôt : conformité éditoriale (Chef Maquettiste) et vérification des droits (Juriste). La publication n'est possible que lorsque les deux sont validés.
          </p>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-background-secondary border border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground-muted">Volets en attente</span>
            <Clock className="w-4 h-4 text-warning" />
          </div>
          <p className="text-2xl font-bold font-serif text-navy mt-2">{pendingCount}</p>
          <p className="text-[11px] text-foreground-muted mt-1">Dépôts avec au moins un volet non validé</p>
        </div>
        <div className="p-4 rounded-2xl bg-background-secondary border border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground-muted">Prêts à publier</span>
            <CheckCircle2 className="w-4 h-4 text-success" />
          </div>
          <p className="text-2xl font-bold font-serif text-navy mt-2">{readyCount}</p>
          <p className="text-[11px] text-foreground-muted mt-1">Éditorial ET droits validés, en attente de publication</p>
        </div>
        <div className="p-4 rounded-2xl bg-background-secondary border border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground-muted">Publiés</span>
            <BookOpen className="w-4 h-4 text-navy" />
          </div>
          <p className="text-2xl font-bold font-serif text-navy mt-2">{publishedCount}</p>
          <p className="text-[11px] text-foreground-muted mt-1">Ouvrages en ligne sur la vitrine</p>
        </div>
      </div>

      {/* Barre recherche */}
      <div className="p-4 rounded-2xl bg-background-secondary border border-border flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-foreground-muted absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Rechercher par titre, éditeur ou ISBN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-background border border-border focus:border-gold focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { key: "all", label: "Tous" },
            { key: "pending", label: "En attente" },
            { key: "published", label: "Publiés" },
          ].map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilterStatus(f.key)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                filterStatus === f.key
                  ? "bg-navy text-white"
                  : "bg-background border border-border text-foreground hover:bg-background-secondary"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tableau */}
      <div className="rounded-2xl bg-background-secondary border border-border overflow-hidden p-4 sm:p-6">
        <DataTable
          data={filtered}
          columns={columns}
          rowKey="id"
          loading={loading}
          emptyMessage="Aucun dépôt éditeur tiers à examiner."
        />
      </div>

      {/* Modale — Décision éditoriale */}
      <Modal open={activeModal === "editorial"} onClose={closeModal} title="Conformité Éditoriale">
        <div className="p-6 space-y-5">
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-gold/10 border border-gold/20">
            <FileCheck2 className="w-5 h-5 text-gold shrink-0" />
            <div>
              <p className="text-xs font-bold text-navy">Volet éditorial — Chef Maquettiste</p>
              <p className="text-[11px] text-foreground">{selected?.title}</p>
              <p className="text-[10px] text-foreground-muted">{selected?.publisher_name}</p>
            </div>
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
    </div>
  );
}
