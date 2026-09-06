"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  ProfessionalContact,
  ContactCategory,
  ContactsKpis,
} from "@/lib/types/contacts";
import {
  getContacts,
  deleteContact,
  batchDeleteContacts,
  exportContactsCsv,
} from "@/lib/services/contacts";
import { withDemoFallback } from "@/lib/utils/with-demo-fallback";
import { DemoDataBanner } from "@/components/ui/demo-data-banner";
import { mockContactsResponse } from "@/lib/mock/contacts";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { AddEditContactModal } from "./add-edit-contact-modal";
import { ImportContactsModal } from "./import-contacts-modal";
import { SendContactEmailModal } from "./send-contact-email-modal";
import {
  Users,
  Plus,
  Upload,
  Download,
  Mail,
  Edit2,
  Trash2,
  Building2,
  GraduationCap,
  BookOpen,
  Send,
  CheckSquare,
  Square,
  PackageCheck,
  ShieldCheck,
} from "lucide-react";

interface ContactsManagerProps {
  userRole?: "admin" | "legal_reviewer";
  title?: string;
}

const CATEGORY_LABELS: Record<ContactCategory, string> = {
  university: "Université / Académie",
  author: "Auteur / Écrivain",
  publisher: "Éditeur Tiers / Partenaire",
  wholesaler: "Grossiste / Librairie",
  teacher: "Enseignant",
  institution: "Ministère / Institution",
  partner: "Partenaire B2B",
  press: "Presse & Média",
  other: "Autre contact",
};

