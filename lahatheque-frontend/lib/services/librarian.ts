import { StudentAffiliation, BouquetSubscription, UsageStats } from "../types/librarian";
import { mockAffiliations, mockBouquets, mockUsageStats } from "../mock/librarian";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getStudentAffiliations(): Promise<StudentAffiliation[]> {
  await delay(800);
  return [...mockAffiliations];
}

export async function getBouquetSubscriptions(): Promise<BouquetSubscription[]> {
  await delay(600);
  return [...mockBouquets];
}

export async function getUsageStats(): Promise<UsageStats[]> {
  await delay(700);
  return [...mockUsageStats];
}

export async function approveAffiliation(id: string): Promise<boolean> {
  await delay(800);
  const index = mockAffiliations.findIndex(aff => aff.id === id);
  if (index !== -1) {
    mockAffiliations[index].status = "approved";
    return true;
  }
  return false;
}

export async function rejectAffiliation(id: string, reason: string): Promise<boolean> {
  await delay(800);
  const index = mockAffiliations.findIndex(aff => aff.id === id);
  if (index !== -1) {
    mockAffiliations[index].status = "rejected";
    mockAffiliations[index].rejection_reason = reason;
    return true;
  }
  return false;
}

export async function renewSubscription(id: string): Promise<boolean> {
  await delay(1000);
  const index = mockBouquets.findIndex(bq => bq.id === id);
  if (index !== -1) {
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    mockBouquets[index].end_date = nextYear.toISOString();
    mockBouquets[index].status = "active";
    return true;
  }
  return false;
}
