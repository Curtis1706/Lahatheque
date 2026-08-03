import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { libraryApi } from "@/lib/api";

export function useAnnotations(bookId: string | undefined) {
  const [notes, setNotes] = useState<any[]>([]);

  const fetchAnnotations = useCallback(async (id: string) => {
    if (!id || typeof id !== 'string') return;
    try {
      const res = await libraryApi.getAnnotations(id);
      const rawData = Array.isArray(res) ? res : (res?.results || []);
      const data = Array.isArray(rawData) ? rawData : [];

      setNotes(data.map((n: any) => ({
        id: n.id,
        content: n.content,
        highlightAreas: n.data?.highlightAreas || [],
        quote: n.data?.quote || "",
        type: n.data?.type || 'highlight',
        rect: n.data?.rect || null,
        color: n.data?.color || 'rgba(255,215,0,0.45)',
        page: n.data?.page ?? (n.data?.highlightAreas?.[0]?.pageIndex ?? 0),
      })));
    } catch (err) {
      console.error("Erreur chargement annotations", err);
      setNotes([]);
    }
  }, []);

  useEffect(() => {
    if (bookId) fetchAnnotations(bookId);
  }, [bookId, fetchAnnotations]);

  const handleDeleteAnnotation = async (noteId: string) => {
    if (!confirm("Supprimer cette annotation ?")) return;
    try {
      await libraryApi.deleteAnnotation(noteId);
      setNotes(prev => prev.filter(n => n.id !== noteId));
      toast.success("Annotation supprimée");
    } catch (err) {
      toast.error("Échec de la suppression");
    }
  };

  const handleHighlight = async (props: any, comment: string, bookIdStr: string) => {
    try {
      const annotation = {
        book: bookIdStr,
        content: comment,
        data: {
          quote: props.selectedText,
          highlightAreas: props.highlightAreas,
        },
        color: 'gold'
      };
      const saved = await libraryApi.saveAnnotation(annotation);
      setNotes(prev => [...prev, {
        id: saved.id,
        content: comment,
        highlightAreas: props.highlightAreas,
        quote: props.selectedText
      }]);
      toast.success(comment ? "Note enregistrée !" : "Texte surligné !");
    } catch (err) {
      toast.error("Échec de la sauvegarde de l'annotation");
    }
  };

  return {
    notes,
    setNotes,
    fetchAnnotations,
    handleDeleteAnnotation,
    handleHighlight
  };
}