export function ContactsManager({
  userRole = "admin",
  title = "Nos Contacts",
}: ContactsManagerProps) {
  const [contacts, setContacts] = useState<ProfessionalContact[]>([]);
  const [kpis, setKpis] = useState<ContactsKpis>({
    total_contacts: 0,
    university_count: 0,
    authors_publishers_count: 0,
    total_emails_sent: 0,
  });
  const [isDemoData, setIsDemoData] = useState(false);
  const [loading, setLoading] = useState(true);

  // Filtre source (Tous / Inscrits plateforme / Externes)
  const [sourceFilter, setSourceFilter] = useState<"all" | "platform" | "external">("all");

  // Sélection multiple
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modales
  const [addEditModalOpen, setAddEditModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<ProfessionalContact | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [sendEmailModalOpen, setSendEmailModalOpen] = useState(false);
  const [emailTargetContacts, setEmailTargetContacts] = useState<ProfessionalContact[]>([]);

  // Feedback notifications
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const loadContactsData = async () => {
    setLoading(true);
    try {
      const result = await withDemoFallback(
        () => getContacts(),
        mockContactsResponse
      );
      setContacts(result.data.contacts);
      setKpis(result.data.kpis);
      setIsDemoData(result.isDemoData);
    } catch (err) {
      console.error("Erreur chargement contacts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContactsData();
  }, []);

  const showNotification = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => {
      setActionNotice(null);
    }, 4500);
  };

  // Filtrage selon la source (Tous, Inscrits plateforme, Externes)
  const displayedContacts = useMemo(() => {
    if (sourceFilter === "platform") {
      return contacts.filter((c) => c.is_platform_user);
    }
    if (sourceFilter === "external") {
      return contacts.filter((c) => !c.is_platform_user);
    }
    return contacts;
  }, [contacts, sourceFilter]);

  // Gestion de la sélection multiple
  const isAllSelected =
    displayedContacts.length > 0 &&
    displayedContacts.every((c) => selectedIds.includes(c.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(displayedContacts.map((c) => c.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Actions unitaires
  const handleEditClick = (contact: ProfessionalContact) => {
    setEditingContact(contact);
    setAddEditModalOpen(true);
  };

  const handleAddNewClick = () => {
    setEditingContact(null);
    setAddEditModalOpen(true);
  };

  const handleDeleteSingle = async (contact: ProfessionalContact) => {
    const fullName = `${contact.first_name} ${contact.last_name}`.trim();
    if (!window.confirm(`Confirmez-vous la suppression du contact "${fullName}" de l'annuaire ?`)) {
      return;
    }
    try {
      await deleteContact(contact.id);
      setContacts((prev) => prev.filter((c) => c.id !== contact.id));
      setSelectedIds((prev) => prev.filter((id) => id !== contact.id));
      showNotification(`Le contact ${fullName} a été retiré.`);
    } catch (err: any) {
      alert(err.message || "Erreur lors de la suppression.");
    }
  };

  // Action suppression groupée
  const handleBatchDelete = async () => {
    if (!selectedIds.length) return;
    if (
      !window.confirm(
        `Confirmez-vous la suppression des ${selectedIds.length} contact(s) sélectionné(s) ?`
      )
    ) {
      return;
    }
    try {
      await batchDeleteContacts(selectedIds);
      setContacts((prev) => prev.filter((c) => !selectedIds.includes(c.id)));
      showNotification(`${selectedIds.length} contact(s) supprimé(s) avec succès.`);
      setSelectedIds([]);
    } catch (err: any) {
      alert(err.message || "Erreur lors de la suppression groupée.");
    }
  };

  // Envoi d'email pour la sélection
  const handleSendEmailSelected = () => {
    const targets = contacts.filter((c) => selectedIds.includes(c.id));
    if (!targets.length) return;
    setEmailTargetContacts(targets);
    setSendEmailModalOpen(true);
  };

  // Envoi d'email unitaire
  const handleSendEmailSingle = (contact: ProfessionalContact) => {
    setEmailTargetContacts([contact]);
    setSendEmailModalOpen(true);
  };

  // Export CSV
  const handleExport = async () => {
    try {
      await exportContactsCsv({
        ids: selectedIds.length ? selectedIds : undefined,
      });
      showNotification("Export CSV téléchargé avec succès.");
    } catch (err: any) {
      alert(err.message || "Impossible de générer l'export CSV.");
    }
  };

  const getCategoryBadgeClass = (category: ContactCategory) => {
    switch (category) {
      case "university":
        return "bg-navy/10 text-navy border-navy/20";
      case "author":
        return "bg-gold/15 text-gold border-gold/30";
      case "publisher":
        return "bg-navy-light/10 text-navy dark:text-gold border-border";
      case "wholesaler":
        return "bg-navy/5 text-navy border-navy/15";
      case "teacher":
        return "bg-gold/10 text-gold border-gold/20";
      case "institution":
      case "partner":
        return "bg-background-secondary text-foreground border-border";
      default:
        return "bg-background-secondary text-foreground-muted border-border";
    }
  };

  // Colonnes DataTable
  const columns: DataTableColumn<ProfessionalContact>[] = [
    {
      key: "selection",
      header: "",
      className: "w-10 text-center",
      cell: (contact) => {
        const isSelected = selectedIds.includes(contact.id);
        return (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleSelectRow(contact.id);
            }}
            className="text-foreground-muted hover:text-navy p-1 transition-colors"
            title={isSelected ? "Désélectionner" : "Sélectionner"}
          >
            {isSelected ? (
              <CheckSquare className="size-4 text-navy" />
            ) : (
              <Square className="size-4" />
            )}
          </button>
        );
      },
    },
    {
      key: "full_name",
      header: "Contact",
      cell: (contact) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-navy dark:text-white text-sm">
              {contact.first_name} {contact.last_name}
            </span>
            {contact.is_platform_user ? (
              <span
                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold text-gold bg-gold/10 border border-gold/20"
                title="Compte utilisateur enregistré en base de données sur LAHAThèque"
              >
                <ShieldCheck className="size-3 text-gold" />
                <span>Inscrit</span>
              </span>
            ) : (
              <span
                className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium text-foreground-muted bg-background-secondary border border-border"
                title="Contact issu du carnet d'adresses externe ou importé"
              >
                Externe
              </span>
            )}
          </div>
          <div className="text-foreground-muted flex items-center gap-1.5 text-xs">
            <Mail className="size-3 text-gold shrink-0" />
            <a
              href={`mailto:${contact.email}`}
              onClick={(e) => e.stopPropagation()}
              className="hover:text-navy hover:underline truncate max-w-xs"
            >
              {contact.email}
            </a>
            {contact.phone && (
              <>
                <span className="text-border">•</span>
                <span className="text-foreground-muted">{contact.phone}</span>
              </>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "organization",
      header: "Organisation & Fonction",
      cell: (contact) => (
        <div className="space-y-0.5">
          {contact.organization ? (
            <div className="font-medium text-foreground text-xs flex items-center gap-1.5">
              <Building2 className="size-3 text-gold shrink-0" />
              <span className="truncate">{contact.organization}</span>
            </div>
          ) : (
            <span className="text-foreground-muted italic text-xs">Non renseigné</span>
          )}
          {contact.role_or_title && (
            <div className="text-foreground-muted text-[11px]">
              {contact.role_or_title}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "category",
      header: "Catégorie",
      cell: (contact) => (
        <span
          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold border ${getCategoryBadgeClass(
            contact.category
          )}`}
        >
          {CATEGORY_LABELS[contact.category] || contact.category_display || contact.category}
        </span>
      ),
    },
    {
      key: "last_contacted_at",
      header: "Dernier Contact",
      cell: (contact) => (
        <div className="space-y-0.5">
          <div className="text-foreground text-xs">
            {contact.last_contacted_at
              ? new Date(contact.last_contacted_at).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : "Jamais contacté"}
          </div>
          <div className="text-foreground-muted text-[11px]">
            {contact.emails_sent_count} e-mail{contact.emails_sent_count > 1 ? "s" : ""} envoyé{contact.emails_sent_count > 1 ? "s" : ""}
          </div>
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      cell: (contact) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleSendEmailSingle(contact);
            }}
            className="p-1.5 rounded-lg text-foreground-muted hover:text-navy hover:bg-background-secondary transition-colors"
            title="Envoyer un e-mail officiel"
            aria-label={`Envoyer un e-mail à ${contact.first_name} ${contact.last_name}`}
          >
            <Mail className="size-4 text-gold" />
          </button>

          {!contact.is_platform_user && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleEditClick(contact);
              }}
              className="p-1.5 rounded-lg text-foreground-muted hover:text-navy hover:bg-background-secondary transition-colors"
              title="Modifier les coordonnées"
              aria-label={`Modifier le contact ${contact.first_name} ${contact.last_name}`}
            >
              <Edit2 className="size-4" />
            </button>
          )}

          {!contact.is_platform_user ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteSingle(contact);
              }}
              className="p-1.5 rounded-lg text-foreground-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              title="Supprimer le contact du carnet"
              aria-label={`Supprimer le contact ${contact.first_name} ${contact.last_name}`}
            >
              <Trash2 className="size-4" />
            </button>
          ) : (
            <span
              className="p-1.5 text-foreground-muted opacity-40 cursor-default"
              title="Compte plateforme géré via Gestion Utilisateurs"
            >
              <ShieldCheck className="size-4" />
            </span>
          )}
        </div>
      ),
    },
  ];

  // Rendu mobile adapté (sous 1024px et sous 400px)
  const renderMobileCard = (contact: ProfessionalContact) => {
    const isSelected = selectedIds.includes(contact.id);
    return (
      <div
        className={`p-4 space-y-3 transition-colors ${
          isSelected ? "bg-navy/5 dark:bg-navy-light/5" : ""
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5 min-w-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleSelectRow(contact.id);
              }}
              className="mt-0.5 text-foreground-muted hover:text-navy shrink-0 p-1"
              aria-label="Sélectionner la ligne"
            >
              {isSelected ? (
                <CheckSquare className="size-4 text-navy" />
              ) : (
                <Square className="size-4" />
              )}
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h4 className="font-semibold text-navy dark:text-white text-sm truncate">
                  {contact.first_name} {contact.last_name}
                </h4>
                {contact.is_platform_user ? (
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold text-gold bg-gold/10 border border-gold/20">
                    Inscrit
                  </span>
                ) : (
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-medium text-foreground-muted bg-background-secondary border border-border">
                    Externe
                  </span>
                )}
              </div>
              <a
                href={`mailto:${contact.email}`}
                onClick={(e) => e.stopPropagation()}
                className="text-xs text-foreground-muted hover:text-navy block truncate mt-0.5"
              >
                {contact.email}
              </a>
            </div>
          </div>

          <span
            className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getCategoryBadgeClass(
              contact.category
            )}`}
          >
            {CATEGORY_LABELS[contact.category] || contact.category_display || contact.category}
          </span>
        </div>

        {(contact.organization || contact.role_or_title) && (
          <div className="text-xs text-foreground bg-background-secondary/50 p-2.5 rounded-xl space-y-0.5">
            {contact.organization && (
              <div className="font-medium flex items-center gap-1.5">
                <Building2 className="size-3 text-gold shrink-0" />
                <span className="truncate">{contact.organization}</span>
              </div>
            )}
            {contact.role_or_title && (
              <div className="text-foreground-muted text-[11px]">
                {contact.role_or_title}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-1 text-xs border-t border-border/40">
          <div className="text-[11px] text-foreground-muted">
            {contact.emails_sent_count} e-mail(s) •{" "}
            {contact.last_contacted_at
              ? new Date(contact.last_contacted_at).toLocaleDateString("fr-FR")
              : "Jamais"}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleSendEmailSingle(contact);
              }}
              className="px-2.5 py-1.5 text-xs font-semibold text-navy bg-background border border-border rounded-lg flex items-center gap-1"
            >
              <Mail className="size-3 text-gold" />
              <span>Écrire</span>
            </button>

            {!contact.is_platform_user && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditClick(contact);
                  }}
                  className="p-1.5 rounded-lg text-foreground-muted hover:text-navy"
                  title="Modifier"
                >
                  <Edit2 className="size-3.5" />
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteSingle(contact);
                  }}
                  className="p-1.5 rounded-lg text-foreground-muted hover:text-red-600"
                  title="Supprimer"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. En-tête principal & actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-navy/10 dark:bg-navy-light/10 text-navy flex items-center justify-center">
              <Users className="size-5" />
            </div>
            <h1 className="font-serif text-2xl font-bold text-navy dark:text-white">
              {title}
            </h1>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-foreground-muted">
            Carnet d'adresses institutionnel unifié, correspondants enregistrés et expédition d'e-mails officiels.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-navy bg-background border border-border hover:bg-background-secondary rounded-xl transition-all shadow-sm"
            title="Exporter en fichier CSV compatible Microsoft Excel"
          >
            <Download className="size-4 text-foreground-muted" />
            <span>Exporter</span>
          </button>

          <button
            type="button"
            onClick={() => setImportModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-navy bg-background border border-border hover:bg-background-secondary rounded-xl transition-all shadow-sm"
            title="Importer des contacts depuis un fichier CSV ou Excel (.xlsx / .xls)"
          >
            <Upload className="size-4 text-foreground-muted" />
            <span>Importer</span>
          </button>

          <button
            type="button"
            onClick={handleAddNewClick}
            className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-navy hover:bg-navy-hover rounded-xl transition-all shadow-sm focus:ring-2 focus:ring-navy focus:outline-none"
          >
            <Plus className="size-4 text-gold" />
            <span>Nouveau Contact</span>
          </button>
        </div>
      </div>

      {/* 2. Notification de confirmation / toast inline */}
      {actionNotice && (
        <div className="p-3.5 rounded-xl bg-navy text-white text-xs sm:text-sm font-medium flex items-center justify-between gap-3 shadow-md animate-in fade-in">
          <span>{actionNotice}</span>
          <button
            type="button"
            onClick={() => setActionNotice(null)}
            className="text-white/70 hover:text-white"
          >
            Fermer
          </button>
        </div>
      )}

      {/* 3. Cartes KPIs synthétiques */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl border border-border bg-background shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">
              Total Contacts
            </span>
            <Users className="size-4 text-navy dark:text-gold" />
          </div>
          <div className="text-2xl font-serif font-bold text-navy dark:text-white">
            {kpis.total_contacts}
          </div>
          <span className="text-[11px] text-foreground-muted block">
            Annuaire consolidé
          </span>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-background shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">
              Universités
            </span>
            <GraduationCap className="size-4 text-navy dark:text-gold" />
          </div>
          <div className="text-2xl font-serif font-bold text-navy dark:text-white">
            {kpis.university_count}
          </div>
          <span className="text-[11px] text-foreground-muted block">
            Académies & doyens
          </span>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-background shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">
              Auteurs & Éditeurs
            </span>
            <BookOpen className="size-4 text-navy dark:text-gold" />
          </div>
          <div className="text-2xl font-serif font-bold text-navy dark:text-white">
            {kpis.authors_publishers_count}
          </div>
          <span className="text-[11px] text-foreground-muted block">
            Partenaires éditoriaux
          </span>
        </div>

        <div className="p-4 rounded-2xl border border-border bg-background shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">
              E-mails Envoyés
            </span>
            <Send className="size-4 text-navy dark:text-gold" />
          </div>
          <div className="text-2xl font-serif font-bold text-navy dark:text-white">
            {kpis.total_emails_sent}
          </div>
          <span className="text-[11px] text-foreground-muted block">
            Communications tracées
          </span>
        </div>
      </div>

      {/* 4. Repli Démonstration */}
      {isDemoData && (
        <DemoDataBanner message="Affichage des contacts de démonstration. Le serveur backend n'est pas encore joint ou aucune donnée réelle n'est présente." />
      )}

      {/* 5. Barre d'actions groupées si éléments sélectionnés */}
      {selectedIds.length > 0 && (
        <div className="p-3 rounded-2xl bg-navy/5 dark:bg-navy-light/10 border border-navy/20 flex flex-wrap items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-bold text-navy dark:text-white">
              {selectedIds.length} contact{selectedIds.length > 1 ? "s" : ""} sélectionné{selectedIds.length > 1 ? "s" : ""}
            </span>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="text-xs text-foreground-muted hover:text-navy underline"
            >
              Tout désélectionner
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSendEmailSelected}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-navy hover:bg-navy-hover rounded-xl transition-colors shadow-sm"
            >
              <Mail className="size-3.5 text-gold" />
              <span>Envoyer un e-mail groupé</span>
            </button>

            <button
              type="button"
              onClick={handleBatchDelete}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 rounded-xl transition-colors"
            >
              <Trash2 className="size-3.5" />
              <span>Supprimer la sélection</span>
            </button>
          </div>
        </div>
      )}

      {/* 6. Filtre de Source (Onglets sobres) */}
      <div className="flex items-center gap-2 text-xs">
        <span className="text-foreground-muted font-medium">Provenance :</span>
        <button
          type="button"
          onClick={() => setSourceFilter("all")}
          className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
            sourceFilter === "all"
              ? "bg-navy text-white shadow-sm font-bold"
              : "bg-background border border-border text-foreground hover:bg-background-secondary"
          }`}
        >
          Tous ({contacts.length})
        </button>
        <button
          type="button"
          onClick={() => setSourceFilter("platform")}
          className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
            sourceFilter === "platform"
              ? "bg-navy text-white shadow-sm font-bold"
              : "bg-background border border-border text-foreground hover:bg-background-secondary"
          }`}
        >
          Inscrits Plateforme ({contacts.filter((c) => c.is_platform_user).length})
        </button>
        <button
          type="button"
          onClick={() => setSourceFilter("external")}
          className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
            sourceFilter === "external"
              ? "bg-navy text-white shadow-sm font-bold"
              : "bg-background border border-border text-foreground hover:bg-background-secondary"
          }`}
        >
          Contacts Externes ({contacts.filter((c) => !c.is_platform_user).length})
        </button>
      </div>

      {/* 7. DataTable Officielle avec Pagination, Recherche et Mode Mobile */}
      <DataTable<ProfessionalContact>
        data={displayedContacts}
        columns={columns}
        rowKey="id"
        searchable={true}
        searchPlaceholder="Rechercher par nom, prénom, email, organisation..."
        filterKey="category"
        filterPlaceholder="Toutes les catégories"
        filterOptions={[
          { value: "university", label: "Universités / Académies" },
          { value: "author", label: "Auteurs / Écrivains" },
          { value: "publisher", label: "Éditeurs Tiers" },
          { value: "wholesaler", label: "Grossistes / Librairies" },
          { value: "teacher", label: "Enseignants" },
          { value: "institution", label: "Institutions Publiques" },
          { value: "partner", label: "Partenaires B2B" },
          { value: "press", label: "Presse & Média" },
          { value: "other", label: "Autres" },
        ]}
        mobileCard={renderMobileCard}
        loading={loading}
        skeletonRows={5}
        pageSize={10}
        pageSizeOptions={[10, 20, 50]}
        headerActions={
          <button
            type="button"
            onClick={toggleSelectAll}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-navy bg-background border border-border hover:bg-background-secondary rounded-xl transition-colors"
            title={isAllSelected ? "Tout désélectionner" : "Tout sélectionner"}
          >
            {isAllSelected ? (
              <CheckSquare className="size-4 text-navy" />
            ) : (
              <Square className="size-4 text-foreground-muted" />
            )}
            <span className="hidden sm:inline">
              {isAllSelected ? "Tout désélectionner" : "Tout sélectionner"}
            </span>
          </button>
        }
      />

      {/* 8. Modales interactives conservées */}
      <AddEditContactModal
        open={addEditModalOpen}
        onClose={() => setAddEditModalOpen(false)}
        contact={editingContact}
        onSave={(saved) => {
          setContacts((prev) => {
            const idx = prev.findIndex((c) => c.id === saved.id);
            if (idx >= 0) {
              const updated = [...prev];
              updated[idx] = saved;
              return updated;
            }
            return [saved, ...prev];
          });
          showNotification(
            editingContact
              ? `Contact ${saved.first_name} ${saved.last_name} mis à jour.`
              : `Nouveau contact ${saved.first_name} ${saved.last_name} ajouté.`
          );
        }}
      />

      <ImportContactsModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImportSuccess={(res) => {
          showNotification(
            `Importation terminée : ${res.imported_count} contact(s) ajouté(s).`
          );
          loadContactsData();
        }}
      />

      <SendContactEmailModal
        open={sendEmailModalOpen}
        onClose={() => setSendEmailModalOpen(false)}
        contacts={emailTargetContacts}
        onSentSuccess={(sentCount) => {
          showNotification(`${sentCount} e-mail(s) officiel(s) expédié(s) avec succès.`);
          loadContactsData();
          setSelectedIds([]);
        }}
      />
    </div>
  );
}

export default ContactsManager;
