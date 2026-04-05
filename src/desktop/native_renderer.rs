use std::collections::{HashMap, HashSet};
use std::fs::{OpenOptions, create_dir_all};
use std::io::Write;
use std::path::{Path, PathBuf};
use std::sync::Arc;

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
#[cfg(target_os = "windows")]
use wry::{
    Rect as WryRect,
    WebView,
    dpi::{LogicalPosition as WryLogicalPosition, LogicalSize as WryLogicalSize},
};

use crate::icon::load_icon_bitmap;
use eframe::egui::{self, Color32, RichText};
use egui::{Align, Align2, CornerRadius, Direction, Layout, Margin, Pos2, Rect, Sense, StrokeKind, Vec2};
use image::GenericImageView;
use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};

#[derive(Debug, Clone, Deserialize)]
pub struct NativeDesktopPayload {
    pub window: NativeDesktopWindowOptions,
    #[serde(default, rename = "resourceBaseDir")]
    pub resource_base_dir: Option<String>,
    #[serde(default, rename = "interactionOutput")]
    pub interaction_output: Option<NativeDesktopInteractionOutput>,
    pub tree: NativeTree,
}

#[derive(Debug, Clone, Deserialize)]
pub struct NativeDesktopWindowOptions {
    pub title: String,
    pub width: f32,
    pub height: f32,
    pub center: bool,
    pub icon: Option<String>,
    #[serde(default, rename = "autoClose")]
    pub auto_close: bool,
}

#[derive(Debug, Clone, Deserialize)]
pub struct NativeDesktopInteractionOutput {
    pub file: Option<String>,
    #[serde(default)]
    pub stdout: bool,
    #[serde(default, rename = "emitReady")]
    pub emit_ready: bool,
}

#[derive(Debug, Clone, Deserialize)]
struct NativeDesktopColor {
    red: f32,
    green: f32,
    blue: f32,
    alpha: f32,
}

#[derive(Debug, Clone, Deserialize)]
struct NativeDesktopVectorViewport {
    #[serde(rename = "minX")]
    min_x: f32,
    #[serde(rename = "minY")]
    min_y: f32,
    width: f32,
    height: f32,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(tag = "kind")]
enum NativeDesktopPathCommand {
    #[serde(rename = "moveTo")]
    MoveTo { x: f32, y: f32 },
    #[serde(rename = "lineTo")]
    LineTo { x: f32, y: f32 },
    #[serde(rename = "cubicTo")]
    CubicTo {
        #[serde(rename = "control1X")]
        control1_x: f32,
        #[serde(rename = "control1Y")]
        control1_y: f32,
        #[serde(rename = "control2X")]
        control2_x: f32,
        #[serde(rename = "control2Y")]
        control2_y: f32,
        x: f32,
        y: f32,
    },
    #[serde(rename = "close")]
    Close,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(tag = "kind")]
enum NativeDesktopVectorShape {
    #[serde(rename = "circle")]
    Circle {
        cx: f32,
        cy: f32,
        r: f32,
        fill: Option<NativeDesktopColor>,
        stroke: Option<NativeDesktopColor>,
        #[serde(rename = "strokeWidth")]
        stroke_width: Option<f32>,
    },
    #[serde(rename = "rect")]
    Rect {
        x: f32,
        y: f32,
        width: f32,
        height: f32,
        rx: Option<f32>,
        ry: Option<f32>,
        fill: Option<NativeDesktopColor>,
        stroke: Option<NativeDesktopColor>,
        #[serde(rename = "strokeWidth")]
        stroke_width: Option<f32>,
    },
    #[serde(rename = "ellipse")]
    Ellipse {
        cx: f32,
        cy: f32,
        rx: f32,
        ry: f32,
        fill: Option<NativeDesktopColor>,
        stroke: Option<NativeDesktopColor>,
        #[serde(rename = "strokeWidth")]
        stroke_width: Option<f32>,
    },
    #[serde(rename = "path")]
    Path {
        commands: Vec<NativeDesktopPathCommand>,
        fill: Option<NativeDesktopColor>,
        stroke: Option<NativeDesktopColor>,
        #[serde(rename = "strokeWidth")]
        stroke_width: Option<f32>,
    },
}

#[derive(Debug, Clone, Deserialize)]
struct NativeDesktopVectorSpec {
    viewport: NativeDesktopVectorViewport,
    #[serde(rename = "intrinsicWidth")]
    intrinsic_width: f32,
    #[serde(rename = "intrinsicHeight")]
    intrinsic_height: f32,
    shapes: Vec<NativeDesktopVectorShape>,
}

#[derive(Debug, Clone, Deserialize)]
struct NativeDesktopCanvasSpec {
    #[serde(rename = "intrinsicWidth")]
    intrinsic_width: f32,
    #[serde(rename = "intrinsicHeight")]
    intrinsic_height: f32,
    #[serde(default)]
    viewport: Option<NativeDesktopVectorViewport>,
    #[serde(default)]
    shapes: Vec<NativeDesktopVectorShape>,
}

impl NativeDesktopCanvasSpec {
    fn as_vector_spec(&self) -> NativeDesktopVectorSpec {
        NativeDesktopVectorSpec {
            viewport: self.viewport.clone().unwrap_or(NativeDesktopVectorViewport {
                min_x: 0.0,
                min_y: 0.0,
                width: self.intrinsic_width.max(1.0),
                height: self.intrinsic_height.max(1.0),
            }),
            intrinsic_width: self.intrinsic_width,
            intrinsic_height: self.intrinsic_height,
            shapes: self.shapes.clone(),
        }
    }
}

#[derive(Debug, Clone, Deserialize)]
pub struct NativeTree {
    #[serde(rename = "platform")]
    pub _platform: String,
    pub roots: Vec<NativeNode>,
    #[serde(default, rename = "stateDescriptors")]
    pub state_descriptors: Vec<NativeStateDescriptor>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(tag = "kind")]
pub enum NativeNode {
    #[serde(rename = "text")]
    Text(NativeTextNode),
    #[serde(rename = "element")]
    Element(NativeElementNode),
}

