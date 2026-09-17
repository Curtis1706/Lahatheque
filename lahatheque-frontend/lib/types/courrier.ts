// ─── Types Courriers Officiels LAHAThèque ──────────────────────────────────
// Conforme à la spécification specs/008-courrier-redevances-relances/spec.md
// Devise officielle stricte : FCFA exclusivement

export type CourrierCategory =
  | "royalty_author"      // Redevances Auteur
  | "royalty_university"  // Redevances Université Partenaire (15%)
  | "royalty_publisher"   // Redevances Éditeur Tiers (Taux négocié)
  | "debt_reminder"       // Relance Impayé / Recouvrement
  | "other";              // Autre correspondance officielle

export type CourrierStatus = "draft" | "validated" | "canceled" | "sent";

export type CourrierRecipientType = "author" | "university" | "publisher" | "client";

export interface CourrierOfficiel {
  id: string;
  reference: string;
  category: CourrierCategory;
  category_label: string;
  status: CourrierStatus;
  status_label: string;
  recipient_type: CourrierRecipientType;
  recipient_id: string;
  recipient_name: string;
  recipient_email: string;
  period: string;
  amount: number;
  currency: "FCFA";
  subject: string;
  body_text: string;
  has_pdf: boolean;
  pdf_url?: string;
  created_at: string;
  updated_at: string;
  validated_at: string | null;
  sent_at: string | null;
  canceled_at: string | null;
  created_by_name?: string;
}

export interface PrepareCourrierPayload {
  category: CourrierCategory;
  recipient_type: CourrierRecipientType;
  recipient_id: string;
  period_type?: "monthly" | "quarterly";
  year?: number;
  month?: number;
  quarter?: number;
  custom_subject?: string;
  custom_body?: string;
}

export interface PrepareBatchCourriersPayload {
  category: CourrierCategory;
  period_type: "monthly" | "quarterly";
  year: number;
  month?: number;
  quarter?: number;
}

export interface UpdateCourrierPayload {
  subject: string;
  body_text: string;
}

export interface CourrierListParams {
  status?: CourrierStatus | "all";
  category?: CourrierCategory | "all";
  search?: string;
  ordering?: string;
}
