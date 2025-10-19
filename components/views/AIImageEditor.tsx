import React, { useState, useCallback, useEffect, useRef } from 'react';
import { fileToBase64 } from '../../utils/fileUtils';
import { editImageWithPrompt, removeImageBackground } from '../../services/geminiService';
import { toastService } from '../../services/toastService';
import { useAppContext } from '../../contexts/AppContext';
import Spinner from '../common/Spinner';
import { pexelsService } from '../../services/pexelsService';
import { PexelsPhoto, MediaFile, ImageEditorProjectState, ImageFilters, AppliedText } from '../../types';
import { mediaLibraryService } from '../../services/mediaLibraryService';
import { errorHandler } from '../../services/errorHandler';
import { projectService } from '../../services/projectService';
import { v4 as uuidv4 } from 'uuid';

type EditorTool = 'media' | 'ai' | 'adjust' | 'crop' | 'resize' | 'stickers' | 'text';
type AppliedSticker = { id: string; type: 'emoji' | 'image'; content: string; x: number; y: number; size: number };

const defaultFilters: ImageFilters = {
  brightness: 100, contrast: 100, saturation: 100,
  hue: 0, sharpness: 0, temperature: 0,
  blur: 0, vignette: 0
};

const STICKERS = [ '😍', '😂', '🔥', '👍', '❤️', '✨', '🎉', '🍕', '🚀', '💯' ];
const FONT_FACES = [ 'Inter', 'Arial', 'Verdana', 'Georgia', 'Orbitron', 'Rajdhani', 'Audiowide' ];

const CROP_RATIOS = [
    { name: 'Free', value: 0 }, { name: '1:1', value: 1/1 }, { name: '4:3', value: 4/3 },
    { name: '16:9', value: 16/9 }, { name: '9:16', value: 9/16 },
];

