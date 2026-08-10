"use client";

import React from "react";
import { Check, Package, Truck, Home } from "lucide-react";
import { PhysicalDeliveryStatus } from "@/lib/types/student-orders";

interface OrderTrackerStepperProps {
  status: PhysicalDeliveryStatus;
  carrierName?: string;
  trackingNumber?: string;
}

export function OrderTrackerStepper({ status, carrierName, trackingNumber }: OrderTrackerStepperProps) {
  const steps = [
    { id: "validee", label: "Commande Validée", icon: Check },
    { id: "en_preparation", label: "En Préparation chez l'Éditeur", icon: Package },
    { id: "expedie", label: "Expédié / En Transit", icon: Truck },
    { id: "livre", label: "Colis Livré", icon: Home },
  ];

  const getStepIndex = (stat: PhysicalDeliveryStatus) => {
    switch (stat) {
      case "en_preparation": return 1;
      case "expedie": return 2;
      case "livre": return 3;
      default: return 1;
    }
  };

  const currentIndex = getStepIndex(status);

  return (
    <div className="w-full bg-background-secondary border border-border rounded-2xl p-4 sm:p-5 space-y-4">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3 text-xs">
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-gold shrink-0" />
          <span className="font-bold text-navy uppercase tracking-wider">Suivi de livraison physique</span>
        </div>
        {trackingNumber && (
          <div className="flex items-center gap-2 text-foreground-muted">
            <span>{carrierName || "Transporteur Partenaire"} :</span>
            <span className="font-mono font-bold text-navy bg-background px-2 py-0.5 rounded border border-border">
              {trackingNumber}
            </span>
          </div>
        )}
      </div>

      {/* Stepper Grid (Horizontal on desktop, stacked vertical on mobile) */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 relative">
        {steps.map((step, idx) => {
          const isCompleted = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          const Icon = step.icon;

          return (
            <div key={step.id} className="flex sm:flex-col items-center gap-3 sm:gap-2 text-left sm:text-center relative">
              
              {/* Circle Icon */}
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-colors border ${
                  isCompleted
                    ? "bg-navy text-gold border-navy"
                    : isCurrent
                    ? "bg-gold text-navy border-gold shadow-md"
                    : "bg-background text-foreground-muted border-border"
                }`}
              >
                {isCompleted ? <Check className="w-4 h-4 text-gold" /> : <Icon className="w-4 h-4" />}
              </div>

              {/* Step Label */}
              <div className="min-w-0 flex-1">
                <p className={`text-xs font-bold ${isCurrent ? "text-navy" : isCompleted ? "text-navy/80" : "text-foreground-muted"}`}>
                  {step.label}
                </p>
                <p className="text-[10px] text-foreground-muted">
                  {isCompleted ? "Validé" : isCurrent ? "En cours" : "À venir"}
                </p>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}
