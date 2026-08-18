import { useEffect } from "react";
import { toast } from "sonner";

export function usePdfReaderSecurity() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        toast.error("L'impression est désactivée pour sécuriser cet ouvrage.");
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        toast.error("Le téléchargement est désactivé.");
      }
    };

    const handleCopy = (e: ClipboardEvent) => {
      const target = e.target as Element;
      // Only block copy inside the reader zones
      if (target && target.closest('.laha-reader-zone')) {
        e.preventDefault();
        toast.error("La copie de texte est désactivée dans la zone de lecture.");
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('copy', handleCopy);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('copy', handleCopy);
    };
  }, []);
}
