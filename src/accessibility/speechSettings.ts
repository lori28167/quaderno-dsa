import { useSyncExternalStore } from "react";

export interface SpeechSettings {
  enabled: boolean;
  speed: number;
  error: string | null;
}

const STORAGE_KEY = "quaderno-dsa:speech";

function load(): SpeechSettings {
  const defaults: SpeechSettings = { enabled: false, speed: 1, error: null };
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    if (saved && typeof saved === "object") {
      return {
        enabled: saved.enabled === true,
        speed: typeof saved.speed === "number" ? saved.speed : 1,
        error: null,
      };
    }
  } catch {
    // storage unavailable or corrupted: keep defaults
  }
  return defaults;
}

let settings = load();
const listeners = new Set<() => void>();

export function getSpeechSettings(): SpeechSettings {
  return settings;
}

export function updateSpeechSettings(patch: Partial<SpeechSettings>): void {
  settings = { ...settings, ...patch };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ enabled: settings.enabled, speed: settings.speed }));
  } catch {
    // preference simply won't persist
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useSpeechSettings(): SpeechSettings {
  return useSyncExternalStore(subscribe, getSpeechSettings);
}
