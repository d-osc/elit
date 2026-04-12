use rquickjs::{Context, Function, Runtime};
use tao::event_loop::EventLoopProxy;

use crate::runtime::{WindowCommand, WindowOptions};

/// Shim injected before user code — provides the public JS API.
const SHIM: &str = r#"
// Internal dispatcher → calls Rust via __wagDispatch(json)
const __wag = obj => __wagDispatch(JSON.stringify(obj));

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
"#;

pub fn run(
    code: &str,
    proxy: EventLoopProxy<WindowCommand>,
    ipc_rx: std::sync::mpsc::Receiver<String>,
) {
    let rt  = Runtime::new().expect("QuickJS: failed to create runtime");
    let ctx = Context::full(&rt).expect("QuickJS: failed to create context");

    ctx.with(|ctx| {
        let globals = ctx.globals();
        let p = proxy.clone();

        // Single dispatcher — handles all commands via JSON
        globals
            .set(
                "__wagDispatch",
                Function::new(ctx.clone(), move |json: String| {
                    dispatch(&p, &json);
                }),
            )
            .expect("QuickJS: failed to register __wagDispatch");

        ctx.eval::<(), _>(SHIM).expect("QuickJS: shim failed");
        ctx.eval::<(), _>(code).expect("QuickJS: user script failed");
    });

    // Poll IPC messages from the WebView → call __onMessage(msg)
    for msg in ipc_rx {
        ctx.with(|ctx| {
            let globals = ctx.globals();
            if let Ok(handler) = globals.get::<_, rquickjs::Function>("__onMessage") {
                handler.call::<(String,), ()>((msg,)).ok();
            }
        });
    }
}

/// Parse a JSON command object and send the appropriate WindowCommand.
fn dispatch(proxy: &EventLoopProxy<WindowCommand>, json: &str) {
    let Ok(msg) = serde_json::from_str::<serde_json::Value>(json) else { return };

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
        Some("minimize")    => { proxy.send_event(WindowCommand::Minimize).ok(); }
        Some("maximize")    => { proxy.send_event(WindowCommand::Maximize).ok(); }
        Some("unmaximize")  => { proxy.send_event(WindowCommand::Unmaximize).ok(); }
        Some("drag")        => { proxy.send_event(WindowCommand::Drag).ok(); }
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
        Some("quit") => { proxy.send_event(WindowCommand::Quit).ok(); }
        _ => {}
    }
}
