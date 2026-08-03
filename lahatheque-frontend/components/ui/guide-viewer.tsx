"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Search, ChevronDown, Play, BookOpen, AlertCircle, List, X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { http } from "@/lib/api"
import { LahaVideoPlayer } from "@/components/student/LahaVideoPlayer"
import { getCloudflareThumbnailUrl } from "@/lib/constants/cloudflare"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

// URL média backend (images stockées sur le serveur)
const getMediaUrl = (path: string | null) => {
  if (!path) return null
  if (path.startsWith("http")) return path
  const base = process.env.NEXT_PUBLIC_API_URL || ""
  return `${base}${path}`
}

interface GuideArticle {
  id: number
  title: string
  content: string
  content_type: "html" | "markdown"
  video_url: string | null
  stream_id?: string | null
  image: string | null
  image_url_resolved?: string | null
  order: number
  is_published: boolean
}

interface GuideCategory {
  id: number
  title: string
  description: string
  order: number
  articles: GuideArticle[]
}

interface GuideViewerProps {
  role: string
  roleTitle: string
}

// ─── Table des matières ──────────────────────────────────────────────────────

function TableOfContents({
  categories,
  activeArticleId,
  onSelect,
  onClose,
}: {
  categories: GuideCategory[]
  activeArticleId: number | null
  onSelect: (id: number) => void
  onClose?: () => void
}) {
  return (
    <nav aria-label="Table des matières" className="w-full">
      {onClose && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-border mb-2">
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Table des matières
          </span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            aria-label="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {!onClose && (
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground px-2 mb-4">
          Table des matières
        </p>
      )}
      <ul className="space-y-4">
        {categories.map((cat) => (
          <li key={cat.id}>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-2 mb-1.5 truncate">
              {cat.title}
            </p>
            <ul className="space-y-0.5">
              {cat.articles.map((art) => (
                <li key={art.id}>
                  <button
                    onClick={() => {
                      onSelect(art.id)
                      onClose?.()
                    }}
                    className={`w-full text-left px-2 py-1.5 rounded-md text-sm transition-colors leading-snug ${
                      activeArticleId === art.id
                        ? "bg-laha-gold/10 text-laha-gold font-semibold"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    {art.title}
                  </button>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </nav>
  )
}

// ─── Rendu de contenu — HTML Tiptap + rétrocompatibilité Markdown ─────────────

const PROSE_CLASSES = `
  tiptap-content
  text-sm text-foreground leading-relaxed
  [&_h1]:text-xl [&_h1]:font-bold [&_h1]:text-foreground [&_h1]:mt-5 [&_h1]:mb-3
  [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-foreground [&_h2]:mt-4 [&_h2]:mb-2
  [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-foreground [&_h3]:mt-3 [&_h3]:mb-1.5
  [&_p]:text-muted-foreground [&_p]:mb-3 [&_p:last-child]:mb-0
  [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_ul]:text-muted-foreground
  [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3 [&_ol]:text-muted-foreground
  [&_li]:mb-1
  [&_a]:text-laha-gold [&_a]:underline [&_a]:underline-offset-2
  [&_strong]:font-semibold [&_strong]:text-foreground
  [&_em]:italic
  [&_code]:font-mono [&_code]:text-xs [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded
  [&_pre]:bg-muted [&_pre]:rounded-lg [&_pre]:p-4 [&_pre]:overflow-x-auto [&_pre]:mb-3
  [&_blockquote]:border-l-2 [&_blockquote]:border-laha-gold/40 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_blockquote]:mb-3
  [&_hr]:border-border [&_hr]:my-4
  [&_img]:rounded-xl [&_img]:max-w-full [&_img]:h-auto [&_img]:my-4 [&_img]:border [&_img]:border-border
  [&_.tiptap-video]:my-4
`

function TiptapContent({ content, contentType }: { content: string; contentType?: string }) {
  // Priorité : champ content_type du backend, sinon détection auto par le premier caractère
  const isHtml = contentType === "html" || (contentType !== "markdown" && content.trimStart().startsWith("<"))

  if (!isHtml) {
    return (
      <div className={PROSE_CLASSES}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    )
  }

  // Découpage et remplacement dynamique des balises <div data-video-embed ...></div>
  const videoRegex = /<div[^>]*data-video-embed[^>]*>(?:<\/div>)?/g
  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = videoRegex.exec(content)) !== null) {
    // Ajouter la partie HTML qui précède la vidéo
    if (match.index > lastIndex) {
      const htmlChunk = content.substring(lastIndex, match.index)
      parts.push(
        <div
          key={`html-${lastIndex}`}
          className={PROSE_CLASSES}
          dangerouslySetInnerHTML={{ __html: htmlChunk }}
        />
      )
    }

    const tagStr = match[0]
    const streamIdMatch = tagStr.match(/stream_id="([^"]*)"/)
    const videoUrlMatch = tagStr.match(/video_url="([^"]*)"/)
    const titleMatch = tagStr.match(/title="([^"]*)"/)

    const streamId = streamIdMatch ? streamIdMatch[1] : null
    const videoUrl = videoUrlMatch ? videoUrlMatch[1] : null
    const title = titleMatch ? titleMatch[1] : "Vidéo"

    if (streamId || videoUrl) {
      parts.push(
        <div key={`video-${match.index}`} className="my-6 max-w-3xl rounded-2xl overflow-hidden border border-border bg-card shadow-md">
          <LahaVideoPlayer
            streamId={streamId || undefined}
            videoUrl={videoUrl || undefined}
            title={title}
            poster={streamId ? (getCloudflareThumbnailUrl(streamId) ?? undefined) : undefined}
          />
        </div>
      )
    }

    lastIndex = match.index + match[0].length
  }

  // Ajouter le reste du HTML s'il y en a
  if (lastIndex < content.length) {
    const remainingHtml = content.substring(lastIndex)
    parts.push(
      <div
        key={`html-${lastIndex}`}
        className={PROSE_CLASSES}
        dangerouslySetInnerHTML={{ __html: remainingHtml }}
      />
    )
  }

  return <div className="space-y-4">{parts.length > 0 ? parts : <div className={PROSE_CLASSES} dangerouslySetInnerHTML={{ __html: content }} />}</div>
}

// ─── Article block (rendu continu façon article de blog) ───────────────────────

function ArticleBlock({
  article,
}: {
  article: GuideArticle
}) {
  const imageUrl = article.image_url_resolved || getMediaUrl(article.image)

  return (
    <div
      id={`article-${article.id}`}
      className="space-y-4 pt-4 first:pt-0"
    >
      <h3 className="font-bold text-foreground text-lg sm:text-xl tracking-tight leading-snug">
        {article.title}
      </h3>
      
      <div className="space-y-4">
        <TiptapContent content={article.content} contentType={article.content_type} />

        {/* Image d'illustration */}
        {imageUrl && (
          <div className="rounded-xl overflow-hidden border border-border shadow-sm max-w-2xl bg-muted/30">
            <img
              src={imageUrl}
              alt="Illustration du guide"
              className="w-full h-auto object-contain max-h-96"
            />
          </div>
        )}

        {/* Vidéo Cloudflare Stream */}
        {article.stream_id ? (
          <div className="rounded-xl overflow-hidden border border-border aspect-video bg-card max-w-3xl">
            <LahaVideoPlayer
              streamId={article.stream_id}
              title={article.title}
              poster={getCloudflareThumbnailUrl(article.stream_id) ?? undefined}
            />
          </div>
        ) : article.video_url ? (
          <a
            href={article.video_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 text-foreground font-semibold text-sm rounded-lg transition-colors border border-border"
          >
            <Play className="w-4 h-4" />
            Voir la vidéo
          </a>
        ) : null}
      </div>
    </div>
  )
}

// ─── GuideViewer principal ───────────────────────────────────────────────────

export function GuideViewer({ role, roleTitle }: GuideViewerProps) {
  const [categories, setCategories] = useState<GuideCategory[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [activeArticleId, setActiveArticleId] = useState<number | null>(null)
  const [tocOpen, setTocOpen] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    fetchGuides()
  }, [])

  // Scroll-spy
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect()

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible.length > 0) {
          const id = parseInt(visible[0].target.id.replace("article-", ""))
          setActiveArticleId(id)
        }
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: 0 }
    )

    categories.forEach((cat) =>
      cat.articles.forEach((art) => {
        const el = document.getElementById(`article-${art.id}`)
        if (el) observerRef.current?.observe(el)
      })
    )

    return () => observerRef.current?.disconnect()
  }, [categories])

  const fetchGuides = async () => {
    try {
      setLoading(true)
      setError("")
      const res = await http.get(`/api/bff/legacy/guides/`)
      const data = res.data?.results || res.data
      setCategories(Array.isArray(data) ? data : [])
    } catch {
      setError("Impossible de charger le guide pour le moment.")
    } finally {
      setLoading(false)
    }
  }

  const scrollToArticle = useCallback(
    (id: number) => {
      const el = document.getElementById(`article-${id}`)
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" })
        setActiveArticleId(id)
      }
    },
    []
  )

  const filteredCategories = categories
    .map((cat) => ({
      ...cat,
      articles: cat.articles.filter(
        (art) =>
          art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          art.content.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter(
      (cat) =>
        cat.articles.length > 0 ||
        cat.title.toLowerCase().includes(searchQuery.toLowerCase())
    )

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-3">
        <div className="w-7 h-7 border-2 border-laha-gold border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground animate-pulse">
          Chargement du guide...
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4 text-center px-4">
        <AlertCircle className="w-10 h-10 text-rose-500/70" />
        <p className="text-foreground font-semibold">{error}</p>
        <button
          onClick={fetchGuides}
          className="px-5 py-2 bg-foreground text-background text-sm font-bold rounded-lg hover:opacity-90 transition-opacity"
        >
          Réessayer
        </button>
      </div>
    )
  }

  if (categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-3 text-center px-4">
        <BookOpen className="w-12 h-12 text-muted-foreground/30" />
        <p className="text-foreground font-semibold">Aucun guide disponible</p>
        <p className="text-sm text-muted-foreground">
          Le guide pour les {roleTitle.toLowerCase()}s est en cours de préparation.
        </p>
      </div>
    )
  }

  return (
    <>
      {/* ── Mobile ToC drawer ── */}
      <AnimatePresence>
        {tocOpen && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm lg:hidden"
              onClick={() => setTocOpen(false)}
            />
            <motion.aside
              key="drawer"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-72 bg-card border-l border-border overflow-y-auto lg:hidden"
            >
              <div className="py-4 px-2">
                <TableOfContents
                  categories={filteredCategories}
                  activeArticleId={activeArticleId}
                  onSelect={scrollToArticle}
                  onClose={() => setTocOpen(false)}
                />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex gap-0 lg:gap-8 relative">
        {/* ── Desktop ToC sidebar (sticky) ── */}
        <aside className="hidden lg:block w-56 xl:w-64 shrink-0">
          <div className="sticky top-6">
            <TableOfContents
              categories={filteredCategories}
              activeArticleId={activeArticleId}
              onSelect={scrollToArticle}
            />
          </div>
        </aside>

        {/* ── Main content ── */}
        <div className="flex-1 min-w-0">
          {/* Header + Search */}
          <div className="bg-muted/30 border border-border rounded-2xl p-6 sm:p-8 mb-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-laha-gold/60 to-amber-400/60" />
            <h1 className="text-2xl sm:text-3xl font-black text-foreground mb-2 tracking-tight">
              Centre d&apos;aide {roleTitle}
            </h1>
            <p className="text-sm text-muted-foreground mb-6 max-w-lg">
              Parcourez les questions fréquentes ou recherchez un terme précis.
            </p>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none" />
              <input
                type="search"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-11 pl-11 pr-4 bg-background border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:border-laha-gold focus:ring-2 focus:ring-laha-gold/20 outline-none transition-all"
              />
            </div>
          </div>

          {/* Bouton ToC mobile */}
          <button
            onClick={() => setTocOpen(true)}
            className="lg:hidden flex items-center gap-2 px-3 py-2 mb-5 text-sm font-semibold text-muted-foreground hover:text-foreground border border-border rounded-xl bg-card transition-colors"
          >
            <List className="w-4 h-4" />
            Table des matières
          </button>

          {/* Articles */}
          {filteredCategories.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-muted-foreground text-sm">
                Aucun résultat pour «&nbsp;{searchQuery}&nbsp;»
              </p>
            </div>
          ) : (
            <div className="space-y-12">
              {filteredCategories.map((category) => (
                <section key={category.id} className="space-y-6">
                  <div className="border-b border-border pb-2">
                    <h2 className="text-xl font-bold text-foreground">
                      {category.title}
                    </h2>
                    {category.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {category.description}
                      </p>
                    )}
                  </div>
                  <div className="space-y-8 divide-y divide-border/20">
                    {category.articles.map((article, idx) => (
                      <div key={article.id} className={idx > 0 ? "pt-8" : ""}>
                        <ArticleBlock article={article} />
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}