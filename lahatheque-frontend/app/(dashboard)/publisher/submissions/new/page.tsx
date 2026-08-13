"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PlusCircle } from "lucide-react";

export default function NewSubmissionPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/publisher/catalog/new");
  }, [router]);

  return (
    <div className="p-8 text-center space-y-4">
      <PlusCircle className="w-10 h-10 text-gold mx-auto animate-bounce" />
      <h2 className="font-serif font-bold text-navy text-lg">Redirection vers Nouveau Dépôt Web...</h2>
      <p className="text-xs text-foreground-muted">
        Le formulaire de dépôt d&apos;ouvrage en 6 blocs est désormais disponible sur la page Nouveau Dépôt.
      </p>
      <Link href="/publisher/catalog/new" className="text-xs font-bold text-gold hover:underline block">
        Cliquez ici si la redirection ne s&apos;effectue pas automatiquement.
      </Link>
    </div>
  );
}
