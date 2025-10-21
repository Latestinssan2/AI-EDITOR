
import { Project, ProjectState, ImageProjectState, VideoProjectState, SlideshowProjectState, Overlay, PexelsPhoto, MediaFile } from '../types';

class ExportService {
    public async exportProject(project: Project, onProgress: (progress: number) => void): Promise<{ url: string; file: File; type: 'image' | 'video' }> {
        onProgress(10);
        switch (project.type) {
            case 'photo':
                return this.exportImageProject(project.state as ImageProjectState, project.name, onProgress);
            case 'video':
                return this.exportVideoProject(project.state as VideoProjectState, project.name, onProgress);
            case 'slideshow':
                 return this.exportSlideshowProject(project.state as SlideshowProjectState, project.name, onProgress);
            default:
                throw new Error('Unsupported project type for export');
        }
    }
    
    private async getSourceImage(media: MediaFile | PexelsPhoto): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = 'src' in media ? media.src.original : media.url;
        });
    }

    private applyFilters(ctx: CanvasRenderingContext2D, filters: Record<string, number>) {
        let filterString = '';
        Object.entries(filters).forEach(([key, value]) => {
            if (key === 'hue-rotate') filterString += `hue-rotate(${value}deg) `;
            else if (key === 'blur') filterString += `blur(${value}px) `;
            else filterString += `${key}(${value}) `;
        });
        ctx.filter = filterString.trim();
    }
    
    private async drawOverlay(ctx: CanvasRenderingContext2D, overlay: Overlay) {
        // This is a simplified drawing logic. A real implementation would be more complex.
        const { type, content, x, y, width, height, rotation, fontSize, color, fontFamily, fontWeight, textAlign } = overlay;
        
        ctx.save();
        
        const canvasWidth = ctx.canvas.width;
        const canvasHeight = ctx.canvas.height;

        const posX = (x / 100) * canvasWidth;
        const posY = (y / 100) * canvasHeight;
        
        ctx.translate(posX, posY);
        ctx.rotate(rotation * Math.PI / 180);
        
        const w = (width / 100) * canvasWidth;
        const h = (height / 100) * canvasHeight;

        if (type === 'text') {
            ctx.fillStyle = color || '#000000';
            ctx.font = `${fontWeight || 'normal'} ${fontSize || 24}px ${fontFamily || 'sans-serif'}`;
            ctx.textAlign = textAlign || 'center';
            ctx.fillText(content, 0, 0);
        } else if (type === 'image') {
            const img = await this.getSourceImage({ url: content } as MediaFile); // simplified
            ctx.drawImage(img, -w / 2, -h / 2, w, h);
        }
        
        ctx.restore();
    }

    private async exportImageProject(state: ImageProjectState, name: string, onProgress: (p: number) => void): Promise<{ url: string; file: File; type: 'image' }> {
        if (!state.media) throw new Error("No media to export");

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error("Could not create canvas context");

        onProgress(30);
        const sourceImage = await this.getSourceImage(state.media);
        canvas.width = sourceImage.naturalWidth;
        canvas.height = sourceImage.naturalHeight;
        
        onProgress(50);
        this.applyFilters(ctx, state.filters);
        ctx.drawImage(sourceImage, 0, 0);
        ctx.filter = 'none'; // reset for overlays
        
        onProgress(70);
        for (const overlay of state.overlays) {
            await this.drawOverlay(ctx, overlay);
        }

        onProgress(90);
        return new Promise((resolve, reject) => {
             canvas.toBlob(blob => {
                if (!blob) return reject(new Error("Failed to create blob from canvas"));
                const file = new File([blob], `${name}.png`, { type: 'image/png' });
                const url = URL.createObjectURL(file);
                onProgress(100);
                resolve({ url, file, type: 'image' });
            }, 'image/png');
        });
    }

    // Mock implementation for video/slideshow
    private async exportVideoProject(state: VideoProjectState, name: string, onProgress: (p: number) => void): Promise<{ url: string; file: File; type: 'video' }> {
        onProgress(20);
        await new Promise(res => setTimeout(res, 500));
        onProgress(50);
        await new Promise(res => setTimeout(res, 1000));
        onProgress(80);
        await new Promise(res => setTimeout(res, 500));
        onProgress(100);

        const content = 'mock video content';
        const blob = new Blob([content], { type: 'video/mp4' });
        const file = new File([blob], `${name}.mp4`, { type: 'video/mp4' });
        const url = URL.createObjectURL(file);
        return { url, file, type: 'video' };
    }
    
    private async exportSlideshowProject(state: SlideshowProjectState, name: string, onProgress: (p: number) => void): Promise<{ url: string; file: File; type: 'video' }> {
         // This is a mock. Real slideshow to video conversion is very complex on the frontend.
         return this.exportVideoProject({} as VideoProjectState, name, onProgress);
    }
}

export const exportService = new ExportService();
