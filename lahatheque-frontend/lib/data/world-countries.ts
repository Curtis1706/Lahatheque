export interface WorldCountry {
  code: string; // ISO 2 (ex: BJ)
  name: string; // Nom en français
  phone_code: string; // ex: +229
  currency: string; // ex: FCFA, EUR, USD
  continent: string;
}

export const WORLD_COUNTRIES: WorldCountry[] = [
  // Afrique
  { code: "BJ", name: "Bénin", phone_code: "+229", currency: "FCFA", continent: "Afrique" },
  { code: "CI", name: "Côte d'Ivoire", phone_code: "+225", currency: "FCFA", continent: "Afrique" },
  { code: "SN", name: "Sénégal", phone_code: "+221", currency: "FCFA", continent: "Afrique" },
  { code: "TG", name: "Togo", phone_code: "+228", currency: "FCFA", continent: "Afrique" },
  { code: "BF", name: "Burkina Faso", phone_code: "+226", currency: "FCFA", continent: "Afrique" },
  { code: "ML", name: "Mali", phone_code: "+223", currency: "FCFA", continent: "Afrique" },
  { code: "NE", name: "Niger", phone_code: "+227", currency: "FCFA", continent: "Afrique" },
  { code: "GN", name: "Guinée", phone_code: "+224", currency: "GNF", continent: "Afrique" },
  { code: "CM", name: "Cameroun", phone_code: "+237", currency: "FCFA", continent: "Afrique" },
  { code: "GA", name: "Gabon", phone_code: "+241", currency: "FCFA", continent: "Afrique" },
  { code: "CG", name: "Congo", phone_code: "+242", currency: "FCFA", continent: "Afrique" },
  { code: "CD", name: "RD Congo", phone_code: "+243", currency: "USD", continent: "Afrique" },
  { code: "TD", name: "Tchad", phone_code: "+235", currency: "FCFA", continent: "Afrique" },
  { code: "CF", name: "République Centrafricaine", phone_code: "+236", currency: "FCFA", continent: "Afrique" },
  { code: "GQ", name: "Guinée Équatoriale", phone_code: "+240", currency: "FCFA", continent: "Afrique" },
  { code: "GH", name: "Ghana", phone_code: "+233", currency: "GHS", continent: "Afrique" },
  { code: "NG", name: "Nigeria", phone_code: "+234", currency: "NGN", continent: "Afrique" },
  { code: "RW", name: "Rwanda", phone_code: "+250", currency: "RWF", continent: "Afrique" },
  { code: "BI", name: "Burundi", phone_code: "+257", currency: "BIF", continent: "Afrique" },
  { code: "DJ", name: "Djibouti", phone_code: "+253", currency: "DJF", continent: "Afrique" },
  { code: "MG", name: "Madagascar", phone_code: "+261", currency: "MGA", continent: "Afrique" },
  { code: "MU", name: "Maurice", phone_code: "+230", currency: "MUR", continent: "Afrique" },
  { code: "MR", name: "Mauritanie", phone_code: "+222", currency: "MRU", continent: "Afrique" },
  { code: "MA", name: "Maroc", phone_code: "+212", currency: "MAD", continent: "Afrique" },
  { code: "TN", name: "Tunisie", phone_code: "+216", currency: "TND", continent: "Afrique" },
  { code: "DZ", name: "Algérie", phone_code: "+213", currency: "DZD", continent: "Afrique" },
  { code: "EG", name: "Égypte", phone_code: "+20", currency: "EGP", continent: "Afrique" },
  { code: "KE", name: "Kenya", phone_code: "+254", currency: "KES", continent: "Afrique" },
  { code: "UG", name: "Ouganda", phone_code: "+256", currency: "UGX", continent: "Afrique" },
  { code: "TZ", name: "Tanzanie", phone_code: "+255", currency: "TZS", continent: "Afrique" },
  { code: "ET", name: "Éthiopie", phone_code: "+251", currency: "ETB", continent: "Afrique" },
  { code: "ZA", name: "Afrique du Sud", phone_code: "+27", currency: "ZAR", continent: "Afrique" },
  { code: "AO", name: "Angola", phone_code: "+244", currency: "AOA", continent: "Afrique" },
  { code: "MZ", name: "Mozambique", phone_code: "+258", currency: "MZN", continent: "Afrique" },
];
