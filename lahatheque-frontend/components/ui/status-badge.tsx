import * as React from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, Clock, XCircle, FileText, AlertCircle, Package, Truck, AlertTriangle, ArrowUpCircle } from "lucide-react";

const statusConfig: Record<string, { style: string; defaultLabel: string; defaultIcon: React.ElementType }> = {
  success: { style: "bg-success/10 text-success border-success/20", defaultLabel: "Succès", defaultIcon: CheckCircle2 },
  approved: { style: "bg-success/10 text-success border-success/20", defaultLabel: "Approuvé", defaultIcon: CheckCircle2 },
  validated: { style: "bg-success/10 text-success border-success/20", defaultLabel: "Validé", defaultIcon: CheckCircle2 },
  published: { style: "bg-success/10 text-success border-success/20", defaultLabel: "Publié", defaultIcon: CheckCircle2 },
  paid: { style: "bg-success/10 text-success border-success/20", defaultLabel: "Payé", defaultIcon: CheckCircle2 },
  completed: { style: "bg-success/10 text-success border-success/20", defaultLabel: "Terminé", defaultIcon: CheckCircle2 },
  active: { style: "bg-success/10 text-success border-success/20", defaultLabel: "Actif", defaultIcon: CheckCircle2 },

  error: { style: "bg-error/10 text-error border-error/20", defaultLabel: "Erreur", defaultIcon: XCircle },
  rejected: { style: "bg-error/10 text-error border-error/20", defaultLabel: "Rejeté", defaultIcon: XCircle },
  refused: { style: "bg-error/10 text-error border-error/20", defaultLabel: "Refusé", defaultIcon: XCircle },
  failed: { style: "bg-error/10 text-error border-error/20", defaultLabel: "Échoué", defaultIcon: XCircle },
  cancelled: { style: "bg-error/10 text-error border-error/20", defaultLabel: "Annulé", defaultIcon: XCircle },

  warning: { style: "bg-gold/10 text-gold border-gold/20", defaultLabel: "Attention", defaultIcon: Clock },
  pending: { style: "bg-gold/10 text-gold border-gold/20", defaultLabel: "En attente", defaultIcon: Clock },
  pending_admin_approval: { style: "bg-gold/10 text-gold border-gold/20", defaultLabel: "En attente", defaultIcon: Clock },
  in_review: { style: "bg-gold/10 text-gold border-gold/20", defaultLabel: "En cours d'examen", defaultIcon: Clock },
  under_review: { style: "bg-gold/10 text-gold border-gold/20", defaultLabel: "En cours d'examen", defaultIcon: Clock },
  expiring_soon: { style: "bg-gold/10 text-gold border-gold/20", defaultLabel: "Expire bientôt", defaultIcon: Clock },

  refunded: { style: "bg-info/10 text-info border-info/20", defaultLabel: "Remboursé", defaultIcon: ArrowUpCircle },
  processing: { style: "bg-info/10 text-info border-info/20", defaultLabel: "En traitement", defaultIcon: Clock },
  submitted: { style: "bg-info/10 text-info border-info/20", defaultLabel: "Soumis", defaultIcon: FileText },

  draft: { style: "bg-background-secondary text-foreground-muted border-border", defaultLabel: "Brouillon", defaultIcon: FileText },
  expired: { style: "bg-background-secondary text-foreground-muted border-border", defaultLabel: "Expiré", defaultIcon: Clock },
  inactive: { style: "bg-background-secondary text-foreground-muted border-border", defaultLabel: "Inactif", defaultIcon: AlertCircle },
  default: { style: "bg-background-secondary text-foreground-muted border-border", defaultLabel: "Neutre", defaultIcon: AlertCircle },

  // ─── Statuts Gestionnaire — Stock ───────────────────────────────────────────
  normal: { style: "bg-success/10 text-success border-success/20", defaultLabel: "Stock normal", defaultIcon: CheckCircle2 },
  low_stock: { style: "bg-gold/10 text-gold border-gold/20", defaultLabel: "Seuil bas", defaultIcon: AlertTriangle },
  out_of_stock: { style: "bg-error/10 text-error border-error/20", defaultLabel: "Rupture", defaultIcon: XCircle },

  // ─── Statuts Gestionnaire — Livraison ───────────────────────────────────────
  to_ship: { style: "bg-gold/10 text-gold border-gold/20", defaultLabel: "À expédier", defaultIcon: Package },
  en_preparation: { style: "bg-gold/10 text-gold border-gold/20", defaultLabel: "En préparation", defaultIcon: Package },
  shipped: { style: "bg-info/10 text-info border-info/20", defaultLabel: "Expédiée", defaultIcon: Truck },
  expedie: { style: "bg-info/10 text-info border-info/20", defaultLabel: "Expédiée", defaultIcon: Truck },
  delivered: { style: "bg-success/10 text-success border-success/20", defaultLabel: "Livrée", defaultIcon: CheckCircle2 },
  livre: { style: "bg-success/10 text-success border-success/20", defaultLabel: "Livrée", defaultIcon: CheckCircle2 },

  // ─── Statuts Gestionnaire — Coordination ────────────────────────────────────
  not_escalated: { style: "bg-background-secondary text-foreground-muted border-border", defaultLabel: "Non signalée", defaultIcon: AlertCircle },
  escalated: { style: "bg-gold/10 text-gold border-gold/20", defaultLabel: "Signalée", defaultIcon: ArrowUpCircle },
  reported: { style: "bg-gold/10 text-gold border-gold/20", defaultLabel: "Signalée", defaultIcon: ArrowUpCircle },
  acknowledged: { style: "bg-info/10 text-info border-info/20", defaultLabel: "Prise en compte", defaultIcon: CheckCircle2 },
  resolved: { style: "bg-success/10 text-success border-success/20", defaultLabel: "Résolue", defaultIcon: CheckCircle2 },

  // ─── Statuts Mouvements Stock ───────────────────────────────────────────────
  restock: { style: "bg-success/10 text-success border-success/20", defaultLabel: "Réassort", defaultIcon: Package },
  reassort_imprimerie: { style: "bg-success/10 text-success border-success/20", defaultLabel: "Réassort Tirage", defaultIcon: Package },
  sale: { style: "bg-info/10 text-info border-info/20", defaultLabel: "Vente", defaultIcon: Package },
  transfert_inter_hub: { style: "bg-info/10 text-info border-info/20", defaultLabel: "Transfert Inter-Hub", defaultIcon: Package },
  return: { style: "bg-gold/10 text-gold border-gold/20", defaultLabel: "Retour", defaultIcon: Package },
  damage: { style: "bg-error/10 text-error border-error/20", defaultLabel: "Endommagé", defaultIcon: XCircle },
  adjustment: { style: "bg-gold/10 text-gold border-gold/20", defaultLabel: "Ajustement", defaultIcon: AlertTriangle },
  destruction_perte: { style: "bg-error/10 text-error border-error/20", defaultLabel: "Passation en Perte", defaultIcon: AlertTriangle },
  manual_exit: { style: "bg-error/10 text-error border-error/20", defaultLabel: "Sortie Manuelle", defaultIcon: AlertTriangle },
  correction: { style: "bg-background-secondary text-foreground-muted border-border", defaultLabel: "Correction", defaultIcon: FileText },
};

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status?: string;
  leftIcon?: React.ElementType;
  rightIcon?: React.ElementType;
  leftLabel?: React.ReactNode;
  rightLabel?: React.ReactNode;
}

export function StatusBadge({
  className,
  status = "default",
  leftIcon: LeftIconProp,
  rightIcon: RightIcon,
  leftLabel: LeftLabelProp,
  rightLabel,
  ...props
}: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.default;
  const LeftIcon = LeftIconProp || config.defaultIcon;
  const leftLabel = LeftLabelProp || config.defaultLabel;

  return (
    <span 
      className={cn(
        "inline-flex items-center gap-x-2 rounded-full px-2.5 py-1 text-[11px] font-bold border transition-colors whitespace-nowrap",
        config.style,
        className
      )} 
      {...props}
    >
      <span className="inline-flex items-center gap-1.5 font-medium">
        {LeftIcon && (
          <LeftIcon 
            className="size-3.5 shrink-0" 
            aria-hidden="true"
          />
        )}
        {leftLabel}
      </span>
      {rightLabel && (
        <>
          <span className="h-3 w-px bg-current opacity-30" />
          <span className="inline-flex items-center gap-1.5">
            {RightIcon && (
              <RightIcon 
                className="size-3.5 shrink-0" 
                aria-hidden="true"
              />
            )}
            {rightLabel}
          </span>
        </>
      )}
    </span>
  );
}
