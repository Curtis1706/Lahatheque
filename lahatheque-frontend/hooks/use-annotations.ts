import { useState } from 'react';

export function useAnnotations(documentId: string) {
  const [annotations, setAnnotations] = useState([]);
  return { annotations, setAnnotations };
}
