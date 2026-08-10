import { Course, SpecimenRequest, TeacherStats } from "../types/teacher";
import { mockTeacherCourses, mockSpecimenRequests, mockTeacherStats } from "../mock/teacher";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getTeacherCourses(): Promise<Course[]> {
  await delay(350);
  return [...mockTeacherCourses];
}

export async function getSpecimenRequests(): Promise<SpecimenRequest[]> {
  await delay(300);
  return [...mockSpecimenRequests];
}

export async function getTeacherStats(): Promise<TeacherStats> {
  await delay(300);
  return { ...mockTeacherStats };
}

export async function createSpecimenRequest(bookId: string, bookTitle: string, author: string): Promise<SpecimenRequest> {
  await delay(400);
  const newReq: SpecimenRequest = {
    id: `spec-${Date.now()}`,
    book_id: bookId,
    book_title: bookTitle,
    author: author,
    discipline: "Droit & Sciences Politiques",
    requested_at: "Aujourd'hui",
    status: "pending",
    reason: "Évaluation pour prescription universitaire",
    cover_bg: "bg-navy-dark",
    cover_color: "text-gold"
  };
  return newReq;
}
