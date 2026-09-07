"use client";

import React from "react";
import { AudioBooksManagementView } from "@/components/features/audio/audio-books-management-view";

export default function LegalReviewerAudioPage() {
  return (
    <AudioBooksManagementView
      role="legal-reviewer"
      title="Juriste — Conformité des Livres Audio & Redevances"
      subtitle="Vérifiez les contrats d'édition, les taux de droits d'auteur sur l'écoute audio et approuvez la diffusion légale."
    />
  );
}
