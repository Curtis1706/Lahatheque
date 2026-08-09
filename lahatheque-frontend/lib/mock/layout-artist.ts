import { BookCatalogItem } from "../types/layout-artist";

export const mockCatalogItems: BookCatalogItem[] = [
  {
    id: "item-001",
    title: "Manuel d'Anatomie Humaine Clinique",
    isbn: "978-2-84111-209-1",
    authors: "Dr. Marc Agboba",
    year: "2026",
    discipline: "Médecine & Santé",
    language: "Français",
    country: "Bénin",
    faculty: "Faculté des Sciences de la Santé (FSS)",
    university: "Université d'Abomey-Calavi (UAC)",
    format: "PDF",
    has_audio: false,
    status: "pending",
    created_at: "2026-08-08T10:00:00Z",
    suggested_summary: "Un ouvrage complet destiné aux étudiants de premier cycle en médecine présentant l'anatomie macroscopique et clinique."
  },
  {
    id: "item-002",
    title: "Droit Commercial Général de l'OHADA",
    isbn: "978-2-84111-048-2",
    authors: "Pr. Saliou Diouf",
    year: "2025",
    discipline: "Droit & Sciences Politiques",
    language: "Français",
    country: "Sénégal",
    faculty: "Faculté des Sciences Juridiques (FSJP)",
    university: "Université Cheikh Anta Diop (UCAD)",
    format: "EPUB",
    has_audio: true,
    status: "approved",
    created_at: "2026-08-05T14:00:00Z",
    suggested_summary: "Une analyse rigoureuse du droit des affaires dans l'espace OHADA avec focus sur le statut du commerçant."
  },
  {
    id: "item-003",
    title: "Introduction à l'Intelligence Artificielle en Afrique",
    isbn: "978-2-84111-999-9",
    authors: "Moussa Konaté",
    year: "2026",
    discipline: "Sciences & Technologies",
    language: "Français",
    country: "Côte d'Ivoire",
    faculty: "Sciences des Technologies",
    university: "Université Félix Houphouët-Boigny",
    format: "PDF",
    has_audio: false,
    status: "draft",
    created_at: "2026-08-09T09:00:00Z",
    suggested_summary: "Exploration des applications concrètes de l'IA pour le développement socio-économique en Afrique de l'Ouest."
  }
];
