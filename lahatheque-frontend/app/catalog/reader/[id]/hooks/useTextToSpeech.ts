"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { toast } from "sonner";
import { ViewMode } from '@react-pdf-viewer/core';

interface UseTextToSpeechProps {
  book: any;
  currentPage: number;
  rawPdfData: string | ArrayBuffer | Uint8Array | null;
  effectiveImmersionMode: boolean;
  viewMode: ViewMode;
  currentLanguage?: string;
}

const OPENAI_VOICES = [
  { voiceURI: 'openai-nova',    name: 'Nova — Douce & Chaleureuse',    lang: 'fr-FR', tag: '[FR]' },
  { voiceURI: 'openai-shimmer', name: 'Shimmer — Expressive & Claire', lang: 'fr-FR', tag: '[FR]' },
  { voiceURI: 'openai-alloy',   name: 'Alloy — Neutre & Professionnelle', lang: 'fr-FR', tag: '[FR]' },
  { voiceURI: 'openai-fable',   name: 'Fable — Narrative & Captivante', lang: 'en-US', tag: '[EN]' },
  { voiceURI: 'openai-echo',    name: 'Echo — Grave & Posée',           lang: 'fr-FR', tag: '[FR]' },
  { voiceURI: 'openai-onyx',    name: 'Onyx — Profonde & Autoritaire',  lang: 'fr-FR', tag: '[FR]' },
] as const;

type OpenAIVoiceId = 'nova' | 'shimmer' | 'alloy' | 'fable' | 'echo' | 'onyx';

function voiceIdFromURI(uri: string): OpenAIVoiceId {
  return uri.replace('openai-', '') as OpenAIVoiceId;
}

function makeVoice(v: typeof OPENAI_VOICES[number]): SpeechSynthesisVoice {
  return {
    voiceURI: v.voiceURI,
    name: v.name,
    lang: v.lang,
    localService: false,
    default: v.voiceURI === 'openai-nova',
  } as SpeechSynthesisVoice;
}

