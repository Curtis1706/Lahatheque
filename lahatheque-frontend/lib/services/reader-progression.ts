/**
 * Calcule la page équivalente proportionnelle lors du changement de langue d'un ouvrage.
 * Permet au lecteur de reprendre sa lecture exactement au même avancement relatif (pourcentage).
 */
export function computeProportionalPage(
  currentPage: number,
  totalPagesFrom: number,
  totalPagesTo: number
): number {
  if (totalPagesFrom <= 0 || totalPagesTo <= 0) return 1;
  if (currentPage <= 1) return 1;
  if (currentPage >= totalPagesFrom) return totalPagesTo;

  const ratio = currentPage / totalPagesFrom;
  const projected = Math.round(ratio * totalPagesTo);
  return Math.max(1, Math.min(totalPagesTo, projected));
}
