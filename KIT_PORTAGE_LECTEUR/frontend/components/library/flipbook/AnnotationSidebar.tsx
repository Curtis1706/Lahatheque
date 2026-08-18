import React, { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, StickyNote, Highlighter, Minus, Trash2, ChevronRight } from 'lucide-react'
import { Annotation } from './types'

interface AnnotationSidebarProps {
  isOpen: boolean
  onClose: () => void
  annotations: Annotation[]
  onNavigate: (pageIdx: number) => void
  onDelete: (id: string) => void
}

export function AnnotationSidebar({
  isOpen,
  onClose,
  annotations,
  onNavigate,
  onDelete
}: AnnotationSidebarProps) {
  // Group annotations by page for performance and clear UX
  const groupedAnnotations = useMemo(() => {
    const groups: Record<number, Annotation[]> = {}
    annotations.forEach(ann => {
      if (!groups[ann.page]) groups[ann.page] = []
      groups[ann.page].push(ann)
    })
    return Object.entries(groups)
      .map(([page, anns]) => ({
        page: parseInt(page, 10),
        annotations: anns.sort((a, b) => {
          // Sort by Y position on the page naturally
          return a.rect.y - b.rect.y
        })
      }))
      .sort((a, b) => a.page - b.page)
  }, [annotations])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[800] bg-black/20 pointer-events-auto"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-0 bottom-0 right-0 w-[340px] z-[900] bg-[#0B0F19]/95 backdrop-blur-3xl border-l border-white/10 shadow-[-20px_0_40px_rgba(0,0,0,0.5)] flex flex-col pointer-events-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10 shrink-0">
              <div>
                <h2 className="text-laha-gold text-xs font-black uppercase tracking-[0.2em] mb-1 flex items-center gap-2">
                  <StickyNote size={14} /> Vos Annotations
                </h2>
                <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest italic">
                  {annotations.length} au total
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:bg-white/10 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content (Scrollable list of groups) */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-8 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {groupedAnnotations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-white/20 text-center space-y-4">
                  <Highlighter size={40} strokeWidth={1} />
                  <p className="text-xs italic px-8">Surlignez, soulignez ou ajoutez des notes pour les retrouver ici.</p>
                </div>
              ) : (
                groupedAnnotations.map((group) => (
                  <div key={group.page} className="space-y-3">
                    <button
                      onClick={() => onNavigate(group.page)}
                      className="group flex items-center justify-between w-full text-left"
                    >
                      <h3 className="text-white/80 text-[11px] font-black uppercase tracking-widest flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[8px] text-white/50 group-hover:bg-laha-gold group-hover:text-black transition-colors">
                          {group.page + 1}
                        </span>
                        Page {group.page + 1}
                      </h3>
                      <ChevronRight size={14} className="text-white/20 group-hover:text-laha-gold transition-colors group-hover:translate-x-1" />
                    </button>

                    <div className="space-y-2">
                      {group.annotations.map(ann => (
                        <div
                          key={ann.id}
                          onClick={() => onNavigate(ann.page)}
                          className="group relative bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl p-3 cursor-pointer transition-colors"
                        >
                          <div className="flex items-start justify-between gap-3">
                            {/* Icon / Color indicator */}
                            <div className="mt-0.5 shrink-0">
                              {ann.type === 'note' ? (
                                <StickyNote size={14} className="text-laha-gold" />
                              ) : ann.type === 'highlight' ? (
                                <div className="w-3.5 h-3.5 rounded-sm" style={{ background: ann.color }} />
                              ) : (
                                <Minus size={14} style={{ color: ann.color.replace('0.35', '1') }} strokeWidth={3} />
                              )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1">
                                {ann.type === 'note' ? 'Note' : ann.type === 'highlight' ? 'Surlignage' : 'Soulignement'}
                              </p>
                              {ann.type === 'note' && (
                                <p className="text-xs text-white/80 line-clamp-3 italic leading-relaxed">
                                  "{ann.content}"
                                </p>
                              )}
                            </div>

                            {/* Delete button (shows on hover) */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                onDelete(ann.id)
                              }}
                              className="shrink-0 p-1.5 rounded-md text-white/20 hover:text-red-400 hover:bg-red-400/10 opacity-0 group-hover:opacity-100 transition-all"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
