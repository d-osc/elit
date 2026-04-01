use std::{
    io::{BufRead, BufReader, Write},
    path::PathBuf,
    process::{Command, Stdio},
    sync::mpsc::Receiver,
    time::{SystemTime, UNIX_EPOCH},
};
#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;
use tao::event_loop::EventLoopProxy;

use crate::runtime::{WindowCommand, WindowOptions};

#[cfg(target_os = "windows")]
const CREATE_NO_WINDOW: u32 = 0x0800_0000;

#[cfg(target_os = "windows")]
fn child_process_path(path: &std::path::Path) -> String {
    let value = path.to_string_lossy();
    if let Some(rest) = value.strip_prefix(r"\\?\UNC\") {
        format!(r"\\{}", rest)
    } else if let Some(rest) = value.strip_prefix(r"\\?\") {
        rest.to_string()
    } else {
        value.into_owned()
    }
}

#[cfg(not(target_os = "windows"))]
fn child_process_path(path: &std::path::Path) -> String {
    path.to_string_lossy().into_owned()
}

fn for_each_output_line<R>(reader: R, mut on_line: impl FnMut(String))
where
    R: std::io::Read,
{
    let mut reader = BufReader::new(reader);
    let mut buffer = Vec::new();

    loop {
        buffer.clear();
        match reader.read_until(b'\n', &mut buffer) {
            Ok(0) => break,
            Ok(_) => {
                while matches!(buffer.last(), Some(b'\n' | b'\r')) {
                    buffer.pop();
                }
                on_line(String::from_utf8_lossy(&buffer).into_owned());
            }
            Err(_) => break,
        }
    }
}

/// Shim prepended to user script (written to a temp file).
/// JS writes commands to stderr with __WAG__ prefix.
const SHIM_NODELIKE: &str = r#"
const __wag = obj => process.stderr.write('__WAG__' + JSON.stringify(obj) + '\n');

globalThis.createWindow        = opts  => __wag({ cmd: 'createWindow', opts: opts ?? {} });
globalThis.windowEval          = code  => __wag({ cmd: 'windowEval',   code });
globalThis.onMessage           = fn    => { globalThis.__onMessage = fn; };

// Window controls
globalThis.windowMinimize      = ()    => __wag({ cmd: 'minimize' });
globalThis.windowMaximize      = ()    => __wag({ cmd: 'maximize' });
globalThis.windowUnmaximize    = ()    => __wag({ cmd: 'unmaximize' });
globalThis.windowSetTitle      = title => __wag({ cmd: 'setTitle', title });
globalThis.windowDrag          = ()    => __wag({ cmd: 'drag' });
globalThis.windowSetPosition   = (x,y) => __wag({ cmd: 'setPosition', x, y });
globalThis.windowSetSize       = (w,h) => __wag({ cmd: 'setSize', w, h });
globalThis.windowSetAlwaysOnTop = v    => __wag({ cmd: 'setAlwaysOnTop', value: v });
globalThis.windowQuit          = ()    => __wag({ cmd: 'quit' });

