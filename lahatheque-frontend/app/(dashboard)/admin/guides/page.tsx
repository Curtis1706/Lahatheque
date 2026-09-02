"use client";

import React, { useState, useEffect, useMemo, useRef, Suspense } from "react";
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
  FileText,
  FolderPlus,
  Folder,
  ChevronRight,
  Book,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

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

function AdminGuidesMainContent() {
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

  // Modale Catégorie
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [categoryTitle, setCategoryTitle] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");
  const [categoryRole, setCategoryRole] = useState("student");
  const [categoryOrder, setCategoryOrder] = useState<number>(0);
  const [categoryActive, setCategoryActive] = useState(true);

  const articleRefs = useRef<{ [key: string]: HTMLElement | null }>({});

  // Charger les guides directement depuis la base de données PostgreSQL
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

  // Articles pour le rôle actuellement sélectionné issus de PostgreSQL
  const currentRoleArticles = useMemo(() => {
    return guides.filter((g) => g.target_role === selectedRoleTab);
  }, [guides, selectedRoleTab]);

  // Regroupement par catégorie 100% basé sur les données PostgreSQL
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
        (a.content && a.content.toLowerCase().includes(q))
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

  // Suppression d'un Article dans PostgreSQL
  const handleDeleteArticle = async (id: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet article de guide ?")) return;
    try {
      await fetch(`/api/v1/communications/guides/${id}/`, { method: "DELETE" });
      setGuides((prev) => prev.filter((g) => g.id !== id));
      toast.success("Article supprimé de la base de données.");
    } catch {
      toast.error("Échec de la suppression de l'article.");
    }
  };

  // Suppression d'une catégorie entière dans PostgreSQL
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

    toast.success(`Catégorie "${catName}" et articles associés supprimés.`);
  };

  // Modale Catégorie
  const handleOpenCreateCategory = () => {
    setEditingCategory(null);
    setCategoryTitle("");
    setCategoryDescription("");
    setCategoryRole(selectedRoleTab);
    setCategoryOrder(currentCategoryNames.length);
    setCategoryActive(true);
    setIsCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (catName: string) => {
    setEditingCategory(catName);
    setCategoryTitle(catName);
    setCategoryDescription("");
    setCategoryRole(selectedRoleTab);
    setCategoryOrder(0);
    setCategoryActive(true);
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryTitle.trim()) {
      toast.error("Veuillez saisir le titre de la catégorie.");
      return;
    }

    const trimmedTitle = categoryTitle.trim();

    if (editingCategory) {
      // Renommer la catégorie sur tous les articles existants en base PostgreSQL
      const affected = currentRoleArticles.filter((g) => g.category_label === editingCategory);
      for (const art of affected) {
        try {
          await fetch(`/api/v1/communications/guides/${art.id}/`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ category_label: trimmedTitle }),
          });
        } catch {}
      }

      setGuides((prev) =>
        prev.map((g) =>
          g.target_role === selectedRoleTab && g.category_label === editingCategory
            ? { ...g, category_label: trimmedTitle }
            : g
        )
      );
      toast.success(`Catégorie renommée en "${trimmedTitle}".`);
      setIsCategoryModalOpen(false);
    } else {
      setIsCategoryModalOpen(false);
      // Redirige directement vers l'éditeur pour rédiger le premier article de cette catégorie en base
      router.push(
        `/admin/guides/editor?category=${encodeURIComponent(
          trimmedTitle
        )}&role=${categoryRole}`
      );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* ─── 1. EN-TÊTE ADMIN AVEC SÉLECTEUR DE MODE (Screenshot 2 & 3) ─── */}
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

        {/* Actions & Commutateur de Mode */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <Link
            href="/admin/guide"
            className="h-9 px-3.5 rounded-xl bg-background-secondary border border-border hover:border-gold text-navy font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
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

      {/* ─── 2. ONGLETS DES PROFILS / PERSONAS ─── */}
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

      {/* ─── 3. VUE PRINCIPALE (LECTURE OU ÉDITION) ─── */}
      {viewMode === "read" ? (
        /* ══════════════════════════════════════════════════════════════════════════
           MODE LECTURE : Table des matières à gauche + Articles à droite (Screenshot 2)
           ══════════════════════════════════════════════════════════════════════════ */
        currentRoleArticles.length === 0 && !loading ? (
          <div className="py-16 text-center bg-background-secondary rounded-3xl border border-dashed border-border p-8 space-y-4 max-w-xl mx-auto">
            <HelpCircle className="w-12 h-12 text-foreground-muted mx-auto" />
            <h3 className="font-serif font-bold text-lg text-navy">
              Aucun article rédigé pour le profil {DEFAULT_ROLES.find((r) => r.value === selectedRoleTab)?.label}
            </h3>
            <p className="text-xs sm:text-sm text-foreground-muted leading-relaxed">
              Basculez en mode <strong>Édition</strong> pour créer vos premières catégories et rédiger les articles.
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
                {Array.from(currentCategoriesMap.entries()).map(([categoryHeading, catArticles]) => (
                  <div key={categoryHeading} className="space-y-2">
                    <h3 className="text-xs font-bold text-navy uppercase tracking-wider">
                      {categoryHeading}
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

              {/* Flux des articles par catégorie */}
              <div className="space-y-10">
                {Array.from(currentCategoriesMap.entries()).map(([categoryHeading, catArticles]) => {
                  const categoryFiltered = catArticles.filter((art) =>
                    filteredRoleArticles.some((f) => f.id === art.id)
                  );
                  if (categoryFiltered.length === 0) return null;

                  return (
                    <section key={categoryHeading} className="space-y-6">
                      <div className="border-b-2 border-navy/10 pb-2">
                        <h3 className="font-serif text-xl font-bold text-navy">
                          {categoryHeading}
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
                            </div>

                            {/* Contenu Enrichi Tiptap (contenant texte, images et vidéos R2) */}
                            {art.content && (
                              <div
                                className="tiptap-content text-xs sm:text-sm text-foreground-muted leading-relaxed space-y-3 [&_img]:rounded-2xl [&_img]:border [&_img]:border-border [&_img]:my-4 [&_video]:rounded-2xl [&_video]:border [&_video]:border-border [&_video]:my-4 [&_video]:w-full [&_video]:max-w-2xl [&_h2]:text-navy [&_h2]:font-bold [&_h2]:text-base [&_h3]:text-navy [&_h3]:font-bold [&_h3]:text-sm [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
                                dangerouslySetInnerHTML={{ __html: art.content }}
                              />
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
           MODE ÉDITION : Arborescence des catégories et articles CRUD (Screenshot 2/3)
           ══════════════════════════════════════════════════════════════════════════ */
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-xl font-bold text-navy">
                Arborescence des guides ({DEFAULT_ROLES.find((r) => r.value === selectedRoleTab)?.label})
              </h2>
              <p className="text-xs text-foreground-muted">
                Gérez les catégories et ajoutez des articles dans l&apos;éditeur dédié.
              </p>
            </div>
            <Link
              href={`/admin/guides/editor?role=${selectedRoleTab}&category=${encodeURIComponent(
                currentCategoryNames[0] || "Mon compte et connexion"
              )}`}
              className="h-10 px-4 rounded-xl bg-navy hover:bg-navy-dark text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 text-gold" />
              <span>Ajouter un article</span>
            </Link>
          </div>

          {currentCategoryNames.length === 0 ? (
            <div className="py-16 text-center bg-background-secondary rounded-3xl border border-dashed border-border p-8 space-y-4 max-w-xl mx-auto">
              <FolderPlus className="w-12 h-12 text-foreground-muted mx-auto" />
              <h3 className="font-serif font-bold text-lg text-navy">
                Aucune catégorie créée pour ce profil
              </h3>
              <p className="text-xs sm:text-sm text-foreground-muted leading-relaxed">
                Créez votre première catégorie (ex: &quot;Mon compte et connexion&quot;) pour commencer à structurer les articles.
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
              {Array.from(currentCategoriesMap.entries()).map(([categoryHeading, catArticles]) => (
                <div
                  key={categoryHeading}
                  className="bg-background-secondary rounded-3xl border border-border p-5 sm:p-6 space-y-4 shadow-xs"
                >
                  {/* Ligne d'en-tête de la Catégorie (Screenshot 2) */}
                  <div className="flex items-center justify-between gap-4 border-b border-border pb-3">
                    <div className="flex items-center gap-3">
                      <Folder className="w-5 h-5 text-gold shrink-0" />
                      <div>
                        <h3 className="font-serif font-bold text-base text-navy">
                          {categoryHeading}
                        </h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-navy/10 text-navy uppercase font-mono">
                          {selectedRoleTab}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/guides/editor?role=${selectedRoleTab}&category=${encodeURIComponent(
                          categoryHeading
                        )}`}
                        className="p-2 rounded-xl bg-background border border-border hover:border-navy text-navy font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                        title="Ajouter un article dans cette catégorie"
                      >
                        <Plus className="w-4 h-4 text-gold" />
                        <span className="hidden sm:inline">Ajouter article</span>
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleOpenEditCategory(categoryHeading)}
                        className="p-2 rounded-xl bg-background border border-border hover:border-navy text-foreground-muted hover:text-navy transition-colors cursor-pointer"
                        title="Renommer la catégorie"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(categoryHeading)}
                        className="p-2 rounded-xl bg-background border border-border hover:border-red-400 text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                        title="Supprimer la catégorie et ses articles"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Liste des articles dans la catégorie */}
                  <div className="space-y-2 pl-2 sm:pl-4">
                    {catArticles.length === 0 ? (
                      <div className="p-5 rounded-2xl bg-background border border-dashed border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                        <div>
                          <p className="text-xs font-semibold text-navy">
                            Aucun article dans cette catégorie pour le moment
                          </p>
                          <p className="text-[11px] text-foreground-muted">
                            Rédigez le premier article pour alimenter cette section du guide.
                          </p>
                        </div>
                        <Link
                          href={`/admin/guides/editor?role=${selectedRoleTab}&category=${encodeURIComponent(
                            categoryHeading
                          )}`}
                          className="h-8 px-3 rounded-xl bg-navy hover:bg-navy-dark text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-2xs transition-colors shrink-0"
                        >
                          <Plus className="w-3.5 h-3.5 text-gold" />
                          <span>Rédiger un article</span>
                        </Link>
                      </div>
                    ) : (
                      catArticles.map((art, aIdx) => (
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
                            <Link
                              href={`/admin/guides/editor?id=${art.id}`}
                              className="p-2 rounded-lg hover:bg-background-secondary text-foreground-muted hover:text-navy transition-colors cursor-pointer"
                              title="Modifier l'article"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Link>
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
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── MODALE NOUVELLE CATÉGORIE (Exact Screenshot 2) ─── */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="bg-background border border-border rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-serif font-bold text-lg text-navy">
                {editingCategory ? "Modifier la catégorie" : "Nouvelle catégorie"}
              </h3>
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
                <label className="text-xs font-bold uppercase tracking-wider text-navy font-mono">
                  TITRE DE LA CATÉGORIE *
                </label>
                <input
                  type="text"
                  value={categoryTitle}
                  onChange={(e) => setCategoryTitle(e.target.value)}
                  placeholder="Ex: Mon compte et connexion"
                  className="w-full h-11 px-3.5 rounded-xl text-xs sm:text-sm bg-background-secondary border border-border focus:border-navy focus:outline-none font-medium"
                  required
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-navy font-mono">
                  DESCRIPTION (OPTIONNELLE)
                </label>
                <textarea
                  value={categoryDescription}
                  onChange={(e) => setCategoryDescription(e.target.value)}
                  placeholder="Aide pour se connecter, gérer son profil..."
                  rows={2}
                  className="w-full p-3 rounded-xl text-xs sm:text-sm bg-background-secondary border border-border focus:border-navy focus:outline-none resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-navy font-mono">
                  RÔLES CIBLES
                </label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {DEFAULT_ROLES.map((r) => {
                    const isSelected = categoryRole === r.value;
                    return (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setCategoryRole(r.value)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer border ${
                          isSelected
                            ? "bg-gold text-navy border-gold shadow-xs"
                            : "bg-background-secondary text-foreground-muted border-border hover:border-gold/50"
                        }`}
                      >
                        {r.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-navy font-mono">
                    ORDRE
                  </label>
                  <input
                    type="number"
                    value={categoryOrder}
                    onChange={(e) => setCategoryOrder(parseInt(e.target.value, 10) || 0)}
                    className="w-full h-10 px-3 rounded-xl text-xs bg-background-secondary border border-border focus:border-navy focus:outline-none"
                    min={0}
                  />
                </div>

                <div className="space-y-1.5 flex flex-col justify-end pb-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={categoryActive}
                      onChange={(e) => setCategoryActive(e.target.checked)}
                      className="w-4 h-4 accent-navy rounded"
                    />
                    <span className="text-xs font-semibold text-foreground">Active</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="h-10 px-4 rounded-xl border border-border hover:bg-background-secondary text-xs font-semibold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="h-10 px-5 rounded-xl bg-navy hover:bg-navy-dark text-white font-bold text-xs shadow-xs cursor-pointer"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminGuidesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-foreground-muted">Chargement...</div>}>
      <AdminGuidesMainContent />
    </Suspense>
  );
}
