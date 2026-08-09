"use client";

/**
 * Tabs — adapté de 21st.dev OriginUI (ID: 422)
 * Réécrit sans @radix-ui/react-tabs (non installé).
 * Supporte les variantes : "underline" (par défaut - charte LAHAThèque avec trait or) et "pills".
 * API : Tabs, TabsList, TabsTrigger, TabsContent.
 * Tokenisé pour LAHAThèque (globals.css).
 */

import * as React from "react";
import { createContext, useContext, useState } from "react";
import { cn } from "@/lib/utils";

type TabsVariant = "underline" | "pills";

// ─── Context ─────────────────────────────────────────────────────────────────
interface TabsContextValue {
  value: string;
  setValue: (v: string) => void;
  variant: TabsVariant;
}
const TabsContext = createContext<TabsContextValue | undefined>(undefined);
function useTabsContext() {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error("Tabs: composant doit être dans <Tabs>");
  return ctx;
}

// ─── Root ─────────────────────────────────────────────────────────────────────
interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  variant?: TabsVariant;
}

const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  (
    {
      defaultValue = "",
      value: valueProp,
      onValueChange,
      variant = "underline",
      className,
      children,
      ...props
    },
    ref
  ) => {
    const [internalValue, setInternalValue] = useState(defaultValue);
    const value = valueProp !== undefined ? valueProp : internalValue;
    const setValue = (v: string) => {
      if (valueProp === undefined) setInternalValue(v);
      onValueChange?.(v);
    };
    return (
      <TabsContext.Provider value={{ value, setValue, variant }}>
        <div ref={ref} className={cn("w-full", className)} {...props}>
          {children}
        </div>
      </TabsContext.Provider>
    );
  }
);
Tabs.displayName = "Tabs";

// ─── List ─────────────────────────────────────────────────────────────────────
const TabsList = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { variant } = useTabsContext();
    return (
      <div
        ref={ref}
        role="tablist"
        className={cn(
          variant === "pills"
            ? "inline-flex items-center justify-center rounded-lg bg-background-secondary border border-border p-0.5 text-foreground-muted gap-1"
            : "flex border-b border-border gap-6 w-full",
          className
        )}
        {...props}
      />
    );
  }
);
TabsList.displayName = "TabsList";

// ─── Trigger ──────────────────────────────────────────────────────────────────
interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}
const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, value, children, ...props }, ref) => {
    const { value: active, setValue, variant } = useTabsContext();
    const isActive = active === value;

    if (variant === "pills") {
      return (
        <button
          ref={ref}
          role="tab"
          aria-selected={isActive}
          onClick={() => setValue(value)}
          className={cn(
            "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3.5 py-1.5 text-xs sm:text-sm font-semibold transition-all",
            "outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold/60",
            "disabled:pointer-events-none disabled:opacity-50",
            isActive
              ? "bg-background text-navy shadow-sm border border-border/50"
              : "hover:text-navy text-foreground-muted",
            className
          )}
          {...props}
        >
          {children}
        </button>
      );
    }

    return (
      <button
        ref={ref}
        role="tab"
        aria-selected={isActive}
        onClick={() => setValue(value)}
        className={cn(
          "pb-3 text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-colors -mb-px",
          "outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold/60",
          "disabled:pointer-events-none disabled:opacity-50",
          isActive
            ? "border-gold text-navy"
            : "border-transparent text-foreground-muted hover:text-navy hover:border-border",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
TabsTrigger.displayName = "TabsTrigger";

// ─── Content ──────────────────────────────────────────────────────────────────
interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}
const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, value, children, ...props }, ref) => {
    const { value: active } = useTabsContext();
    if (active !== value) return null;
    return (
      <div
        ref={ref}
        role="tabpanel"
        className={cn(
          "mt-4 outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold/60",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
TabsContent.displayName = "TabsContent";

export { Tabs, TabsList, TabsTrigger, TabsContent };

