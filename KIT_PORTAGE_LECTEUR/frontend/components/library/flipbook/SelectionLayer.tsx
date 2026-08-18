import React, { useState, useEffect, useRef } from 'react'
import { ActiveTool, AnnotationRect, TOOL_CURSORS, HIGHLIGHT_COLORS } from './types'

interface SelectionLayerProps {
  activeTool: ActiveTool
  activeColor: typeof HIGHLIGHT_COLORS[0]
  pageIdx: number
  onAnnotationCreate: (ann: any) => void
  onNoteCreate: (rect: AnnotationRect & { pageIdx: number }) => void
}

export function SelectionLayer({
  activeTool,
  activeColor,
  pageIdx,
  onAnnotationCreate,
  onNoteCreate
}: SelectionLayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)
  const [dragCurrent, setDragCurrent] = useState<{ x: number; y: number } | null>(null)

  // Listen to mousemove and mouseup on the window for robust dragging
  useEffect(() => {
    if (!isDragging || !dragStart) return

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault()
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return
      
      const x = Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100))
      const y = Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100))
      setDragCurrent({ x, y })
    }

    const handleMouseUp = (e: MouseEvent) => {
      if (!dragStart || !dragCurrent) {
        setIsDragging(false)
        return
      }

      // Final calculation using latest state via a ref or just closure state (re-binds correctly if dependencies are met but useEffect doesn't have [dragCurrent] so we should use state setter callback or just handle it here)
      // Actually because effect runs only when isDragging/dragStart changes, dragCurrent might be stale here if we use the state directly.
      // Better to track coordinates in a ref for mouse up.
    }

    window.addEventListener('mousemove', handleMouseMove)
    // We will handle mouse up in the main div to avoid staleness, but if the cursor leaves the window it might get stuck.
    // Let's use a standard React approach: onPointerMove / onPointerUp on a capture overlay or window binding with refs.
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [isDragging, dragStart])


  // Let's use simpler standard React pointer events that natively handle drag capture (setPointerCapture)
  const handlePointerDown = (e: React.PointerEvent) => {
    if (activeTool === 'read' || activeTool === 'erase') return
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    
    setDragStart({ x, y })
    setDragCurrent({ x, y })
    setIsDragging(true)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dragStart) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100))
    const y = Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100))
    setDragCurrent({ x, y })
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return
    setIsDragging(false)
    e.currentTarget.releasePointerCapture(e.pointerId)

    if (!dragStart || !dragCurrent) return

    const x = Math.min(dragStart.x, dragCurrent.x)
    const y = Math.min(dragStart.y, dragCurrent.y)
    const w = Math.abs(dragCurrent.x - dragStart.x)
    const h = Math.abs(dragCurrent.y - dragStart.y)

    // Ignore tiny clicks
    if (w < 1 || h < 0.5) {
      setDragStart(null)
      setDragCurrent(null)
      return
    }

    const finalRect = { x, y, w, h, pageIdx }

    if (activeTool === 'note') {
      onNoteCreate(finalRect)
    } else {
      onAnnotationCreate({
        page:  pageIdx,
        type:  activeTool as 'highlight' | 'underline',
        rect:  { x, y, w, h },
        color: activeColor.value,
      })
    }
    setDragStart(null)
    setDragCurrent(null)
  }

  if (activeTool === 'read' || activeTool === 'erase') return null

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
      {/* WYSIWYG Real-time Feedback for this specific page */}
      {isDragging && dragStart && dragCurrent && (
        <div
          className="absolute pointer-events-none"
          style={{
            left:   `${Math.min(dragStart.x, dragCurrent.x)}%`,
            top:    `${Math.min(dragStart.y, dragCurrent.y)}%`,
            width:  `${Math.abs(dragCurrent.x - dragStart.x)}%`,
            height: activeTool === 'underline' ? '3px' : `${Math.abs(dragCurrent.y - dragStart.y)}%`,
            background: activeTool === 'highlight' ? activeColor.value : (activeTool === 'underline' ? activeColor.border : 'rgba(255, 255, 255, 0.1)'),
            border: activeTool === 'note' ? `2px dashed ${activeColor.border}` : 'none',
            mixBlendMode: activeTool === 'highlight' ? 'multiply' : 'normal',
            marginTop: activeTool === 'underline' ? `${Math.abs(dragCurrent.y - dragStart.y)}%` : 0,
            transform: activeTool === 'note' ? 'scale(1.05)' : 'none',
            transformOrigin: 'center',
            transition: activeTool === 'note' ? 'transform 0.1s' : 'none',
            borderRadius: activeTool === 'underline' ? '2px' : '0px',
          }}
        />
      )}
    </div>
  )
}
