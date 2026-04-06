use std::fs::{OpenOptions, create_dir_all};
use std::io::Write;
use std::path::{Path, PathBuf};

#[cfg(not(target_os = "macos"))]
use tao::dpi::LogicalSize;
#[cfg(not(target_os = "macos"))]
use tao::event::{Event, WindowEvent};
#[cfg(not(target_os = "macos"))]
use tao::event_loop::{ControlFlow, EventLoopBuilder};
#[cfg(not(target_os = "macos"))]
use tao::window::WindowBuilder as TaoWindowBuilder;
#[cfg(not(target_os = "macos"))]
use wry::WebViewBuilder;

use crate::icon::load_icon_bitmap;
use eframe::egui::{self, Color32, Pos2};
use image::GenericImageView;
use serde_json::{Map, Value};

use super::app_models::{DesktopControlEventData, DesktopInteraction};
use super::{NativeDesktopColor, NativeElementNode};

pub(crate) fn configure_native_context_rendering(ctx: &egui::Context) {
    ctx.tessellation_options_mut(|options| {
        options.round_text_to_pixels = true;
    });
}

pub(crate) fn load_window_icon(path: Option<&str>) -> Option<egui::IconData> {
    let path = Path::new(path?);
    let bitmap = load_icon_bitmap(path)
        .map_err(|error| {
            eprintln!("failed to load native desktop icon '{}': {}", path.display(), error);
            error
        })
        .ok()?;
    let (rgba, width, height) = bitmap.into_rgba();
    Some(egui::IconData { rgba, width, height })
}

pub(crate) fn format_number(value: f64) -> String {
    if value.fract().abs() < f64::EPSILON {
        format!("{value:.0}")
    } else {
        value.to_string()
    }
}

pub(crate) fn color32_from_native_color(color: &NativeDesktopColor) -> Color32 {
    Color32::from_rgba_unmultiplied(
        color.red.clamp(0.0, 255.0).round() as u8,
        color.green.clamp(0.0, 255.0).round() as u8,
        color.blue.clamp(0.0, 255.0).round() as u8,
        (color.alpha.clamp(0.0, 1.0) * 255.0).round() as u8,
    )
}

pub(crate) fn visible_color(color: Option<&NativeDesktopColor>) -> Option<Color32> {
    let resolved = color.map(color32_from_native_color)?;
    (resolved.a() > 0).then_some(resolved)
}

pub(crate) fn value_as_string(value: &Value) -> Option<String> {
    match value {
        Value::String(text) => Some(text.clone()),
        Value::Number(number) => Some(number.to_string()),
        Value::Bool(boolean) => Some(boolean.to_string()),
        _ => None,
    }
}

pub(crate) fn parse_native_bool(value: Option<&Value>) -> bool {
    match value {
        Some(Value::Bool(value)) => *value,
        Some(Value::Number(value)) => value.as_i64().map(|number| number != 0).unwrap_or(false),
        Some(Value::String(text)) => matches!(
            text.trim().to_ascii_lowercase().as_str(),
            "true" | "1" | "yes" | "on" | "checked" | "selected" | "disabled" | "readonly" | "multiple"
        ),
        _ => false,
    }
}

pub(crate) fn resolve_surface_source(node: &NativeElementNode) -> Option<String> {
    ["source", "src", "data", "destination"]
        .iter()
        .find_map(|key| node.props.get(*key).and_then(value_as_string))
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty())
}

pub(crate) fn resolve_route_from_payload(payload: Option<&Value>) -> Option<String> {
    match payload {
        Some(Value::String(route)) if !route.trim().is_empty() => Some(route.trim().to_string()),
        Some(Value::Object(payload)) => payload
            .get("route")
            .and_then(Value::as_str)
            .map(str::trim)
            .filter(|route| !route.is_empty())
            .map(str::to_string),
        _ => None,
    }
}

