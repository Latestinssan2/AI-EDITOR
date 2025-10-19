import { PexelsVideo, PexelsPhoto } from '../types';
import { errorHandler } from './errorHandler';

const API_KEY = 'ALQfrXOA5n87kQQ5AtlXwn0mHeqnX53LC9VViR3h5MT07G8HY491WI5J';
const VIDEO_BASE_URL = 'https://api.pexels.com/videos';
const PHOTO_BASE_URL = 'https://api.pexels.com/v1';


interface PexelsVideoSearchResponse {
    videos: PexelsVideo[];
    page: number;
    per_page: number;
    total_results: number;
    next_page: string;
}

interface PexelsPhotoSearchResponse {
    photos: PexelsPhoto[];
    page: number;
    per_page: number;
    total_results: number;
    next_page: string;
}

export const pexelsService = {
    searchVideos: async (query: string, perPage: number = 15): Promise<PexelsVideo[]> => {
        if (!query.trim()) {
            return [];
        }
        
        const url = `${VIDEO_BASE_URL}/search?query=${encodeURIComponent(query)}&per_page=${perPage}`;

        try {
            const response = await fetch(url, {
                headers: {
                    Authorization: API_KEY,
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Pexels API Error: ${errorData.error || response.statusText}`);
            }

            const data: PexelsVideoSearchResponse = await response.json();
            return data.videos;
        } catch (error) {
            const friendlyMessage = errorHandler.handle(error, 'PexelsService');
            throw new Error(friendlyMessage);
        }
    },

    searchPhotos: async (query: string, perPage: number = 15): Promise<PexelsPhoto[]> => {
        if (!query.trim()) {
            return [];
        }

        const url = `${PHOTO_BASE_URL}/search?query=${encodeURIComponent(query)}&per_page=${perPage}`;

        try {
            const response = await fetch(url, {
                headers: {
                    Authorization: API_KEY,
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Pexels API Error: ${errorData.error || response.statusText}`);
            }

            const data: PexelsPhotoSearchResponse = await response.json();
            return data.photos;
        } catch (error) {
            const friendlyMessage = errorHandler.handle(error, 'PexelsService');
            throw new Error(friendlyMessage);
        }
    },
};
