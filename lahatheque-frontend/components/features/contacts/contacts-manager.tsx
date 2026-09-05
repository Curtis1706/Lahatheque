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
import { AddEditContactModal } from "./add-edit-contact-modal";
import { ImportContactsModal } from "./import-contacts-modal";
import { SendContactEmailModal } from "./send-contact-email-modal";
import {
  Users,
  Plus,
  Upload,
  Download,
  Search,
  Filter,
  Mail,
  Edit2,
  Trash2,
  Building2,
  GraduationCap,
  BookOpen,
  Send,
  Loader2,
  CheckSquare,
  Square,
  Phone,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";

interface ContactsManagerProps {
  userRole?: "admin" | "legal_reviewer";
  title?: string;
}

const CATEGORY_FILTERS: { value: string; label: string }[] = [
  { value: "all", label: "Toutes les catégories" },
  { value: "university", label: "Universités / Académies" },
  { value: "author", label: "Auteurs / Écrivains" },
  { value: "publisher", label: "Éditeurs Tiers" },
  { value: "institution", label: "Institutions Publiques" },
  { value: "partner", label: "Partenaires B2B" },
  { value: "press", label: "Presse & Média" },
  { value: "other", label: "Autres" },
];

export function ContactsManager({
  userRole = "admin",
  title = "Mes Contacts",
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

  // Filtres et recherche
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

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
        () => getContacts({ q: search, category: selectedCategory }),
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
  }, [selectedCategory]);

  const showNotification = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => {
      setActionNotice(null);
    }, 4500);
  };

  // Filtrage local immédiat sur le prénom, nom, email, organisation
  const filteredContacts = useMemo(() => {
    if (!search.trim()) return contacts;
    const q = search.toLowerCase();
    return contacts.filter((c) =>
      `${c.first_name} ${c.last_name} ${c.email} ${c.organization} ${c.role_or_title}`
        .toLowerCase()
        .includes(q)
    );
  }, [contacts, search]);

  // Gestion de la sélection multiple
  const isAllSelected =
    filteredContacts.length > 0 &&
    filteredContacts.every((c) => selectedIds.includes(c.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredContacts.map((c) => c.id));
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
    if (!window.confirm(`Confirmez-vous la suppression du contact "${fullName}" ?`)) {
      return;
    }
    try {
      await deleteContact(contact.id);
      setContacts((prev) => prev.filter((c) => c.id !== contact.id));
      setSelectedIds((prev) => prev.filter((id) => id !== contact.id));
      showNotification(`Le contact ${fullName} a été supprimé.`);
    } catch (err: any) {
      alert(err.message || "Erreur lors de la suppression.");
    }
  };

  // Action suppression groupée
  const handleBatchDelete = async () => {
    if (!selectedIds.length) return;
    if (
      !window.confirm(
        `Confirmez-vous la suppression définitive des ${selectedIds.length} contact(s) sélectionné(s) ?`
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
        q: search,
        category: selectedCategory,
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
        return "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200";
      case "institution":
        return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200";
      case "partner":
        return "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200";
      case "press":
        return "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200";
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-border";
    }
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
            Carnet d'adresses institutionnel, relations universitaires et expédition d'e-mails officiels.
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
            Annuaire centralisé
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

      {/* 4. Repli Démonstration (Correction 1) */}
      {isDemoData && (
        <DemoDataBanner message="Affichage des contacts de démonstration. Le serveur backend n'est pas encore joint ou aucune donnée réelle n'est présente." />
      )}

      {/* 5. Barre de recherche et sélection de catégorie */}
      <div className="p-3 sm:p-4 rounded-2xl border border-border bg-background shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Champ recherche */}
          <div className="relative flex-1">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom, prénom, email, organisation..."
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-border bg-background focus:ring-2 focus:ring-navy focus:outline-none"
            />
          </div>

          {/* Filtre catégorie */}
          <div className="relative shrink-0 sm:w-60">
            <Filter className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted pointer-events-none" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full pl-8 pr-8 py-2 text-xs sm:text-sm rounded-xl border border-border bg-background focus:ring-2 focus:ring-navy focus:outline-none cursor-pointer appearance-none"
            >
              {CATEGORY_FILTERS.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted text-xs pointer-events-none">
              ▼
            </span>
          </div>
        </div>

        {/* Barre d'actions groupées si éléments sélectionnés */}
        {selectedIds.length > 0 && (
          <div className="p-2.5 rounded-xl bg-navy/5 dark:bg-navy-light/10 border border-navy/20 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-navy dark:text-white">
                {selectedIds.length} contact{selectedIds.length > 1 ? "s" : ""} sélectionné{selectedIds.length > 1 ? "s" : ""}
              </span>
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="text-[11px] text-foreground-muted hover:text-navy underline"
              >
                Tout désélectionner
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSendEmailSelected}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-navy hover:bg-navy-hover rounded-lg transition-colors"
              >
                <Mail className="size-3.5 text-gold" />
                <span>Envoyer un e-mail groupé</span>
              </button>

              <button
                type="button"
                onClick={handleBatchDelete}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-950/30 rounded-lg transition-colors"
              >
                <Trash2 className="size-3.5" />
                <span>Supprimer</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 6. Tableau / Liste des contacts */}
      <div className="rounded-2xl border border-border bg-background shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <Loader2 className="size-6 animate-spin text-navy mx-auto" />
            <p className="text-xs text-foreground-muted">Chargement des contacts...</p>
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="size-12 rounded-full bg-background-secondary flex items-center justify-center mx-auto text-foreground-muted">
              <Users className="size-6" />
            </div>
            <h3 className="font-serif font-bold text-navy dark:text-white text-base">
              Aucun contact enregistré
            </h3>
            <p className="text-xs text-foreground-muted max-w-sm mx-auto">
              {search || selectedCategory !== "all"
                ? "Aucun résultat ne correspond à vos filtres actuels."
                : "Commencez par ajouter un contact ou importer votre carnet d'adresses en masse."}
            </p>
            {(search || selectedCategory !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setSelectedCategory("all");
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-gold hover:underline"
              >
                <RotateCcw className="size-3" />
                <span>Réinitialiser les filtres</span>
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Version Desktop (Tableau lg+) */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-background-secondary border-b border-border text-navy font-bold uppercase tracking-wider text-[11px]">
                    <th className="p-3 w-10 text-center">
                      <button
                        type="button"
                        onClick={toggleSelectAll}
                        className="text-foreground-muted hover:text-navy"
                        title={isAllSelected ? "Tout désélectionner" : "Tout sélectionner"}
                      >
                        {isAllSelected ? (
                          <CheckSquare className="size-4 text-navy" />
                        ) : (
                          <Square className="size-4" />
                        )}
                      </button>
                    </th>
                    <th className="p-3">Contact</th>
                    <th className="p-3">Organisation & Fonction</th>
                    <th className="p-3">Catégorie</th>
                    <th className="p-3">Dernier Contact</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredContacts.map((contact) => {
                    const isSelected = selectedIds.includes(contact.id);
                    return (
                      <tr
                        key={contact.id}
                        className={`hover:bg-background-secondary/40 transition-colors ${
                          isSelected ? "bg-navy/5 dark:bg-navy-light/5" : ""
                        }`}
                      >
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => toggleSelectRow(contact.id)}
                            className="text-foreground-muted hover:text-navy"
                          >
                            {isSelected ? (
                              <CheckSquare className="size-4 text-navy" />
                            ) : (
                              <Square className="size-4" />
                            )}
                          </button>
                        </td>

                        {/* Nom & Email */}
                        <td className="p-3">
                          <div className="font-semibold text-navy dark:text-white text-sm">
                            {contact.first_name} {contact.last_name}
                          </div>
                          <div className="text-foreground-muted flex items-center gap-1.5 mt-0.5">
                            <Mail className="size-3 text-gold" />
                            <a
                              href={`mailto:${contact.email}`}
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
                        </td>

                        {/* Organisation & Fonction */}
                        <td className="p-3">
                          {contact.organization ? (
                            <div className="font-medium text-foreground">
                              {contact.organization}
                            </div>
                          ) : (
                            <span className="text-foreground-muted italic">Non renseigné</span>
                          )}
                          {contact.role_or_title && (
                            <div className="text-foreground-muted text-[11px] mt-0.5">
                              {contact.role_or_title}
                            </div>
                          )}
                        </td>

                        {/* Catégorie */}
                        <td className="p-3">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold border ${getCategoryBadgeClass(
                              contact.category
                            )}`}
                          >
                            {contact.category_display || contact.category}
                          </span>
                        </td>

                        {/* Historique e-mail */}
                        <td className="p-3">
                          <div className="text-foreground">
                            {contact.last_contacted_at
                              ? new Date(contact.last_contacted_at).toLocaleDateString("fr-FR", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })
                              : "Jamais contacté"}
                          </div>
                          <div className="text-foreground-muted text-[11px] mt-0.5">
                            {contact.emails_sent_count} e-mail{contact.emails_sent_count > 1 ? "s" : ""} envoyé{contact.emails_sent_count > 1 ? "s" : ""}
                          </div>
                        </td>

                        {/* Actions en bout de ligne */}
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleSendEmailSingle(contact)}
                              className="p-1.5 rounded-lg text-foreground-muted hover:text-navy hover:bg-background-secondary transition-colors"
                              title="Envoyer un e-mail officiel"
                            >
                              <Mail className="size-4 text-gold" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleEditClick(contact)}
                              className="p-1.5 rounded-lg text-foreground-muted hover:text-navy hover:bg-background-secondary transition-colors"
                              title="Modifier les coordonnées"
                            >
                              <Edit2 className="size-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSingle(contact)}
                              className="p-1.5 rounded-lg text-foreground-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                              title="Supprimer le contact"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Version Mobile & Tablette (< 1024px) : Cartes empilées */}
            <div className="lg:hidden divide-y divide-border/60">
              {filteredContacts.map((contact) => {
                const isSelected = selectedIds.includes(contact.id);
                return (
                  <div
                    key={contact.id}
                    className={`p-4 space-y-3 transition-colors ${
                      isSelected ? "bg-navy/5 dark:bg-navy-light/5" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <button
                          type="button"
                          onClick={() => toggleSelectRow(contact.id)}
                          className="mt-0.5 text-foreground-muted hover:text-navy shrink-0"
                        >
                          {isSelected ? (
                            <CheckSquare className="size-4 text-navy" />
                          ) : (
                            <Square className="size-4" />
                          )}
                        </button>
                        <div className="min-w-0">
                          <h4 className="font-semibold text-navy dark:text-white text-sm truncate">
                            {contact.first_name} {contact.last_name}
                          </h4>
                          <a
                            href={`mailto:${contact.email}`}
                            className="text-xs text-foreground-muted hover:text-navy block truncate"
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
                        {contact.category_display || contact.category}
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

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleSendEmailSingle(contact)}
                          className="px-2.5 py-1 text-xs font-semibold text-navy bg-background border border-border rounded-lg flex items-center gap-1"
                        >
                          <Mail className="size-3 text-gold" />
                          <span>Écrire</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleEditClick(contact)}
                          className="p-1 rounded-lg text-foreground-muted hover:text-navy"
                        >
                          <Edit2 className="size-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteSingle(contact)}
                          className="p-1 rounded-lg text-foreground-muted hover:text-red-600"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* 7. Modales interactives */}
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
