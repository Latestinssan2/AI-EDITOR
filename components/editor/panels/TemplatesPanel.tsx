import React, { useState, useEffect } from 'react';
import { imageTemplateService, ImageTemplate } from '../../../services/imageTemplateService';
import { toastService } from '../../../services/toastService';


interface TemplatesPanelProps {
    onSelectTemplate: (filters: Record<string, number>) => void;
}

const TemplatesPanel: React.FC<TemplatesPanelProps> = ({ onSelectTemplate }) => {
    const [templates, setTemplates] = useState<ImageTemplate[]>([]);

    useEffect(() => {
        setTemplates(imageTemplateService.getTemplates());
    }, []);

    const handleSelect = (template: ImageTemplate) => {
        onSelectTemplate(template.filters);
        toastService.info(`Applied "${template.name}" template.`);
    };

    return (
        <div className="p-4">
            <h3 className="text-md font-semibold text-gray-200 mb-4">Image Templates</h3>
            <div className="grid grid-cols-2 gap-4">
                {templates.map(template => (
                    <div key={template.id} onClick={() => handleSelect(template)} className="cursor-pointer group">
                        <div className="aspect-square bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                            <img src={template.thumbnail} alt={template.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                        </div>
                        <p className="text-sm text-center mt-2 text-gray-300">{template.name}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TemplatesPanel;
