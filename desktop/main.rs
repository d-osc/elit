#![cfg_attr(target_os = "windows", windows_subsystem = "windows")]

mod runtime;
mod icon;
mod window;

use std::env;

const EMBED_MAGIC_V1: &[u8; 8] = b"WAPKJS\x00\x01";
const EMBED_MAGIC_V2: &[u8; 8] = b"WAPKRT\x00\x02";

struct EmbeddedApp {
    runtime: String,
    code: String,
}

fn embedded_runtime_name(code: u8) -> Option<&'static str> {
    match code {
        1 => Some("quickjs"),
        2 => Some("bun"),
        3 => Some("node"),
        4 => Some("deno"),
        _ => None,
    }
}

fn read_embedded_js(
    file: &mut std::fs::File,
    file_size: u64,
    js_size: usize,
    trailer_size: usize,
) -> Option<String> {
    use std::io::{Read, Seek, SeekFrom};

    let js_offset = (file_size as usize).checked_sub(trailer_size + js_size)?;
    file.seek(SeekFrom::Start(js_offset as u64)).ok()?;

    let mut js_bytes = vec![0u8; js_size];
    file.read_exact(&mut js_bytes).ok()?;
    String::from_utf8(js_bytes).ok()
}

/// Read JS embedded in this binary (appended after the PE).
/// V1 layout: [exe bytes][js bytes][js_size: u64 LE][EMBED_MAGIC_V1: 8 bytes]
/// V2 layout: [exe bytes][js bytes][js_size: u64 LE][runtime_code: u8][EMBED_MAGIC_V2: 8 bytes]
fn try_embedded_app() -> Option<EmbeddedApp> {
    use std::io::{Read, Seek, SeekFrom};

    let exe_path = std::env::current_exe().ok()?;
    let mut f = std::fs::File::open(&exe_path).ok()?;
    let file_size = f.metadata().ok()?.len();

    if file_size >= 17 {
        f.seek(SeekFrom::End(-17)).ok()?;
        let mut trailer = [0u8; 17];
        f.read_exact(&mut trailer).ok()?;

        if &trailer[9..17] == EMBED_MAGIC_V2 {
            let js_size = u64::from_le_bytes(trailer[0..8].try_into().ok()?) as usize;
            let runtime = embedded_runtime_name(trailer[8])?.to_string();
            let code = read_embedded_js(&mut f, file_size, js_size, 17)?;
            return Some(EmbeddedApp { runtime, code });
        }
    }

    if file_size >= 16 {
        f.seek(SeekFrom::End(-16)).ok()?;
        let mut trailer = [0u8; 16];
        f.read_exact(&mut trailer).ok()?;

        if &trailer[8..16] == EMBED_MAGIC_V1 {
            let js_size = u64::from_le_bytes(trailer[0..8].try_into().ok()?) as usize;
            let code = read_embedded_js(&mut f, file_size, js_size, 16)?;
            return Some(EmbeddedApp {
                runtime: String::from("quickjs"),
                code,
            });
        }
    }

    None
}

fn print_help() {
    eprintln!(
        r#"elit-desktop — native WebView runtime for Elit

Usage:
  elit-desktop [OPTIONS] <script.js>

Options:
  --runtime <name>   JS runtime to use (default: quickjs)
                     Choices: quickjs | bun | node | deno
  --help             Show this help

Examples:
  elit-desktop app.js
  elit-desktop --runtime bun app.js
  elit-desktop --runtime node app.js
"#
    );
}

/// Look for `<exe-stem>.js` next to the running binary (enables standalone app.exe).
fn auto_detect_script() -> Option<String> {
    let exe  = std::env::current_exe().ok()?;
    let stem = exe.file_stem()?.to_str()?.to_string();
    let dir  = exe.parent()?;
    let candidate = dir.join(format!("{}.js", stem));
    if candidate.exists() {
        Some(candidate.to_string_lossy().into_owned())
    } else {
        None
    }
}

fn parse_args() -> (String, String) {
    let args: Vec<String> = env::args().skip(1).collect();

    // No args → try auto-detect bundled script, otherwise show help
    if args.is_empty() {
        if let Some(script) = auto_detect_script() {
            return (String::from("quickjs"), script);
        }
        print_help();
        std::process::exit(0);
    }

    if args.iter().any(|a| a == "--help" || a == "-h") {
        print_help();
        std::process::exit(0);
    }

    let mut runtime = String::from("quickjs");
    let mut script  = String::new();
    let mut i = 0;

    while i < args.len() {
        match args[i].as_str() {
            "--runtime" | "-r" => {
                i += 1;
                if i < args.len() {
                    runtime = args[i].clone();
                }
            }
            arg if !arg.starts_with('-') => {
                script = arg.to_string();
            }
            _ => {}
        }
        i += 1;
    }

    if script.is_empty() {
        if let Some(auto) = auto_detect_script() {
            return (runtime, auto);
        }
        eprintln!("Error: no script file specified.");
        print_help();
        std::process::exit(1);
    }

    (runtime, script)
}

fn main() {
    // ── Embedded JS (single-file distribution) ──────────────────────────────
    if let Some(EmbeddedApp { runtime, code }) = try_embedded_app() {
        match runtime.as_str() {
            #[cfg(feature = "runtime-quickjs")]
            "quickjs" => {
                window::run(move |proxy, ipc_rx| {
                    runtime::quickjs::run(&code, proxy, ipc_rx);
                });
            }

            #[cfg(feature = "runtime-external")]
            rt @ ("bun" | "node" | "nodejs" | "deno") => {
                let name = rt.to_string();
                window::run(move |proxy, ipc_rx| {
                    runtime::external::run_embedded(&name, &code, proxy, ipc_rx);
                });
            }

            other => {
                eprintln!(
                    "Error: embedded runtime '{}' is not available in this build.",
                    other
                );
                std::process::exit(1);
            }
        }
        return;
    }

    let (runtime_name, script_path) = parse_args();

    // Validate file exists
    if !std::path::Path::new(&script_path).exists() {
        eprintln!("Error: '{}' not found.", script_path);
        std::process::exit(1);
    }

    match runtime_name.as_str() {
        // ── Embedded QuickJS (default) ──────────────────────────────────────
        #[cfg(feature = "runtime-quickjs")]
        "quickjs" => {
            let code = std::fs::read_to_string(&script_path)
                .unwrap_or_else(|_| panic!("Cannot read '{}'", script_path));

            window::run(move |proxy, ipc_rx| {
                runtime::quickjs::run(&code, proxy, ipc_rx);
            });
        }

        // ── External runtime (Bun / Node / Deno) ────────────────────────────
        #[cfg(feature = "runtime-external")]
        rt @ ("bun" | "node" | "nodejs" | "deno") => {
            let path = script_path.clone();
            let name = rt.to_string();

            window::run(move |proxy, ipc_rx| {
                runtime::external::run(&name, &path, proxy, ipc_rx);
            });
        }

        other => {
            eprintln!(
                "Error: unknown runtime '{}'.\nAvailable: quickjs, bun, node, deno",
                other
            );
            std::process::exit(1);
        }
    }
}
