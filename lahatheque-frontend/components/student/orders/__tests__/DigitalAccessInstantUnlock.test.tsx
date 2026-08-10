import React from "react";
import { render, screen } from "@testing-library/react";
import StudentOrdersPage from "../page";

// Mock del'API service
jest.mock("@/lib/services/student-orders", () => ({
  fetchStudentOrders: jest.fn().mockResolvedValue([
    {
      id: "ord-mixed-001",
      total_amount: 25000,
      currency: "XOF",
      statut_paiement: "paid",
      statut_commande: "processing",
      created_at: "2026-08-08T10:00:00Z",
      lignes: [
        {
          id: "l1",
          ouvrage: "book-digital-001",
          ouvrage_title: "Droit Constitutionnel Numérique",
          format_type: "digital",
          unit_price: 10000,
          quantity: 1
        },
        {
          id: "l2",
          ouvrage: "book-paper-001",
          ouvrage_title: "Droit Constitutionnel Papier",
          format_type: "paper",
          unit_price: 15000,
          quantity: 1
        }
      ],
      livraison: {
        id: "del-1",
        shipping_address: "Campus Calavi",
        city: "Abomey-Calavi",
        country: "BJ",
        statut: "en_preparation"
      }
    }
  ])
}));

describe("DigitalAccessInstantUnlock", () => {
  it("displays 'Lire sur Liseuse' button for digital item immediately when statut_paiement is paid even if physical delivery is en_preparation", async () => {
    render(<StudentOrdersPage />);

    // Attendre le chargement
    const readerButton = await screen.findByText("Lire sur Liseuse");
    expect(readerButton).toBeInTheDocument();
    expect(screen.getByText("Droit Constitutionnel Numérique")).toBeInTheDocument();
    expect(screen.getByText("En Préparation chez l'Éditeur")).toBeInTheDocument();
  });
});
