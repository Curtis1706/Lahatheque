import { SubscriptionPlan, StudentSubscription, SubscriptionApiResponse } from '../types/student-subscriptions';

export const MOCK_SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "plan-monthly-std",
    name: "Pass Étudiant Mensuel",
    plan_type: "individual",
    price_amount: 2500,
    currency: "XOF",
    duration_days: 30,
    max_concurrent_users: 1,
    is_popular: false,
    features: [
      "Consultation intégrale du catalogue sur liseuse",
      "Prise de notes et surlignage synchronisés",
      "Recherche par texte intégral PyMuPDF",
      "Streaming audio pour ouvrages compatibles"
    ]
  },
  {
    id: "plan-annual-std",
    name: "Pass Étudiant Annuel (Offre Réduction)",
    plan_type: "individual",
    price_amount: 15000,
    currency: "XOF",
    duration_days: 365,
    max_concurrent_users: 1,
    is_popular: true,
    features: [
      "Accès 365 jours illimité au catalogue universitaire",
      "Économisez 50% par rapport au tarif mensuel",
      "Exportation des fiches de lecture & annotations PDF",
      "Accès prioritaire aux nouvelles parutions académiques",
      "Support dédié aux recherches bibliographiques"
    ]
  },
  {
    id: "plan-inst-bouquet",
    name: "Bouquet Facultaire Institutionnel",
    plan_type: "institution_bouquet",
    price_amount: 0,
    currency: "XOF",
    duration_days: 365,
    max_concurrent_users: 5000,
    is_popular: false,
    features: [
      "Prise en charge à 100% par votre université partenaire",
      "Accès automatique pour tous les étudiants inscrits et validés",
      "Consultations simultanées illimitées en bibliothèque"
    ]
  }
];

export const MOCK_ACTIVE_SUBSCRIPTION: StudentSubscription = {
  id: "sub-active-uac-2026",
  plan: MOCK_SUBSCRIPTION_PLANS[1],
  starts_at: "2026-01-15T00:00:00Z",
  expires_at: "2026-12-31T23:59:59Z",
  is_active: true,
  auto_renew: true,
  institution_name: "Université d'Abomey-Calavi (UAC)"
};

export const MOCK_SUBSCRIPTION_RESPONSE: SubscriptionApiResponse = {
  has_active_institutional_access: true,
  institution_name: "Université d'Abomey-Calavi (UAC)",
  plans: MOCK_SUBSCRIPTION_PLANS,
  active_subscription: MOCK_ACTIVE_SUBSCRIPTION
};
