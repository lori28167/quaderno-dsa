use std::fs;
use std::path::{Path, PathBuf};

use tauri::{AppHandle, Manager};

const RECOVERY_FILE: &str = "ripristino.json";

// Write to a temporary file first, then rename: a crash mid-write never
// leaves a half-written notebook behind.
fn write_atomically(path: &Path, contents: &str) -> std::io::Result<()> {
    let mut tmp = path.as_os_str().to_owned();
    tmp.push(".tmp");
    let tmp = PathBuf::from(tmp);
    fs::write(&tmp, contents)?;
    fs::rename(&tmp, path)
}

fn recovery_path(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Cartella dei dati non trovata: {e}"))?;
    fs::create_dir_all(&dir)
        .map_err(|e| format!("Impossibile creare la cartella dei dati: {e}"))?;
    Ok(dir.join(RECOVERY_FILE))
}

#[tauri::command]
pub fn read_notebook(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| format!("Impossibile aprire il file: {e}"))
}

#[tauri::command]
pub fn write_notebook(path: String, contents: String) -> Result<(), String> {
    write_atomically(Path::new(&path), &contents)
        .map_err(|e| format!("Impossibile salvare il file: {e}"))
}

#[tauri::command]
pub fn load_recovery(app: AppHandle) -> Result<Option<String>, String> {
    let path = recovery_path(&app)?;
    match fs::read_to_string(path) {
        Ok(contents) => Ok(Some(contents)),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(None),
        Err(e) => Err(format!("Impossibile leggere la copia di ripristino: {e}")),
    }
}

#[tauri::command]
pub fn save_recovery(app: AppHandle, contents: String) -> Result<(), String> {
    let path = recovery_path(&app)?;
    write_atomically(&path, &contents)
        .map_err(|e| format!("Impossibile salvare la copia di ripristino: {e}"))
}
