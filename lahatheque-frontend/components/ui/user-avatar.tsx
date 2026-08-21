"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  src?: string | null;
  name?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  fallbackClassName?: string;
}

export function UserAvatar({
  src,
  name = "Utilisateur",
  size = "md",
  className,
  fallbackClassName,
}: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);

  // Normalisation du src : ignore les valeurs factices ou nulles
  const normalizedSrc = React.useMemo(() => {
    if (!src) return null;
    const trimmed = src.trim();
    if (
      trimmed === "" ||
      trimmed === "null" ||
      trimmed === "undefined" ||
      trimmed === "None"
    ) {
      return null;
    }
    return trimmed;
  }, [src]);

  // Réinitialiser l'état d'erreur si le src change
  useEffect(() => {
    setImageError(false);
  }, [normalizedSrc]);

  // Calcul des initiales (ex: "Amadou KOUYATÉ" -> "AK")
  const initials = React.useMemo(() => {
    if (!name) return "LH";
    // Nettoyer les parenthèses de rôle ex: "Amadou KOUYATÉ (Lecteur)" -> "Amadou KOUYATÉ"
    const cleaned = name.replace(/\([^)]*\)/g, "").trim();
    const parts = cleaned.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    if (parts.length === 1 && parts[0].length >= 2) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return cleaned.slice(0, 1).toUpperCase() || "LH";
  }, [name]);

  // Tailles
  const sizeClasses = {
    xs: "w-6 h-6 text-[10px]",
    sm: "w-8 h-8 text-xs",
    md: "w-9 h-9 text-xs",
    lg: "w-16 h-16 text-lg",
    xl: "w-24 h-24 sm:w-28 sm:h-28 text-2xl sm:text-3xl",
  };

  const showImage = normalizedSrc && !imageError;

  return (
    <div
      className={cn(
        "relative rounded-full overflow-hidden shrink-0 flex items-center justify-center select-none border border-gold/40 shadow-xs",
        sizeClasses[size],
        className
      )}
    >
      {showImage ? (
        <img
          src={normalizedSrc}
          alt=""
          aria-hidden="true"
          onError={() => setImageError(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <div
          className={cn(
            "w-full h-full flex items-center justify-center bg-navy text-gold font-serif font-bold tracking-wider",
            fallbackClassName
          )}
        >
          {initials}
        </div>
      )}
    </div>
  );
}

export default UserAvatar;
