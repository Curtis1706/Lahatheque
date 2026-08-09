import * as React from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, Clock, XCircle, FileText, AlertCircle } from "lucide-react";

const statusConfig: Record<string, { style: string; defaultLabel: string; defaultIcon: React.ElementType }> = {
  success: { style: "bg-success/10 text-success border-success/20", defaultLabel: "Succès", defaultIcon: CheckCircle2 },
  approved: { style: "bg-success/10 text-success border-success/20", defaultLabel: "Approuvé", defaultIcon: CheckCircle2 },
  validated: { style: "bg-success/10 text-success border-success/20", defaultLabel: "Validé", defaultIcon: CheckCircle2 },
  active: { style: "bg-success/10 text-success border-success/20", defaultLabel: "Actif", defaultIcon: CheckCircle2 },

  error: { style: "bg-error/10 text-error border-error/20", defaultLabel: "Erreur", defaultIcon: XCircle },
  rejected: { style: "bg-error/10 text-error border-error/20", defaultLabel: "Rejeté", defaultIcon: XCircle },
  refused: { style: "bg-error/10 text-error border-error/20", defaultLabel: "Refusé", defaultIcon: XCircle },

  warning: { style: "bg-gold/10 text-gold border-gold/20", defaultLabel: "Attention", defaultIcon: Clock },
  pending: { style: "bg-gold/10 text-gold border-gold/20", defaultLabel: "En attente", defaultIcon: Clock },
  in_review: { style: "bg-gold/10 text-gold border-gold/20", defaultLabel: "En cours d'examen", defaultIcon: Clock },

  draft: { style: "bg-background-secondary text-foreground-muted border-border", defaultLabel: "Brouillon", defaultIcon: FileText },
  default: { style: "bg-background-secondary text-foreground-muted border-border", defaultLabel: "Neutre", defaultIcon: AlertCircle },
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
