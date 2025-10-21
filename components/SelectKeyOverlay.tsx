
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../contexts/AppContext';
import { toastService } from '../services/toastService';

const SelectKeyOverlay: React.FC = () => {
    const { setApiKey, setAiMode } = useAppContext();
    const [loading, setLoading] = useState(false);
    const [keySelected, setKeySelected] = useState(false);

    // This is to satisfy the race condition note in the prompt
    useEffect(() => {
        if (keySelected) {
            // Assume key is now available via process.env.API_KEY
            // We set a placeholder to dismiss the overlay and switch mode
            setApiKey('user-selected-key-placeholder'); 
            setAiMode('Cloud AI');
            toastService.success("API Key selected! Cloud AI is now active.");
        }
    }, [keySelected, setApiKey, setAiMode]);

    const handleSelectKey = async () => {
        setLoading(true);
        try {
            // FIX: Per guidelines, use window.aistudio to select the API key.
            if (window.aistudio && typeof (window as any).aistudio.openSelectKey === 'function') {
                await (window as any).aistudio.openSelectKey();
                setKeySelected(true); // Triggers the useEffect
            } else {
                toastService.error("API Key selection is not available in this environment.");
            }
        } catch (error) {
            console.error("Error opening key selection:", error);
            toastService.error("Could not open API key selection dialog.");
        } finally {
            setLoading(false);
        }
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
                <p className="text-gray-300 mb-2">To unlock cloud-based AI features, please select your Google AI API key.</p>
                <p className="text-sm text-gray-400 mb-6">A link to billing documentation can be found <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline">here</a>.</p>
                
                <div className="flex justify-center gap-6">
                    <button
                        onClick={handleSelectKey}
                        disabled={loading}
                        className="px-8 py-3 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-75 transition-transform transform hover:scale-105 disabled:opacity-50"
                    >
                        {loading ? "Opening..." : "Select API Key"}
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
