import React, { useRef } from 'react';
import { TimelineClip, MediaFile, PexelsVideo } from '../../../types';

interface TimelineClipItemProps {
    clip: TimelineClip;
    onUpdate: (updatedClip: TimelineClip) => void;
    zoomLevel: number;
    isAudio: boolean;
    isSelected: boolean;
    onClick: (e: React.MouseEvent) => void;
}

const BASE_PIXELS_PER_SECOND = 20;

const TimelineClipItem: React.FC<TimelineClipItemProps> = ({ clip, onUpdate, zoomLevel, isAudio, isSelected, onClick }) => {
    const clipRef = useRef<HTMLDivElement>(null);
    const source = clip.source;
    const clipWidth = clip.duration * BASE_PIXELS_PER_SECOND * zoomLevel;

    const handleDragStart = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>, handle: 'left' | 'right') => {
        e.preventDefault();
        e.stopPropagation();

        const startX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const initialStartOffset = clip.startOffset;
        const initialDuration = clip.duration;

        const handleDragMove = (moveEvent: MouseEvent | TouchEvent) => {
            const currentX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
            const deltaX = currentX - startX;
            const deltaSeconds = deltaX / (BASE_PIXELS_PER_SECOND * zoomLevel);

            let newClip = { ...clip };

            if (handle === 'right') {
                let newDuration = initialDuration + deltaSeconds;
                const maxDuration = clip.originalDuration - clip.startOffset;
                newDuration = Math.max(0.5, Math.min(newDuration, maxDuration));
                newClip.duration = newDuration;
            } else { // handle === 'left'
                let newStartOffset = initialStartOffset + deltaSeconds;
                let newDuration = initialDuration - deltaSeconds;

                if (newStartOffset < 0) {
                    newDuration += newStartOffset;
                    newStartOffset = 0;
                }
                if (newDuration < 0.5) {
                    newStartOffset -= (0.5 - newDuration);
                    newDuration = 0.5;
                }
                if (newStartOffset < 0) newStartOffset = 0;

                newClip.startOffset = newStartOffset;
                newClip.duration = newDuration;
            }
            
            onUpdate(newClip);
        };

        const handleDragEnd = () => {
            window.removeEventListener('mousemove', handleDragMove as any);
            window.removeEventListener('mouseup', handleDragEnd as any);
            window.removeEventListener('touchmove', handleDragMove as any);
            window.removeEventListener('touchend', handleDragEnd as any);
        };

        window.addEventListener('mousemove', handleDragMove as any);
        window.addEventListener('mouseup', handleDragEnd as any);
        window.addEventListener('touchmove', handleDragMove as any);
        window.addEventListener('touchend', handleDragEnd as any);
    };

    const displayName = 'name' in source ? source.name : source.user?.name || 'Stock Media';
    const sourceUrl = 'url' in source ? source.url : '';
    const posterUrl = 'image' in source ? source.image : '';
    const isVideo = !isAudio && ('type' in source ? source.type === 'video' : true);

    const bgColor = isAudio ? 'bg-green-500' : 'bg-purple-500';
    const height = isAudio ? 'h-10 md:h-12' : 'h-12 md:h-16';
    const selectionRing = isSelected ? 'ring-2 ring-yellow-400 ring-offset-2 ring-offset-gray-800' : '';

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onClick(e);
    }

    return (
        <div
            ref={clipRef}
            style={{ width: `${clipWidth}px` }}
            onClick={handleClick}
            className={`clip-item relative ${bgColor} rounded-md flex-shrink-0 group overflow-hidden ${height} flex items-center p-2 cursor-pointer transition-all duration-150 ${selectionRing}`}
        >
            {/* Resizing Handles (Mobile Optimized) */}
            <div
                onMouseDown={(e) => handleDragStart(e, 'left')}
                onTouchStart={(e) => handleDragStart(e, 'left')}
                className={`absolute left-0 top-0 bottom-0 w-4 cursor-ew-resize z-10 transition-opacity flex items-center justify-center ${isSelected ? 'opacity-100' : 'opacity-0'}`}
            >
                <div className="w-1 h-1/2 bg-yellow-400 rounded-full"></div>
            </div>
            <div
                onMouseDown={(e) => handleDragStart(e, 'right')}
                onTouchStart={(e) => handleDragStart(e, 'right')}
                className={`absolute right-0 top-0 bottom-0 w-4 cursor-ew-resize z-10 transition-opacity flex items-center justify-center ${isSelected ? 'opacity-100' : 'opacity-0'}`}
            >
                <div className="w-1 h-1/2 bg-yellow-400 rounded-full"></div>
            </div>
            
            {/* Clip Content */}
            {!isAudio && isVideo && (
                 <video src={sourceUrl} className="w-full h-full object-cover absolute inset-0 pointer-events-none" />
            )}
             {!isAudio && !isVideo && ( // This covers PexelsVideo and Image MediaFile
                <img src={posterUrl || sourceUrl} className="w-full h-full object-cover absolute inset-0 pointer-events-none" />
            )}
            
            <div className="relative z-0 flex items-center w-full">
                {isAudio && <i className="fas fa-music text-white mr-2 flex-shrink-0"></i>}
                <p className="text-white text-xs truncate select-none">{displayName}</p>
            </div>
        </div>
    );
};

export default TimelineClipItem;