pub(crate) fn strip_markup_tags(input: &str) -> String {
    let mut output = String::new();
    let mut inside_tag = false;

    for character in input.chars() {
        match character {
            '<' => {
                inside_tag = true;
                if !output.ends_with(' ') {
                    output.push(' ');
                }
            }
            '>' => {
                inside_tag = false;
            }
            _ if !inside_tag => output.push(character),
            _ => {}
        }
    }

    output.split_whitespace().collect::<Vec<_>>().join(" ")
}

pub(crate) fn is_probably_inline_html(source: &str) -> bool {
    let trimmed = source.trim_start();
    trimmed.starts_with('<') || trimmed.contains("<html") || trimmed.contains("<body")
}

pub(crate) fn truncate_preview(text: &str, max_chars: usize) -> String {
    let trimmed = text.trim();
    if trimmed.chars().count() <= max_chars {
        return trimmed.to_string();
    }

    let truncated = trimmed.chars().take(max_chars).collect::<String>();
    format!("{truncated}...")
}

pub(crate) fn cubic_bezier_point(start: Pos2, control1: Pos2, control2: Pos2, end: Pos2, t: f32) -> Pos2 {
    let inverse_t = 1.0 - t;
    let inverse_t2 = inverse_t * inverse_t;
    let inverse_t3 = inverse_t2 * inverse_t;
    let t2 = t * t;
    let t3 = t2 * t;

    Pos2::new(
        inverse_t3 * start.x
            + 3.0 * inverse_t2 * t * control1.x
            + 3.0 * inverse_t * t2 * control2.x
            + t3 * end.x,
        inverse_t3 * start.y
            + 3.0 * inverse_t2 * t * control1.y
            + 3.0 * inverse_t * t2 * control2.y
            + t3 * end.y,
    )
}

pub(crate) fn is_external_destination(destination: &str) -> bool {
    let normalized = destination.trim().to_ascii_lowercase();
    normalized.starts_with("http://")
        || normalized.starts_with("https://")
        || normalized.starts_with("mailto:")
        || normalized.starts_with("tel:")
        || normalized.starts_with("//")
}

pub(crate) fn resolve_resource_path(resource_base_dir: Option<&Path>, source: &str) -> Option<PathBuf> {
    let trimmed = source.trim();
    if trimmed.is_empty() || is_external_destination(trimmed) || trimmed.starts_with("data:") {
        return None;
    }

    let candidate = PathBuf::from(trimmed);
    if candidate.is_absolute() {
        return candidate.exists().then_some(candidate);
    }

    if let Some(base_dir) = resource_base_dir {
        let joined = base_dir.join(trimmed);
        if joined.exists() {
            return Some(joined);
        }
    }

    if let Ok(current_dir) = std::env::current_dir() {
        let joined = current_dir.join(trimmed);
        if joined.exists() {
            return Some(joined);
        }
    }

    candidate.exists().then_some(candidate)
}

#[cfg(not(target_os = "macos"))]
pub(crate) fn spawn_native_surface_window(
    title: String,
    initial_width: f64,
    initial_height: f64,
    url: Option<String>,
    html: Option<String>,
) -> Result<(), String> {
    std::thread::Builder::new()
        .name(String::from("elit-native-surface"))
        .spawn(move || {
            let event_loop = EventLoopBuilder::<()>::with_user_event().build();
            let window = TaoWindowBuilder::new()
                .with_title(&title)
                .with_inner_size(LogicalSize::new(initial_width, initial_height))
                .build(&event_loop)
                .expect("Failed to build native surface window");

            let mut builder = WebViewBuilder::new();
            builder = if let Some(url) = url.as_deref() {
                builder.with_url(url)
            } else if let Some(html) = html.as_deref() {
                builder.with_html(html)
            } else {
                builder.with_html("<!DOCTYPE html><html><body></body></html>")
            };

            let _webview = builder.build(&window).expect("Failed to build native surface webview");
            event_loop.run(move |event, _target, control_flow| {
                *control_flow = ControlFlow::Wait;
                if let Event::WindowEvent {
                    event: WindowEvent::CloseRequested,
                    ..
                } = event
                {
                    *control_flow = ControlFlow::Exit;
                }
            });
        })
        .map(|_| ())
        .map_err(|error| error.to_string())
}

