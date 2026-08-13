"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GraduationCap } from "lucide-react";

export default function StudentAffiliationsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/librarian/catalog");
  }, [router]);

  return (
    <div className="p-8 text-center space-y-4">
      <GraduationCap className="w-10 h-10 text-gold mx-auto animate-bounce" />
      <h2 className="font-serif font-bold text-navy text-lg">Redirection vers Mon Catalogue Établissement...</h2>
      <p className="text-xs text-foreground-muted">
        Le catalogue et les facultés rattachées sont désormais disponibles sur la page Mon Catalogue.
      </p>
      <Link href="/librarian/catalog" className="text-xs font-bold text-gold hover:underline block">
        Cliquez ici si la redirection ne s&apos;effectue pas automatiquement.
      </Link>
    </div>
  );
}