// ── createWindowServer(app, opts) ────────────────────────────────────────────────────
// Start an HTTP server and open a WebView pointing to it.
//
// exposePort: false (default) — server listens on a named pipe (Windows) or
//   Unix socket.  No TCP port is created at all, so no browser can reach it.
//
// exposePort: true — server binds to 0.0.0.0:port, reachable from the network.
//
// opts mirrors createWindow opts plus:
//   port?       number   — fixed port (exposePort:true only; ignored for pipes)
//   exposePort? bool     — expose via TCP (default: false → pipe/socket)
//
// Returns: Promise<{ port, host, url }> for exposePort:true
//          Promise<{ pipe }>            for exposePort:false
globalThis.createWindowServer = async function(app, opts = {}) {
    const httpMod = typeof require !== 'undefined' ? require('http') : await import('node:http');
    const http = httpMod.default ?? httpMod;
    const { exposePort: _e, port: _p, ...windowOpts } = opts;

    if (opts.exposePort) {
        // ── TCP, network-accessible — WebView still uses app:// ───────────────
        const server = http.createServer(app);
        await new Promise((resolve, reject) => {
            server.listen(opts.port ?? 0, '0.0.0.0', resolve);
            server.on('error', reject);
        });
        const port = server.address().port;
        createWindow({ ...windowOpts, proxy_port: port });
        return { port, host: '0.0.0.0', url: 'app://localhost/' };
    }

    // ── Named pipe / Unix socket — no TCP port at all ─────────────────────────
    const cryptoMod = typeof require !== 'undefined' ? require('crypto') : await import('node:crypto');
    const randomUUID = globalThis.crypto?.randomUUID?.bind(globalThis.crypto) ?? cryptoMod.randomUUID;
    const secret = randomUUID();
    const isWin  = process.platform === 'win32';
    const pipe   = isWin
        ? '\\\\.\\pipe\\wag-' + secret
        : '/tmp/wag-' + secret + '.sock';

    // Guard: only Rust (which injects X-WAG-Internal) is allowed through
    const server = http.createServer((req, res) => {
        if (req.headers['x-wag-internal'] !== secret) {
            res.writeHead(403); res.end('Forbidden'); return;
        }
        app(req, res);
    });

    await new Promise((resolve, reject) => {
        server.listen(pipe, resolve);
        server.on('error', reject);
    });

    createWindow({ ...windowOpts, proxy_pipe: pipe, proxy_secret: secret });
    return { pipe };
};

// ── IPC: WebView → backend (via stdin) ───────────────────────────────────────
process.stdin.setEncoding('utf8');
if (typeof process.stdin.resume === 'function') process.stdin.resume();
let __stdinBuf = '';
process.stdin.on('data', chunk => {
    __stdinBuf += chunk;
    let nl;
    while ((nl = __stdinBuf.indexOf('\n')) !== -1) {
        const line = __stdinBuf.slice(0, nl).trim();
        __stdinBuf = __stdinBuf.slice(nl + 1);
        if (line && globalThis.__onMessage) {
            try { globalThis.__onMessage(line); } catch(e) {}
        }
    }
});
"#;

const SHIM_DENO: &str = r#"
const __encoder = new TextEncoder();
const __wag = obj => Deno.stderr.writeSync(__encoder.encode('__WAG__' + JSON.stringify(obj) + '\n'));
let __stdinBuf = '';
let __ipcStarted = false;

function __startIpcLoop() {
    if (__ipcStarted) return;
    __ipcStarted = true;

    setTimeout(() => {
        (async () => {
            const reader = Deno.stdin.readable.pipeThrough(new TextDecoderStream()).getReader();
            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                __stdinBuf += value;
                let nl;
                while ((nl = __stdinBuf.indexOf('\n')) !== -1) {
                    const line = __stdinBuf.slice(0, nl).trim();
                    __stdinBuf = __stdinBuf.slice(nl + 1);
                    if (line && globalThis.__onMessage) {
                        try { globalThis.__onMessage(line); } catch(e) {}
                    }
                }
            }
        })();
    }, 0);
}

globalThis.createWindow        = opts  => __wag({ cmd: 'createWindow', opts: opts ?? {} });
globalThis.windowEval          = code  => __wag({ cmd: 'windowEval',   code });
globalThis.onMessage           = fn    => { globalThis.__onMessage = fn; __startIpcLoop(); };

// Window controls
globalThis.windowMinimize      = ()    => __wag({ cmd: 'minimize' });
globalThis.windowMaximize      = ()    => __wag({ cmd: 'maximize' });
globalThis.windowUnmaximize    = ()    => __wag({ cmd: 'unmaximize' });
globalThis.windowSetTitle      = title => __wag({ cmd: 'setTitle', title });
globalThis.windowDrag          = ()    => __wag({ cmd: 'drag' });
globalThis.windowSetPosition   = (x,y) => __wag({ cmd: 'setPosition', x, y });
globalThis.windowSetSize       = (w,h) => __wag({ cmd: 'setSize', w, h });
globalThis.windowSetAlwaysOnTop = v    => __wag({ cmd: 'setAlwaysOnTop', value: v });
globalThis.windowQuit          = ()    => __wag({ cmd: 'quit' });

