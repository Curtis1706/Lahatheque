import { LegalContract, PreEditionItem, ClientDebt } from "../types/legal";
import { mockLegalContracts, mockPreEditions, mockClientDebts } from "../mock/legal";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getLegalContracts(): Promise<LegalContract[]> {
  await delay(800);
  return [...mockLegalContracts];
}

export async function getPreEditions(): Promise<PreEditionItem[]> {
  await delay(600);
  return [...mockPreEditions];
}

export async function getClientDebts(): Promise<ClientDebt[]> {
  await delay(700);
  return [...mockClientDebts];
}

export async function createLegalContract(contract: Omit<LegalContract, "id" | "status" | "signed_at">): Promise<LegalContract> {
  await delay(1200);
  const newContract: LegalContract = {
    ...contract,
    id: `ctr-${Math.random().toString(36).substr(2, 9)}`,
    status: "active",
    signed_at: new Date().toISOString()
  };
  mockLegalContracts.unshift(newContract);
  return newContract;
}

export async function createPreEdition(preEdition: Omit<PreEditionItem, "id" | "created_at">): Promise<PreEditionItem> {
  await delay(1000);
  const newItem: PreEditionItem = {
    ...preEdition,
    id: `pre-${Math.random().toString(36).substr(2, 9)}`,
    created_at: new Date().toISOString()
  };
  mockPreEditions.unshift(newItem);
  return newItem;
}

export async function remindClientDebt(id: string): Promise<boolean> {
  await delay(800);
  const index = mockClientDebts.findIndex(debt => debt.id === id);
  if (index !== -1) {
    mockClientDebts[index].status = "reminded";
    return true;
  }
  return false;
}
