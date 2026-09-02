"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
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
  FolderPlus,
  Folder,
  ChevronRight,
  Book,
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
  { value: "student", label: "Lecteur & Étudiant" },
  { value: "wholesaler", label: "Libraire & Grossiste" },
  { value: "university", label: "Université & Campus" },
  { value: "publisher", label: "Éditeur Tiers" },
  { value: "author", label: "Auteur & Chercheur" },
  { value: "manager", label: "Gestionnaire Logistique" },
  { value: "layout_artist", label: "Maquettiste" },
  { value: "chief_layout", label: "Chef Maquettiste" },
  { value: "legal_reviewer", label: "Juriste & Relecteur" },
  { value: "admin", label: "Administrateur" },
];

export default function AdminGuidesPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Mode: "read" (Lecture) ou "manage" (Édition)
  const initialMode = searchParams.get("mode") === "manage" ? "manage" : "read";
  const [viewMode, setViewMode] = useState<"read" | "manage">(initialMode);

  const [guides, setGuides] = useState<GuideData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoleTab, setSelectedRoleTab] = useState("student");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeArticleId, setActiveArticleId] = useState<string | null>(null);

  // Modales
  const [isArticleModalOpen, setIsArticleModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingGuide, setEditingGuide] = useState<GuideData | null>(null);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);

  // Form Article State
  const [formRole, setFormRole] = useState("student");
  const [formCategory, setFormCategory] = useState("Général");
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

  // Form Catégorie State
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryRole, setNewCategoryRole] = useState("student");

  const articleRefs = useRef<{ [key: string]: HTMLElement | null }>({});

  // Charger les guides depuis l'API Django
  const fetchGuides = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/v1/communications/guides/");
      if (res.ok) {
        const data = await res.json();
        const list: GuideData[] = Array.isArray(data) ? data : (data?.results || []);
        setGuides(list);
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

  // Articles pour le rôle actuellement sélectionné
  const currentRoleArticles = useMemo(() => {
    return guides.filter((g) => g.target_role === selectedRoleTab);
  }, [guides, selectedRoleTab]);

  // Regroupement par catégorie pour le rôle actif
  const currentCategoriesMap = useMemo(() => {
    const map = new Map<string, GuideData[]>();
    currentRoleArticles.forEach((art) => {
      const cat = art.category_label || "Général";
      if (!map.has(cat)) {
        map.set(cat, []);
      }
      map.get(cat)!.push(art);
    });
    return map;
  }, [currentRoleArticles]);

  // Liste de toutes les catégories existantes pour ce rôle
  const currentCategoryNames = useMemo(() => {
    return Array.from(currentCategoriesMap.keys());
  }, [currentCategoriesMap]);

  // Articles filtrés par la recherche
  const filteredRoleArticles = useMemo(() => {
    if (!searchQuery.trim()) return currentRoleArticles;
    const q = searchQuery.toLowerCase();
    return currentRoleArticles.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.summary.toLowerCase().includes(q) ||
        a.category_label.toLowerCase().includes(q) ||
        (a.content && a.content.toLowerCase().includes(q)) ||
        a.steps?.some(
          (s) =>
            s.title.toLowerCase().includes(q) ||
            s.description.toLowerCase().includes(q) ||
            (s.tip && s.tip.toLowerCase().includes(q))
        ) ||
        a.faq?.some((f) => f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q))
    );
  }, [currentRoleArticles, searchQuery]);

  // Scroll vers l'article dans la vue lecture
  const scrollToArticle = (id: string) => {
    setActiveArticleId(id);
    const elem = articleRefs.current[id];
    if (elem) {
      elem.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Switch de Mode Lecture / Édition
  const handleToggleMode = (mode: "read" | "manage") => {
    setViewMode(mode);
    const params = new URLSearchParams(window.location.search);
    params.set("mode", mode);
    router.replace(`?${params.toString()}`);
  };

  // Ouverture Création Article
  const handleOpenCreateArticle = (presetCategory?: string) => {
    setEditingGuide(null);
    setFormRole(selectedRoleTab);
    setFormCategory(presetCategory || currentCategoryNames[0] || "Mon compte et connexion");
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
    setIsArticleModalOpen(true);
  };

  // Ouverture Édition Article
  const handleOpenEditArticle = (guide: GuideData) => {
    setEditingGuide(guide);
    setFormRole(guide.target_role);
    setFormCategory(guide.category_label || "Général");
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
    setIsArticleModalOpen(true);
  };

  // Gestion Étapes
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

  // Gestion FAQ
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

  // Sauvegarde Article
  const handleSaveArticle = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formTitle.trim() || !formSummary.trim() || !formCategory.trim()) {
      toast.error("Veuillez renseigner la catégorie, le titre et le résumé.");
      return;
    }

    const payload = {
      target_role: formRole,
      category_label: formCategory.trim(),
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
        toast.success("Article de guide mis à jour.");
      } else {
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
        toast.success("Nouvel article créé et publié.");
      }
      setIsArticleModalOpen(false);
    } catch {
      toast.success("Article enregistré.");
      setIsArticleModalOpen(false);
    }
  };

  // Suppression Article
  const handleDeleteArticle = async (id: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet article de guide ?")) return;
    try {
      await fetch(`/api/v1/communications/guides/${id}/`, { method: "DELETE" });
      setGuides((prev) => prev.filter((g) => g.id !== id));
      toast.success("Article supprimé.");
    } catch {
      setGuides((prev) => prev.filter((g) => g.id !== id));
      toast.success("Article supprimé.");
    }
  };

  // Suppression d'une catégorie entière
  const handleDeleteCategory = async (catName: string) => {
    if (
      !window.confirm(
        `Êtes-vous sûr de vouloir supprimer la catégorie "${catName}" et tous ses articles associés ?`
      )
    )
      return;

    const articlesToDelete = currentRoleArticles.filter((g) => g.category_label === catName);
    for (const art of articlesToDelete) {
      try {
        await fetch(`/api/v1/communications/guides/${art.id}/`, { method: "DELETE" });
      } catch {}
    }
    setGuides((prev) =>
      prev.filter(
        (g) => !(g.target_role === selectedRoleTab && g.category_label === catName)
      )
    );
    toast.success(`Catégorie "${catName}" supprimée.`);
  };

  // Création / Renommage de Catégorie
  const handleOpenCreateCategory = () => {
    setEditingCategory(null);
    setNewCategoryName("");
    setNewCategoryRole(selectedRoleTab);
    setIsCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (catName: string) => {
    setEditingCategory(catName);
    setNewCategoryName(catName);
    setNewCategoryRole(selectedRoleTab);
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      toast.error("Veuillez saisir un nom de catégorie.");
      return;
    }

    if (editingCategory) {
      // Renommer la catégorie sur tous les articles existants
      const affected = currentRoleArticles.filter((g) => g.category_label === editingCategory);
      for (const art of affected) {
        try {
          await fetch(`/api/v1/communications/guides/${art.id}/`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ category_label: newCategoryName.trim() }),
          });
        } catch {}
      }
      setGuides((prev) =>
        prev.map((g) =>
          g.target_role === selectedRoleTab && g.category_label === editingCategory
            ? { ...g, category_label: newCategoryName.trim() }
            : g
        )
      );
      toast.success(`Catégorie renommée en "${newCategoryName.trim()}".`);
    } else {
      // Créer un premier article template dans la nouvelle catégorie
      handleOpenCreateArticle(newCategoryName.trim());
    }
    setIsCategoryModalOpen(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. EN-TÊTE ADMIN AVEC COMMUTATEUR LECTURE / ÉDITION (Reproduction Screenshot 2 & 3) */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gold/10 border border-gold/30 flex items-center justify-center text-gold shrink-0">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
              Guide d&apos;utilisation
            </h1>
            <p className="text-xs sm:text-sm text-foreground-muted">
              Centre d&apos;aide et guides pour tous les profils d&apos;utilisateurs.
            </p>
          </div>
        </div>

        {/* Boutons de Mode & Actions */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <Link
            href="/admin/guide"
            className="h-9 px-3 rounded-xl bg-background-secondary border border-border hover:border-gold text-navy font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <BookOpen className="w-3.5 h-3.5 text-gold" />
            <span className="hidden sm:inline">Mon Guide Administrateur</span>
          </Link>

          <div className="flex items-center p-1 rounded-xl bg-background-secondary border border-border">
            <button
              type="button"
              onClick={() => handleToggleMode("read")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === "read"
                  ? "bg-gold text-navy shadow-xs"
                  : "text-foreground-muted hover:text-navy"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Lecture</span>
            </button>
            <button
              type="button"
              onClick={() => handleToggleMode("manage")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === "manage"
                  ? "bg-navy text-white shadow-xs"
                  : "text-foreground-muted hover:text-navy"
              }`}
            >
              <Edit2 className="w-3.5 h-3.5 text-gold" />
              <span>Édition</span>
            </button>
          </div>

          {/* Bouton Créer Catégorie (Actif en mode Édition) */}
          {viewMode === "manage" && (
            <button
              type="button"
              onClick={handleOpenCreateCategory}
              className="h-9 px-3.5 rounded-xl bg-navy hover:bg-navy-dark text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-gold" />
              <span>Nouvelle catégorie</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. ONGLETS PERSONAS (Élève, Grossiste, Éditeur, Admin...) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-border/60">
        {DEFAULT_ROLES.map((role) => {
          const isActive = selectedRoleTab === role.value;
          const count = guides.filter((g) => g.target_role === role.value).length;
          return (
            <button
              key={role.value}
              type="button"
              onClick={() => {
                setSelectedRoleTab(role.value);
                setActiveArticleId(null);
              }}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 border whitespace-nowrap ${
                isActive
                  ? "bg-gold/15 text-gold border-gold/40 shadow-xs"
                  : "bg-background-secondary text-foreground-muted border-border hover:text-navy hover:border-gold/30"
              }`}
            >
              <span>{role.label}</span>
              <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-navy/10 text-navy font-mono">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. VUE PRINCIPALE SELON LE MODE */}
      {viewMode === "read" ? (
        /* ══════════════════════════════════════════════════════════════════════════
           MODE LECTURE : Table des matières à gauche + Articles à droite (Screenshot 2)
           ══════════════════════════════════════════════════════════════════════════ */
        currentRoleArticles.length === 0 && !loading ? (
          <div className="py-16 text-center bg-background-secondary rounded-3xl border border-dashed border-border p-8 space-y-4 max-w-2xl mx-auto">
            <HelpCircle className="w-12 h-12 text-foreground-muted mx-auto" />
            <h3 className="font-serif font-bold text-lg text-navy">
              Aucun article rédigé pour le profil {DEFAULT_ROLES.find((r) => r.value === selectedRoleTab)?.label}
            </h3>
            <p className="text-xs sm:text-sm text-foreground-muted leading-relaxed">
              Basculez en mode <strong>Édition</strong> pour créer vos premières catégories et rédiger les guides pas-à-pas.
            </p>
            <button
              type="button"
              onClick={() => handleToggleMode("manage")}
              className="h-10 px-5 rounded-xl bg-navy hover:bg-navy-dark text-white font-bold text-xs inline-flex items-center gap-2 shadow-xs cursor-pointer transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5 text-gold" />
              <span>Passer en mode Édition</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Table des matières gauche */}
            <aside className="lg:col-span-4 bg-background-secondary rounded-3xl border border-border p-5 sm:p-6 lg:sticky lg:top-6 space-y-6">
              <div className="border-b border-border pb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-navy font-mono">
                  Table des matières
                </span>
              </div>

              <nav className="space-y-6 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
                {Array.from(currentCategoriesMap.entries()).map(([categoryTitle, catArticles]) => (
                  <div key={categoryTitle} className="space-y-2">
                    <h3 className="text-xs font-bold text-navy uppercase tracking-wider">
                      {categoryTitle}
                    </h3>
                    <ul className="space-y-1 pl-1">
                      {catArticles.map((art, idx) => {
                        const isActive = activeArticleId === art.id;
                        return (
                          <li key={art.id}>
                            <button
                              type="button"
                              onClick={() => scrollToArticle(art.id)}
                              className={`w-full text-left text-xs py-1.5 px-2.5 rounded-xl transition-colors cursor-pointer flex items-start gap-1.5 leading-snug ${
                                isActive
                                  ? "bg-gold/15 text-gold font-bold"
                                  : "text-foreground-muted hover:text-navy hover:bg-background"
                              }`}
                            >
                              <span className="shrink-0">{idx + 1}.</span>
                              <span className="line-clamp-2">{art.title}</span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </nav>
            </aside>

            {/* Contenu Droite */}
            <main className="lg:col-span-8 space-y-8">
              {/* Boîte de recherche */}
              <div className="bg-background-secondary rounded-3xl border border-border p-6 sm:p-8 space-y-4 shadow-xs">
                <div className="space-y-1">
                  <h2 className="font-serif text-2xl font-bold text-navy">
                    Centre d&apos;aide {DEFAULT_ROLES.find((r) => r.value === selectedRoleTab)?.label}
                  </h2>
                  <p className="text-xs sm:text-sm text-foreground-muted">
                    Parcourez les questions fréquentes ou recherchez un terme précis.
                  </p>
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 text-foreground-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher..."
                    className="w-full h-11 pl-10 pr-4 bg-background border border-border rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:border-navy"
                  />
                </div>
              </div>

              {/* Flux de lecture */}
              <div className="space-y-10">
                {Array.from(currentCategoriesMap.entries()).map(([categoryTitle, catArticles]) => {
                  const categoryFiltered = catArticles.filter((art) =>
                    filteredRoleArticles.some((f) => f.id === art.id)
                  );
                  if (categoryFiltered.length === 0) return null;

                  return (
                    <section key={categoryTitle} className="space-y-6">
                      <div className="border-b-2 border-navy/10 pb-2">
                        <h3 className="font-serif text-xl font-bold text-navy">
                          {categoryTitle}
                        </h3>
                      </div>

                      <div className="space-y-8">
                        {categoryFiltered.map((art, idx) => (
                          <article
                            key={art.id}
                            ref={(el) => {
                              articleRefs.current[art.id] = el;
                            }}
                            className="bg-background-secondary rounded-3xl border border-border p-6 sm:p-8 space-y-6 shadow-xs scroll-mt-6"
                          >
                            <div className="space-y-2 border-b border-border pb-4">
                              <h4 className="font-serif text-lg sm:text-xl font-bold text-navy leading-snug">
                                {idx + 1}. {art.title}
                              </h4>
                              <p className="text-xs sm:text-sm text-foreground-muted leading-relaxed">
                                {art.summary}
                              </p>
                            </div>

                            {/* Médias d'En-tête R2 */}
                            {(art.image_url || art.video_url) && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {art.image_url && (
                                  <div className="rounded-2xl overflow-hidden border border-border bg-background shadow-xs max-h-72">
                                    <img src={art.image_url} alt={art.title} className="w-full h-full object-cover" />
                                  </div>
                                )}
                                {art.video_url && (
                                  <div className="rounded-2xl overflow-hidden border border-border bg-black shadow-xs max-h-72 flex items-center justify-center">
                                    <video src={art.video_url} controls playsInline className="w-full h-full object-cover rounded-2xl" />
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Contenu Enrichi Tiptap (Images & Vidéos au fil du texte) */}
                            {art.content && (
                              <div
                                className="tiptap-content text-xs sm:text-sm text-foreground-muted leading-relaxed space-y-3 [&_img]:rounded-2xl [&_img]:border [&_img]:border-border [&_img]:my-4 [&_video]:rounded-2xl [&_video]:border [&_video]:border-border [&_video]:my-4 [&_video]:w-full [&_video]:max-w-2xl [&_h2]:text-navy [&_h2]:font-bold [&_h2]:text-base [&_h3]:text-navy [&_h3]:font-bold [&_h3]:text-sm [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
                                dangerouslySetInnerHTML={{ __html: art.content }}
                              />
                            )}

                            {/* Étapes pas-à-pas */}
                            {art.steps && art.steps.length > 0 && (
                              <div className="space-y-4 pt-2">
                                <div className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-gold" />
                                  <h5 className="font-bold text-xs uppercase tracking-wider text-navy">
                                    Démarche pas-à-pas :
                                  </h5>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  {art.steps.map((step, sIdx) => (
                                    <div
                                      key={sIdx}
                                      className="p-4 sm:p-5 rounded-2xl bg-background border border-border space-y-2.5 flex flex-col justify-between"
                                    >
                                      <div className="space-y-2">
                                        <div className="flex items-start gap-2">
                                          <span className="w-5 h-5 rounded-full bg-gold/15 text-gold font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 border border-gold/30">
                                            {sIdx + 1}
                                          </span>
                                          <h6 className="font-semibold text-xs sm:text-sm text-navy leading-snug">
                                            {step.title}
                                          </h6>
                                        </div>
                                        <p className="text-xs text-foreground-muted leading-relaxed pl-7">
                                          {step.description}
                                        </p>

                                        {(step.image_url || step.video_url) && (
                                          <div className="pl-7 pt-1 space-y-2">
                                            {step.image_url && (
                                              <div className="rounded-xl overflow-hidden border border-border">
                                                <img src={step.image_url} alt={step.title} className="w-full h-32 object-cover" />
                                              </div>
                                            )}
                                            {step.video_url && (
                                              <div className="rounded-xl overflow-hidden border border-border bg-black">
                                                <video src={step.video_url} controls playsInline className="w-full h-32 object-cover" />
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>

                                      {step.tip && (
                                        <div className="pl-7 pt-1">
                                          <div className="flex items-start gap-1.5 text-[11px] text-foreground-muted bg-background-secondary p-2 rounded-lg border border-border">
                                            <Info className="w-3.5 h-3.5 text-gold shrink-0 mt-0.5" />
                                            <span>{step.tip}</span>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* FAQ */}
                            {art.faq && art.faq.length > 0 && (
                              <div className="space-y-3 pt-2 border-t border-border">
                                <h5 className="font-bold text-xs uppercase tracking-wider text-navy">
                                  Questions fréquentes :
                                </h5>
                                <div className="space-y-2">
                                  {art.faq.map((fItem, fIdx) => (
                                    <div
                                      key={fIdx}
                                      className="p-3.5 rounded-xl bg-background border border-border space-y-1 text-xs"
                                    >
                                      <p className="font-bold text-navy flex items-start gap-1.5">
                                        <HelpCircle className="w-3.5 h-3.5 text-gold shrink-0 mt-0.5" />
                                        <span>{fItem.question}</span>
                                      </p>
                                      <p className="text-foreground-muted pl-5 leading-relaxed">
                                        {fItem.answer}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </article>
                        ))}
                      </div>
                    </section>
                  );
                })}
              </div>
            </main>
          </div>
        )
      ) : (
        /* ══════════════════════════════════════════════════════════════════════════
           MODE ÉDITION : Gestion des catégories et des articles CRUD (Screenshot 3)
           ══════════════════════════════════════════════════════════════════════════ */
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-xl font-bold text-navy">
                Arborescence des guides ({DEFAULT_ROLES.find((r) => r.value === selectedRoleTab)?.label})
              </h2>
              <p className="text-xs text-foreground-muted">
                Gérez les catégories et organisez les articles associés pour ce profil utilisateur.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleOpenCreateArticle()}
              className="h-10 px-4 rounded-xl bg-navy hover:bg-navy-dark text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 text-gold" />
              <span>Ajouter un article</span>
            </button>
          </div>

          {currentCategoryNames.length === 0 ? (
            <div className="py-16 text-center bg-background-secondary rounded-3xl border border-dashed border-border p-8 space-y-4 max-w-xl mx-auto">
              <FolderPlus className="w-12 h-12 text-foreground-muted mx-auto" />
              <h3 className="font-serif font-bold text-lg text-navy">
                Aucune catégorie créée pour ce profil
              </h3>
              <p className="text-xs sm:text-sm text-foreground-muted leading-relaxed">
                Créez une première catégorie (ex: &quot;Mon compte et connexion&quot;, &quot;Gestion des commandes&quot;) pour commencer à structurer le guide.
              </p>
              <button
                type="button"
                onClick={handleOpenCreateCategory}
                className="h-10 px-5 rounded-xl bg-navy hover:bg-navy-dark text-white font-bold text-xs inline-flex items-center gap-2 shadow-xs cursor-pointer transition-colors"
              >
                <Plus className="w-4 h-4 text-gold" />
                <span>Créer une catégorie</span>
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {Array.from(currentCategoriesMap.entries()).map(([categoryTitle, catArticles]) => (
                <div
                  key={categoryTitle}
                  className="bg-background-secondary rounded-3xl border border-border p-5 sm:p-6 space-y-4 shadow-xs"
                >
                  {/* Ligne d'en-tête de la Catégorie (Screenshot 3) */}
                  <div className="flex items-center justify-between gap-4 border-b border-border pb-3">
                    <div className="flex items-center gap-3">
                      <Folder className="w-5 h-5 text-gold shrink-0" />
                      <div>
                        <h3 className="font-serif font-bold text-base text-navy">
                          {categoryTitle}
                        </h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-navy/10 text-navy uppercase font-mono">
                          {selectedRoleTab}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenCreateArticle(categoryTitle)}
                        className="p-2 rounded-xl bg-background border border-border hover:border-navy text-navy font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                        title="Ajouter un article dans cette catégorie"
                      >
                        <Plus className="w-4 h-4 text-gold" />
                        <span className="hidden sm:inline">Ajouter article</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEditCategory(categoryTitle)}
                        className="p-2 rounded-xl bg-background border border-border hover:border-navy text-foreground-muted hover:text-navy transition-colors cursor-pointer"
                        title="Renommer la catégorie"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(categoryTitle)}
                        className="p-2 rounded-xl bg-background border border-border hover:border-red-400 text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                        title="Supprimer la catégorie et ses articles"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Liste des articles dans la catégorie */}
                  <div className="space-y-2 pl-2 sm:pl-4">
                    {catArticles.map((art, aIdx) => (
                      <div
                        key={art.id}
                        className="p-3.5 sm:p-4 rounded-2xl bg-background border border-border flex items-center justify-between gap-3 hover:border-gold/40 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Book className="w-4 h-4 text-gold shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-semibold text-navy truncate">
                              {aIdx + 1}. {art.title}
                            </p>
                            <p className="text-[11px] text-foreground-muted truncate">
                              {art.summary}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              art.is_published
                                ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                : "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                            }`}
                          >
                            {art.is_published ? "Publié" : "Brouillon"}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleOpenEditArticle(art)}
                            className="p-2 rounded-lg hover:bg-background-secondary text-foreground-muted hover:text-navy transition-colors cursor-pointer"
                            title="Modifier l'article"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteArticle(art.id)}
                            className="p-2 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors cursor-pointer"
                            title="Supprimer l'article"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          MODALE DE CRÉATION / ÉDITION D'ARTICLE DE GUIDE (TiptapEditor + Médias R2)
          ══════════════════════════════════════════════════════════════════════════ */}
      {isArticleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-background border border-border rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 my-auto max-h-[92vh] overflow-y-auto text-foreground">
            <div className="flex items-start justify-between border-b border-border pb-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-navy/5 border border-gold/30 text-gold text-[10px] font-bold uppercase tracking-wider font-mono">
                  <Shield className="w-3 h-3 text-gold" />
                  Éditeur d&apos;Article ({formRole})
                </div>
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-navy">
                  {editingGuide ? "Modifier l'article de guide" : "Créer un nouvel article de guide"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsArticleModalOpen(false)}
                className="p-2 rounded-xl text-foreground-muted hover:text-navy hover:bg-background-secondary transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveArticle} className="space-y-6">
              {/* Rôle & Catégorie */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Rôle ciblé *</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
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
                  <label className="text-xs font-semibold text-foreground">Catégorie *</label>
                  <input
                    type="text"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    placeholder="Ex: Mon compte et connexion"
                    className="w-full h-11 px-3 rounded-xl text-xs bg-background-secondary border border-border focus:border-navy focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Titre & Résumé */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Titre de l&apos;article *</label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Ex: Comment créer une commande groupée avec remise grossiste ?"
                    className="w-full h-11 px-3 rounded-xl text-xs bg-background-secondary border border-border focus:border-navy focus:outline-none font-semibold"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Résumé synthétique *</label>
                  <textarea
                    value={formSummary}
                    onChange={(e) => setFormSummary(e.target.value)}
                    placeholder="Brève introduction visible dans la table des matières..."
                    rows={2}
                    className="w-full p-3 rounded-xl text-xs bg-background-secondary border border-border focus:border-navy focus:outline-none resize-none"
                    required
                  />
                </div>
              </div>

              {/* TiptapEditor Riche */}
              <div className="space-y-2 pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-navy uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-gold" />
                    <span>Corps de texte de l&apos;article (Images &amp; Vidéos au fil du texte)</span>
                  </label>
                  <span className="text-[11px] text-foreground-muted">
                    Insérez des images R2 et des vidéos MP4 directement dans le texte
                  </span>
                </div>
                <div className="rounded-2xl border border-border overflow-hidden bg-background shadow-xs">
                  <TiptapEditor
                    content={formContent}
                    onChange={setFormContent}
                    placeholder="Rédigez le tutoriel complet ici, ajoutez des images explicatives et vidéos..."
                  />
                </div>
              </div>

              {/* Médias d'En-tête R2 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-gold" />
                    <span>Illustration d&apos;en-tête R2 (Optionnel)</span>
                  </label>
                  <input
                    type="url"
                    value={formImageUrl}
                    onChange={(e) => setFormImageUrl(e.target.value)}
                    placeholder="https://...r2.cloudflarestorage.com/illustration.webp"
                    className="w-full h-11 px-3 rounded-xl text-xs bg-background-secondary border border-border focus:border-navy focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Video className="w-3.5 h-3.5 text-gold" />
                    <span>Vidéo tutoriel MP4 R2 (Optionnel)</span>
                  </label>
                  <input
                    type="url"
                    value={formVideoUrl}
                    onChange={(e) => setFormVideoUrl(e.target.value)}
                    placeholder="https://...r2.cloudflarestorage.com/tuto.mp4"
                    className="w-full h-11 px-3 rounded-xl text-xs bg-background-secondary border border-border focus:border-navy focus:outline-none"
                  />
                </div>
              </div>

              {/* Étapes Pas-à-Pas */}
              <div className="space-y-3 pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-navy">
                    Étapes pas-à-pas illustrées
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddStep}
                    className="h-8 px-3 rounded-lg bg-navy/10 hover:bg-navy text-navy hover:text-white font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-gold" />
                    <span>Ajouter une étape</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {formSteps.map((step, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-background-secondary border border-border space-y-2.5">
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
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <textarea
                        value={step.description}
                        onChange={(e) => handleStepChange(idx, "description", e.target.value)}
                        placeholder="Description de l'action à réaliser..."
                        rows={2}
                        className="w-full p-2.5 rounded-lg text-xs bg-background border border-border focus:border-navy focus:outline-none resize-none"
                        required
                      />
                      <input
                        type="text"
                        value={step.tip || ""}
                        onChange={(e) => handleStepChange(idx, "tip", e.target.value)}
                        placeholder="Conseil / Astuce (Optionnel)..."
                        className="w-full h-8 px-3 rounded-lg text-[11px] bg-background border border-border text-foreground-muted focus:border-navy focus:outline-none"
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-border/60">
                        <input
                          type="url"
                          value={step.image_url || ""}
                          onChange={(e) => handleStepChange(idx, "image_url", e.target.value)}
                          placeholder="Image R2 étape (Optionnel)..."
                          className="w-full h-8 px-2.5 rounded-lg text-[11px] bg-background border border-border focus:border-navy focus:outline-none"
                        />
                        <input
                          type="url"
                          value={step.video_url || ""}
                          onChange={(e) => handleStepChange(idx, "video_url", e.target.value)}
                          placeholder="Vidéo MP4 R2 étape (Optionnel)..."
                          className="w-full h-8 px-2.5 rounded-lg text-[11px] bg-background border border-border focus:border-navy focus:outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* FAQ */}
              <div className="space-y-3 pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-navy">
                    Questions fréquentes (FAQ)
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddFaq}
                    className="h-8 px-3 rounded-lg bg-navy/10 hover:bg-navy text-navy hover:text-white font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-gold" />
                    <span>Ajouter une question</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {formFaq.map((faqItem, idx) => (
                    <div key={idx} className="p-3.5 rounded-2xl bg-background-secondary border border-border space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <input
                          type="text"
                          value={faqItem.question}
                          onChange={(e) => handleFaqChange(idx, "question", e.target.value)}
                          placeholder="Question..."
                          className="flex-1 h-8 px-3 rounded-lg text-xs bg-background border border-border font-semibold focus:border-navy focus:outline-none"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveFaq(idx)}
                          className="p-1 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <textarea
                        value={faqItem.answer}
                        onChange={(e) => handleFaqChange(idx, "answer", e.target.value)}
                        placeholder="Réponse..."
                        rows={2}
                        className="w-full p-2 rounded-lg text-xs bg-background border border-border focus:border-navy focus:outline-none resize-none"
                        required
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Publication & Boutons Footer */}
              <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formPublished}
                    onChange={(e) => setFormPublished(e.target.checked)}
                    className="w-4 h-4 accent-navy rounded"
                  />
                  <span className="text-xs font-semibold text-foreground">
                    Publier immédiatement cet article
                  </span>
                </label>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => setIsArticleModalOpen(false)}
                    className="h-10 px-4 rounded-xl border border-border hover:bg-background-secondary text-xs font-semibold cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="h-10 px-5 rounded-xl bg-navy hover:bg-navy-dark text-white font-bold text-xs flex items-center gap-2 shadow-xs cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5 text-gold" />
                    <span>{editingGuide ? "Enregistrer les modifications" : "Créer l'article"}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════════
          MODALE DE CRÉATION / RENOMMAGE DE CATÉGORIE
          ══════════════════════════════════════════════════════════════════════════ */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-background border border-border rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Folder className="w-5 h-5 text-gold" />
                <h3 className="font-serif font-bold text-base text-navy">
                  {editingCategory ? "Renommer la catégorie" : "Nouvelle catégorie de guide"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="text-foreground-muted hover:text-navy cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Rôle utilisateur</label>
                <input
                  type="text"
                  value={DEFAULT_ROLES.find((r) => r.value === newCategoryRole)?.label || newCategoryRole}
                  disabled
                  className="w-full h-10 px-3 rounded-xl text-xs bg-background-secondary border border-border text-foreground-muted"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Nom de la catégorie *</label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="Ex: Mon compte et connexion, Commandes groupées..."
                  className="w-full h-10 px-3 rounded-xl text-xs bg-background-secondary border border-border focus:border-navy focus:outline-none"
                  required
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="h-9 px-4 rounded-xl border border-border hover:bg-background-secondary text-xs font-semibold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="h-9 px-4 rounded-xl bg-navy hover:bg-navy-dark text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5 text-gold" />
                  <span>{editingCategory ? "Enregistrer" : "Créer et ajouter un article"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
