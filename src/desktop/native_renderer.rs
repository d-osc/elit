use std::collections::{HashMap, HashSet};
use std::path::PathBuf;
use std::sync::Arc;

mod css_models;
mod action_widgets;
mod app_runtime;
mod container_rendering;
mod content_widgets;
mod app_models;
mod embedded_surfaces;
mod form_controls;
mod interaction_dispatch;
mod runtime_support;
mod utilities;
mod vector_drawing;

use eframe::egui::{self, Color32, RichText};
use egui::{Align, CornerRadius, Direction, Layout, Pos2, Rect, Vec2};
use serde::Deserialize;
use serde_json::{Map, Value};

use self::app_models::{
    DesktopEmbeddedSurfaceRequest, DesktopInteraction, DesktopNavigationState,
    ResolvedDesktopInteractionOutput,
};
#[cfg(test)]
use self::app_models::DesktopControlEventData;
#[cfg(test)]
use self::app_models::{DesktopEmbeddedSurfaceContent, DesktopEmbeddedSurfaceVisibility, DesktopSurfaceWindowKind};
#[cfg(target_os = "windows")]
use self::app_models::DesktopEmbeddedSurface;
use self::css_models::{
    CssMeasureContext, DesktopBoxEdges, DesktopCornerRadii, DesktopCssFilter, DesktopCssTransform,
    DesktopFontFaces, DesktopFontVariant, DesktopGradientStop, DesktopGridLayoutSpec,
    DesktopGridTrackSpec, DesktopLinearGradient, DesktopOverflowBehavior, DesktopPseudoState,
    DesktopRadialGradient, DesktopTextShadow, DesktopWidgetStateStyles, round_corner_value,
    round_margin_value,
};
use self::utilities::{
    configure_native_context_rendering, format_number,
    load_window_icon,
    parse_native_bool,
    resolve_interaction, resolve_output_path, value_as_string,
};
#[cfg(test)]
use self::utilities::build_event_payload;
#[cfg(test)]
use self::utilities::{normalize_jsonish_value, resolve_resource_path, resolve_surface_source, write_interaction_output};

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
