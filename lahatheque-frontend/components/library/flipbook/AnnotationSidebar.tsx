"use client";

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, StickyNote, Highlighter, Minus, Trash2, ChevronRight } from 'lucide-react';
import { Annotation } from './types';

interface AnnotationSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  annotations: Annotation[];
  onNavigate: (pageIdx: number) => void;
  onDelete: (id: string) => void;
}

export function AnnotationSidebar({
  isOpen,
  onClose,
  annotations,
  onNavigate,
  onDelete,
}: AnnotationSidebarProps) {
  const groupedAnnotations = useMemo(() => {
    const groups: Record<number, Annotation[]> = {};
    annotations.forEach((ann) => {
      if (!groups[ann.page]) groups[ann.page] = [];
      groups[ann.page].push(ann);
    });
    return Object.entries(groups)
      .map(([page, anns]) => ({
        page: parseInt(page, 10),
        annotations: anns.sort((a, b) => a.rect.y - b.rect.y),
      }))
      .sort((a, b) => a.page - b.page);
  }, [annotations]);

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
            className="fixed inset-0 z-[800] bg-black/60 pointer-events-auto"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-0 bottom-0 right-0 w-[340px] z-[900] bg-navy border-l border-navy-hover shadow-2xl flex flex-col pointer-events-auto text-white"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-navy-hover shrink-0">
              <div>
                <h2 className="text-gold text-xs font-black uppercase tracking-[0.2em] mb-1 flex items-center gap-2">
                  <StickyNote size={14} /> Vos Annotations
                </h2>
                <p className="text-navy-light text-[10px] uppercase font-bold tracking-widest italic">
                  {annotations.length} au total
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20 hover:text-white transition-colors cursor-pointer min-h-[32px] min-w-[32px]"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content (Scrollable list of groups) */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-6">
              {groupedAnnotations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-white/30 text-center space-y-4">
                  <Highlighter size={40} strokeWidth={1} />
                  <p className="text-xs italic px-8">Surlignez, soulignez ou ajoutez des notes pour les retrouver ici.</p>
                </div>
              ) : (
                groupedAnnotations.map((group) => (
                  <div key={group.page} className="space-y-3">
                    <button
                      type="button"
                      onClick={() => onNavigate(group.page)}
                      className="group flex items-center justify-between w-full text-left cursor-pointer"
                    >
                      <h3 className="text-white/80 text-[11px] font-black uppercase tracking-widest flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[9px] text-white/70 group-hover:bg-gold group-hover:text-navy transition-colors font-mono">
                          {group.page + 1}
                        </span>
                        Page {group.page + 1}
                      </h3>
                      <ChevronRight size={14} className="text-white/30 group-hover:text-gold transition-colors group-hover:translate-x-1" />
                    </button>

                    <div className="space-y-2">
                      {group.annotations.map((ann) => (
                        <div
                          key={ann.id}
                          onClick={() => onNavigate(ann.page)}
                          className="group relative bg-navy-dark/60 hover:bg-navy-dark border border-navy-hover rounded-2xl p-3 cursor-pointer transition-colors"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="mt-0.5 shrink-0">
                              {ann.type === 'note' ? (
                                <StickyNote size={14} className="text-gold" />
                              ) : ann.type === 'highlight' ? (
                                <div className="w-3.5 h-3.5 rounded-sm" style={{ background: ann.color }} />
                              ) : (
                                <Minus size={14} style={{ color: ann.color.replace('0.35', '1') }} strokeWidth={3} />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-navy-light mb-1">
                                {ann.type === 'note' ? 'Note' : ann.type === 'highlight' ? 'Surlignage' : 'Soulignement'}
                              </p>
                              {ann.type === 'note' && (
                                <p className="text-xs text-white/90 line-clamp-3 italic leading-relaxed">
                                  &ldquo;{ann.content}&rdquo;
                                </p>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDelete(ann.id);
                              }}
                              className="shrink-0 p-1.5 rounded-md text-white/30 hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
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
  );
}
