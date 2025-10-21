import React from 'react';

interface Tool {
    id: string;
    name: string;
    icon: string;
}

interface EditorToolbarProps {
    tools: Tool[];
    activeTool: string;
    onSelectTool: (toolId: string) => void;
}

const EditorToolbar: React.FC<EditorToolbarProps> = ({ tools, activeTool, onSelectTool }) => {
    // This component is rendered in two places by its parents:
    // 1. A vertical container on desktop (w-20).
    // 2. A horizontal container on mobile (h-20).
    // The classes here adapt to both containers using Tailwind's responsive prefixes (md:).
    return (
        <div className="h-full w-full bg-gray-800 flex md:flex-col items-center justify-around md:justify-start md:py-4 md:gap-2">
            {tools.map(tool => (
                <button
                    key={tool.id}
                    onClick={() => onSelectTool(tool.id)}
                    // Responsive classes for the button itself
                    className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors duration-200 w-16 h-16 md:w-full md:h-auto md:py-3 ${
                        activeTool === tool.id
                            ? 'bg-purple-600/30 text-white'
                            : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'
                    }`}
                    title={tool.name}
                >
                    <i className={`fas ${tool.icon} text-xl`}></i>
                    <span className="text-xs mt-1 hidden md:block">{tool.name}</span>
                </button>
            ))}
        </div>
    );
};

export default EditorToolbar;
