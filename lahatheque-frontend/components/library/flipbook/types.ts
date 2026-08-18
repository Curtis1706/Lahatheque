export type AnnotationType = 'highlight' | 'underline' | 'note';
export type ActiveTool = 'read' | 'highlight' | 'underline' | 'note' | 'erase';

export interface AnnotationRect {
  x: number;   // % of page width
  y: number;   // % of page height
  w: number;   // % of page width
  h: number;   // % of page height
}

export interface Annotation {
  id: string;
  page: number;          // 0-indexed
  type: AnnotationType;
  rect: AnnotationRect;
  color: string;
  content?: string;      // for notes
  created_at?: string;
}

export const HIGHLIGHT_COLORS = [
  { name: 'Or',    value: 'rgba(212,175,55,0.45)',  border: 'var(--gold)' },
  { name: 'Rose',  value: 'rgba(244,114,182,0.35)', border: 'var(--accent)' },
  { name: 'Vert',  value: 'rgba(74,222,128,0.35)',  border: 'var(--success)' },
  { name: 'Bleu',  value: 'rgba(96,165,250,0.35)',  border: 'var(--info)' },
];

export const TOOL_CURSORS: Record<ActiveTool, string> = {
  read:      'default',
  highlight: 'crosshair',
  underline: 'crosshair',
  note:      'cell',
  erase:     'not-allowed',
};
