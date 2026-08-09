import { BookCatalogItem } from "../types/layout-artist";
import { mockCatalogItems } from "../mock/layout-artist";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getCatalogItems(): Promise<BookCatalogItem[]> {
  await delay(800);
  return [...mockCatalogItems];
}

export async function createCatalogItem(item: Omit<BookCatalogItem, "id" | "status" | "created_at">): Promise<BookCatalogItem> {
  await delay(1200);
  const newItem: BookCatalogItem = {
    ...item,
    id: `item-${Math.random().toString(36).substr(2, 9)}`,
    status: "pending",
    created_at: new Date().toISOString()
  };
  mockCatalogItems.unshift(newItem);
  return newItem;
}

export async function approveCatalogItem(id: string): Promise<boolean> {
  await delay(1000);
  const index = mockCatalogItems.findIndex(item => item.id === id);
  if (index !== -1) {
    mockCatalogItems[index].status = "approved";
    return true;
  }
  return false;
}

export async function rejectCatalogItem(id: string): Promise<boolean> {
  await delay(1000);
  const index = mockCatalogItems.findIndex(item => item.id === id);
  if (index !== -1) {
    mockCatalogItems[index].status = "rejected";
    return true;
  }
  return false;
}
