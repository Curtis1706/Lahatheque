"use client";

import React, { useState } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
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
  ChevronDown,
  ChevronUp,
  GraduationCap,
  HelpCircle,
  Bookmark,
  ShoppingBag,
  PackageCheck,
  ShoppingCart,
  Sparkles,
  BellRing,
  FileSpreadsheet,
  Key,
  Activity
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Bouton de toggle avec icône SVG animée qui se transforme en X (du composant 21st.dev)
 */
export const AnimatedMenuToggle = ({
  toggle,
  isOpen,
}: {
  toggle: () => void;
  isOpen: boolean;
}) => (
  <button
    onClick={toggle}
    aria-label="Toggle sidebar"
    className="focus:outline-none p-1.5 rounded-lg hover:bg-navy-hover/50 text-gold transition-colors"
  >
    <motion.div animate={{ y: isOpen ? 0 : 0 }} transition={{ duration: 0.3 }}>
      <motion.svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        initial="closed"
        animate={isOpen ? "open" : "closed"}
        transition={{ duration: 0.3 }}
        className="text-gold"
      >
        <motion.path
          fill="transparent"
          strokeWidth="2.5"
          stroke="currentColor"
          strokeLinecap="round"
          variants={{
            closed: { d: "M 2 2.5 L 22 2.5" },
            open: { d: "M 3 16.5 L 17 2.5" },
          }}
        />
        <motion.path
          fill="transparent"
          strokeWidth="2.5"
          stroke="currentColor"
          strokeLinecap="round"
          variants={{
            closed: { d: "M 2 12 L 22 12", opacity: 1 },
            open: { opacity: 0 },
          }}
          transition={{ duration: 0.2 }}
        />
        <motion.path
          fill="transparent"
          strokeWidth="2.5"
          stroke="currentColor"
          strokeLinecap="round"
          variants={{
            closed: { d: "M 2 21.5 L 22 21.5" },
            open: { d: "M 3 2.5 L 17 16.5" },
          }}
        />
      </motion.svg>
    </motion.div>
  </button>
);

/**
 * Section accordéon dépliable (du composant 21st.dev)
 */