globalThis.createWindowServer = async function(app, opts = {}) {
    const httpMod = await import('node:http');
    const http = httpMod.default ?? httpMod;
    const { exposePort: _e, port: _p, ...windowOpts } = opts;

    if (opts.exposePort) {
        const server = http.createServer(app);
        await new Promise((resolve, reject) => {
            server.listen(opts.port ?? 0, '0.0.0.0', resolve);
            server.on('error', reject);
        });
        const port = server.address().port;
        createWindow({ ...windowOpts, proxy_port: port });
        return { port, host: '0.0.0.0', url: 'app://localhost/' };
    }

    const secret = globalThis.crypto.randomUUID();
    const isWin  = process.platform === 'win32';
    const pipe   = isWin
        ? '\\\\.\\pipe\\wag-' + secret
        : '/tmp/wag-' + secret + '.sock';

    const server = http.createServer((req, res) => {
        if (req.headers['x-wag-internal'] !== secret) {
            res.writeHead(403); res.end('Forbidden'); return;
        }
        app(req, res);
    });

    await new Promise((resolve, reject) => {
        server.listen(pipe, resolve);
        server.on('error', reject);
    });

    createWindow({ ...windowOpts, proxy_pipe: pipe, proxy_secret: secret });
    return { pipe };
};
"#;

/// Detect the executable name for the given runtime.
fn runtime_exe(name: &str) -> &'static str {
    match name {
        "bun"  => "bun",
        "node" | "nodejs" => "node",
        "deno" => "deno",
        _      => "bun",
    }
}

fn runtime_shim(name: &str) -> &'static str {
    match name {
        "deno" => SHIM_DENO,
        _      => SHIM_NODELIKE,
    }
}

fn configure_runtime_command(command: &mut Command, runtime_name: &str, shim: &str, script_path: &str) {
    match runtime_name {
        "bun" => {
            command.arg("--preload").arg(shim).arg(script_path);
        }
        "node" | "nodejs" => {
            command.arg("--require").arg(shim).arg(script_path);
        }
        "deno" => {
            command.arg("run").arg("--preload").arg(shim).arg(script_path);
        }
        _ => {
            command.arg("--preload").arg(shim).arg(script_path);
        }
    }
}

fn embedded_script_path(runtime_name: &str) -> PathBuf {
    let base_dir = std::env::current_exe()
        .ok()
        .and_then(|path| path.parent().map(|parent| parent.to_path_buf()))
        .unwrap_or_else(std::env::temp_dir);

    let stem = std::env::current_exe()
        .ok()
        .and_then(|path| path.file_stem().and_then(|name| name.to_str()).map(|name| name.to_string()))
        .unwrap_or_else(|| String::from("elit-desktop"));

    let stamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis();

    base_dir.join(format!(".{}-embedded-{}-{}-{}.js", stem, runtime_name, std::process::id(), stamp))
}

