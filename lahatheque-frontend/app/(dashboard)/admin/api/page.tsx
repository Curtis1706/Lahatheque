"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Key,
  Plus,
  Copy,
  Shield,
  Trash2,
  RefreshCw,
  Radio,
  Clock,
  Globe,
  Eye,
  EyeOff,
  Crown,
  FileUp,
  AlertTriangle,
  Search,
  CheckCircle2,
  HardDrive,
  Loader2,
  BookOpen,
  FileText,
  Layers,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  getPartnerApiKeys,
  createPartnerApiKey,
  togglePartnerApiKeyStatus,
  revokePartnerApiKey,
} from "@/lib/services/admin";
import { PartnerApiKey } from "@/lib/types/admin";
import { KpiMetricCard } from "@/components/ui/kpi-metric-card";
import { ViewModeToggle, ViewMode } from "@/components/ui/view-mode-toggle";

export default function AdminApiKeysPage() {
  const [keys, setKeys] = useState<PartnerApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSecretId, setShowSecretId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "mixed" | "external_only" | "catalog_only" | "vip">("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // Modales
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [keyToRevoke, setKeyToRevoke] = useState<PartnerApiKey | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // État formulaire création
  const [formData, setFormData] = useState({
    name: "",
    partner: "",
    tier: "vip" as "vip" | "enterprise" | "standard",
    accessMode: "mixed" as "mixed" | "external_only" | "catalog_only",
    allowedOrigins: "https://",
    allowedDocumentSources: "https://",
    maxFileSizeMb: 200,
    webhookUrl: "",
  });
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const loadKeys = async () => {
    try {
      setLoading(true);
      const data = await getPartnerApiKeys();
      setKeys(data);
    } catch (err) {
      toast.error("Erreur lors de la récupération des clés API partenaires.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKeys();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterType]);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.partner.trim()) {
      toast.error("Veuillez renseigner le nom de l'intégration et de l'institution.");
      return;
    }

    try {
      setIsSubmitting(true);
      const isVip = formData.tier === "vip";
      const dailyLimit = isVip ? "unlimited" : formData.tier === "enterprise" ? 50000 : 10000;
      const concurrentLimit = isVip ? "unlimited" : formData.tier === "enterprise" ? 1000 : 200;
      const allowByod = formData.accessMode === "mixed" || formData.accessMode === "external_only";

      const created = await createPartnerApiKey({
        name: formData.name.trim(),
        partner: formData.partner.trim(),
        clientId: `laha_client_${Math.random().toString(36).substring(2, 10)}`,
        clientSecret: `sec_live_${Math.random().toString(36).substring(2, 18)}${Math.random().toString(36).substring(2, 10)}`,
        allowedOrigins: formData.allowedOrigins
          ? formData.allowedOrigins.split(",").map((s) => s.trim()).filter(Boolean)
          : ["*"],
        allowedDocumentSources: formData.allowedDocumentSources
          ? formData.allowedDocumentSources.split(",").map((s) => s.trim()).filter(Boolean)
          : ["*"],
        webhookUrl: formData.webhookUrl.trim() || "",
        scopes: allowByod ? ["reader:byod", "catalog:read"] : ["catalog:read"],
        dailyRequestLimit: dailyLimit,
        concurrentSessionsLimit: concurrentLimit,
        is_active: true,
        isUnlimited: isVip,
        accessMode: formData.accessMode,
        allowByod: allowByod,
        maxFileSizeMb: Number(formData.maxFileSizeMb) || 200,
      });

      setKeys((prev) => [created, ...prev]);
      setIsCreateModalOpen(false);
      setFormData({
        name: "",
        partner: "",
        tier: "vip",
        accessMode: "mixed",
        allowedOrigins: "https://",
        allowedDocumentSources: "https://",
        maxFileSizeMb: 200,
        webhookUrl: "",
      });

      toast.success("Application partenaire configurée avec succès !", {
        description: isVip
          ? "Accès VIP Illimité activé (aucun quota d'appels ni de sessions)."
          : "Identifiants OAuth2 générés et enregistrés en base.",
      });
    } catch (err) {
      toast.error("Erreur lors de la création de la clé API.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copié dans le presse-papier !`);
  };

  const handleToggleStatus = async (id: string) => {
    try {
      const updated = await togglePartnerApiKeyStatus(id);
      if (updated) {
        setKeys((prev) => prev.map((k) => (k.id === id ? updated : k)));
        toast.success("Statut de l'application partenaire mis à jour.");
      }
    } catch (err) {
      toast.error("Erreur lors de la mise à jour du statut.");
    }
  };

  const handleConfirmRevokeKey = async () => {
    if (!keyToRevoke) return;
    try {
      await revokePartnerApiKey(keyToRevoke.id);
      setKeys((prev) => prev.filter((k) => k.id !== keyToRevoke.id));
      toast.success(`L'application ${keyToRevoke.name} a été révoquée et supprimée.`);
      setKeyToRevoke(null);
    } catch (err) {
      toast.error("Erreur lors de la révocation de la clé.");
    }
  };

  // Filtrage
  const filteredKeys = keys.filter((k) => {
    const matchesSearch =
      k.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      k.partner.toLowerCase().includes(searchQuery.toLowerCase()) ||
      k.clientId.toLowerCase().includes(searchQuery.toLowerCase());

    const mode = k.accessMode || (k.allowByod ? "mixed" : "catalog_only");

    const matchesFilter =
      filterType === "all" ||
      (filterType === "vip" && k.isUnlimited) ||
      (filterType === "mixed" && mode === "mixed") ||
      (filterType === "external_only" && mode === "external_only") ||
      (filterType === "catalog_only" && mode === "catalog_only");

    return matchesSearch && matchesFilter;
  });

  const totalPagesCount = Math.max(1, Math.ceil(filteredKeys.length / itemsPerPage));
  const paginatedKeys = filteredKeys.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* En-tête de la page */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] uppercase tracking-wider font-bold text-gold bg-gold/10 px-2.5 py-0.5 rounded-full border border-gold/20">
              Espace Développeur & API
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-navy">
            Gestion des Accès API & Intégrations Partenaires
          </h1>
          <p className="text-xs sm:text-sm text-foreground-secondary">
            Générez des identifiants OAuth2 Machine-to-Machine, configurez le périmètre documentaire (Catalogue LAHA ou Vos Propres Fichiers) et attribuez des privilèges VIP.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={loadKeys}
            className="p-2.5 rounded-xl border border-border bg-background hover:bg-background-secondary text-foreground transition-all cursor-pointer"
            title="Actualiser la liste des partenaires"
          >
            <RefreshCw className={`w-4 h-4 text-gold ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-navy text-white text-xs font-semibold hover:bg-navy-dark transition-all flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4 text-gold" />
            <span>Nouvelle Application Partenaire</span>
          </button>
        </div>
      </div>

      {/* Onglets de navigation segmentés */}
      <div className="flex items-center gap-1.5 p-1 bg-background-secondary rounded-xl border border-border overflow-x-auto">
        <Link
          href="/admin/api"
          className="px-4 py-2 rounded-lg text-xs font-bold bg-background text-navy shadow-sm border border-border flex items-center gap-2 shrink-0 transition-all"
        >
          <Key className="w-3.5 h-3.5 text-gold" />
          <span>Clés API & Identifiants</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-navy/10 text-navy font-mono font-bold">
            {keys.length}
          </span>
        </Link>
        <Link
          href="/admin/api/sessions"
          className="px-4 py-2 rounded-lg text-xs font-semibold text-foreground-secondary hover:text-foreground flex items-center gap-2 shrink-0 transition-all"
        >
          <Radio className="w-3.5 h-3.5 text-emerald-600" />
          <span>Sessions de Lecture Hébergées</span>
        </Link>
        <Link
          href="/admin/api/logs"
          className="px-4 py-2 rounded-lg text-xs font-semibold text-foreground-secondary hover:text-foreground flex items-center gap-2 shrink-0 transition-all"
        >
          <FileText className="w-3.5 h-3.5 text-blue-500" />
          <span>Journaux des Requêtes API</span>
        </Link>
      </div>

      {/* Cartes d'indicateurs KPIs (Composants 21st.dev adaptés) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiMetricCard
          label="Partenaires Enregistrés"
          value={keys.length}
          caption="Applications clientes réelles"
          tone="default"
          icon={<Key className="w-4 h-4 text-gold" />}
        />
        <KpiMetricCard
          label="Accès VIP Illimités"
          value={keys.filter((k) => k.isUnlimited).length}
          caption="Zéro plafond de requêtes"
          tone="gold"
          icon={<Crown className="w-4 h-4 text-gold" />}
        />
        <KpiMetricCard
          label="Diffusion Fichiers Externes"
          value={keys.filter((k) => k.allowByod).length}
          caption="Partenaires avec documents propres"
          tone="blue"
          icon={<FileUp className="w-4 h-4 text-blue-500" />}
        />
        <KpiMetricCard
          label="Lectures en Cours"
          value={keys.reduce((acc, k) => acc + k.activeSessionsCount, 0)}
          caption="Sessions actives en direct"
          tone="emerald"
          icon={<Radio className="w-4 h-4 animate-pulse text-emerald-600" />}
        />
      </div>

      {/* Barre de Recherche, Filtres et Sélecteur Grille / Liste (Composant 21st.dev ViewModeToggle) */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-background-secondary p-3 rounded-2xl border border-border">
        <div className="flex flex-col sm:flex-row items-center gap-3 flex-1">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted" />
            <input
              type="text"
              placeholder="Rechercher par nom, institution, Client ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-border bg-background focus:outline-none focus:ring-1 focus:ring-gold text-foreground placeholder:text-foreground-muted"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
            {[
              { id: "all", label: "Toutes les clés" },
              { id: "mixed", label: "Accès Mixte" },
              { id: "external_only", label: "Vos Fichiers Seuls" },
              { id: "catalog_only", label: "Catalogue Seul" },
              { id: "vip", label: "VIP Illimités" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  filterType === f.id
                    ? "bg-navy text-white shadow-sm"
                    : "bg-background text-foreground-secondary hover:text-foreground border border-border"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sélecteur Grille / Liste 21st.dev */}
        <ViewModeToggle value={viewMode} onChange={setViewMode} />
      </div>

      {/* Liste / Grille des Applications Partenaires */}
      {loading ? (
        <div className="p-12 text-center rounded-2xl bg-background-secondary border border-border space-y-3">
          <Loader2 className="w-8 h-8 text-gold animate-spin mx-auto" />
          <p className="text-sm font-semibold text-navy">Chargement des intégrations réelles...</p>
        </div>
      ) : filteredKeys.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-background-secondary border border-border space-y-3">
          <div className="w-12 h-12 rounded-full bg-navy/10 flex items-center justify-center text-navy mx-auto">
            <Key className="w-6 h-6 text-gold" />
          </div>
          <h3 className="text-base font-bold text-navy">Aucune application partenaire enregistrée</h3>
          <p className="text-xs text-foreground-secondary max-w-sm mx-auto">
            Créez votre première clé API pour connecter un LMS universitaire, un portail d'école ou un SaaS de formation.
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-navy text-white text-xs font-semibold hover:bg-navy-dark transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 text-gold" />
            <span>Créer une Intégration</span>
          </button>
        </div>
      ) : viewMode === "grid" ? (
        /* ================= VUE GRILLE (CARTES DÉTAILLÉES) ================= */
        <div className="space-y-4">
          {paginatedKeys.map((k) => {
            const mode = k.accessMode || (k.allowByod ? "mixed" : "catalog_only");

            return (
              <div
                key={k.id}
                className="p-5 rounded-2xl bg-background-secondary border border-border space-y-4 shadow-sm hover:border-border-hover transition-colors"
              >
                {/* Haut de carte */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                        <Key className="w-4 h-4 text-gold" />
                        {k.name}
                      </h3>

                      {/* Badge VIP Illimité */}
                      {k.isUnlimited && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-gold/15 text-gold border border-gold/30">
                          <Crown className="w-3 h-3 text-gold" />
                          <span>VIP Illimité</span>
                        </span>
                      )}

                      {/* Badge Périmètre d'Accès */}
                      {mode === "mixed" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          <Layers className="w-3 h-3" />
                          <span>Accès Mixte (Catalogue & Vos Fichiers)</span>
                        </span>
                      )}

                      {mode === "external_only" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20">
                          <FileUp className="w-3 h-3" />
                          <span>Vos Fichiers Uniquement</span>
                        </span>
                      )}

                      {mode === "catalog_only" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-500/10 text-purple-600 border border-purple-500/20">
                          <BookOpen className="w-3 h-3" />
                          <span>Catalogue LAHA Seul</span>
                        </span>
                      )}

                      {/* Badge Statut */}
                      <span
                        className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold ${
                          k.is_active
                            ? "bg-emerald-500/15 text-emerald-600 border border-emerald-500/30"
                            : "bg-red-500/15 text-red-600 border border-red-500/30"
                        }`}
                      >
                        {k.is_active ? "Active" : "Suspendue"}
                      </span>
                    </div>

                    <p className="text-xs text-foreground-secondary">
                      Institution : <strong className="text-foreground">{k.partner}</strong> • Créée le : <span className="font-mono">{k.created_at}</span> • Dernière activité : <span className="font-mono font-semibold text-foreground">{k.last_used}</span>
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleToggleStatus(k.id)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-border bg-background hover:bg-background-secondary transition-all cursor-pointer"
                    >
                      {k.is_active ? "Suspendre" : "Activer"}
                    </button>
                    <button
                      onClick={() => setKeyToRevoke(k)}
                      className="p-2 rounded-xl text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-colors cursor-pointer"
                      title="Révoquer définitivement cette clé"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Bloc Identifiants OAuth2 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Client ID */}
                  <div className="p-3 rounded-xl bg-background border border-border space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-foreground-muted tracking-wider">
                        Client ID (Identifiant Public OAuth2)
                      </span>
                      <span className="text-[10px] text-foreground-muted">Identifiant machine</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-semibold text-navy select-all">
                        {k.clientId}
                      </span>
                      <button
                        onClick={() => copyToClipboard(k.clientId, "Client ID")}
                        className="p-1 rounded-lg hover:bg-background-secondary text-foreground-secondary hover:text-foreground transition-colors cursor-pointer"
                        title="Copier le Client ID"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Client Secret */}
                  <div className="p-3 rounded-xl bg-background border border-border space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-foreground-muted tracking-wider">
                        Client Secret (Clé Privée de Signature)
                      </span>
                      <span className="text-[10px] text-amber-600 font-semibold">Confidentiel</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-semibold text-navy select-all">
                        {showSecretId === k.id ? k.clientSecret : "•".repeat(28)}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() =>
                            setShowSecretId(showSecretId === k.id ? null : k.id)
                          }
                          className="p-1 rounded-lg hover:bg-background-secondary text-foreground-secondary hover:text-foreground transition-colors cursor-pointer"
                          title={showSecretId === k.id ? "Masquer" : "Afficher en clair"}
                        >
                          {showSecretId === k.id ? (
                            <EyeOff className="w-3.5 h-3.5" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => copyToClipboard(k.clientSecret, "Client Secret")}
                          className="p-1 rounded-lg hover:bg-background-secondary text-foreground-secondary hover:text-foreground transition-colors cursor-pointer"
                          title="Copier le Client Secret"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Métriques de Quotas & Fichiers */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-background border border-border text-xs">
                  <div>
                    <span className="text-foreground-secondary text-[11px] block font-medium">Plafond Requêtes / 24h</span>
                    <span className="font-bold text-navy mt-0.5 block font-mono">
                      {k.isUnlimited ? (
                        <span className="text-gold font-sans font-bold flex items-center gap-1">
                          <Crown className="w-3.5 h-3.5 text-gold" /> Illimité (Sans quota)
                        </span>
                      ) : (
                        `${k.dailyRequestLimit.toLocaleString("fr-FR")} req / jour`
                      )}
                    </span>
                  </div>

                  <div>
                    <span className="text-foreground-secondary text-[11px] block font-medium">Sessions Simultanées</span>
                    <span className="font-bold text-navy mt-0.5 block font-mono">
                      {k.isUnlimited ? (
                        <span className="text-gold font-sans font-bold flex items-center gap-1">
                          <Crown className="w-3.5 h-3.5 text-gold" /> Illimité
                        </span>
                      ) : (
                        `${k.concurrentSessionsLimit} en direct`
                      )}
                    </span>
                  </div>

                  <div>
                    <span className="text-foreground-secondary text-[11px] block font-medium">Taille Max Document Externe</span>
                    <span className="font-bold text-navy mt-0.5 block font-mono">
                      {k.allowByod ? `${k.maxFileSizeMb} Mo / document` : "Non autorisé"}
                    </span>
                  </div>
                </div>

                {/* Lignes d'informations de sécurité */}
                <div className="space-y-1.5 pt-2 border-t border-border text-xs text-foreground-secondary">
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
                    <div className="flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-gold shrink-0" />
                      <span>Redirections autorisées :</span>
                      <span className="font-mono font-semibold text-foreground">
                        {k.allowedOrigins.join(", ")}
                      </span>
                    </div>

                    {k.webhookUrl && (
                      <div className="flex items-center gap-1.5">
                        <Radio className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span>Webhook :</span>
                        <span className="font-mono text-foreground truncate max-w-xs">{k.webhookUrl}</span>
                      </div>
                    )}
                  </div>

                  {k.allowByod && k.allowedDocumentSources.length > 0 && (
                    <div className="flex items-center gap-1.5 text-[11px]">
                      <HardDrive className="w-3 h-3 text-blue-500 shrink-0" />
                      <span>Serveurs distants approuvés (Anti-SSRF) :</span>
                      <span className="font-mono text-foreground">{k.allowedDocumentSources.join(", ")}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ================= VUE LISTE (TABLEAU COMPACT) ================= */
        <div className="rounded-2xl bg-background-secondary border border-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-background text-foreground-secondary">
                  <th className="py-3 px-4 font-semibold">Application & Institution</th>
                  <th className="py-3 px-4 font-semibold">Périmètre Documentaire</th>
                  <th className="py-3 px-4 font-semibold">Client ID & Secret</th>
                  <th className="py-3 px-4 font-semibold">Plafond / 24h</th>
                  <th className="py-3 px-4 font-semibold">Sessions Direct</th>
                  <th className="py-3 px-4 font-semibold">Statut</th>
                  <th className="py-3 px-4 font-semibold">Créée le</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedKeys.map((k) => {
                  const mode = k.accessMode || (k.allowByod ? "mixed" : "catalog_only");

                  return (
                    <tr
                      key={k.id}
                      className="hover:bg-background/60 transition-colors"
                    >
                      {/* Application & Institution */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-navy flex items-center gap-1.5">
                          <Key className="w-3.5 h-3.5 text-gold shrink-0" />
                          <span>{k.name}</span>
                        </div>
                        <div className="text-[11px] text-foreground-secondary">{k.partner}</div>
                      </td>

                      {/* Périmètre */}
                      <td className="py-3 px-4">
                        {k.isUnlimited && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gold/15 text-gold border border-gold/30 mr-1.5 mb-1">
                            <Crown className="w-3 h-3 text-gold" />
                            <span>VIP</span>
                          </span>
                        )}
                        {mode === "mixed" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                            <Layers className="w-3 h-3" />
                            <span>Mixte</span>
                          </span>
                        )}
                        {mode === "external_only" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20">
                            <FileUp className="w-3 h-3" />
                            <span>Vos Fichiers</span>
                          </span>
                        )}
                        {mode === "catalog_only" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-500/10 text-purple-600 border border-purple-500/20">
                            <BookOpen className="w-3 h-3" />
                            <span>Catalogue</span>
                          </span>
                        )}
                      </td>

                      {/* Client ID / Secret */}
                      <td className="py-3 px-4 font-mono text-[11px]">
                        <div className="flex items-center gap-1 text-navy font-semibold">
                          <span>{k.clientId}</span>
                          <button
                            onClick={() => copyToClipboard(k.clientId, "Client ID")}
                            className="p-1 hover:text-navy cursor-pointer text-foreground-secondary"
                            title="Copier Client ID"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="flex items-center gap-1 text-foreground-muted text-[10px]">
                          <span>
                            {showSecretId === k.id ? k.clientSecret.substring(0, 16) + "..." : "••••••••••••"}
                          </span>
                          <button
                            onClick={() => setShowSecretId(showSecretId === k.id ? null : k.id)}
                            className="p-0.5 hover:text-navy cursor-pointer"
                            title={showSecretId === k.id ? "Masquer" : "Afficher"}
                          >
                            {showSecretId === k.id ? <EyeOff className="w-2.5 h-2.5" /> : <Eye className="w-2.5 h-2.5" />}
                          </button>
                          <button
                            onClick={() => copyToClipboard(k.clientSecret, "Client Secret")}
                            className="p-0.5 hover:text-navy cursor-pointer"
                            title="Copier Secret"
                          >
                            <Copy className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </td>

                      {/* Quotas */}
                      <td className="py-3 px-4 font-mono">
                        {k.isUnlimited ? (
                          <span className="text-gold font-sans font-bold flex items-center gap-1">
                            <Crown className="w-3 h-3 text-gold" /> Illimité
                          </span>
                        ) : (
                          `${k.dailyRequestLimit.toLocaleString("fr-FR")} req`
                        )}
                      </td>

                      {/* Sessions directes */}
                      <td className="py-3 px-4 font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-navy">{k.activeSessionsCount}</span>
                          <span className="text-[10px] text-foreground-muted">
                            / {k.isUnlimited ? "∞" : k.concurrentSessionsLimit}
                          </span>
                        </div>
                      </td>

                      {/* Statut */}
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold inline-block ${
                            k.is_active
                              ? "bg-emerald-500/15 text-emerald-600 border border-emerald-500/30"
                              : "bg-red-500/15 text-red-600 border border-red-500/30"
                          }`}
                        >
                          {k.is_active ? "Active" : "Suspendue"}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 font-mono text-[11px] text-foreground-secondary whitespace-nowrap">
                        {k.created_at}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleToggleStatus(k.id)}
                            className="px-2.5 py-1 text-[11px] font-semibold rounded-lg border border-border bg-background hover:bg-background-secondary transition-all cursor-pointer"
                          >
                            {k.is_active ? "Suspendre" : "Activer"}
                          </button>
                          <button
                            onClick={() => setKeyToRevoke(k)}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-colors cursor-pointer"
                            title="Révoquer définitivement cette clé"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Contrôles de Pagination Clés API */}
      {!loading && filteredKeys.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-background-secondary border border-border text-xs">
          <div className="text-foreground-secondary">
            Affichage de <span className="font-bold text-navy font-mono">{(currentPage - 1) * itemsPerPage + 1}</span> à{" "}
            <span className="font-bold text-navy font-mono">{Math.min(currentPage * itemsPerPage, filteredKeys.length)}</span> sur{" "}
            <span className="font-bold text-navy font-mono">{filteredKeys.length}</span> intégrations
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 mr-2">
              <span className="text-foreground-muted text-[11px]">Par page :</span>
              {[5, 10, 20].map((size) => (
                <button
                  key={size}
                  onClick={() => {
                    setItemsPerPage(size);
                    setCurrentPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                    itemsPerPage === size
                      ? "bg-navy text-white shadow-xs"
                      : "bg-background text-foreground-secondary hover:text-foreground border border-border"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-background-secondary disabled:opacity-40 disabled:cursor-not-allowed font-medium text-foreground transition-all cursor-pointer"
              >
                Précédent
              </button>

              <div className="px-3 py-1.5 rounded-lg bg-navy/10 text-navy font-bold font-mono">
                {currentPage} / {totalPagesCount}
              </div>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPagesCount, p + 1))}
                disabled={currentPage === totalPagesCount}
                className="px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-background-secondary disabled:opacity-40 disabled:cursor-not-allowed font-medium text-foreground transition-all cursor-pointer"
              >
                Suivant
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale de Création d'Application Partenaire */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background border border-border rounded-2xl p-6 max-w-xl w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-lg font-bold text-navy flex items-center gap-2">
                <Key className="w-5 h-5 text-gold" />
                Nouvelle Clé d'API & Intégration Partenaire
              </h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-foreground-muted hover:text-foreground p-1 rounded-lg transition-colors cursor-pointer"
                title="Fermer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateKey} className="space-y-4 text-xs">
              {/* Bloc 1 : Identité */}
              <div className="space-y-3 p-3.5 rounded-xl bg-background-secondary border border-border">
                <h3 className="font-bold text-sm text-navy">
                  1. Identité de l'Intégration
                </h3>

                <div>
                  <label className="font-semibold text-foreground block mb-1">
                    Nom de l'intégration *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ex: API Portail Étudiants Université de Parakou"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-gold text-foreground"
                  />
                </div>

                <div>
                  <label className="font-semibold text-foreground block mb-1">
                    Institution / Entreprise Partenaire *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ex: Université de Parakou (UP)"
                    value={formData.partner}
                    onChange={(e) => setFormData({ ...formData, partner: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-gold text-foreground"
                  />
                </div>
              </div>

              {/* Bloc 2 : Quotas & Privilèges */}
              <div className="space-y-3 p-3.5 rounded-xl bg-background-secondary border border-border">
                <h3 className="font-bold text-sm text-navy flex items-center gap-1.5">
                  <Crown className="w-4 h-4 text-gold" />
                  <span>2. Quotas & Privilèges d'Appels</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, tier: "vip" })}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      formData.tier === "vip"
                        ? "border-gold bg-gold/10 text-navy shadow-sm"
                        : "border-border bg-background text-foreground-secondary hover:border-border-hover"
                    }`}
                  >
                    <div className="flex items-center gap-1 font-bold text-xs text-gold">
                      <Crown className="w-3.5 h-3.5" />
                      <span>VIP Illimité</span>
                    </div>
                    <p className="text-[11px] mt-1 text-foreground">
                      Zéro limite d'appels ni de sessions simultanées.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, tier: "enterprise" })}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      formData.tier === "enterprise"
                        ? "border-navy bg-navy/10 text-navy shadow-sm"
                        : "border-border bg-background text-foreground-secondary hover:border-border-hover"
                    }`}
                  >
                    <div className="font-bold text-xs text-navy">Élevé / Université</div>
                    <p className="text-[11px] mt-1 text-foreground">
                      50 000 req / jour • 1 000 sessions.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, tier: "standard" })}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      formData.tier === "standard"
                        ? "border-navy bg-navy/10 text-navy shadow-sm"
                        : "border-border bg-background text-foreground-secondary hover:border-border-hover"
                    }`}
                  >
                    <div className="font-bold text-xs text-navy">Standard</div>
                    <p className="text-[11px] mt-1 text-foreground">
                      10 000 req / jour • 200 sessions.
                    </p>
                  </button>
                </div>
              </div>

              {/* Bloc 3 : Périmètre d'Accès aux Documents (Mixte, Vos Documents Seuls, Catalogue Seul) */}
              <div className="space-y-3 p-3.5 rounded-xl bg-background-secondary border border-border">
                <h3 className="font-bold text-sm text-navy flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-gold" />
                  <span>3. Périmètre d'Accès aux Documents</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, accessMode: "mixed" })}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      formData.accessMode === "mixed"
                        ? "border-gold bg-gold/10 text-navy shadow-sm"
                        : "border-border bg-background text-foreground-secondary hover:border-border-hover"
                    }`}
                  >
                    <div className="font-bold text-xs text-navy">Accès Mixte (Recommandé)</div>
                    <p className="text-[11px] mt-1 text-foreground">
                      Catalogue LAHA + Diffusion de vos propres documents PDF.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, accessMode: "external_only" })}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      formData.accessMode === "external_only"
                        ? "border-blue-500 bg-blue-500/10 text-navy shadow-sm"
                        : "border-border bg-background text-foreground-secondary hover:border-border-hover"
                    }`}
                  >
                    <div className="font-bold text-xs text-blue-600">Vos Propres Documents Seuls</div>
                    <p className="text-[11px] mt-1 text-foreground">
                      Liseuse sécurisée pour vos fichiers PDF uniquement (sans catalogue LAHA).
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, accessMode: "catalog_only" })}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      formData.accessMode === "catalog_only"
                        ? "border-purple-500 bg-purple-500/10 text-navy shadow-sm"
                        : "border-border bg-background text-foreground-secondary hover:border-border-hover"
                    }`}
                  >
                    <div className="font-bold text-xs text-purple-600">Catalogue LAHA Seul</div>
                    <p className="text-[11px] mt-1 text-foreground">
                      Consultation des livres publiés sur LAHAThèque uniquement.
                    </p>
                  </button>
                </div>

                {/* Options complémentaires pour documents externes */}
                {(formData.accessMode === "mixed" || formData.accessMode === "external_only") && (
                  <div className="space-y-2.5 pt-2 border-t border-border animate-in fade-in duration-150">
                    <div>
                      <label className="font-semibold text-foreground block mb-1">
                        Whitelist des serveurs de stockage distants (Anti-SSRF)
                      </label>
                      <input
                        type="text"
                        placeholder="ex: https://up.bj/uploads/, https://storage.googleapis.com/up-courses/"
                        value={formData.allowedDocumentSources}
                        onChange={(e) =>
                          setFormData({ ...formData, allowedDocumentSources: e.target.value })
                        }
                        className="w-full p-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-gold text-foreground font-mono text-[11px]"
                      />
                      <span className="text-[10px] text-foreground-muted mt-0.5 block">
                        Sécurité : seuls les fichiers hébergés sur ces domaines HTTPS et leurs sous-domaines (ex: <strong>up.bj</strong> englobe automatiquement <em>cours.up.bj</em>) seront autorisés.
                      </span>
                    </div>

                    <div>
                      <label className="font-semibold text-foreground block mb-1">
                        Plafond de taille par fichier distant
                      </label>
                      <select
                        value={formData.maxFileSizeMb}
                        onChange={(e) =>
                          setFormData({ ...formData, maxFileSizeMb: Number(e.target.value) })
                        }
                        className="w-full p-2 rounded-lg border border-border bg-background text-foreground"
                      >
                        <option value={50}>50 Mo (Standard)</option>
                        <option value={200}>200 Mo (Recommandé)</option>
                        <option value={500}>500 Mo (Grands Manuels & Audio)</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Bloc 4 : Sécurité Redirection & Webhook */}
              <div className="space-y-3 p-3.5 rounded-xl bg-background-secondary border border-border">
                <h3 className="font-bold text-sm text-navy flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-gold" />
                  <span>4. Sécurité Anti-Open-Redirect & Webhook</span>
                </h3>

                <div>
                  <label className="font-semibold text-foreground block mb-1">
                    Domaines autorisés pour la redirection return_url *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ex: https://up.bj, https://lms.up.bj"
                    value={formData.allowedOrigins}
                    onChange={(e) => setFormData({ ...formData, allowedOrigins: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-gold text-foreground font-mono text-[11px]"
                  />
                  <span className="text-[10px] text-foreground-muted mt-0.5 block">
                    Bloque toute redirection vers un site non vérifié lors du clic sur « Quitter ».
                  </span>
                </div>

                <div>
                  <label className="font-semibold text-foreground block mb-1">
                    URL de Webhook (Optionnel)
                  </label>
                  <input
                    type="url"
                    placeholder="ex: https://up.bj/api/webhooks/reader"
                    value={formData.webhookUrl}
                    onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-gold text-foreground font-mono text-[11px]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl border border-border hover:bg-background-secondary transition-all font-semibold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-navy text-white hover:bg-navy-dark transition-all font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-3.5 h-3.5 text-gold animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5 text-gold" />
                  )}
                  <span>Créer l'Intégration</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modale de Confirmation de Révocation */}
      {keyToRevoke && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-600 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-navy">Révoquer cette clé API ?</h3>
              <p className="text-xs text-foreground-secondary">
                L'application <strong className="text-foreground">{keyToRevoke.name}</strong> ({keyToRevoke.partner}) ne pourra plus émettre d'appels ni créer de sessions de lecture. Cette action est irréversible.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border text-xs font-semibold">
              <button
                onClick={() => setKeyToRevoke(null)}
                className="px-4 py-2 rounded-xl border border-border hover:bg-background-secondary transition-all cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmRevokeKey}
                className="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Confirmer la Révocation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
