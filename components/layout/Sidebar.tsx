import React from 'react';
import { View } from '../../types';

interface SidebarProps {
    activeView: View;
    setActiveView: (view: View) => void;
}

interface NavItemProps {
    icon: string;
    label: string;
    isActive: boolean;
    onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
            isActive
                ? 'bg-purple-600/30 text-white'
                : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'
        }`}
    >
        <i className={`fas ${icon} w-6 text-center text-lg`}></i>
        <span className="ml-4">{label}</span>
    </button>
);

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView }) => {
    const navItems: { view: View; icon: string; label: string }[] = [
        { view: 'video', icon: 'fa-video', label: 'Video Editor' },
        { view: 'photo', icon: 'fa-wand-magic-sparkles', label: 'AI Image Editor' },
        { view: 'slideshow', icon: 'fa-images', label: 'Slideshow Maker' },
        { view: 'aiforge', icon: 'fa-robot', label: 'AI Forge' },
        { view: 'templates', icon: 'fa-layer-group', label: 'Templates' },
        { view: 'files', icon: 'fa-folder', label: 'My Files' },
        { view: 'settings', icon: 'fa-cog', label: 'Settings' },
    ];

    return (
        <aside className="hidden md:flex flex-col w-64 bg-gray-800 border-r border-gray-700/50 flex-shrink-0">
            <div className="flex items-center justify-center h-16 border-b border-gray-700/50">
                <img src="https://ponsrischool.in/wp-content/uploads/2025/10/Screenshot-2025-10-17-221109-e1760719346143_imgupscaler.ai_v1Fast_2K-1.png" alt="Logo" className="h-10" />
                <h1 className="text-xl font-bold text-white ml-2">Genesis</h1>
            </div>
            <nav className="flex-1 p-4 space-y-2">
                {navItems.map(item => (
                    <NavItem
                        key={item.view}
                        icon={item.icon}
                        label={item.label}
                        isActive={activeView === item.view}
                        onClick={() => setActiveView(item.view)}
                    />
                ))}
            </nav>
            <div className="p-4 border-t border-gray-700/50">
                <p className="text-xs text-gray-500 text-center">Gemini Genesis V8</p>
                <p className="text-xs text-gray-500 text-center">&copy; {new Date().getFullYear()}</p>
            </div>
        </aside>
    );
};

export default Sidebar;