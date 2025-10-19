import { Project, VideoProjectState } from '../types';
import { v4 as uuidv4 } from 'uuid';

const templates: Record<string, VideoProjectState> = {
    "Successfully Mission Failed": {
        timelineClips: [
            { id: uuidv4(), source: { isPlaceholder: true, placeholderText: 'Your Clip Here' }, originalDuration: 8, duration: 8, startOffset: 0, isPlaceholder: true },
        ],
        audioClips: [],
        overlays: [
            { id: uuidv4(), type: 'text', content: 'Mission Failed', startTime: 3, duration: 5, x: 10, y: 40, width: 80, height: 20, fontSize: 80, color: '#FF0000', fontFamily: 'Orbitron', fontWeight: 'bold', textAlign: 'center', textShadow: true, backgroundColor: '#00000080' },
            { id: uuidv4(), type: 'text', content: 'We\'ll get \'em next time', startTime: 3.5, duration: 4.5, x:10, y: 60, width: 80, height: 10, fontSize: 32, color: '#FFFFFF', fontFamily: 'Inter', textAlign: 'center' }
        ],
        zoomLevel: 1,
        playheadPosition: 0,
        duration: 8,
    },
    "Emotional Damage": {
        timelineClips: [
            { id: uuidv4(), source: { isPlaceholder: true, placeholderText: 'Clip of "damage"' }, originalDuration: 5, duration: 5, startOffset: 0, isPlaceholder: true },
        ],
        audioClips: [],
        overlays: [
            { id: uuidv4(), type: 'text', content: 'EMOTIONAL DAMAGE', startTime: 1.5, duration: 3, x: 5, y: 75, width: 90, height: 20, fontSize: 96, color: '#E53E3E', fontFamily: 'Rajdhani', fontWeight: 'bold', textAlign: 'center', textShadow: true }
        ],
        zoomLevel: 1,
        playheadPosition: 0,
        duration: 5,
    },
    // Add other templates here...
    "Bro's Aura After": {
        timelineClips: [{ id: uuidv4(), source: { isPlaceholder: true, placeholderText: 'Your Clip Here' }, originalDuration: 10, duration: 10, startOffset: 0, isPlaceholder: true }],
        audioClips: [],
        overlays: [{ id: uuidv4(), type: 'text', content: "Bro's Aura After [EVENT]", startTime: 1, duration: 8, x: 10, y: 10, width: 80, height: 20, fontSize: 72, color: '#FFD700', fontFamily: 'Audiowide', textAlign: 'center', textShadow: true }],
        zoomLevel: 1, playheadPosition: 0, duration: 10,
    },
    "Moye Moye Realization": {
        timelineClips: [{ id: uuidv4(), source: { isPlaceholder: true, placeholderText: 'Your Clip Here' }, originalDuration: 7, duration: 7, startOffset: 0, isPlaceholder: true }],
        audioClips: [],
        overlays: [{ id: uuidv4(), type: 'text', content: "Moye Moye", startTime: 2, duration: 4, x: 10, y: 45, width: 80, height: 20, fontSize: 120, color: '#DDDDDD', fontFamily: 'Jura', fontWeight: 'bold', textAlign: 'center' }],
        zoomLevel: 1, playheadPosition: 0, duration: 7,
    },
    "Dramatic Fail Freeze": {
        timelineClips: [{ id: uuidv4(), source: { isPlaceholder: true, placeholderText: 'Your Fail Clip' }, originalDuration: 6, duration: 6, startOffset: 0, isPlaceholder: true }],
        audioClips: [],
        overlays: [{ id: uuidv4(), type: 'text', content: "WASTED", startTime: 2.5, duration: 3, x: 0, y: 40, width: 100, height: 20, fontSize: 150, color: '#FFFFFF', fontFamily: 'Share Tech Mono', fontWeight: 'bold', textAlign: 'center', textShadow: true, backgroundColor: '#00000099' }],
        zoomLevel: 1, playheadPosition: 0, duration: 6,
    },
     "Critical Strike": {
        timelineClips: [{ id: uuidv4(), source: { isPlaceholder: true, placeholderText: 'Impact Clip' }, originalDuration: 4, duration: 4, startOffset: 0, isPlaceholder: true }],
        audioClips: [],
        overlays: [{ id: uuidv4(), type: 'text', content: "POW!", startTime: 1, duration: 1.5, x: 20, y: 30, width: 60, height: 40, fontSize: 200, color: '#FFDE59', fontFamily: 'Orbitron', fontWeight: 'bold', textAlign: 'center', textShadow: true }],
        zoomLevel: 1, playheadPosition: 0, duration: 4,
    },

};

class TemplateService {
    getTemplate(name: string): Project {
        const state = templates[name];
        if (!state) {
            throw new Error(`Template "${name}" not found.`);
        }
        
        return {
            id: `proj_${Date.now()}`,
            name: `Project from ${name} template`,
            type: 'video',
            state: JSON.parse(JSON.stringify(state)), // Deep copy to prevent mutation of original
            createdAt: new Date().toISOString(),
        };
    }
}

export const templateService = new TemplateService();