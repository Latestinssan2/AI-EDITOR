import React from 'react';
import { Overlay } from '../../../types';

interface TimelineOverlayItemProps {
    overlay: Overlay;
    onUpdate: (updatedOverlay: Overlay) => void;
    zoomLevel: number;
    isSelected: boolean;
    onClick: (e: React.MouseEvent) => void;
}

const BASE_PIXELS_PER_SECOND = 20;

const TimelineOverlayItem: React.FC<TimelineOverlayItemProps> = ({ overlay, onUpdate, zoomLevel, isSelected, onClick }) => {
    const itemWidth = overlay.duration * BASE_PIXELS_PER_SECOND * zoomLevel;
    const itemOffset = overlay.startTime * BASE_PIXELS_PER_SECOND * zoomLevel;

    const handleDragStart = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>, handle: 'left' | 'right' | 'move') => {
        e.preventDefault();
        e.stopPropagation();

        const startX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const initialStartTime = overlay.startTime;
        const initialDuration = overlay.duration;

        const handleDragMove = (moveEvent: MouseEvent | TouchEvent) => {
            const currentX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
            const deltaX = currentX - startX;
            const deltaSeconds = deltaX / (BASE_PIXELS_PER_SECOND * zoomLevel);

            let newOverlay = { ...overlay };

            if (handle === 'right') {
                let newDuration = initialDuration + deltaSeconds;
                newOverlay.duration = Math.max(0.2, newDuration);
            } else if (handle === 'left') {
                let newStartTime = initialStartTime + deltaSeconds;
                let newDuration = initialDuration - deltaSeconds;
                if (newDuration < 0.2) {
                    newStartTime -= (0.2 - newDuration);
                    newDuration = 0.2;
                }
                newOverlay.startTime = Math.max(0, newStartTime);
                newOverlay.duration = newDuration;
            } else { // 'move'
                newOverlay.startTime = Math.max(0, initialStartTime + deltaSeconds);
            }
            
            onUpdate(newOverlay);
        };

        const handleDragEnd = () => {
            document.removeEventListener('mousemove', handleDragMove as any);
            document.removeEventListener('mouseup', handleDragEnd as any);
            document.removeEventListener('touchmove', handleDragMove as any);
            document.removeEventListener('touchend', handleDragEnd as any);
        };

        document.addEventListener('mousemove', handleDragMove as any);
        document.addEventListener('mouseup', handleDragEnd as any);
        document.addEventListener('touchmove', handleDragMove as any);
        document.addEventListener('touchend', handleDragEnd as any);
    };

    const bgColor = overlay.type === 'text' ? 'bg-blue-500/80' : 'bg-yellow-500/80';
    const selectionRing = isSelected ? 'ring-2 ring-yellow-400' : 'ring-1 ring-gray-600';

    return (
        <div
            style={{ 
                width: `${itemWidth}px`,
                position: 'absolute',
                left: `${itemOffset}px`,
             }}
            onClick={onClick}
            onMouseDown={(e) => handleDragStart(e, 'move')}
            onTouchStart={(e) => handleDragStart(e, 'move')}
            className={`overlay-item relative ${bgColor} rounded-md h-6 group overflow-hidden flex items-center px-2 cursor-pointer transition-all duration-150 ${selectionRing}`}
        >
            {/* Resizing Handles */}
            <div
                onMouseDown={(e) => handleDragStart(e, 'left')}
                onTouchStart={(e) => handleDragStart(e, 'left')}
                className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize z-10"
            ></div>
            <div
                onMouseDown={(e) => handleDragStart(e, 'right')}
                onTouchStart={(e) => handleDragStart(e, 'right')}
                className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize z-10"
            ></div>
            
            <p className="text-white text-xs truncate select-none pointer-events-none">{overlay.content}</p>
        </div>
    );
};

export default TimelineOverlayItem;
