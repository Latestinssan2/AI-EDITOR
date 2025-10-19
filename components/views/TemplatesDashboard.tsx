import React from 'react';
import { toastService } from '../../services/toastService';
import { useAppContext } from '../../contexts/AppContext';
import { templateService } from '../../services/templateService';

const templates = [
    { name: "Successfully Mission Failed", description: "Sharp contrast, Glitch effect, Clown sticker.", icon: "🤡", themeColor: "bg-red-500" },
    { name: "Bro's Aura After", description: "Golden/Cinematic glow, GigaChad silhouette.", icon: "💪", themeColor: "bg-yellow-500" },
    { name: "Moye Moye Realization", description: "Desaturated, dramatic font, tear-drop sticker.", icon: "😢", themeColor: "bg-gray-500" },
    { name: "Dramatic Fail Freeze", description: "Bold Red/White, 'Wasted' overlay.", icon: "💥", themeColor: "bg-red-700" },
    { name: "Emotional Damage", description: "Grayscale, red text, HP bar graphic.", icon: "💔", themeColor: "bg-rose-800" },
    { name: "Critical Strike", description: "High contrast, comic burst, intense shake.", icon: "👊", themeColor: "bg-orange-500" }
];

const TemplateCard: React.FC<{template: typeof templates[0], onClick: () => void}> = ({ template, onClick }) => {
    return (
        <div onClick={onClick} className="bg-gray-800 rounded-lg p-4 flex flex-col items-center justify-center text-center group hover:bg-gray-700 transition-colors cursor-pointer aspect-square">
            <div className={`w-20 h-20 ${template.themeColor} rounded-full flex items-center justify-center text-4xl mb-4 transition-transform group-hover:scale-110`}>
                {template.icon}
            </div>
            <h3 className="font-bold text-white mb-1">{template.name}</h3>
            <p className="text-xs text-gray-400">{template.description}</p>
        </div>
    );
};


const TemplatesDashboard: React.FC = () => {
    const { setProjectToLoad } = useAppContext();
    const { setActiveView } = (window as any)._appContextForFiles || {};

    const handleTemplateSelect = (templateName: string) => {
        try {
            const templateProject = templateService.getTemplate(templateName);
            setProjectToLoad(templateProject);
            if (setActiveView) {
                setActiveView('video');
                toastService.success(`Template "${templateName}" loaded!`);
            } else {
                toastService.error("Could not switch to video editor.");
            }
        } catch (error) {
            if (error instanceof Error) {
                toastService.error(error.message);
            }
        }
    };

    return (
        <div className="p-4 md:p-8 h-full">
            <h1 className="text-3xl font-bold text-white mb-6">AI Shorts Templates</h1>
            <p className="text-gray-400 mb-8 max-w-2xl">
                Kickstart your creation with one-click templates inspired by the latest trends. Just select a template and add your clip!
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                {templates.map(template => (
                    <TemplateCard 
                        key={template.name} 
                        template={template} 
                        onClick={() => handleTemplateSelect(template.name)}
                    />
                ))}
                 <div className="bg-gray-800/50 border-2 border-dashed border-gray-700 rounded-lg p-4 flex flex-col items-center justify-center text-center text-gray-500 group hover:border-purple-500 transition-colors cursor-pointer aspect-square">
                    <i className="fas fa-plus text-4xl mb-4"></i>
                    <h3 className="font-bold text-gray-400">More Coming Soon</h3>
                </div>
            </div>
        </div>
    );
};

export default TemplatesDashboard;