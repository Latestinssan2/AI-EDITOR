import React from 'react';
import { AudioClipping } from '../../../types';

interface TimelineAudioItemProps {
    audioClip: AudioClipping;
    onUpdate: (updatedClip: AudioClipping) => void;
    zoomLevel: number;
}

const BASE_PIXELS_PER_SECOND = 20;

const TimelineAudioItem: React.FC<TimelineAudioItemProps> = ({ audioClip, onUpdate, zoomLevel }) => {
    const itemWidth = audioClip.duration * BASE_PIXELS_PER_SECOND * zoomLevel;
    const itemOffset = audioClip.startTime * BASE_PIXELS_PER_SECOND * zoomLevel;

    // Simplified for now - no dragging/resizing logic implemented.
    // A full implementation would be similar to TimelineOverlayItem.

    return (
        <div
            style={{
                width: `${itemWidth}px`,
                position: 'absolute',
                left: `${itemOffset}px`,
            }}
            className="relative bg-green-500/80 rounded-md h-6 group overflow-hidden flex items-center px-2 cursor-pointer transition-all duration-150 ring-1 ring-gray-600"
        >
            <p className="text-white text-xs truncate select-none pointer-events-none">
                <i className="fas fa-music mr-2"></i>
                {audioClip.source.name}
            </p>
        </div>
    );
};

export default TimelineAudioItem;
