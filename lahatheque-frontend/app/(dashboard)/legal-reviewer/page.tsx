"use client";

import { useEffect, useState } from "react";
import { getLegalContracts, getClientDebts, remindClientDebt } from "@/lib/services/legal";
import { LegalContract, ClientDebt } from "@/lib/types/legal";
import { 
  Scale, 
  FileText, 
  Search, 
  Download, 
  BellRing, 
  AlertTriangle, 
  CheckCircle,
  Plus, 
  ArrowRight,
  TrendingUp,
  Percent,
  Mail
} from "lucide-react";
import Link from "next/link";

export default function LegalReviewerPage() {
  const [contracts, setContracts] = useState<LegalContract[]>([]);
  const [debts, setDebts] = useState<ClientDebt[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [remindingId, setRemindingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [contractsData, debtsData] = await Promise.all([
          getLegalContracts(),
          getClientDebts()
        ]);
        setContracts(contractsData);
        setDebts(debtsData);
      } catch (err) {
        console.error("Erreur de chargement", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleRemind = async (id: string) => {
    try {
      setRemindingId(id);
      const success = await remindClientDebt(id);
      if (success) {
        setDebts(prev => prev.map(d => {
          if (d.id === id) return { ...d, status: "reminded" as const };
          return d;
        }));
        alert("Email de relance de facture impayée envoyé au client avec succès !");
      }
    } catch (err) {
      alert("Erreur lors de l'envoi de la relance.");
    } finally {
      setRemindingId(null);
    }
  };

  const filteredContracts = contracts.filter(c => 
    c.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.book_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.author_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-8 space-y-8">
      
      {/* Header Banner */}
      <div className="bg-navy-dark text-white rounded-3xl p-6 sm:p-8 border border-navy/30 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-navy text-gold text-xs font-bold uppercase tracking-wider border border-gold/20">
            <Scale className="w-3.5 h-3.5" />
            Portail Juriste & Conformité Légale
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold">
            Marc-Aurèle DE SOUZA
          </h1>
          <p className="text-xs sm:text-sm text-white/80 max-w-xl">
            Gérez les contrats d'édition, définissez les clés de répartition des redevances et supervisez les relances de factures clients impayées.
          </p>
        </div>

        <div className="bg-navy/80 p-4 rounded-2xl border border-gold/20 space-y-1.5 text-xs z-10 w-full md:w-auto shrink-0">
          <div className="flex items-center justify-between gap-6 text-foreground-muted font-semibold">
            <span>Contrats Actifs :</span>
            <span className="text-gold font-bold">{contracts.length} contrats</span>
          </div>
          <div className="flex items-center justify-between gap-6 text-foreground-muted font-semibold">
            <span>Relances en attente :</span>
            <span className="text-warning font-bold flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-warning" /> {debts.filter(d => d.status === "pending").length} factures
            </span>
          </div>
        </div>
      </div>

      {/* Action shortcuts */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <h2 className="font-serif text-lg font-bold text-navy flex items-center gap-2">
          <FileText className="w-5 h-5 text-gold" />
          Moteur d'indexation et gestion des contrats
        </h2>

        <Link
          href="/legal-reviewer/contracts"
          className="inline-flex items-center justify-center gap-2 bg-navy hover:bg-navy-hover text-white font-bold text-xs px-5 py-3 rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Enregistrer un Contrat / Pré-édition
        </Link>
      </div>

      {/* Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left: Contracts lists with search */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-foreground-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-navy"
              placeholder="Rechercher par référence, auteur, titre de livre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="p-6 space-y-4 animate-pulse bg-background border border-border rounded-xl">
              <div className="h-10 bg-background-secondary rounded" />
              <div className="h-10 bg-background-secondary rounded" />
            </div>
          ) : filteredContracts.length === 0 ? (
            <div className="p-10 text-center text-xs text-foreground-muted bg-background border border-border rounded-xl">
              Aucun contrat ne correspond à votre recherche.
            </div>
          ) : (
            <div className="bg-background border border-border rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-background-secondary border-b border-border text-navy font-bold text-xs uppercase tracking-wider">
                      <th className="p-4">Réf. Contrat</th>
                      <th className="p-4">Auteur / Ouvrage</th>
                      <th className="p-4 text-center">Part Redevance</th>
                      <th className="p-4 text-right">Contrat PDF</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredContracts.map((ctr) => (
                      <tr key={ctr.id} className="hover:bg-background-secondary/30 transition-colors">
                        <td className="p-4 font-mono text-xs font-bold text-navy">{ctr.reference}</td>
                        <td className="p-4">
                          <p className="font-bold text-navy text-sm">{ctr.book_title}</p>
                          <p className="text-xs text-foreground-muted">Auteur : {ctr.author_name}</p>
                        </td>
                        <td className="p-4 text-center">
                          <span className="inline-flex items-center gap-0.5 text-xs font-bold text-gold">
                            <Percent className="w-3.5 h-3.5" /> {ctr.royalty_rate}%
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            className="p-2 rounded bg-background-secondary border border-border hover:border-navy text-navy hover:text-navy-hover transition-all"
                            title="Télécharger le contrat signé"
                            onClick={() => alert(`Téléchargement de ${ctr.contract_file}...`)}
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right: Client Debts & Reminders */}
        <div className="lg:col-span-4 bg-background border border-border rounded-xl shadow-sm overflow-hidden space-y-4 p-5">
          <h3 className="font-serif text-base font-bold text-navy flex items-center gap-2 border-b border-border pb-3">
            <BellRing className="w-5 h-5 text-gold" />
            Relances dettes & Factures en retard
          </h3>

          {loading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-12 bg-background-secondary rounded" />
            </div>
          ) : debts.length === 0 ? (
            <div className="text-center text-xs text-foreground-muted p-6">
              Aucun client débiteur en retard.
            </div>
          ) : (
            <div className="space-y-4">
              {debts.map((debt) => (
                <div key={debt.id} className="p-4 border border-border rounded-xl bg-background-secondary/20 space-y-3 hover:border-gold/30 transition-colors">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h4 className="font-bold text-navy text-xs leading-snug">{debt.client_name}</h4>
                      <p className="text-[10px] text-foreground-muted">{debt.client_email}</p>
                    </div>
                    <span className="font-bold text-navy text-xs shrink-0">
                      {debt.amount.toLocaleString()} {debt.currency}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-foreground-muted">Échéance : {new Date(debt.due_date).toLocaleDateString("fr-FR")}</span>
                    {debt.status === "reminded" ? (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-success/10 text-success border border-success/20 font-bold">
                        <CheckCircle className="w-3.5 h-3.5" /> Relancé
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-warning/10 text-warning border border-warning/20 font-bold">
                        <AlertTriangle className="w-3.5 h-3.5 text-warning" /> En retard
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleRemind(debt.id)}
                    disabled={remindingId === debt.id}
                    className="w-full py-2 bg-navy hover:bg-navy-hover text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    {remindingId === debt.id ? "Relance en cours..." : "Relancer par e-mail"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
