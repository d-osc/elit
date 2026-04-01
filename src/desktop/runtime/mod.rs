use serde::{Deserialize, Serialize};

/// Window configuration passed from JavaScript via createWindow({...})
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct WindowOptions {
    pub title:        Option<String>,
    pub url:          Option<String>,
    pub html:         Option<String>,
    pub width:        Option<u32>,
    pub height:       Option<u32>,
    pub x:            Option<i32>,
    pub y:            Option<i32>,
    pub resizable:    Option<bool>,
    pub transparent:  Option<bool>,
    pub decorations:  Option<bool>,   // false = frameless window
    pub always_on_top: Option<bool>,
    pub maximized:    Option<bool>,
    pub center:       Option<bool>,   // center on screen at startup
    pub minimizable:  Option<bool>,
    pub maximizable:  Option<bool>,
    pub closable:     Option<bool>,
    pub skip_taskbar: Option<bool>,
    pub devtools:     Option<bool>,
    pub icon:         Option<String>,
    /// When set, WebView uses a custom `app://` protocol proxied to this
    /// localhost port — the real port is never exposed to WebView JS code.
    pub proxy_port:   Option<u16>,
    /// Rust injects this header into every proxied request so Express can
    /// reject requests that arrive without it (e.g. from a browser).
    pub proxy_secret: Option<String>,
    /// Named pipe (Windows: \\.\pipe\...) or Unix socket path.
    /// No TCP port is created — truly app-internal, unreachable from browsers.
    pub proxy_pipe:   Option<String>,
}

/// Commands sent between the JS thread and the main (event loop) thread.
#[derive(Debug, Clone)]
#[allow(dead_code)]
pub enum WindowCommand {
    /// Internal: start the runtime thread once the event loop is fully active.
    StartRuntime,
    /// JS called createWindow({...})
    Create(WindowOptions),
    /// Backend JS called windowEval(code) → run JS inside the WebView
    Eval(String),
    /// WebView sent an IPC message → forward to backend JS handler
    IpcMessage(String),

    // ── Window control commands ──────────────────────────────────────────────
    Minimize,
    Maximize,
    Unmaximize,
    SetTitle(String),
    /// Start window drag — used for custom frameless titlebars
    Drag,
    SetPosition(i32, i32),
    SetSize(u32, u32),
    SetAlwaysOnTop(bool),

    Quit,
}

#[cfg(feature = "runtime-quickjs")]
pub mod quickjs;

#[cfg(feature = "runtime-external")]
pub mod external;
