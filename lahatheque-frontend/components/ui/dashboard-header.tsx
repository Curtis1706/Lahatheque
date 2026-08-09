"use client";

import { useAuth } from "@/hooks/use-auth";
import { User, LogOut, Settings, LayoutDashboard, Library } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

export function DashboardHeader() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case "student": return "Lecteur / Étudiant";
      case "teacher": return "Enseignant";
      case "author": return "Auteur";
      case "librarian": return "Bibliothécaire";
      case "layout_artist": return "Maquettiste";
      case "legal_reviewer": return "Juriste";
      case "publisher": return "Éditeur";
      case "super_admin": return "Administrateur";
      case "admin": return "Administrateur";
      default: return "Utilisateur";
    }
  };

  const getDashboardLink = (role?: string) => {
    switch (role) {
      case "student": return "/student";
      case "teacher": return "/teacher";
      case "author": return "/author";
      case "librarian": return "/librarian";
      case "layout_artist": return "/layout-artist";
      case "legal_reviewer": return "/legal-reviewer";
      case "publisher": return "/publisher";
      case "super_admin": return "/admin";
      case "admin": return "/admin";
      default: return "/student";
    }
  };

  return (
    <header className="bg-background border-b border-border py-4 px-6 lg:px-8 flex items-center justify-between shadow-sm sticky top-0 z-40">
      
      {/* Brand Logo */}
      <Link href={getDashboardLink(user?.role)} className="flex items-center gap-2.5 group">
        <div className="p-1.5 bg-background border border-border rounded-lg group-hover:border-gold/30 shadow-xs transition-colors">
          <Image src="/logo.png" alt="LAHA" width={28} height={28} className="rounded" />
        </div>
        <span className="font-serif text-lg font-bold text-navy hidden sm:inline-block">LAHAThèque</span>
      </Link>

      {/* Nav Right */}
      <div className="flex items-center gap-4">
        
        {/* User context badge */}
        <div className="hidden md:flex flex-col text-right">
          <span className="font-bold text-navy text-xs leading-none">
            {user ? `${user.first_name} ${user.last_name}` : "Mon Compte"}
          </span>
          <span className="text-[10px] text-gold font-bold uppercase tracking-wider mt-1">
            {getRoleLabel(user?.role)}
          </span>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-2 border-l border-border pl-4">
          <Link
            href={getDashboardLink(user?.role)}
            className="p-2 rounded-lg hover:bg-background-secondary text-foreground-muted hover:text-navy transition-all"
            title="Tableau de bord principal"
          >
            <LayoutDashboard className="w-4 h-4" />
          </Link>
          <Link
            href="/profile"
            className="p-2 rounded-lg hover:bg-background-secondary text-foreground-muted hover:text-navy transition-all"
            title="Profil & Paramètres"
          >
            <Settings className="w-4 h-4" />
          </Link>
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg hover:bg-error/10 text-foreground-muted hover:text-error transition-all"
            title="Se déconnecter"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

      </div>

    </header>
  );
}
