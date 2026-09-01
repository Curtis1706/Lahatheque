"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface DataStreamEntry {
  timestamp?: string;
  text: string;
  type?: "info" | "warning" | "error" | "success";
}

export interface DataStreamProps extends React.HTMLAttributes<HTMLDivElement> {
  entries: DataStreamEntry[];
  title?: string;
  maxVisible?: number;
  streaming?: boolean;
  onEntryClick?: (entry: DataStreamEntry, index: number) => void;
}

const typeColor: Record<string, string> = {
  info: "text-gold",
  warning: "text-warning",
  error: "text-error",
  success: "text-success",
};

const typeDot: Record<string, string> = {
  info: "bg-gold",
  warning: "bg-warning",
  error: "bg-error",
  success: "bg-success",
};

export function DataStream({
  entries,
  title = "TERMINAL DATA STREAM",
  maxVisible = 14,
  streaming = true,
  className,
  onEntryClick,
  ...props
}: DataStreamProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = React.useState(0);
  const entriesRef = React.useRef(entries);
  entriesRef.current = entries;

  // Staggered entry reveal using count instead of copying array
  React.useEffect(() => {
    setVisibleCount(0);
    let count = 0;
    const interval = setInterval(() => {
      count++;
      if (count > entriesRef.current.length) {
        clearInterval(interval);
        return;
      }
      setVisibleCount(count);
    }, 150);
    return () => clearInterval(interval);
  }, [entries.length]);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [visibleCount]);

  return (
    <div
      data-slot="laha-data-stream"
      className={cn(
        "relative overflow-hidden rounded-2xl border border-navy-hover bg-navy-dark text-slate-100 shadow-2xl backdrop-blur-md",
        className
      )}
      {...props}
    >
      {/* Scanline overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.08)_2px,rgba(0,0,0,0.08)_4px)]" />

      {/* Header */}
      <div className="flex items-center gap-2 border-b border-navy-hover px-4 py-3 bg-navy">
        {streaming && (
          <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]" />
        )}
        <span className="text-[11px] font-mono font-bold tracking-widest text-white/90 uppercase">
          {title}
        </span>
        <span className="ml-auto font-mono text-[10px] text-gold font-semibold">
          {visibleCount}/{entries.length} ÉVÉNEMENTS
        </span>
      </div>

      {/* Entries */}
      <div
        ref={scrollRef}
        className="overflow-y-auto font-mono text-xs p-2 space-y-1"
        style={{ maxHeight: maxVisible * 34 }}
      >
        {entries.slice(0, visibleCount).map((entry, i) => {
          const type = entry.type ?? "info";
          return (
            <div
              key={i}
              onClick={() => onEntryClick?.(entry, i)}
              className={cn(
                "flex items-start gap-2.5 rounded-lg px-3 py-2 border border-transparent hover:border-gold/30 hover:bg-navy/80 transition-all cursor-pointer group"
              )}
              style={{ animation: "dataStreamFadeIn 0.25s ease-out" }}
            >
              <div className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", typeDot[type])} />
              {entry.timestamp && (
                <span className="shrink-0 text-white/40 text-[11px] font-mono">{entry.timestamp}</span>
              )}
              <span className={cn("leading-relaxed break-all", typeColor[type])}>{entry.text}</span>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        @keyframes dataStreamFadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Corner decorations */}
      <div className="pointer-events-none absolute left-0 top-0 h-3 w-3 border-l-2 border-t-2 border-gold/40" />
      <div className="pointer-events-none absolute right-0 top-0 h-3 w-3 border-r-2 border-t-2 border-gold/40" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-3 w-3 border-b-2 border-l-2 border-gold/40" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-3 w-3 border-b-2 border-r-2 border-gold/40" />
    </div>
  );
}

export default DataStream;
