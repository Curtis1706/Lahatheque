import { notFound } from "next/navigation";

// Désactivé : La gestion et la validation des dépôts éditeurs tiers sont
// exclusivement réservées à l'Espace Administration (/admin/publisher-deposits).
// Cette page est retirée du périmètre Chef Maquettiste.
export default function ChiefLayoutPublisherDepositsPage() {
  notFound();
}

/*
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export default function ChiefLayoutPublisherDepositsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/chief-layout");
  }, [router]);

  return (
    <div className="p-8 text-center space-y-4 max-w-md mx-auto my-12 bg-background-secondary rounded-2xl border border-border">
      <ShieldAlert className="w-10 h-10 text-gold mx-auto" />
      <h2 className="font-serif font-bold text-navy text-lg">Espace réservé à l'Administration</h2>
      <p className="text-xs text-foreground-muted">
        La gestion et la validation des dépôts éditeurs tiers sont exclusivement gérées par l'Administration.
      </p>
      <Link href="/chief-layout" className="text-xs font-bold text-navy hover:text-gold transition-colors inline-block mt-2">
        Retour à la vue d'ensemble
      </Link>
    </div>
  );
}
*/

