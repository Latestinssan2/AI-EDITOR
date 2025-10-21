import React, { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { VideoProjectState, TimelineClip, Overlay } from '../../../types';
import TransformableOverlay from '../../editor/TransformableOverlay';

interface VideoPlayerProps {
    projectState: VideoProjectState;
    onPlayheadChange: (position: number) => void;
    onClipSelected: (id: string | null) => void;
    onOverlaySelected: (id: string | null) => void;
}

const VideoPlayer = forwardRef((props: VideoPlayerProps, ref) => {
    const { projectState, onPlayheadChange, onClipSelected, onOverlaySelected } = props;
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    // FIX: Initialize useRef with null to provide a valid initial value.
    const animationFrameId = useRef<number | null>(null);
    const videoElements = useRef<Map<string, HTMLVideoElement>>(new Map());
    
    // Using refs to hold state for animation loop to avoid stale closures
    const playheadRef = useRef(projectState.playheadPosition);
    const projectStateRef = useRef(projectState);
    projectStateRef.current = projectState;

    useImperativeHandle(ref, () => ({
        seek(time: number) {
            playheadRef.current = time;
            onPlayheadChange(time);
            drawFrame(time);
        }
    }));

    useEffect(() => {
        playheadRef.current = projectState.playheadPosition;
        drawFrame(projectState.playheadPosition);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectState.playheadPosition]);
    
    // Preload videos
    useEffect(() => {
        projectState.timelineClips.forEach(clip => {
            if (clip.source && !videoElements.current.has(clip.source.url)) {
                const video = document.createElement('video');
                video.muted = true;
                video.crossOrigin = 'anonymous';
                video.src = clip.source.url;
                videoElements.current.set(clip.source.url, video);
            }
        });
    }, [projectState.timelineClips]);
    
    const applyCanvasFilters = (ctx: CanvasRenderingContext2D, filters: Record<string, number> | undefined) => {
        let filterString = '';
        if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
                if (key === 'hue-rotate') filterString += `hue-rotate(${value}deg) `;
                else if (key === 'blur') filterString += `blur(${value}px) `;
                else filterString += `${key}(${value}) `;
            });
        }
        ctx.filter = filterString.trim();
    };

    const drawFrame = async (time: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        let cumulativeTime = 0;
        for (const clip of projectStateRef.current.timelineClips) {
            const clipStartTime = cumulativeTime;
            const clipEndTime = clipStartTime + clip.duration;

            if (time >= clipStartTime && time < clipEndTime) {
                if (clip.source) {
                    const video = videoElements.current.get(clip.source.url);
                    if (video) {
                        const timeInClip = time - clipStartTime + clip.startOffset;
                        
                        if (Math.abs(video.currentTime - timeInClip) > 0.1) {
                            video.currentTime = timeInClip;
                            await new Promise((resolve) => {
                                video.onseeked = () => resolve(true);
                            });
                        }
                        
                        applyCanvasFilters(ctx, clip.filters);
                        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                        ctx.filter = 'none'; // Reset for overlays
                    }
                } else if (clip.isPlaceholder) {
                     ctx.fillStyle = '#333';
                     ctx.fillRect(0, 0, canvas.width, canvas.height);
                     ctx.fillStyle = 'white';
                     ctx.textAlign = 'center';
                     ctx.font = '24px sans-serif';
                     ctx.fillText(clip.placeholderText || 'Placeholder', canvas.width / 2, canvas.height / 2);
                }
                break;
            }
            cumulativeTime += clip.duration;
        }
    };
    
    const animationLoop = (lastTime: number) => {
        const now = performance.now();
        const deltaTime = (now - lastTime) / 1000;

        playheadRef.current += deltaTime;

        if (playheadRef.current >= projectStateRef.current.duration) {
            playheadRef.current = projectStateRef.current.duration;
            setIsPlaying(false);
        }
        
        onPlayheadChange(playheadRef.current);
        drawFrame(playheadRef.current);

        if (isPlaying) {
             animationFrameId.current = requestAnimationFrame(() => animationLoop(now));
        }
    };

    useEffect(() => {
        if (isPlaying) {
            animationFrameId.current = requestAnimationFrame(() => animationLoop(performance.now()));
        } else {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        }
        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isPlaying]);

    const handlePlayPause = () => {
        if (playheadRef.current >= projectState.duration) {
            playheadRef.current = 0;
        }
        setIsPlaying(!isPlaying);
    };

    const activeOverlays = projectState.overlays.filter(o => 
        projectState.playheadPosition >= o.startTime && projectState.playheadPosition < o.startTime + o.duration
    );

    return (
        <div className="relative w-full aspect-video bg-black">
            <canvas ref={canvasRef} width={1280} height={720} className="w-full h-full" />
            <div className="absolute inset-0">
                {activeOverlays.map(overlay => (
                    <TransformableOverlay
                        key={overlay.id}
                        overlay={overlay}
                        onUpdate={(o) => {}}
                        isSelected={false} // Selection handled in editor
                        onSelect={() => onOverlaySelected(overlay.id)}
                        onDelete={() => {}}
                        canvasWidth={canvasRef.current?.clientWidth || 0}
                        canvasHeight={canvasRef.current?.clientHeight || 0}
                    />
                ))}
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/50 to-transparent flex items-center px-4">
                <button onClick={handlePlayPause} className="text-white text-2xl w-10 h-10">
                    <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'}`}></i>
                </button>
            </div>
        </div>
    );
});

export default VideoPlayer;