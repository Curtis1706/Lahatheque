"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Headphones, Shield } from "lucide-react";
import { AudioStudioForm } from "@/components/features/audio/audio-studio-form";

export default function AdminAudioNewPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* En-tête de navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-1">
          <Link
            href="/admin/audio"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground-muted hover:text-navy transition-colors mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à la gestion globale des livres audio
          </Link>
          <h1 className="font-serif font-bold text-2xl sm:text-3xl text-navy flex items-center gap-2.5">
            <Headphones className="w-6 h-6 text-gold" />
            Administration — Studio Audio &amp; Publication
          </h1>
          <p className="text-xs sm:text-sm text-foreground-muted">
            Création directe et rattachement de versions audio avec publication immédiate au catalogue LAHAThèque.
          </p>
        </div>
      </div>

      {/* Formulaire Studio Audio */}
      <AudioStudioForm
        role="admin"
        onSuccessRedirectPath="/admin/audio"
      />
    </div>
  );
}
