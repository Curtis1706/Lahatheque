"use client";

import React, { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface SharedLayoutBgProps extends HTMLAttributes<HTMLElement> {
  as?: React.ElementType;
  inset?: number | string;
  pillClassName?: string;
  pillContainerClassName?: string;
  children?: ReactNode;
}

export const SharedLayoutBg = forwardRef<HTMLElement, SharedLayoutBgProps>(
  function SharedLayoutBg(
    {
      as: Component = "div",
      children,
      className,
      inset,
      pillClassName,
      pillContainerClassName,
      ...props
    },
    ref
  ) {
    return (
      <Component
        ref={ref as any}
        className={cn("relative", className)}
        {...props}
      >
        {children}
      </Component>
    );
  }
);
