
import React, { useRef, useCallback, useEffect } from 'react';
import { Overlay } from '../../types';

interface TransformableOverlayProps {
    overlay: Overlay;
    onUpdate: (overlay: Overlay) => void;
    isSelected: boolean;
    onSelect: () => void;
    onDelete: () => void;
    canvasWidth: number;
    canvasHeight: number;
}

const TransformableOverlay: React.FC<TransformableOverlayProps> = ({
    overlay, onUpdate, isSelected, onSelect, onDelete, canvasWidth, canvasHeight
}) => {
    const ref = useRef<HTMLDivElement>(null);
    const dragInfo = useRef<{
        action: 'move' | 'resize' | 'rotate';
        startPos: { x: number; y: number };
        startOverlay: Overlay;
        handle?: string;
        center?: { x: number, y: number };
        startAngle?: number;
    } | null>(null);

    const handleMouseUp = useCallback(() => {
        dragInfo.current = null;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    }, []);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!dragInfo.current || !ref.current) return;
        
        const { action, startPos, startOverlay, handle, center, startAngle } = dragInfo.current;
        const dx = e.clientX - startPos.x;
        const dy = e.clientY - startPos.y;

        let newOverlay = { ...startOverlay };
        
        const scaleX = canvasWidth / 100;
        const scaleY = canvasHeight / 100;

        if (action === 'move') {
            newOverlay.x = startOverlay.x + (dx / scaleX);
            newOverlay.y = startOverlay.y + (dy / scaleY);
        } else if (action === 'rotate' && center && startAngle !== undefined) {
            const angle = Math.atan2(e.clientY - center.y, e.clientX - center.x);
            newOverlay.rotation = startAngle + (angle * 180 / Math.PI);
        } else if (action === 'resize' && handle) {
            // This is a simplified resize logic. A more robust solution would account for rotation.
            const newWidth = startOverlay.width + (dx / scaleX);
            const newHeight = startOverlay.height + (dy / scaleY);
            if (newWidth > 5) newOverlay.width = newWidth;
            if (newHeight > 5) newOverlay.height = newHeight;
        }

        onUpdate(newOverlay);
    }, [onUpdate, canvasWidth, canvasHeight, handleMouseUp]);


    const handleMouseDown = useCallback((e: React.MouseEvent, action: 'move' | 'resize' | 'rotate', handle?: string) => {
        e.stopPropagation();
        onSelect();
        
        const rect = ref.current?.getBoundingClientRect();
        const center = rect ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : undefined;
        const startAngle = center ? Math.atan2(e.clientY - center.y, e.clientX - center.x) - (overlay.rotation * Math.PI / 180) : undefined;
        
        dragInfo.current = {
            action,
            startPos: { x: e.clientX, y: e.clientY },
            startOverlay: overlay,
            handle,
            center,
            startAngle,
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }, [overlay, onSelect, handleMouseMove, handleMouseUp]);

    const scaleX = canvasWidth / 100;
    const scaleY = canvasHeight / 100;

    const styles: React.CSSProperties = {
        position: 'absolute',
        left: `${overlay.x}%`,
        top: `${overlay.y}%`,
        width: `${overlay.width}%`,
        height: `${overlay.height}%`,
        transform: `translate(-50%, -50%) rotate(${overlay.rotation}deg)`,
        cursor: 'move',
        border: isSelected ? '2px dashed #a855f7' : 'none',
        boxSizing: 'border-box',
    };

    const renderContent = () => {
        if (overlay.type === 'text') {
            return (
                <div style={{ 
                    color: overlay.color, 
                    fontSize: `${overlay.fontSize}px`, 
                    fontFamily: overlay.fontFamily,
                    fontWeight: overlay.fontWeight as any,
                    textAlign: overlay.textAlign,
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    {overlay.content}
                </div>
            );
        }
        return <img src={overlay.content} alt="overlay" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />;
    };
    
    return (
        <div ref={ref} style={styles} onMouseDown={(e) => handleMouseDown(e, 'move')}>
            {renderContent()}
            {isSelected && (
                <>
                    {/* Resize Handle */}
                    <div
                        onMouseDown={(e) => handleMouseDown(e, 'resize', 'se')}
                        className="absolute -bottom-2 -right-2 w-4 h-4 bg-purple-500 rounded-full cursor-se-resize"
                    />
                    {/* Rotate Handle */}
                    <div
                        onMouseDown={(e) => handleMouseDown(e, 'rotate')}
                        className="absolute -top-6 left-1/2 -translate-x-1/2 w-4 h-4 bg-purple-500 rounded-full cursor-alias"
                    />
                    <button
                        onClick={onDelete}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                    >
                        &times;
                    </button>
                </>
            )}
        </div>
    );
};

export default TransformableOverlay;
