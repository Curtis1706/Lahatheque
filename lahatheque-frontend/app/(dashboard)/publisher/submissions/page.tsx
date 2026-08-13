"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookOpen } from "lucide-react";

export default function SubmissionsListPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/publisher/catalog");
  }, [router]);

  return (
    <div className="p-8 text-center space-y-4">
      <BookOpen className="w-10 h-10 text-gold mx-auto animate-bounce" />
      <h2 className="font-serif font-bold text-navy text-lg">Redirection vers Mon Catalogue...</h2>
      <p className="text-xs text-foreground-muted">
        La gestion du catalogue et des dépôts est désormais accessible sur la page Mon Catalogue.
      </p>
      <Link href="/publisher/catalog" className="text-xs font-bold text-gold hover:underline block">
        Cliquez ici si la redirection ne s&apos;effectue pas automatiquement.
      </Link>
    </div>
  );
}
