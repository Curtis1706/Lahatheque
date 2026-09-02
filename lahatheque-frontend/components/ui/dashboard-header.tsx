"use client";

import React from "react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";
import { 
  User, 
  LogOut, 
  Settings, 
  LayoutDashboard, 
  ChevronRight, 
  Sparkles,
  ShieldCheck,
  GraduationCap,
  BookOpen,
  ShoppingBag,
  BellRing
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export function DashboardHeader() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case "student": return "Client Lecteur / Étudiant";
      case "teacher": return "Enseignant";
      case "author": return "Auteur • LAHA Éditions";
      case "university": return "Université • Établissement Partenaire";
      case "layout_artist": return "Maquettiste • Création";
      case "chief_layout": return "Chef Maquettiste • Validateur";
      case "manager": return "Gestionnaire • Stock & Livraison";
      case "legal_reviewer": return "Juriste • Gestion Légale";
      case "publisher": return "Éditeur Tiers • Partenaire";
      case "wholesaler":
      case "super_client": return "Grossiste • Ventes en Gros";
      case "super_admin":
      case "admin": return "Administrateur Principal";
      default: return "Utilisateur LAHAThèque";
    }
  };

  const getDashboardLink = (role?: string) => {
    switch (role) {
      case "student": return "/student";
      case "teacher": return "/student";
      case "author": return "/author";
      case "university": return "/university";
      case "layout_artist": return "/layout-artist";
      case "chief_layout": return "/chief-layout";
      case "manager": return "/manager";
      case "legal_reviewer": return "/legal-reviewer";
      case "publisher": return "/publisher";
      case "wholesaler":
      case "super_client": return "/wholesaler";
      case "super_admin":
      case "admin": return "/admin";
      default: return "/student";
    }
  };

  // Résolution dynamique du titre et du fil d'ariane selon l'URL active
  const getPageMeta = (path: string) => {
    if (path.startsWith("/admin/users")) return { section: "Administration", title: "Gestion des Utilisateurs" };
    if (path.startsWith("/admin/catalog")) return { section: "Administration", title: "Catalogue & Prix" };
    if (path.startsWith("/admin/validation")) return { section: "Administration", title: "Validation BAT & Maquettisme" };
    if (path.startsWith("/admin/contracts")) return { section: "Administration", title: "Contrats & Droits d'Auteur" };
    if (path.startsWith("/admin/stock")) return { section: "Administration", title: "Stock Physique & Entrepôts" };
    if (path.startsWith("/admin/sales")) return { section: "Administration", title: "Ventes & Revenus" };
    if (path.startsWith("/admin/royalties")) return { section: "Administration", title: "Redevances & Relevés" };
    if (path.startsWith("/admin/reminders")) return { section: "Administration", title: "Relances & Impayés" };
    if (path.startsWith("/admin/reports")) return { section: "Administration", title: "Reporting & Exports" };
    if (path.startsWith("/admin/api")) return { section: "Administration", title: "Clés API & Partenaires" };
    if (path.startsWith("/admin/logs")) return { section: "Administration", title: "Traçabilité & Logs" };
    if (path.startsWith("/admin/settings")) return { section: "Administration", title: "Paramètres Globaux" };
    if (path === "/admin") return { section: "Administration", title: "Vue d'ensemble Administrateur" };

    if (path.startsWith("/author/books")) return { section: "Espace Auteur", title: "Mes Livres Publiés" };
    if (path.startsWith("/author/submissions")) return { section: "Espace Auteur", title: "Mes Dépôts & Manuscrits" };
    if (path.startsWith("/author/royalties")) return { section: "Espace Auteur", title: "Droits & Paiements" };
    if (path.startsWith("/author/purchases")) return { section: "Espace Auteur", title: "Mes Achats" };
    if (path.startsWith("/author/profile")) return { section: "Espace Auteur", title: "Profil & Délégation" };
    if (path === "/author") return { section: "Espace Auteur", title: "Vue d'ensemble Auteur" };

    if (path.startsWith("/publisher/catalog")) return { section: "Espace Éditeur", title: "Mon Catalogue Éditeur" };
    if (path.startsWith("/publisher/submissions")) return { section: "Espace Éditeur", title: "Suivi des Dépôts & Validation" };
    if (path.startsWith("/publisher/stats")) return { section: "Espace Éditeur", title: "Statistiques & Lectorat" };
    if (path.startsWith("/publisher/royalties")) return { section: "Espace Éditeur", title: "Redevances & Ventes" };
    if (path.startsWith("/publisher/api")) return { section: "Espace Éditeur", title: "Clés API & Intégration REST" };
    if (path.startsWith("/publisher/logs")) return { section: "Espace Éditeur", title: "Journaux & Traçabilité DRM" };
    if (path.startsWith("/publisher/profile")) return { section: "Espace Éditeur", title: "Profil & Mandat d'Édition" };
    if (path === "/publisher") return { section: "Espace Éditeur", title: "Vue d'ensemble Éditeur Tiers" };

    if (path.startsWith("/university/stats")) return { section: "Espace Université", title: "Statistiques & Usage" };
    if (path.startsWith("/university/catalog")) return { section: "Espace Université", title: "Catalogue Universitaire" };
    if (path.startsWith("/university/bouquets")) return { section: "Espace Université", title: "Bouquets Documentaires" };
    if (path.startsWith("/university/affiliations")) return { section: "Espace Université", title: "Affiliations Étudiants" };
    if (path.startsWith("/university/purchases")) return { section: "Espace Université", title: "Achats Livres Papier Campus" };
    if (path.startsWith("/university/royalties")) return { section: "Espace Université", title: "Redevances 15%" };
    if (path.startsWith("/university/profile")) return { section: "Espace Université", title: "Profil Établissement" };
    if (path === "/university") return { section: "Espace Université", title: "Vue d'ensemble Université" };

    if (path.startsWith("/student/catalog")) return { section: "Espace Lecteur", title: "Catalogue & Découverte" };
    if (path.startsWith("/student/books")) return { section: "Espace Lecteur", title: "Ma Bibliothèque" };
    if (path.startsWith("/student/orders")) return { section: "Espace Lecteur", title: "Achats & Commandes Papier" };
    if (path.startsWith("/student/history")) return { section: "Espace Lecteur", title: "Historique & Statistiques d'Étude" };
    if (path.startsWith("/student/subscriptions")) return { section: "Espace Lecteur", title: "Accès & Formules" };
    if (path.startsWith("/student/profile")) return { section: "Espace Lecteur", title: "Mon Profil" };
    if (path.startsWith("/student/university")) return { section: "Espace Lecteur", title: "Mon Université" };
    if (path === "/student") return { section: "Espace Lecteur", title: "Mon Espace Lecteur" };

    if (path.startsWith("/wholesaler/catalog")) return { section: "Espace Grossiste", title: "Catalogue & Achat Gros" };
    if (path.startsWith("/wholesaler/orders")) return { section: "Espace Grossiste", title: "Commandes Groupées" };
    if (path.startsWith("/wholesaler/notifications")) return { section: "Espace Grossiste", title: "Nouveautés & Ventes" };
    if (path.startsWith("/wholesaler/profile")) return { section: "Espace Grossiste", title: "Profil & Facturation B2B" };
    if (path === "/wholesaler") return { section: "Espace Grossiste", title: "Vue d'ensemble Grossiste" };

    if (path.startsWith("/layout-artist/deposits")) return { section: "Espace Maquettiste", title: "Mes Dépôts & Maquettes" };
    if (path === "/layout-artist") return { section: "Espace Maquettiste", title: "Vue d'ensemble Maquettiste" };

    if (path.startsWith("/chief-layout/validation")) return { section: "Chef Maquettiste", title: "Dépôts en Attente de Validation" };
    if (path.startsWith("/chief-layout/history")) return { section: "Chef Maquettiste", title: "Historique des Validations" };
    if (path === "/chief-layout") return { section: "Chef Maquettiste", title: "Vue d'ensemble Chef Maquettiste" };

    if (path.startsWith("/legal-reviewer/contracts")) return { section: "Espace Juriste", title: "Contrats Légaux" };
    if (path.startsWith("/legal-reviewer/royalties")) return { section: "Espace Juriste", title: "Droits d'Auteur" };
    if (path.startsWith("/legal-reviewer/pre-editions")) return { section: "Espace Juriste", title: "Pré-éditions" };
    if (path.startsWith("/legal-reviewer/redevances")) return { section: "Espace Juriste", title: "Redevances" };
    if (path.startsWith("/legal-reviewer/relances")) return { section: "Espace Juriste", title: "Relances & Impayés" };
    if (path === "/legal-reviewer") return { section: "Espace Juriste", title: "Vue d'ensemble Juriste" };

    if (path.startsWith("/manager/stock")) return { section: "Espace Gestionnaire", title: "Gestion du Stock Papier" };
    if (path.startsWith("/manager/delivery")) return { section: "Espace Gestionnaire", title: "Suivi des Expéditions" };
    if (path.startsWith("/manager/coordination")) return { section: "Espace Gestionnaire", title: "Coordination Admin" };
    if (path.startsWith("/manager/reports")) return { section: "Espace Gestionnaire", title: "Rapports Logistiques" };
    if (path.startsWith("/manager/profile")) return { section: "Espace Gestionnaire", title: "Profil & Paramètres Logistiques" };
    if (path === "/manager") return { section: "Espace Gestionnaire", title: "Vue d'ensemble Gestionnaire" };

    if (path === "/profile") return { section: "Compte", title: "Mon Profil & Préférences" };

    return { section: "LAHAThèque", title: "Tableau de Bord" };
  };

  const pageMeta = getPageMeta(pathname);
  const dashboardUrl = getDashboardLink(user?.role);

  return (
    <header className="bg-background border-b border-border py-3.5 px-4 sm:px-6 lg:px-8 flex items-center justify-between shadow-xs sticky top-0 z-40 transition-colors">
      
      {/* Titre & Fil d'Ariane dynamique de la page active */}
      <div className="flex items-center gap-2 min-w-0">
        <Link href={dashboardUrl} className="flex items-center gap-2 shrink-0 group">
          <div className="w-8 h-8 rounded-xl bg-navy/10 border border-border flex items-center justify-center text-navy group-hover:border-gold transition-colors">
            <LayoutDashboard className="w-4 h-4 text-navy group-hover:text-gold transition-colors" />
          </div>
        </Link>
        <ChevronRight className="w-4 h-4 text-foreground-muted shrink-0 hidden sm:inline-block" />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[11px] text-foreground-muted font-medium">
            <span className="hidden sm:inline-block text-navy font-semibold">{pageMeta.section}</span>
          </div>
          <h1 className="font-serif text-sm sm:text-base font-bold text-navy truncate">
            {pageMeta.title}
          </h1>
        </div>
      </div>

      {/* Partie Droite : Badge Rôle, Profil et Actions */}
      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
        {/* Badge rôle utilisateur dynamique avec surbrillance dorée */}
        <div className="hidden md:flex flex-col text-right">
          <span className="font-bold text-navy text-xs leading-tight">
            {user ? `${user.first_name} ${user.last_name}`.trim() : "Compte Utilisateur"}
          </span>
          <span className="text-[10px] text-gold font-bold uppercase tracking-wider mt-0.5 px-2 py-0.5 rounded bg-gold/10 border border-gold/20 inline-block">
            {getRoleLabel(user?.role)}
          </span>
        </div>

        {/* Boutons d'action rapides */}
        <div className="flex items-center gap-1.5 border-l border-border pl-3 sm:pl-4">
          <Link
            href={dashboardUrl}
            className={cn(
              "p-2 rounded-xl border transition-all text-xs font-medium flex items-center gap-1.5",
              pathname === dashboardUrl
                ? "bg-navy text-gold border-gold font-bold shadow-xs"
                : "bg-background-secondary border-border text-foreground-muted hover:text-navy hover:border-navy"
            )}
            title="Accueil du Tableau de bord"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span className="hidden lg:inline-block text-xs">Accueil</span>
          </Link>

          <Link
            href="/profile"
            className={cn(
              "p-2 rounded-xl border transition-all text-xs font-medium flex items-center gap-1.5",
              pathname === "/profile"
                ? "bg-navy text-gold border-gold font-bold shadow-xs"
                : "bg-background-secondary border-border text-foreground-muted hover:text-navy hover:border-navy"
            )}
            title="Mon Profil & Sécurité"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden lg:inline-block text-xs">Profil</span>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="p-2 rounded-xl bg-error/10 border border-error/20 text-error hover:bg-error/20 transition-all text-xs font-semibold flex items-center gap-1.5"
            title="Se déconnecter de LAHAThèque"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden lg:inline-block text-xs">Déconnexion</span>
          </button>
        </div>
      </div>

    </header>
  );
}

export default DashboardHeader;
