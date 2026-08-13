"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { ProgressMetricCard } from "@/components/ui/progress-metric-card";
import { DonutChart, DonutChartSegment } from "@/components/ui/donut-chart";
import { StatusBadge } from "@/components/ui/status-badge";
import { 
  getLegalKpis, 
  getLegalContracts, 
  getAIRoyaltySuggestions, 
  getClientDebts,
  validateAISuggestion,
  remindClientDebt
} from "@/lib/services/legal";
import type { 
  LegalKpis, 
  LegalContract, 
  AIRoyaltySuggestion, 
  ClientDebt 
} from "@/lib/types/legal";
import {
  Scale,
  FileText,
  Percent,
  Sparkles,
  BellRing,
  AlertTriangle,
  PlusCircle,
  ChevronRight,
  ArrowRight,
  BookOpen,
  DollarSign,
  ShieldCheck,
  PenTool,
  Building2,
  CheckCircle2,
  Clock,
  Send,
  FileCheck,
  Layers,
  Activity,
  ShieldAlert,
  ArrowUpRight
} from "lucide-react";

import { ContractConsultationModal } from "@/components/features/legal/contract-consultation-modal";

export default function LegalReviewerOverviewPage() {
  const { user } = useAuth();
  const [kpis, setKpis] = useState<LegalKpis | null>(null);
  const [contracts, setContracts] = useState<LegalContract[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<AIRoyaltySuggestion[]>([]);
  const [debts, setDebts] = useState<ClientDebt[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Modale de consultation
  const [selectedContract, setSelectedContract] = useState<LegalContract | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenConsultation = (contract: LegalContract) => {
    setSelectedContract(contract);
    setIsModalOpen(true);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [kpiData, contractData, sugData, debtData] = await Promise.all([
        getLegalKpis(),
        getLegalContracts(),
        getAIRoyaltySuggestions(),
        getClientDebts(),
      ]);
      setKpis(kpiData);
      setContracts(contractData.slice(0, 5));
      setAiSuggestions(sugData);
      setDebts(debtData);
    } catch (err) {
      console.error("Erreur de chargement du dashboard juriste", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleValidateSuggestion = async (id: string) => {
    const success = await validateAISuggestion(id);
    if (success) {
      setActionMessage("Clé de répartition IA validée avec succès !");
      setTimeout(() => setActionMessage(null), 4000);
      loadData();
    }
  };

  const handleRemindDebt = async (id: string) => {
    const success = await remindClientDebt(id);
    if (success) {
      setActionMessage("Relance d'impayé envoyée par email au client.");
      setTimeout(() => setActionMessage(null), 4000);
      loadData();
    }
  };

  // Donut chart segments pour le type de contrats
  const contractDistributionSegments: DonutChartSegment[] = [
    { value: 45, label: "Contrats Auteurs", color: "#B08D42", percentage: 45 },
    { value: 25, label: "Conventions Universités (15%)", color: "#1B2A4E", percentage: 25 },
    { value: 20, label: "Accords Éditeurs Tiers", color: "#10b981", percentage: 20 },
    { value: 10, label: "Pré-éditions", color: "#f59e0b", percentage: 10 },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 sm:space-y-8">
      
      {/* Banner Header avec Raccourci d'action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-navy border border-navy-hover text-white shadow-md">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/20 text-gold text-xs font-bold mb-2 uppercase tracking-wider">
            <Scale className="w-3.5 h-3.5" />
            Espace Juriste • Direction des Affaires Juridiques
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif tracking-tight">
            Bonjour, {user?.first_name ? `Me. ${user.first_name}` : "Me. François KÉRÉKOU"} 👋
          </h1>
          <p className="text-xs sm:text-sm text-navy-light mt-1">
            Gérez la base contractuelle, validez les droits d&apos;auteur et pilotez le suivi des redevances et relances d&apos;impayés.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/legal-reviewer/contracts/new"
            className="px-4 py-2.5 rounded-xl bg-gold text-navy font-bold text-xs hover:bg-gold-hover transition-all flex items-center gap-2 shadow-sm min-h-[44px]"
          >
            <PlusCircle className="w-4 h-4" />
            Nouveau Contrat
          </Link>
        </div>
      </div>

      {/* Notifications / Feedback temporaire */}
      {actionMessage && (
        <div className="p-4 rounded-2xl bg-success/15 border border-success/30 text-success text-xs font-semibold flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-success" />
            <span>{actionMessage}</span>
          </div>
        </div>
      )}

      {/* 5 KPI Cards en Barres Histogrammes (Full Width Responsive Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-5">
        <Link href="/legal-reviewer/contracts" className="block">
          <ProgressMetricCard
            title="Contrats Stockés"
            total={`${kpis?.totalContracts || 4} actes`}
            percent="+12.0%"
            trend="up"
            accent="gold"
            delta="+1 contrat"
            deltaLabel="ce mois"
            data={[
              { value: 2, date: "01 Mar" },
              { value: 3, date: "08 Mar" },
              { value: 3, date: "15 Mar" },
              { value: 4, date: "22 Mar" }
            ]}
          />
        </Link>

        <Link href="/legal-reviewer/royalties?tab=suggestions" className="block">
          <ProgressMetricCard
            title="Suggestions IA"
            total={`${kpis?.pendingAiSuggestions || 2} clés`}
            percent="À valider"
            trend="up"
            accent="gold"
            delta="2 requêtes"
            deltaLabel="en attente"
            data={[
              { value: 1, date: "01 Mar" },
              { value: 2, date: "08 Mar" },
              { value: 2, date: "15 Mar" },
              { value: 2, date: "22 Mar" }
            ]}
          />
        </Link>

        <Link href="/legal-reviewer/relances?tab=debts" className="block">
          <ProgressMetricCard
            title="Clients en Impayé"
            total={`${kpis?.clientsInDebt || 2} factures`}
            percent="-5.0%"
            trend="down"
            accent="rose"
            delta="1.07M FCFA"
            deltaLabel="à recouvrir"
            data={[
              { value: 4, date: "01 Mar" },
              { value: 3, date: "08 Mar" },
              { value: 3, date: "15 Mar" },
              { value: 2, date: "22 Mar" }
            ]}
          />
        </Link>

        <Link href="/legal-reviewer/relances?tab=authors" className="block">
          <ProgressMetricCard
            title="Relances Envoyées"
            total={`${kpis?.authorRemindersSent || 2} relances`}
            percent="+15.0%"
            trend="up"
            accent="emerald"
            delta="+2 envoyées"
            deltaLabel="ce mois"
            data={[
              { value: 1, date: "01 Mar" },
              { value: 1, date: "08 Mar" },
              { value: 2, date: "15 Mar" },
              { value: 2, date: "22 Mar" }
            ]}
          />
        </Link>

        <Link href="/legal-reviewer/pre-editions" className="block">
          <ProgressMetricCard
            title="Pré-éditions"
            total={`${kpis?.activePreEditions || 2} projets`}
            percent="+8.0%"
            trend="up"
            accent="navy"
            delta="+1 projet"
            deltaLabel="en attente"
            data={[
              { value: 1, date: "01 Mar" },
              { value: 1, date: "08 Mar" },
              { value: 2, date: "15 Mar" },
              { value: 2, date: "22 Mar" }
            ]}
          />
        </Link>
      </div>

      {/* Dispositions en 2 Colonnes comme sur le Dashboard Admin (Gauches: Tables & Modules, Droite: Actions Rapides alignées verticalement) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Colonne Principale Gauche (2/3 de l'écran) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Barre de Progression & Conformité Juridique */}
          <div className="p-6 rounded-3xl bg-background-secondary border border-border space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
              <div>
                <h2 className="text-base font-bold font-serif text-navy">Indicateurs de Conformité &amp; Couverture Légale</h2>
                <p className="text-[11px] text-foreground-muted">Progression des validations et taux d&apos;archivage sur l&apos;année 2026</p>
              </div>
              <span className="text-xs font-bold text-gold px-2.5 py-1 rounded-full bg-gold/10 border border-gold/20 self-start sm:self-auto">
                100% Modèles Conformes
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              {/* Jauge 1 : Couverture Contrats Auteurs */}
              <div className="space-y-2 bg-background p-4 rounded-2xl border border-border">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-navy flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-gold" /> Contrats Auteurs
                  </span>
                  <span className="text-gold font-bold">94%</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-background-secondary overflow-hidden border border-border">
                  <div className="h-full bg-gold rounded-full transition-all duration-500" style={{ width: "94%" }} />
                </div>
                <p className="text-[10px] text-foreground-muted flex justify-between">
                  <span>18 sur 19 sous contrat</span>
                  <span className="font-semibold text-success">+6%</span>
                </p>
              </div>

              {/* Jauge 2 : Taux de Recouvrement Impayés */}
              <div className="space-y-2 bg-background p-4 rounded-2xl border border-border">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-navy flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-warning" /> Recouvrement
                  </span>
                  <span className="text-warning font-bold">78%</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-background-secondary overflow-hidden border border-border">
                  <div className="h-full bg-warning rounded-full transition-all duration-500" style={{ width: "78%" }} />
                </div>
                <p className="text-[10px] text-foreground-muted flex justify-between">
                  <span>1.070.000 FCFA</span>
                  <span className="font-semibold text-foreground-muted">2 relances</span>
                </p>
              </div>

              {/* Jauge 3 : Validation des Suggestions IA */}
              <div className="space-y-2 bg-background p-4 rounded-2xl border border-border">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-navy flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-info" /> Validation IA
                  </span>
                  <span className="text-info font-bold">85%</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-background-secondary overflow-hidden border border-border">
                  <div className="h-full bg-info rounded-full transition-all duration-500" style={{ width: "85%" }} />
                </div>
                <p className="text-[10px] text-foreground-muted flex justify-between">
                  <span>12 clés validées</span>
                  <span className="font-semibold text-info">2 attente</span>
                </p>
              </div>
            </div>
          </div>

          {/* Tableau des Derniers Contrats Stockés */}
          <div className="p-6 rounded-3xl bg-background-secondary border border-border space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h2 className="text-base font-bold font-serif text-navy">Base Contractuelle Récente</h2>
                <p className="text-[11px] text-foreground-muted">Derniers contrats téléversés et signés sur LAHAThèque</p>
              </div>
              <Link href="/legal-reviewer/contracts" className="text-xs font-bold text-gold hover:text-gold-dark flex items-center gap-1">
                Voir tous ({kpis?.totalContracts || 4}) <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="h-44 w-full bg-border/40 animate-pulse rounded-2xl" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border text-foreground-muted text-[11px] font-bold uppercase tracking-wider">
                      <th className="py-3 px-3">Référence &amp; Titre</th>
                      <th className="py-3 px-3">Partie Contractante</th>
                      <th className="py-3 px-3">Date Signature</th>
                      <th className="py-3 px-3">Statut</th>
                      <th className="py-3 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {contracts.map((ctr) => (
                      <tr key={ctr.id} className="hover:bg-background/80 transition-colors">
                        <td className="py-3 px-3">
                          <div className="font-bold text-navy">{ctr.title}</div>
                          <div className="text-[10px] text-foreground-muted font-mono">{ctr.reference}</div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-semibold text-foreground">{ctr.contracting_party}</span>
                          <div className="text-[10px] text-gold uppercase font-bold">{ctr.party_type}</div>
                        </td>
                        <td className="py-3 px-3 text-foreground-muted">
                          {new Date(ctr.signed_at).toLocaleDateString("fr-FR")}
                        </td>
                        <td className="py-3 px-3">
                          <StatusBadge status={ctr.status === "active" ? "approved" : "pending"} />
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Link
                            href={`/legal-reviewer/contracts/${ctr.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-navy text-gold font-bold hover:bg-navy-dark transition-colors text-[11px] border border-gold/30 shadow-xs cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5 text-gold" /> Consulter
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Grid à 2 blocs : Suggestions IA & Impayés */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Bloc Suggestions IA */}
            <div className="p-6 rounded-3xl bg-background-secondary border border-border space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold font-serif text-navy">Suggestions IA à Valider</h3>
                    <p className="text-[10px] text-foreground-muted">Clés de répartition co-auteurs</p>
                  </div>
                </div>
                <Link href="/legal-reviewer/royalties?tab=suggestions" className="text-[11px] font-bold text-gold">
                  Voir tout ({aiSuggestions.length})
                </Link>
              </div>

              {loading ? (
                <div className="h-28 w-full bg-border/40 animate-pulse rounded-2xl" />
              ) : aiSuggestions.length === 0 ? (
                <p className="text-xs text-foreground-muted py-4 text-center">Aucune suggestion en attente.</p>
              ) : (
                <div className="space-y-3">
                  {aiSuggestions.map((sug) => (
                    <div key={sug.id} className="p-3.5 rounded-2xl bg-background border border-border space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-bold text-xs text-navy leading-tight line-clamp-1">{sug.title}</h4>
                        <span className="px-1.5 py-0.5 rounded bg-info/10 text-info font-bold text-[9px] shrink-0">
                          {sug.ai_confidence}%
                        </span>
                      </div>
                      <div className="space-y-1 text-[11px]">
                        {sug.proposed_splits.map((split, i) => (
                          <div key={i} className="flex justify-between text-foreground-muted">
                            <span className="truncate">{split.author_name}</span>
                            <span className="font-bold text-navy ml-2">{split.percentage}%</span>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => handleValidateSuggestion(sug.id)}
                        className="w-full py-1.5 px-2 rounded-xl bg-gold text-navy font-bold text-[11px] hover:bg-gold-hover transition-colors flex items-center justify-center gap-1 shadow-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Valider Clé IA
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bloc Impayés Clients */}
            <div className="p-6 rounded-3xl bg-background-secondary border border-border space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold font-serif text-navy">Clients en Impayé</h3>
                    <p className="text-[10px] text-foreground-muted">Relances échues</p>
                  </div>
                </div>
                <Link href="/legal-reviewer/relances?tab=debts" className="text-[11px] font-bold text-gold">
                  Toutes ({debts.length})
                </Link>
              </div>

              {loading ? (
                <div className="h-28 w-full bg-border/40 animate-pulse rounded-2xl" />
              ) : debts.length === 0 ? (
                <p className="text-xs text-foreground-muted py-4 text-center">Aucun impayé signalé.</p>
              ) : (
                <div className="space-y-3">
                  {debts.map((debt) => (
                    <div key={debt.id} className="p-3.5 rounded-2xl bg-background border border-border space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-bold text-xs text-navy leading-tight truncate">{debt.client_name}</h4>
                        <span className="font-bold text-xs text-error font-mono shrink-0">
                          {debt.amount.toLocaleString("fr-FR")} {debt.currency}
                        </span>
                      </div>
                      <div className="flex justify-between text-[10px] text-foreground-muted">
                        <span>{debt.days_overdue}j de retard</span>
                        <span>{debt.reminder_count} relance(s)</span>
                      </div>
                      <button
                        onClick={() => handleRemindDebt(debt.id)}
                        className="w-full py-1.5 px-2 rounded-xl bg-navy text-gold font-bold text-[11px] hover:bg-navy-dark transition-colors flex items-center justify-center gap-1 border border-gold/30 shadow-xs"
                      >
                        <Send className="w-3.5 h-3.5" /> Relancer Client
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>

        {/* Colonne Latérale Droite (1/3 de l'écran) : Actions Rapides Alignées Verticalement comme sur l'Admin */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Actions Rapides Alignées Verticalement */}
          <div className="p-6 rounded-3xl bg-background-secondary border border-border space-y-4 shadow-xs">
            <div className="pb-3 border-b border-border">
              <h2 className="text-base font-bold font-serif text-navy">Actions Rapides Juridiques</h2>
              <p className="text-[11px] text-foreground-muted">Accès direct aux 6 sous-modules</p>
            </div>

            <div className="flex flex-col gap-2.5">
              {[
                {
                  label: "Téléverser un Contrat",
                  desc: "Enregistrer un nouveau contrat PDF/Word",
                  icon: PlusCircle,
                  href: "/legal-reviewer/contracts/new",
                  primary: true,
                },
                {
                  label: "Valider Suggestions IA",
                  desc: "Clés de répartition co-auteurs",
                  icon: Sparkles,
                  href: "/legal-reviewer/royalties?tab=suggestions",
                },
                {
                  label: "Nouveau Contrat Pré-édition",
                  desc: "Pré-enregistrer avant dépôt effectif",
                  icon: PenTool,
                  href: "/legal-reviewer/pre-editions",
                },
                {
                  label: "Droits d'Auteur & Taux",
                  desc: "Ajuster les taux par livre",
                  icon: Percent,
                  href: "/legal-reviewer/royalties",
                },
                {
                  label: "Redevances Universités & Tiers",
                  desc: "Suivre le 15% fixe et partenaires",
                  icon: DollarSign,
                  href: "/legal-reviewer/redevances",
                },
                {
                  label: "Relances Impayés Clients",
                  desc: "Seuils et fréquence automatique",
                  icon: BellRing,
                  href: "/legal-reviewer/relances",
                },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between group shadow-xs ${
                    item.primary
                      ? "bg-navy border-navy-hover text-white hover:border-gold"
                      : "bg-background border-border hover:border-gold text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-2 rounded-xl shrink-0 ${
                        item.primary ? "bg-gold/20 text-gold" : "bg-navy/10 text-navy"
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p
                        className={`font-bold text-xs truncate ${
                          item.primary ? "text-white" : "text-navy"
                        }`}
                      >
                        {item.label}
                      </p>
                      <p className="text-[10px] text-foreground-muted truncate">{item.desc}</p>
                    </div>
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      item.primary ? "text-gold" : "text-foreground-muted group-hover:text-gold"
                    }`}
                  />
                </Link>
              ))}
            </div>
          </div>

          {/* Graphique Donut de Répartition des Contrats */}
          <div className="p-6 rounded-3xl bg-background-secondary border border-border space-y-4 shadow-xs">
            <div className="pb-2 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold font-serif text-navy">Répartition de la Base Contractuelle</h3>
                <p className="text-[10px] text-foreground-muted">Ventilation par typologie de contrat</p>
              </div>
              <Layers className="w-4 h-4 text-gold" />
            </div>

            <DonutChart
              data={contractDistributionSegments}
              centerContent={
                <div className="text-center">
                  <span className="text-[10px] uppercase font-bold text-foreground-muted block">Base Actes</span>
                  <span className="text-base font-bold font-serif text-navy">100%</span>
                </div>
              }
            />
          </div>

          {/* Alertes de Conformité & Normes */}
          <div className="p-5 rounded-3xl bg-navy border border-navy-hover text-white space-y-3 shadow-md">
            <div className="flex items-center gap-2 text-gold font-bold text-xs uppercase tracking-wider">
              <ShieldAlert className="w-4 h-4" />
              Sécurité &amp; Droits LAHAThèque
            </div>
            <p className="text-xs text-navy-light leading-relaxed">
              Toutes les conventions universités garantissent un taux fixe de <strong className="text-gold">15%</strong> conformément aux exigences de la gouvernance LAHAThèque.
            </p>
            <Link
              href="/legal-reviewer/contracts"
              className="inline-flex items-center gap-1 text-xs font-bold text-gold hover:underline"
            >
              Consulter la charte juridique <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

        </div>

      </div>

      {/* Modale de consultation complète */}
      <ContractConsultationModal
        contract={selectedContract}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedContract(null);
        }}
      />
    </div>
  );
}
