export interface AppNotification {
  id: string;
  title: string;
  message: string;
  notification_type: string;
  action_url: string;
  resource_id: string;
  is_read: boolean;
  created_at: string;
}

const BASE = "/api/bff/reporting/notifications";

export async function getNotifications(): Promise<AppNotification[]> {
  try {
    const res = await fetch(`${BASE}/`, { credentials: "include", cache: "no-store" });
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json) ? json : json.results || json.data || [];
  } catch {
    return [];
  }
}

export async function getUnreadCount(): Promise<number> {
  try {
    const res = await fetch(`${BASE}/unread-count/`, { credentials: "include", cache: "no-store" });
    if (!res.ok) return 0;
    const json = await res.json();
    return json.data?.unread_count ?? 0;
  } catch {
    return 0;
  }
}

export async function markNotificationRead(id: string): Promise<void> {
  try {
    await fetch(`${BASE}/${id}/`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_read: true }),
    });
  } catch {
    // Échec silencieux
  }
}

export async function markAllNotificationsRead(): Promise<void> {
  try {
    await fetch(`${BASE}/mark-all-read/`, { method: "POST", credentials: "include" });
  } catch {
    // Échec silencieux
  }
}
