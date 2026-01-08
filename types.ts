
export interface CharacterProfile {
  name: string;
  description: string;
  gender: 'Masculino' | 'Feminino';
  age: number;
  country: string;
  state: string;
  accent: string;
  style: string;
  physicalTraits: string;
  personality: string;
  referenceImage?: string; // Base64
  referenceAudio?: { data: string; mimeType: string }; // Opcional para clonagem
  backgroundType: 'description' | 'upload' | 'url';
  backgroundValue: string;
  characterContext: string;
}

export enum GenerationState {
  IDLE = 'IDLE',
  GENERATING = 'GENERATING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface GenerationResult {
  id: number;
  name: string;
  date: string;
  images: string[];
  audioBase64: string | null;
  usedPrompt: string;
  profile: CharacterProfile; // Armazena o perfil usado para permitir restauração completa
}
