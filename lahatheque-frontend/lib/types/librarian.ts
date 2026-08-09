export interface StudentAffiliation {
  id: string;
  student_name: string;
  student_email: string;
  student_card_number: string;
  faculty: string;
  requested_at: string;
  status: "pending" | "approved" | "rejected";
  rejection_reason?: string;
}

export interface BouquetSubscription {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  max_licenses: number;
  active_licenses: number;
  status: "active" | "expired";
}

export interface UsageStats {
  discipline: string;
  views: number;
  downloads: number;
  pages_read: number;
}
