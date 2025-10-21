import React from 'react';
import { SpeedRampPoint } from '../../../types';

interface SpeedRampEditorProps {
    points: SpeedRampPoint[] | undefined;
    onUpdate: (points: SpeedRampPoint[]) => void;
}

const defaultPoints: SpeedRampPoint[] = [
    { time: 0, speed: 1 },
    { time: 1, speed: 1 },
];

const SpeedRampEditor: React.FC<SpeedRampEditorProps> = ({ points, onUpdate }) => {
    const rampPoints = points && points.length > 0 ? points : defaultPoints;

    // A simple UI for now. A graphical editor would be much better.
    const handleSpeedChange = (index: number, newSpeed: number) => {
        const newPoints = [...rampPoints];
        newPoints[index].speed = Math.max(0.1, newSpeed);
        onUpdate(newPoints);
    };
    
    return (
        <div className="p-4">
            <h3 className="text-sm font-semibold text-gray-300 mb-2">Speed Ramping</h3>
            <p className="text-xs text-gray-500 mb-4">Adjust speed at different points in the clip. A graphical editor is coming soon!</p>
            <div className="space-y-3">
                {rampPoints.map((point, index) => (
                    <div key={index} className="flex items-center gap-4">
                        <span className="text-sm text-gray-400 w-20">Point {index + 1}</span>
                        <input
                            type="range"
                            min="0.1"
                            max="4"
                            step="0.1"
                            value={point.speed}
                            onChange={(e) => handleSpeedChange(index, parseFloat(e.target.value))}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer range-thumb-purple"
                        />
                        <span className="text-sm font-semibold text-white w-10 text-right">{point.speed.toFixed(1)}x</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SpeedRampEditor;
