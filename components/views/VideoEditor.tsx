import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import {
  MediaFile, PexelsVideo, VideoProjectState, Project, TimelineClip, Overlay, AudioClipping
} from '../../types';
import { useAppContext } from '../../contexts/AppContext';
import { projectService } from '../../services/projectService';
import { toastService } from '../../services/toastService';
import { v4 as uuidv4 } from 'uuid';
import EditorTopBar from '../editor/EditorTopBar';
import EditorToolbar from '../editor/EditorToolbar';
import MediaPanel from '../editor/panels/MediaPanel';
import VideoPlayer from './videoEditor/VideoPlayer';
import Timeline from './videoEditor/Timeline';
import VideoEditPanel from '../editor/panels/VideoEditPanel';
import VideoTextPanel from '../editor/panels/VideoTextPanel';
import StickersPanel from '../editor/panels/StickersPanel';
import EffectsPanel from '../editor/panels/EffectsPanel';
import AudioPanel from '../editor/panels/AudioPanel';
import { exportService } from '../../services/exportService';
import ExportSuccessModal from '../editor/panels/ExportSuccessModal';
import Spinner from '../common/Spinner';

const defaultProjectState: VideoProjectState = {
    timelineClips: [],
    overlays: [],
    audioClips: [],
    zoomLevel: 1,
    playheadPosition: 0,
    duration: 0,
};

