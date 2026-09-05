import { notFound } from "next/navigation";

// Page "Suivi des dépôts" retirée côté éditeur conformément aux directives.
// La gestion, le suivi et la validation des dépôts sont exclusivement assurés côté administration (/admin/publisher-deposits).
export default function PublisherSubmissionsPage() {
  notFound();
}