#[cfg(target_os = "macos")]
pub(crate) fn spawn_native_surface_window(
    _title: String,
    _initial_width: f64,
    _initial_height: f64,
    _url: Option<String>,
    _html: Option<String>,
) -> Result<(), String> {
    Err(String::from("native surface windows are not available inside the macOS desktop renderer yet"))
}

pub(crate) fn resolve_output_path(path: &str) -> PathBuf {
    let candidate = PathBuf::from(path.trim());
    if candidate.is_absolute() {
        return candidate;
    }

    if let Ok(current_dir) = std::env::current_dir() {
        return current_dir.join(&candidate);
    }

    if let Ok(current_exe) = std::env::current_exe() {
        if let Some(parent) = current_exe.parent() {
            return parent.join(&candidate);
        }
    }

    candidate
}

pub(crate) fn normalize_jsonish_value(value: Value) -> Value {
    match value {
        Value::String(text) => serde_json::from_str::<Value>(&text).unwrap_or(Value::String(text)),
        other => other,
    }
}

pub(crate) fn write_interaction_output(file_path: Option<&Path>, interaction_json: &str) -> Result<(), String> {
    let Some(file_path) = file_path else {
        return Ok(());
    };

    if let Some(parent) = file_path.parent() {
        create_dir_all(parent)
            .map_err(|error| format!("create interaction output dir failed for {}: {error}", parent.display()))?;
    }

    let mut file = OpenOptions::new()
        .create(true)
        .append(true)
        .open(file_path)
        .map_err(|error| format!("open interaction output failed for {}: {error}", file_path.display()))?;
    writeln!(file, "{interaction_json}")
        .map_err(|error| format!("write interaction output failed for {}: {error}", file_path.display()))
}

pub(crate) fn load_color_image(path: &Path) -> Result<egui::ColorImage, String> {
    let extension = path
        .extension()
        .and_then(|value| value.to_str())
        .map(|value| value.to_ascii_lowercase());

    if extension.as_deref() == Some("svg") {
        use resvg::{tiny_skia, usvg};

        let svg = std::fs::read(path)
            .map_err(|error| format!("read SVG failed for {}: {error}", path.display()))?;
        let options = usvg::Options::default();
        let tree = usvg::Tree::from_data(&svg, &options)
            .map_err(|error| format!("parse SVG failed for {}: {error}", path.display()))?;
        let size = tree.size();
        let width = size.width().ceil().max(1.0) as u32;
        let height = size.height().ceil().max(1.0) as u32;
        let mut pixmap = tiny_skia::Pixmap::new(width, height)
            .ok_or_else(|| format!("allocate SVG pixmap failed for {}", path.display()))?;
        resvg::render(&tree, tiny_skia::Transform::default(), &mut pixmap.as_mut());
        let rgba = pixmap.take();
        return Ok(egui::ColorImage::from_rgba_unmultiplied(
            [width as usize, height as usize],
            &rgba,
        ));
    }

    let image = image::open(path)
        .map_err(|error| format!("decode image failed for {}: {error}", path.display()))?;
    let rgba = image.to_rgba8();
    let (width, height) = image.dimensions();
    Ok(egui::ColorImage::from_rgba_unmultiplied(
        [width as usize, height as usize],
        &rgba.into_raw(),
    ))
}

pub(crate) fn build_event_payload(
    node: &NativeElementNode,
    event_name: &str,
    input_type: Option<String>,
    event_data: &DesktopControlEventData,
) -> Value {
    let mut payload = Map::new();
    payload.insert(String::from("event"), Value::String(String::from(event_name)));
    payload.insert(String::from("sourceTag"), Value::String(node.source_tag.clone()));

    if let Some(input_type) = input_type {
        payload.insert(String::from("inputType"), Value::String(input_type));
    }
    if let Some(value) = &event_data.value {
        payload.insert(String::from("value"), Value::String(value.clone()));
    }
    if let Some(values) = &event_data.values {
        payload.insert(
            String::from("values"),
            Value::Array(values.iter().cloned().map(Value::String).collect()),
        );
    }
    if let Some(checked) = event_data.checked {
        payload.insert(String::from("checked"), Value::Bool(checked));
    }
    if let Some(detail) = node.props.get("nativePayload") {
        payload.insert(String::from("detail"), normalize_jsonish_value(detail.clone()));
    }

    Value::Object(payload)
}

