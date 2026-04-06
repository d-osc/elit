use std::collections::HashSet;
use std::path::Path;

use eframe::egui::{self, Align2, Color32, CornerRadius, Rect, StrokeKind, Vec2};
#[cfg(target_os = "windows")]
use wry::{
    Rect as WryRect,
    WebView,
    WebViewBuilder,
    dpi::{LogicalPosition as WryLogicalPosition, LogicalSize as WryLogicalSize},
};

use super::app_models::{
    DesktopEmbeddedSurfaceContent, DesktopEmbeddedSurfaceRequest,
    DesktopEmbeddedSurfaceVisibility, DesktopSurfaceWindowKind,
};
#[cfg(target_os = "windows")]
use super::app_models::DesktopEmbeddedSurface;
use super::utilities::{is_external_destination, is_probably_inline_html, spawn_native_surface_window};
use super::{DesktopNativeApp, NativeElementNode};

impl DesktopNativeApp {
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

    pub(super) fn build_media_surface_html(
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

    pub(super) fn open_native_surface_window(
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

    pub(super) fn supports_embedded_surfaces() -> bool {
        cfg!(target_os = "windows")
    }

    pub(super) fn resolve_embedded_surface_size(&self, node: &NativeElementNode, available_width: f32, fallback: Vec2) -> Vec2 {
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

    pub(super) fn resolve_embedded_web_view_content(&self, source: &str) -> Option<DesktopEmbeddedSurfaceContent> {
        if is_probably_inline_html(source) {
            return Some(DesktopEmbeddedSurfaceContent::Html(source.to_string()));
        }

        self.resolve_surface_window_url(source)
            .map(DesktopEmbeddedSurfaceContent::Url)
    }

    pub(super) fn resolve_embedded_media_content(
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

    pub(super) fn resolve_embedded_surface_visibility(rect: Rect, clip_rect: Rect) -> DesktopEmbeddedSurfaceVisibility {
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

    pub(super) fn render_embedded_surface_slot(
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
    pub(super) fn reconcile_embedded_surfaces(&mut self, frame: &eframe::Frame) {
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
    pub(super) fn reconcile_embedded_surfaces(&mut self, _frame: &eframe::Frame) {
        self.embedded_surface_requests.clear();
    }
}