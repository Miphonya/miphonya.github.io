import { create } from "zustand";
export type VisionProvider = "gemini" | "openai";
export const providerLabels: Record<VisionProvider, string> = {
  gemini: "Google Gemini",
  openai: "OpenAI",
};
// Deliberately memory-only. Changing provider forgets the old provider's key.
export const useVisionSession = create<{
  provider: VisionProvider;
  apiKey: string;
  setProvider: (provider: VisionProvider) => void;
  setKey: (key: string) => void;
  clear: () => void;
}>((set) => ({
  provider: "gemini",
  apiKey: "",
  setProvider: (provider) => set({ provider, apiKey: "" }),
  setKey: (apiKey) => set({ apiKey: apiKey.trim() }),
  clear: () => set({ provider: "gemini", apiKey: "" }),
}));
