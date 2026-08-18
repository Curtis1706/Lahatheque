"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StickyNote, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Annotation, ActiveTool } from './types';

interface AnnotationLayerProps {
  annotations: Annotation[];
  activeTool: ActiveTool;
  onDelete: (id: string) => void;
}

export function AnnotationLayer({ annotations, activeTool, onDelete }: AnnotationLayerProps) {
  return (
    <div className="absolute inset-0 pointer-events-none z-10" aria-hidden>
      {annotations.map((ann) => {
        if (ann.type === 'highlight') {
          return (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              key={ann.id}
              className={cn("absolute transition-all duration-200", activeTool === 'erase' && "pointer-events-auto cursor-not-allowed hover:opacity-50")}
              style={{
                left:   `${ann.rect.x}%`,
                top:    `${ann.rect.y}%`,
                width:  `${ann.rect.w}%`,
                height: `${ann.rect.h}%`,
                background: ann.color,
                mixBlendMode: 'multiply',
              }}
              onClick={() => activeTool === 'erase' && onDelete(ann.id)}
            />
          );
        }
        if (ann.type === 'underline') {
          return (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: `${ann.rect.w}%` }}
              key={ann.id}
              className={cn("absolute", activeTool === 'erase' && "pointer-events-auto cursor-not-allowed")}
              style={{
                left:   `${ann.rect.x}%`,
                top:    `${ann.rect.y + ann.rect.h}%`,
                height: '3px',
                background: ann.color.replace('0.35', '0.9').replace('0.45', '0.9'),
                borderRadius: '2px',
              }}
              onClick={() => activeTool === 'erase' && onDelete(ann.id)}
            />
          );
        }
        if (ann.type === 'note') {
          return (
            <NotePin
              key={ann.id}
              annotation={ann}
              onDelete={onDelete}
              activeTool={activeTool}
            />
          );
        }
        return null;
      })}
    </div>
  );
}

function NotePin({ annotation, onDelete, activeTool }: { annotation: Annotation; onDelete: (id: string) => void; activeTool: ActiveTool }) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      className="absolute z-20 pointer-events-auto"
      style={{ left: `${annotation.rect.x}%`, top: `${annotation.rect.y}%` }}
    >
      <button
        type="button"
        className={cn(
          "w-7 h-7 rounded-full bg-navy text-gold shadow-md border border-navy-hover flex items-center justify-center transition-transform hover:scale-110 min-h-[28px] min-w-[28px]",
          activeTool === 'erase' && "ring-2 ring-destructive bg-destructive/20 text-destructive"
        )}
        onClick={() => activeTool === 'erase' ? onDelete(annotation.id) : setShowTooltip(v => !v)}
      >
        <StickyNote size={14} strokeWidth={2.5} />
      </button>

      <AnimatePresence>
        {showTooltip && activeTool !== 'erase' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="absolute left-10 top-0 bg-navy border border-navy-hover rounded-2xl p-4 w-64 shadow-xl z-50 origin-top-left text-white"
          >
            <div className="flex items-center justify-between mb-3 border-b border-navy-hover pb-2">
              <p className="text-[10px] font-black text-gold uppercase tracking-widest flex items-center gap-2">
                <StickyNote size={12} /> Note sauvegardée
              </p>
              <button type="button" onClick={() => setShowTooltip(false)} className="text-white/60 hover:text-white transition-colors">
                <X size={14} />
              </button>
            </div>
            <p className="text-xs text-white/90 leading-relaxed italic">{annotation.content}</p>
            <button
              type="button"
              onClick={() => onDelete(annotation.id)}
              className="mt-4 pt-3 border-t border-navy-hover w-full text-[10px] font-bold uppercase text-destructive hover:text-destructive-hover flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 size={12} /> Supprimer
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
