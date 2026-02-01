
import { GoogleGenAI, Type, Modality } from "@google/genai";

/**
 * Initialize the Gemini client using the environment variable.
 * Guideline: Always use const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
 * Use process.env.API_KEY string directly.
 */
export const getGeminiClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// 1. Identify User (Flash)
// Guideline: For basic text tasks with images, use gemini-3-flash-preview.
export const identifyUser = async (imageBuffer: string): Promise<string> => {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { text: "Look at this person and give them a mean, grumpy, 1-word nickname based on their vibe. Only return the word." },
        { inlineData: { mimeType: "image/jpeg", data: imageBuffer } }
      ]
    },
  });
  // Use .text property directly, do not call as method.
  return response.text?.trim() || "Unidentifiable Blob";
};

// 2. Chat with Thinking (Pro)
// Guideline: For complex text tasks, use gemini-3-pro-preview.
export const chatWithThinking = async (message: string) => {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: message,
    config: {
      thinkingConfig: { thinkingBudget: 32768 },
      systemInstruction: "You are EmoBot. You are deep, dark, and highly intellectual but find everything exhausting. You must use your thinking budget to consider how miserable the user's request is before answering."
    }
  });
  return {
    text: response.text,
    thought: (response as any).candidates?.[0]?.content?.parts?.find((p: any) => p.thought)?.text
  };
};

// 3. Search Grounding (Flash)
// Guideline: Basic text task with Google Search. Use gemini-3-flash-preview.
export const searchInformation = async (query: string) => {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: query,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });
  const urls = response.candidates?.[0]?.groundingMetadata?.groundingChunks
    ?.map((chunk: any) => chunk.web)
    .filter(Boolean) || [];
  return { text: response.text, urls };
};

// 4. Maps Grounding (2.5 Flash)
// Guideline: Maps grounding is supported in Gemini 2.5 series.
export const findPlaces = async (query: string, lat?: number, lng?: number) => {
  const ai = getGeminiClient();
  const config: any = {
    tools: [{ googleMaps: {} }],
  };
  if (lat && lng) {
    config.toolConfig = {
      retrievalConfig: {
        latLng: { latitude: lat, longitude: lng }
      }
    };
  }
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: query,
    config,
  });
  const urls = response.candidates?.[0]?.groundingMetadata?.groundingChunks
    ?.map((chunk: any) => chunk.maps)
    .filter(Boolean) || [];
  return { text: response.text, urls };
};

// 5. High-Quality TTS (2.5 Flash TTS)
// Guideline: Use gemini-2.5-flash-preview-tts for audio generation.
export const generateAudioSpeech = async (text: string): Promise<string> => {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Say with a deep, monotone, depressed robotic voice: ${text}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Charon' },
        },
      },
    },
  });
  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
};

// 6. Transcribe Audio (Flash)
// Guideline: gemini-3-flash-preview handles multimodal inputs.
export const transcribeAudio = async (base64Audio: string): Promise<string> => {
  const ai = getGeminiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { text: "Transcribe this audio accurately. If there is no speech, say [silence]." },
        { inlineData: { mimeType: "audio/webm", data: base64Audio } }
      ]
    },
  });
  return response.text?.trim() || "";
};
