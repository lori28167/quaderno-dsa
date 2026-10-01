import { invoke } from "@tauri-apps/api/core";
import { getSpeechSettings, updateSpeechSettings } from "./speechSettings";

function reportError(error: unknown): void {
  updateSpeechSettings({ error: typeof error === "string" ? error : "Errore della sintesi vocale." });
}

export async function speak(text: string): Promise<void> {
  const { enabled, speed } = getSpeechSettings();
  if (!enabled || !text.trim()) return;
  try {
    await invoke("tts_speak", { text, speed });
    if (getSpeechSettings().error) updateSpeechSettings({ error: null });
  } catch (error) {
    reportError(error);
  }
}

export async function stopSpeaking(): Promise<void> {
  try {
    await invoke("tts_stop");
  } catch (error) {
    reportError(error);
  }
}
