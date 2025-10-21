
import React from 'react';

interface SlideshowEditPanelProps {
    // Add props for editing slideshow settings like transitions, durations etc.
    transition: string;
    onTransitionChange: (transition: string) => void;
    slideDuration: number;
    onSlideDurationChange: (duration: number) => void;
}

const TRANSITION_TYPES = [
    { id: 'fade', name: 'Fade' },
    { id: 'slide', name: 'Slide' },
    { id: 'glitch', name: 'Glitch' },
    { id: 'random-futuristic', name: 'Random Futuristic' },
    { id: 'zoom-blur', name: 'Zoom Blur' },
    { id: 'glitch-warp', name: 'Glitch Warp' },
    { id: 'shutter-v', name: 'V-Shutter' },
    { id: 'circle-wipe', name: 'Circle Wipe' },
    { id: 'diag-wipe', name: 'Diagonal Wipe' },
    { id: 'box-in', name: 'Box In' },
    { id: 'rgb-split', name: 'RGB Split' },
    { id: 'scan-wipe', name: 'Scanline Wipe' },
];

const SlideshowEditPanel: React.FC<SlideshowEditPanelProps> = ({
    transition,
    onTransitionChange,
    slideDuration,
    onSlideDurationChange
}) => {
    return (
        <div className="p-4 space-y-4">
            <h3 className="text-md font-semibold text-gray-200">Slideshow Settings</h3>
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                    Transition Effect
                </label>
                <select
                    value={transition}
                    onChange={(e) => onTransitionChange(e.target.value)}
                    className="w-full bg-gray-700 rounded-md p-2 text-sm"
                >
                    {TRANSITION_TYPES.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                    Slide Duration (seconds)
                </label>
                <input
                    type="number"
                    min="1"
                    max="10"
                    step="0.5"
                    value={slideDuration}
                    onChange={(e) => onSlideDurationChange(parseFloat(e.target.value))}
                    className="w-full bg-gray-700 rounded-md p-2 text-sm"
                />
            </div>
        </div>
    );
};

export default SlideshowEditPanel;