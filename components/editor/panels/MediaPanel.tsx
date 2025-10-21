import React, { useState, useEffect, useCallback } from 'react';
import { pexelsService } from '../../../services/pexelsService';
import { mediaLibraryService } from '../../../services/mediaLibraryService';
import { toastService } from '../../../services/toastService';
import { PexelsPhoto, PexelsVideo, MediaFile } from '../../../types';
import Spinner from '../../common/Spinner';

interface MediaPanelProps {
    onSelectMedia: (media: PexelsPhoto | PexelsVideo | MediaFile) => void;
    mediaType: 'photo' | 'video';
}

const MediaPanel: React.FC<MediaPanelProps> = ({ onSelectMedia, mediaType }) => {
    const [activeTab, setActiveTab] = useState<'stock' | 'my-media'>('stock');
    const [searchQuery, setSearchQuery] = useState('futuristic');
    const [stockMedia, setStockMedia] = useState<(PexelsPhoto | PexelsVideo)[]>([]);
    const [myMedia, setMyMedia] = useState<MediaFile[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => {
        const sub = mediaLibraryService.subscribe(setMyMedia);
        return () => sub.unsubscribe();
    }, []);

    const performSearch = useCallback(async (query: string) => {
        if (!query.trim()) return;
        setIsSearching(true);
        try {
            if (mediaType === 'photo') {
                const results = await pexelsService.searchPhotos(query, 30);
                setStockMedia(results);
            } else {
                const results = await pexelsService.searchVideos(query, 30);
                setStockMedia(results);
            }
        } catch (e) {
            if (e instanceof Error) toastService.error(e.message);
        } finally {
            setIsSearching(false);
        }
    }, [mediaType]);

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
            if (e.target.files.length > 0) {
                setActiveTab('my-media');
            }
        }
    };
    
    const getThumbnailUrl = (item: PexelsPhoto | PexelsVideo | MediaFile): string => {
        if ('src' in item) return item.src.tiny; // PexelsPhoto
        if ('image' in item) return item.image; // PexelsVideo
        if (item.type === 'video') return ''; // Need a way to generate thumbnails for user videos, return empty for now.
        return item.url; // MediaFile (image or audio)
    };
    
    const mediaFilter = (f: MediaFile) => {
        if (mediaType === 'photo') return f.type === 'image';
        if (mediaType === 'video') return f.type === 'video';
        return false;
    }

    return (
        <div className="h-full flex flex-col">
            <div className="flex-shrink-0 p-2">
                <div className="flex bg-gray-900 rounded-md p-1">
                    <button onClick={() => setActiveTab('stock')} className={`w-1/2 py-1 text-sm rounded ${activeTab === 'stock' ? 'bg-purple-600 text-white' : 'text-gray-300'}`}>Stock Media</button>
                    <button onClick={() => setActiveTab('my-media')} className={`w-1/2 py-1 text-sm rounded ${activeTab === 'my-media' ? 'bg-purple-600 text-white' : 'text-gray-300'}`}>My Media</button>
                </div>
            </div>

            {activeTab === 'stock' && (
                <div className="flex flex-col flex-grow overflow-hidden p-2">
                    <form onSubmit={handleSearchSubmit} className="flex gap-2 mb-2 flex-shrink-0">
                        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={`Search for ${mediaType}s...`} className="flex-grow bg-gray-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500" />
                        <button type="submit" className="bg-purple-600 px-3 rounded-md hover:bg-purple-700"><i className="fas fa-search"></i></button>
                    </form>
                    <div className="flex-grow overflow-y-auto pr-1">
                        {isSearching ? <div className="flex items-center justify-center h-full"><Spinner /></div> : (
                            <div className="grid grid-cols-2 gap-2">
                                {stockMedia.map(item => (
                                    <div key={item.id} onClick={() => onSelectMedia(item)} className="relative aspect-video bg-black rounded-md overflow-hidden group cursor-pointer">
                                        <img src={getThumbnailUrl(item)} alt={'alt' in item ? item.alt : 'video'} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors"></div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'my-media' && (
                <div className="flex flex-col flex-grow overflow-hidden p-2">
                    <label className="w-full text-center py-2 px-4 mb-2 bg-purple-600 text-white font-semibold rounded-lg cursor-pointer hover:bg-purple-700 flex-shrink-0">
                        <i className="fas fa-upload mr-2"></i> Upload
                        <input type="file" accept={`${mediaType}/*`} multiple className="hidden" onChange={handleFileUpload} />
                    </label>
                    <div className="flex-grow overflow-y-auto pr-1">
                        {myMedia.filter(mediaFilter).length === 0 ? (
                            <div className="text-center text-gray-500 pt-10">
                                <p>No {mediaType}s in your media.</p>
                                <p className="text-sm">Click Upload to add some!</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-2">
                                {myMedia.filter(mediaFilter).map(media => (
                                    <div key={media.id} onClick={() => onSelectMedia(media)} className={`relative aspect-video ${media.type === 'video' ? 'bg-gray-900' : 'bg-black'} rounded-md overflow-hidden group cursor-pointer flex items-center justify-center`}>
                                        <img src={getThumbnailUrl(media)} alt={media.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-end p-1">
                                            <p className="text-white text-xs truncate">{media.name}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MediaPanel;