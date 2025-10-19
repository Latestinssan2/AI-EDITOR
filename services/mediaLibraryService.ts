import { MediaFile, MediaFileType } from '../types';

type MediaLibraryListener = (files: MediaFile[]) => void;

class MediaLibraryService {
    private mediaFiles: MediaFile[] = [];
    private listeners: MediaLibraryListener[] = [];

    subscribe(listener: MediaLibraryListener) {
        this.listeners.push(listener);
        listener(this.mediaFiles); // Immediately notify with current files
        return {
            unsubscribe: () => {
                this.listeners = this.listeners.filter(l => l !== listener);
            },
        };
    }

    private emit() {
        this.listeners.forEach(listener => listener(this.mediaFiles));
    }

    private getMediaDuration(url: string, type: 'video' | 'audio'): Promise<number> {
        return new Promise((resolve) => {
            const mediaElement = document.createElement(type);
            mediaElement.src = url;
            mediaElement.addEventListener('loadedmetadata', () => {
                resolve(mediaElement.duration);
            });
            mediaElement.addEventListener('error', () => {
                console.error(`Error loading metadata for ${type} at ${url}`);
                resolve(0); // resolve with 0 if there's an error
            });
        });
    }

    async addFiles(files: File[]) {
        const newMediaFilesPromises = files.map(async (file): Promise<MediaFile> => {
            let type: MediaFileType = 'image';
            if (file.type.startsWith('video/')) {
                type = 'video';
            } else if (file.type.startsWith('audio/')) {
                type = 'audio';
            }

            const url = URL.createObjectURL(file);
            let duration: number | undefined = undefined;

            if (type === 'video' || type === 'audio') {
                duration = await this.getMediaDuration(url, type);
            } else if (type === 'image') {
                duration = 5; // Default duration for images is 5 seconds
            }

            return {
                id: `${file.name}-${file.lastModified}`,
                name: file.name,
                url: url,
                type: type,
                file: file,
                duration,
            };
        });
        
        const newMediaFiles = await Promise.all(newMediaFilesPromises);
        this.mediaFiles = [...this.mediaFiles, ...newMediaFiles];
        this.emit();
    }
}

export const mediaLibraryService = new MediaLibraryService();
