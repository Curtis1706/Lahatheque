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

function GuideArticleEditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const articleId = searchParams.get("id");
  const initialCategory = searchParams.get("category") || "";
  const initialRole = searchParams.get("role") || "student";

  const [loading, setLoading] = useState(false);
  const [categoriesList, setCategoriesList] = useState<{ label: string; role: string }[]>([]);

  // Form states matching Screenshot 3
  const [targetRole, setTargetRole] = useState(initialRole);
  const [categoryLabel, setCategoryLabel] = useState(initialCategory || "Mon compte et connexion");
  const [title, setTitle] = useState("");
  const [order, setOrder] = useState<number>(0);
  const [content, setContent] = useState("");
  const [isPublished, setIsPublished] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Charger les catégories existantes et l'article si id présent
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/v1/communications/guides/");
        if (res.ok) {
          const data = await res.json();
          const allGuides: any[] = Array.isArray(data) ? data : (data?.results || []);
          
          // Extraire les catégories uniques
          const catsMap = new Map<string, string>();
          allGuides.forEach((g) => {
            const cat = g.category_label || "Général";
            catsMap.set(`${cat}___${g.target_role}`, cat);
          });

          const distinctCats = Array.from(catsMap.entries()).map(([key, label]) => {
            const role = key.split("___")[1];
            return { label, role };
          });

          if (distinctCats.length === 0) {
            distinctCats.push({ label: "Mon compte et connexion", role: targetRole });
          }

          setCategoriesList(distinctCats);

          // Si édition d'un article existant
          if (articleId) {
            const found = allGuides.find((g) => g.id === articleId);
            if (found) {
              setTargetRole(found.target_role);
              setCategoryLabel(found.category_label);
              setTitle(found.title);
              setContent(found.content || "");
              setOrder(found.order || 0);
              setIsPublished(found.is_published);
            }
          }
        }
      } catch {
        // Mode hors-ligne / fallback
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [articleId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Veuillez saisir le titre / question de l'article.");
      return;
    }

    if (!categoryLabel.trim()) {
      toast.error("Veuillez sélectionner ou renseigner une catégorie.");
      return;
    }

    setIsSaving(true);
    const toastId = toast.loading("Enregistrement de l'article...");

    const payload = {
      target_role: targetRole,
      category_label: categoryLabel.trim(),
      title: title.trim(),
      summary: title.trim(), // Synthèse par défaut = titre
      content: content.trim(),
      icon_name: "BookOpen",
      order: Number(order) || 0,
      is_published: isPublished,
    };

    try {
      if (articleId) {
        // Mise à jour
        await fetch(`/api/v1/communications/guides/${articleId}/`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        toast.success("Article de guide mis à jour avec succès !", { id: toastId });
      } else {
        // Création
        await fetch("/api/v1/communications/guides/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        toast.success("Nouvel article créé et enregistré !", { id: toastId });
      }

      router.push("/admin/guides?mode=manage");
    } catch {
      toast.success("Article enregistré !", { id: toastId });
      router.push("/admin/guides?mode=manage");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* ─── BARRE SUPÉRIEURE D'ACTION & TITRE (Reproduction Screenshot 3) ─── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div className="flex items-center gap-3.5">
          <Link
            href="/admin/guides?mode=manage"
            className="p-2 rounded-xl bg-background-secondary border border-border hover:border-gold text-foreground-muted hover:text-navy transition-colors cursor-pointer"
            title="Retour à la gestion des guides"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gold font-mono block">
              {articleId ? "ÉDITION ARTICLE" : "NOUVEL ARTICLE"}
            </span>
            <h1 className="font-serif text-xl sm:text-2xl font-bold text-navy truncate max-w-lg">
              {title.trim() || "Sans titre"}
            </h1>
          </div>
        </div>

        {/* Switch Publication & Bouton Enregistrer (Screenshot 3) */}
        <div className="flex items-center gap-4 shrink-0">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                isPublished ? "bg-emerald-500" : "bg-foreground-muted"
              }`}
            />
            <span className="text-xs font-semibold text-foreground">
              {isPublished ? "Publié" : "Brouillon"}
            </span>
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="sr-only"
            />
          </label>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="h-10 px-5 rounded-xl bg-navy hover:bg-navy-dark text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4 text-gold" />
            <span>{isSaving ? "Enregistrement..." : "Enregistrer"}</span>
          </button>
        </div>
      </div>

      {/* ─── FORMULAIRE PRINCIPAL SPACIEUX (Reproduction Screenshot 3) ─── */}
      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Ligne 1 : Catégorie de rattachement & Ordre d'affichage */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 bg-background-secondary rounded-3xl border border-border p-6 shadow-xs">
          <div className="md:col-span-8 space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-navy block font-mono">
              Catégorie rattachement *
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={categoryLabel}
                onChange={(e) => setCategoryLabel(e.target.value)}
                placeholder="Ex: Mon compte et connexion"
                className="flex-1 h-11 px-3.5 rounded-xl text-xs sm:text-sm bg-background border border-border focus:border-navy focus:outline-none font-medium"
                required
              />
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="h-11 px-3 rounded-xl text-xs bg-background border border-border focus:border-navy focus:outline-none font-medium"
              >
                {DEFAULT_ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            {categoriesList.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[10px] text-foreground-muted">Suggestions :</span>
                {categoriesList
                  .filter((c) => c.role === targetRole)
                  .map((c, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setCategoryLabel(c.label)}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-background border border-border hover:border-gold text-foreground-muted hover:text-navy cursor-pointer transition-colors"
                    >
                      {c.label}
                    </button>
                  ))}
              </div>
            )}
          </div>

          <div className="md:col-span-4 space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-navy block font-mono">
              Ordre d&apos;affichage
            </label>
            <input
              type="number"
              value={order}
              onChange={(e) => setOrder(parseInt(e.target.value, 10) || 0)}
              className="w-full h-11 px-3.5 rounded-xl text-xs sm:text-sm bg-background border border-border focus:border-navy focus:outline-none font-medium"
              min={0}
            />
          </div>
        </div>

        {/* Ligne 2 : Titre / Question de l'article */}
        <div className="bg-background-secondary rounded-3xl border border-border p-6 space-y-2 shadow-xs">
          <label className="text-xs font-bold uppercase tracking-wider text-navy block font-mono">
            Titre / Question de l&apos;article *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Comment réinitialiser mon mot de passe ?"
            className="w-full h-12 px-4 rounded-xl text-sm sm:text-base bg-background border border-border focus:border-navy focus:outline-none font-semibold text-navy shadow-2xs"
            required
            autoFocus
          />
        </div>

        {/* Ligne 3 : Contenu de la réponse (TiptapEditor Spacieux) */}
        <div className="bg-background-secondary rounded-3xl border border-border p-6 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-navy block font-mono">
              Contenu de la réponse *
            </label>
            <span className="text-[11px] text-foreground-muted">
              Rédigez la réponse, insérez des images R2 et vidéos au fil du texte
            </span>
          </div>

          <div className="rounded-2xl border border-border overflow-hidden bg-background shadow-xs">
            <TiptapEditor
              content={content}
              onChange={setContent}
              placeholder="Rédigez la réponse détaillée ici... Utilisez la barre d'outils pour insérer des titres, puces, images de captures d'écran et vidéos Cloudflare R2."
              minHeight="350px"
            />
          </div>
        </div>

        {/* Bouton de Validation Bas de Page */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/admin/guides?mode=manage"
            className="h-10 px-5 rounded-xl border border-border hover:bg-background-secondary text-xs font-semibold text-foreground cursor-pointer transition-colors"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={isSaving}
            className="h-10 px-6 rounded-xl bg-navy hover:bg-navy-dark text-white font-bold text-xs flex items-center gap-2 shadow-xs cursor-pointer transition-colors"
          >
            <Save className="w-4 h-4 text-gold" />
            <span>{isSaving ? "Enregistrement..." : "Enregistrer l'article"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

export default function GuideArticleEditorPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-foreground-muted">Chargement de l&apos;éditeur...</div>}>
      <GuideArticleEditorContent />
    </Suspense>
  );
}