const VideoEditor: React.FC = () => {
    const { projectToLoad, setProjectToLoad } = useAppContext();
    const [project, setProject] = useState<Project | null>(null);
    const [projectName, setProjectName] = useState('Untitled Video');
    const [state, setState] = useState<VideoProjectState>(defaultProjectState);
    
    const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
    const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(null);
    
    const [activeTool, setActiveTool] = useState('media');
    
    const [history, setHistory] = useState<VideoProjectState[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    const [isExporting, setIsExporting] = useState(false);
    const [exportProgress, setExportProgress] = useState(0);
    const [exportedMedia, setExportedMedia] = useState<{ url: string; file: File; type: 'image' | 'video' } | null>(null);
    const playerRef = useRef<{ seek: (time: number) => void }>(null);


    const updateState = (newState: Partial<VideoProjectState>) => {
        setState(prevState => ({ ...prevState, ...newState }));
    };

    const addToHistory = useCallback((newState: VideoProjectState) => {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newState);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    }, [history, historyIndex]);

    const handleStateChangeWithHistory = (newState: Partial<VideoProjectState>) => {
        const fullNewState = { ...state, ...newState };
        setState(fullNewState);
        addToHistory(fullNewState);
    };

    const handleUndo = () => {
        if (historyIndex > 0) {
            const prevState = history[historyIndex - 1];
            setState(prevState);
            setHistoryIndex(historyIndex - 1);
        }
    };

    const handleRedo = () => {
        if (historyIndex < history.length - 1) {
            const nextState = history[historyIndex + 1];
            setState(nextState);
            setHistoryIndex(historyIndex + 1);
        }
    };

    useEffect(() => {
        if (projectToLoad && projectToLoad.type === 'video') {
            const videoState = projectToLoad.state as VideoProjectState;
            setProject(projectToLoad);
            setProjectName(projectToLoad.name);
            setState(videoState);
            setHistory([videoState]);
            setHistoryIndex(0);
            setProjectToLoad(null);
        }
    }, [projectToLoad, setProjectToLoad]);

    useEffect(() => {
        const totalDuration = state.timelineClips.reduce((sum, clip) => sum + clip.duration, 0);
        if (totalDuration !== state.duration) {
            setState(s => ({ ...s, duration: totalDuration }));
        }
    }, [state.timelineClips, state.duration]);


    const handleSelectMedia = (media: MediaFile | PexelsVideo) => {
        const sourceAsMediaFile: MediaFile = 'file' in media ? media : {
            id: `pexels-video-${media.id}`,
            name: `Pexels by ${media.user.name}`,
            url: media.video_files.find(f => f.quality === 'hd')?.link || media.video_files[0].link,
            type: 'video',
            file: new File([], `pexels-${media.id}.mp4`, { type: 'video/mp4' }),
            duration: media.duration,
        };

        const newClip: TimelineClip = {
            id: uuidv4(),
            source: sourceAsMediaFile,
            isPlaceholder: false,
            duration: media.duration || 5,
            originalDuration: media.duration || 5,
            startOffset: 0,
        };
        const newTimeline = [...state.timelineClips, newClip];
        handleStateChangeWithHistory({ timelineClips: newTimeline });
    };

    const handleUpdateClip = (updatedClip: TimelineClip) => {
        const newTimeline = state.timelineClips.map(c => c.id === updatedClip.id ? updatedClip : c);
        setState(prevState => ({ ...prevState, timelineClips: newTimeline }));
    };

    const handleAddText = (text: { content: string; color: string }) => {
        const newOverlay: Overlay = {
            id: uuidv4(), type: 'text', content: text.content,
            startTime: state.playheadPosition, duration: 5, x: 50, y: 50, width: 30, height: 10, rotation: 0,
            fontSize: 48, color: text.color, fontFamily: 'Arial', fontWeight: 'bold', textAlign: 'center'
        };
        handleStateChangeWithHistory({ overlays: [...state.overlays, newOverlay] });
    };

    const handleAddSticker = (stickerUrl: string) => {
        const newOverlay: Overlay = {
            id: uuidv4(), type: 'image', content: stickerUrl,
            startTime: state.playheadPosition, duration: 5, x: 50, y: 50, width: 20, height: 20, rotation: 0,
        };
        handleStateChangeWithHistory({ overlays: [...state.overlays, newOverlay] });
    };
    
    const handleAddAudio = (audio: MediaFile) => {
        const newAudioClip: AudioClipping = {
            id: uuidv4(),
            source: audio,
            startTime: state.playheadPosition,
            duration: audio.duration || 10,
            startOffset: 0,
            volume: 1,
        };
        handleStateChangeWithHistory({ audioClips: [...state.audioClips, newAudioClip] });
    };
    
    const handleSaveProject = () => {
        const projectData: Omit<Project, 'id' | 'createdAt'> & { id?: string } = {
            id: project?.id,
            name: projectName,
            type: 'video',
            state
        };
        const savedProject = projectService.saveProject(projectData);
        setProject(savedProject);
        toastService.success(`Project "${projectName}" saved!`);
    };

    const handleExport = async () => {
        setIsExporting(true);
        setExportProgress(0);
        try {
            const projectToExport: Project = {
                id: project?.id || `proj_${Date.now()}`,
                name: projectName,
                type: 'video',
                state,
                createdAt: project?.createdAt || new Date().toISOString()
            };
            const result = await exportService.exportProject(projectToExport, setExportProgress);
            setExportedMedia(result);
        } catch (e) {
            if (e instanceof Error) toastService.error(e.message);
        } finally {
            setIsExporting(false);
        }
    };

    const selectedClip = state.timelineClips.find(c => c.id === selectedClipId);

    const tools = [
        { id: 'media', name: 'Media', icon: 'fa-photo-video' },
        { id: 'edit', name: 'Edit', icon: 'fa-sliders-h' },
        { id: 'text', name: 'Text', icon: 'fa-font' },
        { id: 'stickers', name: 'Stickers', icon: 'fa-sticky-note' },
        { id: 'effects', name: 'Effects', icon: 'fa-magic' },
        { id: 'audio', name: 'Audio', icon: 'fa-music' },
    ];

    const renderPanel = () => {
        switch (activeTool) {
            case 'media': return <MediaPanel onSelectMedia={handleSelectMedia} mediaType="video" />;
            case 'edit': return <VideoEditPanel selectedClip={selectedClip || null} onUpdateClip={handleUpdateClip} playheadPosition={state.playheadPosition} />;
            case 'text': return <VideoTextPanel onAddText={handleAddText} />;
            case 'stickers': return <StickersPanel onSelectSticker={handleAddSticker} />;
            case 'effects': return <EffectsPanel onSelectEffect={(filters) => selectedClip && handleUpdateClip({...selectedClip, filters})} />;
            case 'audio': return <AudioPanel onSelectAudio={handleAddAudio} />;
            default: return null;
        }
    };

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="h-full flex flex-col bg-gray-900">
                {isExporting && (
                    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center flex-col gap-4">
                        <Spinner/>
                        <p className="text-white">Exporting... {exportProgress}%</p>
                    </div>
                )}
                {exportedMedia && <ExportSuccessModal exportResult={exportedMedia} initialFileName={projectName} onClose={() => setExportedMedia(null)} />}
                
                <EditorTopBar 
                    projectName={projectName}
                    onProjectNameChange={setProjectName}
                    onBack={() => {}}
                    onSave={handleSaveProject}
                    onUndo={handleUndo}
                    onRedo={handleRedo}
                    onExport={handleExport}
                    canUndo={historyIndex > 0}
                    canRedo={historyIndex < history.length - 1}
                />
                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                    <div className="w-full md:w-20 md:h-full flex-shrink-0 order-last md:order-first">
                         <EditorToolbar tools={tools} activeTool={activeTool} onSelectTool={setActiveTool} />
                    </div>
                    <div className="flex-1 flex flex-col">
                        <div className="flex-1 bg-black flex items-center justify-center p-4">
                            <VideoPlayer
                                ref={playerRef}
                                projectState={state}
                                onPlayheadChange={(pos) => updateState({playheadPosition: pos})}
                                onClipSelected={setSelectedClipId}
                                onOverlaySelected={setSelectedOverlayId}
                            />
                        </div>
                        <div className="h-48 md:h-64 flex-shrink-0 bg-gray-800 border-t border-gray-700">
                            <Timeline
                                projectState={state}
                                onStateChange={handleStateChangeWithHistory}
                                selectedClipId={selectedClipId}
                                onSelectClip={setSelectedClipId}
                                selectedOverlayId={selectedOverlayId}
                                onSelectOverlay={setSelectedOverlayId}
                            />
                        </div>
                    </div>
                    <div className="w-full h-1/2 md:h-full md:w-80 bg-gray-800 flex-shrink-0 overflow-y-auto">
                        {renderPanel()}
                    </div>
                </div>
            </div>
        </DndProvider>
    );
};

export default VideoEditor;