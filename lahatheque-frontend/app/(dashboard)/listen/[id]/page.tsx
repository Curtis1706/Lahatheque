"use client";

/**
 * Route Universelle de Lecture Audio (/listen/[id]).
 * Intégrée au layout du tableau de bord (partage du contexte AudioPlayerProvider global).
 * Accessible par tous les utilisateurs connectés (étudiants, auteurs, éditeurs, maquettistes, juristes, universités, administrateurs).
 * Zéro emoji, tokens sémantiques purs (navy, gold), Playfair & Poppins.
 */

import React, { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ShieldCheck, Headphones } from "lucide-react";
import { LahathequeAudioPlayerCard } from "@/components/features/audio/lahatheque-audio-player-card";
import { useAudioPlayer } from "@/components/features/audio/audio-player-context";
import { InlineLoader } from "@/components/ui/page-loader";

export default function UniversalAudioPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookId = params?.id as string;
  const isPreviewParam = searchParams?.get("preview") === "true";
  const { state, playBook } = useAudioPlayer();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bookId) return;

    if (state.currentBookId !== bookId) {
      playBook(bookId, { preview: isPreviewParam, skipRedirect: true }).finally(() =>
        setLoading(false)
      );
    } else {
      setLoading(false);
    }
  }, [bookId, state.currentBookId, isPreviewParam, playBook]);

  return (
    <div className="min-h-[calc(100vh-100px)] flex flex-col justify-between p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto w-full">
      {/* Barre supérieure avec bouton Retour et Badge de sécurité */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-xs font-semibold text-foreground-muted hover:text-gold transition-colors py-2 cursor-pointer"
          title="Retourner à la page précédente"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/10 border border-gold/30 text-gold text-xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Streaming Audio Sécurisé</span>
          </span>
        </div>
      </div>

      {/* Lecteur Audio immersif centré */}
      <div className="flex-1 flex flex-col items-center justify-center py-4 sm:py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 p-12 text-center">
            <InlineLoader size={36} />
            <p className="text-xs text-foreground-muted font-medium">
              Initialisation du flux audio sécurisé...
            </p>
          </div>
        ) : (
          <LahathequeAudioPlayerCard
            onOpenReader={() => bookId && router.push(`/catalog/reader/${bookId}`)}
            className="my-auto"
          />
        )}
      </div>

      {/* Mention légale & protection */}
      <div className="text-center text-[11px] text-foreground-muted mt-6 space-y-1">
        <p>LAHAThèque — Plateforme Numérique Panafricaine du Savoir.</p>
        <p className="opacity-75">
          Flux audio protégé. Téléchargement et redistribution interdits.
        </p>
      </div>
    </div>
  );
}
