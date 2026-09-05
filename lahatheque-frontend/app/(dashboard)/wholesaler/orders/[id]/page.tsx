"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, PackageCheck, Download, FileText, AlertTriangle, ShieldCheck, XCircle, RotateCcw, Clock, Calendar, CheckCircle2 } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { OrderTimeline } from "@/components/features/wholesaler/order-timeline";
import { CancelOrderModal } from "@/components/features/wholesaler/cancel-order-modal";
import { getWholesalerOrderDetail, requestOrderCancellation, returnWholesaleCreditOrder } from "@/lib/services/wholesaler";
import type { WholesalerOrder } from "@/lib/types/wholesaler";
import { toast } from "sonner";
import { Modal } from "@/components/ui/modal";
import { generateOfficialPdf } from "@/lib/services/export-service";

export default function WholesalerOrderDetailPage() {
  const params = useParams();
  const orderId = (params?.id as string) || "";
  const [order, setOrder] = useState<WholesalerOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  // ─── FONCTIONNALITÉ COMMANDE À CRÉDIT GROSSISTE (DÉPÔT / RETOUR INVENDUS) ───
  // Architecture prête pour affichage visuel dès instruction de l'utilisateur.
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnReason, setReturnReason] = useState("");
  const [returning, setReturning] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    async function loadData() {
      setLoading(true);
      try {
        const data = await getWholesalerOrderDetail(orderId);
        setOrder(data);
      } catch (err) {
        console.error("Erreur de chargement du détail de la commande", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [orderId]);

  const handleConfirmCancel = async (orderId: string, reason: string) => {
    const success = await requestOrderCancellation(orderId, reason);
    if (success) {
      setOrder((prev) =>
        prev ? { ...prev, status: "cancelled", cancel_requested: true, cancel_reason: reason } : prev
      );
      toast.success("La demande d'annulation de la commande a été enregistrée avec succès.");
    } else {
      toast.error("Impossible d'annuler cette commande.");
    }
  };

  // ─── Handler de retour d'invendus pour commande à crédit grossiste ──────────
  const handleReturnCredit = async () => {
    if (!order) return;
    setReturning(true);
    try {
      const success = await returnWholesaleCreditOrder(order.id, returnReason);
      if (success) {
        setOrder((prev) =>
          prev
            ? {
                ...prev,
                status: "cancelled",
                returned_at: new Date().toISOString(),
                return_reason: returnReason || "Retour d'invendus fin de dépôt",
              }
            : prev
        );
        toast.success("Retour des exemplaires invendus enregistré avec succès.");
        setReturnModalOpen(false);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur lors du retour de la commande.");
    } finally {
      setReturning(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 space-y-4 max-w-4xl mx-auto animate-pulse">
        <div className="h-8 bg-background-secondary rounded w-1/3" />
        <div className="h-64 bg-background-secondary rounded-3xl" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-8 text-center space-y-4 max-w-md mx-auto">
        <h2 className="font-serif font-bold text-navy text-lg">Commande introuvable</h2>
        <Link href="/wholesaler/orders" className="text-xs font-bold text-gold hover:underline block">
          Retour aux Commandes
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 max-w-6xl mx-auto animate-in fade-in duration-300">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/wholesaler" className="hover:text-navy">Vue d&apos;ensemble</Link>
        <span>/</span>
        <Link href="/wholesaler/orders" className="hover:text-navy">Commandes</Link>
        <span>/</span>
        <span className="text-navy font-semibold">{order.reference}</span>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/wholesaler/orders" className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-2">
            <ArrowLeft className="w-3.5 h-3.5" />
            Retour à la Liste des Commandes
          </Link>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-xs text-gold">{order.reference}</span>
            <StatusBadge status={order.status} />
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy mt-1 leading-snug">
            Commande Groupée — {order.company_name}
          </h1>
          <p className="text-xs text-foreground-muted mt-1">
            Déposée le {new Date(order.created_at).toLocaleString("fr-FR")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={async () => {
              try {
                const orderRef = order.reference || `#CMD-GROS-${order.id.slice(0, 8).toUpperCase()}`;
                const totalVol = (order.total_digital_licenses || 0) + (order.total_print_copies || 0);
                await generateOfficialPdf({
                  docType: "BON_COMMANDE",
                  docNumber: orderRef,
                  date: new Date(order.created_at).toLocaleDateString("fr-FR"),
                  recipient: {
                    name: order.company_name || "Établissement Grossiste Partenaire",
                    roleOrTitle: "Grossiste Commercial Agréé",
                    addressOrCampus: order.delivery_address || "Livraison Réseau Grossiste",
                    emailOrPhone: order.contact_phone || "grossiste@lahatheque.bj",
                  },
                  summaryCards: [
                    { label: "Volume Total", value: `${totalVol} ex. commandés` },
                    { label: "Numérique / Papier", value: `${order.total_digital_licenses || 0} num. / ${order.total_print_copies || 0} pap.` },
                    { label: "Statut Commande", value: order.status.toUpperCase() },
                  ],
                  tableHeaders: ["Réf.", "Titre de l'Ouvrage", "ISBN", "Qté Num.", "Prix Num.", "Qté Pap.", "Prix Pap.", "Sous-Total"],
                  tableRows: order.items.map((i, idx) => [
                    `SKU-${idx + 1}`,
                    i.title,
                    i.isbn || "—",
                    `${i.digital_licenses_qty} lic.`,
                    `${i.digital_unit_price.toLocaleString("fr-FR")} F`,
                    `${i.print_copies_qty} ex.`,
                    `${i.print_unit_price.toLocaleString("fr-FR")} F`,
                    `${Number(i.subtotal).toLocaleString("fr-FR")} FCFA`,
                  ]),
                  totalAmount: `${Number(order.total_amount).toLocaleString("fr-FR")} ${order.currency || "FCFA"}`,
                  totalNotes: `Bon de Commande & Facture Proforma Grossiste. Conditions de règlement : Net à 30 jours pour commande à crédit validée.`,
                  filename: `proforma_grossiste_${order.reference || order.id.slice(0, 8)}.pdf`,
                });
                toast.success("Facture proforma PDF officielle générée et téléchargée !");
              } catch {
                toast.error("Erreur lors de la génération de la facture proforma.");
              }
            }}
            className="px-3.5 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors inline-flex items-center gap-2 shadow-xs min-h-[44px] cursor-pointer"
          >
            <Download className="w-4 h-4 text-gold" />
            Télécharger Facture Proforma PDF
          </button>

          {order.status !== "delivered" && order.status !== "cancelled" && (
            <button
              type="button"
              onClick={() => setCancelModalOpen(true)}
              className="px-3.5 py-2.5 rounded-xl bg-background-secondary border border-rose-500/30 text-rose-600 text-xs font-bold hover:bg-rose-500/10 transition-colors inline-flex items-center gap-2 min-h-[44px] cursor-pointer"
            >
              <XCircle className="w-4 h-4" />
              Demander l&apos;Annulation
            </button>
          )}
        </div>
      </div>

      {/* Timeline de Suivi 21st.dev Order History (id: 7710) */}
      <OrderTimeline status={order.status} timeline={order.timeline} />

      {/* Rejet / Motif d'annulation */}
      {order.cancel_reason && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-700 space-y-1">
          <p className="font-bold flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            Motif d&apos;Annulation de la Commande :
          </p>
          <p className="italic">&ldquo;{order.cancel_reason}&rdquo;</p>
        </div>
      )}

      {/* Tableau Facture / Articles 21st.dev Invoice History Table (id: 22187) */}
      <div className="p-6 rounded-3xl bg-background border border-border space-y-4 shadow-xs text-xs">
        <h3 className="font-serif font-bold text-navy text-sm uppercase tracking-wider border-b border-border pb-2">
          Détail des Articles &amp; Répartition Financière
        </h3>

        <div className="space-y-3">
          {order.items.map((item, idx) => (
            <div key={idx} className="p-4 rounded-2xl bg-background-secondary border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="font-serif font-bold text-navy text-xs">{item.title}</p>
                <p className="text-[10px] text-foreground-muted font-mono">ISBN: {item.isbn}</p>
                <p className="text-[10px] text-foreground-muted">Auteurs: {item.authors.join(", ")}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-right">
                <div>
                  <span className="text-[10px] text-foreground-muted block font-bold">Licences Numériques</span>
                  <span className="font-mono font-bold text-navy">{item.digital_licenses_qty} x {item.digital_unit_price.toLocaleString("fr-FR")} XOF</span>
                </div>
                <div>
                  <span className="text-[10px] text-foreground-muted block font-bold">Exemplaires Papier</span>
                  <span className="font-mono font-bold text-navy">{item.print_copies_qty} x {item.print_unit_price.toLocaleString("fr-FR")} XOF</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Total */}
        <div className="p-4 rounded-2xl bg-navy/5 border border-navy/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <span className="font-bold text-navy block">Adresse de Livraison :</span>
            <span className="text-foreground-muted">{order.delivery_address} (Contact : {order.contact_phone})</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-foreground-muted uppercase font-bold block">Montant Total Réglé / Dû</span>
            <span className="font-mono font-bold text-gold text-lg">{order.total_amount.toLocaleString("fr-FR")} {order.currency}</span>
          </div>
        </div>
      </div>

      {/* Modale d'annulation standard */}
      <CancelOrderModal
        orderId={order.id}
        orderReference={order.reference}
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onConfirmCancel={handleConfirmCancel}
      />

      {/* 
        ─── MODALE DE RETOUR D'INVENDUS / COMMANDE À CRÉDIT GROSSISTE ──────────
        Pour activer la modale de retour d'invendus grossiste, décommenter le bloc ci-dessous :
        
        <Modal
          open={returnModalOpen}
          onClose={() => setReturnModalOpen(false)}
          title={
            <div className="flex items-center gap-2 text-navy font-bold text-base">
              <RotateCcw className="w-5 h-5 text-gold" />
              Retour des Exemplaires Invendus (Dépôt #{order.reference})
            </div>
          }
          maxWidth={500}
        >
          <div className="space-y-4 pt-2 text-xs">
            <p className="text-foreground-muted">
              Vous êtes sur le point d'enregistrer le retour des exemplaires physiques invendus de cette commande en dépôt à crédit. Le stock réservé sera automatiquement réintégré.
            </p>
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-navy">
                Motif ou observations de retour :
              </label>
              <textarea
                rows={3}
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                placeholder="Ex: Fin de la période de dépôt, invendus réexpédiés au siège..."
                className="w-full p-2.5 rounded-xl bg-background border border-border text-navy text-xs focus:outline-none focus:border-gold"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setReturnModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-background-secondary border border-border text-foreground-muted text-xs font-bold hover:text-navy cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={returning}
                onClick={handleReturnCredit}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors cursor-pointer disabled:opacity-50"
              >
                {returning ? "Enregistrement..." : "Confirmer le Retour d'Invendus"}
              </button>
            </div>
          </div>
        </Modal>
      */}
    </div>
  );
}
