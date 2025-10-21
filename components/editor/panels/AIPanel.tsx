import React, { useState } from 'react';
import Spinner from '../../common/Spinner';

interface AIPanelProps {
    onPrompt: (prompt: string) => Promise<void>;
    onBackgroundAction: (action: 'remove' | 'change', prompt?: string) => Promise<void>;
}

const AIPanel: React.FC<AIPanelProps> = ({ onPrompt, onBackgroundAction }) => {
    const [prompt, setPrompt] = useState('');
    const [bgPrompt, setBgPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isBgChanging, setIsBgChanging] = useState(false);

    const handlePromptSubmit = async () => {
        if (!prompt) return;
        setIsGenerating(true);
        await onPrompt(prompt);
        setIsGenerating(false);
    };

    const handleBgAction = async (action: 'remove' | 'change') => {
        if (action === 'change' && !bgPrompt) return;
        setIsBgChanging(true);
        await onBackgroundAction(action, bgPrompt);
        setIsBgChanging(false);
    };

    return (
        <div className="p-4 space-y-6">
            <div>
                <h3 className="text-md font-semibold text-gray-200 mb-2">Generative Edit</h3>
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g., make the sky a vibrant sunset"
                    className="w-full bg-gray-700 rounded-md p-2 text-white text-sm focus:ring-purple-500 focus:outline-none"
                    rows={3}
                    disabled={isGenerating}
                />
                <button
                    onClick={handlePromptSubmit}
                    disabled={!prompt.trim() || isGenerating}
                    className="w-full mt-2 py-2 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 flex justify-center"
                >
                    {isGenerating ? <Spinner/> : 'Apply AI Edit'}
                </button>
            </div>
            <div className="border-t border-gray-700"></div>
            <div>
                 <h3 className="text-md font-semibold text-gray-200 mb-2">Background Tools</h3>
                 <button
                    onClick={() => handleBgAction('remove')}
                    disabled={isBgChanging}
                    className="w-full py-2 px-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 flex justify-center mb-4"
                >
                    {isBgChanging ? <Spinner/> : 'Remove Background'}
                </button>
                 <textarea
                    value={bgPrompt}
                    onChange={(e) => setBgPrompt(e.target.value)}
                    placeholder="Describe new background..."
                    className="w-full bg-gray-700 rounded-md p-2 text-white text-sm focus:ring-purple-500 focus:outline-none"
                    rows={2}
                    disabled={isBgChanging}
                />
                 <button
                    onClick={() => handleBgAction('change')}
                    disabled={!bgPrompt.trim() || isBgChanging}
                    className="w-full mt-2 py-2 px-4 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 disabled:opacity-50 flex justify-center"
                >
                    {isBgChanging ? <Spinner/> : 'Change Background'}
                </button>
            </div>
        </div>
    );
};

export default AIPanel;
