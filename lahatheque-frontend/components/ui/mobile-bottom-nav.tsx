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
  LogOut
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export function MobileBottomNav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  // Configuration des items de navigation rapide du bas selon le rôle
  const getBottomNavConfig = () => {
    switch (user?.role) {
      case "admin":
      case "super_admin":
        return {
          leftItems: [
            { label: "Vue d'ensemble", href: "/admin", icon: <LayoutDashboard className="w-5 h-5" /> },
            { label: "Utilisateurs", href: "/admin/users", icon: <Users className="w-5 h-5" /> },
          ],
          centerCta: { label: "Catalogue", href: "/admin/catalog", icon: <BookOpen className="w-6 h-6" /> },
          rightItems: [
            { label: "Ventes", href: "/admin/sales", icon: <ShoppingBag className="w-5 h-5" /> },
            { label: "Logs", href: "/admin/logs", icon: <Activity className="w-5 h-5" /> },
          ]
        };
      case "teacher":
        return {
          leftItems: [
            { label: "Aperçu", href: "/student", icon: <LayoutDashboard className="w-5 h-5" /> },
            { label: "Cours", href: "/teacher", icon: <PenTool className="w-5 h-5" /> },
          ],
          centerCta: { label: "Spécimens", href: "/teacher", icon: <BookOpen className="w-6 h-6" /> },
          rightItems: [
            { label: "Livres", href: "/student/books", icon: <Briefcase className="w-5 h-5" /> },
          ]
        };
      case "librarian":
        return {
          leftItems: [
            { label: "Aperçu", href: "/librarian", icon: <LayoutDashboard className="w-5 h-5" /> },
            { label: "Affiliations", href: "/librarian/affiliations", icon: <Users className="w-5 h-5" /> },
          ],
          centerCta: { label: "Catalogue", href: "/student/catalog", icon: <Briefcase className="w-6 h-6" /> },
          rightItems: [
            { label: "Stats", href: "/librarian/stats", icon: <FileCheck className="w-5 h-5" /> },
          ]
        };
      case "publisher":
        return {
          leftItems: [
            { label: "Aperçu", href: "/publisher", icon: <LayoutDashboard className="w-5 h-5" /> },
            { label: "Dépôts", href: "/publisher/submissions", icon: <Briefcase className="w-5 h-5" /> },
          ],
          centerCta: { label: "Nouveau", href: "/publisher/submissions/new", icon: <PenTool className="w-6 h-6" /> },
          rightItems: [
            { label: "Redevances", href: "/publisher/royalties", icon: <DollarSign className="w-5 h-5" /> },
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
            { label: "Redevances", href: "/author/royalties", icon: <DollarSign className="w-5 h-5" /> },
          ]
        };
      case "layout_artist":
        return {
          leftItems: [
            { label: "Aperçu", href: "/layout-artist", icon: <LayoutDashboard className="w-5 h-5" /> },
          ],
          centerCta: { label: "Maquettes", href: "/layout-artist/validation", icon: <PenTool className="w-6 h-6" /> },
          rightItems: [
            { label: "Profil", href: "/profile", icon: <UserIcon className="w-5 h-5" /> },
          ]
        };
      case "legal_reviewer":
        return {
          leftItems: [
            { label: "Aperçu", href: "/legal-reviewer", icon: <LayoutDashboard className="w-5 h-5" /> },
          ],
          centerCta: { label: "Contrats", href: "/legal-reviewer/contracts", icon: <ShieldCheck className="w-6 h-6" /> },
          rightItems: [
            { label: "Profil", href: "/profile", icon: <UserIcon className="w-5 h-5" /> },
          ]
        };
      default:
        // Student / Super Client
        return {
          leftItems: [
            { label: "Aperçu", href: "/student", icon: <LayoutDashboard className="w-5 h-5" /> },
            { label: "Livres", href: "/student/books", icon: <BookOpen className="w-5 h-5" /> },
          ],
          centerCta: { label: "Catalogue", href: "/student/catalog", icon: <Briefcase className="w-6 h-6" /> },
          rightItems: [
            { label: "Commandes", href: "/student/orders", icon: <FileCheck className="w-5 h-5" /> },
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
          { label: "Vue d'ensemble", href: "/admin", icon: <LayoutDashboard className="w-4 h-4 text-gold" /> },
          { label: "Tous les Utilisateurs", href: "/admin/users", icon: <Users className="w-4 h-4 text-gold" /> },
          { label: "Maquettistes", href: "/admin/users/layout-artists", icon: <PenTool className="w-4 h-4 text-gold" /> },
          { label: "Chef Maquettiste", href: "/admin/users/chief-layout", icon: <ShieldCheck className="w-4 h-4 text-gold" /> },
          { label: "Gestionnaires", href: "/admin/users/managers", icon: <Briefcase className="w-4 h-4 text-gold" /> },
          { label: "Juristes & Relecteurs", href: "/admin/users/legal", icon: <FileCheck className="w-4 h-4 text-gold" /> },
          { label: "Auteurs", href: "/admin/users/authors", icon: <BookOpen className="w-4 h-4 text-gold" /> },
          { label: "Universités & Inst.", href: "/admin/users/universities", icon: <GraduationCap className="w-4 h-4 text-gold" /> },
          { label: "Éditeurs Tiers", href: "/admin/users/publishers", icon: <Briefcase className="w-4 h-4 text-gold" /> },
          { label: "Clients & Lecteurs", href: "/admin/users/clients", icon: <Users className="w-4 h-4 text-gold" /> },
          { label: "Grossistes", href: "/admin/users/wholesalers", icon: <PackageCheck className="w-4 h-4 text-gold" /> },
          { label: "Catalogue & Prix", href: "/admin/catalog", icon: <BookOpen className="w-4 h-4 text-gold" /> },
          { label: "Ventes & Revenus", href: "/admin/sales", icon: <ShoppingBag className="w-4 h-4 text-gold" /> },
          { label: "Redevances", href: "/admin/royalties", icon: <DollarSign className="w-4 h-4 text-gold" /> },
          { label: "Relances & Alertes", href: "/admin/reminders", icon: <BellRing className="w-4 h-4 text-gold" /> },
          { label: "Reporting & Exports", href: "/admin/reports", icon: <FileSpreadsheet className="w-4 h-4 text-gold" /> },
          { label: "Clés API", href: "/admin/api", icon: <Key className="w-4 h-4 text-gold" /> },
          { label: "Traçabilité & Logs", href: "/admin/logs", icon: <Activity className="w-4 h-4 text-gold" /> },
          { label: "Paramètres Globaux", href: "/admin/settings", icon: <Settings className="w-4 h-4 text-gold" /> },
          { label: "Mon Profil", href: "/profile", icon: <UserIcon className="w-4 h-4 text-gold" /> },
        ];
      case "author":
        return [
          { label: "Mon Espace Auteur", href: "/author", icon: <LayoutDashboard className="w-4 h-4 text-gold" /> },
          { label: "Mes Livres", href: "/author/books", icon: <BookOpen className="w-4 h-4 text-gold" /> },
          { label: "Mes Dépôts & Manuscrits", href: "/author/submissions", icon: <PenTool className="w-4 h-4 text-gold" /> },
          { label: "Droits & Redevances", href: "/author/royalties", icon: <DollarSign className="w-4 h-4 text-gold" /> },
          { label: "Mes Achats", href: "/author/purchases", icon: <ShoppingBag className="w-4 h-4 text-gold" /> },
          { label: "Mon Profil", href: "/profile", icon: <UserIcon className="w-4 h-4 text-gold" /> },
        ];
      case "publisher":
        return [
          { label: "Espace Éditeur", href: "/publisher", icon: <LayoutDashboard className="w-4 h-4 text-gold" /> },
          { label: "Dépôts & Soumissions", href: "/publisher/submissions", icon: <Briefcase className="w-4 h-4 text-gold" /> },
          { label: "Nouveau Dépôt", href: "/publisher/submissions/new", icon: <PenTool className="w-4 h-4 text-gold" /> },
          { label: "Redevances & Droits", href: "/publisher/royalties", icon: <DollarSign className="w-4 h-4 text-gold" /> },
          { label: "Mon Profil", href: "/profile", icon: <UserIcon className="w-4 h-4 text-gold" /> },
        ];
      case "layout_artist":
        return [
          { label: "Espace Maquettiste", href: "/layout-artist", icon: <LayoutDashboard className="w-4 h-4 text-gold" /> },
          { label: "Validation des Maquettes", href: "/layout-artist/validation", icon: <PenTool className="w-4 h-4 text-gold" /> },
          { label: "Mon Profil", href: "/profile", icon: <UserIcon className="w-4 h-4 text-gold" /> },
        ];
      case "legal_reviewer":
        return [
          { label: "Espace Juridique", href: "/legal-reviewer", icon: <LayoutDashboard className="w-4 h-4 text-gold" /> },
          { label: "Relecture Contrats", href: "/legal-reviewer/contracts", icon: <ShieldCheck className="w-4 h-4 text-gold" /> },
          { label: "Mon Profil", href: "/profile", icon: <UserIcon className="w-4 h-4 text-gold" /> },
        ];
      case "librarian":
        return [
          { label: "Espace Bibliothécaire", href: "/librarian", icon: <LayoutDashboard className="w-4 h-4 text-gold" /> },
          { label: "Gestion Affiliations", href: "/librarian/affiliations", icon: <Users className="w-4 h-4 text-gold" /> },
          { label: "Statistiques d'Usage", href: "/librarian/stats", icon: <FileCheck className="w-4 h-4 text-gold" /> },
          { label: "Catalogue Universitaire", href: "/student/catalog", icon: <Briefcase className="w-4 h-4 text-gold" /> },
          { label: "Mon Profil", href: "/profile", icon: <UserIcon className="w-4 h-4 text-gold" /> },
        ];
      case "teacher":
        return [
          { label: "Mon Espace Enseignant", href: "/student", icon: <LayoutDashboard className="w-4 h-4 text-gold" /> },
          { label: "Ma Bibliothèque", href: "/student/books", icon: <BookOpen className="w-4 h-4 text-gold" /> },
          { label: "Mes Cours Prescrits", href: "/teacher", icon: <PenTool className="w-4 h-4 text-gold" /> },
          { label: "Mes Commandes", href: "/student/orders", icon: <PackageCheck className="w-4 h-4 text-gold" /> },
          { label: "Mon Abonnement", href: "/student/subscriptions", icon: <Sparkles className="w-4 h-4 text-gold" /> },
          { label: "Catalogue", href: "/student/catalog", icon: <Briefcase className="w-4 h-4 text-gold" /> },
          { label: "Mon Profil", href: "/profile", icon: <UserIcon className="w-4 h-4 text-gold" /> },
        ];
      default:
        // Student / Super Client
        return [
          { label: "Mon Espace Lecteur", href: "/student", icon: <LayoutDashboard className="w-4 h-4 text-gold" /> },
          { label: "Ma Bibliothèque", href: "/student/books", icon: <BookOpen className="w-4 h-4 text-gold" /> },
          { label: "Catalogue Universitaire", href: "/student/catalog", icon: <Briefcase className="w-4 h-4 text-gold" /> },
          { label: "Historique & Notes", href: "/student/history", icon: <FileCheck className="w-4 h-4 text-gold" /> },
          { label: "Mes Commandes", href: "/student/orders", icon: <PackageCheck className="w-4 h-4 text-gold" /> },
          { label: "Mon Panier", href: "/cart", icon: <ShoppingCart className="w-4 h-4 text-gold" /> },
          { label: "Mon Abonnement & Pass", href: "/student/subscriptions", icon: <Sparkles className="w-4 h-4 text-gold" /> },
          { label: "Mon Profil", href: "/profile", icon: <UserIcon className="w-4 h-4 text-gold" /> },
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
      case "legal_reviewer":
        return "RELECTEUR JURIDIQUE";
      case "librarian":
        return "BIBLIOTHÉCAIRE RÉFÉRENT";
      case "teacher":
        return "ENSEIGNANT CHERCHEUR";
      default:
        return "ÉTUDIANT / LECTEUR";
    }
  };

  return (
    <>
      {/* Barre de navigation mobile en bas */}
      <nav
        aria-label="Navigation Mobile"
        className="fixed bottom-0 left-0 right-0 w-full bg-navy-dark border-t border-navy-hover z-50 md:hidden py-1 px-2 shadow-2xl flex items-center justify-between"
      >
        {/* Items Gauche */}
        <div className="flex items-center justify-around flex-1">
          {nav.leftItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center text-[10px] font-medium py-1 px-2 transition-colors",
                  isActive ? "text-gold font-bold" : "text-white/70 hover:text-white"
                )}
              >
                {item.icon}
                <span className="mt-0.5 truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* CTA Central (Bouton doré surélevé) */}
        <div className="relative -top-4 px-2">
          <Link
            href={nav.centerCta.href}
            className="flex flex-col items-center justify-center w-13 h-13 rounded-full bg-gold text-navy shadow-lg shadow-gold/20 border-4 border-navy-dark hover:scale-105 transition-transform"
          >
            {nav.centerCta.icon}
          </Link>
        </div>

        {/* Items Droite + Menu Toggle */}
        <div className="flex items-center justify-around flex-1">
          {nav.rightItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center text-[10px] font-medium py-1 px-2 transition-colors",
                  isActive ? "text-gold font-bold" : "text-white/70 hover:text-white"
                )}
              >
                {item.icon}
                <span className="mt-0.5 truncate">{item.label}</span>
              </Link>
            );
          })}

          {/* Bouton Menu Drawer */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className={cn(
              "flex flex-col items-center justify-center text-[10px] font-medium py-1 px-2 transition-colors",
              menuOpen ? "text-gold font-bold" : "text-white/70 hover:text-white"
            )}
          >
            <MenuIcon className="w-5 h-5" />
            <span className="mt-0.5">Menu</span>
          </button>
        </div>
      </nav>

      {/* Drawer Bottom Sheet Menu */}
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
                  onClick={() => setMenuOpen(false)}
                  className="p-2 rounded-full bg-background-secondary border border-border text-foreground-muted hover:text-navy transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Institution / Affiliation Info */}
              <div className="bg-background-secondary p-4 rounded-2xl border border-border space-y-2 text-xs">
                <div className="flex items-center gap-2 text-navy font-bold">
                  <Building2 className="w-4 h-4 text-gold shrink-0" />
                  <span>Direction & Plateforme LAHAThèque</span>
                </div>
                <div className="flex items-center gap-2 text-foreground-muted">
                  <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
                  <span>Compte Vérifié : <strong className="text-navy">{user?.email || "admin@lahatheque.com"}</strong></span>
                </div>
              </div>

              {/* Dynamic Navigation Links in Sheet reflecting exact role sidebar */}
              <div className="space-y-2">
                <p className="text-[11px] font-bold text-foreground-muted uppercase tracking-wider">
                  Menu & Navigation Rôle ({user?.role || "standard"})
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  {drawerLinks.map((link) => (
                    <Link
                      key={link.href + link.label}
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      className={cn(
                        "p-3 rounded-xl bg-background-secondary border border-border flex items-center gap-2 text-xs font-semibold text-navy hover:border-gold transition-colors truncate",
                        pathname === link.href && "border-gold bg-gold/10 font-bold"
                      )}
                    >
                      {link.icon}
                      <span className="truncate">{link.label}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Logout Footer */}
              <div className="pt-3 border-t border-border">
                <button
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
