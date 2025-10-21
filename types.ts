// FIX: Create a comprehensive types file to resolve module and type errors.
export type Theme = 'light' | 'dark';

export type ColorScheme = 'theme-genesis' | 'theme-aurora' | 'theme-capcut';

export type AIMode = 'Device' | 'Cloud AI';

export type View = 'video' | 'photo' | 'slideshow' | 'aiforge' | 'templates' | 'files' | 'settings';

export interface User {
  id: string;
  email: string;
}

export interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

export type MediaFileType = 'image' | 'video' | 'audio';

export interface MediaFile {
  id: string;
  name: string;
  url: string;
  type: MediaFileType;
  file: File;
  duration?: number;
}

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
  image: string; // Thumbnail
  duration: number;
  user: {
    id: number;
    name: string;
    url: string;
  };
  video_files: {
    id: number;
    quality: string;
    file_type: string;
    width: number;
    height: number;
    link: string;
  }[];
}

export interface SpeedRampPoint {
    time: number;
    speed: number;
}

export interface ClipAnimation {
    type: 'none' | 'fade-in' | 'fade-out' | 'slide-in-left' | 'slide-in-right' | 'zoom-in' | 'zoom-out';
    duration: number;
}

export interface FreezeFrame {
    time: number; // Time within the clip where the freeze starts
    duration: number; // How long the freeze lasts
}

export interface TimelineClip {
    id: string;
    source?: MediaFile;
    isPlaceholder: boolean;
    placeholderText?: string;
    duration: number;
    originalDuration: number;
    startOffset: number; // in seconds, from the start of the source media
    filters?: Record<string, number>;
    speedRamp?: SpeedRampPoint[];
    animation?: ClipAnimation;
    freezes?: FreezeFrame[];
}

export interface Overlay {
    id: string;
    type: 'text' | 'image';
    content: string; // Text content or image URL
    startTime: number;
    duration: number;
    x: number; // percentage
    y: number; // percentage
    width: number; // percentage
    height: number; // percentage
    rotation: number; // degrees
    // Text specific
    fontSize?: number;
    color?: string;
    fontFamily?: string;
    fontWeight?: string;
    textAlign?: 'left' | 'center' | 'right';
}

export interface AudioClipping {
    id: string;
    source: MediaFile;
    startTime: number;
    duration: number;
    startOffset: number;
    volume: number;
}

export interface VideoProjectState {
    timelineClips: TimelineClip[];
    overlays: Overlay[];
    audioClips: AudioClipping[];
    zoomLevel: number;
    playheadPosition: number;
    duration: number;
}

export interface ImageProjectState {
    media: MediaFile | PexelsPhoto | null;
    filters: Record<string, number>;
    overlays: Overlay[];
}

export interface SlideshowProjectState {
    items: (MediaFile | PexelsPhoto)[];
    transition: string;
    slideDuration: number;
}

export type ProjectState = VideoProjectState | ImageProjectState | SlideshowProjectState;

export interface Project {
    id: string;
    name: string;
    type: 'video' | 'photo' | 'slideshow';
    state: ProjectState;
    createdAt: string;
    preview?: string; // base64 data URL
}

export interface SlideshowTemplate {
    id: string;
    name: string;
    items: (PexelsPhoto | MediaFile)[];
    createdAt: string;
}