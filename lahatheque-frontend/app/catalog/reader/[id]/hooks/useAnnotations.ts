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

      setNotes(data.map((n: any) => {
        const posData = n.position_data || n.data || {};
        return {
          id: n.id,
          content: n.note_content || n.content || "",
          highlightAreas: posData.highlightAreas || n.highlightAreas || [],
          quote: n.selected_text || posData.quote || n.quote || "",
          type: n.type || 'highlight',
          rect: posData.rect || null,
          color: n.color || 'gold',
          page: posData.page ?? (posData.highlightAreas?.[0]?.pageIndex ?? 0),
        };
      }));
    } catch (err) {
      console.error("Erreur chargement annotations", err);
      setNotes([]);
    }
  }, []);

  useEffect(() => {
    if (bookId && bookId !== 'lesson_pdf') {
      fetchAnnotations(bookId);
    }
  }, [bookId, fetchAnnotations]);

  const handleDeleteAnnotation = async (noteId: string) => {
    if (!confirm("Supprimer cette annotation ?")) return;

    // Optimistic UI update
    const previousNotes = [...notes];
    setNotes(prev => prev.filter(n => n.id !== noteId));

    try {
      await libraryApi.deleteAnnotation(noteId);
      toast.success("Annotation supprimée");
    } catch (err) {
      // Rollback on error
      setNotes(previousNotes);
      toast.error("Échec de la suppression de l'annotation");
    }
  };

  const handleHighlight = async (props: any, comment: string, bookIdStr: string) => {
    const tempId = `temp-${Date.now()}`;
    const newNote = {
      id: tempId,
      content: comment,
      highlightAreas: props.highlightAreas || [],
      quote: props.selectedText || "",
      type: comment ? 'note' : 'highlight',
      color: 'gold',
      page: props.highlightAreas?.[0]?.pageIndex ?? 0,
    };

    // Optimistic UI update
    setNotes(prev => [...prev, newNote]);

    try {
      const payload = {
        book: bookIdStr,
        content: comment,
        type: comment ? 'note' : 'highlight',
        color: 'gold',
        data: {
          quote: props.selectedText,
          highlightAreas: props.highlightAreas,
        },
      };

      const saved = await libraryApi.saveAnnotation(payload);
      
      // Reconcile temporary ID with real backend ID
      setNotes(prev => prev.map(n => n.id === tempId ? { ...n, id: saved.id } : n));
      toast.success(comment ? "Note enregistrée !" : "Texte surligné !");
    } catch (err) {
      // Rollback on failure
      setNotes(prev => prev.filter(n => n.id !== tempId));
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