export const CollapsibleSection = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-2">
      <button
        className="w-full flex items-center justify-between py-2 px-3 rounded-xl hover:bg-navy-hover/50 text-white/90 text-xs font-bold uppercase tracking-wider transition-colors"
        onClick={() => setOpen(!open)}
      >
        <span className="truncate">{title}</span>
        {open ? <ChevronUp className="w-3.5 h-3.5 text-gold shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-gold shrink-0" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-1 space-y-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Logo = () => (
  <Link href="/" className="flex items-center justify-center py-2 relative z-20 w-full">
    <Image 
      src="/logo.png" 
      alt="LAHAThèque" 
      width={140} 
      height={45} 
      className="h-10 w-auto object-contain shrink-0" 
      priority
    />
  </Link>
);

const LogoIcon = () => (
  <Link href="/" className="flex items-center justify-center py-2 relative z-20 w-full">
    <Image 
      src="/logo.png" 
      alt="LAHAThèque" 
      width={40} 
      height={40} 
      className="h-9 w-9 object-contain shrink-0" 
      priority
    />
  </Link>
);

export function DashboardSidebar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const getLinks = () => {
    switch (user?.role) {
      case "student":
      case "super_client":
      case "parent":
        return [
          { label: "Mon Espace Lecteur", href: "/student", icon: <LayoutDashboard className="w-5 h-5" /> },
          { label: "Ma Bibliothèque de Livres", href: "/student/books", icon: <BookOpen className="w-5 h-5" /> },
          { label: "Mes Commandes & Factures", href: "/student/orders", icon: <PackageCheck className="w-5 h-5" /> },
          { label: "Mon Abonnement & Pass", href: "/student/subscriptions", icon: <Sparkles className="w-5 h-5" /> },
          { label: "Catalogue Universitaire", href: "/student/catalog", icon: <Briefcase className="w-5 h-5" /> },
          { label: "Historique & Notes", href: "/student/history", icon: <FileCheck className="w-5 h-5" /> },
        ];
      case "teacher":
        return [
          { label: "Mon Espace Lecteur", href: "/student", icon: <LayoutDashboard className="w-5 h-5" /> },
          { label: "Ma Bibliothèque de Livres", href: "/student/books", icon: <BookOpen className="w-5 h-5" /> },
          { label: "Mes Cours Prescrits & Spécimens", href: "/teacher", icon: <PenTool className="w-5 h-5" /> },
          { label: "Mes Commandes & Factures", href: "/student/orders", icon: <PackageCheck className="w-5 h-5" /> },
          { label: "Mon Abonnement & Pass", href: "/student/subscriptions", icon: <Sparkles className="w-5 h-5" /> },
          { label: "Catalogue Universitaire", href: "/student/catalog", icon: <Briefcase className="w-5 h-5" /> },
          { label: "Historique & Notes", href: "/student/history", icon: <FileCheck className="w-5 h-5" /> },
        ];
      case "librarian":
        return [
          { label: "Tableau de bord", href: "/librarian", icon: <LayoutDashboard className="w-5 h-5" /> },
          { label: "Affiliations", href: "/librarian/affiliations", icon: <Users className="w-5 h-5" /> },
          { label: "Statistiques", href: "/librarian/stats", icon: <FileCheck className="w-5 h-5" /> },
        ];
      case "publisher":
        return [
          { label: "Tableau de bord", href: "/publisher", icon: <LayoutDashboard className="w-5 h-5" /> },
          { label: "Soumissions", href: "/publisher/submissions", icon: <Briefcase className="w-5 h-5" /> },
          { label: "Redevances", href: "/publisher/royalties", icon: <DollarSign className="w-5 h-5" /> },
        ];
      case "author":
        return [
          { label: "Tableau de bord", href: "/author", icon: <LayoutDashboard className="w-5 h-5" /> },
          { label: "Mes Livres", href: "/author/books", icon: <BookOpen className="w-5 h-5" /> },
          { label: "Mes Dépôts", href: "/author/submissions", icon: <PenTool className="w-5 h-5" /> },
          { label: "Droits & Paiements", href: "/author/royalties", icon: <DollarSign className="w-5 h-5" /> },
          {label: "Mes Achats & Commandes", href: "/author/purchases", icon: <ShoppingBag className="w-5 h-5" /> },
        ];
      case "legal_reviewer":
        return [
          { label: "Tableau de bord", href: "/legal-reviewer", icon: <LayoutDashboard className="w-5 h-5" /> },
          { label: "Contrats", href: "/legal-reviewer/contracts", icon: <ShieldCheck className="w-5 h-5" /> },
        ];
      case "layout_artist":
        return [
          { label: "Tableau de bord", href: "/layout-artist", icon: <LayoutDashboard className="w-5 h-5" /> },
          { label: "Maquettes", href: "/layout-artist/validation", icon: <PenTool className="w-5 h-5" /> },
        ];
      case "admin":
      case "super_admin":
        return [
          { label: "Vue d'ensemble", href: "/admin", icon: <LayoutDashboard className="w-5 h-5" /> },
          { label: "Gestion Utilisateurs", href: "/admin/users", icon: <Users className="w-5 h-5" /> },
          { label: "Catalogue & Prix", href: "/admin/catalog", icon: <BookOpen className="w-5 h-5" /> },
          { label: "Ventes & Revenus", href: "/admin/sales", icon: <ShoppingBag className="w-5 h-5" /> },
          { label: "Redevances", href: "/admin/royalties", icon: <DollarSign className="w-5 h-5" /> },
          { label: "Relances & Alertes", href: "/admin/reminders", icon: <BellRing className="w-5 h-5" /> },
          { label: "Reporting & Exports", href: "/admin/reports", icon: <FileSpreadsheet className="w-5 h-5" /> },
          { label: "Clés API & Partenaires", href: "/admin/api", icon: <Key className="w-5 h-5" /> },
          { label: "Traçabilité & Logs", href: "/admin/logs", icon: <Activity className="w-5 h-5" /> },
          { label: "Paramètres Globaux", href: "/admin/settings", icon: <Settings className="w-5 h-5" /> },
        ];
      default:
        return [
          { label: "Mon Espace Lecteur", href: "/student", icon: <LayoutDashboard className="w-5 h-5" /> },
          { label: "Ma Bibliothèque de Livres", href: "/student/books", icon: <BookOpen className="w-5 h-5" /> },
          { label: "Catalogue Universitaire", href: "/student/catalog", icon: <Briefcase className="w-5 h-5" /> },
        ];
    }
  };

  const links = getLinks();
  const userDisplayName = user ? `${user.first_name} ${user.last_name}` : "Profil";

  return (
    <Sidebar open={open} setOpen={setOpen}>
      <SidebarBody className="justify-between gap-6">
        <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          {/* Header avec Logo + Animated SVG Menu Toggle Button */}
          <div className="flex items-center justify-between pb-3 border-b border-navy-hover">
            {open ? <Logo /> : <LogoIcon />}
            <AnimatedMenuToggle toggle={() => setOpen(!open)} isOpen={open} />
          </div>

          {/* User Profile Card Unique en haut (21st.dev Profile Card) */}
          {open && user && (
            <div className="p-3 my-4 rounded-xl bg-navy/60 border border-navy-hover flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-navy-dark text-gold font-serif font-bold flex items-center justify-center text-xs border border-gold/30 shrink-0">
                {user.first_name?.[0] || "L"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-xs text-white truncate">{userDisplayName}</p>
                <p className="text-[10px] text-gold truncate">
                  {user.role === "teacher" ? "Lecteur • Enseignant" : user.role === "author" ? "Auteur • LAHA Éditions" : "Lecteur • LAHAThèque"}
                </p>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <div className="mt-2 flex flex-col gap-1">
            {links.map((link, idx) => (
              <SidebarLink 
                key={idx} 
                link={link} 
                onClick={() => setOpen(false)}
              />
            ))}
          </div>

          {/* Sections dépliables CollapsibleSection (21st.dev) */}
          {open && (
            <div className="mt-6 pt-4 border-t border-navy-hover space-y-2">
              <CollapsibleSection title="Options Universitaires">
                <SidebarLink 
                  link={{ label: "Bibliothèque UAC", href: "/student/catalog", icon: <GraduationCap className="w-4 h-4 text-gold" /> }} 
                />
                <SidebarLink 
                  link={{ label: "Mes Favoris", href: "/student/books", icon: <Bookmark className="w-4 h-4 text-gold" /> }} 
                />
              </CollapsibleSection>

              <CollapsibleSection title="Aide & Support">
                <SidebarLink 
                  link={{ label: "Centre d'Aide", href: "/contact", icon: <HelpCircle className="w-4 h-4 text-gold" /> }} 
                />
              </CollapsibleSection>
            </div>
          )}
        </div>

        {/* Footer Actions (Sans doublon du nom utilisateur) */}
        <div className="pt-3 border-t border-navy-hover flex flex-col gap-1 shrink-0">
          <SidebarLink
            link={{
              label: "Mon Profil",
              href: "/profile",
              icon: <UserIcon className="w-5 h-5 text-white/70" />,
            }}
          />
          <SidebarLink
            onClick={(e) => {
              e.preventDefault();
              logout();
            }}
            link={{
              label: "Déconnexion",
              href: "#",
              icon: <LogOut className="w-5 h-5 text-error/80" />,
            }}
          />
        </div>
      </SidebarBody>
    </Sidebar>
  );
}
