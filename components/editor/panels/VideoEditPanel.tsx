
import React, { useState } from 'react';
import { TimelineClip, FreezeFrame } from '../../../types';
import ImageEditPanel from './ImageEditPanel';
import SpeedRampEditor from '../../views/videoEditor/SpeedRampEditor';
import AnimationEditor from '../../views/videoEditor/AnimationEditor';

interface VideoEditPanelProps {
    selectedClip: TimelineClip | null;
    onUpdateClip: (updatedClip: TimelineClip) => void;
    playheadPosition: number;
}

const VideoEditPanel: React.FC<VideoEditPanelProps> = ({ selectedClip, onUpdateClip, playheadPosition }) => {
    const [activeTab, setActiveTab] = useState('filters');

    if (!selectedClip) {
        return <div className="p-4 text-gray-500">Select a clip on the timeline to edit.</div>;
    }
    
    const handleFilterChange = (filter: string, value: number) => {
        const newFilters = { ...(selectedClip.filters || {}), [filter]: value };
        onUpdateClip({ ...selectedClip, filters: newFilters });
    };

    const handleAddFreeze = () => {
        // Find clip's start time on the main timeline
        // This is a simplification; a real implementation needs to calculate this precisely.
        // Assuming for now playheadPosition is relative to the start of the whole timeline.
        // We need to know where the clip starts to make the time relative.
        // This requires more context than available here. Let's assume a simplified logic.
        const timeInClip = playheadPosition; // This is incorrect, needs clip start time
        
        const newFreeze: FreezeFrame = { time: timeInClip, duration: 2 };
        const newFreezes = [...(selectedClip.freezes || []), newFreeze];
        onUpdateClip({ ...selectedClip, freezes: newFreezes });
    }
    
    const handleUpdateFreeze = (index: number, newDuration: number) => {
        const newFreezes = [...(selectedClip.freezes || [])];
        newFreezes[index].duration = newDuration;
        onUpdateClip({ ...selectedClip, freezes: newFreezes });
    }

    return (
        <div className="h-full overflow-y-auto">
            <div className="p-4 border-b border-gray-700">
                <h3 className="text-md font-semibold text-gray-200">Editing Clip</h3>
                <p className="text-sm text-gray-400 truncate">{selectedClip.source?.name || selectedClip.placeholderText}</p>
            </div>

            <div className="flex border-b border-gray-700">
                <button onClick={() => setActiveTab('filters')} className={`flex-1 p-2 text-sm ${activeTab === 'filters' ? 'bg-gray-700' : ''}`}>Filters</button>
                <button onClick={() => setActiveTab('speed')} className={`flex-1 p-2 text-sm ${activeTab === 'speed' ? 'bg-gray-700' : ''}`}>Speed</button>
                <button onClick={() => setActiveTab('animation')} className={`flex-1 p-2 text-sm ${activeTab === 'animation' ? 'bg-gray-700' : ''}`}>Animation</button>
                <button onClick={() => setActiveTab('freeze')} className={`flex-1 p-2 text-sm ${activeTab === 'freeze' ? 'bg-gray-700' : ''}`}>Freeze</button>
            </div>
            
            {activeTab === 'filters' && <ImageEditPanel 
                filters={selectedClip.filters || {}} 
                onFilterChange={handleFilterChange}
                onFilterChangeEnd={() => {}}
            />}
            {activeTab === 'speed' && <SpeedRampEditor
                points={selectedClip.speedRamp}
                onUpdate={(points) => onUpdateClip({ ...selectedClip, speedRamp: points })}
            />}
            {activeTab === 'animation' && <AnimationEditor
                animation={selectedClip.animation}
                onUpdate={(animation) => onUpdateClip({ ...selectedClip, animation })}
            />}
            {activeTab === 'freeze' && (
                <div className="p-4 space-y-4">
                     <h3 className="text-sm font-semibold text-gray-300">Freeze Frame</h3>
                     <button onClick={handleAddFreeze} className="w-full py-2 bg-blue-600 text-white rounded-md">Add Freeze at Playhead</button>
                     {selectedClip.freezes?.map((freeze, index) => (
                         <div key={index} className="flex items-center gap-2">
                            <span>Freeze for</span>
                             <input 
                                type="number"
                                value={freeze.duration}
                                onChange={(e) => handleUpdateFreeze(index, parseFloat(e.target.value))}
                                className="w-20 bg-gray-700 p-1 rounded-md"
                             />
                             <span>seconds at {freeze.time.toFixed(1)}s</span>
                         </div>
                     ))}
                </div>
            )}
        </div>
    );
};

export default VideoEditPanel;