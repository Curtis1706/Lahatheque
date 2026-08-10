import React from "react";
import { render, screen } from "@testing-library/react";
import { OrderTrackerStepper } from "../OrderTrackerStepper";

describe("OrderTrackerStepper", () => {
  it("renders 4 delivery steps correctly", () => {
    render(
      <OrderTrackerStepper
        status="expedie"
        carrierName="Laha Express Bénin"
        trackingNumber="LH-BJ-982341"
      />
    );

    expect(screen.getByText("Commande Validée")).toBeInTheDocument();
    expect(screen.getByText("En Préparation chez l'Éditeur")).toBeInTheDocument();
    expect(screen.getByText("Expédié / En Transit")).toBeInTheDocument();
    expect(screen.getByText("Colis Livré")).toBeInTheDocument();
    expect(screen.getByText("LH-BJ-982341")).toBeInTheDocument();
  });
});
