"use client"

/**
 * TiptapEditor — éditeur riche ultra-intuitif pour LahaAcademia
 *
 * Extensions : StarterKit, Image (inline upload), VideoEmbed (custom)
 * Upload  : Cloudflare R2 (images) & Cloudflare Stream (vidéos) via uploadToCloudinary()
 * Thème   : tokens laha uniquement, jour/nuit automatique
 */

import { useEditor, EditorContent, NodeViewWrapper, NodeViewProps } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Image from "@tiptap/extension-image"
import Link from "@tiptap/extension-link"
import Placeholder from "@tiptap/extension-placeholder"
import { Node, mergeAttributes } from "@tiptap/core"
import { ReactNodeViewRenderer } from "@tiptap/react"
import { useRef, useCallback, useState, useEffect } from "react"
import { uploadToCloudflare } from "@/lib/cloudflare"
import { CLOUDFLARE_STREAM_SUBDOMAIN } from "@/lib/constants/cloudflare"
import {
  Bold,
  Italic,
  Strikethrough,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Minus,
  Link2,
  Image as ImageIcon,
  Video,
  Undo,
  Redo,
  Globe,
  Film,
  X,
  Upload,
  Check,
} from "lucide-react"
import { toast } from "sonner"

// ─── Extension vidéo custom ──────────────────────────────────────────────────

