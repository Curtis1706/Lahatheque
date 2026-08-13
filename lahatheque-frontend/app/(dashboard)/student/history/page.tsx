"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookOpen } from "lucide-react";

export default function StudentHistoryPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/student/books");
  }, [router]);

  return (
    <div className="p-8 text-center space-y-4">
      <BookOpen className="w-10 h-10 text-gold mx-auto animate-bounce" />
      <h2 className="font-serif font-bold text-navy text-lg">Redirection vers Ma Bibliothèque...</h2>
      <p className="text-xs text-foreground-muted">
        Votre bibliothèque et vos lectures en cours sont désormais centralisées sur la page Ma Bibliothèque.
      </p>
      <Link href="/student/books" className="text-xs font-bold text-gold hover:underline block">
        Cliquez ici si la redirection ne s&apos;effectue pas automatiquement.
      </Link>
    </div>
  );
}
