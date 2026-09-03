"use client";

import { useState, useEffect, useCallback } from "react";
import { getDisciplines, type DisciplineItem } from "@/lib/services/classification";

export function useDisciplines() {
  const [disciplines, setDisciplines] = useState<DisciplineItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDisciplines = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDisciplines();
      setDisciplines(data || []);
    } catch (err: any) {
      setError(err?.message || "Erreur lors du chargement des disciplines");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDisciplines();
  }, [fetchDisciplines]);

  return { disciplines, loading, error, refetch: fetchDisciplines };
}
