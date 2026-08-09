export type VerificationStatus = 'pending' | 'approved' | 'rejected';

export interface Course {
  id: string;
  name: string;
  code: string;
  student_count: number;
  recommended_books: {
    id: string;
    title: string;
    author: string;
  }[];
}

export interface SpecimenRequest {
  id: string;
  book_title: string;
  book_id: string;
  author: string;
  requested_at: string;
  status: 'pending' | 'approved' | 'rejected';
  reason?: string;
}
