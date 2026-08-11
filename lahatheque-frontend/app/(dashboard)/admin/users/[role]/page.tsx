"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Modal } from "@/components/ui/modal";
import { CreateAccountModal } from "@/components/features/admin/create-account-modal";
import { SendEmailModal } from "@/components/features/admin/send-email-modal";
import { getAdminUsers } from "@/lib/services/admin";
import { AdminUser, AdminRole } from "@/lib/types/admin";
import { Users, UserPlus, Eye, XCircle, CheckCircle, ArrowLeft, Mail, FileText, CheckCheck, Clock } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface RoleConfigItem {
  title: string;
  desc: string;
  adminRole: AdminRole;
  columns: (handleEmail: (u: AdminUser) => void, handleToggle: (u: AdminUser) => void, handleInspect: (u: AdminUser) => void) => DataTableColumn<AdminUser>[];
}

export default function AdminRoleUsersPage() {
  const params = useParams();
  const roleSlug = (params?.role as string) || "clients";

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [emailUser, setEmailUser] = useState<AdminUser | null>(null);
  const [inspectUser, setInspectUser] = useState<AdminUser | null>(null);

  const loadRoleUsers = async () => {
    try {
      setLoading(true);
      // Mapping slug -> role backend
      const roleMap: Record<string, AdminRole> = {
        "layout-artists": "layout_artist",
        maquettistes: "layout_artist",
        "chief-layout": "layout_artist",
        "chef-maquettiste": "layout_artist",
        managers: "admin",
        gestionnaires: "admin",
        legal: "legal_reviewer",
        juristes: "legal_reviewer",
        authors: "author",
        auteurs: "author",
        universities: "partner_api",
        universites: "partner_api",
        publishers: "publisher",
        editeurs: "publisher",
        clients: "student",
        wholesalers: "partner_api",
        grossistes: "partner_api",
      };
      const backendRole = roleMap[roleSlug] || "student";
      const data = await getAdminUsers(backendRole);
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
    toast.success(`Statut du compte ${userItem.email} mis à jour.`);
  };

  // Helper actions communes
  const renderActions = (row: AdminUser) => (
    <div className="flex items-center justify-end gap-1">
      <button
        onClick={() => setEmailUser(row)}
        className="p-1.5 rounded-lg hover:bg-navy-light text-navy transition-colors"
        title="Envoyer un e-mail"
      >
        <Mail className="w-4 h-4" />
      </button>

      <button
        onClick={() => setInspectUser(row)}
        className="p-1.5 rounded-lg hover:bg-background-secondary text-foreground-muted hover:text-foreground transition-colors"
        title="Inspecter la fiche"
      >
        <Eye className="w-4 h-4" />
      </button>

      <button
        onClick={() => handleToggleActive(row)}
        className={`p-1.5 rounded-lg transition-colors ${
          row.is_active ? "hover:bg-error/15 text-error" : "hover:bg-success/15 text-success"
        }`}
        title={row.is_active ? "Rendre inactif" : "Réactiver"}
      >
        {row.is_active ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
      </button>
    </div>
  );

  // Colonnes de base utilisateur
  const userIdentityColumn: DataTableColumn<AdminUser> = {
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
  };

  const statusColumn: DataTableColumn<AdminUser> = {
    key: "is_active",
    header: "Statut",
    cell: (row) => <StatusBadge status={row.is_active ? "active" : "inactive"} />,
  };

  const countryColumn: DataTableColumn<AdminUser> = {
    key: "country",
    header: "Pays",
    cell: (row) => (
      <span className="font-mono text-xs font-medium text-foreground px-2 py-0.5 rounded-md bg-background border border-border">
        {row.country}
      </span>
    ),
  };

  const actionsColumn: DataTableColumn<AdminUser> = {
    key: "actions",
    header: "Actions",
    className: "text-right",
    cell: (row) => renderActions(row),
  };

  // Construction des colonnes en fonction du rôle exact
  const getRoleColumns = (): DataTableColumn<AdminUser>[] => {
    switch (roleSlug) {
      case "layout-artists":
      case "maquettistes":
        return [
          userIdentityColumn,
          {
            key: "deposited",
            header: "Ouvrages Déposés",
            cell: (row) => <span className="font-mono text-xs font-bold text-navy">12 fichiers</span>,
          },
          {
            key: "pending",
            header: "En Attente",
            cell: (row) => <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 font-semibold">2 maquettes</span>,
          },
          {
            key: "recent_activity",
            header: "Activité Récente",
            cell: (row) => <span className="text-xs text-foreground-muted">{row.last_active_at ? new Date(row.last_active_at).toLocaleDateString("fr-FR") : "Aujourd'hui"}</span>,
          },
          countryColumn,
          statusColumn,
          actionsColumn,
        ];

      case "chief-layout":
      case "chef-maquettiste":
        return [
          userIdentityColumn,
          {
            key: "validations",
            header: "Validations Effectuées",
            cell: (row) => <span className="font-mono text-xs font-bold text-emerald-600">48 maquettes</span>,
          },
          {
            key: "pending_val",
            header: "En Attente Validation",
            cell: (row) => <span className="text-xs px-2 py-0.5 rounded-full bg-navy-light text-navy font-semibold">4 en cours</span>,
          },
          {
            key: "avg_delay",
            header: "Délai Moyen",
            cell: (row) => <span className="text-xs font-mono text-foreground">1.8 jours</span>,
          },
          countryColumn,
          statusColumn,
          actionsColumn,
        ];

      case "managers":
      case "gestionnaires":
        return [
          userIdentityColumn,
          {
            key: "zone",
            header: "Zone Rattachement",
            cell: (row) => <span className="text-xs font-semibold text-gold">Zone UEMOA (Cotonou / Abidjan)</span>,
          },
          {
            key: "active_orders",
            header: "Commandes en Cours",
            cell: (row) => <span className="font-mono text-xs font-bold text-navy">15 commandes</span>,
          },
          countryColumn,
          statusColumn,
          actionsColumn,
        ];

      case "legal":
      case "juristes":
        return [
          userIdentityColumn,
          {
            key: "contracts",
            header: "Contrats Gérés",
            cell: (row) => <span className="font-mono text-xs font-bold text-navy">28 contrats d'édition</span>,
          },
          {
            key: "unpaid_reminders",
            header: "Relances Impayés",
            cell: (row) => <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 font-semibold">3 relances</span>,
          },
          countryColumn,
          statusColumn,
          actionsColumn,
        ];

      case "authors":
      case "auteurs":
        return [
          userIdentityColumn,
          {
            key: "books_count",
            header: "Ouvrages",
            cell: (row) => <span className="font-mono text-xs font-bold text-navy">{row.extra_info?.books_count || 2} titres</span>,
          },
          {
            key: "total_sales",
            header: "Ventes Cumulées",
            cell: (row) => <span className="font-mono text-xs font-bold text-foreground">{(row.extra_info?.total_sales_amount || 840000).toLocaleString("fr-FR")} FCFA</span>,
          },
          {
            key: "rights",
            header: "Droits Acquis",
            cell: (row) => <span className="font-mono text-xs font-bold text-emerald-600">{(row.extra_info?.pending_royalties || 168000).toLocaleString("fr-FR")} FCFA</span>,
          },
          {
            key: "last_deposit",
            header: "Statut Dernier Dépôt",
            cell: (row) => <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-semibold">Validé & Publié</span>,
          },
          countryColumn,
          statusColumn,
          actionsColumn,
        ];

      case "universities":
      case "universites":
        return [
          {
            key: "inst_name",
            header: "Établissement & Contact",
            cell: (row) => (
              <div>
                <p className="font-bold text-xs text-navy">{row.extra_info?.institution_name || `${row.first_name} ${row.last_name}`}</p>
                <p className="text-[11px] text-foreground-muted">{row.email}</p>
              </div>
            ),
          },
          {
            key: "bouquets",
            header: "Bouquets Actifs",
            cell: (row) => <span className="text-xs px-2 py-0.5 rounded-full bg-navy-light text-navy font-bold">2 Bouquets B2B</span>,
          },
          {
            key: "royalties_due",
            header: "Redevances Dues",
            cell: (row) => <span className="font-mono text-xs font-bold text-amber-600">1 450 000 FCFA</span>,
          },
          {
            key: "balance",
            header: "Solde Compte",
            cell: (row) => <span className="font-mono text-xs font-bold text-emerald-600">À jour (0 FCFA)</span>,
          },
          countryColumn,
          statusColumn,
          actionsColumn,
        ];

      case "publishers":
      case "editeurs":
        return [
          {
            key: "pub_name",
            header: "Maison d'Édition",
            cell: (row) => (
              <div>
                <p className="font-bold text-xs text-gold">{row.first_name} {row.last_name}</p>
                <p className="text-[11px] text-foreground-muted">{row.email}</p>
              </div>
            ),
          },
          {
            key: "books",
            header: "Ouvrages Déposés",
            cell: (row) => <span className="font-mono text-xs font-bold text-navy">{row.extra_info?.books_count || 42} titres</span>,
          },
          {
            key: "validation_status",
            header: "Validation",
            cell: (row) => <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-semibold">Catalogue Conforme</span>,
          },
          {
            key: "royalties",
            header: "Redevances",
            cell: (row) => <span className="font-mono text-xs font-bold text-foreground">{(row.extra_info?.pending_royalties || 1250000).toLocaleString("fr-FR")} FCFA</span>,
          },
          countryColumn,
          statusColumn,
          actionsColumn,
        ];

      case "clients":
        return [
          userIdentityColumn,
          {
            key: "subscription",
            header: "Abonnement en Cours",
            cell: (row) => <span className="text-xs font-semibold text-navy">{row.extra_info?.subscription_plan || "Pass Annuel Étudiant"}</span>,
          },
          {
            key: "payment_status",
            header: "Statut Paiement",
            cell: (row) => <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-semibold">Payé (Mobile Money)</span>,
          },
          countryColumn,
          statusColumn,
          actionsColumn,
        ];

      case "wholesalers":
      case "grossistes":
        return [
          userIdentityColumn,
          {
            key: "volume",
            header: "Volume Commandes",
            cell: (row) => <span className="font-mono text-xs font-bold text-navy">1 200 ex. papier</span>,
          },
          {
            key: "last_order",
            header: "Statut Dernière Commande",
            cell: (row) => <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 font-semibold">Expédiée / Livrée</span>,
          },
          countryColumn,
          statusColumn,
          actionsColumn,
        ];

      default:
        return [userIdentityColumn, countryColumn, statusColumn, actionsColumn];
    }
  };

  const getRoleTitle = () => {
    const titles: Record<string, string> = {
      "layout-artists": "Gérer les Maquettistes",
      maquettistes: "Gérer les Maquettistes",
      "chief-layout": "Gérer le Chef Maquettiste",
      "chef-maquettiste": "Gérer le Chef Maquettiste",
      managers: "Gérer les Gestionnaires",
      gestionnaires: "Gérer les Gestionnaires",
      legal: "Gérer les Juristes & Relecteurs",
      juristes: "Gérer les Juristes & Relecteurs",
      authors: "Gérer les Auteurs",
      auteurs: "Gérer les Auteurs",
      universities: "Gérer les Universités",
      universites: "Gérer les Universités",
      publishers: "Gérer les Éditeurs tiers",
      editeurs: "Gérer les Éditeurs tiers",
      clients: "Gérer les Clients & Lecteurs",
      wholesalers: "Gérer les Grossistes & Distributeurs",
      grossistes: "Gérer les Grossistes & Distributeurs",
    };
    return titles[roleSlug] || "Gestion Rôle Utilisateurs";
  };

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
            <h1 className="text-xl sm:text-2xl font-bold font-serif text-navy">{getRoleTitle()}</h1>
            <p className="text-xs sm:text-sm text-foreground-muted mt-0.5">
              Gestion spécifique et indicateurs d'activité du rôle {roleSlug}.
            </p>
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
        columns={getRoleColumns()}
        rowKey="id"
        loading={loading}
        searchPlaceholder="Rechercher dans ce rôle..."
        emptyMessage="Aucun utilisateur trouvé pour ce rôle."
      />

      {/* Modal Créer un compte pour ce rôle précis */}
      <CreateAccountModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        defaultRole={roleSlug as any}
        onSuccess={loadRoleUsers}
      />

      {/* Modal d'envoi d'e-mail */}
      {emailUser && (
        <SendEmailModal
          isOpen={!!emailUser}
          onClose={() => setEmailUser(null)}
          recipientEmail={emailUser.email}
          recipientName={`${emailUser.first_name} ${emailUser.last_name}`}
        />
      )}

      {/* Modal d'inspection de fiche profil */}
      {inspectUser && (
        <Modal
          open={!!inspectUser}
          onClose={() => setInspectUser(null)}
          title="Fiche Utilisateur Administrateur"
        >
          <div className="p-6 max-w-md mx-auto space-y-4 bg-background text-foreground">
            <div className="flex items-center gap-3 pb-4 border-b border-border">
              <div className="w-12 h-12 rounded-full bg-navy text-white font-bold text-base flex items-center justify-center border-2 border-gold shrink-0">
                {inspectUser.first_name[0]}
              </div>
              <div>
                <h3 className="font-bold text-sm text-navy">{inspectUser.first_name} {inspectUser.last_name}</h3>
                <p className="text-xs text-foreground-muted">{inspectUser.email}</p>
                <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-navy-light text-navy font-bold uppercase">
                  {inspectUser.role}
                </span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-border">
                <span className="text-foreground-muted">Téléphone :</span>
                <span className="font-mono text-foreground font-semibold">{inspectUser.phone || "Non renseigné"}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border">
                <span className="text-foreground-muted">Pays de résidence :</span>
                <span className="font-mono text-foreground font-semibold">{inspectUser.country}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border">
                <span className="text-foreground-muted">Date d'inscription :</span>
                <span className="text-foreground font-semibold">{inspectUser.date_joined}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-border">
                <span className="text-foreground-muted">Dernière activité :</span>
                <span className="text-foreground font-semibold">
                  {inspectUser.last_active_at ? new Date(inspectUser.last_active_at).toLocaleString("fr-FR") : "Récente"}
                </span>
              </div>
            </div>

            <div className="pt-3 flex justify-end gap-2">
              <button
                onClick={() => {
                  const u = inspectUser;
                  setInspectUser(null);
                  setEmailUser(u);
                }}
                className="px-3.5 py-2 rounded-xl bg-navy-light text-navy font-semibold text-xs hover:bg-navy/20 transition-colors flex items-center gap-1.5"
              >
                <Mail className="w-3.5 h-3.5" /> Envoyer un mail
              </button>
              <button
                onClick={() => setInspectUser(null)}
                className="px-4 py-2 rounded-xl bg-navy text-white font-semibold text-xs hover:bg-navy-hover transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
