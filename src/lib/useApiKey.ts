"use client";

import { useState, useEffect, useCallback } from "react";

const KEY_STORAGE = "docmaster_gemini_api_key";
const MODEL_STORAGE = "docmaster_gemini_model";

export const GEMINI_MODELS = [
  { id: "gemini-2.5-flash-lite",    label: "Flash 2.5 Lite",  badge: "Fastest" },
  { id: "gemini-2.5-flash",         label: "Flash 2.5",      badge: "Smart" },
  { id: "gemini-2.5-pro",           label: "Pro 2.5",        badge: "Best" },
] as const;

export type GeminiModelId = typeof GEMINI_MODELS[number]["id"];
export const DEFAULT_MODEL: GeminiModelId = "gemini-2.5-flash-lite";

export function useApiKey() {
  const [apiKey, setApiKeyState] = useState<string>("");
  const [model, setModelState] = useState<GeminiModelId>(DEFAULT_MODEL);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedKey = localStorage.getItem(KEY_STORAGE);
      if (storedKey) setApiKeyState(storedKey);
      const storedModel = localStorage.getItem(MODEL_STORAGE) as GeminiModelId | null;
      if (storedModel && GEMINI_MODELS.some((m) => m.id === storedModel)) {
        setModelState(storedModel);
      }
    } catch { /* ignore */ }
    setLoaded(true);
  }, []);

  const saveApiKey = useCallback((key: string) => {
    const trimmed = key.trim();
    try {
      if (trimmed) {
        localStorage.setItem(KEY_STORAGE, trimmed);
      } else {
        localStorage.removeItem(KEY_STORAGE);
      }
    } catch { /* ignore */ }
    setApiKeyState(trimmed);
  }, []);

  const saveModel = useCallback((m: GeminiModelId) => {
    try { localStorage.setItem(MODEL_STORAGE, m); } catch { /* ignore */ }
    setModelState(m);
  }, []);

  const clearApiKey = useCallback(() => {
    try { localStorage.removeItem(KEY_STORAGE); } catch { /* ignore */ }
    setApiKeyState("");
  }, []);

  return { apiKey, saveApiKey, clearApiKey, model, saveModel, loaded, hasKey: Boolean(apiKey) };
}
