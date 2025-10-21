// FIX: Implement the SlideshowMaker component to resolve build errors.
import React, { useState, useEffect, useRef } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import {
  MediaFile, PexelsPhoto, SlideshowProjectState, Project
} from '../../types';
import { useAppContext } from '../../contexts/AppContext';
import { projectService } from '../../services/projectService';
import { toastService } from '../../services/toastService';
import EditorTopBar from '../editor/EditorTopBar';
import EditorToolbar from '../editor/EditorToolbar';
import MediaPanel from '../editor/panels/MediaPanel';
import SlideshowEditPanel from '../editor/panels/SlideshowEditPanel';
import { exportService } from '../../services/exportService';
import ExportSuccessModal from '../editor/panels/ExportSuccessModal';
import Spinner from '../common/Spinner';


const FUTURISTIC_TRANSITIONS = ['transition-zoom-blur', 'transition-glitch-warp', 'transition-shutter-v', 'transition-circle-wipe', 'transition-diag-wipe', 'transition-box-in', 'transition-rgb-split', 'transition-scan-wipe'];

const SlideshowPreview: React.FC<{ items: (MediaFile | PexelsPhoto)[], slideDuration: number, transition: string }> = ({ items, slideDuration, transition }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [previousIndex, setPreviousIndex] = useState<number | null>(null);
    const [currentTransitionClass, setCurrentTransitionClass] = useState(transition);

    useEffect(() => {
        if (items.length < 2) return;
        const interval = setInterval(() => {
            setPreviousIndex(currentIndex);
            const nextIndex = (currentIndex + 1) % items.length;
            setCurrentIndex(nextIndex);

            if (transition === 'random-futuristic') {
                const randomClass = FUTURISTIC_TRANSITIONS[Math.floor(Math.random() * FUTURISTIC_TRANSITIONS.length)];
                setCurrentTransitionClass(randomClass);
            } else {
                setCurrentTransitionClass(`transition-${transition}`);
            }

        }, slideDuration * 1000);
        return () => clearInterval(interval);
    }, [items, slideDuration, transition, currentIndex]);

    if (items.length === 0) {
        return <div className="flex items-center justify-center h-full bg-black text-gray-500">Add images to start the slideshow</div>;
    }

    return (
        <div className={`w-full h-full bg-black slideshow-container ${currentTransitionClass}`}>
            {items.map((item, index) => {
                 const imageUrl = 'src' in item ? item.src.large : item.url;
                 const isActive = index === currentIndex;
                 const isPrevious = index === previousIndex;
                 const className = `slideshow-img ${isActive ? 'active' : ''} ${isPrevious ? 'previous' : ''}`;
                 return <img key={item.id} src={imageUrl} alt={'alt' in item ? item.alt : item.name} className={className} />;
            })}
        </div>
    );
};


const SlideshowMaker: React.FC = () => {
    const { projectToLoad, setProjectToLoad } = useAppContext();
    const [project, setProject] = useState<Project | null>(null);
    const [projectName, setProjectName] = useState('Untitled Slideshow');
    const [activeTool, setActiveTool] = useState('media');
    
    const [items, setItems] = useState<(MediaFile | PexelsPhoto)[]>([]);
    const [transition, setTransition] = useState('fade');
    const [slideDuration, setSlideDuration] = useState(3);

    const [isExporting, setIsExporting] = useState(false);
    const [exportedMedia, setExportedMedia] = useState<{ url: string; file: File; type: 'image' | 'video' } | null>(null);
    
    // Load project from context
    useEffect(() => {
        if (projectToLoad && projectToLoad.type === 'slideshow') {
            const state = projectToLoad.state as SlideshowProjectState;
            setProject(projectToLoad);
            setProjectName(projectToLoad.name);
            setItems(state.items);
            setTransition(state.transition);
            setSlideDuration(state.slideDuration);
            setProjectToLoad(null);
        }
    }, [projectToLoad, setProjectToLoad]);
    
    const handleSelectMedia = (media: MediaFile | PexelsPhoto) => {
        setItems(currentItems => [...currentItems, media]);
        toastService.success("Image added to slideshow.");
    };
    
    const handleSaveProject = () => {
        const state: SlideshowProjectState = { items, transition, slideDuration };
        const projectData: Omit<Project, 'id' | 'createdAt'> & { id?: string } = {
            id: project?.id,
            name: projectName,
            type: 'slideshow',
            state: state
        };
        const savedProject = projectService.saveProject(projectData);
        setProject(savedProject);
        toastService.success(`Project "${projectName}" saved!`);
    };

    const handleExport = async () => {
        if (items.length === 0) {
            toastService.error("Add some images before exporting.");
            return;
        }
        setIsExporting(true);
        try {
            const projectToExport: Project = {
                 id: project?.id || `proj_${Date.now()}`,
                 name: projectName,
                 type: 'slideshow',
                 state: { items, transition, slideDuration },
                 createdAt: project?.createdAt || new Date().toISOString(),
            };
            const result = await exportService.exportProject(projectToExport, () => {}); // progress not needed for this simple version
            setExportedMedia(result);
        } catch(e) {
            if(e instanceof Error) toastService.error(e.message);
        } finally {
            setIsExporting(false);
        }
    };

    const tools = [
        { id: 'media', name: 'Media', icon: 'fa-photo-video' },
        { id: 'settings', name: 'Settings', icon: 'fa-sliders-h' },
    ];

    const renderPanel = () => {
        switch (activeTool) {
            case 'media':
                return <MediaPanel onSelectMedia={handleSelectMedia} mediaType="photo" />;
            case 'settings':
                return <SlideshowEditPanel 
                    transition={transition} 
                    onTransitionChange={setTransition} 
                    slideDuration={slideDuration}
                    onSlideDurationChange={setSlideDuration}
                />;
            default:
                return null;
        }
    };

    return (
         <DndProvider backend={HTML5Backend}>
            <div className="h-full flex flex-col md:flex-row bg-gray-900">
                {isExporting && <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center"><Spinner/></div>}
                {exportedMedia && <ExportSuccessModal exportResult={exportedMedia} initialFileName={projectName} onClose={() => setExportedMedia(null)} />}
                
                <div className="w-full md:w-20 md:h-full flex-shrink-0 order-last md:order-first">
                    <EditorToolbar tools={tools} activeTool={activeTool} onSelectTool={setActiveTool} />
                </div>
                <div className="flex-1 flex flex-col overflow-hidden">
                    <EditorTopBar 
                        projectName={projectName}
                        onProjectNameChange={setProjectName}
                        onBack={() => {}}
                        onSave={handleSaveProject}
                        onUndo={() => {}}
                        onRedo={() => {}}
                        onExport={handleExport}
                        canUndo={false}
                        canRedo={false}
                    />
                    <div className="flex-1 flex flex-col md:flex-row bg-gray-900 overflow-hidden">
                        <div className="flex-1 flex items-center justify-center p-4 relative bg-black/50">
                           <SlideshowPreview items={items} slideDuration={slideDuration} transition={transition} />
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

export default SlideshowMaker;