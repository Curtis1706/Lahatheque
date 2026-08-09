import { BookSubmission, PublisherStats } from "../types/publisher";
import { mockBookSubmissions, mockPublisherStats } from "../mock/publisher";

// Simulation d'un délai réseau de 800ms
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getPublisherStats(): Promise<PublisherStats> {
  await delay(800);
  return { ...mockPublisherStats };
}

export async function getBookSubmissions(): Promise<BookSubmission[]> {
  await delay(1000);
  return [...mockBookSubmissions];
}

export async function createBookSubmission(
  submission: Omit<BookSubmission, "id" | "created_at" | "status">
): Promise<BookSubmission> {
  await delay(1200);
  const newSubmission: BookSubmission = {
    ...submission,
    id: `sub-${Math.random().toString(36).substr(2, 9)}`,
    status: "pending",
    created_at: new Date().toISOString()
  };
  mockBookSubmissions.unshift(newSubmission);
  return newSubmission;
}

export async function deleteBookSubmission(id: string): Promise<boolean> {
  await delay(600);
  const index = mockBookSubmissions.findIndex((sub) => sub.id === id);
  if (index !== -1) {
    mockBookSubmissions.splice(index, 1);
    return true;
  }
  return false;
}
