"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getRoyaltyStatements } from "@/lib/services/author";
import { RoyaltyStatement } from "@/lib/types/author";
import { 
  ArrowLeft, 
  DollarSign, 
  Download, 
  FileCheck, 
  CheckCircle2, 
  Calendar, 
  ShieldCheck,
  Building2
} from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";

export default function RoyaltyStatementDetailPage() {
  const params = useParams();
  const [statement, setStatement] = useState<RoyaltyStatement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStatement() {
      try {
        setLoading(true);
        const stmts = await getRoyaltyStatements();
        const found = stmts.find((s) => s.id === params.id) || stmts[0];
        setStatement(found);
      } catch (err) {
        console.error("Erreur de chargement du relevé de droits", err);
      } finally {
        setLoading(false);
      }
    }
    loadStatement();
  }, [params.id]);

  if (loading || !statement) {
    return (
      <div className="p-8 max-w-4xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-background-secondary rounded-lg" />
        <div className="h-64 bg-background-secondary rounded-2xl border border-border" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-4xl mx-auto w-full min-w-0">
      {/* Header */}
      <div className="space-y-1 border-b border-border pb-4">
        <Link href="/author/royalties" className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-2">
          <ArrowLeft className="w-3.5 h-3.5" />
          Retour à l&apos;historique des droits
        </Link>
        <div className="flex items-center gap-2">
          <StatusBadge status={statement.status} />
          <span className="text-xs font-bold text-navy">{statement.statement_period}</span>
        </div>
        <h1 className="font-serif text-2xl lg:text-3xl font-bold text-navy pt-1">
          Relevé Officiel de Droits d&apos;Auteur #{statement.id}
        </h1>
      </div>

      {/* Carte du Relevé Officiel Exportable */}
      <div className="bg-background border border-border p-6 sm:p-8 rounded-3xl space-y-6 shadow-xs relative overflow-hidden">
        {/* Entête Éditorial LAHA */}
        <div className="flex items-center justify-between border-b border-border pb-6">
          <div className="space-y-1">
            <span className="text-xs font-bold text-gold uppercase tracking-wider">LAHA Éditions • Relevé de Redevances</span>
            <h2 className="font-serif font-bold text-navy text-xl">{statement.book_title}</h2>
          </div>
          <button
            onClick={() => alert("Génération du relevé de droits officiel en format PDF...")}
            className="px-4 py-2.5 rounded-xl bg-navy text-white text-xs font-semibold hover:bg-navy-hover transition-colors inline-flex items-center gap-2"
          >
            <Download className="w-4 h-4 text-gold" />
            Télécharger le justificatif PDF
          </button>
        </div>

        {/* Détail du Calcul des Droits (Section 3.4.1) */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-navy">
            Détail des Calculs de la Période ({statement.statement_period})
          </h3>

          <div className="bg-background-secondary p-5 rounded-2xl border border-border space-y-3 text-xs">
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-foreground-muted">Nombre de ventes comptabilisées</span>
              <strong className="text-navy font-bold">{statement.sales_count} exemplaires</strong>
            </div>

            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-foreground-muted">Revenus bruts générés</span>
              <strong className="text-navy font-bold">{statement.gross_revenue.toLocaleString("fr-FR")} {statement.currency}</strong>
            </div>

            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-foreground-muted">Part de droits contractuelle (Taux d&apos;auteur)</span>
              <strong className="text-gold font-bold">{statement.royalty_rate_percent}%</strong>
            </div>

            <div className="flex justify-between text-sm font-bold pt-1">
              <span className="text-navy font-serif">Net à payer à l&apos;auteur</span>
              <span className="text-navy font-serif text-lg">{statement.amount.toLocaleString("fr-FR")} {statement.currency}</span>
            </div>
          </div>
        </div>

        {/* Pied de page du Relevé */}
        <div className="pt-4 border-t border-border flex items-center justify-between text-xs text-foreground-muted">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-gold" />
            Vérifié par le service juridique LAHA Éditions
          </span>
          {statement.payout_date && (
            <span>Date de versement : {new Date(statement.payout_date).toLocaleDateString("fr-FR")}</span>
          )}
        </div>
      </div>
    </div>
  );
}
