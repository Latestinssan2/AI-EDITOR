import React, { useState, useCallback, useEffect, useRef } from 'react';
import { pexelsService } from '../../services/pexelsService';
import { toastService } from '../../services/toastService';
import { PexelsPhoto, MediaFile, SlideshowTemplate, SlideshowProjectState } from '../../types';
import { mediaLibraryService } from '../../services/mediaLibraryService';
import { slideshowTemplateService } from '../../services/slideshowTemplateService';
import Spinner from '../common/Spinner';
import { useAppContext } from '../../contexts/AppContext';
import { projectService } from '../../services/projectService';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

const TRANSITIONS = [
    { id: 'fade', name: 'Fade' },
    { id: 'slide', name: 'Slide' },
    { id: 'wipe', name: 'Wipe' },
    { id: 'glitch', name: 'Glitch' },
    { id: 'zoom-in', name: 'Zoom In' },
    { id: 'zoom-out', name: 'Zoom Out' },
    { id: 'ken-burns', name: 'Ken Burns' },
];

const getImageUrl = (item: PexelsPhoto | MediaFile, size: 'large' | 'tiny' = 'large'): string => {
    if ('src' in item) {
        return size === 'large' ? item.src.large : item.src.tiny;
    }
    return item.url;
};

const ModeButton: React.FC<{ icon: string; label: string; isActive: boolean; onClick: () => void; }> = ({ icon, label, isActive, onClick }) => (
    <button onClick={onClick} className={`py-2 flex flex-col items-center gap-1 text-xs rounded-lg transition-colors ${isActive ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
        <i className={`fas ${icon} text-lg`}></i>
        <span>{label}</span>
    </button>
);

const MediaPanel: React.FC<{onSelect: (item: PexelsPhoto | MediaFile) => void, onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void, myMedia: MediaFile[], stockPhotos: PexelsPhoto[], isSearching: boolean, search: {val: string, set: (s:string) => void, submit: (e:React.FormEvent) => void} }> = ({onSelect, onUpload, myMedia, stockPhotos, isSearching, search}) => {
    const [activeTab, setActiveTab] = useState<'stock' | 'my-media'>('stock');
    return (
        <div className="h-full flex flex-col p-4 bg-gray-800">
            <div className="flex border-b border-gray-700 mb-3">
                 <button onClick={() => setActiveTab('stock')} className={`py-2 px-4 text-sm font-medium ${activeTab === 'stock' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400'}`}>Stock</button>
                 <button onClick={() => setActiveTab('my-media')} className={`py-2 px-4 text-sm font-medium ${activeTab === 'my-media' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400'}`}>My Media</button>
            </div>
             {activeTab === 'stock' && ( <div className="flex flex-col flex-grow overflow-hidden"> <form onSubmit={search.submit} className="flex gap-2 mb-3"> <input type="text" value={search.val} onChange={(e) => search.set(e.target.value)} placeholder="Search Pexels..." className="flex-grow bg-gray-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500" /> <button type="submit" className="bg-purple-600 px-3 rounded-md hover:bg-purple-700"><i className="fas fa-search"></i></button> </form> <div className="flex-grow overflow-y-auto pr-2"> {isSearching ? <div className="flex items-center justify-center h-full"><Spinner /></div> : <div className="grid grid-cols-2 gap-2">{stockPhotos.map(photo => <div key={photo.id} onClick={() => onSelect(photo)} className="relative aspect-square bg-black rounded-lg overflow-hidden group cursor-pointer"><img src={photo.src.medium} alt={photo.alt} className="w-full h-full object-cover" /></div>)}</div>} </div> </div> )}
            {activeTab === 'my-media' && ( <div className="flex flex-col flex-grow overflow-hidden"> <label className="w-full text-center py-2 px-4 mb-3 bg-purple-600 text-white font-semibold rounded-lg cursor-pointer hover:bg-purple-700"> <i className="fas fa-upload mr-2"></i> Upload Images <input type="file" accept="image/*" multiple className="hidden" onChange={onUpload} /> </label> <div className="flex-grow overflow-y-auto pr-2"> <div className="grid grid-cols-2 gap-2"> {myMedia.filter(f => f.type === 'image').map(media => <div key={media.id} onClick={() => onSelect(media)} className="relative aspect-square bg-black rounded-lg overflow-hidden group cursor-pointer"><img src={media.url} alt={media.name} className="w-full h-full object-cover" /></div>)} </div> </div> </div> )}
        </div>
    );
};


const SlideshowMaker: React.FC = () => {
    const { projectToLoad, setProjectToLoad } = useAppContext();
    const [searchQuery, setSearchQuery] = useState('landscapes');
    const [photos, setPhotos] = useState<PexelsPhoto[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [myMediaFiles, setMyMediaFiles] = useState<MediaFile[]>([]);
    const [slideshowItems, setSlideshowItems] = useState<(PexelsPhoto | MediaFile)[]>([]);
    
    // Player State
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(0);
    const [previousSlide, setPreviousSlide] = useState(-1);
    const [activeTransition, setActiveTransition] = useState(TRANSITIONS[0].id);
    const [slideDuration, setSlideDuration] = useState(3);
    const [musicUrl, setMusicUrl] = useState<string | null>(null);
    const [showMusicModal, setShowMusicModal] = useState(false);
    const audioRef = useRef<HTMLAudioElement>(null);
    const timerRef = useRef<number | null>(null);

    const [mobilePanel, setMobilePanel] = useState<'media' | 'effects' | null>(null);

    useEffect(() => {
        const subscription = mediaLibraryService.subscribe(setMyMediaFiles);
        return () => subscription.unsubscribe();
    }, []);
    
    const performSearch = useCallback(async (query: string) => { if (!query.trim()) return; setIsSearching(true); try { const results = await pexelsService.searchPhotos(query); setPhotos(results); } catch (error) { if (error instanceof Error) toastService.error(error.message); } finally { setIsSearching(false); } }, []);
    useEffect(() => { performSearch(searchQuery); }, []);

    const handleSearchSubmit = (e: React.FormEvent) => { e.preventDefault(); performSearch(searchQuery); };

    const handleAddToSlideshow = (item: PexelsPhoto | MediaFile) => {
        setSlideshowItems(prev => [...prev, item]);
        toastService.info(`Added image to slideshow.`);
        setMobilePanel(null);
    };
    
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files) { await mediaLibraryService.addFiles(Array.from(e.target.files)); toastService.success(`${e.target.files.length} file(s) added to My Media.`); } };

    const handleSaveProject = () => { /* ... existing save logic ... */ };
    const playNextSlide = useCallback(() => { setPreviousSlide(currentSlide); setCurrentSlide(prev => (prev + 1) % slideshowItems.length); }, [currentSlide, slideshowItems.length]);

    useEffect(() => {
        if (isPlaying && slideshowItems.length > 1) { timerRef.current = window.setTimeout(playNextSlide, slideDuration * 1000); }
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [isPlaying, currentSlide, slideshowItems, playNextSlide, slideDuration]);

    useEffect(() => {
        const audio = audioRef.current; if (!audio) return;
        if (isPlaying) audio.play().catch(console.error); else audio.pause();
    }, [isPlaying]);

    const togglePlay = () => setIsPlaying(p => !p);
    const selectMusic = (file: MediaFile) => { setMusicUrl(file.url); setShowMusicModal(false); toastService.success(`Music "${file.name}" added.`); }
    
    const handleMusicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            await mediaLibraryService.addFiles([file]);
            const allMedia = mediaLibraryService['mediaFiles']; 
            const newFile = allMedia.find(f => f.file === file);
            if (newFile) {
                selectMusic(newFile);
            }
        }
    };

    return (
      <DndProvider backend={HTML5Backend}>
        <div className="h-full flex flex-col overflow-hidden">
             <audio ref={audioRef} src={musicUrl || ''} loop />
            {showMusicModal && ( <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center" onClick={() => setShowMusicModal(false)}> <div className="bg-gray-800 rounded-lg p-4 w-11/12 max-w-lg" onClick={e => e.stopPropagation()}> <h3 className="text-white font-bold mb-4">Add Music</h3>
                <label className="w-full text-center py-3 px-4 mb-3 bg-purple-600 text-white font-semibold rounded-lg cursor-pointer hover:bg-purple-700 block">
                    <i className="fas fa-upload mr-2"></i> Upload New Music
                    <input type="file" accept="audio/*" className="hidden" onChange={handleMusicUpload} />
                </label>
                <h4 className="text-gray-400 text-sm my-2 text-center">Or select from My Media</h4>
            <div className="max-h-80 overflow-y-auto space-y-2"> {myMediaFiles.filter(f => f.type === 'audio').length > 0 ? myMediaFiles.filter(f => f.type === 'audio').map(f => ( <div key={f.id} onClick={() => selectMusic(f)} className="p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-purple-600 flex justify-between items-center"> <p className="text-white">{f.name}</p> <i className="fas fa-play text-white"></i> </div> )) : <p className="text-center text-gray-500 py-4">No audio files in My Media.</p>} </div> </div> </div> )}
            
            <div className="flex-grow flex relative overflow-hidden">
                <div className={`
                    absolute md:relative inset-y-0 left-0 z-30 transform transition-transform duration-300 ease-in-out
                    bg-gray-900 w-full sm:w-80 md:w-80 flex-shrink-0 flex flex-col
                    ${mobilePanel === 'media' ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                `}>
                    <button onClick={() => setMobilePanel(null)} className="md:hidden absolute top-2 right-2 w-8 h-8 bg-gray-700 text-white rounded-full z-40"><i className="fas fa-times"></i></button>
                    <MediaPanel onSelect={handleAddToSlideshow} onUpload={handleFileUpload} myMedia={myMediaFiles} stockPhotos={photos} isSearching={isSearching} search={{val: searchQuery, set: setSearchQuery, submit: handleSearchSubmit}} />
                </div>

                <div className="flex-grow bg-black/30 flex flex-col p-2 md:p-4 overflow-hidden">
                    <div className={`flex-grow bg-black flex items-center justify-center mb-4 rounded-lg relative slideshow-container transition-${activeTransition}`}>
                        {slideshowItems.length > 0 ? (
                            <>
                                {slideshowItems.map((item, index) => ( <img key={('id' in item) ? item.id : index} src={getImageUrl(item)} className={`slideshow-img ${index === currentSlide ? 'active' : ''} ${index === previousSlide ? 'previous' : ''}`} alt="" /> ))}
                                <div className="absolute inset-0 bg-black/10 z-10 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                    <button onClick={togglePlay} className="w-20 h-20 bg-purple-600/50 rounded-full text-white text-3xl"> <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'}`}></i> </button>
                                </div>
                            </>
                        ) : ( <div className="text-center text-gray-500"> <i className="fas fa-photo-video text-6xl mb-4"></i> <p>Add images to begin your slideshow</p> </div> )}
                    </div>
                    
                    <div className="h-48 bg-gray-800 rounded-lg p-2 flex flex-col flex-shrink-0">
                         <div className="flex-grow h-full flex items-center space-x-2 overflow-x-auto mb-2">
                            {slideshowItems.map((item, index) => ( <div key={('id' in item) ? item.id : index} onClick={() => setCurrentSlide(index)} className={`h-16 md:h-24 aspect-video rounded-md flex-shrink-0 bg-black overflow-hidden cursor-pointer ring-2 ${index === currentSlide ? 'ring-purple-500' : 'ring-transparent'}`}> <img src={getImageUrl(item, 'tiny')} className="w-full h-full object-cover" /> </div> ))}
                        </div>
                        <div className="hidden md:flex items-center gap-4 border-t border-gray-700 pt-2">
                            <div>
                                <label className="text-xs text-gray-400">Transition</label>
                                <select value={activeTransition} onChange={e => setActiveTransition(e.target.value)} className="w-full bg-gray-700 rounded-md px-3 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"> {TRANSITIONS.map(t => <option key={t.id} value={t.id}>{t.name}</option>)} </select>
                            </div>
                             <div>
                                <label className="text-xs text-gray-400">Duration (s)</label>
                                <input type="number" min="1" max="10" value={slideDuration} onChange={e => setSlideDuration(Number(e.target.value))} className="w-20 bg-gray-700 rounded-md px-3 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
                            </div>
                            <button onClick={() => setShowMusicModal(true)} className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg text-sm hover:bg-green-700 flex-shrink-0"> <i className="fas fa-music mr-2"></i>Add Music </button>
                            <button onClick={handleSaveProject} className="ml-auto px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg text-sm hover:bg-blue-700 disabled:bg-gray-600" disabled={slideshowItems.length === 0}> Save Project </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="md:hidden flex flex-col flex-shrink-0">
                {mobilePanel === 'effects' && (
                    <div className="p-4 bg-gray-800 border-t border-gray-700 grid grid-cols-2 gap-4">
                        <div>
                           <label className="block text-white text-sm mb-2">Transition Effect</label>
                           <select value={activeTransition} onChange={e => setActiveTransition(e.target.value)} className="w-full bg-gray-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500">
                               {TRANSITIONS.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                           </select>
                        </div>
                        <div>
                           <label className="block text-white text-sm mb-2">Duration (s)</label>
                           <input type="number" min="1" max="10" value={slideDuration} onChange={e => setSlideDuration(Number(e.target.value))} className="w-full bg-gray-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
                        </div>
                    </div>
                )}
                <div className="grid grid-cols-4 gap-1 p-2 bg-gray-900">
                    <ModeButton icon="fa-photo-video" label="Media" isActive={mobilePanel === 'media'} onClick={() => setMobilePanel(p => p === 'media' ? null : 'media')} />
                    <ModeButton icon="fa-magic" label="Effects" isActive={mobilePanel === 'effects'} onClick={() => setMobilePanel(p => p === 'effects' ? null : 'effects')} />
                    <ModeButton icon="fa-music" label="Music" isActive={false} onClick={() => setShowMusicModal(true)} />
                    <ModeButton icon="fa-save" label="Save" isActive={false} onClick={handleSaveProject} />
                </div>
            </div>
        </div>
      </DndProvider>
    );
};

export default SlideshowMaker;