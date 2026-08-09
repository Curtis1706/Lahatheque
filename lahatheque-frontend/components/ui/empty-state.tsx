/**
 * EmptyState — composant composable d'état vide
 * Adapté de cnippet.dev/cnippet-empty (21st.dev #19746)
 * Tokenisé pour LAHAThèque (globals.css). Dépendance-free (juste cn).
 */
import * as React from "react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

// ─── Root ─────────────────────────────────────────────────────────────────────
export function EmptyState({
  className,
  ...props
}: React.ComponentProps<"div">): React.ReactElement {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 flex-col items-center justify-center gap-6",
        "text-balance px-6 py-12 text-center md:py-16",
        className
      )}
      data-slot="empty"
      {...props}
    />
  );
}

// ─── Media / Icon container ───────────────────────────────────────────────────
export function EmptyIcon({
  icon: Icon,
  className,
}: {
  icon: LucideIcon;
  className?: string;
}): React.ReactElement {
  return (
    <div
      className={cn(
        "w-14 h-14 rounded-2xl bg-background-secondary border border-border",
        "flex items-center justify-center text-navy shadow-sm mb-2",
        className
      )}
      aria-hidden="true"
    >
      <Icon className="w-7 h-7" />
    </div>
  );
}

// ─── Title ────────────────────────────────────────────────────────────────────
export function EmptyTitle({
  className,
  ...props
}: React.ComponentProps<"p">): React.ReactElement {
  return (
    <p
      className={cn(
        "font-serif font-semibold text-base text-navy",
        className
      )}
      data-slot="empty-title"
      {...props}
    />
  );
}

// ─── Description ─────────────────────────────────────────────────────────────
export function EmptyDescription({
  className,
  ...props
}: React.ComponentProps<"p">): React.ReactElement {
  return (
    <p
      className={cn("text-sm text-foreground-muted max-w-xs", className)}
      data-slot="empty-description"
      {...props}
    />
  );
}

// ─── Actions ─────────────────────────────────────────────────────────────────
export function EmptyActions({
  className,
  ...props
}: React.ComponentProps<"div">): React.ReactElement {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-center justify-center gap-3 mt-2",
        className
      )}
      data-slot="empty-actions"
      {...props}
    />
  );
}

// ─── Convenience default export ───────────────────────────────────────────────
export default EmptyState;
