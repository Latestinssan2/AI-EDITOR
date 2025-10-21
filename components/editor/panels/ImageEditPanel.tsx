import React from 'react';

interface ImageEditPanelProps {
    filters: Record<string, number>;
    onFilterChange: (filter: string, value: number) => void;
    onFilterChangeEnd: () => void;
}

const filterControls = [
    { id: 'brightness', label: 'Brightness', min: 0, max: 2, step: 0.01 },
    { id: 'contrast', label: 'Contrast', min: 0, max: 2, step: 0.01 },
    { id: 'saturate', label: 'Saturation', min: 0, max: 2, step: 0.01 },
    { id: 'sepia', label: 'Sepia', min: 0, max: 1, step: 0.01 },
    { id: 'grayscale', label: 'Grayscale', min: 0, max: 1, step: 0.01 },
    { id: 'hue-rotate', label: 'Hue', min: 0, max: 360, step: 1 },
    { id: 'blur', label: 'Blur', min: 0, max: 10, step: 0.1 },
];

const ImageEditPanel: React.FC<ImageEditPanelProps> = ({ filters, onFilterChange, onFilterChangeEnd }) => {
    return (
        <div className="p-4 space-y-4">
            {filterControls.map(control => (
                <div key={control.id}>
                    <label className="block text-sm font-medium text-gray-300 mb-1 flex justify-between">
                        <span>{control.label}</span>
                        <span>{filters[control.id]?.toFixed(2) ?? (control.id.includes('brightness') || control.id.includes('contrast') || control.id.includes('saturate') ? '1.00' : '0.00')}</span>
                    </label>
                    <input
                        type="range"
                        min={control.min}
                        max={control.max}
                        step={control.step}
                        value={filters[control.id] ?? (control.id.includes('brightness') || control.id.includes('contrast') || control.id.includes('saturate') ? 1 : 0)}
                        onChange={(e) => onFilterChange(control.id, parseFloat(e.target.value))}
                        onMouseUp={onFilterChangeEnd}
                        onTouchEnd={onFilterChangeEnd}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer range-thumb-purple"
                    />
                </div>
            ))}
        </div>
    );
};

export default ImageEditPanel;
