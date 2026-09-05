export interface DemoFallbackResult<T> {
  data: T;
  isDemoData: boolean;
}

/**
 * Exécute un appel asynchrone vers l'API et bascule de manière transparente
 * vers les données de démonstration si le backend n'est pas joignable ou retourne une erreur.
 * Signale l'état à l'interface pour permettre l'affichage d'un badge ou bandeau visible.
 */
export async function withDemoFallback<T>(
  fetcher: () => Promise<T>,
  fallbackData: T
): Promise<DemoFallbackResult<T>> {
  try {
    const data = await fetcher();
    if (data !== undefined && data !== null) {
      return { data, isDemoData: false };
    }
    return { data: fallbackData, isDemoData: true };
  } catch (error) {
    console.warn("[withDemoFallback] Échec de la requête, activation des données de démonstration :", error);
    return { data: fallbackData, isDemoData: true };
  }
}
