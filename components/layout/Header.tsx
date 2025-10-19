import React from 'react';
import { useAppContext } from '../../contexts/AppContext';
import { View } from '../../types';

interface HeaderProps {
    activeView: View;
    setActiveView: (view: View) => void;
}

const MobileNavItem: React.FC<{ icon: string; isActive: boolean; onClick: () => void }> = ({ icon, isActive, onClick }) => (
    <button onClick={onClick} className={`flex flex-col items-center justify-center w-full pt-2 pb-1 transition-colors duration-200 ${isActive ? 'text-purple-400' : 'text-gray-400 hover:text-white'}`}>
        <i className={`fas ${icon} text-xl`}></i>
    </button>
);

const Header: React.FC<HeaderProps> = ({ activeView, setActiveView }) => {
    const { user, logout, aiMode, setAiMode } = useAppContext();

    const handleModeToggle = () => {
        setAiMode(aiMode === 'Device' ? 'Cloud AI' : 'Device');
    };

    return (
        <header className="flex-shrink-0 bg-gray-800/80 backdrop-blur-sm border-t border-gray-700/50 md:border-t-0 md:border-b h-16 flex items-center
                           fixed bottom-0 w-full z-40
                           md:relative md:z-auto md:px-6">
            {/* Desktop Header */}
            <div className="hidden md:flex w-full items-center justify-between">
                <h1 className="text-xl font-semibold text-white">Project Untitled</h1>
                <div className="flex items-center space-x-6">
                    {/* AI Mode Toggle */}
                    <div className="flex items-center space-x-2">
                        <span className={`text-sm font-medium ${aiMode === 'Device' ? 'text-purple-400' : 'text-gray-400'}`}>Device</span>
                        <label htmlFor="ai-toggle" className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" id="ai-toggle" className="sr-only peer" checked={aiMode === 'Cloud AI'} onChange={handleModeToggle} />
                            <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-purple-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                        </label>
                        <span className={`text-sm font-medium ${aiMode === 'Cloud AI' ? 'text-purple-400' : 'text-gray-400'}`}>Cloud AI</span>
                    </div>

                    {/* User Menu */}
                    <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-full bg-purple-500 flex items-center justify-center font-bold text-white">
                            {user?.email[0].toUpperCase()}
                        </div>
                        <div className="text-sm">
                            <div className="font-semibold text-white">{user?.email}</div>
                        </div>
                        <button onClick={logout} className="text-gray-400 hover:text-white transition-colors" title="Sign Out">
                            <i className="fas fa-sign-out-alt text-lg"></i>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Bottom Nav */}
            <nav className="grid grid-cols-7 md:hidden w-full items-center justify-around">
                <MobileNavItem icon="fa-video" isActive={activeView === 'video'} onClick={() => setActiveView('video')} />
                <MobileNavItem icon="fa-wand-magic-sparkles" isActive={activeView === 'photo'} onClick={() => setActiveView('photo')} />
                <MobileNavItem icon="fa-images" isActive={activeView === 'slideshow'} onClick={() => setActiveView('slideshow')} />
                <MobileNavItem icon="fa-robot" isActive={activeView === 'aiforge'} onClick={() => setActiveView('aiforge')} />
                <MobileNavItem icon="fa-layer-group" isActive={activeView === 'templates'} onClick={() => setActiveView('templates')} />
                <MobileNavItem icon="fa-folder" isActive={activeView === 'files'} onClick={() => setActiveView('files')} />
                <MobileNavItem icon="fa-cog" isActive={activeView === 'settings'} onClick={() => setActiveView('settings')} />
            </nav>
        </header>
    );
};

export default Header;