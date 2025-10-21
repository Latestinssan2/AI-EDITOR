import React, { useState, useEffect } from 'react';
import { stickerService } from '../../../services/stickerService';

interface StickersPanelProps {
    onSelectSticker: (stickerUrl: string) => void;
}

const StickersPanel: React.FC<StickersPanelProps> = ({ onSelectSticker }) => {
    const [categories, setCategories] = useState<string[]>([]);
    const [stickers, setStickers] = useState<string[]>([]);
    const [activeCategory, setActiveCategory] = useState('');

    useEffect(() => {
        const cats = stickerService.getCategories();
        setCategories(cats);
        if (cats.length > 0) {
            setActiveCategory(cats[0]);
        }
    }, []);

    useEffect(() => {
        if (activeCategory) {
            setStickers(stickerService.getStickers(activeCategory));
        }
    }, [activeCategory]);

    return (
        <div className="p-2 flex flex-col h-full">
            <h3 className="text-md font-semibold text-gray-200 mb-2 px-2">Stickers</h3>
            <div className="flex-shrink-0 mb-2 overflow-x-auto">
                <div className="flex gap-2 p-1">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-3 py-1 text-sm rounded-full whitespace-nowrap ${activeCategory === cat ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>
            <div className="flex-grow overflow-y-auto pr-1">
                <div className="grid grid-cols-3 gap-2">
                    {stickers.map((stickerUrl, index) => (
                        <div key={index} onClick={() => onSelectSticker(stickerUrl)} className="aspect-square bg-gray-700/50 rounded-lg p-2 cursor-pointer hover:bg-gray-600">
                            <img src={stickerUrl} alt={`Sticker ${index}`} className="w-full h-full object-contain" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default StickersPanel;