fn run_script_file(
    runtime_name: &str,
    script_path: PathBuf,
    cleanup_path: Option<PathBuf>,
    proxy: EventLoopProxy<WindowCommand>,
    ipc_rx: Receiver<String>,
) {
    let shim_path = std::env::temp_dir().join("wag-shim.js");
    std::fs::write(&shim_path, runtime_shim(runtime_name)).expect("Failed to write shim");

    let script_path_buf = std::fs::canonicalize(&script_path).unwrap_or(script_path);
    let script_path_str = child_process_path(&script_path_buf);
    let script_dir = script_path_buf.parent().map(|p| p.to_path_buf());

    let exe  = runtime_exe(runtime_name);
    let shim = child_process_path(&shim_path);

    let mut command = Command::new(exe);
    configure_runtime_command(&mut command, runtime_name, &shim, &script_path_str);
    command.stdin(Stdio::piped()).stdout(Stdio::piped()).stderr(Stdio::piped());

    if let Some(dir) = script_dir {
        command.current_dir(dir);
    }

    #[cfg(target_os = "windows")]
    command.creation_flags(CREATE_NO_WINDOW);

    let mut child = match command.spawn() {
        Ok(child) => child,
        Err(_) => {
            if let Some(path) = cleanup_path.as_ref() {
                let _ = std::fs::remove_file(path);
            }
            panic!("Failed to spawn '{}'. Is it installed?", exe);
        }
    };

    let mut stdin = child.stdin.take().expect("Failed to get child stdin");
    std::thread::spawn(move || {
        for msg in ipc_rx {
            let _ = writeln!(stdin, "{}", msg);
        }
    });

    let stdout = child.stdout.take().expect("Failed to capture stdout");
    std::thread::spawn(move || {
        for_each_output_line(stdout, |line| {
            println!("{}", line);
        });
    });

    let stderr = child.stderr.take().expect("Failed to capture stderr");

    for_each_output_line(stderr, |line| {
        if let Some(json) = line.strip_prefix("__WAG__") {
            if let Ok(msg) = serde_json::from_str::<serde_json::Value>(json) {
                let mut should_break = false;
                match msg["cmd"].as_str() {
                    Some("createWindow") => {
                        let opts: WindowOptions =
                            serde_json::from_value(msg["opts"].clone()).unwrap_or_default();
                        proxy.send_event(WindowCommand::Create(opts)).ok();
                    }
                    Some("windowEval") => {
                        if let Some(code) = msg["code"].as_str() {
                            proxy.send_event(WindowCommand::Eval(code.to_string())).ok();
                        }
                    }
                    Some("minimize")   => { proxy.send_event(WindowCommand::Minimize).ok(); }
                    Some("maximize")   => { proxy.send_event(WindowCommand::Maximize).ok(); }
                    Some("unmaximize") => { proxy.send_event(WindowCommand::Unmaximize).ok(); }
                    Some("drag")       => { proxy.send_event(WindowCommand::Drag).ok(); }
                    Some("setTitle") => {
                        if let Some(t) = msg["title"].as_str() {
                            proxy.send_event(WindowCommand::SetTitle(t.to_string())).ok();
                        }
                    }
                    Some("setPosition") => {
                        if let (Some(x), Some(y)) = (msg["x"].as_i64(), msg["y"].as_i64()) {
                            proxy.send_event(WindowCommand::SetPosition(x as i32, y as i32)).ok();
                        }
                    }
                    Some("setSize") => {
                        if let (Some(w), Some(h)) = (msg["w"].as_u64(), msg["h"].as_u64()) {
                            proxy.send_event(WindowCommand::SetSize(w as u32, h as u32)).ok();
                        }
                    }
                    Some("setAlwaysOnTop") => {
                        if let Some(v) = msg["value"].as_bool() {
                            proxy.send_event(WindowCommand::SetAlwaysOnTop(v)).ok();
                        }
                    }
                    Some("quit") => {
                        proxy.send_event(WindowCommand::Quit).ok();
                        should_break = true;
                    }
                    _ => {}
                }
                if should_break {
                    return;
                }
            }
        } else {
            eprintln!("{}", line);
        }
    });

    let _ = child.wait();

    if let Some(path) = cleanup_path {
        let _ = std::fs::remove_file(path);
    }
}

/// Run user JS using an external runtime (Bun / Node / Deno).
/// Communicates via stderr IPC protocol (Rust → child) and stdin (WebView IPC → child).
pub fn run(
    runtime_name: &str,
    script_path: &str,
    proxy: EventLoopProxy<WindowCommand>,
    ipc_rx: Receiver<String>,
) {
    run_script_file(runtime_name, PathBuf::from(script_path), None, proxy, ipc_rx);
}

pub fn run_embedded(
    runtime_name: &str,
    script_code: &str,
    proxy: EventLoopProxy<WindowCommand>,
    ipc_rx: Receiver<String>,
) {
    let script_path = embedded_script_path(runtime_name);
    std::fs::write(&script_path, script_code).expect("Failed to write embedded runtime script");
    run_script_file(runtime_name, script_path.clone(), Some(script_path), proxy, ipc_rx);
}
