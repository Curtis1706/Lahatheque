/**
 * Types pour le formulaire de contact B2B et institutionnel LAHAThèque.
 * Profils alignés sur ROLE_CHOICES de apps/accounts/models.py
 */

export type ContactApplicantRole = 
  | "university"   // Université (Établissement Partenaire)
  | "publisher"    // Éditeur Tiers
  | "wholesaler"   // Grossiste / Distributeur
  | "author"       // Auteur
  | "other";       // Autre

export interface ContactApplicantProfileOption {
  value: ContactApplicantRole;
  label: string;
  description?: string;
}

export const CONTACT_APPLICANT_PROFILES: ContactApplicantProfileOption[] = [
  { value: "university", label: "Université / Établissement Partenaire" },
  { value: "publisher", label: "Éditeur Tiers / Maison d'édition" },
  { value: "wholesaler", label: "Grossiste / Distributeur" },
  { value: "author", label: "Auteur" },
  { value: "other", label: "Autre" },
];

export const CONTACT_NEEDS_LIST = [
  "Demande de partenariat institutionnel",
  "Commande en gros (gros volumes)",
  "Intégration API & Catalogue",
  "Impression des ouvrages",
  "Sécurisation des contenus éditoriaux",
  "Analyse par un comité de lecture",
  "Montage éditorial des ouvrages",
  "Diffusion à l'échelle internationale",
  "Distribution à l'échelle internationale",
  "Production de livres audio",
  "Réalisation d'illustrations",
  "Logiciel anti-plagiat",
  "Autre",
] as const;

export type ContactNeed = (typeof CONTACT_NEEDS_LIST)[number];

export interface ContactSubmissionPayload {
  name: string;
  email: string;
  phone?: string;
  role: ContactApplicantRole;
  selected_needs: string[];
  subject: string;
  message: string;
}

export interface ContactSubmissionResponse {
  success: boolean;
  data: {
    id?: string;
    ticket_id?: string;
    message?: string;
  };
  error: string | null;
}
