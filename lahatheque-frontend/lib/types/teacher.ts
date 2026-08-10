export type VerificationStatus = 'pending' | 'approved' | 'rejected';

export interface PrescribedBook {
  id: string;
  title: string;
  author: string;
  discipline: string;
  institution: string;
  format: "PDF" | "EPUB" | "Audio";
  cover_bg: string;
  cover_color: string;
  isbn: string;
  edition_year: number;
  page_count: number;
  active_readers_count: number;
  avg_progress_percent: number;
}

export interface Course {
  id: string;
  name: string;
  code: string;
  student_count: number;
  level: string;
  recommended_books: PrescribedBook[];
}

export interface SpecimenRequest {
  id: string;
  book_title: string;
  book_id: string;
  author: string;
  discipline: string;
  requested_at: string;
  status: 'pending' | 'approved' | 'rejected';
  reason?: string;
  cover_bg: string;
  cover_color: string;
}

export interface TeacherStats {
  total_students: number;
  prescribed_books_count: number;
  approved_specimens_count: number;
  weekly_student_reading_hours: { day: string; hours: number }[];
}
