"use client";

import React from "react";
import { AudioBooksManagementView } from "@/components/features/audio/audio-books-management-view";

export default function AdminAudioPage() {
  return (
    <AudioBooksManagementView
      role="admin"
      title="Administration — Gestion Globale des Livres Audio"
      subtitle="Supervisez l'intégralité du fonds sonore LAHAThèque, publiez directement au catalogue ou accédez au Studio Audio."
      newAudioHref="/admin/audio/new"
    />
  );
}
