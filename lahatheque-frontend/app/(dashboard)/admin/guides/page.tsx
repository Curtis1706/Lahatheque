"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  HelpCircle,
  Plus,
  Edit2,
  Trash2,
  BookOpen,
  ShoppingBag,
  GraduationCap,
  Building2,
  PenTool,
  Truck,
  Shield,
  Search,
  Video,
  X,
  PlusCircle,
  FolderPlus,
  Folder,
  ChevronRight,
  Book,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

export interface GuideArticle {
  id: string;
  category: string;
  title: string;
  content: string;
  order: number;
  is_published: boolean;
  video_url?: string | null;
  stream_id?: string | null;
  image_url?: string | null;
  image_url_resolved?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface GuideCategory {
  id: string;
  title: string;
  description?: string;
  roles: string[];
  order: number;
  is_active: boolean;
  articles?: GuideArticle[];
  created_at?: string;
  updated_at?: string;
}

const ROLES = [
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
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const initialMode = searchParams.get("mode") === "manage" ? "manage" : "manage";
  const [viewMode, setViewMode] = useState<"read" | "manage">(initialMode);
  const [selectedRoleTab, setSelectedRoleTab] = useState("student");
  const [categories, setCategories] = useState<GuideCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeArticleId, setActiveArticleId] = useState<string | null>(null);

  // Modale Catégorie
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<GuideCategory | null>(null);
  const [categoryTitle, setCategoryTitle] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");
  const [categoryOrder, setCategoryOrder] = useState<number>(0);
  const [categoryActive, setCategoryActive] = useState(true);

  const articleRefs = useRef<{ [key: string]: HTMLElement | null }>({});

  // Charger les catégories et articles depuis la base PostgreSQL
  const fetchCategories = async () => {
    try {
      setLoading(true);
      console.log(`[ADMIN GUIDES UI] Récupération des catégories depuis PostgreSQL...`);
      const res = await fetch("/api/v1/admin/guides/categories/");
      if (res.ok) {
        const data = await res.json();
        const list: GuideCategory[] = Array.isArray(data) ? data : (data?.results || []);
        console.log(`[ADMIN GUIDES UI] ${list.length} catégories chargées depuis la BD:`, list);
        setCategories(list);
      } else {
        console.error(`[ADMIN GUIDES UI] Erreur HTTP ${res.status} lors du chargement`);
        toast.error("Erreur de chargement des catégories depuis la base.");
        setCategories([]);
      }
    } catch (err) {
      console.error("[ADMIN GUIDES UI] Exception fetchCategories:", err);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Catégories filtrées pour le rôle actif
  const roleCategories = useMemo(() => {
    return categories.filter((c) => Array.isArray(c.roles) && c.roles.includes(selectedRoleTab));
  }, [categories, selectedRoleTab]);

  // Tous les articles pour le rôle actif
  const allRoleArticles = useMemo(() => {
    return roleCategories.flatMap((c) => c.articles || []);
  }, [roleCategories]);

  // Sauvegarder (Créer / Modifier) une catégorie dans PostgreSQL
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryTitle.trim()) {
      toast.error("Veuillez saisir le titre de la catégorie.");
      return;
    }

    const payload = {
      title: categoryTitle.trim(),
      description: categoryDescription.trim(),
      roles: [selectedRoleTab],
      order: Number(categoryOrder) || 0,
      is_active: categoryActive,
    };

    const toastId = toast.loading(editingCategory?.id ? "Mise à jour de la catégorie..." : "Création de la catégorie...");
    console.log("[ADMIN GUIDES UI] Envoi payload catégorie:", payload);

    try {
      const url = editingCategory?.id
        ? `/api/v1/admin/guides/categories/${editingCategory.id}/`
        : "/api/v1/admin/guides/categories/";
      const method = editingCategory?.id ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resData = await res.json().catch(() => ({}));
      if (res.ok) {
        console.log("[ADMIN GUIDES UI] Succès enregistrement catégorie:", resData);
        toast.success(editingCategory?.id ? "Catégorie mise à jour avec succès !" : "Catégorie créée avec succès dans PostgreSQL !", { id: toastId });
        setIsCategoryModalOpen(false);
        await fetchCategories();
      } else {
        console.error("[ADMIN GUIDES UI] Erreur retournée:", resData);
        toast.error(`Échec : ${resData.detail || resData.error || "Erreur d'enregistrement"}`, { id: toastId });
      }
    } catch (err: any) {
      console.error("[ADMIN GUIDES UI] Exception:", err);
      toast.error(err?.message || "Erreur de communication avec le serveur", { id: toastId });
    }
  };

