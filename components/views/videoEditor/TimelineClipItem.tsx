import React, { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { TimelineClip } from '../../../types';

interface TimelineClipItemProps {
    clip: TimelineClip;
    index: number;
    zoomLevel: number;
    isSelected: boolean;
    onSelect: () => void;
    onUpdate: (updatedClip: TimelineClip) => void;
    onUpdateEnd: () => void;
    onMove: (dragIndex: number, hoverIndex: number) => void;
}

const BASE_PIXELS_PER_SECOND = 20;

const TimelineClipItem: React.FC<TimelineClipItemProps> = ({ clip, index, zoomLevel, isSelected, onSelect, onUpdate, onUpdateEnd, onMove }) => {
    const ref = useRef<HTMLDivElement>(null);

    const [, drop] = useDrop({
        accept: 'clip',
        hover(item: { index: number }) {
            if (!ref.current) return;
            if (item.index !== index) {
                onMove(item.index, index);
                item.index = index;
            }
        },
    });

    const [{ isDragging }, drag] = useDrag({
        type: 'clip',
        item: { index },
        collect: (monitor) => ({ isDragging: monitor.isDragging() }),
        end: onUpdateEnd,
    });

    drag(drop(ref));
    
    const handleDragStart = (e: React.MouseEvent<HTMLDivElement>, handle: 'left' | 'right') => {
        e.preventDefault();
        e.stopPropagation();

        const startX = e.clientX;
        const initialDuration = clip.duration;
        const initialStartOffset = clip.startOffset;

        const handleDragMove = (moveEvent: MouseEvent) => {
            const deltaX = moveEvent.clientX - startX;
            const deltaSeconds = deltaX / (BASE_PIXELS_PER_SECOND * zoomLevel);
            
            let newClip = { ...clip };

            if (handle === 'right') {
                const newDuration = initialDuration + deltaSeconds;
                newClip.duration = Math.min(Math.max(0.2, newDuration), clip.originalDuration - clip.startOffset);
            } else { // 'left'
                const newStartOffset = initialStartOffset + deltaSeconds;
                const newDuration = initialDuration - deltaSeconds;
                
                if (newStartOffset >= 0 && newDuration >= 0.2 && newStartOffset + newDuration <= clip.originalDuration) {
                    newClip.startOffset = newStartOffset;
                    newClip.duration = newDuration;
                }
            }
            onUpdate(newClip);
        };

        const handleDragEnd = () => {
            document.removeEventListener('mousemove', handleDragMove);
            document.removeEventListener('mouseup', handleDragEnd);
            onUpdateEnd();
        };

        document.addEventListener('mousemove', handleDragMove);
        document.addEventListener('mouseup', handleDragEnd);
    };

    const itemWidth = clip.duration * BASE_PIXELS_PER_SECOND * zoomLevel;
    const isPlaceholder = clip.isPlaceholder;

    // Define styles based on whether it's a placeholder
    const baseBg = isPlaceholder ? 'bg-gray-700/80' : 'bg-purple-800/80';
    const placeholderStyle = isPlaceholder ? 'border-2 border-dashed border-gray-500 hover:border-purple-400' : '';
    const selectionRing = isSelected ? 'ring-2 ring-yellow-400 z-10' : 'ring-1 ring-gray-600';


    return (
        <div
            ref={ref}
            style={{ width: `${itemWidth}px` }}
            onClick={(e) => { e.stopPropagation(); onSelect(); }}
            className={`relative h-12 ${baseBg} rounded-md group overflow-hidden flex items-center justify-center p-1 cursor-pointer transition-all duration-150 ${selectionRing} ${isDragging ? 'opacity-50' : ''} ${placeholderStyle}`}
        >
            {isPlaceholder && <i className="fas fa-plus absolute text-gray-400 text-lg group-hover:text-purple-400 transition-colors"></i>}

            {/* Trim Handles - should not be available for placeholders */}
            {!isPlaceholder && (
                <>
                    <div
                        onMouseDown={(e) => handleDragStart(e, 'left')}
                        className="absolute left-0 top-0 bottom-0 w-3 bg-yellow-500/50 opacity-0 group-hover:opacity-100 cursor-ew-resize z-20"
                    ></div>
                    <div
                        onMouseDown={(e) => handleDragStart(e, 'right')}
                        className="absolute right-0 top-0 bottom-0 w-3 bg-yellow-500/50 opacity-0 group-hover:opacity-100 cursor-ew-resize z-20"
                    ></div>
                </>
            )}
            
            <p className="text-white text-xs text-center truncate select-none pointer-events-none z-10 px-2">{clip.placeholderText || clip.source?.name}</p>
        </div>
    );
};

export default TimelineClipItem;