"use client";

import React from "react";

interface CountryFlagProps {
  code: string;
  className?: string;
  title?: string;
}

/**
 * Composant de drapeau vectoriel SVG autonome (zéro dépendance externe).
 * Garantit un rendu net, immédiat et compatible SSR / Turbopack.
 */
export function CountryFlag({
  code,
  className = "w-5 h-3.5 rounded-[2px] shadow-xs inline-block shrink-0 object-cover",
  title,
}: CountryFlagProps) {
  const upperCode = (code || "").toUpperCase();

  const renderFlagContent = () => {
    switch (upperCode) {
      case "BJ": // Bénin
        return (
          <svg viewBox="0 0 300 200" className="w-full h-full">
            <rect width="120" height="200" fill="#008751" />
            <rect x="120" width="180" height="100" fill="#FCD116" />
            <rect x="120" y="100" width="180" height="100" fill="#E8112D" />
          </svg>
        );
      case "CI": // Côte d'Ivoire
        return (
          <svg viewBox="0 0 300 200" className="w-full h-full">
            <rect width="100" height="200" fill="#F77F00" />
            <rect x="100" width="100" height="200" fill="#FFFFFF" />
            <rect x="200" width="100" height="200" fill="#009E60" />
          </svg>
        );
      case "SN": // Sénégal
        return (
          <svg viewBox="0 0 300 200" className="w-full h-full">
            <rect width="100" height="200" fill="#00853F" />
            <rect x="100" width="100" height="200" fill="#FDEF42" />
            <rect x="200" width="100" height="200" fill="#E31B23" />
            <polygon
              points="150,75 156,93 175,93 160,105 165,123 150,111 135,123 140,105 125,93 144,93"
              fill="#00853F"
            />
          </svg>
        );
      case "TG": // Togo
        return (
          <svg viewBox="0 0 300 200" className="w-full h-full">
            <rect width="300" height="40" fill="#006A4E" />
            <rect y="40" width="300" height="40" fill="#FFCE00" />
            <rect y="80" width="300" height="40" fill="#006A4E" />
            <rect y="120" width="300" height="40" fill="#FFCE00" />
            <rect y="160" width="300" height="40" fill="#006A4E" />
            <rect width="80" height="80" fill="#D21034" />
            <polygon
              points="40,20 44,32 57,32 46,40 50,52 40,44 30,52 34,40 23,32 36,32"
              fill="#FFFFFF"
            />
          </svg>
        );
      case "BF": // Burkina Faso
        return (
          <svg viewBox="0 0 300 200" className="w-full h-full">
            <rect width="300" height="100" fill="#EF2B2D" />
            <rect y="100" width="300" height="100" fill="#009E49" />
            <polygon
              points="150,70 157,90 178,90 161,102 167,122 150,110 133,122 139,102 122,90 143,90"
              fill="#FCD116"
            />
          </svg>
        );
      case "ML": // Mali
        return (
          <svg viewBox="0 0 300 200" className="w-full h-full">
            <rect width="100" height="200" fill="#14B53A" />
            <rect x="100" width="100" height="200" fill="#FCD116" />
            <rect x="200" width="100" height="200" fill="#CE1126" />
          </svg>
        );
      case "NE": // Niger
        return (
          <svg viewBox="0 0 300 200" className="w-full h-full">
            <rect width="300" height="66.6" fill="#E05206" />
            <rect y="66.6" width="300" height="66.6" fill="#FFFFFF" />
            <rect y="133.3" width="300" height="66.6" fill="#0DB02B" />
            <circle cx="150" cy="100" r="24" fill="#E05206" />
          </svg>
        );
      case "GN": // Guinée
        return (
          <svg viewBox="0 0 300 200" className="w-full h-full">
            <rect width="100" height="200" fill="#CE1126" />
            <rect x="100" width="100" height="200" fill="#FCD116" />
            <rect x="200" width="100" height="200" fill="#009460" />
          </svg>
        );
      case "CM": // Cameroun
        return (
          <svg viewBox="0 0 300 200" className="w-full h-full">
            <rect width="100" height="200" fill="#007A5E" />
            <rect x="100" width="100" height="200" fill="#CE1126" />
            <rect x="200" width="100" height="200" fill="#FCD116" />
            <polygon
              points="150,75 156,93 175,93 160,105 165,123 150,111 135,123 140,105 125,93 144,93"
              fill="#FCD116"
            />
          </svg>
        );
      case "GA": // Gabon
        return (
          <svg viewBox="0 0 300 200" className="w-full h-full">
            <rect width="300" height="66.6" fill="#009E60" />
            <rect y="66.6" width="300" height="66.6" fill="#FCD116" />
            <rect y="133.3" width="300" height="66.6" fill="#3A75C4" />
          </svg>
        );
      case "CG": // Congo
        return (
          <svg viewBox="0 0 300 200" className="w-full h-full">
            <polygon points="0,0 180,0 0,180" fill="#009543" />
            <polygon points="180,0 300,0 300,20 120,200 0,200 0,180" fill="#FBDE4A" />
            <polygon points="300,20 300,200 120,200" fill="#DC241F" />
          </svg>
        );
      case "CD": // RD Congo
        return (
          <svg viewBox="0 0 300 200" className="w-full h-full">
            <rect width="300" height="200" fill="#007FFF" />
            <polygon points="0,170 240,0 300,0 300,30 60,200 0,200" fill="#F7D618" />
            <polygon points="0,180 260,0 280,0 20,200 0,200" fill="#CE1021" />
            <polygon
              points="45,25 49,38 62,38 52,46 56,58 45,50 34,58 38,46 28,38 41,38"
              fill="#F7D618"
            />
          </svg>
        );
      case "FR": // France
        return (
          <svg viewBox="0 0 300 200" className="w-full h-full">
            <rect width="100" height="200" fill="#002395" />
            <rect x="100" width="100" height="200" fill="#FFFFFF" />
            <rect x="200" width="100" height="200" fill="#ED2939" />
          </svg>
        );
      case "NG": // Nigeria
        return (
          <svg viewBox="0 0 300 200" className="w-full h-full">
            <rect width="100" height="200" fill="#008751" />
            <rect x="100" width="100" height="200" fill="#FFFFFF" />
            <rect x="200" width="100" height="200" fill="#008751" />
          </svg>
        );
      case "GH": // Ghana
        return (
          <svg viewBox="0 0 300 200" className="w-full h-full">
            <rect width="300" height="66.6" fill="#CE1126" />
            <rect y="66.6" width="300" height="66.6" fill="#FCD116" />
            <rect y="133.3" width="300" height="66.6" fill="#006B3F" />
            <polygon
              points="150,75 156,93 175,93 160,105 165,123 150,111 135,123 140,105 125,93 144,93"
              fill="#000000"
            />
          </svg>
        );
      case "MA": // Maroc
        return (
          <svg viewBox="0 0 300 200" className="w-full h-full">
            <rect width="300" height="200" fill="#C1272D" />
            <polygon
              points="150,60 158,85 185,85 163,101 171,126 150,110 129,126 137,101 115,85 142,85"
              fill="none"
              stroke="#006233"
              strokeWidth="6"
            />
          </svg>
        );
      case "GL": // International / Global
      case "GLOBAL":
        return (
          <svg viewBox="0 0 300 200" className="w-full h-full bg-navy">
            <rect width="300" height="200" fill="#0F1A33" />
            <circle cx="150" cy="100" r="55" fill="none" stroke="#B08D42" strokeWidth="6" />
            <ellipse cx="150" cy="100" rx="28" ry="55" fill="none" stroke="#B08D42" strokeWidth="5" />
            <line x1="95" y1="100" x2="205" y2="100" stroke="#B08D42" strokeWidth="5" />
          </svg>
        );
      default:
        return (
          <div className="w-full h-full bg-navy/10 flex items-center justify-center text-navy font-mono text-[9px] font-bold">
            {upperCode.slice(0, 2) || "??"}
          </div>
        );
    }
  };

  return (
    <span
      className={`inline-flex overflow-hidden shrink-0 border border-border/40 ${className}`}
      title={title || upperCode}
    >
      {renderFlagContent()}
    </span>
  );
}

export default CountryFlag;
