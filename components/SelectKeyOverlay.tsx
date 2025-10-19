import React, { useState } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { toastService } from '../services/toastService';

const SelectKeyOverlay: React.FC = () => {
    const { setApiKey, setAiMode } = useAppContext();
    const [keyInput, setKeyInput] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSaveKey = () => {
        if (!keyInput.trim()) {
            toastService.error("Please enter a valid API key.");
            return;
        }
        setLoading(true);
        // Simulate a quick validation/save
        setTimeout(() => {
            setApiKey(keyInput.trim());
            setAiMode('Cloud AI');
            toastService.success("API Key saved! Cloud AI is now active.");
            setLoading(false);
        }, 300);
    };
    
    const handleContinueOnDevice = () => {
        toastService.info("Continuing with On-Device AI. Cloud features will be limited.");
        setApiKey('on-device-placeholder'); // Set placeholder to dismiss overlay
        setAiMode('Device');
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-gray-800 border border-gray-700 rounded-2xl p-10 max-w-2xl text-center shadow-2xl">
                <h1 className="text-3xl font-bold text-white mb-4">Activate Cloud AI</h1>
                <p className="text-gray-300 mb-2">To unlock cloud-based AI features, please enter your Google AI API key.</p>
                <p className="text-sm text-gray-400 mb-6">A link to billing documentation can be found <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">here</a>.</p>
                
                <div className="w-full mb-6">
                    <input
                        type="password"
                        value={keyInput}
                        onChange={(e) => setKeyInput(e.target.value)}
                        placeholder="Enter your Google AI API Key here"
                        className="block w-full text-center rounded-md border-0 py-3 px-3 bg-white/5 text-white ring-1 ring-inset ring-white/10 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-purple-500 sm:text-sm"
                    />
                </div>

                <div className="flex justify-center gap-6">
                    <button
                        onClick={handleSaveKey}
                        disabled={loading}
                        className="px-8 py-3 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-75 transition-transform transform hover:scale-105 disabled:opacity-50"
                    >
                        {loading ? "Saving..." : "Save & Activate"}
                    </button>
                    <button
                        onClick={handleContinueOnDevice}
                        className="px-8 py-3 bg-gray-600 text-white font-semibold rounded-lg shadow-md hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-75 transition-transform transform hover:scale-105"
                    >
                        Continue with On-Device AI
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SelectKeyOverlay;
