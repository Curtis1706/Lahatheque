/**
 * @deprecated OBSOLÈTE & DÉPRÉCIÉ — ZÉRO MOCK.
 * Toutes les données de redevances universitaires proviennent désormais exclusivement
 * de l'API Django via le BFF (/api/bff/partners/university/royalties/).
 * Ce fichier est conservé temporairement vide pour éviter les erreurs de build éventuelles.
 */

import type {
  UniversityUnitSaleRoyalty,
  UniversityBouquetUsageRoyalty,
  UniversityRoyaltiesDetailData,
} from "../types/university";

export const mockUniversityUnitSales: UniversityUnitSaleRoyalty[] = [];

export const mockUniversityBouquetUsage: UniversityBouquetUsageRoyalty[] = [];

export function buildUniversityRoyaltiesDetailData(
  contractualRate = 15,
  currency = "XOF"
): UniversityRoyaltiesDetailData {
  return {
    available_balance: 0,
    total_paid: 0,
    contractual_rate: contractualRate,
    institution: {
      id: "",
      name: "Établissement Universitaire Partenaire",
      royalty_rate: contractualRate,
    },
    currency,
    min_withdrawal_threshold: 100000,
    totals_summary: {
      paper_sales_count: 0,
      paper_gross_total: 0,
      paper_royalties_total: 0,
      digital_sales_count: 0,
      digital_gross_total: 0,
      digital_royalties_total: 0,
      bouquet_consultations_count: 0,
      bouquet_gross_allocated: 0,
      bouquet_royalties_total: 0,
    },
    unit_sales: [],
    bouquet_royalties: [],
  };
}
