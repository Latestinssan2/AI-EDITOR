
export interface ImageTemplate {
    id: string;
    name: string;
    filters: Record<string, number>;
    thumbnail: string; // URL to a thumbnail image
}

const templates: ImageTemplate[] = [
    {
        id: 'vintage',
        name: 'Vintage',
        filters: { sepia: 0.6, saturate: 1.4, contrast: 0.9, brightness: 1 },
        thumbnail: 'https://via.placeholder.com/150/8d6e63/ffffff?text=Vintage'
    },
    {
        id: 'noir',
        name: 'Noir',
        filters: { grayscale: 1, contrast: 1.5, brightness: 0.9 },
        thumbnail: 'https://via.placeholder.com/150/212121/ffffff?text=Noir'
    },
    {
        id: 'cinematic',
        name: 'Cinematic',
        filters: { contrast: 1.2, saturate: 1.2, brightness: 1 },
        thumbnail: 'https://via.placeholder.com/150/303f9f/ffffff?text=Cinematic'
    },
    {
        id: 'dreamy',
        name: 'Dreamy',
        filters: { blur: 1, brightness: 1.1, saturate: 1.3 },
        thumbnail: 'https://via.placeholder.com/150/f06292/ffffff?text=Dreamy'
    }
];


class ImageTemplateService {
    getTemplates(): ImageTemplate[] {
        return templates;
    }
}

export const imageTemplateService = new ImageTemplateService();
