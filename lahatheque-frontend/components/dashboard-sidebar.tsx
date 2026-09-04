"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { UserAvatar } from "@/components/ui/user-avatar";
import {
  AnimatedSidebar,
  AnimatedSidebarHeader,
  AnimatedSidebarContent,
  AnimatedSidebarFooter,
  AnimatedSidebarGroup,
  AnimatedSidebarGroupLabel,
  AnimatedSidebarGroupContent,
  AnimatedSidebarMenu,
  AnimatedSidebarMenuItem,
  AnimatedSidebarMenuButton,
  AnimatedSidebarMenuSub,
  AnimatedSidebarMenuSubItem,
  AnimatedSidebarMenuSubButton,
  AnimatedSidebarRail,
  AnimatedSidebarClose,
  useAnimatedSidebar,
} from "@/components/motion/animated-sidebar";
import {
  LayoutDashboard,
  BookOpen,
  PenTool,
  Users,
  FileCheck,
  Briefcase,
  ShieldCheck,
  Settings,
  DollarSign,
  LogOut,
  User as UserIcon,
  GraduationCap,
  Bookmark,
  ShoppingBag,
  PackageCheck,
  Search,
  Sparkles,
  BellRing,
  Edit2,
  FileSpreadsheet,
  Key,
  Activity,
  Warehouse,
  Truck,
  AlertTriangle,
  Package,
  FileBarChart,
  ArrowUpCircle,
  PlusCircle,
  CheckSquare,
  History,
  Percent,
  UploadCloud,
  Clock,
  Building2,
  Scale,
  FileCheck2,
  Boxes,
  TrendingDown,
  BookOpenCheck,
  Wallet,
  Landmark,
  Layers,
  Tag,
  PanelLeft,
  Globe,
  HelpCircle,
  Mail,
} from "lucide-react";

interface SubLinkItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
}

interface NavLinkItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
  sublinks?: SubLinkItem[];
}

