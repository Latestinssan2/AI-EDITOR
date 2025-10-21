import React from 'react';
import { ClipAnimation } from '../../../types';

interface AnimationEditorProps {
    animation: ClipAnimation | undefined;
    onUpdate: (animation: ClipAnimation) => void;
}

const ANIMATION_TYPES = [
    { id: 'none', name: 'None' },
    { id: 'fade-in', name: 'Fade In' },
    { id: 'fade-out', name: 'Fade Out' },
    { id: 'slide-in-left', name: 'Slide In (Left)' },
    { id: 'slide-in-right', name: 'Slide In (Right)' },
    { id: 'zoom-in', name: 'Zoom In' },
    { id: 'zoom-out', name: 'Zoom Out' },
];

const AnimationEditor: React.FC<AnimationEditorProps> = ({ animation, onUpdate }) => {
    const currentAnimation = animation || { type: 'none', duration: 0.5 };

    const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onUpdate({ ...currentAnimation, type: e.target.value as ClipAnimation['type'] });
    };

    const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onUpdate({ ...currentAnimation, duration: parseFloat(e.target.value) });
    };

    return (
        <div className="p-4 space-y-4">
            <h3 className="text-sm font-semibold text-gray-300">Clip Animation</h3>
            <div>
                <label className="text-xs text-gray-400">Animation Type</label>
                <select value={currentAnimation.type} onChange={handleTypeChange} className="w-full bg-gray-700 rounded-md p-2 text-sm">
                    {ANIMATION_TYPES.map(anim => <option key={anim.id} value={anim.id}>{anim.name}</option>)}
                </select>
            </div>
            {currentAnimation.type !== 'none' && (
                <div>
                    <label className="text-xs text-gray-400">Duration (seconds)</label>
                    <input
                        type="number"
                        min="0.1"
                        max="5"
                        step="0.1"
                        value={currentAnimation.duration}
                        onChange={handleDurationChange}
                        className="w-full bg-gray-700 rounded-md p-2 text-sm"
                    />
                </div>
            )}
        </div>
    );
};

export default AnimationEditor;
