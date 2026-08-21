"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  GraduationCap,
  ArrowLeft,
  Users,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
} from "lucide-react";
import { StudentAffiliationTable } from "@/components/features/university/student-affiliation-table";
import {
  getUniversityAffiliations,
  updateUniversityAffiliation,
} from "@/lib/services/university";
import type { UniversityStudentAffiliationData } from "@/lib/types/university";

export default function UniversityAffiliationsPage() {
  const [affiliations, setAffiliations] = useState<UniversityStudentAffiliationData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await getUniversityAffiliations();
      setAffiliations(data);
      setLoading(false);
    }
    loadData();
  }, []);

  const handleAction = async (id: string, action: "approve" | "suspend") => {
    const ok = await updateUniversityAffiliation(id, action);
    if (ok) {
      setAffiliations((prev) =>
        prev.map((a) =>
          a.id === id
            ? {
                ...a,
                status: action === "approve" ? "active" : "suspended",
                verified_at: action === "approve" ? new Date().toISOString() : a.verified_at,
              }
            : a
        )
      );
    }
    return ok;
  };

  const pendingCount = affiliations.filter((a) => a.status === "pending").length;
  const activeCount = affiliations.filter((a) => a.status === "active").length;

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/university" className="hover:text-navy">Vue d&apos;ensemble</Link>
        <span>/</span>
        <span className="text-navy font-semibold">Affiliations Étudiantes</span>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/university" className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Vue d&apos;ensemble
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
            <GraduationCap className="w-4 h-4 text-gold" />
            Gestion des Accès Étudiants &amp; Enseignants
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Affiliations &amp; Droits d&apos;Accès Campus
          </h1>
          <p className="text-xs text-foreground-muted mt-1">
            Validez les demandes d&apos;affiliation de vos étudiants sur la base de leur numéro matricule académique et justificatif de scolarité.
          </p>
        </div>

        {/* Badges de comptage */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <span>{pendingCount} en attente</span>
          </div>
          <div className="px-3.5 py-2 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{activeCount} actifs</span>
          </div>
        </div>
      </div>

      {/* Table des affiliations */}
      <StudentAffiliationTable
        affiliations={affiliations}
        onAction={handleAction}
        loading={loading}
      />
    </div>
  );
}
