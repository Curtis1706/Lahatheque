import { useState, useCallback } from 'react'
import { Annotation, ActiveTool, HIGHLIGHT_COLORS } from '../types'
import { libraryApi } from '@/lib/api'
import { toast } from 'sonner'

export function useAnnotationEngine(bookId: string, initialAnnotations: Annotation[]) {
  const [annotations, setAnnotations] = useState<Annotation[]>(initialAnnotations)
  const [activeTool, setActiveTool]   = useState<ActiveTool>('read')
  const [activeColor, setActiveColor] = useState(HIGHLIGHT_COLORS[0])
  
  // Note modal state
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [pendingNoteRect, setPendingNoteRect] = useState<any>(null)

  const handleAnnotationCreate = useCallback(async (ann: Omit<Annotation, 'id' | 'created_at'>) => {
    const tempId = `temp-${Date.now()}`
    const tempAnn: Annotation = { ...ann, id: tempId, created_at: new Date().toISOString() }
    setAnnotations(prev => [...prev, tempAnn])

    try {
      const saved = await libraryApi.saveAnnotation({
        book:    bookId,
        content: ann.content || '',
        data: {
          type:  ann.type,
          rect:  ann.rect,
          color: ann.color,
          page:  ann.page,
        },
      })
      setAnnotations(prev => prev.map(a => a.id === tempId ? { ...a, id: saved.id } : a))
      // Mute the annoying toast for highlight/underline because doing it in real-time makes toast spam
      if (ann.type === 'note') {
        toast.success('📝 Note enregistrée')
      }
    } catch {
      setAnnotations(prev => prev.filter(a => a.id !== tempId))
      toast.error('Impossible de sauvegarder l\'annotation.')
    }
  }, [bookId])

  const handleAnnotationDelete = useCallback(async (id: string) => {
    const prev = annotations.find(a => a.id === id)
    setAnnotations(p => p.filter(a => a.id !== id))
    try {
      await libraryApi.deleteAnnotation(id)
    } catch {
      if (prev) setAnnotations(p => [...p, prev])
      toast.error('Échec de la suppression')
    }
  }, [annotations])

  return {
    annotations,
    activeTool, setActiveTool,
    activeColor, setActiveColor,
    handleAnnotationCreate,
    handleAnnotationDelete,
    showNoteModal, setShowNoteModal,
    noteText, setNoteText,
    pendingNoteRect, setPendingNoteRect
  }
}
