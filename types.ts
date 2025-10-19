// types.ts

// Basic user and session types
export interface User {
  id: string;
  email: string;
}

// UI state types
export type Theme = 'light' | 'dark';
export type ColorScheme = 'theme-genesis' | 'theme-aurora' | 'theme-capcut';
export type AIMode = 'Device' | 'Cloud AI';
export type View = 'video' | 'photo' | 'slideshow' | 'aiforge' | 'templates' | 'files' | 'settings';


// Toast notifications
export interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

// New type for image filters
export interface ImageFilters {
  brightness: number; // 0-200, default 100
  contrast: number; // 0-200, default 100
  saturation: number; // 0-200, default 100
  hue: number; // 0-360, default 0
  sharpness: number; // 0-100, default 0
  temperature: number; // -100 to 100, default 0
  blur: number; // 0-20, default 0
  vignette: number; // 0-100, default 0
}

export interface AppliedText {
    id: string;
    content: string;
    x: number; // in pixels on canvas
    y: number; // in pixels on canvas
    fontSize: number;
    color: string;
    fontFamily: string;
}

// Pexels API types
export interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  photographer_id: number;
  avg_color: string;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    small: string;
    portrait: string;
    landscape: string;
    tiny: string;
  };
  liked: boolean;
  alt: string;
}

export interface PexelsVideo {
  id: number;
  width: number;
  height: number;
  url: string;
  image: string; // poster image
  duration: number;
  user: {
    id: number;
    name: string;
    url: string;
  };
  video_files: {
    id: number;
    quality: 'hd' | 'sd' | 'hls' | string; // Pexels might add more qualities
    file_type: string;
    width: number;
    height: number;
    link: string;
  }[];
  video_pictures: {
    id: number;
    picture: string;
    nr: number;
  }[];
}

// Media Library types
export type MediaFileType = 'image' | 'video' | 'audio';

// Note: The 'file' property cannot be reliably serialized to JSON for localStorage.
// When saving projects, we will rely on other properties like `url` or convert to base64 if needed.
export interface MediaFile {
  id: string;
  name: string;
  url: string; // This will be a blob URL for session use
  type: MediaFileType;
  file?: File; // Make file optional as it won't exist for generated audio
  duration?: number;
}

// Video Editor Timeline types
export interface TimelineClip {
  id:string;
  source: PexelsVideo | MediaFile | { isPlaceholder: true; placeholderText: string };
  originalDuration: number;
  duration: number;
  startOffset: number;
  volume?: number;
  speed?: number;
  filters?: ImageFilters;
  isPlaceholder?: boolean;
}

// New type for video overlays (stickers, text, effects)
export interface Overlay {
    id: string;
    type: 'text' | 'sticker' | 'effect';
    content: string; // Text content, sticker URL, or effect name
    startTime: number; // In seconds on the main timeline
    duration: number;
    // Positioning and sizing in % of canvas
    x: number; 
    y: number;
    width: number;
    height: number;

    // Text-specific properties
    fontSize?: number; // In pixels, relative to a 1080p canvas
    color?: string; // hex color
    fontFamily?: string;
    fontWeight?: 'normal' | 'bold';
    textAlign?: 'left' | 'center' | 'right';
    backgroundColor?: string;
    textShadow?: boolean;
}

// Slideshow Maker Template type
export interface SlideshowTemplate {
    id: string;
    name: string;
    items: (PexelsPhoto | MediaFile)[];
    createdAt: string;
}

// --- Project State Types for Saving/Loading ---

export interface VideoProjectState {
    timelineClips: TimelineClip[];
    audioClips: TimelineClip[];
    overlays: Overlay[];
    zoomLevel: number;
    playheadPosition: number;
    duration: number;
}

export interface SlideshowProjectState {
    slideshowItems: (PexelsPhoto | MediaFile)[];
}

export interface ImageEditorProjectState {
    originalImageBase64: string | null;
    originalImageMimeType: string | null;
    editedImageUrl: string | null;
    prompt: string;
    filters?: ImageFilters; // For device-mode edits
    appliedText?: AppliedText[];
}

export interface Project {
    id: string;
    name: string;
    type: 'video' | 'slideshow' | 'photo';
    state: VideoProjectState | SlideshowProjectState | ImageEditorProjectState;
    createdAt: string;
    preview?: string; // e.g., base64 thumbnail
}