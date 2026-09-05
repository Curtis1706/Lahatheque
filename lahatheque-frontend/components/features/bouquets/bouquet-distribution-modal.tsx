"use client";

import React from "react";
import { Modal } from "@/components/ui/modal";
import { BouquetPieDistribution } from "./bouquet-pie-distribution";
import {
  computeBouquetDistribution,
  fetchBouquetDistribution,
  type BouquetDistributionResult,
} from "@/lib/services/bouquet-distribution";

interface BouquetDistributionModalProps {
  open: boolean;
  onClose: () => void;
  bouquet: {
    id: string;
    title: string;
    annual_price?: number;
    currency?: string;
    books?: Array<{
      id?: string;
      institution_id?: string;
      institution_name?: string;
      university_name?: string;
      consultations_count?: number;
    }>;
  } | null;
  highlightUniversityId?: string;
  highlightUniversityName?: string;
  royaltyRate?: number;
}

export function BouquetDistributionModal({
  open,
  onClose,
  bouquet,
  highlightUniversityId,
  highlightUniversityName,
  royaltyRate,
}: BouquetDistributionModalProps) {
  const [data, setData] = React.useState<BouquetDistributionResult | null>(() =>
    bouquet
      ? computeBouquetDistribution({
          bouquet_id: bouquet.id,
          bouquet_title: bouquet.title,
          total_ca: bouquet.annual_price || 10000,
          currency: bouquet.currency || "FCFA",
          custom_royalty_rate: royaltyRate,
          books: bouquet.books,
        })
      : null
  );

  React.useEffect(() => {
    if (!bouquet) {
      setData(null);
      return;
    }

    // Affichage instantané via calcul synchrone
    setData(
      computeBouquetDistribution({
        bouquet_id: bouquet.id,
        bouquet_title: bouquet.title,
        total_ca: bouquet.annual_price || 10000,
        currency: bouquet.currency || "FCFA",
        custom_royalty_rate: royaltyRate,
        books: bouquet.books,
      })
    );

    // Synchronisation en arrière-plan avec l'API Django
    fetchBouquetDistribution(
      bouquet.id,
      highlightUniversityId ? "university" : "admin"
    ).then((fresh) => {
      if (fresh && fresh.items && fresh.items.length > 0) {
        setData(fresh);
      }
    });
  }, [bouquet, royaltyRate, highlightUniversityId]);

  if (!bouquet || !data) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Analyse & Répartition : ${bouquet.title}`}
    >
      <div className="p-4 sm:p-6 max-h-[85vh] overflow-y-auto space-y-4">
        <BouquetPieDistribution
          distribution={data}
          highlightUniversityId={highlightUniversityId}
          highlightUniversityName={highlightUniversityName}
          showTitle={false}
        />
        <div className="flex justify-end pt-3 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-navy text-white text-xs font-semibold hover:bg-navy-hover transition-colors cursor-pointer"
          >
            Fermer l&apos;analyse
          </button>
        </div>
      </div>
    </Modal>
  );
}
