"use client";

import { Loader } from "@/components/ui/loader";

export function PageLoader({ label = "Chargement en cours" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <Loader variant="dots" size={28} label={label} />
      <p className="text-xs text-foreground-muted">{label}...</p>
    </div>
  );
}

export function InlineLoader({ size = 16 }: { size?: number }) {
  return <Loader variant="dots" size={size} label="Chargement" />;
}
