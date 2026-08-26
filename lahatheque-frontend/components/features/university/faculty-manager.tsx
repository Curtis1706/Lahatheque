"use client";

import React, { useState } from "react";
import {
  Building2,
  PlusCircle,
  Trash2,
  GraduationCap,
  Users,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import type { UniversityFacultyData } from "@/lib/types/university";
import { InlineLoader } from "@/components/ui/page-loader";

interface FacultyManagerProps {
  faculties: UniversityFacultyData[];
  onAddFaculty: (faculty: Omit<UniversityFacultyData, "id">) => Promise<UniversityFacultyData>;
  onDeleteFaculty: (id: string) => Promise<boolean>;
}

export function FacultyManager({
  faculties,
  onAddFaculty,
  onDeleteFaculty,
}: FacultyManagerProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [deanName, setDeanName] = useState("");
  const [disciplinesInput, setDisciplinesInput] = useState("");
  const [studentCount, setStudentCount] = useState(1000);
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      toast.error("Veuillez renseigner le nom et le code de la Faculté / UFR.");
      return;
    }

    setLoading(true);
    try {
      const disciplines = disciplinesInput
        .split(",")
        .map((d) => d.trim())
        .filter(Boolean);

      await onAddFaculty({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        dean_name: deanName.trim(),
        disciplines: disciplines.length > 0 ? disciplines : ["Générale"],
        student_count: Number(studentCount) || 0,
      });

      toast.success(`Faculté ${code.toUpperCase()} ajoutée avec succès.`);
      setShowAddModal(false);
      setName("");
      setCode("");
      setDeanName("");
      setDisciplinesInput("");
      setStudentCount(1000);
    } catch {
      toast.error("Erreur lors de l'ajout de la faculté.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, facCode: string) => {
    if (!confirm(`Supprimer la composante académique ${facCode} ?`)) return;
    try {
      await onDeleteFaculty(id);
      toast.success(`Faculté ${facCode} retirée.`);
    } catch {
      toast.error("Erreur lors de la suppression.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4 text-gold" />
            Structure Académique de l&apos;Établissement
          </div>
          <h3 className="font-serif text-lg font-bold text-navy">
            Facultés, UFRs &amp; Instituts Rattachés ({faculties.length})
          </h3>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors inline-flex items-center gap-2 shadow-xs min-h-[44px]"
        >
          <PlusCircle className="w-4 h-4 text-gold" />
          <span>Ajouter une Faculté / UFR</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {faculties.map((fac) => (
          <div
            key={fac.id}
            className="p-5 rounded-2xl bg-background border border-border flex flex-col justify-between gap-4 hover:border-gold/50 transition-all shadow-xs"
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-navy-light text-navy font-mono text-xs font-bold border border-navy-hover/20">
                  {fac.code}
                </span>
                <button
                  type="button"
                  onClick={() => handleDelete(fac.id, fac.code)}
                  className="text-foreground-muted hover:text-rose-600 p-1 transition-colors"
                  title="Supprimer la composante"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <h4 className="font-serif text-sm font-bold text-navy leading-snug">
                {fac.name}
              </h4>

              {fac.dean_name && (
                <p className="text-[11px] text-foreground-muted">
                  Doyen : <span className="font-semibold text-navy">{fac.dean_name}</span>
                </p>
              )}

              <div className="flex items-center gap-1.5 text-[11px] text-foreground-muted font-medium pt-1">
                <Users className="w-3.5 h-3.5 text-gold" />
                <span>{fac.student_count.toLocaleString("fr-FR")} étudiants inscrits</span>
              </div>

              {fac.disciplines && fac.disciplines.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {fac.disciplines.map((d) => (
                    <span
                      key={d}
                      className="px-2 py-0.5 rounded bg-background-secondary text-[10px] text-navy font-medium border border-border"
                    >
                      {d}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal Ajout Faculté */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleCreate}
            className="bg-background border border-border rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-gold" />
                <h3 className="font-serif font-bold text-navy text-base">
                  Nouvelle Faculté / Composante Académique
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-foreground-muted hover:text-navy text-xs font-bold"
              >
                Fermer
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-1">
                <label className="text-xs font-bold text-navy uppercase tracking-wider">
                  Nom Complet de la Faculté / UFR <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex: Faculté des Sciences Agronomiques"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy min-h-[40px]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-navy uppercase tracking-wider">
                  Code / Sigle <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="ex: FSA, EPAC"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy uppercase min-h-[40px]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-navy uppercase tracking-wider">
                  Doyen / Directeur d&apos;UFR
                </label>
                <input
                  type="text"
                  placeholder="ex: Prof. Jean KOUDOSSOU"
                  value={deanName}
                  onChange={(e) => setDeanName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy min-h-[40px]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-navy uppercase tracking-wider">
                  Effectif Étudiants Estimé
                </label>
                <input
                  type="number"
                  value={studentCount}
                  onChange={(e) => setStudentCount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy min-h-[40px]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-navy uppercase tracking-wider">
                Disciplines Associées (Séparées par des virgules)
              </label>
              <input
                type="text"
                placeholder="ex: Agronomie générale, Foresterie, Zootechnie"
                value={disciplinesInput}
                onChange={(e) => setDisciplinesInput(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy min-h-[40px]"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-background-secondary border border-border text-navy text-xs font-bold hover:border-gold transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors inline-flex items-center justify-center gap-2"
              >
                {loading ? (
                  <InlineLoader size={16} />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-gold" />
                )}
                <span>Enregistrer la Faculté</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
