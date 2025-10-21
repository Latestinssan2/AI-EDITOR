import React, { useState } from 'react';

interface TextPanelProps {
    onAddText: (text: { content: string; color: string }) => void;
}

const TextPanel: React.FC<TextPanelProps> = ({ onAddText }) => {
    const [content, setContent] = useState('Your Text Here');
    const [color, setColor] = useState('#FFFFFF');

    const handleAddClick = () => {
        if (!content.trim()) return;
        onAddText({ content, color });
    };

    return (
        <div className="p-4 space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                    Text Content
                </label>
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full bg-gray-700 rounded-md p-2 text-white text-sm focus:ring-purple-500 focus:outline-none"
                    rows={3}
                />
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                    Text Color
                </label>
                <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full h-10 p-1 bg-gray-700 rounded-md cursor-pointer"
                />
            </div>
            <button
                onClick={handleAddClick}
                className="w-full py-2 px-4 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
                Add Text to Image
            </button>
        </div>
    );
};

export default TextPanel;
