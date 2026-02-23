"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "docmaster_gemini_api_key";

export function useApiKey() {
  const [apiKey, setApiKeyState] = useState<string>("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setApiKeyState(stored);
    } catch { /* ignore */ }
    setLoaded(true);
  }, []);

  const saveApiKey = useCallback((key: string) => {
    const trimmed = key.trim();
    try {
      if (trimmed) {
        localStorage.setItem(STORAGE_KEY, trimmed);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch { /* ignore */ }
    setApiKeyState(trimmed);
  }, []);

  const clearApiKey = useCallback(() => {
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    setApiKeyState("");
  }, []);

  return { apiKey, saveApiKey, clearApiKey, loaded, hasKey: Boolean(apiKey) };
}
