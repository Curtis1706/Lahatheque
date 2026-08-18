export type AnnotationType = 'highlight' | 'underline' | 'note'
export type ActiveTool = 'read' | 'highlight' | 'underline' | 'note' | 'erase'

export interface AnnotationRect {
  x: number   // % of page width
  y: number   // % of page height
  w: number   // % of page width
  h: number   // % of page height
}

export interface Annotation {
  id: string
  page: number          // 0-indexed
  type: AnnotationType
  rect: AnnotationRect
  color: string
  content?: string      // for notes
  created_at?: string
}

export const HIGHLIGHT_COLORS = [
  { name: 'Or',    value: 'rgba(255,215,0,0.45)',   border: '#F3C900' },
  { name: 'Rose',  value: 'rgba(255,100,150,0.35)', border: '#F06292' },
  { name: 'Vert',  value: 'rgba(72,199,116,0.35)',  border: '#48C774' },
  { name: 'Bleu',  value: 'rgba(72,156,230,0.35)',  border: '#4A9CE6' },
]

export const TOOL_CURSORS: Record<ActiveTool, string> = {
  read:      'default',
  highlight: 'crosshair',
  underline: 'crosshair',
  note:      'cell',
  erase:     'not-allowed',
}
