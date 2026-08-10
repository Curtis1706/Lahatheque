export type PlanType = 'individual' | 'institution_bouquet';
export type BillingFrequency = 'monthly' | 'annual';

export interface SubscriptionPlan {
  id: number | string;
  name: string;
  plan_type: PlanType;
  price_amount: number | string;
  currency?: string;
  duration_days: number;
  max_concurrent_users: number;
  features?: string[];
  is_popular?: boolean;
}

export interface StudentSubscription {
  id: string;
  plan: SubscriptionPlan;
  starts_at: string;
  expires_at: string;
  is_active: boolean;
  auto_renew?: boolean;
  institution_name?: string | null;
}

export interface SubscriptionApiResponse {
  has_active_institutional_access: boolean;
  institution_name: string | null;
  plans: SubscriptionPlan[];
  active_subscription?: StudentSubscription | null;
}