const VideoEmbed = Node.create({
  name: "videoEmbed",
  group: "block",
  atom: true,

  addAttributes() {
    return {
      stream_id: { default: null },
      video_url: { default: null },
      title: { default: "" },
    }
  },

  parseHTML() {
    return [{ tag: "div[data-video-embed]" }]
  },

  renderHTML({ HTMLAttributes }: { HTMLAttributes: any }) {
    return [
      "div",
      mergeAttributes({ "data-video-embed": "" }, HTMLAttributes),
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(VideoEmbedView) as any
  },
})

function VideoEmbedView({ node, deleteNode }: NodeViewProps) {
  const { stream_id, video_url, title } = node.attrs
  const rawSrc = video_url || stream_id || ""

  let src = rawSrc
  let isDirectVideo = false

  if (
    rawSrc.startsWith("data:video") ||
    rawSrc.startsWith("blob:") ||
    rawSrc.includes(".mp4") ||
    rawSrc.includes(".webm") ||
    rawSrc.includes(".r2.cloudflarestorage.com") ||
    rawSrc.includes(".r2.dev") ||
    rawSrc.includes("/media/")
  ) {
    isDirectVideo = true
    src = rawSrc
  } else if (rawSrc.includes("youtube.com/watch?v=")) {
    const videoId = rawSrc.split("v=")[1]?.split("&")[0]
    src = `https://www.youtube.com/embed/${videoId}`
  } else if (rawSrc.includes("youtu.be/")) {
    const videoId = rawSrc.split("youtu.be/")[1]?.split("?")[0]
    src = `https://www.youtube.com/embed/${videoId}`
  } else if (rawSrc.includes("vimeo.com/")) {
    const videoId = rawSrc.split("vimeo.com/")[1]?.split("?")[0]
    src = `https://player.vimeo.com/video/${videoId}`
  } else if (stream_id && !stream_id.startsWith("http") && !stream_id.startsWith("data:")) {
    src = `https://${CLOUDFLARE_STREAM_SUBDOMAIN}/${stream_id}/iframe`
  } else if (rawSrc) {
    isDirectVideo = true
    src = rawSrc
  }

  return (
    <NodeViewWrapper className="my-4 relative group">
      <div className="relative rounded-2xl overflow-hidden border border-border bg-black aspect-video max-w-2xl mx-auto shadow-md">
        {src ? (
          isDirectVideo ? (
            <video src={src} controls playsInline className="w-full h-full object-cover rounded-2xl" />
          ) : (
            <iframe
              src={src}
              className="w-full h-full border-none rounded-2xl"
              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          )
        ) : (
          <div className="flex items-center justify-center h-full text-foreground-muted text-xs">
            Vidéo non disponible
          </div>
        )}
      </div>
      <button
        onClick={deleteNode}
        type="button"
        className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold shadow-md cursor-pointer"
        title="Supprimer la vidéo"
      >
        <X className="w-4 h-4" />
      </button>
    </NodeViewWrapper>
  )
}

// ─── Modale générique pour l'éditeur ─────────────────────────────────────────

function EditorModal({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 animate-in fade-in duration-150">
      <div className="bg-background border border-border sm:max-w-md w-full rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="flex justify-between items-center px-5 py-3.5 border-b border-border bg-background-secondary">
          <h4 className="text-sm font-bold text-navy">{title}</h4>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-foreground-muted hover:text-navy hover:bg-background transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 overflow-y-auto bg-background">{children}</div>
      </div>
    </div>
  )
}

// ─── Composants Toolbar ──────────────────────────────────────────────────────

function ToolbarButton({
  onClick,
  active,
  disabled,
  children,
  title,
  label,
}: {
  onClick: () => void
  active?: boolean
  disabled?: boolean
  children: React.ReactNode
  title: string
  label?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 cursor-pointer ${
        active
          ? "bg-gold/15 text-gold font-bold"
          : "text-foreground-muted hover:text-navy hover:bg-background-secondary"
      } ${disabled ? "opacity-30 cursor-not-allowed" : ""}`}
    >
      {children}
      {label && <span className="hidden sm:inline">{label}</span>}
    </button>
  )
}

function ToolbarDivider() {
  return <div className="w-px h-5 bg-border mx-1 shrink-0" />
}

// ─── TiptapEditor ────────────────────────────────────────────────────────────

interface TiptapEditorProps {
  content: string
  onChange: (html: string) => void
  placeholder?: string
  minHeight?: string
  stickyOffset?: string
}

export function TiptapEditor({
  content,
  onChange,
  placeholder = "Rédigez votre réponse...",
  minHeight = "200px",
  stickyOffset = "64px",
}: TiptapEditorProps) {
  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  const [activeModal, setActiveModal] = useState<"link" | "image" | "video" | null>(null)
  const [linkUrl, setLinkUrl] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [videoInput, setVideoInput] = useState("")

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        dropcursor: { color: "var(--color-navy, #1B2A4E)", width: 2 },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "rounded-2xl max-w-full h-auto border border-border my-4 block shadow-xs",
        },
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-gold underline underline-offset-2 font-medium",
          rel: "noopener noreferrer",
          target: "_blank",
        },
      }) as any,
      Placeholder.configure({ placeholder }),
      VideoEmbed,
    ],
    content,
    editorProps: {
      attributes: {
        class: "outline-none",
      },
    },
    onUpdate({ editor }) {
      onChange(editor.getHTML())
    },
  })

  // Synchronisation du contenu asynchrone lors de l'ouverture/édition d'un article
  useEffect(() => {
    if (editor && content !== undefined && editor.getHTML() !== content) {
      editor.commands.setContent(content, false)
    }
  }, [content, editor])

  const handleImageUpload = useCallback(
    async (file: File) => {
      if (!editor) return
      const toastId = toast.loading("Téléversement de l'image vers Cloudflare R2...")
      try {
        const res = await uploadToCloudflare(file, undefined, "guides", "image")
        const finalUrl = res.secure_url || ""

        if (finalUrl) {
          editor
            .chain()
            .focus()
            .setImage({ src: finalUrl, alt: file.name })
            .insertContent({ type: "paragraph" })
            .focus("end")
            .run()
          toast.success("Image insérée avec succès !", { id: toastId })
          setActiveModal(null)
        } else {
          toast.error("Impossible de charger l'image", { id: toastId })
        }
      } catch {
        toast.error("Échec du chargement de l'image", { id: toastId })
      }
    },
    [editor]
  )

  const handleVideoUpload = useCallback(
    async (file: File) => {
      if (!editor) return
      const toastId = toast.loading("Téléversement de la vidéo vers Cloudflare R2...")
      try {
        const res = await uploadToCloudflare(file, undefined, "guides", "video")
        const finalUrl = res.secure_url || ""

        if (finalUrl) {
          editor
            .chain()
            .focus()
            .insertContent([
              {
                type: "videoEmbed",
                attrs: { video_url: finalUrl, stream_id: null, title: file.name },
              },
              {
                type: "paragraph",
              },
            ])
            .focus("end")
            .run()
          toast.success("Vidéo insérée avec succès !", { id: toastId })
          setActiveModal(null)
        } else {
          toast.error("Impossible de charger la vidéo", { id: toastId })
        }
      } catch {
        toast.error("Échec du chargement de la vidéo", { id: toastId })
      }
    },
    [editor]
  )

  const applyLink = () => {
    if (!editor) return
    if (!linkUrl.trim()) {
      editor.chain().focus().unsetLink().run()
    } else {
      let href = linkUrl.trim()
      if (!href.startsWith("http://") && !href.startsWith("https://")) {
        href = `https://${href}`
      }
      editor.chain().focus().setLink({ href }).run()
    }
    setActiveModal(null)
  }

  const applyImageUrl = () => {
    if (!editor || !imageUrl.trim()) return
    let src = imageUrl.trim()
    if (!src.startsWith("http://") && !src.startsWith("https://")) {
      src = `https://${src}`
    }
    editor
      .chain()
      .focus()
      .setImage({ src, alt: "Image" })
      .insertContent({ type: "paragraph" })
      .focus("end")
      .run()
    setImageUrl("")
    setActiveModal(null)
  }

  const applyVideoInput = () => {
    if (!editor || !videoInput.trim()) return
    const val = videoInput.trim()
    const isUrl = val.startsWith("http://") || val.startsWith("https://")
    editor
      .chain()
      .focus()
      .insertContent([
        {
          type: "videoEmbed",
          attrs: isUrl
            ? { video_url: val, stream_id: null, title: "Vidéo" }
            : { stream_id: val, video_url: null, title: "Vidéo" },
        },
        {
          type: "paragraph",
        },
      ])
      .focus("end")
      .run()
    setVideoInput("")
    setActiveModal(null)
  }

  if (!editor) return null

  return (
    <div className="border border-border rounded-2xl overflow-hidden bg-background focus-within:border-navy transition-colors shadow-2xs flex flex-col">
      {/* Inputs fichiers cachés */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleImageUpload(file)
          e.target.value = ""
        }}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleVideoUpload(file)
          e.target.value = ""
        }}
      />

      {/* Toolbar fixe en haut de l'éditeur */}
      <div className="flex flex-wrap items-center gap-1 px-3 py-2.5 border-b border-border bg-card shadow-sm overflow-x-auto shrink-0">
        {/* Annuler / Rétablir */}
        <div className="flex items-center gap-0.5">
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Annuler l'action"
          >
            <Undo className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Rétablir l'action"
          >
            <Redo className="w-4 h-4" />
          </ToolbarButton>
        </div>

        <ToolbarDivider />

        {/* Titres */}
        <div className="flex items-center gap-0.5">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor.isActive("heading", { level: 2 })}
            title="Titre de section"
            label="Titre H2"
          >
            <Heading2 className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            active={editor.isActive("heading", { level: 3 })}
            title="Sous-titre"
            label="H3"
          >
            <Heading3 className="w-4 h-4" />
          </ToolbarButton>
        </div>

        <ToolbarDivider />

        {/* Mise en forme */}
        <div className="flex items-center gap-0.5">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive("bold")}
            title="Gras"
          >
            <Bold className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive("italic")}
            title="Italique"
          >
            <Italic className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleStrike().run()}
            active={editor.isActive("strike")}
            title="Texte barré"
          >
            <Strikethrough className="w-4 h-4" />
          </ToolbarButton>
        </div>

        <ToolbarDivider />

        {/* Listes & Citations */}
        <div className="flex items-center gap-0.5">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive("bulletList")}
            title="Liste à puces"
          >
            <List className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive("orderedList")}
            title="Liste numérotée"
          >
            <ListOrdered className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={editor.isActive("blockquote")}
            title="Mettre en encadré / citation"
          >
            <Quote className="w-4 h-4" />
          </ToolbarButton>
        </div>

        <ToolbarDivider />

        {/* Liens et Médias (avec texte clair pour non-techniciens) */}
        <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border/50">
          <ToolbarButton
            onClick={() => {
              setLinkUrl(editor.getAttributes("link").href || "")
              setActiveModal("link")
            }}
            active={editor.isActive("link")}
            title="Ajouter un lien internet"
            label="Lien web"
          >
            <Link2 className="w-4 h-4 text-laha-gold" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => setActiveModal("image")}
            title="Insérer une photo ou illustration"
            label="Ajouter Image"
          >
            <ImageIcon className="w-4 h-4 text-emerald-500" />
          </ToolbarButton>

          <ToolbarButton
            onClick={() => setActiveModal("video")}
            title="Insérer une vidéo explicative"
            label="Ajouter Vidéo"
          >
            <Video className="w-4 h-4 text-sky-500" />
          </ToolbarButton>
        </div>
      </div>

      {/* Zone d'édition principale avec défilement interne */}
      <div
        style={{ minHeight }}
        className="p-5 sm:p-7 prose prose-sm dark:prose-invert max-w-none focus:outline-none overflow-y-auto max-h-[60vh] sm:max-h-[650px]"
      >
        <EditorContent editor={editor} />
      </div>

      {/* ── Modale Lien ── */}
      {activeModal === "link" && (
        <EditorModal title="Insérer un lien web" onClose={() => setActiveModal(null)}>
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Saisissez ou collez l'adresse de la page web (ex: www.exemple.com).
            </p>
            <input
              type="text"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://www.exemple.com"
              className="w-full h-10 px-3 bg-background border border-border rounded-xl text-sm text-foreground outline-none focus:border-laha-gold"
              autoFocus
            />
            <div className="flex justify-end gap-2 pt-2">
              {editor.isActive("link") && (
                <button
                  type="button"
                  onClick={() => {
                    editor.chain().focus().unsetLink().run()
                    setActiveModal(null)
                  }}
                  className="px-3 py-1.5 text-xs font-bold text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                >
                  Supprimer le lien
                </button>
              )}
              <button
                type="button"
                onClick={applyLink}
                className="px-4 py-1.5 bg-foreground text-background text-xs font-bold rounded-lg hover:opacity-90"
              >
                Appliquer
              </button>
            </div>
          </div>
        </EditorModal>
      )}

      {/* ── Modale Image ── */}
      {activeModal === "image" && (
        <EditorModal title="Ajouter une image" onClose={() => setActiveModal(null)}>
          <div className="space-y-5">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-foreground-muted block mb-2 font-mono">
                Option 1 : Choisir un fichier depuis votre appareil
              </label>
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="w-full py-5 border-2 border-dashed border-border hover:border-gold/60 rounded-xl bg-background-secondary flex flex-col items-center justify-center gap-2 transition-colors cursor-pointer group"
              >
                <Upload className="w-6 h-6 text-foreground-muted group-hover:text-gold transition-colors" />
                <span className="text-xs font-bold text-navy">Parcourir vos fichiers...</span>
              </button>
            </div>

            <div className="border-t border-border pt-4">
              <label className="text-xs font-bold uppercase tracking-wider text-foreground-muted block mb-1.5 font-mono">
                Option 2 : Coller l&apos;adresse d&apos;une image web (Cloudflare R2)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://...r2.cloudflarestorage.com/photo.webp"
                  className="flex-1 h-10 px-3 bg-background border border-border rounded-xl text-xs text-foreground outline-none focus:border-navy"
                />
                <button
                  type="button"
                  onClick={applyImageUrl}
                  className="px-4 py-2 bg-navy text-white text-xs font-bold rounded-xl hover:bg-navy-dark cursor-pointer shadow-xs"
                >
                  Valider
                </button>
              </div>
            </div>
          </div>
        </EditorModal>
      )}

      {/* ── Modale Vidéo ── */}
      {activeModal === "video" && (
        <EditorModal title="Ajouter une vidéo" onClose={() => setActiveModal(null)}>
          <div className="space-y-5">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-foreground-muted block mb-2 font-mono">
                Option 1 : Importer une vidéo depuis votre ordinateur
              </label>
              <button
                type="button"
                onClick={() => videoInputRef.current?.click()}
                className="w-full py-5 border-2 border-dashed border-border hover:border-gold/60 rounded-xl bg-background-secondary flex flex-col items-center justify-center gap-2 transition-colors cursor-pointer group"
              >
                <Upload className="w-6 h-6 text-foreground-muted group-hover:text-gold transition-colors" />
                <span className="text-xs font-bold text-navy">Téléverser une vidéo...</span>
              </button>
            </div>

            <div className="border-t border-border pt-4">
              <label className="text-xs font-bold uppercase tracking-wider text-foreground-muted block mb-1.5 font-mono">
                Option 2 : Coller un lien vidéo (Cloudflare R2 MP4 ou URL)
              </label>
              <p className="text-[11px] text-foreground-muted mb-2">
                Entrez une URL directe Cloudflare R2 (ex: .mp4, .webm) ou un lien vidéo web.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={videoInput}
                  onChange={(e) => setVideoInput(e.target.value)}
                  placeholder="https://...r2.cloudflarestorage.com/video.mp4"
                  className="flex-1 h-10 px-3 bg-background border border-border rounded-xl text-xs text-foreground outline-none focus:border-navy"
                />
                <button
                  type="button"
                  onClick={applyVideoInput}
                  className="px-4 py-2 bg-navy text-white text-xs font-bold rounded-xl hover:bg-navy-dark cursor-pointer shadow-xs"
                >
                  Valider
                </button>
              </div>
            </div>
          </div>
        </EditorModal>
      )}
    </div>
  )
}