"use client";

import React, { useEffect, useState } from "react";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Modal } from "@/components/ui/modal";
import { CreateAccountModal } from "@/components/features/admin/create-account-modal";
import { SendEmailModal } from "@/components/features/admin/send-email-modal";
import { getAdminUsers, toggleAdminUserStatus } from "@/lib/services/admin";
import { AdminUser, AdminRole } from "@/lib/types/admin";
import {
  Users,
  UserPlus,
  Mail,
  Shield,
  Search,
  CheckCircle,
  XCircle,
  MoreVertical,
  Eye,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

export default function AdminUsersGlobalPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [inspectUser, setInspectUser] = useState<AdminUser | null>(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<AdminUser | null>(null);
  const [emailUser, setEmailUser] = useState<AdminUser | null>(null);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await getAdminUsers();
      setUsers(data);
    } catch (err) {
      toast.error("Erreur lors de la récupération des utilisateurs.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleToggleActive = async (userItem: AdminUser) => {
    const newActiveState = !userItem.is_active;
    setUsers((prev) =>
      prev.map((u) => (u.id === userItem.id ? { ...u, is_active: newActiveState } : u))
    );
    try {
      await toggleAdminUserStatus(userItem.id);
      toast.success(
        `Compte ${userItem.email} ${newActiveState ? "réactivé" : "suspendu"} avec succès.`
      );
    } catch {
      toast.error("Erreur lors de la modification du statut.");
    }
  };

  const handleDeleteUser = () => {
    if (!deleteConfirmUser) return;
    setUsers((prev) => prev.filter((u) => u.id !== deleteConfirmUser.id));
    toast.success(`Le compte de ${deleteConfirmUser.first_name} ${deleteConfirmUser.last_name} a été supprimé définitivement.`);
    setDeleteConfirmUser(null);
  };

  const roleFilterOptions = [
    { value: "all", label: "Tous les Rôles" },
    { value: "student", label: "Étudiants / Lecteurs" },
    { value: "teacher", label: "Enseignants" },
    { value: "author", label: "Auteurs" },
    { value: "publisher", label: "Éditeurs Tiers" },
    { value: "university", label: "Universités Partenaires" },
    { value: "layout_artist", label: "Maquettistes" },
    { value: "legal_reviewer", label: "Juristes" },
    { value: "partner_api", label: "Partenaires API / Univ." },
    { value: "admin", label: "Administrateurs" },
  ];

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
      key: "role",
      header: "Rôle Principal",
      cell: (row) => (
        <span className="text-xs px-2.5 py-0.5 rounded-full bg-navy-light text-navy font-semibold capitalize">
          {row.role}
        </span>
      ),
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
      cell: (row) => (
        <StatusBadge status={row.is_active ? "active" : "inactive"} />
      ),
    },
    {
      key: "date_joined",
      header: "Date de création",
      cell: (row) => (
        <span className="text-xs text-foreground-muted font-mono">{row.date_joined}</span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      cell: (row) => (
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
            title="Inspecter le profil"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleToggleActive(row)}
            className={`p-1.5 rounded-lg transition-colors ${
              row.is_active
                ? "hover:bg-error/15 text-error"
                : "hover:bg-success/15 text-success"
            }`}
            title={row.is_active ? "Désactiver le compte" : "Activer le compte"}
          >
            {row.is_active ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setDeleteConfirmUser(row)}
            className="p-1.5 rounded-lg hover:bg-error/15 text-error transition-colors"
            title="Supprimer le compte"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-navy">
            Gestion Globale des Utilisateurs
          </h1>
          <p className="text-xs sm:text-sm text-foreground-muted mt-0.5">
            Superviser et administrer l'ensemble des comptes (étudiants, auteurs, éditeurs, universités, juristes).
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-navy text-white text-xs font-semibold hover:bg-navy-hover transition-colors flex items-center gap-2 shadow-sm shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          Créer un nouveau compte
        </button>
      </div>

      {/* Main Table */}
      <DataTable
        data={users}
        columns={columns}
        rowKey="id"
        loading={loading}
        filterKey="role"
        filterOptions={roleFilterOptions}
        filterPlaceholder="Filtrer par rôle..."
        searchPlaceholder="Rechercher par nom ou e-mail..."
      />

      {/* Modal Créer un compte */}
      <CreateAccountModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={loadUsers}
      />

      {/* Modal Inspecter un utilisateur */}
      {inspectUser && (
        <Modal open={!!inspectUser} onClose={() => setInspectUser(null)} title="Profil Utilisateur">
          <div className="p-6 max-w-md mx-auto space-y-4 bg-background text-foreground">
            <div className="flex items-center gap-3 pb-3 border-b border-border">
              <div className="w-10 h-10 rounded-full bg-navy text-gold font-bold text-sm flex items-center justify-center">
                {inspectUser.first_name[0]}
              </div>
              <div>
                <h3 className="font-bold text-sm text-foreground">
                  {inspectUser.first_name} {inspectUser.last_name}
                </h3>
                <p className="text-xs text-foreground-muted">{inspectUser.email}</p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-border">
                <span className="text-foreground-muted">Identifiant :</span>
                <span className="font-mono font-medium">{inspectUser.id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border">
                <span className="text-foreground-muted">Rôle principal :</span>
                <span className="font-semibold text-navy">{inspectUser.role}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border">
                <span className="text-foreground-muted">Pays :</span>
                <span className="font-mono font-semibold">{inspectUser.country}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border">
                <span className="text-foreground-muted">Téléphone :</span>
                <span>{inspectUser.phone || "Non renseigné"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border">
                <span className="text-foreground-muted">Date d'inscription :</span>
                <span className="font-mono">{inspectUser.date_joined}</span>
              </div>
              {inspectUser.extra_info?.institution_name && (
                <div className="flex justify-between py-1 border-b border-border">
                  <span className="text-foreground-muted">Institution :</span>
                  <span className="font-medium text-gold">{inspectUser.extra_info.institution_name}</span>
                </div>
              )}
            </div>

            <div className="pt-3 flex justify-end">
              <button
                onClick={() => setInspectUser(null)}
                className="px-4 py-2 rounded-xl bg-navy text-white text-xs font-semibold"
              >
                Fermer
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Confirmation de Suppression */}
      {deleteConfirmUser && (
        <Modal open={!!deleteConfirmUser} onClose={() => setDeleteConfirmUser(null)} title="Confirmation de Suppression">
          <div className="p-6 max-w-sm mx-auto space-y-4 bg-background text-foreground text-center">
            <div className="w-12 h-12 rounded-full bg-error/15 text-error mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-foreground">Confirmer la Suppression</h3>
              <p className="text-xs text-foreground-muted mt-1">
                Êtes-vous sûr de vouloir supprimer définitivement le compte de{" "}
                <span className="font-semibold text-foreground">
                  {deleteConfirmUser.first_name} {deleteConfirmUser.last_name}
                </span>{" "}
                ({deleteConfirmUser.email}) ? Cette action est irréversible.
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmUser(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-foreground-muted hover:bg-background-secondary"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteUser}
                className="px-4 py-2 rounded-xl bg-error text-white font-bold text-xs hover:bg-error/90 transition-colors"
              >
                Supprimer Définitivement
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal d'envoi d'e-mail */}
      {emailUser && (
        <SendEmailModal
          isOpen={!!emailUser}
          onClose={() => setEmailUser(null)}
          recipientEmail={emailUser.email}
          recipientName={`${emailUser.first_name} ${emailUser.last_name}`}
        />
      )}
    </div>
  );
}
