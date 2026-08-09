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
  DollarSign
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const Logo = () => (
  <Link href="#" className="font-normal flex space-x-2 items-center text-sm py-1 relative z-20">
    <div className="p-1.5 bg-background border border-border rounded-lg shadow-xs flex-shrink-0">
      <Image src="/logo.png" alt="LAHA" width={20} height={20} className="rounded-sm" />
    </div>
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="font-serif text-lg font-bold text-white whitespace-pre"
    >
      LAHAThèque
    </motion.span>
  </Link>
);

const LogoIcon = () => (
  <Link href="#" className="font-normal flex space-x-2 items-center text-sm py-1 relative z-20">
    <div className="p-1.5 bg-background border border-border rounded-lg shadow-xs flex-shrink-0">
      <Image src="/logo.png" alt="LAHA" width={20} height={20} className="rounded-sm" />
    </div>
  </Link>
);

export function DashboardSidebar() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  // Définition des liens selon le rôle
  const getLinks = () => {
    switch (user?.role) {
      case "student":
        return [
          { label: "Mon Espace", href: "/student", icon: <LayoutDashboard className="w-5 h-5" /> },
          { label: "Catalogue", href: "/catalog", icon: <BookOpen className="w-5 h-5" /> },
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
        <div>
          <SidebarLink
            link={{
              label: "Paramètres",
              href: "/profile",
              icon: <Settings className="w-5 h-5" />,
            }}
          />
        </div>
      </SidebarBody>
    </Sidebar>
  );
}
