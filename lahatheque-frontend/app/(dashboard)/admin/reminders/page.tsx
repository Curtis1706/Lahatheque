"use client";

import React, { useEffect, useState } from "react";
import {
  BellRing,
  Send,
  CheckCircle2,
  Clock,
  Zap,
  Mail,
  MessageSquare,
  AlertTriangle,
  RefreshCw,
  Sliders,
} from "lucide-react";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  getAdminReminders,
  triggerAdminRemindersNow,
  getGlobalPricingConfig,
} from "@/lib/services/admin";
import { AdminReminder, GlobalPricingConfig } from "@/lib/types/admin";
import { toast } from "sonner";

export default function AdminRemindersPage() {
  const [reminders, setReminders] = useState<AdminReminder[]>([]);
  const [globalConfig, setGlobalConfig] = useState<GlobalPricingConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);

  const loadRemindersData = async () => {
    try {
      setLoading(true);
      const [remindersData, configData] = await Promise.all([
        getAdminReminders(),
        getGlobalPricingConfig(),
      ]);
      setReminders(remindersData);
      setGlobalConfig(configData);
    } catch (err) {
      toast.error("Erreur de chargement des relances.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRemindersData();
  }, []);

  const handleTriggerNow = async () => {
    setTriggering(true);
    try {
      const res = await triggerAdminRemindersNow();
      if (res.success) {
        toast.success(res.message || "Scan des relances exécuté avec succès !");
        loadRemindersData();
      } else {
        toast.error(res.error || "Erreur lors du déclenchement.");
      }
    } catch {
      toast.error("Impossible de joindre le serveur.");
    } finally {
      setTriggering(false);
    }
  };

  const pendingDepositsCount = reminders.filter(
    (r) => r.type === "pending_deposit" || r.type === "depot_en_attente"
  ).length;
  const unpaidCount = reminders.filter(
    (r) => r.type === "unpaid_invoice" || r.type === "facture_impayee"
  ).length;

  const columns: DataTableColumn<AdminReminder>[] = [
    {
      key: "entity_name",
      header: "Entité / Destinataire",
      cell: (row) => (
        <div>
          <p className="font-semibold text-xs text-foreground">{row.entity_name}</p>
          <p className="text-[11px] text-foreground-muted">{row.target_email}</p>
        </div>
      ),
    },
    {
      key: "type",
      header: "Motif & Canal",
      cell: (row) => {
        const isDeposit = row.type === "pending_deposit" || row.type === "depot_en_attente";
        const isUnpaid = row.type === "unpaid_invoice" || row.type === "facture_impayee";
        return (
          <div className="space-y-1">
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-semibold inline-block ${
                isDeposit
                  ? "bg-navy-light text-navy"
                  : isUnpaid
                  ? "bg-error/15 text-error"
                  : "bg-gold/15 text-gold-dark"
              }`}
            >
              {isDeposit
                ? "Dépôt / Maquette en attente"
                : isUnpaid
                ? "Commande Impayée (Mobile Money)"
                : "Abonnement Expirant"}
            </span>
            <div className="flex items-center gap-1 text-[10px] text-foreground-muted">
              {row.canal === "sms" ? (
                <MessageSquare className="w-3 h-3 text-gold" />
              ) : (
                <Mail className="w-3 h-3 text-navy" />
              )}
              <span>{row.canal === "sms" ? "SMS (FasterMessage)" : "E-mail transactionnel"}</span>
            </div>
          </div>
        );
      },
    },
    {
      key: "objet",
      header: "Objet / Message Transmis",
      cell: (row) => (
        <span className="text-xs text-foreground font-medium truncate max-w-[280px] block">
          {row.objet || row.amount_or_count || "Notification de rappel automatique"}
        </span>
      ),
    },
    {
      key: "days_overdue",
      header: "Délai / Déclenchement",
      cell: (row) => (
        <span className="font-mono text-xs text-foreground px-2 py-0.5 rounded-md bg-background border border-border">
          {row.days_overdue ? `${row.days_overdue} j. d'inactivité` : "Automatique Celery"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Statut",
      cell: (row) => {
        const isSent = row.status === "sent" || row.status === "envoye";
        return (
          <span
            className={`text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 w-fit ${
              isSent ? "bg-success/15 text-success" : "bg-warning/15 text-gold-dark"
            }`}
          >
            <CheckCircle2 className="w-3 h-3" />
            {isSent ? "Envoyé avec succès" : "En file d'attente"}
          </span>
        );
      },
    },
    {
      key: "created_at",
      header: "Date d'émission",
      cell: (row) => (
        <span className="font-mono text-[11px] text-foreground-muted">
          {row.created_at.slice(0, 10)}
        </span>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-navy-light text-navy text-xs font-semibold mb-2">
            <BellRing className="w-3.5 h-3.5 text-gold" />
            Automatisation & Notifications
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-navy">
            Supervision du Moteur de Relances Automatiques
          </h1>
          <p className="text-xs sm:text-sm text-foreground-muted mt-0.5">
            Suivi des relances périodiques Celery Beat pour les dépôts en souffrance et les impayés avec déclencheur manuel immédiat.
          </p>
        </div>

        {/* Bouton de déclenchement forcé */}
        <button
          onClick={handleTriggerNow}
          disabled={triggering}
          className="px-4 py-2.5 rounded-xl bg-navy text-white font-semibold text-xs hover:bg-navy-hover transition-colors flex items-center gap-2 shadow-sm shrink-0 disabled:opacity-50"
        >
          <Zap className="w-4 h-4 text-gold" />
          {triggering ? "Scan en cours..." : "Déclencher un scan immédiat"}
        </button>
      </div>

      {/* Cartes de Paramétrage Actif des Relances */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-background-secondary border border-border space-y-1 shadow-xs">
          <p className="text-xs font-medium text-foreground-muted">Dépôts de Maquettes</p>
          <p className="text-xl font-bold text-navy font-mono">
            J + {globalConfig?.delai_relance_depots_jours || 7} jours
          </p>
          <p className="text-[11px] text-foreground-muted">
            {pendingDepositsCount} relances actives pour les éditeurs
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-background-secondary border border-border space-y-1 shadow-xs">
          <p className="text-xs font-medium text-foreground-muted">Commandes & Factures Impayées</p>
          <p className="text-xl font-bold text-error font-mono">
            J + {globalConfig?.delai_relance_impayes_jours || 7} jours
          </p>
          <p className="text-[11px] text-foreground-muted">
            {unpaidCount} relances avec lien Mobile Money
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-background-secondary border border-border space-y-1 shadow-xs">
          <p className="text-xs font-medium text-foreground-muted">Abonnements Expirants</p>
          <p className="text-xl font-bold text-gold font-mono">
            J - {globalConfig?.delai_relance_abonnements_jours || 15} jours
          </p>
          <p className="text-[11px] text-foreground-muted">
            Pass et bouquets universitaires
          </p>
        </div>
      </div>

      {/* Main Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground">
            Historique & Logs des Relances Émises ({reminders.length})
          </h2>
        </div>

        <DataTable
          data={reminders}
          columns={columns}
          rowKey="id"
          loading={loading}
          filterKey="type"
          filterOptions={[
            { value: "all", label: "Toutes les relances" },
            { value: "depot_en_attente", label: "Dépôts en attente" },
            { value: "facture_impayee", label: "Factures impayées" },
            { value: "abonnement_expiration", label: "Expirations" },
          ]}
          filterPlaceholder="Filtrer par motif..."
          searchPlaceholder="Rechercher par entité ou e-mail..."
        />
      </div>
    </div>
  );
}
