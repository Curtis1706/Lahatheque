"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Check, Circle, CircleDot, Package, Truck, PackageCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ManagerOrderStatus } from "@/lib/types/manager";

// ─── Adapté de 21st.dev (kavikatiyar/order-history) ───────────────────────────
// Couleurs remplacées par tokens globals.css, props typées sur ManagerOrderStatus

export interface TimelineStep {
  id: string;
  title: string;
  date?: string;
  status: "completed" | "in-progress" | "pending";
  icon?: React.ReactNode;
}

interface OrderStatusStepperProps {
  orderStatus: ManagerOrderStatus;
  orderDate: string;
  shippedAt?: string;
  deliveredAt?: string;
  className?: string;
}

function formatDate(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildSteps(
  orderStatus: ManagerOrderStatus,
  orderDate: string,
  shippedAt?: string,
  deliveredAt?: string
): TimelineStep[] {
  const steps: TimelineStep[] = [
    {
      id: "ordered",
      title: "Commande validée",
      date: formatDate(orderDate),
      status: "completed",
      icon: <Package className="h-4 w-4 text-white" />,
    },
    {
      id: "shipped",
      title: "Expédiée",
      date: shippedAt ? formatDate(shippedAt) : undefined,
      status: orderStatus === "to_ship" ? "pending" : "completed",
      icon: orderStatus === "to_ship"
        ? undefined
        : <Truck className="h-4 w-4 text-white" />,
    },
    {
      id: "delivered",
      title: "Livrée",
      date: deliveredAt ? formatDate(deliveredAt) : undefined,
      status:
        orderStatus === "delivered"
          ? "completed"
          : orderStatus === "shipped"
            ? "in-progress"
            : "pending",
      icon: orderStatus === "delivered"
        ? <PackageCheck className="h-4 w-4 text-white" />
        : undefined,
    },
  ];
  return steps;
}

const StatusIcon = ({ status, customIcon }: { status: TimelineStep["status"]; customIcon?: React.ReactNode }) => {
  if (customIcon) return <>{customIcon}</>;

  switch (status) {
    case "completed":
      return <Check className="h-4 w-4 text-white" />;
    case "in-progress":
      return <CircleDot className="h-4 w-4 text-gold" />;
    default:
      return <Circle className="h-4 w-4 text-foreground-muted/50" />;
  }
};

export function OrderStatusStepper({
  orderStatus,
  orderDate,
  shippedAt,
  deliveredAt,
  className,
}: OrderStatusStepperProps) {
  const steps = buildSteps(orderStatus, orderDate, shippedAt, deliveredAt);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 },
    },
  };

  const itemVariants = {
    hidden: { y: 12, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  return (
    <motion.ol
      className={cn("relative border-l border-border ml-4", className)}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {steps.map((step) => (
        <motion.li
          key={step.id}
          className="mb-6 last:mb-0 ml-8"
          variants={itemVariants}
          aria-current={step.status === "in-progress" ? "step" : undefined}
        >
          <span
            className={cn(
              "absolute -left-4 flex h-8 w-8 items-center justify-center rounded-full ring-8 ring-background",
              {
                "bg-navy": step.status === "completed",
                "bg-gold/20": step.status === "in-progress",
                "bg-background-secondary border border-border": step.status === "pending",
              }
            )}
          >
            {step.status === "in-progress" && (
              <span className="absolute h-full w-full animate-ping rounded-full bg-gold/50 opacity-75" />
            )}
            <StatusIcon status={step.status} customIcon={step.icon} />
          </span>

          <div className="flex flex-col">
            <h3
              className={cn("font-semibold text-sm", {
                "text-navy": step.status !== "pending",
                "text-foreground-muted": step.status === "pending",
              })}
            >
              {step.title}
            </h3>
            {step.date && (
              <time
                className={cn("text-xs text-foreground-muted", {
                  "font-medium text-foreground": step.status === "in-progress",
                })}
              >
                {step.date}
              </time>
            )}
          </div>
        </motion.li>
      ))}
    </motion.ol>
  );
}
