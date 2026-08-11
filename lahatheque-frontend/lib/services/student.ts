import { StudentBookAccess, StudentReadingHistory, StudentStudyStats } from "../types/student";
import { mockBorrowedBooks, mockFavoriteBooks, mockReadingHistory, mockStudyStats } from "../mock/student";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getBorrowedBooks(): Promise<StudentBookAccess[]> {
  await delay(400);
  return [...mockBorrowedBooks];
}

export async function getFavoriteBooks(): Promise<StudentBookAccess[]> {
  await delay(300);
  return [...mockFavoriteBooks];
}

export async function getRecommendedBooks(): Promise<StudentBookAccess[]> {
  await delay(350);
  return mockBorrowedBooks.filter((b) => b.is_recommended);
}

export async function getReadingHistory(): Promise<StudentReadingHistory[]> {
  await delay(300);
  return [...mockReadingHistory];
}

export async function getStudyStats(): Promise<StudentStudyStats> {
  await delay(300);
  return { ...mockStudyStats };
}

export const fetchStudentStudyStats = getStudyStats;


