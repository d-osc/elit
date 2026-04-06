use eframe::egui::{self, Align, Color32, CornerRadius, Direction, Layout, Pos2, Rect, StrokeKind, Vec2};
use serde_json::{Map, Value};

use super::css_models::DesktopBoxEdges;
use super::utilities::resolve_interaction;
use super::{DesktopNativeApp, NativeElementNode};

impl DesktopNativeApp {
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

        let is_flex_or_grid = Self::is_row_layout_from_style(style)
            || style.and_then(|style| style.get("display")).and_then(Value::as_str)
                .map(|display| display.contains("grid"))
                .unwrap_or(false);
        if !is_flex_or_grid {
            if let Some(column_count) = Self::resolve_column_count_from_style(style) {
                let col_gap = style.and_then(|style| {
                    style
                        .get("columnGap")
                        .or_else(|| style.get("column-gap"))
                        .and_then(|value| Self::parse_css_number(Some(value)))
                }).unwrap_or(gap);
                let total_gap = col_gap * (column_count.saturating_sub(1) as f32);
                let col_width = ((available_width - total_gap) / column_count as f32).max(1.0);
                let col_widths = vec![col_width; column_count];
                for (row_index, row_children) in ordered_children.chunks(column_count).enumerate() {
                    ui.horizontal_top(|ui| {
                        ui.spacing_mut().item_spacing.x = col_gap;
                        for (col_index, &width) in col_widths.iter().enumerate() {
                            if let Some((original_index, child)) = row_children.get(col_index).copied() {
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
                                ui.allocate_space(Vec2::new(width, 0.0));
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

    pub(super) fn render_children(&mut self, ui: &mut egui::Ui, ctx: &egui::Context, node: &NativeElementNode, path: &str) {
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
        let linear_gradient = Self::resolve_background_gradient_from_style(style).map(|gradient| Self::gradient_with_opacity(gradient, opacity));
        let radial_gradient = if linear_gradient.is_none() {
            Self::resolve_background_radial_gradient_from_style(style).map(|gradient| Self::radial_gradient_with_opacity(gradient, opacity))
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
            if let Some(ref filter) = css_filter { filter.apply(raw_fill) } else { raw_fill }
        };
        let raw_stroke = Self::resolve_border_stroke_from_style(style).unwrap_or(egui::Stroke::NONE);
        let stroke = if let Some(ref filter) = css_filter {
            egui::Stroke::new(raw_stroke.width, filter.apply(raw_stroke.color))
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
            || effective_margin.filter(|margin| !margin.is_zero()).is_some()
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
            if let Some(margin) = effective_margin.filter(|margin| !margin.is_zero()) {
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

            let widget_rect = if let Some(margin) = effective_margin.filter(|margin| !margin.is_zero()) {
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

    pub(super) fn render_container(&mut self, ui: &mut egui::Ui, ctx: &egui::Context, node: &NativeElementNode, path: &str) {
        let style = self.resolve_style_map_with_state(node, self.base_pseudo_state(node));

        if Self::has_auto_horizontal_margin(style.as_ref()) {
            ui.vertical_centered(|ui| {
                self.render_container_contents(ui, ctx, node, path, style.as_ref());
            });
            return;
        }

        self.render_container_contents(ui, ctx, node, path, style.as_ref());
    }
}