export type ContactCategory =
  | "university"
  | "author"
  | "publisher"
  | "institution"
  | "partner"
  | "press"
  | "other";

export interface ContactEmailDispatch {
  id: string;
  contact: string;
  contact_name?: string;
  contact_email?: string;
  sender?: string | null;
  sender_name?: string;
  subject: string;
  body_snippet: string;
  status: "sent" | "failed";
  sent_at: string;
}

export interface ProfessionalContact {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: string;
  organization: string;
  role_or_title: string;
  category: ContactCategory;
  category_display: string;
  notes: string;
  created_by?: string | null;
  created_by_name?: string;
  last_contacted_at?: string | null;
  emails_sent_count: number;
  created_at: string;
  updated_at: string;
  dispatches?: ContactEmailDispatch[];
}

export interface ContactCreatePayload {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  organization?: string;
  role_or_title?: string;
  category?: ContactCategory;
  notes?: string;
}

export interface ContactUpdatePayload extends Partial<ContactCreatePayload> {}

export interface SendEmailPayload {
  contact_ids: string[];
  subject: string;
  message: string;
}

export interface ImportContactsResult {
  imported_count: number;
  duplicates_skipped: number;
  total_analyzed: number;
}

export interface ContactsKpis {
  total_contacts: number;
  university_count: number;
  authors_publishers_count: number;
  total_emails_sent: number;
}

export interface ContactsResponse {
  contacts: ProfessionalContact[];
  kpis: ContactsKpis;
}