#[derive(Debug, Clone, Deserialize)]
pub struct NativeTextNode {
    pub value: String,
    #[serde(default, rename = "stateId")]
    pub state_id: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct NativeElementNode {
    pub component: String,
    #[serde(rename = "sourceTag")]
    pub source_tag: String,
    #[serde(default)]
    pub props: HashMap<String, Value>,
    #[serde(default)]
    pub events: Vec<String>,
    #[serde(default)]
    pub children: Vec<NativeNode>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct NativeStateDescriptor {
    pub id: String,
    #[serde(rename = "type")]
    pub value_type: String,
    #[serde(rename = "initialValue")]
    pub initial_value: Value,
}

#[derive(Debug, Clone, Deserialize)]
struct NativeBindingReference {
    id: String,
    #[serde(rename = "kind")]
    _kind: String,
    #[serde(rename = "valueType")]
    value_type: String,
}

#[derive(Debug, Clone)]
enum DesktopStateValue {
    String(String),
    Number(f64),
    Boolean(bool),
    StringArray(Vec<String>),
}

impl DesktopStateValue {
    fn from_descriptor(descriptor: &NativeStateDescriptor) -> Self {
        match descriptor.value_type.as_str() {
            "number" => Self::Number(descriptor.initial_value.as_f64().unwrap_or_default()),
            "boolean" => Self::Boolean(descriptor.initial_value.as_bool().unwrap_or(false)),
            "string-array" => Self::StringArray(
                descriptor
                    .initial_value
                    .as_array()
                    .map(|items| {
                        items
                            .iter()
                            .filter_map(|item| item.as_str().map(|value| value.to_string()))
                            .collect()
                    })
                    .unwrap_or_default(),
            ),
            _ => Self::String(descriptor.initial_value.as_str().unwrap_or_default().to_string()),
        }
    }

    fn as_display_text(&self) -> String {
        match self {
            Self::String(value) => value.clone(),
            Self::Number(value) => format_number(*value),
            Self::Boolean(value) => value.to_string(),
            Self::StringArray(values) => values.join(", "),
        }
    }

    fn as_text_input_value(&self) -> String {
        match self {
            Self::String(value) => value.clone(),
            Self::Number(value) => value.to_string(),
            Self::Boolean(value) => value.to_string(),
            Self::StringArray(values) => values.join(", "),
        }
    }

    fn as_bool(&self) -> bool {
        matches!(self, Self::Boolean(true))
    }
}

#[derive(Debug, Clone, PartialEq, Serialize)]
struct DesktopInteraction {
    action: Option<String>,
    route: Option<String>,
    payload: Option<Value>,
}

impl DesktopInteraction {
    fn is_empty(&self) -> bool {
        self.action.is_none() && self.route.is_none() && self.payload.is_none()
    }

    fn summary(&self) -> String {
        let mut parts = Vec::new();
        if let Some(action) = &self.action {
            parts.push(format!("action={action}"));
        }
        if let Some(route) = &self.route {
            parts.push(format!("route={route}"));
        }
        if let Some(payload) = &self.payload {
            parts.push(format!("payload={payload}"));
        }

        if parts.is_empty() {
            String::from("idle")
        } else {
            parts.join(" | ")
        }
    }
}

#[derive(Debug, Clone, Default)]
struct DesktopControlEventData {
    value: Option<String>,
    values: Option<Vec<String>>,
    checked: Option<bool>,
}

#[derive(Debug, Clone, PartialEq)]
struct PickerOptionData {
    label: String,
    value: String,
    disabled: bool,
    selected: bool,
}

#[derive(Debug, Clone, Default)]
struct ResolvedDesktopInteractionOutput {
    file: Option<PathBuf>,
    stdout: bool,
    emit_ready: bool,
}

#[derive(Debug, Clone, Default)]
struct DesktopNavigationState {
    history: Vec<String>,
    index: Option<usize>,
}

impl DesktopNavigationState {
    fn current_route(&self) -> Option<&str> {
        self.index.and_then(|index| self.history.get(index)).map(String::as_str)
    }

    fn can_go_back(&self) -> bool {
        self.index.is_some()
    }

    fn can_go_forward(&self) -> bool {
        match self.index {
            Some(index) => index + 1 < self.history.len(),
            None => !self.history.is_empty(),
        }
    }

    fn navigate_to(&mut self, route: impl Into<String>) -> bool {
        let route = route.into().trim().to_string();
        if route.is_empty() {
            return false;
        }

        if let Some(index) = self.index {
            if index + 1 < self.history.len() {
                self.history.truncate(index + 1);
            }
        } else {
            self.history.clear();
        }

        self.history.push(route);
        self.index = Some(self.history.len() - 1);
        true
    }

    fn go_back(&mut self) -> bool {
        match self.index {
            Some(index) if index > 0 => {
                self.index = Some(index - 1);
                true
            }
            Some(_) => {
                self.index = None;
                true
            }
            None => false,
        }
    }

    fn go_forward(&mut self) -> bool {
        match self.index {
            Some(index) if index + 1 < self.history.len() => {
                self.index = Some(index + 1);
                true
            }
            None if !self.history.is_empty() => {
                self.index = Some(0);
                true
            }
            _ => false,
        }
    }

    fn clear(&mut self) {
        self.index = None;
    }
}

pub fn run(payload: NativeDesktopPayload) {
    let title = payload.window.title.clone();
    let mut viewport = egui::ViewportBuilder::default()
        .with_title(title.clone())
        .with_inner_size([payload.window.width, payload.window.height]);

    if let Some(icon) = load_window_icon(payload.window.icon.as_deref()) {
        viewport = viewport.with_icon(icon);
    }

    let native_options = eframe::NativeOptions {
        viewport,
        centered: payload.window.center,
        ..Default::default()
    };

    let result = eframe::run_native(
        &title,
        native_options,
        Box::new(move |creation_context| {
            configure_native_context_rendering(&creation_context.egui_ctx);
            let mut app = DesktopNativeApp::new(payload.clone());
            app.ensure_fonts_loaded(&creation_context.egui_ctx);
            Ok(Box::new(app))
        }),
    );

    if let Err(error) = result {
        eprintln!("failed to launch native desktop runtime: {}", error);
        std::process::exit(1);
    }
}

fn configure_native_context_rendering(ctx: &egui::Context) {
    ctx.tessellation_options_mut(|options| {
        options.round_text_to_pixels = true;
    });
}

fn load_window_icon(path: Option<&str>) -> Option<egui::IconData> {
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

fn format_number(value: f64) -> String {
    if value.fract().abs() < f64::EPSILON {
        format!("{:.0}", value)
    } else {
        value.to_string()
    }
}

fn color32_from_native_color(color: &NativeDesktopColor) -> Color32 {
    Color32::from_rgba_unmultiplied(
        color.red.clamp(0.0, 255.0).round() as u8,
        color.green.clamp(0.0, 255.0).round() as u8,
        color.blue.clamp(0.0, 255.0).round() as u8,
        (color.alpha.clamp(0.0, 1.0) * 255.0).round() as u8,
    )
}

fn visible_color(color: Option<&NativeDesktopColor>) -> Option<Color32> {
    let resolved = color.map(color32_from_native_color)?;
    (resolved.a() > 0).then_some(resolved)
}

fn value_as_string(value: &Value) -> Option<String> {
    match value {
        Value::String(text) => Some(text.clone()),
        Value::Number(number) => Some(number.to_string()),
        Value::Bool(boolean) => Some(boolean.to_string()),
        _ => None,
    }
}

fn parse_native_bool(value: Option<&Value>) -> bool {
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

fn resolve_surface_source(node: &NativeElementNode) -> Option<String> {
    ["source", "src", "data", "destination"]
        .iter()
        .find_map(|key| node.props.get(*key).and_then(value_as_string))
        .map(|value| value.trim().to_string())
        .filter(|value| !value.is_empty())
}

fn resolve_route_from_payload(payload: Option<&Value>) -> Option<String> {
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

fn strip_markup_tags(input: &str) -> String {
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

    output
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ")
}

fn is_probably_inline_html(source: &str) -> bool {
    let trimmed = source.trim_start();
    trimmed.starts_with('<') || trimmed.contains("<html") || trimmed.contains("<body")
}

fn truncate_preview(text: &str, max_chars: usize) -> String {
    let trimmed = text.trim();
    if trimmed.chars().count() <= max_chars {
        return trimmed.to_string();
    }

    let truncated = trimmed.chars().take(max_chars).collect::<String>();
    format!("{truncated}...")
}

fn cubic_bezier_point(start: Pos2, control1: Pos2, control2: Pos2, end: Pos2, t: f32) -> Pos2 {
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

fn is_external_destination(destination: &str) -> bool {
    let normalized = destination.trim().to_ascii_lowercase();
    normalized.starts_with("http://")
        || normalized.starts_with("https://")
        || normalized.starts_with("mailto:")
        || normalized.starts_with("tel:")
        || normalized.starts_with("//")
}

fn resolve_resource_path(resource_base_dir: Option<&Path>, source: &str) -> Option<PathBuf> {
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
fn spawn_native_surface_window(title: String, initial_width: f64, initial_height: f64, url: Option<String>, html: Option<String>) -> Result<(), String> {
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
fn spawn_native_surface_window(_title: String, _initial_width: f64, _initial_height: f64, _url: Option<String>, _html: Option<String>) -> Result<(), String> {
    Err(String::from("native surface windows are not available inside the macOS desktop renderer yet"))
}

fn resolve_output_path(path: &str) -> PathBuf {
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

fn normalize_jsonish_value(value: Value) -> Value {
    match value {
        Value::String(text) => serde_json::from_str::<Value>(&text).unwrap_or(Value::String(text)),
        other => other,
    }
}

fn write_interaction_output(file_path: Option<&Path>, interaction_json: &str) -> Result<(), String> {
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

fn load_color_image(path: &Path) -> Result<egui::ColorImage, String> {
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

fn build_event_payload(
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

fn resolve_native_route(node: &NativeElementNode) -> Option<String> {
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

fn resolve_interaction(
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

fn resolve_control_event_input_type(node: &NativeElementNode) -> Option<String> {
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

fn should_dispatch_control_event(node: &NativeElementNode, event_name: &str) -> bool {
    if !node.events.iter().any(|candidate| candidate == event_name) {
        return false;
    }

    !(event_name == "input"
        && node.props.get("nativeBinding").is_some()
        && node.events.iter().all(|candidate| candidate == "input"))
}

fn control_event_action(node: &NativeElementNode, event_name: &str) -> String {
    node.props
        .get("nativeAction")
        .and_then(Value::as_str)
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(str::to_string)
        .unwrap_or_else(|| format!("elit.event.{event_name}"))
}

fn parse_points_value(value: &Value) -> Vec<Pos2> {
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

fn parse_view_box(value: Option<&Value>) -> Option<(f32, f32, f32, f32)> {
    let view_box = value?.as_str()?;
    let parts = view_box
        .split_whitespace()
        .filter_map(|part| part.parse::<f32>().ok())
        .collect::<Vec<_>>();
    (parts.len() == 4).then_some((parts[0], parts[1], parts[2], parts[3]))
}

#[derive(Clone, Copy, Default)]
struct DesktopPseudoState {
    enabled: bool,
    disabled: bool,
    hovered: bool,
    active: bool,
    focused: bool,
    focus_within: bool,
    checked: bool,
    selected: bool,
    read_only: bool,
    read_write: bool,
    placeholder_shown: bool,
    invalid: bool,
    valid: bool,
}

#[derive(Clone, Copy, Default)]
struct DesktopBoxEdges {
    top: f32,
    right: f32,
    bottom: f32,
    left: f32,
}

#[derive(Clone, Copy, Default)]
struct DesktopGridTrackSpec {
    fixed_width: Option<f32>,
    min_width: f32,
    flex_weight: f32,
}

#[derive(Clone, Default)]
struct DesktopGridLayoutSpec {
    column_widths: Vec<f32>,
}

#[derive(Clone, Default)]
struct DesktopWidgetStateStyles {
    inactive: Option<Map<String, Value>>,
    hovered: Option<Map<String, Value>>,
    active: Option<Map<String, Value>>,
    focus: Option<Map<String, Value>>,
    disabled: Option<Map<String, Value>>,
}

impl DesktopBoxEdges {
    fn is_zero(self) -> bool {
        self.top.abs() < f32::EPSILON
            && self.right.abs() < f32::EPSILON
            && self.bottom.abs() < f32::EPSILON
            && self.left.abs() < f32::EPSILON
    }

    fn to_margin(self) -> Margin {
        Margin {
            left: round_margin_value(self.left),
            right: round_margin_value(self.right),
            top: round_margin_value(self.top),
            bottom: round_margin_value(self.bottom),
        }
    }

    fn average_horizontal(self) -> f32 {
        ((self.left + self.right) / 2.0).max(0.0)
    }

    fn average_vertical(self) -> f32 {
        ((self.top + self.bottom) / 2.0).max(0.0)
    }
}

#[derive(Clone, Copy, Default)]
struct DesktopCornerRadii {
    top_left: f32,
    top_right: f32,
    bottom_right: f32,
    bottom_left: f32,
}

#[derive(Clone, Copy, PartialEq, Eq)]
enum DesktopFontVariant {
    Regular,
    Bold,
    Italic,
    BoldItalic,
}

impl DesktopFontVariant {
    fn suffix(self) -> &'static str {
        match self {
            Self::Regular => "regular",
            Self::Bold => "bold",
            Self::Italic => "italic",
            Self::BoldItalic => "bold-italic",
        }
    }
}

#[derive(Clone, Default)]
struct DesktopFontFaces {
    regular: Option<Arc<str>>,
    bold: Option<Arc<str>>,
    italic: Option<Arc<str>>,
    bold_italic: Option<Arc<str>>,
}

impl DesktopFontFaces {
    fn set(&mut self, variant: DesktopFontVariant, family_name: Arc<str>) {
        match variant {
            DesktopFontVariant::Regular => self.regular = Some(family_name),
            DesktopFontVariant::Bold => self.bold = Some(family_name),
            DesktopFontVariant::Italic => self.italic = Some(family_name),
            DesktopFontVariant::BoldItalic => self.bold_italic = Some(family_name),
        }
    }

    fn has_any(&self) -> bool {
        self.regular.is_some() || self.bold.is_some() || self.italic.is_some() || self.bold_italic.is_some()
    }

    fn resolve_font_family(&self, want_bold: bool, want_italic: bool) -> Option<(egui::FontFamily, bool, bool)> {
        let resolved = if want_bold && want_italic {
            self.bold_italic
                .as_ref()
                .map(|family| (family.clone(), true, true))
                .or_else(|| self.bold.as_ref().map(|family| (family.clone(), true, false)))
                .or_else(|| self.italic.as_ref().map(|family| (family.clone(), false, true)))
                .or_else(|| self.regular.as_ref().map(|family| (family.clone(), false, false)))
        } else if want_bold {
            self.bold
                .as_ref()
                .map(|family| (family.clone(), true, false))
                .or_else(|| self.regular.as_ref().map(|family| (family.clone(), false, false)))
        } else if want_italic {
            self.italic
                .as_ref()
                .map(|family| (family.clone(), false, true))
                .or_else(|| self.regular.as_ref().map(|family| (family.clone(), false, false)))
        } else {
            self.regular
                .as_ref()
                .map(|family| (family.clone(), false, false))
                .or_else(|| self.bold.as_ref().map(|family| (family.clone(), true, false)))
                .or_else(|| self.italic.as_ref().map(|family| (family.clone(), false, true)))
                .or_else(|| self.bold_italic.as_ref().map(|family| (family.clone(), true, true)))
        }?;

        Some((egui::FontFamily::Name(resolved.0), resolved.1, resolved.2))
    }
}

impl DesktopCornerRadii {
    fn to_corner_radius(self) -> CornerRadius {
        CornerRadius {
            nw: round_corner_value(self.top_left),
            ne: round_corner_value(self.top_right),
            se: round_corner_value(self.bottom_right),
            sw: round_corner_value(self.bottom_left),
        }
    }
}

fn round_margin_value(value: f32) -> i8 {
    value.round().clamp(i8::MIN as f32, i8::MAX as f32) as i8
}

fn round_corner_value(value: f32) -> u8 {
    value.round().clamp(0.0, u8::MAX as f32) as u8
}

#[derive(Clone, Copy)]
struct CssMeasureContext {
    basis: Option<f32>,
    viewport_width: Option<f32>,
    viewport_height: Option<f32>,
}

impl CssMeasureContext {
    fn from_basis(basis: Option<f32>) -> Self {
        Self {
            basis,
            viewport_width: basis,
            viewport_height: basis,
        }
    }
}

#[derive(Clone, Copy, Debug, PartialEq)]
struct DesktopGradientStop {
    position: f32,
    color: Color32,
}

#[derive(Clone, Debug, PartialEq)]
struct DesktopLinearGradient {
    angle_deg: f32,
    stops: Vec<DesktopGradientStop>,
}

#[derive(Clone, Debug, PartialEq)]
struct DesktopRadialGradient {
    stops: Vec<DesktopGradientStop>,
    /// horizontal center as fraction of bounding box width (0.0 = left, 0.5 = center, 1.0 = right)
    center_x: f32,
    /// vertical center as fraction of bounding box height (0.0 = top, 0.5 = center, 1.0 = bottom)
    center_y: f32,
}

#[derive(Clone, Debug, Default)]
struct DesktopCssFilter {
    brightness: f32,   // 1.0 = normal
    contrast: f32,     // 1.0 = normal
    grayscale: f32,    // 0.0 = no change, 1.0 = full
    invert: f32,       // 0.0 = no invert, 1.0 = full invert
    sepia: f32,        // 0.0 = no sepia, 1.0 = full sepia
    saturate: f32,     // 1.0 = normal
    hue_rotate_deg: f32,
    blur: f32,
}

impl DesktopCssFilter {
    fn new() -> Self {
        Self {
            brightness: 1.0,
            contrast: 1.0,
            grayscale: 0.0,
            invert: 0.0,
            sepia: 0.0,
            saturate: 1.0,
            hue_rotate_deg: 0.0,
            blur: 0.0,
        }
    }

    #[allow(dead_code)]
    fn has_color_effect(&self) -> bool {
        (self.brightness - 1.0).abs() > 0.001
            || (self.contrast - 1.0).abs() > 0.001
            || self.grayscale > 0.001
            || self.invert > 0.001
            || self.sepia > 0.001
            || (self.saturate - 1.0).abs() > 0.001
            || self.hue_rotate_deg.abs() > 0.5
    }

    fn apply(&self, color: Color32) -> Color32 {
        let r = color.r() as f32 / 255.0;
        let g = color.g() as f32 / 255.0;
        let b = color.b() as f32 / 255.0;
        let a = color.a() as f32 / 255.0;

        // Brightness
        let (mut r, mut g, mut b) = (r * self.brightness, g * self.brightness, b * self.brightness);

        // Contrast: f(c) = (c - 0.5) * contrast + 0.5
        let c = self.contrast;
        r = (r - 0.5) * c + 0.5;
        g = (g - 0.5) * c + 0.5;
        b = (b - 0.5) * c + 0.5;

        // Grayscale
        let lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        r = r + (lum - r) * self.grayscale;
        g = g + (lum - g) * self.grayscale;
        b = b + (lum - b) * self.grayscale;

        // Sepia matrix (CSS spec)
        let s = self.sepia;
        let sr = r * (0.393 + 0.607 * (1.0 - s)) + g * (0.769 - 0.769 * (1.0 - s)) + b * (0.189 - 0.189 * (1.0 - s));
        let sg = r * (0.349 - 0.349 * (1.0 - s)) + g * (0.686 + 0.314 * (1.0 - s)) + b * (0.168 - 0.168 * (1.0 - s));
        let sb = r * (0.272 - 0.272 * (1.0 - s)) + g * (0.534 - 0.534 * (1.0 - s)) + b * (0.131 + 0.869 * (1.0 - s));
        r = sr; g = sg; b = sb;

        // Saturate
        let lum2 = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        r = lum2 + (r - lum2) * self.saturate;
        g = lum2 + (g - lum2) * self.saturate;
        b = lum2 + (b - lum2) * self.saturate;

        // Invert
        r = r + (1.0 - 2.0 * r) * self.invert;
        g = g + (1.0 - 2.0 * g) * self.invert;
        b = b + (1.0 - 2.0 * b) * self.invert;

        // Hue rotate (CSS spec matrix approximation)
        if self.hue_rotate_deg.abs() > 0.5 {
            let rad = self.hue_rotate_deg.to_radians();
            let cos_a = rad.cos();
            let sin_a = rad.sin();
            let nr = r * (0.213 + cos_a * 0.787 - sin_a * 0.213)
                + g * (0.715 - cos_a * 0.715 - sin_a * 0.715)
                + b * (0.072 - cos_a * 0.072 + sin_a * 0.928);
            let ng = r * (0.213 - cos_a * 0.213 + sin_a * 0.143)
                + g * (0.715 + cos_a * 0.285 + sin_a * 0.140)
                + b * (0.072 - cos_a * 0.072 - sin_a * 0.283);
            let nb = r * (0.213 - cos_a * 0.213 - sin_a * 0.787)
                + g * (0.715 - cos_a * 0.715 + sin_a * 0.715)
                + b * (0.072 + cos_a * 0.928 + sin_a * 0.072);
            r = nr; g = ng; b = nb;
        }

        let to_u8 = |v: f32| (v.clamp(0.0, 1.0) * 255.0).round() as u8;
        Color32::from_rgba_unmultiplied(to_u8(r), to_u8(g), to_u8(b), (a * 255.0).round() as u8)
    }
}

#[derive(Clone, Debug, Default)]
struct DesktopCssTransform {
    translate_x: f32,
    translate_y: f32,
    scale_x: f32,   // 1.0 = no scale
    scale_y: f32,   // 1.0 = no scale
    rotate_deg: f32,
}

impl DesktopCssTransform {
    fn identity() -> Self {
        Self { translate_x: 0.0, translate_y: 0.0, scale_x: 1.0, scale_y: 1.0, rotate_deg: 0.0 }
    }

    #[allow(dead_code)]
    fn has_any(&self) -> bool {
        self.translate_x.abs() > f32::EPSILON
            || self.translate_y.abs() > f32::EPSILON
            || (self.scale_x - 1.0).abs() > 0.001
            || (self.scale_y - 1.0).abs() > 0.001
            || self.rotate_deg.abs() > 0.01
    }
}

#[derive(Clone, Debug)]
struct DesktopTextShadow {
    offset_x: f32,
    offset_y: f32,
    #[allow(dead_code)]
    blur_radius: f32,
    color: Color32,
}

#[derive(Default, Clone, Copy, Debug, PartialEq, Eq)]
struct DesktopOverflowBehavior {
    horizontal_scroll: bool,
    vertical_scroll: bool,
    horizontal_clip: bool,
    vertical_clip: bool,
}

impl DesktopOverflowBehavior {
    fn has_scroll(self) -> bool {
        self.horizontal_scroll || self.vertical_scroll
    }

    fn has_clip(self) -> bool {
        self.horizontal_clip || self.vertical_clip
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
enum DesktopSurfaceWindowKind {
    WebView,
    Video,
    Audio,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
enum DesktopEmbeddedSurfaceVisibility {
    Hidden,
    Clipped,
    Visible,
}

#[derive(Clone, Debug, PartialEq, Eq)]
enum DesktopEmbeddedSurfaceContent {
    Url(String),
    Html(String),
}

#[derive(Clone, Debug)]
struct DesktopEmbeddedSurfaceRequest {
    kind: DesktopSurfaceWindowKind,
    title: String,
    rect: Rect,
    content: DesktopEmbeddedSurfaceContent,
    focus_requested: bool,
}

#[cfg(target_os = "windows")]
struct DesktopEmbeddedSurface {
    kind: DesktopSurfaceWindowKind,
    content: DesktopEmbeddedSurfaceContent,
    webview: WebView,
}

struct DesktopNativeApp {
    payload: NativeDesktopPayload,
    base_title: String,
    resource_base_dir: Option<PathBuf>,
    interaction_output: ResolvedDesktopInteractionOutput,
    navigation: DesktopNavigationState,
    viewport_size: Vec2,
    font_aliases: HashMap<String, DesktopFontFaces>,
    fonts_initialized: bool,
    state_values: HashMap<String, DesktopStateValue>,
    image_textures: HashMap<String, egui::TextureHandle>,
    local_multi_picker_values: HashMap<String, Vec<String>>,
    local_picker_values: HashMap<String, String>,
    local_slider_values: HashMap<String, f64>,
    local_text_inputs: HashMap<String, String>,
    local_toggles: HashMap<String, bool>,
    list_marker_stack: Vec<bool>,
    last_interaction: Option<DesktopInteraction>,
    embedded_surface_requests: HashMap<String, DesktopEmbeddedSurfaceRequest>,
    #[cfg(target_os = "windows")]
    embedded_surfaces: HashMap<String, DesktopEmbeddedSurface>,
    pending_auto_close: bool,
    ready_emitted: bool,
}

impl DesktopNativeApp {
    fn new(payload: NativeDesktopPayload) -> Self {
        let interaction_output = payload
            .interaction_output
            .as_ref()
            .map(|output| ResolvedDesktopInteractionOutput {
                file: output
                    .file
                    .as_deref()
                    .map(str::trim)
                    .filter(|value| !value.is_empty())
                    .map(resolve_output_path),
                stdout: output.stdout,
                emit_ready: output.emit_ready,
            })
            .unwrap_or_default();
        let state_values = payload
            .tree
            .state_descriptors
            .iter()
            .map(|descriptor| (descriptor.id.clone(), DesktopStateValue::from_descriptor(descriptor)))
            .collect();

        Self {
            base_title: payload.window.title.clone(),
            resource_base_dir: payload.resource_base_dir.as_ref().map(PathBuf::from),
            interaction_output,
            navigation: DesktopNavigationState::default(),
            viewport_size: Vec2::new(payload.window.width.max(1.0), payload.window.height.max(1.0)),
            font_aliases: HashMap::new(),
            fonts_initialized: false,
            pending_auto_close: payload.window.auto_close,
            payload,
            state_values,
            image_textures: HashMap::new(),
            local_multi_picker_values: HashMap::new(),
            local_picker_values: HashMap::new(),
            local_slider_values: HashMap::new(),
            local_text_inputs: HashMap::new(),
            local_toggles: HashMap::new(),
            list_marker_stack: Vec::new(),
            last_interaction: None,
            embedded_surface_requests: HashMap::new(),
            #[cfg(target_os = "windows")]
            embedded_surfaces: HashMap::new(),
            ready_emitted: false,
        }
    }

    fn resolve_text_node_value(&self, node: &NativeTextNode) -> String {
        node.state_id
            .as_ref()
            .and_then(|state_id| self.state_values.get(state_id))
            .map(DesktopStateValue::as_display_text)
            .unwrap_or_else(|| node.value.clone())
    }

    fn collect_text_content(&self, node: &NativeNode) -> String {
        match node {
            NativeNode::Text(text_node) => self.resolve_text_node_value(text_node),
            NativeNode::Element(element_node) => element_node
                .children
                .iter()
                .map(|child| self.collect_text_content(child))
                .collect::<Vec<_>>()
                .join(""),
        }
    }

    fn get_style_map<'a>(&self, node: &'a NativeElementNode) -> Option<&'a Map<String, Value>> {
        node.props.get("style")?.as_object()
    }

    fn get_style_variant_map<'a>(&self, node: &'a NativeElementNode, variant: &str) -> Option<&'a Map<String, Value>> {
        node.props.get("desktopStyleVariants")?.as_object()?.get(variant)?.as_object()
    }

    fn parse_boolish(value: Option<&Value>) -> Option<bool> {
        match value {
            Some(Value::Bool(boolean)) => Some(*boolean),
            Some(Value::Number(number)) => number.as_f64().map(|numeric| numeric != 0.0),
            Some(Value::String(text)) => match text.trim().to_ascii_lowercase().as_str() {
                "true" | "1" | "yes" | "on" => Some(true),
                "false" | "0" | "no" | "off" => Some(false),
                _ => None,
            },
            _ => None,
        }
    }

    fn base_pseudo_state(&self, node: &NativeElementNode) -> DesktopPseudoState {
        let disabled = self.is_disabled(node);
        let read_only = self.is_read_only(node);
        let explicit_invalid = Self::parse_boolish(node.props.get("aria-invalid"));
        let value_is_empty = node
            .props
            .get("value")
            .and_then(value_as_string)
            .map(|value| value.trim().is_empty())
            .unwrap_or(true);

        DesktopPseudoState {
            enabled: !disabled,
            disabled,
            checked: parse_native_bool(node.props.get("checked"))
                || matches!(Self::parse_boolish(node.props.get("aria-checked")), Some(true))
                || matches!(Self::parse_boolish(node.props.get("aria-pressed")), Some(true)),
            selected: parse_native_bool(node.props.get("selected"))
                || matches!(Self::parse_boolish(node.props.get("aria-selected")), Some(true)),
            read_only,
            read_write: !read_only,
            placeholder_shown: self.resolve_prop_string(node, "placeholder").is_some() && value_is_empty,
            invalid: explicit_invalid.unwrap_or(false),
            valid: explicit_invalid == Some(false),
            ..Default::default()
        }
    }

    fn resolve_style_map_with_state(&self, node: &NativeElementNode, state: DesktopPseudoState) -> Option<Map<String, Value>> {
        const VARIANT_ORDER: [&str; 13] = [
            "enabled",
            "readWrite",
            "readOnly",
            "placeholderShown",
            "valid",
            "invalid",
            "checked",
            "selected",
            "hover",
            "focusWithin",
            "focus",
            "active",
            "disabled",
        ];

        let mut resolved = self.get_style_map(node).cloned().unwrap_or_default();
        let mut has_any_style = !resolved.is_empty();

        for variant in VARIANT_ORDER {
            let is_active = match variant {
                "enabled" => state.enabled,
                "readWrite" => state.read_write,
                "readOnly" => state.read_only,
                "placeholderShown" => state.placeholder_shown,
                "valid" => state.valid,
                "invalid" => state.invalid,
                "checked" => state.checked,
                "selected" => state.selected,
                "hover" => state.hovered,
                "focusWithin" => state.focus_within || state.focused,
                "focus" => state.focused,
                "active" => state.active,
                "disabled" => state.disabled,
                _ => false,
            };

            if !is_active {
                continue;
            }

            if let Some(variant_style) = self.get_style_variant_map(node, variant) {
                for (key, value) in variant_style {
                    resolved.insert(key.clone(), value.clone());
                }
                has_any_style = true;
            }
        }

        has_any_style.then_some(resolved)
    }

    fn get_binding_reference(&self, node: &NativeElementNode) -> Option<NativeBindingReference> {
        serde_json::from_value(node.props.get("nativeBinding")?.clone()).ok()
    }

    fn parse_css_number_text(text: &str) -> Option<f32> {
        let digits: String = text
            .chars()
            .take_while(|character| character.is_ascii_digit() || matches!(character, '.' | '-'))
            .collect();
        digits.parse::<f32>().ok()
    }

    fn parse_css_measure_text_with_context(text: &str, context: CssMeasureContext) -> Option<f32> {
        let trimmed = text.trim();
        if trimmed.is_empty() {
            return None;
        }

        if let Some(inner) = trimmed.strip_prefix("clamp(").and_then(|text| text.strip_suffix(')')) {
            let parts = Self::split_css_top_level(inner, ',');
            if parts.len() == 3 {
                let min = Self::parse_css_measure_text_with_context(parts[0].trim(), context);
                let preferred = Self::parse_css_measure_text_with_context(parts[1].trim(), context).or(min);
                let max = Self::parse_css_measure_text_with_context(parts[2].trim(), context).or(preferred).or(min);

                return match (min, preferred, max) {
                    (Some(min), Some(preferred), Some(max)) => Some(preferred.clamp(min, max)),
                    (Some(min), Some(preferred), None) => Some(preferred.max(min)),
                    (Some(min), None, Some(max)) => Some(min.min(max)),
                    (Some(min), None, None) => Some(min),
                    (None, Some(preferred), Some(max)) => Some(preferred.min(max)),
                    (None, Some(preferred), None) => Some(preferred),
                    (None, None, Some(max)) => Some(max),
                    (None, None, None) => None,
                };
            }
        }

        if let Some(percent_text) = trimmed.strip_suffix('%') {
            let percent = Self::parse_css_number_text(percent_text)?;
            return Some(
                context
                    .basis
                    .map(|basis| (basis * percent / 100.0).max(0.0))
                    .unwrap_or(percent),
            );
        }

        if let Some(rem_text) = trimmed.strip_suffix("rem") {
            return Self::parse_css_number_text(rem_text).map(|value| value * 16.0);
        }

        if let Some(em_text) = trimmed.strip_suffix("em") {
            return Self::parse_css_number_text(em_text).map(|value| value * 16.0);
        }

        if let Some(px_text) = trimmed.strip_suffix("px") {
            return Self::parse_css_number_text(px_text);
        }

        if let Some(vw_text) = trimmed.strip_suffix("vw") {
            let viewport_units = Self::parse_css_number_text(vw_text)?;
            return Some(
                context
                    .viewport_width
                    .or(context.basis)
                    .map(|viewport| (viewport * viewport_units / 100.0).max(0.0))
                    .unwrap_or(viewport_units),
            );
        }

        if let Some(vh_text) = trimmed.strip_suffix("vh") {
            let viewport_units = Self::parse_css_number_text(vh_text)?;
            return Some(
                context
                    .viewport_height
                    .or(context.basis)
                    .map(|viewport| (viewport * viewport_units / 100.0).max(0.0))
                    .unwrap_or(viewport_units),
            );
        }

        if let Some(vmin_text) = trimmed.strip_suffix("vmin") {
            let viewport_units = Self::parse_css_number_text(vmin_text)?;
            let viewport = match (context.viewport_width, context.viewport_height) {
                (Some(width), Some(height)) => Some(width.min(height)),
                (Some(width), None) => Some(width),
                (None, Some(height)) => Some(height),
                (None, None) => context.basis,
            };
            return Some(viewport.map(|viewport| (viewport * viewport_units / 100.0).max(0.0)).unwrap_or(viewport_units));
        }

        if let Some(vmax_text) = trimmed.strip_suffix("vmax") {
            let viewport_units = Self::parse_css_number_text(vmax_text)?;
            let viewport = match (context.viewport_width, context.viewport_height) {
                (Some(width), Some(height)) => Some(width.max(height)),
                (Some(width), None) => Some(width),
                (None, Some(height)) => Some(height),
                (None, None) => context.basis,
            };
            return Some(viewport.map(|viewport| (viewport * viewport_units / 100.0).max(0.0)).unwrap_or(viewport_units));
        }

        Self::parse_css_number_text(trimmed)
    }

    fn parse_css_measure_text(text: &str, basis: Option<f32>) -> Option<f32> {
        Self::parse_css_measure_text_with_context(text, CssMeasureContext::from_basis(basis))
    }

    fn parse_css_number(value: Option<&Value>) -> Option<f32> {
        match value {
            Some(Value::Number(number)) => number.as_f64().map(|value| value as f32),
            Some(Value::String(text)) => Self::parse_css_measure_text(text, None),
            _ => None,
        }
    }

    fn parse_css_size_against_basis(value: Option<&Value>, basis: f32) -> Option<f32> {
        match value {
            Some(Value::String(text)) => Self::parse_css_measure_text(text, Some(basis)),
            Some(Value::Number(number)) => number.as_f64().map(|value| value as f32),
            _ => None,
        }
    }

    fn css_measure_context(&self, basis: Option<f32>) -> CssMeasureContext {
        CssMeasureContext {
            basis,
            viewport_width: Some(self.viewport_size.x.max(1.0)),
            viewport_height: Some(self.viewport_size.y.max(1.0)),
        }
    }

    fn parse_css_number_with_viewport(&self, value: Option<&Value>) -> Option<f32> {
        match value {
            Some(Value::Number(number)) => number.as_f64().map(|value| value as f32),
            Some(Value::String(text)) => Self::parse_css_measure_text_with_context(text, self.css_measure_context(None)),
            _ => None,
        }
    }

    fn parse_css_size_against_basis_with_viewport(&self, value: Option<&Value>, basis: f32) -> Option<f32> {
        match value {
            Some(Value::String(text)) => Self::parse_css_measure_text_with_context(text, self.css_measure_context(Some(basis))),
            Some(Value::Number(number)) => number.as_f64().map(|value| value as f32),
            _ => None,
        }
    }

    fn canonical_font_family_name(name: &str) -> String {
        name
            .trim()
            .trim_matches(|character| character == '"' || character == '\'')
            .split_whitespace()
            .collect::<Vec<_>>()
            .join(" ")
            .to_ascii_lowercase()
    }

    fn parse_css_font_family_list(text: &str) -> Vec<String> {
        Self::split_css_top_level(text, ',')
            .into_iter()
            .map(|entry| entry.trim().trim_matches(|character| character == '"' || character == '\'').to_string())
            .filter(|entry| !entry.is_empty())
            .collect()
    }

    fn candidate_system_font_paths(family: &str, variant: DesktopFontVariant) -> Vec<PathBuf> {
        let canonical = Self::canonical_font_family_name(family);

        #[cfg(target_os = "windows")]
        {
            let windows_font = |file: &str| PathBuf::from("C:\\Windows\\Fonts").join(file);
            match canonical.as_str() {
                "georgia" => match variant {
                    DesktopFontVariant::Regular => vec![windows_font("georgia.ttf")],
                    DesktopFontVariant::Bold => vec![windows_font("georgiab.ttf")],
                    DesktopFontVariant::Italic => vec![windows_font("georgiai.ttf")],
                    DesktopFontVariant::BoldItalic => vec![windows_font("georgiaz.ttf")],
                },
                "times new roman" | "times" => match variant {
                    DesktopFontVariant::Regular => vec![windows_font("times.ttf")],
                    DesktopFontVariant::Bold => vec![windows_font("timesbd.ttf")],
                    DesktopFontVariant::Italic => vec![windows_font("timesi.ttf")],
                    DesktopFontVariant::BoldItalic => vec![windows_font("timesbi.ttf")],
                },
                "trebuchet ms" | "trebuchet" => match variant {
                    DesktopFontVariant::Regular => vec![windows_font("trebuc.ttf")],
                    DesktopFontVariant::Bold => vec![windows_font("trebucbd.ttf")],
                    DesktopFontVariant::Italic => vec![windows_font("trebucit.ttf")],
                    DesktopFontVariant::BoldItalic => vec![windows_font("trebucbi.ttf")],
                },
                "arial" | "helvetica" => match variant {
                    DesktopFontVariant::Regular => vec![windows_font("arial.ttf")],
                    DesktopFontVariant::Bold => vec![windows_font("arialbd.ttf")],
                    DesktopFontVariant::Italic => vec![windows_font("ariali.ttf")],
                    DesktopFontVariant::BoldItalic => vec![windows_font("arialbi.ttf")],
                },
                "serif" => match variant {
                    DesktopFontVariant::Regular => vec![windows_font("georgia.ttf"), windows_font("times.ttf")],
                    DesktopFontVariant::Bold => vec![windows_font("georgiab.ttf"), windows_font("timesbd.ttf")],
                    DesktopFontVariant::Italic => vec![windows_font("georgiai.ttf"), windows_font("timesi.ttf")],
                    DesktopFontVariant::BoldItalic => vec![windows_font("georgiaz.ttf"), windows_font("timesbi.ttf")],
                },
                "sans-serif" | "sans serif" | "system-ui" | "ui-sans-serif" | "avenir next" => {
                    match variant {
                        DesktopFontVariant::Regular => vec![windows_font("trebuc.ttf"), windows_font("arial.ttf")],
                        DesktopFontVariant::Bold => vec![windows_font("trebucbd.ttf"), windows_font("arialbd.ttf")],
                        DesktopFontVariant::Italic => vec![windows_font("trebucit.ttf"), windows_font("ariali.ttf")],
                        DesktopFontVariant::BoldItalic => vec![windows_font("trebucbi.ttf"), windows_font("arialbi.ttf")],
                    }
                }
                _ => Vec::new(),
            }
        }

        #[cfg(not(target_os = "windows"))]
        {
            let _ = canonical;
            Vec::new()
        }
    }

    fn font_tweak_for_family(family: &str) -> egui::FontTweak {
        match Self::canonical_font_family_name(family).as_str() {
            "georgia" | "times new roman" | "times" | "serif" => egui::FontTweak {
                scale: 0.965,
                y_offset_factor: -0.03,
                ..Default::default()
            },
            "avenir next" | "trebuchet ms" | "arial" | "helvetica" | "sans-serif" | "sans serif" | "system-ui" | "ui-sans-serif" => {
                egui::FontTweak {
                    scale: 0.985,
                    y_offset_factor: -0.015,
                    ..Default::default()
                }
            }
            _ => egui::FontTweak::default(),
        }
    }

    fn collect_font_family_strings_from_value(value: &Value, font_families: &mut HashSet<String>) {
        match value {
            Value::Object(object) => {
                if let Some(font_family) = object.get("fontFamily").and_then(Value::as_str) {
                    font_families.insert(font_family.to_string());
                }
                for nested in object.values() {
                    Self::collect_font_family_strings_from_value(nested, font_families);
                }
            }
            Value::Array(items) => {
                for item in items {
                    Self::collect_font_family_strings_from_value(item, font_families);
                }
            }
            _ => {}
        }
    }

    fn collect_font_family_strings_from_node(node: &NativeNode, font_families: &mut HashSet<String>) {
        if let NativeNode::Element(element_node) = node {
            for value in element_node.props.values() {
                Self::collect_font_family_strings_from_value(value, font_families);
            }

            for child in &element_node.children {
                Self::collect_font_family_strings_from_node(child, font_families);
            }
        }
    }

    fn ensure_fonts_loaded(&mut self, ctx: &egui::Context) {
        if self.fonts_initialized {
            return;
        }

        let mut font_families = HashSet::new();
        for root in &self.payload.tree.roots {
            Self::collect_font_family_strings_from_node(root, &mut font_families);
        }

        if font_families.is_empty() {
            self.fonts_initialized = true;
            return;
        }

        let mut fonts = egui::FontDefinitions::default();
        for font_family_list in font_families {
            for family in Self::parse_css_font_family_list(&font_family_list) {
                let canonical = Self::canonical_font_family_name(&family);
                if canonical.is_empty() || self.font_aliases.contains_key(&canonical) {
                    continue;
                }

                if canonical == "monospace" {
                    continue;
                }

                let mut faces = DesktopFontFaces::default();
                for variant in [
                    DesktopFontVariant::Regular,
                    DesktopFontVariant::Bold,
                    DesktopFontVariant::Italic,
                    DesktopFontVariant::BoldItalic,
                ] {
                    for path in Self::candidate_system_font_paths(&canonical, variant) {
                        let Ok(bytes) = std::fs::read(&path) else {
                            continue;
                        };

                        let family_name: Arc<str> = Arc::from(format!("elit-font-{canonical}-{}", variant.suffix()));
                        let font_key = format!("{}:{}", family_name, path.display());
                        let font_tweak = Self::font_tweak_for_family(&canonical);
                        fonts
                            .font_data
                            .insert(font_key.clone(), Arc::new(egui::FontData::from_owned(bytes).tweak(font_tweak)));
                        fonts
                            .families
                            .entry(egui::FontFamily::Name(family_name.clone()))
                            .or_default()
                            .insert(0, font_key);
                        faces.set(variant, family_name);
                        break;
                    }
                }

                if faces.has_any() {
                    self.font_aliases.insert(canonical.clone(), faces);
                }
            }
        }

        if !self.font_aliases.is_empty() {
            ctx.set_fonts(fonts);
        }

        self.fonts_initialized = true;
    }

    fn resolve_font_family_from_style(
        &self,
        style: Option<&Map<String, Value>>,
        want_bold: bool,
        want_italic: bool,
    ) -> Option<(egui::FontFamily, bool, bool)> {
        let font_family_list = style?.get("fontFamily")?.as_str()?;
        for family in Self::parse_css_font_family_list(font_family_list) {
            let canonical = Self::canonical_font_family_name(&family);
            if canonical == "monospace" {
                return Some((egui::FontFamily::Monospace, false, false));
            }

            if let Some(loaded_family) = self.font_aliases.get(&canonical) {
                return loaded_family.resolve_font_family(want_bold, want_italic);
            }

            if matches!(canonical.as_str(), "serif" | "sans-serif" | "sans serif") {
                continue;
            }
        }

        None
    }

    fn content_axis_size_from_outer_size(outer_size: Option<f32>, padding_total: f32, stroke_width: f32) -> Option<f32> {
        outer_size.map(|outer_size| (outer_size - padding_total - stroke_width * 2.0).max(0.0))
    }

    fn parse_css_color_text(text: &str) -> Option<Color32> {
        let text = text.trim();
        if let Some(hex) = text.strip_prefix('#') {
            return match hex.len() {
                3 => {
                    let red = u8::from_str_radix(&hex[0..1].repeat(2), 16).ok()?;
                    let green = u8::from_str_radix(&hex[1..2].repeat(2), 16).ok()?;
                    let blue = u8::from_str_radix(&hex[2..3].repeat(2), 16).ok()?;
                    Some(Color32::from_rgb(red, green, blue))
                }
                6 => {
                    let red = u8::from_str_radix(&hex[0..2], 16).ok()?;
                    let green = u8::from_str_radix(&hex[2..4], 16).ok()?;
                    let blue = u8::from_str_radix(&hex[4..6], 16).ok()?;
                    Some(Color32::from_rgb(red, green, blue))
                }
                8 => {
                    let red = u8::from_str_radix(&hex[0..2], 16).ok()?;
                    let green = u8::from_str_radix(&hex[2..4], 16).ok()?;
                    let blue = u8::from_str_radix(&hex[4..6], 16).ok()?;
                    let alpha = u8::from_str_radix(&hex[6..8], 16).ok()?;
                    Some(Color32::from_rgba_unmultiplied(red, green, blue, alpha))
                }
                _ => None,
            };
        }

        let normalized = text.replace(' ', "");
        let rgba_text = normalized
            .strip_prefix("rgba(")
            .and_then(|inner| inner.strip_suffix(')'));
        if let Some(rgba_text) = rgba_text {
            let parts: Vec<&str> = rgba_text.split(',').collect();
            if parts.len() == 4 {
                let red = parts[0].parse::<u8>().ok()?;
                let green = parts[1].parse::<u8>().ok()?;
                let blue = parts[2].parse::<u8>().ok()?;
                let alpha = (parts[3].parse::<f32>().ok()?.clamp(0.0, 1.0) * 255.0).round() as u8;
                return Some(Color32::from_rgba_unmultiplied(red, green, blue, alpha));
            }
        }

        let rgb_text = normalized
            .strip_prefix("rgb(")
            .and_then(|inner| inner.strip_suffix(')'));
        if let Some(rgb_text) = rgb_text {
            let parts: Vec<&str> = rgb_text.split(',').collect();
            if parts.len() == 3 {
                let red = parts[0].parse::<u8>().ok()?;
                let green = parts[1].parse::<u8>().ok()?;
                let blue = parts[2].parse::<u8>().ok()?;
                return Some(Color32::from_rgb(red, green, blue));
            }
        }

        None
    }

    fn parse_css_color(value: Option<&Value>) -> Option<Color32> {
        Self::parse_css_color_text(value?.as_str()?)
    }

    fn parse_box_edges_value(value: Option<&Value>) -> Option<DesktopBoxEdges> {
        match value {
            Some(Value::Number(number)) => {
                let size = number.as_f64()? as f32;
                Some(DesktopBoxEdges {
                    top: size,
                    right: size,
                    bottom: size,
                    left: size,
                })
            }
            Some(Value::String(text)) => {
                let text = text.split('/').next().unwrap_or(text).trim();
                if text.is_empty() {
                    return None;
                }

                let mut values = Vec::new();
                for token in text.split_whitespace().take(4) {
                    values.push(Self::parse_css_measure_text(token, None)?);
                }

                match values.as_slice() {
                    [all] => Some(DesktopBoxEdges {
                        top: *all,
                        right: *all,
                        bottom: *all,
                        left: *all,
                    }),
                    [vertical, horizontal] => Some(DesktopBoxEdges {
                        top: *vertical,
                        right: *horizontal,
                        bottom: *vertical,
                        left: *horizontal,
                    }),
                    [top, horizontal, bottom] => Some(DesktopBoxEdges {
                        top: *top,
                        right: *horizontal,
                        bottom: *bottom,
                        left: *horizontal,
                    }),
                    [top, right, bottom, left] => Some(DesktopBoxEdges {
                        top: *top,
                        right: *right,
                        bottom: *bottom,
                        left: *left,
                    }),
                    _ => None,
                }
            }
            _ => None,
        }
    }

    fn resolve_box_edges(style: Option<&Map<String, Value>>, key: &str) -> Option<DesktopBoxEdges> {
        let Some(style) = style else {
            return None;
        };

        let mut edges = Self::parse_box_edges_value(style.get(key)).unwrap_or_default();
        let mut found = style.contains_key(key);

        let top_key = format!("{key}Top");
        let right_key = format!("{key}Right");
        let bottom_key = format!("{key}Bottom");
        let left_key = format!("{key}Left");

        if let Some(value) = Self::parse_css_number(style.get(&top_key)) {
            edges.top = value;
            found = true;
        }
        if let Some(value) = Self::parse_css_number(style.get(&right_key)) {
            edges.right = value;
            found = true;
        }
        if let Some(value) = Self::parse_css_number(style.get(&bottom_key)) {
            edges.bottom = value;
            found = true;
        }
        if let Some(value) = Self::parse_css_number(style.get(&left_key)) {
            edges.left = value;
            found = true;
        }

        found.then_some(edges)
    }

    fn parse_corner_radii_value(value: Option<&Value>) -> Option<DesktopCornerRadii> {
        match value {
            Some(Value::Number(number)) => {
                let radius = number.as_f64()? as f32;
                Some(DesktopCornerRadii {
                    top_left: radius,
                    top_right: radius,
                    bottom_right: radius,
                    bottom_left: radius,
                })
            }
            Some(Value::String(text)) => {
                let text = text.split('/').next().unwrap_or(text).trim();
                if text.is_empty() {
                    return None;
                }

                let mut values = Vec::new();
                for token in text.split_whitespace().take(4) {
                    values.push(Self::parse_css_measure_text(token, None)?);
                }

                match values.as_slice() {
                    [all] => Some(DesktopCornerRadii {
                        top_left: *all,
                        top_right: *all,
                        bottom_right: *all,
                        bottom_left: *all,
                    }),
                    [top_left_bottom_right, top_right_bottom_left] => Some(DesktopCornerRadii {
                        top_left: *top_left_bottom_right,
                        top_right: *top_right_bottom_left,
                        bottom_right: *top_left_bottom_right,
                        bottom_left: *top_right_bottom_left,
                    }),
                    [top_left, top_right_bottom_left, bottom_right] => Some(DesktopCornerRadii {
                        top_left: *top_left,
                        top_right: *top_right_bottom_left,
                        bottom_right: *bottom_right,
                        bottom_left: *top_right_bottom_left,
                    }),
                    [top_left, top_right, bottom_right, bottom_left] => Some(DesktopCornerRadii {
                        top_left: *top_left,
                        top_right: *top_right,
                        bottom_right: *bottom_right,
                        bottom_left: *bottom_left,
                    }),
                    _ => None,
                }
            }
            _ => None,
        }
    }

    fn resolve_corner_radius_from_style(style: Option<&Map<String, Value>>) -> Option<CornerRadius> {
        let Some(style) = style else {
            return None;
        };

        let mut radii = Self::parse_corner_radii_value(style.get("borderRadius")).unwrap_or_default();
        let mut found = style.contains_key("borderRadius");

        if let Some(value) = Self::parse_css_number(style.get("borderTopLeftRadius")) {
            radii.top_left = value;
            found = true;
        }
        if let Some(value) = Self::parse_css_number(style.get("borderTopRightRadius")) {
            radii.top_right = value;
            found = true;
        }
        if let Some(value) = Self::parse_css_number(style.get("borderBottomRightRadius")) {
            radii.bottom_right = value;
            found = true;
        }
        if let Some(value) = Self::parse_css_number(style.get("borderBottomLeftRadius")) {
            radii.bottom_left = value;
            found = true;
        }

        found.then(|| radii.to_corner_radius())
    }

    fn resolve_opacity_from_style(style: Option<&Map<String, Value>>) -> f32 {
        style
            .and_then(|style| Self::parse_css_number(style.get("opacity")))
            .unwrap_or(1.0)
            .clamp(0.0, 1.0)
    }

    fn first_css_list_item(text: &str) -> &str {
        let mut depth = 0usize;
        for (index, character) in text.char_indices() {
            match character {
                '(' => depth += 1,
                ')' => depth = depth.saturating_sub(1),
                ',' if depth == 0 => return text[..index].trim(),
                _ => {}
            }
        }

        text.trim()
    }

    fn extract_shadow_color_fragment(text: &str) -> Option<(Color32, String)> {
        if let Some(start) = text.find("rgba(").or_else(|| text.find("rgb(")) {
            let end = start + text[start..].find(')')? + 1;
            let color_text = &text[start..end];
            let color = Self::parse_css_color_text(color_text)?;
            let remainder = format!("{} {}", &text[..start], &text[end..]);
            return Some((color, remainder));
        }

        if let Some(start) = text.rfind('#') {
            let end = text[start..]
                .find(|character: char| character.is_whitespace())
                .map(|offset| start + offset)
                .unwrap_or(text.len());
            let color_text = &text[start..end];
            let color = Self::parse_css_color_text(color_text)?;
            let remainder = format!("{} {}", &text[..start], &text[end..]);
            return Some((color, remainder));
        }

        let tokens = text.split_whitespace().collect::<Vec<_>>();
        let last_token = *tokens.last()?;
        let color = Self::parse_css_color_text(last_token)?;
        let remainder = tokens[..tokens.len().saturating_sub(1)].join(" ");
        Some((color, remainder))
    }

    fn soften_css_shadow(
        offset_x: f32,
        offset_y: f32,
        blur_radius: f32,
        spread_radius: f32,
        color: Color32,
    ) -> egui::Shadow {
        let positive_spread = spread_radius.max(0.0);
        let softened_blur = (blur_radius * 0.45 + positive_spread * 0.6).max(0.0);
        let softened_spread = (positive_spread * 0.4 + blur_radius * 0.08).max(0.0);
        let softened_color = if blur_radius > 0.0 {
            color.gamma_multiply(0.9)
        } else {
            color
        };

        egui::Shadow {
            offset: [
                round_margin_value(offset_x * 0.45),
                round_margin_value(offset_y * 0.45),
            ],
            blur: round_corner_value(softened_blur),
            spread: round_corner_value(softened_spread),
            color: softened_color,
        }
    }

    fn resolve_box_shadow_from_style(style: Option<&Map<String, Value>>) -> Option<egui::Shadow> {
        let raw_value = style
            .and_then(|style| style.get("boxShadow").or_else(|| style.get("shadow")))
            .and_then(Value::as_str)?;
        let shadow_text = Self::first_css_list_item(raw_value);
        if shadow_text.is_empty() || shadow_text.contains("inset") {
            return None;
        }

        let (color, numeric_text) = Self::extract_shadow_color_fragment(shadow_text)
            .unwrap_or((Color32::from_black_alpha(96), shadow_text.to_string()));
        let numbers = numeric_text
            .split_whitespace()
            .filter_map(|token| Self::parse_css_measure_text(token, None))
            .collect::<Vec<_>>();

        if numbers.len() < 2 {
            return None;
        }

        Some(Self::soften_css_shadow(
            numbers[0],
            numbers[1],
            numbers.get(2).copied().unwrap_or(0.0),
            numbers.get(3).copied().unwrap_or(0.0),
            color,
        ))
    }

    fn parse_blur_filter_radius_text(value: &str) -> Option<f32> {
        let normalized = value.trim();
        let blur_start = normalized.to_ascii_lowercase().find("blur(")?;
        let blur_args = &normalized[(blur_start + 5)..];
        let blur_end = blur_args.find(')')?;
        let blur_radius = blur_args[..blur_end].trim();
        let radius = Self::parse_css_measure_text(blur_radius, None)?;
        (radius > 0.0).then_some(radius)
    }

    fn resolve_backdrop_blur_radius_from_style(style: Option<&Map<String, Value>>) -> Option<f32> {
        let style = style?;
        style
            .get("backdropFilter")
            .or_else(|| style.get("webkitBackdropFilter"))
            .and_then(Value::as_str)
            .and_then(Self::parse_blur_filter_radius_text)
    }

    fn lift_color_alpha(color: Color32, delta: f32) -> Color32 {
        let lifted_alpha = ((color.a() as f32 / 255.0) + delta.clamp(0.0, 1.0)).clamp(0.0, 1.0);
        Color32::from_rgba_unmultiplied(color.r(), color.g(), color.b(), (lifted_alpha * 255.0).round() as u8)
    }

    fn resolve_frosted_background_color_from_style(style: Option<&Map<String, Value>>) -> Option<Color32> {
        let color = Self::resolve_background_color_from_style(style)?;
        let blur_radius = Self::resolve_backdrop_blur_radius_from_style(style)?;
        if color.a() == u8::MAX {
            return Some(color);
        }

        Some(Self::lift_color_alpha(color, (blur_radius / 160.0).min(0.14)))
    }

    fn resolve_effective_background_color_from_style(style: Option<&Map<String, Value>>) -> Option<Color32> {
        Self::resolve_frosted_background_color_from_style(style).or_else(|| Self::resolve_background_color_from_style(style))
    }

    fn synthesize_shadow_from_backdrop_blur(blur_radius: f32) -> egui::Shadow {
        egui::Shadow {
            offset: [0, 0],
            blur: round_corner_value(blur_radius.max(12.0) / 1.5),
            spread: round_corner_value((blur_radius / 7.0).max(0.0)),
            color: Color32::from_black_alpha(24),
        }
    }

    fn has_auto_horizontal_margin(style: Option<&Map<String, Value>>) -> bool {
        let Some(style) = style else {
            return false;
        };

        let margin_left_auto = style
            .get("marginLeft")
            .and_then(Value::as_str)
            .map(|value| value.trim().eq_ignore_ascii_case("auto"))
            .unwrap_or(false);
        let margin_right_auto = style
            .get("marginRight")
            .and_then(Value::as_str)
            .map(|value| value.trim().eq_ignore_ascii_case("auto"))
            .unwrap_or(false);
        if margin_left_auto || margin_right_auto {
            return true;
        }

        style
            .get("margin")
            .and_then(Value::as_str)
            .map(|value| {
                let tokens = value.split_whitespace().map(|token| token.to_ascii_lowercase()).collect::<Vec<_>>();
                match tokens.as_slice() {
                    [single] => single == "auto",
                    [_, horizontal] => horizontal == "auto",
                    [_, horizontal, _] => horizontal == "auto",
                    [_, right, _, left] => right == "auto" || left == "auto",
                    _ => false,
                }
            })
            .unwrap_or(false)
    }

    fn resolve_align_keyword(value: &str) -> Option<Align> {
        match value.trim().to_ascii_lowercase().as_str() {
            "start" | "flex-start" | "left" | "top" => Some(Align::Min),
            "center" => Some(Align::Center),
            "end" | "flex-end" | "right" | "bottom" => Some(Align::Max),
            _ => None,
        }
    }

    fn resolve_layout_from_style(style: Option<&Map<String, Value>>, row_layout: bool) -> Layout {
        let align_items = style.and_then(|style| style.get("alignItems")).and_then(Value::as_str);
        let text_align = style.and_then(|style| style.get("textAlign")).and_then(Value::as_str);
        let justify_content = style
            .and_then(|style| style.get("justifyContent"))
            .and_then(Value::as_str)
            .map(|value| value.trim().to_ascii_lowercase());
        let cross_align = align_items
            .and_then(Self::resolve_align_keyword)
            .or_else(|| (!row_layout).then(|| text_align.and_then(Self::resolve_align_keyword)).flatten())
            .unwrap_or(Align::Min);
        let mut layout = Layout::from_main_dir_and_cross_align(
            if row_layout { Direction::LeftToRight } else { Direction::TopDown },
            cross_align,
        );

        if row_layout {
            let wrap = style
                .and_then(|style| style.get("flexWrap"))
                .and_then(Value::as_str)
                .map(|value| !value.eq_ignore_ascii_case("nowrap"))
                .unwrap_or(false);
            layout = layout.with_main_wrap(wrap);
        }

        if let Some(justify_content) = justify_content.as_deref() {
            if let Some(main_align) = Self::resolve_align_keyword(justify_content) {
                layout = layout.with_main_align(main_align);
            }

            if matches!(justify_content, "space-between" | "space-around" | "space-evenly" | "stretch") {
                layout = layout.with_main_justify(true);
            }
        }

        if align_items
            .map(|value| value.eq_ignore_ascii_case("stretch"))
            .unwrap_or(false)
        {
            layout = layout.with_cross_justify(true);
        }

        layout
    }

    fn is_center_keyword(value: &str) -> bool {
        value.trim().eq_ignore_ascii_case("center")
    }

    fn should_force_centered_single_child_layout(
        style: Option<&Map<String, Value>>,
        child_count: usize,
    ) -> bool {
        let Some(style) = style else {
            return false;
        };

        if child_count != 1 || Self::flex_wraps(Some(style)) {
            return false;
        }

        let justify_center = style
            .get("justifyContent")
            .and_then(Value::as_str)
            .map(Self::is_center_keyword)
            .unwrap_or(false);
        let align_center = style
            .get("alignItems")
            .and_then(Value::as_str)
            .map(Self::is_center_keyword)
            .unwrap_or(false);

        justify_center && align_center
    }

    fn split_css_top_level(text: &str, separator: char) -> Vec<String> {
        let mut parts = Vec::new();
        let mut start = 0usize;
        let mut paren_depth = 0usize;
        let mut bracket_depth = 0usize;

        for (index, character) in text.char_indices() {
            match character {
                '(' => paren_depth += 1,
                ')' => paren_depth = paren_depth.saturating_sub(1),
                '[' => bracket_depth += 1,
                ']' => bracket_depth = bracket_depth.saturating_sub(1),
                _ if character == separator && paren_depth == 0 && bracket_depth == 0 => {
                    let segment = text[start..index].trim();
                    if !segment.is_empty() {
                        parts.push(segment.to_string());
                    }
                    start = index + character.len_utf8();
                }
                _ => {}
            }
        }

        let trailing = text[start..].trim();
        if !trailing.is_empty() {
            parts.push(trailing.to_string());
        }

        parts
    }

    fn split_css_track_tokens(text: &str) -> Vec<String> {
        let mut tokens = Vec::new();
        let mut start = None;
        let mut paren_depth = 0usize;
        let mut bracket_depth = 0usize;

        for (index, character) in text.char_indices() {
            match character {
                '(' => {
                    paren_depth += 1;
                    start.get_or_insert(index);
                }
                ')' => paren_depth = paren_depth.saturating_sub(1),
                '[' => {
                    bracket_depth += 1;
                    start.get_or_insert(index);
                }
                ']' => bracket_depth = bracket_depth.saturating_sub(1),
                _ => {}
            }

            if character.is_whitespace() && paren_depth == 0 && bracket_depth == 0 {
                if let Some(token_start) = start.take() {
                    let token = text[token_start..index].trim();
                    if !token.is_empty() {
                        tokens.push(token.to_string());
                    }
                }
                continue;
            }

            if !character.is_whitespace() {
                start.get_or_insert(index);
            }
        }

        if let Some(token_start) = start {
            let token = text[token_start..].trim();
            if !token.is_empty() {
                tokens.push(token.to_string());
            }
        }

        tokens
    }

    fn expand_grid_track_tokens(template: &str) -> Vec<String> {
        let mut expanded = Vec::new();
        for token in Self::split_css_track_tokens(template) {
            let trimmed = token.trim();
            if let Some(inner) = trimmed.strip_prefix("repeat(").and_then(|text| text.strip_suffix(')')) {
                let args = Self::split_css_top_level(inner, ',');
                if args.len() == 2 {
                    if let Ok(repeat_count) = args[0].trim().parse::<usize>() {
                        let repeated_tokens = Self::split_css_track_tokens(args[1].trim());
                        if !repeated_tokens.is_empty() {
                            for _ in 0..repeat_count {
                                expanded.extend(repeated_tokens.iter().cloned());
                            }
                            continue;
                        }
                    }
                }
            }

            expanded.push(trimmed.to_string());
        }

        expanded
    }

    fn parse_auto_fit_grid_layout(template: &str, available_width: f32, child_count: usize, gap: f32) -> Option<DesktopGridLayoutSpec> {
        let inner = template.strip_prefix("repeat(")?.strip_suffix(')')?;
        let args = Self::split_css_top_level(inner, ',');
        if args.len() != 2 {
            return None;
        }

        let repeat_mode = args[0].trim().to_ascii_lowercase();
        if repeat_mode != "auto-fit" && repeat_mode != "auto-fill" {
            return None;
        }

        let track = args[1].trim();
        let minmax_inner = track.strip_prefix("minmax(")?.strip_suffix(')')?;
        let minmax_args = Self::split_css_top_level(minmax_inner, ',');
        if minmax_args.len() != 2 {
            return None;
        }

        let min_width = Self::parse_css_number_text(minmax_args[0].trim())?.max(1.0);
        let child_count = child_count.max(1);
        let mut columns = (((available_width + gap) / (min_width + gap)).floor() as usize).max(1);
        columns = columns.min(child_count);

        let total_gap = gap * (columns.saturating_sub(1) as f32);
        let column_width = ((available_width - total_gap) / columns as f32).max(1.0);
        Some(DesktopGridLayoutSpec {
            column_widths: vec![column_width; columns],
        })
    }

    fn parse_grid_track_spec(token: &str) -> DesktopGridTrackSpec {
        let trimmed = token.trim();
        if let Some(inner) = trimmed.strip_prefix("minmax(").and_then(|text| text.strip_suffix(')')) {
            let args = Self::split_css_top_level(inner, ',');
            if args.len() == 2 {
                let min_width = Self::parse_css_number_text(args[0].trim()).unwrap_or(0.0).max(0.0);
                let max_token = args[1].trim();
                if let Some(weight_text) = max_token.strip_suffix("fr") {
                    return DesktopGridTrackSpec {
                        min_width,
                        flex_weight: Self::parse_css_number_text(weight_text).unwrap_or(1.0).max(0.0),
                        fixed_width: None,
                    };
                }

                return DesktopGridTrackSpec {
                    min_width,
                    fixed_width: Self::parse_css_number_text(max_token).or(Some(min_width)),
                    flex_weight: 0.0,
                };
            }
        }

        if let Some(weight_text) = trimmed.strip_suffix("fr") {
            return DesktopGridTrackSpec {
                fixed_width: None,
                min_width: 0.0,
                flex_weight: Self::parse_css_number_text(weight_text).unwrap_or(1.0).max(0.0),
            };
        }

        if let Some(inner) = trimmed.strip_prefix("fit-content(").and_then(|text| text.strip_suffix(')')) {
            let width = Self::parse_css_number_text(inner).unwrap_or(0.0).max(0.0);
            return DesktopGridTrackSpec {
                fixed_width: Some(width),
                min_width: width,
                flex_weight: 0.0,
            };
        }

        if let Some(width) = Self::parse_css_number_text(trimmed) {
            return DesktopGridTrackSpec {
                fixed_width: Some(width.max(0.0)),
                min_width: width.max(0.0),
                flex_weight: 0.0,
            };
        }

        DesktopGridTrackSpec {
            fixed_width: None,
            min_width: 0.0,
            flex_weight: 1.0,
        }
    }

    fn resolve_grid_layout(style: Option<&Map<String, Value>>, available_width: f32, child_count: usize, gap: f32) -> Option<DesktopGridLayoutSpec> {
        let template = style?.get("gridTemplateColumns")?.as_str()?.trim();
        if template.is_empty() {
            return None;
        }

        if template.starts_with("repeat(") {
            if let Some(layout) = Self::parse_auto_fit_grid_layout(template, available_width, child_count, gap) {
                return Some(layout);
            }
        }

        let tracks = Self::expand_grid_track_tokens(template);
        if tracks.is_empty() {
            return None;
        }

        let specs = tracks.iter().map(|track| Self::parse_grid_track_spec(track)).collect::<Vec<_>>();
        let total_gap = gap * (specs.len().saturating_sub(1) as f32);
        let mut fixed_total = 0.0;
        let mut min_flex_total = 0.0;
        let mut flex_total = 0.0;

        for spec in &specs {
            if let Some(fixed_width) = spec.fixed_width {
                fixed_total += fixed_width.max(spec.min_width);
            } else {
                min_flex_total += spec.min_width;
                flex_total += spec.flex_weight.max(0.0);
            }
        }

        let distributable = (available_width - total_gap - fixed_total - min_flex_total).max(0.0);
        let mut widths = Vec::with_capacity(specs.len());
        for spec in specs {
            if let Some(fixed_width) = spec.fixed_width {
                widths.push(fixed_width.max(spec.min_width).max(1.0));
            } else {
                let extra = if flex_total > 0.0 {
                    distributable * (spec.flex_weight.max(0.0) / flex_total)
                } else {
                    0.0
                };
                widths.push((spec.min_width + extra).max(1.0));
            }
        }

        Some(DesktopGridLayoutSpec { column_widths: widths })
    }

    fn child_style_map<'a>(node: &'a NativeNode) -> Option<&'a Map<String, Value>> {
        match node {
            NativeNode::Element(element_node) => element_node.props.get("style")?.as_object(),
            NativeNode::Text(_) => None,
        }
    }

    fn is_flex_or_grid_container(style: Option<&Map<String, Value>>) -> bool {
        style
            .and_then(|style| style.get("display"))
            .and_then(Value::as_str)
            .map(|value| {
                let normalized = value.trim().to_ascii_lowercase();
                normalized.contains("flex") || normalized.contains("grid")
            })
            .unwrap_or_else(|| {
                style
                    .map(|style| style.contains_key("flexDirection") || style.contains_key("gridTemplateColumns"))
                    .unwrap_or(false)
            })
    }

    fn resolve_child_sort_number(style: Option<&Map<String, Value>>, key: &str) -> i32 {
        Self::parse_css_number(style.and_then(|style| style.get(key)))
            .map(|value| value.round() as i32)
            .unwrap_or(0)
    }

    fn ordered_children<'a>(children: &'a [NativeNode], parent_style: Option<&Map<String, Value>>) -> Vec<(usize, &'a NativeNode)> {
        let allow_order = Self::is_flex_or_grid_container(parent_style);
        let mut ordered = children.iter().enumerate().collect::<Vec<_>>();
        ordered.sort_by_key(|(original_index, child)| {
            let style = Self::child_style_map(child);
            let order = allow_order.then(|| Self::resolve_child_sort_number(style, "order")).unwrap_or(0);
            let z_index = Self::resolve_child_sort_number(style, "zIndex");
            (order, z_index, *original_index)
        });
        ordered
    }

    fn flex_wraps(style: Option<&Map<String, Value>>) -> bool {
        style
            .and_then(|style| style.get("flexWrap"))
            .and_then(Value::as_str)
            .map(|value| !value.eq_ignore_ascii_case("nowrap"))
            .unwrap_or(false)
    }

    fn resolve_flex_grow(style: Option<&Map<String, Value>>) -> f32 {
        let Some(style) = style else {
            return 0.0;
        };

        Self::parse_css_number(style.get("flexGrow"))
            .filter(|value| *value > 0.0)
            .or_else(|| {
                match style.get("flex") {
                    Some(Value::Number(number)) => number.as_f64().map(|value| value as f32),
                    Some(Value::String(text)) => text
                        .split_whitespace()
                        .next()
                        .and_then(Self::parse_css_number_text),
                    _ => None,
                }
                .filter(|value| *value > 0.0)
            })
            .unwrap_or(0.0)
    }

    #[cfg(test)]
    fn resolve_row_flex_widths(children: &[NativeNode], available_width: f32, gap: f32) -> Option<Vec<Option<f32>>> {
        let child_refs = children.iter().collect::<Vec<_>>();
        Self::resolve_row_flex_widths_for_nodes(&child_refs, available_width, gap)
    }

    fn resolve_row_flex_widths_for_nodes(children: &[&NativeNode], available_width: f32, gap: f32) -> Option<Vec<Option<f32>>> {
        if children.is_empty() {
            return None;
        }

        let total_gap = gap * children.len().saturating_sub(1) as f32;
        let mut widths = vec![None; children.len()];
        let mut fixed_total = 0.0;
        let mut grow_total = 0.0;
        let mut grow_specs = Vec::new();
        let mut negotiated = false;

        for (index, child) in children.iter().enumerate() {
            let style = Self::child_style_map(child);
            let width = style.and_then(|style| Self::parse_css_size_against_basis(style.get("width"), available_width));
            let min_width = style
                .and_then(|style| Self::parse_css_size_against_basis(style.get("minWidth"), available_width))
                .unwrap_or(0.0);
            let max_width = style.and_then(|style| Self::parse_css_size_against_basis(style.get("maxWidth"), available_width));
            let grow = Self::resolve_flex_grow(style);

            if let Some(width) = width {
                let resolved_width = max_width.map(|max| width.min(max)).unwrap_or(width).max(min_width).max(1.0);
                widths[index] = Some(resolved_width);
                fixed_total += resolved_width;
                negotiated = true;
                continue;
            }

            if grow > 0.0 {
                grow_specs.push((index, grow, min_width, max_width));
                grow_total += grow;
                fixed_total += min_width;
                negotiated = true;
            }
        }

        if !negotiated {
            return None;
        }

        let remaining_width = (available_width - total_gap - fixed_total).max(0.0);
        for (index, grow, min_width, max_width) in grow_specs {
            let resolved_width = max_width
                .map(|max| (min_width + remaining_width * (grow / grow_total)).min(max))
                .unwrap_or(min_width + remaining_width * (grow / grow_total))
                .max(min_width)
                .max(1.0);
            widths[index] = Some(resolved_width);
        }

        Some(widths)
    }

    fn extract_color_from_css_fragment(text: &str) -> Option<Color32> {
        let trimmed = text.trim();
        if let Some(color) = Self::parse_css_color_text(trimmed) {
            return Some(color);
        }

        for token in trimmed.split_whitespace() {
            if let Some(color) = Self::parse_css_color_text(token) {
                return Some(color);
            }
        }

        Self::extract_shadow_color_fragment(trimmed).map(|(color, _)| color)
    }

    fn parse_linear_gradient_direction(text: &str) -> Option<f32> {
        let normalized = text.trim().to_ascii_lowercase();
        if let Some(deg_text) = normalized.strip_suffix("deg") {
            return deg_text.trim().parse::<f32>().ok();
        }

        match normalized.as_str() {
            "to top" => Some(0.0),
            "to top right" | "to right top" => Some(45.0),
            "to right" => Some(90.0),
            "to bottom right" | "to right bottom" => Some(135.0),
            "to bottom" => Some(180.0),
            "to bottom left" | "to left bottom" => Some(225.0),
            "to left" => Some(270.0),
            "to top left" | "to left top" => Some(315.0),
            _ => None,
        }
    }

    fn parse_linear_gradient(background: &str) -> Option<DesktopLinearGradient> {
        let trimmed = background.trim();
        let inner = trimmed
            .strip_prefix("linear-gradient(")
            .and_then(|text| text.strip_suffix(')'))?;
        let parts = Self::split_css_top_level(inner, ',');
        if parts.len() < 2 {
            return None;
        }

        let mut angle_deg = 180.0;
        let mut stop_parts = parts.as_slice();
        if Self::extract_color_from_css_fragment(&parts[0]).is_none() {
            if let Some(parsed_angle) = Self::parse_linear_gradient_direction(&parts[0]) {
                angle_deg = parsed_angle;
                stop_parts = &parts[1..];
            }
        }

        if stop_parts.len() < 2 {
            return None;
        }

        let mut parsed_stops = Vec::with_capacity(stop_parts.len());
        for fragment in stop_parts {
            let color = Self::extract_color_from_css_fragment(fragment)?;
            let position = fragment
                .split_whitespace()
                .find_map(|token| token.strip_suffix('%').and_then(Self::parse_css_number_text))
                .map(|percent| (percent / 100.0).clamp(0.0, 1.0));
            parsed_stops.push((color, position));
        }

        if parsed_stops.len() < 2 {
            return None;
        }

        let mut positions = parsed_stops.iter().map(|(_, position)| *position).collect::<Vec<_>>();
        if positions.iter().all(Option::is_none) {
            let last_index = parsed_stops.len().saturating_sub(1).max(1) as f32;
            for (index, position) in positions.iter_mut().enumerate() {
                *position = Some(index as f32 / last_index);
            }
        } else {
            if positions.first().is_some_and(|position| position.is_none()) {
                positions[0] = Some(0.0);
            }
            if let Some(last_position) = positions.last_mut() {
                if last_position.is_none() {
                    *last_position = Some(1.0);
                }
            }

            let mut previous_known: Option<usize> = None;
            for index in 0..positions.len() {
                if let Some(current_position) = positions[index] {
                    if let Some(previous_index) = previous_known {
                        let previous_position = positions[previous_index].unwrap_or(0.0);
                        let span = (index - previous_index) as f32;
                        for fill_index in (previous_index + 1)..index {
                            let step = (fill_index - previous_index) as f32 / span;
                            positions[fill_index] = Some(previous_position + (current_position - previous_position) * step);
                        }
                    } else {
                        for fill_index in 0..index {
                            positions[fill_index] = Some(current_position);
                        }
                    }
                    previous_known = Some(index);
                }
            }

            if let Some(previous_index) = previous_known {
                let previous_position = positions[previous_index].unwrap_or(1.0);
                for fill_index in (previous_index + 1)..positions.len() {
                    positions[fill_index] = Some(previous_position);
                }
            }
        }

        Some(DesktopLinearGradient {
            angle_deg,
            stops: parsed_stops
                .into_iter()
                .zip(positions.into_iter())
                .map(|((color, _), position)| DesktopGradientStop {
                    position: position.unwrap_or(0.0).clamp(0.0, 1.0),
                    color,
                })
                .collect(),
        })
    }

    fn gradient_with_opacity(mut gradient: DesktopLinearGradient, opacity: f32) -> DesktopLinearGradient {
        if opacity >= 1.0 {
            return gradient;
        }

        for stop in &mut gradient.stops {
            stop.color = stop.color.gamma_multiply(opacity.clamp(0.0, 1.0));
        }

        gradient
    }

    fn resolve_background_gradient_from_style(style: Option<&Map<String, Value>>) -> Option<DesktopLinearGradient> {
        let style = style?;

        style
            .get("background")
            .and_then(Value::as_str)
            .and_then(Self::parse_linear_gradient)
            .or_else(|| {
                style
                    .get("backgroundImage")
                    .and_then(Value::as_str)
                    .and_then(Self::parse_linear_gradient)
            })
    }

    fn interpolate_gradient_color(start: Color32, end: Color32, t: f32) -> Color32 {
        let mix = |left: u8, right: u8| -> u8 {
            (left as f32 + (right as f32 - left as f32) * t.clamp(0.0, 1.0)).round().clamp(0.0, 255.0) as u8
        };

        Color32::from_rgba_unmultiplied(
            mix(start.r(), end.r()),
            mix(start.g(), end.g()),
            mix(start.b(), end.b()),
            mix(start.a(), end.a()),
        )
    }

    fn evaluate_gradient_color(stops: &[DesktopGradientStop], t: f32) -> Color32 {
        if stops.is_empty() {
            return Color32::TRANSPARENT;
        }

        let t = t.clamp(0.0, 1.0);
        if t <= stops[0].position {
            return stops[0].color;
        }

        for window in stops.windows(2) {
            let start = window[0];
            let end = window[1];
            if t <= end.position {
                let span = (end.position - start.position).abs();
                if span < f32::EPSILON {
                    return end.color;
                }
                return Self::interpolate_gradient_color(start.color, end.color, (t - start.position) / span);
            }
        }

        stops.last().map(|stop| stop.color).unwrap_or(Color32::TRANSPARENT)
    }

    fn gradient_direction_vector(angle_deg: f32) -> Vec2 {
        let radians = angle_deg.to_radians();
        egui::vec2(radians.sin(), -radians.cos())
    }

    fn corner_radii(corner_radius: CornerRadius, rect: Rect) -> [f32; 4] {
        let limit = (rect.width().min(rect.height()) / 2.0).max(0.0);
        [
            (corner_radius.nw as f32).min(limit),
            (corner_radius.ne as f32).min(limit),
            (corner_radius.se as f32).min(limit),
            (corner_radius.sw as f32).min(limit),
        ]
    }

    fn append_corner_points(points: &mut Vec<Pos2>, center: Pos2, radius: f32, start_angle: f32, end_angle: f32) {
        if radius <= 0.0 {
            points.push(center);
            return;
        }

        let segment_count = ((radius / 3.0).ceil() as usize).clamp(2, 8);
        for segment in 0..=segment_count {
            let t = segment as f32 / segment_count as f32;
            let angle = start_angle + (end_angle - start_angle) * t;
            points.push(Pos2::new(center.x + radius * angle.cos(), center.y + radius * angle.sin()));
        }
    }

    fn rounded_rect_outline(rect: Rect, corner_radius: CornerRadius) -> Vec<Pos2> {
        let [top_left, top_right, bottom_right, bottom_left] = Self::corner_radii(corner_radius, rect);
        let mut points = Vec::new();

        Self::append_corner_points(
            &mut points,
            if top_left > 0.0 { Pos2::new(rect.left() + top_left, rect.top() + top_left) } else { Pos2::new(rect.left(), rect.top()) },
            top_left,
            std::f32::consts::PI,
            std::f32::consts::FRAC_PI_2 * 3.0,
        );
        Self::append_corner_points(
            &mut points,
            if top_right > 0.0 { Pos2::new(rect.right() - top_right, rect.top() + top_right) } else { Pos2::new(rect.right(), rect.top()) },
            top_right,
            std::f32::consts::FRAC_PI_2 * 3.0,
            std::f32::consts::TAU,
        );
        Self::append_corner_points(
            &mut points,
            if bottom_right > 0.0 { Pos2::new(rect.right() - bottom_right, rect.bottom() - bottom_right) } else { Pos2::new(rect.right(), rect.bottom()) },
            bottom_right,
            0.0,
            std::f32::consts::FRAC_PI_2,
        );
        Self::append_corner_points(
            &mut points,
            if bottom_left > 0.0 { Pos2::new(rect.left() + bottom_left, rect.bottom() - bottom_left) } else { Pos2::new(rect.left(), rect.bottom()) },
            bottom_left,
            std::f32::consts::FRAC_PI_2,
            std::f32::consts::PI,
        );

        points
    }

    fn gradient_color_at_point(gradient: &DesktopLinearGradient, rect: Rect, point: Pos2) -> Color32 {
        let direction = Self::gradient_direction_vector(gradient.angle_deg);
        let corners = [rect.left_top(), rect.right_top(), rect.right_bottom(), rect.left_bottom()];
        let mut min_projection = f32::INFINITY;
        let mut max_projection = f32::NEG_INFINITY;

        for corner in corners {
            let projection = corner.x * direction.x + corner.y * direction.y;
            min_projection = min_projection.min(projection);
            max_projection = max_projection.max(projection);
        }

        let projection = point.x * direction.x + point.y * direction.y;
        let t = if (max_projection - min_projection).abs() < f32::EPSILON {
            0.0
        } else {
            (projection - min_projection) / (max_projection - min_projection)
        };

        Self::evaluate_gradient_color(&gradient.stops, t)
    }

    fn gradient_shape_for_rect(rect: Rect, corner_radius: CornerRadius, gradient: &DesktopLinearGradient) -> egui::Shape {
        let outline = Self::rounded_rect_outline(rect, corner_radius);
        if outline.len() < 3 {
            return egui::Shape::Noop;
        }

        let center = rect.center();
        let mut mesh = egui::Mesh::default();
        mesh.vertices.push(egui::epaint::Vertex {
            pos: center,
            uv: Pos2::new(0.0, 0.0),
            color: Self::gradient_color_at_point(gradient, rect, center),
        });

        for point in &outline {
            mesh.vertices.push(egui::epaint::Vertex {
                pos: *point,
                uv: Pos2::new(0.0, 0.0),
                color: Self::gradient_color_at_point(gradient, rect, *point),
            });
        }

        for index in 0..outline.len() {
            let current = index as u32 + 1;
            let next = if index + 1 < outline.len() { current + 1 } else { 1 };
            mesh.indices.extend_from_slice(&[0, current, next]);
        }

        egui::Shape::mesh(mesh)
    }

    fn resolve_gradient_fallback_color(background: &str) -> Option<Color32> {
        let inner = background
            .split_once('(')
            .and_then(|(_, inner)| inner.strip_suffix(')'))?;
        let parts = Self::split_css_top_level(inner, ',');

        for fragment in parts.iter().skip(1).chain(parts.iter()) {
            if let Some(color) = Self::extract_color_from_css_fragment(fragment) {
                return Some(color);
            }
        }

        None
    }

    fn resolve_background_color_from_style(style: Option<&Map<String, Value>>) -> Option<Color32> {
        let style = style?;
        Self::parse_css_color(style.get("backgroundColor")).or_else(|| {
            let background = style.get("background")?.as_str()?;
            if background.contains("gradient(") {
                return Self::resolve_gradient_fallback_color(background);
            }
            Self::parse_css_color(style.get("background"))
        })
    }

    fn resolve_background_color(&self, node: &NativeElementNode) -> Option<Color32> {
        Self::resolve_effective_background_color_from_style(self.get_style_map(node))
    }

    fn style_disables_border(style: Option<&Map<String, Value>>) -> bool {
        let Some(style) = style else {
            return false;
        };

        let disables_from_text = |value: &str| {
            let normalized = value.trim().to_ascii_lowercase();
            normalized == "none"
                || normalized == "hidden"
                || normalized.split_whitespace().any(|token| token == "none" || token == "hidden")
        };

        if style
            .get("border")
            .and_then(Value::as_str)
            .map(disables_from_text)
            .unwrap_or(false)
        {
            return true;
        }

        if style
            .get("borderStyle")
            .and_then(Value::as_str)
            .map(disables_from_text)
            .unwrap_or(false)
        {
            return true;
        }

        Self::parse_css_number(style.get("borderWidth"))
            .map(|width| width <= 0.0)
            .unwrap_or(false)
    }

    fn resolve_border_stroke_from_style(style: Option<&Map<String, Value>>) -> Option<egui::Stroke> {
        let style = style?;
        if Self::style_disables_border(Some(style)) {
            return None;
        }

        if let Some(border_value) = style.get("border").and_then(Value::as_str) {
            let width = border_value
                .split_whitespace()
                .find_map(|text| Self::parse_css_measure_text(text, None))?;
            let color = Self::extract_color_from_css_fragment(border_value)
                .or_else(|| Self::parse_css_color(style.get("borderColor")))
                .unwrap_or(Color32::from_gray(80));
            return Some(egui::Stroke::new(width.max(1.0), color));
        }

        let width = Self::parse_css_number(style.get("borderWidth"))?;
        if width <= 0.0 {
            return None;
        }
        let color = Self::parse_css_color(style.get("borderColor")).unwrap_or(Color32::from_gray(80));
        Some(egui::Stroke::new(width.max(1.0), color))
    }

    fn resolve_gap_from_style(style: Option<&Map<String, Value>>) -> f32 {
        let Some(style) = style else {
            return 8.0;
        };

        Self::parse_css_number(style.get("gap"))
            .or_else(|| Self::parse_css_number(style.get("rowGap")))
            .unwrap_or(8.0)
    }

    fn resolve_gap(&self, node: &NativeElementNode) -> f32 {
        Self::resolve_gap_from_style(self.get_style_map(node))
    }

    // ── CSS radial-gradient ───────────────────────────────────────────────────

    fn parse_radial_gradient(text: &str) -> Option<DesktopRadialGradient> {
        let trimmed = text.trim();
        let inner = trimmed.strip_prefix("radial-gradient(")?.strip_suffix(')')?;
        let parts = Self::split_css_top_level(inner, ',');
        if parts.is_empty() {
            return None;
        }

        let (shape_part, stop_parts) = {
            let first = parts[0].trim().to_ascii_lowercase();
            let looks_like_color = Self::parse_css_color_text(parts[0].trim()).is_some()
                || first.starts_with("rgb")
                || first.starts_with("hsl")
                || first.starts_with('#')
                || first.contains('%');
            if looks_like_color {
                (None, &parts[..])
            } else {
                (Some(parts[0].trim()), &parts[1..])
            }
        };

        let (center_x, center_y) = shape_part
            .and_then(|shape| {
                let at_pos = shape.find(" at ");
                at_pos.map(|idx| shape[idx + 4..].trim())
            })
            .map(|pos_text| {
                let tokens: Vec<&str> = pos_text.split_whitespace().collect();
                let resolve_pos = |token: &str, is_vertical: bool| -> f32 {
                    match token.to_ascii_lowercase().as_str() {
                        "left" => 0.0,
                        "right" => 1.0,
                        "top" => 0.0,
                        "bottom" => 1.0,
                        "center" => 0.5,
                        other => {
                            if let Some(pct) = other.strip_suffix('%') {
                                pct.parse::<f32>().unwrap_or(50.0) / 100.0
                            } else if is_vertical {
                                0.5
                            } else {
                                0.5
                            }
                        }
                    }
                };
                match tokens.as_slice() {
                    [single] => {
                        let norm = single.to_ascii_lowercase();
                        if matches!(norm.as_str(), "top" | "bottom") {
                            (0.5, resolve_pos(single, true))
                        } else {
                            (resolve_pos(single, false), 0.5)
                        }
                    }
                    [h, v] => (resolve_pos(h, false), resolve_pos(v, true)),
                    _ => (0.5, 0.5),
                }
            })
            .unwrap_or((0.5, 0.5));

        let mut stops = Vec::new();
        let mut prev_pos: Option<f32> = None;
        let n = stop_parts.len();
        for (idx, fragment) in stop_parts.iter().enumerate() {
            let fragment = fragment.trim();
            let tokens: Vec<&str> = fragment.split_whitespace().collect();
            if tokens.is_empty() {
                continue;
            }
            // Use first token as color text
            let color_text = tokens[0];
            let color = match Self::parse_css_color_text(color_text) {
                Some(c) => c,
                None => continue,
            };
            let pos = tokens.get(1)
                .and_then(|t| if t.ends_with('%') { t.trim_end_matches('%').parse::<f32>().ok().map(|v| v / 100.0) } else { None })
                .unwrap_or_else(|| {
                    let auto = idx as f32 / (n.saturating_sub(1).max(1)) as f32;
                    prev_pos.map(|p| p.max(auto)).unwrap_or(auto)
                });
            prev_pos = Some(pos);
            stops.push(DesktopGradientStop { position: pos, color });
        }

        if stops.is_empty() {
            return None;
        }

        Some(DesktopRadialGradient { stops, center_x, center_y })
    }

    fn resolve_background_radial_gradient_from_style(style: Option<&Map<String, Value>>) -> Option<DesktopRadialGradient> {
        let style = style?;
        let background = style.get("background").or_else(|| style.get("backgroundImage"))?.as_str()?;
        Self::parse_radial_gradient(background.trim())
    }

    fn radial_gradient_with_opacity(mut gradient: DesktopRadialGradient, opacity: f32) -> DesktopRadialGradient {
        if opacity >= 1.0 {
            return gradient;
        }
        for stop in &mut gradient.stops {
            stop.color = stop.color.gamma_multiply(opacity);
        }
        gradient
    }

    fn radial_gradient_shape_for_rect(rect: Rect, corner_radius: CornerRadius, gradient: &DesktopRadialGradient) -> egui::Shape {
        let outline = Self::rounded_rect_outline(rect, corner_radius);
        if outline.len() < 3 {
            return egui::Shape::Noop;
        }

        let cx = rect.left() + rect.width() * gradient.center_x;
        let cy = rect.top() + rect.height() * gradient.center_y;
        let center = Pos2::new(cx, cy);
        let max_radius = {
            let corners = [rect.left_top(), rect.right_top(), rect.right_bottom(), rect.left_bottom()];
            corners.iter().map(|p| (center - *p).length()).fold(0.0_f32, f32::max)
        };

        let color_at = |point: Pos2| {
            let dist = (point - center).length();
            let t = if max_radius > f32::EPSILON { (dist / max_radius).clamp(0.0, 1.0) } else { 0.0 };
            Self::evaluate_gradient_color(&gradient.stops, t)
        };

        let center_color = color_at(center);
        let mut mesh = egui::Mesh::default();
        mesh.vertices.push(egui::epaint::Vertex { pos: center, uv: Pos2::ZERO, color: center_color });
        for point in &outline {
            mesh.vertices.push(egui::epaint::Vertex { pos: *point, uv: Pos2::ZERO, color: color_at(*point) });
        }
        for index in 0..outline.len() {
            let current = index as u32 + 1;
            let next = if index + 1 < outline.len() { current + 1 } else { 1 };
            mesh.indices.extend_from_slice(&[0, current, next]);
        }
        egui::Shape::mesh(mesh)
    }

    // ── CSS filter ────────────────────────────────────────────────────────────

    fn parse_filter_function_value(inner: &str) -> f32 {
        let trimmed = inner.trim();
        if let Some(pct) = trimmed.strip_suffix('%') {
            pct.parse::<f32>().unwrap_or(100.0) / 100.0
        } else if let Some(deg) = trimmed.strip_suffix("deg") {
            deg.parse::<f32>().unwrap_or(0.0)
        } else if let Some(rad) = trimmed.strip_suffix("rad") {
            rad.parse::<f32>().unwrap_or(0.0).to_degrees()
        } else if let Some(turn) = trimmed.strip_suffix("turn") {
            turn.parse::<f32>().unwrap_or(0.0) * 360.0
        } else {
            trimmed.parse::<f32>().unwrap_or(1.0)
        }
    }

    fn parse_css_filter_text(text: &str) -> Option<DesktopCssFilter> {
        let normalized = text.trim().to_ascii_lowercase();
        if normalized == "none" || normalized.is_empty() {
            return None;
        }

        let mut filter = DesktopCssFilter::new();
        let mut found = false;
        let mut remaining = normalized.as_str();

        while !remaining.is_empty() {
            remaining = remaining.trim_start();
            let fn_end = remaining.find('(')?;
            let fn_name = remaining[..fn_end].trim();
            let rest = &remaining[fn_end + 1..];
            let args_end = rest.find(')')?;
            let args = rest[..args_end].trim();
            let value = Self::parse_filter_function_value(args);

            match fn_name {
                "brightness" => { filter.brightness = value; found = true; }
                "contrast" => { filter.contrast = value; found = true; }
                "grayscale" => { filter.grayscale = value.clamp(0.0, 1.0); found = true; }
                "invert" => { filter.invert = value.clamp(0.0, 1.0); found = true; }
                "sepia" => { filter.sepia = value.clamp(0.0, 1.0); found = true; }
                "saturate" => { filter.saturate = value; found = true; }
                "hue-rotate" => { filter.hue_rotate_deg = value; found = true; }
                "blur" => {
                    let blur_px = Self::parse_css_measure_text(args, None).unwrap_or(0.0);
                    filter.blur = blur_px;
                    found = true;
                }
                "opacity" => { /* handled via opacity property */ found = true; }
                "drop-shadow" => { /* approximated via box-shadow */ found = true; }
                _ => {}
            }

            remaining = rest[args_end + 1..].trim_start();
        }

        found.then_some(filter)
    }

    fn resolve_css_filter_from_style(style: Option<&Map<String, Value>>) -> Option<DesktopCssFilter> {
        style?.get("filter")?.as_str().and_then(Self::parse_css_filter_text)
    }

    // ── CSS transform ─────────────────────────────────────────────────────────

    fn parse_css_angle_text(text: &str) -> f32 {
        let t = text.trim();
        if let Some(deg) = t.strip_suffix("deg") {
            deg.parse::<f32>().unwrap_or(0.0)
        } else if let Some(rad) = t.strip_suffix("rad") {
            rad.parse::<f32>().unwrap_or(0.0).to_degrees()
        } else if let Some(turn) = t.strip_suffix("turn") {
            turn.parse::<f32>().unwrap_or(0.0) * 360.0
        } else if let Some(grad) = t.strip_suffix("grad") {
            grad.parse::<f32>().unwrap_or(0.0) * 0.9
        } else {
            t.parse::<f32>().unwrap_or(0.0)
        }
    }

    fn parse_css_transform_text(text: &str) -> Option<DesktopCssTransform> {
        let normalized = text.trim().to_ascii_lowercase();
        if normalized == "none" || normalized.is_empty() {
            return None;
        }

        let mut result = DesktopCssTransform::identity();
        let mut found = false;
        let mut remaining = normalized.as_str();

        while !remaining.is_empty() {
            remaining = remaining.trim_start();
            if remaining.is_empty() { break; }
            let fn_end = match remaining.find('(') {
                Some(idx) => idx,
                None => break,
            };
            let fn_name = remaining[..fn_end].trim();
            let rest = &remaining[fn_end + 1..];
            let args_end = match rest.find(')') {
                Some(idx) => idx,
                None => break,
            };
            let args = rest[..args_end].trim();
            let arg_list: Vec<f32> = args.split(',')
                .map(|a| Self::parse_css_measure_text(a.trim(), None).unwrap_or(0.0))
                .collect();

            match fn_name {
                "translate" => {
                    result.translate_x += arg_list.first().copied().unwrap_or(0.0);
                    result.translate_y += arg_list.get(1).copied().unwrap_or(0.0);
                    found = true;
                }
                "translatex" => { result.translate_x += arg_list.first().copied().unwrap_or(0.0); found = true; }
                "translatey" => { result.translate_y += arg_list.first().copied().unwrap_or(0.0); found = true; }
                "translatez" | "translate3d" => { /* 3D translate: ignore Z, apply X/Y */ 
                    result.translate_x += arg_list.first().copied().unwrap_or(0.0);
                    result.translate_y += arg_list.get(1).copied().unwrap_or(0.0);
                    found = true;
                }
                "scale" => {
                    let sx = arg_list.first().copied().unwrap_or(1.0);
                    let sy = arg_list.get(1).copied().unwrap_or(sx);
                    result.scale_x *= sx;
                    result.scale_y *= sy;
                    found = true;
                }
                "scalex" => { result.scale_x *= arg_list.first().copied().unwrap_or(1.0); found = true; }
                "scaley" => { result.scale_y *= arg_list.first().copied().unwrap_or(1.0); found = true; }
                "rotate" | "rotatez" => {
                    result.rotate_deg += Self::parse_css_angle_text(args);
                    found = true;
                }
                "matrix" => {
                    // matrix(a, b, c, d, e, f): extract translate from e,f; approximate scale from a,d; rotation from atan2(b,a)
                    if arg_list.len() >= 6 {
                        let (a, b, _c, d, e, f) = (arg_list[0], arg_list[1], arg_list[2], arg_list[3], arg_list[4], arg_list[5]);
                        result.translate_x += e;
                        result.translate_y += f;
                        result.scale_x *= (a * a + b * b).sqrt();
                        result.scale_y *= (d * d + _c * _c).sqrt();
                        result.rotate_deg += b.atan2(a).to_degrees();
                        found = true;
                    }
                }
                _ => {}
            }

            remaining = rest[args_end + 1..].trim_start();
        }

        found.then_some(result)
    }

    fn resolve_css_transform_from_style(style: Option<&Map<String, Value>>) -> Option<DesktopCssTransform> {
        style?.get("transform")?.as_str().and_then(Self::parse_css_transform_text)
    }

    // ── CSS outline ──────────────────────────────────────────────────────────

    fn resolve_outline_from_style(style: Option<&Map<String, Value>>) -> Option<egui::Stroke> {
        let style = style?;
        let outline_value = style.get("outline")?.as_str()?;
        let normalized = outline_value.trim().to_ascii_lowercase();
        if normalized == "none" || normalized == "0" {
            return None;
        }
        let width = outline_value
            .split_whitespace()
            .find_map(|token| Self::parse_css_measure_text(token, None))
            .unwrap_or(2.0)
            .max(1.0);
        let color = Self::extract_color_from_css_fragment(outline_value)
            .or_else(|| Self::parse_css_color(style.get("outlineColor")))
            .unwrap_or(Color32::from_rgb(0, 95, 200));
        Some(egui::Stroke::new(width, color))
    }

    // ── CSS overflow ─────────────────────────────────────────────────────────

    fn resolve_overflow_behavior(style: Option<&Map<String, Value>>) -> DesktopOverflowBehavior {
        let Some(style) = style else {
            return DesktopOverflowBehavior::default();
        };

        let axis_value = |specific_key: &str| {
            style
                .get(specific_key)
                .or_else(|| style.get("overflow"))
                .and_then(Value::as_str)
                .map(|value| value.trim().to_ascii_lowercase())
        };

        let horizontal = axis_value("overflowX");
        let vertical = axis_value("overflowY");
        let is_scroll = |value: Option<&String>| {
            value
                .map(|value| matches!(value.as_str(), "auto" | "scroll"))
                .unwrap_or(false)
        };
        let is_clip = |value: Option<&String>| {
            value
                .map(|value| matches!(value.as_str(), "hidden" | "clip"))
                .unwrap_or(false)
        };

        DesktopOverflowBehavior {
            horizontal_scroll: is_scroll(horizontal.as_ref()),
            vertical_scroll: is_scroll(vertical.as_ref()),
            horizontal_clip: is_clip(horizontal.as_ref()),
            vertical_clip: is_clip(vertical.as_ref()),
        }
    }

    fn resolve_overflow_hidden_from_style(style: Option<&Map<String, Value>>) -> bool {
        Self::resolve_overflow_behavior(style).has_clip()
    }

    // ── CSS cursor ───────────────────────────────────────────────────────────

    fn resolve_cursor_from_style(style: Option<&Map<String, Value>>) -> Option<egui::CursorIcon> {
        let cursor_value = style?.get("cursor")?.as_str()?;
        match cursor_value.trim().to_ascii_lowercase().as_str() {
            "pointer" | "hand" => Some(egui::CursorIcon::PointingHand),
            "text" | "vertical-text" => Some(egui::CursorIcon::Text),
            "move" | "all-scroll" => Some(egui::CursorIcon::Move),
            "grab" => Some(egui::CursorIcon::Grab),
            "grabbing" => Some(egui::CursorIcon::Grabbing),
            "crosshair" => Some(egui::CursorIcon::Crosshair),
            "not-allowed" | "no-drop" => Some(egui::CursorIcon::NotAllowed),
            "wait" => Some(egui::CursorIcon::Wait),
            "progress" => Some(egui::CursorIcon::Progress),
            "copy" => Some(egui::CursorIcon::Copy),
            "zoom-in" => Some(egui::CursorIcon::ZoomIn),
            "zoom-out" => Some(egui::CursorIcon::ZoomOut),
            "ew-resize" | "col-resize" | "e-resize" | "w-resize" => Some(egui::CursorIcon::ResizeHorizontal),
            "ns-resize" | "row-resize" | "n-resize" | "s-resize" => Some(egui::CursorIcon::ResizeVertical),
            "nesw-resize" | "ne-resize" | "sw-resize" => Some(egui::CursorIcon::ResizeNeSw),
            "nwse-resize" | "nw-resize" | "se-resize" => Some(egui::CursorIcon::ResizeNwSe),
            "none" | "default" => Some(egui::CursorIcon::Default),
            "context-menu" => Some(egui::CursorIcon::ContextMenu),
            "cell" | "alias" | "help" => Some(egui::CursorIcon::Help),
            _ => None,
        }
    }

    // ── CSS text properties ──────────────────────────────────────────────────

    fn resolve_text_shadow_from_style(style: Option<&Map<String, Value>>) -> Option<DesktopTextShadow> {
        let raw = style?.get("textShadow")?.as_str()?;
        let shadow_text = Self::first_css_list_item(raw);
        if shadow_text.is_empty() {
            return None;
        }
        let (color, numeric_text) = Self::extract_shadow_color_fragment(shadow_text)
            .unwrap_or((Color32::from_black_alpha(100), shadow_text.to_string()));
        let numbers: Vec<f32> = numeric_text
            .split_whitespace()
            .filter_map(|t| Self::parse_css_measure_text(t, None))
            .collect();
        if numbers.len() < 2 {
            return None;
        }
        Some(DesktopTextShadow {
            offset_x: numbers[0],
            offset_y: numbers[1],
            blur_radius: numbers.get(2).copied().unwrap_or(0.0),
            color,
        })
    }

    fn resolve_white_space_wraps(style: Option<&Map<String, Value>>) -> bool {
        style.and_then(|s| s.get("whiteSpace").or_else(|| s.get("white-space"))).and_then(Value::as_str)
            .map(|v| {
                let norm = v.trim().to_ascii_lowercase();
                !matches!(norm.as_str(), "nowrap" | "pre" | "pre-line")
            })
            .unwrap_or(true)
    }

    fn resolve_text_overflow_ellipsis(style: Option<&Map<String, Value>>) -> bool {
        style.and_then(|s| s.get("textOverflow")).and_then(Value::as_str)
            .map(|v| v.trim().to_ascii_lowercase() == "ellipsis")
            .unwrap_or(false)
    }

    fn resolve_text_indent_from_style(style: Option<&Map<String, Value>>, font_size: f32, context: CssMeasureContext) -> Option<f32> {
        let value = style?.get("textIndent")?;
        let resolved = match value {
            Value::Number(n) => n.as_f64().map(|v| v as f32),
            Value::String(t) => Self::parse_text_metric_text_with_context(t, font_size, context, false),
            _ => None,
        }?;
        (resolved.abs() > f32::EPSILON).then_some(resolved)
    }

    #[allow(dead_code)]
    fn resolve_word_spacing_from_style(style: Option<&Map<String, Value>>, font_size: f32, context: CssMeasureContext) -> Option<f32> {
        let value = style?.get("wordSpacing")?;
        let resolved = match value {
            Value::Number(n) => n.as_f64().map(|v| v as f32),
            Value::String(t) => {
                if t.trim().to_ascii_lowercase() == "normal" { return None; }
                Self::parse_text_metric_text_with_context(t, font_size, context, false)
            },
            _ => None,
        }?;
        (resolved.abs() > f32::EPSILON).then_some(resolved)
    }

    fn resolve_vertical_align_rise(style: Option<&Map<String, Value>>, font_size: f32) -> Option<f32> {
        let value = style?.get("verticalAlign")?.as_str()?;
        match value.trim().to_ascii_lowercase().as_str() {
            "super" => Some(font_size * 0.33),
            "sub" => Some(-font_size * 0.25),
            "text-top" | "top" => Some(font_size * 0.2),
            "text-bottom" | "bottom" => Some(-font_size * 0.2),
            other => {
                if let Some(pct) = other.strip_suffix('%') {
                    pct.parse::<f32>().ok().map(|v| font_size * v / 100.0)
                } else {
                    Self::parse_css_measure_text(other, None)
                }
            }
        }
    }

    // ── CSS column-count layout ───────────────────────────────────────────────

    fn resolve_column_count_from_style(style: Option<&Map<String, Value>>) -> Option<usize> {
        let style = style?;
        let count = style.get("columnCount")
            .or_else(|| style.get("column-count"))
            .and_then(|v| match v {
                Value::Number(n) => n.as_u64().map(|v| v as usize),
                Value::String(s) => if s.trim().to_ascii_lowercase() == "auto" { None } else { s.trim().parse::<usize>().ok() },
                _ => None,
            })?;
        (count >= 2).then_some(count)
    }

    // ── CSS position offsets ─────────────────────────────────────────────────

    #[allow(dead_code)]
    fn resolve_position_offset_from_style(&self, style: Option<&Map<String, Value>>) -> Option<(f32, f32)> {
        let style = style?;
        let position = style.get("position")?.as_str()?.trim().to_ascii_lowercase();
        if !matches!(position.as_str(), "relative" | "absolute" | "fixed" | "sticky") {
            return None;
        }
        let available = self.viewport_size.x;
        let top = style.get("top").and_then(|v| Self::parse_css_size_against_basis(Some(v), available));
        let left = style.get("left").and_then(|v| Self::parse_css_size_against_basis(Some(v), available));
        let right = style.get("right").and_then(|v| Self::parse_css_size_against_basis(Some(v), available));
        let bottom = style.get("bottom").and_then(|v| Self::parse_css_size_against_basis(Some(v), available));
        let dx = left.unwrap_or_else(|| right.map(|r| -r).unwrap_or(0.0));
        let dy = top.unwrap_or_else(|| bottom.map(|b| -b).unwrap_or(0.0));
        if dx.abs() < f32::EPSILON && dy.abs() < f32::EPSILON { None } else { Some((dx, dy)) }
    }

    // ── CSS object-fit ────────────────────────────────────────────────────────

    fn resolve_object_fit_image_size(object_fit: &str, display_size: Vec2, natural_size: Vec2) -> Vec2 {
        let norm = object_fit.trim().to_ascii_lowercase();
        match norm.as_str() {
            "contain" | "scale-down" => {
                let scale_w = if natural_size.x > 0.0 { display_size.x / natural_size.x } else { 1.0 };
                let scale_h = if natural_size.y > 0.0 { display_size.y / natural_size.y } else { 1.0 };
                let scale = scale_w.min(scale_h).min(if norm == "scale-down" { 1.0 } else { f32::MAX });
                Vec2::new((natural_size.x * scale).max(1.0), (natural_size.y * scale).max(1.0))
            }
            "cover" => {
                let scale_w = if natural_size.x > 0.0 { display_size.x / natural_size.x } else { 1.0 };
                let scale_h = if natural_size.y > 0.0 { display_size.y / natural_size.y } else { 1.0 };
                let scale = scale_w.max(scale_h);
                Vec2::new((natural_size.x * scale).max(1.0), (natural_size.y * scale).max(1.0))
            }
            "none" => Vec2::new(natural_size.x.max(1.0), natural_size.y.max(1.0)),
            _ => display_size, // "fill" default
        }
    }

    fn is_row_layout_from_style(style: Option<&Map<String, Value>>) -> bool {
        let Some(style) = style else {
            return false;
        };

        style
            .get("flexDirection")
            .and_then(Value::as_str)
            .map(|value| value.eq_ignore_ascii_case("row"))
            .unwrap_or_else(|| {
                style
                    .get("display")
                    .and_then(Value::as_str)
                    .map(|value| value.eq_ignore_ascii_case("flex") || value.eq_ignore_ascii_case("inline-flex"))
                    .unwrap_or(false)
            })
    }

    fn is_inline_display_from_style(style: Option<&Map<String, Value>>) -> bool {
        style
            .and_then(|style| style.get("display"))
            .and_then(Value::as_str)
            .map(|value| {
                matches!(
                    value.trim().to_ascii_lowercase().as_str(),
                    "inline" | "inline-block" | "inline-flex" | "inline-grid"
                )
            })
            .unwrap_or(false)
    }

    fn resolve_text_color_from_style(style: Option<&Map<String, Value>>) -> Option<Color32> {
        let style = style?;
        let opacity = Self::resolve_opacity_from_style(Some(style));
        Self::parse_css_color(style.get("color")).map(|color| color.gamma_multiply(opacity))
    }

    fn has_text_decoration(style: Option<&Map<String, Value>>, decoration: &str) -> bool {
        style
            .and_then(|style| style.get("textDecoration").or_else(|| style.get("textDecorationLine")))
            .and_then(Value::as_str)
            .map(|value| {
                let normalized = value.to_ascii_lowercase();
                normalized.split_whitespace().any(|token| token == decoration)
            })
            .unwrap_or(false)
    }

    fn apply_text_transform(text: &str, transform: Option<&str>) -> String {
        match transform
            .map(str::trim)
            .filter(|value| !value.is_empty())
            .map(|value| value.to_ascii_lowercase())
            .as_deref()
        {
            Some("uppercase") => text.to_uppercase(),
            Some("lowercase") => text.to_lowercase(),
            Some("capitalize") => {
                let mut transformed = String::with_capacity(text.len());
                let mut capitalize_next = true;

                for character in text.chars() {
                    if character.is_alphabetic() {
                        if capitalize_next {
                            transformed.extend(character.to_uppercase());
                        } else {
                            transformed.push(character);
                        }
                        capitalize_next = false;
                        continue;
                    }

                    transformed.push(character);
                    if character.is_whitespace() || matches!(character, '-' | '_' | '/' | '(' | '[' | '{') {
                        capitalize_next = true;
                    }
                }

                transformed
            }
            _ => text.to_string(),
        }
    }

    fn style_requests_bold(style: Option<&Map<String, Value>>) -> bool {
        style
            .and_then(|style| style.get("fontWeight"))
            .map(|font_weight| match font_weight {
                Value::Number(number) => number.as_i64().unwrap_or_default() >= 600,
                Value::String(text) => {
                    text.eq_ignore_ascii_case("bold") || text.parse::<i64>().unwrap_or_default() >= 600
                }
                _ => false,
            })
            .unwrap_or(false)
    }

    fn style_requests_italic(style: Option<&Map<String, Value>>) -> bool {
        style
            .and_then(|style| style.get("fontStyle"))
            .and_then(Value::as_str)
            .map(|value| {
                let normalized = value.trim().to_ascii_lowercase();
                normalized == "italic" || normalized == "oblique"
            })
            .unwrap_or(false)
    }

    fn is_plain_css_number_text(text: &str) -> bool {
        let trimmed = text.trim();
        !trimmed.is_empty()
            && trimmed
                .chars()
                .all(|character| character.is_ascii_digit() || matches!(character, '.' | '-' | '+'))
    }

    fn parse_text_metric_text_with_context(
        text: &str,
        font_size: f32,
        context: CssMeasureContext,
        unitless_is_multiplier: bool,
    ) -> Option<f32> {
        let trimmed = text.trim();
        if trimmed.is_empty() || trimmed.eq_ignore_ascii_case("normal") {
            return None;
        }

        if let Some(inner) = trimmed.strip_prefix("clamp(").and_then(|text| text.strip_suffix(')')) {
            let parts = Self::split_css_top_level(inner, ',');
            if parts.len() == 3 {
                let min = Self::parse_text_metric_text_with_context(parts[0].trim(), font_size, context, unitless_is_multiplier);
                let preferred = Self::parse_text_metric_text_with_context(parts[1].trim(), font_size, context, unitless_is_multiplier).or(min);
                let max = Self::parse_text_metric_text_with_context(parts[2].trim(), font_size, context, unitless_is_multiplier).or(preferred).or(min);

                return match (min, preferred, max) {
                    (Some(min), Some(preferred), Some(max)) => Some(preferred.clamp(min, max)),
                    (Some(min), Some(preferred), None) => Some(preferred.max(min)),
                    (Some(min), None, Some(max)) => Some(min.min(max)),
                    (Some(min), None, None) => Some(min),
                    (None, Some(preferred), Some(max)) => Some(preferred.min(max)),
                    (None, Some(preferred), None) => Some(preferred),
                    (None, None, Some(max)) => Some(max),
                    (None, None, None) => None,
                };
            }
        }

        if let Some(rem_text) = trimmed.strip_suffix("rem") {
            return Self::parse_css_number_text(rem_text).map(|value| value * 16.0);
        }

        if let Some(em_text) = trimmed.strip_suffix("em") {
            return Self::parse_css_number_text(em_text).map(|value| value * font_size);
        }

        if let Some(px_text) = trimmed.strip_suffix("px") {
            return Self::parse_css_number_text(px_text);
        }

        if let Some(percent_text) = trimmed.strip_suffix('%') {
            return Self::parse_css_number_text(percent_text).map(|value| font_size * value / 100.0);
        }

        if let Some(vw_text) = trimmed.strip_suffix("vw") {
            return Self::parse_css_number_text(vw_text)
                .zip(context.viewport_width)
                .map(|(value, viewport_width)| viewport_width * value / 100.0);
        }

        if let Some(vh_text) = trimmed.strip_suffix("vh") {
            return Self::parse_css_number_text(vh_text)
                .zip(context.viewport_height)
                .map(|(value, viewport_height)| viewport_height * value / 100.0);
        }

        if let Some(vmin_text) = trimmed.strip_suffix("vmin") {
            let viewport = match (context.viewport_width, context.viewport_height) {
                (Some(width), Some(height)) => Some(width.min(height)),
                (Some(width), None) => Some(width),
                (None, Some(height)) => Some(height),
                (None, None) => None,
            };
            return Self::parse_css_number_text(vmin_text)
                .zip(viewport)
                .map(|(value, viewport)| viewport * value / 100.0);
        }

        if let Some(vmax_text) = trimmed.strip_suffix("vmax") {
            let viewport = match (context.viewport_width, context.viewport_height) {
                (Some(width), Some(height)) => Some(width.max(height)),
                (Some(width), None) => Some(width),
                (None, Some(height)) => Some(height),
                (None, None) => None,
            };
            return Self::parse_css_number_text(vmax_text)
                .zip(viewport)
                .map(|(value, viewport)| viewport * value / 100.0);
        }

        if Self::is_plain_css_number_text(trimmed) {
            return Self::parse_css_number_text(trimmed).map(|value| {
                if unitless_is_multiplier {
                    value * font_size
                } else {
                    value
                }
            });
        }

        None
    }

    fn resolve_text_line_height(style: Option<&Map<String, Value>>, font_size: f32, context: CssMeasureContext) -> Option<f32> {
        let value = style?.get("lineHeight")?;
        let resolved = match value {
            Value::Number(number) => number.as_f64().map(|value| value as f32 * font_size),
            Value::String(text) => Self::parse_text_metric_text_with_context(text, font_size, context, true),
            _ => None,
        }?;

        (resolved > 0.0).then_some(resolved)
    }

    fn resolve_text_letter_spacing(style: Option<&Map<String, Value>>, font_size: f32, context: CssMeasureContext) -> Option<f32> {
        let value = style?.get("letterSpacing")?;
        match value {
            Value::Number(number) => number.as_f64().map(|value| value as f32),
            Value::String(text) => Self::parse_text_metric_text_with_context(text, font_size, context, false),
            _ => None,
        }
    }

    fn resolve_text_font_id(
        &self,
        ui: &egui::Ui,
        style: Option<&Map<String, Value>>,
    ) -> (Option<egui::FontId>, bool, bool) {
        let Some(style) = style else {
            return (None, false, false);
        };

        let mut font_id = egui::TextStyle::Body.resolve(ui.style().as_ref());
        let wants_bold = Self::style_requests_bold(Some(style));
        let wants_italic = Self::style_requests_italic(Some(style));
        let mut applied = false;
        let mut bold_from_font = false;
        let mut italic_from_font = false;

        if let Some((font_family, resolved_bold, resolved_italic)) =
            self.resolve_font_family_from_style(Some(style), wants_bold, wants_italic)
        {
            font_id.family = font_family;
            bold_from_font = resolved_bold;
            italic_from_font = resolved_italic;
            applied = true;
        }

        if let Some(font_size) = self.parse_css_number_with_viewport(style.get("fontSize")) {
            font_id.size = font_size.max(12.0);
            applied = true;
        }

        (applied.then_some(font_id), bold_from_font, italic_from_font)
    }

    fn resolve_text_style_from_style(
        &self,
        ui: &egui::Ui,
        style: Option<&Map<String, Value>>,
        text: String,
        include_color: bool,
    ) -> RichText {
        let transformed_text = Self::apply_text_transform(
            &text,
            style
                .and_then(|style| style.get("textTransform"))
                .and_then(Value::as_str),
        );
        let mut rich_text = RichText::new(transformed_text);

        if let Some(style) = style {
            if include_color {
                if let Some(color) = Self::resolve_text_color_from_style(Some(style)) {
                    rich_text = rich_text.color(color);
                }
            }

            let wants_bold = Self::style_requests_bold(Some(style));
            let wants_italic = Self::style_requests_italic(Some(style));
            let (font_id, bold_from_font, italic_from_font) = self.resolve_text_font_id(ui, Some(style));
            let resolved_font_size = font_id
                .as_ref()
                .map(|font_id| font_id.size)
                .unwrap_or_else(|| egui::TextStyle::Body.resolve(ui.style().as_ref()).size);
            let text_measure_context = self.css_measure_context(Some(resolved_font_size));
            if let Some(font_id) = font_id {
                rich_text = rich_text.font(font_id);
            }

            if let Some(line_height) = Self::resolve_text_line_height(Some(style), resolved_font_size, text_measure_context) {
                rich_text = rich_text.line_height(Some(line_height));
            }

            if let Some(letter_spacing) = Self::resolve_text_letter_spacing(Some(style), resolved_font_size, text_measure_context) {
                rich_text = rich_text.extra_letter_spacing(letter_spacing);
            }

            if wants_bold && !bold_from_font {
                rich_text = rich_text.strong();
            }

            if wants_italic && !italic_from_font {
                rich_text = rich_text.italics();
            }

            if Self::has_text_decoration(Some(style), "underline") {
                rich_text = rich_text.underline();
            }
            if Self::has_text_decoration(Some(style), "line-through") {
                rich_text = rich_text.strikethrough();
            }

            // vertical-align rise/drop (super/sub/percentage)
            if let Some(rise) = Self::resolve_vertical_align_rise(Some(style), resolved_font_size) {
                rich_text = rich_text.text_style(egui::TextStyle::Body); // ensure font is set
                // egui doesn't have a direct rise API; approximate with raised heading trick
                // We store it via a background color hack - use raised() which applies a baseline shift
                if rise > 0.0 {
                    rich_text = rich_text.raised();
                } else {
                    rich_text = rich_text.small();
                }
            }
        }

        rich_text
    }

    #[allow(dead_code)]
    fn resolve_text_style(&self, ui: &egui::Ui, node: &NativeElementNode, text: String) -> RichText {
        self.resolve_text_style_from_style(ui, self.get_style_map(node), text, true)
    }

    fn resolve_widget_min_size(&self, style: Option<&Map<String, Value>>) -> Vec2 {
        let width = style
            .and_then(|style| self.parse_css_number_with_viewport(style.get("width")).or_else(|| self.parse_css_number_with_viewport(style.get("minWidth"))))
            .unwrap_or(0.0)
            .max(0.0);
        let height = style
            .and_then(|style| self.parse_css_number_with_viewport(style.get("height")).or_else(|| self.parse_css_number_with_viewport(style.get("minHeight"))))
            .unwrap_or(0.0)
            .max(0.0);
        Vec2::new(width, height)
    }

    fn resolve_widget_state_styles(
        &self,
        node: &NativeElementNode,
        base_state: DesktopPseudoState,
    ) -> DesktopWidgetStateStyles {
        let inactive = self.resolve_style_map_with_state(node, base_state);

        let mut hovered_state = base_state;
        hovered_state.hovered = true;
        let hovered = self.resolve_style_map_with_state(node, hovered_state);

        let mut active_state = hovered_state;
        active_state.active = true;
        let active = self.resolve_style_map_with_state(node, active_state);

        let mut focus_state = base_state;
        focus_state.focused = true;
        focus_state.focus_within = true;
        let focus = self.resolve_style_map_with_state(node, focus_state);

        let mut disabled_state = base_state;
        disabled_state.enabled = false;
        disabled_state.disabled = true;
        let disabled = self.resolve_style_map_with_state(node, disabled_state);

        DesktopWidgetStateStyles {
            inactive,
            hovered,
            active,
            focus,
            disabled,
        }
    }

    fn container_supports_runtime_visual_state(&self, node: &NativeElementNode) -> bool {
        resolve_interaction(node, None, None).is_some()
            || node.events.iter().any(|event| event == "press")
            || self.has_focusable_tab_index(node)
            || self.get_style_variant_map(node, "hover").is_some()
            || self.get_style_variant_map(node, "active").is_some()
            || self.get_style_variant_map(node, "focus").is_some()
            || self.get_style_variant_map(node, "focusWithin").is_some()
            || self.get_style_variant_map(node, "disabled").is_some()
    }

    fn resolve_container_state_style_from_flags<'a>(
        state_styles: &'a DesktopWidgetStateStyles,
        disabled: bool,
        hovered: bool,
        active: bool,
        focused: bool,
    ) -> Option<&'a Map<String, Value>> {
        if disabled {
            return state_styles.disabled.as_ref().or(state_styles.inactive.as_ref());
        }

        if active {
            return state_styles
                .active
                .as_ref()
                .or(state_styles.hovered.as_ref())
                .or(state_styles.focus.as_ref())
                .or(state_styles.inactive.as_ref());
        }

        if hovered {
            return state_styles
                .hovered
                .as_ref()
                .or(state_styles.focus.as_ref())
                .or(state_styles.inactive.as_ref());
        }

        if focused {
            return state_styles
                .focus
                .as_ref()
                .or(state_styles.inactive.as_ref());
        }

        state_styles.inactive.as_ref()
    }

    fn resolve_container_state_style<'a>(
        response: &egui::Response,
        state_styles: &'a DesktopWidgetStateStyles,
        disabled: bool,
    ) -> Option<&'a Map<String, Value>> {
        Self::resolve_container_state_style_from_flags(
            state_styles,
            disabled,
            response.hovered(),
            response.is_pointer_button_down_on(),
            response.has_focus(),
        )
    }

    fn resolve_widget_width_from_style(
        &self,
        style: Option<&Map<String, Value>>,
        available_width: f32,
    ) -> Option<f32> {
        let Some(style) = style else {
            return None;
        };

        let available_width = available_width.max(0.0);
        let width = self.parse_css_size_against_basis_with_viewport(style.get("width"), available_width);
        let min_width = self.parse_css_size_against_basis_with_viewport(style.get("minWidth"), available_width);
        let max_width = self.parse_css_size_against_basis_with_viewport(style.get("maxWidth"), available_width);

        let mut resolved = if let Some(width) = width {
            width
        } else if let Some(max_width) = max_width {
            available_width.min(max_width)
        } else if let Some(min_width) = min_width {
            min_width
        } else {
            return None;
        };

        if let Some(min_width) = min_width {
            resolved = resolved.max(min_width);
        }
        if let Some(max_width) = max_width {
            resolved = resolved.min(max_width);
        }

        (resolved > 0.0).then_some(resolved)
    }

    fn style_has_widget_frame(style: Option<&Map<String, Value>>) -> bool {
        Self::resolve_background_color_from_style(style).is_some()
            || Self::resolve_border_stroke_from_style(style).is_some()
            || Self::resolve_corner_radius_from_style(style).is_some()
            || Self::resolve_box_edges(style, "padding").is_some()
    }

    fn apply_widget_visual_style(visuals: &mut egui::style::WidgetVisuals, style: Option<&Map<String, Value>>) {
        let Some(style) = style else {
            return;
        };

        if Self::resolve_background_gradient_from_style(Some(style)).is_some() {
            visuals.weak_bg_fill = Color32::TRANSPARENT;
            visuals.bg_fill = Color32::TRANSPARENT;
        } else if let Some(fill) = Self::resolve_effective_background_color_from_style(Some(style)) {
            visuals.weak_bg_fill = fill;
            visuals.bg_fill = fill;
        }

        if let Some(stroke) = Self::resolve_border_stroke_from_style(Some(style)) {
            visuals.bg_stroke = stroke;
        } else if Self::style_disables_border(Some(style)) {
            visuals.bg_stroke = egui::Stroke::NONE;
        }

        if let Some(color) = Self::resolve_text_color_from_style(Some(style)) {
            visuals.fg_stroke.color = color;
        }

        if let Some(corner_radius) = Self::resolve_corner_radius_from_style(Some(style)) {
            visuals.corner_radius = corner_radius;
        }

        let opacity = Self::resolve_opacity_from_style(Some(style));
        if opacity < 1.0 {
            visuals.weak_bg_fill = visuals.weak_bg_fill.gamma_multiply(opacity);
            visuals.bg_fill = visuals.bg_fill.gamma_multiply(opacity);
            visuals.bg_stroke.color = visuals.bg_stroke.color.gamma_multiply(opacity);
            visuals.fg_stroke.color = visuals.fg_stroke.color.gamma_multiply(opacity);
        }
    }

    fn apply_widget_state_visuals(
        &self,
        ui: &mut egui::Ui,
        inactive_style: Option<&Map<String, Value>>,
        hovered_style: Option<&Map<String, Value>>,
        active_style: Option<&Map<String, Value>>,
        focus_style: Option<&Map<String, Value>>,
        disabled_style: Option<&Map<String, Value>>,
    ) {
        let visuals = ui.visuals_mut();

        let mut inactive = visuals.widgets.inactive;
        Self::apply_widget_visual_style(&mut inactive, inactive_style);

        let mut hovered = visuals.widgets.hovered;
        Self::apply_widget_visual_style(&mut hovered, hovered_style.or(inactive_style));

        let mut active = visuals.widgets.active;
        Self::apply_widget_visual_style(&mut active, active_style.or(hovered_style).or(focus_style).or(inactive_style));

        let mut open = visuals.widgets.open;
        Self::apply_widget_visual_style(&mut open, focus_style.or(active_style).or(hovered_style).or(inactive_style));

        let mut noninteractive = visuals.widgets.noninteractive;
        Self::apply_widget_visual_style(&mut noninteractive, disabled_style.or(inactive_style));

        visuals.widgets.inactive = inactive;
        visuals.widgets.hovered = hovered;
        visuals.widgets.active = active;
        visuals.widgets.open = open;
        visuals.widgets.noninteractive = noninteractive;

        if let Some(hyperlink_color) = Self::resolve_text_color_from_style(inactive_style) {
            visuals.hyperlink_color = hyperlink_color;
        }
    }

    fn resolve_prop_number(&self, node: &NativeElementNode, key: &str) -> Option<f32> {
        Self::parse_css_number(node.props.get(key))
    }

    fn resolve_prop_string<'a>(&self, node: &'a NativeElementNode, key: &str) -> Option<&'a str> {
        node.props.get(key).and_then(Value::as_str).map(str::trim).filter(|value| !value.is_empty())
    }

    fn resolve_label(&self, node: &NativeElementNode) -> Option<String> {
        ["aria-label", "label", "title", "name", "alt"]
            .iter()
            .find_map(|key| self.resolve_prop_string(node, key).map(str::to_string))
            .or_else(|| {
                let text = self.collect_text_content(&NativeNode::Element(node.clone()));
                let trimmed = text.trim();
                (!trimmed.is_empty()).then_some(trimmed.to_string())
            })
    }

    fn is_disabled(&self, node: &NativeElementNode) -> bool {
        parse_native_bool(node.props.get("disabled")) || parse_native_bool(node.props.get("aria-disabled"))
    }

    fn is_read_only(&self, node: &NativeElementNode) -> bool {
        parse_native_bool(node.props.get("readOnly")) || parse_native_bool(node.props.get("readonly"))
    }

    fn resource_base_dir(&self) -> Option<&Path> {
        self.resource_base_dir.as_deref()
    }

    fn resolve_resource_path(&self, source: &str) -> Option<PathBuf> {
        resolve_resource_path(self.resource_base_dir(), source)
    }

    fn read_source_preview(&self, source: &str) -> Option<String> {
        if is_probably_inline_html(source) {
            return Some(truncate_preview(&strip_markup_tags(source), 360));
        }

        let path = self.resolve_resource_path(source)?;
        let content = std::fs::read_to_string(path).ok()?;
        Some(truncate_preview(&strip_markup_tags(&content), 360))
    }

    fn escape_html_text(text: &str) -> String {
        text
            .replace('&', "&amp;")
            .replace('<', "&lt;")
            .replace('>', "&gt;")
    }

    fn escape_html_attribute(text: &str) -> String {
        Self::escape_html_text(text).replace('"', "&quot;")
    }

    fn file_url_from_path(path: &Path) -> String {
        let normalized = path.to_string_lossy().replace('\\', "/");
        let encoded = normalized
            .replace('%', "%25")
            .replace(' ', "%20")
            .replace('#', "%23")
            .replace('?', "%3F");
        if encoded.starts_with('/') {
            format!("file://{encoded}")
        } else {
            format!("file:///{encoded}")
        }
    }

    fn resolve_surface_window_url(&self, source: &str) -> Option<String> {
        let trimmed = source.trim();
        if trimmed.is_empty() {
            return None;
        }

        if is_external_destination(trimmed) || trimmed.starts_with("data:") {
            return Some(trimmed.to_string());
        }

        self.resolve_resource_path(trimmed)
            .map(|path| Self::file_url_from_path(&path))
    }

    fn build_media_surface_html(
        kind: DesktopSurfaceWindowKind,
        title: &str,
        source_url: &str,
        poster_url: Option<&str>,
        autoplay: bool,
        looping: bool,
        muted: bool,
        controls: bool,
        plays_inline: bool,
    ) -> String {
        let title = Self::escape_html_text(title);
        let source_url = Self::escape_html_attribute(source_url);
        let poster_attr = poster_url
            .map(Self::escape_html_attribute)
            .map(|value| format!(" poster=\"{value}\""))
            .unwrap_or_default();
        let autoplay_attr = autoplay.then_some(" autoplay").unwrap_or_default();
        let loop_attr = looping.then_some(" loop").unwrap_or_default();
        let muted_attr = muted.then_some(" muted").unwrap_or_default();
        let controls_attr = controls.then_some(" controls").unwrap_or_default();
        let plays_inline_attr = plays_inline.then_some(" playsinline").unwrap_or_default();
        let body = match kind {
            DesktopSurfaceWindowKind::Audio => format!(
                "<audio src=\"{source_url}\" preload=\"metadata\"{autoplay_attr}{loop_attr}{muted_attr}{controls_attr}></audio>"
            ),
            DesktopSurfaceWindowKind::Video => format!(
                "<video src=\"{source_url}\" preload=\"metadata\"{poster_attr}{autoplay_attr}{loop_attr}{muted_attr}{controls_attr}{plays_inline_attr}></video>"
            ),
            DesktopSurfaceWindowKind::WebView => String::new(),
        };

        format!(
            "<!DOCTYPE html><html><head><meta charset=\"utf-8\"><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"><title>{title}</title><style>html,body{{margin:0;height:100%;background:#111;color:#f6f3ee;font-family:Segoe UI,Arial,sans-serif;}}body{{display:flex;align-items:center;justify-content:center;}}video,audio{{width:min(100%, 1200px);max-height:100%;background:#000;outline:none;}}audio{{padding:24px;box-sizing:border-box;background:#181818;border-radius:16px;}}</style></head><body>{body}</body></html>"
        )
    }

    fn open_native_surface_window(
        &self,
        source: &str,
        title: &str,
        kind: DesktopSurfaceWindowKind,
        poster: Option<&str>,
        autoplay: bool,
        looping: bool,
        muted: bool,
        controls: bool,
        plays_inline: bool,
    ) -> Result<(), String> {
        let trimmed_title = title.trim();
        let title = if trimmed_title.is_empty() {
            match kind {
                DesktopSurfaceWindowKind::WebView => String::from("WebView"),
                DesktopSurfaceWindowKind::Video => String::from("Video"),
                DesktopSurfaceWindowKind::Audio => String::from("Audio"),
            }
        } else {
            trimmed_title.to_string()
        };

        match kind {
            DesktopSurfaceWindowKind::WebView => {
                if is_probably_inline_html(source) {
                    spawn_native_surface_window(title, 1024.0, 720.0, None, Some(source.to_string()))
                } else {
                    let url = self
                        .resolve_surface_window_url(source)
                        .ok_or_else(|| format!("unable to resolve surface source '{source}'"))?;
                    spawn_native_surface_window(title, 1024.0, 720.0, Some(url), None)
                }
            }
            DesktopSurfaceWindowKind::Video | DesktopSurfaceWindowKind::Audio => {
                let source_url = self
                    .resolve_surface_window_url(source)
                    .ok_or_else(|| format!("unable to resolve media source '{source}'"))?;
                let poster_url = poster.and_then(|poster| self.resolve_surface_window_url(poster));
                let html = Self::build_media_surface_html(
                    kind,
                    &title,
                    &source_url,
                    poster_url.as_deref(),
                    autoplay,
                    looping,
                    muted,
                    controls,
                    plays_inline,
                );
                spawn_native_surface_window(title, 1024.0, 720.0, None, Some(html))
            }
        }
    }

    fn supports_embedded_surfaces() -> bool {
        cfg!(target_os = "windows")
    }

    fn has_focusable_tab_index(&self, node: &NativeElementNode) -> bool {
        node.props
            .get("tabIndex")
            .or_else(|| node.props.get("tabindex"))
            .and_then(|value| match value {
                Value::Number(number) => number.as_i64(),
                Value::String(text) => text.trim().parse::<i64>().ok(),
                _ => None,
            })
            .map(|value| value >= 0)
            .unwrap_or(false)
    }

    fn resolve_embedded_surface_size(&self, node: &NativeElementNode, available_width: f32, fallback: Vec2) -> Vec2 {
        let style = self.get_style_map(node);
        let width = style
            .and_then(|style| self.parse_css_size_against_basis_with_viewport(style.get("width"), available_width))
            .or_else(|| self.resolve_prop_number(node, "width"));
        let min_width = style.and_then(|style| self.parse_css_size_against_basis_with_viewport(style.get("minWidth"), available_width));
        let max_width = style.and_then(|style| self.parse_css_size_against_basis_with_viewport(style.get("maxWidth"), available_width));
        let height = style
            .and_then(|style| self.parse_css_number_with_viewport(style.get("height")))
            .or_else(|| self.resolve_prop_number(node, "height"));
        let min_height = style.and_then(|style| self.parse_css_number_with_viewport(style.get("minHeight")));
        let max_height = style.and_then(|style| self.parse_css_number_with_viewport(style.get("maxHeight")));

        let aspect_ratio = if fallback.y.abs() > f32::EPSILON {
            fallback.x / fallback.y
        } else {
            16.0 / 9.0
        };

        let mut size = fallback;
        match (width, height) {
            (Some(width), Some(height)) => {
                size = Vec2::new(width.max(1.0), height.max(1.0));
            }
            (Some(width), None) => {
                size = Vec2::new(width.max(1.0), (width / aspect_ratio).max(1.0));
            }
            (None, Some(height)) => {
                size = Vec2::new((height * aspect_ratio).max(1.0), height.max(1.0));
            }
            (None, None) => {
                if size.x > available_width {
                    let scale = available_width / size.x.max(1.0);
                    size *= scale.max(0.0);
                }
            }
        }

        if width.is_none() && size.x > available_width {
            let scale = available_width / size.x.max(1.0);
            size *= scale.max(0.0);
        }

        if let Some(min_width) = min_width {
            size.x = size.x.max(min_width);
        }
        if let Some(max_width) = max_width {
            size.x = size.x.min(max_width);
        }
        if let Some(min_height) = min_height {
            size.y = size.y.max(min_height);
        }
        if let Some(max_height) = max_height {
            size.y = size.y.min(max_height);
        }

        Vec2::new(size.x.max(1.0), size.y.max(1.0))
    }

    fn resolve_embedded_web_view_content(&self, source: &str) -> Option<DesktopEmbeddedSurfaceContent> {
        if is_probably_inline_html(source) {
            return Some(DesktopEmbeddedSurfaceContent::Html(source.to_string()));
        }

        self.resolve_surface_window_url(source)
            .map(DesktopEmbeddedSurfaceContent::Url)
    }

    fn resolve_embedded_media_content(
        &self,
        kind: DesktopSurfaceWindowKind,
        title: &str,
        source: &str,
        poster: Option<&str>,
        autoplay: bool,
        looping: bool,
        muted: bool,
        controls: bool,
        plays_inline: bool,
    ) -> Option<DesktopEmbeddedSurfaceContent> {
        let source_url = self.resolve_surface_window_url(source)?;
        let poster_url = poster.and_then(|poster| self.resolve_surface_window_url(poster));
        Some(DesktopEmbeddedSurfaceContent::Html(Self::build_media_surface_html(
            kind,
            title,
            &source_url,
            poster_url.as_deref(),
            autoplay,
            looping,
            muted,
            controls,
            plays_inline,
        )))
    }

    fn queue_embedded_surface_request(&mut self, key: String, request: DesktopEmbeddedSurfaceRequest) {
        self.embedded_surface_requests.insert(key, request);
    }

    fn resolve_embedded_surface_visibility(rect: Rect, clip_rect: Rect) -> DesktopEmbeddedSurfaceVisibility {
        let intersects = rect.max.x > clip_rect.min.x
            && rect.min.x < clip_rect.max.x
            && rect.max.y > clip_rect.min.y
            && rect.min.y < clip_rect.max.y;

        if !intersects {
            return DesktopEmbeddedSurfaceVisibility::Hidden;
        }

        if clip_rect.contains_rect(rect) {
            DesktopEmbeddedSurfaceVisibility::Visible
        } else {
            DesktopEmbeddedSurfaceVisibility::Clipped
        }
    }

    fn render_embedded_surface_slot(
        &mut self,
        ui: &mut egui::Ui,
        node: &NativeElementNode,
        path: &str,
        title: &str,
        kind: DesktopSurfaceWindowKind,
        content: DesktopEmbeddedSurfaceContent,
        fallback_size: Vec2,
    ) {
        let desired_size = self.resolve_embedded_surface_size(node, ui.available_width().max(1.0), fallback_size);
        let (rect, response) = ui.allocate_exact_size(desired_size, egui::Sense::click());
        let visibility = Self::resolve_embedded_surface_visibility(rect, ui.clip_rect());
        if visibility == DesktopEmbeddedSurfaceVisibility::Hidden {
            return;
        }

        let style = self.get_style_map(node);
        let fill = Self::resolve_effective_background_color_from_style(style).unwrap_or(Color32::from_rgb(17, 17, 17));
        let stroke = Self::resolve_border_stroke_from_style(style).unwrap_or_else(|| egui::Stroke::new(1.0, Color32::from_gray(52)));
        let corner_radius = Self::resolve_corner_radius_from_style(style).unwrap_or(CornerRadius::same(12));
        ui.painter().rect_filled(rect, corner_radius, fill);
        ui.painter().rect_stroke(rect, corner_radius, stroke, StrokeKind::Outside);

        if visibility == DesktopEmbeddedSurfaceVisibility::Clipped {
            ui.painter().text(
                rect.center(),
                Align2::CENTER_CENTER,
                title,
                egui::FontId::proportional(13.0),
                Color32::from_gray(190),
            );
            return;
        }

        self.queue_embedded_surface_request(
            path.to_string(),
            DesktopEmbeddedSurfaceRequest {
                kind,
                title: title.to_string(),
                rect,
                content,
                focus_requested: response.clicked(),
            },
        );
    }

    #[cfg(target_os = "windows")]
    fn wry_rect_from_egui_rect(rect: Rect) -> WryRect {
        WryRect {
            position: WryLogicalPosition::new(rect.min.x as f64, rect.min.y as f64).into(),
            size: WryLogicalSize::new(rect.width().max(1.0) as f64, rect.height().max(1.0) as f64).into(),
        }
    }

    #[cfg(target_os = "windows")]
    fn build_embedded_surface_webview(
        frame: &eframe::Frame,
        key: &str,
        request: &DesktopEmbeddedSurfaceRequest,
    ) -> Result<WebView, String> {
        let mut builder = WebViewBuilder::new()
            .with_id(key)
            .with_bounds(Self::wry_rect_from_egui_rect(request.rect));

        builder = match &request.content {
            DesktopEmbeddedSurfaceContent::Url(url) => builder.with_url(url),
            DesktopEmbeddedSurfaceContent::Html(html) => builder.with_html(html),
        };

        builder.build_as_child(frame).map_err(|error| error.to_string())
    }

    #[cfg(target_os = "windows")]
    fn reconcile_embedded_surfaces(&mut self, frame: &eframe::Frame) {
        let requested_keys = self
            .embedded_surface_requests
            .keys()
            .cloned()
            .collect::<HashSet<_>>();

        let existing_keys = self.embedded_surfaces.keys().cloned().collect::<Vec<_>>();
        for key in existing_keys {
            if !requested_keys.contains(&key) {
                if let Some(surface) = self.embedded_surfaces.get(&key) {
                    let _ = surface.webview.set_visible(false);
                }
            }
        }

        let pending_requests = std::mem::take(&mut self.embedded_surface_requests);
        for (key, request) in pending_requests {
            let bounds = Self::wry_rect_from_egui_rect(request.rect);
            if let Some(surface) = self.embedded_surfaces.get_mut(&key) {
                if surface.kind != request.kind || surface.content != request.content {
                    match &request.content {
                        DesktopEmbeddedSurfaceContent::Url(url) => {
                            let _ = surface.webview.load_url(url);
                        }
                        DesktopEmbeddedSurfaceContent::Html(html) => {
                            let _ = surface.webview.load_html(html);
                        }
                    }
                    surface.kind = request.kind;
                    surface.content = request.content.clone();
                }
                let _ = surface.webview.set_bounds(bounds);
                let _ = surface.webview.set_visible(true);
                if request.focus_requested {
                    let _ = surface.webview.focus();
                }
                continue;
            }

            match Self::build_embedded_surface_webview(frame, &key, &request) {
                Ok(webview) => {
                    let _ = webview.set_visible(true);
                    if request.focus_requested {
                        let _ = webview.focus();
                    }
                    self.embedded_surfaces.insert(
                        key,
                        DesktopEmbeddedSurface {
                            kind: request.kind,
                            content: request.content,
                            webview,
                        },
                    );
                }
                Err(error) => {
                    eprintln!("failed to create embedded desktop surface '{}': {error}", request.title);
                }
            }
        }
    }

    #[cfg(not(target_os = "windows"))]
    fn reconcile_embedded_surfaces(&mut self, _frame: &eframe::Frame) {
        self.embedded_surface_requests.clear();
    }

    fn get_vector_spec(&self, node: &NativeElementNode) -> Option<NativeDesktopVectorSpec> {
        serde_json::from_value(node.props.get("desktopVectorSpec")?.clone()).ok()
    }

    fn get_canvas_spec(&self, node: &NativeElementNode) -> Option<NativeDesktopCanvasSpec> {
        serde_json::from_value(node.props.get("desktopCanvasSpec")?.clone()).ok()
    }

    fn viewport_tuple(viewport: &NativeDesktopVectorViewport) -> (f32, f32, f32, f32) {
        (viewport.min_x, viewport.min_y, viewport.width, viewport.height)
    }

    fn stroke_or_none(color: Option<&NativeDesktopColor>, stroke_width: Option<f32>) -> egui::Stroke {
        visible_color(color)
            .map(|stroke_color| egui::Stroke::new(stroke_width.unwrap_or(1.0).max(1.0), stroke_color))
            .unwrap_or(egui::Stroke::NONE)
    }

    fn sample_path_subpaths(
        &self,
        commands: &[NativeDesktopPathCommand],
        rect: Rect,
        viewport: &NativeDesktopVectorViewport,
    ) -> Vec<(Vec<Pos2>, bool)> {
        let mut subpaths: Vec<(Vec<Pos2>, bool)> = Vec::new();
        let mut current_points: Vec<Pos2> = Vec::new();
        let mut current_raw_point: Option<(f32, f32)> = None;

        for command in commands {
            match command {
                NativeDesktopPathCommand::MoveTo { x, y } => {
                    if current_points.len() >= 2 {
                        subpaths.push((std::mem::take(&mut current_points), false));
                    }

                    current_points.push(self.map_point_to_rect(Pos2::new(*x, *y), rect, Self::viewport_tuple(viewport)));
                    current_raw_point = Some((*x, *y));
                }
                NativeDesktopPathCommand::LineTo { x, y } => {
                    current_points.push(self.map_point_to_rect(Pos2::new(*x, *y), rect, Self::viewport_tuple(viewport)));
                    current_raw_point = Some((*x, *y));
                }
                NativeDesktopPathCommand::CubicTo {
                    control1_x,
                    control1_y,
                    control2_x,
                    control2_y,
                    x,
                    y,
                } => {
                    let Some((start_x, start_y)) = current_raw_point else {
                        continue;
                    };

                    let start = self.map_point_to_rect(Pos2::new(start_x, start_y), rect, Self::viewport_tuple(viewport));
                    let control1 = self.map_point_to_rect(Pos2::new(*control1_x, *control1_y), rect, Self::viewport_tuple(viewport));
                    let control2 = self.map_point_to_rect(Pos2::new(*control2_x, *control2_y), rect, Self::viewport_tuple(viewport));
                    let end = self.map_point_to_rect(Pos2::new(*x, *y), rect, Self::viewport_tuple(viewport));

                    for step in 1..=16 {
                        let t = step as f32 / 16.0;
                        current_points.push(cubic_bezier_point(start, control1, control2, end, t));
                    }

                    current_raw_point = Some((*x, *y));
                }
                NativeDesktopPathCommand::Close => {
                    if current_points.len() >= 2 {
                        subpaths.push((std::mem::take(&mut current_points), true));
                    }
                    current_raw_point = None;
                }
            }
        }

        if current_points.len() >= 2 {
            subpaths.push((current_points, false));
        }

        subpaths
    }

    fn draw_sampled_subpaths(
        &self,
        painter: &egui::Painter,
        subpaths: &[(Vec<Pos2>, bool)],
        fill: Option<Color32>,
        stroke: egui::Stroke,
    ) {
        for (points, closed) in subpaths {
            if points.len() < 2 {
                continue;
            }

            if *closed {
                if let Some(fill) = fill {
                    painter.add(egui::Shape::convex_polygon(points.clone(), fill, stroke));
                    continue;
                }

                if stroke != egui::Stroke::NONE {
                    let mut closed_points = points.clone();
                    if let Some(first) = points.first() {
                        closed_points.push(*first);
                    }
                    painter.add(egui::Shape::line(closed_points, stroke));
                }
                continue;
            }

            if stroke != egui::Stroke::NONE {
                painter.add(egui::Shape::line(points.clone(), stroke));
            }
        }
    }

    fn draw_vector_spec_shape(
        &self,
        painter: &egui::Painter,
        rect: Rect,
        viewport: &NativeDesktopVectorViewport,
        shape: &NativeDesktopVectorShape,
    ) {
        match shape {
            NativeDesktopVectorShape::Circle {
                cx,
                cy,
                r,
                fill,
                stroke,
                stroke_width,
            } => {
                let center = self.map_point_to_rect(Pos2::new(*cx, *cy), rect, Self::viewport_tuple(viewport));
                let radius = *r * (rect.width() / viewport.width.max(1.0)).min(rect.height() / viewport.height.max(1.0));
                if let Some(fill) = visible_color(fill.as_ref()) {
                    painter.circle_filled(center, radius, fill);
                }
                let stroke = Self::stroke_or_none(stroke.as_ref(), *stroke_width);
                if stroke != egui::Stroke::NONE {
                    painter.circle_stroke(center, radius, stroke);
                }
            }
            NativeDesktopVectorShape::Rect {
                x,
                y,
                width,
                height,
                rx,
                ry,
                fill,
                stroke,
                stroke_width,
            } => {
                let min = self.map_point_to_rect(Pos2::new(*x, *y), rect, Self::viewport_tuple(viewport));
                let max = self.map_point_to_rect(Pos2::new(*x + *width, *y + *height), rect, Self::viewport_tuple(viewport));
                let shape_rect = Rect::from_min_max(min, max);
                let corner_radius = rx
                    .or(*ry)
                    .unwrap_or(0.0)
                    .max(0.0)
                    * (rect.width() / viewport.width.max(1.0)).min(rect.height() / viewport.height.max(1.0));
                if let Some(fill) = visible_color(fill.as_ref()) {
                    painter.rect_filled(shape_rect, corner_radius, fill);
                }
                let stroke = Self::stroke_or_none(stroke.as_ref(), *stroke_width);
                if stroke != egui::Stroke::NONE {
                    painter.rect_stroke(shape_rect, corner_radius, stroke, StrokeKind::Inside);
                }
            }
            NativeDesktopVectorShape::Ellipse {
                cx,
                cy,
                rx,
                ry,
                fill,
                stroke,
                stroke_width,
            } => {
                let mut points = Vec::new();
                for step in 0..32 {
                    let angle = (step as f32 / 32.0) * std::f32::consts::TAU;
                    points.push(Pos2::new(*cx + *rx * angle.cos(), *cy + *ry * angle.sin()));
                }
                let scaled = self.scale_points_to_rect(points, rect, Self::viewport_tuple(viewport));
                self.paint_polyline(
                    painter,
                    scaled,
                    Self::stroke_or_none(stroke.as_ref(), *stroke_width),
                    true,
                    visible_color(fill.as_ref()),
                );
            }
            NativeDesktopVectorShape::Path {
                commands,
                fill,
                stroke,
                stroke_width,
            } => {
                let subpaths = self.sample_path_subpaths(commands, rect, viewport);
                self.draw_sampled_subpaths(
                    painter,
                    &subpaths,
                    visible_color(fill.as_ref()),
                    Self::stroke_or_none(stroke.as_ref(), *stroke_width),
                );
            }
        }
    }

    fn render_vector_spec(&self, ui: &mut egui::Ui, node: &NativeElementNode, spec: &NativeDesktopVectorSpec) {
        let fallback = Vec2::new(spec.intrinsic_width.max(24.0), spec.intrinsic_height.max(24.0));
        let size = self.resolve_display_size(node, fallback);
        let (response, painter) = ui.allocate_painter(size, Sense::hover());
        let rect = response.rect;

        if let Some(fill) = self.resolve_background_color(node) {
            painter.rect_filled(rect, 0.0, fill);
        }

        for shape in &spec.shapes {
            self.draw_vector_spec_shape(&painter, rect, &spec.viewport, shape);
        }
    }

    fn render_canvas_spec(&self, ui: &mut egui::Ui, node: &NativeElementNode, spec: &NativeDesktopCanvasSpec) {
        let vector_spec = spec.as_vector_spec();
        let fallback = Vec2::new(vector_spec.intrinsic_width.max(1.0), vector_spec.intrinsic_height.max(1.0));
        let size = self.resolve_display_size(node, fallback);
        let (response, painter) = ui.allocate_painter(size, Sense::hover());
        let rect = response.rect;

        painter.rect_stroke(rect, 0.0, egui::Stroke::new(1.0, Color32::from_gray(70)), StrokeKind::Inside);

        for shape in &vector_spec.shapes {
            self.draw_vector_spec_shape(&painter, rect, &vector_spec.viewport, shape);
        }

        if vector_spec.shapes.is_empty() {
            painter.text(
                rect.center(),
                Align2::CENTER_CENTER,
                "Canvas",
                egui::FontId::proportional(14.0),
                Color32::from_gray(180),
            );
        }
    }

    fn resolved_window_title(&self) -> String {
        self.navigation
            .current_route()
            .map(|route| format!("{} - {}", self.base_title, route))
            .unwrap_or_else(|| self.base_title.clone())
    }

    fn apply_navigation_title(&self, ctx: &egui::Context) {
        ctx.send_viewport_cmd(egui::ViewportCommand::Title(self.resolved_window_title()));
    }

    fn build_ready_interaction(&self) -> DesktopInteraction {
        let mut payload = Map::new();
        payload.insert(String::from("title"), Value::String(self.base_title.clone()));
        payload.insert(String::from("autoClose"), Value::Bool(self.payload.window.auto_close));
        if let Some(route) = self.navigation.current_route() {
            payload.insert(String::from("route"), Value::String(route.to_string()));
        }

        DesktopInteraction {
            action: Some(String::from("desktop:ready")),
            route: self.navigation.current_route().map(str::to_string),
            payload: Some(Value::Object(payload)),
        }
    }

    fn emit_ready_interaction(&mut self) {
        if self.ready_emitted || !self.interaction_output.emit_ready {
            return;
        }

        self.ready_emitted = true;
        self.record_interaction(self.build_ready_interaction());
    }

    fn ensure_texture_for_source(
        &mut self,
        ctx: &egui::Context,
        source: &str,
    ) -> Result<egui::TextureHandle, String> {
        let resolved = self
            .resolve_resource_path(source)
            .ok_or_else(|| format!("unable to resolve image resource '{source}'"))?;
        let key = resolved.to_string_lossy().into_owned();

        if let Some(texture) = self.image_textures.get(&key) {
            return Ok(texture.clone());
        }

        let image = load_color_image(&resolved)?;
        let texture = ctx.load_texture(format!("elit-resource:{key}"), image, Default::default());
        self.image_textures.insert(key, texture.clone());
        Ok(texture)
    }

    fn resolve_display_size(&self, node: &NativeElementNode, fallback: Vec2) -> Vec2 {
        let style = self.get_style_map(node);
        let width = style
            .and_then(|style| self.parse_css_number_with_viewport(style.get("width")))
            .or_else(|| self.resolve_prop_number(node, "width"));
        let height = style
            .and_then(|style| self.parse_css_number_with_viewport(style.get("height")))
            .or_else(|| self.resolve_prop_number(node, "height"));
        let max_width = style.and_then(|style| self.parse_css_number_with_viewport(style.get("maxWidth")));
        let max_height = style.and_then(|style| self.parse_css_number_with_viewport(style.get("maxHeight")));

        let mut size = fallback;
        match (width, height) {
            (Some(width), Some(height)) => {
                size = Vec2::new(width.max(1.0), height.max(1.0));
            }
            (Some(width), None) => {
                let scale = if fallback.x > 0.0 { width / fallback.x } else { 1.0 };
                size = Vec2::new(width.max(1.0), (fallback.y * scale).max(1.0));
            }
            (None, Some(height)) => {
                let scale = if fallback.y > 0.0 { height / fallback.y } else { 1.0 };
                size = Vec2::new((fallback.x * scale).max(1.0), height.max(1.0));
            }
            (None, None) => {}
        }

        if let Some(max_width) = max_width {
            let scale = if size.x > 0.0 { (max_width / size.x).min(1.0) } else { 1.0 };
            size *= scale;
        }
        if let Some(max_height) = max_height {
            let scale = if size.y > 0.0 { (max_height / size.y).min(1.0) } else { 1.0 };
            size *= scale;
        }

        Vec2::new(size.x.max(1.0), size.y.max(1.0))
    }

    fn render_local_or_placeholder_image(
        &mut self,
        ui: &mut egui::Ui,
        ctx: &egui::Context,
        node: &NativeElementNode,
        source: &str,
        fallback_label: Option<&str>,
    ) {
        if let Ok(texture) = self.ensure_texture_for_source(ctx, source) {
            let natural_size = texture.size_vec2();
            let desired_size = self.resolve_display_size(node, natural_size);
            let style = self.get_style_map(node);
            let object_fit = style.and_then(|s| s.get("objectFit")).and_then(Value::as_str).unwrap_or("fill");
            let render_size = Self::resolve_object_fit_image_size(object_fit, desired_size, natural_size);
            let image = egui::Image::from_texture(&texture).fit_to_exact_size(render_size);
            // For cover/none/contain: allocate desired_size, clip overflow, center the image
            if render_size != desired_size {
                ui.allocate_ui_with_layout(
                    desired_size,
                    Layout::centered_and_justified(Direction::TopDown),
                    |ui| {
                        let clip = ui.clip_rect().intersect(ui.max_rect());
                        ui.set_clip_rect(clip);
                        ui.add(image);
                    },
                );
            } else {
                ui.add(image);
            }
            return;
        }

        egui::Frame::group(ui.style()).show(ui, |ui| {
            ui.label(fallback_label.unwrap_or("Image preview unavailable"));
            ui.small(source);
            if is_external_destination(source) && ui.button("Open source").clicked() {
                let _ = webbrowser::open(source);
            }
        });
    }

    fn record_interaction(&mut self, interaction: DesktopInteraction) {
        let interaction_json = serde_json::to_string(&interaction).unwrap_or_else(|_| String::from("{}"));

        if self.interaction_output.stdout {
            println!("ELIT_NATIVE_INTERACTION {interaction_json}");
        }

        if let Err(error) = write_interaction_output(self.interaction_output.file.as_deref(), &interaction_json) {
            eprintln!("failed to write desktop native interaction output: {error}");
        }

        self.last_interaction = Some(interaction);
    }

    fn dispatch_interaction(&mut self, ctx: &egui::Context, interaction: DesktopInteraction) {
        self.record_interaction(interaction.clone());

        match interaction.action.as_deref() {
            Some("desktop:quit") => {
                ctx.send_viewport_cmd(egui::ViewportCommand::Close);
                return;
            }
            Some("desktop:ping") => {
                ctx.send_viewport_cmd(egui::ViewportCommand::Title(format!("{} - IPC OK", self.base_title)));
                return;
            }
            Some("desktop:back") => {
                self.navigation.go_back();
                self.apply_navigation_title(ctx);
                return;
            }
            Some("desktop:forward") => {
                self.navigation.go_forward();
                self.apply_navigation_title(ctx);
                return;
            }
            Some("desktop:clear-route") => {
                self.navigation.clear();
                self.apply_navigation_title(ctx);
                return;
            }
            _ => {}
        }

        let internal_route = interaction
            .route
            .as_deref()
            .filter(|route| !is_external_destination(route))
            .map(str::to_string)
            .or_else(|| {
                (interaction.action.as_deref() == Some("desktop:navigate"))
                    .then(|| resolve_route_from_payload(interaction.payload.as_ref()))
                    .flatten()
            });

        if let Some(route) = internal_route {
            if self.navigation.navigate_to(route) {
                self.apply_navigation_title(ctx);
            }
            return;
        }

        if let Some(route) = interaction.route.as_deref() {
            if is_external_destination(route) {
                let _ = webbrowser::open(route);
            }
        }
    }

    fn dispatch_press_event(&mut self, ctx: &egui::Context, node: &NativeElementNode) {
        let mut payload = Map::new();
        payload.insert(String::from("event"), Value::String(String::from("press")));
        payload.insert(String::from("sourceTag"), Value::String(node.source_tag.clone()));
        if let Some(detail) = node.props.get("nativePayload") {
            payload.insert(String::from("detail"), normalize_jsonish_value(detail.clone()));
        }

        if let Some(interaction) = resolve_interaction(node, Some(String::from("elit.event.press")), Some(Value::Object(payload))) {
            self.dispatch_interaction(ctx, interaction);
        }
    }

    fn dispatch_control_events(
        &mut self,
        ctx: &egui::Context,
        node: &NativeElementNode,
        event_data: DesktopControlEventData,
    ) {
        let input_type = resolve_control_event_input_type(node);

        for event_name in ["input", "change"] {
            if !should_dispatch_control_event(node, event_name) {
                continue;
            }

            let payload = build_event_payload(node, event_name, input_type.clone(), &event_data);
            if let Some(interaction) = resolve_interaction(node, Some(control_event_action(node, event_name)), Some(payload)) {
                self.dispatch_interaction(ctx, interaction);
            }
        }
    }

    fn render_text_element(&mut self, ui: &mut egui::Ui, node: &NativeElementNode) {
        let text = self.collect_text_content(&NativeNode::Element(node.clone()));
        if text.is_empty() {
            return;
        }

        let style = self.get_style_map(node).cloned();
        let margin = Self::resolve_box_edges(style.as_ref(), "margin").filter(|margin| !margin.is_zero());
        let padding = Self::resolve_box_edges(style.as_ref(), "padding").filter(|padding| !padding.is_zero());
        let opacity = Self::resolve_opacity_from_style(style.as_ref());
        let backdrop_blur = Self::resolve_backdrop_blur_radius_from_style(style.as_ref());
        let css_filter = Self::resolve_css_filter_from_style(style.as_ref());
        let linear_gradient = Self::resolve_background_gradient_from_style(style.as_ref()).map(|g| Self::gradient_with_opacity(g, opacity));
        let radial_gradient = if linear_gradient.is_none() {
            Self::resolve_background_radial_gradient_from_style(style.as_ref()).map(|g| Self::radial_gradient_with_opacity(g, opacity))
        } else {
            None
        };
        let has_gradient = linear_gradient.is_some() || radial_gradient.is_some();
        let fill = if has_gradient {
            Color32::TRANSPARENT
        } else {
            let raw_fill = Self::resolve_effective_background_color_from_style(style.as_ref())
                .map(|fill| fill.gamma_multiply(opacity))
                .unwrap_or(Color32::TRANSPARENT);
            if let Some(ref f) = css_filter { f.apply(raw_fill) } else { raw_fill }
        };
        let raw_stroke = Self::resolve_border_stroke_from_style(style.as_ref()).unwrap_or(egui::Stroke::NONE);
        let stroke = if let Some(ref f) = css_filter {
            egui::Stroke::new(raw_stroke.width, f.apply(raw_stroke.color))
        } else { raw_stroke };
        let corner_radius = Self::resolve_corner_radius_from_style(style.as_ref());
        let shadow = Self::resolve_box_shadow_from_style(style.as_ref())
            .or_else(|| backdrop_blur.filter(|_| corner_radius.is_some()).map(Self::synthesize_shadow_from_backdrop_blur));
        let outline_stroke = Self::resolve_outline_from_style(style.as_ref());
        let overflow_hidden = Self::resolve_overflow_hidden_from_style(style.as_ref());
        let cursor_icon = Self::resolve_cursor_from_style(style.as_ref());
        let text_shadow = Self::resolve_text_shadow_from_style(style.as_ref());
        let do_wrap = Self::resolve_white_space_wraps(style.as_ref());
        let do_truncate = Self::resolve_text_overflow_ellipsis(style.as_ref());

        // Compute font metrics once for text-indent, word-spacing, etc.
        let resolved_font_size = style.as_ref()
            .and_then(|s| self.parse_css_number_with_viewport(s.get("fontSize")))
            .unwrap_or(14.0);
        let measure_ctx = self.css_measure_context(Some(resolved_font_size));
        let text_indent = Self::resolve_text_indent_from_style(style.as_ref(), resolved_font_size, measure_ctx);

        // Build the display text with optional text-indent prefix
        let display_text = if let Some(indent) = text_indent {
            // Approximate indent with spaces (1 space ≈ 0.55em)
            let space_count = ((indent / (resolved_font_size * 0.55)).round() as usize).min(20);
            format!("{}{}", " ".repeat(space_count), text)
        } else {
            text
        };

        let mut rich_text = self.resolve_text_style_from_style(ui, style.as_ref(), display_text.clone(), true);

        // Apply CSS filter to text color
        if let Some(ref f) = css_filter {
            if let Some(color) = Self::resolve_text_color_from_style(style.as_ref()) {
                rich_text = rich_text.color(f.apply(color));
            }
        }

        let has_frame = Self::style_has_widget_frame(style.as_ref())
            || shadow.is_some()
            || has_gradient
            || opacity < 1.0
            || margin.is_some()
            || outline_stroke.is_some();

        if has_frame {
            let gradient_shape_idx = if has_gradient {
                Some(ui.painter().add(egui::Shape::Noop))
            } else {
                None
            };
            let mut frame = egui::Frame::new().fill(fill).stroke(stroke);
            if let Some(padding) = padding {
                frame = frame.inner_margin(padding.to_margin());
            }
            if let Some(margin) = margin {
                frame = frame.outer_margin(margin.to_margin());
            }
            if let Some(corner_radius) = corner_radius {
                frame = frame.corner_radius(corner_radius);
            }
            if let Some(shadow) = shadow {
                frame = frame.shadow(shadow);
            }
            if opacity < 1.0 {
                frame = frame.multiply_with_opacity(opacity);
            }

            let response = frame.show(ui, |ui| {
                if overflow_hidden {
                    let clip = ui.clip_rect().intersect(ui.max_rect());
                    ui.set_clip_rect(clip);
                }
                // Text-shadow: draw shadow pass first, then real text on top
                if let Some(ref ts) = text_shadow {
                    let shadow_rich = self.resolve_text_style_from_style(ui, style.as_ref(), display_text.clone(), false)
                        .color(ts.color);
                    let shadow_response = ui.label(shadow_rich);
                    // Paint a second label at offset
                    let tr = shadow_response.rect;
                    ui.painter().text(
                        Pos2::new(tr.min.x + ts.offset_x, tr.min.y + ts.offset_y),
                        egui::Align2::LEFT_TOP,
                        &display_text,
                        egui::FontId::proportional(resolved_font_size),
                        ts.color,
                    );
                }
                let mut label = egui::Label::new(rich_text);
                if !do_wrap || do_truncate {
                    label = label.truncate();
                } else {
                    label = label.wrap();
                }
                ui.add(label)
            });

            let widget_rect = if let Some(margin) = margin {
                Rect::from_min_max(
                    Pos2::new(response.response.rect.left() + margin.left, response.response.rect.top() + margin.top),
                    Pos2::new(response.response.rect.right() - margin.right, response.response.rect.bottom() - margin.bottom),
                )
            } else {
                response.response.rect
            };

            if let Some(shape_idx) = gradient_shape_idx {
                let grad_shape = if let Some(lg) = linear_gradient.as_ref() {
                    Some(Self::gradient_shape_for_rect(widget_rect, corner_radius.unwrap_or(CornerRadius::ZERO), lg))
                } else if let Some(rg) = radial_gradient.as_ref() {
                    Some(Self::radial_gradient_shape_for_rect(widget_rect, corner_radius.unwrap_or(CornerRadius::ZERO), rg))
                } else { None };
                if let Some(shape) = grad_shape {
                    ui.painter().set(shape_idx, shape);
                }
            }

            // CSS outline
            if let Some(outline) = outline_stroke {
                let expand = outline.width.max(1.0);
                let outline_rect = widget_rect.expand(expand);
                ui.painter().rect_stroke(outline_rect, corner_radius.unwrap_or(CornerRadius::ZERO), outline, StrokeKind::Outside);
            }

            // CSS cursor
            if let Some(cursor) = cursor_icon {
                let interact = ui.interact(widget_rect, ui.id().with("cursor_text"), egui::Sense::hover());
                if interact.hovered() {
                    ui.ctx().set_cursor_icon(cursor);
                }
            }

            return;
        }

        // Simple text path (no background frame)
        if let Some(ref ts) = text_shadow {
            let shadow_rich = self.resolve_text_style_from_style(ui, style.as_ref(), display_text.clone(), false)
                .color(ts.color);
            let shadow_response = ui.label(shadow_rich);
            let tr = shadow_response.rect;
            ui.painter().text(
                Pos2::new(tr.min.x + ts.offset_x, tr.min.y + ts.offset_y),
                egui::Align2::LEFT_TOP,
                &display_text,
                egui::FontId::proportional(resolved_font_size),
                ts.color,
            );
        }
        let mut label = egui::Label::new(rich_text);
        if !do_wrap || do_truncate {
            label = label.truncate();
        } else {
            label = label.wrap();
        }
        let label_response = ui.add(label);

        // CSS cursor on plain text
        if let Some(cursor) = cursor_icon {
            if label_response.hovered() {
                ui.ctx().set_cursor_icon(cursor);
            }
        }
    }

    fn render_text_input(&mut self, ui: &mut egui::Ui, ctx: &egui::Context, node: &NativeElementNode, path: &str) {
        let binding = self.get_binding_reference(node);
        let disabled = self.is_disabled(node);
        let read_only = self.is_read_only(node);
        let input_type = resolve_control_event_input_type(node).unwrap_or_else(|| String::from("text"));
        let placeholder = self.resolve_prop_string(node, "placeholder").unwrap_or_default();
        let mut value = if let Some(binding) = &binding {
            self.state_values
                .get(&binding.id)
                .map(DesktopStateValue::as_text_input_value)
                .unwrap_or_else(|| node.props.get("value").and_then(value_as_string).unwrap_or_default())
        } else {
            self.local_text_inputs
                .get(path)
                .cloned()
                .or_else(|| node.props.get("value").and_then(value_as_string))
                .unwrap_or_default()
        };

        let available_width = ui.available_width().max(1.0);
        let mut base_state = self.base_pseudo_state(node);
        base_state.placeholder_shown = !placeholder.is_empty() && value.trim().is_empty();
        let state_styles = self.resolve_widget_state_styles(node, base_state);
        let inactive_style = state_styles.inactive.as_ref();
        let padding = Self::resolve_box_edges(inactive_style, "padding").filter(|padding| !padding.is_zero());
        let desired_width = self.resolve_widget_width_from_style(inactive_style, available_width);
        let (font_id, _, _) = self.resolve_text_font_id(ui, inactive_style);
        let resolved_font_size = font_id
            .as_ref()
            .map(|font_id| font_id.size)
            .unwrap_or_else(|| egui::TextStyle::Body.resolve(ui.style().as_ref()).size);
        let desired_rows = if node.source_tag == "textarea" {
            inactive_style
                .and_then(|style| {
                    let line_height = Self::resolve_text_line_height(
                        Some(style),
                        resolved_font_size,
                        self.css_measure_context(Some(resolved_font_size)),
                    )
                    .unwrap_or(resolved_font_size * 1.35);
                    let target_height = self
                        .parse_css_number_with_viewport(style.get("height"))
                        .or_else(|| self.parse_css_number_with_viewport(style.get("minHeight")))?;
                    let inner_vertical = padding.map(|padding| padding.top + padding.bottom).unwrap_or(0.0);
                    Some(((target_height - inner_vertical).max(line_height) / line_height).round().max(1.0) as usize)
                })
                .unwrap_or(4)
        } else {
            1
        };
        let text_color = Self::resolve_text_color_from_style(if disabled {
            state_styles.disabled.as_ref().or(inactive_style)
        } else {
            inactive_style
        });

        let response = ui
            .scope(|ui| {
                self.apply_widget_state_visuals(
                    ui,
                    inactive_style,
                    state_styles.hovered.as_ref(),
                    state_styles.active.as_ref(),
                    state_styles.focus.as_ref(),
                    state_styles.disabled.as_ref(),
                );

                let mut text_edit = if node.source_tag == "textarea" {
                    egui::TextEdit::multiline(&mut value).desired_rows(desired_rows)
                } else {
                    egui::TextEdit::singleline(&mut value)
                };

                if let Some(padding) = padding {
                    text_edit = text_edit.margin(padding.to_margin());
                }
                if let Some(font_id) = font_id.clone() {
                    text_edit = text_edit.font(font_id);
                }
                if let Some(text_color) = text_color {
                    text_edit = text_edit.text_color_opt(Some(text_color));
                }
                if let Some(desired_width) = desired_width {
                    text_edit = text_edit.desired_width(desired_width);
                }
                if !placeholder.is_empty() {
                    text_edit = text_edit.hint_text(placeholder);
                }
                if input_type == "password" {
                    text_edit = text_edit.password(true);
                }
                if read_only {
                    text_edit = text_edit.interactive(false);
                }

                if disabled {
                    ui.add_enabled(false, text_edit)
                } else {
                    ui.add(text_edit)
                }
            })
            .inner;

        if response.changed() {
            if let Some(binding) = binding {
                let next_value = match binding.value_type.as_str() {
                    "number" => value
                        .parse::<f64>()
                        .map(DesktopStateValue::Number)
                        .unwrap_or_else(|_| DesktopStateValue::Number(0.0)),
                    "boolean" => DesktopStateValue::Boolean(parse_native_bool(Some(&Value::String(value.clone())))),
                    "string-array" => DesktopStateValue::StringArray(
                        value
                            .split(',')
                            .map(str::trim)
                            .filter(|entry| !entry.is_empty())
                            .map(str::to_string)
                            .collect(),
                    ),
                    _ => DesktopStateValue::String(value.clone()),
                };
                self.state_values.insert(binding.id, next_value);
            } else {
                self.local_text_inputs.insert(path.to_string(), value.clone());
            }

            self.dispatch_control_events(
                ctx,
                node,
                DesktopControlEventData {
                    value: Some(value),
                    ..Default::default()
                },
            );
        }
    }

    fn render_toggle(&mut self, ui: &mut egui::Ui, ctx: &egui::Context, node: &NativeElementNode, path: &str) {
        let binding = self.get_binding_reference(node);
        let disabled = self.is_disabled(node);
        let mut checked = if let Some(binding) = &binding {
            self.state_values
                .get(&binding.id)
                .map(DesktopStateValue::as_bool)
                .unwrap_or_else(|| parse_native_bool(node.props.get("checked")))
        } else {
            self.local_toggles
                .get(path)
                .copied()
                .unwrap_or_else(|| parse_native_bool(node.props.get("checked")))
        };
        let label = self.resolve_label(node).unwrap_or_default();
        let mut base_state = self.base_pseudo_state(node);
        base_state.checked = checked;
        let state_styles = self.resolve_widget_state_styles(node, base_state);
        let inactive_style = state_styles.inactive.as_ref();
        let min_size = self.resolve_widget_min_size(inactive_style);
        let response = ui
            .scope(|ui| {
                self.apply_widget_state_visuals(
                    ui,
                    inactive_style,
                    state_styles.hovered.as_ref(),
                    state_styles.active.as_ref(),
                    state_styles.focus.as_ref(),
                    state_styles.disabled.as_ref(),
                );

                if min_size.x > 0.0 {
                    ui.spacing_mut().icon_width = min_size.x;
                    ui.spacing_mut().icon_width_inner = (min_size.x * (8.0 / 14.0)).clamp(4.0, min_size.x.max(4.0));
                    ui.spacing_mut().interact_size.x = ui.spacing().interact_size.x.max(min_size.x);
                }
                if min_size.y > 0.0 {
                    ui.spacing_mut().interact_size.y = ui.spacing().interact_size.y.max(min_size.y);
                }

                ui.add_enabled(!disabled, egui::Checkbox::new(&mut checked, label.clone()))
            })
            .inner;

        if response.changed() {
            if let Some(binding) = binding {
                self.state_values.insert(binding.id, DesktopStateValue::Boolean(checked));
            } else {
                self.local_toggles.insert(path.to_string(), checked);
            }

            self.dispatch_control_events(
                ctx,
                node,
                DesktopControlEventData {
                    checked: Some(checked),
                    ..Default::default()
                },
            );
        }
    }

    fn render_slider(&mut self, ui: &mut egui::Ui, ctx: &egui::Context, node: &NativeElementNode, path: &str) {
        let binding = self.get_binding_reference(node);
        let disabled = self.is_disabled(node);
        let min = node.props.get("min").and_then(Value::as_f64).unwrap_or(0.0);
        let max = node.props.get("max").and_then(Value::as_f64).unwrap_or(100.0);
        let step = node.props.get("step").and_then(Value::as_f64).filter(|value| *value > 0.0);
        let mut value = if let Some(binding) = &binding {
            match self.state_values.get(&binding.id) {
                Some(DesktopStateValue::Number(number)) => *number,
                Some(DesktopStateValue::String(text)) => text.parse::<f64>().unwrap_or(min),
                _ => node.props.get("value").and_then(Value::as_f64).unwrap_or(min),
            }
        } else {
            self.local_slider_values
                .get(path)
                .copied()
                .or_else(|| node.props.get("value").and_then(Value::as_f64))
                .unwrap_or(min)
        };
        let state_styles = self.resolve_widget_state_styles(node, self.base_pseudo_state(node));
        let inactive_style = state_styles.inactive.as_ref();
        let desired_width = self.resolve_widget_width_from_style(inactive_style, ui.available_width().max(1.0));
        let min_size = self.resolve_widget_min_size(inactive_style);
        let response = ui
            .scope(|ui| {
                self.apply_widget_state_visuals(
                    ui,
                    inactive_style,
                    state_styles.hovered.as_ref(),
                    state_styles.active.as_ref(),
                    state_styles.focus.as_ref(),
                    state_styles.disabled.as_ref(),
                );

                if let Some(desired_width) = desired_width {
                    ui.spacing_mut().slider_width = desired_width;
                }
                if min_size.y > 0.0 {
                    ui.spacing_mut().interact_size.y = ui.spacing().interact_size.y.max(min_size.y);
                }

                let mut slider = egui::Slider::new(&mut value, min..=max);
                if let Some(step) = step {
                    slider = slider.step_by(step);
                }
                if let Some(label) = self.resolve_label(node) {
                    slider = slider.text(label);
                }

                ui.add_enabled(!disabled, slider)
            })
            .inner;

        if response.changed() {
            if let Some(binding) = binding {
                let next_value = match binding.value_type.as_str() {
                    "string" => DesktopStateValue::String(format_number(value)),
                    _ => DesktopStateValue::Number(value),
                };
                self.state_values.insert(binding.id, next_value);
            } else {
                self.local_slider_values.insert(path.to_string(), value);
            }

            self.dispatch_control_events(
                ctx,
                node,
                DesktopControlEventData {
                    value: Some(format_number(value)),
                    ..Default::default()
                },
            );
        }
    }

    fn collect_picker_options(&self, node: &NativeElementNode) -> Vec<PickerOptionData> {
        node.children
            .iter()
            .filter_map(|child| match child {
                NativeNode::Element(element_node) if element_node.component == "Option" => Some(PickerOptionData {
                    label: self.collect_text_content(child).trim().to_string(),
                    value: element_node
                        .props
                        .get("value")
                        .and_then(value_as_string)
                        .unwrap_or_else(|| self.collect_text_content(child).trim().to_string()),
                    disabled: parse_native_bool(element_node.props.get("disabled")),
                    selected: parse_native_bool(element_node.props.get("selected")),
                }),
                _ => None,
            })
            .collect()
    }

    fn render_picker(&mut self, ui: &mut egui::Ui, ctx: &egui::Context, node: &NativeElementNode, path: &str) {
        let binding = self.get_binding_reference(node);
        let disabled = self.is_disabled(node);
        let options = self.collect_picker_options(node);
        let multiple = parse_native_bool(node.props.get("multiple"));

        if multiple {
            let mut values = if let Some(binding) = &binding {
                match self.state_values.get(&binding.id) {
                    Some(DesktopStateValue::StringArray(values)) => values.clone(),
                    Some(DesktopStateValue::String(value)) => vec![value.clone()],
                    _ => Vec::new(),
                }
            } else {
                self.local_multi_picker_values
                    .get(path)
                    .cloned()
                    .unwrap_or_else(|| {
                        options
                            .iter()
                            .filter(|option| option.selected)
                            .map(|option| option.value.clone())
                            .collect()
                    })
            };

            let mut changed = false;
            let mut base_state = self.base_pseudo_state(node);
            base_state.selected = !values.is_empty();
            let state_styles = self.resolve_widget_state_styles(node, base_state);
            let inactive_style = state_styles.inactive.as_ref();
            let min_size = self.resolve_widget_min_size(inactive_style);
            ui.scope(|ui| {
                self.apply_widget_state_visuals(
                    ui,
                    inactive_style,
                    state_styles.hovered.as_ref(),
                    state_styles.active.as_ref(),
                    state_styles.focus.as_ref(),
                    state_styles.disabled.as_ref(),
                );

                if min_size.x > 0.0 {
                    ui.spacing_mut().icon_width = min_size.x;
                    ui.spacing_mut().icon_width_inner = (min_size.x * (8.0 / 14.0)).clamp(4.0, min_size.x.max(4.0));
                    ui.spacing_mut().interact_size.x = ui.spacing().interact_size.x.max(min_size.x);
                }
                if min_size.y > 0.0 {
                    ui.spacing_mut().interact_size.y = ui.spacing().interact_size.y.max(min_size.y);
                }

                ui.vertical(|ui| {
                    for option in &options {
                        let mut checked = values.iter().any(|value| value == &option.value);
                        let response = ui.add_enabled(!disabled && !option.disabled, egui::Checkbox::new(&mut checked, &option.label));
                        if response.changed() {
                            changed = true;
                            if checked {
                                if !values.iter().any(|value| value == &option.value) {
                                    values.push(option.value.clone());
                                }
                            } else {
                                values.retain(|value| value != &option.value);
                            }
                        }
                    }
            });
            });

            if changed {
                values.sort();
                if let Some(binding) = binding {
                    self.state_values.insert(binding.id, DesktopStateValue::StringArray(values.clone()));
                } else {
                    self.local_multi_picker_values.insert(path.to_string(), values.clone());
                }

                self.dispatch_control_events(
                    ctx,
                    node,
                    DesktopControlEventData {
                        values: Some(values),
                        ..Default::default()
                    },
                );
            }

            return;
        }

        let mut selected_value = if let Some(binding) = &binding {
            match self.state_values.get(&binding.id) {
                Some(DesktopStateValue::String(value)) => value.clone(),
                Some(DesktopStateValue::Number(value)) => format_number(*value),
                _ => String::new(),
            }
        } else {
            self.local_picker_values
                .get(path)
                .cloned()
                .or_else(|| node.props.get("value").and_then(value_as_string))
                .or_else(|| options.iter().find(|option| option.selected).map(|option| option.value.clone()))
                .unwrap_or_default()
        };

        let selected_label = options
            .iter()
            .find(|option| option.value == selected_value)
            .map(|option| option.label.clone())
            .unwrap_or_else(|| {
                if selected_value.is_empty() {
                    String::from("Select")
                } else {
                    selected_value.clone()
                }
            });
        let previous_value = selected_value.clone();
        let mut base_state = self.base_pseudo_state(node);
        base_state.selected = !selected_value.is_empty();
        let state_styles = self.resolve_widget_state_styles(node, base_state);
        let inactive_style = state_styles.inactive.as_ref();
        let desired_width = self.resolve_widget_width_from_style(inactive_style, ui.available_width().max(1.0));
        let min_size = self.resolve_widget_min_size(inactive_style);

        ui.scope(|ui| {
            self.apply_widget_state_visuals(
                ui,
                inactive_style,
                state_styles.hovered.as_ref(),
                state_styles.active.as_ref(),
                state_styles.focus.as_ref(),
                state_styles.disabled.as_ref(),
            );

            if let Some(desired_width) = desired_width {
                ui.spacing_mut().interact_size.x = ui.spacing().interact_size.x.max(desired_width);
            }
            if min_size.y > 0.0 {
                ui.spacing_mut().interact_size.y = ui.spacing().interact_size.y.max(min_size.y);
            }

            ui.add_enabled_ui(!disabled, |ui| {
                let mut combo_box = egui::ComboBox::from_id_salt(path).selected_text(
                    self.resolve_text_style_from_style(
                        ui,
                        if disabled {
                            state_styles.disabled.as_ref().or(inactive_style)
                        } else {
                            inactive_style
                        },
                        selected_label.clone(),
                        false,
                    ),
                );

                if let Some(desired_width) = desired_width {
                    combo_box = combo_box.width(desired_width);
                }

                combo_box.show_ui(ui, |ui| {
                    for option in &options {
                        ui.add_enabled_ui(!option.disabled, |ui| {
                            ui.selectable_value(&mut selected_value, option.value.clone(), &option.label);
                        });
                    }
                });
            });
        });

        if selected_value != previous_value {
            if let Some(binding) = binding {
                let next_value = match binding.value_type.as_str() {
                    "number" => DesktopStateValue::Number(selected_value.parse::<f64>().unwrap_or_default()),
                    _ => DesktopStateValue::String(selected_value.clone()),
                };
                self.state_values.insert(binding.id, next_value);
            } else {
                self.local_picker_values.insert(path.to_string(), selected_value.clone());
            }

            self.dispatch_control_events(
                ctx,
                node,
                DesktopControlEventData {
                    value: Some(selected_value),
                    ..Default::default()
                },
            );
        }
    }

    fn render_divider(&mut self, ui: &mut egui::Ui) {
        ui.separator();
    }

    fn render_progress(&mut self, ui: &mut egui::Ui, node: &NativeElementNode) {
        let value = node.props.get("value").and_then(Value::as_f64);
        let max = node.props.get("max").and_then(Value::as_f64).filter(|value| *value > 0.0);

        match (value, max) {
            (Some(value), Some(max)) => {
                let progress = (value / max).clamp(0.0, 1.0) as f32;
                ui.add(egui::ProgressBar::new(progress).show_percentage());
            }
            _ => {
                ui.add(egui::Spinner::new());
            }
        }
    }

    fn collect_table_rows(&self, node: &NativeElementNode) -> Vec<NativeElementNode> {
        let mut rows = Vec::new();
        for child in &node.children {
            if let NativeNode::Element(element_node) = child {
                if element_node.component == "Row" {
                    rows.push(element_node.clone());
                } else if matches!(element_node.source_tag.as_str(), "tbody" | "thead" | "tfoot") {
                    for nested in &element_node.children {
                        if let NativeNode::Element(row_node) = nested {
                            if row_node.component == "Row" {
                                rows.push(row_node.clone());
                            }
                        }
                    }
                }
            }
        }
        rows
    }

    fn collect_row_cells(&self, row: &NativeElementNode) -> Vec<NativeElementNode> {
        row.children
            .iter()
            .filter_map(|child| match child {
                NativeNode::Element(element_node) if element_node.component == "Cell" => Some(element_node.clone()),
                _ => None,
            })
            .collect()
    }

    fn render_table(&mut self, ui: &mut egui::Ui, ctx: &egui::Context, node: &NativeElementNode, path: &str) {
        let rows = self.collect_table_rows(node);
        if rows.is_empty() {
            self.render_container(ui, ctx, node, path);
            return;
        }

        let columns = rows.iter().map(|row| self.collect_row_cells(row).len()).max().unwrap_or(1);
        let gap = self.resolve_gap(node);
        egui::Grid::new(path)
            .num_columns(columns)
            .spacing(egui::vec2(gap, gap))
            .show(ui, |ui| {
                for (row_index, row) in rows.iter().enumerate() {
                    let cells = self.collect_row_cells(row);
                    for (column_index, cell) in cells.iter().enumerate() {
                        egui::Frame::group(ui.style()).show(ui, |ui| {
                            self.render_children(ui, ctx, cell, &format!("{path}-{row_index}-{column_index}"));
                        });
                    }

                    for _ in cells.len()..columns {
                        ui.label("");
                    }

                    ui.end_row();
                }
            });
    }

    fn render_row(&mut self, ui: &mut egui::Ui, ctx: &egui::Context, node: &NativeElementNode, path: &str) {
        ui.horizontal_wrapped(|ui| {
            for (index, child) in node.children.iter().enumerate() {
                self.render_node(ui, ctx, child, &format!("{path}-{index}"));
            }
        });
    }

    fn render_cell(&mut self, ui: &mut egui::Ui, ctx: &egui::Context, node: &NativeElementNode, path: &str) {
        egui::Frame::group(ui.style()).show(ui, |ui| {
            self.render_children(ui, ctx, node, path);
        });
    }

    fn render_image(&mut self, ui: &mut egui::Ui, ctx: &egui::Context, node: &NativeElementNode) {
        if let Some(source) = resolve_surface_source(node) {
            let fallback = self.resolve_label(node);
            self.render_local_or_placeholder_image(ui, ctx, node, &source, fallback.as_deref());
            return;
        }

        egui::Frame::group(ui.style()).show(ui, |ui| {
            ui.label(self.resolve_label(node).unwrap_or_else(|| String::from("Image")));
            ui.small("No image source provided");
        });
    }

    fn open_source(&self, source: &str) {
        if is_probably_inline_html(source) {
            return;
        }

        if is_external_destination(source) {
            let _ = webbrowser::open(source);
            return;
        }

        if let Some(path) = self.resolve_resource_path(source) {
            let _ = webbrowser::open(path.to_string_lossy().as_ref());
        }
    }

    fn render_web_view(&mut self, ui: &mut egui::Ui, node: &NativeElementNode, path: &str) {
        let source = resolve_surface_source(node).unwrap_or_default();
        let preview = self.read_source_preview(&source);
        let title = self.resolve_label(node).unwrap_or_else(|| String::from("WebView"));

        if !source.is_empty() && Self::supports_embedded_surfaces() {
            if let Some(content) = self.resolve_embedded_web_view_content(&source) {
                self.render_embedded_surface_slot(
                    ui,
                    node,
                    path,
                    &title,
                    DesktopSurfaceWindowKind::WebView,
                    content,
                    Vec2::new(720.0, 420.0),
                );
                return;
            }
        }

        egui::Frame::group(ui.style()).show(ui, |ui| {
            ui.label(&title);
            if source.is_empty() {
                ui.small("No source provided");
            } else if let Some(preview) = preview {
                ui.small(preview);
                if ui.button("Open native surface").clicked() {
                    if self
                        .open_native_surface_window(&source, &title, DesktopSurfaceWindowKind::WebView, None, false, false, false, true, false)
                        .is_err()
                    {
                        self.open_source(&source);
                    }
                }
                if !is_probably_inline_html(&source) && ui.button("Open source").clicked() {
                    self.open_source(&source);
                }
            } else {
                ui.small(&source);
                if ui.button("Open native surface").clicked() {
                    if self
                        .open_native_surface_window(&source, &title, DesktopSurfaceWindowKind::WebView, None, false, false, false, true, false)
                        .is_err()
                    {
                        self.open_source(&source);
                    }
                }
                if ui.button("Open in browser").clicked() {
                    self.open_source(&source);
                }
            }
        });
    }

    fn render_media(&mut self, ui: &mut egui::Ui, ctx: &egui::Context, node: &NativeElementNode, path: &str) {
        let source = resolve_surface_source(node);
        let poster = self.resolve_prop_string(node, "poster").map(str::to_string);
        let media_label = if node.source_tag == "audio" { "Audio" } else { "Video" };
        let title = self.resolve_label(node).unwrap_or_else(|| String::from(media_label));
        let mut traits = Vec::new();

        if parse_native_bool(node.props.get("controls")) {
            traits.push("controls");
        }
        if parse_native_bool(node.props.get("autoplay")) {
            traits.push("autoplay");
        }
        if parse_native_bool(node.props.get("loop")) {
            traits.push("loop");
        }
        if parse_native_bool(node.props.get("muted")) {
            traits.push("muted");
        }
        if parse_native_bool(node.props.get("playsInline")) {
            traits.push("inline");
        }

        if let Some(source) = source.as_deref().filter(|_| Self::supports_embedded_surfaces()) {
            let kind = if node.source_tag == "audio" {
                DesktopSurfaceWindowKind::Audio
            } else {
                DesktopSurfaceWindowKind::Video
            };
            if let Some(content) = self.resolve_embedded_media_content(
                kind,
                &title,
                source,
                poster.as_deref(),
                parse_native_bool(node.props.get("autoplay")),
                parse_native_bool(node.props.get("loop")),
                parse_native_bool(node.props.get("muted")),
                parse_native_bool(node.props.get("controls")) || node.source_tag == "audio",
                parse_native_bool(node.props.get("playsInline")),
            ) {
                self.render_embedded_surface_slot(
                    ui,
                    node,
                    path,
                    &title,
                    kind,
                    content,
                    if node.source_tag == "audio" {
                        Vec2::new(640.0, 108.0)
                    } else {
                        Vec2::new(720.0, 405.0)
                    },
                );
                return;
            }
        }

        egui::Frame::group(ui.style()).show(ui, |ui| {
            ui.label(&title);

            if !traits.is_empty() {
                ui.small(traits.join(" | "));
            }

            if let Some(poster) = poster.as_deref() {
                self.render_local_or_placeholder_image(ui, ctx, node, poster, Some("Poster preview unavailable"));
            }

            if let Some(source) = source.as_deref() {
                ui.small(source);
                if ui.button("Open native surface").clicked() {
                    let kind = if node.source_tag == "audio" {
                        DesktopSurfaceWindowKind::Audio
                    } else {
                        DesktopSurfaceWindowKind::Video
                    };
                    if self
                        .open_native_surface_window(
                            source,
                            &title,
                            kind,
                            poster.as_deref(),
                            parse_native_bool(node.props.get("autoplay")),
                            parse_native_bool(node.props.get("loop")),
                            parse_native_bool(node.props.get("muted")),
                            parse_native_bool(node.props.get("controls")) || node.source_tag == "audio",
                            parse_native_bool(node.props.get("playsInline")),
                        )
                        .is_err()
                    {
                        self.open_source(source);
                    }
                }
                if ui.button("Open media").clicked() {
                    self.open_source(source);
                }
            } else {
                ui.small("No media source provided");
            }
        });
    }

    fn paint_polyline(&self, painter: &egui::Painter, points: Vec<Pos2>, stroke: egui::Stroke, closed: bool, fill: Option<Color32>) {
        if points.len() < 2 {
            return;
        }

        if closed {
            if let Some(fill) = fill {
                painter.add(egui::Shape::convex_polygon(points.clone(), fill, stroke));
                return;
            }

            let mut closed_points = points.clone();
            if let Some(first) = points.first() {
                closed_points.push(*first);
            }
            painter.add(egui::Shape::line(closed_points, stroke));
            return;
        }

        painter.add(egui::Shape::line(points, stroke));
    }

    fn scale_points_to_rect(&self, points: Vec<Pos2>, rect: Rect, view_box: (f32, f32, f32, f32)) -> Vec<Pos2> {
        points
            .into_iter()
            .map(|point| self.map_point_to_rect(point, rect, view_box))
            .collect()
    }

    fn map_point_to_rect(&self, point: Pos2, rect: Rect, view_box: (f32, f32, f32, f32)) -> Pos2 {
        let (min_x, min_y, width, height) = view_box;
        let scale_x = if width.abs() < f32::EPSILON { 1.0 } else { rect.width() / width };
        let scale_y = if height.abs() < f32::EPSILON { 1.0 } else { rect.height() / height };
        Pos2::new(
            rect.left() + (point.x - min_x) * scale_x,
            rect.top() + (point.y - min_y) * scale_y,
        )
    }

    fn draw_vector_node(
        &self,
        painter: &egui::Painter,
        rect: Rect,
        node: &NativeElementNode,
        view_box: (f32, f32, f32, f32),
        unsupported: &mut usize,
    ) {
        let fill = Self::parse_css_color(node.props.get("fill")).unwrap_or(Color32::TRANSPARENT);
        let stroke_color = Self::parse_css_color(node.props.get("stroke")).unwrap_or(Color32::TRANSPARENT);
        let stroke_width = Self::parse_css_number(node.props.get("strokeWidth"))
            .or_else(|| Self::parse_css_number(node.props.get("lineWidth")))
            .unwrap_or(1.0);
        let stroke = egui::Stroke::new(stroke_width.max(1.0), stroke_color);

        match node.source_tag.as_str() {
            "svg" | "g" => {
                for child in &node.children {
                    if let NativeNode::Element(element_node) = child {
                        self.draw_vector_node(painter, rect, element_node, view_box, unsupported);
                    }
                }
            }
            "circle" => {
                let cx = self.resolve_prop_number(node, "cx").unwrap_or(0.0);
                let cy = self.resolve_prop_number(node, "cy").unwrap_or(0.0);
                let r = self.resolve_prop_number(node, "r").unwrap_or(0.0);
                let center = self.map_point_to_rect(Pos2::new(cx, cy), rect, view_box);
                let radius = r * (rect.width() / view_box.2.max(1.0)).min(rect.height() / view_box.3.max(1.0));
                if fill != Color32::TRANSPARENT {
                    painter.circle_filled(center, radius, fill);
                }
                if stroke.color != Color32::TRANSPARENT {
                    painter.circle_stroke(center, radius, stroke);
                }
            }
            "rect" => {
                let x = self.resolve_prop_number(node, "x").unwrap_or(0.0);
                let y = self.resolve_prop_number(node, "y").unwrap_or(0.0);
                let width = self.resolve_prop_number(node, "width").unwrap_or(0.0);
                let height = self.resolve_prop_number(node, "height").unwrap_or(0.0);
                let min = self.map_point_to_rect(Pos2::new(x, y), rect, view_box);
                let max = self.map_point_to_rect(Pos2::new(x + width, y + height), rect, view_box);
                let shape_rect = Rect::from_min_max(min, max);
                if fill != Color32::TRANSPARENT {
                    painter.rect_filled(shape_rect, 0.0, fill);
                }
                if stroke.color != Color32::TRANSPARENT {
                    painter.rect_stroke(shape_rect, 0.0, stroke, StrokeKind::Inside);
                }
            }
            "line" => {
                let x1 = self.resolve_prop_number(node, "x1").unwrap_or(0.0);
                let y1 = self.resolve_prop_number(node, "y1").unwrap_or(0.0);
                let x2 = self.resolve_prop_number(node, "x2").unwrap_or(0.0);
                let y2 = self.resolve_prop_number(node, "y2").unwrap_or(0.0);
                painter.line_segment(
                    [
                        self.map_point_to_rect(Pos2::new(x1, y1), rect, view_box),
                        self.map_point_to_rect(Pos2::new(x2, y2), rect, view_box),
                    ],
                    stroke,
                );
            }
            "polyline" => {
                let points = node.props.get("points").map(parse_points_value).unwrap_or_default();
                let scaled = self.scale_points_to_rect(points, rect, view_box);
                self.paint_polyline(painter, scaled, stroke, false, None);
            }
            "polygon" => {
                let points = node.props.get("points").map(parse_points_value).unwrap_or_default();
                let scaled = self.scale_points_to_rect(points, rect, view_box);
                self.paint_polyline(
                    painter,
                    scaled,
                    stroke,
                    true,
                    (fill != Color32::TRANSPARENT).then_some(fill),
                );
            }
            "ellipse" => {
                let cx = self.resolve_prop_number(node, "cx").unwrap_or(0.0);
                let cy = self.resolve_prop_number(node, "cy").unwrap_or(0.0);
                let rx = self.resolve_prop_number(node, "rx").unwrap_or(0.0);
                let ry = self.resolve_prop_number(node, "ry").unwrap_or(0.0);
                let mut points = Vec::new();
                for step in 0..32 {
                    let angle = (step as f32 / 32.0) * std::f32::consts::TAU;
                    points.push(Pos2::new(cx + rx * angle.cos(), cy + ry * angle.sin()));
                }
                let scaled = self.scale_points_to_rect(points, rect, view_box);
                self.paint_polyline(
                    painter,
                    scaled,
                    stroke,
                    true,
                    (fill != Color32::TRANSPARENT).then_some(fill),
                );
            }
            "text" | "tspan" => {
                let x = self.resolve_prop_number(node, "x").unwrap_or(view_box.0);
                let y = self.resolve_prop_number(node, "y").unwrap_or(view_box.1 + 16.0);
                let point = self.map_point_to_rect(Pos2::new(x, y), rect, view_box);
                let text = self.collect_text_content(&NativeNode::Element(node.clone()));
                painter.text(
                    point,
                    Align2::LEFT_TOP,
                    text,
                    egui::FontId::proportional(14.0),
                    if fill != Color32::TRANSPARENT { fill } else { Color32::from_gray(230) },
                );
            }
            _ => {
                *unsupported += 1;
            }
        }
    }

    fn render_vector(&mut self, ui: &mut egui::Ui, node: &NativeElementNode) {
        if let Some(spec) = self.get_vector_spec(node) {
            self.render_vector_spec(ui, node, &spec);
            return;
        }

        let view_box = parse_view_box(node.props.get("viewBox")).unwrap_or((0.0, 0.0, 100.0, 100.0));
        let fallback = Vec2::new(view_box.2.max(24.0), view_box.3.max(24.0));
        let size = self.resolve_display_size(node, fallback);
        let (response, painter) = ui.allocate_painter(size, Sense::hover());
        let rect = response.rect;
        let mut unsupported = 0usize;

        if let Some(fill) = self.resolve_background_color(node) {
            painter.rect_filled(rect, 0.0, fill);
        }

        for child in &node.children {
            if let NativeNode::Element(element_node) = child {
                self.draw_vector_node(&painter, rect, element_node, view_box, &mut unsupported);
            }
        }

        if unsupported > 0 {
            ui.small(format!("{unsupported} vector node(s) still use fallback rendering"));
        }
    }

    fn draw_canvas_operation(&self, painter: &egui::Painter, rect: Rect, canvas_size: Vec2, operation: &Map<String, Value>) {
        let kind = operation.get("kind").and_then(Value::as_str).unwrap_or_default();
        let fill = Self::parse_css_color(operation.get("fill")).unwrap_or(Color32::TRANSPARENT);
        let stroke_color = Self::parse_css_color(operation.get("stroke")).unwrap_or(Color32::TRANSPARENT);
        let stroke_width = Self::parse_css_number(operation.get("strokeWidth"))
            .or_else(|| Self::parse_css_number(operation.get("lineWidth")))
            .unwrap_or(1.0);
        let stroke = egui::Stroke::new(stroke_width.max(1.0), stroke_color);
        let scale_x = rect.width() / canvas_size.x.max(1.0);
        let scale_y = rect.height() / canvas_size.y.max(1.0);
        let map_point = |x: f32, y: f32| Pos2::new(rect.left() + x * scale_x, rect.top() + y * scale_y);

        match kind {
            "rect" => {
                let x = Self::parse_css_number(operation.get("x")).unwrap_or(0.0);
                let y = Self::parse_css_number(operation.get("y")).unwrap_or(0.0);
                let width = Self::parse_css_number(operation.get("width")).unwrap_or(0.0);
                let height = Self::parse_css_number(operation.get("height")).unwrap_or(0.0);
                let shape_rect = Rect::from_min_max(map_point(x, y), map_point(x + width, y + height));
                if fill != Color32::TRANSPARENT {
                    painter.rect_filled(shape_rect, 0.0, fill);
                }
                if stroke.color != Color32::TRANSPARENT {
                    painter.rect_stroke(shape_rect, 0.0, stroke, StrokeKind::Inside);
                }
            }
            "circle" => {
                let cx = Self::parse_css_number(operation.get("cx")).unwrap_or(0.0);
                let cy = Self::parse_css_number(operation.get("cy")).unwrap_or(0.0);
                let radius = Self::parse_css_number(operation.get("r")).unwrap_or(0.0) * scale_x.min(scale_y);
                let center = map_point(cx, cy);
                if fill != Color32::TRANSPARENT {
                    painter.circle_filled(center, radius, fill);
                }
                if stroke.color != Color32::TRANSPARENT {
                    painter.circle_stroke(center, radius, stroke);
                }
            }
            "ellipse" => {
                let cx = Self::parse_css_number(operation.get("cx")).unwrap_or(0.0);
                let cy = Self::parse_css_number(operation.get("cy")).unwrap_or(0.0);
                let rx = Self::parse_css_number(operation.get("rx")).unwrap_or(0.0);
                let ry = Self::parse_css_number(operation.get("ry")).unwrap_or(0.0);
                let mut points = Vec::new();
                for step in 0..32 {
                    let angle = (step as f32 / 32.0) * std::f32::consts::TAU;
                    points.push(map_point(cx + rx * angle.cos(), cy + ry * angle.sin()));
                }
                self.paint_polyline(
                    painter,
                    points,
                    stroke,
                    true,
                    (fill != Color32::TRANSPARENT).then_some(fill),
                );
            }
            "line" => {
                let x1 = Self::parse_css_number(operation.get("x1")).unwrap_or(0.0);
                let y1 = Self::parse_css_number(operation.get("y1")).unwrap_or(0.0);
                let x2 = Self::parse_css_number(operation.get("x2")).unwrap_or(0.0);
                let y2 = Self::parse_css_number(operation.get("y2")).unwrap_or(0.0);
                painter.line_segment([map_point(x1, y1), map_point(x2, y2)], stroke);
            }
            "polyline" => {
                let points = operation.get("points").map(parse_points_value).unwrap_or_default();
                let scaled = points.into_iter().map(|point| map_point(point.x, point.y)).collect();
                self.paint_polyline(painter, scaled, stroke, false, None);
            }
            "polygon" => {
                let points = operation.get("points").map(parse_points_value).unwrap_or_default();
                let scaled = points.into_iter().map(|point| map_point(point.x, point.y)).collect();
                self.paint_polyline(
                    painter,
                    scaled,
                    stroke,
                    true,
                    (fill != Color32::TRANSPARENT).then_some(fill),
                );
            }
            _ => {}
        }
    }

    fn render_canvas(&mut self, ui: &mut egui::Ui, node: &NativeElementNode) {
        if let Some(spec) = self.get_canvas_spec(node) {
            self.render_canvas_spec(ui, node, &spec);
            return;
        }

        let intrinsic_width = self.resolve_prop_number(node, "width").unwrap_or(300.0);
        let intrinsic_height = self.resolve_prop_number(node, "height").unwrap_or(150.0);
        let size = self.resolve_display_size(node, Vec2::new(intrinsic_width, intrinsic_height));
        let (response, painter) = ui.allocate_painter(size, Sense::hover());
        let rect = response.rect;

        painter.rect_stroke(rect, 0.0, egui::Stroke::new(1.0, Color32::from_gray(70)), StrokeKind::Inside);

        if let Some(draw_ops) = node.props.get("drawOps").and_then(Value::as_array) {
            for operation in draw_ops {
                if let Some(operation) = operation.as_object() {
                    self.draw_canvas_operation(&painter, rect, Vec2::new(intrinsic_width, intrinsic_height), operation);
                }
            }
        } else {
            painter.text(
                rect.center(),
                Align2::CENTER_CENTER,
                "Canvas",
                egui::FontId::proportional(14.0),
                Color32::from_gray(180),
            );
        }
    }

    fn render_math(&mut self, ui: &mut egui::Ui, node: &NativeElementNode) {
        let text = self.collect_text_content(&NativeNode::Element(node.clone()));
        egui::Frame::group(ui.style()).show(ui, |ui| {
            ui.label(RichText::new(if text.trim().is_empty() { String::from("Math") } else { text }).monospace().italics());
        });
    }

    fn render_surface_placeholder(&mut self, ui: &mut egui::Ui, title: &str, message: &str) {
        egui::Frame::group(ui.style()).show(ui, |ui| {
            ui.label(title);
            ui.small(message);
        });
    }

    fn list_markers_visible_from_style(style: Option<&Map<String, Value>>) -> bool {
        let Some(style) = style else {
            return true;
        };

        let hides_markers = |value: Option<&Value>| {
            value
                .and_then(Value::as_str)
                .map(|value| {
                    value
                        .to_ascii_lowercase()
                        .split_whitespace()
                        .any(|token| token == "none")
                })
                .unwrap_or(false)
        };

        !(hides_markers(style.get("listStyle")) || hides_markers(style.get("listStyleType")))
    }

    fn current_list_markers_visible(&self) -> bool {
        self.list_marker_stack.last().copied().unwrap_or(true)
    }

    fn render_list(&mut self, ui: &mut egui::Ui, ctx: &egui::Context, node: &NativeElementNode, path: &str) {
        let style = self.resolve_style_map_with_state(node, self.base_pseudo_state(node));
        self.list_marker_stack.push(Self::list_markers_visible_from_style(style.as_ref()));
        self.render_container(ui, ctx, node, path);
        self.list_marker_stack.pop();
    }

    fn render_list_item(&mut self, ui: &mut egui::Ui, ctx: &egui::Context, node: &NativeElementNode, path: &str) {
        if !self.current_list_markers_visible() {
            self.render_container(ui, ctx, node, path);
            return;
        }

        ui.horizontal_top(|ui| {
            ui.label("•");
            let available_width = ui.available_width().max(1.0);
            ui.allocate_ui_with_layout(
                Vec2::new(available_width, 0.0),
                Layout::top_down(Align::Min).with_cross_justify(true),
                |ui| {
                    ui.set_width(available_width);
                    ui.set_min_width(available_width);
                    self.render_container(ui, ctx, node, path);
                },
            );
        });
    }

    fn render_button(&mut self, ui: &mut egui::Ui, ctx: &egui::Context, node: &NativeElementNode) {
        let label = self.collect_text_content(&NativeNode::Element(node.clone()));
        let disabled = self.is_disabled(node);
        let base_state = self.base_pseudo_state(node);
        let inactive_style = self.resolve_style_map_with_state(node, base_state);

        let mut hovered_state = base_state;
        hovered_state.hovered = true;
        let hovered_style = self.resolve_style_map_with_state(node, hovered_state);

        let mut active_state = hovered_state;
        active_state.active = true;
        let active_style = self.resolve_style_map_with_state(node, active_state);

        let mut focus_state = base_state;
        focus_state.focused = true;
        focus_state.focus_within = true;
        let focus_style = self.resolve_style_map_with_state(node, focus_state);

        let mut disabled_state = base_state;
        disabled_state.enabled = false;
        disabled_state.disabled = true;
        let disabled_style = self.resolve_style_map_with_state(node, disabled_state);
        let inactive_gradient = Self::resolve_background_gradient_from_style(inactive_style.as_ref());
        let hovered_gradient = Self::resolve_background_gradient_from_style(hovered_style.as_ref());
        let active_gradient = Self::resolve_background_gradient_from_style(active_style.as_ref());
        let focus_gradient = Self::resolve_background_gradient_from_style(focus_style.as_ref());
        let disabled_gradient = Self::resolve_background_gradient_from_style(disabled_style.as_ref());
        let gradient_shape_idx = if inactive_gradient.is_some() || hovered_gradient.is_some() || active_gradient.is_some() || focus_gradient.is_some() || disabled_gradient.is_some() {
            Some(ui.painter().add(egui::Shape::Noop))
        } else {
            None
        };
        let button_corner_radius = Self::resolve_corner_radius_from_style(inactive_style.as_ref()).unwrap_or(ui.style().visuals.widgets.inactive.corner_radius);

        let response = ui
            .scope(|ui| {
                self.apply_widget_state_visuals(
                    ui,
                    inactive_style.as_ref(),
                    hovered_style.as_ref(),
                    active_style.as_ref(),
                    focus_style.as_ref(),
                    disabled_style.as_ref(),
                );

                if let Some(padding) = Self::resolve_box_edges(inactive_style.as_ref(), "padding") {
                    ui.spacing_mut().button_padding = egui::vec2(padding.average_horizontal(), padding.average_vertical());
                }

                let min_size = self.resolve_widget_min_size(inactive_style.as_ref());
                let mut button = egui::Button::new(self.resolve_text_style_from_style(ui, inactive_style.as_ref(), label.clone(), false)).frame(true);
                if min_size != Vec2::ZERO {
                    button = button.min_size(min_size);
                }

                ui.add_enabled(!disabled, button)
            })
            .inner;

        if let Some(shape_idx) = gradient_shape_idx {
            let active_gradient = if disabled {
                disabled_gradient.or(inactive_gradient)
            } else if response.is_pointer_button_down_on() {
                active_gradient.or(hovered_gradient).or(focus_gradient).or(inactive_gradient)
            } else if response.hovered() {
                hovered_gradient.or(focus_gradient).or(inactive_gradient)
            } else if response.has_focus() {
                focus_gradient.or(inactive_gradient)
            } else {
                inactive_gradient
            };

            if let Some(gradient) = active_gradient {
                ui.painter().set(
                    shape_idx,
                    Self::gradient_shape_for_rect(response.rect, button_corner_radius, &gradient),
                );
            }
        }

        if response.clicked() {
            if let Some(interaction) = resolve_interaction(node, None, None) {
                self.dispatch_interaction(ctx, interaction);
            } else if node.events.iter().any(|event| event == "press") {
                self.dispatch_press_event(ctx, node);
            }
        }
    }

    fn render_link(&mut self, ui: &mut egui::Ui, ctx: &egui::Context, node: &NativeElementNode) {
        let label = self.collect_text_content(&NativeNode::Element(node.clone()));
        let base_state = self.base_pseudo_state(node);
        let inactive_style = self.resolve_style_map_with_state(node, base_state);

        let mut hovered_state = base_state;
        hovered_state.hovered = true;
        let hovered_style = self.resolve_style_map_with_state(node, hovered_state);

        let mut active_state = hovered_state;
        active_state.active = true;
        let active_style = self.resolve_style_map_with_state(node, active_state);

        let mut focus_state = base_state;
        focus_state.focused = true;
        focus_state.focus_within = true;
        let focus_style = self.resolve_style_map_with_state(node, focus_state);

        let has_frame = Self::style_has_widget_frame(inactive_style.as_ref());
        let inactive_gradient = Self::resolve_background_gradient_from_style(inactive_style.as_ref());
        let hovered_gradient = Self::resolve_background_gradient_from_style(hovered_style.as_ref());
        let active_gradient = Self::resolve_background_gradient_from_style(active_style.as_ref());
        let focus_gradient = Self::resolve_background_gradient_from_style(focus_style.as_ref());
        let gradient_shape_idx = if inactive_gradient.is_some() || hovered_gradient.is_some() || active_gradient.is_some() || focus_gradient.is_some() {
            Some(ui.painter().add(egui::Shape::Noop))
        } else {
            None
        };
        let link_corner_radius = Self::resolve_corner_radius_from_style(inactive_style.as_ref()).unwrap_or(ui.style().visuals.widgets.inactive.corner_radius);
        let destination = node.props.get("destination").and_then(Value::as_str).map(str::trim).unwrap_or("");
        let response = ui
            .scope(|ui| {
                self.apply_widget_state_visuals(
                    ui,
                    inactive_style.as_ref(),
                    hovered_style.as_ref(),
                    active_style.as_ref(),
                    focus_style.as_ref(),
                    None,
                );

                if has_frame {
                    if let Some(padding) = Self::resolve_box_edges(inactive_style.as_ref(), "padding") {
                        ui.spacing_mut().button_padding = egui::vec2(padding.average_horizontal(), padding.average_vertical());
                    }
                }

                let min_size = self.resolve_widget_min_size(inactive_style.as_ref());
                let mut link = egui::Button::new(self.resolve_text_style_from_style(ui, inactive_style.as_ref(), label.clone(), false)).frame(has_frame);
                if min_size != Vec2::ZERO {
                    link = link.min_size(min_size);
                }

                ui.add(link)
            })
            .inner;

        if let Some(shape_idx) = gradient_shape_idx {
            let active_gradient = if response.is_pointer_button_down_on() {
                active_gradient.or(hovered_gradient).or(focus_gradient).or(inactive_gradient)
            } else if response.hovered() {
                hovered_gradient.or(focus_gradient).or(inactive_gradient)
            } else if response.has_focus() {
                focus_gradient.or(inactive_gradient)
            } else {
                inactive_gradient
            };

            if let Some(gradient) = active_gradient {
                ui.painter().set(
                    shape_idx,
                    Self::gradient_shape_for_rect(response.rect, link_corner_radius, &gradient),
                );
            }
        }

        if response.clicked() {
            if !destination.is_empty() && is_external_destination(destination) {
                let _ = webbrowser::open(destination);
            } else if let Some(interaction) = resolve_interaction(node, None, None) {
                self.dispatch_interaction(ctx, interaction);
            } else if node.events.iter().any(|event| event == "press") {
                self.dispatch_press_event(ctx, node);
            }
        }
    }

    fn render_children_with_style(
        &mut self,
        ui: &mut egui::Ui,
        ctx: &egui::Context,
        node: &NativeElementNode,
        path: &str,
        style: Option<&Map<String, Value>>,
    ) {
        let gap = Self::resolve_gap_from_style(style);
        let previous_spacing = ui.spacing().item_spacing;
        let available_width = ui.available_width().max(1.0);
        let inline_display = Self::is_inline_display_from_style(style);
        let ordered_children = Self::ordered_children(&node.children, style);
        let ordered_child_refs = ordered_children.iter().map(|(_, child)| *child).collect::<Vec<_>>();
        let allocated_height = style
            .and_then(|style| {
                self.parse_css_number_with_viewport(style.get("height"))
                    .or_else(|| self.parse_css_number_with_viewport(style.get("minHeight")))
                    .or_else(|| self.parse_css_number_with_viewport(style.get("maxHeight")))
            })
            .map(|_| ui.available_height().max(0.0))
            .unwrap_or(0.0);
        ui.spacing_mut().item_spacing = egui::vec2(gap, gap);

        if let Some(grid_layout) = Self::resolve_grid_layout(style, ui.available_width(), ordered_children.len(), gap) {
            let column_count = grid_layout.column_widths.len().max(1);
            for (row_index, row_children) in ordered_children.chunks(column_count).enumerate() {
                ui.horizontal_top(|ui| {
                    ui.spacing_mut().item_spacing.x = gap;
                    for (column_index, column_width) in grid_layout.column_widths.iter().enumerate() {
                        if let Some((original_index, child)) = row_children.get(column_index).copied() {
                            ui.allocate_ui_with_layout(
                                Vec2::new(*column_width, 0.0),
                                Layout::top_down(Align::Min).with_cross_justify(true),
                                |ui| {
                                    ui.set_width(*column_width);
                                    ui.set_min_width(*column_width);
                                    self.render_node(ui, ctx, child, &format!("{path}-{original_index}"));
                                },
                            );
                        } else {
                            ui.allocate_space(Vec2::new(*column_width, 0.0));
                        }
                    }
                });

                if row_index + 1 < ordered_children.len().div_ceil(column_count) {
                    ui.add_space(gap);
                }
            }

            ui.spacing_mut().item_spacing = previous_spacing;
            return;
        }

        // CSS column-count: N — multi-column layout (not flex/grid)
        let is_flex_or_grid = Self::is_row_layout_from_style(style)
            || style.and_then(|s| s.get("display")).and_then(Value::as_str)
                .map(|d| d.contains("grid")).unwrap_or(false);
        if !is_flex_or_grid {
            if let Some(column_count) = Self::resolve_column_count_from_style(style) {
                let col_gap = style.and_then(|s| {
                    s.get("columnGap").or_else(|| s.get("column-gap"))
                        .and_then(|v| Self::parse_css_number(Some(v)))
                }).unwrap_or(gap);
                let total_gap = col_gap * (column_count.saturating_sub(1) as f32);
                let col_width = ((available_width - total_gap) / column_count as f32).max(1.0);
                let col_widths = vec![col_width; column_count];
                for (row_index, row_children) in ordered_children.chunks(column_count).enumerate() {
                    ui.horizontal_top(|ui| {
                        ui.spacing_mut().item_spacing.x = col_gap;
                        for (col_index, &cw) in col_widths.iter().enumerate() {
                            if let Some((original_index, child)) = row_children.get(col_index).copied() {
                                ui.allocate_ui_with_layout(
                                    Vec2::new(cw, 0.0),
                                    Layout::top_down(Align::Min).with_cross_justify(true),
                                    |ui| {
                                        ui.set_width(cw);
                                        ui.set_min_width(cw);
                                        self.render_node(ui, ctx, child, &format!("{path}-{original_index}"));
                                    },
                                );
                            } else {
                                ui.allocate_space(Vec2::new(cw, 0.0));
                            }
                        }
                    });
                    if row_index + 1 < ordered_children.len().div_ceil(column_count) {
                        ui.add_space(gap);
                    }
                }
                ui.spacing_mut().item_spacing = previous_spacing;
                return;
            }
        }

        let row_layout = Self::is_row_layout_from_style(style);
        if row_layout && !inline_display && !Self::flex_wraps(style) {
            if let Some(row_widths) = Self::resolve_row_flex_widths_for_nodes(&ordered_child_refs, ui.available_width(), gap) {
                let layout = Self::resolve_layout_from_style(style, true);
                ui.allocate_ui_with_layout(Vec2::new(available_width, allocated_height), layout, |ui| {
                    ui.set_width(available_width);
                    ui.set_min_width(available_width);
                    if allocated_height > 0.0 {
                        ui.set_min_height(allocated_height);
                        ui.set_max_height(allocated_height);
                    }
                    for (index, (original_index, child)) in ordered_children.iter().enumerate() {
                        if let Some(width) = row_widths.get(index).copied().flatten() {
                            ui.allocate_ui_with_layout(
                                Vec2::new(width, 0.0),
                                Layout::top_down(Align::Min).with_cross_justify(true),
                                |ui| {
                                    ui.set_width(width);
                                    ui.set_min_width(width);
                                    self.render_node(ui, ctx, child, &format!("{path}-{original_index}"));
                                },
                            );
                        } else {
                            self.render_node(ui, ctx, child, &format!("{path}-{original_index}"));
                        }
                    }
                });

                ui.spacing_mut().item_spacing = previous_spacing;
                return;
            }
        }

        let layout = if Self::should_force_centered_single_child_layout(style, node.children.len()) {
            Layout::centered_and_justified(if row_layout {
                Direction::LeftToRight
            } else {
                Direction::TopDown
            })
        } else {
            Self::resolve_layout_from_style(style, row_layout)
        };
        if inline_display {
            ui.scope_builder(egui::UiBuilder::new().layout(layout), |ui| {
                if allocated_height > 0.0 {
                    ui.set_min_height(allocated_height);
                    ui.set_max_height(allocated_height);
                }
                for (original_index, child) in &ordered_children {
                    self.render_node(ui, ctx, child, &format!("{path}-{original_index}"));
                }
            });
        } else {
            ui.allocate_ui_with_layout(Vec2::new(available_width, allocated_height), layout, |ui| {
                ui.set_width(available_width);
                ui.set_min_width(available_width);
                if allocated_height > 0.0 {
                    ui.set_min_height(allocated_height);
                    ui.set_max_height(allocated_height);
                }
                for (original_index, child) in &ordered_children {
                    self.render_node(ui, ctx, child, &format!("{path}-{original_index}"));
                }
            });
        }

        ui.spacing_mut().item_spacing = previous_spacing;
    }

    fn render_children(&mut self, ui: &mut egui::Ui, ctx: &egui::Context, node: &NativeElementNode, path: &str) {
        self.render_children_with_style(ui, ctx, node, path, self.get_style_map(node));
    }

    fn render_container_contents_body(
        &mut self,
        ui: &mut egui::Ui,
        ctx: &egui::Context,
        node: &NativeElementNode,
        path: &str,
        style: Option<&Map<String, Value>>,
        available_width: f32,
        width: Option<f32>,
        min_width: Option<f32>,
        max_width: Option<f32>,
        height: Option<f32>,
        min_height: Option<f32>,
        max_height: Option<f32>,
    ) {
        if let Some(width) = width {
            ui.set_min_width(width);
            ui.set_max_width(width);
        } else {
            if Self::has_auto_horizontal_margin(style) || max_width.is_some() || matches!(node.component.as_str(), "Screen" | "List") {
                let target_width = max_width.unwrap_or(available_width).min(available_width).max(min_width.unwrap_or(0.0));
                ui.set_min_width(target_width);
                ui.set_max_width(target_width);
            }
            if let Some(min_width) = min_width {
                ui.set_min_width(min_width);
            }
            if let Some(max_width) = max_width.filter(|_| !(Self::has_auto_horizontal_margin(style) || matches!(node.component.as_str(), "Screen" | "List"))) {
                ui.set_max_width(max_width);
            }
        }
        if let Some(height) = height {
            ui.set_min_height(height);
            ui.set_max_height(height);
        } else {
            if let Some(min_height) = min_height {
                ui.set_min_height(min_height);
            }
            if let Some(max_height) = max_height {
                ui.set_max_height(max_height);
            }
        }

        let opacity = Self::resolve_opacity_from_style(style);
        let backdrop_blur = Self::resolve_backdrop_blur_radius_from_style(style);
        let css_filter = Self::resolve_css_filter_from_style(style);
        let linear_gradient = Self::resolve_background_gradient_from_style(style).map(|g| Self::gradient_with_opacity(g, opacity));
        let radial_gradient = if linear_gradient.is_none() {
            Self::resolve_background_radial_gradient_from_style(style).map(|g| Self::radial_gradient_with_opacity(g, opacity))
        } else {
            None
        };
        let has_gradient = linear_gradient.is_some() || radial_gradient.is_some();
        let fill = if has_gradient {
            Color32::TRANSPARENT
        } else {
            let raw_fill = Self::resolve_effective_background_color_from_style(style)
                .map(|fill| fill.gamma_multiply(opacity))
                .unwrap_or(Color32::TRANSPARENT);
            if let Some(ref f) = css_filter { f.apply(raw_fill) } else { raw_fill }
        };
        let raw_stroke = Self::resolve_border_stroke_from_style(style).unwrap_or(egui::Stroke::NONE);
        let stroke = if let Some(ref f) = css_filter {
            egui::Stroke::new(raw_stroke.width, f.apply(raw_stroke.color))
        } else {
            raw_stroke
        };
        let padding = Self::resolve_box_edges(style, "padding").filter(|padding| !padding.is_zero());
        let margin = Self::resolve_box_edges(style, "margin").filter(|margin| !margin.is_zero());
        let corner_radius = Self::resolve_corner_radius_from_style(style);
        let shadow = Self::resolve_box_shadow_from_style(style)
            .or_else(|| backdrop_blur.filter(|_| corner_radius.is_some()).map(Self::synthesize_shadow_from_backdrop_blur));
        let outline_stroke = Self::resolve_outline_from_style(style);
        let overflow_behavior = Self::resolve_overflow_behavior(style);
        let overflow_hidden = overflow_behavior.has_clip() && !overflow_behavior.has_scroll();
        let cursor_icon = Self::resolve_cursor_from_style(style);
        let css_transform = Self::resolve_css_transform_from_style(style);
        let position_offset = self.resolve_position_offset_from_style(style);
        let translate_x = css_transform.as_ref().map(|transform| transform.translate_x).unwrap_or(0.0)
            + position_offset.map(|(dx, _)| dx).unwrap_or(0.0);
        let translate_y = css_transform.as_ref().map(|transform| transform.translate_y).unwrap_or(0.0)
            + position_offset.map(|(_, dy)| dy).unwrap_or(0.0);
        let effective_margin = if translate_x.abs() > f32::EPSILON || translate_y.abs() > f32::EPSILON {
            let base_margin = margin.unwrap_or_default();
            Some(DesktopBoxEdges {
                top: base_margin.top + translate_y,
                right: base_margin.right - translate_x,
                bottom: base_margin.bottom - translate_y,
                left: base_margin.left + translate_x,
            })
        } else {
            margin
        };
        let clickable_container = resolve_interaction(node, None, None).is_some()
            || node.events.iter().any(|event| event == "press");
        let focusable_container = clickable_container
            || self.has_focusable_tab_index(node)
            || self.get_style_variant_map(node, "focus").is_some()
            || self.get_style_variant_map(node, "focusWithin").is_some();
        let container_state_styles = self
            .container_supports_runtime_visual_state(node)
            .then(|| self.resolve_widget_state_styles(node, self.base_pseudo_state(node)));
        let has_frame = fill != Color32::TRANSPARENT
            || stroke != egui::Stroke::NONE
            || padding.is_some()
            || effective_margin.filter(|m| !m.is_zero()).is_some()
            || corner_radius.is_some()
            || shadow.is_some()
            || opacity < 1.0
            || has_gradient
            || matches!(node.source_tag.as_str(), "section" | "article");

        if has_frame {
            let gradient_shape_idx = if has_gradient { Some(ui.painter().add(egui::Shape::Noop)) } else { None };
            let mut frame = egui::Frame::new().fill(fill).stroke(stroke);
            if let Some(padding) = padding {
                frame = frame.inner_margin(padding.to_margin());
            }
            if let Some(margin) = effective_margin.filter(|m| !m.is_zero()) {
                frame = frame.outer_margin(margin.to_margin());
            }
            if let Some(corner_radius) = corner_radius {
                frame = frame.corner_radius(corner_radius);
            }
            if let Some(shadow) = shadow {
                frame = frame.shadow(shadow);
            }
            if opacity < 1.0 {
                frame = frame.multiply_with_opacity(opacity);
            }

            let content_width = Self::content_axis_size_from_outer_size(
                width.or(max_width).or(min_width),
                padding.map(|padding| padding.left + padding.right).unwrap_or(0.0),
                stroke.width,
            );
            let content_min_width = Self::content_axis_size_from_outer_size(
                min_width,
                padding.map(|padding| padding.left + padding.right).unwrap_or(0.0),
                stroke.width,
            );
            let content_max_width = Self::content_axis_size_from_outer_size(
                max_width,
                padding.map(|padding| padding.left + padding.right).unwrap_or(0.0),
                stroke.width,
            );
            let content_height = Self::content_axis_size_from_outer_size(
                height.or(max_height).or(min_height),
                padding.map(|padding| padding.top + padding.bottom).unwrap_or(0.0),
                stroke.width,
            );
            let content_min_height = Self::content_axis_size_from_outer_size(
                min_height,
                padding.map(|padding| padding.top + padding.bottom).unwrap_or(0.0),
                stroke.width,
            );
            let content_max_height = Self::content_axis_size_from_outer_size(
                max_height,
                padding.map(|padding| padding.top + padding.bottom).unwrap_or(0.0),
                stroke.width,
            );

            let mut prepared = frame.begin(ui);
            if let Some(content_width) = content_width {
                prepared.content_ui.set_min_width(content_width);
                prepared.content_ui.set_max_width(content_width);
            } else {
                if let Some(content_min_width) = content_min_width {
                    prepared.content_ui.set_min_width(content_min_width);
                }
                if let Some(content_max_width) = content_max_width {
                    prepared.content_ui.set_max_width(content_max_width);
                }
            }
            if let Some(content_height) = content_height {
                prepared.content_ui.set_min_height(content_height);
                prepared.content_ui.set_max_height(content_height);
            } else {
                if let Some(content_min_height) = content_min_height {
                    prepared.content_ui.set_min_height(content_min_height);
                }
                if let Some(content_max_height) = content_max_height {
                    prepared.content_ui.set_max_height(content_max_height);
                }
            }

            if overflow_behavior.has_scroll() {
                egui::ScrollArea::new([overflow_behavior.horizontal_scroll, overflow_behavior.vertical_scroll])
                    .auto_shrink([false, false])
                    .show(&mut prepared.content_ui, |ui| {
                        self.render_children_with_style(ui, ctx, node, path, style);
                    });
            } else {
                if overflow_hidden {
                    let clip = prepared.content_ui.clip_rect().intersect(prepared.content_ui.max_rect());
                    prepared.content_ui.set_clip_rect(clip);
                }

                self.render_children_with_style(&mut prepared.content_ui, ctx, node, path, style);
            }

            let response = prepared.end(ui);

            let widget_rect = if let Some(margin) = effective_margin.filter(|m| !m.is_zero()) {
                Rect::from_min_max(
                    Pos2::new(response.rect.left() + margin.left, response.rect.top() + margin.top),
                    Pos2::new(response.rect.right() - margin.right, response.rect.bottom() - margin.bottom),
                )
            } else {
                response.rect
            };

            let interaction_response = container_state_styles.as_ref().map(|_| {
                let sense = if focusable_container {
                    egui::Sense::click()
                } else {
                    egui::Sense::hover()
                };
                let response = ui.interact(widget_rect, ui.id().with(path), sense);
                if response.clicked() && focusable_container {
                    response.request_focus();
                }
                if response.clicked() && clickable_container {
                    if let Some(interaction) = resolve_interaction(node, None, None) {
                        self.dispatch_interaction(ctx, interaction);
                    } else if node.events.iter().any(|event| event == "press") {
                        self.dispatch_press_event(ctx, node);
                    }
                }
                response
            });
            let visual_style = interaction_response
                .as_ref()
                .and_then(|response| {
                    container_state_styles
                        .as_ref()
                        .and_then(|styles| Self::resolve_container_state_style(response, styles, self.is_disabled(node)))
                })
                .or(style);
            let visual_corner_radius = Self::resolve_corner_radius_from_style(visual_style)
                .or(corner_radius)
                .unwrap_or(CornerRadius::ZERO);

            if let Some(shape_idx) = gradient_shape_idx {
                let visual_opacity = Self::resolve_opacity_from_style(visual_style);
                let visual_filter = Self::resolve_css_filter_from_style(visual_style);
                let visual_linear_gradient = Self::resolve_background_gradient_from_style(visual_style)
                    .map(|gradient| Self::gradient_with_opacity(gradient, visual_opacity));
                let visual_radial_gradient = if visual_linear_gradient.is_none() {
                    Self::resolve_background_radial_gradient_from_style(visual_style)
                        .map(|gradient| Self::radial_gradient_with_opacity(gradient, visual_opacity))
                } else {
                    None
                };
                let grad_shape = if let Some(gradient) = visual_linear_gradient.as_ref() {
                    Some(Self::gradient_shape_for_rect(widget_rect, visual_corner_radius, gradient))
                } else if let Some(gradient) = visual_radial_gradient.as_ref() {
                    Some(Self::radial_gradient_shape_for_rect(widget_rect, visual_corner_radius, gradient))
                } else {
                    let fill = Self::resolve_effective_background_color_from_style(visual_style)
                        .map(|fill| fill.gamma_multiply(visual_opacity))
                        .map(|fill| visual_filter.as_ref().map(|filter| filter.apply(fill)).unwrap_or(fill))
                        .unwrap_or(Color32::TRANSPARENT);
                    Some(egui::Shape::rect_filled(widget_rect, visual_corner_radius, fill))
                };
                if let Some(shape) = grad_shape {
                    ui.painter().set(shape_idx, shape);
                }
            }

            let visual_stroke = if let Some(filter) = Self::resolve_css_filter_from_style(visual_style) {
                Self::resolve_border_stroke_from_style(visual_style)
                    .map(|stroke| egui::Stroke::new(stroke.width, filter.apply(stroke.color)))
                    .unwrap_or(egui::Stroke::NONE)
            } else {
                Self::resolve_border_stroke_from_style(visual_style).unwrap_or(egui::Stroke::NONE)
            };
            if visual_stroke != egui::Stroke::NONE || Self::style_disables_border(visual_style) {
                ui.painter().rect_stroke(widget_rect, visual_corner_radius, visual_stroke, StrokeKind::Outside);
            }

            if let Some(outline) = Self::resolve_outline_from_style(visual_style).or(outline_stroke) {
                let expand = outline.width.max(1.0);
                let outline_rect = widget_rect.expand(expand);
                ui.painter().rect_stroke(outline_rect, visual_corner_radius, outline, StrokeKind::Outside);
            }

            let resolved_cursor_icon = interaction_response
                .as_ref()
                .and_then(|response| response.hovered().then(|| Self::resolve_cursor_from_style(visual_style)).flatten())
                .or(cursor_icon)
                .or_else(|| {
                    interaction_response
                        .as_ref()
                        .and_then(|response| response.hovered().then_some(egui::CursorIcon::PointingHand))
                        .filter(|_| clickable_container)
                });
            if let Some(cursor) = resolved_cursor_icon {
                let hovered = interaction_response
                    .as_ref()
                    .map(|response| response.hovered())
                    .unwrap_or_else(|| ui.interact(widget_rect, ui.id().with("cursor"), egui::Sense::hover()).hovered());
                if hovered {
                    ui.ctx().set_cursor_icon(cursor);
                }
            }

            return;
        }

        if overflow_behavior.has_scroll() {
            egui::ScrollArea::new([overflow_behavior.horizontal_scroll, overflow_behavior.vertical_scroll])
                .auto_shrink([false, false])
                .show(ui, |ui| {
                    self.render_children_with_style(ui, ctx, node, path, style);
                });
            return;
        }

        // No frame — but may still need overflow clip on the raw ui area
        if overflow_hidden {
            let clip = ui.clip_rect().intersect(ui.max_rect());
            ui.set_clip_rect(clip);
        }

        self.render_children_with_style(ui, ctx, node, path, style);
    }

    fn render_container_contents(
        &mut self,
        ui: &mut egui::Ui,
        ctx: &egui::Context,
        node: &NativeElementNode,
        path: &str,
        style: Option<&Map<String, Value>>,
    ) {
        let available_width = ui.available_width().max(1.0);
        let width = style.and_then(|style| self.parse_css_size_against_basis_with_viewport(style.get("width"), available_width));
        let min_width = style.and_then(|style| self.parse_css_size_against_basis_with_viewport(style.get("minWidth"), available_width));
        let max_width = style.and_then(|style| self.parse_css_size_against_basis_with_viewport(style.get("maxWidth"), available_width));
        let height = style.and_then(|style| self.parse_css_number_with_viewport(style.get("height")));
        let min_height = style.and_then(|style| self.parse_css_number_with_viewport(style.get("minHeight")));
        let max_height = style.and_then(|style| self.parse_css_number_with_viewport(style.get("maxHeight")));
        let should_wrap_in_sized_ui = width.is_some()
            || height.is_some()
            || min_width.is_some()
            || max_width.is_some()
            || min_height.is_some()
            || max_height.is_some();

        let target_width = width.unwrap_or_else(|| {
            if Self::has_auto_horizontal_margin(style) || max_width.is_some() || matches!(node.component.as_str(), "Screen" | "List") {
                max_width.unwrap_or(available_width).min(available_width).max(min_width.unwrap_or(0.0))
            } else {
                available_width.max(min_width.unwrap_or(0.0))
            }
        });
        let target_height = height.unwrap_or(0.0);

        if should_wrap_in_sized_ui {
            ui.allocate_ui_with_layout(
                Vec2::new(target_width.max(0.0), target_height.max(0.0)),
                Layout::top_down(Align::Min).with_cross_justify(true),
                |ui| {
                    ui.set_width(target_width.max(0.0));
                    ui.set_min_width(target_width.max(0.0));
                    if let Some(width) = width {
                        ui.set_max_width(width);
                    } else if let Some(max_width) = max_width {
                        ui.set_max_width(max_width);
                    }

                    if let Some(height) = height {
                        ui.set_min_height(height);
                        ui.set_max_height(height);
                    } else {
                        if let Some(min_height) = min_height {
                            ui.set_min_height(min_height);
                        }
                        if let Some(max_height) = max_height {
                            ui.set_max_height(max_height);
                        }
                    }

                    self.render_container_contents_body(
                        ui,
                        ctx,
                        node,
                        path,
                        style,
                        available_width,
                        width,
                        min_width,
                        max_width,
                        height,
                        min_height,
                        max_height,
                    );
                },
            );
            return;
        }

        self.render_container_contents_body(
            ui,
            ctx,
            node,
            path,
            style,
            available_width,
            width,
            min_width,
            max_width,
            height,
            min_height,
            max_height,
        );
    }

    fn render_container(&mut self, ui: &mut egui::Ui, ctx: &egui::Context, node: &NativeElementNode, path: &str) {
        let style = self.resolve_style_map_with_state(node, self.base_pseudo_state(node));

        if Self::has_auto_horizontal_margin(style.as_ref()) {
            ui.vertical_centered(|ui| {
                self.render_container_contents(ui, ctx, node, path, style.as_ref());
            });
            return;
        }

        self.render_container_contents(ui, ctx, node, path, style.as_ref());
    }

    fn render_node(&mut self, ui: &mut egui::Ui, ctx: &egui::Context, node: &NativeNode, path: &str) {
        match node {
            NativeNode::Text(text_node) => {
                ui.label(self.resolve_text_node_value(text_node));
            }
            NativeNode::Element(element_node) => match element_node.component.as_str() {
                "Text" => self.render_text_element(ui, element_node),
                "Button" => self.render_button(ui, ctx, element_node),
                "Link" => self.render_link(ui, ctx, element_node),
                "TextInput" => self.render_text_input(ui, ctx, element_node, path),
                "Toggle" => self.render_toggle(ui, ctx, element_node, path),
                "Slider" => self.render_slider(ui, ctx, element_node, path),
                "Picker" => self.render_picker(ui, ctx, element_node, path),
                "Option" => self.render_text_element(ui, element_node),
                "Divider" => self.render_divider(ui),
                "Progress" => self.render_progress(ui, element_node),
                "Image" => self.render_image(ui, ctx, element_node),
                "WebView" => self.render_web_view(ui, element_node, path),
                "Media" => self.render_media(ui, ctx, element_node, path),
                "Canvas" => self.render_canvas(ui, element_node),
                "Vector" => self.render_vector(ui, element_node),
                "Math" => self.render_math(ui, element_node),
                "Table" => self.render_table(ui, ctx, element_node, path),
                "Row" => self.render_row(ui, ctx, element_node, path),
                "Cell" => self.render_cell(ui, ctx, element_node, path),
                "ListItem" => self.render_list_item(ui, ctx, element_node, path),
                "List" => self.render_list(ui, ctx, element_node, path),
                "Screen" | "View" => self.render_container(ui, ctx, element_node, path),
                _ => self.render_surface_placeholder(ui, &element_node.component, "Desktop native fallback surface"),
            },
        }
    }
}

impl eframe::App for DesktopNativeApp {
    fn update(&mut self, ctx: &egui::Context, frame: &mut eframe::Frame) {
        let roots = self.payload.tree.roots.clone();
        self.viewport_size = ctx.screen_rect().size();
        self.ensure_fonts_loaded(ctx);
        self.emit_ready_interaction();

        egui::CentralPanel::default().show(ctx, |ui| {
            egui::ScrollArea::vertical().auto_shrink([false, false]).show(ui, |ui| {
                if self.navigation.current_route().is_some() || self.navigation.can_go_forward() {
                    ui.horizontal(|ui| {
                        if ui.add_enabled(self.navigation.can_go_back(), egui::Button::new("Back")).clicked() {
                            self.navigation.go_back();
                            self.apply_navigation_title(ctx);
                        }

                        if ui.add_enabled(self.navigation.can_go_forward(), egui::Button::new("Forward")).clicked() {
                            self.navigation.go_forward();
                            self.apply_navigation_title(ctx);
                        }

                        if ui.add_enabled(self.navigation.current_route().is_some(), egui::Button::new("Reset")).clicked() {
                            self.navigation.clear();
                            self.apply_navigation_title(ctx);
                        }

                        ui.small(self.navigation.current_route().unwrap_or("/"));
                    });
                    ui.separator();
                }

                for (index, root) in roots.iter().enumerate() {
                    self.render_node(ui, ctx, root, &format!("root-{index}"));
                }

                if let Some(interaction) = &self.last_interaction {
                    ui.separator();
                    ui.small(format!("Last interaction: {}", interaction.summary()));
                }
            });
        });

        self.reconcile_embedded_surfaces(frame);

        if self.pending_auto_close {
            self.pending_auto_close = false;
            ctx.send_viewport_cmd(egui::ViewportCommand::Close);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn empty_app() -> DesktopNativeApp {
        DesktopNativeApp::new(NativeDesktopPayload {
            window: NativeDesktopWindowOptions {
                title: String::from("Test"),
                width: 640.0,
                height: 480.0,
                center: false,
                icon: None,
                auto_close: false,
            },
            resource_base_dir: None,
            interaction_output: None,
            tree: NativeTree {
                _platform: String::from("generic"),
                roots: Vec::new(),
                state_descriptors: Vec::new(),
            },
        })
    }

    fn element(component: &str, source_tag: &str, props: Value, events: &[&str], children: Vec<NativeNode>) -> NativeElementNode {
        NativeElementNode {
            component: component.to_string(),
            source_tag: source_tag.to_string(),
            props: props
                .as_object()
                .cloned()
                .unwrap_or_default()
                .into_iter()
                .collect(),
            events: events.iter().map(|event| event.to_string()).collect(),
            children,
        }
    }

    #[test]
    fn resolves_relative_resource_path_from_base_dir() {
        let base_dir = std::env::temp_dir().join("elit-desktop-native-test");
        std::fs::create_dir_all(&base_dir).unwrap();
        let file_path = base_dir.join("image.png");
        std::fs::write(&file_path, b"elit").unwrap();

        let resolved = resolve_resource_path(Some(&base_dir), "image.png");
        assert_eq!(resolved.as_deref(), Some(file_path.as_path()));

        let _ = std::fs::remove_file(file_path);
        let _ = std::fs::remove_dir_all(base_dir);
    }

    #[test]
    fn normalizes_stringified_json_payloads() {
        assert_eq!(normalize_jsonish_value(Value::String(String::from("{\"id\":1}"))), json!({ "id": 1 }));
        assert_eq!(normalize_jsonish_value(Value::String(String::from("\"desktop\""))), Value::String(String::from("desktop")));
        assert_eq!(normalize_jsonish_value(Value::String(String::from("plain-text"))), Value::String(String::from("plain-text")));
    }

    #[test]
    fn resolves_percentage_sizes_against_available_width() {
        assert_eq!(DesktopNativeApp::parse_css_size_against_basis(Some(&Value::String(String::from("100%"))), 640.0), Some(640.0));
        assert_eq!(DesktopNativeApp::parse_css_size_against_basis(Some(&Value::String(String::from("50%"))), 320.0), Some(160.0));
        assert_eq!(DesktopNativeApp::parse_css_size_against_basis(Some(&Value::String(String::from("24px"))), 320.0), Some(24.0));
    }

    #[test]
    fn resolves_widget_width_from_percent_and_constraints() {
        let app = empty_app();
        let fill = json!({ "width": "100%" });
        let clamped = json!({ "width": "100%", "maxWidth": "320px" });
        let min_only = json!({ "minWidth": "220px" });

        assert_eq!(app.resolve_widget_width_from_style(fill.as_object(), 480.0), Some(480.0));
        assert_eq!(app.resolve_widget_width_from_style(clamped.as_object(), 480.0), Some(320.0));
        assert_eq!(app.resolve_widget_width_from_style(min_only.as_object(), 480.0), Some(220.0));
    }

    #[test]
    fn parses_rem_sizes_and_gradient_backgrounds() {
        assert_eq!(DesktopNativeApp::parse_css_number(Some(&Value::String(String::from("1.5rem")))), Some(24.0));

        let style = json!({
            "background": "linear-gradient(135deg, #d56e43 0%, #b75a36 100%)",
        });

        assert_eq!(
            DesktopNativeApp::resolve_background_color_from_style(style.as_object()),
            Some(Color32::from_rgb(0xd5, 0x6e, 0x43)),
        );
    }

    #[test]
    fn parses_viewport_units_with_context() {
        let context = CssMeasureContext {
            basis: Some(400.0),
            viewport_width: Some(1200.0),
            viewport_height: Some(800.0),
        };

        assert_eq!(DesktopNativeApp::parse_css_measure_text_with_context("5vw", context), Some(60.0));
        assert_eq!(DesktopNativeApp::parse_css_measure_text_with_context("100vh", context), Some(800.0));
        assert_eq!(DesktopNativeApp::parse_css_measure_text_with_context("10vmin", context), Some(80.0));
        assert_eq!(DesktopNativeApp::parse_css_measure_text_with_context("10vmax", context), Some(120.0));
    }

    #[test]
    fn parses_linear_gradient_specs() {
        let gradient = DesktopNativeApp::parse_linear_gradient("linear-gradient(135deg, #d56e43 0%, #b75a36 100%)").unwrap();

        assert_eq!(gradient.angle_deg, 135.0);
        assert_eq!(gradient.stops.len(), 2);
        assert_eq!(gradient.stops[0], DesktopGradientStop {
            position: 0.0,
            color: Color32::from_rgb(0xd5, 0x6e, 0x43),
        });
        assert_eq!(gradient.stops[1], DesktopGradientStop {
            position: 1.0,
            color: Color32::from_rgb(0xb7, 0x5a, 0x36),
        });
    }

    #[test]
    fn resolves_backdrop_blur_radius_and_lifts_translucent_fill_alpha() {
        let style = json!({
            "background": "rgba(255, 252, 247, 0.82)",
            "backdropFilter": "blur(18px)",
        });

        let original = DesktopNativeApp::resolve_background_color_from_style(style.as_object()).unwrap();
        let lifted = DesktopNativeApp::resolve_frosted_background_color_from_style(style.as_object()).unwrap();

        assert_eq!(DesktopNativeApp::resolve_backdrop_blur_radius_from_style(style.as_object()), Some(18.0));
        assert!(lifted.a() > original.a());
        assert_eq!(lifted.a(), 238);
    }

    #[test]
    fn resolves_row_flex_widths_from_fixed_and_grow_children() {
        let children = vec![
            NativeNode::Element(element(
                "View",
                "div",
                json!({
                    "style": {
                        "width": "84px",
                        "height": "84px",
                        "flexShrink": 0,
                    }
                }),
                &[],
                vec![],
            )),
            NativeNode::Element(element(
                "View",
                "div",
                json!({
                    "style": {
                        "display": "grid",
                        "gap": "12px",
                        "flex": 1,
                    }
                }),
                &[],
                vec![],
            )),
        ];

        let widths = DesktopNativeApp::resolve_row_flex_widths(&children, 960.0, 20.0).unwrap();
        assert_eq!(widths[0], Some(84.0));
        assert_eq!(widths[1], Some(856.0));
    }

    #[test]
    fn forces_centered_layout_for_single_child_centered_flex_container() {
        let style = json!({
            "display": "flex",
            "alignItems": "center",
            "justifyContent": "center",
            "width": "84px",
            "height": "84px",
        });

        assert!(DesktopNativeApp::should_force_centered_single_child_layout(style.as_object(), 1));
        assert!(!DesktopNativeApp::should_force_centered_single_child_layout(style.as_object(), 2));

        let wrapped_style = json!({
            "display": "flex",
            "alignItems": "center",
            "justifyContent": "center",
            "flexWrap": "wrap",
        });
        assert!(!DesktopNativeApp::should_force_centered_single_child_layout(wrapped_style.as_object(), 1));
    }

    #[test]
    fn applies_text_transform_values() {
        assert_eq!(DesktopNativeApp::apply_text_transform("native desktop", Some("uppercase")), "NATIVE DESKTOP");
        assert_eq!(DesktopNativeApp::apply_text_transform("NATIVE DESKTOP", Some("lowercase")), "native desktop");
        assert_eq!(DesktopNativeApp::apply_text_transform("native desktop runtime", Some("capitalize")), "Native Desktop Runtime");
    }

    #[test]
    fn resolves_font_face_variants_from_requested_style() {
        let faces = DesktopFontFaces {
            regular: Some(Arc::from("regular")),
            bold: Some(Arc::from("bold")),
            italic: Some(Arc::from("italic")),
            bold_italic: Some(Arc::from("bold-italic")),
        };

        let (family, bold_from_font, italic_from_font) = faces.resolve_font_family(true, true).unwrap();
        match family {
            egui::FontFamily::Name(name) => assert_eq!(&*name, "bold-italic"),
            _ => panic!("expected named font family"),
        }
        assert!(bold_from_font);
        assert!(italic_from_font);

        let (family, bold_from_font, italic_from_font) = faces.resolve_font_family(true, false).unwrap();
        match family {
            egui::FontFamily::Name(name) => assert_eq!(&*name, "bold"),
            _ => panic!("expected named font family"),
        }
        assert!(bold_from_font);
        assert!(!italic_from_font);
    }

    #[test]
    fn applies_family_specific_font_tweaks() {
        let serif = DesktopNativeApp::font_tweak_for_family("Georgia");
        assert!((serif.scale - 0.965).abs() < 0.0001);
        assert!((serif.y_offset_factor - -0.03).abs() < 0.0001);

        let sans = DesktopNativeApp::font_tweak_for_family("Avenir Next");
        assert!((sans.scale - 0.985).abs() < 0.0001);
        assert!((sans.y_offset_factor - -0.015).abs() < 0.0001);

        assert_eq!(DesktopNativeApp::font_tweak_for_family("Courier New").scale, 1.0);
    }

    #[test]
    fn enables_text_pixel_snapping_for_native_context() {
        let ctx = egui::Context::default();
        assert!(ctx.tessellation_options(|options| options.round_text_to_pixels));

        configure_native_context_rendering(&ctx);

        assert!(ctx.tessellation_options(|options| options.round_text_to_pixels));
    }

    #[test]
    fn resolves_text_line_height_and_letter_spacing_with_css_semantics() {
        let context = CssMeasureContext {
            basis: Some(28.0),
            viewport_width: Some(1200.0),
            viewport_height: Some(800.0),
        };
        let style = json!({
            "lineHeight": 1.7,
            "letterSpacing": "0.08em",
        });

        let line_height = DesktopNativeApp::resolve_text_line_height(style.as_object(), 28.0, context).unwrap();
        let letter_spacing = DesktopNativeApp::resolve_text_letter_spacing(style.as_object(), 28.0, context).unwrap();
        assert!((line_height - 47.6).abs() < 0.001);
        assert!((letter_spacing - 2.24).abs() < 0.001);
        assert_eq!(
            DesktopNativeApp::parse_text_metric_text_with_context("clamp(1.2em, 2vw, 2rem)", 20.0, context, true),
            Some(24.0),
        );
    }

    #[test]
    fn detects_inline_display_modes() {
        let inline_block = json!({ "display": "inline-block" });
        let inline_flex = json!({ "display": "inline-flex" });
        let block = json!({ "display": "block" });

        assert!(DesktopNativeApp::is_inline_display_from_style(inline_block.as_object()));
        assert!(DesktopNativeApp::is_inline_display_from_style(inline_flex.as_object()));
        assert!(!DesktopNativeApp::is_inline_display_from_style(block.as_object()));
        assert!(!DesktopNativeApp::is_inline_display_from_style(None));
    }

    #[test]
    fn detects_boxed_text_surface_styles() {
        let surface_id = json!({
            "display": "inline-block",
            "padding": "6px 10px",
            "borderRadius": "999px",
            "background": "rgba(213, 110, 67, 0.12)",
        });
        let plain_copy = json!({
            "lineHeight": 1.7,
            "letterSpacing": "0.02em",
        });

        assert!(DesktopNativeApp::style_has_widget_frame(surface_id.as_object()));
        assert!(!DesktopNativeApp::style_has_widget_frame(plain_copy.as_object()));
    }

    #[test]
    fn parses_rgba_border_shorthand_colors() {
        let style = json!({
            "border": "1px solid rgba(38, 25, 20, 0.12)",
        });

        let stroke = DesktopNativeApp::resolve_border_stroke_from_style(style.as_object()).unwrap();
        let expected = DesktopNativeApp::parse_css_color_text("rgba(38, 25, 20, 0.12)").unwrap();
        assert!((stroke.width - 1.0).abs() < 0.001);
        assert_eq!(stroke.color, expected);
    }

    #[test]
    fn treats_border_none_as_disabled_border() {
        let style = json!({
            "border": "none",
        });

        assert!(DesktopNativeApp::style_disables_border(style.as_object()));
        assert!(DesktopNativeApp::resolve_border_stroke_from_style(style.as_object()).is_none());
    }

    #[test]
    fn softens_css_box_shadows_for_egui_rendering() {
        let shadow = DesktopNativeApp::resolve_box_shadow_from_style(
            json!({
                "boxShadow": "0 24px 80px rgba(102, 61, 35, 0.12)",
            })
            .as_object(),
        )
        .unwrap();

        assert_eq!(shadow.offset, [0, 11]);
        assert_eq!(shadow.blur, 36);
        assert_eq!(shadow.spread, 6);
        assert!(shadow.color.a() > 0);
    }

    #[test]
    fn hides_list_markers_for_list_style_none() {
        let list_style = json!({
            "listStyle": "none outside",
        });
        let list_style_type = json!({
            "listStyleType": "none",
        });
        let disc_style = json!({
            "listStyle": "disc",
        });

        assert!(!DesktopNativeApp::list_markers_visible_from_style(list_style.as_object()));
        assert!(!DesktopNativeApp::list_markers_visible_from_style(list_style_type.as_object()));
        assert!(DesktopNativeApp::list_markers_visible_from_style(disc_style.as_object()));
        assert!(DesktopNativeApp::list_markers_visible_from_style(None));
    }

    #[test]
    fn resolves_auto_fit_grid_tracks_from_available_width() {
        let style = json!({
            "display": "grid",
            "gridTemplateColumns": "repeat(auto-fit, minmax(220px, 1fr))",
        });
        let layout = DesktopNativeApp::resolve_grid_layout(style.as_object(), 540.0, 3, 16.0).unwrap();

        assert_eq!(layout.column_widths.len(), 2);
        assert!((layout.column_widths[0] - 262.0).abs() < 0.01);
        assert!((layout.column_widths[1] - 262.0).abs() < 0.01);
    }

    #[test]
    fn resolves_fractional_grid_tracks_into_weighted_columns() {
        let style = json!({
            "display": "grid",
            "gridTemplateColumns": "1.2fr 0.8fr",
        });
        let layout = DesktopNativeApp::resolve_grid_layout(style.as_object(), 1000.0, 2, 20.0).unwrap();

        assert_eq!(layout.column_widths.len(), 2);
        assert!((layout.column_widths[0] - 588.0).abs() < 0.01);
        assert!((layout.column_widths[1] - 392.0).abs() < 0.01);
    }

    #[test]
    fn builds_control_event_payload_with_detail() {
        let node = element(
            "TextInput",
            "input",
            json!({ "nativePayload": "{\"source\":\"search\"}", "type": "text" }),
            &["input", "change"],
            vec![],
        );

        let payload = build_event_payload(
            &node,
            "change",
            Some(String::from("text")),
            &DesktopControlEventData {
                value: Some(String::from("abc")),
                ..Default::default()
            },
        );

        assert_eq!(payload["event"], Value::String(String::from("change")));
        assert_eq!(payload["sourceTag"], Value::String(String::from("input")));
        assert_eq!(payload["inputType"], Value::String(String::from("text")));
        assert_eq!(payload["value"], Value::String(String::from("abc")));
        assert_eq!(payload["detail"], json!({ "source": "search" }));
    }

    #[test]
    fn resolves_interaction_from_action_route_and_payload() {
        let node = element(
            "Button",
            "button",
            json!({ "nativeAction": "custom.action", "nativeRoute": "/docs", "nativePayload": "{\"id\":1}" }),
            &["press"],
            vec![],
        );

        let interaction = resolve_interaction(&node, None, None).unwrap();
        assert_eq!(interaction.action.as_deref(), Some("custom.action"));
        assert_eq!(interaction.route.as_deref(), Some("/docs"));
        assert_eq!(interaction.payload, Some(json!({ "id": 1 })));
    }

    #[test]
    fn writes_interaction_output_as_json_lines() {
        let base_dir = std::env::temp_dir().join("elit-desktop-native-interactions");
        let file_path = base_dir.join("events").join("interaction.jsonl");
        let interaction = DesktopInteraction {
            action: Some(String::from("validation.record")),
            route: Some(String::from("/docs")),
            payload: Some(json!({ "id": 1 })),
        };

        let json_line = serde_json::to_string(&interaction).unwrap();
        write_interaction_output(Some(&file_path), &json_line).unwrap();

        let content = std::fs::read_to_string(&file_path).unwrap();
        assert!(content.contains("validation.record"));
        assert!(content.contains("\"route\":\"/docs\""));

        let _ = std::fs::remove_file(&file_path);
        let _ = std::fs::remove_dir_all(base_dir);
    }

    #[test]
    fn picker_options_collect_labels_and_selection() {
        let app = empty_app();
        let node = element(
            "Picker",
            "select",
            json!({ "value": "b" }),
            &["change"],
            vec![
                NativeNode::Element(element(
                    "Option",
                    "option",
                    json!({ "value": "a" }),
                    &[],
                    vec![NativeNode::Text(NativeTextNode { value: String::from("A"), state_id: None })],
                )),
                NativeNode::Element(element(
                    "Option",
                    "option",
                    json!({ "value": "b", "selected": true }),
                    &[],
                    vec![NativeNode::Text(NativeTextNode { value: String::from("B"), state_id: None })],
                )),
            ],
        );

        let options = app.collect_picker_options(&node);
        assert_eq!(options.len(), 2);
        assert_eq!(options[0].label, "A");
        assert_eq!(options[1].value, "b");
        assert!(options[1].selected);
    }

    #[test]
    fn navigation_state_tracks_history_and_base_route() {
        let mut navigation = DesktopNavigationState::default();

        assert!(navigation.navigate_to("/docs"));
        assert_eq!(navigation.current_route(), Some("/docs"));
        assert!(navigation.can_go_back());

        assert!(navigation.navigate_to("/docs/native"));
        assert_eq!(navigation.current_route(), Some("/docs/native"));

        assert!(navigation.go_back());
        assert_eq!(navigation.current_route(), Some("/docs"));

        assert!(navigation.go_back());
        assert_eq!(navigation.current_route(), None);
        assert!(navigation.can_go_forward());

        assert!(navigation.go_forward());
        assert_eq!(navigation.current_route(), Some("/docs"));

        navigation.clear();
        assert_eq!(navigation.current_route(), None);
    }

    #[test]
    fn resolves_surface_source_from_multiple_prop_keys() {
        let src_node = element("Image", "img", json!({ "src": "./poster.png" }), &[], vec![]);
        let destination_node = element("WebView", "iframe", json!({ "destination": "https://example.com" }), &[], vec![]);

        assert_eq!(resolve_surface_source(&src_node).as_deref(), Some("./poster.png"));
        assert_eq!(resolve_surface_source(&destination_node).as_deref(), Some("https://example.com"));
    }

    #[test]
    fn resolves_overflow_scroll_and_clip_axes() {
        let style = json!({
            "overflowX": "auto",
            "overflowY": "hidden",
        });
        let behavior = DesktopNativeApp::resolve_overflow_behavior(style.as_object());
        assert!(behavior.horizontal_scroll);
        assert!(!behavior.vertical_scroll);
        assert!(!behavior.horizontal_clip);
        assert!(behavior.vertical_clip);

        let style = json!({ "overflow": "scroll" });
        let behavior = DesktopNativeApp::resolve_overflow_behavior(style.as_object());
        assert!(behavior.horizontal_scroll);
        assert!(behavior.vertical_scroll);
    }

    #[test]
    fn orders_children_by_css_order_then_z_index() {
        let children = vec![
            NativeNode::Element(element(
                "View",
                "div",
                json!({ "style": { "order": 2, "zIndex": 1 } }),
                &[],
                vec![],
            )),
            NativeNode::Element(element(
                "View",
                "div",
                json!({ "style": { "order": -1, "zIndex": 5 } }),
                &[],
                vec![],
            )),
            NativeNode::Element(element(
                "View",
                "div",
                json!({ "style": { "order": 2, "zIndex": 3 } }),
                &[],
                vec![],
            )),
        ];
        let parent_style = json!({ "display": "flex" });

        let ordered = DesktopNativeApp::ordered_children(&children, parent_style.as_object())
            .into_iter()
            .map(|(index, _)| index)
            .collect::<Vec<_>>();
        assert_eq!(ordered, vec![1, 0, 2]);
    }

    #[test]
    fn resolves_position_offsets_for_positioned_elements() {
        let app = empty_app();
        let style = json!({
            "position": "absolute",
            "left": "14px",
            "bottom": "9px",
        });

        assert_eq!(app.resolve_position_offset_from_style(style.as_object()), Some((14.0, -9.0)));
    }

    #[test]
    fn builds_media_surface_html_with_escaped_attributes() {
        let html = DesktopNativeApp::build_media_surface_html(
            DesktopSurfaceWindowKind::Video,
            "Video <Preview>",
            "https://example.com/video.mp4?mode=full&lang=en",
            Some("https://example.com/poster.png?variant=hero&lang=en"),
            true,
            false,
            true,
            true,
            true,
        );

        assert!(html.contains("Video &lt;Preview&gt;"));
        assert!(html.contains("video.mp4?mode=full&amp;lang=en"));
        assert!(html.contains("poster.png?variant=hero&amp;lang=en"));
        assert!(html.contains(" playsinline"));
        assert!(html.contains(" controls"));
    }

    #[test]
    fn detects_focusable_tab_index_on_generic_containers() {
        let app = empty_app();
        let node = element("View", "div", json!({ "tabIndex": 0 }), &[], vec![]);
        let negative = element("View", "div", json!({ "tabIndex": -1 }), &[], vec![]);

        assert!(app.has_focusable_tab_index(&node));
        assert!(!app.has_focusable_tab_index(&negative));
    }

    #[test]
    fn resolves_embedded_web_view_content_for_inline_html_and_urls() {
        let app = empty_app();

        assert_eq!(
            app.resolve_embedded_web_view_content("<html><body>hello</body></html>"),
            Some(DesktopEmbeddedSurfaceContent::Html(String::from("<html><body>hello</body></html>")))
        );
        assert_eq!(
            app.resolve_embedded_web_view_content("https://example.com/docs"),
            Some(DesktopEmbeddedSurfaceContent::Url(String::from("https://example.com/docs")))
        );
    }

    #[test]
    fn resolves_embedded_surface_size_from_percentage_width() {
        let app = empty_app();
        let node = element(
            "WebView",
            "iframe",
            json!({
                "style": {
                    "width": "100%",
                    "maxHeight": "360px"
                }
            }),
            &[],
            vec![],
        );

        let size = app.resolve_embedded_surface_size(&node, 480.0, Vec2::new(720.0, 420.0));
        assert!((size.x - 480.0).abs() < 0.01);
        assert!(size.y <= 360.0);
    }

    #[test]
    fn resolves_embedded_surface_visibility_for_clip_stacks() {
        let clip_rect = Rect::from_min_size(Pos2::new(0.0, 0.0), Vec2::new(120.0, 80.0));
        let visible = Rect::from_min_size(Pos2::new(8.0, 8.0), Vec2::new(60.0, 32.0));
        let clipped = Rect::from_min_size(Pos2::new(90.0, 8.0), Vec2::new(48.0, 32.0));
        let hidden = Rect::from_min_size(Pos2::new(140.0, 8.0), Vec2::new(40.0, 32.0));

        assert_eq!(
            DesktopNativeApp::resolve_embedded_surface_visibility(visible, clip_rect),
            DesktopEmbeddedSurfaceVisibility::Visible,
        );
        assert_eq!(
            DesktopNativeApp::resolve_embedded_surface_visibility(clipped, clip_rect),
            DesktopEmbeddedSurfaceVisibility::Clipped,
        );
        assert_eq!(
            DesktopNativeApp::resolve_embedded_surface_visibility(hidden, clip_rect),
            DesktopEmbeddedSurfaceVisibility::Hidden,
        );
    }

    #[test]
    fn clipped_embedded_surface_slots_skip_inline_queueing() {
        let mut app = empty_app();
        let node = element(
            "WebView",
            "iframe",
            json!({
                "style": {
                    "width": "220px",
                    "height": "120px"
                }
            }),
            &[],
            vec![],
        );
        let content = DesktopEmbeddedSurfaceContent::Url(String::from("https://example.com/docs"));
        let ctx = egui::Context::default();

        let _ = ctx.run(Default::default(), |ctx| {
            egui::CentralPanel::default().show(ctx, |ui| {
                ui.set_clip_rect(Rect::from_min_size(ui.min_rect().min, Vec2::new(120.0, 120.0)));
                app.render_embedded_surface_slot(
                    ui,
                    &node,
                    "root/0",
                    "Docs Preview",
                    DesktopSurfaceWindowKind::WebView,
                    content.clone(),
                    Vec2::new(220.0, 120.0),
                );
            });
        });
        assert!(app.embedded_surface_requests.is_empty());

        let _ = ctx.run(Default::default(), |ctx| {
            egui::CentralPanel::default().show(ctx, |ui| {
                ui.set_clip_rect(Rect::from_min_size(ui.min_rect().min, Vec2::new(480.0, 240.0)));
                app.render_embedded_surface_slot(
                    ui,
                    &node,
                    "root/0",
                    "Docs Preview",
                    DesktopSurfaceWindowKind::WebView,
                    content.clone(),
                    Vec2::new(220.0, 120.0),
                );
            });
        });
        assert!(app.embedded_surface_requests.contains_key("root/0"));
    }

    #[test]
    fn container_runtime_visual_state_support_detects_variants_and_tab_index() {
        let app = empty_app();
        let hover_variant = element(
            "View",
            "div",
            json!({
                "desktopStyleVariants": {
                    "hover": {
                        "background": "#222222"
                    }
                }
            }),
            &[],
            vec![],
        );
        let focusable = element("View", "div", json!({ "tabIndex": 0 }), &[], vec![]);
        let plain = element("View", "div", json!({}), &[], vec![]);

        assert!(app.container_supports_runtime_visual_state(&hover_variant));
        assert!(app.container_supports_runtime_visual_state(&focusable));
        assert!(!app.container_supports_runtime_visual_state(&plain));
    }

    #[test]
    fn resolves_container_runtime_style_variants_and_precedence() {
        let app = empty_app();
        let node = element(
            "View",
            "div",
            json!({
                "style": {
                    "background": "#111111",
                    "borderColor": "#101010"
                },
                "desktopStyleVariants": {
                    "hover": {
                        "background": "#222222"
                    },
                    "active": {
                        "borderColor": "#333333"
                    },
                    "focusWithin": {
                        "background": "#444444"
                    },
                    "focus": {
                        "borderColor": "#666666"
                    },
                    "disabled": {
                        "background": "#555555"
                    }
                }
            }),
            &[],
            vec![],
        );
        let state_styles = app.resolve_widget_state_styles(&node, app.base_pseudo_state(&node));

        assert_eq!(
            state_styles.inactive.as_ref().and_then(|style| style.get("background")),
            Some(&Value::String(String::from("#111111"))),
        );
        assert_eq!(
            state_styles.hovered.as_ref().and_then(|style| style.get("background")),
            Some(&Value::String(String::from("#222222"))),
        );
        assert_eq!(
            state_styles.active.as_ref().and_then(|style| style.get("background")),
            Some(&Value::String(String::from("#222222"))),
        );
        assert_eq!(
            state_styles.active.as_ref().and_then(|style| style.get("borderColor")),
            Some(&Value::String(String::from("#333333"))),
        );
        assert_eq!(
            state_styles.focus.as_ref().and_then(|style| style.get("background")),
            Some(&Value::String(String::from("#444444"))),
        );
        assert_eq!(
            state_styles.focus.as_ref().and_then(|style| style.get("borderColor")),
            Some(&Value::String(String::from("#666666"))),
        );
        assert_eq!(
            state_styles.disabled.as_ref().and_then(|style| style.get("background")),
            Some(&Value::String(String::from("#555555"))),
        );

        assert_eq!(
            DesktopNativeApp::resolve_container_state_style_from_flags(&state_styles, false, true, false, true)
                .and_then(|style| style.get("background")),
            Some(&Value::String(String::from("#222222"))),
        );
        assert_eq!(
            DesktopNativeApp::resolve_container_state_style_from_flags(&state_styles, false, true, true, true)
                .and_then(|style| style.get("borderColor")),
            Some(&Value::String(String::from("#333333"))),
        );
        assert_eq!(
            DesktopNativeApp::resolve_container_state_style_from_flags(&state_styles, false, false, false, true)
                .and_then(|style| style.get("borderColor")),
            Some(&Value::String(String::from("#666666"))),
        );
        assert_eq!(
            DesktopNativeApp::resolve_container_state_style_from_flags(&state_styles, true, true, true, true)
                .and_then(|style| style.get("background")),
            Some(&Value::String(String::from("#555555"))),
        );
    }
}
