"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckSquare } from "lucide-react";

export default function LayoutValidationPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/chief-layout/validation");
  }, [router]);

  return (
    <div className="p-8 text-center space-y-4">
      <CheckSquare className="w-10 h-10 text-gold mx-auto animate-bounce" />
      <h2 className="font-serif font-bold text-navy text-lg">Redirection vers l&apos;Espace Chef Maquettiste...</h2>
      <p className="text-xs text-foreground-muted">
        La validation des dépôts est désormais gérée dans l&apos;espace Chef Maquettiste.
      </p>
      <Link href="/chief-layout/validation" className="text-xs font-bold text-gold hover:underline block">
        Cliquez ici si la redirection ne s&apos;effectue pas automatiquement.
      </Link>
    </div>
  );
}
