
import { GoogleGenAI, Modality } from "@google/genai";
import { CharacterProfile } from "../types";

export async function generateCharacterImages(profile: CharacterProfile): Promise<{ images: string[], prompt: string }> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const backgroundPrompt = profile.backgroundType === 'description' ? `Background: ${profile.backgroundValue}.` : "";
  const contextPrompt = profile.characterContext ? `Character is ${profile.characterContext}.` : "Standing naturally.";

  const basePrompt = `Professional photo of ${profile.name}, ${profile.gender}, ${profile.age}y. ${profile.physicalTraits}. Style: ${profile.style}. Personality: ${profile.personality}. ${contextPrompt} ${backgroundPrompt} High quality, 8k.`;

  const variations = ["Full shot", "Medium shot", "Atmospheric portrait"];

  const imageRequests = variations.map(async (variation) => {
    const promptParts: any[] = [{ text: `${basePrompt} Shot: ${variation}` }];
    if (profile.referenceImage) {
      const [meta, data] = profile.referenceImage.split(',');
      promptParts.push({ inlineData: { data, mimeType: meta.split(':')[1].split(';')[0] } });
    }
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: promptParts },
      config: { imageConfig: { aspectRatio: "16:9" } }
    });
    const part = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    return `data:${part?.inlineData?.mimeType};base64,${part?.inlineData?.data}`;
  });

  const images = await Promise.all(imageRequests);
  return { images, prompt: basePrompt };
}

export async function generateCharacterVoice(text: string, profile: CharacterProfile): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  if (profile.referenceAudio) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        contents: {
          parts: [
            { inlineData: profile.referenceAudio },
            { text: `Siga estritamente o tom, sotaque e voz do áudio fornecido. Como ${profile.name}, diga exatamente: ${text}` }
          ]
        },
        config: { responseModalities: [Modality.AUDIO] }
      });
      return response.candidates?.[0]?.content?.parts[0]?.inlineData?.data || "";
    } catch (e) {
      console.warn("Clonagem falhou, usando TTS padrão...");
    }
  }

  const voiceName = profile.gender === 'Feminino' ? 'Kore' : 'Zephyr';
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Como ${profile.name} (${profile.accent}), fale: ${text}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } },
    },
  });
  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
}
