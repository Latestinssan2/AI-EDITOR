import React, { useState, useEffect } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import VideoEditor from '../views/VideoEditor';
import AIImageEditor from '../views/AIImageEditor';
import SlideshowMaker from '../views/SlideshowMaker';
import AIForge from '../views/AIForge';
import TemplatesDashboard from '../views/TemplatesDashboard';
import Files from '../views/Files';
import Settings from '../views/Settings';
import { useAppContext } from '../../contexts/AppContext';
import { View } from '../../types';

const MainLayout: React.FC = () => {
    const { projectToLoad } = useAppContext();
    const [activeView, setActiveView] = useState<View>('video');

    // This effect allows the 'Files' component to change the view when a project is loaded
    useEffect(() => {
        if (projectToLoad) {
            setActiveView(projectToLoad.type);
        }
    }, [projectToLoad]);

    // Hacky way to provide setActiveView to the Files component without prop drilling through everything
    // In a larger app, a more robust routing or state management solution would be better.
    (window as any)._appContextForFiles = { setActiveView };

    const renderView = () => {
        switch (activeView) {
            case 'video': return <VideoEditor />;
            case 'photo': return <AIImageEditor />;
            case 'slideshow': return <SlideshowMaker />;
            case 'aiforge': return <AIForge />;
            case 'templates': return <TemplatesDashboard />;
            case 'files': return <Files />;
            case 'settings': return <Settings />;
            default: return <VideoEditor />;
        }
    };

    return (
        <div className="flex h-screen bg-gray-900 text-gray-200">
            <Sidebar activeView={activeView} setActiveView={setActiveView} />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header activeView={activeView} setActiveView={setActiveView} />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-900 pb-16 md:pb-0">
                    {renderView()}
                </main>
            </div>
        </div>
    );
};

export default MainLayout;