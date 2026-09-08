/**
 * Service de Répartition Multi-Universités des Bouquets Documentaires
 * Calcule dynamiquement la distribution statistique, la quote-part d'audience
 * et les redevances universitaires basées sur les données réelles.
 * Conforme aux Sections 11.1 et 11.2 du Cahier des Charges.
 * RÈGLE ABSOLUE : ZÉRO MOCK. Alimentation exclusive par l'API Django via BFF.
 */

import type {
  UniversityDistributionItem as BaseUniversityDistributionItem,
  BouquetDistributionResult as BaseBouquetDistributionResult,
} from "@/lib/types/university";

export interface UniversityDistributionItem extends BaseUniversityDistributionItem {
  short_name: string;
  books_count: number;
  consultations_count: number;
  ca_share_allocated: number;
}

export interface BouquetDistributionResult extends BaseBouquetDistributionResult {
  total_books: number;
  total_ca: number;
  royalty_rate: number;
  total_royalties: number;
  items: UniversityDistributionItem[];
}

// Palette officielle contrastée pour les segments vectoriels et les barres
export const PALETTE_COLORS = [
  "#1B2A4E", // Navy principal
  "#B08D42", // Or LAHA
  "#10B981", // Émeraude
  "#2563EB", // Bleu Royal
  "#8B5CF6", // Violet
  "#06B6D4", // Cyan
  "#F59E0B", // Ambre
  "#EC4899", // Rose
];

/**
 * Récupère le taux de redevance universitaire par défaut (15%)
 */
export function getBouquetRoyaltyRate(): number {
  return 15;
}

/**
 * @deprecated Les taux sont gérés de manière centralisée par l'API Django.
 */
export function setBouquetRoyaltyRate(_rate: number): void {
  // no-op
}

/**
 * Calcule la répartition proportionnelle d'un bouquet documentaire
 * à partir de données de livres et de consultations réelles.
 * ZÉRO mock : si aucun livre n'est fourni, renvoie une structure vide saine.
 */
