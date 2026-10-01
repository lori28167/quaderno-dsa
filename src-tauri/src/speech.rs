use std::sync::Mutex;

use tauri::State;
use tts::Tts;

/// The speech engine is created on first use, so nothing is initialised
/// while text-to-speech is switched off.
#[derive(Default)]
pub struct Speech(Mutex<Option<Tts>>);

fn select_italian_voice(tts: &mut Tts) {
    let Ok(voices) = tts.voices() else { return };
    if let Some(voice) = voices.iter().find(|v| v.language().primary_language() == "it") {
        let _ = tts.set_voice(voice);
    }
}

fn with_tts<R>(speech: &Speech, f: impl FnOnce(&mut Tts) -> Result<R, tts::Error>) -> Result<R, String> {
    let mut guard = speech
        .0
        .lock()
        .map_err(|_| "La sintesi vocale si è bloccata: riavvia il quaderno.".to_string())?;
    if guard.is_none() {
        let mut tts = Tts::default().map_err(|e| format!("Sintesi vocale non disponibile su questo computer ({e})."))?;
        select_italian_voice(&mut tts);
        *guard = Some(tts);
    }
    let tts = guard.as_mut().expect("initialised above");
    f(tts).map_err(|e| format!("Errore della sintesi vocale: {e}"))
}

/// `speed` is a multiplier: 1.0 is the voice's normal speed, 0.5 slower, 1.5 faster.
#[tauri::command]
pub fn tts_speak(speech: State<Speech>, text: String, speed: f32) -> Result<(), String> {
    with_tts(&speech, |tts| {
        let speed = speed.clamp(0.5, 1.5);
        let normal = tts.normal_rate();
        let rate = if speed < 1.0 {
            normal - (1.0 - speed) * (normal - tts.min_rate())
        } else {
            normal + (speed - 1.0) * (tts.max_rate() - normal)
        };
        tts.set_rate(rate)?;
        tts.speak(text, true)?;
        Ok(())
    })
}

#[tauri::command]
pub fn tts_stop(speech: State<Speech>) -> Result<(), String> {
    let mut guard = speech.0.lock().map_err(|_| "La sintesi vocale si è bloccata.".to_string())?;
    match guard.as_mut() {
        Some(tts) => tts.stop().map(|_| ()).map_err(|e| format!("Errore della sintesi vocale: {e}")),
        None => Ok(()),
    }
}
