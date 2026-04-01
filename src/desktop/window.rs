use std::borrow::Cow;
use std::collections::HashMap;
use std::io::{Read, Write as IoWrite};
use std::net::TcpStream;
use std::panic::{self, AssertUnwindSafe};
use std::sync::{
    Arc,
    atomic::{AtomicBool, Ordering},
};

use tao::{
    dpi::{LogicalPosition, LogicalSize, PhysicalPosition},
    event::{Event, WindowEvent},
    event_loop::{ControlFlow, EventLoopBuilder, EventLoopProxy, EventLoopWindowTarget},
    window::{Icon, Window, WindowBuilder, WindowId},
};
#[cfg(target_os = "windows")]
use tao::platform::windows::WindowBuilderExtWindows;
use wry::WebViewBuilder;

use crate::icon::load_icon_bitmap;
use crate::runtime::{WindowCommand, WindowOptions};

// ── HTTP proxy (used by custom protocol) ─────────────────────────────────────

/// Core HTTP proxy — works over any Read+Write stream (TCP socket or pipe).
fn do_proxy<S: Read + IoWrite>(
    mut stream: S,
    host: &str,
    secret: Option<&str>,
    req: &http::Request<Vec<u8>>,
) -> http::Response<Cow<'static, [u8]>> {
    let method = req.method().as_str();
    let pq = req.uri().path_and_query().map(|p| p.as_str()).unwrap_or("/");
    let body = req.body();

    let mut raw = format!(
        "{} {} HTTP/1.1\r\nHost: {}\r\nConnection: close\r\n",
        method, pq, host
    );
    for (k, v) in req.headers() {
        let kl = k.as_str();
        if !matches!(kl, "host" | "connection") {
            if let Ok(vs) = v.to_str() {
                raw.push_str(&format!("{}: {}\r\n", kl, vs));
            }
        }
    }
    if let Some(s) = secret {
        raw.push_str(&format!("X-WAG-Internal: {}\r\n", s));
    }
    if !body.is_empty() {
        raw.push_str(&format!("Content-Length: {}\r\n", body.len()));
    }
    raw.push_str("\r\n");

    if stream.write_all(raw.as_bytes()).is_err() || stream.write_all(body).is_err() {
        return err_response(502, "proxy: write failed");
    }

    let mut bytes = Vec::new();
    if stream.read_to_end(&mut bytes).is_err() {
        return err_response(502, "proxy: read failed");
    }

    parse_http_response(bytes)
}

/// Forward an `app://` request to `127.0.0.1:port` via TCP.
fn proxy_http(
    port: u16,
    secret: Option<&str>,
    req: &http::Request<Vec<u8>>,
) -> http::Response<Cow<'static, [u8]>> {
    let Ok(stream) = TcpStream::connect(format!("127.0.0.1:{}", port)) else {
        return err_response(502, "proxy: connect failed");
    };
    stream.set_read_timeout(Some(std::time::Duration::from_secs(30))).ok();
    do_proxy(stream, &format!("127.0.0.1:{}", port), secret, req)
}

/// Forward an `app://` request via named pipe (Windows) or Unix socket.
/// No TCP port exists — completely unreachable from any browser.
fn proxy_pipe_req(
    path: &str,
    secret: Option<&str>,
    req: &http::Request<Vec<u8>>,
) -> http::Response<Cow<'static, [u8]>> {
    #[cfg(target_os = "windows")]
    {
        let Ok(stream) = std::fs::OpenOptions::new().read(true).write(true).open(path) else {
            return err_response(502, "proxy: pipe connect failed");
        };
        return do_proxy(stream, "localhost", secret, req);
    }
    #[cfg(not(target_os = "windows"))]
    {
        let Ok(stream) = std::os::unix::net::UnixStream::connect(path) else {
            return err_response(502, "proxy: socket connect failed");
        };
        return do_proxy(stream, "localhost", secret, req);
    }
}

fn err_response(status: u16, msg: &'static str) -> http::Response<Cow<'static, [u8]>> {
    http::Response::builder()
        .status(status)
        .body(Cow::Borrowed(msg.as_bytes()))
        .unwrap()
}

fn parse_http_response(raw: Vec<u8>) -> http::Response<Cow<'static, [u8]>> {
    let sep = raw.windows(4).position(|w| w == b"\r\n\r\n").unwrap_or(raw.len());
    let hdr_src = std::str::from_utf8(&raw[..sep]).unwrap_or("");
    let raw_body = raw.get(sep + 4..).unwrap_or_default();

    let mut lines = hdr_src.lines();
    let status: u16 = lines.next()
        .and_then(|l| l.split_whitespace().nth(1))
        .and_then(|s| s.parse().ok())
        .unwrap_or(200);

    let mut is_chunked = false;
    let mut builder = http::Response::builder().status(status);
    for line in lines {
        if let Some((k, v)) = line.split_once(": ") {
            let kl = k.to_lowercase();
            if kl == "transfer-encoding" && v.to_lowercase().contains("chunked") {
                is_chunked = true;
                continue; // strip Transfer-Encoding from response to WebView
            }
            if matches!(kl.as_str(), "connection" | "keep-alive") { continue; }
            builder = builder.header(k, v);
        }
    }

    let body = if is_chunked {
        decode_chunked(raw_body)
    } else {
        raw_body.to_vec()
    };

    builder.body(Cow::Owned(body)).unwrap()
}

