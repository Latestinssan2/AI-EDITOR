import React from 'react';

interface EditorTopBarProps {
    projectName: string;
    onProjectNameChange: (newName: string) => void;
    onBack: () => void;
    onSave: () => void;
    onUndo: () => void;
    onRedo: () => void;
    onExport: () => void;
    canUndo: boolean;
    canRedo: boolean;
}

const EditorTopBar: React.FC<EditorTopBarProps> = ({
    projectName,
    onProjectNameChange,
    onBack,
    onSave,
    onUndo,
    onRedo,
    onExport,
    canUndo,
    canRedo
}) => {
    return (
        <div className="h-16 bg-gray-800 flex-shrink-0 flex items-center justify-between px-2 md:px-4 border-b border-gray-700 w-full z-20">
            <div className="flex items-center gap-2 md:gap-4">
                <button onClick={onBack} className="w-10 h-10 flex items-center justify-center text-gray-300 hover:bg-gray-700 rounded-full transition-colors">
                    <i className="fas fa-arrow-left text-lg"></i>
                </button>
                <input
                    type="text"
                    value={projectName}
                    onChange={(e) => onProjectNameChange(e.target.value)}
                    className="bg-transparent text-white font-semibold text-md md:text-lg focus:outline-none focus:ring-1 focus:ring-purple-500 rounded-md px-2 py-1 w-32 md:w-auto"
                />
            </div>

            <div className="flex items-center gap-1 md:gap-4">
                <button onClick={onSave} title="Save Project" className="hidden md:block px-4 py-2 text-sm bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600">
                    Save
                </button>
                <div className="flex items-center gap-1 md:gap-2">
                     <button onClick={onUndo} disabled={!canUndo} title="Undo" className="w-9 h-9 flex items-center justify-center text-gray-300 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed transition-colors">
                        <i className="fas fa-undo text-lg"></i>
                    </button>
                    <button onClick={onRedo} disabled={!canRedo} title="Redo" className="w-9 h-9 flex items-center justify-center text-gray-300 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed transition-colors">
                        <i className="fas fa-redo text-lg"></i>
                    </button>
                </div>
                 <button onClick={onExport} className="px-4 md:px-5 py-2 text-sm bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700">
                    Export
                </button>
            </div>
        </div>
    );
};

export default EditorTopBar;
