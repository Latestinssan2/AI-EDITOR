import React from 'react';
import Spinner from '../../common/Spinner';

interface AdjustPanelProps {
    filters: Record<string, number>;
    onFilterChange: (filter: string, value: number) => void;
    onAutoAdjust: () => Promise<void>;
}

interface FilterControl {
    id: string;
    label: string;
    min: number;
    max: number;
    step: number;
    unit: string;
}

const controls: FilterControl[] = [
    { id: 'brightness', label: 'Brightness', min: 0, max: 2, step: 0.01, unit: '' },
    { id: 'contrast', label: 'Contrast', min: 0, max: 2, step: 0.01, unit: '' },
    { id: 'saturate', label: 'Saturation', min: 0, max: 2, step: 0.01, unit: '' },
    { id: 'hue-rotate', label: 'Hue', min: 0, max: 360, step: 1, unit: 'deg' },
    { id: 'blur', label: 'Sharpness', min: 0, max: 10, step: 0.1, unit: 'px' }, // Inverted logic: blur
    { id: 'sepia', label: 'Sepia', min: 0, max: 1, step: 0.01, unit: '' },
    { id: 'grayscale', label: 'Grayscale', min: 0, max: 1, step: 0.01, unit: '' },
];


const AdjustPanel: React.FC<AdjustPanelProps> = ({ filters, onFilterChange, onAutoAdjust }) => {
    const [isAutoAdjusting, setIsAutoAdjusting] = React.useState(false);

    const handleAutoClick = async () => {
        setIsAutoAdjusting(true);
        await onAutoAdjust();
        setIsAutoAdjusting(false);
    }
    
    return (
        <div className="p-4 space-y-4">
            <button
                onClick={handleAutoClick}
                disabled={isAutoAdjusting}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
                {isAutoAdjusting ? <Spinner /> : <><i className="fas fa-magic"></i> Auto Adjust</>}
            </button>
            <div className="border-t border-gray-700 my-4"></div>
            {controls.map(control => (
                <div key={control.id}>
                    <label className="block text-sm font-medium text-gray-300 mb-1 flex justify-between">
                        <span>{control.label}</span>
                        <span>{filters[control.id]}</span>
                    </label>
                    <input
                        type="range"
                        min={control.min}
                        max={control.max}
                        step={control.step}
                        value={filters[control.id]}
                        onChange={(e) => onFilterChange(control.id, parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer range-thumb-purple"
                    />
                </div>
            ))}
        </div>
    );
};

export default AdjustPanel;
