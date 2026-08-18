import { useState, useEffect, useCallback, useRef } from "react";
import { SERVER_ROOT_URL } from "@/lib/api";

export function useAudioPlayer(bookAudioFile: string | null | undefined) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  // Initialize audio lazily to avoid SSR issues
  useEffect(() => {
    if (!audioRef.current && typeof Audio !== 'undefined') {
      audioRef.current = new Audio();
    }
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      setAudioProgress(audio.currentTime);
      setAudioDuration(audio.duration || 0);
    };

    const handleEnded = () => setIsAudioPlaying(false);

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadedmetadata', updateProgress);

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadedmetadata', updateProgress);
      audio.pause();
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  useEffect(() => {
    if (audioRef.current && bookAudioFile) {
      audioRef.current.src = bookAudioFile.startsWith('http') 
        ? bookAudioFile 
        : `${SERVER_ROOT_URL}${bookAudioFile}`;
    }
  }, [bookAudioFile]);

  const toggleAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isAudioPlaying) {
      audio.pause();
    } else {
      audio.playbackRate = playbackRate;
      audio.play().catch(console.error);
    }
    setIsAudioPlaying(!isAudioPlaying);
  }, [isAudioPlaying, playbackRate]);

  const handleSeek = useCallback((percentage: number) => {
    const audio = audioRef.current;
    if (!audio || !audioDuration) return;
    const safePercentage = Math.max(0, Math.min(1, percentage));
    audio.currentTime = safePercentage * audioDuration;
    setAudioProgress(audio.currentTime);
  }, [audioDuration]);

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !isMuted;
    setIsMuted(!isMuted);
  }, [isMuted]);

  const togglePlaybackRate = useCallback(() => {
    const rates = [1, 1.25, 1.5, 2, 0.75];
    const nextRate = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
    setPlaybackRate(nextRate);
  }, [playbackRate]);

  return {
    isAudioPlaying,
    audioProgress,
    audioDuration,
    isMuted,
    playbackRate,
    toggleAudio,
    handleSeek,
    toggleMute,
    togglePlaybackRate
  };
}