export function DashboardSidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [openSection, setOpenSection] = useState<string | null>(null);

  const getLinks = (): { groupLabel?: string; items: NavLinkItem[] }[] => {
    switch (user?.role) {
      case "student":
        return [
          {
            groupLabel: "Mon Espace",
            items: [
              { label: "Espace Lecteur", href: "/student", icon: <LayoutDashboard className="size-4" /> },
              { label: "Catalogue & Recherche", href: "/student/catalog", icon: <Search className="size-4" /> },
              { label: "Ma Bibliothèque", href: "/student/books", icon: <BookOpen className="size-4" /> },
              { label: "Bouquets Documentaires", href: "/student/bouquets", icon: <Layers className="size-4" /> },
              { label: "Achats & Commandes", href: "/student/orders", icon: <PackageCheck className="size-4" /> },
              { label: "Historique & Stats", href: "/student/history", icon: <History className="size-4" /> },
              // Désactivé conformément au CDC v3.2 (le Client souscrit directement aux
              // bouquets, sans affiliation universitaire — voir Fiches X1-X4). Réactiver
              // cette ligne si le besoin métier évolue.
              // { label: "Mon Université", href: "/student/university", icon: <GraduationCap className="size-4" /> },
              { label: "Profil & Paramètres", href: "/student/profile", icon: <UserIcon className="size-4" /> },
            ],
          },
        ];

      case "wholesaler":
      case "super_client":
        return [
          {
            groupLabel: "Espace Grossiste",
            items: [
              { label: "Vue d'ensemble", href: "/wholesaler", icon: <LayoutDashboard className="size-4" /> },
              { label: "Catalogue & Tarifs Gros", href: "/wholesaler/catalog", icon: <BookOpen className="size-4" /> },
              {
                label: "Commandes Groupées",
                href: "/wholesaler/orders",
                icon: <PackageCheck className="size-4" />,
                sublinks: [
                  { label: "Toutes les Commandes", href: "/wholesaler/orders", icon: <PackageCheck className="size-3.5" /> },
                  { label: "Nouvelle Commande", href: "/wholesaler/orders/new", icon: <PlusCircle className="size-3.5" /> },
                ],
              },
              { label: "Nouveautés & Ventes", href: "/wholesaler/notifications", icon: <BellRing className="size-4" /> },
              { label: "Profil & Facturation", href: "/wholesaler/profile", icon: <UserIcon className="size-4" /> },
            ],
          },
        ];

      case "university":
        return [
          {
            groupLabel: "Espace Université",
            items: [
              { label: "Vue d'ensemble", href: "/university", icon: <LayoutDashboard className="size-4" /> },
              { label: "Bouquets Documentaires", href: "/university/bouquets", icon: <Sparkles className="size-4" /> },
              { label: "Catalogue Universitaire", href: "/university/catalog", icon: <BookOpen className="size-4" /> },
              { label: "Statistiques & Usage", href: "/university/stats", icon: <FileBarChart className="size-4" /> },
              // Désactivé conformément au CDC v3.2 — voir Fiches X1-X4.
              // { label: "Affiliations Étudiants", href: "/university/affiliations", icon: <GraduationCap className="size-4" /> },
              { label: "Commandes Papier", href: "/university/purchases", icon: <PackageCheck className="size-4" /> },
              { label: "Redevances (15%)", href: "/university/royalties", icon: <DollarSign className="size-4" /> },
              { label: "Profil & Paramètres", href: "/university/profile", icon: <Building2 className="size-4" /> },
            ],
          },
        ];

      case "manager":
        return [
          {
            groupLabel: "Gestion Opérationnelle",
            items: [
              { label: "Vue d'ensemble", href: "/manager", icon: <LayoutDashboard className="size-4" /> },
              {
                label: "Stock Physique",
                href: "/manager/stock",
                icon: <Warehouse className="size-4" />,
                sublinks: [
                  { label: "Vue globale", href: "/manager/stock", icon: <Warehouse className="size-3.5" /> },
                  { label: "Mouvements", href: "/manager/stock/movements", icon: <Package className="size-3.5" /> },
                  { label: "Alertes de rupture", href: "/manager/stock/alerts", icon: <AlertTriangle className="size-3.5" /> },
                ],
              },
              {
                label: "Gestion Commandes",
                href: "/manager/delivery",
                icon: <Truck className="size-4" />,
                sublinks: [
                  { label: "À expédier", href: "/manager/delivery", icon: <Package className="size-3.5" /> },
                  { label: "En transit", href: "/manager/delivery/in-transit", icon: <Truck className="size-3.5" /> },
                  { label: "Livrées", href: "/manager/delivery/delivered", icon: <PackageCheck className="size-3.5" /> },
                  { label: "Institutionnelles", href: "/manager/delivery/institutional", icon: <Building2 className="size-3.5" /> },
                ],
              },
              { label: "Coordination Admin", href: "/manager/coordination", icon: <ArrowUpCircle className="size-4" /> },
              { label: "Disciplines & Catégories", href: "/manager/catalog/disciplines", icon: <Layers className="size-4" /> },
              { label: "Finances & Flux", href: "/manager/finance", icon: <Wallet className="size-4" /> },
              { label: "Rapports & Exports", href: "/manager/reports", icon: <FileBarChart className="size-4" /> },
              { label: "Profil & Paramètres", href: "/manager/profile", icon: <UserIcon className="size-4" /> },
            ],
          },
        ];

      case "publisher":
        return [
          {
            groupLabel: "Portail Éditeur",
            items: [
              { label: "Vue d'ensemble", href: "/publisher", icon: <LayoutDashboard className="size-4" /> },
              {
                label: "Mon Catalogue",
                href: "/publisher/catalog",
                icon: <BookOpen className="size-4" />,
                sublinks: [
                  { label: "Tous mes Ouvrages", href: "/publisher/catalog", icon: <BookOpen className="size-3.5" /> },
                  { label: "Nouveau Dépôt Assisté IA", href: "/publisher/catalog/new", icon: <PlusCircle className="size-3.5" /> },
                  { label: "Dépôt en Lot ONIX 3.0", href: "/publisher/catalog/batch", icon: <UploadCloud className="size-3.5" /> },
                ],
              },
              { label: "Suivi des Dépôts", href: "/publisher/submissions", icon: <Clock className="size-4" /> },
              { label: "Statistiques & Lectorat", href: "/publisher/stats", icon: <FileBarChart className="size-4" /> },
              { label: "Redevances & Ventes", href: "/publisher/royalties", icon: <DollarSign className="size-4" /> },
              { label: "Profil & Mandat", href: "/publisher/profile", icon: <Building2 className="size-4" /> },
            ],
          },
        ];

      case "author":
        return [
          {
            groupLabel: "Espace Auteur",
            items: [
              { label: "Vue d'ensemble", href: "/author", icon: <LayoutDashboard className="size-4" /> },
              { label: "Mes Livres Publiés", href: "/author/books", icon: <BookOpen className="size-4" /> },
              { label: "Mes Dépôts Manuscrits", href: "/author/submissions", icon: <PenTool className="size-4" /> },
              { label: "Droits & Paiements", href: "/author/royalties", icon: <DollarSign className="size-4" /> },
              { label: "Catalogue Général", href: "/author/catalog", icon: <Search className="size-4" /> },
              { label: "Mes Achats", href: "/author/purchases", icon: <ShoppingBag className="size-4" /> },
              { label: "Profil & Délégation", href: "/author/profile", icon: <UserIcon className="size-4" /> },
            ],
          },
        ];

      case "legal_reviewer":
        return [
          {
            groupLabel: "Espace Juridique",
            items: [
              { label: "Vue d'ensemble", href: "/legal-reviewer", icon: <LayoutDashboard className="size-4" /> },
              { label: "Contrats Légaux", href: "/legal-reviewer/contracts", icon: <ShieldCheck className="size-4" /> },
              { label: "Droits d'Auteur", href: "/legal-reviewer/royalties", icon: <Percent className="size-4" /> },
              { label: "Pré-éditions", href: "/legal-reviewer/pre-editions", icon: <PenTool className="size-4" /> },
              { label: "Redevances", href: "/legal-reviewer/redevances", icon: <DollarSign className="size-4" /> },
              { label: "Dépôts Éditeurs Tiers", href: "/legal-reviewer/publisher-deposits", icon: <BookOpen className="size-4" /> },
              { label: "Relances & Impayés", href: "/legal-reviewer/relances", icon: <BellRing className="size-4" /> },
            ],
          },
        ];

      case "layout_artist":
        return [
          {
            groupLabel: "Espace Maquettiste",
            items: [
              { label: "Vue d'ensemble", href: "/layout-artist", icon: <LayoutDashboard className="size-4" /> },
              {
                label: "Mes Dépôts",
                href: "/layout-artist/deposits",
                icon: <BookOpen className="size-4" />,
                sublinks: [
                  { label: "Tous mes dépôts", href: "/layout-artist/deposits", icon: <BookOpen className="size-3.5" /> },
                  { label: "Nouveau dépôt", href: "/layout-artist/deposits/new", icon: <PlusCircle className="size-3.5" /> },
                ],
              },
            ],
          },
        ];

      case "chief_layout":
        return [
          {
            groupLabel: "Direction Maquette",
            items: [
              { label: "Vue d'ensemble", href: "/chief-layout", icon: <LayoutDashboard className="size-4" /> },
              { label: "Manuscrits Auteurs", href: "/chief-layout/manuscripts", icon: <BookOpenCheck className="size-4" /> },
              { label: "Catalogue Ouvrages", href: "/chief-layout/catalog", icon: <BookOpen className="size-4" /> },
              { label: "Déposer un ouvrage", href: "/chief-layout/deposit", icon: <PlusCircle className="size-4" /> },
              { label: "Dépôts à valider", href: "/chief-layout/validation", icon: <CheckSquare className="size-4" /> },
              { label: "Dépôts Éditeurs Tiers", href: "/chief-layout/publisher-deposits", icon: <BookOpen className="size-4" /> },
              { label: "Historique validations", href: "/chief-layout/history", icon: <History className="size-4" /> },
            ],
          },
        ];

      case "admin":
      case "super_admin":
        return [
          {
            groupLabel: "Administration",
            items: [
              { label: "Vue d'ensemble", href: "/admin", icon: <LayoutDashboard className="size-4" /> },
              {
                label: "Gestion Utilisateurs",
                href: "/admin/users",
                icon: <Users className="size-4" />,
                sublinks: [
                  { label: "Tous les Utilisateurs", href: "/admin/users", icon: <Users className="size-3.5" /> },
                  { label: "Maquettistes", href: "/admin/users/layout-artists", icon: <PenTool className="size-3.5" /> },
                  { label: "Chef Maquettiste", href: "/admin/users/chief-layout", icon: <ShieldCheck className="size-3.5" /> },
                  { label: "Gestionnaires", href: "/admin/users/managers", icon: <Briefcase className="size-3.5" /> },
                  { label: "Juristes & Relecteurs", href: "/admin/users/legal", icon: <FileCheck className="size-3.5" /> },
                  { label: "Auteurs", href: "/admin/users/authors", icon: <BookOpen className="size-3.5" /> },
                  { label: "Universités & Inst.", href: "/admin/users/universities", icon: <GraduationCap className="size-3.5" /> },
                  { label: "Éditeurs Tiers", href: "/admin/users/publishers", icon: <Briefcase className="size-3.5" /> },
                  { label: "Clients & Lecteurs", href: "/admin/users/clients", icon: <Users className="size-3.5" /> },
                  { label: "Grossistes", href: "/admin/users/wholesalers", icon: <PackageCheck className="size-3.5" /> },
                ],
              },
              {
                label: "Catalogue & Tarifs",
                href: "/admin/catalog",
                icon: <BookOpen className="size-4" />,
                sublinks: [
                  { label: "Tous les Ouvrages", href: "/admin/catalog", icon: <BookOpen className="size-3.5" /> },
                  { label: "Ajouter un Ouvrage", href: "/admin/catalog/new", icon: <PlusCircle className="size-3.5" /> },
                  { label: "Grille & Remises Rôles", href: "/admin/catalog/pricing", icon: <Tag className="size-3.5" /> },
                  { label: "Bouquets Documentaires", href: "/admin/catalog/bouquets", icon: <Layers className="size-3.5" /> },
                  { label: "Disciplines & Catégories", href: "/admin/catalog/disciplines", icon: <Layers className="size-3.5" /> },
                  { label: "Gestion des Pays", href: "/admin/catalog/countries", icon: <Globe className="size-3.5" /> },
                ],
              },
              { label: "Validation BAT & Maquettes", href: "/admin/validation", icon: <FileCheck2 className="size-4" /> },
              { label: "Manuscrits Reçus (Public)", href: "/admin/manuscript-leads", icon: <Mail className="size-4" /> },
              { label: "Dépôts Éditeurs Tiers", href: "/admin/publisher-deposits", icon: <BookOpen className="size-4" /> },
              { label: "Contrats & Droits d'Auteur", href: "/admin/contracts", icon: <Scale className="size-4" /> },
              {
                label: "Stock Physique & Hubs",
                href: "/admin/stock",
                icon: <Boxes className="size-4" />,
                sublinks: [
                  { label: "Vue Stock & Hubs", href: "/admin/stock", icon: <Boxes className="size-3.5" /> },
                  { label: "Flux & Pertes", href: "/admin/stock/movements", icon: <TrendingDown className="size-3.5" /> },
                  { label: "Entrepôts Régionaux", href: "/admin/stock/warehouses", icon: <Building2 className="size-3.5" /> },
                ],
              },
              { label: "Ventes & Revenus", href: "/admin/sales", icon: <ShoppingBag className="size-4" /> },
              { label: "Finances Globales", href: "/admin/finance", icon: <Landmark className="size-4" /> },
              { label: "Redevances", href: "/admin/royalties", icon: <DollarSign className="size-4" /> },
              { label: "Relances & Alertes", href: "/admin/reminders", icon: <BellRing className="size-4" /> },
              { label: "Reporting & Exports", href: "/admin/reports", icon: <FileSpreadsheet className="size-4" /> },
              { label: "Clés API & Partenaires", href: "/admin/api", icon: <Key className="size-4" /> },
              {
                label: "Traçabilité & Logs",
                href: "/admin/logs",
                icon: <Activity className="size-4" />,
                sublinks: [
                  { label: "Traces d'Accès DRM", href: "/admin/security/traces", icon: <ShieldCheck className="size-3.5" /> },
                  { label: "Logs d'Audit Système", href: "/admin/logs", icon: <Activity className="size-3.5" /> },
                  { label: "Logs d'Appels API", href: "/admin/api/logs", icon: <Key className="size-3.5" /> },
                ],
              },
              {
                label: "Paramètres Globaux",
                href: "/admin/settings",
                icon: <Settings className="size-4" />,
                sublinks: [
                  { label: "Général & Plateforme", href: "/admin/settings", icon: <Settings className="size-3.5" /> },
                  { label: "Sécurité DRM & Filigrane", href: "/admin/settings/drm", icon: <ShieldCheck className="size-3.5" /> },
                ],
              },
              {
                label: "Guides & Assistance",
                href: "/admin/guides",
                icon: <HelpCircle className="size-4" />,
                sublinks: [
                  { label: "Guides d'utilisation", href: "/admin/guide", icon: <BookOpen className="size-3.5" /> },
                  { label: "Gestion des guides", href: "/admin/guides", icon: <Edit2 className="size-3.5" /> },
                ],
              },
            ],
          },
        ];

      default:
        return [
          {
            groupLabel: "Lecteur",
            items: [
              { label: "Mon Espace Lecteur", href: "/student", icon: <LayoutDashboard className="size-4" /> },
              { label: "Ma Bibliothèque", href: "/student/books", icon: <BookOpen className="size-4" /> },
              { label: "Catalogue Universitaire", href: "/student/catalog", icon: <Briefcase className="size-4" /> },
            ],
          },
        ];
    }
  };

  const getRoleGuideHref = () => {
    if (!user) return "/student/guide";
    if (user.role === "admin" || user.role === "super_admin") return "/admin/guide";
    if (user.role === "super_client" || user.role === "wholesaler") return "/wholesaler/guide";
    if (user.role === "legal_reviewer") return "/legal-reviewer/guide";
    if (user.role === "layout_artist") return "/layout-artist/guide";
    if (user.role === "chief_layout") return "/chief-layout/guide";
    return `/${user.role}/guide`;
  };

  const supportGroup: { groupLabel?: string; items: NavLinkItem[] } = {
    groupLabel: "Support & Assistance",
    items: [
      {
        label: "Aide & Contact",
        href: getRoleGuideHref(),
        icon: <HelpCircle className="size-4" />,
        sublinks: [
          { label: "Guide d'utilisation", href: getRoleGuideHref(), icon: <BookOpen className="size-3.5" /> },
          { label: "Nous contacter", href: "#contact", icon: <Mail className="size-3.5" /> },
        ],
      },
    ],
  };

  const roleGroups = getLinks();
  const groups = [...roleGroups, supportGroup];
  const userDisplayName = user
    ? `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.email || "Profil"
    : "Profil";

  const getRoleLabel = () => {
    switch (user?.role) {
      case "author":
        return "Auteur • LAHA Éditions";
      case "publisher":
        return "Éditeur Tiers • Partenaire";
      case "wholesaler":
      case "super_client":
        return "Grossiste • Partenaire";
      case "university":
        return "Université • Campus";
      case "manager":
        return "Gestionnaire • Stock";
      case "legal_reviewer":
        return "Juriste • Droits & Contrats";
      case "chief_layout":
        return "Chef Maquettiste • Direction";
      case "layout_artist":
        return "Maquettiste • Production";
      case "admin":
      case "super_admin":
        return "Administrateur • Plateforme";
      default:
        return "Lecteur • LAHAThèque";
    }
  };

  // Synchronise l'ouverture des sous-menus selon la route courante
  useEffect(() => {
    let matched = false;
    for (const group of groups) {
      for (const item of group.items) {
        if (item.sublinks) {
          const isChildActive = item.sublinks.some((sub) => pathname === sub.href);
          if (isChildActive) {
            setOpenSection(item.label);
            matched = true;
            return;
          }
        }
      }
    }
    if (!matched) {
      setOpenSection(null);
    }
  }, [pathname]);

  return (
    <AnimatedSidebar ariaLabel="Menu de navigation principal" collapsible="icon">
      {/* Header avec Logo responsive */}
      <AnimatedSidebarHeader className="p-3 pb-2">
        <div className="flex min-h-11 items-center justify-between gap-2 overflow-hidden px-1 group-data-[state=collapsed]/sidebar:justify-center">
          <Link
            href="/"
            className="flex items-center gap-2.5 outline-none focus-visible:ring-2 focus-visible:ring-gold rounded-xl py-1 overflow-hidden"
          >
            <div className="size-8 shrink-0 flex items-center justify-center rounded-lg bg-gold/15">
              <Image
                src="/logo.png"
                alt="LAHAThèque"
                width={28}
                height={28}
                className="h-6 w-6 object-contain shrink-0"
                priority
              />
            </div>
            <div className="min-w-0 flex-1 truncate group-data-[state=collapsed]/sidebar:hidden">
              <span className="font-serif font-bold text-sm tracking-wide text-white block truncate">
                LAHA<span className="text-gold">Thèque</span>
              </span>
              <span className="text-[10px] text-white/50 block font-mono truncate uppercase">
                {user?.role ? user.role.replace("_", " ") : "Espace Numérique"}
              </span>
            </div>
          </Link>

          <AnimatedSidebarClose className="ml-auto text-white/70 hover:bg-navy-hover/60 hover:text-white md:hidden">
            <span className="sr-only">Fermer</span>
          </AnimatedSidebarClose>
        </div>
      </AnimatedSidebarHeader>

      {/* Navigation Principale groupée */}
      <AnimatedSidebarContent>
        {groups.map((group, gIdx) => (
          <AnimatedSidebarGroup key={gIdx} className="py-1">
            {group.groupLabel && (
              <AnimatedSidebarGroupLabel>
                {group.groupLabel}
              </AnimatedSidebarGroupLabel>
            )}
            <AnimatedSidebarGroupContent>
              <AnimatedSidebarMenu>
                {group.items.map((item) => {
                  const hasSublinks = Boolean(item.sublinks && item.sublinks.length > 0);
                  const isDirectActive = pathname === item.href;
                  const isChildActive = Boolean(
                    item.sublinks?.some((sub) => pathname === sub.href)
                  );
                  const isActive = isDirectActive || isChildActive;
                  const isOpen = openSection === item.label;

                  return (
                    <AnimatedSidebarMenuItem key={item.label}>
                      <AnimatedSidebarMenuButton
                        href={hasSublinks ? undefined : item.href}
                        isActive={isActive}
                        ariaExpanded={hasSublinks ? isOpen : undefined}
                        icon={item.icon}
                        badge={item.badge}
                        onSelect={() => {
                          if (hasSublinks) {
                            setOpenSection((current) =>
                              current === item.label ? null : item.label
                            );
                          } else {
                            setOpenSection(null);
                          }
                        }}
                      >
                        {item.label}
                      </AnimatedSidebarMenuButton>

                      {hasSublinks && item.sublinks ? (
                        <AnimatedSidebarMenuSub open={isOpen}>
                          {item.sublinks.map((sub) => (
                            <AnimatedSidebarMenuSubItem key={sub.href + sub.label}>
                              <AnimatedSidebarMenuSubButton
                                href={sub.href === "#contact" ? undefined : sub.href}
                                isActive={pathname === sub.href}
                                icon={sub.icon}
                                onSelect={() => {
                                  if (sub.href === "#contact") {
                                    window.dispatchEvent(new CustomEvent("app-open-contact"));
                                  }
                                }}
                              >
                                {sub.label}
                              </AnimatedSidebarMenuSubButton>
                            </AnimatedSidebarMenuSubItem>
                          ))}
                        </AnimatedSidebarMenuSub>
                      ) : null}
                    </AnimatedSidebarMenuItem>
                  );
                })}
              </AnimatedSidebarMenu>
            </AnimatedSidebarGroupContent>
          </AnimatedSidebarGroup>
        ))}
      </AnimatedSidebarContent>

      {/* Footer Profile & Actions */}
      <AnimatedSidebarFooter className="p-3 gap-2">
        {user && (
          <Link
            href="/profile"
            className="flex min-h-11 w-full items-center gap-2.5 overflow-hidden rounded-xl p-1.5 text-left outline-none transition-colors hover:bg-navy-hover/60 focus-visible:ring-2 focus-visible:ring-gold group group-data-[state=collapsed]/sidebar:justify-center"
          >
            <UserAvatar
              src={(user as any).avatar_url || user.avatar || user.profile_photo}
              name={userDisplayName}
              size="sm"
              className="border border-gold/20 group-hover:border-gold/40 transition-colors shrink-0"
            />
            <div className="min-w-0 flex-1 group-data-[state=collapsed]/sidebar:hidden">
              <span className="block truncate text-xs font-semibold text-white group-hover:text-gold transition-colors">
                {userDisplayName}
              </span>
              <span className="block truncate text-[10px] text-white/60">
                {getRoleLabel()}
              </span>
            </div>
          </Link>
        )}

        <div className="flex items-center justify-between gap-1 pt-2 border-t border-navy-hover/40 group-data-[state=collapsed]/sidebar:justify-center">
          <Link
            href="/profile"
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-white/70 hover:text-white hover:bg-navy-hover/50 text-[11px] font-medium transition-colors group-data-[state=collapsed]/sidebar:hidden"
          >
            <UserIcon className="size-3.5 text-gold" />
            <span>Mon Profil</span>
          </Link>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              logout();
            }}
            title="Se déconnecter"
            className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 text-[11px] font-medium transition-colors cursor-pointer w-full group-data-[state=expanded]/sidebar:w-auto"
          >
            <LogOut className="size-3.5" />
            <span className="group-data-[state=collapsed]/sidebar:hidden">Déconnexion</span>
          </button>
        </div>
      </AnimatedSidebarFooter>

      <AnimatedSidebarRail />
    </AnimatedSidebar>
  );
}
