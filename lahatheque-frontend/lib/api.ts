export const libraryApi: any = {
  getAnnotations: async (bookId: string) => {
    try {
      const res = await fetch(`/api/bff/protection/annotations/?ouvrage=${bookId}`, { cache: 'no-store' });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : (data.results || []);
    } catch (e) {
      console.error('[libraryApi] getAnnotations error:', e);
      return [];
    }
  },

  saveAnnotation: async (annotation: any) => {
    const payload = {
      ouvrage: annotation.book || annotation.ouvrage,
      type: annotation.type || (annotation.content ? 'note' : 'highlight'),
      note_content: annotation.content || '',
      color: annotation.color || 'gold',
      selected_text: annotation.data?.quote || annotation.selected_text || '',
      position_data: annotation.data || annotation.position_data || {},
    };

    const method = annotation.id ? 'PATCH' : 'POST';
    const url = annotation.id ? `/api/bff/protection/annotations/${annotation.id}/` : '/api/bff/protection/annotations/';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || errData.detail || "Échec de la sauvegarde de l'annotation");
    }
    return await res.json();
  },

  deleteAnnotation: async (annotationId: string) => {
    const res = await fetch(`/api/bff/protection/annotations/${annotationId}/`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      throw new Error("Échec de la suppression de l'annotation");
    }
    return { success: true };
  },
};

export const SERVER_ROOT_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
export const http: any = {};
