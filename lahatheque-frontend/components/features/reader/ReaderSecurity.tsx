"use client";

import { useEffect } from "react";

/**
 * Mode "laha" : filigrane institutionnel discret — pour les lectures directes sur LAHAThèque.
 * Mode "partner" : filigrane nominatif légal — pour les sessions API partenaires
 *   avec nom, email et IP de l'utilisateur (imputabilité juridique).
 */
export type WatermarkMode = "laha" | "partner";

interface ReaderSecurityProps {
  allowPrint?: boolean;
  allowCopy?: boolean;
  /** Mode du filigrane affiché en surcouche. Défaut: "laha" */
  watermarkMode?: WatermarkMode;
  /** Texte principal du filigrane LAHAThèque personnalisable */
  watermarkLahaText?: string;
  /** Sous-texte du filigrane LAHAThèque personnalisable */
  watermarkLahaSubtext?: string;
  /** Position du filigrane sur la page : diagonal, header, footer. Défaut: diagonal */
  watermarkPosition?: "diagonal" | "header" | "footer";
  /** Opacité du filigrane entre 0.05 et 0.50. Défaut: 0.15 */
  watermarkOpacity?: number;
  /** Données de l'utilisateur pour le mode "partner" */
  watermarkUser?: {
    displayName?: string;
    email?: string;
    ip?: string;
  };
}

export function ReaderSecurity({
  allowPrint = false,
  allowCopy = false,
  watermarkMode = "laha",
  watermarkPosition = "diagonal",
  watermarkOpacity = 0.18,
  watermarkLahaText,
  watermarkLahaSubtext,
  watermarkUser,
}: ReaderSecurityProps) {

  useEffect(() => {
    // 1. Désactivation du clic droit
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // 2. Interception des raccourcis clavier sensibles
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+P (Impression)
      if (!allowPrint && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      // Ctrl+S (Sauvegarde du fichier)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      // Ctrl+C (Copie si interdite)
      if (!allowCopy && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c") {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      // F12 ou Ctrl+Shift+I (Outils de développement)
      if (
        e.key === "F12" ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "i")
      ) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [allowPrint, allowCopy]);

  return (
    <style jsx global>{`
      @media print {
        body, html, #__next, .laha-reader-zone, .rpv-core__viewer {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
        }
      }
      ${!allowCopy
        ? `
        .laha-reader-zone, .laha-reader-zone *, .rpv-core__viewer, .rpv-core__viewer * {
          -webkit-user-select: none !important;
          -moz-user-select: none !important;
          -ms-user-select: none !important;
          user-select: none !important;
        }
      `
        : ""}
    `}</style>
  );
}

