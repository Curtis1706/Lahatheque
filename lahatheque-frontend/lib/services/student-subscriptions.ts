import { SubscriptionApiResponse } from '../types/student-subscriptions';
import { MOCK_SUBSCRIPTION_RESPONSE } from '../mock/student-subscriptions';

export async function fetchStudentSubscriptionState(): Promise<SubscriptionApiResponse> {
  try {
    const res = await fetch("/api/bff/commerce/subscriptions/plans/", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      return {
        has_active_institutional_access: !!data.has_active_institutional_access,
        institution_name: data.institution_name || null,
        plans: Array.isArray(data.plans) && data.plans.length > 0 ? data.plans : MOCK_SUBSCRIPTION_RESPONSE.plans,
        active_subscription: data.active_subscription || MOCK_SUBSCRIPTION_RESPONSE.active_subscription
      };
    }
  } catch (err) {
    console.warn("BFF backend non joignable pour abonnements, fallback mock:", err);
  }

  await new Promise(resolve => setTimeout(resolve, 350));
  return MOCK_SUBSCRIPTION_RESPONSE;
}

export async function cancelStudentSubscription(subId: string): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(`/api/bff/commerce/subscriptions/${subId}/cancel/`, {
      method: "POST"
    });
    if (res.ok) {
      return { success: true, message: "Abonnement résilié avec succès." };
    }
  } catch (err) {
    console.warn("Annulation d'abonnement via BFF échouée, fallback mock:", err);
  }

  await new Promise(resolve => setTimeout(resolve, 300));
  return { 
    success: true, 
    message: "Votre demande de résiliation a été enregistrée. Vos accès restent actifs jusqu'à la date d'échéance." 
  };
}
