#![cfg_attr(target_os = "windows", windows_subsystem = "windows")]

use std::env;

use elit_desktop::native_renderer;

const EMBED_NATIVE_MAGIC_V1: &[u8; 8] = b"ELITNUI1";

fn read_embedded_payload(
    file: &mut std::fs::File,
    file_size: u64,
    payload_size: usize,
    trailer_size: usize,
) -> Option<String> {
    use std::io::{Read, Seek, SeekFrom};

    let payload_offset = (file_size as usize).checked_sub(trailer_size + payload_size)?;
    file.seek(SeekFrom::Start(payload_offset as u64)).ok()?;

    let mut payload_bytes = vec![0u8; payload_size];
    file.read_exact(&mut payload_bytes).ok()?;
    String::from_utf8(payload_bytes).ok()
}

fn try_embedded_payload() -> Option<String> {
    use std::io::{Read, Seek, SeekFrom};

    let exe_path = std::env::current_exe().ok()?;
    let mut file = std::fs::File::open(&exe_path).ok()?;
    let file_size = file.metadata().ok()?.len();

    if file_size < 16 {
        return None;
    }

    file.seek(SeekFrom::End(-16)).ok()?;
    let mut trailer = [0u8; 16];
    file.read_exact(&mut trailer).ok()?;

    if &trailer[8..16] != EMBED_NATIVE_MAGIC_V1 {
        return None;
    }

    let payload_size = u64::from_le_bytes(trailer[0..8].try_into().ok()?) as usize;
    read_embedded_payload(&mut file, file_size, payload_size, 16)
}

fn print_help() {
    eprintln!(
        r#"elit-desktop-native — native UI runtime for Elit

Usage:
  elit-desktop-native [payload.json]

Options:
  --help             Show this help

Examples:
  elit-desktop-native app.json
"#
    );
}

fn auto_detect_payload() -> Option<String> {
    let exe = std::env::current_exe().ok()?;
    let stem = exe.file_stem()?.to_str()?.to_string();
    let dir = exe.parent()?;
    let candidate = dir.join(format!("{}.json", stem));
    if candidate.exists() {
        Some(candidate.to_string_lossy().into_owned())
    } else {
        None
    }
}

fn parse_payload_path() -> String {
    let args: Vec<String> = env::args().skip(1).collect();

    if args.iter().any(|arg| arg == "--help" || arg == "-h") {
        print_help();
        std::process::exit(0);
    }

    if args.is_empty() {
        if let Some(payload) = auto_detect_payload() {
            return payload;
        }

        print_help();
        std::process::exit(0);
    }

    let payload_path = args
        .iter()
        .find(|arg| !arg.starts_with('-'))
        .cloned();

    if let Some(payload_path) = payload_path {
        return payload_path;
    }

    if let Some(payload) = auto_detect_payload() {
        return payload;
    }

    eprintln!("Error: no payload file specified.");
    print_help();
    std::process::exit(1);
}

fn main() {
    let payload_json = if let Some(embedded_payload) = try_embedded_payload() {
        embedded_payload
    } else {
        let payload_path = parse_payload_path();
        std::fs::read_to_string(&payload_path).unwrap_or_else(|error| {
            eprintln!("Error: failed to read native desktop payload '{}': {}", payload_path, error);
            std::process::exit(1);
        })
    };

    let payload: native_renderer::NativeDesktopPayload = serde_json::from_str(&payload_json).unwrap_or_else(|error| {
        eprintln!("Error: failed to parse native desktop payload: {}", error);
        std::process::exit(1);
    });

    native_renderer::run(payload);
}