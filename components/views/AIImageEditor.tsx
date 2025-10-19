import React, { useState, useCallback, useEffect, useRef } from 'react';
import { fileToBase64 } from '../../utils/fileUtils';
import { editImageWithPrompt, removeImageBackground } from '../../services/geminiService';
import { toastService } from '../../services/toastService';
import { useAppContext } from '../../contexts/AppContext';
import Spinner from '../common/Spinner';
import { pexelsService } from '../../services/pexelsService';
import { PexelsPhoto, MediaFile, ImageEditorProjectState, ImageFilters } from '../../types';
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
const CROP_RATIOS = [
    { name: 'Free', value: 0 }, { name: '1:1', value: 1/1 }, { name: '4:3', value: 4/3 },
    { name: '16:9', value: 16/9 }, { name: '9:16', value: 9/16 },
];

const MediaPanel: React.FC<{ onSelect: (file: File) => void }> = ({ onSelect }) => {
    const [activeTab, setActiveTab] = useState<'stock' | 'my-media'>('stock');
    const [searchQuery, setSearchQuery] = useState('nature');
    const [photos, setPhotos] = useState<PexelsPhoto[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [myMediaFiles, setMyMediaFiles] = useState<MediaFile[]>([]);

    useEffect(() => {
        const sub = mediaLibraryService.subscribe(setMyMediaFiles);
        return () => sub.unsubscribe();
    }, []);

    const performSearch = useCallback(async (query: string) => {
        if (!query.trim()) return;
        setIsSearching(true);
        try {
            const results = await pexelsService.searchPhotos(query);
            setPhotos(results);
        } catch (error) {
            if (error instanceof Error) toastService.error(error.message);
        } finally {
            setIsSearching(false);
        }
    }, []);

    useEffect(() => {
        performSearch(searchQuery);
    }, [performSearch]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        performSearch(searchQuery);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            await mediaLibraryService.addFiles(Array.from(e.target.files));
            toastService.success(`${e.target.files.length} file(s) added to My Media.`);
        }
    };
    
    const handleStockPhotoSelect = async (photo: PexelsPhoto) => {
        try {
            toastService.info("Downloading stock photo...");
            const response = await fetch(photo.src.large2x); // Use a high-res version
            if (!response.ok) throw new Error('Network response was not ok');
            const blob = await response.blob();
            const extension = photo.src.large2x.split('.').pop()?.split('?')[0] || 'jpg';
            const file = new File([blob], `pexels-${photo.id}.${extension}`, { type: blob.type });
            onSelect(file);
        } catch (e) {
            errorHandler.handle(e, "StockPhotoDownload");
            toastService.error("Failed to load stock photo.");
        }
    };

    const handleMyMediaSelect = (media: MediaFile) => {
        onSelect(media.file);
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex border-b border-gray-700 mb-3">
                <button onClick={() => setActiveTab('stock')} className={`py-2 px-4 text-sm font-medium ${activeTab === 'stock' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400'}`}>Stock</button>
                <button onClick={() => setActiveTab('my-media')} className={`py-2 px-4 text-sm font-medium ${activeTab === 'my-media' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400'}`}>My Media</button>
            </div>
            {activeTab === 'stock' && (
                <div className="flex flex-col flex-grow overflow-hidden">
                    <form onSubmit={handleSearchSubmit} className="flex gap-2 mb-3">
                        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search Pexels..." className="flex-grow bg-gray-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
                        <button type="submit" className="bg-purple-600 px-3 rounded-md hover:bg-purple-700"><i className="fas fa-search"></i></button>
                    </form>
                    <div className="flex-grow overflow-y-auto pr-2">
                        {isSearching ? <div className="flex items-center justify-center h-full"><Spinner /></div> : <div className="grid grid-cols-3 gap-2">{photos.map(photo => <div key={photo.id} className="relative aspect-square bg-black rounded-lg overflow-hidden group cursor-pointer" onClick={() => handleStockPhotoSelect(photo)}>
                            <img src={photo.src.medium} alt={photo.alt} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-2">
                                <p className="text-white text-xs text-center">{photo.alt}</p>
                            </div>
                        </div>)}</div>}
                    </div>
                </div>
            )}
            {activeTab === 'my-media' && (
                <div className="flex flex-col flex-grow overflow-hidden">
                    <label className="w-full text-center py-2 px-4 mb-3 bg-purple-600 text-white font-semibold rounded-lg cursor-pointer hover:bg-purple-700">
                        <i className="fas fa-upload mr-2"></i> Upload Images
                        <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileUpload} />
                    </label>
                    <div className="flex-grow overflow-y-auto pr-2">
                        <div className="grid grid-cols-3 gap-2">
                            {myMediaFiles.filter(f => f.type === 'image').map(media => <div key={media.id} className="relative aspect-square bg-black rounded-lg overflow-hidden group cursor-pointer" onClick={() => handleMyMediaSelect(media)}>
                                <img src={media.url} alt={media.name} className="w-full h-full object-cover" />
                                <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-1">
                                    <p className="text-white text-xs truncate">{media.name}</p>
                                </div>
                            </div>)}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
const StickersPanel: React.FC<{onSelectEmoji: (emoji: string) => void, onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void}> = ({onSelectEmoji, onUpload}) => (
    <div className="h-48 bg-gray-800 p-2 flex flex-col">
        <div className="flex-grow overflow-y-auto pr-2">
            <div className="grid grid-cols-7 gap-2 text-center">
                {STICKERS.map(s => <button key={s} onClick={() => onSelectEmoji(s)} className="text-3xl hover:bg-gray-700 rounded-md transition-colors">{s}</button>)}
            </div>
        </div>
        <label className="w-full text-center py-2 px-3 mt-2 bg-purple-600 text-white font-semibold rounded-lg cursor-pointer hover:bg-purple-700 text-sm">
            <i className="fas fa-upload mr-2"></i> Upload Custom Sticker
            <input type="file" accept="image/png, image/jpeg, image/webp" className="hidden" onChange={onUpload} />
        </label>
    </div>
);


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
    const [stickerImageCache, setStickerImageCache] = useState<Record<string, HTMLImageElement>>({});
    const [rotation, setRotation] = useState(0);
    const [resize, setResize] = useState({ width: 0, height: 0 });

    const imageRef = useRef<HTMLImageElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const redrawCanvas = useCallback(async (forceDefaults = false) => { /* ... existing implementation ... */ }, [originalImageUrl, filters, rotation, appliedStickers, stickerImageCache]);
    const resetAllEdits = (keepImage: boolean = false) => { /* ... existing implementation ... */ };
    useEffect(() => { /* ... existing implementation ... */ }, [redrawCanvas]);
    useEffect(() => { /* project loading logic */ }, [projectToLoad, setProjectToLoad]);

    const handleFileSelect = (file: File) => {
        resetAllEdits();
        setOriginalImage(file);
        const url = URL.createObjectURL(file);
        setOriginalImageUrl(url);
        setEditedImageUrl(url); 
        const tempImg = new Image();
        tempImg.src = url;
        tempImg.onload = () => {
             setResize({ width: tempImg.naturalWidth, height: tempImg.naturalHeight });
             if(imageRef.current) imageRef.current.src = url;
             setActiveTool('adjust');
        };
    };
    
    const handleAITool = async (tool: 'background' | 'focus') => {
        if (!originalImage || aiMode === 'Device') {
            toastService.error("Cloud AI mode and an image are required for this feature.");
            return;
        }
        setIsLoading(true);
        try {
            const base64 = await fileToBase64(originalImage);
            let resultBase64;
            if (tool === 'background') {
                toastService.info("AI is removing background...");
                resultBase64 = await removeImageBackground(base64, originalImage.type);
            } else { // focus
                toastService.info("AI is applying dynamic focus...");
                resultBase64 = await editImageWithPrompt(base64, originalImage.type, "Apply a dynamic focus effect, making the background blurry (bokeh) while keeping the main subject in sharp focus.");
            }
            const newUrl = `data:image/png;base64,${resultBase64}`;
            setEditedImageUrl(newUrl);
            toastService.success("AI edit applied successfully!");
        } catch (error) {
            errorHandler.handle(error, `AITool_${tool}`);
        } finally {
            setIsLoading(false);
        }
    };
    
    const applyVintageFilter = () => {
        setFilters(f => ({ ...f, saturation: 50, contrast: 120, brightness: 90 }));
        toastService.info("Vintage filter applied.");
    };

    const handleDownload = () => { /* ... existing download logic ... */ };
    const handleSaveProject = async () => { /* ... existing save logic ... */ };
    const applyCropAndResize = (type: 'crop' | 'resize' | 'rotate', value?: any) => { /* ... existing code ... */ };
    const addSticker = (sticker: Omit<AppliedSticker, 'id'>) => { setAppliedStickers(prev => [...prev, { ...sticker, id: uuidv4() }]); }
    const handleAddEmoji = (emoji: string) => { if (!canvasRef.current) return; addSticker({ type: 'emoji', content: emoji, x: canvasRef.current.width/2 - 50, y: canvasRef.current.height/2-50, size: 100 }); }
    const handleCustomStickerUpload = (e: React.ChangeEvent<HTMLInputElement>) => { /* ... existing implementation ... */ }

    return (
        <div className="h-full flex flex-col md:flex-row gap-2 md:gap-4 p-2 md:p-4 overflow-hidden">
             {isLoading && <div className="fixed inset-0 bg-black/70 z-50 flex flex-col items-center justify-center"><Spinner /><p className="text-white mt-4">AI is thinking...</p></div>}
            <div className="hidden md:flex flex-col w-80 bg-gray-800 rounded-lg p-3">
                <MediaPanel onSelect={handleFileSelect}/>
            </div>
            
            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-grow bg-gray-800 rounded-lg flex flex-col overflow-hidden">
                     <div className="flex-shrink-0 p-3 bg-gray-900/30 flex justify-between items-center">
                        <h2 className="font-semibold text-white">AI Image Editor</h2>
                        <div className="flex items-center gap-2">
                             <button onClick={() => resetAllEdits(true)} title="Reset Changes" disabled={!originalImage} className="w-9 h-9 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-500 disabled:opacity-50 flex items-center justify-center"><i className="fas fa-undo"></i></button>
                             <button onClick={handleSaveProject} title="Save Project" disabled={!originalImage} className="w-9 h-9 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"><i className="fas fa-save"></i></button>
                             <button onClick={handleDownload} title="Download Image" disabled={!originalImage} className="w-9 h-9 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center"><i className="fas fa-download"></i></button>
                        </div>
                    </div>
                    
                    <div className="flex-grow bg-black/50 flex items-center justify-center relative overflow-hidden p-4">
                        <img ref={imageRef} src={originalImageUrl || ''} alt="" className="hidden"/> <canvas ref={canvasRef} className="hidden" />
                        {!originalImage ? ( <div className="text-center text-gray-500"> <i className="fas fa-image text-4xl mb-2"></i> <p>Select an image to start editing</p> </div> ) : ( <img src={editedImageUrl || ''} alt="Edited" className="max-h-full max-w-full object-contain shadow-2xl" /> )}
                    </div>
                </div>

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
                            {activeTool === 'text' && <div className="p-4 text-center text-gray-400">Text controls coming soon!</div>}
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
    <button
        onClick={onClick}
        disabled={disabled}
        className={`py-2 flex flex-col items-center gap-1 text-xs rounded-lg transition-colors 
        ${isActive ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-gray-700'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
        <i className={`fas ${icon} text-lg`}></i>
        <span>{label}</span>
    </button>
);
export default AIImageEditor;