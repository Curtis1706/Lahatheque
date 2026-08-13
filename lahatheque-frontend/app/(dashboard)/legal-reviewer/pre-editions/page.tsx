"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { PenTool, PlusCircle, ArrowLeft, CheckCircle2, Clock, Building, School } from "lucide-react";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { Modal } from "@/components/ui/modal";
import { getPreEditionContracts, createPreEditionContract } from "@/lib/services/legal";
import type { PreEditionContract } from "@/lib/types/legal";

export default function LegalPreEditionsPage() {
  const [preEditions, setPreEditions] = useState<PreEditionContract[]>([]);
  const [loading, setLoading] = useState(true);

  // Modale création pré-édition
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [university, setUniversity] = useState("Université d'Abomey-Calavi (UAC)");
  const [faculty, setFaculty] = useState("Faculté de Droit et de Science Politique (FADESP)");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await getPreEditionContracts();
      setPreEditions(data);
      setLoading(false);
    }
    loadData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !authorName) return;

    setSubmitting(true);
    try {
      const created = await createPreEditionContract({
        title,
        author_name: authorName,
        university,
        faculty,
      });
      setPreEditions((prev) => [created, ...prev]);
      alert("Le contrat de pré-édition a été enregistré avec succès !");
      setIsModalOpen(false);
      setTitle("");
      setAuthorName("");
    } finally {
      setSubmitting(false);
    }
  };

  const columns: DataTableColumn<PreEditionContract>[] = [
    {
      key: "title",
      header: "Titre Prévisionnel de l'Ouvrage",
      cell: (row) => (
        <div>
          <p className="font-serif font-bold text-xs text-navy leading-snug">{row.title}</p>
          <p className="text-[10px] text-foreground-muted font-mono">ID Pré-édition : {row.id}</p>
        </div>
      ),
    },
    {
      key: "author_name",
      header: "Auteur Bénéficiaire",
      cell: (row) => <span className="font-semibold text-xs text-foreground">{row.author_name}</span>,
    },
    {
      key: "university",
      header: "Institution & Faculté",
      cell: (row) => (
        <div>
          <p className="font-semibold text-xs text-navy">{row.university}</p>
          <p className="text-[10px] text-foreground-muted truncate max-w-[200px]">{row.faculty}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Statut Dépôt",
      cell: (row) => (
        <span
          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
            row.status === "depot_lie"
              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
              : "bg-amber-500/10 text-amber-600 border-amber-500/30"
          }`}
        >
          {row.status === "depot_lie" ? (
            <>
              <CheckCircle2 className="w-3 h-3" />
              Dépôt effectif lié ✓
            </>
          ) : (
            <>
              <Clock className="w-3 h-3" />
              En attente du dépôt Maquettiste
            </>
          )}
        </span>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/legal-reviewer" className="hover:text-navy">Vue d&apos;ensemble</Link>
        <span>/</span>
        <span className="text-navy font-semibold">Contrats de Pré-édition</span>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/legal-reviewer" className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Vue d&apos;ensemble
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
            <PenTool className="w-4 h-4 text-gold" />
            Pré-enregistrement Légale
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Contrats de Pré-édition
          </h1>
          <p className="text-xs text-foreground-muted mt-1">
            Pré-enregistrement contractuel d&apos;un livre (titre, auteur, université, faculté) avant même son dépôt par le Maquettiste.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 bg-navy hover:bg-navy-hover text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-xs min-h-[44px]"
        >
          <PlusCircle className="w-4 h-4 text-gold" />
          Nouveau Contrat Pré-édition
        </button>
      </div>

      {/* Table */}
      <DataTable
        data={preEditions}
        columns={columns}
        rowKey="id"
        loading={loading}
        emptyMessage="Aucun contrat de pré-édition enregistré."
        pageSize={10}
      />

      {/* Modale de création */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Créer un Contrat de Pré-édition"
        description="Pré-enregistrez les informations d'un ouvrage avant sa finalisation par le Maquettiste."
      >
        <form onSubmit={handleCreate} className="space-y-4 pt-2">
          <div>
            <label htmlFor="pre-title" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
              Titre Prévisionnel de l&apos;Ouvrage *
            </label>
            <input
              id="pre-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ex. Manuel de Pharmacologie et Thérapeutique"
              className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-semibold min-h-[44px]"
              required
            />
          </div>

          <div>
            <label htmlFor="pre-author" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
              Nom de l&apos;Auteur *
            </label>
            <input
              id="pre-author"
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="ex. Prof. Victorien DOUGNON"
              className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-semibold min-h-[44px]"
              required
            />
          </div>

          <div>
            <label htmlFor="pre-university" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
              Université Rattachée *
            </label>
            <select
              id="pre-university"
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-semibold min-h-[44px]"
            >
              <option value="Université d'Abomey-Calavi (UAC)">Université d&apos;Abomey-Calavi (UAC)</option>
              <option value="Université de Parakou (UP)">Université de Parakou (UP)</option>
              <option value="Université Nationale des Sciences (UNSTIM)">Université Nationale des Sciences (UNSTIM)</option>
            </select>
          </div>

          <div>
            <label htmlFor="pre-faculty" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
              Faculté / Établissement *
            </label>
            <input
              id="pre-faculty"
              type="text"
              value={faculty}
              onChange={(e) => setFaculty(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-semibold min-h-[44px]"
              required
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-border text-xs font-semibold text-foreground-muted hover:text-navy min-h-[44px]"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors flex items-center justify-center gap-2 disabled:opacity-50 min-h-[44px] shadow-xs"
            >
              {submitting ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Enregistrer la Pré-édition"
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
