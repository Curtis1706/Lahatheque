export function useTextToSpeech(...args: any[]): any {
  return {
    isSpeaking: false,
    isPaused: false,
    speak: () => {},
    pause: () => {},
    resume: () => {},
    stop: () => {},
  };
}
