import React, { useState } from 'react';
import { toastService } from '../../../services/toastService';

interface ExportResult {
    url: string;
    file: File;
    type: 'video' | 'image';
}

interface ExportSuccessModalProps {
    exportResult: ExportResult;
    initialFileName: string;
    onClose: () => void;
}

const ExportSuccessModal: React.FC<ExportSuccessModalProps> = ({ exportResult, initialFileName, onClose }) => {
    const [fileName, setFileName] = useState(initialFileName);
    const [author, setAuthor] = useState('Gemini Genesis User');
    const canShare = navigator.share && exportResult.file;

    const handleShare = async () => {
        if (!canShare) {
            toastService.error("Sharing is not supported on this browser.");
            return;
        }
        try {
            await navigator.share({
                files: [exportResult.file],
                title: fileName,
                text: `Check out this creation I made with Gemini Genesis! By ${author}.`,
            });
            toastService.success("Shared successfully!");
        } catch (error) {
            if (error instanceof Error && error.name !== 'AbortError') {
                 toastService.error(`Sharing failed: ${error.message}`);
            }
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full text-center shadow-2xl animate-fade-in-right">
                <div className="text-green-400 text-5xl mb-4">
                    <i className="fas fa-check-circle"></i>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Export Successful!</h2>
                <p className="text-gray-400 mb-6">Your file is ready. You can now download or share it.</p>
                
                {/* Preview */}
                <div className="mb-6 rounded-lg overflow-hidden bg-black max-h-48 flex items-center justify-center">
                    {exportResult.type === 'video' ? (
                        <video src={exportResult.url} controls className="max-w-full max-h-48"></video>
                    ) : (
                        <img src={exportResult.url} alt="Exported content" className="max-w-full max-h-48 object-contain"/>
                    )}
                </div>

                {/* Metadata */}
                <div className="space-y-4 text-left mb-6">
                    <div>
                        <label className="text-sm font-medium text-gray-300">File Name</label>
                        <input type="text" value={fileName} onChange={e => setFileName(e.target.value)} className="w-full bg-gray-700 rounded-md p-2 mt-1 text-sm"/>
                    </div>
                     <div>
                        <label className="text-sm font-medium text-gray-300">Author</label>
                        <input type="text" value={author} onChange={e => setAuthor(e.target.value)} className="w-full bg-gray-700 rounded-md p-2 mt-1 text-sm"/>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <a
                        href={exportResult.url}
                        download={fileName}
                        className="flex items-center justify-center w-full py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700"
                    >
                        <i className="fas fa-download mr-2"></i> Download
                    </a>
                    {canShare && (
                        <button
                            onClick={handleShare}
                            className="flex items-center justify-center w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
                        >
                           <i className="fas fa-share-alt mr-2"></i> Share
                        </button>
                    )}
                </div>
                <button
                    onClick={onClose}
                    className="w-full mt-4 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-500"
                >
                    Close
                </button>
            </div>
        </div>
    );
};

export default ExportSuccessModal;
