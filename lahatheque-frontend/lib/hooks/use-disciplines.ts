"use client";

import { useState, useEffect } from "react";
import { getDisciplines, type DisciplineItem } from "@/lib/services/classification";

// Cache mémoire pour éviter les requêtes redondantes au fil de la navigation
let cachedDisciplines: DisciplineItem[] | null = null;
let pendingPromise: Promise<DisciplineItem[]> | null = null;

export function useDisciplines() {
  const [disciplines, setDisciplines] = useState<DisciplineItem[]>(cachedDisciplines || []);
  const [loading, setLoading] = useState<boolean>(!cachedDisciplines);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cachedDisciplines) {
      setDisciplines(cachedDisciplines);
      setLoading(false);
      return;
    }

    let isMounted = true;

    if (!pendingPromise) {
      pendingPromise = getDisciplines()
        .then((data) => {
          cachedDisciplines = data;
          return data;
        })
        .finally(() => {
          pendingPromise = null;
        });
    }

    pendingPromise
      .then((data) => {
        if (isMounted) {
          setDisciplines(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err?.message || "Erreur de chargement des disciplines");
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const disciplineNames = disciplines.map((d) => d.name);

  return { disciplines, disciplineNames, loading, error };
}
