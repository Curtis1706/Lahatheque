"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  BookOpen,
  FileCheck,
  Briefcase,
  User as UserIcon,
  Menu as MenuIcon,
  X,
  GraduationCap,
  Building2,
  CheckCircle2,
  PenTool,
  DollarSign,
  Users,
  ShoppingCart,
  Sparkles,
  PackageCheck,
  ShieldCheck,
  BellRing,
  FileSpreadsheet,
  Key,
  Activity,
  Settings,
  ShoppingBag,
  LogOut,
  Warehouse,
  Truck,
  CheckSquare,
  History,
  Percent,
  UploadCloud
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export function MobileBottomNav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  // Helper pour vérifier si un lien est actif sur la route actuelle
  const checkIsActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return (
      pathname === href ||
      (pathname.startsWith(href) &&
        (pathname.length === href.length || pathname[href.length] === "/"))
    );
  };

  // Configuration des items de la barre de navigation mobile du bas selon le rôle
  const getBottomNavConfig = () => {
    switch (user?.role) {
      case "admin":
      case "super_admin":
        return {
          leftItems: [
            { label: "Aperçu", href: "/admin", icon: <LayoutDashboard className="w-5 h-5" /> },
            { label: "Users", href: "/admin/users", icon: <Users className="w-5 h-5" /> },
          ],
          centerCta: { label: "Catalogue", href: "/admin/catalog", icon: <BookOpen className="w-6 h-6" /> },
          rightItems: [
            { label: "Ventes", href: "/admin/sales", icon: <ShoppingBag className="w-5 h-5" /> },
            { label: "Logs", href: "/admin/logs", icon: <Activity className="w-5 h-5" /> },
          ]
        };
      case "super_client":
        return {
          leftItems: [
            { label: "Aperçu", href: "/wholesaler", icon: <LayoutDashboard className="w-5 h-5" /> },
            { label: "Catalogue", href: "/wholesaler/catalog", icon: <BookOpen className="w-5 h-5" /> },
          ],
          centerCta: { label: "Commandes", href: "/wholesaler/orders", icon: <PackageCheck className="w-6 h-6" /> },
          rightItems: [
            { label: "Ventes", href: "/wholesaler/notifications", icon: <BellRing className="w-5 h-5" /> },
            { label: "Profil", href: "/wholesaler/profile", icon: <UserIcon className="w-5 h-5" /> },
          ]
        };
      case "librarian":
        return {
          leftItems: [
            { label: "Aperçu", href: "/librarian", icon: <LayoutDashboard className="w-5 h-5" /> },
            { label: "Stats", href: "/librarian/stats", icon: <FileCheck className="w-5 h-5" /> },
          ],
          centerCta: { label: "Bouquets", href: "/librarian/bouquets", icon: <Sparkles className="w-6 h-6" /> },
          rightItems: [
            { label: "Redevances", href: "/librarian/redevances", icon: <DollarSign className="w-5 h-5" /> },
            { label: "Profil", href: "/librarian/profile", icon: <UserIcon className="w-5 h-5" /> },
          ]
        };
      case "publisher":
        return {
          leftItems: [
            { label: "Aperçu", href: "/publisher", icon: <LayoutDashboard className="w-5 h-5" /> },
            { label: "Catalogue", href: "/publisher/catalog", icon: <BookOpen className="w-5 h-5" /> },
          ],
          centerCta: { label: "Nouveau", href: "/publisher/catalog/new", icon: <PenTool className="w-6 h-6" /> },
          rightItems: [
            { label: "Revenus", href: "/publisher/royalties", icon: <DollarSign className="w-5 h-5" /> },
            { label: "API", href: "/publisher/api", icon: <ShieldCheck className="w-5 h-5" /> },
          ]
        };
      case "author":
        return {
          leftItems: [
            { label: "Aperçu", href: "/author", icon: <LayoutDashboard className="w-5 h-5" /> },
            { label: "Livres", href: "/author/books", icon: <BookOpen className="w-5 h-5" /> },
          ],
          centerCta: { label: "Déposer", href: "/author/submissions/new", icon: <PenTool className="w-6 h-6" /> },
          rightItems: [
            { label: "Droits", href: "/author/royalties", icon: <DollarSign className="w-5 h-5" /> },
            { label: "Achats", href: "/author/purchases", icon: <ShoppingBag className="w-5 h-5" /> },
          ]
        };
      case "layout_artist":
        return {
          leftItems: [
            { label: "Aperçu", href: "/layout-artist", icon: <LayoutDashboard className="w-5 h-5" /> },
          ],
          centerCta: { label: "Dépôts", href: "/layout-artist/deposits", icon: <BookOpen className="w-6 h-6" /> },
          rightItems: [
            { label: "Nouveau", href: "/layout-artist/deposits/new", icon: <PenTool className="w-5 h-5" /> },
            { label: "Profil", href: "/profile", icon: <UserIcon className="w-5 h-5" /> },
          ]
        };
      case "chief_layout":
        return {
          leftItems: [
            { label: "Aperçu", href: "/chief-layout", icon: <LayoutDashboard className="w-5 h-5" /> },
          ],
          centerCta: { label: "Valider", href: "/chief-layout/validation", icon: <CheckSquare className="w-6 h-6" /> },
          rightItems: [
            { label: "Historique", href: "/chief-layout/history", icon: <History className="w-5 h-5" /> },
            { label: "Profil", href: "/profile", icon: <UserIcon className="w-5 h-5" /> },
          ]
        };
      case "legal_reviewer":
        return {
          leftItems: [
            { label: "Aperçu", href: "/legal-reviewer", icon: <LayoutDashboard className="w-5 h-5" /> },
            { label: "Contrats", href: "/legal-reviewer/contracts", icon: <ShieldCheck className="w-5 h-5" /> },
          ],
          centerCta: { label: "Droits", href: "/legal-reviewer/royalties", icon: <Percent className="w-6 h-6" /> },
          rightItems: [
            { label: "Relances", href: "/legal-reviewer/relances", icon: <BellRing className="w-5 h-5" /> },
            { label: "Profil", href: "/profile", icon: <UserIcon className="w-5 h-5" /> },
          ]
        };
      case "manager":
        return {
          leftItems: [
            { label: "Aperçu", href: "/manager", icon: <LayoutDashboard className="w-5 h-5" /> },
            { label: "Stock", href: "/manager/stock", icon: <Warehouse className="w-5 h-5" /> },
          ],
          centerCta: { label: "Livraisons", href: "/manager/delivery", icon: <Truck className="w-6 h-6" /> },
          rightItems: [
            { label: "Coordination", href: "/manager/coordination", icon: <Activity className="w-5 h-5" /> },
            { label: "Profil", href: "/profile", icon: <UserIcon className="w-5 h-5" /> },
          ]
        };
      default:
        // Student / Client Lecteur
        return {
          leftItems: [
            { label: "Mon Espace", href: "/student", icon: <LayoutDashboard className="w-5 h-5" /> },
            { label: "Bibliothèque", href: "/student/books", icon: <BookOpen className="w-5 h-5" /> },
          ],
          centerCta: { label: "Catalogue", href: "/student/catalog", icon: <Briefcase className="w-6 h-6" /> },
          rightItems: [
            { label: "Commandes", href: "/student/orders", icon: <PackageCheck className="w-5 h-5" /> },
            { label: "Pass", href: "/student/subscriptions", icon: <Sparkles className="w-5 h-5" /> },
          ]
        };
    }
  };

  // Liste dynamique des liens complets pour le tiroir de menu mobile (Drawer Sheet)
  const getDrawerMenuLinks = () => {
    switch (user?.role) {
      case "admin":
      case "super_admin":
        return [
          { label: "Vue d'ensemble", href: "/admin", icon: <LayoutDashboard className="w-4 h-4" /> },
          { label: "Tous les Utilisateurs", href: "/admin/users", icon: <Users className="w-4 h-4" /> },
          { label: "Catalogue & Prix", href: "/admin/catalog", icon: <BookOpen className="w-4 h-4" /> },
          { label: "Ventes & Revenus", href: "/admin/sales", icon: <ShoppingBag className="w-4 h-4" /> },
          { label: "Redevances", href: "/admin/royalties", icon: <DollarSign className="w-4 h-4" /> },
          { label: "Relances & Alertes", href: "/admin/reminders", icon: <BellRing className="w-4 h-4" /> },
          { label: "Reporting & Exports", href: "/admin/reports", icon: <FileSpreadsheet className="w-4 h-4" /> },
          { label: "Clés API", href: "/admin/api", icon: <Key className="w-4 h-4" /> },
          { label: "Traçabilité & Logs", href: "/admin/logs", icon: <Activity className="w-4 h-4" /> },
          { label: "Paramètres Globaux", href: "/admin/settings", icon: <Settings className="w-4 h-4" /> },
          { label: "Mon Profil", href: "/profile", icon: <UserIcon className="w-4 h-4" /> },
        ];
      case "author":
        return [
          { label: "Mon Espace Auteur", href: "/author", icon: <LayoutDashboard className="w-4 h-4" /> },
          { label: "Mes Livres Publiés", href: "/author/books", icon: <BookOpen className="w-4 h-4" /> },
          { label: "Mes Dépôts & Manuscrits", href: "/author/submissions", icon: <PenTool className="w-4 h-4" /> },
          { label: "Droits & Redevances", href: "/author/royalties", icon: <DollarSign className="w-4 h-4" /> },
          { label: "Mes Achats", href: "/author/purchases", icon: <ShoppingBag className="w-4 h-4" /> },
          { label: "Mon Profil", href: "/author/profile", icon: <UserIcon className="w-4 h-4" /> },
        ];
      case "publisher":
        return [
          { label: "Espace Éditeur", href: "/publisher", icon: <LayoutDashboard className="w-4 h-4" /> },
          { label: "Mon Catalogue", href: "/publisher/catalog", icon: <BookOpen className="w-4 h-4" /> },
          { label: "Nouveau Dépôt Web", href: "/publisher/catalog/new", icon: <PenTool className="w-4 h-4" /> },
          { label: "Dépôt ONIX 3.0", href: "/publisher/catalog/batch", icon: <UploadCloud className="w-4 h-4" /> },
          { label: "Statistiques", href: "/publisher/stats", icon: <Activity className="w-4 h-4" /> },
          { label: "Redevances & Droits", href: "/publisher/royalties", icon: <DollarSign className="w-4 h-4" /> },
          { label: "Clés API", href: "/publisher/api", icon: <ShieldCheck className="w-4 h-4" /> },
          { label: "Mon Profil", href: "/profile", icon: <UserIcon className="w-4 h-4" /> },
        ];
      case "super_client":
        return [
          { label: "Espace Grossiste", href: "/wholesaler", icon: <LayoutDashboard className="w-4 h-4" /> },
          { label: "Catalogue & Prix Gros", href: "/wholesaler/catalog", icon: <BookOpen className="w-4 h-4" /> },
          { label: "Commandes Groupées", href: "/wholesaler/orders", icon: <PackageCheck className="w-4 h-4" /> },
          { label: "Nouvelle Commande", href: "/wholesaler/orders/new", icon: <PenTool className="w-4 h-4" /> },
          { label: "Nouveautés & Ventes", href: "/wholesaler/notifications", icon: <BellRing className="w-4 h-4" /> },
          { label: "Profil & Facturation", href: "/wholesaler/profile", icon: <UserIcon className="w-4 h-4" /> },
        ];
      case "layout_artist":
        return [
          { label: "Espace Maquettiste", href: "/layout-artist", icon: <LayoutDashboard className="w-4 h-4" /> },
          { label: "Mes Dépôts", href: "/layout-artist/deposits", icon: <BookOpen className="w-4 h-4" /> },
          { label: "Nouveau Dépôt", href: "/layout-artist/deposits/new", icon: <PenTool className="w-4 h-4" /> },
          { label: "Mon Profil", href: "/profile", icon: <UserIcon className="w-4 h-4" /> },
        ];
      case "chief_layout":
        return [
          { label: "Chef Maquettiste", href: "/chief-layout", icon: <LayoutDashboard className="w-4 h-4" /> },
          { label: "Dépôts à Valider", href: "/chief-layout/validation", icon: <CheckSquare className="w-4 h-4" /> },
          { label: "Historique Validations", href: "/chief-layout/history", icon: <History className="w-4 h-4" /> },
          { label: "Mon Profil", href: "/profile", icon: <UserIcon className="w-4 h-4" /> },
        ];
      case "legal_reviewer":
        return [
          { label: "Espace Juriste", href: "/legal-reviewer", icon: <LayoutDashboard className="w-4 h-4" /> },
          { label: "Contrats Légaux", href: "/legal-reviewer/contracts", icon: <ShieldCheck className="w-4 h-4" /> },
          { label: "Droits d'Auteur", href: "/legal-reviewer/royalties", icon: <Percent className="w-4 h-4" /> },
          { label: "Pré-éditions", href: "/legal-reviewer/pre-editions", icon: <PenTool className="w-4 h-4" /> },
          { label: "Redevances", href: "/legal-reviewer/redevances", icon: <DollarSign className="w-4 h-4" /> },
          { label: "Relances & Impayés", href: "/legal-reviewer/relances", icon: <BellRing className="w-4 h-4" /> },
          { label: "Mon Profil", href: "/profile", icon: <UserIcon className="w-4 h-4" /> },
        ];
      case "manager":
        return [
          { label: "Espace Gestionnaire", href: "/manager", icon: <LayoutDashboard className="w-4 h-4" /> },
          { label: "Stock Papier", href: "/manager/stock", icon: <Warehouse className="w-4 h-4" /> },
          { label: "Mouvements de Stock", href: "/manager/stock/movements", icon: <PackageCheck className="w-4 h-4" /> },
          { label: "Alertes de Rupture", href: "/manager/stock/alerts", icon: <BellRing className="w-4 h-4" /> },
          { label: "Suivi des Expéditions", href: "/manager/delivery", icon: <Truck className="w-4 h-4" /> },
          { label: "Coordination Admin", href: "/manager/coordination", icon: <Activity className="w-4 h-4" /> },
          { label: "Rapports Logistiques", href: "/manager/reports", icon: <FileSpreadsheet className="w-4 h-4" /> },
          { label: "Mon Profil", href: "/profile", icon: <UserIcon className="w-4 h-4" /> },
        ];
      case "librarian":
        return [
          { label: "Espace Université", href: "/librarian", icon: <LayoutDashboard className="w-4 h-4" /> },
          { label: "Statistiques d'Usage", href: "/librarian/stats", icon: <FileCheck className="w-4 h-4" /> },
          { label: "Catalogue Établissement", href: "/librarian/catalog", icon: <BookOpen className="w-4 h-4" /> },
          { label: "Bouquets Documentaires", href: "/librarian/bouquets", icon: <Sparkles className="w-4 h-4" /> },
          { label: "Achats Livres Papier", href: "/librarian/purchases", icon: <ShoppingBag className="w-4 h-4" /> },
          { label: "Redevances 15%", href: "/librarian/redevances", icon: <DollarSign className="w-4 h-4" /> },
          { label: "Profil Établissement", href: "/librarian/profile", icon: <UserIcon className="w-4 h-4" /> },
        ];
      default:
        // Student / Client Lecteur
        return [
          { label: "Mon Espace Lecteur", href: "/student", icon: <LayoutDashboard className="w-4 h-4" /> },
          { label: "Catalogue & Découverte", href: "/student/catalog", icon: <Briefcase className="w-4 h-4" /> },
          { label: "Ma Bibliothèque", href: "/student/books", icon: <BookOpen className="w-4 h-4" /> },
          { label: "Achats & Livraisons", href: "/student/orders", icon: <PackageCheck className="w-4 h-4" /> },
          { label: "Abonnements & Pass", href: "/student/subscriptions", icon: <Sparkles className="w-4 h-4" /> },
          { label: "Profil & Affiliation", href: "/student/profile", icon: <UserIcon className="w-4 h-4" /> },
          { label: "Mon Université", href: "/student/university", icon: <GraduationCap className="w-4 h-4" /> },
        ];
    }
  };

  const nav = getBottomNavConfig();
  const drawerLinks = getDrawerMenuLinks();

  const getRoleBadgeLabel = () => {
    switch (user?.role) {
      case "admin":
      case "super_admin":
        return "ADMINISTRATEUR • LAHATHÈQUE";
      case "author":
        return "AUTEUR • LAHATHÈQUE";
      case "publisher":
        return "ÉDITEUR TIERS • LAHATHÈQUE";
      case "layout_artist":
        return "MAQUETTISTE • LAHATHÈQUE";
      case "chief_layout":
        return "CHEF MAQUETTISTE • VALIDEUR";
      case "legal_reviewer":
        return "RELECTEUR JURIDIQUE";
      case "librarian":
        return "BIBLIOTHÉCAIRE RÉFÉRENT";
      case "manager":
        return "GESTIONNAIRE LOGISTIQUE";
      case "super_client":
        return "GROSSISTE PARTENAIRE";
      default:
        return "CLIENT LECTEUR / ÉTUDIANT";
    }
  };

  return (
    <>
      {/* Barre de navigation mobile en bas (Navbar Mobile) */}
      <nav
        aria-label="Navigation Mobile Navbar"
        className="fixed bottom-0 left-0 right-0 w-full bg-navy-dark border-t border-navy-hover z-50 md:hidden py-1.5 px-2 shadow-2xl flex items-center justify-between"
      >
        {/* Items Gauche */}
        <div className="flex items-center justify-around flex-1">
          {nav.leftItems.map((item) => {
            const isActive = checkIsActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center text-[10px] font-medium py-1 px-2 transition-colors rounded-lg",
                  isActive
                    ? "text-gold font-bold bg-gold/15"
                    : "text-white/70 hover:text-white"
                )}
              >
                <div className={cn(isActive && "text-gold")}>{item.icon}</div>
                <span className="mt-0.5 truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* CTA Central (Bouton doré surélevé) */}
        <div className="relative -top-3.5 px-2 shrink-0">
          <Link
            href={nav.centerCta.href}
            className={cn(
              "flex flex-col items-center justify-center w-12 h-12 rounded-full shadow-lg border-4 transition-transform",
              checkIsActive(nav.centerCta.href)
                ? "bg-gold text-navy border-gold shadow-gold/40 scale-105"
                : "bg-gold text-navy border-navy-dark shadow-gold/20 hover:scale-105"
            )}
          >
            {nav.centerCta.icon}
          </Link>
        </div>

        {/* Items Droite + Menu Toggle */}
        <div className="flex items-center justify-around flex-1">
          {nav.rightItems.map((item) => {
            const isActive = checkIsActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center text-[10px] font-medium py-1 px-2 transition-colors rounded-lg",
                  isActive
                    ? "text-gold font-bold bg-gold/15"
                    : "text-white/70 hover:text-white"
                )}
              >
                <div className={cn(isActive && "text-gold")}>{item.icon}</div>
                <span className="mt-0.5 truncate">{item.label}</span>
              </Link>
            );
          })}

          {/* Bouton Menu Drawer */}
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className={cn(
              "flex flex-col items-center justify-center text-[10px] font-medium py-1 px-2 transition-colors rounded-lg",
              menuOpen ? "text-gold font-bold bg-gold/15" : "text-white/70 hover:text-white"
            )}
          >
            <MenuIcon className="w-5 h-5" />
            <span className="mt-0.5">Menu</span>
          </button>
        </div>
      </nav>

      {/* Drawer Bottom Sheet Menu avec mise en surbrillance Or des liens actifs */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[90] md:hidden"
            />

            {/* Bottom Sheet Drawer Panel */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-x-0 bottom-0 max-h-[85vh] bg-background border-t-2 border-gold rounded-t-3xl p-6 z-[100] md:hidden shadow-2xl flex flex-col justify-between overflow-y-auto space-y-6 text-foreground"
            >
              {/* Header Drawer */}
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-navy text-gold font-bold flex items-center justify-center text-sm border border-gold/30 shrink-0">
                    {user?.first_name ? user.first_name.slice(0, 1).toUpperCase() : "U"}
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-navy text-base">
                      {user?.first_name || user?.last_name ? `${user.first_name} ${user.last_name}`.trim() : "Compte LAHAThèque"}
                    </h3>
                    <div className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-gold px-2 py-0.5 rounded bg-navy/5 border border-gold/30">
                      <GraduationCap className="w-3 h-3" />
                      {getRoleBadgeLabel()}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  className="p-2 rounded-full bg-background-secondary border border-border text-foreground-muted hover:text-navy transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Dynamic Navigation Links in Sheet with Active Highlight */}
              <div className="space-y-3">
                <p className="text-[11px] font-bold text-foreground-muted uppercase tracking-wider">
                  Menu &amp; Navigation Rôle ({user?.role || "standard"})
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  {drawerLinks.map((link) => {
                    const isActive = checkIsActive(link.href);
                    return (
                      <Link
                        key={link.href + link.label}
                        href={link.href}
                        onClick={() => setMenuOpen(false)}
                        className={cn(
                          "p-3 rounded-xl border flex items-center gap-2.5 text-xs transition-colors truncate",
                          isActive
                            ? "border-gold bg-gold/15 text-gold font-bold shadow-xs"
                            : "bg-background-secondary border-border text-navy font-semibold hover:border-gold"
                        )}
                      >
                        <div className={cn(isActive ? "text-gold font-bold" : "text-gold")}>
                          {link.icon}
                        </div>
                        <span className="truncate">{link.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Logout Footer */}
              <div className="pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    logout();
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-error/10 text-error font-bold text-xs hover:bg-error/20 transition-colors flex items-center justify-center gap-2 border border-error/30"
                >
                  <LogOut className="w-4 h-4" />
                  Se déconnecter de LAHAThèque
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export default MobileBottomNav;
