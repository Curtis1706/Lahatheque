import { computeProportionalPage } from "../lib/services/reader-progression";

describe("computeProportionalPage", () => {
  it("conserve le ratio de lecture lors du passage d'un livre de 100 pages à 120 pages", () => {
    // 20% d'avancement : page 20 sur 100 -> page 24 sur 120
    const result = computeProportionalPage(20, 100, 120);
    expect(result).toBe(24);
  });

  it("gère correctement le début d'ouvrage (page 1)", () => {
    const result = computeProportionalPage(1, 100, 150);
    expect(result).toBe(1);
  });

  it("gère correctement la dernière page d'un ouvrage", () => {
    const result = computeProportionalPage(100, 100, 80);
    expect(result).toBe(80);
  });

  it("gère la transition d'un livre plus long vers un livre plus court", () => {
    // 50% d'avancement : page 60 sur 120 -> page 50 sur 100
    const result = computeProportionalPage(60, 120, 100);
    expect(result).toBe(50);
  });

  it("retourne 1 si le nombre de pages total est invalide ou égal à zéro", () => {
    expect(computeProportionalPage(5, 0, 100)).toBe(1);
    expect(computeProportionalPage(5, 100, 0)).toBe(1);
  });
});
