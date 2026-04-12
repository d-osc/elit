use std::path::{Path, PathBuf};

use eframe::egui::{self, Vec2};
use serde_json::{Map, Value};

use super::utilities::{
    is_probably_inline_html, load_color_image, resolve_resource_path, strip_markup_tags,
    truncate_preview,
};
use super::{
    DesktopInteraction, DesktopNativeApp, NativeDesktopCanvasSpec, NativeDesktopVectorSpec,
    NativeElementNode,
};

impl DesktopNativeApp {
    fn resource_base_dir(&self) -> Option<&Path> {
        self.resource_base_dir.as_deref()
    }

    pub(super) fn resolve_resource_path(&self, source: &str) -> Option<PathBuf> {
        resolve_resource_path(self.resource_base_dir(), source)
    }

    pub(super) fn read_source_preview(&self, source: &str) -> Option<String> {
        if is_probably_inline_html(source) {
            return Some(truncate_preview(&strip_markup_tags(source), 360));
        }

        let path = self.resolve_resource_path(source)?;
        let content = std::fs::read_to_string(path).ok()?;
        Some(truncate_preview(&strip_markup_tags(&content), 360))
    }

    pub(super) fn get_vector_spec(&self, node: &NativeElementNode) -> Option<NativeDesktopVectorSpec> {
        serde_json::from_value(node.props.get("desktopVectorSpec")?.clone()).ok()
    }

    pub(super) fn get_canvas_spec(&self, node: &NativeElementNode) -> Option<NativeDesktopCanvasSpec> {
        serde_json::from_value(node.props.get("desktopCanvasSpec")?.clone()).ok()
    }

    fn resolved_window_title(&self) -> String {
        self.navigation
            .current_route()
            .map(|route| format!("{} - {}", self.base_title, route))
            .unwrap_or_else(|| self.base_title.clone())
    }

    pub(super) fn apply_navigation_title(&self, ctx: &egui::Context) {
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

    pub(super) fn emit_ready_interaction(&mut self) {
        if self.ready_emitted || !self.interaction_output.emit_ready {
            return;
        }

        self.ready_emitted = true;
        self.record_interaction(self.build_ready_interaction());
    }

    pub(super) fn ensure_texture_for_source(
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

    pub(super) fn resolve_display_size(&self, node: &NativeElementNode, fallback: Vec2) -> Vec2 {
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
}