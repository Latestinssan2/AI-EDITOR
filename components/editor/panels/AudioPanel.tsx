import React, { useState, useEffect } from 'react';
import { mediaLibraryService } from '../../../services/mediaLibraryService';
import { MediaFile } from '../../../types';
import { toastService } from '../../../services/toastService';

interface AudioPanelProps {
    onSelectAudio: (media: MediaFile) => void;
}

const AudioPanel: React.FC<AudioPanelProps> = ({ onSelectAudio }) => {
    const [myMedia, setMyMedia] = useState<MediaFile[]>([]);

    useEffect(() => {
        const sub = mediaLibraryService.subscribe(setMyMedia);
        return () => sub.unsubscribe();
    }, []);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            // FIX: Use spread syntax for better type inference on FileList and filter for audio files.
            const allFiles = [...e.target.files];
            const audioFiles = allFiles.filter(f => f.type.startsWith('audio/'));
            if (audioFiles.length > 0) {
                await mediaLibraryService.addFiles(audioFiles);
                toastService.success(`${audioFiles.length} audio file(s) added to My Media.`);
            }
            if (allFiles.length > audioFiles.length) {
                toastService.info('Some non-audio files were ignored.');
            }
        }
    };

    const audioFiles = myMedia.filter(f => f.type === 'audio');

    return (
        <div className="p-4 h-full flex flex-col">
            <h3 className="text-md font-semibold text-gray-200 mb-4">Audio Library</h3>
            <label className="w-full text-center py-2 px-4 mb-4 bg-purple-600 text-white font-semibold rounded-lg cursor-pointer hover:bg-purple-700 flex-shrink-0">
                <i className="fas fa-upload mr-2"></i> Upload Audio
                <input type="file" accept="audio/*" multiple className="hidden" onChange={handleFileUpload} />
            </label>
            <div className="flex-grow overflow-y-auto pr-1 space-y-2">
                {audioFiles.length === 0 ? (
                    <div className="text-center text-gray-500 pt-10">
                        <p>No audio in your library.</p>
                        <p className="text-sm">Upload some background music or sound effects.</p>
                    </div>
                ) : (
                    audioFiles.map(media => (
                        <div
                            key={media.id}
                            onClick={() => onSelectAudio(media)}
                            className="p-2 bg-gray-700 rounded-lg flex items-center justify-between cursor-pointer hover:bg-gray-600"
                        >
                            <div>
                                <p className="font-semibold text-sm truncate">{media.name}</p>
                                <p className="text-xs text-gray-400">{(media.duration || 0).toFixed(1)}s</p>
                            </div>
                            <i className="fas fa-plus"></i>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default AudioPanel;
