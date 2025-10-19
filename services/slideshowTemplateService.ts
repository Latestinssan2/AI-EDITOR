import { SlideshowTemplate, PexelsPhoto, MediaFile } from '../types';

const TEMPLATES_KEY = 'genesis_v8_slideshow_templates';

class SlideshowTemplateService {
    
    getTemplates(): SlideshowTemplate[] {
        const templatesJson = localStorage.getItem(TEMPLATES_KEY);
        if (!templatesJson) {
            return [];
        }
        try {
            const templates = JSON.parse(templatesJson) as SlideshowTemplate[];
            // Ensure dates are parsed correctly
            return templates.map(t => ({...t, createdAt: new Date(t.createdAt).toISOString() })).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        } catch (e) {
            console.error("Failed to parse slideshow templates:", e);
            return [];
        }
    }

    saveTemplate(name: string, items: (PexelsPhoto | MediaFile)[]): SlideshowTemplate {
        const templates = this.getTemplates();
        const newTemplate: SlideshowTemplate = {
            id: `template_${Date.now()}`,
            name,
            items,
            createdAt: new Date().toISOString()
        };
        templates.push(newTemplate);
        localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
        return newTemplate;
    }

    deleteTemplate(id: string): void {
        let templates = this.getTemplates();
        templates = templates.filter(t => t.id !== id);
        localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
    }
}

export const slideshowTemplateService = new SlideshowTemplateService();