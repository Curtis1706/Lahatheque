import { StudentBookAccess } from "../types/student";
import { mockBorrowedBooks, mockFavoriteBooks } from "../mock/student";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getBorrowedBooks(): Promise<StudentBookAccess[]> {
  await delay(800);
  return [...mockBorrowedBooks];
}

export async function getFavoriteBooks(): Promise<StudentBookAccess[]> {
  await delay(600);
  return [...mockFavoriteBooks];
}
