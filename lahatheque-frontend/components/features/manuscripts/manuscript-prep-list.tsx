"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  BookOpenCheck,
  FileText,
  Download,
  CheckCircle2,
  Clock,
  Search,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  DollarSign,
  Globe,
  User,
  AlertCircle,
  HelpCircle,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import { DisciplineCombobox } from "@/components/features/catalog/discipline-combobox";
import {
  getPendingManuscriptsForPrep,
  processManuscriptSubmission,
  type PendingManuscriptPrep,
  type ProcessManuscriptPayload,
} from "@/lib/services/layout-artist";

interface ManuscriptPrepListProps {
  role?: "admin" | "chief_layout";
}

export function ManuscriptPrepList({ role = "chief_layout" }: ManuscriptPrepListProps) {
  const [manuscripts, setManuscripts] = useState<PendingManuscriptPrep[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modale de traitement
  const [selectedManuscript, setSelectedManuscript] = useState<PendingManuscriptPrep | null>(null);
  const [viewDetailManuscript, setViewDetailManuscript] = useState<PendingManuscriptPrep | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Formulaire dans la modale
  const [formData, setFormData] = useState<{
    title: string;
    discipline: string;
    summary: string;
    language: string;
    priceDigital: string;
    isPaperAvailable: boolean;
    pricePaper: string;
  }>({
    title: "",
    discipline: "",
    summary: "",
    language: "Français",
    priceDigital: "5000",
    isPaperAvailable: false,
    pricePaper: "7500",
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  async function loadData() {
    setLoading(true);
    try {
      const data = await getPendingManuscriptsForPrep();
      setManuscripts(data);
    } catch (err) {
      console.error("Erreur de chargement des manuscrits à préparer:", err);
      toast.error("Impossible de charger les manuscrits en attente de préparation.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filteredManuscripts = useMemo(() => {
    if (!searchQuery.trim()) return manuscripts;
    const q = searchQuery.toLowerCase();
    return manuscripts.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.author_name.toLowerCase().includes(q) ||
        m.author_email.toLowerCase().includes(q)
    );
  }, [manuscripts, searchQuery]);

  function handleOpenProcessModal(item: PendingManuscriptPrep) {
    setSelectedManuscript(item);
    setFormData({
      title: item.title,
      discipline: "",
      summary: item.suggested_summary || "",
      language: item.suggested_language || "Français",
      priceDigital: "5000",
      isPaperAvailable: false,
      pricePaper: "7500",
    });
    setFormErrors({});
  }

  function validateForm(): boolean {
    const errors: Record<string, string> = {};
    if (!formData.title.trim()) {
      errors.title = "Le titre de l'ouvrage est obligatoire.";
    }
    if (!formData.discipline.trim()) {
      errors.discipline = "Veuillez sélectionner une discipline académique.";
    }
    const numPrice = parseFloat(formData.priceDigital);
    if (isNaN(numPrice) || numPrice <= 0) {
      errors.priceDigital = "Le prix numérique doit être supérieur à 0 XOF.";
    }
    if (formData.isPaperAvailable) {
      const paperPrice = parseFloat(formData.pricePaper);
      if (isNaN(paperPrice) || paperPrice <= 0) {
        errors.pricePaper = "Le prix papier doit être supérieur à 0 XOF.";
      }
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmitProcess(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedManuscript) return;
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const payload: ProcessManuscriptPayload = {
        title: formData.title.trim(),
        discipline_id: formData.discipline,
        summary: formData.summary.trim(),
        language: formData.language.trim(),
        price_digital: parseFloat(formData.priceDigital),
        is_paper_available: formData.isPaperAvailable,
        price_paper: formData.isPaperAvailable ? parseFloat(formData.pricePaper) : undefined,
      };

      const result = await processManuscriptSubmission(selectedManuscript.id, payload);

      if (result.success) {
        toast.success(
          result.message ||
            `« ${formData.title} » a été créé et transmis au Juriste pour contractualisation.`
        );
        // Retirer le manuscrit traité de la file
        setManuscripts((prev) => prev.filter((m) => m.id !== selectedManuscript.id));
        setSelectedManuscript(null);
      } else {
        toast.error(result.error || "Une erreur est survenue lors de la conversion du manuscrit.");
      }
    } catch (err: any) {
      console.error("Erreur soumission traitement manuscrit:", err);
      toast.error(err.message || "Erreur inattendue lors de la transmission au Juriste.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 w-full animate-in fade-in duration-300">
      {/* Barre d'action et recherche */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-2xl bg-background border border-border">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-foreground-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Rechercher par titre d'ouvrage, auteur ou email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-background-secondary border border-border focus:outline-none focus:ring-1 focus:ring-gold text-foreground placeholder:text-foreground-muted"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-foreground-muted font-semibold px-3 py-1.5 rounded-lg bg-background-secondary border border-border">
            {filteredManuscripts.length} manuscrit{filteredManuscripts.length > 1 ? "s" : ""} en attente
          </span>
          <button
            type="button"
            onClick={loadData}
            title="Actualiser la liste"
            className="px-3 py-1.5 rounded-xl border border-border bg-background hover:bg-background-secondary text-navy text-xs font-bold transition-colors min-h-[36px]"
          >
            Actualiser
          </button>
        </div>
      </div>

      {/* Liste / Tableau */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-5 rounded-2xl bg-background border border-border animate-pulse space-y-3"
            >
              <div className="h-4 bg-background-secondary rounded-md w-1/3" />
              <div className="h-3 bg-background-secondary rounded-md w-1/4" />
            </div>
          ))}
        </div>
      ) : filteredManuscripts.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-background border border-border space-y-3">
          <div className="size-12 mx-auto rounded-2xl bg-gold/10 flex items-center justify-center text-gold">
            <CheckCircle2 className="size-6" />
          </div>
          <h3 className="font-serif font-bold text-navy text-base">
            Aucun manuscrit en attente de préparation catalogue
          </h3>
          <p className="text-xs text-foreground-muted max-w-md mx-auto leading-relaxed">
            Tous les manuscrits acceptés lors de l&apos;étude éditoriale ont déjà été transformés en
            ouvrages et transmis au Juriste pour publication.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Vue Mobile (< 1024px) : Cartes empilées */}
          <div className="grid grid-cols-1 gap-4 lg:hidden">
            {filteredManuscripts.map((m) => (
              <div
                key={m.id}
                className="p-5 rounded-2xl bg-background border border-border space-y-4 shadow-xs hover:border-gold/30 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="inline-block text-[10px] font-mono uppercase font-bold text-gold px-2 py-0.5 rounded-md bg-gold/10 border border-gold/20 mb-1">
                      Version {m.version_type}
                    </span>
                    <h4 className="font-serif font-bold text-navy text-sm leading-snug">
                      {m.title}
                    </h4>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-foreground-muted border-t border-border/50 pt-3">
                  <div className="flex items-center gap-2 text-foreground">
                    <User className="size-3.5 text-gold shrink-0" />
                    <span className="font-semibold">{m.author_name}</span>
                    <span className="text-[11px] text-foreground-muted font-mono truncate">
                      ({m.author_email})
                    </span>
                  </div>

                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <Clock className="size-3.5 text-foreground-muted shrink-0" />
                    <span>
                      Déposé le {new Date(m.created_at).toLocaleDateString("fr-FR")}
                    </span>
                  </div>

                  {m.editorial_note && (
                    <div className="p-2.5 rounded-xl bg-background-secondary border border-border/70 text-[11px] text-foreground-muted mt-2">
                      <span className="font-bold text-navy block text-[10px] uppercase font-mono">
                        Note éditoriale :
                      </span>
                      <p className="line-clamp-2 mt-0.5">{m.editorial_note}</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
                  {m.manuscript_file_url ? (
                    <a
                      href={m.manuscript_file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-2 rounded-xl bg-background-secondary hover:bg-border text-navy text-xs font-semibold inline-flex items-center gap-1.5 transition-colors min-h-[44px]"
                    >
                      <Download className="size-3.5 text-gold" />
                      Fichier
                    </a>
                  ) : (
                    <span className="text-[11px] text-foreground-muted italic">Sans fichier</span>
                  )}

                  <button
                    type="button"
                    onClick={() => handleOpenProcessModal(m)}
                    className="px-4 py-2 rounded-xl bg-navy hover:bg-navy-hover text-white text-xs font-bold inline-flex items-center gap-1.5 transition-colors min-h-[44px] shadow-xs"
                  >
                    <Layers className="size-3.5 text-gold" />
                    Traiter ce Manuscrit
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Vue Desktop (>= 1024px) : Tableau soigné */}
          <div className="hidden lg:block overflow-hidden rounded-2xl bg-background border border-border shadow-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-background-secondary text-[11px] font-mono uppercase tracking-wider text-foreground-muted">
                  <th className="py-3 px-4 font-bold">Ouvrage &amp; Version</th>
                  <th className="py-3 px-4 font-bold">Auteur Déposant</th>
                  <th className="py-3 px-4 font-bold">Date de Dépôt</th>
                  <th className="py-3 px-4 font-bold">Note Éditoriale</th>
                  <th className="py-3 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs">
                {filteredManuscripts.map((m) => (
                  <tr key={m.id} className="hover:bg-background-secondary/50 transition-colors">
                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="font-serif font-bold text-navy text-sm leading-snug">
                        {m.title}
                      </p>
                      <span className="inline-block mt-1 text-[10px] font-mono font-bold uppercase text-gold px-2 py-0.5 rounded-md bg-gold/10 border border-gold/20">
                        {m.version_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-navy">{m.author_name}</p>
                      <p className="text-[11px] text-foreground-muted font-mono">{m.author_email}</p>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-foreground-muted whitespace-nowrap">
                      {new Date(m.created_at).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      {m.editorial_note ? (
                        <p className="text-[11px] text-foreground-muted line-clamp-2 italic">
                          « {m.editorial_note} »
                        </p>
                      ) : (
                        <span className="text-[11px] text-foreground-muted italic">Aucune note</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        {m.manuscript_file_url && (
                          <a
                            href={m.manuscript_file_url}
                            target="_blank"
                            rel="noreferrer"
                            title="Télécharger le manuscrit déposé"
                            className="p-2 rounded-xl bg-background-secondary hover:bg-border text-navy transition-colors min-h-[36px] min-w-[36px] inline-flex items-center justify-center"
                          >
                            <Download className="size-4 text-gold" />
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={() => setViewDetailManuscript(m)}
                          title="Consulter le résumé complet"
                          className="px-3 py-1.5 rounded-xl border border-border bg-background hover:bg-background-secondary text-navy text-xs font-semibold transition-colors min-h-[36px] inline-flex items-center gap-1"
                        >
                          <FileText className="size-3.5 text-gold" />
                          Détails
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenProcessModal(m)}
                          className="px-3.5 py-1.5 rounded-xl bg-navy hover:bg-navy-hover text-white text-xs font-bold transition-colors inline-flex items-center gap-1.5 min-h-[36px] shadow-xs"
                        >
                          <Layers className="size-3.5 text-gold" />
                          Traiter ce Manuscrit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modale de consultation du résumé */}
      {viewDetailManuscript && (
        <Modal
          open={Boolean(viewDetailManuscript)}
          onClose={() => setViewDetailManuscript(null)}
          title="Fiche du Manuscrit Soumis"
          description="Consultez les informations déposées par l'auteur avant préparation du catalogue."
          maxWidth={600}
        >
          <div className="space-y-4 py-2">
            <div>
              <span className="text-[10px] font-mono uppercase font-bold text-foreground-muted block">
                Titre Soumis :
              </span>
              <p className="font-serif font-bold text-base text-navy mt-0.5">
                {viewDetailManuscript.title}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-background-secondary border border-border">
                <span className="text-[10px] font-mono uppercase font-bold text-foreground-muted block">
                  Auteur :
                </span>
                <p className="font-semibold text-navy mt-0.5">{viewDetailManuscript.author_name}</p>
                <p className="text-[11px] text-foreground-muted font-mono">{viewDetailManuscript.author_email}</p>
              </div>

              <div className="p-3 rounded-xl bg-background-secondary border border-border">
                <span className="text-[10px] font-mono uppercase font-bold text-foreground-muted block">
                  Langue &amp; Version :
                </span>
                <p className="font-semibold text-navy mt-0.5">
                  {viewDetailManuscript.suggested_language || "Français"}
                </p>
                <p className="text-[11px] text-gold font-mono uppercase font-bold">
                  {viewDetailManuscript.version_type}
                </p>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-mono uppercase font-bold text-foreground-muted block">
                Résumé ou Note d&apos;Intention :
              </span>
              <div className="p-3.5 rounded-xl bg-background-secondary border border-border text-xs text-navy leading-relaxed mt-1 whitespace-pre-wrap">
                {viewDetailManuscript.suggested_summary || "Aucun résumé transmis par l'auteur."}
              </div>
            </div>

            {viewDetailManuscript.editorial_note && (
              <div>
                <span className="text-[10px] font-mono uppercase font-bold text-foreground-muted block">
                  Avis du Comité Éditorial (Étape 1) :
                </span>
                <div className="p-3 rounded-xl bg-gold/10 border border-gold/30 text-xs text-navy mt-1">
                  « {viewDetailManuscript.editorial_note} »
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Modale de Traitement & Conversion en Ouvrage Réel (BO2) */}
      {selectedManuscript && (
        <Modal
          open={Boolean(selectedManuscript)}
          onClose={() => {
            if (!submitting) setSelectedManuscript(null);
          }}
          title="Préparer l'Ouvrage pour le Catalogue"
          description="Complétez les données requises (discipline, prix, tirage). Le manuscrit sera converti en un Ouvrage réel transmis directement au Juriste avec le statut 'En attente d'approbation juridique'."
          maxWidth={680}
        >
          <form onSubmit={handleSubmitProcess} className="space-y-4 py-2">
            {/* Titre */}
            <div>
              <label className="block text-xs font-bold text-navy mb-1">
                Titre Définitif de l&apos;Ouvrage <span className="text-error">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Traité de Droit Administratif en Afrique"
                className="w-full px-3 py-2 text-xs rounded-xl bg-background-secondary border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-gold"
              />
              {formErrors.title && (
                <p className="text-[11px] text-error mt-1 font-medium">{formErrors.title}</p>
              )}
            </div>

            {/* Discipline (DisciplineCombobox) */}
            <div>
              <label className="block text-xs font-bold text-navy mb-1">
                Discipline Académique <span className="text-error">*</span>
              </label>
              <DisciplineCombobox
                value={formData.discipline}
                onChange={(val) => setFormData({ ...formData, discipline: val })}
                placeholder="Sélectionner une discipline du catalogue..."
                searchPlaceholder="Rechercher une discipline..."
              />
              {formErrors.discipline && (
                <p className="text-[11px] text-error mt-1 font-medium">{formErrors.discipline}</p>
              )}
            </div>

            {/* Résumé */}
            <div>
              <label className="block text-xs font-bold text-navy mb-1">
                Résumé Bibliographique &amp; Quatrième de Couverture
              </label>
              <textarea
                rows={3}
                value={formData.summary}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                placeholder="Résumé de l'ouvrage pour la notice publique..."
                className="w-full px-3 py-2 text-xs rounded-xl bg-background-secondary border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-gold leading-relaxed"
              />
            </div>

            {/* Langue & Prix Numérique */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-navy mb-1">
                  Langue de l&apos;Ouvrage
                </label>
                <select
                  value={formData.language}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-background-secondary border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-gold"
                >
                  <option value="Français">Français</option>
                  <option value="Anglais">Anglais</option>
                  <option value="Bilingue FR/EN">Bilingue FR/EN</option>
                  <option value="Espagnol">Espagnol</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-navy mb-1">
                  Prix Numérique (XOF) <span className="text-error">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={formData.priceDigital}
                  onChange={(e) => setFormData({ ...formData, priceDigital: e.target.value })}
                  placeholder="5000"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-background-secondary border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-gold font-mono"
                />
                {formErrors.priceDigital && (
                  <p className="text-[11px] text-error mt-1 font-medium">{formErrors.priceDigital}</p>
                )}
              </div>
            </div>

            {/* Version papier & Prix Papier conditionnel */}
            <div className="p-4 rounded-2xl bg-background-secondary/60 border border-border space-y-3">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.isPaperAvailable}
                  onChange={(e) => setFormData({ ...formData, isPaperAvailable: e.target.checked })}
                  className="size-4 rounded border-border text-navy focus:ring-gold"
                />
                <div>
                  <span className="text-xs font-bold text-navy block">
                    Disponible en version papier (Imprimerie &amp; Vente physique)
                  </span>
                  <span className="text-[11px] text-foreground-muted block">
                    Cochez si l&apos;ouvrage fera l&apos;objet d&apos;un tirage physique en librairie.
                  </span>
                </div>
              </label>

              {formData.isPaperAvailable && (
                <div className="pt-2 border-t border-border/60 animate-in fade-in duration-200">
                  <label className="block text-xs font-bold text-navy mb-1">
                    Prix Version Papier (XOF) <span className="text-error">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={formData.pricePaper}
                    onChange={(e) => setFormData({ ...formData, pricePaper: e.target.value })}
                    placeholder="7500"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-background border border-border text-foreground focus:outline-none focus:ring-1 focus:ring-gold font-mono"
                  />
                  {formErrors.pricePaper && (
                    <p className="text-[11px] text-error mt-1 font-medium">{formErrors.pricePaper}</p>
                  )}
                </div>
              )}
            </div>

            {/* Note d'information circuit */}
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-navy/5 border border-navy/15 text-[11px] text-navy">
              <ShieldCheck className="size-4 text-gold shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                En validant, un nouvel ouvrage sera créé avec le statut{" "}
                <span className="font-mono font-bold">pending_legal_approval</span>. Il apparaîtra
                immédiatement sur la page <strong>« Publication en Attente »</strong> du Juriste pour
                signature du contrat avant mise en vitrine.
              </p>
            </div>

            {/* Boutons d'action */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setSelectedManuscript(null)}
                className="px-4 py-2 rounded-xl border border-border bg-background hover:bg-background-secondary text-navy text-xs font-bold transition-colors min-h-[44px]"
              >
                Annuler
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-xl bg-navy hover:bg-navy-hover text-white text-xs font-bold transition-colors inline-flex items-center gap-2 min-h-[44px] shadow-sm disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <span className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Création en cours...
                  </>
                ) : (
                  <>
                    <BookOpenCheck className="size-4 text-gold" />
                    Créer l&apos;Ouvrage &amp; Transmettre au Juriste
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
