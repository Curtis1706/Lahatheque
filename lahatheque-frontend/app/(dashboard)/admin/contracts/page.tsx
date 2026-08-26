"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Modal } from "@/components/ui/modal";
import { InlineLoader } from "@/components/ui/page-loader";
import {
  getAdminContracts,
  processAdminContract,
} from "@/lib/services/admin";
import { AdminContract } from "@/lib/types/admin";
import {
  Scale,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  AlertTriangle,
  FileText,
  UserCheck,
  Search,
  Filter,
  Coins,
  Percent,
  Download,
  Building2,
  User,
  RotateCw,
  ShieldCheck,
  Tag,
} from "lucide-react";
import { toast } from "sonner";

export default function AdminContractsPage() {
  const [contracts, setContracts] = useState<AdminContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [partnerTypeFilter, setPartnerTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modales
  const [selectedForApprove, setSelectedForApprove] = useState<AdminContract | null>(null);
  const [selectedForReject, setSelectedForReject] = useState<AdminContract | null>(null);
  const [approvedRate, setApprovedRate] = useState<number>(15);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getAdminContracts();
      setContracts(data);
    } catch {
      toast.error("Impossible de récupérer les contrats juridiques.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredContracts = useMemo(() => {
    return contracts.filter((c) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        c.title?.toLowerCase().includes(q) ||
        c.partner_name?.toLowerCase().includes(q) ||
        c.contract_number?.toLowerCase().includes(q) ||
        c.partner_email?.toLowerCase().includes(q) ||
        c.reviewed_by_juriste?.toLowerCase().includes(q);

      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "active" && (c.status === "active" || c.status === "en_vigueur")) ||
        (filterStatus === "pending" && (c.status === "pending_signature" || c.status === "pending_admin_approval")) ||
        (filterStatus === "derogatory" && c.is_derogatory) ||
        (filterStatus === "rejected" && (c.status === "rejected" || c.status === "terminated")) ||
        (filterStatus === "expired" && c.status === "expired");

      const matchesPartner =
        partnerTypeFilter === "all" || c.partner_type === partnerTypeFilter;

      return matchesSearch && matchesStatus && matchesPartner;
    });
  }, [contracts, searchQuery, filterStatus, partnerTypeFilter]);

  const pendingCount = useMemo(
    () => contracts.filter((c) => c.status === "pending_signature" || c.status === "pending_admin_approval").length,
    [contracts]
  );
  const activeCount = useMemo(
    () => contracts.filter((c) => c.status === "active" || c.status === "en_vigueur").length,
    [contracts]
  );
  const derogatoryCount = useMemo(
    () => contracts.filter((c) => c.is_derogatory).length,
    [contracts]
  );

  const handleApprove = async () => {
    if (!selectedForApprove) return;
    setIsSubmitting(true);
    try {
      const res = await processAdminContract(selectedForApprove.id, "approve", undefined, approvedRate);
      if (res.success) {
        toast.success(res.message || "Contrat approuvé et mis en vigueur avec succès !");
        setSelectedForApprove(null);
        await loadData();
      } else {
        toast.error(res.error || "Erreur lors de l'approbation du contrat.");
      }
    } catch {
      toast.error("Erreur de communication avec le serveur.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedForReject) return;
    if (!rejectionReason.trim()) {
      toast.error("Veuillez indiquer le motif précis du refus.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await processAdminContract(selectedForReject.id, "reject", rejectionReason);
      if (res.success) {
        toast.success(res.message || "Contrat rejeté. Le motif a été transmis au juriste.");
        setSelectedForReject(null);
        setRejectionReason("");
        await loadData();
      } else {
        toast.error(res.error || "Erreur lors du rejet du contrat.");
      }
    } catch {
      toast.error("Erreur de communication avec le serveur.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns: DataTableColumn<AdminContract>[] = [
    {
      key: "contract",
      header: "N° & Objet du Contrat",
      cell: (row) => (
        <div className="space-y-0.5 max-w-[280px]">
          <Link
            href={`/admin/contracts/${row.id}`}
            className="font-mono font-bold text-xs text-gold hover:underline block"
          >
            {row.contract_number}
          </Link>
          <p className="font-bold text-xs text-navy line-clamp-1" title={row.title}>
            {row.title}
          </p>
          <span className="text-[10px] text-foreground-muted block">
            {row.created_at ? `Créé le ${new Date(row.created_at).toLocaleDateString("fr-FR")}` : "Date non renseignée"}
          </span>
        </div>
      ),
    },
    {
      key: "partner",
      header: "Partenaire / Titulaire",
      cell: (row) => (
        <div className="space-y-0.5 max-w-[220px]">
          <div className="flex items-center gap-1.5 font-semibold text-xs text-navy">
            {row.partner_type === "publisher" ? (
              <Building2 className="w-3.5 h-3.5 text-gold shrink-0" />
            ) : row.partner_type === "university" ? (
              <Scale className="w-3.5 h-3.5 text-navy shrink-0" />
            ) : (
              <User className="w-3.5 h-3.5 text-foreground-muted shrink-0" />
            )}
            <span className="truncate">{row.partner_name}</span>
          </div>
          <p className="text-[11px] text-foreground-muted truncate">{row.partner_email || "Email non renseigné"}</p>
        </div>
      ),
    },
    {
      key: "rate",
      header: "Taux Redevance",
      cell: (row) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-xs font-bold text-navy">
              {row.royalty_rate ? `${row.royalty_rate}%` : "15%"}
            </span>
            {row.is_derogatory && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-gold/15 text-navy font-bold border border-gold/30">
                Dérogatoire
              </span>
            )}
          </div>
          <p className="text-[10px] text-foreground-muted">
            {row.partner_type === "author"
              ? "Part Auteur"
              : row.partner_type === "publisher"
              ? "Part Éditeur"
              : "Part Académique"}
          </p>
        </div>
      ),
    },
    {
      key: "juriste",
      header: "Instruction Juridique",
      cell: (row) => (
        <div className="space-y-0.5 text-[11px]">
          <div className="flex items-center gap-1 text-navy font-medium">
            <UserCheck className="w-3.5 h-3.5 text-gold shrink-0" />
            <span>{row.reviewed_by_juriste || "Cabinet Juridique LAHA"}</span>
          </div>
          <p className="text-[10px] text-foreground-muted">Conformité légale vérifiée</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Statut",
      cell: (row) => {
        const rawStatus = row.status;
        const normalized =
          rawStatus === "active" || rawStatus === "en_vigueur"
            ? "active"
            : rawStatus === "pending_signature" || rawStatus === "pending_admin_approval"
            ? "pending_signature"
            : rawStatus === "expired"
            ? "expired"
            : "rejected";

        return (
          <div className="space-y-1">
            <StatusBadge status={normalized} />
            {row.rejection_reason && (
              <p className="text-[10px] text-error font-medium line-clamp-1" title={row.rejection_reason}>
                Motif : {row.rejection_reason}
              </p>
            )}
          </div>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      cell: (row) => (
        <div className="flex items-center gap-1.5">
          <Link
            href={`/admin/contracts/${row.id}`}
            className="p-2 rounded-xl bg-background hover:bg-background-secondary border border-border text-navy hover:text-gold transition-colors text-xs font-semibold inline-flex items-center justify-center min-h-[38px] min-w-[38px] shadow-2xs"
            title="Consulter le contrat et arbitrage"
          >
            <Eye className="w-3.5 h-3.5" />
          </Link>

          {row.file_url && (
            <a
              href={row.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl bg-background hover:bg-background-secondary border border-border text-navy hover:text-gold transition-colors text-xs font-semibold inline-flex items-center justify-center min-h-[38px] min-w-[38px] shadow-2xs"
              title="Télécharger l'acte juridique scellé"
            >
              <Download className="w-3.5 h-3.5" />
            </a>
          )}

          {(row.status === "pending_admin_approval" || row.status === "pending_signature") && (
            <>
              <button
                type="button"
                onClick={() => {
                  setSelectedForApprove(row);
                  setApprovedRate(row.royalty_rate || 15);
                }}
                className="px-2.5 py-1.5 rounded-xl bg-success text-white hover:bg-success/90 transition-colors text-xs font-semibold flex items-center gap-1 shadow-xs cursor-pointer min-h-[38px]"
                title="Approuver le contrat"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Valider</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedForReject(row)}
                className="px-2.5 py-1.5 rounded-xl bg-error/10 border border-error/20 text-error hover:bg-error/20 transition-colors text-xs font-semibold flex items-center gap-1 cursor-pointer min-h-[38px]"
                title="Rejeter le contrat avec motif"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Refuser</span>
              </button>
            </>
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
            <span className="text-navy font-semibold">Contrats & Arbitrage Juridique</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-navy flex items-center gap-2.5">
            <Scale className="w-6 h-6 text-gold" />
            Supervision des Contrats d&apos;Édition & Droits d&apos;Auteur
          </h1>
          <p className="text-xs sm:text-sm text-foreground-muted mt-0.5">
            Contrôle régalien des accords de cession, validation des barèmes dérogatoires et arbitrage des litiges.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="p-2.5 rounded-xl bg-background hover:bg-background-secondary border border-border text-navy font-bold text-xs transition-colors min-h-[42px] min-w-[42px] inline-flex items-center justify-center cursor-pointer shadow-2xs"
            title="Actualiser les contrats"
          >
            <RotateCw className={`w-4 h-4 text-navy ${loading ? "animate-spin" : ""}`} />
          </button>
          <Link
            href="/admin/royalties"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-background border border-border text-navy text-xs font-semibold hover:border-gold hover:text-gold transition-colors min-h-[42px]"
          >
            <Coins className="w-4 h-4 text-gold" />
            <span>Gestion des Redevances</span>
          </Link>
        </div>
      </div>

      {/* Cartes d'Indicateurs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          type="button"
          onClick={() => setFilterStatus(filterStatus === "pending" ? "all" : "pending")}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            filterStatus === "pending"
              ? "bg-gold/10 border-gold shadow-xs"
              : "bg-background-secondary border-border hover:border-navy/30"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground-muted">En Attente Validation Admin</span>
            <Clock className="w-4 h-4 text-gold" />
          </div>
          <p className="text-2xl font-bold font-serif text-navy mt-2">{pendingCount}</p>
          <p className="text-[11px] text-foreground-muted mt-1">Dossiers instruits par le Juriste</p>
        </button>

        <button
          type="button"
          onClick={() => setFilterStatus(filterStatus === "active" ? "all" : "active")}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            filterStatus === "active"
              ? "bg-success/10 border-success shadow-xs"
              : "bg-background-secondary border-border hover:border-navy/30"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground-muted">Contrats en Vigueur</span>
            <CheckCircle2 className="w-4 h-4 text-success" />
          </div>
          <p className="text-2xl font-bold font-serif text-navy mt-2">{activeCount}</p>
          <p className="text-[11px] text-foreground-muted mt-1">Accords actifs & exécutables</p>
        </button>

        <button
          type="button"
          onClick={() => setFilterStatus(filterStatus === "derogatory" ? "all" : "derogatory")}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            filterStatus === "derogatory"
              ? "bg-gold/15 border-gold shadow-xs"
              : "bg-background-secondary border-border hover:border-navy/30"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground-muted">Accords Dérogatoires</span>
            <Percent className="w-4 h-4 text-gold" />
          </div>
          <p className="text-2xl font-bold font-serif text-navy mt-2">{derogatoryCount}</p>
          <p className="text-[11px] text-foreground-muted mt-1">Barèmes personnalisés par contrat</p>
        </button>
      </div>

      {/* Barre de Recherche et Filtres Unifiée */}
      <div className="p-3 rounded-2xl bg-background-secondary/60 border border-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-foreground-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par numéro, titre, partenaire, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-background border border-border focus:border-gold focus:outline-none min-h-[40px] text-navy placeholder:text-foreground-muted"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <Filter className="w-4 h-4 text-foreground-muted shrink-0 hidden sm:block" />
          <select
            value={partnerTypeFilter}
            onChange={(e) => setPartnerTypeFilter(e.target.value)}
            className="text-xs font-semibold text-navy bg-background border border-border rounded-xl px-3 py-2 focus:outline-none focus:border-gold min-h-[40px] cursor-pointer"
          >
            <option value="all">Tous partenaires</option>
            <option value="author">Auteurs</option>
            <option value="university">Universités</option>
            <option value="publisher">Éditeurs Tiers</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs font-semibold text-navy bg-background border border-border rounded-xl px-3 py-2 focus:outline-none focus:border-gold min-h-[40px] cursor-pointer"
          >
            <option value="all">Tous les statuts ({contracts.length})</option>
            <option value="active">En vigueur ({activeCount})</option>
            <option value="pending">En attente ({pendingCount})</option>
            <option value="derogatory">Dérogatoires ({derogatoryCount})</option>
            <option value="expired">Expirés</option>
            <option value="rejected">Résiliés / Rejetés</option>
          </select>
        </div>
      </div>

      {/* Tableau des Contrats */}
      <div className="rounded-2xl bg-background-secondary border border-border overflow-hidden p-4 sm:p-6">
        <DataTable
          data={filteredContracts}
          columns={columns}
          rowKey="id"
          loading={loading}
          searchable={false}
          emptyMessage="Aucun contrat juridique ne correspond aux critères sélectionnés."
          pageSize={10}
        />
      </div>

      {/* Modale d'Approbation de Contrat */}
      <Modal
        open={!!selectedForApprove}
        onClose={() => setSelectedForApprove(null)}
        title="Approbation & Mise en Vigueur du Contrat"
      >
        <div className="p-6 space-y-5">
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-success/10 border border-success/20">
            <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
            <div>
              <p className="text-xs font-bold text-success">Validation Officielle de la Direction</p>
              <p className="text-[11px] text-foreground">
                Cette décision valide les engagements juridiques et active le barème de redevances associé.
              </p>
            </div>
          </div>

          {selectedForApprove && (
            <div className="space-y-2 text-xs">
              <p className="font-semibold text-foreground">
                Contrat : <span className="font-mono text-gold font-bold">{selectedForApprove.contract_number}</span>
              </p>
              <p className="text-foreground-muted">
                Partenaire : <strong className="text-navy">{selectedForApprove.partner_name}</strong>
              </p>
              <p className="text-foreground-muted">Objet : {selectedForApprove.title}</p>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-navy">Taux de Redevance Validé (%)</label>
            <input
              type="number"
              min={1}
              max={100}
              value={approvedRate}
              onChange={(e) => setApprovedRate(parseFloat(e.target.value) || 0)}
              className="w-full mt-1.5 p-2.5 text-xs rounded-xl bg-background border border-border focus:border-gold focus:outline-none font-mono font-bold text-navy"
            />
          </div>

          <div className="pt-3 border-t border-border flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setSelectedForApprove(null)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-foreground-muted hover:bg-background-secondary border border-border cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleApprove}
              className="px-5 py-2 rounded-xl bg-success text-white text-xs font-semibold hover:bg-success/90 transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <InlineLoader size={14} />
                  <span>Validation...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Approuver & Mettre en Vigueur</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modale de Rejet de Contrat avec Motif */}
      <Modal
        open={!!selectedForReject}
        onClose={() => setSelectedForReject(null)}
        title="Refuser le Projet de Contrat"
      >
        <form onSubmit={handleReject} className="p-6 space-y-5">
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-error/10 border border-error/20">
            <AlertTriangle className="w-5 h-5 text-error shrink-0" />
            <div>
              <p className="text-xs font-bold text-error">Rejet du contrat pour révision</p>
              <p className="text-[11px] text-foreground">
                Le juriste et le titulaire seront notifiés avec le motif indiqué ci-dessous.
              </p>
            </div>
          </div>

          {selectedForReject && (
            <div className="space-y-1 text-xs">
              <p className="font-semibold text-foreground">
                Contrat : <span className="font-mono text-navy font-bold">{selectedForReject.contract_number}</span>
              </p>
              <p className="text-foreground-muted">Partenaire : {selectedForReject.partner_name}</p>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-navy">
              Motif précis du rejet (obligatoire) *
            </label>
            <textarea
              required
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Exemple : Taux dérogatoire non justifié, clause d'exclusivité territoriale incomplète."
              className="w-full mt-1.5 p-2.5 text-xs rounded-xl bg-background border border-border focus:border-gold focus:outline-none resize-none text-navy"
            />
          </div>

          <div className="pt-3 border-t border-border flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setSelectedForReject(null)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-foreground-muted hover:bg-background-secondary border border-border cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-error text-white text-xs font-semibold hover:bg-error/90 transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <InlineLoader size={14} />
                  <span>Enregistrement...</span>
                </>
              ) : (
                <>
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Confirmer le Rejet</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
