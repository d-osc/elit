use eframe::egui::{self, Vec2};
use serde_json::Value;

use super::utilities::{is_external_destination, resolve_interaction};
use super::{DesktopNativeApp, NativeElementNode, NativeNode};

impl DesktopNativeApp {
    pub(super) fn render_button(&mut self, ui: &mut egui::Ui, ctx: &egui::Context, node: &NativeElementNode) {
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

    pub(super) fn render_link(&mut self, ui: &mut egui::Ui, ctx: &egui::Context, node: &NativeElementNode) {
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
}