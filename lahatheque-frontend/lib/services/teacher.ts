import { Course, SpecimenRequest } from "../types/teacher";
import { mockCourses, mockSpecimenRequests } from "../mock/teacher";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getTeacherCourses(): Promise<Course[]> {
  await delay(800);
  return [...mockCourses];
}

export async function getSpecimenRequests(): Promise<SpecimenRequest[]> {
  await delay(600);
  return [...mockSpecimenRequests];
}

export async function createCourse(name: string, code: string): Promise<Course> {
  await delay(800);
  const newCourse: Course = {
    id: `course-${Math.random().toString(36).substr(2, 9)}`,
    name,
    code,
    student_count: 0,
    recommended_books: []
  };
  mockCourses.push(newCourse);
  return newCourse;
}

export async function createSpecimenRequest(bookId: string, bookTitle: string, author: string): Promise<SpecimenRequest> {
  await delay(1000);
  const newRequest: SpecimenRequest = {
    id: `spec-${Math.random().toString(36).substr(2, 9)}`,
    book_title: bookTitle,
    book_id: bookId,
    author,
    requested_at: new Date().toISOString(),
    status: "pending"
  };
  mockSpecimenRequests.unshift(newRequest);
  return newRequest;
}

export async function addRecommendationToCourse(courseId: string, bookId: string, bookTitle: string, author: string): Promise<boolean> {
  await delay(600);
  const course = mockCourses.find(c => c.id === courseId);
  if (course) {
    course.recommended_books.push({ id: bookId, title: bookTitle, author });
    return true;
  }
  return false;
}