export function computeBouquetDistribution(params: {
  bouquet_id: string;
  bouquet_title?: string;
  total_ca?: number;
  currency?: string;
  custom_royalty_rate?: number;
  books?: Array<{
    id?: string;
    institution_id?: string;
    institution_name?: string;
    university_name?: string;
    consultations_count?: number;
  }>;
}): BouquetDistributionResult {
  const {
    bouquet_id,
    bouquet_title = "Bouquet Documentaire",
    total_ca = 0,
    currency = "XOF",
    custom_royalty_rate = 15,
    books = [],
  } = params;

  const isFcfa = currency === "FCFA" || currency === "XOF";
  const royalty_rate = typeof custom_royalty_rate === "number" && !isNaN(custom_royalty_rate)
    ? custom_royalty_rate
    : 15;

  if (!books || books.length === 0) {
    return {
      bouquet_id,
      bouquet_title,
      annual_price: total_ca,
      currency,
      total_books_count: 0,
      total_consultations: 0,
      royalty_rate_applied: royalty_rate,
      distribution: [],
      totals: {
        total_books: 0,
        total_usage_percentage: 0,
        total_ca,
        total_royalties: 0,
        platform_revenue: total_ca,
      },
      total_books: 0,
      total_ca,
      royalty_rate,
      total_royalties: 0,
      items: [],
    };
  }

  const groups: Record<
    string,
    {
      institution_id: string;
      institution_name: string;
      short_name: string;
      books_count: number;
      consultations_count: number;
    }
  > = {};

  books.forEach((book, idx) => {
    const name = book.university_name || book.institution_name || `Établissement ${idx + 1}`;
    const id = book.institution_id || `inst-${idx + 1}`;

    if (!groups[id]) {
      groups[id] = {
        institution_id: id,
        institution_name: name,
        short_name: name.length > 18 ? `${name.slice(0, 16)}...` : name,
        books_count: 0,
        consultations_count: 0,
      };
    }
    groups[id].books_count += 1;
    groups[id].consultations_count += book.consultations_count || 0;
  });

  const groupList = Object.values(groups);
  const total_books = groupList.reduce((acc, g) => acc + g.books_count, 0);
  const total_consultations = groupList.reduce((acc, g) => acc + g.consultations_count, 0);

  let accumulated_pct = 0;
  const items: UniversityDistributionItem[] = groupList
    .sort((a, b) => b.consultations_count - a.consultations_count || b.books_count - a.books_count)
    .map((g, idx) => {
      let usage_share_percent: number;
      if (total_consultations > 0) {
        usage_share_percent = Number(((g.consultations_count / total_consultations) * 100).toFixed(2));
      } else if (total_books > 0) {
        usage_share_percent = Number(((g.books_count / total_books) * 100).toFixed(2));
      } else {
        usage_share_percent = 0;
      }

      if (idx === groupList.length - 1 && groupList.length > 1) {
        usage_share_percent = Number(Math.max(0, 100 - accumulated_pct).toFixed(2));
      } else {
        accumulated_pct += usage_share_percent;
      }

      const rawCaShare = total_ca * (usage_share_percent / 100);
      const ca_share_allocated = isFcfa ? Math.round(rawCaShare) : Number(rawCaShare.toFixed(2));
      const rawRoyalty = ca_share_allocated * (royalty_rate / 100);
      const royalty_amount = isFcfa ? Math.round(rawRoyalty) : Number(rawRoyalty.toFixed(2));

      return {
        institution_id: g.institution_id,
        institution_name: g.institution_name,
        institution_code: g.short_name,
        short_name: g.short_name,
        books_owned_count: g.books_count,
        books_count: g.books_count,
        reads_count: g.consultations_count,
        consultations_count: g.consultations_count,
        usage_share_percent,
        ca_share: ca_share_allocated,
        ca_share_allocated,
        royalty_rate,
        royalty_amount,
        color: PALETTE_COLORS[idx % PALETTE_COLORS.length],
      };
    });

  const total_royalties = isFcfa
    ? Math.round(items.reduce((acc, it) => acc + it.royalty_amount, 0))
    : Number(items.reduce((acc, it) => acc + it.royalty_amount, 0).toFixed(2));

  const platform_revenue = Math.max(0, total_ca - total_royalties);

  return {
    bouquet_id,
    bouquet_title,
    annual_price: total_ca,
    currency,
    total_books_count: total_books,
    total_consultations,
    royalty_rate_applied: royalty_rate,
    distribution: items,
    totals: {
      total_books,
      total_usage_percentage: 100,
      total_ca,
      total_royalties,
      platform_revenue,
    },
    total_books,
    total_ca,
    royalty_rate,
    total_royalties,
    items,
  };
}

/**
 * Récupère la répartition réelle d'un bouquet depuis l'API Django via BFF.
 * Conforme à la Section 11 du CDC : Zéro mock, données réelles d'audience et de souscription.
 */