const MediaPanel: React.FC<{ onSelect: (file: File) => void }> = ({ onSelect }) => {
    const [myMediaFiles, setMyMediaFiles] = useState<MediaFile[]>([]);
    useEffect(() => {
        const sub = mediaLibraryService.subscribe(setMyMediaFiles);
        return () => sub.unsubscribe();
    }, []);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const uploadedFile = e.target.files[0];
            await mediaLibraryService.addFiles([uploadedFile]);
            onSelect(uploadedFile); // Also select the newly uploaded file
        }
    };

    return (
        <div className="h-full flex flex-col p-2">
            <label className="w-full text-center py-3 px-4 mb-3 bg-purple-600 text-white font-semibold rounded-lg cursor-pointer hover:bg-purple-700 block">
                <i className="fas fa-upload mr-2"></i> Upload Image
                <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
            </label>
            <h3 className="text-sm font-semibold text-gray-400 mb-2 px-2">My Media</h3>
            <div className="flex-grow overflow-y-auto pr-2">
                <div className="grid grid-cols-2 gap-2">
                    {myMediaFiles.filter(f => f.type === 'image').map(media => (
                        <div key={media.id} onClick={() => media.file && onSelect(media.file)} className="relative aspect-square bg-black rounded-lg overflow-hidden group cursor-pointer">
                            <img src={media.url} alt={media.name} className="w-full h-full object-cover" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
const StickersPanel: React.FC<{onSelectEmoji: (emoji: string) => void, onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void}> = ({onSelectEmoji, onUpload}) => (
    <div className="p-4">
        <label className="w-full text-center py-2 px-4 mb-3 bg-gray-700 text-white font-semibold rounded-lg cursor-pointer hover:bg-gray-600 block text-sm">
            <i className="fas fa-image mr-2"></i> Upload Custom Sticker
            <input type="file" accept="image/png, image/gif, image/webp" className="hidden" onChange={onUpload} />
        </label>
        <div className="grid grid-cols-5 gap-2">
            {STICKERS.map(emoji => (
                <button key={emoji} onClick={() => onSelectEmoji(emoji)} className="aspect-square bg-gray-700 text-2xl rounded-lg hover:bg-purple-600">
                    {emoji}
                </button>
            ))}
        </div>
    </div>
);

const TextPanel: React.FC<{ onAddText: () => void; selectedText: AppliedText | null; onUpdateText: (id: string, newProps: Partial<AppliedText>) => void }> = ({ onAddText, selectedText, onUpdateText }) => {
    if (selectedText) {
        return (
             <div className="p-4 space-y-4">
                <textarea
                    value={selectedText.content}
                    onChange={(e) => onUpdateText(selectedText.id, { content: e.target.value })}
                    rows={2}
                    className="w-full bg-gray-700 rounded-md p-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="text-xs text-gray-400">Font</label>
                        <select value={selectedText.fontFamily} onChange={e => onUpdateText(selectedText.id, { fontFamily: e.target.value })} className="w-full bg-gray-700 rounded-md p-2 text-sm">
                            {FONT_FACES.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-gray-400">Size</label>
                        <input type="number" value={selectedText.fontSize} onChange={e => onUpdateText(selectedText.id, { fontSize: +e.target.value })} className="w-full bg-gray-700 rounded-md p-2 text-sm"/>
                    </div>
                </div>
                <div>
                     <label className="text-xs text-gray-400">Color</label>
                     <input type="color" value={selectedText.color} onChange={e => onUpdateText(selectedText.id, { color: e.target.value })} className="w-full h-10 bg-gray-700 rounded-md p-1"/>
                </div>
            </div>
        )
    }
    return (
        <div className="p-4">
            <button onClick={onAddText} className="w-full py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700">
                <i className="fas fa-plus mr-2"></i> Add Text
            </button>
        </div>
    )
};

const AIImageEditor: React.FC = () => {
    const { aiMode, projectToLoad, setProjectToLoad } = useAppContext();
    const [originalImage, setOriginalImage] = useState<File | null>(null);
    const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
    const [editedImageUrl, setEditedImageUrl] = useState<string | null>(null);
    const [prompt, setPrompt] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    
    const [filters, setFilters] = useState<ImageFilters>(defaultFilters);
    const [activeTool, setActiveTool] = useState<EditorTool>('media');
    const [appliedStickers, setAppliedStickers] = useState<AppliedSticker[]>([]);
    const [appliedText, setAppliedText] = useState<AppliedText[]>([]);
    const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
    const [stickerImageCache, setStickerImageCache] = useState<Record<string, HTMLImageElement>>({});
    const [rotation, setRotation] = useState(0);
    const [resize, setResize] = useState({ width: 0, height: 0 });

    const imageRef = useRef<HTMLImageElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const finalCanvasRef = useRef<HTMLCanvasElement>(null);

    const redrawCanvas = useCallback(async (isFinalExport = false) => {
        const canvas = isFinalExport ? finalCanvasRef.current : canvasRef.current;
        const image = imageRef.current;
        if (!canvas || !image || !image.src || image.naturalWidth === 0) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;

        ctx.filter = `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturation}%) hue-rotate(${filters.hue}deg) blur(${filters.blur}px)`;
        ctx.drawImage(image, 0, 0);
        ctx.filter = 'none';

        // Draw stickers
        appliedStickers.forEach(sticker => {
            if (sticker.type === 'emoji') {
                ctx.font = `${sticker.size}px sans-serif`;
                ctx.fillText(sticker.content, sticker.x, sticker.y + sticker.size);
            }
        });
        
        // Draw text
        appliedText.forEach(text => {
            ctx.font = `${text.fontSize}px ${text.fontFamily}`;
            ctx.fillStyle = text.color;
            ctx.fillText(text.content, text.x, text.y);
        });

        if (!isFinalExport) {
            setEditedImageUrl(canvas.toDataURL());
        }
    }, [originalImageUrl, filters, rotation, appliedStickers, appliedText, stickerImageCache]);
    
    const resetAllEdits = (keepImage: boolean = false) => { /* ... existing implementation ... */ };
    useEffect(() => { /* ... existing implementation ... */ }, [redrawCanvas]);
    useEffect(() => { /* project loading logic */ }, [projectToLoad, setProjectToLoad]);

    const handleFileSelect = (file: File) => {
        resetAllEdits();
        setOriginalImage(file);
        const url = URL.createObjectURL(file);
        setOriginalImageUrl(url);
        
        const tempImg = new Image();
        tempImg.src = url;
        tempImg.onload = () => {
             imageRef.current = tempImg;
             setResize({ width: tempImg.naturalWidth, height: tempImg.naturalHeight });
             redrawCanvas();
             setActiveTool('adjust');
        };
    };
    
    const handleAITool = async (tool: 'background' | 'focus') => { /* ... existing implementation ... */ };
    const applyVintageFilter = () => { /* ... existing implementation ... */ };
    const handleDownload = () => { /* ... existing download logic ... */ };
    const handleSaveProject = async () => { /* ... existing save logic ... */ };
    const applyCropAndResize = (type: 'crop' | 'resize' | 'rotate', value?: any) => { /* ... existing code ... */ };
    const addSticker = (sticker: Omit<AppliedSticker, 'id'>) => { setAppliedStickers(prev => [...prev, { ...sticker, id: uuidv4() }]); }
    const handleAddEmoji = (emoji: string) => { if (!canvasRef.current) return; addSticker({ type: 'emoji', content: emoji, x: canvasRef.current.width/2 - 50, y: canvasRef.current.height/2-50, size: 100 }); }
    const handleCustomStickerUpload = (e: React.ChangeEvent<HTMLInputElement>) => { /* ... existing implementation ... */ }

    const handleAddText = () => {
        if (!canvasRef.current) return;
        const newText: AppliedText = {
            id: uuidv4(),
            content: 'Your Text Here',
            x: canvasRef.current.width / 2 - 100,
            y: canvasRef.current.height / 2,
            fontSize: 48,
            color: '#FFFFFF',
            fontFamily: 'Inter',
        };
        setAppliedText(prev => [...prev, newText]);
        setSelectedTextId(newText.id);
    };

    const handleUpdateText = (id: string, newProps: Partial<AppliedText>) => {
        setAppliedText(prev => prev.map(t => t.id === id ? { ...t, ...newProps } : t));
    };
    
    const selectedText = appliedText.find(t => t.id === selectedTextId) || null;

    useEffect(() => {
        redrawCanvas();
    }, [filters, appliedText, appliedStickers]);

    return (
        <div className="h-full flex flex-col md:flex-row gap-2 md:gap-4 p-2 md:p-4 overflow-hidden">
             {isLoading && <div className="fixed inset-0 bg-black/70 z-50 flex flex-col items-center justify-center"><Spinner /><p className="text-white mt-4">AI is thinking...</p></div>}
            <canvas ref={finalCanvasRef} className="hidden" /> {/* For final export */}
            
            <div className="hidden md:flex flex-col w-80 bg-gray-800 rounded-lg p-3">
                {/* Desktop: Right Panel */}
                <MediaPanel onSelect={handleFileSelect}/>
            </div>
            
            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-grow bg-gray-800 rounded-lg flex flex-col overflow-hidden">
                     {/* Top Bar */}
                     <div className="flex-shrink-0 p-3 bg-gray-900/30 flex justify-between items-center">
                        <h2 className="font-semibold text-white">AI Image Editor</h2>
                        <div className="flex items-center gap-2">
                             <button onClick={() => resetAllEdits(true)} title="Reset Changes" disabled={!originalImage} className="w-9 h-9 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-500 disabled:opacity-50 flex items-center justify-center"><i className="fas fa-undo"></i></button>
                             <button onClick={handleSaveProject} title="Save Project" disabled={!originalImage} className="w-9 h-9 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"><i className="fas fa-save"></i></button>
                             <button onClick={handleDownload} title="Download Image" disabled={!originalImage} className="w-9 h-9 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center"><i className="fas fa-download"></i></button>
                        </div>
                    </div>
                    
                    {/* Canvas */}
                    <div className="flex-grow bg-black/50 flex items-center justify-center relative overflow-hidden p-4">
                        <canvas ref={canvasRef} className="hidden" />
                        {!originalImage ? ( <div className="text-center text-gray-500"> <i className="fas fa-image text-4xl mb-2"></i> <p>Select an image to start editing</p> </div> ) : ( <img src={editedImageUrl || ''} alt="Edited" className="max-h-full max-w-full object-contain shadow-2xl" /> )}
                    </div>
                </div>

                 {/* Mobile Tools */}
                <div className="md:hidden flex flex-col flex-shrink-0 mt-2">
                    <div className="bg-gray-800 rounded-t-lg">
                        {activeTool === 'media' && <div className="h-64 p-2 overflow-y-auto"><MediaPanel onSelect={handleFileSelect} /></div>}
                        {originalImage && (
                          <>
                            {activeTool === 'ai' && <div className="p-4 grid grid-cols-3 gap-2 text-center text-white">
                                <button onClick={() => handleAITool('background')} className="p-2 bg-gray-700 rounded-lg hover:bg-purple-600"><i className="fas fa-user-ninja text-2xl mb-1"></i><span className="text-xs">BG Remover</span></button>
                                <button onClick={() => handleAITool('focus')} className="p-2 bg-gray-700 rounded-lg hover:bg-purple-600"><i className="fas fa-bullseye text-2xl mb-1"></i><span className="text-xs">Dynamic Focus</span></button>
                                <button onClick={applyVintageFilter} className="p-2 bg-gray-700 rounded-lg hover:bg-purple-600"><i className="fas fa-camera-retro text-2xl mb-1"></i><span className="text-xs">Vintage</span></button>
                            </div>}
                            {activeTool === 'adjust' && <div className="p-4"><input type="range" className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer range-thumb-purple disabled:opacity-50"/></div>}
                            {activeTool === 'crop' && (<div className="p-4 flex items-center justify-around gap-2">{CROP_RATIOS.map(r => <button key={r.name} onClick={() => applyCropAndResize('crop', r.value)} className="px-3 py-1 text-sm bg-gray-700 rounded">{r.name}</button>)}</div>)}
                            {activeTool === 'resize' && (<div className="p-4 flex items-center gap-2 text-sm"><input type="number" value={resize.width} onChange={e => setResize(r => ({...r, width: +e.target.value}))} className="w-1/2 bg-gray-700 rounded p-2"/> <span>x</span> <input type="number" value={resize.height} onChange={e => setResize(r => ({...r, height: +e.target.value}))} className="w-1/2 bg-gray-700 rounded p-2"/> <button onClick={() => applyCropAndResize('resize', resize)} className="p-2 bg-purple-600 rounded"><i className="fas fa-check"></i></button></div>)}
                            {activeTool === 'stickers' && <StickersPanel onSelectEmoji={handleAddEmoji} onUpload={handleCustomStickerUpload} />}
                            {activeTool === 'text' && <TextPanel onAddText={handleAddText} selectedText={selectedText} onUpdateText={handleUpdateText} />}
                          </>
                        )}
                    </div>

                    <div className="grid grid-cols-7 gap-1 p-2 bg-gray-900 rounded-b-lg">
                       <ModeButton icon="fa-photo-video" label="Media" isActive={activeTool === 'media'} onClick={() => setActiveTool('media')} />
                       <ModeButton icon="fa-robot" label="AI Tools" isActive={activeTool === 'ai'} onClick={() => originalImage && setActiveTool('ai')} disabled={!originalImage} />
                       <ModeButton icon="fa-sliders-h" label="Adjust" isActive={activeTool === 'adjust'} onClick={() => originalImage && setActiveTool('adjust')} disabled={!originalImage} />
                       <ModeButton icon="fa-crop-alt" label="Crop" isActive={activeTool === 'crop'} onClick={() => originalImage && setActiveTool('crop')} disabled={!originalImage} />
                       <ModeButton icon="fa-expand-arrows-alt" label="Resize" isActive={activeTool === 'resize'} onClick={() => originalImage && setActiveTool('resize')} disabled={!originalImage} />
                       <ModeButton icon="fa-smile-beam" label="Stickers" isActive={activeTool === 'stickers'} onClick={() => originalImage && setActiveTool('stickers')} disabled={!originalImage} />
                       <ModeButton icon="fa-font" label="Text" isActive={activeTool === 'text'} onClick={() => originalImage && setActiveTool('text')} disabled={!originalImage} />
                    </div>
                </div>
            </div>
        </div>
    );
};
const ModeButton: React.FC<{ icon: string; label: string; isActive: boolean; onClick: () => void; disabled?: boolean; }> = ({ icon, label, isActive, onClick, disabled }) => (
    <button onClick={onClick} disabled={disabled} className={`py-2 flex flex-col items-center justify-center gap-1 text-xs rounded-lg transition-colors w-full ${isActive ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-gray-700'} disabled:opacity-50 disabled:cursor-not-allowed`}>
        <i className={`fas ${icon} text-lg`}></i>
        <span>{label}</span>
    </button>
);
export default AIImageEditor;