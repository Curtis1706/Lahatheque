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
  voice_gender?: "male" | "female";
  track_type?: "full" | "chapter";
  order_index?: number;
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

export type VoiceGender = "male" | "female";
export type TrackType = "full" | "chapter";
export type AudioWorkflowStatus = 
  | "draft" 
  | "pending_layout_validation" 
  | "pending_legal_validation" 
  | "published" 
  | "rejected";

export interface AudioChapterItem {
  id: string;
  title: string;
  file: File | null;
  file_url?: string;
  duration_seconds: number;
  order_index: number;
  status: "idle" | "uploading" | "ready" | "error";
  progress: number;
  error_message?: string;
}

export interface VoiceTrackGroup {
  full_track: {
    file: File | null;
    file_url?: string;
    duration_seconds: number;
    status: "idle" | "uploading" | "ready" | "error";
    progress: number;
  };
  chapters: AudioChapterItem[];
}

export interface AudioStudioFormState {
  is_attached: boolean;
  attached_book_id: string;
  title: string;
  author: string;
  country: string;
  description: string;
  category: string;
  level: string;
  price_xof: number;
  price_eur: number;
  cover_image: File | null;
  cover_url: string;
  male_tracks: VoiceTrackGroup;
  female_tracks: VoiceTrackGroup;
}

export interface AudioBookSummary {
  id: string;
  title: string;
  authors_display: string;
  category_name: string;
  country: string;
  cover_url: string;
  price_audio_xof: number;
  price_audio_eur: number;
  audio_status: AudioWorkflowStatus;
  has_male_voice: boolean;
  has_female_voice: boolean;
  total_duration_seconds: number;
  total_tracks_count: number;
  created_at: string;
  rejection_reason?: string;
}