/// Decode HTTP/1.1 chunked transfer encoding.
fn decode_chunked(data: &[u8]) -> Vec<u8> {
    let mut out = Vec::new();
    let mut pos = 0;
    while pos < data.len() {
        let nl = data[pos..].windows(2).position(|w| w == b"\r\n").map(|p| pos + p);
        let Some(nl) = nl else { break };
        let hex = std::str::from_utf8(&data[pos..nl]).unwrap_or("0");
        let size = usize::from_str_radix(hex.split(';').next().unwrap_or("0").trim(), 16).unwrap_or(0);
        if size == 0 { break; }
        pos = nl + 2;
        if pos + size > data.len() { break; }
        out.extend_from_slice(&data[pos..pos + size]);
        pos += size + 2; // skip trailing \r\n
    }
    out
}

// ── Window / WebView builders ─────────────────────────────────────────────────

fn build_window(
    opts: &WindowOptions,
    target: &EventLoopWindowTarget<WindowCommand>,
) -> Window {
    let title        = opts.title.clone().unwrap_or_else(|| "elit".into());
    let width        = opts.width.unwrap_or(1024);
    let height       = opts.height.unwrap_or(768);
    let resizable    = opts.resizable.unwrap_or(true);
    let transparent  = opts.transparent.unwrap_or(false);
    let decorations  = opts.decorations.unwrap_or(true);
    let always_on_top = opts.always_on_top.unwrap_or(false);

    let icon = opts.icon.as_ref().and_then(|path| {
        load_icon_bitmap(path.as_ref())
            .ok()
            .and_then(|bitmap| {
                let (rgba, width, height) = bitmap.into_rgba();
                Icon::from_rgba(rgba, width, height).ok()
            })
    });

    let mut wb = WindowBuilder::new()
        .with_title(&title)
        .with_inner_size(LogicalSize::new(width, height))
        .with_resizable(resizable)
        .with_transparent(transparent)
        .with_decorations(decorations)
        .with_always_on_top(always_on_top);

    if let (Some(x), Some(y)) = (opts.x, opts.y) {
        wb = wb.with_position(LogicalPosition::new(x, y));
    }
    if opts.maximized.unwrap_or(false) { wb = wb.with_maximized(true); }
    if let Some(false) = opts.minimizable { wb = wb.with_minimizable(false); }
    if let Some(false) = opts.maximizable { wb = wb.with_maximizable(false); }
    if let Some(false) = opts.closable    { wb = wb.with_closable(false); }

    #[cfg(target_os = "windows")]
    if opts.skip_taskbar.unwrap_or(false) {
        wb = wb.with_skip_taskbar(true);
    }

    if let Some(icon) = icon { wb = wb.with_window_icon(Some(icon)); }

    let window = wb.build(target).expect("Failed to build window");

    if opts.center.unwrap_or(false) {
        if let Some(monitor) = window.current_monitor() {
            let ms = monitor.size();
            let ws = window.outer_size();
            let x = (ms.width as i32 - ws.width as i32) / 2;
            let y = (ms.height as i32 - ws.height as i32) / 2;
            window.set_outer_position(PhysicalPosition::new(x.max(0), y.max(0)));
        }
    }

    window
}

