"use client";

import React from "react";
import { AudioBooksManagementView } from "@/components/features/audio/audio-books-management-view";

export default function ChiefLayoutAudioPage() {
  return (
    <AudioBooksManagementView
      role="chief-layout"
      title="Chef Maquettiste — Validation Technique des Livres Audio"
      subtitle="Examinez la conformité des découpages de chapitres, de la qualité audio et validez les productions sonores."
      newAudioHref="/chief-layout/deposit"
    />
  );
}
