"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  HelpCircle,
  Search,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Info,
  Mail,
  Sparkles,
  ExternalLink,
  Shield,
  Layers,
  ShoppingBag,
  Truck,
  GraduationCap,
  Building2,
  PenTool,
  Clock,
  Video,
  Image as ImageIcon,
  CheckCircle2,
  ArrowUp,
  MessageSquare,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { ContactSupportDialog } from "@/components/ui/contact-support-dialog";

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

export interface GuideArticle {
  id: string;
  target_role: string;
  category_label: string;
  title: string;
  summary: string;
  content?: string;
  image_url?: string;
  video_url?: string;
  steps: GuideStep[];
  faq: GuideFAQ[];
  order: number;
}

interface RoleGuideViewProps {
  role: string;
  roleLabel: string;
  initialArticles?: GuideArticle[];
}

export function RoleGuideView({ role, roleLabel, initialArticles }: RoleGuideViewProps) {
  const { user } = useAuth();
  const [articles, setArticles] = useState<GuideArticle[]>(initialArticles || []);
  const [loading, setLoading] = useState(!initialArticles);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeArticleId, setActiveArticleId] = useState<string | null>(null);
  const [openFaqIndices, setOpenFaqIndices] = useState<{ [key: string]: boolean }>({});
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const articleRefs = useRef<{ [key: string]: HTMLElement | null }>({});

  // Récupération des guides depuis l'API Django
  useEffect(() => {
    if (initialArticles && initialArticles.length > 0) {
      setArticles(initialArticles);
      setActiveArticleId(initialArticles[0].id);
      setLoading(false);
      return;
    }

    const fetchRoleGuides = async () => {
      try {
        setLoading(true);
        console.log(`[ROLE GUIDE UI] Chargement des guides pour rôle "${role}" depuis /api/v1/guides/?role=${role}...`);
        const res = await fetch(`/api/v1/guides/?role=${role}`);
        if (res.ok) {
          const data = await res.json();
          const rawList = Array.isArray(data) ? data : (data?.results || []);
          console.log(`[ROLE GUIDE UI] Données reçues depuis PostgreSQL:`, rawList);

          const flattenedArticles: GuideArticle[] = [];
          rawList.forEach((catItem: any) => {
            if (Array.isArray(catItem.articles)) {
              catItem.articles.forEach((art: any) => {
                flattenedArticles.push({
                  ...art,
                  category_label: catItem.title || "Général",
                  target_role: role,
                  steps: art.steps || [],
                  faq: art.faq || [],
                });
              });
            } else if (catItem.title && catItem.content !== undefined) {
              flattenedArticles.push(catItem);
            }
          });

          console.log(`[ROLE GUIDE UI] ${flattenedArticles.length} articles disponibles pour "${role}":`, flattenedArticles);
          setArticles(flattenedArticles);
          if (flattenedArticles.length > 0) {
            setActiveArticleId(flattenedArticles[0].id);
          }
        }
      } catch (err) {
        console.error("[ROLE GUIDE UI] Erreur:", err);
        setArticles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRoleGuides();
  }, [role, initialArticles]);

  // Observer pour détecter automatiquement l'article visible au défilement
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Regroupement des articles par catégorie
  const categoriesMap = useMemo(() => {
    const map = new Map<string, GuideArticle[]>();
    articles.forEach((art) => {
      const cat = art.category_label || "Général";
      if (!map.has(cat)) {
        map.set(cat, []);
      }
      map.get(cat)!.push(art);
    });
    return map;
  }, [articles]);

  // Filtrage selon la recherche
  const filteredArticles = useMemo(() => {
    if (!searchQuery.trim()) return articles;
    const q = searchQuery.toLowerCase();
    return articles.filter(
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
  }, [articles, searchQuery]);

  // Défilement fluide vers un article lors du clic dans la table des matières
  const scrollToArticle = (id: string) => {
    setActiveArticleId(id);
    const elem = articleRefs.current[id];
    if (elem) {
      elem.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const toggleFaq = (faqKey: string) => {
    setOpenFaqIndices((prev) => ({
      ...prev,
      [faqKey]: !prev[faqKey],
    }));
  };

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto">
      {/* En-tête Page Dashboard — Style Chic & Noble */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gold/10 border border-gold/30 flex items-center justify-center text-gold shrink-0 shadow-xs">
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-gold font-mono">
              <Shield className="w-3.5 h-3.5 text-gold" />
              Documentation Officielle
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy tracking-tight">
              Guide d&apos;utilisation {roleLabel}
            </h1>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsContactOpen(true)}
          className="h-11 px-5 rounded-xl bg-gold hover:bg-gold-hover text-navy font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shrink-0 shadow-xs"
        >
          <Mail className="w-4 h-4" />
          <span>Poser une question</span>
        </button>
      </div>

      {articles.length === 0 && !loading ? (
        /* État vide soigné */
        <div className="py-20 text-center bg-background-secondary rounded-3xl border border-dashed border-border p-8 space-y-4 max-w-xl mx-auto">
          <HelpCircle className="w-12 h-12 text-foreground-muted mx-auto" />
          <h3 className="font-serif font-bold text-xl text-navy">
            Guide d&apos;utilisation en cours de rédaction
          </h3>
          <p className="text-xs sm:text-sm text-foreground-muted leading-relaxed">
            L&apos;administration est en train de préparer les articles d&apos;aide, tutoriels pas-à-pas et vidéos explicatives pour le profil <strong>{roleLabel}</strong>.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setIsContactOpen(true)}
              className="h-11 px-6 rounded-xl bg-navy hover:bg-navy-dark text-white font-bold text-xs inline-flex items-center gap-2 shadow-sm cursor-pointer transition-colors"
            >
              <Mail className="w-4 h-4 text-gold" />
              <span>Contacter l&apos;équipe support</span>
            </button>
          </div>
        </div>
      ) : (
        /* Layout 2 Colonnes — Table des matières fixe à gauche + Contenu complet à droite */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* COLONNE GAUCHE : TABLE DES MATIÈRES (Sticky Desktop) */}
          <aside className="lg:col-span-4 bg-background-secondary rounded-3xl border border-border p-5 sm:p-6 lg:sticky lg:top-6 space-y-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-navy font-mono flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-gold" />
                Table des matières
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-navy/5 text-foreground-muted">
                {articles.length} article{articles.length > 1 ? "s" : ""}
              </span>
            </div>

            <nav className="space-y-6 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
              {Array.from(categoriesMap.entries()).map(([categoryTitle, catArticles]) => (
                <div key={categoryTitle} className="space-y-2">
                  <h3 className="text-[11px] font-bold text-navy uppercase tracking-wider pl-1">
                    {categoryTitle}
                  </h3>
                  <ul className="space-y-1">
                    {catArticles.map((art, idx) => {
                      const isActive = activeArticleId === art.id;
                      return (
                        <li key={art.id}>
                          <button
                            type="button"
                            onClick={() => scrollToArticle(art.id)}
                            className={`w-full text-left text-xs py-2 px-3 rounded-xl transition-all cursor-pointer flex items-start gap-2 leading-relaxed ${
                              isActive
                                ? "bg-gold/15 text-gold font-bold shadow-2xs"
                                : "text-foreground-muted hover:text-navy hover:bg-background"
                            }`}
                          >
                            <span className="shrink-0 font-mono text-[11px] mt-0.5">{idx + 1}.</span>
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

          {/* COLONNE DROITE : CONTENU PRINCIPAL DU CENTRE D'AIDE */}
          <main className="lg:col-span-8 space-y-8">
            {/* Boîte de recherche principale */}
            <div className="bg-background-secondary rounded-3xl border border-border p-6 sm:p-8 space-y-4 shadow-xs">
              <div className="space-y-1">
                <h2 className="font-serif text-2xl font-bold text-navy">
                  Centre d&apos;aide {roleLabel}
                </h2>
                <p className="text-xs sm:text-sm text-foreground-muted">
                  Parcourez les guides, démarches et réponses aux questions fréquentes.
                </p>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-foreground-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un mot-clé, une action, une démarche..."
                  className="w-full h-11 pl-10 pr-16 bg-background border border-border rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:border-navy"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-foreground-muted hover:text-navy px-1.5 py-0.5 rounded cursor-pointer"
                  >
                    Effacer
                  </button>
                )}
              </div>
            </div>

            {/* Flux de lecture ordonné par catégorie */}
            <div className="space-y-10">
              {Array.from(categoriesMap.entries()).map(([categoryTitle, catArticles]) => {
                const categoryFilteredArticles = catArticles.filter((art) =>
                  filteredArticles.some((f) => f.id === art.id)
                );

                if (categoryFilteredArticles.length === 0) return null;

                return (
                  <section key={categoryTitle} className="space-y-6">
                    <div className="border-b border-border pb-2">
                      <h3 className="font-serif text-xl font-bold text-navy flex items-center gap-2">
                        <span>{categoryTitle}</span>
                      </h3>
                    </div>

                    <div className="space-y-8">
                      {categoryFilteredArticles.map((art, idx) => (
                        <article
                          key={art.id}
                          ref={(el) => {
                            articleRefs.current[art.id] = el;
                          }}
                          className="bg-background-secondary rounded-3xl border border-border p-6 sm:p-8 space-y-6 shadow-xs scroll-mt-6"
                        >
                          {/* En-tête de l'Article */}
                          <div className="space-y-2 border-b border-border pb-4">
                            <h4 className="font-serif text-lg sm:text-xl font-bold text-navy leading-snug">
                              {idx + 1}. {art.title}
                            </h4>
                            {art.summary && art.summary !== art.title && (
                              <p className="text-xs sm:text-sm text-foreground-muted leading-relaxed">
                                {art.summary}
                              </p>
                            )}
                          </div>

                          {/* Contenu Enrichi Tiptap (contenant tout : texte, listes, images R2 et vidéos) */}
                          {art.content ? (
                            <div
                              className="tiptap-content text-xs sm:text-sm text-foreground-muted leading-relaxed space-y-4 [&_img]:rounded-2xl [&_img]:my-4 [&_img]:max-w-full [&_img]:h-auto [&_img]:block [&_img]:shadow-xs [&_video]:rounded-2xl [&_video]:border-0 [&_video]:my-4 [&_video]:w-full [&_video]:max-w-2xl [&_video]:bg-black [&_video]:outline-none [&_video]:block [&_video]:mx-auto [&_div[data-video-embed]]:border-0 [&_div[data-video-embed]]:bg-black [&_div[data-video-embed]]:rounded-2xl [&_div[data-video-embed]]:overflow-hidden [&_h2]:text-navy [&_h2]:font-bold [&_h2]:text-base [&_h2]:mt-4 [&_h3]:text-navy [&_h3]:font-bold [&_h3]:text-sm [&_h3]:mt-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1 [&_p]:leading-relaxed"
                              dangerouslySetInnerHTML={{ __html: art.content }}
                            />
                          ) : (
                            <p className="text-xs text-foreground-muted italic">
                              Contenu en cours de rédaction.
                            </p>
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
      )}

      {/* Bouton Flottant Remonter en Haut */}
      {showScrollTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 z-40 p-3 rounded-full bg-navy text-white hover:bg-navy-dark shadow-lg transition-all cursor-pointer"
          title="Remonter en haut de page"
        >
          <ArrowUp className="w-5 h-5 text-gold" />
        </button>
      )}

      {/* Modale de Contact Support globale */}
      <ContactSupportDialog open={isContactOpen} onOpenChange={setIsContactOpen} />
    </div>
  );
}
