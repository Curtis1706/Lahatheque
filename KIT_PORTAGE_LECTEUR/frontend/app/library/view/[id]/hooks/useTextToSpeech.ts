import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { toast } from "sonner";
import { http } from "@/lib/api";
import { ViewMode } from '@react-pdf-viewer/core';

interface UseTextToSpeechProps {
  book: any;
  currentPage: number;
  rawPdfData: string | ArrayBuffer | null;
  effectiveImmersionMode: boolean;
  viewMode: ViewMode;
}

// ─── Voix OpenAI ─────────────────────────────────────────────────────────────
// Chaque voix est un personnage différent — toutes sont ultra-naturelles.
const OPENAI_VOICES = [
  { voiceURI: 'openai-nova',    name: 'Nova — Douce & Chaleureuse',    lang: 'fr-FR', emoji: '👩' },
  { voiceURI: 'openai-shimmer', name: 'Shimmer — Expressive & Claire', lang: 'fr-FR', emoji: '🌟' },
  { voiceURI: 'openai-alloy',   name: 'Alloy — Neutre & Professionnelle', lang: 'fr-FR', emoji: '🔊' },
  { voiceURI: 'openai-fable',   name: 'Fable — Narrative & Captivante', lang: 'en-GB', emoji: '📖' },
  { voiceURI: 'openai-echo',    name: 'Echo — Grave & Posée',           lang: 'fr-FR', emoji: '👨' },
  { voiceURI: 'openai-onyx',    name: 'Onyx — Profonde & Autoritaire',  lang: 'fr-FR', emoji: '🎙️' },
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

// Découpe le texte en chunks. Le premier chunk est volontairement très court 
// pour démarrer la lecture instantanément (Fast First Chunk strategy).
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

export function useTextToSpeech({ book, currentPage, rawPdfData, effectiveImmersionMode, viewMode }: UseTextToSpeechProps) {
  const [isTtsActive, setIsTtsActive] = useState(false);
  const [isTtsPaused, setIsTtsPaused] = useState(false);
  const [ttsRate, setTtsRateState] = useState(1);
  const [ttsPitch, setTtsPitch] = useState(1);
  const [ttsVoice, setTtsVoice] = useState<SpeechSynthesisVoice>(makeVoice(OPENAI_VOICES[0]));
  const [ttsPageText, setTtsPageText] = useState<string>("");
  const [isFetchingTtsText, setIsFetchingTtsText] = useState(false);
  const [showVoicePicker, setShowVoicePicker] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlsRef = useRef<string[]>([]);
  const chunksRef = useRef<string[]>([]);
  const chunkIndexRef = useRef(0);
  const isActiveRef = useRef(false);
  const pdfDocRef = useRef<any>(null);
  const fetchRequestIdRef = useRef(0);
  const ttsRateRef = useRef(1);

  // Garder ttsRateRef synchronisé
  const setTtsRate = useCallback((rate: number) => {
    setTtsRateState(rate);
    ttsRateRef.current = rate;
    if (audioRef.current) audioRef.current.playbackRate = rate;
  }, []);

  // Nettoyage des blob URLs pour éviter les fuites mémoire
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
  }, []);

  useEffect(() => {
    return () => {
      if (pdfDocRef.current) { pdfDocRef.current.destroy(); pdfDocRef.current = null; }
    };
  }, [rawPdfData]);

  // ─── Voix pour le sélecteur ────────────────────────────────────────────────
  const ttsVoices = useMemo(() => OPENAI_VOICES.map(makeVoice), []);

  const categorizedVoices = useMemo(() => {
    const fr = ttsVoices.filter(v => v.lang.startsWith('fr'));
    const en = ttsVoices.filter(v => v.lang.startsWith('en'));
    const others: SpeechSynthesisVoice[] = [];

    const tagVoice = (v: SpeechSynthesisVoice) => {
      const found = OPENAI_VOICES.find(o => o.voiceURI === v.voiceURI);
      return found?.emoji || '🔊';
    };

    return { fr, en, others, tagVoice };
  }, [ttsVoices]);

  // ─── Génération audio via le backend OpenAI ───────────────────────────────
  const generateChunkAudio = useCallback(async (text: string, voiceId: OpenAIVoiceId, speed: number): Promise<string | null> => {
    try {
      const res = await http.post('/api/bff/legacy/tts/generate/', {
        text,
        voice: voiceId,
        speed
      }, {
        responseType: 'blob'
      });

      const audioBlob = res.data;
      const blobUrl = URL.createObjectURL(audioBlob);
      blobUrlsRef.current.push(blobUrl);
      return blobUrl;

    } catch (e: any) {
      console.error('[TTS] generateChunkAudio error:', e);
      return null;
    }
  }, []);

  // ─── Cache des chunks pré-générés ────────────────────────────────────────
  const prefetchedChunksRef = useRef<Record<number, Promise<string | null> | string>>({});

  const prefetchChunk = (index: number, voiceId: OpenAIVoiceId, speed: number) => {
    if (index >= chunksRef.current.length || !isActiveRef.current) return;
    if (prefetchedChunksRef.current[index]) return; // Déjà en cache ou en cours

    // Stocker la Promise pour éviter les appels multiples
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

  // ─── Lecture séquentielle des chunks (Double Buffering) ─────────────────
  const playFromChunk = useCallback(async (startIndex: number, voiceId: OpenAIVoiceId, speed: number) => {
    const chunks = chunksRef.current;
    
    // Nettoyer l'ancien cache si on recommence
    prefetchedChunksRef.current = {};

    for (let i = startIndex; i < chunks.length; i++) {
      if (!isActiveRef.current) break;

      chunkIndexRef.current = i;

      // Récupérer le chunk courant
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
        if (!blobUrl && isActiveRef.current) toast.error("Erreur de connexion (Serveur vocal).");
        break;
      }

      // Lancer le pré-chargement du chunk SUIVANT en arrière-plan
      if (i + 1 < chunks.length) {
        prefetchChunk(i + 1, voiceId, speed);
      }

      // Jouer le chunk courant
      await new Promise<void>((resolve) => {
        if (!audioRef.current) {
          audioRef.current = new Audio();
        }
        const audio = audioRef.current;
        audio.src = blobUrl;
        audio.playbackRate = ttsRateRef.current;

        audio.onended = () => resolve();
        audio.onerror = () => {
          console.error('[TTS] Audio playback error');
          resolve();
        };
        
        audio.play().catch((err) => {
          console.error('[TTS] Autoplay prevented:', err);
          resolve();
        });
      });
    }

    // Lecture terminée
    if (isActiveRef.current) {
      setIsTtsPaused(true);
    }
  }, [generateChunkAudio]);

  // ─── stopTts ─────────────────────────────────────────────────────────────
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

  // ─── Démarrer la lecture pour la page courante ────────────────────────────
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

  // ─── Extraction du texte PDF ──────────────────────────────────────────────
  const extractAndPlayTts = useCallback(async () => {
    if (!book?.file) { toast.error("Aucun document à lire."); return; }

    const reqId = ++fetchRequestIdRef.current;
    setIsFetchingTtsText(true);

    try {
      let extractedText = '';

      // Stratégie 1 : PDF.js côté client
      if (rawPdfData) {
        try {
          let pdfDoc = pdfDocRef.current;
          if (!pdfDoc) {
            const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.js' as any);
            pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
            const source = typeof rawPdfData === 'string'
              ? {
                  url: rawPdfData,
                  withCredentials: true,
                  httpHeaders: {
                    'X-Requested-With': 'XMLHttpRequest',
                  }
                }
              : {
                  data: new Uint8Array(rawPdfData.slice(0))
                };
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

      // Stratégie 2 : API backend
      if (!extractedText && reqId === fetchRequestIdRef.current) {
        try {
          const res = await http.get(`/api/bff/legacy/documents/text/?path=${encodeURIComponent(book.file)}`);
          if (res.data) {
            extractedText = res.data.pages?.[currentPage]?.text || '';
            if (effectiveImmersionMode && viewMode === ViewMode.DualPageWithCover) {
              extractedText += ' ' + (res.data.pages?.[currentPage + 1]?.text || '');
            }
          }
        } catch (err) {
          console.warn('[TTS] API text fetch failed:', err);
        }
      }

      // Stratégie 3 : Couche texte du DOM
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
        const fallback = `Page ${currentPage + 1} de ${book.title}. Cette page ne contient pas de texte sélectionnable.`;
        toast.info("Ce PDF est scanné — le texte n'est pas extractible.");
        await startTtsForPage(fallback, ttsVoice, ttsRateRef.current);
      }
    } catch (err) {
      console.error('[TTS] extractAndPlayTts error:', err);
      toast.error("Impossible de lancer la lecture vocale.");
      setIsFetchingTtsText(false);
    }
  }, [book, currentPage, rawPdfData, effectiveImmersionMode, viewMode, startTtsForPage, ttsVoice]);

  // ─── toggleTts ────────────────────────────────────────────────────────────
  const toggleTts = useCallback(async () => {
    if (isTtsActive) { stopTts(); return; }
    
    // ASTUCE AUTOPLAY : Jouer un mini fichier audio silencieux de manière synchrone lors du clic utilisateur
    // Cela "déverrouille" l'élément Audio pour le reste de la session (Chrome/Safari)
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    const silentMp3 = 'data:audio/mpeg;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU5LjI3LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWgAAAAgAAABIAAAACAAAB//vQQAAP8AAAEOgAAAAAIAAIaAAAAAAAAAAAIAAIaAAAAAAAABAAAAAFAAAAIAAAASAAAAAgAAA//70EQAD/AAABDoAAAAACAACGgAAAAAAAAAACAACGgAAAAAAAQA=';
    audioRef.current.src = silentMp3;
    audioRef.current.play().catch(() => {});
    
    setIsTtsActive(true);
    await extractAndPlayTts();
  }, [isTtsActive, stopTts, extractAndPlayTts]);

  // ─── pauseResumeTts ───────────────────────────────────────────────────────
  const pauseResumeTts = useCallback(() => {
    if (isTtsPaused) {
      if (audioRef.current) {
        audioRef.current.play().catch(() => {});
        setIsTtsPaused(false);
      } else if (ttsPageText) {
        // Reprendre depuis le chunk interrompu
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

  // Relancer automatiquement au changement de page si la lecture est active
  useEffect(() => {
    if (isTtsActive) {
      stopTts();
      setTimeout(() => {
        setIsTtsActive(true);
        extractAndPlayTts();
      }, 150);
    }
  }, [currentPage]);

  // ─── selectVoice ──────────────────────────────────────────────────────────
  const selectVoice = useCallback((voice: SpeechSynthesisVoice) => {
    setTtsVoice(voice);
    localStorage.setItem('tts_preferred_voice', voice.voiceURI);
    setShowVoicePicker(false);

    if (isTtsActive && ttsPageText) {
      // Relancer avec la nouvelle voix depuis le début de la page
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
