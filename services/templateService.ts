import { Project, VideoProjectState, TimelineClip } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { stickerService } from './stickerService';

const createPlaceholderClip = (text: string, duration: number, freezes: any[] = [], filters: any = {}): TimelineClip => ({
    id: uuidv4(),
    isPlaceholder: true,
    placeholderText: text,
    duration,
    originalDuration: duration,
    startOffset: 0,
    freezes,
    filters,
});

const createTextOverlay = (content: string, startTime: number, duration: number): any => ({
    id: uuidv4(),
    type: 'text',
    content,
    startTime,
    duration,
    x: 50,
    y: 50,
    width: 80,
    height: 20,
    fontSize: 48,
    color: '#FFFFFF',
    fontFamily: 'Impact',
    fontWeight: 'bold',
    textAlign: 'center',
    rotation: 0,
});

const createStickerOverlay = (stickerUrl: string, startTime: number, duration: number, x: number, y: number): any => ({
    id: uuidv4(),
    type: 'image',
    content: stickerUrl,
    startTime,
    duration,
    x,
    y,
    width: 25,
    height: 25,
    rotation: 0,
});

const skullStickers = stickerService.getStickers('Skulls & Bones');

const templates: Record<string, VideoProjectState> = {
    "Freeze Death": {
        timelineClips: [
            createPlaceholderClip("Your Clip Here", 5, [{ time: 2, duration: 2 }])
        ],
        overlays: [
            createStickerOverlay(skullStickers[0] || '', 2.1, 1.8, 25, 50),
            createStickerOverlay(skullStickers[1] || '', 2.1, 1.8, 75, 50),
        ],
        audioClips: [],
        zoomLevel: 1,
        playheadPosition: 0,
        duration: 5,
    },
    "Successfully Mission Failed": {
        timelineClips: [
            createPlaceholderClip("Your Clip Here", 5, [], { sepia: 0.5, contrast: 1.2 })
        ],
        overlays: [
            createTextOverlay("MISSION FAILED", 1, 3)
        ],
        audioClips: [],
        zoomLevel: 1,
        playheadPosition: 0,
        duration: 5,
    },
    "Bro's Aura After": {
        timelineClips: [
            createPlaceholderClip("Your Clip Here", 6, [], { saturate: 1.5, contrast: 1.1 })
        ],
        overlays: [
            createTextOverlay("AURA: UNMATCHED", 2, 3)
        ],
        audioClips: [],
        zoomLevel: 1,
        playheadPosition: 0,
        duration: 6,
    },
};

class TemplateService {
    getTemplate(name: string): Project {
        const state = templates[name];
        if (!state) {
            throw new Error(`Template "${name}" not found.`);
        }
        return {
            id: `template_proj_${Date.now()}`,
            name: name,
            type: 'video',
            state: JSON.parse(JSON.stringify(state)), // Deep copy
            createdAt: new Date().toISOString(),
        };
    }
}

export const templateService = new TemplateService();