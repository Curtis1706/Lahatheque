"use client";

import React from "react";
import * as flags from "country-flag-icons/react/3x2";

interface CountryFlagProps {
  code: string;
  className?: string;
  title?: string;
}

export function CountryFlag({
  code,
  className = "w-5 h-3.5 rounded-[2px] shadow-xs inline-block shrink-0 object-cover",
  title,
}: CountryFlagProps) {
  const upperCode = (code || "").toUpperCase();
  const FlagComponent = (flags as Record<string, React.ElementType>)[upperCode];

  if (FlagComponent) {
    return <FlagComponent title={title || upperCode} className={className} />;
  }

  return (
    <span
      className={`inline-flex items-center justify-center bg-navy/10 text-navy font-mono text-[10px] font-bold px-1 rounded-[2px] ${className}`}
    >
      {upperCode || "??"}
    </span>
  );
}

export default CountryFlag;
