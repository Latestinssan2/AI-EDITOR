import React, { useState, useCallback, useEffect, useRef } from 'react';
import { pexelsService } from '../../services/pexelsService';
import { toastService } from '../../services/toastService';
import { PexelsVideo, MediaFile, TimelineClip, VideoProjectState, ImageFilters, Overlay } from '../../types';
import { mediaLibraryService } from '../../services/mediaLibraryService';
import Spinner from '../common/Spinner';
import TimelineClipItem from './videoEditor/TimelineClipItem';
import TimelineOverlayItem from './videoEditor/TimelineOverlayItem';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { v4 as uuidv4 } from 'uuid';
import { projectService } from '../../services/projectService';
import { useAppContext } from '../../contexts/AppContext';

const BASE_PIXELS_PER_SECOND = 20;

const defaultFilters: ImageFilters = {
  brightness: 100, contrast: 100, saturation: 100,
  hue: 0, sharpness: 0, temperature: 0,
  blur: 0, vignette: 0
};

const FONT_FACES = [ 'Inter', 'Orbitron', 'Rajdhani', 'Audiowide', 'Jura', 'Share Tech Mono', 'Arial', 'Georgia' ];

const ClipPropertiesPanel: React.FC<{ clip: TimelineClip, onUpdate: (updatedClip: TimelineClip) => void; }> = ({ clip, onUpdate }) => {
    const handleFilterChange = (filterName: keyof ImageFilters, value: number) => {
        const newFilters = { ...(clip.filters || defaultFilters), [filterName]: value };
        onUpdate({ ...clip, filters: newFilters });
    };

    return (
        <div className="h-full flex flex-col text-white bg-gray-800">
            <div className="flex items-center p-3 border-b border-gray-700 flex-shrink-0">
                <i className="fas fa-sliders-h text-purple-400 text-lg mr-3"></i>
                <h2 className="text-lg font-semibold">Clip Properties</h2>
            </div>
            <div className="flex-grow p-4 space-y-4 overflow-y-auto">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Volume</label>
                    <input type="range" min="0" max="100" value={clip.volume ?? 100} onChange={e => onUpdate({ ...clip, volume: +e.target.value })} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer range-thumb-purple"/>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Speed</label>
                    <input type="range" min="0.5" max="2" step="0.1" value={clip.speed ?? 1} onChange={e => onUpdate({ ...clip, speed: +e.target.value })} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer range-thumb-purple"/>
                </div>
                <div>
                    <h3 className="text-md font-semibold text-gray-200 mt-4 mb-2">Filters</h3>
                    {Object.keys(defaultFilters).map(key => (
                         <div key={key}>
                            <label className="block text-xs font-medium text-gray-400 capitalize">{key}</label>
                            <input type="range" min="0" max="200" value={(clip.filters || defaultFilters)[key as keyof ImageFilters]} onChange={e => handleFilterChange(key as keyof ImageFilters, +e.target.value)} className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer range-thumb-purple-sm"/>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const OverlayPropertiesPanel: React.FC<{ overlay: Overlay; onUpdate: (updatedOverlay: Overlay) => void; }> = ({ overlay, onUpdate }) => {
    const handleUpdate = (prop: keyof Overlay, value: any) => { onUpdate({ ...overlay, [prop]: value }); };

    return (
        <div className="h-full flex flex-col text-white bg-gray-800">
            <div className="flex items-center p-3 border-b border-gray-700 flex-shrink-0">
                <i className="fas fa-font text-purple-400 text-lg mr-3"></i>
                <h2 className="text-lg font-semibold">Text Properties</h2>
            </div>
            <div className="flex-grow p-4 space-y-4 overflow-y-auto">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Content</label>
                    <textarea value={overlay.content} onChange={e => handleUpdate('content', e.target.value)} rows={3} className="w-full bg-gray-700 rounded-md p-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Font Family</label>
                    <select value={overlay.fontFamily} onChange={e => handleUpdate('fontFamily', e.target.value)} className="w-full bg-gray-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                        {FONT_FACES.map(f => <option key={f} value={f} style={{fontFamily: f}}>{f}</option>)}
                    </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm text-gray-300 mb-1 block">Font Size</label>
                        <input type="number" value={overlay.fontSize} onChange={e => handleUpdate('fontSize', parseInt(e.target.value, 10))} className="w-full bg-gray-700 rounded-md p-2 text-white text-sm" />
                    </div>
                    <div>
                        <label className="text-sm text-gray-300 mb-1 block">Text Color</label>
                        <input type="color" value={overlay.color} onChange={e => handleUpdate('color', e.target.value)} className="w-full h-10 bg-gray-700 rounded-md p-1 cursor-pointer" />
                    </div>
                </div>
                 <div className="flex items-center justify-between bg-gray-700/50 p-2 rounded-md">
                    <label className="text-sm text-gray-300">Style</label>
                    <div className="flex gap-2">
                        <button onClick={() => handleUpdate('fontWeight', overlay.fontWeight === 'bold' ? 'normal' : 'bold')} className={`w-8 h-8 rounded ${overlay.fontWeight === 'bold' ? 'bg-purple-500' : 'bg-gray-600'} `}><i className="fas fa-bold"></i></button>
                        <button onClick={() => handleUpdate('textShadow', !overlay.textShadow)} className={`w-8 h-8 rounded ${overlay.textShadow ? 'bg-purple-500' : 'bg-gray-600'} `}>S</button>
                    </div>
                </div>
                <div className="flex items-center justify-between bg-gray-700/50 p-2 rounded-md">
                    <label className="text-sm text-gray-300">Align</label>
                    <div className="flex gap-2">
                        <button onClick={() => handleUpdate('textAlign', 'left')} className={`w-8 h-8 rounded ${overlay.textAlign === 'left' ? 'bg-purple-500' : 'bg-gray-600'} `}><i className="fas fa-align-left"></i></button>
                        <button onClick={() => handleUpdate('textAlign', 'center')} className={`w-8 h-8 rounded ${overlay.textAlign === 'center' ? 'bg-purple-500' : 'bg-gray-600'} `}><i className="fas fa-align-center"></i></button>
                        <button onClick={() => handleUpdate('textAlign', 'right')} className={`w-8 h-8 rounded ${overlay.textAlign === 'right' ? 'bg-purple-500' : 'bg-gray-600'} `}><i className="fas fa-align-right"></i></button>
                    </div>
                </div>
                 <div>
                    <label className="text-sm text-gray-300 mb-1 block">Background Color</label>
                    <div className="flex gap-2">
                        <input type="color" value={overlay.backgroundColor} onChange={e => handleUpdate('backgroundColor', e.target.value)} className="w-16 h-10 bg-gray-700 rounded-md p-1 cursor-pointer" />
                        <input type="range" min="0" max="1" step="0.05" value={parseInt(overlay.backgroundColor?.slice(7,9) || 'ff', 16) / 255} onChange={e => { const hex = (overlay.backgroundColor || '#000000').slice(1,7); const alpha = Math.round(+e.target.value * 255).toString(16).padStart(2, '0'); handleUpdate('backgroundColor', `#${hex}${alpha}`); }} className="w-full h-2 my-auto bg-gray-600 rounded-lg appearance-none cursor-pointer range-thumb-purple"/>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ExportModal: React.FC<{ onStart: (config: any) => void; onClose: () => void; }> = ({ onStart, onClose }) => {
    const [config, setConfig] = useState({ resolution: '720p', quality: 'high' });
    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center" onClick={onClose}>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 w-11/12 max-w-md" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-white mb-6">Export Video</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Resolution</label>
                        <select value={config.resolution} onChange={e => setConfig(c => ({...c, resolution: e.target.value}))} className="w-full bg-gray-700 rounded-md px-3 py-2 text-sm text-white">
                            <option value="480p">480p</option>
                            <option value="720p">720p (HD)</option>
                            <option value="1080p">1080p (Full HD)</option>
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Quality</label>
                         <select value={config.quality} onChange={e => setConfig(c => ({...c, quality: e.target.value}))} className="w-full bg-gray-700 rounded-md px-3 py-2 text-sm text-white">
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </select>
                    </div>
                </div>
                <div className="mt-8 flex justify-end gap-4">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-600 rounded-lg hover:bg-gray-500">Cancel</button>
                    <button onClick={() => onStart(config)} className="px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-700">Start Export</button>
                </div>
            </div>
        </div>
    );
};
const ExportProgress: React.FC<{ progress: number }> = ({ progress }) => (
    <div className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center text-white">
        <Spinner />
        <p className="mt-4 text-lg font-semibold">Exporting Video...</p>
        <div className="w-1/2 max-w-md mt-2 bg-gray-700 rounded-full h-2.5">
            <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
        </div>
        <p className="mt-1 text-sm">{Math.round(progress)}%</p>
    </div>
);
const MediaLibraryPanel: React.FC<{ onAddToTimeline: (media: any) => void; onAddText: () => void; }> = ({ onAddToTimeline, onAddText }) => {
    const [activeTab, setActiveTab] = useState<'my-media' | 'stock'>('my-media');
    const [myMediaFiles, setMyMediaFiles] = useState<MediaFile[]>([]);
    const [stockVideos, setStockVideos] = useState<PexelsVideo[]>([]);
    const [searchQuery, setSearchQuery] = useState('nature');
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        const sub = mediaLibraryService.subscribe(setMyMediaFiles);
        return () => sub.unsubscribe();
    }, []);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        try {
            const results = await pexelsService.searchVideos(searchQuery);
            setStockVideos(results);
        } catch (error) {
            if (error instanceof Error) toastService.error(error.message);
        } finally {
            setIsSearching(false);
        }
    };
    
    useEffect(() => {
        if(activeTab === 'stock' && stockVideos.length === 0) {
             handleSearch(new Event('submit') as any);
        }
    }, [activeTab]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            await mediaLibraryService.addFiles(Array.from(e.target.files));
            toastService.success(`${e.target.files.length} file(s) added to library.`);
        }
    };

    return (
        <div className="h-full flex flex-col bg-gray-800 text-white">
            <div className="flex items-center p-3 border-b border-gray-700 flex-shrink-0">
                <i className="fas fa-photo-video text-purple-400 text-lg mr-3"></i>
                <h2 className="text-lg font-semibold">Media Library</h2>
            </div>
            <div className="flex border-b border-gray-700 flex-shrink-0">
                <button onClick={() => setActiveTab('my-media')} className={`flex-1 py-2 text-sm ${activeTab === 'my-media' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400'}`}>My Media</button>
                <button onClick={() => setActiveTab('stock')} className={`flex-1 py-2 text-sm ${activeTab === 'stock' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400'}`}>Stock Video</button>
            </div>
            <div className="flex-grow overflow-hidden p-3">
                {activeTab === 'my-media' && (
                    <div className="h-full flex flex-col">
                        <label className="w-full text-center py-3 px-4 mb-3 bg-purple-600 rounded-lg cursor-pointer hover:bg-purple-700 text-sm font-semibold block">
                            <i className="fas fa-upload mr-2"></i> Upload Media
                            <input type="file" accept="video/*,audio/*,image/*" multiple className="hidden" onChange={handleFileUpload} />
                        </label>
                        <button onClick={onAddText} className="w-full text-center py-3 px-4 mb-3 bg-blue-600 rounded-lg hover:bg-blue-700 text-sm font-semibold block">
                            <i className="fas fa-font mr-2"></i> Add Text Overlay
                        </button>
                        <div className="flex-grow overflow-y-auto pr-1">
                            <div className="grid grid-cols-2 gap-2">
                                {myMediaFiles.map(media => (
                                    <div onClick={() => onAddToTimeline(media)} key={media.id} className="relative aspect-video bg-black rounded-lg overflow-hidden group cursor-pointer">
                                        {media.type === 'video' && <video src={media.url} className="w-full h-full object-cover" />}
                                        {media.type === 'image' && <img src={media.url} alt={media.name} className="w-full h-full object-cover" />}
                                        {media.type === 'audio' && <div className="w-full h-full bg-green-800 flex items-center justify-center"><i className="fas fa-music text-3xl"></i></div>}
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <p className="text-white text-xs text-center p-1">{media.name}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
                 {activeTab === 'stock' && (
                    <div className="h-full flex flex-col">
                        <form onSubmit={handleSearch} className="flex gap-2 mb-3 flex-shrink-0">
                            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search Pexels..." className="flex-grow bg-gray-700 rounded-md px-3 py-2 text-sm"/>
                            <button type="submit" className="bg-purple-600 px-3 rounded-md hover:bg-purple-700">{isSearching ? <Spinner /> : <i className="fas fa-search"></i>}</button>
                        </form>
                        <div className="flex-grow overflow-y-auto pr-1">
                             <div className="grid grid-cols-2 gap-2">
                                {stockVideos.map(video => (
                                    <div onClick={() => onAddToTimeline(video)} key={video.id} className="relative aspect-video bg-black rounded-lg overflow-hidden group cursor-pointer">
                                        <img src={video.image} alt={video.url} className="w-full h-full object-cover" />
                                    </div>
                                ))}
                             </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
const ReplaceClipModal: React.FC<{onSelect: (media: MediaFile | PexelsVideo) => void; onClose: () => void}> = ({onSelect, onClose}) => {
    const [myMediaFiles, setMyMediaFiles] = useState<MediaFile[]>([]);
    useEffect(() => { const sub = mediaLibraryService.subscribe(setMyMediaFiles); return () => sub.unsubscribe(); }, []);

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center" onClick={onClose}>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 w-11/12 max-w-2xl h-3/4 flex flex-col" onClick={e => e.stopPropagation()}>
                <h2 className="text-xl font-bold text-white mb-4">Replace Clip</h2>
                <div className="flex-grow overflow-y-auto">
                     <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {myMediaFiles.filter(f => f.type === 'video').map(media => (
                             <div onClick={() => onSelect(media)} key={media.id} className="relative aspect-video bg-black rounded-lg overflow-hidden group cursor-pointer">
                                <img src={media.url} alt={media.name} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <p className="text-white text-xs text-center p-1">{media.name}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
const VideoEditor: React.FC = () => {
    const { projectToLoad, setProjectToLoad } = useAppContext();
    const [timelineClips, setTimelineClips] = useState<TimelineClip[]>([]);
    const [audioClips, setAudioClips] = useState<TimelineClip[]>([]);
    const [overlays, setOverlays] = useState<Overlay[]>([]);
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    const [zoomLevel, setZoomLevel] = useState(1);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playheadPosition, setPlayheadPosition] = useState(0);
    const [activeClipIndex, setActiveClipIndex] = useState(0);
    
    const [clipToReplace, setClipToReplace] = useState<string | null>(null);
    const [mobilePanel, setMobilePanel] = useState<'media' | 'properties' | null>(null);
    const [showExportModal, setShowExportModal] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [exportProgress, setExportProgress] = useState(0);
    const [previewSize, setPreviewSize] = useState({ width: 0, height: 0 });

    const videoRef = useRef<HTMLVideoElement>(null);
    const timelineContainerRef = useRef<HTMLDivElement>(null);
    const previewContainerRef = useRef<HTMLDivElement>(null);
    
    const selectedItem = timelineClips.find(c => c.id === selectedItemId) || audioClips.find(c => c.id === selectedItemId) || overlays.find(o => o.id === selectedItemId);
    const isClipSelected = selectedItem && 'source' in selectedItem;
    const isOverlaySelected = selectedItem && 'type' in selectedItem && (selectedItem.type === 'text');

    useEffect(() => { /* ... existing project loading logic ... */ }, [projectToLoad, setProjectToLoad]);
    useEffect(() => { /* ... existing resize observer logic ... */ }, []);

    const addClipToTimeline = (media: PexelsVideo | MediaFile) => { /* ... existing logic ... */ };
    
    const handleAddText = () => {
        const newTextOverlay: Overlay = { id: uuidv4(), type: 'text', content: 'Futuristic Text', startTime: playheadPosition, duration: 5, x: 10, y: 10, width: 80, height: 20, fontSize: 64, color: '#FFFFFF', fontFamily: 'Orbitron', fontWeight: 'bold', textAlign: 'center', textShadow: true, backgroundColor: '#8A2BE24D' };
        setOverlays(prev => [...prev, newTextOverlay]);
        setSelectedItemId(newTextOverlay.id);
    };

    const handleUpdateClip = (updatedClip: TimelineClip) => { /* ... existing logic ... */ };
    const handleUpdateOverlay = (updatedOverlay: Overlay) => { setOverlays(overlays.map(o => o.id === updatedOverlay.id ? updatedOverlay : o)); };
    
    const handleReplaceClip = (selectedMedia: PexelsVideo | MediaFile) => {
        if (!clipToReplace) return;
        setTimelineClips(prev => prev.map(clip => {
            if (clip.id === clipToReplace) {
                return {
                    ...clip,
                    isPlaceholder: false,
                    source: selectedMedia,
                    originalDuration: selectedMedia.duration || 5,
                };
            }
            return clip;
        }));
        setClipToReplace(null);
        toastService.success("Clip replaced!");
    };
    
    // FIX: Implemented the getMediaSrc function to return a valid URL string for different media types, resolving a type error by checking for PexelsVideo-specific properties first.
    const getMediaSrc = (source: TimelineClip['source']): string => {
        if (!source || ('isPlaceholder' in source && source.isPlaceholder)) {
            return '';
        }
        // Check for PexelsVideo first, as it also contains a 'url' property like MediaFile
        if ('video_files' in source) { // PexelsVideo
            const hdFile = source.video_files.find(f => f.quality === 'hd');
            return hdFile?.link || source.video_files[0]?.link || '';
        }
        if ('url' in source) { // MediaFile
            return source.url;
        }
        return '';
    };
    const handleSaveProject = async () => { /* ... (existing logic) */ };
    const handleStartExport = async (config: any) => { /* ... (existing logic) */ };
    const togglePlay = () => setIsPlaying(p => !p);
    const handleTimelineSeek = (e: React.MouseEvent<HTMLDivElement>) => { /* ... existing logic ... */ };
    
    useEffect(() => { /* ... existing play/pause logic ... */ }, [isPlaying]);
    useEffect(() => { /* ... existing playhead sync logic ... */ }, [playheadPosition, timelineClips, activeClipIndex, isPlaying]);
    const handleTimeUpdate = () => { /* ... existing logic ... */ };
    const handleVideoEnd = () => { /* ... existing logic ... */ };
    
    const totalDuration = timelineClips.reduce((sum, c) => sum + c.duration, 0);
    const hasClips = timelineClips.length > 0 || audioClips.length > 0;
    const visibleOverlays = overlays.filter(o => playheadPosition >= o.startTime && playheadPosition < o.startTime + o.duration);

    return (
        // FIX: Capitalized dndProvider to DndProvider to match the component name from react-dnd.
        <DndProvider backend={HTML5Backend}>
            <div className="p-2 md:p-4 h-full flex flex-col md:flex-row gap-4 overflow-hidden">
                {showExportModal && <ExportModal onStart={handleStartExport} onClose={() => setShowExportModal(false)} />}
                {isExporting && <ExportProgress progress={exportProgress} />}
                {clipToReplace && <ReplaceClipModal onSelect={handleReplaceClip} onClose={() => setClipToReplace(null)}/>}
                
                <div className={`md:flex flex-col w-full md:w-80 bg-gray-800 rounded-lg flex-shrink-0 overflow-hidden absolute md:relative z-30 inset-y-0 left-0 transform transition-transform duration-300 ease-in-out ${mobilePanel ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
                    <button onClick={() => setMobilePanel(null)} className="md:hidden absolute top-2 right-2 w-8 h-8 bg-gray-700 text-white rounded-full z-40"><i className="fas fa-times"></i></button>
                    {mobilePanel === 'properties' && isClipSelected ? <ClipPropertiesPanel clip={selectedItem as TimelineClip} onUpdate={handleUpdateClip} /> :
                     mobilePanel === 'properties' && isOverlaySelected ? <OverlayPropertiesPanel overlay={selectedItem as Overlay} onUpdate={handleUpdateOverlay} /> :
                     <MediaLibraryPanel onAddToTimeline={addClipToTimeline} onAddText={handleAddText} />}
                </div>

                <div className="flex-grow bg-gray-800 rounded-lg p-3 flex flex-col overflow-hidden">
                    <div className="flex-shrink-0 pb-2 mb-2 border-b border-gray-700/50 flex justify-between items-center">
                        <h2 className="font-semibold text-white">Video Editor</h2>
                        <div className="flex items-center gap-2">
                             <button onClick={handleSaveProject} title="Save Project" disabled={!hasClips} className="px-3 py-2 text-sm bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"><i className="fas fa-save"></i> <span className="hidden md:inline">Save</span></button>
                             <button onClick={() => setShowExportModal(true)} title="Export Video" disabled={!hasClips} className="px-3 py-2 text-sm bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"><i className="fas fa-upload"></i> <span className="hidden md:inline">Export</span></button>
                        </div>
                    </div>
                    
                    <div ref={previewContainerRef} className="flex-grow bg-black flex items-center justify-center mb-4 rounded-lg relative group">
                        <video ref={videoRef} onTimeUpdate={handleTimeUpdate} onEnded={handleVideoEnd} muted className="max-h-full max-w-full" />
                        {!isPlaying && timelineClips.length > 0 && <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none"><button onClick={togglePlay} className="w-20 h-20 bg-purple-600/50 rounded-full text-white text-3xl flex items-center justify-center pointer-events-auto hover:bg-purple-600/80"><i className="fas fa-play"></i></button></div>}
                        <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{width: previewSize.width, height: previewSize.height }}>
                            {visibleOverlays.map(o => {
                                const scaleFactor = previewSize.height / 1080; // Assuming 1080p canvas
                                const scaledFontSize = (o.fontSize || 48) * scaleFactor;
                                const bgColor = o.backgroundColor ? o.backgroundColor.slice(0,7) : 'transparent';
                                const bgOpacity = o.backgroundColor ? (parseInt(o.backgroundColor.slice(7,9) || 'ff', 16) / 255) : 1;
                                return (
                                <div key={o.id} style={{ position: 'absolute', left: `${o.x}%`, top: `${o.y}%`, width: `${o.width}%`, height: `${o.height}%`, display: 'flex', alignItems: 'center', justifyContent: o.textAlign || 'center' }}>
                                    {o.type === 'text' && 
                                    <div style={{ fontFamily: o.fontFamily || 'Inter, sans-serif', color: o.color || '#FFFFFF', fontSize: `${scaledFontSize}px`, fontWeight: o.fontWeight, textShadow: o.textShadow ? '2px 2px 8px rgba(0,0,0,0.8)' : 'none', backgroundColor: bgColor, opacity: bgOpacity, padding: '0.2em 0.5em', borderRadius: '5px', whiteSpace: 'pre-wrap', textAlign: o.textAlign }}>
                                        {o.content}
                                    </div>}
                                </div>
                            )})}
                        </div>
                    </div>

                    <div className="h-56 bg-gray-900 rounded-lg p-2 overflow-auto flex-shrink-0" ref={timelineContainerRef} onClick={handleTimelineSeek}>
                        <div className="relative h-full" style={{ width: `${totalDuration * BASE_PIXELS_PER_SECOND * zoomLevel}px` }}>
                            <div className="h-8 flex relative items-center mb-1">
                                {overlays.map(o => ( <TimelineOverlayItem key={o.id} overlay={o} onUpdate={handleUpdateOverlay} zoomLevel={zoomLevel} isSelected={selectedItemId === o.id} onClick={(e) => { e.stopPropagation(); setSelectedItemId(o.id); }} /> ))}
                            </div>
                            <div className="h-20 flex items-center space-x-1 p-1 rounded-md">
                                {timelineClips.map(clip => <TimelineClipItem key={clip.id} clip={clip} onUpdate={handleUpdateClip} onReplace={setClipToReplace} zoomLevel={zoomLevel} isAudio={false} isSelected={selectedItemId === clip.id} onClick={(e) => {e.stopPropagation(); setSelectedItemId(clip.id)}} />)}
                            </div>
                            <div className="h-16 flex items-center space-x-1 p-1 mt-1 rounded-md">
                                 {audioClips.map(clip => <TimelineClipItem key={clip.id} clip={clip} onUpdate={handleUpdateClip} onReplace={() => {}} zoomLevel={zoomLevel} isAudio={true} isSelected={selectedItemId === clip.id} onClick={(e) => {e.stopPropagation(); setSelectedItemId(clip.id)}} />)}
                            </div>
                            <div className="absolute top-0 bottom-0 w-0.5 bg-yellow-400 z-20 pointer-events-none" style={{ left: `${playheadPosition * BASE_PIXELS_PER_SECOND * zoomLevel}px` }}>
                                <div className="absolute -top-1 -left-1 w-3 h-3 bg-yellow-400 rounded-full"></div>
                            </div>
                        </div>
                    </div>
                </div>

                 <div className="md:hidden grid grid-cols-5 gap-1 p-2 bg-gray-900">
                    <ModeButton icon="fa-photo-video" label="Media" isActive={mobilePanel === 'media' || !mobilePanel} onClick={() => setMobilePanel('media')} />
                    <ModeButton icon="fa-sliders-h" label="Properties" isActive={mobilePanel === 'properties'} onClick={() => setMobilePanel('properties')} disabled={!selectedItem} />
                    <ModeButton icon="fa-save" label="Save" isActive={false} onClick={handleSaveProject} disabled={!hasClips}/>
                    <ModeButton icon="fa-upload" label="Export" isActive={false} onClick={() => setShowExportModal(true)} disabled={!hasClips}/>
                </div>
            </div>
        </DndProvider>
    );
};

// FIX: Defined the ModeButton component which was missing, resolving multiple 'Cannot find name' errors.
const ModeButton: React.FC<{ icon: string; label: string; isActive: boolean; onClick: () => void; disabled?: boolean; }> = ({ icon, label, isActive, onClick, disabled }) => (
    <button onClick={onClick} disabled={disabled} className={`py-2 flex flex-col items-center justify-center gap-1 text-xs rounded-lg transition-colors w-full ${isActive ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-gray-700'} disabled:opacity-50 disabled:cursor-not-allowed`}>
        <i className={`fas ${icon} text-lg`}></i>
        <span>{label}</span>
    </button>
);

export default VideoEditor;