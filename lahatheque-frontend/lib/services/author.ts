import { AuthorSubmission, RoyaltyStatement, AuthorBook, AuthorPurchase, AuthorStats } from "../types/author";
import { mockAuthorSubmissions, mockRoyaltyStatements, mockAuthorBooks, mockAuthorPurchases, mockAuthorStats } from "../mock/author";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getAuthorSubmissions(): Promise<AuthorSubmission[]> {
  await delay(300);
  return [...mockAuthorSubmissions];
}

export async function getAuthorBooks(): Promise<AuthorBook[]> {
  await delay(300);
  return [...mockAuthorBooks];
}

export async function getRoyaltyStatements(): Promise<RoyaltyStatement[]> {
  await delay(300);
  return [...mockRoyaltyStatements];
}

export async function getAuthorPurchases(): Promise<AuthorPurchase[]> {
  await delay(300);
  return [...mockAuthorPurchases];
}

export async function getAuthorStats(): Promise<AuthorStats> {
  await delay(300);
  return { ...mockAuthorStats };
}

export async function submitManuscript(
  title: string,
  summary: string,
  language: string,
  versionType: "preview" | "brouillon" | "version_finale",
  fileName: string
): Promise<AuthorSubmission> {
  await delay(600);
  const newSubmission: AuthorSubmission = {
    id: `sub-${Math.random().toString(36).substr(2, 9)}`,
    title,
    summary,
    language: language || "Français",
    version_type: versionType,
    status: "pending",
    submitted_at: new Date().toISOString(),
    file_name: fileName,
    cover_bg: "bg-navy-dark",
    cover_color: "text-gold"
  };
  mockAuthorSubmissions.unshift(newSubmission);
  return newSubmission;
}
