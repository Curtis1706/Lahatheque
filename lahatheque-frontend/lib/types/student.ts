export interface StudentBookAccess {
  id: string;
  title: string;
  author: string;
  discipline: string;
  institution: string;
  format: "PDF" | "EPUB" | "Audio";
  cover_bg: string;
  cover_color: string;
  cover_pattern?: string;
  cover_image?: string;
  progress_percent: number;
  last_read_chapter?: string;
  last_read_at?: string;
  expiresInDays?: number;
  isbn: string;
  edition_year: number;
  page_count: number;
  is_favorite: boolean;
  is_recommended?: boolean;
  course_code?: string;
  course_name?: string;
}

export interface StudentReadingHistory {
  id: string;
  book_id: string;
  book_title: string;
  chapter_title: string;
  read_at: string;
  notes_count: number;
}

export interface StudentStudyStats {
  weekly_hours: number;
  daily_activity: { day: string; hours: number }[];
  overall_progress: number;
  discipline_breakdown: { name: string; percentage: number; color: string }[];
  current_streak_days: number;
}


