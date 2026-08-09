export interface StudentBookAccess {
  id: string;
  title: string;
  author: string;
  discipline: string;
  institution: string;
  expiresInDays?: number;
  format: string;
}
