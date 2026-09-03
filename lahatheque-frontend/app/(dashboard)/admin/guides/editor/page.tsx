"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  FileText,
  Shield,
  HelpCircle,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { TiptapEditor } from "@/components/ui/tiptap-editor";

interface CategoryOption {
  id: string;
  title: string;
  roles: string[];
}

function GuideArticleEditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const articleId = searchParams.get("id");
  const initialCategoryId = searchParams.get("category") || "";
  const initialRole = searchParams.get("role") || "student";

  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [categoryId, setCategoryId] = useState<string>(initialCategoryId);
  const [title, setTitle] = useState("");
  const [order, setOrder] = useState<number>(0);
  const [content, setContent] = useState("");
  const [isPublished, setIsPublished] = useState(true);

  // Charger les catégories et l'article depuis la base PostgreSQL
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        console.log("[GUIDE EDITOR] Chargement des catégories depuis /api/v1/admin/guides/categories/...");
        const catRes = await fetch("/api/v1/admin/guides/categories/");
        if (catRes.ok) {
          const catData = await catRes.json();
          const cats: CategoryOption[] = Array.isArray(catData) ? catData : (catData?.results || []);
          console.log(`[GUIDE EDITOR] ${cats.length} catégories chargées:`, cats);
          setCategories(cats);

          if (!categoryId && cats.length > 0) {
            setCategoryId(cats[0].id);
          }
        }

        // Si modification d'un article existant
        if (articleId) {
          console.log(`[GUIDE EDITOR] Chargement de l'article ID ${articleId}...`);
          const artRes = await fetch(`/api/v1/admin/guides/articles/${articleId}/`);
          if (artRes.ok) {
            const art = await artRes.json();
            console.log("[GUIDE EDITOR] Article chargé:", art);
            setTitle(art.title || "");
            setContent(art.content || "");
            setCategoryId(art.category || "");
            setOrder(art.order || 0);
            setIsPublished(art.is_published ?? true);
          }
        }
      } catch (err) {
        console.error("[GUIDE EDITOR] Erreur chargement:", err);
        toast.error("Erreur lors de la récupération des données.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [articleId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Veuillez saisir le titre / question de l'article.");
      return;
    }

    if (!categoryId) {
      toast.error("Veuillez sélectionner une catégorie de rattachement.");
      return;
    }

    setSaving(true);
    const toastId = toast.loading("Enregistrement de l'article dans PostgreSQL...");

    const payload = {
      category: categoryId,
      title: title.trim(),
      content: content.trim(),
      order: Number(order) || 0,
      is_published: isPublished,
    };

    console.log("[GUIDE EDITOR] Envoi du payload vers Django PostgreSQL:", payload);

    try {
      const url = articleId
        ? `/api/v1/admin/guides/articles/${articleId}/`
        : "/api/v1/admin/guides/articles/";
      const method = articleId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resData = await res.json().catch(() => ({}));
      if (res.ok) {
        console.log("[GUIDE EDITOR] Succès enregistrement article:", resData);
        toast.success(articleId ? "Article mis à jour avec succès !" : "Nouvel article créé et enregistré dans PostgreSQL !", { id: toastId });
        router.push("/admin/guides?mode=manage");
      } else {
        console.error("[GUIDE EDITOR] Erreur retournée:", resData);
        const errorMsg =
          resData.detail ||
          resData.error ||
          resData.message ||
          (typeof resData === "object" ? JSON.stringify(resData) : "Erreur lors de l'enregistrement");
        toast.error(`Échec : ${errorMsg}`, { id: toastId });
      }
    } catch (err: any) {
      console.error("[GUIDE EDITOR] Exception:", err);
      toast.error(err?.message || "Erreur de communication avec le serveur", { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-32 text-center text-xs font-semibold text-foreground-muted">
        Chargement de l&apos;éditeur de guide depuis la base de données...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* ─── BARRE SUPÉRIEURE D'ACTION & TITRE ─── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div className="flex items-center gap-3.5 min-w-0">
          <Link
            href="/admin/guides?mode=manage"
            className="p-2 rounded-xl bg-background-secondary border border-border hover:border-gold text-foreground-muted hover:text-navy transition-colors cursor-pointer shrink-0"
            title="Retour à la gestion des guides"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gold font-mono block">
              {articleId ? "Édition Article" : "Nouvel Article de Guide"}
            </span>
            <h1 className="font-serif text-xl sm:text-2xl font-bold text-navy truncate">
              {title || "Sans titre"}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <label className="flex items-center gap-2 cursor-pointer bg-background-secondary px-3 py-1.5 rounded-xl border border-border">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="rounded text-navy focus:ring-navy"
            />
            <div className={`w-2.5 h-2.5 rounded-full ${isPublished ? "bg-emerald-500" : "bg-amber-500"}`} />
            <span className="text-xs font-bold text-navy">
              {isPublished ? "Publié" : "Brouillon"}
            </span>
          </label>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="h-10 px-5 rounded-xl bg-navy hover:bg-navy-dark text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4 text-gold" />
            <span>{saving ? "Enregistrement..." : "Enregistrer"}</span>
          </button>
        </div>
      </div>

      {/* ─── FORMULAIRE PRINCIPAL ─── */}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-background-secondary border border-border p-5 rounded-3xl shadow-xs">
          <div className="sm:col-span-2 space-y-1.5">
            <label className="text-xs font-bold text-navy uppercase font-mono">
              Catégorie de rattachement *
            </label>
            {categories.length === 0 ? (
              <div className="p-3 bg-background rounded-xl border border-dashed border-border text-xs text-foreground-muted">
                Aucune catégorie existante. Veuillez d&apos;abord créer une catégorie depuis la page des guides.
              </div>
            ) : (
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
                className="w-full h-11 px-4 bg-background border border-border rounded-xl text-sm font-medium focus:outline-none focus:border-navy cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} ({c.roles?.join(", ")})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-navy uppercase font-mono">
              Ordre d&apos;affichage
            </label>
            <input
              type="number"
              value={order}
              onChange={(e) => setOrder(parseInt(e.target.value) || 0)}
              min={0}
              className="w-full h-11 px-4 bg-background border border-border rounded-xl text-sm font-medium focus:outline-none focus:border-navy"
            />
          </div>
        </div>

        {/* Titre / Question */}
        <div className="bg-background-secondary border border-border p-5 rounded-3xl space-y-1.5 shadow-xs">
          <label className="text-xs font-bold text-navy uppercase font-mono">
            Titre / Question de l&apos;article *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Comment réinitialiser mon mot de passe en cas d'oubli ?"
            required
            className="w-full h-12 px-4 bg-background border border-border rounded-xl text-base font-bold text-navy focus:outline-none focus:border-navy"
          />
        </div>

        {/* Éditeur Riche Tiptap avec Images et Vidéos */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <label className="text-xs font-bold text-navy uppercase font-mono">
              Contenu de la réponse *
            </label>
            <span className="text-[11px] text-foreground-muted">
              Rédigez la réponse, insérez des images et vidéos au fil du texte
            </span>
          </div>

          <TiptapEditor
            content={content}
            onChange={(html) => setContent(html)}
          />
        </div>

        {/* Boutons d'Action Inférieurs */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <Link
            href="/admin/guides?mode=manage"
            className="h-10 px-5 rounded-xl border border-border hover:bg-background-secondary text-foreground-muted hover:text-navy font-bold text-xs transition-colors flex items-center"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="h-10 px-6 rounded-xl bg-navy hover:bg-navy-dark text-white font-bold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {saving ? "Enregistrement..." : "Enregistrer l'article"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function GuideArticleEditorPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-xs">Chargement...</div>}>
      <GuideArticleEditorContent />
    </Suspense>
  );
}
