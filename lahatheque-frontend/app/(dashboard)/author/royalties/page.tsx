"use client";

import { useEffect, useState } from "react";
import { 
  getRoyaltyStatements, 
  getAuthorContracts 
} from "@/lib/services/author";
import { RoyaltyStatement, AuthorContract } from "@/lib/types/author";
import { 
  ArrowLeft, 
  DollarSign, 
  FileText, 
  Calendar, 
  Download, 
  CheckCircle, 
  Clock, 
  Percent,
  Bookmark
} from "lucide-react";
import Link from "next/link";
import { DataTable } from "@/components/ui/data-table";

export default function AuthorRoyaltiesPage() {
  const [statements, setStatements] = useState<RoyaltyStatement[]>([]);
  const [contracts, setContracts] = useState<AuthorContract[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRoyaltiesData() {
      try {
        setLoading(true);
        const [stmtData, contractData] = await Promise.all([
          getRoyaltyStatements(),
          getAuthorContracts()
        ]);
        setStatements(stmtData);
        setContracts(contractData);
      } catch (err) {
        console.error("Erreur de chargement des redevances", err);
      } finally {
        setLoading(false);
      }
    }
    loadRoyaltiesData();
  }, []);

  const totalRevenus = statements.reduce((sum, s) => sum + s.amount, 0);

  return (
    <div className="p-6 lg:p-8 space-y-8">
      
      {/* Header */}
      <div className="space-y-1">
        <Link
          href="/author"
          className="inline-flex items-center gap-1 text-xs font-bold text-navy hover:text-gold transition-colors mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Retour au Tableau de Bord
        </Link>
        <h1 className="font-serif text-2xl lg:text-3xl font-bold text-navy">Redevances & Droits d'Auteur</h1>
        <p className="text-sm text-foreground-muted">Consultez l'état de vos paiements de droits et vos contrats d'édition signés.</p>
      </div>

      {/* Grid: Financial Summary & Contracts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left: Royalty Payout Lines Table */}
        <div className="lg:col-span-8 space-y-4">
          <h3 className="font-serif text-lg font-bold text-navy flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-gold" />
            Historique des relevés de redevances
          </h3>

          <div className="pt-2">
            <DataTable
              data={statements}
              rowKey="id"
              loading={loading}
              skeletonRows={4}
              emptyMessage="Aucun relevé disponible."
              columns={[
                {
                  key: "book_title",
                  header: "Ouvrage",
                  cell: (stmt) => (
                    <div>
                      <p className="font-bold text-navy">{stmt.book_title as string}</p>
                      <p className="text-[10px] text-foreground-muted">Réf : {stmt.id as string}</p>
                    </div>
                  ),
                },
                {
                  key: "sales_count",
                  header: "Ventes",
                  className: "text-center",
                  cell: (stmt) => <span className="text-foreground-muted">{stmt.sales_count as number} ex.</span>,
                  hideOnMobile: true,
                },
                {
                  key: "downloads_count",
                  header: "Lectures Bouquet",
                  className: "text-center",
                  cell: (stmt) => <span className="text-foreground-muted">{stmt.downloads_count as number}</span>,
                  hideOnMobile: true,
                },
                {
                  key: "amount",
                  header: "Montant de droits",
                  className: "text-center",
                  cell: (stmt) => (
                    <span className="font-bold text-navy">
                      {(stmt.amount as number).toLocaleString()} {stmt.currency as string}
                    </span>
                  ),
                },
                {
                  key: "status",
                  header: "Période / Statut",
                  cell: (stmt) => (
                    <div className="flex flex-col items-center gap-1.5">
                      <span className="text-xs text-foreground-muted">{stmt.statement_period as string}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${(stmt.status as string) === "paid" ? "bg-success/10 text-success border border-success/20" : "bg-warning/10 text-warning border border-warning/20"}`}>
                        {(stmt.status as string) === "paid" ? "Payé" : "En cours"}
                      </span>
                    </div>
                  ),
                },
              ]}
              mobileCard={(stmt) => (
                <div className="space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <p className="font-bold text-navy text-sm">{stmt.book_title as string}</p>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${(stmt.status as string) === "paid" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
                      {(stmt.status as string) === "paid" ? "Payé" : "En cours"}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-foreground-muted">
                    <span>Ventes : {stmt.sales_count as number} ex.</span>
                    <span>Lectures : {stmt.downloads_count as number}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-border/40 text-xs">
                    <span className="text-foreground-muted">{stmt.statement_period as string}</span>
                    <span className="font-bold text-navy">{(stmt.amount as number).toLocaleString()} {stmt.currency as string}</span>
                  </div>
                </div>
              )}
            />
          </div>
        </div>

        {/* Right: Active Publishing Contracts */}
        <div className="lg:col-span-4 space-y-4">
          <h3 className="font-serif text-lg font-bold text-navy flex items-center gap-2">
            <FileText className="w-5 h-5 text-gold" />
            Vos contrats d'édition
          </h3>

          {loading ? (
            <div className="p-6 space-y-4 animate-pulse bg-background border border-border rounded-xl">
              <div className="h-12 bg-background-secondary rounded" />
            </div>
          ) : contracts.length === 0 ? (
            <div className="p-8 text-center text-xs text-foreground-muted bg-background border border-border rounded-xl">
              Aucun contrat actif enregistré.
            </div>
          ) : (
            <div className="space-y-4">
              {contracts.map((ctr) => (
                <div key={ctr.id} className="bg-background border border-border p-5 rounded-xl shadow-sm space-y-4 hover:border-gold/30 transition-colors">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-navy-light text-navy">{ctr.reference}</span>
                      <div className="flex items-center gap-0.5 text-xs font-bold text-gold">
                        <Percent className="w-3.5 h-3.5" />
                        <span>{ctr.royalty_rate}%</span>
                      </div>
                    </div>
                    <h4 className="font-serif font-bold text-navy text-sm leading-snug">{ctr.book_title}</h4>
                    <p className="text-[10px] text-foreground-muted">
                      Signé le {new Date(ctr.signed_at).toLocaleDateString("fr-FR")}
                    </p>
                  </div>

                  <a
                    href={ctr.contract_file}
                    download
                    className="w-full py-2 bg-background-secondary border border-border hover:border-navy text-navy text-xs font-bold rounded shadow-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <Download className="w-3.5 h-3.5 text-navy" />
                    Télécharger le Contrat PDF
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