  // Supprimer une catégorie dans PostgreSQL
  const handleDeleteCategory = async (cat: GuideCategory) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer la catégorie "${cat.title}" et tous ses articles dans PostgreSQL ?`)) {
      return;
    }

    const toastId = toast.loading("Suppression de la catégorie...");
    console.log(`[ADMIN GUIDES UI] Suppression catégorie ID: ${cat.id}`);

    try {
      const res = await fetch(`/api/v1/admin/guides/categories/${cat.id}/`, {
        method: "DELETE",
      });

      if (res.ok) {
        console.log(`[ADMIN GUIDES UI] Catégorie ${cat.id} supprimée avec succès`);
        toast.success(`Catégorie "${cat.title}" supprimée de la base de données.`, { id: toastId });
        await fetchCategories();
      } else {
        toast.error("Échec de la suppression de la catégorie.", { id: toastId });
      }
    } catch (err: any) {
      console.error("[ADMIN GUIDES UI] Exception suppression catégorie:", err);
      toast.error("Erreur serveur lors de la suppression.", { id: toastId });
    }
  };

  // Supprimer un article dans PostgreSQL
  const handleDeleteArticle = async (art: GuideArticle) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer l'article "${art.title}" dans PostgreSQL ?`)) {
      return;
    }

    const toastId = toast.loading("Suppression de l'article...");
    console.log(`[ADMIN GUIDES UI] Suppression article ID: ${art.id}`);

    try {
      const res = await fetch(`/api/v1/admin/guides/articles/${art.id}/`, {
        method: "DELETE",
      });

      if (res.ok) {
        console.log(`[ADMIN GUIDES UI] Article ${art.id} supprimé avec succès`);
        toast.success(`Article "${art.title}" supprimé de la base de données.`, { id: toastId });
        await fetchCategories();
      } else {
        toast.error("Échec de la suppression de l'article.", { id: toastId });
      }
    } catch (err: any) {
      console.error("[ADMIN GUIDES UI] Exception suppression article:", err);
      toast.error("Erreur serveur lors de la suppression.", { id: toastId });
    }
  };

  // Ouvrir modale de création
  const handleOpenCreateCategory = () => {
    setEditingCategory(null);
    setCategoryTitle("");
    setCategoryDescription("");
    setCategoryOrder(roleCategories.length);
    setCategoryActive(true);
    setIsCategoryModalOpen(true);
  };

  // Ouvrir modale d'édition
  const handleOpenEditCategory = (cat: GuideCategory) => {
    setEditingCategory(cat);
    setCategoryTitle(cat.title);
    setCategoryDescription(cat.description || "");
    setCategoryOrder(cat.order || 0);
    setCategoryActive(cat.is_active);
    setIsCategoryModalOpen(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* ─── EN-TÊTE ADMIN ─── */}
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
              Centre d&apos;aide et gestion des documentations par profil d&apos;utilisateur.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <Link
            href="/admin/guide"
            className="h-9 px-3.5 rounded-xl bg-background-secondary border border-border hover:border-gold text-navy font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <BookOpen className="w-3.5 h-3.5 text-gold" />
            <span className="hidden sm:inline">Mon Guide Administrateur</span>
          </Link>

          <button
            type="button"
            onClick={handleOpenCreateCategory}
            className="h-9 px-4 rounded-xl bg-navy hover:bg-navy-dark text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-gold" />
            <span>Nouvelle catégorie</span>
          </button>
        </div>
      </div>

      {/* ─── ONGLETS PAR RÔLE ─── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-border">
        {ROLES.map((role) => {
          const isSelected = selectedRoleTab === role.value;
          const count = categories
            .filter((c) => Array.isArray(c.roles) && c.roles.includes(role.value))
            .reduce((acc, c) => acc + (c.articles?.length || 0), 0);

          return (
            <button
              key={role.value}
              type="button"
              onClick={() => setSelectedRoleTab(role.value)}
              className={`h-10 px-4 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-2 ${
                isSelected
                  ? "bg-navy text-white shadow-xs"
                  : "bg-background-secondary text-foreground-muted hover:text-navy hover:bg-background border border-border"
              }`}
            >
              <span>{role.label}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                isSelected ? "bg-gold/20 text-gold font-bold" : "bg-navy/10 text-navy"
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ─── CONTENU PRINCIPAL (Catégories et Articles) ─── */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-xl font-bold text-navy">
              Arborescence des guides ({ROLES.find((r) => r.value === selectedRoleTab)?.label})
            </h2>
            <p className="text-xs text-foreground-muted">
              Gérez les catégories et ajoutez des articles dans l&apos;éditeur dédié.
            </p>
          </div>
          {roleCategories.length > 0 && (
            <Link
              href={`/admin/guides/editor?role=${selectedRoleTab}&category=${roleCategories[0].id}`}
              className="h-9 px-3.5 rounded-xl bg-navy hover:bg-navy-dark text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-gold" />
              <span>Ajouter un article</span>
            </Link>
          )}
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs font-semibold text-foreground-muted">
            Chargement des guides depuis la base de données...
          </div>
        ) : roleCategories.length === 0 ? (
          <div className="py-16 text-center bg-background-secondary rounded-3xl border border-dashed border-border p-8 space-y-4 max-w-xl mx-auto shadow-xs">
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
            {roleCategories.map((cat) => (
              <div
                key={cat.id}
                className="bg-background-secondary rounded-3xl border border-border p-5 sm:p-6 space-y-4 shadow-xs"
              >
                {/* Ligne d'en-tête de la Catégorie */}
                <div className="flex items-center justify-between gap-4 border-b border-border pb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Folder className="w-5 h-5 text-gold shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-foreground-muted">#{cat.order}</span>
                        <h3 className="font-serif font-bold text-base text-navy truncate">
                          {cat.title}
                        </h3>
                        {!cat.is_active && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-500/10 text-red-500 uppercase font-mono">
                            Inactif
                          </span>
                        )}
                      </div>
                      {cat.description && (
                        <p className="text-xs text-foreground-muted truncate">{cat.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/admin/guides/editor?role=${selectedRoleTab}&category=${cat.id}`}
                      className="p-2 rounded-xl bg-background border border-border hover:border-navy text-navy font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                      title="Ajouter un article dans cette catégorie"
                    >
                      <Plus className="w-4 h-4 text-gold" />
                      <span className="hidden sm:inline">Ajouter article</span>
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleOpenEditCategory(cat)}
                      className="p-2 rounded-xl bg-background border border-border hover:border-navy text-foreground-muted hover:text-navy transition-colors cursor-pointer"
                      title="Modifier la catégorie"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(cat)}
                      className="p-2 rounded-xl bg-background border border-border hover:border-red-400 text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                      title="Supprimer la catégorie et ses articles"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Liste des articles dans la catégorie */}
                <div className="space-y-2 pl-2 sm:pl-4">
                  {(!cat.articles || cat.articles.length === 0) ? (
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
                        href={`/admin/guides/editor?role=${selectedRoleTab}&category=${cat.id}`}
                        className="h-8 px-3 rounded-xl bg-navy hover:bg-navy-dark text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-2xs transition-colors shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5 text-gold" />
                        <span>Rédiger un article</span>
                      </Link>
                    </div>
                  ) : (
                    cat.articles.map((art) => (
                      <div
                        key={art.id}
                        className="p-3.5 sm:p-4 rounded-2xl bg-background border border-border flex items-center justify-between gap-3 hover:border-gold/40 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Book className="w-4 h-4 text-gold shrink-0" />
                          <span className="text-xs font-mono text-foreground-muted w-4">#{art.order}</span>
                          <div className="min-w-0 flex items-center gap-2">
                            <p className="text-xs sm:text-sm font-semibold text-navy truncate">
                              {art.title}
                            </p>
                            {(art.video_url || art.stream_id) && (
                              <span title="Contient une vidéo" className="inline-flex items-center">
                                <Video className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                              </span>
                            )}
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
                            href={`/admin/guides/editor?id=${art.id}&category=${cat.id}&role=${selectedRoleTab}`}
                            className="p-2 rounded-lg hover:bg-background-secondary text-foreground-muted hover:text-navy transition-colors cursor-pointer"
                            title="Modifier l'article"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDeleteArticle(art)}
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

      {/* ─── MODALE CRÉATION / MODIFICATION CATÉGORIE ─── */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-2xs">
          <div className="bg-background border border-border p-6 rounded-3xl max-w-lg w-full space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2.5">
                <FolderPlus className="w-5 h-5 text-gold" />
                <h3 className="font-serif font-bold text-lg text-navy">
                  {editingCategory ? "Modifier la catégorie" : "Nouvelle catégorie de guide"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCategoryModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-background-secondary text-foreground-muted hover:text-navy transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-navy uppercase font-mono">
                  Titre de la catégorie *
                </label>
                <input
                  type="text"
                  value={categoryTitle}
                  onChange={(e) => setCategoryTitle(e.target.value)}
                  placeholder="Ex: Mon compte et connexion"
                  required
                  className="w-full h-11 px-4 bg-background-secondary border border-border rounded-xl text-sm font-medium focus:outline-none focus:border-navy"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-navy uppercase font-mono">
                  Description (Optionnel)
                </label>
                <textarea
                  value={categoryDescription}
                  onChange={(e) => setCategoryDescription(e.target.value)}
                  placeholder="Courte description de la catégorie..."
                  rows={2}
                  className="w-full p-3 bg-background-secondary border border-border rounded-xl text-sm font-medium focus:outline-none focus:border-navy resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-navy uppercase font-mono">
                    Ordre d&apos;affichage
                  </label>
                  <input
                    type="number"
                    value={categoryOrder}
                    onChange={(e) => setCategoryOrder(parseInt(e.target.value) || 0)}
                    min={0}
                    className="w-full h-11 px-4 bg-background-secondary border border-border rounded-xl text-sm font-medium focus:outline-none focus:border-navy"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-navy uppercase font-mono">
                    Statut
                  </label>
                  <div className="h-11 flex items-center px-4 bg-background-secondary border border-border rounded-xl">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-navy">
                      <input
                        type="checkbox"
                        checked={categoryActive}
                        onChange={(e) => setCategoryActive(e.target.checked)}
                        className="rounded text-navy focus:ring-navy"
                      />
                      <span>Catégorie active</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="h-10 px-4 rounded-xl border border-border hover:bg-background-secondary text-foreground-muted hover:text-navy font-bold text-xs transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="h-10 px-5 rounded-xl bg-navy hover:bg-navy-dark text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                >
                  Enregistrer en base
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
