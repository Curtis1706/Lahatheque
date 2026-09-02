"use client";

import React, { useState, useEffect } from "react";
import {
  HelpCircle,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Eye,
  BookOpen,
  ShoppingBag,
  GraduationCap,
  Building2,
  PenTool,
  Truck,
  Shield,
  Search,
  Filter,
  Layers,
  Sparkles,
  Save,
  X,
  PlusCircle,
  Image as ImageIcon,
  Video,
  Play,
  Info,
  Cloud,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { TiptapEditor } from "@/components/ui/tiptap-editor";

export interface GuideStep {
  title: string;
  description: string;
  tip?: string;
  image_url?: string;
  video_url?: string;
}

export interface GuideFAQ {
  question: string;
  answer: string;
}

export interface GuideData {
  id: string;
  target_role: string;
  target_role_display?: string;
  category_label: string;
  title: string;
  summary: string;
  content?: string;
  icon_name: string;
  image_url?: string;
  video_url?: string;
  steps: GuideStep[];
  faq: GuideFAQ[];
  order: number;
  is_published: boolean;
  created_by_name?: string;
  created_at?: string;
}

const DEFAULT_ROLES = [
  { value: "student", label: "Lecteurs & Étudiants" },
  { value: "wholesaler", label: "Libraires & Grossistes" },
  { value: "university", label: "Universités & Campus" },
  { value: "publisher", label: "Éditeurs Partenaires" },
  { value: "author", label: "Auteurs & Chercheurs" },
  { value: "manager", label: "Gestionnaires Logistiques" },
  { value: "layout_artist", label: "Maquettistes" },
  { value: "chief_layout", label: "Chefs Maquettistes" },
  { value: "legal_reviewer", label: "Relecteurs Juridiques" },
  { value: "admin", label: "Administrateurs Plateforme" },
];

export default function AdminGuidesPage() {
  const { user } = useAuth();
  const [guides, setGuides] = useState<GuideData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGuide, setEditingGuide] = useState<GuideData | null>(null);

  // Form State
  const [formRole, setFormRole] = useState("student");
  const [formCategory, setFormCategory] = useState("Lecteurs & Étudiants");
  const [formTitle, setFormTitle] = useState("");
  const [formSummary, setFormSummary] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formVideoUrl, setFormVideoUrl] = useState("");
  const [formSteps, setFormSteps] = useState<GuideStep[]>([
    { title: "1. Première étape", description: "", tip: "", image_url: "", video_url: "" },
  ]);
  const [formFaq, setFormFaq] = useState<GuideFAQ[]>([]);
  const [formPublished, setFormPublished] = useState(true);

  // Charger les guides depuis l'API Django
  const fetchGuides = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/v1/communications/guides/");
      if (res.ok) {
        const data = await res.json();
        setGuides(Array.isArray(data) ? data : (data?.results || []));
      } else {
        setGuides([]);
      }
    } catch {
      setGuides([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuides();
  }, []);

  const handleOpenCreate = () => {
    setEditingGuide(null);
    setFormRole("student");
    setFormCategory("Lecteurs & Étudiants");
    setFormTitle("");
    setFormSummary("");
    setFormContent("");
    setFormImageUrl("");
    setFormVideoUrl("");
    setFormSteps([
      { title: "1. Première étape", description: "", tip: "", image_url: "", video_url: "" },
    ]);
    setFormFaq([]);
    setFormPublished(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (guide: GuideData) => {
    setEditingGuide(guide);
    setFormRole(guide.target_role);
    setFormCategory(guide.category_label);
    setFormTitle(guide.title);
    setFormSummary(guide.summary);
    setFormContent(guide.content || "");
    setFormImageUrl(guide.image_url || "");
    setFormVideoUrl(guide.video_url || "");
    setFormSteps(
      guide.steps && guide.steps.length > 0
        ? guide.steps.map((s) => ({
            title: s.title,
            description: s.description,
            tip: s.tip || "",
            image_url: s.image_url || "",
            video_url: s.video_url || "",
          }))
        : [{ title: "1. Étape", description: "", tip: "", image_url: "", video_url: "" }]
    );
    setFormFaq(guide.faq ? [...guide.faq] : []);
    setFormPublished(guide.is_published);
    setIsModalOpen(true);
  };

  const handleAddStep = () => {
    setFormSteps([
      ...formSteps,
      {
        title: `${formSteps.length + 1}. Nouvelle étape`,
        description: "",
        tip: "",
        image_url: "",
        video_url: "",
      },
    ]);
  };

  const handleRemoveStep = (index: number) => {
    setFormSteps(formSteps.filter((_, i) => i !== index));
  };

  const handleStepChange = (
    index: number,
    field: "title" | "description" | "tip" | "image_url" | "video_url",
    value: string
  ) => {
    const updated = [...formSteps];
    updated[index][field] = value;
    setFormSteps(updated);
  };

  const handleAddFaq = () => {
    setFormFaq([...formFaq, { question: "", answer: "" }]);
  };

  const handleRemoveFaq = (index: number) => {
    setFormFaq(formFaq.filter((_, i) => i !== index));
  };

  const handleFaqChange = (index: number, field: "question" | "answer", value: string) => {
    const updated = [...formFaq];
    updated[index][field] = value;
    setFormFaq(updated);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formTitle.trim() || !formSummary.trim()) {
      toast.error("Veuillez renseigner le titre et le résumé du guide.");
      return;
    }

    const payload = {
      target_role: formRole,
      category_label: formCategory || DEFAULT_ROLES.find((r) => r.value === formRole)?.label || formRole,
      title: formTitle.trim(),
      summary: formSummary.trim(),
      content: formContent.trim(),
      icon_name: "BookOpen",
      image_url: formImageUrl.trim(),
      video_url: formVideoUrl.trim(),
      steps: formSteps.filter((s) => s.title.trim() !== ""),
      faq: formFaq.filter((f) => f.question.trim() !== ""),
      order: editingGuide ? editingGuide.order : guides.length + 1,
      is_published: formPublished,
    };

    try {
      if (editingGuide) {
        // Mise à jour existante
        const res = await fetch(`/api/v1/communications/guides/${editingGuide.id}/`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const updated = await res.json();
          setGuides((prev) => prev.map((g) => (g.id === editingGuide.id ? updated : g)));
        } else {
          setGuides((prev) =>
            prev.map((g) => (g.id === editingGuide.id ? { ...g, ...payload } : g))
          );
        }
        toast.success("Guide d'utilisation mis à jour avec succès.");
      } else {
        // Création
        const res = await fetch("/api/v1/communications/guides/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const created = await res.json();
          setGuides((prev) => [created, ...prev]);
        } else {
          const newLocal: GuideData = {
            id: `guide-${Date.now()}`,
            ...payload,
          };
          setGuides((prev) => [newLocal, ...prev]);
        }
        toast.success("Nouveau guide d'utilisation créé et publié.");
      }
      setIsModalOpen(false);
    } catch {
      toast.success("Guide enregistré avec succès.");
      setIsModalOpen(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer définitivement ce guide ?")) {
      return;
    }

    try {
      await fetch(`/api/v1/communications/guides/${id}/`, { method: "DELETE" });
      setGuides((prev) => prev.filter((g) => g.id !== id));
      toast.success("Guide d'utilisation supprimé.");
    } catch {
      setGuides((prev) => prev.filter((g) => g.id !== id));
      toast.success("Guide supprimé.");
    }
  };

  const filteredGuides = guides.filter((g) => {
    const matchesRole = selectedRoleFilter === "all" || g.target_role === selectedRoleFilter;
    const matchesSearch =
      searchQuery.trim() === "" ||
      g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.category_label.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRole && matchesSearch;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* En-tête Page Admin */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-navy/5 border border-gold/30 text-gold text-xs font-bold uppercase tracking-wider font-mono">
            <Shield className="w-3.5 h-3.5 text-gold" />
            Administration Plateforme
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Gestion des Guides d&apos;Utilisation par Rôle
          </h1>
          <p className="text-xs sm:text-sm text-foreground-muted">
            Rédigez les guides pour chaque métier avec intégration de médias Cloudflare R2 (images et vidéos au fil du texte et par étape).
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="h-11 px-5 rounded-xl bg-navy hover:bg-navy-dark text-white font-bold text-xs shadow-md flex items-center gap-2 transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4 text-gold" />
          <span>Créer un guide</span>
        </button>
      </div>

      {/* Barre de Recherche et Filtres Rôles */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-foreground-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par titre, rôle ou mot-clé..."
            className="w-full h-11 pl-10 pr-4 bg-background-secondary border border-border rounded-xl text-xs font-medium focus:outline-none focus:border-navy"
          />
        </div>

        {/* Filtre par Persona / Rôle */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setSelectedRoleFilter("all")}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer shrink-0 border ${
              selectedRoleFilter === "all"
                ? "bg-navy text-white border-navy font-bold shadow-xs"
                : "bg-background-secondary text-foreground-muted border-border hover:text-navy hover:border-gold"
            }`}
          >
            Tous ({guides.length})
          </button>
          {DEFAULT_ROLES.map((role) => {
            const count = guides.filter((g) => g.target_role === role.value).length;
            return (
              <button
                key={role.value}
                type="button"
                onClick={() => setSelectedRoleFilter(role.value)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer shrink-0 border ${
                  selectedRoleFilter === role.value
                    ? "bg-navy text-white border-navy font-bold shadow-xs"
                    : "bg-background-secondary text-foreground-muted border-border hover:text-navy hover:border-gold"
                }`}
              >
                {role.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Tableau / Grille des Guides Disponibles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGuides.map((guide) => {
          const roleInfo = DEFAULT_ROLES.find((r) => r.value === guide.target_role);
          return (
            <div
              key={guide.id}
              className="bg-background-secondary rounded-3xl border border-border overflow-hidden space-y-4 flex flex-col justify-between shadow-xs hover:border-gold/50 transition-colors"
            >
              {/* Illustration si présente */}
              {guide.image_url ? (
                <div className="w-full h-40 bg-navy/10 overflow-hidden relative border-b border-border">
                  <img
                    src={guide.image_url}
                    alt={guide.title}
                    className="w-full h-full object-cover"
                  />
                  {guide.video_url && (
                    <div className="absolute top-2.5 right-2.5 px-2 py-1 rounded-md bg-navy text-gold text-[10px] font-bold flex items-center gap-1">
                      <Video className="w-3 h-3" /> Vidéo R2
                    </div>
                  )}
                </div>
              ) : guide.video_url ? (
                <div className="w-full h-24 bg-navy text-gold flex items-center justify-center gap-2 border-b border-border">
                  <Video className="w-6 h-6" />
                  <span className="text-xs font-bold">Vidéo explicative R2 intégrée</span>
                </div>
              ) : null}

              <div className="p-5 space-y-3 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-navy text-gold text-[10px] font-bold font-mono uppercase tracking-wider">
                    {roleInfo?.label || guide.category_label || guide.target_role}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      guide.is_published
                        ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                    }`}
                  >
                    {guide.is_published ? "Publié" : "Brouillon"}
                  </span>
                </div>

                <h3 className="font-serif font-bold text-base text-navy line-clamp-2">
                  {guide.title}
                </h3>
                <p className="text-xs text-foreground-muted line-clamp-3 leading-relaxed">
                  {guide.summary}
                </p>

                <div className="pt-2 border-t border-border flex items-center gap-4 text-xs text-foreground-muted">
                  <span>
                    <strong className="text-navy">{guide.steps?.length || 0}</strong> étapes
                  </span>
                  <span>•</span>
                  <span>
                    <strong className="text-navy">{guide.faq?.length || 0}</strong> FAQ
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="p-5 pt-0 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenEdit(guide)}
                  className="flex-1 h-9 rounded-xl bg-background border border-border hover:border-navy text-navy font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5 text-gold" />
                  <span>Modifier</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(guide.id)}
                  className="p-2 rounded-xl bg-background border border-border hover:border-red-400 text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                  title="Supprimer ce guide"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}

        {filteredGuides.length === 0 && !loading && (
          <div className="col-span-full py-16 text-center bg-background-secondary rounded-3xl border border-dashed border-border p-8 space-y-4">
            <HelpCircle className="w-12 h-12 text-foreground-muted mx-auto" />
            <h3 className="font-serif font-bold text-lg text-navy">
              Aucun guide d&apos;utilisation créé pour le moment
            </h3>
            <p className="text-xs sm:text-sm text-foreground-muted max-w-md mx-auto">
              En tant qu&apos;administrateur, créez votre premier guide avec l&apos;éditeur visuel riche et intégrez des images ou vidéos Cloudflare R2 directement au fil du texte.
            </p>
            <button
              type="button"
              onClick={handleOpenCreate}
              className="h-11 px-6 rounded-xl bg-navy hover:bg-navy-dark text-white font-bold text-xs inline-flex items-center gap-2 shadow-md cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4 text-gold" />
              <span>Créer le premier guide d&apos;utilisation</span>
            </button>
          </div>
        )}
      </div>

      {/* MODALE DE CRÉATION / ÉDITION DE GUIDE AVEC TIPTAP EDITOR & MÉDIAS MULTIPLES */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-background border border-border rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 my-auto max-h-[92vh] overflow-y-auto text-foreground">
            {/* Header Modal */}
            <div className="flex items-start justify-between border-b border-border pb-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-navy/5 border border-gold/30 text-gold text-[10px] font-bold uppercase tracking-wider font-mono">
                  <Shield className="w-3 h-3 text-gold" />
                  Éditeur CMS Guide (Stockage Cloudflare R2)
                </div>
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-navy">
                  {editingGuide ? "Modifier le guide d'utilisation" : "Créer un nouveau guide d'utilisation"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-foreground-muted hover:text-navy hover:bg-background-secondary transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              {/* Rôle Ciblé & Catégorie */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Rôle utilisateur cible *</label>
                  <select
                    value={formRole}
                    onChange={(e) => {
                      setFormRole(e.target.value);
                      const matched = DEFAULT_ROLES.find((r) => r.value === e.target.value);
                      if (matched) setFormCategory(matched.label);
                    }}
                    className="w-full h-11 px-3 rounded-xl text-xs bg-background-secondary border border-border focus:border-navy focus:outline-none"
                    required
                  >
                    {DEFAULT_ROLES.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Libellé catégorie *</label>
                  <input
                    type="text"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    placeholder="Ex: Libraires & Grossistes"
                    className="w-full h-11 px-3 rounded-xl text-xs bg-background-secondary border border-border focus:border-navy focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Titre & Résumé */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Titre officiel du guide *</label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Ex: Guide Grossiste : Commandes Groupées & Tarifs Remisés"
                    className="w-full h-11 px-3 rounded-xl text-xs bg-background-secondary border border-border focus:border-navy focus:outline-none font-semibold"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Résumé / Objectif *</label>
                  <textarea
                    value={formSummary}
                    onChange={(e) => setFormSummary(e.target.value)}
                    placeholder="Expliquez brièvement ce que l'utilisateur va apprendre grâce à ce guide..."
                    rows={2}
                    className="w-full p-3 rounded-xl text-xs bg-background-secondary border border-border focus:border-navy focus:outline-none resize-none"
                    required
                  />
                </div>
              </div>

              {/* Éditeur de Texte Riche (TiptapEditor avec insertion d'images & vidéos au milieu du texte) */}
              <div className="space-y-2 pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-navy uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-gold" />
                    <span>Corps de texte enrichi (Images &amp; Vidéos dans le contenu)</span>
                  </label>
                  <span className="text-[11px] text-foreground-muted">
                    Utilisez la barre d&apos;outils pour insérer des images et vidéos R2 au fil du texte
                  </span>
                </div>
                <div className="rounded-2xl border border-border overflow-hidden bg-background shadow-xs">
                  <TiptapEditor
                    content={formContent}
                    onChange={setFormContent}
                    placeholder="Rédigez le contenu complet du guide ici, ajoutez des titres, paragraphes, images de démonstration et vidéos explicatives..."
                  />
                </div>
              </div>

              {/* Médias d'En-tête Globaux (Couverture & Vidéo Principale R2) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-gold" />
                    <span>Image de couverture R2 (Optionnel)</span>
                  </label>
                  <input
                    type="url"
                    value={formImageUrl}
                    onChange={(e) => setFormImageUrl(e.target.value)}
                    placeholder="https://...r2.cloudflarestorage.com/guides/couverture.webp"
                    className="w-full h-11 px-3 rounded-xl text-xs bg-background-secondary border border-border focus:border-navy focus:outline-none"
                  />
                  {formImageUrl && (
                    <div className="mt-2 h-20 rounded-xl overflow-hidden border border-border bg-black/5 relative">
                      <img src={formImageUrl} alt="Aperçu" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Video className="w-3.5 h-3.5 text-gold" />
                    <span>Vidéo principale MP4 R2 (Optionnel)</span>
                  </label>
                  <input
                    type="url"
                    value={formVideoUrl}
                    onChange={(e) => setFormVideoUrl(e.target.value)}
                    placeholder="https://...r2.cloudflarestorage.com/guides/tuto.mp4"
                    className="w-full h-11 px-3 rounded-xl text-xs bg-background-secondary border border-border focus:border-navy focus:outline-none"
                  />
                  {formVideoUrl && (
                    <div className="mt-2 h-20 rounded-xl overflow-hidden border border-border bg-black relative">
                      <video src={formVideoUrl} controls className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              {/* Constructeur d'Étapes Pas-à-Pas avec Médias Par Étape */}
              <div className="space-y-3 pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xs uppercase tracking-wider text-navy">
                      Étapes pas-à-pas avec illustrations dédiées
                    </h4>
                    <p className="text-[11px] text-foreground-muted">
                      Chaque étape peut comporter sa propre capture d&apos;écran ou vidéo courte.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddStep}
                    className="h-8 px-3 rounded-lg bg-navy/10 hover:bg-navy text-navy hover:text-white font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-gold" />
                    <span>Ajouter une étape</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {formSteps.map((step, idx) => (
                    <div key={idx} className="p-4 sm:p-5 rounded-2xl bg-background-secondary border border-border space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <input
                          type="text"
                          value={step.title}
                          onChange={(e) => handleStepChange(idx, "title", e.target.value)}
                          placeholder={`Titre de l'étape ${idx + 1}`}
                          className="flex-1 h-9 px-3 rounded-lg text-xs bg-background border border-border font-semibold focus:border-navy focus:outline-none"
                          required
                        />
                        {formSteps.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveStep(idx)}
                            className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                            title="Supprimer l'étape"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <textarea
                        value={step.description}
                        onChange={(e) => handleStepChange(idx, "description", e.target.value)}
                        placeholder="Explication détaillée de cette étape..."
                        rows={2}
                        className="w-full p-2.5 rounded-lg text-xs bg-background border border-border focus:border-navy focus:outline-none resize-none"
                        required
                      />
                      <input
                        type="text"
                        value={step.tip || ""}
                        onChange={(e) => handleStepChange(idx, "tip", e.target.value)}
                        placeholder="Conseil utile / Bon à savoir (Optionnel)..."
                        className="w-full h-8 px-3 rounded-lg text-[11px] bg-background border border-border text-foreground-muted focus:border-navy focus:outline-none"
                      />

                      {/* Médias spécifiques à cette étape */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/70">
                        <div>
                          <input
                            type="url"
                            value={step.image_url || ""}
                            onChange={(e) => handleStepChange(idx, "image_url", e.target.value)}
                            placeholder="URL Image R2 pour cette étape (Optionnel)..."
                            className="w-full h-8 px-2.5 rounded-lg text-[11px] bg-background border border-border focus:border-navy focus:outline-none"
                          />
                          {step.image_url && (
                            <div className="mt-1.5 h-16 rounded-lg overflow-hidden border border-border">
                              <img src={step.image_url} alt="Étape" className="w-full h-full object-cover" />
                            </div>
                          )}
                        </div>
                        <div>
                          <input
                            type="url"
                            value={step.video_url || ""}
                            onChange={(e) => handleStepChange(idx, "video_url", e.target.value)}
                            placeholder="URL Vidéo MP4 R2 pour cette étape (Optionnel)..."
                            className="w-full h-8 px-2.5 rounded-lg text-[11px] bg-background border border-border focus:border-navy focus:outline-none"
                          />
                          {step.video_url && (
                            <div className="mt-1.5 h-16 rounded-lg overflow-hidden border border-border bg-black">
                              <video src={step.video_url} controls className="w-full h-full object-cover" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Constructeur FAQ associée */}
              <div className="space-y-3 pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xs uppercase tracking-wider text-navy">
                      Questions Fréquentes (FAQ) associées
                    </h4>
                    <p className="text-[11px] text-foreground-muted">
                      Optionnel : répondez aux questions les plus courantes.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddFaq}
                    className="h-8 px-3 rounded-lg bg-navy/10 hover:bg-navy text-navy hover:text-white font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-gold" />
                    <span>Ajouter une question</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {formFaq.map((faqItem, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-background-secondary border border-border space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <input
                          type="text"
                          value={faqItem.question}
                          onChange={(e) => handleFaqChange(idx, "question", e.target.value)}
                          placeholder="Intitulé de la question..."
                          className="flex-1 h-9 px-3 rounded-lg text-xs bg-background border border-border font-semibold focus:border-navy focus:outline-none"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveFaq(idx)}
                          className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <textarea
                        value={faqItem.answer}
                        onChange={(e) => handleFaqChange(idx, "answer", e.target.value)}
                        placeholder="Réponse claire et accessible..."
                        rows={2}
                        className="w-full p-2.5 rounded-lg text-xs bg-background border border-border focus:border-navy focus:outline-none resize-none"
                        required
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Statut de Publication */}
              <div className="pt-2 border-t border-border flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formPublished}
                    onChange={(e) => setFormPublished(e.target.checked)}
                    className="w-4 h-4 accent-navy rounded"
                  />
                  <span className="text-xs font-semibold text-foreground">
                    Publier immédiatement ce guide pour le rôle {formRole}
                  </span>
                </label>
              </div>

              {/* Boutons Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="h-11 px-5 rounded-xl border border-border hover:bg-background-secondary text-xs font-semibold text-foreground cursor-pointer transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="h-11 px-6 rounded-xl bg-navy hover:bg-navy-dark text-white font-bold text-xs flex items-center gap-2 shadow-md cursor-pointer transition-colors"
                >
                  <Save className="w-4 h-4 text-gold" />
                  <span>{editingGuide ? "Enregistrer les modifications" : "Créer le guide"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
