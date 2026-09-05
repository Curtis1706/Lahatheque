export interface UniversityKpis {
  institution_id?: string;
  institution_name?: string;
  institution_code?: string;
  affiliated_students_count: number;
  active_bouquets_count: number;
  monthly_consultations_count: number;
  total_royalties_available: number;
  total_royalties_paid: number;
  currency: string;
  top_disciplines: { discipline: string; consultations: number; percent: number }[];
  faculty_distribution: { code: string; name: string; consultations: number; percent: number; color: string }[];
  consultations_trend_percent: number;
}

export interface UniversityFacultyData {
  id: string;
  name: string;
  code: string;
  disciplines: string[];
  student_count: number;
  dean_name: string;
}

export interface UniversityBouquet {
  id: string;
  offering_id?: string | null;
  title: string;
  bouquet_type: "discipline" | "faculty" | "university" | "custom";
  faculty_code?: string;
  discipline?: string;
  books_count: number;
  my_books_count?: number;
  annual_price: number;
  currency: string;
  status: "active" | "pending" | "expired" | "available";
  is_subscribed: boolean;
  start_date?: string;
  end_date?: string;
  description?: string;
  sample_books?: { id: string; title: string; author: string; cover_url?: string }[];
}

export interface UniversityBookCatalogItem {
  id: string;
  title: string;
  isbn_digital: string;
  isbn_print: string;
  authors: string[];
  faculty_code: string;
  faculty_name: string;
  discipline: string;
  price_digital: number;
  price_paper: number;
  currency: string;
  cover_url?: string;
  consultations_count: number;
  stock_paper_available: number;
}

export interface UniversityPaperOrderItem {
  book_id: string;
  title: string;
  quantity: number;
  unit_price: number;
  line_total?: number;
  faculty_code?: string;
}

export interface UniversityPaperOrder {
  id: string;
  order_number: string;
  delivery_campus: string;
  contact_person: string;
  contact_phone: string;
  items: UniversityPaperOrderItem[];
  total_amount: number;
  currency: string;
  status: "pending" | "processing" | "in_transit" | "delivered" | "cancelled";
  tracking_number?: string;
  pdf_order_url?: string;
  created_at: string;
}

export interface UniversityStudentAffiliationData {
  id: string;
  student_name: string;
  student_email: string;
  student_phone?: string;
  matricule: string;
  faculty_code: string;
  faculty_name: string;
  level: string;
  student_card_url?: string;
  status: "active" | "pending" | "suspended" | "graduated";
  verified_at?: string;
  created_at: string;
}

export interface UniversityRoyaltyStatementData {
  id: string;
  reference: string;
  period: string;
  total_sales_catalog: number;
  royalty_rate: number;
  net_royalty_amount: number;
  currency: string;
  status: "paid" | "pending" | "available";
  pdf_statement_url?: string;
  created_at: string;
}

// ─── Détail Analytique des Redevances Universitaires ────────────────────────

export interface UniversityUnitSaleRoyalty {
  id: string;
  transaction_ref: string;
  book_id: string;
  book_title: string;
  authors: string[];
  discipline: string;
  format: "paper" | "digital";
  quantity: number;
  unit_price: number;
  gross_amount: number;
  royalty_rate: number; // Pourcentage contractuel (ex: 15%)
  royalty_amount: number; // Montant net de la redevance (ex: gross_amount * 0.15)
  currency: string;
  buyer_type: "etudiant" | "particulier" | "institution" | "grossiste";
  date: string;
}

export interface UniversityBouquetUsageRoyalty {
  id: string;
  bouquet_id: string;
  bouquet_title: string;
  faculty_code?: string;
  period: string;
  books_included_count: number; // Nombre d'ouvrages de l'université dans ce bouquet (ex: 10)
  total_bouquet_consultations: number; // Consultations globales du bouquet par tous les abonnés
  university_consultations: number; // Consultations spécifiques aux ouvrages de cette université
  consultation_share_percent: number; // Pourcentage comparé aux consultations globales (ex: 34.8%)
  bouquet_revenue_allocated: number; // Assiette de CA répartie au prorata d'usage (XOF)
  royalty_rate: number; // Taux de redevance conventionné (ex: 15%)
  net_royalty_amount: number; // Redevance nette reversée à l'établissement (XOF)
  currency: string;
}

export interface UniversityRoyaltiesDetailData {
  available_balance: number;
  total_paid: number;
  contractual_rate: number;
  currency: string;
  min_withdrawal_threshold: number;
  totals_summary: {
    paper_sales_count: number;
    paper_royalties_total: number;
    paper_gross_total: number;
    digital_sales_count: number;
    digital_royalties_total: number;
    digital_gross_total: number;
    bouquet_consultations_count: number;
    bouquet_royalties_total: number;
    bouquet_gross_allocated: number;
  };
  unit_sales: UniversityUnitSaleRoyalty[];
  bouquet_royalties: UniversityBouquetUsageRoyalty[];
  statements?: UniversityRoyaltyStatementData[];
}

export interface UniversityProfileData {
  id: string;
  name: string;
  short_name: string;
  logo_url?: string;
  country: string;
  city: string;
  address: string;
  rector_name: string;
  academic_director_name: string;
  contact_email: string;
  contact_phone: string;
  bank_name: string;
  bank_iban: string;
  bank_swift: string;
  momo_number: string;
  contract_reference: string;
  royalty_rate: number;
  is_active: boolean;
}
