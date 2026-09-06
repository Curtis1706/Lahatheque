"use client";

/**
 * Contexte global de lecture audio LAHAThèque (AudioPlayerContext).
 * Pilote le streaming HLS signé, le double affichage (mini-lecteur persistant + vue immersive),
 * le scrubbing, la vitesse, le volume et la limitation d'extrait gratuit à 180s.
 * Zéro emoji, typage strict TypeScript, respect des tokens sémantiques.
 */

import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";
import Hls from "hls.js";
import { toast } from "sonner";
import { AudioPlayerState, AudioTrackItem } from "@/lib/types/audio";
import {
  getAudioStreamSession,
  saveAudioListeningProgress,
} from "@/lib/services/audio";

interface AudioPlayerContextType {
  state: AudioPlayerState;
  playBook: (
    bookId: string,
    options?: { preview?: boolean; initialTrackIndex?: number }
  ) => Promise<void>;
  togglePlay: () => void;
  pause: () => void;
  resume: () => void;
  seek: (seconds: number) => void;
  seekRelative: (deltaSeconds: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setPlaybackRate: (rate: number) => void;
  nextTrack: () => void;
  previousTrack: () => void;
  toggleExpand: () => void;
  setExpanded: (expanded: boolean) => void;
  closePlayer: () => void;
}

const initialState: AudioPlayerState = {
  isPlaying: false,
  currentBookId: null,
  currentBookTitle: "",
  currentAuthors: "",
  currentCoverUrl: "",
  tracks: [],
  currentTrackIndex: 0,
  currentTime: 0,
  duration: 0,
  volume: 80,
  isMuted: false,
  playbackRate: 1.0,
  isPreview: false,
  previewLimitSeconds: 180,
  isExpanded: false,
  isLoading: false,
};

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(
  undefined
);

export function AudioPlayerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<AudioPlayerState>(initialState);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const progressSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialisation de l'élément audio HTML5
  useEffect(() => {
    if (typeof window === "undefined") return;

    const audio = new Audio();
    audio.preload = "auto";
    audioRef.current = audio;

    const onTimeUpdate = () => {
      const current = audio.currentTime;
      const dur = audio.duration || state.duration || 0;

      // Limitation stricte de l'extrait gratuit à 180 secondes
      if (state.isPreview && current >= state.previewLimitSeconds) {
        audio.pause();
        audio.currentTime = state.previewLimitSeconds;
        setState((prev) => ({
          ...prev,
          currentTime: prev.previewLimitSeconds,
          isPlaying: false,
        }));
        toast.info(
          "Fin de l'extrait gratuit de 3 minutes. Achetez l'ouvrage pour écouter la suite."
        );
        return;
      }

      setState((prev) => ({
        ...prev,
        currentTime: current,
        duration: dur > 0 ? dur : prev.duration,
      }));
    };

    const onPlay = () => setState((prev) => ({ ...prev, isPlaying: true }));
    const onPause = () => setState((prev) => ({ ...prev, isPlaying: false }));
    const onWaiting = () => setState((prev) => ({ ...prev, isLoading: true }));
    const onPlaying = () => setState((prev) => ({ ...prev, isLoading: false }));
    const onEnded = () => {
      // Piste terminée : passage à la suivante ou arrêt
      handleNextTrack();
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("playing", onPlaying);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("playing", onPlaying);
      audio.removeEventListener("ended", onEnded);
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [state.isPreview, state.previewLimitSeconds]);

  // Sauvegarde périodique de progression d'écoute toutes les 10 secondes (hors extrait)
  useEffect(() => {
    if (
      !state.isPlaying ||
      state.isPreview ||
      !state.tracks.length ||
      !state.currentBookId
    ) {
      if (progressSaveTimerRef.current) {
        clearInterval(progressSaveTimerRef.current);
      }
      return;
    }

    progressSaveTimerRef.current = setInterval(() => {
      const currentTrack = state.tracks[state.currentTrackIndex];
      if (currentTrack && currentTrack.id) {
        const percent =
          state.duration > 0 ? (state.currentTime / state.duration) * 100 : 0;
        saveAudioListeningProgress(
          currentTrack.id,
          state.currentTime,
          percent
        ).catch(() => {});
      }
    }, 10000);

    return () => {
      if (progressSaveTimerRef.current) {
        clearInterval(progressSaveTimerRef.current);
      }
    };
  }, [
    state.isPlaying,
    state.isPreview,
    state.tracks,
    state.currentTrackIndex,
    state.currentTime,
    state.duration,
    state.currentBookId,
  ]);

  // Chargement d'une URL de flux dans l'élément audio (HLS.js ou natif)
  const loadSource = useCallback((url: string) => {
    const audio = audioRef.current;
    if (!audio) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (url.includes(".m3u8")) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
        });
        hls.loadSource(url);
        hls.attachMedia(audio);
        hlsRef.current = hls;
      } else if (audio.canPlayType("application/vnd.apple.mpegurl")) {
        audio.src = url;
      } else {
        audio.src = url;
      }
    } else {
      audio.src = url;
    }
  }, []);

  // Déclencher la lecture d'un livre audio
  const playBook = useCallback(
    async (
      bookId: string,
      options?: { preview?: boolean; initialTrackIndex?: number }
    ) => {
      setState((prev) => ({
        ...prev,
        isLoading: true,
        currentBookId: bookId,
      }));

      try {
        const res = await getAudioStreamSession(bookId);
        if (!res.success || !res.data) {
          toast.error(
            res.error || "Impossible de charger la session audio de cet ouvrage."
          );
          setState((prev) => ({ ...prev, isLoading: false }));
          return;
        }

        const data = res.data;
        if (!data.tracks || data.tracks.length === 0) {
          toast.error("Aucune piste audio disponible pour cet ouvrage.");
          setState((prev) => ({ ...prev, isLoading: false }));
          return;
        }

        const initialIndex = options?.initialTrackIndex ?? 0;
        const targetTrack = data.tracks[initialIndex] || data.tracks[0];

        setState((prev) => ({
          ...prev,
          currentBookId: bookId,
          currentBookTitle: data.title || "Livre Audio LAHAThèque",
          currentAuthors: Array.isArray(data.authors)
            ? data.authors.join(", ")
            : "Auteur LAHAThèque",
          currentCoverUrl: data.cover_url || "",
          tracks: data.tracks,
          currentTrackIndex: initialIndex,
          currentTime: 0,
          duration: targetTrack.duration_seconds || 0,
          isPreview: Boolean(data.is_preview),
          previewLimitSeconds: data.preview_limit_seconds || 180,
          isLoading: false,
        }));

        if (targetTrack.signed_hls_url) {
          loadSource(targetTrack.signed_hls_url);
          if (audioRef.current) {
            audioRef.current.playbackRate = state.playbackRate;
            audioRef.current.volume = state.isMuted ? 0 : state.volume / 100;
            audioRef.current.play().catch(() => {
              // Gestion de la politique d'autoplay navigateur
            });
          }
        }

        if (data.is_preview) {
          toast.info("Extrait audio gratuit (3:00 max). Bonne écoute !");
        }
      } catch (err) {
        console.error("Erreur chargement session audio", err);
        toast.error("Erreur de connexion au service audio.");
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    },
    [loadSource, state.playbackRate, state.isMuted, state.volume]
  );

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (state.isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(() => {});
    }
  }, [state.isPlaying]);

  const pause = useCallback(() => {
    if (audioRef.current) audioRef.current.pause();
  }, []);

  const resume = useCallback(() => {
    if (audioRef.current) audioRef.current.play().catch(() => {});
  }, []);

  const seek = useCallback(
    (seconds: number) => {
      const audio = audioRef.current;
      if (!audio) return;

      let target = Math.max(0, seconds);
      if (state.isPreview && target > state.previewLimitSeconds) {
        target = state.previewLimitSeconds;
        toast.info(
          "L'extrait gratuit est limité aux 3 premières minutes de l'ouvrage."
        );
      } else if (state.duration > 0 && target > state.duration) {
        target = state.duration;
      }

      audio.currentTime = target;
      setState((prev) => ({ ...prev, currentTime: target }));
    },
    [state.isPreview, state.previewLimitSeconds, state.duration]
  );

  const seekRelative = useCallback(
    (delta: number) => {
      if (audioRef.current) {
        seek(audioRef.current.currentTime + delta);
      }
    },
    [seek]
  );

  const setVolume = useCallback((volume: number) => {
    const clamped = Math.max(0, Math.min(100, volume));
    setState((prev) => ({
      ...prev,
      volume: clamped,
      isMuted: clamped === 0,
    }));
    if (audioRef.current) {
      audioRef.current.volume = clamped / 100;
    }
  }, []);

  const toggleMute = useCallback(() => {
    setState((prev) => {
      const nextMuted = !prev.isMuted;
      if (audioRef.current) {
        audioRef.current.volume = nextMuted ? 0 : prev.volume / 100;
      }
      return { ...prev, isMuted: nextMuted };
    });
  }, []);

  const setPlaybackRate = useCallback((rate: number) => {
    setState((prev) => ({ ...prev, playbackRate: rate }));
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  }, []);

  const handleNextTrack = useCallback(() => {
    if (!state.tracks.length) return;
    const nextIndex = (state.currentTrackIndex + 1) % state.tracks.length;
    const nextTrack = state.tracks[nextIndex];

    setState((prev) => ({
      ...prev,
      currentTrackIndex: nextIndex,
      currentTime: 0,
      duration: nextTrack.duration_seconds || 0,
    }));

    if (nextTrack.signed_hls_url) {
      loadSource(nextTrack.signed_hls_url);
      if (audioRef.current) {
        audioRef.current.play().catch(() => {});
      }
    }
  }, [state.tracks, state.currentTrackIndex, loadSource]);

  const handlePreviousTrack = useCallback(() => {
    if (!state.tracks.length) return;
    const prevIndex =
      state.currentTrackIndex === 0
        ? state.tracks.length - 1
        : state.currentTrackIndex - 1;
    const prevTrack = state.tracks[prevIndex];

    setState((prev) => ({
      ...prev,
      currentTrackIndex: prevIndex,
      currentTime: 0,
      duration: prevTrack.duration_seconds || 0,
    }));

    if (prevTrack.signed_hls_url) {
      loadSource(prevTrack.signed_hls_url);
      if (audioRef.current) {
        audioRef.current.play().catch(() => {});
      }
    }
  }, [state.tracks, state.currentTrackIndex, loadSource]);

  const toggleExpand = useCallback(() => {
    setState((prev) => ({ ...prev, isExpanded: !prev.isExpanded }));
  }, []);

  const setExpanded = useCallback((expanded: boolean) => {
    setState((prev) => ({ ...prev, isExpanded: expanded }));
  }, []);

  const closePlayer = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setState(initialState);
  }, []);

  return (
    <AudioPlayerContext.Provider
      value={{
        state,
        playBook,
        togglePlay,
        pause,
        resume,
        seek,
        seekRelative,
        setVolume,
        toggleMute,
        setPlaybackRate,
        nextTrack: handleNextTrack,
        previousTrack: handlePreviousTrack,
        toggleExpand,
        setExpanded,
        closePlayer,
      }}
    >
      {children}
    </AudioPlayerContext.Provider>
  );
}

export function useAudioPlayer() {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error(
      "useAudioPlayer must be used within an AudioPlayerProvider"
    );
  }
  return context;
}
