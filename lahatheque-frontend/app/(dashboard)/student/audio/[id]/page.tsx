"use client";

/**
 * Page Dédiée de Lecture Audio Immersive pour l'Étudiant (/student/audio/[id]).
 * Charge la session de streaming HLS et affiche la carte audio haute fidélité.
 * Zéro emoji, typage strict TypeScript.
 */

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, Headphones } from "lucide-react";
import { LahathequeAudioPlayerCard } from "@/components/features/audio/lahatheque-audio-player-card";
import { useAudioPlayer } from "@/components/features/audio/audio-player-context";
import { InlineLoader } from "@/components/ui/page-loader";

export default function StudentAudioPlayerPage() {
  const params = useParams();
  const router = useRouter();
  const bookId = params?.id as string;
  const { state, playBook } = useAudioPlayer();
  const [initLoading, setInitLoading] = useState(true);

  useEffect(() => {
    if (!bookId) return;

    if (state.currentBookId !== bookId) {
      playBook(bookId).finally(() => setInitLoading(false));
    } else {
      setInitLoading(false);
    }
  }, [bookId, state.currentBookId, playBook]);

  const handleOpenReader = () => {
    if (bookId) {
      router.push(`/read/${bookId}`);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col justify-between p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full">
      {/* Navigation et fil d'Ariane */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <Link
          href="/student/library"
          className="inline-flex items-center gap-2 text-xs font-semibold text-foreground-muted hover:text-gold transition-colors py-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour à Ma Bibliothèque</span>
        </Link>

        {bookId && (
          <Link
            href={`/read/${bookId}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-navy-secondary text-gold border border-gold/30 text-xs font-bold hover:bg-gold/10 transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Lire en PDF</span>
          </Link>
        )}
      </div>

      {/* Lecteur Audio immersif centré */}
      <div className="flex-1 flex flex-col items-center justify-center py-4 sm:py-8">
        {initLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 p-12 text-center">
            <InlineLoader size={36} />
            <p className="text-xs text-foreground-muted font-medium">
              Chargement de la session audio sécurisée...
            </p>
          </div>
        ) : (
          <LahathequeAudioPlayerCard
            onOpenReader={handleOpenReader}
            className="my-auto"
          />
        )}
      </div>

      {/* Note de pied de page sur la protection DRM */}
      <div className="text-center text-[11px] text-foreground-muted mt-6 space-y-1">
        <p>
          Flux audio sécurisé diffusé en haute fidélité via Cloudflare Stream.
        </p>
        <p className="opacity-75">
          Téléchargement, extraction et redistribution strictement interdits.
        </p>
      </div>
    </div>
  );
}