function chunkText(text: string, maxLen = 800): string[] {
  const sentences = text.match(/[^.!?…;\n]+[.!?…;\n]*\s*/g) || [text];
  const chunks: string[] = [];
  let current = '';
  let isFirstChunk = true;

  for (const s of sentences) {
    const limit = isFirstChunk ? 150 : maxLen;
    if ((current + s).length > limit) {
      if (current.trim()) {
        chunks.push(current.trim());
        isFirstChunk = false;
      }
      current = s;
    } else {
      current += s;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

export function useTextToSpeech({ book, currentPage, rawPdfData, effectiveImmersionMode, viewMode, currentLanguage = 'fr' }: UseTextToSpeechProps) {
  const [isTtsActive, setIsTtsActive] = useState(false);
  const [isTtsPaused, setIsTtsPaused] = useState(false);
  const [ttsRate, setTtsRateState] = useState(1);
  const [ttsPitch, setTtsPitch] = useState(1);
  const [ttsVoice, setTtsVoice] = useState<SpeechSynthesisVoice>(makeVoice(OPENAI_VOICES[0]));
  const [ttsPageText, setTtsPageText] = useState<string>("");
  const [isFetchingTtsText, setIsFetchingTtsText] = useState(false);
  const [showVoicePicker, setShowVoicePicker] = useState(false);

  // Synchroniser la voix TTS avec la langue active du document
  useEffect(() => {
    const lang = (currentLanguage || 'fr').toLowerCase();
    const matchingVoice = OPENAI_VOICES.find(v => v.lang.toLowerCase().startsWith(lang));
    if (matchingVoice) {
      setTtsVoice(makeVoice(matchingVoice));
    }
  }, [currentLanguage]);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlsRef = useRef<string[]>([]);
  const chunksRef = useRef<string[]>([]);
  const chunkIndexRef = useRef(0);
  const isActiveRef = useRef(false);
  const pdfDocRef = useRef<any>(null);
  const fetchRequestIdRef = useRef(0);
  const ttsRateRef = useRef(1);

  const setTtsRate = useCallback((rate: number) => {
    setTtsRateState(rate);
    ttsRateRef.current = rate;
    if (audioRef.current) audioRef.current.playbackRate = rate;
  }, []);

  const cleanupBlobUrls = useCallback(() => {
    blobUrlsRef.current.forEach(url => URL.revokeObjectURL(url));
    blobUrlsRef.current = [];
  }, []);

  useEffect(() => {
    return () => {
      isActiveRef.current = false;
      if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ''; }
      cleanupBlobUrls();
    };
  }, [cleanupBlobUrls]);

  useEffect(() => {
    return () => {
      if (pdfDocRef.current) { pdfDocRef.current.destroy(); pdfDocRef.current = null; }
    };
  }, [rawPdfData]);

  const ttsVoices = useMemo(() => OPENAI_VOICES.map(makeVoice), []);

  const categorizedVoices = useMemo(() => {
    const fr = ttsVoices.filter(v => v.lang.startsWith('fr'));
    const en = ttsVoices.filter(v => v.lang.startsWith('en'));
    const others: SpeechSynthesisVoice[] = [];

    const tagVoice = (v: SpeechSynthesisVoice) => {
      const found = OPENAI_VOICES.find(o => o.voiceURI === v.voiceURI);
      return found?.tag || '[FR]';
    };

    return { fr, en, others, tagVoice };
  }, [ttsVoices]);

  const generateChunkAudio = useCallback(async (text: string, voiceId: OpenAIVoiceId, speed: number): Promise<string | null> => {
    try {
      const res = await fetch('/api/bff/legacy/tts/generate/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice: voiceId, speed }),
      });

      if (!res.ok) return null;
      const audioBlob = await res.blob();
      const blobUrl = URL.createObjectURL(audioBlob);
      blobUrlsRef.current.push(blobUrl);
      return blobUrl;
    } catch (e) {
      return null;
    }
  }, []);

  const prefetchedChunksRef = useRef<Record<number, Promise<string | null> | string>>({});

  const prefetchChunk = (index: number, voiceId: OpenAIVoiceId, speed: number) => {
    if (index >= chunksRef.current.length || !isActiveRef.current) return;
    if (prefetchedChunksRef.current[index]) return;

    const promise = generateChunkAudio(chunksRef.current[index], voiceId, speed).then(url => {
      if (url && isActiveRef.current) {
        prefetchedChunksRef.current[index] = url;
      } else {
        delete prefetchedChunksRef.current[index];
      }
      return url;
    });
    prefetchedChunksRef.current[index] = promise;
  };

  const playFromChunk = useCallback(async (startIndex: number, voiceId: OpenAIVoiceId, speed: number) => {
    const chunks = chunksRef.current;
    prefetchedChunksRef.current = {};

    for (let i = startIndex; i < chunks.length; i++) {
      if (!isActiveRef.current) break;
      chunkIndexRef.current = i;

      let blobOrPromise = prefetchedChunksRef.current[i];
      let blobUrl: string | null = null;
      
      if (!blobOrPromise) {
        setIsFetchingTtsText(true);
        blobUrl = await generateChunkAudio(chunks[i], voiceId, speed);
        setIsFetchingTtsText(false);
      } else if (blobOrPromise instanceof Promise) {
        setIsFetchingTtsText(true);
        blobUrl = await blobOrPromise;
        setIsFetchingTtsText(false);
      } else {
        blobUrl = blobOrPromise;
      }
      
      if (!blobUrl || !isActiveRef.current) {
        break;
      }

      if (i + 1 < chunks.length) {
        prefetchChunk(i + 1, voiceId, speed);
      }

      await new Promise<void>((resolve) => {
        if (!audioRef.current) {
          audioRef.current = new Audio();
        }
        const audio = audioRef.current;
        audio.src = blobUrl;
        audio.playbackRate = ttsRateRef.current;

        audio.onended = () => resolve();
        audio.onerror = () => resolve();
        
        audio.play().catch(() => resolve());
      });
    }

    if (isActiveRef.current) {
      setIsTtsPaused(true);
    }
  }, [generateChunkAudio]);

  const stopTts = useCallback(() => {
    isActiveRef.current = false;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute('src');
    }
    cleanupBlobUrls();
    setIsTtsActive(false);
    setIsTtsPaused(false);
  }, [cleanupBlobUrls]);

  const startTtsForPage = useCallback(async (text: string, voice: SpeechSynthesisVoice, rate: number) => {
    if (!text.trim()) {
      toast.error("Aucun texte lisible sur cette page.");
      return;
    }

    if (audioRef.current) { 
      audioRef.current.pause(); 
      audioRef.current.removeAttribute('src'); 
    }
    cleanupBlobUrls();
    isActiveRef.current = true;

    chunksRef.current = chunkText(text);
    chunkIndexRef.current = 0;

    setIsTtsActive(true);
    setIsTtsPaused(false);

    const voiceId = voiceIdFromURI(voice.voiceURI);
    await playFromChunk(0, voiceId, rate);
  }, [cleanupBlobUrls, playFromChunk]);

  const extractAndPlayTts = useCallback(async () => {
    if (!book?.file) { toast.error("Aucun document à lire."); return; }

    const reqId = ++fetchRequestIdRef.current;
    setIsFetchingTtsText(true);

    try {
      let extractedText = '';

      if (rawPdfData) {
        try {
          let pdfDoc = pdfDocRef.current;
          if (!pdfDoc) {
            const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.js' as any);
            pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
            const source = typeof rawPdfData === 'string'
              ? { url: rawPdfData, withCredentials: true, httpHeaders: { 'X-Requested-With': 'XMLHttpRequest' } }
              : { data: new Uint8Array(rawPdfData.slice(0)) };
            const loadingTask = pdfjsLib.getDocument(source);
            pdfDoc = await loadingTask.promise;
            pdfDocRef.current = pdfDoc;
          }

          const getPageText = async (idx: number) => {
            try {
              const page = await pdfDoc.getPage(idx + 1);
              const textContent = await page.getTextContent();
              return textContent.items.map((item: any) => item.str).join(' ');
            } catch { return ''; }
          };

          const pageIndex = Math.min(currentPage, pdfDoc.numPages - 1);
          let pageText = await getPageText(pageIndex);

          if (effectiveImmersionMode && viewMode === ViewMode.DualPageWithCover && pageIndex + 1 < pdfDoc.numPages) {
            pageText += ' ' + await getPageText(pageIndex + 1);
          }

          extractedText = pageText.replace(/\s+/g, ' ').trim();
        } catch (err) {
          console.warn('[TTS] pdfjs extraction failed:', err);
        }
      }

      if (!extractedText && reqId === fetchRequestIdRef.current) {
        const spans = document.querySelectorAll('.rpv-core__text-layer span, .flipbook-text-layer span');
        extractedText = Array.from(spans).map(el => el.textContent).join(' ').trim();
      }

      if (reqId !== fetchRequestIdRef.current) return;
      setIsFetchingTtsText(false);

      if (extractedText) {
        setTtsPageText(extractedText);
        await startTtsForPage(extractedText, ttsVoice, ttsRateRef.current);
      } else {
        const fallback = `Page ${currentPage + 1} de ${book.title || 'document'}.`;
        toast.info("Texte synthétisé depuis le titre de l'ouvrage.");
        await startTtsForPage(fallback, ttsVoice, ttsRateRef.current);
      }
    } catch (err) {
      toast.error("Impossible de lancer la lecture vocale.");
      setIsFetchingTtsText(false);
    }
  }, [book, currentPage, rawPdfData, effectiveImmersionMode, viewMode, startTtsForPage, ttsVoice]);

  const toggleTts = useCallback(async () => {
    if (isTtsActive) { stopTts(); return; }
    
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    const silentMp3 = 'data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU5LjI3LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWgAAAAgAAABIAAAACAAAB//vQQAAP8AAAEOgAAAAAIAAIaAAAAAAAAAAAIAAIaAAAAAAAABAAAAAFAAAAIAAAASAAAAAgAAA//70EQAD/AAABDoAAAAACAACGgAAAAAAAAAACAACGgAAAAAAAQA=';
    audioRef.current.src = silentMp3;
    audioRef.current.play().catch(() => {});
    
    setIsTtsActive(true);
    await extractAndPlayTts();
  }, [isTtsActive, stopTts, extractAndPlayTts]);

  const pauseResumeTts = useCallback(() => {
    if (isTtsPaused) {
      if (audioRef.current) {
        audioRef.current.play().catch(() => {});
        setIsTtsPaused(false);
      } else if (ttsPageText) {
        isActiveRef.current = true;
        const voiceId = voiceIdFromURI(ttsVoice.voiceURI);
        playFromChunk(chunkIndexRef.current, voiceId, ttsRateRef.current);
        setIsTtsPaused(false);
      }
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        setIsTtsPaused(true);
        isActiveRef.current = false;
      }
    }
  }, [isTtsPaused, ttsPageText, ttsVoice, playFromChunk]);

  useEffect(() => {
    if (isTtsActive) {
      stopTts();
      setTimeout(() => {
        setIsTtsActive(true);
        extractAndPlayTts();
      }, 150);
    }
  }, [currentPage]);

  const selectVoice = useCallback((voice: SpeechSynthesisVoice) => {
    setTtsVoice(voice);
    setShowVoicePicker(false);

    if (isTtsActive && ttsPageText) {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current.src = ''; }
      cleanupBlobUrls();
      isActiveRef.current = true;
      chunksRef.current = chunkText(ttsPageText);
      chunkIndexRef.current = 0;
      setIsTtsPaused(false);
      const voiceId = voiceIdFromURI(voice.voiceURI);
      setTimeout(() => playFromChunk(0, voiceId, ttsRateRef.current), 100);
    }
  }, [isTtsActive, ttsPageText, cleanupBlobUrls, playFromChunk]);

  return {
    isTtsActive,
    isTtsPaused,
    ttsRate,
    ttsPitch,
    ttsVoice,
    categorizedVoices,
    isFetchingTtsText,
    showVoicePicker,
    setTtsRate,
    setTtsPitch,
    setShowVoicePicker,
    selectVoice,
    toggleTts,
    pauseResumeTts,
    stopTts,
  };
}
