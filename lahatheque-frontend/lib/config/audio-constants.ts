/**
 * Constantes de configuration pour le Studio Audio et les lecteurs LAHAThèque.
 * Conforme à la Constitution LAHAThèque (zéro émoji, tokens sémantiques).
 */

export const AUDIO_ALLOWED_EXTENSIONS = [".mp3", ".m4a", ".aac", ".wav", ".ogg"];
export const AUDIO_ALLOWED_MIME_TYPES = [
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/x-m4a",
  "audio/aac",
  "audio/wav",
  "audio/ogg",
];

// Taille maximale par fichier audio : 500 Mo
export const AUDIO_MAX_FILE_SIZE_BYTES = 500 * 1024 * 1024;

// Taux de conversion XOF <-> EUR officiel
export const XOF_TO_EUR_RATE = 655.957;

export function formatAudioDuration(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds <= 0) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  if (mins >= 60) {
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return `${hours}h ${remainingMins.toString().padStart(2, "0")}m`;
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export const formatDuration = formatAudioDuration;

export function formatXofToEur(xof: number): string {
  const eur = xof / XOF_TO_EUR_RATE;
  return eur.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
