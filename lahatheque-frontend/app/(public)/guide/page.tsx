"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  BookOpen,
  Search,
  HelpCircle,
  Shield,
  Layers,
  ShoppingBag,
  Truck,
  GraduationCap,
  Building2,
  PenTool,
  CheckCircle2,
  ChevronDown,
  Mail,
  PlusCircle,
  Phone,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Info,
  Clock,
  Video,
  Image as ImageIcon,
  Play,
  FileText,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { ContactSupportDialog } from "@/components/ui/contact-support-dialog";

interface GuideStep {
  title: string;
  description: string;
  tip?: string;
  image_url?: string;
  video_url?: string;
  actionLink?: {
    label: string;
    href: string;
  };
}

interface GuideFAQ {
  question: string;
  answer: string;
}

interface GuideSection {
  id: string;
  target_role: string;
  categoryLabel: string;
  title: string;
  summary: string;
  content?: string;
  icon_name?: string;
  image_url?: string;
  video_url?: string;
  popularKeywords?: string[];
  steps: GuideStep[];
  faq: GuideFAQ[];
}

export default function GuidePage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [dynamicGuides, setDynamicGuides] = useState<GuideSection[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  // Récupérer les guides créés par l'Admin depuis l'API Django
  const fetchGuides = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/v1/communications/guides/");
      if (res.ok) {
        const data = await res.json();
        const rawList = Array.isArray(data) ? data : (data?.results || []);
        const mapped: GuideSection[] = rawList.map((item: any) => ({
          id: item.id || item.target_role,
          target_role: item.target_role,
          categoryLabel: item.category_label || item.target_role_display || item.target_role,
          title: item.title,
          summary: item.summary,
          content: item.content || "",
          icon_name: item.icon_name || "BookOpen",
          image_url: item.image_url || "",
          video_url: item.video_url || "",
          popularKeywords: item.popular_keywords || [],
          steps: (item.steps || []).map((s: any) => ({
            title: s.title,
            description: s.description,
            tip: s.tip || "",
            image_url: s.image_url || "",
            video_url: s.video_url || "",
          })),
          faq: item.faq || [],
        }));
        setDynamicGuides(mapped);
        if (mapped.length > 0) {
          setExpandedSection(mapped[0].id);
        }
      } else {
        setDynamicGuides([]);
      }
    } catch {
      setDynamicGuides([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuides();
  }, []);

  // Sélection du rôle par défaut
  useEffect(() => {
    if (user?.role && !isAdmin) {
      setSelectedRole(user.role);
    } else {
      setSelectedRole("all");
    }
  }, [user, isAdmin]);

  // Filtrage des guides publiés créés par l'Admin
  const visibleGuides = useMemo(() => {
    return dynamicGuides.filter((sec) => {
      if (user && !isAdmin) {
        if (sec.target_role !== user.role && sec.target_role !== "public") return false;
      } else if (isAdmin && selectedRole !== "all") {
        if (sec.target_role !== selectedRole) return false;
      } else if (!user && selectedRole !== "all") {
        if (sec.target_role !== selectedRole) return false;
      }

      if (!searchQuery.trim()) return true;

      const query = searchQuery.toLowerCase();
      return (
        sec.title.toLowerCase().includes(query) ||
        sec.summary.toLowerCase().includes(query) ||
        sec.categoryLabel.toLowerCase().includes(query) ||
        (sec.content && sec.content.toLowerCase().includes(query)) ||
        (sec.popularKeywords && sec.popularKeywords.some((k) => k.toLowerCase().includes(query))) ||
        sec.steps.some(
          (s) =>
            s.title.toLowerCase().includes(query) ||
            s.description.toLowerCase().includes(query) ||
            (s.tip && s.tip.toLowerCase().includes(query))
        ) ||
        sec.faq.some((f) => f.question.toLowerCase().includes(query) || f.answer.toLowerCase().includes(query))
      );
    });
  }, [dynamicGuides, user, isAdmin, selectedRole, searchQuery]);

  // JSON-LD Schema pour SEO Google
  const jsonLdData = useMemo(() => {
    const allFaqs = visibleGuides.flatMap((g) => g.faq);
    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: allFaqs.map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: f.answer,
        },
      })),
    };
  }, [visibleGuides]);

  return (
    <div className="min-h-screen bg-background text-foreground py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      {/* Balise SEO JSON-LD */}
      {visibleGuides.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
        />
      )}

      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* En-tête Principal — Copywriting & SEO */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navy/5 border border-gold/30 text-gold text-xs font-bold uppercase tracking-wider font-mono">
            <HelpCircle className="w-4 h-4 text-gold" />
            Centre d&apos;Aide &amp; Guides Officiels
          </div>
          
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-navy tracking-tight leading-tight">
            Guide d&apos;utilisation LAHAThèque
          </h1>

          <p className="text-sm sm:text-base text-foreground-muted leading-relaxed max-w-2xl mx-auto">
            {user && !isAdmin
              ? `Retrouvez les guides et tutoriels officiels préparés par l'administration pour votre profil ${user.role}.`
              : "Consultez les guides pratiques officiels pour maîtriser l'ensemble des fonctionnalités de la plateforme."}
          </p>

          {/* Si Administrateur connecté : Bouton d'accès direct au CMS Admin */}
          {isAdmin && (
            <div className="pt-2 flex items-center justify-center gap-3">
              <Link
                href="/admin/guides"
                className="h-11 px-5 rounded-xl bg-navy hover:bg-navy-dark text-white font-bold text-xs shadow-md inline-flex items-center gap-2 transition-colors"
              >
                <PlusCircle className="w-4 h-4 text-gold" />
                <span>Gérer &amp; Rédiger les Guides (CMS Admin)</span>
              </Link>
            </div>
          )}

          {/* Barre de Recherche Intuitive */}
          {dynamicGuides.length > 0 && (
            <div className="pt-2 max-w-xl mx-auto space-y-3">
              <div className="relative">
                <Search className="w-5 h-5 text-foreground-muted absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher une démarche, un mot-clé ou une question..."
                  className="w-full h-12 pl-12 pr-4 bg-background-secondary border border-border rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:border-navy shadow-xs"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-foreground-muted hover:text-navy px-2 py-1 rounded cursor-pointer"
                  >
                    Effacer
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sélecteur de Rôles / Onglets (Visible pour l'Admin ou les visiteurs publics si plusieurs guides existent) */}
        {(isAdmin || !user) && dynamicGuides.length > 0 && (
          <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-2">
            <button
              type="button"
              onClick={() => setSelectedRole("all")}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer shrink-0 border ${
                selectedRole === "all"
                  ? "bg-navy text-white border-navy font-bold shadow-xs"
                  : "bg-background-secondary text-foreground-muted border-border hover:text-navy hover:border-gold"
              }`}
            >
              Tous les guides ({dynamicGuides.length})
            </button>
            {Array.from(new Set(dynamicGuides.map((g) => g.target_role))).map((roleKey) => {
              const sample = dynamicGuides.find((g) => g.target_role === roleKey);
              return (
                <button
                  key={roleKey}
                  type="button"
                  onClick={() => setSelectedRole(roleKey)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer shrink-0 border ${
                    selectedRole === roleKey
                      ? "bg-navy text-white border-navy font-bold shadow-xs"
                      : "bg-background-secondary text-foreground-muted border-border hover:text-navy hover:border-gold"
                  }`}
                >
                  {sample?.categoryLabel || roleKey}
                </button>
              );
            })}
          </div>
        )}

        {/* Message d'Accompagnement Personnalisé pour l'utilisateur connecté */}
        {user && !isAdmin && (
          <div className="p-4 sm:p-5 rounded-2xl bg-navy/5 border border-gold/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-navy text-gold flex items-center justify-center shrink-0 border border-gold/20 shadow-xs">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-xs sm:text-sm text-navy">
                  Espace Guide &amp; Assistance dédié
                </h3>
                <p className="text-xs text-foreground-muted">
                  Documentation officielle rédigée par l&apos;administration pour votre profil <strong>{user.role}</strong>.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent("app-open-contact"))}
              className="h-9 px-4 rounded-xl bg-gold hover:bg-gold-hover text-navy font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Poser une question</span>
            </button>
          </div>
        )}

        {/* Liste des Guides et Démarches Pas-à-Pas créés par l'Admin */}
        {visibleGuides.length > 0 ? (
          <div className="space-y-6">
            {visibleGuides.map((sec) => {
              const isExpanded = expandedSection === sec.id;
              return (
                <article
                  key={sec.id}
                  className="bg-background-secondary rounded-3xl border border-border overflow-hidden transition-all shadow-xs"
                >
                  {/* En-tête de la fiche de guide */}
                  <button
                    type="button"
                    onClick={() => setExpandedSection(isExpanded ? null : sec.id)}
                    className="w-full p-6 sm:p-8 flex items-start sm:items-center justify-between gap-4 text-left cursor-pointer hover:bg-background/40 transition-colors"
                  >
                    <div className="flex items-start sm:items-center gap-4 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-background border border-border flex items-center justify-center shrink-0 shadow-xs text-gold">
                        <BookOpen className="w-6 h-6" />
                      </div>
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-gold uppercase tracking-wider block font-mono">
                            {sec.categoryLabel}
                          </span>
                        </div>
                        <h2 className="font-serif font-bold text-lg sm:text-xl text-navy leading-snug">
                          {sec.title}
                        </h2>
                        <p className="text-xs sm:text-sm text-foreground-muted line-clamp-2">
                          {sec.summary}
                        </p>
                      </div>
                    </div>

                    <div
                      className={`p-2 rounded-xl bg-background border border-border text-foreground-muted transition-transform duration-200 shrink-0 ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </button>

                  {/* Contenu Déroulé */}
                  {isExpanded && (
                    <div className="px-6 sm:px-8 pb-8 pt-2 border-t border-border space-y-8 animate-in fade-in duration-200">
                      
                      {/* Médias d'En-tête (Illustration / Vidéo) */}
                      {(sec.image_url || sec.video_url) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                          {sec.image_url && (
                            <div className="rounded-2xl overflow-hidden border border-border bg-background shadow-xs max-h-72">
                              <img
                                src={sec.image_url}
                                alt={sec.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          {sec.video_url && (
                            <div className="rounded-2xl overflow-hidden border border-border bg-black shadow-xs max-h-72 flex items-center justify-center">
                              <video
                                src={sec.video_url}
                                controls
                                playsInline
                                className="w-full h-full object-cover rounded-2xl"
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Contenu Riche (HTML / Texte formaté avec images et vidéos insérées dans le texte) */}
                      {sec.content && (
                        <div className="p-6 rounded-2xl bg-background border border-border text-xs sm:text-sm text-foreground-muted leading-relaxed space-y-3">
                          <div className="flex items-center gap-2 text-navy font-bold text-xs uppercase tracking-wider border-b border-border pb-2">
                            <Sparkles className="w-4 h-4 text-gold" />
                            <span>Description détaillée &amp; Tutoriel</span>
                          </div>
                          <div
                            className="tiptap-content prose max-w-none text-foreground leading-relaxed space-y-3 [&_img]:rounded-2xl [&_img]:border [&_img]:border-border [&_img]:my-4 [&_video]:rounded-2xl [&_video]:border [&_video]:border-border [&_video]:my-4 [&_video]:w-full [&_video]:max-w-2xl [&_h2]:text-navy [&_h2]:font-bold [&_h2]:text-base [&_h3]:text-navy [&_h3]:font-bold [&_h3]:text-sm [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
                            dangerouslySetInnerHTML={{ __html: sec.content }}
                          />
                        </div>
                      )}

                      {/* Étapes pas-à-pas avec illustrations et vidéos dédiées */}
                      {sec.steps && sec.steps.length > 0 && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-gold" />
                            <h3 className="font-bold text-xs uppercase tracking-wider text-navy">
                              La démarche pas-à-pas ({sec.steps.length} étapes) :
                            </h3>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {sec.steps.map((step, idx) => (
                              <div
                                key={idx}
                                className="p-5 rounded-2xl bg-background border border-border space-y-3 flex flex-col justify-between"
                              >
                                <div className="space-y-2">
                                  <div className="flex items-start gap-2.5">
                                    <span className="w-6 h-6 rounded-full bg-gold/15 text-gold font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 border border-gold/30">
                                      {idx + 1}
                                    </span>
                                    <h4 className="font-semibold text-xs sm:text-sm text-navy leading-snug">
                                      {step.title}
                                    </h4>
                                  </div>
                                  <p className="text-xs text-foreground-muted leading-relaxed pl-8">
                                    {step.description}
                                  </p>

                                  {/* Médias dédiés à cette étape */}
                                  {(step.image_url || step.video_url) && (
                                    <div className="pl-8 pt-2 space-y-2">
                                      {step.image_url && (
                                        <div className="rounded-xl overflow-hidden border border-border">
                                          <img
                                            src={step.image_url}
                                            alt={step.title}
                                            className="w-full h-36 object-cover"
                                          />
                                        </div>
                                      )}
                                      {step.video_url && (
                                        <div className="rounded-xl overflow-hidden border border-border bg-black">
                                          <video
                                            src={step.video_url}
                                            controls
                                            playsInline
                                            className="w-full h-36 object-cover"
                                          />
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>

                                {step.tip && (
                                  <div className="pl-8 pt-2">
                                    <div className="flex items-start gap-1.5 text-[11px] text-foreground-muted bg-background-secondary p-2.5 rounded-xl border border-border">
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

                      {/* Foire Aux Questions (FAQ) */}
                      {sec.faq && sec.faq.length > 0 && (
                        <div className="space-y-4 pt-4 border-t border-border">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-navy" />
                            <h3 className="font-bold text-xs uppercase tracking-wider text-navy">
                              Questions fréquentes :
                            </h3>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                            {sec.faq.map((item, qIdx) => (
                              <div
                                key={qIdx}
                                className="p-4 sm:p-5 rounded-2xl bg-background border border-border space-y-2"
                              >
                                <h4 className="font-semibold text-xs sm:text-sm text-navy flex items-start gap-2">
                                  <HelpCircle className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                                  <span>{item.question}</span>
                                </h4>
                                <p className="text-xs text-foreground-muted leading-relaxed pl-6">
                                  {item.answer}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          /* État vide si l'administrateur n'a pas encore créé de guide */
          <div className="text-center py-16 bg-background-secondary rounded-3xl border border-dashed border-border p-8 space-y-4">
            <HelpCircle className="w-12 h-12 text-foreground-muted mx-auto" />
            <h3 className="font-serif font-bold text-lg text-navy">
              {isAdmin
                ? "Aucun guide d'utilisation n'est encore publié"
                : user
                ? `Guide d'utilisation ${user.role} en cours de rédaction`
                : "Centre d'aide en cours d'actualisation"}
            </h3>
            <p className="text-xs sm:text-sm text-foreground-muted max-w-md mx-auto leading-relaxed">
              {isAdmin
                ? "Vous avez le contrôle total : rendez-vous sur le CMS pour concevoir, illustrer (Cloudflare R2), ajouter vos vidéos MP4 et publier les guides pour chaque métier (Lecteurs, Grossistes, Éditeurs, Auteurs et Administrateurs)."
                : "L'administration prépare actuellement les tutoriels pas-à-pas et vidéos explicatives dédiés à votre profil. Notre équipe d'assistance reste à votre disposition en direct."}
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              {isAdmin ? (
                <Link
                  href="/admin/guides"
                  className="h-11 px-6 rounded-xl bg-navy hover:bg-navy-dark text-white font-bold text-xs inline-flex items-center gap-2 shadow-md cursor-pointer transition-colors"
                >
                  <PlusCircle className="w-4 h-4 text-gold" />
                  <span>Rédiger le premier guide (CMS Admin)</span>
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsContactOpen(true)}
                  className="h-11 px-6 rounded-xl bg-navy text-white text-xs font-bold cursor-pointer hover:bg-navy-dark transition-colors inline-flex items-center gap-2 shadow-md"
                >
                  <Mail className="w-4 h-4 text-gold" />
                  <span>Contacter le support d&apos;aide</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Bannière de Contact & Assistance Humaine Directe */}
        <div className="rounded-3xl bg-navy p-6 sm:p-10 border border-border text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest text-gold">
              <Clock className="w-3.5 h-3.5 text-gold" />
              Support client disponible du lundi au vendredi
            </div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-white">
              Une question spécifique non résolue ?
            </h2>
            <p className="text-xs sm:text-sm text-white/80 max-w-xl leading-relaxed">
              Nos conseillers sont disponibles pour vous guider par message écrit ou par téléphone. Réponse garantie en moins de 2 heures ouvrées.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setIsContactOpen(true)}
              className="py-3.5 px-6 rounded-xl bg-gold hover:bg-gold-hover text-navy font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <Mail className="w-4 h-4" />
              <span>Ouvrir le formulaire d&apos;aide</span>
            </button>
          </div>
        </div>

      </div>

      {/* Modale de Contact Support globale */}
      <ContactSupportDialog open={isContactOpen} onOpenChange={setIsContactOpen} />
    </div>
  );
}
