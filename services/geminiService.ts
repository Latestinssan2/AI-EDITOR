import { GoogleGenAI, Modality, Type } from "@google/genai";
import { errorHandler } from './errorHandler';
import { VideoProjectState } from "../types";

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

export const generateSoundEffect = async (prompt: string): Promise<string> => {
    try {
        const ai = getAiClient();
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: `Generate a sound effect for: ${prompt}` }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                      prebuiltVoiceConfig: { voiceName: 'Kore' }, // A neutral voice for SFX
                    },
                },
            },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64Audio) {
            return base64Audio;
        }
        throw new Error("No audio was generated in the response.");

    } catch (error) {
        const friendlyMessage = errorHandler.handle(error, 'GeminiSoundEffect');
        throw new Error(friendlyMessage);
    }
}

export const generateVideoTemplate = async (prompt: string): Promise<VideoProjectState> => {
    try {
        const ai = getAiClient();
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction: `You are a video editor's assistant. Your task is to generate a JSON object representing a video project structure based on the user's description. The JSON must conform to the provided schema. Create placeholders for user media. For text overlays, invent creative content that matches the theme. The total duration should be the sum of all timeline clips durations.`,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        timelineClips: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    id: { type: Type.STRING },
                                    isPlaceholder: { type: Type.BOOLEAN },
                                    placeholderText: { type: Type.STRING },
                                    duration: { type: Type.NUMBER },
                                    originalDuration: { type: Type.NUMBER },
                                    startOffset: { type: Type.NUMBER, default: 0 },
                                }
                            }
                        },
                        overlays: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    id: { type: Type.STRING },
                                    type: { type: Type.STRING, enum: ['text'] },
                                    content: { type: Type.STRING },
                                    startTime: { type: Type.NUMBER },
                                    duration: { type: Type.NUMBER },
                                    x: { type: Type.NUMBER },
                                    y: { type: Type.NUMBER },
                                    width: { type: Type.NUMBER },
                                    height: { type: Type.NUMBER },
                                    fontSize: { type: Type.NUMBER },
                                    color: { type: Type.STRING },
                                    fontFamily: { type: Type.STRING },
                                }
                            }
                        },
                        audioClips: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: {} } },
                        zoomLevel: { type: Type.NUMBER, default: 1 },
                        playheadPosition: { type: Type.NUMBER, default: 0 },
                        duration: { type: Type.NUMBER },
                    }
                },
            },
        });

        const jsonString = response.text;
        const generatedState = JSON.parse(jsonString);
        
        // Post-process to ensure valid defaults
        generatedState.audioClips = generatedState.audioClips || [];
        generatedState.overlays = generatedState.overlays || [];
        generatedState.zoomLevel = 1;
        generatedState.playheadPosition = 0;
        
        return generatedState as VideoProjectState;

    } catch (error) {
        const friendlyMessage = errorHandler.handle(error, 'GeminiVideoTemplate');
        throw new Error(friendlyMessage);
    }
};