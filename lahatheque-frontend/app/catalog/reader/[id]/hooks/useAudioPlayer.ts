export function useAudioPlayer(...args: any[]): any {
  return {
    isAudioPlaying: false,
    audioProgress: 0,
    audioDuration: 0,
    isMuted: false,
    togglePlay: () => {},
    toggleMute: () => {},
    seek: () => {},
  };
}