pub(crate) fn resolve_native_route(node: &NativeElementNode) -> Option<String> {
    if let Some(route) = node
        .props
        .get("nativeRoute")
        .and_then(Value::as_str)
        .map(str::trim)
        .filter(|value| !value.is_empty())
    {
        return Some(route.to_string());
    }

    let destination = node
        .props
        .get("destination")
        .and_then(Value::as_str)
        .map(str::trim)
        .filter(|value| !value.is_empty());

    destination
        .filter(|destination| !is_external_destination(destination))
        .map(str::to_string)
}

pub(crate) fn resolve_interaction(
    node: &NativeElementNode,
    default_action: Option<String>,
    payload_override: Option<Value>,
) -> Option<DesktopInteraction> {
    let action = node
        .props
        .get("nativeAction")
        .and_then(Value::as_str)
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(str::to_string)
        .or(default_action);
    let route = resolve_native_route(node);
    let payload = payload_override
        .or_else(|| node.props.get("nativePayload").cloned())
        .map(normalize_jsonish_value);

    let interaction = DesktopInteraction { action, route, payload };
    (!interaction.is_empty()).then_some(interaction)
}

pub(crate) fn resolve_control_event_input_type(node: &NativeElementNode) -> Option<String> {
    match node.component.as_str() {
        "Picker" => Some(if parse_native_bool(node.props.get("multiple")) {
            String::from("select-multiple")
        } else {
            String::from("select-one")
        }),
        "Toggle" => node
            .props
            .get("type")
            .and_then(Value::as_str)
            .map(str::trim)
            .filter(|value| !value.is_empty())
            .map(|value| value.to_ascii_lowercase())
            .or_else(|| Some(String::from("checkbox"))),
        "Slider" => Some(String::from("range")),
        _ => {
            if node.source_tag == "textarea" {
                Some(String::from("text"))
            } else {
                node.props
                    .get("type")
                    .and_then(Value::as_str)
                    .map(str::trim)
                    .filter(|value| !value.is_empty())
                    .map(|value| value.to_ascii_lowercase())
            }
        }
    }
}

pub(crate) fn should_dispatch_control_event(node: &NativeElementNode, event_name: &str) -> bool {
    if !node.events.iter().any(|candidate| candidate == event_name) {
        return false;
    }

    !(event_name == "input"
        && node.props.get("nativeBinding").is_some()
        && node.events.iter().all(|candidate| candidate == "input"))
}

pub(crate) fn control_event_action(node: &NativeElementNode, event_name: &str) -> String {
    node.props
        .get("nativeAction")
        .and_then(Value::as_str)
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(str::to_string)
        .unwrap_or_else(|| format!("elit.event.{event_name}"))
}

pub(crate) fn parse_points_value(value: &Value) -> Vec<Pos2> {
    match value {
        Value::Array(points) => points
            .iter()
            .filter_map(|point| {
                let object = point.as_object()?;
                let x = object.get("x").and_then(Value::as_f64)? as f32;
                let y = object.get("y").and_then(Value::as_f64)? as f32;
                Some(Pos2::new(x, y))
            })
            .collect(),
        Value::String(text) => text
            .split_whitespace()
            .filter_map(|entry| {
                let mut parts = entry.split(',');
                let x = parts.next()?.parse::<f32>().ok()?;
                let y = parts.next()?.parse::<f32>().ok()?;
                Some(Pos2::new(x, y))
            })
            .collect(),
        _ => Vec::new(),
    }
}

pub(crate) fn parse_view_box(value: Option<&Value>) -> Option<(f32, f32, f32, f32)> {
    let view_box = value?.as_str()?;
    let parts = view_box
        .split_whitespace()
        .filter_map(|part| part.parse::<f32>().ok())
        .collect::<Vec<_>>();
    (parts.len() == 4).then_some((parts[0], parts[1], parts[2], parts[3]))
}