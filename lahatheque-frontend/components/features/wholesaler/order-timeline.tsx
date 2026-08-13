"use client";

import React from "react";
import { CheckCircle2, Clock, Truck, PackageCheck, AlertCircle } from "lucide-react";
import type { WholesalerOrderStatus } from "@/lib/types/wholesaler";

interface OrderTimelineProps {
  status: WholesalerOrderStatus;
  timeline: {
    step: string;
    date: string;
    description: string;
    done: boolean;
  }[];
  className?: string;
}

export function OrderTimeline({ status, timeline, className }: OrderTimelineProps) {
  return (
    <div className={`p-6 rounded-3xl bg-background border border-border space-y-6 shadow-xs ${className}`}>
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h3 className="font-serif font-bold text-navy text-base">Suivi Chronologique de la Commande Groupée</h3>
          <p className="text-xs text-foreground-muted">Étape de traitement entrepôt et activation des clés</p>
        </div>

        {status === "cancelled" && (
          <span className="px-3 py-1 rounded-xl bg-rose-500/10 text-rose-600 border border-rose-500/30 text-xs font-bold inline-flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4" /> Commande Annulée
          </span>
        )}
      </div>

      {/* Timeline 21st.dev Order History id: 7710 */}
      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
        {timeline.map((item, idx) => (
          <div key={idx} className="relative flex items-start gap-4">
            <div
              className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                item.done
                  ? "bg-emerald-500 text-white shadow-xs"
                  : "bg-background-secondary border border-border text-foreground-muted"
              }`}
            >
              {item.done ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-navy">{item.step}</span>
                <span className="font-mono text-[10px] text-foreground-muted">({item.date})</span>
              </div>
              <p className="text-xs text-foreground-muted">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
