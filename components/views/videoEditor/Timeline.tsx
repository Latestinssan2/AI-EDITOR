
import React, { useRef, useCallback } from 'react';
import { VideoProjectState, TimelineClip } from '../../../types';
import TimelineClipItem from './TimelineClipItem';
import TimelineOverlayItem from './TimelineOverlayItem';
import TimelineAudioItem from './TimelineAudioItem';

interface TimelineProps {
    projectState: VideoProjectState;
    onStateChange: (newState: Partial<VideoProjectState>) => void;
    selectedClipId: string | null;
    onSelectClip: (id: string | null) => void;
    selectedOverlayId: string | null;
    onSelectOverlay: (id: string | null) => void;
}

const Timeline: React.FC<TimelineProps> = ({ 
    projectState, onStateChange, selectedClipId, onSelectClip, selectedOverlayId, onSelectOverlay
}) => {
    const timelineContainerRef = useRef<HTMLDivElement>(null);
    const { timelineClips, overlays, audioClips, zoomLevel, playheadPosition, duration } = projectState;

    const handleClipMove = useCallback((dragIndex: number, hoverIndex: number) => {
        const draggedClip = timelineClips[dragIndex];
        const newClips = [...timelineClips];
        newClips.splice(dragIndex, 1);
        newClips.splice(hoverIndex, 0, draggedClip);
        onStateChange({ timelineClips: newClips });
    }, [timelineClips, onStateChange]);

    const handleUpdateClip = (updatedClip: TimelineClip) => {
        const newTimeline = timelineClips.map(c => c.id === updatedClip.id ? updatedClip : c);
        onStateChange({ timelineClips: newTimeline });
    }
    
    const handleUpdateClipEnd = () => {
        const newDuration = timelineClips.reduce((sum, clip) => sum + clip.duration, 0);
        onStateChange({ duration: newDuration });
    }
    
    return (
        <div className="h-full flex flex-col" onClick={() => { onSelectClip(null); onSelectOverlay(null); }}>
             <div className="flex-shrink-0 h-8 flex items-center justify-between px-4 bg-gray-900">
                {/* Timeline Controls */}
                <div className="flex items-center gap-2">
                    <button className="text-gray-400 hover:text-white"><i className="fas fa-search-plus"></i></button>
                    <input type="range" min="0.5" max="5" step="0.1" value={zoomLevel} onChange={e => onStateChange({ zoomLevel: parseFloat(e.target.value)})} />
                    <button className="text-gray-400 hover:text-white"><i className="fas fa-search-minus"></i></button>
                </div>
            </div>
            <div ref={timelineContainerRef} className="flex-1 overflow-x-auto overflow-y-hidden p-4">
                <div className="relative h-full" style={{ width: `${duration * 20 * zoomLevel}px` }}>
                    {/* Video Track */}
                    <div className="relative h-12 flex items-center gap-1">
                        {timelineClips.map((clip, index) => (
                           <TimelineClipItem
                                key={clip.id}
                                clip={clip}
                                index={index}
                                zoomLevel={zoomLevel}
                                isSelected={selectedClipId === clip.id}
                                onSelect={() => onSelectClip(clip.id)}
                                onUpdate={handleUpdateClip}
                                onUpdateEnd={handleUpdateClipEnd}
                                onMove={handleClipMove}
                           />
                        ))}
                    </div>

                    {/* Overlay Track */}
                    <div className="relative h-8 mt-1">
                        {overlays.map(overlay => (
                             <TimelineOverlayItem
                                key={overlay.id}
                                overlay={overlay}
                                onUpdate={() => {}}
                                zoomLevel={zoomLevel}
                                isSelected={selectedOverlayId === overlay.id}
                                onClick={(e) => { e.stopPropagation(); onSelectOverlay(overlay.id); }}
                            />
                        ))}
                    </div>

                    {/* Audio Tracks */}
                     <div className="relative mt-1 space-y-1">
                        {audioClips.map(audio => (
                            <TimelineAudioItem key={audio.id} audioClip={audio} onUpdate={() => {}} zoomLevel={zoomLevel} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Timeline;
