"use client";

/**
 * Route Universelle de Lecture Audio (/listen/[id]).
 * Accessible par tous les utilisateurs connectés (étudiants, enseignants, juristes, administrateurs).
 * Zéro emoji, typé TypeScript.
 */

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, ShieldCheck } from "lucide-react";
import { LahathequeAudioPlayerCard } from "@/components/features/audio/lahatheque-audio-player-card";
import { useAudioPlayer, AudioPlayerProvider } from "@/components/features/audio/audio-player-context";
import { InlineLoader } from "@/components/ui/page-loader";
import AuthGuard from "@/components/auth-guard";

function UniversalAudioContent() {
  const params = useParams();
  const router = useRouter();
  const bookId = params?.id as string;
  const { state, playBook } = useAudioPlayer();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bookId) return;

    if (state.currentBookId !== bookId) {
      playBook(bookId).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [bookId, state.currentBookId, playBook]);

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between gap-4 mb-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-xs font-semibold text-foreground-muted hover:text-gold transition-colors py-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/10 border border-gold/30 text-gold text-xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Streaming HLS Sécurisé</span>
          </span>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 p-12 text-center">
            <InlineLoader size={36} />
            <p className="text-xs text-foreground-muted font-medium">
              Initialisation du flux audio sécurisé...
            </p>
          </div>
        ) : (
          <LahathequeAudioPlayerCard
            onOpenReader={() => bookId && router.push(`/read/${bookId}`)}
          />
        )}
      </div>

      <div className="text-center text-[11px] text-foreground-muted mt-6">
        <p>LAHAThèque — Plateforme Numérique Panafricaine du Savoir.</p>
      </div>
    </div>
  );
}

export default function UniversalAudioPage() {
  return (
    <AuthGuard>
      <AudioPlayerProvider>
        <UniversalAudioContent />
      </AudioPlayerProvider>
    </AuthGuard>
  );
}
