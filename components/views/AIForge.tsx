import React, { useState } from 'react';
import { toastService } from '../../services/toastService';
import { generateImageWithImagen } from '../../services/geminiService';
import { errorHandler } from '../../services/errorHandler';
import Spinner from '../common/Spinner';
import { useAppContext } from '../../contexts/AppContext';

const AIForge: React.FC = () => {
    const { aiMode } = useAppContext();
    const [assetPrompt, setAssetPrompt] = useState('A cute baby dragon, cartoon style');
    const [generatedAsset, setGeneratedAsset] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerateAsset = async () => {
        if (!assetPrompt.trim()) {
            toastService.error("Please enter a prompt for the asset.");
            return;
        }
        if (aiMode === 'Device') {
            toastService.error("Cloud AI mode is required to generate assets.");
            return;
        }
        setIsGenerating(true);
        setGeneratedAsset(null);
        try {
            const base64Image = await generateImageWithImagen(assetPrompt);
            setGeneratedAsset(`data:image/png;base64,${base64Image}`);
            toastService.success("Asset generated successfully!");
        } catch (error) {
            errorHandler.handle(error, 'AIForgeAssetGeneration');
        } finally {
            setIsGenerating(false);
        }
    };

    const FeatureCard: React.FC<{title: string, description: string, icon: string, children: React.ReactNode, comingSoon?: boolean}> = ({title, description, icon, children, comingSoon}) => (
        <div className={`bg-gray-800 rounded-lg p-6 relative overflow-hidden ${comingSoon ? 'opacity-60' : ''}`}>
            {comingSoon && <div className="absolute top-2 right-2 bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded">SOON</div>}
            <div className="flex items-start gap-4">
                <i className={`fas ${icon} text-3xl text-purple-400 mt-1`}></i>
                <div>
                    <h2 className="text-xl font-bold text-white">{title}</h2>
                    <p className="text-sm text-gray-400 mb-4">{description}</p>
                    <div className="space-y-4">{children}</div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="p-4 md:p-8 h-full overflow-y-auto">
            <h1 className="text-4xl font-bold text-white mb-2">AI Forge ✨</h1>
            <p className="text-gray-400 mb-8">Your personal AI studio. Generate templates, effects, assets, and more from simple text prompts.</p>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Custom Asset Generator */}
                <FeatureCard title="Custom Asset Generator" icon="fa-image" description="Generate a custom sticker or graphic with a transparent background.">
                    <textarea 
                        value={assetPrompt}
                        onChange={e => setAssetPrompt(e.target.value)}
                        placeholder="e.g., A golden trophy, shiny, cartoon style"
                        className="w-full bg-gray-700/50 rounded-md p-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 outline-none"
                        rows={3}
                    />
                    <button onClick={handleGenerateAsset} disabled={isGenerating} className="w-full py-3 bg-purple-600 font-semibold rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center">
                        {isGenerating ? <Spinner/> : <><i className="fas fa-magic mr-2"></i> Generate Asset</>}
                    </button>
                    {generatedAsset && (
                         <div className="bg-gray-900/50 p-4 rounded-lg text-center">
                             <img src={generatedAsset} alt="Generated Asset" className="max-w-full h-48 mx-auto object-contain bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZWVlIj48L3JlY3Q+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIGZpbGw9IiNlZWUiPjwvcmVjdD48L3N2Zz4=')]"/>
                             <a href={generatedAsset} download={`${assetPrompt.substring(0, 20)}.png`} className="mt-4 inline-block px-4 py-2 text-sm bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700">Download</a>
                         </div>
                    )}
                </FeatureCard>

                {/* Prompt a Template */}
                <FeatureCard title="Prompt-a-Template" icon="fa-layer-group" description="Describe the video template you want, and AI will build its structure." comingSoon>
                     <textarea 
                        placeholder="e.g., A fast-paced travel vlog intro with 3 video placeholders and modern text animations."
                        className="w-full bg-gray-700/50 rounded-md p-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 outline-none"
                        rows={3}
                        disabled
                    />
                    <button disabled className="w-full py-3 bg-purple-600 font-semibold rounded-lg disabled:opacity-50"><i className="fas fa-cogs mr-2"></i> Build Template</button>
                </FeatureCard>
                
                {/* Generate FX Overlay */}
                <FeatureCard title="Generate FX Overlay" icon="fa-meteor" description="Create animated effects like fire, smoke, or energy bursts." comingSoon>
                    <input type="text" placeholder="e.g., cartoon fire sparks" className="w-full bg-gray-700/50 rounded-md p-3 text-white placeholder-gray-500" disabled />
                    <button disabled className="w-full py-3 bg-purple-600 font-semibold rounded-lg disabled:opacity-50"><i className="fas fa-video mr-2"></i> Generate FX</button>
                </FeatureCard>

                 {/* Custom Sound Effect */}
                <FeatureCard title="Custom Sound Effect" icon="fa-music" description="Generate a unique, royalty-free sound effect from a description." comingSoon>
                    <input type="text" placeholder="e.g., a comedic boing sound" className="w-full bg-gray-700/50 rounded-md p-3 text-white placeholder-gray-500" disabled />
                    <button disabled className="w-full py-3 bg-purple-600 font-semibold rounded-lg disabled:opacity-50"><i className="fas fa-volume-up mr-2"></i> Generate Sound</button>
                </FeatureCard>
            </div>
        </div>
    );
};

export default AIForge;