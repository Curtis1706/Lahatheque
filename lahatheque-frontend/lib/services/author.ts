import { AuthorSubmission, RoyaltyStatement, AuthorContract } from "../types/author";
import { mockAuthorSubmissions, mockRoyaltyStatements, mockAuthorContracts } from "../mock/author";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getAuthorSubmissions(): Promise<AuthorSubmission[]> {
  await delay(800);
  return [...mockAuthorSubmissions];
}

export async function getRoyaltyStatements(): Promise<RoyaltyStatement[]> {
  await delay(600);
  return [...mockRoyaltyStatements];
}

export async function getAuthorContracts(): Promise<AuthorContract[]> {
  await delay(500);
  return [...mockAuthorContracts];
}

export async function submitManuscript(title: string, discipline: string, fileName: string): Promise<AuthorSubmission> {
  await delay(1200);
  const newSubmission: AuthorSubmission = {
    id: `sub-${Math.random().toString(36).substr(2, 9)}`,
    title,
    discipline,
    status: "pending",
    submitted_at: new Date().toISOString(),
    file_name: fileName
  };
  mockAuthorSubmissions.unshift(newSubmission);
  return newSubmission;
}
