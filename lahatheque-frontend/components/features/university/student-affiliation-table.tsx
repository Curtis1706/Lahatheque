"use client";

import React, { useState, useMemo } from "react";
import {
  GraduationCap,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  FileText,
  Eye,
  AlertTriangle,
  Building2,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import type { UniversityStudentAffiliationData } from "@/lib/types/university";

interface StudentAffiliationTableProps {
  affiliations: UniversityStudentAffiliationData[];
  onAction: (id: string, action: "approve" | "suspend") => Promise<boolean>;
  loading?: boolean;
}

export function StudentAffiliationTable({
  affiliations,
  onAction,
  loading = false,
}: StudentAffiliationTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [facultyFilter, setFacultyFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [selectedStudentForCard, setSelectedStudentForCard] = useState<UniversityStudentAffiliationData | null>(null);
  const [suspendingStudent, setSuspendingStudent] = useState<UniversityStudentAffiliationData | null>(null);

  const faculties = useMemo(() => {
    const set = new Set(affiliations.map((a) => a.faculty_code));
    return Array.from(set);
  }, [affiliations]);

  const filteredData = useMemo(() => {
    return affiliations.filter((a) => {
      if (facultyFilter !== "all" && a.faculty_code !== facultyFilter) return false;
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = a.student_name.toLowerCase().includes(q);
        const matchMatricule = a.matricule.toLowerCase().includes(q);
        const matchEmail = a.student_email.toLowerCase().includes(q);
        if (!matchName && !matchMatricule && !matchEmail) return false;
      }
      return true;
    });
  }, [affiliations, searchQuery, facultyFilter, statusFilter]);

  const handleApprove = async (student: UniversityStudentAffiliationData) => {
    setActionLoadingId(student.id);
    try {
      const ok = await onAction(student.id, "approve");
      if (ok) {
        toast.success(`Affiliation validée pour ${student.student_name} (${student.matricule}).`);
      } else {
        toast.error("Échec de la validation.");
      }
    } catch {
      toast.error("Erreur réseau.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleConfirmSuspend = async () => {
    if (!suspendingStudent) return;
    setActionLoadingId(suspendingStudent.id);
    try {
      const ok = await onAction(suspendingStudent.id, "suspend");
      if (ok) {
        toast.success(`Affiliation suspendue pour ${suspendingStudent.student_name}.`);
      } else {
        toast.error("Échec de la suspension.");
      }
    } catch {
      toast.error("Erreur réseau.");
    } finally {
      setActionLoadingId(null);
      setSuspendingStudent(null);
    }
  };

  const columns: DataTableColumn<UniversityStudentAffiliationData>[] = [
    {
      key: "student_name",
      header: "Étudiant & Contact",
      cell: (row) => (
        <div>
          <p className="font-bold text-xs text-navy leading-snug">{row.student_name}</p>
          <p className="text-[10px] text-foreground-muted">{row.student_email}</p>
          {row.student_phone && (
            <p className="text-[9px] text-foreground-muted font-mono">{row.student_phone}</p>
          )}
        </div>
      ),
    },
    {
      key: "matricule",
      header: "Matricule Académique",
      cell: (row) => (
        <span className="font-mono text-xs font-bold text-navy bg-navy-light px-2.5 py-1 rounded-lg border border-navy-hover/20">
          {row.matricule}
        </span>
      ),
    },
    {
      key: "faculty_name",
      header: "Faculté & Niveau",
      cell: (row) => (
        <div>
          <span className="text-[11px] font-bold text-navy">{row.faculty_code}</span>
          <p className="text-[10px] text-foreground-muted truncate max-w-[180px]">{row.level}</p>
        </div>
      ),
    },
    {
      key: "student_card_url" as keyof UniversityStudentAffiliationData,
      header: "Justificatif",
      cell: (row) => (
        <button
          type="button"
          onClick={() => setSelectedStudentForCard(row)}
          className="px-2.5 py-1.5 rounded-lg bg-background-secondary border border-border hover:border-gold text-navy text-[11px] font-bold inline-flex items-center gap-1 transition-colors"
        >
          <FileText className="w-3.5 h-3.5 text-gold" />
          <span>Carte / Certificat</span>
        </button>
      ),
    },
    {
      key: "status",
      header: "Statut Affiliation",
      cell: (row) => {
        if (row.status === "active") {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3 h-3" />
              Affilié &amp; Actif
            </span>
          );
        }
        if (row.status === "suspended") {
          return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
              <XCircle className="w-3 h-3" />
              Suspendu
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3" />
            En attente de validation
          </span>
        );
      },
    },
    {
      key: "actions" as keyof UniversityStudentAffiliationData,
      header: "",
      cell: (row) => {
        const isCurrentLoading = actionLoadingId === row.id;
        return (
          <div className="flex items-center gap-1.5 justify-end">
            {row.status === "pending" && (
              <button
                type="button"
                onClick={() => handleApprove(row)}
                disabled={isCurrentLoading}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-colors inline-flex items-center gap-1 shadow-xs min-h-[36px] disabled:opacity-50"
              >
                {isCurrentLoading ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                <span>Approuver</span>
              </button>
            )}

            {row.status === "active" && (
              <button
                type="button"
                onClick={() => setSuspendingStudent(row)}
                disabled={isCurrentLoading}
                className="px-2.5 py-1.5 rounded-xl bg-background-secondary border border-border hover:border-rose-300 hover:text-rose-600 text-foreground-muted text-[11px] font-semibold transition-colors min-h-[36px]"
              >
                Suspendre
              </button>
            )}

            {row.status === "suspended" && (
              <button
                type="button"
                onClick={() => handleApprove(row)}
                disabled={isCurrentLoading}
                className="px-2.5 py-1.5 rounded-xl bg-navy text-white text-[11px] font-bold hover:bg-navy-hover transition-colors min-h-[36px]"
              >
                R&eacute;activer
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      {/* Filtres & Recherche */}
      <div className="p-4 rounded-2xl bg-background border border-border flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-foreground-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par nom, matricule ou e-mail..."
            className="w-full pl-9 pr-3.5 py-2 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy min-h-[40px]"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {/* Filtre Faculté */}
          <select
            value={facultyFilter}
            onChange={(e) => setFacultyFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-background-secondary border border-border rounded-xl text-navy font-semibold focus:outline-none focus:border-gold min-h-[40px]"
          >
            <option value="all">Toutes les Facultés</option>
            {faculties.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>

          {/* Filtre Statut */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-background-secondary border border-border rounded-xl text-navy font-semibold focus:outline-none focus:border-gold min-h-[40px]"
          >
            <option value="all">Tous les statuts</option>
            <option value="pending">En attente de validation</option>
            <option value="active">Affiliés actifs</option>
            <option value="suspended">Suspendus</option>
          </select>
        </div>
      </div>

      {/* Table DataTable 21st.dev paginée */}
      <DataTable
        data={filteredData}
        columns={columns}
        rowKey="id"
        loading={loading}
        emptyMessage="Aucune affiliation ne correspond à vos critères de recherche."
        pageSize={10}
      />

      {/* Modal Aperçu Carte d'Étudiant */}
      {selectedStudentForCard && (
        <div className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-background border border-border rounded-3xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-gold" />
                <h3 className="font-serif font-bold text-navy text-sm">
                  Justificatif de Scolarité
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudentForCard(null)}
                className="text-foreground-muted hover:text-navy text-xs font-bold"
              >
                Fermer
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <p><span className="font-bold text-navy">Étudiant :</span> {selectedStudentForCard.student_name}</p>
              <p><span className="font-bold text-navy">Matricule :</span> {selectedStudentForCard.matricule}</p>
              <p><span className="font-bold text-navy">Faculté :</span> {selectedStudentForCard.faculty_name}</p>
              <p><span className="font-bold text-navy">Niveau :</span> {selectedStudentForCard.level}</p>
            </div>

            <div className="p-8 rounded-2xl bg-background-secondary border border-dashed border-border text-center space-y-2">
              <FileText className="w-10 h-10 text-gold mx-auto" />
              <p className="text-xs font-semibold text-navy">Carte d&apos;Étudiant / Certificat d&apos;Inscription</p>
              <p className="text-[10px] text-foreground-muted font-mono">Fichier vérifié &amp; conforme aux registres UAC</p>
            </div>

            <button
              type="button"
              onClick={() => setSelectedStudentForCard(null)}
              className="w-full py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors"
            >
              Fermer l&apos;Aperçu
            </button>
          </div>
        </div>
      )}

      {/* Modal Confirmation de Suspension */}
      {suspendingStudent && (
        <div className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-background border border-border rounded-3xl p-6 max-w-md w-full space-y-4 shadow-xl">
            <div className="flex items-center gap-3 text-amber-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-serif font-bold text-navy text-base">
                Confirmer la Suspension d&apos;Affiliation
              </h3>
            </div>

            <p className="text-xs text-foreground-muted leading-relaxed">
              Êtes-vous sûr de vouloir suspendre l&apos;accès campus de l&apos;étudiant{" "}
              <strong className="text-navy">{suspendingStudent.student_name}</strong> (Matricule : {suspendingStudent.matricule}) ?
              Il ne pourra plus consulter les bouquets documentaires souscrits par votre université.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSuspendingStudent(null)}
                className="flex-1 py-2.5 rounded-xl bg-background-secondary border border-border text-navy text-xs font-bold hover:border-gold transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmSuspend}
                disabled={actionLoadingId === suspendingStudent.id}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors inline-flex items-center justify-center gap-2"
              >
                {actionLoadingId === suspendingStudent.id ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : null}
                <span>Confirmer Suspension</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
