"use client";

import React, { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { BouquetPieDistribution } from "./bouquet-pie-distribution";
import { PageLoader } from "@/components/ui/page-loader";
import {
  computeBouquetDistribution,
  fetchBouquetDistribution,
  type BouquetDistributionResult,
} from "@/lib/services/bouquet-distribution";
import { AlertCircle } from "lucide-react";

export interface BouquetDistributionContentProps {
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
  onClose?: () => void;
}

export function BouquetDistributionContent({
  bouquet,
  highlightUniversityId,
  highlightUniversityName,
  royaltyRate,
  onClose,
}: BouquetDistributionContentProps) {
  const [data, setData] = useState<BouquetDistributionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bouquet) {
      setData(null);
      setError(null);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    const role = highlightUniversityId ? "university" : "admin";

    fetchBouquetDistribution(bouquet.id, role)
      .then((res) => {
        if (!isMounted) return;
        if (res && res.distribution && res.distribution.length > 0) {
          setData(res);
        } else if (bouquet.books && bouquet.books.length > 0) {
          setData(
            computeBouquetDistribution({
              bouquet_id: bouquet.id,
              bouquet_title: bouquet.title,
              total_ca: bouquet.annual_price || 0,
              currency: bouquet.currency || "XOF",
              custom_royalty_rate: royaltyRate,
              books: bouquet.books,
            })
          );
        } else if (res) {
          setData(res);
        } else {
          setError("Impossible de charger la répartition de ce bouquet.");
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Erreur chargement répartition bouquet:", err);
        setError("Une erreur réseau est survenue lors du chargement de la répartition.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [bouquet, royaltyRate, highlightUniversityId]);

  if (!bouquet) return null;

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="py-16">
          <PageLoader label="Calcul de la répartition et chargement des consultations" />
        </div>
      ) : error ? (
        <div className="p-8 text-center space-y-3 bg-background-secondary rounded-2xl border border-border">
          <AlertCircle className="w-8 h-8 text-gold mx-auto" />
          <p className="text-sm font-semibold text-navy">{error}</p>
          <p className="text-xs text-foreground-muted">
            Veuillez vérifier votre connexion ou réessayer ultérieurement.
          </p>
        </div>
      ) : data ? (
        <BouquetPieDistribution
          distribution={data}
          highlightUniversityId={highlightUniversityId}
          highlightUniversityName={highlightUniversityName}
          showTitle={false}
        />
      ) : (
        <div className="p-8 text-center space-y-2 bg-background-secondary rounded-2xl border border-border">
          <p className="text-sm font-semibold text-navy">Aucune donnée de consultation disponible</p>
          <p className="text-xs text-foreground-muted">
            Ce bouquet ne comporte pas encore d&apos;activité d&apos;audience enregistrée.
          </p>
        </div>
      )}

      {onClose && (
        <div className="flex justify-end pt-3 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-navy text-white text-xs font-semibold hover:bg-navy-hover transition-colors cursor-pointer"
          >
            Fermer l&apos;analyse
          </button>
        </div>
      )}
    </div>
  );
}

export interface BouquetDistributionModalProps extends BouquetDistributionContentProps {
  open: boolean;
  onClose: () => void;
}

export function BouquetDistributionModal({
  open,
  onClose,
  bouquet,
  highlightUniversityId,
  highlightUniversityName,
  royaltyRate,
}: BouquetDistributionModalProps) {
  if (!open || !bouquet) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Analyse & Répartition : ${bouquet.title}`}
      maxWidth={1040}
      maxHeight="min(90vh, 850px)"
    >
      <div className="p-4 sm:p-6 max-h-[85vh] overflow-y-auto space-y-4">
        <BouquetDistributionContent
          bouquet={bouquet}
          highlightUniversityId={highlightUniversityId}
          highlightUniversityName={highlightUniversityName}
          royaltyRate={royaltyRate}
          onClose={onClose}
        />
      </div>
    </Modal>
  );
}
