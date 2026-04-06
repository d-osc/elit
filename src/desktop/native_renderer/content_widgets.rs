use eframe::egui::{self, Align, Align2, Color32, CornerRadius, Direction, Layout, Pos2, Rect, RichText, Sense, StrokeKind, Vec2};
use serde_json::{Map, Value};

use super::app_models::DesktopSurfaceWindowKind;
use super::utilities::{is_external_destination, is_probably_inline_html, parse_native_bool, parse_view_box, resolve_surface_source};
use super::{DesktopNativeApp, NativeElementNode, NativeNode};

impl DesktopNativeApp {
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
            let object_fit = style.and_then(|style| style.get("objectFit")).and_then(Value::as_str).unwrap_or("fill");
            let render_size = Self::resolve_object_fit_image_size(object_fit, desired_size, natural_size);
            let image = egui::Image::from_texture(&texture).fit_to_exact_size(render_size);
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

    pub(super) fn render_text_element(&mut self, ui: &mut egui::Ui, node: &NativeElementNode) {
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
        let linear_gradient = Self::resolve_background_gradient_from_style(style.as_ref()).map(|gradient| Self::gradient_with_opacity(gradient, opacity));
        let radial_gradient = if linear_gradient.is_none() {
            Self::resolve_background_radial_gradient_from_style(style.as_ref()).map(|gradient| Self::radial_gradient_with_opacity(gradient, opacity))
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
            if let Some(ref filter) = css_filter { filter.apply(raw_fill) } else { raw_fill }
        };
        let raw_stroke = Self::resolve_border_stroke_from_style(style.as_ref()).unwrap_or(egui::Stroke::NONE);
        let stroke = if let Some(ref filter) = css_filter {
            egui::Stroke::new(raw_stroke.width, filter.apply(raw_stroke.color))
        } else {
            raw_stroke
        };
        let corner_radius = Self::resolve_corner_radius_from_style(style.as_ref());
        let shadow = Self::resolve_box_shadow_from_style(style.as_ref())
            .or_else(|| backdrop_blur.filter(|_| corner_radius.is_some()).map(Self::synthesize_shadow_from_backdrop_blur));
        let outline_stroke = Self::resolve_outline_from_style(style.as_ref());
        let overflow_hidden = Self::resolve_overflow_hidden_from_style(style.as_ref());
        let cursor_icon = Self::resolve_cursor_from_style(style.as_ref());
        let text_shadow = Self::resolve_text_shadow_from_style(style.as_ref());
        let do_wrap = Self::resolve_white_space_wraps(style.as_ref());
        let do_truncate = Self::resolve_text_overflow_ellipsis(style.as_ref());

        let resolved_font_size = style.as_ref()
            .and_then(|style| self.parse_css_number_with_viewport(style.get("fontSize")))
            .unwrap_or(14.0);
        let measure_ctx = self.css_measure_context(Some(resolved_font_size));
        let text_indent = Self::resolve_text_indent_from_style(style.as_ref(), resolved_font_size, measure_ctx);
        let display_text = if let Some(indent) = text_indent {
            let space_count = ((indent / (resolved_font_size * 0.55)).round() as usize).min(20);
            format!("{}{}", " ".repeat(space_count), text)
        } else {
            text
        };

        let mut rich_text = self.resolve_text_style_from_style(ui, style.as_ref(), display_text.clone(), true);
        if let Some(ref filter) = css_filter {
            if let Some(color) = Self::resolve_text_color_from_style(style.as_ref()) {
                rich_text = rich_text.color(filter.apply(color));
            }
        }

        let has_frame = Self::style_has_widget_frame(style.as_ref())
            || shadow.is_some()
            || has_gradient
            || opacity < 1.0
            || margin.is_some()
            || outline_stroke.is_some();

        if has_frame {
            let gradient_shape_idx = has_gradient.then(|| ui.painter().add(egui::Shape::Noop));
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

                if let Some(ref shadow) = text_shadow {
                    let shadow_rich = self.resolve_text_style_from_style(ui, style.as_ref(), display_text.clone(), false)
                        .color(shadow.color);
                    let shadow_response = ui.label(shadow_rich);
                    let text_rect = shadow_response.rect;
                    ui.painter().text(
                        Pos2::new(text_rect.min.x + shadow.offset_x, text_rect.min.y + shadow.offset_y),
                        Align2::LEFT_TOP,
                        &display_text,
                        egui::FontId::proportional(resolved_font_size),
                        shadow.color,
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
                let gradient_shape = if let Some(gradient) = linear_gradient.as_ref() {
                    Some(Self::gradient_shape_for_rect(widget_rect, corner_radius.unwrap_or(CornerRadius::ZERO), gradient))
                } else if let Some(gradient) = radial_gradient.as_ref() {
                    Some(Self::radial_gradient_shape_for_rect(widget_rect, corner_radius.unwrap_or(CornerRadius::ZERO), gradient))
                } else {
                    None
                };
                if let Some(shape) = gradient_shape {
                    ui.painter().set(shape_idx, shape);
                }
            }

            if let Some(outline) = outline_stroke {
                let expand = outline.width.max(1.0);
                let outline_rect = widget_rect.expand(expand);
                ui.painter().rect_stroke(outline_rect, corner_radius.unwrap_or(CornerRadius::ZERO), outline, StrokeKind::Outside);
            }

            if let Some(cursor) = cursor_icon {
                let response = ui.interact(widget_rect, ui.id().with("cursor_text"), egui::Sense::hover());
                if response.hovered() {
                    ui.ctx().set_cursor_icon(cursor);
                }
            }

            return;
        }

        if let Some(ref shadow) = text_shadow {
            let shadow_rich = self.resolve_text_style_from_style(ui, style.as_ref(), display_text.clone(), false)
                .color(shadow.color);
            let shadow_response = ui.label(shadow_rich);
            let text_rect = shadow_response.rect;
            ui.painter().text(
                Pos2::new(text_rect.min.x + shadow.offset_x, text_rect.min.y + shadow.offset_y),
                Align2::LEFT_TOP,
                &display_text,
                egui::FontId::proportional(resolved_font_size),
                shadow.color,
            );
        }

        let mut label = egui::Label::new(rich_text);
        if !do_wrap || do_truncate {
            label = label.truncate();
        } else {
            label = label.wrap();
        }
        let label_response = ui.add(label);

        if let Some(cursor) = cursor_icon {
            if label_response.hovered() {
                ui.ctx().set_cursor_icon(cursor);
            }
        }
    }

    pub(super) fn render_divider(&mut self, ui: &mut egui::Ui) {
        ui.separator();
    }

    pub(super) fn render_progress(&mut self, ui: &mut egui::Ui, node: &NativeElementNode) {
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

    pub(super) fn render_table(&mut self, ui: &mut egui::Ui, ctx: &egui::Context, node: &NativeElementNode, path: &str) {
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

    pub(super) fn render_row(&mut self, ui: &mut egui::Ui, ctx: &egui::Context, node: &NativeElementNode, path: &str) {
        ui.horizontal_wrapped(|ui| {
            for (index, child) in node.children.iter().enumerate() {
                self.render_node(ui, ctx, child, &format!("{path}-{index}"));
            }
        });
    }

    pub(super) fn render_cell(&mut self, ui: &mut egui::Ui, ctx: &egui::Context, node: &NativeElementNode, path: &str) {
        egui::Frame::group(ui.style()).show(ui, |ui| {
            self.render_children(ui, ctx, node, path);
        });
    }

    pub(super) fn render_image(&mut self, ui: &mut egui::Ui, ctx: &egui::Context, node: &NativeElementNode) {
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

    pub(super) fn render_web_view(&mut self, ui: &mut egui::Ui, node: &NativeElementNode, path: &str) {
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

    pub(super) fn render_media(&mut self, ui: &mut egui::Ui, ctx: &egui::Context, node: &NativeElementNode, path: &str) {
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

    pub(super) fn render_vector(&mut self, ui: &mut egui::Ui, node: &NativeElementNode) {
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

    pub(super) fn render_canvas(&mut self, ui: &mut egui::Ui, node: &NativeElementNode) {
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

    pub(super) fn render_math(&mut self, ui: &mut egui::Ui, node: &NativeElementNode) {
        let text = self.collect_text_content(&NativeNode::Element(node.clone()));
        egui::Frame::group(ui.style()).show(ui, |ui| {
            ui.label(RichText::new(if text.trim().is_empty() { String::from("Math") } else { text }).monospace().italics());
        });
    }

    pub(super) fn render_surface_placeholder(&mut self, ui: &mut egui::Ui, title: &str, message: &str) {
        egui::Frame::group(ui.style()).show(ui, |ui| {
            ui.label(title);
            ui.small(message);
        });
    }

    pub(super) fn list_markers_visible_from_style(style: Option<&Map<String, Value>>) -> bool {
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

    pub(super) fn render_list(&mut self, ui: &mut egui::Ui, ctx: &egui::Context, node: &NativeElementNode, path: &str) {
        let style = self.resolve_style_map_with_state(node, self.base_pseudo_state(node));
        self.list_marker_stack.push(Self::list_markers_visible_from_style(style.as_ref()));
        self.render_container(ui, ctx, node, path);
        self.list_marker_stack.pop();
    }

    pub(super) fn render_list_item(&mut self, ui: &mut egui::Ui, ctx: &egui::Context, node: &NativeElementNode, path: &str) {
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
}