export async function fetchBouquetDistribution(
  bouquetId: string,
  role: "admin" | "university" = "admin"
): Promise<BouquetDistributionResult | null> {
  const endpoint =
    role === "university"
      ? `/api/bff/partners/university/bouquets/${bouquetId}/distribution/`
      : `/api/bff/admin/bouquet-offerings/${bouquetId}/distribution/`;

  try {
    const res = await fetch(endpoint, {
      credentials: "include",
      cache: "no-store",
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        const d = json.data;
        const rawItems = d.distribution || [];

        const items: UniversityDistributionItem[] = rawItems.map((it: any, idx: number) => {
          const booksCount = it.books_owned_count ?? it.books_count ?? 0;
          const readsCount = it.reads_count ?? it.consultations_count ?? 0;
          const usagePct = it.usage_percentage ?? it.usage_share_percent ?? 0;
          const caShare = it.ca_share ?? it.ca_share_allocated ?? 0;
          const rate = it.royalty_rate ?? 15;
          const amount = it.royalty_amount ?? 0;
          const shortName = it.institution_code || (it.institution_name ? it.institution_name.slice(0, 16) : `Univ ${idx + 1}`);

          return {
            institution_id: String(it.institution_id || `inst-${idx}`),
            institution_name: it.institution_name || "Établissement Partenaire",
            institution_code: it.institution_code || shortName,
            short_name: shortName,
            books_owned_count: booksCount,
            books_count: booksCount,
            reads_count: readsCount,
            consultations_count: readsCount,
            usage_share_percent: usagePct,
            ca_share: caShare,
            ca_share_allocated: caShare,
            royalty_rate: rate,
            royalty_amount: amount,
            color: it.color || PALETTE_COLORS[idx % PALETTE_COLORS.length],
            is_current_institution: Boolean(it.is_current_institution),
          };
        });

        const totalBooks = d.total_books_count ?? d.totals?.total_books ?? items.reduce((acc, it) => acc + it.books_count, 0);
        const totalConsultations = items.reduce((acc, it) => acc + it.consultations_count, 0);
        const totalCa = d.annual_price ?? d.totals?.total_ca ?? 0;
        const totalRoyalties = d.totals?.total_royalties ?? items.reduce((acc, it) => acc + it.royalty_amount, 0);
        const platformRevenue = d.totals?.platform_revenue ?? Math.max(0, totalCa - totalRoyalties);
        const appliedRate = d.royalty_rate_applied ?? 15;

        return {
          bouquet_id: String(d.bouquet_id || bouquetId),
          bouquet_title: d.bouquet_title || "Bouquet Documentaire",
          annual_price: totalCa,
          currency: d.currency || "XOF",
          total_books_count: totalBooks,
          total_consultations: totalConsultations,
          royalty_rate_applied: appliedRate,
          distribution: items,
          totals: {
            total_books: totalBooks,
            total_usage_percentage: 100,
            total_ca: totalCa,
            total_royalties: totalRoyalties,
            platform_revenue: platformRevenue,
          },
          total_books: totalBooks,
          total_ca: totalCa,
          royalty_rate: appliedRate,
          total_royalties: totalRoyalties,
          items,
        };
      }
    }
  } catch (error) {
    console.error("Erreur réseau fetchBouquetDistribution:", error);
  }

  return null;
}

export interface InstitutionBouquetSummary {
  institution_name: string;
  books_count: number;
  total_books: number;
  books_percentage: number;
  usage_share_percent: number;
  royalty_rate: number;
  royalty_amount: number;
  currency: string;
}

/**
 * Extrait les métriques KPI clés pour une université donnée sur un bouquet spécifique.
 * ZÉRO mock : basé strictement sur les champs réels du bouquet.
 */
export function getInstitutionBouquetMetrics(
  bouquet: {
    id: string;
    title?: string;
    annual_price?: number;
    currency?: string;
    books_count?: number;
    my_books_count?: number;
    usage_share_percent?: number;
    royalty_rate?: number;
    royalty_amount?: number;
  },
  institutionName: string = "Votre Établissement"
): InstitutionBouquetSummary {
  const totalBooks = bouquet.books_count || 0;
  const myBooks = typeof bouquet.my_books_count === "number" ? bouquet.my_books_count : 0;
  const booksPercentage = totalBooks > 0 ? Number(((myBooks / totalBooks) * 100).toFixed(1)) : 0;
  const usageSharePercent = typeof bouquet.usage_share_percent === "number"
    ? bouquet.usage_share_percent
    : (totalBooks > 0 ? booksPercentage : 0);

  const rate = typeof bouquet.royalty_rate === "number" ? bouquet.royalty_rate : 15;
  const price = bouquet.annual_price || 0;
  const amount = typeof bouquet.royalty_amount === "number"
    ? bouquet.royalty_amount
    : Math.round(price * (usageSharePercent / 100) * (rate / 100));

  return {
    institution_name: institutionName,
    books_count: myBooks,
    total_books: totalBooks,
    books_percentage: booksPercentage,
    usage_share_percent: usageSharePercent,
    royalty_rate: rate,
    royalty_amount: amount,
    currency: bouquet.currency || "XOF",
  };
}
