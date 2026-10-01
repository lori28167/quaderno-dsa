// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

// GTK3 on Wayland outside GNOME (e.g. KDE Plasma) reports an unknown screen
// resolution of -1 DPI; WebKitGTK turns it into a negative devicePixelRatio,
// which collapses the whole layout. Fall back to the standard 96 DPI.
#[cfg(target_os = "linux")]
fn fix_unknown_screen_resolution() {
    if gtk::init().is_err() {
        return;
    }
    if let Some(screen) = gtk::gdk::Screen::default() {
        if screen.resolution() <= 0.0 {
            screen.set_resolution(96.0);
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    #[cfg(target_os = "linux")]
    fix_unknown_screen_resolution();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
