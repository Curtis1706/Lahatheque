"use client";

/**
 * Redirection de l'ancienne route /student/audio/[id] vers la route universelle /listen/[id].
 */

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { InlineLoader } from "@/components/ui/page-loader";

export default function StudentAudioRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const bookId = params?.id as string;

  useEffect(() => {
    if (bookId) {
      router.replace(`/listen/${bookId}`);
    }
  }, [bookId, router]);

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 p-12 text-center">
      <InlineLoader size={36} />
      <p className="text-xs text-foreground-muted font-medium">
        Redirection vers le lecteur audio...
      </p>
    </div>
  );
}
