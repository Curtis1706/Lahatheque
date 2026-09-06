/**
 * Types TypeScript pour les flux et sessions de Livre Audio LAHAThèque.
 * Conforme à la spécification 017 et à la charte sans émoji.
 */

export interface AudioTrackItem {
  id: string;
  chapter_number: number;
  title: string;
  duration_seconds: number;
  signed_hls_url?: string;
  captions_vtt_url?: string | null;
}

export interface AudioStreamSession {
  ouvrage_id: string;
  title: string;
  cover_url?: string;
  authors?: string[];
  is_preview: boolean;
  preview_limit_seconds: number;
  expires_in: number;
  tracks: AudioTrackItem[];
  current_progress_seconds?: number;
}

export interface AudioListeningProgress {
  track_id: string;
  resume_seconds: number;
  completion_percent: number;
}

export interface AudioTrackUploadResult {
  id: string;
  stream_id: string;
  title: string;
  duration_seconds: number;
  hls_manifest_url?: string;
}

export interface AudioPlayerState {
  isPlaying: boolean;
  currentBookId: string | null;
  currentBookTitle: string;
  currentAuthors: string;
  currentCoverUrl: string;
  tracks: AudioTrackItem[];
  currentTrackIndex: number;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
  isPreview: boolean;
  previewLimitSeconds: number;
  isExpanded: boolean;
  isLoading: boolean;
}
