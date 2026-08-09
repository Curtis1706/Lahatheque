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
  User as UserIcon
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

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

  // Définition des liens selon le rôle
  const getLinks = () => {
    switch (user?.role) {
      case "student":
        return [
          { label: "Mon Espace", href: "/student", icon: <LayoutDashboard className="w-5 h-5" /> },
          { label: "Mes Ouvrages", href: "/student/books", icon: <BookOpen className="w-5 h-5" /> },
          { label: "Catalogue Universitaire", href: "/student/catalog", icon: <Briefcase className="w-5 h-5" /> },
          { label: "Historique & Notes", href: "/student/history", icon: <FileCheck className="w-5 h-5" /> },
        ];
      case "teacher":
        return [
          { label: "Tableau de bord", href: "/teacher", icon: <LayoutDashboard className="w-5 h-5" /> },
          { label: "Mes Cours", href: "/teacher/courses", icon: <PenTool className="w-5 h-5" /> },
          { label: "Spécimens", href: "/teacher/specimens", icon: <BookOpen className="w-5 h-5" /> },
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
          { label: "Mes Manuscrits", href: "/author/submissions", icon: <PenTool className="w-5 h-5" /> },
          { label: "Mes Redevances", href: "/author/royalties", icon: <DollarSign className="w-5 h-5" /> },
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
      default:
        return [
          { label: "Accueil", href: "/", icon: <LayoutDashboard className="w-5 h-5" /> },
        ];
    }
  };

  const links = getLinks();

  const userDisplayName = user ? `${user.first_name} ${user.last_name}` : "Mon Profil";

  return (
    <Sidebar open={open} setOpen={setOpen}>
      <SidebarBody className="justify-between gap-10">
        <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
          {open ? <Logo /> : <LogoIcon />}
          <div className="mt-8 flex flex-col gap-2">
            {links.map((link, idx) => (
              <SidebarLink key={idx} link={link} />
            ))}
          </div>
        </div>
        <div className="pt-4 border-t border-navy-hover flex flex-col gap-1">
          <SidebarLink
            link={{
              label: userDisplayName,
              href: "/profile",
              icon: user?.avatar || user?.profile_photo ? (
                <Image
                  src={user.avatar || user.profile_photo || ""}
                  alt="Avatar"
                  width={24}
                  height={24}
                  className="w-6 h-6 rounded-full object-cover shrink-0"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-navy-hover flex items-center justify-center text-gold border border-gold/30 text-xs font-bold shrink-0">
                  {user?.first_name?.[0] || "U"}
                </div>
              ),
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
