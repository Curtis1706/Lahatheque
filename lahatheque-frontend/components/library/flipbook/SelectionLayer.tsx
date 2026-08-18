"use client";

import React, { useState, useRef } from 'react';
import { ActiveTool, AnnotationRect, TOOL_CURSORS, HIGHLIGHT_COLORS } from './types';

interface SelectionLayerProps {
  activeTool: ActiveTool;
  activeColor: typeof HIGHLIGHT_COLORS[0];
  pageIdx: number;
  onAnnotationCreate: (ann: any) => void;
  onNoteCreate: (rect: AnnotationRect & { pageIdx: number }) => void;
}

export function SelectionLayer({
  activeTool,
  activeColor,
  pageIdx,
  onAnnotationCreate,
  onNoteCreate,
}: SelectionLayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragCurrent, setDragCurrent] = useState<{ x: number; y: number } | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (activeTool === 'read' || activeTool === 'erase') return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setDragStart({ x, y });
    setDragCurrent({ x, y });
    setIsDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dragStart) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100));
    setDragCurrent({ x, y });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);

    if (!dragStart || !dragCurrent) return;

    const x = Math.min(dragStart.x, dragCurrent.x);
    const y = Math.min(dragStart.y, dragCurrent.y);
    const w = Math.abs(dragCurrent.x - dragStart.x);
    const h = Math.abs(dragCurrent.y - dragStart.y);

    if (w < 1 || h < 0.5) {
      setDragStart(null);
      setDragCurrent(null);
      return;
    }

    const finalRect = { x, y, w, h, pageIdx };

    if (activeTool === 'note') {
      onNoteCreate(finalRect);
    } else {
      onAnnotationCreate({
        page:  pageIdx,
        type:  activeTool as 'highlight' | 'underline',
        rect:  { x, y, w, h },
        color: activeColor.value,
      });
    }
    setDragStart(null);
    setDragCurrent(null);
  };

  if (activeTool === 'read' || activeTool === 'erase') return null;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-30 touch-none"
      style={{ cursor: TOOL_CURSORS[activeTool] }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {isDragging && dragStart && dragCurrent && (
        <div
          className="absolute pointer-events-none"
          style={{
            left:   `${Math.min(dragStart.x, dragCurrent.x)}%`,
            top:    `${Math.min(dragStart.y, dragCurrent.y)}%`,
            width:  `${Math.abs(dragCurrent.x - dragStart.x)}%`,
            height: activeTool === 'underline' ? '3px' : `${Math.abs(dragCurrent.y - dragStart.y)}%`,
            background: activeTool === 'highlight' ? activeColor.value : (activeTool === 'underline' ? activeColor.border : 'rgba(212, 175, 55, 0.2)'),
            border: activeTool === 'note' ? `2px dashed ${activeColor.border}` : 'none',
            mixBlendMode: activeTool === 'highlight' ? 'multiply' : 'normal',
            marginTop: activeTool === 'underline' ? `${Math.abs(dragCurrent.y - dragStart.y)}%` : 0,
            borderRadius: activeTool === 'underline' ? '2px' : '0px',
          }}
        />
      )}
    </div>
  );
}
