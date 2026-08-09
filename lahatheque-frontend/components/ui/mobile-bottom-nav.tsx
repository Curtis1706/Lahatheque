"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { 
  LayoutDashboard, 
  BookOpen, 
  Briefcase, 
  FileCheck, 
  User as UserIcon,
  Menu as MenuIcon,
  X,
  LogOut,
  Building2,
  CheckCircle2,
  GraduationCap,
  ShieldCheck,
  PenTool,
  DollarSign,
  Users
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export function MobileBottomNav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  // Configuration des items de navigation selon le rôle
  const getNavConfig = () => {
    switch (user?.role) {
      case "student":
        return {
          leftItems: [
            { label: "Aperçu", href: "/student", icon: <LayoutDashboard className="w-5 h-5" /> },
            { label: "Ouvrages", href: "/student/books", icon: <BookOpen className="w-5 h-5" /> },
          ],
          centerCta: { label: "Catalogue", href: "/student/catalog", icon: <Briefcase className="w-6 h-6" /> },
          rightItems: [
            { label: "Historique", href: "/student/history", icon: <FileCheck className="w-5 h-5" /> },
          ]
        };
      case "teacher":
        return {
          leftItems: [
            { label: "Aperçu", href: "/teacher", icon: <LayoutDashboard className="w-5 h-5" /> },
            { label: "Cours", href: "/teacher/courses", icon: <PenTool className="w-5 h-5" /> },
          ],
          centerCta: { label: "Spécimens", href: "/teacher/specimens", icon: <BookOpen className="w-6 h-6" /> },
          rightItems: [
            { label: "Recherche", href: "/catalog", icon: <Briefcase className="w-5 h-5" /> },
          ]
        };
      case "librarian":
        return {
          leftItems: [
            { label: "Aperçu", href: "/librarian", icon: <LayoutDashboard className="w-5 h-5" /> },
            { label: "Affiliations", href: "/librarian/affiliations", icon: <Users className="w-5 h-5" /> },
          ],
          centerCta: { label: "Catalogue", href: "/catalog", icon: <Briefcase className="w-6 h-6" /> },
          rightItems: [
            { label: "Stats", href: "/librarian/stats", icon: <FileCheck className="w-5 h-5" /> },
          ]
        };
      case "publisher":
        return {
          leftItems: [
            { label: "Aperçu", href: "/publisher", icon: <LayoutDashboard className="w-5 h-5" /> },
            { label: "Soumissions", href: "/publisher/submissions", icon: <Briefcase className="w-5 h-5" /> },
          ],
          centerCta: { label: "Nouvelle", href: "/publisher/submissions/new", icon: <PenTool className="w-6 h-6" /> },
          rightItems: [
            { label: "Redevances", href: "/publisher/royalties", icon: <DollarSign className="w-5 h-5" /> },
          ]
        };
      case "author":
        return {
          leftItems: [
            { label: "Aperçu", href: "/author", icon: <LayoutDashboard className="w-5 h-5" /> },
            { label: "Manuscrits", href: "/author/submissions", icon: <PenTool className="w-5 h-5" /> },
          ],
          centerCta: { label: "Nouveau", href: "/submit", icon: <PenTool className="w-6 h-6" /> },
          rightItems: [
            { label: "Redevances", href: "/author/royalties", icon: <DollarSign className="w-5 h-5" /> },
          ]
        };
      default:
        return {
          leftItems: [
            { label: "Accueil", href: "/", icon: <LayoutDashboard className="w-5 h-5" /> },
          ],
          centerCta: { label: "Catalogue", href: "/catalog", icon: <Briefcase className="w-6 h-6" /> },
          rightItems: [
            { label: "Connexion", href: "/login", icon: <UserIcon className="w-5 h-5" /> },
          ]
        };
    }
  };

  const nav = getNavConfig();

  return (
    <>
      {/* Barre de navigation mobile pleine largeur en bas (Modèle LahaAcademia) */}
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
                  "flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-colors font-mono text-[9px] uppercase tracking-wider",
                  isActive ? "text-gold font-bold" : "text-white/60 hover:text-white"
                )}
              >
                {item.icon}
                <span className="mt-0.5">{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Bouton Central Doré Flottant (LahaAcademia Center Gold CTA Badge) */}
        {nav.centerCta && (
          <div className="relative flex justify-center items-center px-2">
            <Link
              href={nav.centerCta.href}
              className={cn(
                "bg-gold text-navy font-bold rounded-full p-3.5 -mt-6 shadow-xl border-4 border-navy-dark hover:scale-105 transition-transform flex items-center justify-center",
                pathname === nav.centerCta.href && "ring-2 ring-gold ring-offset-2 ring-offset-navy-dark"
              )}
              title={nav.centerCta.label}
            >
              {nav.centerCta.icon}
            </Link>
          </div>
        )}

        {/* Items Droite + Menu Drawer */}
        <div className="flex items-center justify-around flex-1">
          {nav.rightItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-colors font-mono text-[9px] uppercase tracking-wider",
                  isActive ? "text-gold font-bold" : "text-white/60 hover:text-white"
                )}
              >
                {item.icon}
                <span className="mt-0.5">{item.label}</span>
              </Link>
            );
          })}

          {/* Bouton Menu Drawer */}
          <button
            onClick={() => setMenuOpen(true)}
            className={cn(
              "flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-colors font-mono text-[9px] uppercase tracking-wider",
              menuOpen ? "text-gold font-bold" : "text-white/60 hover:text-white"
            )}
          >
            <MenuIcon className="w-5 h-5" />
            <span className="mt-0.5">Menu</span>
          </button>
        </div>
      </nav>

      {/* Drawer Bottom Sheet Menu (Modèle LahaAcademia Drawer Sheet) */}
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
                  <div className="w-10 h-10 rounded-full bg-navy text-gold font-bold flex items-center justify-center text-sm border border-gold/30">
                    {user?.first_name ? user.first_name.slice(0, 1).toUpperCase() : "U"}
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-navy text-base">
                      {user?.first_name || user?.last_name ? `${user.first_name} ${user.last_name}`.trim() : "Compte Utilisateur"}
                    </h3>
                    <div className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-gold px-2 py-0.5 rounded bg-navy/5 border border-gold/30">
                      <GraduationCap className="w-3 h-3" />
                      {user?.role === "student" ? "Étudiant Affilié" : user?.role || "Membre"}
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
                  <span>Université d&apos;Abomey-Calavi (UAC)</span>
                </div>
                <div className="flex items-center gap-2 text-foreground-muted">
                  <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
                  <span>Matricule : <strong className="text-navy">1029384-UAC</strong></span>
                </div>
              </div>

              {/* Navigation Links in Sheet */}
              <div className="space-y-2">
                <p className="text-[11px] font-bold text-foreground-muted uppercase tracking-wider">
                  Accès Rapide
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    href="/student"
                    onClick={() => setMenuOpen(false)}
                    className="p-3 rounded-xl bg-background-secondary border border-border flex items-center gap-2 text-xs font-semibold text-navy hover:border-gold transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4 text-gold" />
                    Mon Espace
                  </Link>

                  <Link
                    href="/student/books"
                    onClick={() => setMenuOpen(false)}
                    className="p-3 rounded-xl bg-background-secondary border border-border flex items-center gap-2 text-xs font-semibold text-navy hover:border-gold transition-colors"
                  >
                    <BookOpen className="w-4 h-4 text-gold" />
                    Mes Ouvrages
                  </Link>

                  <Link
                    href="/student/catalog"
                    onClick={() => setMenuOpen(false)}
                    className="p-3 rounded-xl bg-background-secondary border border-border flex items-center gap-2 text-xs font-semibold text-navy hover:border-gold transition-colors"
                  >
                    <Briefcase className="w-4 h-4 text-gold" />
                    Catalogue
                  </Link>

                  <Link
                    href="/student/history"
                    onClick={() => setMenuOpen(false)}
                    className="p-3 rounded-xl bg-background-secondary border border-border flex items-center gap-2 text-xs font-semibold text-navy hover:border-gold transition-colors"
                  >
                    <FileCheck className="w-4 h-4 text-gold" />
                    Historique
                  </Link>

                  <Link
                    href="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="p-3 rounded-xl bg-background-secondary border border-border flex items-center gap-2 text-xs font-semibold text-navy hover:border-gold transition-colors col-span-2"
                  >
                    <UserIcon className="w-4 h-4 text-gold" />
                    Mon Profil & Paramètres
                  </Link>
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
