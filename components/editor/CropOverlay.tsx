import React, { useRef, useCallback } from 'react';

interface Rect { x: number; y: number; width: number; height: number; }
type Handle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw' | 'move';

interface CropOverlayProps {
    rect: Rect;
    onRectChange: (rect: Rect) => void;
    canvasWidth: number;
    canvasHeight: number;
    aspectRatio: string; // 'free', '1:1', '16:9' etc.
}

const CropOverlay: React.FC<CropOverlayProps> = ({ rect, onRectChange, canvasWidth, canvasHeight, aspectRatio }) => {
    const dragInfo = useRef<{ handle: Handle; startRect: Rect; startPos: { x: number; y: number } } | null>(null);

    const getAspectRatioValue = () => {
        if (aspectRatio === 'free' || !aspectRatio) return null;
        const [w, h] = aspectRatio.split(':').map(Number);
        return w / h;
    };

    const handleMouseUp = useCallback(() => {
        dragInfo.current = null;
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('touchmove', handleMouseMove);
        window.removeEventListener('touchend', handleMouseUp);
    }, []);

    const handleMouseMove = useCallback((e: MouseEvent | TouchEvent) => {
        if (!dragInfo.current) return;
        
        e.preventDefault();

        const pos = 'touches' in e ? e.touches[0] : e;
        const dx = pos.clientX - dragInfo.current.startPos.x;
        const dy = pos.clientY - dragInfo.current.startPos.y;

        let { x, y, width, height } = dragInfo.current.startRect;
        const handle = dragInfo.current.handle;
        const ratio = getAspectRatioValue();

        // Handle movement
        if (handle === 'move') {
            x += dx;
            y += dy;
        }

        // Handle resizing
        if (handle.includes('n')) { const newHeight = height - dy; if (newHeight > 20) { height = newHeight; y += dy; } }
        if (handle.includes('s')) { height += dy; }
        if (handle.includes('w')) { const newWidth = width - dx; if (newWidth > 20) { width = newWidth; x += dx; } }
        if (handle.includes('e')) { width += dx; }

        // Enforce aspect ratio
        if (ratio && handle !== 'move') {
             if (handle.includes('n') || handle.includes('s')) {
                width = height * ratio;
            } else {
                height = width / ratio;
            }
        }

        // Constrain to canvas bounds
        if (width < 20) width = 20;
        if (height < 20) height = 20;
        if (x < 0) { x = 0; }
        if (y < 0) { y = 0; }
        if (x + width > canvasWidth) { width = canvasWidth - x; }
        if (y + height > canvasHeight) { height = canvasHeight - y; }

        onRectChange({ x, y, width, height });
    }, [onRectChange, canvasWidth, canvasHeight, aspectRatio]);


    const handleMouseDown = useCallback((e: React.MouseEvent | React.TouchEvent, handle: Handle) => {
        e.stopPropagation();
        e.preventDefault();
        
        const pos = 'touches' in e ? e.nativeEvent.touches[0] : e.nativeEvent;
        dragInfo.current = {
            handle,
            startRect: rect,
            startPos: { x: pos.clientX, y: pos.clientY },
        };
        
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        window.addEventListener('touchmove', handleMouseMove, { passive: false });
        window.addEventListener('touchend', handleMouseUp);
    }, [rect, handleMouseMove, handleMouseUp]);

    const handleDefs: { id: Handle, cursor: string, pos: string }[] = [
        { id: 'n', cursor: 'ns-resize', pos: 'top-0 left-1/2 -translate-x-1/2 h-2 w-full' },
        { id: 's', cursor: 'ns-resize', pos: 'bottom-0 left-1/2 -translate-x-1/2 h-2 w-full' },
        { id: 'w', cursor: 'ew-resize', pos: 'left-0 top-1/2 -translate-y-1/2 w-2 h-full' },
        { id: 'e', cursor: 'ew-resize', pos: 'right-0 top-1/2 -translate-y-1/2 w-2 h-full' },
        { id: 'nw', cursor: 'nwse-resize', pos: 'top-0 left-0 h-4 w-4 rounded-full' },
        { id: 'ne', cursor: 'nesw-resize', pos: 'top-0 right-0 h-4 w-4 rounded-full' },
        { id: 'sw', cursor: 'nesw-resize', pos: 'bottom-0 left-0 h-4 w-4 rounded-full' },
        { id: 'se', cursor: 'nwse-resize', pos: 'bottom-0 right-0 h-4 w-4 rounded-full' },
    ];

    return (
        <div className="absolute inset-0 z-10 pointer-events-none">
            {/* Dimmer overlay */}
            <div className="absolute inset-0 bg-black/60" style={{ clipPath: `path(evenodd, "M0 0 H${canvasWidth} V${canvasHeight} H0 Z M${rect.x} ${rect.y} H${rect.x + rect.width} V${rect.y + rect.height} H${rect.x} Z")` }}></div>
            
            {/* Crop box */}
            <div
                className="absolute border-2 border-dashed border-white pointer-events-auto cursor-move"
                style={{ left: rect.x, top: rect.y, width: rect.width, height: rect.height }}
                onMouseDown={(e) => handleMouseDown(e, 'move')}
                onTouchStart={(e) => handleMouseDown(e, 'move')}
            >
                {/* Grid lines */}
                <div className="absolute top-1/3 bottom-1/3 left-0 right-0 border-y border-white/40"></div>
                <div className="absolute left-1/3 right-1/3 top-0 bottom-0 border-x border-white/40"></div>

                {/* Handles */}
                {handleDefs.map(h => (
                    <div
                        key={h.id}
                        className={`absolute pointer-events-auto ${h.pos}`}
                        style={{ cursor: h.cursor }}
                        onMouseDown={(e) => handleMouseDown(e, h.id)}
                        onTouchStart={(e) => handleMouseDown(e, h.id)}
                    >
                         {h.id.length === 2 && <div className="absolute inset-1/4 bg-white rounded-full"></div>}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CropOverlay;