fn build_webview(
    opts: &WindowOptions,
    window: &Window,
    ipc_tx: std::sync::mpsc::Sender<String>,
    proxy: EventLoopProxy<WindowCommand>,
) -> wry::WebView {
    let mut builder = WebViewBuilder::new();

    // ── Custom protocol proxy ─────────────────────────────────────────────────
    // proxy_pipe → named pipe / Unix socket (no TCP port at all)
    // proxy_port → TCP on 127.0.0.1 with secret-header guard
    if let Some(pipe) = opts.proxy_pipe.clone() {
        let secret: Option<String> = opts.proxy_secret.clone();
        builder = builder.with_custom_protocol("app".into(), move |_wv_id, req| {
            proxy_pipe_req(&pipe, secret.as_deref(), &req)
        });
    } else if let Some(port) = opts.proxy_port {
        let secret: Option<String> = opts.proxy_secret.clone();
        builder = builder.with_custom_protocol("app".into(), move |_wv_id, req| {
            proxy_http(port, secret.as_deref(), &req)
        });
    }

    // ── Content ───────────────────────────────────────────────────────────────
    builder = if opts.proxy_pipe.is_some() || opts.proxy_port.is_some() {
        builder.with_url("app://localhost/")
    } else if let Some(url) = &opts.url {
        builder.with_url(url)
    } else if let Some(html) = &opts.html {
        builder.with_html(html)
    } else {
        builder.with_html(
            r#"<!DOCTYPE html><html><head><meta charset="utf-8">
<style>body{margin:0;display:flex;align-items:center;justify-content:center;
height:100vh;font-family:sans-serif;background:#0f0f0f;color:#fff;}
h1{font-weight:300;letter-spacing:.2em;}</style></head>
<body><h1>elit</h1></body></html>"#,
        )
    };

    if opts.devtools.unwrap_or(false) {
        builder = builder.with_devtools(true);
    }

    // ── IPC ───────────────────────────────────────────────────────────────────
    // "drag" is intercepted directly here to preserve mousedown timing.
    builder = builder.with_ipc_handler(move |req| {
        let body = req.body().to_string();
        if body.contains("\"drag\"") {
            if let Ok(v) = serde_json::from_str::<serde_json::Value>(&body) {
                if v["cmd"].as_str() == Some("drag") {
                    proxy.send_event(WindowCommand::Drag).ok();
                    return;
                }
            }
        }
        ipc_tx.send(body).ok();
    });

    builder.build(window).expect("Failed to build WebView")
}

// ── Event loop ────────────────────────────────────────────────────────────────

pub fn run<F>(launch_runtime: F)
where
    F: FnOnce(EventLoopProxy<WindowCommand>, std::sync::mpsc::Receiver<String>)
        + Send
        + 'static,
{
    let event_loop = EventLoopBuilder::<WindowCommand>::with_user_event().build();
    let proxy = event_loop.create_proxy();
    let (ipc_tx, ipc_rx) = std::sync::mpsc::channel::<String>();
    let has_window = Arc::new(AtomicBool::new(false));
    let mut launch_runtime = Some(launch_runtime);
    let mut ipc_rx = Some(ipc_rx);
    let mut runtime_queued = false;
    let mut runtime_started = false;

    let mut store: HashMap<WindowId, (Window, wry::WebView)> = HashMap::new();

    event_loop.run(move |event, target, control_flow| {
        *control_flow = ControlFlow::Wait;

        if !runtime_queued {
            runtime_queued = true;
            proxy.send_event(WindowCommand::StartRuntime).ok();
        }

        match event {
            Event::UserEvent(WindowCommand::StartRuntime) => {
                if runtime_started {
                    return;
                }

                runtime_started = true;
                let proxy_rt = proxy.clone();
                let has_window_rt = has_window.clone();
                let launch_runtime = launch_runtime.take().expect("runtime launcher missing");
                let ipc_rx = ipc_rx.take().expect("ipc receiver missing");

                std::thread::spawn(move || {
                    let result = panic::catch_unwind(AssertUnwindSafe(|| launch_runtime(proxy_rt.clone(), ipc_rx)));
                    if result.is_err() {
                        eprintln!("elit desktop runtime crashed before opening a window");
                        std::thread::sleep(std::time::Duration::from_millis(100));
                        if !has_window_rt.load(Ordering::SeqCst) {
                            proxy_rt.send_event(WindowCommand::Quit).ok();
                        }
                    }
                });
            }
            Event::UserEvent(WindowCommand::Create(opts)) => {
                has_window.store(true, Ordering::SeqCst);
                let tx = ipc_tx.clone();
                let px = proxy.clone();
                let window  = build_window(&opts, target);
                let webview = build_webview(&opts, &window, tx, px);
                store.insert(window.id(), (window, webview));
            }
            Event::UserEvent(WindowCommand::Eval(code)) => {
                for (_, (_, wv)) in &store { wv.evaluate_script(&code).ok(); }
            }
            Event::UserEvent(WindowCommand::IpcMessage(_)) => {}
            Event::UserEvent(WindowCommand::Minimize) => {
                for (_, (w, _)) in &store { w.set_minimized(true); }
            }
            Event::UserEvent(WindowCommand::Maximize) => {
                for (_, (w, _)) in &store { w.set_maximized(true); }
            }
            Event::UserEvent(WindowCommand::Unmaximize) => {
                for (_, (w, _)) in &store { w.set_maximized(false); }
            }
            Event::UserEvent(WindowCommand::SetTitle(title)) => {
                for (_, (w, _)) in &store { w.set_title(&title); }
            }
            Event::UserEvent(WindowCommand::Drag) => {
                for (_, (w, _)) in &store { w.drag_window().ok(); }
            }
            Event::UserEvent(WindowCommand::SetPosition(x, y)) => {
                for (_, (w, _)) in &store { w.set_outer_position(LogicalPosition::new(x, y)); }
            }
            Event::UserEvent(WindowCommand::SetSize(w, h)) => {
                for (_, (win, _)) in &store { win.set_inner_size(LogicalSize::new(w, h)); }
            }
            Event::UserEvent(WindowCommand::SetAlwaysOnTop(v)) => {
                for (_, (w, _)) in &store { w.set_always_on_top(v); }
            }
            Event::UserEvent(WindowCommand::Quit) => {
                *control_flow = ControlFlow::Exit;
            }
            Event::WindowEvent { window_id, event: WindowEvent::CloseRequested, .. } => {
                store.remove(&window_id);
                if store.is_empty() { *control_flow = ControlFlow::Exit; }
            }
            _ => {}
        }
    });
}
