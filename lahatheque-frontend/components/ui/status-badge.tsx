import * as React from "react";
import { cn } from "@/lib/utils";

const statusStyles = {
  success: "bg-success/10 text-success border-success/20",
  error: "bg-error/10 text-error border-error/20",
  warning: "bg-gold/10 text-gold border-gold/20",
  default: "bg-background-secondary text-foreground-muted border-border",
};

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status?: keyof typeof statusStyles;
  leftIcon?: React.ElementType;
  rightIcon?: React.ElementType;
  leftLabel: React.ReactNode;
  rightLabel?: React.ReactNode;
}

export function StatusBadge({
  className,
  status = "default",
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  leftLabel,
  rightLabel,
  ...props
}: StatusBadgeProps) {
  return (
    <span 
      className={cn(
        "inline-flex items-center gap-x-2 rounded-full px-2.5 py-1 text-[11px] font-bold border transition-colors",
        statusStyles[status],
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
