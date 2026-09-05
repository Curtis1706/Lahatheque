"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getAuthorRoyaltyPayments } from "@/lib/services/author";
import type { AuthorRoyaltyPayment } from "@/lib/types/author";
import {
  ArrowLeft,
  DollarSign,
  Download,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";

export default function RoyaltyStatementDetailPage() {
  const params = useParams();
  const paymentId = (params?.id as string) || "pay-aut-2025-q2";

  const [payment, setPayment] = useState<AuthorRoyaltyPayment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStatement() {
      try {
        setLoading(true);
        const stmts = await getAuthorRoyaltyPayments();
        const found = stmts.find((s) => s.id === paymentId) || stmts[0];
        setPayment(found);
      } catch (err) {
        console.error("Erreur de chargement du relevé de droits", err);
      } finally {
        setLoading(false);
      }
    }
    loadStatement();
  }, [paymentId]);

  if (loading || !payment) {
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
          <StatusBadge status={payment.status} />
          <span className="text-xs font-bold text-navy">{payment.period}</span>
        </div>
        <h1 className="font-serif text-2xl lg:text-3xl font-bold text-navy pt-1">
          Relevé Officiel de Droits d&apos;Auteur #{payment.id}
        </h1>
      </div>

      {/* Carte du Relevé Officiel Exportable */}
      <div className="bg-background border border-border p-6 sm:p-8 rounded-3xl space-y-6 shadow-xs relative overflow-hidden">
        {/* Entête Éditorial LAHA */}
        <div className="flex items-center justify-between border-b border-border pb-6">
          <div className="space-y-1">
            <span className="text-xs font-bold text-gold uppercase tracking-wider">LAHA Éditions • Relevé de Redevances (Part Propre Auteur)</span>
            <h2 className="font-serif font-bold text-navy text-xl">{payment.period}</h2>
          </div>
          <button
            type="button"
            onClick={async () => {
              try {
                const { generateOfficialPdf } = await import("@/lib/services/export-service");
                await generateOfficialPdf({
                  docType: "BORDEREAU_REDEVANCES",
                  docNumber: `REL-AUTEUR-${payment.id.slice(0, 8).toUpperCase()}`,
                  date: payment.payment_date || new Date().toLocaleDateString("fr-FR"),
                  period: payment.period,
                  recipient: {
                    name: "Auteur / Créateur d'Ouvrage",
                    roleOrTitle: "Titulaire de Droits d'Auteur LAHAThèque",
                    addressOrCampus: "Compte Auteur Agréé",
                    emailOrPhone: "auteur@lahatheque.bj",
                  },
                  summaryCards: [
                    { label: "Trimestre / Période", value: payment.period },
                    { label: "Ventes Trimestrielles", value: `${payment.total_sales_count.toLocaleString("fr-FR")} exemplaires` },
                    { label: "Taux de Rétribution", value: `${payment.author_percentage_rate} % (Droits)` },
                    { label: "Statut Règlement", value: payment.status === "paid" ? "Payé" : "En cours" },
                  ],
                  tableHeaders: [
                    "Période Trimestrielle",
                    "Volume Ventes",
                    "Revenus Bruts (HT)",
                    "Quote-part Auteur (15%)",
                    "Statut",
                  ],
                  tableRows: [
                    [
                      payment.period,
                      `${payment.total_sales_count.toLocaleString("fr-FR")} ex.`,
                      `${payment.gross_revenue.toLocaleString("fr-FR")} XOF`,
                      `${payment.author_earned_amount.toLocaleString("fr-FR")} XOF`,
                      payment.status === "paid" ? "Versé" : "En attente",
                    ],
                  ],
                  totalAmount: `${payment.author_earned_amount.toLocaleString("fr-FR")} XOF`,
                  totalNotes:
                    "Relevé officiel certifié par LAHAThèque Éditions & Numérique S.A.",
                  filename: `releve_droits_${payment.period.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`,
                });
              } catch {
                // Ignore
              }
            }}
            className="px-4 py-2.5 rounded-xl bg-navy text-white text-xs font-semibold hover:bg-navy-hover transition-colors inline-flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4 text-gold" />
            Télécharger le relevé PDF
          </button>
        </div>

        {/* Détail du Calcul des Droits (Section 3.4.1) */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-navy">
            Détail des Calculs de la Période ({payment.period})
          </h3>

          <div className="bg-background-secondary p-5 rounded-2xl border border-border space-y-3 text-xs">
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-foreground-muted">Nombre de ventes comptabilisées</span>
              <strong className="text-navy font-bold">{payment.total_sales_count} exemplaires</strong>
            </div>

            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-foreground-muted">Revenus bruts générés</span>
              <strong className="text-navy font-bold">{payment.gross_revenue.toLocaleString("fr-FR")} XOF</strong>
            </div>

            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-foreground-muted">Part de droits contractuelle (Taux d&apos;auteur)</span>
              <strong className="text-gold font-bold">{payment.author_percentage_rate}%</strong>
            </div>

            <div className="flex justify-between text-sm font-bold pt-1">
              <span className="text-navy font-serif">Net à payer à l&apos;auteur (Part Propre)</span>
              <span className="text-gold font-serif text-lg">{payment.author_earned_amount.toLocaleString("fr-FR")} XOF</span>
            </div>
          </div>
        </div>

        {/* Pied de page du Relevé */}
        <div className="pt-4 border-t border-border flex items-center justify-between text-xs text-foreground-muted">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-gold" />
            Vérifié par le service juridique LAHA Éditions
          </span>
          <span>Date de versement : {payment.payment_date}</span>
        </div>
      </div>
    </div>
  );
}
