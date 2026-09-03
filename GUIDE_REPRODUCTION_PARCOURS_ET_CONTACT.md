# Guide de Reproduction : Systeme de Guide d'Utilisation (Gestion Admin et Consultation) et Widget Contact Sidebar

Ce document contient l'integralite du code source, de l'architecture technique et des explications fonctionnelles pour reproduire dans un autre projet :
1. Le Systeme de Guide d'Utilisation / Centre d'Aide (Creation, categories par role, editeur riche Tiptap avec upload d'images et videos Cloudflare Stream, et lecteur multi-roles).
2. Le Systeme de Contact Support integre aux Sidebars et a la navigation mobile.

---

## Sommaire

- [1. Architecture et Fonctionnement du Guide d'Utilisation](#1-architecture-et-fonctionnement-du-guide-dutilisation)
  - [1.1. Modeles de Donnees Django (core/models.py)](#11-modeles-de-donnees-django-coremodelspy)
  - [1.2. Serialiseurs DRF (core/serializers_guide.py)](#12-serialiseurs-drf-coreserializers_guidepy)
  - [1.3. Vues et ViewSets API (core/views_guide.py)](#13-vues-et-viewsets-api-coreviews_guidepy)
  - [1.4. Routage des URLs (core/urls.py)](#14-routage-des-urls-coreurlspy)
- [2. Interface Administrateur (Gestion des Guides)](#2-interface-administrateur-gestion-des-guides)
  - [2.1. Page Principale de Gestion des Guides (admin/guides/page.tsx)](#21-page-principale-de-gestion-des-guides-adminguidespagetsx)
  - [2.2. Page d'Edition d'Article (admin/guides/editor/[id]/page.tsx)](#22-page-dedition-darticle-adminguideseditoridpagetsx)
  - [2.3. Editeur Visuel Tiptap avec Images et Videos (tiptap-editor.tsx)](#23-editeur-visuel-tiptap-avec-images-et-videos-tiptap-editortsx)
- [3. Interface Utilisateur (Consultation par Role)](#3-interface-utilisateur-consultation-par-role)
  - [3.1. Composant Lecteur de Guide (GuideViewer.tsx)](#31-composant-lecteur-de-guide-guideviewertsx)
  - [3.2. Pages de Consultation par Role (Student, Teacher, Parent)](#32-pages-de-consultation-par-role-student-teacher-parent)
- [4. Systeme de Contact Support (Sidebar et Navigation Mobile)](#4-systeme-de-contact-support-sidebar-et-navigation-mobile)
  - [4.1. Modale de Contact Bi-mode (ContactSupportDialog.tsx)](#41-modale-de-contact-bi-mode-contactsupportdialogtsx)
  - [4.2. Decouplage Universel par CustomEvent](#42-decouplage-universel-par-customevent)
  - [4.3. Integration dans la Sidebar Desktop](#43-integration-dans-la-sidebar-desktop)
  - [4.4. Integration dans la Navigation Mobile (BottomNav)](#44-integration-dans-la-navigation-mobile-bottomnav)
  - [4.5. Endpoint Backend d'Envoi d'Email (communications/views.py)](#45-endpoint-backend-denvoi-demail-communicationsviewspy)
- [5. Instructions d'Integration Pas-a-Pas](#5-instructions-dintegration-pas-a-pas)

---

# 1. Architecture et Fonctionnement du Guide d'Utilisation

Le Guide d'Utilisation est un centre d'aide interactif et hierarchique organise en deux niveaux :
- **Categories** : Regroupements thematiques (ex: "Mon Compte et Connexion", "Paiements et Factures", "Utilisation de la plateforme"). Chaque categorie cible un ou plusieurs roles precis (`roles: ["student", "parent", "teacher"]`).
- **Articles / Questions-Reponses** : Titre de la question et contenu explicatif enrichi de photos, captures d'ecran et videos de demonstration.

---

## 1.1. Modeles de Donnees Django (core/models.py)

Fichier : `backend/core/models.py`

```python
from django.db import models

class GuideCategory(models.Model):
    """
    Categorie de guide d'utilisation (ex: 'Mon Compte', 'Paiements')
    Filtree automatiquement selon les roles cibles.
    """
    title = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    roles = models.JSONField(
        default=list, 
        help_text='Liste des roles cibles (ex: ["student", "parent", "teacher", "admin"])'
    )
    order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'guide_categories'
        verbose_name = "Categorie de Guide"
        verbose_name_plural = "Categories de Guide"
        ordering = ['order', 'title']

    def __str__(self):
        return self.title


class GuideArticle(models.Model):
    """
    Article ou Question/Reponse au sein d'une categorie.
    Contient du texte HTML riche genere par Tiptap, avec images et videos.
    """
    category = models.ForeignKey(GuideCategory, on_delete=models.CASCADE, related_name='articles')
    title = models.CharField(max_length=200, help_text="Titre ou question de l'article")
    content = models.TextField(help_text="Contenu HTML Tiptap ou Markdown")
    video_url = models.URLField(blank=True, null=True, help_text="Lien video externe (YouTube, Vimeo...)")
    stream_id = models.CharField(max_length=100, blank=True, verbose_name="ID Cloudflare Stream")
    image = models.ImageField(upload_to='guides/images/%Y/%m/', blank=True, null=True)
    image_url = models.URLField(blank=True, null=True, verbose_name="URL Image Cloudflare R2 / Cloudinary")
    order = models.IntegerField(default=0)
    is_published = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'guide_articles'
        verbose_name = "Article de Guide"
        verbose_name_plural = "Articles de Guide"
        ordering = ['order', 'title']

    def __str__(self):
        return self.title
```

---

## 1.2. Serialiseurs DRF (core/serializers_guide.py)

Fichier : `backend/core/serializers_guide.py`

```python
from rest_framework import serializers
from .models import GuideCategory, GuideArticle

class GuideArticleSerializer(serializers.ModelSerializer):
    """Serialiseur de consultation publique/utilisateur pour un article publie."""
    image_url_resolved = serializers.SerializerMethodField()

    class Meta:
        model = GuideArticle
        fields = [
            'id', 'title', 'content', 'video_url', 'stream_id',
            'image', 'image_url', 'image_url_resolved', 'order',
            'is_published', 'created_at', 'updated_at'
        ]

    def get_image_url_resolved(self, obj):
        if obj.image_url:
            return obj.image_url
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class GuideCategorySerializer(serializers.ModelSerializer):
    """Serialiseur de consultation utilisateur avec ses articles publies."""
    articles = serializers.SerializerMethodField()

    class Meta:
        model = GuideCategory
        fields = ['id', 'title', 'description', 'roles', 'order', 'is_active', 'articles', 'created_at']

    def get_articles(self, obj):
        request = self.context.get('request')
        user_role = getattr(request.user, 'role', '') if request and hasattr(request, 'user') else ''
        is_admin = user_role in ['admin', 'super_admin']
        
        qs = obj.articles.all() if is_admin else obj.articles.filter(is_published=True)
        return GuideArticleSerializer(qs.order_by('order'), many=True, context=self.context).data


class AdminGuideArticleSerializer(serializers.ModelSerializer):
    """Serialiseur complet pour la creation et l'edition admin d'articles."""
    image_url_resolved = serializers.SerializerMethodField()

    class Meta:
        model = GuideArticle
        fields = [
            'id', 'category', 'title', 'content', 'video_url', 'stream_id',
            'image', 'image_url', 'image_url_resolved', 'order',
            'is_published', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_image_url_resolved(self, obj):
        if obj.image_url:
            return obj.image_url
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class AdminGuideCategorySerializer(serializers.ModelSerializer):
    """Serialiseur complet pour la gestion admin des categories."""
    articles = serializers.SerializerMethodField()

    class Meta:
        model = GuideCategory
        fields = ['id', 'title', 'description', 'roles', 'order', 'is_active', 'articles', 'created_at', 'updated_at']

    def get_articles(self, obj):
        qs = obj.articles.all().order_by('order')
        return AdminGuideArticleSerializer(qs, many=True, context=self.context).data
```

---

## 1.3. Vues et ViewSets API (core/views_guide.py)

Fichier : `backend/core/views_guide.py`

```python
from rest_framework import viewsets, permissions, filters
from .models import GuideCategory, GuideArticle
from .serializers_guide import (
    GuideCategorySerializer,
    AdminGuideCategorySerializer,
    AdminGuideArticleSerializer
)

class GuideCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Vue publique / utilisateur connecte pour consulter les guides.
    Filtre automatiquement par le role passe en query param ou extrait du JWT.
    """
    serializer_class = GuideCategorySerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [filters.SearchFilter]
    search_fields = ['title', 'description', 'articles__title', 'articles__content']

    def get_queryset(self):
        role_param = self.request.query_params.get('role')
        if role_param:
            return GuideCategory.objects.filter(is_active=True, roles__contains=role_param).order_by('order').distinct()

        user = getattr(self.request, 'user', None)
        user_role = getattr(user, 'role', '') if user and hasattr(user, 'is_authenticated') and user.is_authenticated else ''
        
        if user_role:
            qs = GuideCategory.objects.filter(is_active=True, roles__contains=user_role).order_by('order').distinct()
            if qs.exists():
                return qs

        return GuideCategory.objects.filter(is_active=True).order_by('order').distinct()


class AdminGuideCategoryViewSet(viewsets.ModelViewSet):
    """Vue CRUD admin pour gerer les categories de guide."""
    queryset = GuideCategory.objects.all().order_by('order')
    serializer_class = AdminGuideCategorySerializer
    permission_classes = [permissions.IsAdminUser]


class AdminGuideArticleViewSet(viewsets.ModelViewSet):
    """Vue CRUD admin pour creer, modifier et supprimer les articles."""
    queryset = GuideArticle.objects.all().order_by('category', 'order')
    serializer_class = AdminGuideArticleSerializer
    permission_classes = [permissions.IsAdminUser]
```

---

## 1.4. Routage des URLs (core/urls.py)

Fichier : `backend/core/urls.py`

```python
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views_guide import (
    GuideCategoryViewSet,
    AdminGuideCategoryViewSet,
    AdminGuideArticleViewSet
)

router = DefaultRouter()
router.register(r'guides', GuideCategoryViewSet, basename='public-guides')
router.register(r'admin/guides/categories', AdminGuideCategoryViewSet, basename='admin-guide-category')
router.register(r'admin/guides/articles', AdminGuideArticleViewSet, basename='admin-guide-article')

urlpatterns = [
    path('', include(router.urls)),
]
```

---

# 2. Interface Administrateur (Gestion des Guides)

## 2.1. Page Principale de Gestion des Guides (admin/guides/page.tsx)

Fichier : `frontend/app/dashboard/admin/guides/page.tsx`

Fonctionnalites de cette page :
- Onglets par role (`Eleve`, `Enseignant`, `Parent`, `Administrateur`).
- Creation / Edition de Categorie (titre, description, roles cibles, ordre, statut actif).
- Liste des articles par categorie avec indicateur de statut (*Publie* ou *Brouillon*) et icone video si l'article en contient une.
- Boutons d'ajout, d'edition et de suppression rapide.

```tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Shield, Plus, Edit, Trash2, Save, X, Video } from "lucide-react"
import { toast } from "sonner"

interface GuideArticle {
  id?: number
  category: number
  title: string
  content: string
  order: number
  is_published: boolean
  video_url?: string
  stream_id?: string
  image_url?: string
}

interface GuideCategory {
  id?: number
  title: string
  description?: string
  roles: string[]
  order: number
  is_active: boolean
  articles?: GuideArticle[]
}

const ROLES = [
  { id: "student", label: "Eleve" },
  { id: "teacher", label: "Enseignant" },
  { id: "parent", label: "Parent" },
  { id: "admin", label: "Administrateur" },
]

export default function AdminGuideManager() {
  const router = useRouter()
  const [categories, setCategories] = useState<GuideCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("student")
  const [editingCategory, setEditingCategory] = useState<GuideCategory | null>(null)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/v1/admin/guides/categories/")
      if (res.ok) {
        const data = await res.json()
        setCategories(Array.isArray(data.results) ? data.results : Array.isArray(data) ? data : [])
      }
    } catch {
      toast.error("Erreur de chargement des categories")
    } finally {
      setLoading(false)
    }
  }

  const handleSaveCategory = async (data: GuideCategory) => {
    const url = data.id ? `/api/v1/admin/guides/categories/${data.id}/` : "/api/v1/admin/guides/categories/"
    const method = data.id ? "PUT" : "POST"
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      })
      if (res.ok) {
        toast.success("Categorie enregistree avec succes")
        setEditingCategory(null)
        fetchCategories()
      }
    } catch {
      toast.error("Erreur lors de la sauvegarde")
    }
  }

  const handleDeleteCategory = async (id: number) => {
    if (!confirm("Supprimer cette categorie et tous ses articles ?")) return
    try {
      const res = await fetch(`/api/v1/admin/guides/categories/${id}/`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Categorie supprimee")
        fetchCategories()
      }
    } catch {
      toast.error("Erreur lors de la suppression")
    }
  }

  const handleDeleteArticle = async (id: number) => {
    if (!confirm("Supprimer cet article ?")) return
    try {
      const res = await fetch(`/api/v1/admin/guides/articles/${id}/`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Article supprime")
        fetchCategories()
      }
    } catch {
      toast.error("Erreur lors de la suppression")
    }
  }

  const filteredCategories = categories.filter((c) => c.roles?.includes(activeTab))

  return (
    <div className="flex-1 w-full bg-background min-h-screen">
      {/* Header */}
      <div className="px-6 py-6 border-b border-border bg-card flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500"><Shield className="w-5 h-5" /></div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Gestion du Guide d'Utilisation</h1>
            <p className="text-xs text-muted-foreground">Centre d'aide et documentation par type d'utilisateur.</p>
          </div>
        </div>
        <button
          onClick={() => setEditingCategory({ title: "", description: "", roles: [activeTab], order: 0, is_active: true })}
          className="flex items-center gap-2 px-4 py-2 bg-foreground text-background text-sm font-bold rounded-lg hover:opacity-90"
        >
          <Plus className="w-4 h-4" /> Nouvelle categorie
        </button>
      </div>

      {/* Onglets par role */}
      <div className="px-6 border-b border-border bg-card flex gap-4">
        {ROLES.map((role) => (
          <button
            key={role.id}
            onClick={() => setActiveTab(role.id)}
            className={`py-3 text-sm font-bold border-b-2 transition-colors ${
              activeTab === role.id ? "border-amber-500 text-amber-500" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {role.label}
          </button>
        ))}
      </div>

      {/* Liste des categories et articles */}
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        {filteredCategories.map((cat) => (
          <div key={cat.id} className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
            <div className="flex items-center justify-between px-5 py-4 border-b bg-muted/20">
              <div>
                <span className="text-xs font-mono text-muted-foreground mr-2">#{cat.order}</span>
                <span className="font-bold text-base">{cat.title}</span>
                {!cat.is_active && <span className="ml-2 px-2 py-0.5 bg-rose-500/10 text-rose-500 text-xs rounded-full">Inactif</span>}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => router.push(`/dashboard/admin/guides/editor/new?category=${cat.id}`)}
                  className="p-2 text-muted-foreground hover:text-foreground rounded-lg"
                  title="Ajouter un article"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button onClick={() => setEditingCategory(cat)} className="p-2 text-muted-foreground hover:text-foreground rounded-lg" title="Modifier">
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={() => handleDeleteCategory(cat.id!)} className="p-2 text-muted-foreground hover:text-rose-500 rounded-lg" title="Supprimer">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="divide-y">
              {(!cat.articles || cat.articles.length === 0) ? (
                <p className="text-xs text-muted-foreground italic p-4">Aucun article dans cette categorie.</p>
              ) : (
                cat.articles.map((art) => (
                  <div key={art.id} className="flex items-center justify-between px-5 py-3 hover:bg-muted/10">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-muted-foreground w-4">{art.order}</span>
                      <span className="text-sm font-medium">{art.title}</span>
                      {!art.is_published && <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 text-[10px] uppercase font-bold rounded-full">Brouillon</span>}
                      {(art.video_url || art.stream_id) && <Video className="w-3.5 h-3.5 text-sky-500" />}
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => router.push(`/dashboard/admin/guides/editor/${art.id}`)} className="p-1.5 text-muted-foreground hover:text-foreground">
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDeleteArticle(art.id!)} className="p-1.5 text-muted-foreground hover:text-rose-500">
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

      {/* Modale de creation/edition de categorie */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-card border p-6 rounded-2xl max-w-lg w-full space-y-4">
            <h3 className="text-base font-bold">{editingCategory.id ? "Modifier la categorie" : "Nouvelle categorie"}</h3>
            <input
              type="text"
              value={editingCategory.title}
              onChange={(e) => setEditingCategory({ ...editingCategory, title: e.target.value })}
              placeholder="Titre de la categorie"
              className="w-full p-2.5 border rounded-xl text-sm bg-background"
            />
            <textarea
              value={editingCategory.description || ""}
              onChange={(e) => setEditingCategory({ ...editingCategory, description: e.target.value })}
              placeholder="Description optionnelle"
              rows={2}
              className="w-full p-2.5 border rounded-xl text-sm bg-background resize-none"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setEditingCategory(null)} className="px-4 py-2 text-sm font-medium text-muted-foreground">Annuler</button>
              <button onClick={() => handleSaveCategory(editingCategory)} className="px-4 py-2 bg-foreground text-background text-sm font-bold rounded-xl">Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
```

---

## 2.2. Page d'Edition d'Article (admin/guides/editor/[id]/page.tsx)

Fichier : `frontend/app/dashboard/admin/guides/editor/[id]/page.tsx`

```tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import { ArrowLeft, Save } from "lucide-react"
import { toast } from "sonner"
import { TiptapEditor } from "@/components/admin/tiptap-editor"

export default function GuideArticleEditorPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()

  const articleId = params?.id === "new" ? null : (params?.id as string)
  const categoryIdFromUrl = searchParams.get("category")

  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [categoryId, setCategoryId] = useState<number | null>(categoryIdFromUrl ? parseInt(categoryIdFromUrl) : null)
  const [order, setOrder] = useState(0)
  const [isPublished, setIsPublished] = useState(true)
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchData()
  }, [articleId])

  const fetchData = async () => {
    try {
      setLoading(true)
      const catRes = await fetch("/api/v1/admin/guides/categories/")
      if (catRes.ok) {
        const catData = await catRes.json()
        const cats = Array.isArray(catData.results) ? catData.results : Array.isArray(catData) ? catData : []
        setCategories(cats)

        if (articleId) {
          const artRes = await fetch(`/api/v1/admin/guides/articles/${articleId}/`)
          if (artRes.ok) {
            const art = await artRes.json()
            setTitle(art.title || "")
            setContent(art.content || "")
            setCategoryId(art.category)
            setOrder(art.order || 0)
            setIsPublished(art.is_published ?? true)
          }
        } else if (!categoryId && cats.length > 0) {
          setCategoryId(cats[0].id)
        }
      }
    } catch {
      toast.error("Erreur de chargement des donnees")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!title.trim()) { toast.error("Veuillez saisir un titre"); return; }
    if (!categoryId) { toast.error("Veuillez selectionner une categorie"); return; }

    setSaving(true)
    const url = articleId ? `/api/v1/admin/guides/articles/${articleId}/` : "/api/v1/admin/guides/articles/"
    const method = articleId ? "PUT" : "POST"

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: categoryId,
          title: title.trim(),
          content,
          order,
          is_published: isPublished
        })
      })
      if (res.ok) {
        toast.success("Article enregistre avec succes")
        router.push("/dashboard/admin/guides")
      }
    } catch {
      toast.error("Erreur lors de la sauvegarde")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="py-40 text-center font-bold">Chargement de l'editeur...</div>

  return (
    <div className="flex-1 w-full bg-background min-h-screen flex flex-col">
      {/* Barre d'action superieure */}
      <div className="sticky top-0 z-40 bg-card border-b border-border px-6 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/dashboard/admin/guides")} className="p-2 rounded-xl hover:bg-muted text-muted-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-bold text-sm truncate">{title || "Nouvel article"}</span>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer bg-muted/40 px-3 py-1.5 rounded-xl border border-border">
            <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} className="hidden" />
            <div className={`w-3 h-3 rounded-full ${isPublished ? "bg-emerald-500" : "bg-amber-500"}`} />
            <span className="text-xs font-bold">{isPublished ? "Publie" : "Brouillon"}</span>
          </label>

          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-foreground text-background text-sm font-bold rounded-xl hover:opacity-90">
            <Save className="w-4 h-4" />
            <span>{saving ? "Enregistrement..." : "Enregistrer"}</span>
          </button>
        </div>
      </div>

      {/* Zone de formulaire et editeur Tiptap */}
      <div className="flex-1 p-6 max-w-5xl w-full mx-auto space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-card border p-5 rounded-2xl">
          <div className="sm:col-span-2 space-y-1">
            <label className="text-xs font-bold text-muted-foreground uppercase">Categorie de rattachement</label>
            <select
              value={categoryId || ""}
              onChange={(e) => setCategoryId(parseInt(e.target.value))}
              className="w-full h-10 px-3 border rounded-xl bg-background text-sm"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.title} ({c.roles?.join(", ")})</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-muted-foreground uppercase">Ordre d'affichage</label>
            <input
              type="number"
              value={order}
              onChange={(e) => setOrder(parseInt(e.target.value) || 0)}
              className="w-full h-10 px-3 border rounded-xl bg-background text-sm"
            />
          </div>
        </div>

        <div className="bg-card border p-5 rounded-2xl space-y-1">
          <label className="text-xs font-bold text-muted-foreground uppercase">Titre / Question de l'article</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Comment changer mon mot de passe ?"
            className="w-full text-xl font-bold bg-transparent border-none outline-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-muted-foreground uppercase">Contenu de la reponse</label>
          <TiptapEditor content={content} onChange={(html) => setContent(html)} />
        </div>
      </div>
    </div>
  )
}
```

---

## 2.3. Editeur Visuel Tiptap avec Images et Videos (tiptap-editor.tsx)

Fichier : `frontend/components/admin/tiptap-editor.tsx`

Ce composant integre :
1. **Upload d'Images direct** : Insertion automatique d'une balise `<img src="https://..." class="rounded-xl max-w-full h-auto border border-border my-4 block" />` a la position du curseur.
2. **Integration Video Cloudflare Stream** : Creation d'un noeud HTML personnalise `<div data-video-embed stream_id="...">` avec lecteur `iframe` Cloudflare Stream.
3. **Formatage de texte** : Titres H2, H3, Listes a puces, Listes ordonnees, Citations encadrees, Liens hypertextes.

```tsx
"use client"

import { useEditor, EditorContent, NodeViewWrapper, NodeViewProps } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Image from "@tiptap/extension-image"
import Link from "@tiptap/extension-link"
import Placeholder from "@tiptap/extension-placeholder"
import { Node, mergeAttributes, ReactNodeViewRenderer } from "@tiptap/core"
import { useRef, useState } from "react"
import { Bold, Italic, Heading2, Heading3, List, ListOrdered, Quote, Link2, Image as ImageIcon, Video, X, Upload } from "lucide-react"
import { toast } from "sonner"

// Noeud Personnalise Video pour Cloudflare Stream
const VideoEmbed = Node.create({
  name: "videoEmbed",
  group: "block",
  atom: true,
  addAttributes() {
    return {
      stream_id: { default: null },
      video_url: { default: null },
    }
  },
  parseHTML() { return [{ tag: "div[data-video-embed]" }] },
  renderHTML({ HTMLAttributes }) { return ["div", mergeAttributes({ "data-video-embed": "" }, HTMLAttributes)] },
  addNodeView() { return ReactNodeViewRenderer(VideoEmbedView) as any },
})

function VideoEmbedView({ node, deleteNode }: NodeViewProps) {
  const { stream_id, video_url } = node.attrs
  const src = stream_id ? `https://iframe.videodelivery.net/${stream_id}` : video_url

  return (
    <NodeViewWrapper className="my-4 relative group">
      <div className="relative rounded-xl overflow-hidden border border-border bg-black aspect-video max-w-2xl mx-auto">
        {src ? (
          <iframe src={src} className="w-full h-full border-none" allowFullScreen />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Video non disponible</div>
        )}
      </div>
      <button
        onClick={deleteNode}
        type="button"
        className="absolute top-2 right-2 bg-rose-600 text-white p-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="w-4 h-4" />
      </button>
    </NodeViewWrapper>
  )
}

export function TiptapEditor({ content, onChange }: { content: string; onChange: (html: string) => void }) {
  const imageInputRef = useRef<HTMLInputElement>(null)
  const [activeModal, setActiveModal] = useState<"image" | "video" | "link" | null>(null)
  const [imageUrl, setImageUrl] = useState("")
  const [videoInput, setVideoInput] = useState("")

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Image.configure({
        HTMLAttributes: { class: "rounded-xl max-w-full h-auto border border-border my-4 block" },
      }),
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: "Redigez les explications pas-a-pas..." }),
      VideoEmbed,
    ],
    content,
    onUpdate({ editor }) {
      onChange(editor.getHTML())
    },
  })

  const handleImageUpload = async (file: File) => {
    const toastId = toast.loading("Upload de l'image...")
    const formData = new FormData()
    formData.append("file", file)
    try {
      const res = await fetch("/api/v1/media/upload/", { method: "POST", body: formData })
      const data = await res.json()
      if (data.url) {
        editor?.chain().focus().setImage({ src: data.url, alt: file.name }).run()
        toast.success("Image inseree !", { id: toastId })
        setActiveModal(null)
      }
    } catch {
      toast.error("Echec de l'upload.", { id: toastId })
    }
  }

  if (!editor) return null

  return (
    <div className="border border-border rounded-2xl overflow-hidden bg-background flex flex-col shadow-xs">
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { if (e.target.files?.[0]) handleImageUpload(e.target.files[0]); }}
      />

      {/* Barre d'outils */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-card">
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={`p-2 rounded ${editor.isActive("bold") ? "bg-muted font-bold" : ""}`}>
          <Bold className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={`p-2 rounded ${editor.isActive("italic") ? "bg-muted" : ""}`}>
          <Italic className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className="p-2 text-xs font-bold">H2</button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className="p-2 text-xs font-bold">H3</button>
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className="p-2"><List className="w-4 h-4" /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className="p-2"><ListOrdered className="w-4 h-4" /></button>
        <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className="p-2"><Quote className="w-4 h-4" /></button>
        <button type="button" onClick={() => setActiveModal("image")} className="p-2 text-emerald-500" title="Ajouter Image"><ImageIcon className="w-4 h-4" /></button>
        <button type="button" onClick={() => setActiveModal("video")} className="p-2 text-sky-500" title="Ajouter Video"><Video className="w-4 h-4" /></button>
      </div>

      {/* Zone de saisie */}
      <div className="p-6 min-h-[300px] prose dark:prose-invert max-w-none focus:outline-none">
        <EditorContent editor={editor} />
      </div>

      {/* Modale Image */}
      {activeModal === "image" && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-card border p-6 rounded-2xl max-w-md w-full space-y-4">
            <h4 className="font-bold text-sm">Inserer une image</h4>
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className="w-full py-4 border-2 border-dashed rounded-xl flex items-center justify-center gap-2 hover:bg-muted/40"
            >
              <Upload className="w-5 h-5" />
              <span className="text-xs font-bold">Choisir un fichier local</span>
            </button>
            <div className="flex gap-2">
              <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://.../photo.jpg" className="flex-1 p-2 border rounded-xl text-sm" />
              <button
                type="button"
                onClick={() => { editor.chain().focus().setImage({ src: imageUrl }).run(); setActiveModal(null); }}
                className="px-4 py-2 bg-foreground text-background text-xs font-bold rounded-xl"
              >
                OK
              </button>
            </div>
            <button type="button" onClick={() => setActiveModal(null)} className="w-full text-xs text-muted-foreground">Annuler</button>
          </div>
        </div>
      )}

      {/* Modale Video */}
      {activeModal === "video" && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-card border p-6 rounded-2xl max-w-md w-full space-y-4">
            <h4 className="font-bold text-sm">Inserer une video (Stream ID Cloudflare ou URL)</h4>
            <input
              value={videoInput}
              onChange={(e) => setVideoInput(e.target.value)}
              placeholder="Ex: d41d8cd98f00b204e9800998ecf8427e ou https://..."
              className="w-full p-2.5 border rounded-xl text-sm"
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setActiveModal(null)} className="px-4 py-2 text-xs font-medium">Annuler</button>
              <button
                type="button"
                onClick={() => {
                  const isUrl = videoInput.startsWith("http");
                  editor.chain().focus().insertContent({
                    type: "videoEmbed",
                    attrs: isUrl ? { video_url: videoInput } : { stream_id: videoInput }
                  }).run();
                  setActiveModal(null);
                }}
                className="px-4 py-2 bg-foreground text-background text-xs font-bold rounded-xl"
              >
                Inserer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
```

---

# 3. Interface Utilisateur (Consultation par Role)

## 3.1. Composant Lecteur de Guide (GuideViewer.tsx)

Fichier : `frontend/components/ui/guide-viewer.tsx`

```tsx
"use client"

import { useState, useEffect } from "react"
import { Search, BookOpen, ChevronRight } from "lucide-react"

interface GuideArticle {
  id: number
  title: string
  content: string
  video_url: string | null
  stream_id: string | null
  image_url_resolved: string | null
}

interface GuideCategory {
  id: number
  title: string
  articles: GuideArticle[]
}

export function GuideViewer({ role, roleTitle }: { role: string; roleTitle: string }) {
  const [categories, setCategories] = useState<GuideCategory[]>([])
  const [activeArticleId, setActiveArticleId] = useState<number | null>(null)
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetch(`/api/v1/guides/?role=${role}`)
      .then((res) => res.json())
      .then((data) => {
        const cats = Array.isArray(data.results) ? data.results : Array.isArray(data) ? data : []
        setCategories(cats)
        if (cats.length > 0 && cats[0].articles?.length > 0) {
          setActiveArticleId(cats[0].articles[0].id)
        }
      })
  }, [role])

  const allArticles = categories.flatMap((c) => c.articles || [])
  const filteredArticles = search
    ? allArticles.filter((a) => a.title.toLowerCase().includes(search.toLowerCase()) || a.content.toLowerCase().includes(search.toLowerCase()))
    : []

  const activeArticle = allArticles.find((a) => a.id === activeArticleId)

  return (
    <div className="flex flex-col lg:flex-row gap-8 min-h-[80vh] p-6 max-w-7xl mx-auto">
      {/* Sommaire lateral */}
      <aside className="w-full lg:w-72 space-y-6 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-foreground">Guide {roleTitle}</h2>
          <p className="text-xs text-muted-foreground mt-1">Trouvez rapidement des reponses a vos questions.</p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher..."
            className="w-full pl-9 pr-3 py-2 bg-card border rounded-xl text-xs"
          />
        </div>

        <nav className="space-y-4">
          {search ? (
            <div className="space-y-1">
              <p className="text-[10px] uppercase font-bold text-muted-foreground">Resultats ({filteredArticles.length})</p>
              {filteredArticles.map((art) => (
                <button
                  key={art.id}
                  onClick={() => setActiveArticleId(art.id)}
                  className={`w-full text-left p-2 rounded-lg text-xs font-medium ${activeArticleId === art.id ? "bg-amber-500/10 text-amber-500 font-bold" : "text-muted-foreground hover:bg-muted"}`}
                >
                  {art.title}
                </button>
              ))}
            </div>
          ) : (
            categories.map((cat) => (
              <div key={cat.id} className="space-y-1">
                <p className="text-[11px] uppercase font-bold text-muted-foreground tracking-wider">{cat.title}</p>
                <div className="space-y-0.5 pl-2 border-l">
                  {cat.articles?.map((art) => (
                    <button
                      key={art.id}
                      onClick={() => setActiveArticleId(art.id)}
                      className={`w-full text-left p-2 rounded-lg text-xs transition-colors ${
                        activeArticleId === art.id ? "bg-amber-500/10 text-amber-500 font-bold" : "text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {art.title}
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </nav>
      </aside>

      {/* Contenu principal de l'article */}
      <main className="flex-1 bg-card border border-border p-8 rounded-3xl space-y-6 shadow-xs">
        {activeArticle ? (
          <article className="space-y-6">
            <h1 className="text-2xl sm:text-3xl font-black text-foreground">{activeArticle.title}</h1>
            
            {activeArticle.image_url_resolved && (
              <div className="rounded-xl overflow-hidden border border-border max-w-2xl">
                <img src={activeArticle.image_url_resolved} alt="" className="w-full h-auto object-contain max-h-96" />
              </div>
            )}

            <div
              className="prose dark:prose-invert max-w-none text-sm leading-relaxed [&_img]:rounded-xl [&_img]:max-w-full [&_img]:border [&_img]:my-4"
              dangerouslySetInnerHTML={{ __html: activeArticle.content }}
            />
          </article>
        ) : (
          <div className="py-24 text-center text-muted-foreground">Selectionnez une question dans le sommaire.</div>
        )}
      </main>
    </div>
  )
}
```

---

## 3.2. Pages de Consultation par Role (Student, Teacher, Parent)

- **Pour l'Eleve** (`frontend/app/dashboard/student/guide/page.tsx`) :
```tsx
import { GuideViewer } from "@/components/ui/guide-viewer"
export default function StudentGuidePage() {
  return <GuideViewer role="student" roleTitle="Eleve" />
}
```

- **Pour l'Enseignant** (`frontend/app/dashboard/teacher/guide/page.tsx`) :
```tsx
import { GuideViewer } from "@/components/ui/guide-viewer"
export default function TeacherGuidePage() {
  return <GuideViewer role="teacher" roleTitle="Enseignant" />
}
```

- **Pour le Parent** (`frontend/app/dashboard/parent/guide/page.tsx`) :
```tsx
import { GuideViewer } from "@/components/ui/guide-viewer"
export default function ParentGuidePage() {
  return <GuideViewer role="parent" roleTitle="Parent" />
}
```

---

# 4. Systeme de Contact Support (Sidebar et Navigation Mobile)

## 4.1. Modale de Contact Bi-mode (ContactSupportDialog.tsx)

Fichier : `frontend/components/ui/contact-support-dialog.tsx`

```tsx
"use client"

import React, { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Mail, Phone, ArrowLeft, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

export function ContactSupportDialog({ open, onOpenChange, user }: { open: boolean; onOpenChange: (o: boolean) => void; user?: any }) {
  const [mode, setMode] = useState<'options' | 'form'>('options')
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setMode('options')
      setSubject("")
      setMessage("")
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subject.trim() || !message.trim()) {
      toast.error("Veuillez remplir tous les champs.")
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/v1/communications/contact/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Utilisateur' : 'Utilisateur',
          email: user?.email || 'contact@utilisateur.com',
          subject,
          message
        })
      })
      if (res.ok) {
        toast.success("Message envoye avec succes !")
        onOpenChange(false)
      } else {
        toast.error("Erreur lors de l'envoi du message.")
      }
    } catch {
      toast.error("Erreur de connexion.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {mode === 'options' ? (
          <>
            <DialogHeader>
              <DialogTitle>Nous contacter</DialogTitle>
              <DialogDescription>Besoin d'aide ? Choisissez un canal de support.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <button
                type="button"
                onClick={() => setMode('form')}
                className="flex items-center p-3.5 rounded-2xl border w-full hover:bg-muted/50 transition-colors"
              >
                <div className="bg-primary/10 p-2.5 rounded-xl mr-3"><Mail className="h-5 w-5 text-primary" /></div>
                <div className="text-left">
                  <p className="font-semibold text-sm">Par email</p>
                  <p className="text-xs text-muted-foreground">Formulaire d'assistance direct</p>
                </div>
              </button>
              <div className="flex items-center p-3.5 rounded-2xl border w-full">
                <div className="bg-amber-500/10 p-2.5 rounded-xl mr-3"><Phone className="h-5 w-5 text-amber-500" /></div>
                <div className="text-left">
                  <p className="font-semibold text-sm">WhatsApp / Telephone</p>
                  <p className="text-xs text-muted-foreground select-all">+229 01 00 00 00 00</p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <DialogHeader className="flex flex-row items-center space-x-2 space-y-0">
              <Button variant="ghost" size="icon" className="h-8 w-8 mr-2 -ml-2" onClick={() => setMode('options')}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <DialogTitle>Envoyer un message</DialogTitle>
                <DialogDescription>Decrivez votre demande d'assistance</DialogDescription>
              </div>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <Input placeholder="Sujet de votre demande" value={subject} onChange={(e) => setSubject(e.target.value)} required />
              <Textarea placeholder="Expliquez en detail votre situation..." value={message} onChange={(e) => setMessage(e.target.value)} rows={4} required />
              <Button type="submit" disabled={loading} className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold">
                {loading ? "Envoi en cours..." : "Envoyer le message"}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
```

---

## 4.2. Decouplage Universel par CustomEvent

Pour permettre l'ouverture de la modale de contact depuis n'importe quel bouton de l'application (BottomNav mobile, header, lien d'aide dans un tableau de bord) sans prop drilling :

```ts
// Nom standard de l'evenement
const CONTACT_EVENT = 'app-open-contact'
```

---

## 4.3. Integration dans la Sidebar Desktop

Fichier : `frontend/components/dashboard-sidebar.tsx`

```tsx
import { useState, useEffect } from "react"
import { Mail, HelpCircle } from "lucide-react"
import { ContactSupportDialog } from "@/components/ui/contact-support-dialog"

export function DashboardSidebar({ children, user }: { children: React.ReactNode; user?: any }) {
  const [isContactOpen, setIsContactOpen] = useState(false)

  useEffect(() => {
    const handleOpen = () => setIsContactOpen(true)
    window.addEventListener('app-open-contact', handleOpen)
    return () => window.removeEventListener('app-open-contact', handleOpen)
  }, [])

  return (
    <div className="flex h-screen w-full">
      <aside className="w-64 border-r p-4 space-y-2">
        <a href="/dashboard/student/guide" className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted text-sm font-medium">
          <HelpCircle className="h-5 w-5 text-amber-500" />
          <span>Guide d'utilisation</span>
        </a>
        <button
          onClick={() => setIsContactOpen(true)}
          className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted text-sm font-medium w-full text-left"
        >
          <Mail className="h-5 w-5 text-indigo-400" />
          <span>Nous contacter</span>
        </button>
      </aside>

      <main className="flex-1 overflow-y-auto">{children}</main>

      <ContactSupportDialog open={isContactOpen} onOpenChange={setIsContactOpen} user={user} />
    </div>
  )
}
```

---

## 4.4. Integration dans la Navigation Mobile (BottomNav)

Fichier : `frontend/components/bottom-nav.tsx`

```tsx
"use client"

import { Mail, BookOpen } from "lucide-react"

export function BottomNav() {
  const openContact = () => {
    window.dispatchEvent(new CustomEvent('app-open-contact'))
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-card border-t flex items-center justify-around z-50 lg:hidden">
      <a href="/dashboard/student/guide" className="flex flex-col items-center text-[10px] font-bold text-muted-foreground">
        <BookOpen className="w-5 h-5 mb-0.5" />
        <span>Guide</span>
      </a>
      <button onClick={openContact} className="flex flex-col items-center text-[10px] font-bold text-muted-foreground">
        <Mail className="w-5 h-5 mb-0.5" />
        <span>Contact</span>
      </button>
    </nav>
  )
}
```

---

## 4.5. Endpoint Backend d'Envoi d'Email (communications/views.py)

Fichier : `backend/communications/views.py`

```python
from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.core.mail import send_mail
from django.conf import settings

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def submit_contact_view(request):
    """
    Endpoint public de soumission du formulaire de contact.
    Transmet un email formate aux administrateurs.
    """
    name = request.data.get('name')
    email = request.data.get('email')
    subject = request.data.get('subject')
    message = request.data.get('message')

    if not all([name, email, subject, message]):
        return Response({'error': 'Tous les champs sont obligatoires.'}, status=status.HTTP_400_BAD_REQUEST)

    admin_recipients = ["support@votreplateforme.com"]
    email_subject = f"[Support] Nouveau message : {subject}"
    html_body = f"""
    <h3>Nouveau message recu via le formulaire de support</h3>
    <p><strong>Nom :</strong> {name}</p>
    <p><strong>Email :</strong> {email}</p>
    <p><strong>Sujet :</strong> {subject}</p>
    <hr />
    <p><strong>Message :</strong></p>
    <p>{message}</p>
    """

    try:
        send_mail(
            subject=email_subject,
            message=message,
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'contact@votreplateforme.com'),
            recipient_list=admin_recipients,
            html_message=html_body,
            fail_silently=False
        )
        return Response({'status': 'success', 'message': 'Message envoye avec succes.'}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': f"Erreur lors de l'envoi de l'email : {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
```

---

# 5. Instructions d'Integration Pas-a-Pas

1. **Backend Django** :
   - Ajouter les modeles `GuideCategory` et `GuideArticle` dans votre application principale.
   - Creer les migrations : `python manage.py makemigrations` puis `python manage.py migrate`.
   - Brancher les viewsets DRF dans `urls.py` :
     - `/api/v1/guides/` (lecture publique/utilisateur selon le role).
     - `/api/v1/admin/guides/categories/` et `/api/v1/admin/guides/articles/` (CRUD admin).
     - `/api/v1/communications/contact/` (envoi email).

2. **Frontend Next.js** :
   - Installer les dependances : `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-image`, `@tiptap/extension-link`, `@tiptap/extension-placeholder`, `lucide-react`, `sonner`.
   - Copier `tiptap-editor.tsx` dans `@/components/admin/`.
   - Copier `guide-viewer.tsx` dans `@/components/ui/`.
   - Copier `contact-support-dialog.tsx` dans `@/components/ui/`.
   - Creer la page admin `/app/dashboard/admin/guides/page.tsx` et l'editeur `/app/dashboard/admin/guides/editor/[id]/page.tsx`.
   - Creer les pages de consultation de guide par role (`/dashboard/student/guide`, `/dashboard/teacher/guide`, etc.).
   - Attacher l'evenement `app-open-contact` dans vos composants de barre laterale et navigation mobile.
