"use client";

import React from "react";
import { AudioBooksManagementView } from "@/components/features/audio/audio-books-management-view";

export default function LayoutArtistAudioPage() {
  return (
    <AudioBooksManagementView
      role="layout-artist"
      title="Maquettiste — Studio Audio & Découpages"
      subtitle="Gérez vos productions de livres audio, suivez les retours de validation et téléversez de nouvelles narrations."
      newAudioHref="/layout-artist/audio/new"
    />
  );
}
