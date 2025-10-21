import React from 'react';

interface CropPanelProps {
    onApply: () => void;
    onReset: () => void;
    onAspectRatioChange: (ratio: string) => void;
    aspectRatio: string;
}

const aspectRatios = [
    { id: 'free', name: 'Free' },
    { id: '1:1', name: 'Square' },
    { id: '4:3', name: '4:3' },
    { id: '3:4', name: '3:4' },
    { id: '16:9', name: '16:9' },
    { id: '9:16', name: '9:16' },
];

const CropPanel: React.FC<CropPanelProps> = ({ onApply, onReset, onAspectRatioChange, aspectRatio }) => {
    return (
        <div className="p-4 space-y-4">
            <div>
                <h3 className="text-sm font-semibold text-gray-300 mb-2">Aspect Ratio</h3>
                <div className="grid grid-cols-3 gap-2">
                    {aspectRatios.map(ratio => (
                        <button key={ratio.id} onClick={() => onAspectRatioChange(ratio.id)}
                            className={`px-2 py-1 text-sm rounded-md transition-colors ${aspectRatio === ratio.id ? 'bg-purple-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}
                        >
                            {ratio.name}
                        </button>
                    ))}
                </div>
            </div>
            <div className="border-t border-gray-700 my-2"></div>
            <div className="flex gap-2">
                <button onClick={onReset} className="w-full py-2 bg-gray-600 font-semibold rounded-lg hover:bg-gray-500 transition-colors">Reset</button>
                <button onClick={onApply} className="w-full py-2 bg-green-600 font-semibold rounded-lg hover:bg-green-700 transition-colors">Apply Crop</button>
            </div>
        </div>
    );
};
export default CropPanel;
