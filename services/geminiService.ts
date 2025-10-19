import { GoogleGenAI, Modality } from "@google/genai";
import { errorHandler } from './errorHandler';

const getAiClient = () => {
    const apiKey = localStorage.getItem('genesis_v8_api_key');
    
    if (!apiKey || apiKey === 'on-device-placeholder') {
        throw new Error("API key is not configured. Please set your API key to use Cloud AI features.");
    }
    
    // The client is re-initialized for each call to ensure the latest key is used.
    return new GoogleGenAI({ apiKey });
};

export const editImageWithPrompt = async (
    base64Image: string,
    mimeType: string,
    prompt: string
): Promise<string> => {
    try {
        const ai = getAiClient();
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    {
                        inlineData: {
                            data: base64Image,
                            mimeType: mimeType,
                        },
                    },
                    {
                        text: prompt,
                    },
                ],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });
        
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return part.inlineData.data;
            }
        }
        throw new Error("No image was generated in the response.");

    } catch (error) {
        const friendlyMessage = errorHandler.handle(error, 'GeminiImageEdit');
        throw new Error(friendlyMessage);
    }
};

export const removeImageBackground = async (base64Image: string, mimeType: string): Promise<string> => {
    return editImageWithPrompt(base64Image, mimeType, "Remove the background, make the background transparent.");
};

export const generateImageWithImagen = async (prompt: string): Promise<string> => {
    try {
        const ai = getAiClient();
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: `${prompt}, high resolution, png asset with transparent background`,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/png',
              aspectRatio: '1:1',
            },
        });
        
        if (response.generatedImages && response.generatedImages.length > 0) {
            return response.generatedImages[0].image.imageBytes;
        }
        throw new Error("No image was generated in the response.");

    } catch (error) {
        const friendlyMessage = errorHandler.handle(error, 'GeminiImageGenerate');
        throw new Error(friendlyMessage);
    }
};