export interface LegalContract {
  id: string;
  reference: string;
  book_title: string;
  author_name: string;
  royalty_rate: number;
  signed_at: string;
  contract_file: string;
  status: "active" | "archived";
}

export interface PreEditionItem {
  id: string;
  title: string;
  author_name: string;
  university: string;
  faculty: string;
  created_at: string;
}

export interface ClientDebt {
  id: string;
  client_name: string;
  client_email: string;
  amount: number;
  currency: string;
  due_date: string;
  status: "pending" | "reminded";
}
