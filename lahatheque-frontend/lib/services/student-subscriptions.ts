import { SubscriptionApiResponse } from '../types/student-subscriptions';

export async function fetchStudentSubscriptionState(): Promise<SubscriptionApiResponse> {
  const res = await fetch("/api/bff/commerce/subscriptions/plans/", {
    cache: "no-store",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`Erreur abonnements: ${res.status}`);
  return await res.json();
}

export async function cancelStudentSubscription(
  subId: string
): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`/api/bff/commerce/subscriptions/${subId}/cancel/`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) return { success: false, message: "Erreur lors de l'annulation." };
  return await res.json();
}
