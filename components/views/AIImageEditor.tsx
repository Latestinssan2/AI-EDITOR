import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import {
  MediaFile, PexelsPhoto, ImageProjectState, Project, Overlay
} from '../../types';
import { useAppContext } from '../../contexts/AppContext';
import { projectService } from '../../services/projectService';
import { toastService } from '../../services/toastService';
import { fileToBase64 } from '../../utils/fileUtils';
import { editImageWithPrompt, removeImageBackground, autoAdjustImage } from '../../services/geminiService';
import { v4 as uuidv4 } from 'uuid';
import EditorTopBar from '../editor/EditorTopBar';
import EditorToolbar from '../editor/EditorToolbar';
import MediaPanel from '../editor/panels/MediaPanel';
import AdjustPanel from '../editor/panels/AdjustPanel';
import AIPanel from '../editor/panels/AIPanel';
import TextPanel from '../editor/panels/TextPanel';
import StickersPanel from '../editor/panels/StickersPanel';
import TemplatesPanel from '../editor/panels/TemplatesPanel';
import CropPanel from '../editor/panels/CropPanel';
import TransformableOverlay from '../editor/TransformableOverlay';
import CropOverlay from '../editor/CropOverlay';
import ExportSuccessModal from '../editor/panels/ExportSuccessModal';
import { exportService } from '../../services/exportService';
import Spinner from '../common/Spinner';

const defaultFilters = {
    brightness: 1, contrast: 1, saturate: 1, 'hue-rotate': 0, blur: 0, sepia: 0, grayscale: 0
};

