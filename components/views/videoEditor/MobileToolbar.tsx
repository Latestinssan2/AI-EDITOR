
import React from 'react';

interface Tool {
    id: string;
    name: string;
    icon: string;
}

interface MobileToolbarProps {
    tools: Tool[];
    activeTool: string;
    onSelectTool: (toolId: string) => void;
}

const MobileToolbar: React.FC<MobileToolbarProps> = ({ tools, activeTool, onSelectTool }) => {
    return (
        <div className="h-20 bg-gray-800 flex items-center px-2 overflow-x-auto">
            <div className="flex space-x-2">
                {tools.map(tool => (
                    <button
                        key={tool.id}
                        onClick={() => onSelectTool(tool.id)}
                        className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors duration-200 w-20 h-16 ${
                            activeTool === tool.id
                                ? 'bg-purple-600/30 text-white'
                                : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'
                        }`}
                        title={tool.name}
                    >
                        <i className={`fas ${tool.icon} text-xl`}></i>
                        <span className="text-xs mt-1">{tool.name}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default MobileToolbar;
