import {
  ProfessionalContact,
  ContactCreatePayload,
  ContactUpdatePayload,
  SendEmailPayload,
  ImportContactsResult,
  ContactsResponse,
} from "@/lib/types/contacts";

const BASE_URL = "/api/bff/communications/contacts";

export async function getContacts(params?: {
  q?: string;
  category?: string;
  ordering?: string;
}): Promise<ContactsResponse> {
  const query = new URLSearchParams();
  if (params?.q) query.set("q", params.q);
  if (params?.category && params.category !== "all") query.set("category", params.category);
  if (params?.ordering) query.set("ordering", params.ordering);

  const url = `${BASE_URL}/?${query.toString()}`;
  const res = await fetch(url, {
    cache: "no-store",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    throw new Error(`Erreur récupération contacts: ${res.status}`);
  }

  const json = await res.json();
  return {
    contacts: json.data || [],
    kpis: json.kpis || {
      total_contacts: 0,
      university_count: 0,
      authors_publishers_count: 0,
      total_emails_sent: 0,
    },
  };
}

export async function createContact(
  payload: ContactCreatePayload
): Promise<ProfessionalContact> {
  const res = await fetch(`${BASE_URL}/`, {
    method: "POST",
    cache: "no-store",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const json = await res.json();
  if (!res.ok || json.success === false) {
    throw new Error(json.error || "Impossible d'enregistrer le contact.");
  }
  return json.data;
}

export async function updateContact(
  contactId: string,
  payload: ContactUpdatePayload
): Promise<ProfessionalContact> {
  const res = await fetch(`${BASE_URL}/${contactId}/`, {
    method: "PATCH",
    cache: "no-store",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const json = await res.json();
  if (!res.ok || json.success === false) {
    throw new Error(json.error || "Impossible de modifier le contact.");
  }
  return json.data;
}

export async function deleteContact(contactId: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/${contactId}/`, {
    method: "DELETE",
    cache: "no-store",
    credentials: "include",
  });

  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error || "Impossible de supprimer le contact.");
  }
}

export async function batchDeleteContacts(
  contactIds: string[]
): Promise<{ deleted_count: number }> {
  const res = await fetch(`${BASE_URL}/batch-delete/`, {
    method: "POST",
    cache: "no-store",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contact_ids: contactIds }),
  });

  const json = await res.json();
  if (!res.ok || json.success === false) {
    throw new Error(json.error || "Impossible de supprimer les contacts sélectionnés.");
  }
  return json;
}

export async function importContactsFile(
  file: File
): Promise<ImportContactsResult> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${BASE_URL}/import/`, {
    method: "POST",
    cache: "no-store",
    credentials: "include",
    body: formData,
  });

  const json = await res.json();
  if (!res.ok || json.success === false) {
    throw new Error(json.error || "Échec de l'importation du fichier.");
  }
  return json.data;
}

export async function exportContactsCsv(params?: {
  q?: string;
  category?: string;
  ids?: string[];
}): Promise<void> {
  const query = new URLSearchParams();
  if (params?.q) query.set("q", params.q);
  if (params?.category && params.category !== "all") query.set("category", params.category);
  if (params?.ids && params.ids.length > 0) query.set("ids", params.ids.join(","));

  const res = await fetch(`${BASE_URL}/export/?${query.toString()}`, {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("Échec du téléchargement de l'export CSV.");
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `contacts_lahatheque_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export async function sendContactEmail(
  payload: SendEmailPayload
): Promise<{ sent_count: number; message: string }> {
  const res = await fetch(`${BASE_URL}/send-email/`, {
    method: "POST",
    cache: "no-store",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const json = await res.json();
  if (!res.ok || json.success === false) {
    throw new Error(json.error || "Impossible d'expédier le message.");
  }
  return {
    sent_count: json.data?.sent_count || 0,
    message: json.message || "Message expédié avec succès.",
  };
}
