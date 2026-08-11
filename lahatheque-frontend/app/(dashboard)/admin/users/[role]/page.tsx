"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { CreateAccountModal } from "@/components/features/admin/create-account-modal";
import { getAdminUsers } from "@/lib/services/admin";
import { AdminUser, AdminRole } from "@/lib/types/admin";
import { Users, UserPlus, Eye, XCircle, CheckCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

const ROLE_CONFIG: Record<
  string,
  { title: string; desc: string; adminRole: AdminRole; extraHeader?: string }
> = {
  "layout-artists": {
    title: "Gérer les Maquettistes",
    desc: "Suivi des maquettistes en charge de la mise en page des fichiers PDF et EPUB.",
    adminRole: "layout_artist",
    extraHeader: "Activité Maquettes",
  },
  maquettistes: {
    title: "Gérer les Maquettistes",
    desc: "Suivi des maquettistes en charge de la mise en page des fichiers PDF et EPUB.",
    adminRole: "layout_artist",
    extraHeader: "Activité Maquettes",
  },
  "chief-layout": {
    title: "Gérer le Chef Maquettiste",
    desc: "Validation et attribution des maquettes finales.",
    adminRole: "layout_artist",
    extraHeader: "Validations Effectuées",
  },
  "chef-maquettiste": {
    title: "Gérer le Chef Maquettiste",
    desc: "Validation et attribution des maquettes finales.",
    adminRole: "layout_artist",
    extraHeader: "Validations Effectuées",
  },
  managers: {
    title: "Gérer les Gestionnaires",
    desc: "Gestionnaires de zone et de distribution.",
    adminRole: "admin",
    extraHeader: "Zone de Rattachement",
  },
  gestionnaires: {
    title: "Gérer les Gestionnaires",
    desc: "Gestionnaires de zone et de distribution.",
    adminRole: "admin",
    extraHeader: "Zone de Rattachement",
  },
  legal: {
    title: "Gérer les Juristes & Relecteurs",
    desc: "Relecteurs juridiques et suivi des contrats d'édition.",
    adminRole: "legal_reviewer",
    extraHeader: "Contrats Gérés",
  },
  juristes: {
    title: "Gérer les Juristes & Relecteurs",
    desc: "Relecteurs juridiques et suivi des contrats d'édition.",
    adminRole: "legal_reviewer",
    extraHeader: "Contrats Gérés",
  },
  authors: {
    title: "Gérer les Auteurs",
    desc: "Auteurs d'ouvrages, droits acquis et dépôts de manuscrits.",
    adminRole: "author",
    extraHeader: "Redevances Dues",
  },
  auteurs: {
    title: "Gérer les Auteurs",
    desc: "Auteurs d'ouvrages, droits acquis et dépôts de manuscrits.",
    adminRole: "author",
    extraHeader: "Redevances Dues",
  },
  universities: {
    title: "Gérer les Universités & Institutionnels",
    desc: "Établissements partenaires, bouquets souscrits et bibliothécaires référents.",
    adminRole: "partner_api",
    extraHeader: "Bouquets Actifs",
  },
  universites: {
    title: "Gérer les Universités & Institutionnels",
    desc: "Établissements partenaires, bouquets souscrits et bibliothécaires référents.",
    adminRole: "partner_api",
    extraHeader: "Bouquets Actifs",
  },
  publishers: {
    title: "Gérer les Éditeurs Tiers",
    desc: "Maisons d'édition partenaires, dépôts d'ouvrages et catalogues transférés.",
    adminRole: "publisher",
    extraHeader: "Ouvrages Déposés",
  },
  editeurs: {
    title: "Gérer les Éditeurs Tiers",
    desc: "Maisons d'édition partenaires, dépôts d'ouvrages et catalogues transférés.",
    adminRole: "publisher",
    extraHeader: "Ouvrages Déposés",
  },
  clients: {
    title: "Gérer les Clients & Lecteurs",
    desc: "Étudiants, enseignants et lecteurs individuels (Pass & Abonnements).",
    adminRole: "student",
    extraHeader: "Pass / Abonnement",
  },
  wholesalers: {
    title: "Gérer les Grossistes & Distributeurs",
    desc: "Partenaires de distribution physique et commandes en gros.",
    adminRole: "partner_api",
    extraHeader: "Volume Commandes",
  },
  grossistes: {
    title: "Gérer les Grossistes & Distributeurs",
    desc: "Partenaires de distribution physique et commandes en gros.",
    adminRole: "partner_api",
    extraHeader: "Volume Commandes",
  },
};

export default function AdminRoleUsersPage() {
  const params = useParams();
  const roleSlug = (params?.role as string) || "clients";
  const config = ROLE_CONFIG[roleSlug] || ROLE_CONFIG["clients"];

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const loadRoleUsers = async () => {
    try {
      setLoading(true);
      const data = await getAdminUsers(config.adminRole);
      setUsers(data);
    } catch (err) {
      toast.error("Erreur de chargement des utilisateurs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoleUsers();
  }, [roleSlug]);

  const handleToggleActive = (userItem: AdminUser) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userItem.id ? { ...u, is_active: !u.is_active } : u))
    );
    toast.success(`Compte ${userItem.email} mis à jour.`);
  };

  const columns: DataTableColumn<AdminUser>[] = [
    {
      key: "name",
      header: "Nom & Prénom",
      cell: (row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-navy/10 text-navy font-bold text-xs flex items-center justify-center border border-navy/20 shrink-0">
            {row.first_name[0]}
          </div>
          <div>
            <p className="font-semibold text-xs text-foreground">
              {row.first_name} {row.last_name}
            </p>
            <p className="text-[11px] text-foreground-muted">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "extra",
      header: config.extraHeader || "Détails Rôle",
      cell: (row) => {
        if (row.extra_info?.institution_name) {
          return <span className="text-xs font-semibold text-gold">{row.extra_info.institution_name}</span>;
        }
        if (row.extra_info?.pending_royalties) {
          return (
            <span className="font-mono text-xs font-bold text-foreground">
              {row.extra_info.pending_royalties.toLocaleString("fr-FR")} FCFA
            </span>
          );
        }
        if (row.extra_info?.subscription_plan) {
          return <span className="text-xs text-navy font-medium">{row.extra_info.subscription_plan}</span>;
        }
        return <span className="text-xs text-foreground-muted">{row.phone || row.country}</span>;
      },
    },
    {
      key: "country",
      header: "Pays",
      cell: (row) => (
        <span className="font-mono text-xs font-medium text-foreground px-2 py-0.5 rounded-md bg-background border border-border">
          {row.country}
        </span>
      ),
    },
    {
      key: "is_active",
      header: "Statut",
      cell: (row) => <StatusBadge status={row.is_active ? "active" : "inactive"} />,
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      cell: (row) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => handleToggleActive(row)}
            className={`p-1.5 rounded-lg transition-colors ${
              row.is_active ? "hover:bg-error/15 text-error" : "hover:bg-success/15 text-success"
            }`}
            title={row.is_active ? "Désactiver" : "Activer"}
          >
            {row.is_active ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Back link & Header */}
      <div>
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-1 text-xs font-medium text-gold hover:text-gold-dark mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Retour à la liste globale
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold font-serif text-navy">{config.title}</h1>
            <p className="text-xs sm:text-sm text-foreground-muted mt-0.5">{config.desc}</p>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-navy text-white text-xs font-semibold hover:bg-navy-hover transition-colors flex items-center gap-2 shadow-sm shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            Ajouter un compte
          </button>
        </div>
      </div>

      {/* Main Table */}
      <DataTable
        data={users}
        columns={columns}
        rowKey="id"
        loading={loading}
        searchPlaceholder="Rechercher dans ce rôle..."
        emptyMessage="Aucun utilisateur trouvé pour ce rôle."
      />

      {/* Modal Créer un compte pour ce rôle précis */}
      <CreateAccountModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        defaultRole={config.adminRole}
        onSuccess={loadRoleUsers}
      />
    </div>
  );
}
