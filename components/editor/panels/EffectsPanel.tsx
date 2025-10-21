import React from 'react';

interface EffectsPanelProps {
    onSelectEffect: (filters: Record<string, number>) => void;
}

const effects = [
    { name: 'None', filters: { brightness: 1, contrast: 1, saturate: 1, 'hue-rotate': 0, blur: 0, sepia: 0, grayscale: 0 } },
    { name: 'Vintage', filters: { sepia: 0.6, saturate: 1.4, contrast: 0.9 } },
    { name: 'Noir', filters: { grayscale: 1, contrast: 1.5, brightness: 0.9 } },
    { name: 'Cinematic', filters: { contrast: 1.2, saturate: 1.2 } },
    { name: 'Dreamy', filters: { blur: 1, brightness: 1.1, saturate: 1.3 } },
    { name: 'Cold', filters: { 'hue-rotate': 180, saturate: 0.8 } },
    { name: 'Warm', filters: { 'hue-rotate': -30, saturate: 1.3 } },
    { name: 'Lomo', filters: { sepia: 0.3, contrast: 1.5, saturate: 1.5 } },
];

const EffectsPanel: React.FC<EffectsPanelProps> = ({ onSelectEffect }) => {
    return (
        <div className="p-4">
            <h3 className="text-md font-semibold text-gray-200 mb-4">Effects & Filters</h3>
            <div className="grid grid-cols-2 gap-4">
                {effects.map(effect => (
                    <button
                        key={effect.name}
                        onClick={() => onSelectEffect(effect.filters)}
                        className="p-2 bg-gray-700 rounded-lg text-center hover:bg-gray-600 transition-colors"
                    >
                        <div className="font-semibold text-sm">{effect.name}</div>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default EffectsPanel;
