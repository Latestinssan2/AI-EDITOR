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

const filterConfigs: { name: string; key: keyof ImageFilters; min: number; max: number; }[] = [
    { name: 'Brightness', key: 'brightness', min: 0, max: 200 },
    { name: 'Contrast', key: 'contrast', min: 0, max: 200 },
    { name: 'Saturation', key: 'saturation', min: 0, max: 200 },
];

const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

interface ClipPropertiesPanelProps {
    clip: TimelineClip;
    onUpdate: (updatedClip: TimelineClip) => void;
}

const ClipPropertiesPanel: React.FC<ClipPropertiesPanelProps> = ({ clip, onUpdate }) => {
    const handleFilterChange = (key: keyof ImageFilters, value: number) => {
        const updatedClip = { ...clip, filters: { ...clip.filters, [key]: value } };
        onUpdate(updatedClip);
    };

    const handlePropChange = (key: 'volume' | 'speed', value: number) => {
        const updatedClip = { ...clip, [key]: value };
        onUpdate(updatedClip);
    }
    
    return (
        <div className="h-full flex flex-col text-white">
            <div className="flex items-center p-3 border-b border-gray-700 flex-shrink-0">
                <h2 className="text-lg font-semibold">Clip Properties</h2>
            </div>
            <div className="flex-grow p-4 space-y-6 overflow-y-auto">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Volume</label>
                    <input type="range" min="0" max="1" step="0.01" value={clip.volume} onChange={e => handlePropChange('volume', parseFloat(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer range-thumb-purple"/>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Speed</label>
                    <input type="range" min="0.5" max="2" step="0.1" value={clip.speed} onChange={e => handlePropChange('speed', parseFloat(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer range-thumb-purple"/>
                </div>
                <h3 className="text-md font-semibold border-t border-gray-700 pt-4">Filters</h3>
                {filterConfigs.map(f => (
                    <div key={f.key}>
                         <label className="block text-sm font-medium text-gray-300 mb-2">{f.name}</label>
                         <input type="range" min={f.min} max={f.max} value={clip.filters?.[f.key]} onChange={e => handleFilterChange(f.key, parseFloat(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer range-thumb-purple"/>
                    </div>
                ))}
            </div>
        </div>
    )
}

interface OverlayPropertiesPanelProps {
    overlay: Overlay;
    onUpdate: (updatedOverlay: Overlay) => void;
}

const OverlayPropertiesPanel: React.FC<OverlayPropertiesPanelProps> = ({ overlay, onUpdate }) => {
    const handleUpdate = (prop: keyof Overlay, value: any) => {
        onUpdate({ ...overlay, [prop]: value });
    };

    return (
        <div className="h-full flex flex-col text-white">
            <div className="flex items-center p-3 border-b border-gray-700 flex-shrink-0">
                <h2 className="text-lg font-semibold">Text Properties</h2>
            </div>
            <div className="flex-grow p-4 space-y-4 overflow-y-auto">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Content</label>
                    <textarea value={overlay.content} onChange={e => handleUpdate('content', e.target.value)} rows={3} className="w-full bg-gray-700 rounded-md p-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Font Size</label>
                        <input type="number" value={overlay.fontSize} onChange={e => handleUpdate('fontSize', parseInt(e.target.value, 10))} className="w-full bg-gray-700 rounded-md p-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Color</label>
                        <input type="color" value={overlay.color} onChange={e => handleUpdate('color', e.target.value)} className="w-full h-10 bg-gray-700 rounded-md p-1 cursor-pointer" />
                    </div>
                </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Start Time (s)</label>
                        <input type="number" step="0.1" value={overlay.startTime} onChange={e => handleUpdate('startTime', parseFloat(e.target.value))} className="w-full bg-gray-700 rounded-md p-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Duration (s)</label>
                        <input type="number" step="0.1" value={overlay.duration} onChange={e => handleUpdate('duration', parseFloat(e.target.value))} className="w-full bg-gray-700 rounded-md p-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                    </div>
                </div>
            </div>
        </div>
    );
};


interface ExportConfig { quality: '720p' | '1080p'; format: 'mp4'; }

const ExportModal: React.FC<{ onStart: (config: ExportConfig) => void; onClose: () => void; }> = ({ onStart, onClose }) => {
    const [quality, setQuality] = useState<'720p' | '1080p'>('720p');
    const [format, setFormat] = useState<'mp4'>('mp4');
    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 max-w-md w-full text-white shadow-2xl">
                <h2 className="text-2xl font-bold mb-6">Export Video</h2>
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Quality</label>
                        <select value={quality} onChange={e => setQuality(e.target.value as any)} className="w-full bg-gray-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                            <option value="720p">720p (HD)</option>
                            <option value="1080p">1080p (Full HD)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Format</label>
                        <select value={format} onChange={e => setFormat(e.target.value as any)} className="w-full bg-gray-700 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                            <option value="mp4">MP4</option>
                        </select>
                    </div>
                </div>
                <div className="flex justify-end gap-4 mt-8">
                    <button onClick={onClose} className="px-5 py-2 bg-gray-600 font-semibold rounded-lg hover:bg-gray-500">Cancel</button>
                    <button onClick={() => onStart({ quality, format })} className="px-5 py-2 bg-purple-600 font-semibold rounded-lg hover:bg-purple-700">Start Export</button>
                </div>
            </div>
        </div>
    );
};

const ExportProgress: React.FC<{ progress: number }> = ({ progress }) => (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-8 max-w-md w-full text-white text-center shadow-2xl">
            <h2 className="text-2xl font-bold mb-4">Exporting Video...</h2>
            <p className="text-4xl font-mono mb-4">{progress.toFixed(0)}%</p>
            <div className="w-full bg-gray-600 rounded-full h-3">
                <div className="bg-purple-600 h-3 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
            </div>
            <p className="text-sm text-gray-400 mt-4">Please keep this tab open. Rendering is a heavy task!</p>
        </div>
    </div>
);
const MediaLibraryPanel: React.FC<{ onAddToTimeline: (media: PexelsVideo | MediaFile) => void; onAddText: () => void; }> = ({ onAddToTimeline, onAddText }) => {
    const [activeTab, setActiveTab] = useState<'video' | 'audio' | 'text' | 'my-media'>('video');
    const [searchQuery, setSearchQuery] = useState('nature');
    const [videos, setVideos] = useState<PexelsVideo[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [myMediaFiles, setMyMediaFiles] = useState<MediaFile[]>([]);

    useEffect(() => { const sub = mediaLibraryService.subscribe(setMyMediaFiles); return () => sub.unsubscribe(); }, []);

    const performSearch = useCallback(async (query: string) => { if (!query.trim()) return; setIsSearching(true); try { const results = await pexelsService.searchVideos(query); setVideos(results); } catch (error) { if (error instanceof Error) toastService.error(error.message); } finally { setIsSearching(false); } }, []);
    useEffect(() => { performSearch(searchQuery); }, [performSearch]);
    
    const handleSearchSubmit = (e: React.FormEvent) => { e.preventDefault(); performSearch(searchQuery); };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files) { await mediaLibraryService.addFiles(Array.from(e.target.files)); toastService.success(`${e.target.files.length} file(s) added to My Media.`); } };

    return (
        <div className="h-full flex flex-col p-3">
            <div className="flex border-b border-gray-700 mb-3 flex-shrink-0">
                <button onClick={() => setActiveTab('video')} className={`py-2 px-3 text-sm font-medium ${activeTab === 'video' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400'}`}>Video</button>
                <button onClick={() => setActiveTab('audio')} className={`py-2 px-3 text-sm font-medium ${activeTab === 'audio' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400'}`}>Audio</button>
                <button onClick={() => setActiveTab('text')} className={`py-2 px-3 text-sm font-medium ${activeTab === 'text' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400'}`}>Text</button>
                <button onClick={() => setActiveTab('my-media')} className={`py-2 px-3 text-sm font-medium ${activeTab === 'my-media' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400'}`}>My Media</button>
            </div>
            {(activeTab === 'video' || activeTab === 'audio') && (
                <div className="flex flex-col flex-grow overflow-hidden">
                    <form onSubmit={handleSearchSubmit} className="flex gap-2 mb-3">
                        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={`Search stock ${activeTab}...`} className="flex-grow bg-gray-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
                        <button type="submit" className="bg-purple-600 px-3 rounded-md hover:bg-purple-700"><i className="fas fa-search"></i></button>
                    </form>
                    <div className="flex-grow overflow-y-auto">
                        {isSearching ? <div className="flex items-center justify-center h-full"><Spinner /></div> : <div className="grid grid-cols-2 gap-2">{videos.map(video => <div onClick={() => onAddToTimeline(video)} key={video.id}><MediaItem item={video} isAudioSource={activeTab === 'audio'} /></div>)}</div>}
                    </div>
                </div>
            )}
            {activeTab === 'text' && (
                <div className="p-4 flex flex-col items-center">
                    <button onClick={onAddText} className="w-full py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 flex items-center justify-center gap-2">
                        <i className="fas fa-plus"></i> Add Text Layer
                    </button>
                    {/* Future: Add text style presets here */}
                </div>
            )}
            {activeTab === 'my-media' && (
                <div className="flex flex-col flex-grow overflow-hidden">
                    <label className="w-full text-center py-2 px-3 mb-3 bg-purple-600 text-white font-semibold rounded-lg cursor-pointer hover:bg-purple-700 text-sm"> <i className="fas fa-upload mr-2"></i> Upload Media <input type="file" accept="video/*,image/*,audio/*" multiple className="hidden" onChange={handleFileUpload} /> </label>
                    <div className="flex-grow overflow-y-auto">
                        <div className="grid grid-cols-2 gap-2"> {myMediaFiles.map(media => <div onClick={() => onAddToTimeline(media)} key={media.id}><MediaItem item={media} /></div>)} </div>
                    </div>
                </div>
            )}
        </div>
    );
};
const MediaItem: React.FC<{ item: PexelsVideo | MediaFile; isAudioSource?: boolean }> = ({ item, isAudioSource }) => {
    const isAudio = ('type' in item && item.type === 'audio') || isAudioSource;
    const getThumbnail = () => { if ('image' in item) return item.image; if ('url' in item && item.type !== 'audio') return item.url; return ''; };
    return (
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden group cursor-pointer">
            {isAudio ? ( <div className="w-full h-full bg-green-800 flex items-center justify-center"><i className="fas fa-music text-4xl text-green-300"></i></div> ) : ( <img src={getThumbnail()} alt={'name' in item ? item.name : item.url} className="w-full h-full object-cover" /> )}
            <div className="absolute inset-0 bg-black/40"></div>
            <div className="absolute bottom-1 left-2 right-2">
                <p className="text-white text-xs truncate">{ 'name' in item ? item.name : `Pexels ID: ${item.id}` }</p>
                <p className="text-gray-300 text-xs">{item.duration?.toFixed(1)}s</p>
            </div>
            {!isAudio && <i className="fas fa-play absolute top-2 right-2 text-white/70"></i>}
        </div>
    );
};
const ModeButton: React.FC<{ icon: string; label: string; isActive: boolean; onClick: () => void; disabled?: boolean; }> = ({ icon, label, isActive, onClick, disabled }) => (
    <button onClick={onClick} disabled={disabled} className={`py-2 flex flex-col items-center gap-1 text-xs rounded-lg transition-colors ${isActive ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-gray-700'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
        <i className={`fas ${icon} text-lg`}></i> <span>{label}</span>
    </button>
);

const VideoEditor: React.FC = () => {
    const { projectToLoad, setProjectToLoad } = useAppContext();
    const [timelineClips, setTimelineClips] = useState<TimelineClip[]>([]);
    const [audioClips, setAudioClips] = useState<TimelineClip[]>([]);
    const [overlays, setOverlays] = useState<Overlay[]>([]);
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    const [zoomLevel, setZoomLevel] = useState(1);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playheadPosition, setPlayheadPosition] = useState(0); // This is now global time in seconds
    const [activeClipIndex, setActiveClipIndex] = useState(0);

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
    const isOverlaySelected = selectedItem && 'type' in selectedItem && (selectedItem.type === 'text' || selectedItem.type === 'sticker');

    useEffect(() => { if (projectToLoad && projectToLoad.type === 'video') { const state = projectToLoad.state as VideoProjectState; setTimelineClips(state.timelineClips); setAudioClips(state.audioClips); setOverlays(state.overlays || []); setZoomLevel(state.zoomLevel); setPlayheadPosition(state.playheadPosition); toastService.info(`Project "${projectToLoad.name}" loaded.`); setProjectToLoad(null); } }, [projectToLoad, setProjectToLoad]);
    
    useEffect(() => {
        const container = previewContainerRef.current; if (!container) return;
        const resizeObserver = new ResizeObserver(entries => { for (let entry of entries) { setPreviewSize({ width: entry.contentRect.width, height: entry.contentRect.height }); } });
        resizeObserver.observe(container);
        return () => resizeObserver.disconnect();
    }, []);

    const addClipToTimeline = (media: PexelsVideo | MediaFile) => {
        const isAudio = ('type' in media && media.type === 'audio') || (media.duration && !('video_files' in media));
        const newClip: TimelineClip = { id: uuidv4(), source: media, originalDuration: media.duration || 5, duration: media.duration || 5, startOffset: 0, volume: 1, speed: 1, filters: { ...defaultFilters }, };
        if (isAudio) { setAudioClips(prev => [...prev, newClip]); } else { setTimelineClips(prev => [...prev, newClip]); }
    };
    
    const handleAddText = () => {
        const newTextOverlay: Overlay = { id: uuidv4(), type: 'text', content: 'Your Text Here', startTime: playheadPosition, duration: 5, x: 10, y: 10, width: 80, height: 20, fontSize: 48, color: '#FFFFFF', fontFamily: 'Inter', };
        setOverlays(prev => [...prev, newTextOverlay]);
        setSelectedItemId(newTextOverlay.id);
    };

    const handleUpdateClip = (updatedClip: TimelineClip) => { const isAudio = 'type' in updatedClip.source && updatedClip.source.type === 'audio'; const clipUpdater = (setter: React.Dispatch<React.SetStateAction<TimelineClip[]>>) => { setter(clips => clips.map(c => c.id === updatedClip.id ? updatedClip : c)); }; isAudio ? clipUpdater(setAudioClips) : clipUpdater(setAudioClips); };
    const handleUpdateOverlay = (updatedOverlay: Overlay) => { setOverlays(overlays => overlays.map(o => o.id === updatedOverlay.id ? updatedOverlay : o)); };
    
    const getMediaSrc = (media: PexelsVideo | MediaFile): string => { if ('video_files' in media) { const hdFile = media.video_files.find(f => f.quality === 'hd'); return hdFile?.link || media.video_files[0]?.link || ''; } if ('url' in media) return media.url; return ''; };

    const handleSaveProject = async () => { /* ... (existing logic) */ };
    const handleStartExport = async (config: ExportConfig) => { /* ... (existing logic) */ };

    const togglePlay = () => setIsPlaying(p => !p);

    const handleTimelineSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!timelineContainerRef.current) return;
        const timelineRect = timelineContainerRef.current.getBoundingClientRect();
        const clickX = e.clientX - timelineRect.left;
        const totalDuration = timelineClips.reduce((sum, c) => sum + c.duration, 0);
        if (totalDuration === 0) return;
        const scrollLeft = timelineContainerRef.current.scrollLeft;
        const seekTime = ((clickX + scrollLeft) / (totalDuration * BASE_PIXELS_PER_SECOND * zoomLevel)) * totalDuration;
        setPlayheadPosition(Math.max(0, seekTime));
    };

    useEffect(() => {
        const video = videoRef.current; if (!video) return;
        if (isPlaying) {
            video.play().catch(e => console.error("Play error:", e));
        } else {
            video.pause();
        }
    }, [isPlaying]);
    
    useEffect(() => {
        const video = videoRef.current; if (!video || timelineClips.length === 0) return;
        let cumulativeTime = 0;
        let clipFound = false;
        for (let i = 0; i < timelineClips.length; i++) {
            const clip = timelineClips[i];
            if (playheadPosition >= cumulativeTime && playheadPosition < cumulativeTime + clip.duration) {
                const clipTime = playheadPosition - cumulativeTime;
                if (activeClipIndex !== i) {
                    setActiveClipIndex(i);
                    video.src = getMediaSrc(clip.source);
                }
                if (Math.abs(video.currentTime - clipTime) > 0.2) { video.currentTime = clipTime; }
                clipFound = true;
                break;
            }
            cumulativeTime += clip.duration;
        }
        if (!clipFound && isPlaying) { setIsPlaying(false); }
    }, [playheadPosition, timelineClips, activeClipIndex, isPlaying]);

    const handleTimeUpdate = () => {
        const video = videoRef.current;
        if (!video || activeClipIndex === null || !isPlaying) return;
        let cumulativeTime = 0;
        for (let i = 0; i < activeClipIndex; i++) {
            cumulativeTime += timelineClips[i].duration;
        }
        setPlayheadPosition(cumulativeTime + video.currentTime);
    };
    
    const handleVideoEnd = () => {
        if (activeClipIndex < timelineClips.length - 1) {
            setActiveClipIndex(i => i + 1);
        } else {
            setIsPlaying(false);
            setPlayheadPosition(0);
            setActiveClipIndex(0);
        }
    };
    
    const totalDuration = timelineClips.reduce((sum, c) => sum + c.duration, 0);
    const hasClips = timelineClips.length > 0 || audioClips.length > 0;

    const visibleOverlays = overlays.filter(o => playheadPosition >= o.startTime && playheadPosition < o.startTime + o.duration);

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="p-2 md:p-4 h-full flex flex-col md:flex-row gap-4 overflow-hidden">
                {showExportModal && <ExportModal onStart={handleStartExport} onClose={() => setShowExportModal(false)} />}
                {isExporting && <ExportProgress progress={exportProgress} />}
                
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
                        <div className="absolute inset-0 pointer-events-none overflow-hidden">
                            {visibleOverlays.map(o => {
                                const scaleFactor = previewSize.height / 1080;
                                const scaledFontSize = (o.fontSize || 48) * scaleFactor;
                                return (
                                <div key={o.id} style={{ position: 'absolute', left: `${o.x}%`, top: `${o.y}%`, width: `${o.width}%`, height: `${o.height}%` }}>
                                    {o.type === 'sticker' && <img src={o.content} alt="sticker" className="w-full h-full" />}
                                    {o.type === 'text' && <div style={{ fontFamily: o.fontFamily || 'Inter, sans-serif', color: o.color || '#FFFFFF', fontSize: `${scaledFontSize}px`, fontWeight: 'bold', textShadow: '2px 2px 4px rgba(0,0,0,0.7)' }}>{o.content}</div>}
                                </div>
                            )})}
                        </div>
                    </div>

                    <div className="h-56 bg-gray-900 rounded-lg p-2 overflow-auto flex-shrink-0" ref={timelineContainerRef} onClick={handleTimelineSeek}>
                        <div className="relative h-full" style={{ width: `${totalDuration * BASE_PIXELS_PER_SECOND * zoomLevel}px` }}>
                            <div className="h-8 flex relative items-center mb-1">
                                {overlays.map(o => (
                                    <TimelineOverlayItem key={o.id} overlay={o} onUpdate={handleUpdateOverlay} zoomLevel={zoomLevel} isSelected={selectedItemId === o.id} onClick={(e) => { e.stopPropagation(); setSelectedItemId(o.id); }} />
                                ))}
                            </div>
                            <div className="h-20 flex items-center space-x-1 p-1 rounded-md">
                                {timelineClips.map(clip => <TimelineClipItem key={clip.id} clip={clip} onUpdate={handleUpdateClip} zoomLevel={zoomLevel} isAudio={false} isSelected={selectedItemId === clip.id} onClick={(e) => {e.stopPropagation(); setSelectedItemId(clip.id)}} />)}
                            </div>
                            <div className="h-16 flex items-center space-x-1 p-1 mt-1 rounded-md">
                                 {audioClips.map(clip => <TimelineClipItem key={clip.id} clip={clip} onUpdate={handleUpdateClip} zoomLevel={zoomLevel} isAudio={true} isSelected={selectedItemId === clip.id} onClick={(e) => {e.stopPropagation(); setSelectedItemId(clip.id)}} />)}
                            </div>
                            <div className="absolute top-0 bottom-0 w-0.5 bg-yellow-400 z-20 pointer-events-none" style={{ left: `${playheadPosition * BASE_PIXELS_PER_SECOND * zoomLevel}px` }}>
                                <div className="absolute -top-1 -left-1 w-3 h-3 bg-yellow-400 rounded-full"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="md:hidden grid grid-cols-5 gap-1 p-2 bg-gray-900">
                    <ModeButton icon="fa-photo-video" label="Media" isActive={mobilePanel === 'media' || !mobilePanel} onClick={() => setMobilePanel('media')} />
                    <ModeButton icon="fa-font" label="Text" isActive={false} onClick={handleAddText} />
                    <ModeButton icon="fa-sliders-h" label="Properties" isActive={mobilePanel === 'properties'} onClick={() => setMobilePanel('properties')} disabled={!selectedItem} />
                    <ModeButton icon="fa-save" label="Save" isActive={false} onClick={handleSaveProject} disabled={!hasClips}/>
                    <ModeButton icon="fa-upload" label="Export" isActive={false} onClick={() => setShowExportModal(true)} disabled={!hasClips}/>
                </div>
            </div>
        </dndprovider>
    );
};

export default VideoEditor;