const AIImageEditor: React.FC = () => {
    const { projectToLoad, setProjectToLoad, aiMode } = useAppContext();
    const [project, setProject] = useState<Project | null>(null);
    const [projectName, setProjectName] = useState('Untitled Image');
    const [media, setMedia] = useState<MediaFile | PexelsPhoto | null>(null);
    const [filters, setFilters] = useState<Record<string, number>>(defaultFilters);
    const [overlays, setOverlays] = useState<Overlay[]>([]);
    const [selectedOverlayId, setSelectedOverlayId] = useState<string | null>(null);
    const [activeTool, setActiveTool] = useState('media');
    
    const [history, setHistory] = useState<Partial<ImageProjectState>[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    const [isCropping, setIsCropping] = useState(false);
    const [cropRect, setCropRect] = useState({ x: 0, y: 0, width: 100, height: 100 });
    const [cropAspectRatio, setCropAspectRatio] = useState('free');

    const [isExporting, setIsExporting] = useState(false);
    const [exportedMedia, setExportedMedia] = useState<{ url: string; file: File; type: 'image' | 'video' } | null>(null);

    const imageRef = useRef<HTMLImageElement>(null);
    const canvasContainerRef = useRef<HTMLDivElement>(null);
    
    const addToHistory = useCallback((newState: Partial<ImageProjectState>) => {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newState);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    }, [history, historyIndex]);

    const updateState = (updates: Partial<ImageProjectState>) => {
        if (updates.filters) setFilters(updates.filters);
        if (updates.overlays) setOverlays(updates.overlays);
        if (updates.media) setMedia(updates.media);
    };

    const handleUndo = () => {
        if (historyIndex > 0) {
            const prevState = history[historyIndex - 1];
            updateState(prevState);
            setHistoryIndex(historyIndex - 1);
        }
    };

    const handleRedo = () => {
        if (historyIndex < history.length - 1) {
            const nextState = history[historyIndex + 1];
            updateState(nextState);
            setHistoryIndex(historyIndex + 1);
        }
    };
    
    useEffect(() => {
        if (projectToLoad && projectToLoad.type === 'photo') {
            const state = projectToLoad.state as ImageProjectState;
            setProject(projectToLoad);
            setProjectName(projectToLoad.name);
            setMedia(state.media);
            setFilters(state.filters || defaultFilters);
            setOverlays(state.overlays || []);
            const initialState = { media: state.media, filters: state.filters || defaultFilters, overlays: state.overlays || [] };
            setHistory([initialState]);
            setHistoryIndex(0);
            setProjectToLoad(null);
        }
    }, [projectToLoad, setProjectToLoad]);
    
    const handleSelectMedia = (selectedMedia: MediaFile | PexelsPhoto) => {
        setMedia(selectedMedia);
        setFilters(defaultFilters);
        setOverlays([]);
        const initialState = { media: selectedMedia, filters: defaultFilters, overlays: [] };
        setHistory([initialState]);
        setHistoryIndex(0);
        setActiveTool('adjust');
    };

    const handleFilterChange = (filter: string, value: number) => {
        setFilters(prev => ({...prev, [filter]: value}));
    };

    const handleFilterChangeEnd = () => {
        addToHistory({ filters });
    };

    const handleSaveProject = () => {
        if (!media) {
            toastService.error("Please add an image to save the project.");
            return;
        }
        const state: ImageProjectState = { media, filters, overlays };
        const projectData: Omit<Project, 'id' | 'createdAt'> & { id?: string } = {
            id: project?.id, name: projectName, type: 'photo', state
        };
        const savedProject = projectService.saveProject(projectData);
        setProject(savedProject);
        toastService.success(`Project "${projectName}" saved!`);
    };

    const handleExport = async () => {
        if (!media) {
            toastService.error("Please add an image to export.");
            return;
        }
        setIsExporting(true);
        try {
            const projectToExport: Project = {
                id: project?.id || `proj_${Date.now()}`,
                name: projectName,
                type: 'photo',
                state: { media, filters, overlays },
                createdAt: project?.createdAt || new Date().toISOString()
            };
            const result = await exportService.exportProject(projectToExport, () => {});
            setExportedMedia(result);
        } catch (e) {
            if (e instanceof Error) toastService.error(e.message);
        } finally {
            setIsExporting(false);
        }
    };
    
    const handleAIAction = async (prompt: string) => {
        if (aiMode === 'Device') { toastService.error("Cloud AI mode needed."); return; }
        if (!media) { toastService.error("Please add an image first."); return; }

        try {
            const file = 'file' in media ? media.file : await (await fetch(media.src.original)).blob();
            const base64Image = await fileToBase64(new File([file], "image"));
            const mimeType = file.type || 'image/jpeg';
            
            const newBase64Image = await editImageWithPrompt(base64Image, mimeType, prompt);
            
            const newFile = new File([await(await fetch(`data:image/png;base64,${newBase64Image}`)).blob()], "ai-edited.png", {type: 'image/png'});
            handleSelectMedia({ id: uuidv4(), name: 'AI Edited Image', url: URL.createObjectURL(newFile), type: 'image', file: newFile });

        } catch(e) {
            if (e instanceof Error) toastService.error(e.message);
        }
    };
    
    const handleBackgroundAction = async (action: 'remove' | 'change', prompt?: string) => {
         if (aiMode === 'Device') { toastService.error("Cloud AI mode needed."); return; }
        if (!media) { toastService.error("Please add an image first."); return; }

        try {
            const file = 'file' in media ? media.file : await (await fetch(media.src.original)).blob();
            const base64Image = await fileToBase64(new File([file], "image"));
            const mimeType = file.type || 'image/jpeg';
            
            const newBase64Image = prompt 
                ? await editImageWithPrompt(base64Image, mimeType, `Change the background to: ${prompt}. Keep the foreground subject.`)
                : await removeImageBackground(base64Image, mimeType);
            
            const newFile = new File([await(await fetch(`data:image/png;base64,${newBase64Image}`)).blob()], "bg-edited.png", {type: 'image/png'});
            handleSelectMedia({ id: uuidv4(), name: 'Background Edited Image', url: URL.createObjectURL(newFile), type: 'image', file: newFile });
        } catch(e) {
            if (e instanceof Error) toastService.error(e.message);
        }
    };
    
    const handleAutoAdjust = async () => {
         if (aiMode === 'Device') { toastService.error("Cloud AI mode needed."); return; }
        if (!media) { toastService.error("Please add an image first."); return; }

         try {
            const file = 'file' in media ? media.file : await (await fetch(media.src.original)).blob();
            const base64Image = await fileToBase64(new File([file], "image"));
            const mimeType = file.type || 'image/jpeg';
            const adjustments = await autoAdjustImage(base64Image, mimeType);
            const newFilters = { ...filters, ...adjustments };
            setFilters(newFilters);
            addToHistory({ filters: newFilters });
            toastService.success("Auto adjustments applied!");
         } catch(e) {
             if (e instanceof Error) toastService.error(e.message);
         }
    }
    
    const handleAddText = (text: { content: string; color: string }) => {
        const newOverlay: Overlay = {
            id: uuidv4(), type: 'text', content: text.content,
            startTime: 0, duration: 999, x: 50, y: 50, width: 30, height: 10, rotation: 0,
            fontSize: 48, color: text.color, fontFamily: 'Arial', fontWeight: 'bold', textAlign: 'center'
        };
        const newOverlays = [...overlays, newOverlay];
        setOverlays(newOverlays);
        addToHistory({ overlays: newOverlays });
    };

    const handleAddSticker = (stickerUrl: string) => {
        const newOverlay: Overlay = {
            id: uuidv4(), type: 'image', content: stickerUrl,
            startTime: 0, duration: 999, x: 50, y: 50, width: 20, height: 20, rotation: 0
        };
        const newOverlays = [...overlays, newOverlay];
        setOverlays(newOverlays);
        addToHistory({ overlays: newOverlays });
    };

    const handleUpdateOverlay = (updatedOverlay: Overlay) => {
        const newOverlays = overlays.map(o => o.id === updatedOverlay.id ? updatedOverlay : o);
        setOverlays(newOverlays);
        addToHistory({ overlays: newOverlays });
    };

    const handleDeleteOverlay = (id: string) => {
        const newOverlays = overlays.filter(o => o.id !== id);
        setOverlays(newOverlays);
        addToHistory({ overlays: newOverlays });
    };

    const tools = [
        { id: 'media', name: 'Media', icon: 'fa-photo-video' },
        { id: 'templates', name: 'Templates', icon: 'fa-layer-group' },
        { id: 'adjust', name: 'Adjust', icon: 'fa-sliders-h' },
        { id: 'ai', name: 'AI Edit', icon: 'fa-wand-magic-sparkles' },
        { id: 'crop', name: 'Crop', icon: 'fa-crop-alt' },
        { id: 'text', name: 'Text', icon: 'fa-font' },
        { id: 'stickers', name: 'Stickers', icon: 'fa-sticky-note' },
    ];
    
    // FIX: Move state setters out of render logic and into a dedicated event handler
    // to prevent "Invalid hook call" error (React #301).
    const handleSelectTool = (toolId: string) => {
        setActiveTool(toolId);
        setIsCropping(toolId === 'crop');
    };

    const renderPanel = () => {
        switch (activeTool) {
            case 'media': return <MediaPanel onSelectMedia={handleSelectMedia} mediaType="photo" />;
            case 'templates': return <TemplatesPanel onSelectTemplate={(f) => { setFilters(f); addToHistory({filters: f}); }} />;
            case 'adjust': return <AdjustPanel filters={filters} onFilterChange={handleFilterChange} onAutoAdjust={handleAutoAdjust} />;
            case 'ai': return <AIPanel onPrompt={handleAIAction} onBackgroundAction={handleBackgroundAction} />;
            case 'crop': return <CropPanel aspectRatio={cropAspectRatio} onAspectRatioChange={setCropAspectRatio} onApply={() => setIsCropping(false)} onReset={() => {}} />;
            case 'text': return <TextPanel onAddText={handleAddText} />;
            case 'stickers': return <StickersPanel onSelectSticker={handleAddSticker} />;
            default: return null;
        }
    };
    
    const filterStyle = {
        filter: Object.entries(filters)
            .map(([key, value]) => {
                if(key === 'hue-rotate') return `${key}(${value}deg)`;
                if(key === 'blur') return `${key}(${value}px)`;
                return `${key}(${value})`;
            }).join(' ')
    };

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="h-full flex flex-col md:flex-row bg-gray-900">
                {isExporting && <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center"><Spinner/></div>}
                {exportedMedia && <ExportSuccessModal exportResult={exportedMedia} initialFileName={projectName} onClose={() => setExportedMedia(null)} />}
                
                <div className="w-full md:w-20 md:h-full flex-shrink-0 order-last md:order-first">
                    <EditorToolbar tools={tools} activeTool={activeTool} onSelectTool={handleSelectTool} />
                </div>
                <div className="flex-1 flex flex-col overflow-hidden">
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
                    <div className="flex-1 flex flex-col md:flex-row bg-gray-900 overflow-hidden">
                        <div ref={canvasContainerRef} className="flex-1 flex items-center justify-center p-4 relative bg-black/50 overflow-hidden" onClick={() => setSelectedOverlayId(null)}>
                            {!media ? <p className="text-gray-500">Select an image from the Media panel to begin</p> : (
                                <div className="relative" style={{...filterStyle}}>
                                    <img 
                                        ref={imageRef} 
                                        src={'src' in media ? media.src.large : media.url}
                                        alt={'alt' in media ? media.alt : media.name || 'Selected media'}
                                        className="max-w-full max-h-full object-contain"
                                        style={{ maxHeight: 'calc(100vh - 150px)' }}
                                    />
                                    {isCropping && canvasContainerRef.current && imageRef.current && (
                                        <CropOverlay 
                                            rect={cropRect}
                                            onRectChange={setCropRect}
                                            canvasWidth={imageRef.current.clientWidth}
                                            canvasHeight={imageRef.current.clientHeight}
                                            aspectRatio={cropAspectRatio}
                                        />
                                    )}
                                    {overlays.map(overlay => (
                                        <TransformableOverlay
                                            key={overlay.id}
                                            overlay={overlay}
                                            onUpdate={handleUpdateOverlay}
                                            isSelected={selectedOverlayId === overlay.id}
                                            onSelect={() => setSelectedOverlayId(overlay.id)}
                                            onDelete={() => handleDeleteOverlay(overlay.id)}
                                            canvasWidth={imageRef.current?.clientWidth || 0}
                                            canvasHeight={imageRef.current?.clientHeight || 0}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="w-full md:w-80 bg-gray-800 flex-shrink-0 overflow-y-auto">
                            {renderPanel()}
                        </div>
                    </div>
                </div>
            </div>
        </DndProvider>
    );
};

export default AIImageEditor;