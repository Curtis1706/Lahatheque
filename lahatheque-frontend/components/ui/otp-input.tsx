"use client";

import React, { useRef, useId } from "react";
import { cn } from "@/lib/utils";
import { Minus } from "lucide-react";

interface OTPInputProps {
  value: string[];
  onChange: (digits: string[]) => void;
  onComplete?: (code: string) => void;
  disabled?: boolean;
  length?: number;
  separator?: boolean;
  className?: string;
  autoFocus?: boolean;
}

export function OTPInput({
  value,
  onChange,
  onComplete,
  disabled = false,
  length = 6,
  separator = true,
  className,
  autoFocus = true,
}: OTPInputProps) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (idx: number, char: string) => {
    // Si l'utilisateur colle ou tape plusieurs caractères dans un seul slot
    if (char.length > 1) {
      const digits = char.replace(/\D/g, "").slice(0, length).split("");
      if (digits.length > 0) {
        const next = [...value];
        digits.forEach((d, i) => {
          if (i < length) next[i] = d;
        });
        onChange(next);
        const nextFocus = Math.min(digits.length, length - 1);
        inputsRef.current[nextFocus]?.focus();
        if (next.every((v) => v !== "") && next.length === length) {
          onComplete?.(next.join(""));
        }
        return;
      }
    }

    const digit = char.replace(/\D/g, "");
    const next = [...value];
    next[idx] = digit;
    onChange(next);

    if (digit && idx < length - 1) {
      inputsRef.current[idx + 1]?.focus();
    }

    if (next.every((v) => v !== "") && next.length === length) {
      onComplete?.(next.join(""));
    }
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!value[idx] && idx > 0) {
        inputsRef.current[idx - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && idx > 0) {
      e.preventDefault();
      inputsRef.current[idx - 1]?.focus();
    } else if (e.key === "ArrowRight" && idx < length - 1) {
      e.preventDefault();
      inputsRef.current[idx + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const paste = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length).split("");
    if (paste.length === 0) return;

    const next = [...value];
    paste.forEach((d, i) => {
      if (i < length) next[i] = d;
    });
    onChange(next);

    const nextFocus = Math.min(paste.length, length - 1);
    inputsRef.current[nextFocus]?.focus();

    if (next.every((v) => v !== "") && next.length === length) {
      onComplete?.(next.join(""));
    }
  };

  return (
    <div
      className={cn("flex items-center justify-center gap-1.5 sm:gap-2.5", className)}
      onPaste={handlePaste}
    >
      {Array.from({ length }).map((_, idx) => {
        const val = value[idx] || "";
        const isMiddle = separator && idx === Math.floor(length / 2) - 1;

        return (
          <React.Fragment key={idx}>
            <input
              ref={(el) => {
                inputsRef.current[idx] = el;
              }}
              id={`otp-slot-${idx}`}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={length}
              autoComplete="one-time-code"
              disabled={disabled}
              value={val}
              onChange={(e) => handleChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              autoFocus={autoFocus && idx === 0}
              aria-label={`Chiffre ${idx + 1} du code de vérification`}
              className={cn(
                "w-11 h-13 sm:w-12 sm:h-14 text-center font-mono text-xl sm:text-2xl font-bold rounded-xl border transition-all duration-150 shadow-sm focus:outline-none",
                val
                  ? "border-gold bg-gold/5 text-navy font-extrabold ring-1 ring-gold/40"
                  : "border-border bg-background text-navy hover:border-border-hover focus:border-navy focus:ring-2 focus:ring-gold/30",
                disabled && "opacity-50 cursor-not-allowed bg-background-secondary"
              )}
            />
            {isMiddle && (
              <div className="flex items-center justify-center px-0.5 text-foreground-muted" aria-hidden="true">
                <Minus className="w-3.5 h-3.5 opacity-50 text-gold" />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
